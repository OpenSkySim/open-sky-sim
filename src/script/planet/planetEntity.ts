/**
 * Global geographic DEM / ocean terrain entity.
 * Refines a whole-Earth QT around the camera; meshes are ECEF→ENU.
 */

import * as THREE from 'three';
import { Palette, PaletteCategory } from '../config/palettes/palette';
import { COCKPIT_FOV } from '../defs';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { attachToRenderList } from '../render/renderList';
import { Entity, ENTITY_TAGS } from '../scene/entity';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../scene/materials/materials';
import { Scene, SceneLayers } from '../scene/scene';
import { updateUniforms } from '../scene/utils';
import {
    clearTerrainMaterialTracking, isTerrainWireframe, publishTerrainStats,
    trackTerrainMaterial,
} from './debug';
import { DemStore } from './demStore';
import { CoastStore } from './coastStore';
import { FlattenPadSpec, padLonLatBounds } from './flattenPad';
import { EnuFrame, enuToGeodeticApprox, makeEnuBasis } from './geodesy';
import { HeightQuery } from './heightQuery';
import {
    RECONCILE_INTERVAL_MS, TARGET_FRAME_MS, MESH_CREATES_PER_FRAME, adjustDetailScale,
} from './lod';
import { PlanetManifest } from './manifest';
import { TerrainTone, TONE_COUNT } from './meshBuilder';
import { MeshPool } from './meshPool';
import { PlanetQuadtree, QuadNode } from './quadtree';
import {
    LonLatBounds, TileKey, boundsOverlap, parseTileKey, tileBounds, tileKeyString, tileRangeForBounds,
} from './tiling';

export type TerrainMode = 'planet' | 'legacy';

export function resolveTerrainMode(
    search: string = typeof location !== 'undefined' ? location.search : '',
): TerrainMode {
    const q = new URLSearchParams(search);
    const v = q.get('terrain');
    if (v === 'legacy') {
        return 'legacy';
    }
    return 'planet';
}

export interface PlanetTerrainOptions {
    baseUrl?: string;
    maxZoom?: number;
    /** Override ENU origin (degrees). Defaults to manifest centroid. */
    enuOrigin?: { lat: number; lon: number; height?: number };
}

const TONE_CATEGORIES: readonly PaletteCategory[] = [
    PaletteCategory.TERRAIN_WATER,
    PaletteCategory.TERRAIN_SHALLOW_WATER,
    PaletteCategory.TERRAIN_SAND,
    PaletteCategory.TERRAIN_GRASS,
    PaletteCategory.TERRAIN_BARE,
];

export class PlanetTerrainEntity implements Entity {
    readonly tags: string[] = [ENTITY_TAGS.GROUND];
    enabled = true;

    readonly frame: EnuFrame;
    readonly manifest: PlanetManifest;
    /** Back-compat alias used by Game (`planetTerrain.dem.manifest`). */
    readonly dem: { manifest: PlanetManifest };

    private readonly store: DemStore;
    private readonly coastStore: CoastStore;
    private readonly pool: MeshPool;
    private readonly qt: PlanetQuadtree;
    private readonly query: HeightQuery;
    private readonly group = new THREE.Group();
    private readonly materialsByTone: THREE.Material[];
    private readonly drawList: QuadNode[] = [];

    private detailScale = 1;
    private frameEmaMs = TARGET_FRAME_MS;
    private lastFrameStamp: number | undefined;
    private lastReconcileMs = -Infinity;

    constructor(
        manifest: PlanetManifest,
        materials: SceneMaterialManager,
        options: PlanetTerrainOptions = {},
    ) {
        this.manifest = manifest;
        this.dem = { manifest };
        const basis = options.enuOrigin
            ? makeEnuBasis(options.enuOrigin.lat, options.enuOrigin.lon, options.enuOrigin.height ?? 0)
            : makeEnuBasis(manifest.enuOrigin.lat, manifest.enuOrigin.lon, manifest.enuOrigin.height ?? 0);
        this.frame = new EnuFrame(basis);
        this.store = new DemStore(manifest, options.baseUrl ?? 'assets/planet');
        this.coastStore = new CoastStore(manifest, options.baseUrl ?? 'assets/planet');
        this.pool = new MeshPool();
        this.qt = new PlanetQuadtree(this.store, this.pool, this.frame, manifest, this.coastStore, {
            maxZoom: options.maxZoom ?? manifest.maxZoom,
        });
        this.query = new HeightQuery(this.store, basis, manifest);

        this.materialsByTone = TONE_CATEGORIES.map((category, tone) => {
            // Water stays a flat palette fill — no sun shade, no normal smoothing.
            const waterish = tone === TerrainTone.Water || tone === TerrainTone.ShallowWater;
            const mat = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category,
                depthWrite: true,
                ...(waterish
                    ? { shaded: false as const, highp: true }
                    : { shaded: true as const }),
            }) as THREE.ShaderMaterial;
            mat.side = THREE.DoubleSide;
            mat.polygonOffset = true;
            // Water/shallow pushed farther back than land so coplanar beach
            // edges resolve to land instead of sky sparkles.
            mat.polygonOffsetFactor = waterish ? 2 : 1;
            mat.polygonOffsetUnits = waterish ? 2 : 1;
            if (isTerrainWireframe()) {
                mat.wireframe = true;
            }
            trackTerrainMaterial(mat);
            return mat;
        });

        this.group.name = 'PlanetTerrain';
    }

    init(_scene: Scene): void {
        void this.store.loadIndex();
        void this.coastStore.loadIndex();
    }

    update(_delta: number): void {
        // LOD runs in render3D so it sees the live camera.
    }

    heightAtEnu(e: number, n: number): number {
        return this.query.heightAtEnu(e, n);
    }

    isLandEnu(e: number, n: number): boolean {
        return this.query.isLandEnu(e, n);
    }

    /** Load DEM tiles covering a radius around an ENU point. */
    async prefetchPlayArea(radiusM: number = 30000, centerE: number = 0, centerN: number = 0): Promise<void> {
        await this.store.loadIndex();
        await this.coastStore.loadIndex();
        await this.qt.prefetchBounds(this.radiusBounds(centerE, centerN, radiusM));
    }

    /** Block until all play-area pinned tiles have meshed. */
    async waitForPinnedMeshes(
        onProgress?: (meshed: number, total: number) => void,
    ): Promise<void> {
        await this.qt.waitForPinnedMeshes(onProgress);
    }

    /**
     * Attach ready meshes and reconcile the draw list so terrain is visible
     * before the first rendered frame (boot).
     */
    async primeForDisplay(
        camera: THREE.Camera,
        screenHeightPx: number,
        fovYDeg: number = COCKPIT_FOV,
    ): Promise<void> {
        this.attachReadyMeshes();
        const deadline = performance.now() + 30_000;
        while (performance.now() < deadline) {
            let stats;
            do {
                stats = this.qt.update(camera, screenHeightPx, fovYDeg, 1);
            } while (stats.builds >= MESH_CREATES_PER_FRAME);
            this.attachReadyMeshes();
            this.syncTerrainGroup();
            if (this.drawList.length > 0) {
                return;
            }
            if (!this.qt.hasLoadingMeshes() && this.pool.pending === 0) {
                this.syncTerrainGroup();
                return;
            }
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
    }

    /**
     * Pin + force-mesh tiles in a disk so spawn doesn't wait on the QT trickle.
     */
    seedPlayArea(
        centerE: number,
        centerN: number,
        radiusM: number = 30000,
        zoom?: number,
        _dense?: boolean,
    ): void {
        const bounds = this.radiusBounds(centerE, centerN, radiusM);
        const z = Math.max(0, Math.min(this.manifest.maxZoom, zoom ?? this.manifest.maxZoom));
        this.pinAndMesh(bounds, z);
    }

    /**
     * Lock the airbase flatten pad height from the DEM, remesh overlapping
     * tiles, then seed the play area.
     */
    lockAirbaseFlattenPad(
        spec: FlattenPadSpec,
        seedCenterE: number,
        seedCenterN: number,
        seedRadiusM: number,
        seedZoom?: number,
    ): void {
        const h = this.query.sampleMaxUnderPad(spec);
        const pad = { ...spec };
        this.query.configurePad(pad, h);
        this.qt.setPad(pad, h);
        // Remesh pad footprint at max zoom so the runway sits on a flat TIN.
        const padBounds = padLonLatBounds(spec, this.frame.basis);
        this.pinAndMesh(padBounds, this.manifest.maxZoom);
        this.seedPlayArea(seedCenterE, seedCenterN, seedRadiusM, seedZoom);
    }

    render3D(
        targetWidth: number,
        targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        const nowMs = performance.now();
        if (this.lastFrameStamp !== undefined) {
            const dt = nowMs - this.lastFrameStamp;
            this.frameEmaMs = this.frameEmaMs * 0.9 + dt * 0.1;
            this.detailScale = adjustDetailScale(this.detailScale, this.frameEmaMs);
        }
        this.lastFrameStamp = nowMs;

        const intervalMs = Math.max(RECONCILE_INTERVAL_MS, this.frameEmaMs * 4);
        if (nowMs - this.lastReconcileMs >= intervalMs) {
            this.lastReconcileMs = nowMs;
            const fov = ('fov' in camera && typeof (camera as THREE.PerspectiveCamera).fov === 'number')
                ? (camera as THREE.PerspectiveCamera).fov
                : COCKPIT_FOV;
            this.qt.update(camera, targetHeight, fov, this.detailScale);
            this.attachPendingMeshes();
            const disposed = this.qt.evict(10);
            for (const node of disposed) {
                this.disposeNodeObject(node);
            }
        } else {
            this.attachPendingMeshes();
        }

        this.syncTerrainGroup();

        const layer = lists.get(SceneLayers.Terrain);
        if (layer && this.group.children.length > 0) {
            attachToRenderList(layer, this.group);
        }

        let triangles = 0;
        for (const node of this.drawList) {
            triangles += node.mesh?.triangleCount ?? 0;
        }

        const altitudeM = camera.position.y;
        publishTerrainStats({
            drawn: this.drawList.length,
            triangles,
            cached: this.store.stats.cached,
            inflight: this.store.stats.inflight,
            queued: this.store.stats.queued,
            pendingMeshes: this.pool.pending,
            altitudeM: Math.round(altitudeM),
            detailScale: Number(this.detailScale.toFixed(2)),
            frameEmaMs: Number(this.frameEmaMs.toFixed(1)),
        });
        void targetWidth;
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        //
    }

    dispose(): void {
        this.pool.dispose();
        clearTerrainMaterialTracking();
        this.group.clear();
    }

    private radiusBounds(centerE: number, centerN: number, radiusM: number): LonLatBounds {
        const g = enuToGeodeticApprox(this.frame.basis, centerE, centerN, 0);
        const dLat = radiusM / 110540;
        const dLon = radiusM / (111320 * Math.max(0.2, Math.cos(g.lat * Math.PI / 180)));
        return {
            west: g.lon - dLon,
            east: g.lon + dLon,
            south: g.lat - dLat,
            north: g.lat + dLat,
        };
    }

    private pinAndMesh(bounds: LonLatBounds, z: number): void {
        const { x0, y0, x1, y1 } = tileRangeForBounds(z, bounds);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const id: TileKey = { z, x, y };
                if (!boundsOverlap(tileBounds(id), bounds)) {
                    continue;
                }
                if (!this.store.mayExist(id) && z > 4) {
                    // Skip fine ocean pins — ellipsoid stubs at coarse zoom cover them.
                    continue;
                }
                this.qt.pinned.add(tileKeyString(id));
                this.qt.forceMesh(id);
            }
        }
        this.attachPendingMeshes();
    }

    private attachReadyMeshes(): void {
        this.attachPendingMeshes();
        for (const key of this.qt.pinned) {
            const node = this.qt.find(parseTileKey(key));
            if (!node?.mesh || node.object) {
                continue;
            }
            node.object = this.makeObject(node);
        }
    }

    /** Sync {@link drawList} (or pinned boot fallback) into the scene group. */
    private syncTerrainGroup(): void {
        this.qt.collectDrawList(this.drawList);
        const wanted = new Set(this.drawList.map(n => n.key));
        if (wanted.size === 0) {
            for (const key of this.qt.pinned) {
                const node = this.qt.find(parseTileKey(key));
                if (node?.mesh && node.object) {
                    wanted.add(key);
                }
            }
        }
        for (let i = this.group.children.length - 1; i >= 0; i--) {
            const child = this.group.children[i];
            const key = child.userData.tileKey as string | undefined;
            if (key && !wanted.has(key)) {
                this.group.remove(child);
            }
        }
        for (const key of wanted) {
            const node = this.qt.find(parseTileKey(key));
            if (!node?.object) {
                continue;
            }
            if (node.object.parent !== this.group) {
                this.group.add(node.object);
            }
        }
    }

    private attachPendingMeshes(): void {
        for (const key of this.qt.consumePendingDraw()) {
            const [zs, xs, ys] = key.split('/');
            const node = this.qt.find({ z: Number(zs), x: Number(xs), y: Number(ys) });
            if (!node || !node.mesh) {
                continue;
            }
            if (node.object) {
                this.disposeNodeObject(node);
            }
            node.object = this.makeObject(node);
        }
    }

    private makeObject(node: QuadNode): THREE.Mesh {
        const result = node.mesh!;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(result.normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(result.indices, 1));
        for (let tone = 0; tone < TONE_COUNT; tone++) {
            const start = result.groups[tone * 2];
            const count = result.groups[tone * 2 + 1];
            if (count > 0) {
                geometry.addGroup(start, count, tone);
            }
        }
        geometry.computeBoundingSphere();

        const mesh = new THREE.Mesh(geometry, this.materialsByTone);
        mesh.position.set(result.centerE, result.centerU, result.centerN);
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = true;
        mesh.onBeforeRender = updateUniforms;
        mesh.userData.tileKey = node.key;
        return mesh;
    }

    private disposeNodeObject(node: QuadNode): void {
        if (!node.object) {
            return;
        }
        if (node.object.parent) {
            node.object.parent.remove(node.object);
        }
        node.object.geometry.dispose();
        node.object = undefined;
    }
}
