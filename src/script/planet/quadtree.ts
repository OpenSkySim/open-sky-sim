/**
 * Whole-Earth geographic quadtree driven by screen-space error.
 *
 * A parent stays drawn until all four children have meshes, so refinement
 * never punches holes. Traversal is amortised; the caller decides when to
 * call {@link update}.
 */

import * as THREE from 'three';
import { behindHorizon, sphereInFrustum } from './culling';
import { CoastStore } from './coastStore';
import { CoastPolygon } from './coastVector';
import { DemStore } from './demStore';
import { EnuBasis, EnuFrame, geodeticToEcef, ecefToEnu } from './geodesy';
import {
    FETCHES_PER_FRAME, MESH_CREATES_PER_FRAME, COAST_SSE_BIAS, ellipsoidSagittaM,
    shouldRefine, shouldRefineCoast, terrainMaxZoomForAltitudeM, terrainViewRangeM,
} from './lod';
import { MeshBuildResult } from './meshBuilder';
import { MeshPool } from './meshPool';
import { PlanetManifest } from './manifest';
import { FlattenPadSpec } from './flattenPad';
import { refreshNodeCoastal } from './coast';
import {
    TileKey, approxTileEdgeMetres, childrenOf, parseTileKey, rootTiles, tileBounds,
    tileKeyString, tileRangeForBounds, LonLatBounds, boundsOverlap,
} from './tiling';

export interface QuadNode {
    id: TileKey;
    key: string;
    children: QuadNode[] | undefined;
    /** Built mesh payload; undefined until ready. */
    mesh: MeshBuildResult | undefined;
    /** THREE mesh attached to the scene graph (owned by PlanetTerrainEntity). */
    object: THREE.Mesh | undefined;
    /** Last traversal generation that touched this node. */
    generation: number;
    /** DEM fetch / mesh build in flight. */
    loading: boolean;
    /** Geometric error used for SSE (metres). */
    geometricErrorM: number;
    /** World-space bounding sphere (ENU). */
    center: THREE.Vector3;
    radius: number;
    /** True when no DEM tile exists — ellipsoid stub. */
    ocean: boolean;
    /** Mixed land/water in the DEM (or adjacent to such a tile). */
    coastal: boolean;
}

export interface QuadtreeOptions {
    maxZoom?: number;
    sseTargetPx?: number;
}

export interface TraversalStats {
    visited: number;
    drawn: number;
    fetches: number;
    builds: number;
    triangles: number;
}

export class PlanetQuadtree {
    private readonly roots: QuadNode[];
    private generation = 0;
    private readonly pendingDraw = new Set<string>();
    private pad: FlattenPadSpec | undefined;
    private padHeightMsl: number | undefined;
    /** Pinned keys that must stay meshed (play-area seeds). */
    readonly pinned = new Set<string>();
    private readonly maxZoom: number;

    private readonly _frustum = new THREE.Frustum();
    private readonly _projScreen = new THREE.Matrix4();
    private readonly _earthCenter = new THREE.Vector3();
    private readonly _camWorld = new THREE.Vector3();
    private readonly _tmp = new THREE.Vector3();

    constructor(
        private readonly store: DemStore,
        private readonly pool: MeshPool,
        private readonly frame: EnuFrame,
        private readonly manifest: PlanetManifest,
        private readonly coastStore: CoastStore | undefined = undefined,
        options: QuadtreeOptions = {},
    ) {
        this.maxZoom = options.maxZoom ?? manifest.maxZoom;
        // Earth centre in ENU: ECEF origin expressed in the local tangent frame.
        const enu = ecefToEnu(this.frame.basis, { x: 0, y: 0, z: 0 });
        this._earthCenter.set(enu.e, enu.u, enu.n);

        this.roots = rootTiles().map(id => this.makeNode(id));
    }

    get basis(): EnuBasis {
        return this.frame.basis;
    }

    setPad(spec: FlattenPadSpec | undefined, heightMsl?: number): void {
        this.pad = spec;
        this.padHeightMsl = heightMsl;
    }

    /**
     * Nodes that should currently be drawn. A parent stays in the list until
     * all four children have meshes, so refinement never punches holes or
     * double-draws overlapping LODs.
     */
    collectDrawList(out: QuadNode[] = []): QuadNode[] {
        out.length = 0;
        const walk = (node: QuadNode): boolean => {
            if (node.children
                && node.children.length === 4
                && node.children.every(c => c.mesh && c.object)) {
                let covered = true;
                for (const c of node.children) {
                    if (!walk(c)) {
                        covered = false;
                    }
                }
                return covered;
            }
            if (node.mesh && node.object) {
                out.push(node);
                return true;
            }
            return false;
        };
        for (const r of this.roots) {
            walk(r);
        }
        return out;
    }

    find(id: TileKey): QuadNode | undefined {
        const walk = (node: QuadNode): QuadNode | undefined => {
            if (node.id.z === id.z && node.id.x === id.x && node.id.y === id.y) {
                return node;
            }
            if (!node.children || node.id.z >= id.z) {
                return undefined;
            }
            for (const c of node.children) {
                const hit = walk(c);
                if (hit) {
                    return hit;
                }
            }
            return undefined;
        };
        for (const r of this.roots) {
            const hit = walk(r);
            if (hit) {
                return hit;
            }
        }
        return undefined;
    }

    /**
     * Ensure a node exists and kick off mesh build (used by seed / pad lock).
     * Returns the node.
     */
    forceMesh(id: TileKey): QuadNode {
        const node = this.ensureNode(id);
        if (!node.mesh && !node.loading) {
            this.startBuild(node, 1e9);
        }
        return node;
    }

    /** Count pinned tiles with finished mesh builds (success or failure). */
    pinnedMeshProgress(): { meshed: number; total: number; pending: number } {
        let meshed = 0;
        let pending = 0;
        for (const key of this.pinned) {
            const node = this.find(parseTileKey(key));
            if (!node) {
                continue;
            }
            if (node.mesh) {
                meshed++;
            } else if (node.loading) {
                pending++;
            }
        }
        return { meshed, total: this.pinned.size, pending };
    }

    /** Block until every pinned tile finishes its mesh build. */
    async waitForPinnedMeshes(
        onProgress?: (meshed: number, total: number) => void,
    ): Promise<void> {
        while (true) {
            const { meshed, total, pending } = this.pinnedMeshProgress();
            onProgress?.(meshed, total);
            if (pending === 0) {
                break;
            }
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
    }

    /** True while any quadtree node still has a mesh build in flight. */
    hasLoadingMeshes(): boolean {
        const walk = (node: QuadNode): boolean => {
            if (node.loading) {
                return true;
            }
            if (node.children) {
                for (const c of node.children) {
                    if (walk(c)) {
                        return true;
                    }
                }
            }
            return false;
        };
        for (const r of this.roots) {
            if (walk(r)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Traverse and refine around the camera. Returns stats for diagnostics.
     */
    update(
        camera: THREE.Camera,
        screenHeightPx: number,
        fovYDeg: number,
        detailScale: number,
    ): TraversalStats {
        this.generation += 1;
        const gen = this.generation;
        const stats: TraversalStats = { visited: 0, drawn: 0, fetches: 0, builds: 0, triangles: 0 };

        this._projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this._frustum.setFromProjectionMatrix(this._projScreen);
        camera.getWorldPosition(this._camWorld);

        const altitudeM = Math.max(0, this._camWorld.y);
        const viewRange = terrainViewRangeM(altitudeM);

        let fetches = 0;
        let builds = 0;

        const visit = (node: QuadNode): void => {
            stats.visited += 1;
            node.generation = gen;
            refreshNodeCoastal(node, this.store, this.manifest.seaLevel);

            if (!sphereInFrustum(node.center, node.radius, this._frustum)) {
                return;
            }
            if (behindHorizon(node.center, node.radius, this._camWorld, this._earthCenter)) {
                return;
            }

            const dist = this._camWorld.distanceTo(node.center) - node.radius;
            if (dist > viewRange) {
                // Still ensure a coarse mesh so the limb doesn't vanish.
                if (!node.mesh && !node.loading && node.id.z <= 2 && builds < MESH_CREATES_PER_FRAME) {
                    this.startBuild(node, dist);
                    builds += 1;
                }
                return;
            }

            const zoomCap = terrainMaxZoomForAltitudeM(altitudeM, this.maxZoom, node.coastal);
            const coastScale = node.coastal ? detailScale * COAST_SSE_BIAS : detailScale;
            const refine = node.id.z < zoomCap
                && (shouldRefine(
                    node.geometricErrorM, Math.max(1, dist), screenHeightPx, fovYDeg, coastScale,
                )
                    || shouldRefineCoast(
                        node.coastal, node.id.z, Math.max(1, dist), zoomCap, this.maxZoom,
                    ));

            if (refine) {
                if (!node.children) {
                    node.children = childrenOf(node.id).map(id => this.makeNode(id));
                }
                for (const c of node.children) {
                    // Prefetch DEM for children.
                    if (!c.mesh && !c.loading && !c.ocean) {
                        if (fetches < FETCHES_PER_FRAME && this.store.mayExist(c.id) && !this.store.getCached(c.id)) {
                            this.store.request(c.id, 1 / Math.max(1, dist));
                            fetches += 1;
                        }
                    }
                    visit(c);
                }
                // Ensure children are building toward a full replacement.
                let ready = 0;
                for (const c of node.children) {
                    if (c.mesh) {
                        ready += 1;
                    } else if (!c.loading && builds < MESH_CREATES_PER_FRAME) {
                        this.startBuild(c, dist);
                        builds += 1;
                    }
                }
                if (ready === 4) {
                    return;
                }
            }

            // Draw this node (or kick off its mesh).
            if (!node.mesh && !node.loading && builds < MESH_CREATES_PER_FRAME) {
                this.startBuild(node, dist);
                builds += 1;
            }
        };

        for (const r of this.roots) {
            visit(r);
        }

        stats.fetches = fetches;
        stats.builds = builds;
        return stats;
    }

    /** Drop meshes of nodes not visited for `maxAge` generations (unless pinned). */
    evict(maxAge: number = 8): QuadNode[] {
        const disposed: QuadNode[] = [];
        const gen = this.generation;
        const walk = (node: QuadNode, parent?: QuadNode): void => {
            if (node.children) {
                for (const c of node.children) {
                    walk(c, node);
                }
                // Collapse empty child arrays.
                if (node.children.every(c => !c.mesh && !c.loading && !c.children)) {
                    node.children = undefined;
                }
            }
            if (node.generation + maxAge < gen
                && !this.pinned.has(node.key)
                && node.mesh
                && node.id.z > 0) {
                disposed.push(node);
                node.mesh = undefined;
                node.loading = false;
                this.pool.cancel(node.id);
                if (parent && parent.children && parent.children.every(c => !c.mesh)) {
                    // Parent will be redrawn next pass.
                }
            }
        };
        for (const r of this.roots) {
            walk(r);
        }
        return disposed;
    }

    /** Prefetch DEM tiles covering a lon/lat AABB at every zoom up to max. */
    async prefetchBounds(bounds: LonLatBounds): Promise<void> {
        await this.store.loadIndex();
        const jobs: TileKey[] = [];
        for (let z = this.manifest.minZoom; z <= this.manifest.maxZoom; z++) {
            const { x0, y0, x1, y1 } = tileRangeForBounds(z, bounds);
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const id = { z, x, y };
                    if (!boundsOverlap(tileBounds(id), bounds)) {
                        continue;
                    }
                    if (this.store.mayExist(id)) {
                        jobs.push(id);
                    }
                }
            }
        }
        await this.store.prefetch(jobs, 10);
    }

    private ensureNode(id: TileKey): QuadNode {
        const rootX = id.x >> id.z;
        let node = this.roots.find(r => r.id.x === rootX) ?? this.roots[0];
        while (node.id.z < id.z) {
            if (!node.children) {
                node.children = childrenOf(node.id).map(cid => this.makeNode(cid));
            }
            const shift = id.z - node.id.z - 1;
            const childX = id.x >> shift;
            const childY = id.y >> shift;
            const next = node.children.find(c => c.id.x === childX && c.id.y === childY);
            if (!next) {
                break;
            }
            node = next;
        }
        return node;
    }

    private makeNode(id: TileKey): QuadNode {
        const bounds = tileBounds(id);
        const midLon = 0.5 * (bounds.west + bounds.east);
        const midLat = 0.5 * (bounds.south + bounds.north);
        const ecef = geodeticToEcef(midLat, midLon, this.manifest.seaLevel);
        const enu = ecefToEnu(this.frame.basis, ecef);
        const edge = approxTileEdgeMetres(id);
        const demErr = this.manifest.levelGeometricErrorM[id.z] ?? 0;
        const ocean = !this.store.mayExist(id);
        const geometricErrorM = ocean
            ? Math.max(ellipsoidSagittaM(id), demErr)
            : Math.max(demErr, ellipsoidSagittaM(id) * 0.25);
        return {
            id,
            key: tileKeyString(id),
            children: undefined,
            mesh: undefined,
            object: undefined,
            generation: 0,
            loading: false,
            geometricErrorM,
            center: new THREE.Vector3(enu.e, enu.u, enu.n),
            radius: edge * 0.75,
            ocean,
            coastal: false,
        };
    }

    private startBuild(node: QuadNode, priorityDist: number): void {
        if (node.loading || node.mesh) {
            return;
        }
        node.loading = true;
        const id = node.id;

        const finish = (result: MeshBuildResult | null) => {
            node.loading = false;
            if (!result) {
                return;
            }
            node.mesh = result;
            node.center.set(result.centerE, result.centerU, result.centerN);
            node.radius = result.boundingRadius;
            refreshNodeCoastal(node, this.store, this.manifest.seaLevel);
            this.pendingDraw.add(node.key);
        };

        if (node.ocean || !this.store.mayExist(id)) {
            node.ocean = true;
            this.pool.request({
                id,
                heights: null,
                size: this.manifest.tileSize,
                geometricErrorM: node.geometricErrorM,
                maxErrorM: node.geometricErrorM,
                seaLevel: this.manifest.seaLevel,
                basis: this.frame.basis,
            }).then(finish);
            return;
        }

        const cached = this.store.getCached(id);
        if (cached) {
            this.dispatchMeshBuild(node, cached.heights.slice(), cached.size,
                cached.geometricErrorM || node.geometricErrorM, finish);
            return;
        }

        this.store.request(id, 1 / Math.max(1, priorityDist)).then(tile => {
            if (!tile) {
                node.ocean = true;
                this.pool.request({
                    id,
                    heights: null,
                    size: this.manifest.tileSize,
                    geometricErrorM: node.geometricErrorM,
                    maxErrorM: node.geometricErrorM,
                    seaLevel: this.manifest.seaLevel,
                    basis: this.frame.basis,
                }).then(finish);
                return;
            }
            this.dispatchMeshBuild(node, tile.heights.slice(), tile.size,
                tile.geometricErrorM || node.geometricErrorM, finish);
        }).catch(() => {
            node.loading = false;
        });
    }

    private dispatchMeshBuild(
        node: QuadNode,
        heights: Float32Array,
        size: number,
        geometricErrorM: number,
        finish: (result: MeshBuildResult | null) => void,
    ): void {
        const id = node.id;
        const coastTile = this.coastStore?.getCached(id);
        const build = (landMask?: Uint8Array, polygons?: CoastPolygon[]) => {
            this.pool.request({
                id,
                heights,
                size,
                geometricErrorM,
                maxErrorM: rtinErrorForZoom(id.z, node.geometricErrorM),
                seaLevel: this.manifest.seaLevel,
                basis: this.frame.basis,
                pad: this.pad,
                padHeightMsl: this.padHeightMsl,
                landMask,
                polygons,
            }).then(finish);
        };
        if (coastTile?.cells) {
            build(coastTile.cells.slice(), coastTile.vector?.polygons);
            return;
        }
        if (!this.coastStore?.enabled) {
            build(undefined);
            return;
        }
        this.coastStore.request(id, 1).then(tile => {
            build(tile?.cells.slice(), tile?.vector?.polygons);
        }).catch(() => build(undefined));
    }

    consumePendingDraw(): string[] {
        const keys = [...this.pendingDraw];
        this.pendingDraw.clear();
        return keys;
    }
}

/**
 * RTIN max error for a tile at zoom z. At the finest DEM level we allow a
 * small absolute tolerance so perfectly flat regions still collapse; coarser
 * levels use a fraction of the level geometric error so the TIN tracks the
 * decimated heights without over-tessellating.
 */
function rtinErrorForZoom(z: number, levelErrorM: number): number {
    if (levelErrorM <= 0) {
        return 1; // metres — flat / native tiles collapse aggressively
    }
    return Math.max(1, levelErrorM * 0.5);
}
