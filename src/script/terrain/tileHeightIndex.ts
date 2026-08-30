/**
 * Height queries against the terrain geometry that is actually drawn.
 *
 * The DEM sampler in HeightField and the baked mesh are two different
 * surfaces. The DEM's finest tier is the manifest's `height.queryZoom` (11 for
 * the shipped bake) sampled bilinearly, while the mesh is baked one level
 * deeper at z=12 and decimated with its own vertical tolerance. Between two
 * DEM posts — ~38 m apart at z=11 — the drawn mesh can carry a crest the
 * bilinear query flattens away, so the drawn ground routinely sits metres
 * above what `heightAtWorld` reports, and further still wherever a coarser
 * tile is on screen.
 *
 * That gap does not matter to physics, which wants one LOD-independent
 * surface. It matters to anything that has to sit *on* the ground and survive
 * a depth test — the aircraft's planform shadow above all — because a decal
 * placed against the DEM sinks under the mesh and gets clipped along terrain
 * triangle edges.
 *
 * A tile is at most `triangleBudget` triangles (6144 in the shipped bake), so
 * a brute-force scan per query is out. Each queried tile gets a uniform bucket
 * grid over its plan-view extent instead, built lazily: only the one or two
 * tiles under an aircraft are ever indexed, and the index is dropped when that
 * tile stops being drawn.
 */

import * as THREE from 'three';

/** Target triangles per bucket; sets the grid resolution. */
const TRIANGLES_PER_CELL = 4;
/**
 * Barycentric slack on the containment test. A query landing exactly on an
 * edge shared by two triangles must be claimed by at least one of them, and
 * float noise in the world -> local map is enough to have both reject it.
 * Overlapping instead is harmless: the query keeps the highest hit.
 */
const EDGE_TOLERANCE = 1e-6;
const MIN_GRID = 1;
const MAX_GRID = 64;

/**
 * Plan-view bucket grid over one tile's land triangles.
 *
 * Everything is kept in the tile's own quantised local units. The tile
 * transform is a rotation plus a uniform scale plus a translation, so a world
 * query maps into local space exactly and the triangle test runs on the raw
 * int16 positions with no per-vertex transform at all.
 */
export class TileHeightIndex {

    private readonly positions: THREE.TypedArray;
    private readonly triangleCount: number;
    private readonly minX: number;
    private readonly minZ: number;
    private readonly invCellX: number;
    private readonly invCellZ: number;
    private readonly grid: number;
    /** Start offset into `cellTriangles` per cell, length grid*grid + 1. */
    private readonly cellStart: Int32Array;
    private readonly cellTriangles: Int32Array;

    private readonly origin = new THREE.Vector3();
    private readonly rotation = new THREE.Quaternion();
    private readonly inverseRotation = new THREE.Quaternion();
    private readonly scale: number;

    private readonly _local = new THREE.Vector3();

    constructor(mesh: THREE.Mesh, group: THREE.Object3D) {
        const attr = mesh.geometry.getAttribute('position');
        this.positions = attr.array;
        // Land geometry is non-indexed: triangles are consecutive triples.
        this.triangleCount = Math.floor(attr.count / 3);

        this.origin.copy(group.position);
        this.rotation.copy(group.quaternion);
        this.inverseRotation.copy(group.quaternion).invert();
        this.scale = group.scale.x;

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < attr.count; i++) {
            const x = this.positions[i * 3];
            const z = this.positions[i * 3 + 2];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
        this.minX = minX;
        this.minZ = minZ;

        this.grid = Math.min(MAX_GRID, Math.max(MIN_GRID,
            Math.round(Math.sqrt(this.triangleCount / TRIANGLES_PER_CELL))));
        // A degenerate extent would divide by zero; one cell covers it.
        const spanX = maxX > minX ? maxX - minX : 1;
        const spanZ = maxZ > minZ ? maxZ - minZ : 1;
        this.invCellX = this.grid / spanX;
        this.invCellZ = this.grid / spanZ;

        // Counting pass then fill pass, so the buckets land in two flat arrays
        // instead of an array of arrays per tile.
        const cells = this.grid * this.grid;
        const counts = new Int32Array(cells + 1);
        this.forEachTriangleCell((cell) => { counts[cell + 1]++; });
        for (let c = 0; c < cells; c++) {
            counts[c + 1] += counts[c];
        }
        this.cellStart = counts;
        this.cellTriangles = new Int32Array(counts[cells]);
        const cursor = new Int32Array(cells);
        this.forEachTriangleCell((cell, tri) => {
            this.cellTriangles[this.cellStart[cell] + cursor[cell]++] = tri;
        });
    }

    /** Bytes held by the index, for the caller's budget. */
    get bytes(): number {
        return this.cellStart.byteLength + this.cellTriangles.byteLength;
    }

    /**
     * Drawn ground height at a scene point, or undefined when the point falls
     * outside this tile's land triangles — its neighbour owns it, or it is a
     * hole cut for water.
     */
    heightAtWorld(x: number, z: number): number | undefined {
        // World -> local. The rotation is identity whenever the session flies
        // in the area the bake was centred on, and a fraction of a degree
        // otherwise, so treating local XZ containment as plan-view containment
        // is exact in practice.
        this._local.set(x - this.origin.x, 0, z - this.origin.z)
            .applyQuaternion(this.inverseRotation)
            .divideScalar(this.scale);
        const lx = this._local.x;
        const lz = this._local.z;

        // One cell of slack, then clamp. A point on the tile's far edge maps
        // to cell `grid` and float noise puts a point on the near edge at -1;
        // both are inside the tile and must not be thrown away. Containment is
        // the triangle test's job, not the bucket lookup's, so anything that
        // survives the slack check is safe to clamp into a border cell.
        const fx = (lx - this.minX) * this.invCellX;
        const fz = (lz - this.minZ) * this.invCellZ;
        if (fx < -1 || fz < -1 || fx > this.grid + 1 || fz > this.grid + 1) {
            return undefined;
        }

        const cell = this.clampCell(fz) * this.grid + this.clampCell(fx);
        const end = this.cellStart[cell + 1];
        let bestY: number | undefined;
        for (let i = this.cellStart[cell]; i < end; i++) {
            const y = this.triangleHeightAt(this.cellTriangles[i], lx, lz);
            // Skirts hang below the tile rim and overlap it in plan view; the
            // highest hit is the top surface.
            if (y !== undefined && (bestY === undefined || y > bestY)) {
                bestY = y;
            }
        }
        if (bestY === undefined) {
            return undefined;
        }

        this._local.set(lx, bestY, lz)
            .multiplyScalar(this.scale)
            .applyQuaternion(this.rotation);
        return this._local.y + this.origin.y;
    }

    /** Local height of triangle `tri` at (lx, lz), or undefined if outside it. */
    private triangleHeightAt(tri: number, lx: number, lz: number): number | undefined {
        const p = this.positions;
        const a = tri * 9;
        const ax = p[a], ay = p[a + 1], az = p[a + 2];
        const bx = p[a + 3], by = p[a + 4], bz = p[a + 5];
        const cx = p[a + 6], cy = p[a + 7], cz = p[a + 8];

        const v0x = bx - ax, v0z = bz - az;
        const v1x = cx - ax, v1z = cz - az;
        const den = v0x * v1z - v1x * v0z;
        if (den === 0) {
            return undefined;   // vertical skirt quad: no plan-view area
        }
        const rx = lx - ax, rz = lz - az;
        const u = (rx * v1z - v1x * rz) / den;
        const v = (v0x * rz - rx * v0z) / den;
        if (u < -EDGE_TOLERANCE || v < -EDGE_TOLERANCE || u + v > 1 + EDGE_TOLERANCE) {
            return undefined;
        }
        return ay + u * (by - ay) + v * (cy - ay);
    }

    /** Visits every (cell, triangle) pair the triangles' plan-view boxes cover. */
    private forEachTriangleCell(visit: (cell: number, tri: number) => void): void {
        const p = this.positions;
        for (let tri = 0; tri < this.triangleCount; tri++) {
            const a = tri * 9;
            const x0 = p[a], z0 = p[a + 2];
            const x1 = p[a + 3], z1 = p[a + 5];
            const x2 = p[a + 6], z2 = p[a + 8];
            const loX = Math.min(x0, x1, x2), hiX = Math.max(x0, x1, x2);
            const loZ = Math.min(z0, z1, z2), hiZ = Math.max(z0, z1, z2);

            const cx0 = this.clampCell((loX - this.minX) * this.invCellX);
            const cx1 = this.clampCell((hiX - this.minX) * this.invCellX);
            const cz0 = this.clampCell((loZ - this.minZ) * this.invCellZ);
            const cz1 = this.clampCell((hiZ - this.minZ) * this.invCellZ);
            for (let cz = cz0; cz <= cz1; cz++) {
                for (let cx = cx0; cx <= cx1; cx++) {
                    visit(cz * this.grid + cx, tri);
                }
            }
        }
    }

    private clampCell(v: number): number {
        const i = Math.floor(v);
        return i < 0 ? 0 : (i >= this.grid ? this.grid - 1 : i);
    }
}
