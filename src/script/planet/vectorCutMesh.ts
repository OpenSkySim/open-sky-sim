/**
 * Vector-cut quadtree tile mesh via Constrained Delaunay Triangulation.
 *
 * Coastal tiles slice RTIN height samples along OSM coastline segments so the
 * shoreline follows vector geometry instead of a sawtooth height-grid edge.
 *
 * The constrained triangulation (CDT) only covers small "holes" clustered
 * around the coastline itself (each padded by a margin) — not the whole
 * tile. The rest of the tile is plain RTIN, stitched to each hole along
 * whichever edges naturally border it. Earlier revisions ran the CDT over
 * the entire tile (RTIN interior samples + coastline + tile boundary all in
 * one cdt2d call) and that reliably produced long sliver triangles: a
 * genuinely flat area far from the coast correctly decimates to almost no
 * points (that's the whole point of RTIN), and cdt2d bridges the resulting
 * gap between that sparse region and the dense coastline curve with
 * whatever triangle satisfies its internal topology — sometimes a needle
 * stretching most of the way across the tile. Measured across 200 real
 * tiles, the triangle-quality scores of these had no statistical separation
 * from ordinary large triangles, so no shape/quality heuristic could reject
 * just the bad ones.
 *
 * A single bounding box around *all* coastline points doesn't fully fix
 * this either: a tile with several small, spatially separate features (a
 * handful of islands scattered across the tile, say) produces one box that
 * still spans almost the whole tile, reproducing the same problem inside
 * that box. Clustering the coastline into separate, spatially-local holes —
 * only merging features that are actually close together — keeps each CDT
 * problem small enough that nothing in its point set is ever far enough
 * away to need a sliver to reach it.
 */

import cdt2d from 'cdt2d';
import cleanPslg from 'clean-pslg';
import { CoastPolygon, isLandLonLat } from './coastVector';
import { INLAND_WATER_MIN_M } from './landWater';
import { buildErrorPyramid, extractMesh, getRtinIndex, RtinIndex, RtinMesh } from './rtin';
import { LonLatBounds } from './tiling';

export interface VectorCutInput {
    bounds: LonLatBounds;
    size: number;
    heights: Float32Array;
    seaLevel: number;
    maxErrorM: number;
    polygons: CoastPolygon[];
}

export interface VectorCutMesh {
    /**
     * Packed grid coords [x0, y0, x1, y1, …] in tile sample space. Float32 —
     * coastline/tile-edge intersection points are sub-cell fractional
     * positions; Uint16 would truncate them back onto the DEM grid.
     */
    vertices: Float32Array;
    triangles: Uint32Array;
    triangleCount: number;
    /** 1 = land, 0 = water per triangle. */
    triangleLand: Uint8Array;
}

const UV_EPS = 1e-9;
const GRID_SNAP = 2e-2;

/**
 * Cap on re-split passes when retiring failed coastline groups. Retiring a
 * group changes what the outer split keeps, which can in turn change a
 * surviving group's hole boundary, so this can need more than one pass —
 * but it must stay bounded, since each pass re-triangulates every surviving
 * group.
 */
const MAX_HOLE_RETIRE_PASSES = 3;

/** Boundary + coastline point budget per hole, checked before the expensive clean/triangulate step. */
const MAX_CONSTRAINED_POINTS = 4000;

/** Margin (grid units) padded around each clustered coastline group's bounding box to form a hole. */
const HOLE_MARGIN_FRAC = 0.06;
const HOLE_MARGIN_MIN = 8;

type Segment = [number, number, number, number];

interface GridRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/** Build a vector-cut TIN for a coastal tile. Falls back to RTIN on failure. */
export function buildVectorCutMesh(input: VectorCutInput): VectorCutMesh | undefined {
    const { bounds, size, heights, seaLevel, maxErrorM, polygons } = input;
    if (polygons.length === 0) {
        return undefined;
    }

    const max = size - 1;
    const lonSpan = bounds.east - bounds.west;
    const latSpan = bounds.north - bounds.south;
    if (lonSpan <= 0 || latSpan <= 0) {
        return undefined;
    }

    const toGrid = (lon: number, lat: number): [number, number] => {
        const u = (lon - bounds.west) / lonSpan;
        const v = (bounds.north - lat) / latSpan;
        return [u * max, v * max];
    };
    const toLonLat = (gx: number, gy: number): { lon: number; lat: number } => ({
        lon: bounds.west + (gx / max) * lonSpan,
        lat: bounds.north - (gy / max) * latSpan,
    });

    const segments = collectCoastSegments(polygons, bounds, toGrid);
    if (segments.length === 0) {
        return undefined;
    }

    const margin = Math.max(HOLE_MARGIN_MIN, Math.round(max * HOLE_MARGIN_FRAC));
    const groups = clusterSegments(segments, margin, max);

    // Plain, unmodified RTIN over the whole tile — identical to what the
    // non-coastal fallback path produces, so it inherits the same
    // never-produces-slivers behaviour. Any triangle count here is fine:
    // extractMesh alone (no cdt2d) stays fast even at tens of thousands of
    // triangles (measured ~5ms at native zoom in testing).
    const index = getRtinIndex(size);
    const outer = extractMesh(buildErrorPyramid(heights, size, index), size, maxErrorM, index);

    const tile = { polygons };
    const outVerts: number[] = [];
    const outTris: number[] = [];
    const triangleLandParts: Uint8Array[] = [];

    // A failed hole can't just be skipped mid-pass: splitOuterMesh has
    // already discarded the outer RTIN triangles covering that region, so
    // leaving it empty would punch a real hole in the mesh. Instead retire
    // the offending group and re-split — the region then keeps its plain
    // RTIN triangles (grid-aligned shoreline there, but still vector-derived
    // tones via isLandLonLat below) while every other coastline group in the
    // tile keeps its exact vector cut. Only when the last group is retired
    // does the whole tile fall back to RTIN, as before.
    let active = groups.map((_, i) => i);
    let keptTriangles: number[] | undefined;
    for (let pass = 0; pass < MAX_HOLE_RETIRE_PASSES && active.length > 0; pass++) {
        const split = splitOuterMesh(outer, active.map(i => groups[i].rect));
        outVerts.length = 0;
        outTris.length = 0;
        triangleLandParts.length = 0;
        const failed: number[] = [];
        for (let h = 0; h < active.length; h++) {
            const group = groups[active[h]];
            const holeMesh = buildHoleMesh(
                group.segments, group.rect,
                split.holesBoundaryPositions[h], split.holesBoundaryEdges[h],
                heights, size, seaLevel, maxErrorM, max, toLonLat, tile,
            );
            // Every failure in this pass is collected before retrying, so a
            // tile with several bad groups converges in a couple of passes
            // instead of one re-split per bad group.
            if (!holeMesh) {
                failed.push(h);
                continue;
            }
            const base = outVerts.length / 2;
            for (let i = 0; i < holeMesh.vertices.length; i++) {
                outVerts.push(holeMesh.vertices[i]);
            }
            for (let i = 0; i < holeMesh.triangles.length; i++) {
                outTris.push(holeMesh.triangles[i] + base);
            }
            triangleLandParts.push(holeMesh.triangleLand);
        }
        if (failed.length === 0) {
            keptTriangles = split.keptTriangles;
            break;
        }
        const drop = new Set(failed);
        active = active.filter((_, i) => !drop.has(i));
    }
    if (!keptTriangles) {
        return undefined;
    }

    // Append the kept outer RTIN triangles, using their own vertex values
    // (duplicated at the shared hole boundaries rather than deduped against
    // the inner meshes' vertex lists — harmless; positions match exactly).
    const outerVertRemap = new Map<number, number>();
    const outerTriangleLand = new Uint8Array(keptTriangles.length);
    for (let k = 0; k < keptTriangles.length; k++) {
        const t = keptTriangles[k];
        const i0 = outer.triangles[t * 3], i1 = outer.triangles[t * 3 + 1], i2 = outer.triangles[t * 3 + 2];
        const remapped: number[] = [];
        for (const vi of [i0, i1, i2]) {
            let out = outerVertRemap.get(vi);
            if (out === undefined) {
                out = outVerts.length / 2;
                outerVertRemap.set(vi, out);
                outVerts.push(outer.vertices[vi * 2], outer.vertices[vi * 2 + 1]);
            }
            remapped.push(out);
        }
        outTris.push(remapped[0], remapped[1], remapped[2]);
        const cx = (outer.vertices[i0 * 2] + outer.vertices[i1 * 2] + outer.vertices[i2 * 2]) / 3;
        const cy = (outer.vertices[i0 * 2 + 1] + outer.vertices[i1 * 2 + 1] + outer.vertices[i2 * 2 + 1]) / 3;
        const lon = bounds.west + (cx / max) * lonSpan;
        const lat = bounds.north - (cy / max) * latSpan;
        outerTriangleLand[k] = isLandLonLat(lon, lat, tile) ? 1 : 0;
    }
    triangleLandParts.push(outerTriangleLand);

    const totalTris = outTris.length / 3;
    const triangleLand = new Uint8Array(totalTris);
    let o = 0;
    for (const part of triangleLandParts) {
        triangleLand.set(part, o);
        o += part.length;
    }

    return {
        vertices: new Float32Array(outVerts),
        triangles: new Uint32Array(outTris),
        triangleCount: totalTris,
        triangleLand,
    };
}

interface SegmentGroup {
    segments: Segment[];
    rect: GridRect;
}

/**
 * Group coastline segments that are spatially close (within `margin` of one
 * another once padded) into separate clusters, each becoming its own hole.
 * Plain union-find over segment pairs — segment counts per tile are in the
 * hundreds to low thousands, so the O(n²) pairwise check stays cheap (a few
 * ms even at the high end).
 */
function clusterSegments(segments: Segment[], margin: number, max: number): SegmentGroup[] {
    const n = segments.length;
    const boxes: GridRect[] = segments.map(([ax, ay, bx, by]) => ({
        minX: Math.min(ax, bx), minY: Math.min(ay, by),
        maxX: Math.max(ax, bx), maxY: Math.max(ay, by),
    }));
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (i: number): number => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        return i;
    };
    const union = (a: number, b: number): void => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) {
            parent[ra] = rb;
        }
    };
    const overlaps = (a: GridRect, b: GridRect): boolean =>
        !(a.maxX + margin < b.minX - margin || b.maxX + margin < a.minX - margin
            || a.maxY + margin < b.minY - margin || b.maxY + margin < a.minY - margin);
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (overlaps(boxes[i], boxes[j])) {
                union(i, j);
            }
        }
    }

    const byRoot = new Map<number, { segments: Segment[]; box: GridRect }>();
    for (let i = 0; i < n; i++) {
        const r = find(i);
        let g = byRoot.get(r);
        if (!g) {
            g = { segments: [], box: { ...boxes[i] } };
            byRoot.set(r, g);
        }
        g.segments.push(segments[i]);
        g.box.minX = Math.min(g.box.minX, boxes[i].minX);
        g.box.minY = Math.min(g.box.minY, boxes[i].minY);
        g.box.maxX = Math.max(g.box.maxX, boxes[i].maxX);
        g.box.maxY = Math.max(g.box.maxY, boxes[i].maxY);
    }

    return [...byRoot.values()].map(g => ({
        segments: g.segments,
        rect: {
            minX: Math.max(0, Math.floor(g.box.minX - margin)),
            minY: Math.max(0, Math.floor(g.box.minY - margin)),
            maxX: Math.min(max, Math.ceil(g.box.maxX + margin)),
            maxY: Math.min(max, Math.ceil(g.box.maxY + margin)),
        },
    }));
}

/**
 * Build the constrained triangulation for a single hole: its own point set
 * (hole-boundary vertices from the outer split, RTIN/lattice samples and
 * coastline confined to this hole alone), cleaned and triangulated
 * independently of every other hole in the tile.
 */
function buildHoleMesh(
    segments: Segment[],
    rect: GridRect,
    holeBoundaryPositions: [number, number][],
    holeBoundaryEdges: Segment[],
    heights: Float32Array,
    size: number,
    seaLevel: number,
    maxErrorM: number,
    max: number,
    toLonLat: (gx: number, gy: number) => { lon: number; lat: number },
    tile: { polygons: CoastPolygon[] },
): { vertices: Float32Array; triangles: Uint32Array; triangleLand: Uint8Array } | undefined {
    const pointKey = (x: number, y: number): string => {
        const sx = Math.round(x / GRID_SNAP);
        const sy = Math.round(y / GRID_SNAP);
        return `${sx},${sy}`;
    };
    const points: [number, number][] = [];
    const indexOf = new Map<string, number>();
    const addPoint = (x: number, y: number): number => {
        const cx = Math.max(0, Math.min(max, x));
        const cy = Math.max(0, Math.min(max, y));
        const key = pointKey(cx, cy);
        const existing = indexOf.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const idx = points.length;
        points.push([cx, cy]);
        indexOf.set(key, idx);
        return idx;
    };

    const boundaryPositions = new Map<number, [number, number]>();
    for (const [hx, hy] of holeBoundaryPositions) {
        boundaryPositions.set(addPoint(hx, hy), [hx, hy]);
    }

    // buildRtinSamples extracts over the whole tile (its own decimation
    // needs the full error pyramid to agree with the outer mesh wherever
    // they overlap) — filter to this hole here. Skipping this let a vertex
    // anywhere else in the tile that happened to land on a tile edge get
    // pulled into buildTileEdgeChains below, bridging a huge, spurious gap
    // (the sliver failure mode this whole redesign targets, just relocated
    // to the tile-edge case).
    const innerRtin = buildRtinSamples(heights, size, seaLevel, maxErrorM, rect);
    for (let i = 0; i < innerRtin.vertices.length; i += 2) {
        const gx = innerRtin.vertices[i];
        const gy = innerRtin.vertices[i + 1];
        if (gx < rect.minX || gx > rect.maxX || gy < rect.minY || gy > rect.maxY) {
            continue;
        }
        const idx = addPoint(gx, gy);
        if (gx === 0 || gx === max || gy === 0 || gy === max) {
            boundaryPositions.set(idx, [gx, gy]);
        }
    }
    // Background lattice within the hole — bounds the largest possible gap
    // between points so an empty flat patch inside the hole can't hand
    // cdt2d a sliver-triangle-inducing void next to the coastline curve.
    const lattice = Math.max(1, Math.round((rect.maxX - rect.minX) / BACKGROUND_LATTICE_DIVS));
    for (let gy = rect.minY; gy <= rect.maxY; gy += lattice) {
        for (let gx = rect.minX; gx <= rect.maxX; gx += lattice) {
            addPoint(gx, gy);
        }
    }

    // Coastline constraint segments for this hole only. Dedupe identical
    // undirected pairs — adjacent/touching OSM polygons can independently
    // clip to the same physical edge, and a duplicated constraint is a
    // reliable way to crash cdt2d's monotone-decomposition sweep.
    const coastEdges: [number, number][] = [];
    const seenEdge = new Set<string>();
    const edgeKey = (a: number, b: number): string => (a < b ? `${a},${b}` : `${b},${a}`);
    for (const [ax, ay, bx, by] of segments) {
        const ia = addPoint(ax, ay);
        const ib = addPoint(bx, by);
        if (ia === ib) {
            continue;
        }
        const key = edgeKey(ia, ib);
        if (seenEdge.has(key)) {
            continue;
        }
        seenEdge.add(key);
        coastEdges.push([ia, ib]);
    }

    // Hole-boundary edges from the outer split — translate outer-mesh vertex
    // coordinates into this hole's point indices.
    const holeEdges: [number, number][] = [];
    for (const [ax, ay, bx, by] of holeBoundaryEdges) {
        const ia = addPoint(ax, ay);
        const ib = addPoint(bx, by);
        if (ia !== ib) {
            holeEdges.push([ia, ib]);
        }
    }

    // Tile-edge chain, computed only now that every point for *this hole*
    // (including coastline points, which can themselves land exactly on a
    // tile edge) has been added — connects consecutive points along each
    // tile edge without wrapping between edges. Confined to this hole's own
    // point set, so it can never bridge across to a different hole's
    // tile-edge points even if both happen to touch the same tile edge
    // elsewhere.
    const tileEdgeEdges = buildTileEdgeChains(points, max, lattice * 2.5);
    for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i];
        if (x === 0 || x === max || y === 0 || y === max) {
            boundaryPositions.set(i, [x, y]);
        }
    }

    if (points.length > MAX_CONSTRAINED_POINTS) {
        return undefined;
    }

    const allEdges = [...holeEdges, ...tileEdgeEdges, ...coastEdges];

    // Real OSM coastline data reliably violates cdt2d's PSLG invariants
    // (T-junctions where adjacent polygon rings touch without sharing a
    // vertex, near-duplicate points) — clean-pslg resolves those via snap
    // rounding before triangulating, per cdt2d's own "messy graphs" guidance.
    // Snap rounding is a *local* decision, though — it nudges a point based
    // on whatever else happens to be nearby. Two neighbouring tiles (or,
    // now, a hole boundary vs the outer RTIN mesh within the *same* tile)
    // independently cleaning what should be the same shared vertex can each
    // nudge it differently and crack the seam. So: clean the full set, then
    // force every boundary point (`boundaryPositions` — hole-boundary and
    // tile-edge positions, never a coastline point, since those may have
    // legitimately needed to move) back to its exact pre-clean position.
    // Restoring can re-collide a boundary point with a coastline point
    // cleanPslg had moved onto that same spot; merge them via edge remap
    // rather than leave true duplicate points for cdt2d.
    cleanPslg(points, allEdges);
    const remap = new Map<number, number>();
    const restoredKey = new Map<string, number>();
    for (const [i, [rx, ry]] of boundaryPositions) {
        const key = `${rx},${ry}`;
        const existing = restoredKey.get(key);
        if (existing !== undefined) {
            remap.set(i, existing);
            continue;
        }
        points[i][0] = rx;
        points[i][1] = ry;
        restoredKey.set(key, i);
    }
    if (remap.size > 0) {
        const rewritten: [number, number][] = [];
        const seenAfterRemap = new Set<string>();
        for (const edge of allEdges) {
            const a = remap.get(edge[0]) ?? edge[0];
            const b = remap.get(edge[1]) ?? edge[1];
            if (a === b) {
                continue;
            }
            const key = edgeKey(a, b);
            if (seenAfterRemap.has(key)) {
                continue;
            }
            seenAfterRemap.add(key);
            rewritten.push([a, b]);
        }
        allEdges.length = 0;
        allEdges.push(...rewritten);
    }

    let cells: number[][];
    try {
        cells = cdt2d(points, allEdges) as number[][];
    } catch {
        return undefined;
    }
    if (!cells || cells.length === 0) {
        return undefined;
    }

    // Defensive safety net: cdt2d's own docs warn it can return *incorrect*
    // results (not just throw) when its input doesn't perfectly satisfy its
    // PSLG invariants, and testing found exactly that — a triangle spanning
    // most of a hole while ignoring plenty of well-distributed, unconstrained
    // nearby points that should have broken it up, with no constrained edge
    // forcing that shape. Confining the CDT to small holes (this file's main
    // fix) made this rare and fixed the general "large triangles have no
    // statistical separation from slivers" problem from the whole-tile
    // design, but didn't eliminate every case — so this stays as a backstop.
    // Only large triangles are checked (small ones are never the problem,
    // and thin-but-small is normal near a tightly-hugged coastline); of
    // those, a healthy one — including a big, legitimate RTIN-style
    // half-square triangle over open water — scores well above this
    // threshold, while the pathological case measured near zero. Skipped
    // for grids much smaller than a real DEM tile (always size 257 in
    // production) — HOLE_MARGIN_MIN alone dominates a tiny synthetic grid,
    // so a "large" triangle there is just the whole hole, not a warning sign.
    if (max >= SLIVER_CHECK_MIN_GRID) {
        for (let t = 0; t < cells.length; t++) {
            const tri = cells[t];
            const [ax, ay] = points[tri[0]];
            const [bx, by] = points[tri[1]];
            const [cx2, cy2] = points[tri[2]];
            const ab = Math.hypot(bx - ax, by - ay);
            const bc = Math.hypot(cx2 - bx, cy2 - by);
            const ca = Math.hypot(ax - cx2, ay - cy2);
            const longest = Math.max(ab, bc, ca);
            if (longest < max * SLIVER_MIN_EDGE_FRAC) {
                continue;
            }
            const area = Math.abs((bx - ax) * (cy2 - ay) - (cx2 - ax) * (by - ay)) / 2;
            if (area / (longest * longest) >= MIN_TRIANGLE_QUALITY) {
                continue;
            }
            // A sliver lying wholly in open ocean is invisible: meshBuilder
            // snaps every open-water vertex to sea level and paints the whole
            // triangle one water tone, so its shape can't show up in either
            // the silhouette or the shading. Rejecting the tile over one costs
            // the *entire* tile its vector shoreline — a far more visible
            // regression than the sliver it avoids. Measured over the baked
            // Canary set, this is what 171 of 220 rejections actually were.
            if (isFlatWaterTriangle(
                [[ax, ay], [bx, by], [cx2, cy2]],
                heights, size, seaLevel, toLonLat, tile,
            )) {
                continue;
            }
            return undefined;
        }
    }

    const triangleLand = new Uint8Array(cells.length);
    for (let t = 0; t < cells.length; t++) {
        const tri = cells[t];
        let cx = 0;
        let cy = 0;
        for (const vi of tri) {
            cx += points[vi][0];
            cy += points[vi][1];
        }
        cx /= 3;
        cy /= 3;
        const { lon, lat } = toLonLat(cx, cy);
        triangleLand[t] = isLandLonLat(lon, lat, tile) ? 1 : 0;
    }

    const vertRemap = new Map<number, number>();
    const outVerts: number[] = [];
    const outTris: number[] = [];
    for (let t = 0; t < cells.length; t++) {
        const tri = cells[t];
        const remapped: number[] = [];
        for (const vi of tri) {
            let out = vertRemap.get(vi);
            if (out === undefined) {
                out = outVerts.length / 2;
                vertRemap.set(vi, out);
                outVerts.push(points[vi][0], points[vi][1]);
            }
            remapped.push(out);
        }
        // Consistent CCW for Martini-style +Y up normals.
        const ax = points[tri[0]][0], ay = points[tri[0]][1];
        const bx = points[tri[1]][0], by = points[tri[1]][1];
        const cx = points[tri[2]][0], cy = points[tri[2]][1];
        const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        if (cross > 0) {
            outTris.push(remapped[0], remapped[2], remapped[1]);
        } else {
            outTris.push(remapped[0], remapped[1], remapped[2]);
        }
    }

    return {
        vertices: new Float32Array(outVerts),
        triangles: new Uint32Array(outTris),
        triangleLand,
    };
}


/**
 * True when all three vertices are open ocean — water per the OSM polygons
 * *and* at or below sea level in the DEM, which is exactly the condition
 * meshBuilder uses to snap a vertex flat (`isOceanWaterCell`). Inland water
 * keeps its DEM height, so a lake sliver stays visible and is not excused.
 */
export function isFlatWaterTriangle(
    verts: [number, number][],
    heights: Float32Array,
    size: number,
    seaLevel: number,
    toLonLat: (gx: number, gy: number) => { lon: number; lat: number },
    tile: { polygons: CoastPolygon[] },
): boolean {
    for (const [px, py] of verts) {
        const { lon, lat } = toLonLat(px, py);
        if (isLandLonLat(lon, lat, tile)) {
            return false;
        }
        const hx = Math.max(0, Math.min(size - 1, Math.round(px)));
        const hy = Math.max(0, Math.min(size - 1, Math.round(py)));
        const h = heights[hy * size + hx];
        if (Number.isFinite(h) && h > seaLevel + INLAND_WATER_MIN_M) {
            return false;
        }
    }
    return true;
}

/**
 * Interior Steiner-point budget for the constrained triangulation. cdt2d's
 * triangulation cost grows worse than linearly with point count, so even
 * confined to a (much smaller) hole, a pathologically complex coastline
 * region is kept bounded by coarsening past the tile's nominal `maxErrorM`.
 */
const INTERIOR_POINT_BUDGET = 1500;
const BUDGET_GROWTH_FACTOR = 1.7;
const BUDGET_MAX_ITERATIONS = 14;

/** Background lattice divisions across a hole. */
const BACKGROUND_LATTICE_DIVS = 12;

/** Below this longest-edge fraction of the tile width, a triangle is never checked for the sliver backstop — small/thin is normal near the coastline. */
const SLIVER_MIN_EDGE_FRAC = 0.3;

/** Skip the sliver backstop below this grid width (`size - 1`) — real DEM tiles are always 257; a synthetic test grid much smaller than that makes "large" meaningless. */
const SLIVER_CHECK_MIN_GRID = 64;

/**
 * Reject a hole's triangulation if a large triangle's area/longestEdge²
 * quality falls below this. Healthy large triangles measured from ~0.08 up
 * to the ~0.25 RTIN right-triangle baseline; confirmed pathological cases
 * measured ~1e-4 to ~1e-6 — several orders of magnitude lower, so this sits
 * well clear of both.
 */
const MIN_TRIANGLE_QUALITY = 0.02;

/**
 * RTIN samples confined to (and budgeted for) a hole around the coastline.
 * Extracted from the whole-tile error pyramid so its own decimation choices
 * agree with the outer mesh's wherever they overlap, then filtered to the
 * hole — points outside it are simply unused.
 */
function buildRtinSamples(
    heights: Float32Array,
    size: number,
    seaLevel: number,
    maxErrorM: number,
    rect: GridRect,
): RtinMesh {
    const index = getRtinIndex(size);
    const baseErrors = buildErrorPyramid(heights, size, index);
    let errM = maxErrorM;
    let iterations = 0;
    while (true) {
        const errors = baseErrors.slice();
        boostCoastErrorsForRtin(heights, errors, size, seaLevel, Math.max(1, errM) * 2 + 1, index);
        const mesh = extractMesh(errors, size, errM, index);
        const inHole = countInRect(mesh, rect);
        if (inHole <= INTERIOR_POINT_BUDGET || iterations >= BUDGET_MAX_ITERATIONS) {
            return mesh;
        }
        errM *= BUDGET_GROWTH_FACTOR;
        iterations += 1;
    }
}

function countInRect(mesh: RtinMesh, rect: GridRect): number {
    let n = 0;
    for (let i = 0; i < mesh.vertices.length; i += 2) {
        const x = mesh.vertices[i];
        const y = mesh.vertices[i + 1];
        if (x >= rect.minX && x <= rect.maxX && y >= rect.minY && y <= rect.maxY) {
            n++;
        }
    }
    return n;
}

function isWaterHeight(h: number, seaLevel: number): boolean {
    return !Number.isFinite(h) || h <= seaLevel + 0.5;
}

/** Raise RTIN midpoint errors near the raster land/water boundary so point density tapers smoothly instead of cliffing at the coast. */
function boostCoastErrorsForRtin(
    heights: ArrayLike<number>,
    errors: Float32Array,
    size: number,
    seaLevel: number,
    boost: number,
    index: RtinIndex,
): void {
    if (boost <= 0) {
        return;
    }
    const isWater = (i: number): boolean => isWaterHeight(heights[i], seaLevel);
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

interface SplitMesh {
    keptTriangles: number[];
    /** Per hole: unique grid positions on that hole's boundary (for exact-position restoration). */
    holesBoundaryPositions: [number, number][][];
    /** Per hole: the constrained edges between the kept outer mesh and that hole, as raw grid coordinate pairs. */
    holesBoundaryEdges: Segment[][];
}

/**
 * Split a whole-tile RTIN mesh into "kept" triangles (fully outside every
 * hole) and, per hole, the boundary edges where a kept triangle touches a
 * discarded one — the exact interface each hole's CDT needs to stitch
 * against, read directly off the RTIN mesh's own topology rather than
 * computed independently (which is what makes the stitch exact: both sides
 * share the literal vertex positions, nothing is re-derived on either side).
 */
function splitOuterMesh(outer: RtinMesh, rects: GridRect[]): SplitMesh {
    const holeOf = (vi: number): number => {
        const x = outer.vertices[vi * 2];
        const y = outer.vertices[vi * 2 + 1];
        for (let h = 0; h < rects.length; h++) {
            const r = rects[h];
            if (x >= r.minX && x <= r.maxX && y >= r.minY && y <= r.maxY) {
                return h;
            }
        }
        return -1;
    };
    // Per triangle: -1 if kept, else the hole index it was discarded for
    // (first match if a triangle's vertices span more than one hole — rare,
    // since clustering already merges holes that are close enough to
    // matter, and any residual overlap just means that triangle's discard
    // reason is attributed to whichever hole is checked first).
    const discardedFor = new Int32Array(outer.triangleCount).fill(-1);
    for (let t = 0; t < outer.triangleCount; t++) {
        const i0 = outer.triangles[t * 3], i1 = outer.triangles[t * 3 + 1], i2 = outer.triangles[t * 3 + 2];
        let h = holeOf(i0);
        if (h < 0) h = holeOf(i1);
        if (h < 0) h = holeOf(i2);
        discardedFor[t] = h;
    }

    interface EdgeInfo { keptCount: number; holeCounts: Map<number, number>; a: number; b: number }
    const edgeInfo = new Map<string, EdgeInfo>();
    const key = (a: number, b: number): string => (a < b ? `${a},${b}` : `${b},${a}`);
    for (let t = 0; t < outer.triangleCount; t++) {
        const tri: [number, number, number] = [outer.triangles[t * 3], outer.triangles[t * 3 + 1], outer.triangles[t * 3 + 2]];
        const h = discardedFor[t];
        for (let e = 0; e < 3; e++) {
            const a = tri[e];
            const b = tri[(e + 1) % 3];
            const k = key(a, b);
            let info = edgeInfo.get(k);
            if (!info) {
                info = { keptCount: 0, holeCounts: new Map(), a, b };
                edgeInfo.set(k, info);
            }
            if (h < 0) {
                info.keptCount++;
            } else {
                info.holeCounts.set(h, (info.holeCounts.get(h) ?? 0) + 1);
            }
        }
    }

    const holesBoundaryPositions: [number, number][][] = rects.map(() => []);
    const holesBoundaryEdges: Segment[][] = rects.map(() => []);
    const seenPos: Set<string>[] = rects.map(() => new Set());
    for (const info of edgeInfo.values()) {
        if (info.keptCount !== 1) {
            continue;
        }
        for (const [h, count] of info.holeCounts) {
            if (count !== 1) {
                continue;
            }
            const ax = outer.vertices[info.a * 2], ay = outer.vertices[info.a * 2 + 1];
            const bx = outer.vertices[info.b * 2], by = outer.vertices[info.b * 2 + 1];
            const seen = seenPos[h];
            const ka = `${ax},${ay}`, kb = `${bx},${by}`;
            if (!seen.has(ka)) { seen.add(ka); holesBoundaryPositions[h].push([ax, ay]); }
            if (!seen.has(kb)) { seen.add(kb); holesBoundaryPositions[h].push([bx, by]); }
            holesBoundaryEdges[h].push([ax, ay, bx, by]);
        }
    }

    const keptTriangles: number[] = [];
    for (let t = 0; t < outer.triangleCount; t++) {
        if (discardedFor[t] < 0) {
            keptTriangles.push(t);
        }
    }

    return { keptTriangles, holesBoundaryPositions, holesBoundaryEdges };
}

/**
 * For each tile edge independently, connect consecutive (by position along
 * that edge) points from the current point set — no wraparound between
 * edges, since a hole may only touch one tile edge, or none, and its
 * interior interface is already covered by the hole-boundary edges from
 * `splitOuterMesh`.
 */
function buildTileEdgeChains(points: [number, number][], max: number, maxGap: number): [number, number][] {
    const snap = GRID_SNAP;
    const edges: [number, number][] = [];
    const collect = (onEdge: (x: number, y: number) => boolean, coordOf: (x: number, y: number) => number) => {
        const found: { t: number; idx: number }[] = [];
        for (let i = 0; i < points.length; i++) {
            const [x, y] = points[i];
            if (onEdge(x, y)) {
                found.push({ t: coordOf(x, y), idx: i });
            }
        }
        found.sort((a, b) => a.t - b.t);
        for (let i = 0; i + 1 < found.length; i++) {
            // An uneven gap here becomes a long, unflippable constrained
            // edge — cdt2d then has no choice but to build a thin triangle
            // against it, no matter how much background density exists
            // elsewhere (this produced exactly the sliver artifact the rest
            // of this file works to avoid). Real closure of the domain
            // comes from the hole-boundary edges in `splitOuterMesh`, not
            // from this chain being fully connected, so it's safe to just
            // not bridge an outlier-sized gap.
            if (found[i + 1].t - found[i].t > maxGap) {
                continue;
            }
            edges.push([found[i].idx, found[i + 1].idx]);
        }
    };
    collect((x, y) => Math.abs(x) < snap && y >= -snap && y <= max + snap, (_x, y) => y);
    collect((x, y) => Math.abs(x - max) < snap && y >= -snap && y <= max + snap, (_x, y) => y);
    collect((x, y) => Math.abs(y) < snap && x >= -snap && x <= max + snap, (x) => x);
    collect((x, y) => Math.abs(y - max) < snap && x >= -snap && x <= max + snap, (x) => x);
    return edges;
}

/** Clip polygon ring edges to tile bounds; returns each visible sub-segment in grid space. */
function collectCoastSegments(
    polygons: CoastPolygon[],
    bounds: LonLatBounds,
    toGrid: (lon: number, lat: number) => [number, number],
): Segment[] {
    const out: Segment[] = [];
    const emitRing = (ring: { lon: number; lat: number }[]) => {
        const n = ring.length;
        if (n < 2) {
            return;
        }
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const clipped = clipSegmentToBounds(
                ring[i].lon, ring[i].lat,
                ring[j].lon, ring[j].lat,
                bounds,
            );
            for (const seg of clipped) {
                const [a, b] = seg;
                const [ax, ay] = toGrid(a.lon, a.lat);
                const [bx, by] = toGrid(b.lon, b.lat);
                if (Math.hypot(ax - bx, ay - by) > UV_EPS) {
                    out.push([ax, ay, bx, by]);
                }
            }
        }
    };

    for (const poly of polygons) {
        emitRing(poly.exterior);
        for (const hole of poly.holes) {
            emitRing(hole);
        }
    }
    return out;
}

interface LonLatPt {
    lon: number;
    lat: number;
}

/** Liang-Barsky clip of a segment to a lon/lat AABB. */
export function clipSegmentToBounds(
    lon0: number, lat0: number,
    lon1: number, lat1: number,
    bounds: LonLatBounds,
): [LonLatPt, LonLatPt][] {
    let t0 = 0;
    let t1 = 1;
    const dLon = lon1 - lon0;
    const dLat = lat1 - lat0;

    const clip = (p: number, q: number): boolean => {
        if (Math.abs(p) < UV_EPS) {
            return q >= 0;
        }
        const r = q / p;
        if (p < 0) {
            if (r > t1) {
                return false;
            }
            if (r > t0) {
                t0 = r;
            }
        } else {
            if (r < t0) {
                return false;
            }
            if (r < t1) {
                t1 = r;
            }
        }
        return true;
    };

    if (!clip(-dLon, lon0 - bounds.west)) {
        return [];
    }
    if (!clip(dLon, bounds.east - lon0)) {
        return [];
    }
    if (!clip(-dLat, lat0 - bounds.south)) {
        return [];
    }
    if (!clip(dLat, bounds.north - lat0)) {
        return [];
    }

    if (t1 - t0 < UV_EPS) {
        return [];
    }
    return [[
        { lon: lon0 + t0 * dLon, lat: lat0 + t0 * dLat },
        { lon: lon0 + t1 * dLon, lat: lat0 + t1 * dLat },
    ]];
}
