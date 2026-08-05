/**
 * Build a tile mesh (positions, indices, palette groups, skirt) from a DEM tile.
 * Pure math — safe to run inside a Worker.
 */

import { applyFlattenPad, FlattenPadSpec } from './flattenPad';
import {
    Ecef, Enu, EnuBasis, geodeticToEcef, ecefToEnu,
} from './geodesy';
import { buildErrorPyramid, extractMesh, getRtinIndex } from './rtin';
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
    // Snap sea / near-sea / nodata to a flat datum before RTIN so ocean
    // collapses to two triangles and coast edges stay on the shoreline.
    // Without this, coarse LODs emit kilometre-scale triangles that straddle
    // coast and paint ocean green (vertex-average height > seaLevel).
    const heights = sanitizeHeights(req.heights, seaLevel);
    const index = getRtinIndex(size);
    const errors = buildErrorPyramid(heights, size, index);
    const mesh = extractMesh(errors, size, maxErrorM, index);

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
    const gridToCompact = new Int32Array(size * size).fill(-1);

    for (let i = 0; i < vCount; i++) {
        const gx = mesh.vertices[i * 2];
        const gy = mesh.vertices[i * 2 + 1];
        gridToCompact[gy * size + gx] = i;
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

    // Mutable triangle index list (may grow when we flatten land tips on water).
    const triIndices = Array.from(mesh.triangles);
    const triCount = mesh.triangleCount;
    const rawTones = new Uint8Array(triCount);

    // Extra sea-level duplicates of land vertices used only by water triangles.
    // Martini leaves mountain apexes attached to flat ocean hypotenuses without
    // splitting; flattening those tips keeps the ocean planar instead of a
    // blocky ramp painted (or even just shaped) like land.
    const extraPos: number[] = [];
    const seaDup = new Map<number, number>(); // compact land idx → sea-level dup
    const seaVertex = (compact: number): number => {
        let dup = seaDup.get(compact);
        if (dup !== undefined) {
            return dup;
        }
        const gx = mesh.vertices[compact * 2];
        const gy = mesh.vertices[compact * 2 + 1];
        const lon = bounds.west + (bounds.east - bounds.west) * (gx / (size - 1));
        const lat = bounds.north - (bounds.north - bounds.south) * (gy / (size - 1));
        geodeticToEcef(lat, lon, seaLevel, _ecef);
        ecefToEnu(basis as EnuBasis, _ecef, _enu);
        dup = vCount + (extraPos.length / 3);
        extraPos.push(_enu.e - centerE, _enu.u - centerU, _enu.n - centerN);
        seaDup.set(compact, dup);
        return dup;
    };

    for (let t = 0; t < triCount; t++) {
        const i0 = triIndices[t * 3];
        const i1 = triIndices[t * 3 + 1];
        const i2 = triIndices[t * 3 + 2];
        const tone = toneForTriangle(
            surfaceH[i0], surfaceH[i1], surfaceH[i2], seaLevel, i0 + i1 + i2,
        );
        rawTones[t] = tone;
        if (tone === TerrainTone.Water || tone === TerrainTone.ShallowWater) {
            triIndices[t * 3] = isWaterHeight(surfaceH[i0], seaLevel) ? i0 : seaVertex(i0);
            triIndices[t * 3 + 1] = isWaterHeight(surfaceH[i1], seaLevel) ? i1 : seaVertex(i1);
            triIndices[t * 3 + 2] = isWaterHeight(surfaceH[i2], seaLevel) ? i2 : seaVertex(i2);
        }
    }

    const surfaceVertCount = vCount + extraPos.length / 3;
    const surfacePositions = new Float32Array(surfaceVertCount * 3);
    surfacePositions.set(surfacePos);
    for (let i = 0; i < extraPos.length; i++) {
        surfacePositions[vCount * 3 + i] = extraPos[i];
    }

    // Extended height list: sea duplicates are at seaLevel.
    const allH = new Float32Array(surfaceVertCount);
    allH.set(surfaceH);
    allH.fill(seaLevel, vCount);

    // Extended vertex grid coords for skirt border detection (sea dups copy src).
    const allVerts = new Uint16Array(surfaceVertCount * 2);
    allVerts.set(mesh.vertices);
    for (const [src, dup] of seaDup) {
        allVerts[dup * 2] = mesh.vertices[src * 2];
        allVerts[dup * 2 + 1] = mesh.vertices[src * 2 + 1];
    }

    // Skirt: duplicate boundary vertices of the (post-flatten) surface.
    const boundary = collectBoundary(allVerts, surfaceVertCount, size);
    const skirtOffset = surfaceVertCount;
    const totalVerts = surfaceVertCount + boundary.length;
    const positions = new Float32Array(totalVerts * 3);
    positions.set(surfacePositions);
    for (let i = 0; i < boundary.length; i++) {
        const src = boundary[i];
        const dst = skirtOffset + i;
        positions[dst * 3] = surfacePositions[src * 3];
        positions[dst * 3 + 1] = surfacePositions[src * 3 + 1] - skirtDepth;
        positions[dst * 3 + 2] = surfacePositions[src * 3 + 2];
    }

    const surfaceTri = new Uint32Array(triIndices);
    const skirtTris: number[] = [];
    const skirtTones: number[] = [];
    appendSkirt(surfaceTri, allVerts, boundary, skirtOffset, gridToCompact, size,
        allH, seaLevel, skirtTris, skirtTones);

    const totalTris = triCount + skirtTones.length;
    const buckets: number[][] = Array.from({ length: TONE_COUNT }, () => []);
    for (let t = 0; t < triCount; t++) {
        buckets[rawTones[t]].push(
            surfaceTri[t * 3],
            surfaceTri[t * 3 + 1],
            surfaceTri[t * 3 + 2],
        );
    }
    for (let t = 0; t < skirtTones.length; t++) {
        buckets[skirtTones[t]].push(
            skirtTris[t * 3],
            skirtTris[t * 3 + 1],
            skirtTris[t * 3 + 2],
        );
    }

    const indices = new Uint32Array(totalTris * 3);
    const tones = new Uint8Array(totalTris);
    const groups = new Uint32Array(TONE_COUNT * 2);
    let o = 0;
    let triO = 0;
    for (let tone = 0; tone < TONE_COUNT; tone++) {
        const bucket = buckets[tone];
        groups[tone * 2] = o;
        groups[tone * 2 + 1] = bucket.length;
        for (let i = 0; i < bucket.length; i++) {
            indices[o++] = bucket[i];
        }
        const nTri = bucket.length / 3;
        for (let i = 0; i < nTri; i++) {
            tones[triO++] = tone;
        }
    }

    let radiusSq = 0;
    for (let i = 0; i < totalVerts; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const r = x * x + y * y + z * z;
        if (r > radiusSq) {
            radiusSq = r;
        }
    }

    return {
        key: `${id.z}/${id.x}/${id.y}`,
        positions,
        indices,
        tones,
        groups,
        centerE,
        centerN,
        centerU,
        boundingRadius: Math.sqrt(radiusSq),
        triangleCount: totalTris,
        vertexCount: totalVerts,
    };
}

function sanitizeHeights(src: Float32Array, seaLevel: number): Float32Array {
    const out = new Float32Array(src.length);
    for (let i = 0; i < src.length; i++) {
        const h = src[i];
        out[i] = isWaterHeight(h, seaLevel) ? seaLevel : h;
    }
    return out;
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
 * Tone for a surface triangle. Majority-water → water so coarse RTIN triangles
 * that still touch one coastal peak cannot paint the ocean green.
 */
export function toneForTriangle(
    h0: number,
    h1: number,
    h2: number,
    seaLevel: number,
    salt: number = 0,
): TerrainTone {
    const w0 = isWaterHeight(h0, seaLevel);
    const w1 = isWaterHeight(h1, seaLevel);
    const w2 = isWaterHeight(h2, seaLevel);
    const waterCount = (w0 ? 1 : 0) + (w1 ? 1 : 0) + (w2 ? 1 : 0);
    if (waterCount >= 2) {
        return TerrainTone.Water;
    }
    if (waterCount === 1) {
        // Single water vertex on a land triangle — keep land, but prefer the
        // two land heights so a beach edge doesn't go bare/mountain.
        const landAvg = ((w0 ? 0 : h0) + (w1 ? 0 : h1) + (w2 ? 0 : h2)) / 2;
        return toneForLandHeight(landAvg, salt);
    }
    return toneForLandHeight((h0 + h1 + h2) / 3, salt);
}

export function toneForHeight(h: number, seaLevel: number, salt: number = 0): TerrainTone {
    if (isWaterHeight(h, seaLevel)) {
        // Exact sea datum (after snap) is open water; only slightly submerged
        // samples (before snap) would have been shallow — keep open-water blue.
        return h < seaLevel - 1 ? TerrainTone.ShallowWater : TerrainTone.Water;
    }
    return toneForLandHeight(h, salt);
}

function toneForLandHeight(h: number, salt: number): TerrainTone {
    // Deterministic checker over height bands for the retro sand/grass/bare look.
    const band = h < 200 ? 0 : h < 800 ? 1 : 2;
    const hash = (salt * 2654435761) >>> 0;
    if (band === 0) {
        return (hash & 3) === 0 ? TerrainTone.Grass : TerrainTone.Sand;
    }
    if (band === 1) {
        return (hash & 1) === 0 ? TerrainTone.Grass : TerrainTone.Bare;
    }
    return (hash & 3) === 0 ? TerrainTone.Grass : TerrainTone.Bare;
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
 * quad (two triangles) dropping to the skirt vertices.
 */
function appendSkirt(
    triangles: Uint32Array,
    vertices: Uint16Array,
    boundary: number[],
    skirtOffset: number,
    _gridToCompact: Int32Array,
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
            const sa = skirtOffset + boundarySet.get(a)!;
            const sb = skirtOffset + boundarySet.get(b)!;
            outIndices.push(a, b, sb, a, sb, sa);
            // Skirts inherit water when either endpoint is water so coastal
            // skirts don't flash sand under the limb.
            const tone = (isWaterHeight(surfaceH[a], seaLevel) || isWaterHeight(surfaceH[b], seaLevel))
                ? TerrainTone.Water
                : toneForLandHeight(0.5 * (surfaceH[a] + surfaceH[b]), a + b);
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
    const positions = new Float32Array(8 * 3);
    for (let i = 0; i < 4; i++) {
        geodeticToEcef(corners[i][1], corners[i][0], seaLevel, _ecef);
        ecefToEnu(basis, _ecef, _enu);
        positions[i * 3] = _enu.e - centerE;
        positions[i * 3 + 1] = _enu.u - centerU;
        positions[i * 3 + 2] = _enu.n - centerN;
        positions[(4 + i) * 3] = positions[i * 3];
        positions[(4 + i) * 3 + 1] = positions[i * 3 + 1] - skirtDepth;
        positions[(4 + i) * 3 + 2] = positions[i * 3 + 2];
    }
    // Two surface tris + four skirt quads (8 tris) = 10 tris.
    const indices = new Uint32Array([
        0, 1, 2, 1, 3, 2,
        0, 1, 5, 0, 5, 4,
        1, 3, 7, 1, 7, 5,
        3, 2, 6, 3, 6, 7,
        2, 0, 4, 2, 4, 6,
    ]);
    const tones = new Uint8Array(10).fill(TerrainTone.Water);
    const groups = new Uint32Array(TONE_COUNT * 2);
    groups[TerrainTone.Water * 2] = 0;
    groups[TerrainTone.Water * 2 + 1] = indices.length;

    let radiusSq = 0;
    for (let i = 0; i < 8; i++) {
        const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
        radiusSq = Math.max(radiusSq, x * x + y * y + z * z);
    }

    return {
        key: `${id.z}/${id.x}/${id.y}`,
        positions,
        indices,
        tones,
        groups,
        centerE,
        centerN,
        centerU,
        boundingRadius: Math.sqrt(radiusSq),
        triangleCount: 10,
        vertexCount: 8,
    };
}
