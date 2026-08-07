/**
 * Vector-cut quadtree tile mesh via Constrained Delaunay Triangulation.
 *
 * Coastal tiles slice RTIN height samples along OSM coastline segments so the
 * shoreline follows vector geometry instead of a sawtooth height-grid edge.
 */

import cdt2d from 'cdt2d';
import { CoastPolygon, isLandLonLat } from './coastVector';
import { buildErrorPyramid, extractMesh, getRtinIndex, RtinMesh } from './rtin';
import { coastErrorBoost, isWaterHeight } from './meshBuilder';
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
    /** Packed grid coords [x0, y0, x1, y1, …] in tile sample space. */
    vertices: Uint16Array;
    triangles: Uint32Array;
    triangleCount: number;
    /** 1 = land, 0 = water per triangle. */
    triangleLand: Uint8Array;
}

const UV_EPS = 1e-9;
const GRID_SNAP = 1e-4;

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

    // Tile boundary grid pins (seam-stable with neighbours).
    for (let i = 0; i < size; i++) {
        addPoint(0, i);
        addPoint(max, i);
        addPoint(i, 0);
        addPoint(i, max);
    }

    // RTIN interior + coast-boosted height samples.
    const rtin = buildRtinSamples(heights, size, seaLevel, maxErrorM);
    for (let i = 0; i < rtin.vertices.length; i += 2) {
        addPoint(rtin.vertices[i], rtin.vertices[i + 1]);
    }

    // Coastline constraint segments clipped to the tile.
    const coastEdges: [number, number][] = [];
    const segmentCount = collectCoastSegments(polygons, bounds, toGrid, (ax, ay, bx, by) => {
        const ia = addPoint(ax, ay);
        const ib = addPoint(bx, by);
        if (ia !== ib) {
            coastEdges.push([ia, ib]);
        }
    });

    if (segmentCount === 0) {
        return undefined;
    }

    // Closed tile boundary loop (constrained) for a watertight domain.
    const boundaryEdges = buildBoundaryLoop(points, indexOf, max, addPoint);

    const allEdges = [...boundaryEdges, ...coastEdges];
    let cells: number[][];
    try {
        cells = cdt2d(points, allEdges) as number[][];
    } catch {
        return undefined;
    }
    if (!cells || cells.length === 0) {
        return undefined;
    }

    const tile = { polygons };
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
        vertices: new Uint16Array(outVerts),
        triangles: new Uint32Array(outTris),
        triangleCount: cells.length,
        triangleLand,
    };
}

function buildRtinSamples(
    heights: Float32Array,
    size: number,
    seaLevel: number,
    maxErrorM: number,
): RtinMesh {
    const index = getRtinIndex(size);
    const errors = buildErrorPyramid(heights, size, index);
    boostCoastErrorsForRtin(heights, errors, size, seaLevel, coastErrorBoost(maxErrorM), index);
    return extractMesh(errors, size, maxErrorM, index);
}

/** Local copy — avoids circular import from meshBuilder. */
function boostCoastErrorsForRtin(
    heights: ArrayLike<number>,
    errors: Float32Array,
    size: number,
    seaLevel: number,
    boost: number,
    index: ReturnType<typeof getRtinIndex>,
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

/** Walk each tile edge CCW, connecting consecutive boundary pins. */
function buildBoundaryLoop(
    points: [number, number][],
    indexOf: Map<string, number>,
    max: number,
    addPoint: (x: number, y: number) => number,
): [number, number][] {
    const snap = GRID_SNAP;
    const onEdge = (x: number, y: number, edge: 'w' | 'e' | 's' | 'n'): boolean => {
        if (edge === 'w') {
            return Math.abs(x) < snap && y >= -snap && y <= max + snap;
        }
        if (edge === 'e') {
            return Math.abs(x - max) < snap && y >= -snap && y <= max + snap;
        }
        if (edge === 'n') {
            return Math.abs(y) < snap && x >= -snap && x <= max + snap;
        }
        return Math.abs(y - max) < snap && x >= -snap && x <= max + snap;
    };

    const edgePoints = (edge: 'w' | 'e' | 's' | 'n'): number[] => {
        const out: { t: number; idx: number }[] = [];
        for (let i = 0; i < points.length; i++) {
            const [x, y] = points[i];
            if (!onEdge(x, y, edge)) {
                continue;
            }
            let t = 0;
            if (edge === 'w' || edge === 'e') {
                t = y;
            } else if (edge === 'n') {
                t = x;
            } else {
                t = max - x;
            }
            out.push({ t, idx: i });
        }
        out.sort((a, b) => a.t - b.t);
        return out.map(o => o.idx);
    };

    // CCW: west ↑, north →, east ↓, south ←
    const west = edgePoints('w');
    const north = edgePoints('n');
    const east = edgePoints('e').reverse();
    const south = edgePoints('s').reverse();
    const loop = [...west, ...north, ...east, ...south];

    // Ensure corners exist.
    addPoint(0, 0);
    addPoint(max, 0);
    addPoint(max, max);
    addPoint(0, max);

    const edges: [number, number][] = [];
    for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        if (a !== b) {
            edges.push([a, b]);
        }
    }
    return edges;
}

type SegmentSink = (ax: number, ay: number, bx: number, by: number) => void;

/** Clip polygon ring edges to tile bounds; emit each visible sub-segment. */
function collectCoastSegments(
    polygons: CoastPolygon[],
    bounds: LonLatBounds,
    toGrid: (lon: number, lat: number) => [number, number],
    sink: SegmentSink,
): number {
    let count = 0;
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
                    sink(ax, ay, bx, by);
                    count += 1;
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
    return count;
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
