/**
 * Build a tile mesh (positions, indices, palette groups, skirt) from a DEM tile.
 * Pure math — safe to run inside a Worker.
 */

import { applyFlattenPad, FlattenPadSpec } from './flattenPad';
import { buildCoastDistanceGrid, demTileIsCoastal } from './coast';
import {
    Ecef, Enu, EnuBasis, geodeticToEcef, ecefToEnu,
} from './geodesy';
import { buildErrorPyramid, extractMesh, getRtinIndex, RtinIndex } from './rtin';
import { TileKey, approxTileEdgeMetres, tileBounds } from './tiling';

/** Palette categories encoded as small integers for the worker→main hop. */
export const enum TerrainTone {
    Water = 0,
    ShallowWater = 1,
    Sand = 2,
    Grass = 3,
    Bare = 4,
}

export const TONE_COUNT = 5;

/** Heights at or below seaLevel+eps are treated as open water (matches bake). */
export const WATER_HEIGHT_EPS_M = 0.5;

/**
 * Drop open-water verts this far in ENU Y so beach/land always wins the depth
 * test along the shoreline (avoids 1px sky sparkles from coplanar z-fight).
 */
export const WATER_DEPTH_BIAS_M = 0.5;

/**
 * Open water within this distance (m) of the shoreline is painted shallow so
 * a teal shelf extends offshore beyond the height-based beach fringe.
 */
export const SHALLOW_WATER_COAST_M = 80;

/** Skirt top ring sits this far below the surface so skirts don't z-fight it. */
const SKIRT_TOP_EPS_M = 0.05;

export interface MeshBuildRequest {
    id: TileKey;
    heights: Float32Array;
    size: number;
    geometricErrorM: number;
    maxErrorM: number;
    seaLevel: number;
    /** ENU basis origin + matrices (structured-clone friendly). */
    basis: {
        origin: Ecef;
        lat0: number;
        lon0: number;
        ecefToEnu: Float64Array;
        enuToEcef: Float64Array;
    };
    pad?: FlattenPadSpec;
    padHeightMsl?: number;
    skirtFactor?: number;
}

export interface MeshBuildResult {
    key: string;
    /** Tile-local ENU positions (relative to center), xyz packed. */
    positions: Float32Array;
    /** Smooth vertex normals in ENU (xyz packed, unit length). */
    normals: Float32Array;
    indices: Uint32Array;
    /** Per-triangle tone (length = triangleCount). */
    tones: Uint8Array;
    /** Group ranges: [tone0Start, tone0Count, tone1Start, ...] into the index buffer (in indices, not triangles). */
    groups: Uint32Array;
    centerE: number;
    centerN: number;
    centerU: number;
    boundingRadius: number;
    triangleCount: number;
    vertexCount: number;
}

const _ecef: Ecef = { x: 0, y: 0, z: 0 };
const _enu: Enu = { e: 0, n: 0, u: 0 };

export function buildTileMesh(req: MeshBuildRequest): MeshBuildResult {
    const { id, size, maxErrorM, seaLevel, basis, pad, padHeightMsl } = req;
    const bounds = tileBounds(id);
    // Nodata → sea level for RTIN; bathymetry is preserved as-is. Majority-water
    // tone rules stop coarse coast wedges painting as land.
    const heights = normalizeNodataHeights(req.heights, seaLevel);
    const index = getRtinIndex(size);
    const errors = buildErrorPyramid(heights, size, index);
    // Force RTIN to subdivide every land/water-crossing edge down to the grid
    // so the shoreline follows the DEM mask instead of long sawtooth diagonals.
    boostCoastErrors(heights, errors, size, seaLevel, coastErrorBoost(maxErrorM), index);
    const mesh = extractMesh(errors, size, maxErrorM, index);

    const coastal = demTileIsCoastal(heights, seaLevel);
    let coastGrid: Uint16Array | undefined;
    let coastCellM = 0;
    if (coastal) {
        coastGrid = buildCoastDistanceGrid(heights, size, seaLevel);
        coastCellM = approxTileEdgeMetres(id) / (size - 1);
    }
    const coastDistM = (gx: number, gy: number): number | undefined => {
        if (!coastGrid) {
            return undefined;
        }
        const cells = coastGrid[gy * size + gx];
        if (cells >= 65535) {
            return undefined;
        }
        return cells * coastCellM;
    };

    // Tile centre in ENU — mesh.position carries this so Float32 stays precise.
    const midLon = 0.5 * (bounds.west + bounds.east);
    const midLat = 0.5 * (bounds.south + bounds.north);
    const midH = sampleGrid(heights, size, 0.5, 0.5, seaLevel);
    geodeticToEcef(midLat, midLon, midH, _ecef);
    ecefToEnu(basis as EnuBasis, _ecef, _enu);
    const centerE = _enu.e;
    const centerN = _enu.n;
    const centerU = _enu.u;

    const skirtDepth = Math.max(
        4 * Math.max(req.geometricErrorM, maxErrorM, 1),
        0.02 * approxTileEdgeMetres(id),
    );

    // First pass: surface vertices from the TIN.
    const vCount = mesh.vertices.length / 2;
    const surfacePos = new Float32Array(vCount * 3);
    const surfaceH = new Float32Array(vCount);

    for (let i = 0; i < vCount; i++) {
        const gx = mesh.vertices[i * 2];
        const gy = mesh.vertices[i * 2 + 1];
        const lon = bounds.west + (bounds.east - bounds.west) * (gx / (size - 1));
        const lat = bounds.north - (bounds.north - bounds.south) * (gy / (size - 1));
        let h = heights[gy * size + gx];
        geodeticToEcef(lat, lon, h, _ecef);
        ecefToEnu(basis as EnuBasis, _ecef, _enu);
        if (pad && !isWaterHeight(h, seaLevel)) {
            h = applyFlattenPad(h, _enu.e, _enu.n, pad, padHeightMsl);
            // Reproject with flattened height so the pad is truly flat in ENU Y.
            geodeticToEcef(lat, lon, h, _ecef);
            ecefToEnu(basis as EnuBasis, _ecef, _enu);
        }
        surfacePos[i * 3] = _enu.e - centerE;
        surfacePos[i * 3 + 1] = _enu.u - centerU;
        surfacePos[i * 3 + 2] = _enu.n - centerN;
        surfaceH[i] = h;
    }

    // Pull open water below the beach so coplanar land/water edges cannot
    // z-fight (sky-coloured sparkles at coastal vertices).
    for (let i = 0; i < vCount; i++) {
        if (isWaterHeight(surfaceH[i], seaLevel)) {
            surfacePos[i * 3 + 1] -= WATER_DEPTH_BIAS_M;
        }
    }

    // Classify by tone only — shared verts stay shared (no sea-dup remapping).
    const triCount = mesh.triangleCount;
    const rawTones = new Uint8Array(triCount);
    for (let t = 0; t < triCount; t++) {
        const i0 = mesh.triangles[t * 3];
        const i1 = mesh.triangles[t * 3 + 1];
        const i2 = mesh.triangles[t * 3 + 2];
        const gx0 = mesh.vertices[i0 * 2];
        const gy0 = mesh.vertices[i0 * 2 + 1];
        const gx1 = mesh.vertices[i1 * 2];
        const gy1 = mesh.vertices[i1 * 2 + 1];
        const gx2 = mesh.vertices[i2 * 2];
        const gy2 = mesh.vertices[i2 * 2 + 1];
        const d0 = coastDistM(gx0, gy0);
        const d1 = coastDistM(gx1, gy1);
        const d2 = coastDistM(gx2, gy2);
        const shoreDist = d0 !== undefined && d1 !== undefined && d2 !== undefined
            ? [d0, d1, d2] as const
            : undefined;
        rawTones[t] = toneForTriangle(
            surfaceH[i0], surfaceH[i1], surfaceH[i2], seaLevel, i0 + i1 + i2, shoreDist,
        );
    }

    // Skirt: top ring slightly below the surface, bottom ring dropped by skirtDepth.
    // Using a separate top ring (not the surface verts) avoids edge z-fighting.
    const boundary = collectBoundary(mesh.vertices, vCount, size);
    const skirtTopOffset = vCount;
    const skirtBotOffset = vCount + boundary.length;
    const totalVerts = vCount + boundary.length * 2;
    const positions = new Float32Array(totalVerts * 3);
    positions.set(surfacePos);
    for (let i = 0; i < boundary.length; i++) {
        const src = boundary[i];
        const top = skirtTopOffset + i;
        const bot = skirtBotOffset + i;
        const x = surfacePos[src * 3];
        const y = surfacePos[src * 3 + 1];
        const z = surfacePos[src * 3 + 2];
        positions[top * 3] = x;
        positions[top * 3 + 1] = y - SKIRT_TOP_EPS_M;
        positions[top * 3 + 2] = z;
        positions[bot * 3] = x;
        positions[bot * 3 + 1] = y - skirtDepth;
        positions[bot * 3 + 2] = z;
    }

    const skirtTris: number[] = [];
    const skirtTones: number[] = [];
    appendSkirt(
        mesh.triangles, mesh.vertices, boundary,
        skirtTopOffset, skirtBotOffset, size,
        surfaceH, seaLevel, skirtTris, skirtTones,
    );

    const totalTris = triCount + skirtTones.length;
    const buckets: number[][] = Array.from({ length: TONE_COUNT }, () => []);
    for (let t = 0; t < triCount; t++) {
        buckets[rawTones[t]].push(
            mesh.triangles[t * 3],
            mesh.triangles[t * 3 + 1],
            mesh.triangles[t * 3 + 2],
        );
    }
    for (let t = 0; t < skirtTones.length; t++) {
        buckets[skirtTones[t]].push(
            skirtTris[t * 3],
            skirtTris[t * 3 + 1],
            skirtTris[t * 3 + 2],
        );
    }

    // Water keeps shared verts (unshaded). Land tris get duplicated corners with
    // a constant face normal so sun shade is flat per triangle, not smooth.
    let landCorners = 0;
    for (let tone = 0; tone < TONE_COUNT; tone++) {
        if (!isWaterTone(tone)) {
            landCorners += buckets[tone].length;
        }
    }
    const vertexCount = totalVerts + landCorners;
    const outPositions = new Float32Array(vertexCount * 3);
    outPositions.set(positions);
    const normals = new Float32Array(vertexCount * 3);
    for (let i = 0; i < totalVerts; i++) {
        normals[i * 3 + 1] = 1;
    }

    const indices = new Uint32Array(totalTris * 3);
    const tones = new Uint8Array(totalTris);
    const groups = new Uint32Array(TONE_COUNT * 2);
    let o = 0;
    let triO = 0;
    let nextVert = totalVerts;
    for (let tone = 0; tone < TONE_COUNT; tone++) {
        const bucket = buckets[tone];
        groups[tone * 2] = o;
        if (isWaterTone(tone)) {
            for (let i = 0; i < bucket.length; i++) {
                indices[o++] = bucket[i];
            }
        } else {
            for (let t = 0; t < bucket.length; t += 3) {
                const i0 = bucket[t];
                const i1 = bucket[t + 1];
                const i2 = bucket[t + 2];
                const n = faceNormal(positions, i0, i1, i2);
                for (const src of [i0, i1, i2]) {
                    outPositions[nextVert * 3] = positions[src * 3];
                    outPositions[nextVert * 3 + 1] = positions[src * 3 + 1];
                    outPositions[nextVert * 3 + 2] = positions[src * 3 + 2];
                    normals[nextVert * 3] = n[0];
                    normals[nextVert * 3 + 1] = n[1];
                    normals[nextVert * 3 + 2] = n[2];
                    indices[o++] = nextVert++;
                }
            }
        }
        groups[tone * 2 + 1] = o - groups[tone * 2];
        const nTri = bucket.length / 3;
        for (let i = 0; i < nTri; i++) {
            tones[triO++] = tone;
        }
    }

    let radiusSq = 0;
    for (let i = 0; i < vertexCount; i++) {
        const x = outPositions[i * 3];
        const y = outPositions[i * 3 + 1];
        const z = outPositions[i * 3 + 2];
        const r = x * x + y * y + z * z;
        if (r > radiusSq) {
            radiusSq = r;
        }
    }

    return {
        key: `${id.z}/${id.x}/${id.y}`,
        positions: outPositions,
        normals,
        indices,
        tones,
        groups,
        centerE,
        centerN,
        centerU,
        boundingRadius: Math.sqrt(radiusSq),
        triangleCount: totalTris,
        vertexCount,
    };
}

function isWaterTone(tone: number): boolean {
    return tone === TerrainTone.Water || tone === TerrainTone.ShallowWater;
}

/** Unit face normal for one triangle (Martini winding → +Y on flat ground). */
export function faceNormal(
    positions: Float32Array,
    i0: number,
    i1: number,
    i2: number,
): [number, number, number] {
    const ax = positions[i0 * 3];
    const ay = positions[i0 * 3 + 1];
    const az = positions[i0 * 3 + 2];
    const bx = positions[i1 * 3];
    const by = positions[i1 * 3 + 1];
    const bz = positions[i1 * 3 + 2];
    const cx = positions[i2 * 3];
    const cy = positions[i2 * 3 + 1];
    const cz = positions[i2 * 3 + 2];
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    // Flip (ac×ab): Martini winding is CW when viewed from +Y / ENU up.
    let nx = acy * abz - acz * aby;
    let ny = acz * abx - acx * abz;
    let nz = acx * aby - acy * abx;
    const len = Math.hypot(nx, ny, nz);
    if (len > 1e-12) {
        nx /= len;
        ny /= len;
        nz /= len;
    } else {
        nx = 0;
        ny = 1;
        nz = 0;
    }
    return [nx, ny, nz];
}

function normalizeNodataHeights(src: Float32Array, seaLevel: number): Float32Array {
    const out = new Float32Array(src.length);
    for (let i = 0; i < src.length; i++) {
        const h = src[i];
        // Preserve bathymetry — only fill invalid samples, never snap water up to sea level.
        out[i] = Number.isFinite(h) ? h : seaLevel;
    }
    return out;
}

/** Error high enough that {@link extractMesh} always splits at this midpoint. */
export function coastErrorBoost(maxErrorM: number): number {
    return Math.max(1, maxErrorM) * 2 + 1;
}

/**
 * Raise RTIN midpoint errors along the shoreline so coast edges refine to the
 * DEM grid while flat ocean / inland keep their sparse triangulation.
 *
 * Mutates `errors` in place. A hypotenuse whose endpoints disagree on
 * land/water gets the boost (all pyramid levels), plus every 4-neighbour
 * coast sample so local detail cannot collapse.
 */
export function boostCoastErrors(
    heights: ArrayLike<number>,
    errors: Float32Array,
    size: number,
    seaLevel: number,
    boost: number,
    index: RtinIndex = getRtinIndex(size),
): void {
    if (boost <= 0) {
        return;
    }
    const isWater = (i: number): boolean => isWaterHeight(heights[i], seaLevel);

    // 4-neighbour coast samples.
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = y * size + x;
            const w = isWater(i);
            if ((x > 0 && isWater(i - 1) !== w)
                || (x + 1 < size && isWater(i + 1) !== w)
                || (y > 0 && isWater(i - size) !== w)
                || (y + 1 < size && isWater(i + size) !== w)) {
                if (errors[i] < boost) {
                    errors[i] = boost;
                }
            }
        }
    }

    // Every RTIN hypotenuse that crosses land/water (all pyramid levels).
    const coords = index.coords;
    for (let t = 0; t < index.numTriangles; t++) {
        const k = t * 4;
        const ax = coords[k];
        const ay = coords[k + 1];
        const bx = coords[k + 2];
        const by = coords[k + 3];
        if (isWater(ay * size + ax) === isWater(by * size + bx)) {
            continue;
        }
        const mid = ((ay + by) >> 1) * size + ((ax + bx) >> 1);
        if (errors[mid] < boost) {
            errors[mid] = boost;
        }
    }
}

function sampleGrid(heights: Float32Array, size: number, u: number, v: number, sea: number): number {
    const fx = u * (size - 1);
    const fy = v * (size - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const h = heights[y0 * size + x0];
    return Number.isFinite(h) ? h : sea;
}

export function isWaterHeight(h: number, seaLevel: number, eps: number = WATER_HEIGHT_EPS_M): boolean {
    return !Number.isFinite(h) || h <= seaLevel + eps;
}

/**
 * Tone for a surface triangle. Majority-water → water; shallow only on actual
 * water geometry (near-shore distance or shallow bathymetry), never dry land.
 */
export function toneForTriangle(
    h0: number,
    h1: number,
    h2: number,
    seaLevel: number,
    salt: number = 0,
    shoreDistM?: readonly [number, number, number],
): TerrainTone {
    const w0 = isWaterHeight(h0, seaLevel);
    const w1 = isWaterHeight(h1, seaLevel);
    const w2 = isWaterHeight(h2, seaLevel);
    const waterCount = (w0 ? 1 : 0) + (w1 ? 1 : 0) + (w2 ? 1 : 0);

    if (waterCount === 3) {
        if (shoreDistM && Math.min(shoreDistM[0], shoreDistM[1], shoreDistM[2]) <= SHALLOW_WATER_COAST_M) {
            return TerrainTone.ShallowWater;
        }
        return TerrainTone.Water;
    }
    if (waterCount === 2) {
        return TerrainTone.Water;
    }
    if (waterCount === 1) {
        const landAvg = ((w0 ? 0 : h0) + (w1 ? 0 : h1) + (w2 ? 0 : h2)) / 2;
        return toneForLandHeight(landAvg, salt);
    }

    return toneForLandHeight((h0 + h1 + h2) / 3, salt);
}

export function toneForHeight(h: number, seaLevel: number, salt: number = 0): TerrainTone {
    if (isWaterHeight(h, seaLevel)) {
        return TerrainTone.Water;
    }
    return toneForLandHeight(h, salt);
}

function toneForLandHeight(_h: number, _salt: number): TerrainTone {
    // Single land colour — sun shading provides slope variation.
    return TerrainTone.Grass;
}

/** Compact indices of TIN vertices that sit on the tile border. */
function collectBoundary(vertices: Uint16Array, vCount: number, size: number): number[] {
    const max = size - 1;
    const out: number[] = [];
    for (let i = 0; i < vCount; i++) {
        const x = vertices[i * 2];
        const y = vertices[i * 2 + 1];
        if (x === 0 || y === 0 || x === max || y === max) {
            out.push(i);
        }
    }
    return out;
}

/**
 * For every surface triangle edge that lies on the tile border, emit a skirt
 * quad between the skirt-top and skirt-bottom rings.
 */
function appendSkirt(
    triangles: Uint32Array,
    vertices: Uint16Array,
    boundary: number[],
    skirtTopOffset: number,
    skirtBotOffset: number,
    size: number,
    surfaceH: Float32Array,
    seaLevel: number,
    outIndices: number[],
    outTones: number[],
): void {
    const max = size - 1;
    const boundarySet = new Map<number, number>();
    for (let i = 0; i < boundary.length; i++) {
        boundarySet.set(boundary[i], i);
    }
    const isBorder = (compact: number): boolean => {
        const x = vertices[compact * 2];
        const y = vertices[compact * 2 + 1];
        return x === 0 || y === 0 || x === max || y === max;
    };
    const edgeKey = (a: number, b: number) => a < b ? a * 65536 + b : b * 65536 + a;
    const seen = new Set<number>();

    for (let t = 0; t < triangles.length; t += 3) {
        const verts = [triangles[t], triangles[t + 1], triangles[t + 2]];
        for (let e = 0; e < 3; e++) {
            const a = verts[e];
            const b = verts[(e + 1) % 3];
            if (!isBorder(a) || !isBorder(b)) {
                continue;
            }
            // Only edges where both endpoints share a border axis.
            const ax = vertices[a * 2], ay = vertices[a * 2 + 1];
            const bx = vertices[b * 2], by = vertices[b * 2 + 1];
            if (!(ax === bx && (ax === 0 || ax === max)
                || ay === by && (ay === 0 || ay === max))) {
                continue;
            }
            const key = edgeKey(a, b);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            const ia = boundarySet.get(a)!;
            const ib = boundarySet.get(b)!;
            const ta = skirtTopOffset + ia;
            const tb = skirtTopOffset + ib;
            const ba = skirtBotOffset + ia;
            const bb = skirtBotOffset + ib;
            outIndices.push(ta, tb, bb, ta, bb, ba);
            const ha = surfaceH[a];
            const hb = surfaceH[b];
            let tone: TerrainTone;
            if (isWaterHeight(ha, seaLevel) && isWaterHeight(hb, seaLevel)) {
                tone = TerrainTone.Water;
            } else if (isWaterHeight(ha, seaLevel) || isWaterHeight(hb, seaLevel)) {
                tone = TerrainTone.Water;
            } else {
                tone = toneForLandHeight(0.5 * (ha + hb), a + b);
            }
            outTones.push(tone, tone);
        }
    }
}

/** Ellipsoid-only tile (no DEM) — two triangles approximating the chord. */
export function buildEllipsoidTileMesh(
    id: TileKey,
    basis: EnuBasis,
    seaLevel: number,
): MeshBuildResult {
    const bounds = tileBounds(id);
    const corners: Array<[number, number]> = [
        [bounds.west, bounds.north],
        [bounds.east, bounds.north],
        [bounds.west, bounds.south],
        [bounds.east, bounds.south],
    ];
    const midLon = 0.5 * (bounds.west + bounds.east);
    const midLat = 0.5 * (bounds.south + bounds.north);
    geodeticToEcef(midLat, midLon, seaLevel, _ecef);
    ecefToEnu(basis, _ecef, _enu);
    const centerE = _enu.e;
    const centerN = _enu.n;
    const centerU = _enu.u;

    const skirtDepth = Math.max(0.02 * approxTileEdgeMetres(id), 100);
    // 4 surface + 4 skirt-top + 4 skirt-bottom.
    const positions = new Float32Array(12 * 3);
    for (let i = 0; i < 4; i++) {
        geodeticToEcef(corners[i][1], corners[i][0], seaLevel, _ecef);
        ecefToEnu(basis, _ecef, _enu);
        positions[i * 3] = _enu.e - centerE;
        positions[i * 3 + 1] = _enu.u - centerU - WATER_DEPTH_BIAS_M;
        positions[i * 3 + 2] = _enu.n - centerN;
        positions[(4 + i) * 3] = positions[i * 3];
        positions[(4 + i) * 3 + 1] = positions[i * 3 + 1] - SKIRT_TOP_EPS_M;
        positions[(4 + i) * 3 + 2] = positions[i * 3 + 2];
        positions[(8 + i) * 3] = positions[i * 3];
        positions[(8 + i) * 3 + 1] = positions[i * 3 + 1] - skirtDepth;
        positions[(8 + i) * 3 + 2] = positions[i * 3 + 2];
    }
    // Two surface tris + four skirt quads (8 tris) = 10 tris.
    const indices = new Uint32Array([
        0, 1, 2, 1, 3, 2,
        4, 5, 9, 4, 9, 8,
        5, 7, 11, 5, 11, 9,
        7, 6, 10, 7, 10, 11,
        6, 4, 8, 6, 8, 10,
    ]);
    const tones = new Uint8Array(10).fill(TerrainTone.Water);
    const groups = new Uint32Array(TONE_COUNT * 2);
    groups[TerrainTone.Water * 2] = 0;
    groups[TerrainTone.Water * 2 + 1] = indices.length;

    let radiusSq = 0;
    for (let i = 0; i < 12; i++) {
        const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
        radiusSq = Math.max(radiusSq, x * x + y * y + z * z);
    }

    const normals = new Float32Array(12 * 3);
    for (let i = 0; i < 12; i++) {
        normals[i * 3 + 1] = 1;
    }

    return {
        key: `${id.z}/${id.x}/${id.y}`,
        positions,
        normals,
        indices,
        tones,
        groups,
        centerE,
        centerN,
        centerU,
        boundingRadius: Math.sqrt(radiusSq),
        triangleCount: 10,
        vertexCount: 12,
    };
}
