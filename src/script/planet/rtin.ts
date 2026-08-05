/**
 * Martini-style restricted triangulated irregular network (RTIN).
 *
 * Pure: no THREE, no DOM. Takes a (2^k+1)² height grid and a max geometric
 * error in the same units, returns a crack-free TIN. A perfectly flat tile
 * collapses to two triangles.
 *
 * Port of mapbox/martini (ISC license).
 */

export interface RtinMesh {
    /** Packed grid coordinates: [x0, y0, x1, y1, ...] in tile sample space. */
    vertices: Uint16Array;
    /** Triangle indices into `vertices` (triplets). */
    triangles: Uint32Array;
    triangleCount: number;
}

/**
 * Precomputed binary-triangle-tree hypotenuses for a given grid size.
 * Shared across tiles of the same size.
 */
export class RtinIndex {
    readonly size: number;
    readonly numTriangles: number;
    readonly numParentTriangles: number;
    /** Packed ax,ay,bx,by per triangle. */
    readonly coords: Uint16Array;
    /** Scratch index grid reused by extractMesh. */
    readonly indices: Uint32Array;

    constructor(size: number) {
        const tileSize = size - 1;
        if (tileSize & (tileSize - 1)) {
            throw new Error(`RTIN size must be 2^k+1 (got ${size})`);
        }
        this.size = size;
        this.numTriangles = tileSize * tileSize * 2 - 2;
        this.numParentTriangles = this.numTriangles - tileSize * tileSize;
        this.coords = new Uint16Array(this.numTriangles * 4);
        this.indices = new Uint32Array(size * size);

        for (let i = 0; i < this.numTriangles; i++) {
            let id = i + 2;
            let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;
            if (id & 1) {
                bx = by = cx = tileSize;
            } else {
                ax = ay = cy = tileSize;
            }
            while ((id >>= 1) > 1) {
                const mx = (ax + bx) >> 1;
                const my = (ay + by) >> 1;
                if (id & 1) {
                    bx = ax; by = ay;
                    ax = cx; ay = cy;
                } else {
                    ax = bx; ay = by;
                    bx = cx; by = cy;
                }
                cx = mx; cy = my;
            }
            const k = i * 4;
            this.coords[k] = ax;
            this.coords[k + 1] = ay;
            this.coords[k + 2] = bx;
            this.coords[k + 3] = by;
        }
    }
}

const indexCache = new Map<number, RtinIndex>();

export function getRtinIndex(size: number): RtinIndex {
    let idx = indexCache.get(size);
    if (!idx) {
        idx = new RtinIndex(size);
        indexCache.set(size, idx);
    }
    return idx;
}

function heightOrSea(heights: ArrayLike<number>, i: number): number {
    const h = heights[i];
    return Number.isFinite(h) ? h : 0;
}

/**
 * Build the error pyramid. `errors[i]` is the max vertical error of the
 * midpoint at linear index `i`, including all descendants.
 */
export function buildErrorPyramid(
    heights: ArrayLike<number>,
    size: number,
    index: RtinIndex = getRtinIndex(size),
): Float32Array {
    if (heights.length !== size * size) {
        throw new Error(`Expected ${size * size} heights, got ${heights.length}`);
    }
    const errors = new Float32Array(size * size);
    const { numTriangles, numParentTriangles, coords } = index;

    for (let i = numTriangles - 1; i >= 0; i--) {
        const k = i * 4;
        const ax = coords[k];
        const ay = coords[k + 1];
        const bx = coords[k + 2];
        const by = coords[k + 3];
        const mx = (ax + bx) >> 1;
        const my = (ay + by) >> 1;
        const cx = mx + my - ay;
        const cy = my + ax - mx;

        const interpolated = 0.5 * (
            heightOrSea(heights, ay * size + ax) + heightOrSea(heights, by * size + bx)
        );
        const middleIndex = my * size + mx;
        let err = Math.abs(interpolated - heightOrSea(heights, middleIndex));

        if (i < numParentTriangles) {
            const left = ((ay + cy) >> 1) * size + ((ax + cx) >> 1);
            const right = ((by + cy) >> 1) * size + ((bx + cx) >> 1);
            err = Math.max(err, errors[left], errors[right]);
        }
        if (err > errors[middleIndex]) {
            errors[middleIndex] = err;
        }
    }
    return errors;
}

/**
 * Extract a TIN whose maximum vertical error is ≤ `maxError`.
 * When `maxError` ≤ 0 every grid cell is emitted (full res).
 */
export function extractMesh(
    errors: Float32Array,
    size: number,
    maxError: number,
    index: RtinIndex = getRtinIndex(size),
): RtinMesh {
    const indices = index.indices;
    indices.fill(0);
    const max = size - 1;
    const threshold = Math.max(0, maxError);
    let numVertices = 0;
    let numTriangles = 0;

    const countElements = (
        ax: number, ay: number,
        bx: number, by: number,
        cx: number, cy: number,
    ): void => {
        const mx = (ax + bx) >> 1;
        const my = (ay + by) >> 1;
        if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > threshold) {
            countElements(cx, cy, ax, ay, mx, my);
            countElements(bx, by, cx, cy, mx, my);
        } else {
            indices[ay * size + ax] = indices[ay * size + ax] || ++numVertices;
            indices[by * size + bx] = indices[by * size + bx] || ++numVertices;
            indices[cy * size + cx] = indices[cy * size + cx] || ++numVertices;
            numTriangles += 1;
        }
    };
    countElements(0, 0, max, max, max, 0);
    countElements(max, max, 0, 0, 0, max);

    const vertices = new Uint16Array(numVertices * 2);
    const triangles = new Uint32Array(numTriangles * 3);
    let triIndex = 0;

    const processTriangle = (
        ax: number, ay: number,
        bx: number, by: number,
        cx: number, cy: number,
    ): void => {
        const mx = (ax + bx) >> 1;
        const my = (ay + by) >> 1;
        if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > threshold) {
            processTriangle(cx, cy, ax, ay, mx, my);
            processTriangle(bx, by, cx, cy, mx, my);
        } else {
            const a = indices[ay * size + ax] - 1;
            const b = indices[by * size + bx] - 1;
            const c = indices[cy * size + cx] - 1;
            vertices[2 * a] = ax;
            vertices[2 * a + 1] = ay;
            vertices[2 * b] = bx;
            vertices[2 * b + 1] = by;
            vertices[2 * c] = cx;
            vertices[2 * c + 1] = cy;
            triangles[triIndex++] = a;
            triangles[triIndex++] = b;
            triangles[triIndex++] = c;
        }
    };
    processTriangle(0, 0, max, max, max, 0);
    processTriangle(max, max, 0, 0, 0, max);

    return { vertices, triangles, triangleCount: numTriangles };
}

/** Build errors + extract in one call. */
export function triangulate(
    heights: ArrayLike<number>,
    size: number,
    maxError: number,
): RtinMesh {
    const index = getRtinIndex(size);
    return extractMesh(buildErrorPyramid(heights, size, index), size, maxError, index);
}
