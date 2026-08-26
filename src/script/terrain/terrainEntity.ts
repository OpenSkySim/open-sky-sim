/**
 * The terrain scene entity.
 *
 * Owns the stores, the streamer, the quadtree and the height field, and is the
 * only thing `Game` talks to.
 *
 * One thing to know about how this is driven: `SceneLayers.Terrain` appears in
 * six different render-layer definitions, and the renderer builds render lists
 * once per layer. So `render3D` runs several times per frame, with *different
 * cameras* — the MFD and target passes among them. The old entity did all its
 * LOD work in `render3D` unguarded, which corrupted the frame-time EMA, the
 * detail scale and the quadtree traversal every single frame. Here LOD runs
 * only for the camera nominated by `setLodCamera`; every other pass just
 * attaches the group that pass already produced.
 */

import * as THREE from 'three';
import { PaletteCategory } from '../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../scene/materials/materials';
import { Entity, ENTITY_TAGS } from '../scene/entity';
import { Scene, SceneLayers } from '../scene/scene';
import { Palette } from '../config/palettes/palette';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { updateUniforms } from '../scene/utils';
import { attachToRenderList } from '../render/renderList';
import { DemTile, decodePdm } from './demTile';
import { EnuBasis, WGS84_A, makeEnuBasis } from './geodesy';
import { FlattenPad } from './flattenPad';
import { HeightField, HeightTier } from './heightField';
import {
    MESH_CACHE_BYTES, PREFETCH_LOOKAHEAD_S, PREFETCH_MIN_DISTANCE_M, RECONCILE_INTERVAL_MS,
    adjustDetailScale,
} from './lod';
import {
    TerrainManifest, baseUrlOf, heightIndexUrl, heightTileUrl, meshIndexUrl, meshTileUrl,
} from './manifest';
import { OceanPatch, buildOceanPatch, disposeOceanPatch } from './oceanPatch';
import { PtmTile, decodePtm } from './ptm';
import { QuadNode, Quadtree } from './quadtree';
import { TileIndex } from './tileIndex';
import { TileMeshes, buildTileMeshes, disposeTileMeshes, tileOriginEnu } from './tileMesh';
import { TileStore } from './tileStore';
import { TileStreamer, TileWant, predictViewTarget } from './tileStreamer';
import { TileKey, approxTileEdgeMetres, tileKeyString } from './tiling';
import { enuToGeodeticApprox } from './geodesy';
import { TONE_COUNT, TerrainTone } from './tones';
import { publishTerrainStats, trackTerrainMaterial } from './debug';

const TONE_CATEGORIES: Record<number, PaletteCategory> = {
    [TerrainTone.Water]: PaletteCategory.TERRAIN_WATER,
    [TerrainTone.ShallowWater]: PaletteCategory.TERRAIN_SHALLOW_WATER,
    [TerrainTone.Sand]: PaletteCategory.TERRAIN_SAND,
    [TerrainTone.Grass]: PaletteCategory.TERRAIN_GRASS,
    [TerrainTone.Bare]: PaletteCategory.TERRAIN_BARE,
};

export interface TerrainEntityOptions {
    manifest: TerrainManifest;
    manifestUrl: string;
    materials: SceneMaterialManager;
    /** Override the ENU origin; defaults to the manifest's. */
    enuOrigin?: { lat: number; lon: number; height?: number };
    maxZoom?: number;
}

export interface TerrainStats {
    drawn: number;
    triangles: number;
    detailScale: number;
    frameEmaMs: number;
    heightTier: HeightTier;
    queued: number;
    inflight: number;
    cacheBytes: number;
    bytesInFlight: number;
    aborted: number;
    failed: number;
    uploadMs: number;
    pendingUploads: number;
}

export class TerrainEntity implements Entity {
    readonly tags = [ENTITY_TAGS.GROUND];
    enabled = true;

    readonly basis: EnuBasis;
    readonly heights: HeightField;

    private readonly manifest: TerrainManifest;
    private readonly group = new THREE.Group();
    private readonly materials: THREE.Material[] = [];
    private readonly meshStore: TileStore<PtmTile>;
    private readonly heightStore: TileStore<DemTile>;
    private readonly streamer: TileStreamer<PtmTile, TileMeshes>;
    private readonly quadtree: Quadtree;
    private readonly oceans = new Map<string, OceanPatch>();
    private readonly pinned = new Set<string>();
    private readonly earthCenter: THREE.Vector3;

    private meshIndex: TileIndex | undefined;
    private lodCamera: THREE.Camera | undefined;
    private lastReconcile = 0;
    private lastFrame = 0;
    private frameEmaMs = 16;
    private detailScale = 1;
    private drawList: QuadNode[] = [];
    private drawnTriangles = 0;
    private readonly prevCameraPos = new THREE.Vector3();
    private prevCameraTime = 0;
    private readonly cameraVel = new THREE.Vector3();
    private readonly cameraForward = new THREE.Vector3();

    constructor(opts: TerrainEntityOptions) {
        this.manifest = opts.manifest;
        const origin = opts.enuOrigin ?? opts.manifest.enuOrigin;
        this.basis = makeEnuBasis(origin.lat, origin.lon, origin.height ?? 0);
        this.group.name = 'Terrain';
        // Dev aid, alongside globalThis.__terrainStats.
        (globalThis as Record<string, unknown>).__terrain = this;

        const base = baseUrlOf(opts.manifestUrl);

        for (let tone = 0; tone < TONE_COUNT; tone++) {
            // Water is a flat palette fill: no sun shade, no normal smoothing.
            const water = tone === TerrainTone.Water || tone === TerrainTone.ShallowWater;
            const mat = opts.materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: TONE_CATEGORIES[tone],
                depthWrite: true,
                ...(water
                    ? { shaded: false as const, highp: true }
                    : { shaded: true as const }),
            }) as THREE.ShaderMaterial;
            mat.side = THREE.DoubleSide;
            mat.polygonOffset = true;
            // Water sits farther back than land so a coplanar beach edge
            // resolves to land rather than sky-coloured sparkles.
            mat.polygonOffsetFactor = water ? 2 : 1;
            mat.polygonOffsetUnits = water ? 2 : 1;
            trackTerrainMaterial(mat);
            this.materials.push(mat);
        }

        this.meshStore = new TileStore<PtmTile>({
            baseUrl: base,
            url: (id) => meshTileUrl(this.manifest, id.z, id.x, id.y, base),
            decode: (buf) => decodePtm(buf),
            sizeOf: (t) => t.landPositions.byteLength + t.waterPositions.byteLength
                + t.landNormals.byteLength + t.waterIndices.byteLength,
            maxBytes: MESH_CACHE_BYTES,
            exists: (id) => (this.meshIndex ? this.meshIndex.has(id) : true),
        });

        this.heightStore = new TileStore<DemTile>({
            baseUrl: base,
            url: (id) => heightTileUrl(this.manifest, id.z, id.x, id.y, base),
            decode: (buf) => decodePdm(buf),
            sizeOf: (t) => t.heights.byteLength,
            maxBytes: 64 * 1024 * 1024,
        });

        const pads: FlattenPad[] = (opts.manifest.flattenPads ?? []).map(p => ({
            // The bake records the pad geodetically; the runtime works in ENU,
            // and the play origin is the pad centre by construction.
            centerX: 0,
            centerZ: 0,
            halfW: p.halfW,
            halfD: p.halfD,
            featherM: p.featherM,
            heightMsl: p.heightMsl,
        }));

        this.heights = new HeightField({
            manifest: opts.manifest,
            store: this.heightStore,
            basis: this.basis,
            pads,
        });

        this.streamer = new TileStreamer<PtmTile, TileMeshes>({
            store: this.meshStore,
            upload: (id, tile) => buildTileMeshes(
                tile, this.basis, this.materials, updateUniforms,
            ),
            release: (_id, m) => disposeTileMeshes(m),
        });

        // The ellipsoid centre in scene space. The ENU origin sits on the
        // surface with +Y up, so the centre is one Earth radius straight down.
        this.earthCenter = new THREE.Vector3(0, -WGS84_A, 0);

        this.quadtree = new Quadtree({
            manifest: opts.manifest,
            tilePosition: (id) => tileOriginEnu(id, 0, this.basis),
            tileRadius: (id) => approxTileEdgeMetres(id) * 0.75,
            // Uploaded geometry only. A sea patch must never count here: one is
            // also built as a stand-in for a land tile that has not arrived
            // yet, and calling that resident tells the quadtree the tile is
            // done -- it stops wanting it, the streamer cancels the fetch, and
            // the island stays flat water for the rest of the session. Nodes
            // the index says are ocean are covered by isOcean everywhere
            // readiness is tested, so nothing needs this clause.
            isResident: (id) => this.streamer.has(id),
            isOcean: (id) => this.meshStore.isAbsent(id),
            earthCenter: this.earthCenter,
            maxZoom: opts.maxZoom ?? opts.manifest.mesh.maxZoom,
        });
    }

    init(_scene: Scene): void {
        // Index and coarse-tier loading is awaited by load(), which Game calls
        // before adding the entity, so there is nothing to do here.
    }

    private manifestUrl = '';

    /** Load the tile indices and the always-resident coarse height tier. */
    async load(manifestUrl: string): Promise<void> {
        this.manifestUrl = manifestUrl;
        const base = baseUrlOf(manifestUrl);
        const [meshIdx] = await Promise.all([
            fetchIndex(meshIndexUrl(this.manifest, base)),
            fetchIndex(heightIndexUrl(this.manifest, base)),
        ]);
        this.meshIndex = meshIdx;
        await this.heights.loadCoarse();
    }

    /** Deepest zoom the baked pyramid provides. */
    get maxZoom(): number {
        return this.manifest.mesh.maxZoom;
    }

    get coverage(): { west: number; south: number; east: number; north: number } {
        return this.manifest.coverage;
    }

    /** Nominate the camera LOD follows. Every other render pass is passive. */
    setLodCamera(camera: THREE.Camera): void {
        this.lodCamera = camera;
    }

    /** Pin tiles around a point so boot and spawn areas cannot be evicted. */
    async pinArea(e: number, n: number, radiusM: number, zoom: number): Promise<void> {
        const span = 180 / (1 << zoom);
        const ids = tilesAround(this.basis, e, n, radiusM, zoom, span);
        for (const id of ids) {
            this.pinned.add(tileKeyString(id));
        }
        this.streamer.setPinnedKeys(this.pinned);
        await this.streamer.ensure(ids, Number.MAX_SAFE_INTEGER);
        for (const id of ids) {
            this.meshStore.setPinned(id, true);
        }
        await this.heights.ensureLoadedAroundEnu(e, n, radiusM);
    }

    /** Keys of pinned tiles that are still neither uploaded nor known absent. */
    outstandingPinned(): string[] {
        const out: string[] = [];
        for (const key of this.pinned) {
            const [z, x, y] = key.split('/').map(Number);
            const id = { z, x, y };
            if (!this.streamer.has(id) && !this.meshStore.isAbsent(id)) {
                out.push(key);
            }
        }
        return out;
    }

    /** Resolve once every pinned tile is uploaded, reporting progress. */
    async waitForPinned(onProgress?: (done: number, total: number) => void): Promise<void> {
        const total = this.pinned.size;
        if (total === 0) {
            return;
        }
        for (let guard = 0; guard < 2000; guard++) {
            const outstanding = this.outstandingPinned();
            const done = total - outstanding.length;
            onProgress?.(done, total);
            if (outstanding.length === 0) {
                return;
            }
            this.streamer.pumpUploads();
            await new Promise(r => setTimeout(r, 16));
        }
        console.warn(
            `[terrain] gave up waiting on ${this.outstandingPinned().length} pinned tiles`,
            this.outstandingPinned().slice(0, 20),
        );
    }

    update(_delta: number): void {
        // LOD is camera-driven, so it belongs in render3D where the camera is
        // known. Nothing to do per simulation tick.
    }

    heightAtEnu(e: number, n: number): number {
        return this.heights.heightAtEnu(e, n);
    }

    isLandEnu(e: number, n: number): boolean {
        return this.heights.isLandEnu(e, n);
    }

    render3D(
        _targetWidth: number,
        targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        // Only the nominated camera drives LOD. Without this gate the MFD and
        // target passes corrupt the governor and the traversal every frame.
        if ((this.lodCamera === undefined || camera === this.lodCamera)
            && camera instanceof THREE.PerspectiveCamera) {
            this.viewportHeightPx = targetHeight;
            this.reconcile(camera);
        }
        const list = lists.get(SceneLayers.Terrain);
        if (list) {
            // Must go through attachToRenderList, not list.add: the renderer
            // stamps a generation on each build pass and pruneRenderList drops
            // every child that is not stamped for the current one. A plain add
            // is silently pruned again before anything is drawn.
            attachToRenderList(list, this.group);
        }
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        // Terrain is 3D only.
    }

    private reconcile(camera: THREE.PerspectiveCamera): void {
        // Everything below reads the camera's orientation out of its world
        // matrix -- the culling frustum here, and the prefetch direction via
        // getWorldDirection in speculativeWants. But that matrix is only
        // recomputed when the renderer submits, which happens *after* the
        // render lists are built, so without this we cull against the previous
        // pose. In a view whose orientation is set after the camera updater
        // runs -- an orbited exterior view, or looking around the cockpit --
        // it never catches up at all: measured, the frustum sat a steady 105
        // degrees away from the view direction and stayed there, pinning
        // terrain to a cone around the aircraft axis while the player looked
        // somewhere else entirely.
        camera.updateMatrixWorld();

        const now = performance.now();
        if (this.lastFrame > 0) {
            const dt = now - this.lastFrame;
            this.frameEmaMs = this.frameEmaMs * 0.9 + dt * 0.1;
        }
        this.lastFrame = now;

        this.streamer.pumpUploads();

        if (now - this.lastReconcile < RECONCILE_INTERVAL_MS) {
            return;
        }
        this.lastReconcile = now;
        this.detailScale = adjustDetailScale(this.detailScale, this.frameEmaMs);
        this.meshStore.nextGeneration();

        const r = this.quadtree.update(
            camera,
            this.viewportHeightPx,
            camera.fov,
            this.detailScale,
            (id) => this.pinned.has(tileKeyString(id)),
        );

        this.streamer.setWants(r.wants, this.speculativeWants(camera, r.wants));
        this.drawList = r.draw;
        this.syncGroup();
        publishTerrainStats({ ...this.stats, altitudeM: camera.position.y });
    }

    /**
     * Tiles the camera is about to need, at reduced priority.
     *
     * Aimed along the direction the camera is *looking*, not the direction it
     * is travelling. In an exterior view the camera orbits the aircraft, so its
     * velocity is the aircraft's: extrapolating along it prefetched terrain
     * ahead of the aircraft while the view pointed elsewhere, and whatever the
     * player was actually looking at had to wait for the frustum pass. Speed
     * still sets how far ahead to reach, with a floor so a camera that is only
     * turning still pulls in what it is about to face.
     */
    private speculativeWants(
        camera: THREE.PerspectiveCamera, current: TileWant[],
    ): TileWant[] {
        const now = performance.now();
        if (this.prevCameraTime > 0) {
            const dt = Math.max(1e-3, (now - this.prevCameraTime) / 1000);
            this.cameraVel.subVectors(camera.position, this.prevCameraPos).divideScalar(dt);
        }
        this.prevCameraPos.copy(camera.position);
        this.prevCameraTime = now;

        camera.getWorldDirection(this.cameraForward);
        const ahead = predictViewTarget(
            camera.position.x, camera.position.y, camera.position.z,
            this.cameraForward.x, this.cameraForward.y, this.cameraForward.z,
            this.cameraVel.length(),
            PREFETCH_LOOKAHEAD_S,
            PREFETCH_MIN_DISTANCE_M,
        );
        const have = new Set(current.map(w => tileKeyString(w.id)));
        const zoom = Math.min(this.manifest.mesh.maxZoom, this.deepestDrawnZoom());
        const span = 180 / (1 << zoom);
        const ids = tilesAround(this.basis, ahead.x, ahead.z, 4000, zoom, span);
        const out: TileWant[] = [];
        for (const id of ids) {
            const key = tileKeyString(id);
            if (have.has(key) || this.streamer.has(id) || this.meshStore.isAbsent(id)) {
                continue;
            }
            out.push({
                id,
                ssePx: 1,
                distanceM: 1e6,      // never outranks something visible
                inFrustum: false,
                pinned: false,
            });
        }
        return out;
    }

    private deepestDrawnZoom(): number {
        let z = 0;
        for (const node of this.drawList) {
            if (node.id.z > z) {
                z = node.id.z;
            }
        }
        return z;
    }

    /** Viewport height in px, taken from the render target each pass. */
    private viewportHeightPx = 200;

    private syncGroup(): void {
        this.group.clear();
        this.drawnTriangles = 0;
        for (const node of this.drawList) {
            const meshes = this.streamer.get(node.id);
            if (meshes) {
                // A sea patch built while this tile was still in flight has
                // done its job; drop it rather than hold its buffers for a
                // node that now has real geometry.
                const standIn = this.oceans.get(node.key);
                if (standIn) {
                    disposeOceanPatch(standIn);
                    this.oceans.delete(node.key);
                }
                this.group.add(meshes.group);
                this.drawnTriangles += countTriangles(meshes);
                continue;
            }
            const key = node.key;
            let patch = this.oceans.get(key);
            if (!patch) {
                patch = buildOceanPatch(
                    node.id, this.basis, this.manifest.seaLevel,
                    this.manifest.mesh.levelSkirtDepthM[node.id.z] ?? 0,
                    this.materials, updateUniforms,
                );
                this.oceans.set(key, patch);
            }
            this.group.add(patch.group);
        }
        this.pruneOceans();
    }

    private pruneOceans(): void {
        if (this.oceans.size < 512) {
            return;
        }
        const live = new Set(this.drawList.map(n => n.key));
        for (const [key, patch] of this.oceans) {
            if (!live.has(key)) {
                disposeOceanPatch(patch);
                this.oceans.delete(key);
            }
        }
    }

    get stats(): TerrainStats {
        const s = this.meshStore.stats;
        return {
            drawn: this.drawList.length,
            triangles: this.drawnTriangles,
            detailScale: this.detailScale,
            frameEmaMs: this.frameEmaMs,
            heightTier: this.heights.heightResolutionAt(0, 0),
            queued: s.queued,
            inflight: s.inflight,
            cacheBytes: s.cacheBytes,
            bytesInFlight: s.bytesInFlight,
            aborted: s.aborted,
            failed: s.failed,
            uploadMs: this.streamer.stats.uploadMs,
            pendingUploads: this.streamer.pendingUploads,
        };
    }
}

function countTriangles(m: TileMeshes): number {
    let n = 0;
    if (m.land) {
        n += (m.land.geometry.getAttribute('position')?.count ?? 0) / 3;
    }
    if (m.water) {
        n += (m.water.geometry.getIndex()?.count ?? 0) / 3;
    }
    return n;
}

async function fetchIndex(url: string): Promise<TileIndex | undefined> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return undefined;
        }
        return TileIndex.decode(await res.arrayBuffer());
    } catch {
        return undefined;
    }
}

/** Tile ids covering a radius around an ENU point at one zoom. */
function tilesAround(
    basis: EnuBasis, e: number, n: number, radiusM: number, zoom: number, span: number,
): TileKey[] {
    const c = enuToGeodeticApprox(basis, e, n, 0);
    const dLat = radiusM / 110540;
    const dLon = radiusM / (111320 * Math.max(0.1, Math.cos(c.lat * Math.PI / 180)));
    const x0 = Math.floor((c.lon - dLon + 180) / span);
    const x1 = Math.floor((c.lon + dLon + 180) / span);
    const y0 = Math.floor((90 - (c.lat + dLat)) / span);
    const y1 = Math.floor((90 - (c.lat - dLat)) / span);
    const out: TileKey[] = [];
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            out.push({ z: zoom, x, y });
        }
    }
    return out;
}
