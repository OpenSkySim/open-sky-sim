import * as THREE from 'three';
import { Palette } from '../config/palettes/palette';
import { CanvasPainter } from '../render/screen/canvasPainter';
import { attachToRenderList } from '../render/renderList';
import { Entity, ENTITY_TAGS } from '../scene/entity';
import { SceneMaterialManager } from '../scene/materials/materials';
import { Scene, SceneLayers } from '../scene/scene';
import { COCKPIT_FOV } from '../defs';
import {
    CompositeHeightSource, DemTileSource, EllipsoidSeaSource, HeightSource,
} from './heightSource';
import { FlattenPadHeightSource, FlattenPadSpec, padLonLatBounds } from './flattenPad';
import { HeightSampler } from './heightSampler';
import { TerrainManifest, basisFromManifest } from './manifest';
import { TerrainQuadtree, leafKeySet } from './quadtree';
import { RenderFrame } from './renderFrame';
import { TerrainMeshHandle, buildTerrainMesh, isWaterHeight, meshResForTile } from './terrainMesh';
import {
    LonLatBounds, TileId, boundsOverlap, isFullyReplacedByFinerMeshes, parentOf, parseTileKey, tileBounds, tileKey,
} from './tileId';
import { geodeticToEcef, enuToGeodeticApprox, makeEnuBasis } from './geo';
import { EnuBasis } from './geo';
import { analyzeTileLod, classifyTileLod } from './terrainLod';
import {
    COARSE_SHELL_MAX_ZOOM,
    COAST_DETAIL_EXTRA_LEVELS,
    TERRAIN_MESH_CREATES_PER_FRAME,
    TERRAIN_RECONCILE_INTERVAL_MS,
    TERRAIN_TARGET_FRAME_MS,
    adjustTerrainDetailScale,
    SPACE_SKY_ALTITUDE_M,
    coastFloorRangeM,
    geometricHorizonDistanceM,
    terrainCoastMaxZoomForAltitudeM,
    terrainMaxZoomForAltitudeM,
    terrainMeshBudget,
    terrainViewRangeM,
} from './viewRange';
export type TerrainMode = 'planet' | 'legacy';

export function resolveTerrainMode(search: string = typeof location !== 'undefined' ? location.search : ''): TerrainMode {
    const q = new URLSearchParams(search);
    const v = q.get('terrain');
    if (v === 'legacy') {
        return 'legacy';
    }
    if (v === 'planet') {
        return 'planet';
    }
    return 'planet';
}

export interface PlanetTerrainOptions {
    baseUrl?: string;
    maxZoom?: number;
    /** Override ENU origin (degrees). Defaults to manifest centroid. */
    enuOrigin?: { lat: number; lon: number; height?: number };
}

/**
 * Global geographic DEM / ocean terrain entity.
 * Refines a whole-Earth QT around the camera; meshes are ECEF→ENU.
 */
export class PlanetTerrainEntity implements Entity {
    readonly tags: string[] = [ENTITY_TAGS.GROUND];
    enabled = true;

    readonly sampler: HeightSampler;
    readonly source: HeightSource;
    readonly frame: RenderFrame;
    readonly dem: DemTileSource;

    private readonly flattenPad: FlattenPadHeightSource;
    private readonly qt: TerrainQuadtree;
    private readonly meshes = new Map<string, TerrainMeshHandle>();
    /** Seeded play-area tiles — restored when altitude allows their zoom. */
    private readonly pinned = new Set<string>();
    /** Lon/lat union of pinned max-zoom seeds (for coarse-leaf skipping). */
    private pinnedBounds: LonLatBounds | undefined;
    private readonly group = new THREE.Group();
    private readonly seaLevel: number;
    private dirty = true;
    /** Active airbase pad; coarse tiles overlapping this must not be meshed. */
    private activePad: FlattenPadSpec | undefined;
    private activePadLonLat: LonLatBounds | undefined;
    /** Frame-time governor: scales SSE / budget / creates toward ~40 FPS. */
    private detailScale = 1;
    private appliedDetailScale = 1;
    private frameEmaMs = TERRAIN_TARGET_FRAME_MS;
    private lastFrameStamp: number | undefined;
    private lastReconcileMs = -Infinity;
    private readonly qtMaxZoom: number;
    /** When set, {@link createMesh} bakes fullRes grids (high-alt seed core). */
    private seedDenseMeshes = false;

    constructor(
        manifest: TerrainManifest,
        private readonly materials: SceneMaterialManager,
        options: PlanetTerrainOptions = {},
    ) {
        this.dem = new DemTileSource(manifest, { baseUrl: options.baseUrl });
        this.seaLevel = manifest.seaLevel;
        const basis: EnuBasis = options.enuOrigin
            ? makeEnuBasis(options.enuOrigin.lat, options.enuOrigin.lon, options.enuOrigin.height ?? 0)
            : basisFromManifest(manifest);
        this.frame = new RenderFrame(basis);
        const composite = new CompositeHeightSource(this.dem, new EllipsoidSeaSource(this.seaLevel));
        // Inactive until {@link lockAirbaseFlattenPad}; mesh + physics share this source.
        this.flattenPad = new FlattenPadHeightSource(composite, basis, {
            centerX: 0, centerZ: 0, halfW: 1, halfD: 1, featherM: 1,
        }, this.seaLevel);
        this.source = this.flattenPad;
        this.sampler = new HeightSampler(this.source, this.frame.basis, this.seaLevel);
        this.qtMaxZoom = options.maxZoom ?? (manifest.maxZoom + COAST_DETAIL_EXTRA_LEVELS);
        this.qt = new TerrainQuadtree(
            this.source,
            this.frame,
            id => this.dem.requestTile(id),
            {
                // DEM max + SSE-gated close-range coast detail (no height files).
                maxZoom: this.qtMaxZoom,
                seaLevel: this.seaLevel,
                forceRefine: id => this.tileOverlapsActivePad(id),
            },
        );
        this.group.name = 'PlanetTerrain';
    }

    init(_scene: Scene): void {
        //
    }

    /** Load DEM tiles covering a radius around an ENU point (default: 30 km at origin). */
    async prefetchPlayArea(radiusM: number = 30000, centerE: number = 0, centerN: number = 0): Promise<void> {
        const g = enuToGeodeticApprox(this.frame.basis, centerE, centerN, 0);
        const dLat = radiusM / 110540;
        const dLon = radiusM / (111320 * Math.max(0.2, Math.cos(g.lat * Math.PI / 180)));
        await this.prefetchBounds({
            west: g.lon - dLon,
            east: g.lon + dLon,
            south: g.lat - dLat,
            north: g.lat + dLat,
        });
    }

    /** Load all DEM tiles in manifest coverage (needed before {@link seedDemCoverage}). */
    async prefetchDemCoverage(): Promise<void> {
        await this.prefetchBounds(this.dem.manifest.coverage);
    }

    private async prefetchBounds(bounds: LonLatBounds): Promise<void> {
        const m = this.dem.manifest;
        const jobs: Promise<unknown>[] = [];
        const ids: TileId[] = [];
        // Every pyramid LOD in-bounds — sparse z6/z8/max left mid-zooms cold at spawn.
        for (let z = m.minZoom; z <= m.maxZoom; z++) {
            const xc = 1 << (z + 1);
            const yc = 1 << z;
            const lonSpan = 360 / xc;
            const latSpan = 180 / yc;
            const x0 = Math.max(0, Math.floor((bounds.west + 180) / lonSpan));
            const x1 = Math.min(xc - 1, Math.floor((bounds.east + 180) / lonSpan));
            const y0 = Math.max(0, Math.floor((90 - bounds.north) / latSpan));
            const y1 = Math.min(yc - 1, Math.floor((90 - bounds.south) / latSpan));
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const id = { z, x, y };
                    if (this.dem.coversTile(id)) {
                        ids.push(id);
                        jobs.push(this.dem.requestTile(id));
                    }
                }
            }
        }
        await Promise.all(jobs);
        // Re-touch so this bounds stays MRU after a large coverage prefetch.
        for (const id of ids) {
            this.dem.touch(id);
        }
    }

    /**
     * Force-create DEM meshes for the play area so terrain is visible even before
     * the camera-driven QT has refined (and so we don't depend on leaf ranking).
     * @param zoom Pin zoom (defaults to DEM maxZoom).
     * @param dense Bake fullRes grids — needed for high-alt seeds where inland
     *   default res (9–17) reads as kilometre-scale blocks from 10 km AGL.
     */
    seedPlayArea(
        centerE: number,
        centerN: number,
        radiusM: number = 30000,
        zoom?: number,
        dense?: boolean,
    ): void {
        const g = enuToGeodeticApprox(this.frame.basis, centerE, centerN, 0);
        const dLat = radiusM / 110540;
        const dLon = radiusM / (111320 * Math.max(0.2, Math.cos(g.lat * Math.PI / 180)));
        const west = g.lon - dLon;
        const east = g.lon + dLon;
        const south = g.lat - dLat;
        const north = g.lat + dLat;
        // Play-area preload: every tile in the disk (coast/inland/ocean). Coast-only
        // left ~70% of the disk to the QT trickle and punched ground holes.
        this.pinMaxZoomInBounds({ west, south, east, north }, { allTiles: true, zoom, dense });
    }

    /**
     * Pin max-zoom over full DEM coverage. Prefer {@link seedPlayArea} at boot —
     * full coverage pins fight altitude LOD from space.
     */
    seedDemCoverage(): void {
        this.pinMaxZoomInBounds(this.dem.manifest.coverage);
    }

    private pinMaxZoomInBounds(
        bounds: LonLatBounds,
        options?: { allTiles?: boolean; zoom?: number; dense?: boolean },
    ): void {
        const m = this.dem.manifest;
        const z = Math.max(0, Math.min(m.maxZoom, options?.zoom ?? m.maxZoom));
        const xc = 1 << (z + 1);
        const yc = 1 << z;
        const lonSpan = 360 / xc;
        const latSpan = 180 / yc;
        const x0 = Math.max(0, Math.floor((bounds.west + 180) / lonSpan));
        const x1 = Math.min(xc - 1, Math.floor((bounds.east + 180) / lonSpan));
        const y0 = Math.max(0, Math.floor((90 - bounds.north) / latSpan));
        const y1 = Math.min(yc - 1, Math.floor((90 - bounds.south) / latSpan));
        this.unionPinnedBounds(bounds);
        const prevDense = this.seedDenseMeshes;
        this.seedDenseMeshes = !!options?.dense;
        try {
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const id = { z, x, y };
                    if (!boundsOverlap(tileBounds(id), bounds)) {
                        continue;
                    }
                    // Default: shoreline + pad only. Play-area seed passes allTiles so
                    // inland/ocean in the preload disk are meshed at boot too.
                    const lod = classifyTileLod(this.source, this.seaLevel, id);
                    if (!options?.allTiles && lod !== 'coast' && !this.tileOverlapsActivePad(id)) {
                        continue;
                    }
                    const key = tileKey(id);
                    this.pinned.add(key);
                    // Upgrade sparse inland pins when a dense high-alt seed re-runs.
                    if (this.seedDenseMeshes) {
                        const existing = this.meshes.get(key);
                        if (existing && !existing.fullRes) {
                            this.group.remove(existing.root);
                            existing.dispose();
                            this.meshes.delete(key);
                        }
                    }
                    this.createMesh(id);
                }
            }
        } finally {
            this.seedDenseMeshes = prevDense;
        }
    }

    private unionPinnedBounds(bounds: LonLatBounds): void {
        if (!this.pinnedBounds) {
            this.pinnedBounds = { ...bounds };
            return;
        }
        const p = this.pinnedBounds;
        p.west = Math.min(p.west, bounds.west);
        p.east = Math.max(p.east, bounds.east);
        p.south = Math.min(p.south, bounds.south);
        p.north = Math.max(p.north, bounds.north);
    }

    /**
     * Lock a feathered flat pad (MSL = max DEM under pad) and rebuild seeded meshes
     * so visuals match physics under the airbase.
     */
    lockAirbaseFlattenPad(
        spec: FlattenPadSpec,
        seedCenterE: number,
        seedCenterN: number,
        seedRadiusM: number,
        seedZoom?: number,
    ): void {
        const h = this.sampleMaxDemUnderPad(spec);
        this.activePad = { ...spec };
        this.activePadLonLat = padLonLatBounds(spec, this.frame.basis);
        this.flattenPad.configure(spec);
        this.flattenPad.setPadHeightMsl(h);
        this.clearMeshes();
        this.meshPadTiles(this.activePadLonLat);
        // Play-area pin only — full DEM coverage refines via altitude-capped QT.
        this.seedPlayArea(seedCenterE, seedCenterN, seedRadiusM, seedZoom);
    }

    /** Synchronously mesh every max-zoom tile over the pad (+ feather) footprint. */
    private meshPadTiles(bounds: LonLatBounds): void {
        const m = this.dem.manifest;
        const z = m.maxZoom;
        const xc = 1 << (z + 1);
        const yc = 1 << z;
        const lonSpan = 360 / xc;
        const latSpan = 180 / yc;
        const x0 = Math.max(0, Math.floor((bounds.west + 180) / lonSpan));
        const x1 = Math.min(xc - 1, Math.floor((bounds.east + 180) / lonSpan));
        const y0 = Math.max(0, Math.floor((90 - bounds.north) / latSpan));
        const y1 = Math.min(yc - 1, Math.floor((90 - bounds.south) / latSpan));
        this.unionPinnedBounds(bounds);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const id = { z, x, y };
                if (!boundsOverlap(tileBounds(id), bounds)) {
                    continue;
                }
                this.pinned.add(tileKey(id));
                this.createMesh(id);
            }
        }
    }

    private sampleMaxDemUnderPad(spec: FlattenPadSpec): number {
        const step = 50;
        let hMax = -Infinity;
        for (let dz = -spec.halfD; dz <= spec.halfD; dz += step) {
            for (let dx = -spec.halfW; dx <= spec.halfW; dx += step) {
                const g = enuToGeodeticApprox(
                    this.frame.basis,
                    spec.centerX + dx,
                    spec.centerZ + dz,
                    0,
                );
                const h = this.dem.rawHeightAt(g.lon, g.lat);
                if (Number.isFinite(h) && !isWaterHeight(h, this.seaLevel)) {
                    hMax = Math.max(hMax, h);
                }
            }
        }
        // Corners
        for (const dx of [-spec.halfW, spec.halfW]) {
            for (const dz of [-spec.halfD, spec.halfD]) {
                const g = enuToGeodeticApprox(
                    this.frame.basis,
                    spec.centerX + dx,
                    spec.centerZ + dz,
                    0,
                );
                const h = this.dem.rawHeightAt(g.lon, g.lat);
                if (Number.isFinite(h) && !isWaterHeight(h, this.seaLevel)) {
                    hMax = Math.max(hMax, h);
                }
            }
        }
        return Number.isFinite(hMax) ? hMax : this.seaLevel;
    }

    private tileOverlapsActivePad(id: TileId): boolean {
        if (!this.activePadLonLat) {
            return false;
        }
        return boundsOverlap(tileBounds(id), this.activePadLonLat);
    }

    /** True when tile bounds are fully inside the active pad lon/lat AABB. */
    private tileFullyInsideActivePad(id: TileId): boolean {
        if (!this.activePadLonLat) {
            return false;
        }
        const b = tileBounds(id);
        const pad = this.activePadLonLat;
        return b.west >= pad.west && b.east <= pad.east
            && b.south >= pad.south && b.north <= pad.north;
    }

    /**
     * Grid / material options for pad tiles. Pad is flat inland — never coast
     * `fullRes` (that used to densify every max-zoom neighbour of the airfield
     * because z11 tiles are larger than the pad, so none sat fully in the core).
     */
    private padMeshOptions(id: TileId, lod: ReturnType<typeof analyzeTileLod>['lod'], deltaH: number): {
        fullRes: boolean;
        uniformLandTone: boolean;
    } {
        const onPad = this.tileOverlapsActivePad(id);
        return {
            fullRes: lod === 'coast',
            uniformLandTone: onPad && deltaH < 5,
        };
    }

    /**
     * Coarse tiles that sit entirely under the pad can be skipped once fine
     * pin meshes own that footprint. Overlapping-but-larger leaves must stay —
     * skipping them punches teal holes outside the pin disk.
     */
    private shouldSkipCoarsePadTile(id: TileId, altitudeM: number): boolean {
        if (!this.tileFullyInsideActivePad(id) || id.z >= this.dem.manifest.maxZoom) {
            return false;
        }
        const altCap = terrainMaxZoomForAltitudeM(altitudeM, this.dem.manifest.maxZoom);
        if (altCap < this.dem.manifest.maxZoom) {
            return false;
        }
        return this.pinnedMeshesFullyCover(id, altitudeM);
    }

    /** True if `ancestor` geographically contains `id` (same or finer zoom). */
    private tileContains(ancestor: TileId, id: TileId): boolean {
        if (id.z < ancestor.z) {
            return false;
        }
        const dz = id.z - ancestor.z;
        return (id.x >> dz) === ancestor.x && (id.y >> dz) === ancestor.y;
    }

    /**
     * Skip a coarse QT leaf only when pinned max-zoom meshes that cover it are
     * already resident — otherwise skipping leaves rectangular holes.
     */
    private shouldSkipCoarseDemCoverageTile(id: TileId, altitudeM: number): boolean {
        if (!this.pinnedBounds || id.z >= this.dem.manifest.maxZoom) {
            return false;
        }
        const lod = classifyTileLod(this.source, this.seaLevel, id);
        if (lod !== 'coast') {
            return false;
        }
        const coastCap = terrainCoastMaxZoomForAltitudeM(altitudeM, this.dem.manifest.maxZoom);
        if (coastCap < this.dem.manifest.maxZoom) {
            return false;
        }
        const b = tileBounds(id);
        const c = this.pinnedBounds;
        if (!(b.west >= c.west && b.east <= c.east
            && b.south >= c.south && b.north <= c.north)) {
            return false;
        }
        return this.pinnedMeshesFullyCover(id, altitudeM);
    }

    /** All altitude-allowed pinned maxZoom descendants of `id` are meshed. */
    private pinnedMeshesFullyCover(id: TileId, altitudeM: number): boolean {
        const zMax = this.dem.manifest.maxZoom;
        let need = 0;
        let have = 0;
        for (const key of this.pinned) {
            const p = parseTileKey(key);
            if (p.z !== zMax || !this.tileContains(id, p)) {
                continue;
            }
            if (p.z > this.pinnedZoomCap(p, altitudeM)) {
                continue;
            }
            need += 1;
            if (this.meshes.has(key)) {
                have += 1;
            }
        }
        return need > 0 && have >= need;
    }

    /**
     * Play-area pins ignore inland flatness drops — otherwise flat coastal
     * airfields dispose z11 pins every frame and leave a floating runway.
     */
    private pinnedZoomCap(_id: TileId, altitudeM: number): number {
        return terrainMaxZoomForAltitudeM(altitudeM, this.dem.manifest.maxZoom);
    }

    private shouldSkipTerrainLeaf(id: TileId, altitudeM: number): boolean {
        return this.shouldSkipCoarsePadTile(id, altitudeM)
            || this.shouldSkipCoarseDemCoverageTile(id, altitudeM);
    }

    /**
     * Cover bookkeeping for eviction, built once per frame:
     * - `ancestors`: every ancestor of each wanted-but-unmeshed leaf. A resident
     *   coarser mesh with such a key still covers the hole.
     * - `unmeshed`: the wanted-but-unmeshed leaf keys themselves — resident
     *   descendants of these partially cover them and must survive until the
     *   replacement leaf is built (leaf merges would otherwise flash holes).
     */
    private coverStillNeeded(want: Set<string>): { ancestors: Set<string>; unmeshed: Set<string> } {
        const ancestors = new Set<string>();
        const unmeshed = new Set<string>();
        for (const leafKey of want) {
            if (this.meshes.has(leafKey)) {
                continue;
            }
            unmeshed.add(leafKey);
            let cur: TileId | undefined = parentOf(parseTileKey(leafKey));
            while (cur) {
                const k = tileKey(cur);
                if (ancestors.has(k)) {
                    break; // Ancestors above are already marked.
                }
                ancestors.add(k);
                cur = parentOf(cur);
            }
        }
        return { ancestors, unmeshed };
    }

    /** Wrapper around {@link isFullyReplacedByFinerMeshes} using resident meshes. */
    private meshFullyReplaced(id: TileId, meshedKeys: Set<string>): boolean {
        return isFullyReplacedByFinerMeshes(id, meshedKeys, this.qtMaxZoom);
    }

    /**
     * Keep current QT leaves, ancestors that still cover unmeshed descendant
     * leaves, and descendants of unmeshed leaves — disposing either before the
     * replacement exists punches holes.
     */
    private shouldKeepTerrainMesh(
        id: TileId,
        want: Set<string>,
        cover: { ancestors: Set<string>; unmeshed: Set<string> },
        altitudeM: number,
        meshedKeys: Set<string>,
    ): boolean {
        const key = tileKey(id);
        if (want.has(key) && !this.shouldSkipTerrainLeaf(id, altitudeM)) {
            return true;
        }
        // Cover ancestors must survive until every descendant leaf is meshed.
        // meshFullyReplaced previously ran first and dropped parents while z11
        // tiles were still queuing — black rectangles at 100 km.
        if (cover.ancestors.has(key)) {
            if (this.pinnedMeshesFullyCover(id, altitudeM)) {
                return false;
            }
            return true;
        }
        if (this.meshFullyReplaced(id, meshedKeys)) {
            return false;
        }
        let cur = parentOf(id);
        while (cur) {
            if (cover.unmeshed.has(tileKey(cur))) {
                return true;
            }
            cur = parentOf(cur);
        }
        return false;
    }

    private clearMeshes(): void {
        for (const key of [...this.meshes.keys()]) {
            const m = this.meshes.get(key)!;
            this.group.remove(m.root);
            m.dispose();
            this.meshes.delete(key);
        }
        this.pinned.clear();
        this.pinnedBounds = undefined;
        this.dirty = true;
    }

    update(_delta: number): void {
        // Refinement runs in render3D (needs camera).
    }

    /**
     * Measure real frame spacing and steer terrain detail toward the target
     * frame time. One smoothed step per frame; the scale multiplies the QT SSE
     * threshold and divides the mesh budget / per-frame creates.
     */
    private updateDetailGovernor(altitudeM: number): void {
        const now = performance.now();
        if (this.lastFrameStamp !== undefined) {
            const dt = Math.min(200, now - this.lastFrameStamp);
            this.frameEmaMs = this.frameEmaMs * 0.92 + dt * 0.08;
        }
        this.lastFrameStamp = now;
        this.detailScale = adjustTerrainDetailScale(this.detailScale, this.frameEmaMs);
        // Cruise / approach / 10 km: allow the governor up to 8 (skips
        // balanceDemLod and raises SSE) so reconciles stay under ~100 ms.
        // Cap below 24 — at ~7 km uncapped scale hit 22–24 and LOD rings
        // thrashed (leafΔ ±450, disposedNonPin 40–90).
        if (altitudeM < 50_000) {
            this.detailScale = Math.min(this.detailScale, 8);
        }
        // Deadband: re-leafing the QT rebuilds meshes, so only push a new scale
        // when it moved enough to matter — otherwise every governor tick would
        // churn tiles at the SSE boundary.
        const applied = this.appliedDetailScale;
        if (this.detailScale > applied * 1.15 || this.detailScale < applied * 0.87) {
            this.appliedDetailScale = this.detailScale;
            this.qt.setDetailScale(this.detailScale);
        }
    }

    heightAtEnu(x: number, z: number): number {
        return this.sampler.heightAtEnu(x, z);
    }

    isLandEnu(x: number, z: number): boolean {
        return this.sampler.isLandEnu(x, z);
    }

    render3D(
        targetWidth: number,
        _targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        if (!lists.has(SceneLayers.Terrain)) {
            return;
        }
        const altitudeM = camera.position.y;
        this.updateDetailGovernor(altitudeM);

        // LOD reconcile (refine / rank / create / evict) walks thousands of
        // tiles — running it at frame rate burns ~15% of the frame budget for
        // no visible benefit. 10 Hz is plenty for camera-driven LOD changes.
        const layerScene = lists.get(SceneLayers.Terrain);
        const nowMs = performance.now();
        // Interval scales with frame time so slow machines skip whole frames
        // (a fixed 100 ms would still reconcile every frame below 10 FPS).
        const intervalMs = Math.max(TERRAIN_RECONCILE_INTERVAL_MS, this.frameEmaMs * 4);
        if (nowMs - this.lastReconcileMs < intervalMs) {
            if (layerScene && this.group.children.length > 0) {
                attachToRenderList(layerScene, this.group);
            }
            return;
        }
        this.lastReconcileMs = nowMs;

        this.qt.update(camera, targetWidth, COCKPIT_FOV);
        const leaves = this.qt.getLeaves();
        const want = leafKeySet(leaves);
        const cover = this.coverStillNeeded(want);
        const meshedKeys = new Set(this.meshes.keys());

        // Over-fine pin cull only in the space band (≥50 km). Below that
        // (approach, 10 km), disposing z11 pins for zoomCap leaves a hole:
        // QT still wants those leaves, creates trickle them back, then the
        // pin branch evicts them again every reconcile.
        const cullOverFinePins = altitudeM >= 50_000;
        for (const key of [...this.meshes.keys()]) {
            if (this.pinned.has(key)) {
                // Drop over-fine pins from space, or pins fully covered by finer
                // QT meshes (avoids a second layer when LOD outruns the pin zoom).
                // Pin keys stay so altitude restore can recreate them.
                const id = parseTileKey(key);
                const overCap = id.z > this.pinnedZoomCap(id, altitudeM);
                if ((cullOverFinePins && overCap)
                    || this.meshFullyReplaced(id, meshedKeys)) {
                    const m = this.meshes.get(key)!;
                    this.group.remove(m.root);
                    m.dispose();
                    this.meshes.delete(key);
                    meshedKeys.delete(key);
                    this.dirty = true;
                }
                continue;
            }
            const id = parseTileKey(key);
            if (this.shouldKeepTerrainMesh(id, want, cover, altitudeM, meshedKeys)) {
                continue;
            }
            const m = this.meshes.get(key)!;
            this.group.remove(m.root);
            m.dispose();
            this.meshes.delete(key);
            this.dirty = true;
        }

        // Every wanted leaf MUST end up meshed — leaf count is already governed
        // by the SSE detail scale, so a separate mesh cap would just starve
        // coverage: cover ancestors are disposed once children exist and are
        // never rebuilt, so capped-out leaves became permanent black holes.
        // The governed budget below only gates optional extras (pin restores).
        const budget = Math.max(
            250,
            Math.floor(terrainMeshBudget(altitudeM) / this.appliedDetailScale),
        );
        // Building dense grids is CPU-heavy; when the frame is already over
        // budget, trickle creates instead of amplifying the overload.
        // Never burst-create when the unmeshed queue is large — approach and
        // space both hit 1 FPS when 100+ fullRes coast tiles build in one reconcile.
        const spaceView = altitudeM >= SPACE_SKY_ALTITUDE_M;
        const unmeshedCount = cover.unmeshed.size;
        // Hysteresis: a brief dip under 30 ms used to unlock 64 creates while
        // thousands of leaves were still unmeshed — instant hitch + LOD flash.
        // Mid-alt uses coast-first create order (below); keep the same create
        // cap as approach — a higher trickle spiked frame EMA and drove the
        // detail governor to max (mesh grids went extremely coarse).
        const midHighAlt = this.qt.isMidAltBand;
        let createsBudget: number;
        // Throttle on frame time only. Coupling unmeshed>400 → 8 creates left
        // the mid-alt ocean disk permanently starved (unmeshed ~1600, 5 meshes
        // per reconcile) — forward view stayed one coarse cover block.
        if (this.frameEmaMs > TERRAIN_TARGET_FRAME_MS * 1.15) {
            createsBudget = 8;
        } else if (this.frameEmaMs > TERRAIN_TARGET_FRAME_MS * 0.9 || unmeshedCount > 120) {
            createsBudget = 16;
        } else {
            createsBudget = TERRAIN_MESH_CREATES_PER_FRAME;
        }
        // Mid-alt: frame EMA often sits ~29–40 ms, so the 1.15× branch would
        // lock creates at 8 and leave a large unmeshed ocean disk. Allow a
        // higher trickle while the backlog is large and frames are only
        // mildly over target.
        if (midHighAlt && unmeshedCount > 400 && this.frameEmaMs <= 45) {
            createsBudget = Math.max(createsBudget, 24);
        } else if (midHighAlt && this.frameEmaMs <= TERRAIN_TARGET_FRAME_MS * 1.1 && unmeshedCount > 400) {
            createsBudget = Math.max(createsBudget, 32);
        }
        let createsLeft = createsBudget;

        // Two-phase create: coverage first (coarse / ocean / inland), then coast
        // detail — stops shoreline leaves from starving the rest of the disk.
        const viewRange = terrainViewRangeM(altitudeM);
        // Mid-alt: horizon ocean tile centres can sit beyond viewRange; extend
        // create eligibility so refined z6/z7 ahead of the camera can mesh.
        const horizon = geometricHorizonDistanceM(altitudeM);
        const createRange = midHighAlt
            ? Math.max(viewRange, horizon * 2.5, 1_200_000)
            : viewRange;
        // Reuse QT LOD cache — re-running analyzeTileLod over thousands of
        // leaves was a major slice of the 200–400 ms approach reconcile.
        const ranked = leaves
            .map(id => {
                const info = this.qt.tileLodInfo(id);
                return {
                    id,
                    dist: this.tileCentreDistance(id, camera.position),
                    lod: info.lod,
                    deltaH: info.deltaH,
                    coarse: id.z <= COARSE_SHELL_MAX_ZOOM,
                };
            })
            .filter(t => {
                if (this.shouldSkipTerrainLeaf(t.id, altitudeM)) {
                    return false;
                }
                return t.dist <= createRange || t.coarse;
            });

        const byCoverage = (a: typeof ranked[0], b: typeof ranked[0]) => {
            if (a.coarse !== b.coarse) {
                return a.coarse ? -1 : 1;
            }
            // Ocean before inland before coast for coverage pass.
            const pri = (lod: typeof a.lod) => (lod === 'ocean' ? 0 : lod === 'inland' ? 1 : 2);
            const dPri = pri(a.lod) - pri(b.lod);
            if (dPri !== 0) {
                return dPri;
            }
            if (a.lod === 'inland' && b.lod === 'inland' && a.deltaH !== b.deltaH) {
                return b.deltaH - a.deltaH;
            }
            return a.dist - b.dist;
        };
        const byCoastDetail = (a: typeof ranked[0], b: typeof ranked[0]) => a.dist - b.dist;

        const coverageList = ranked
            .filter(t => t.coarse || t.lod !== 'coast')
            .sort(byCoverage);
        const coastList = ranked
            .filter(t => !t.coarse && t.lod === 'coast')
            .sort(byCoastDetail);

        const createBatch = (list: typeof ranked) => {
            for (const t of list) {
                if (createsLeft <= 0) {
                    break;
                }
                const key = tileKey(t.id);
                const existing = this.meshes.get(key);
                if (existing) {
                    // Pinned pad tiles are baked at boot — don't churn them here.
                    if (this.pinned.has(key)) {
                        continue;
                    }
                    // Meshes are cached as built. Rebuild when the tile wants a
                    // finer grid (reclassified as coast / governor relaxed) or
                    // finer DEM data is now resident than what was baked in —
                    // otherwise coarse shoreline patches persist forever.
                    const padOpts = this.padMeshOptions(t.id, t.lod, t.deltaH);
                    const fullRes = padOpts.fullRes;
                    const wantRes = meshResForTile(
                        t.id.z, t.deltaH, fullRes, this.appliedDetailScale,
                    );
                    const residentDem = this.residentDemZoomFor(t.id);
                    const wantsFinerGrid = wantRes > existing.res;
                    const wantsFinerDem = existing.demZoom !== undefined
                        && existing.demZoom < Math.min(t.id.z, this.dem.manifest.maxZoom)
                        && residentDem > existing.demZoom;
                    const wantsHeightRefresh = existing.heightRevision !== this.flattenPad.heightRevision
                        || existing.fullRes !== fullRes
                        || existing.uniformLandTone !== padOpts.uniformLandTone;
                    const wantsCoarserDemRefresh = existing.demZoom !== undefined
                        && residentDem >= 0
                        && residentDem < existing.demZoom;
                    if (!wantsFinerGrid && !wantsFinerDem && !wantsHeightRefresh && !wantsCoarserDemRefresh) {
                        continue;
                    }
                    if (this.dem.coversTile(t.id) && !this.demTileHasHeight(t.id)) {
                        void this.dem.requestTile(t.id);
                        continue;
                    }
                    this.group.remove(existing.root);
                    existing.dispose();
                    this.meshes.delete(key);
                }
                this.createMesh(t.id);
                createsLeft -= 1;
            }
        };

        // Prefer real leaves so the trickle converges, but keep a small cover
        // reserve — without it, far ocean stayed empty while DEM leaves ate
        // every create slot (leaf-first regression).
        const coverReserve = Math.min(3, createsLeft);
        createsLeft -= coverReserve;

        if (spaceView || midHighAlt) {
            // Mid-alt: horizon-disk ocean before near coast so refined z6/z7
            // ahead of the camera actually gets create slots.
            const horizonDisk = horizon * 2.5;
            const nearest = ranked.slice().sort((a, b) => {
                const aOcean = a.lod === 'ocean' && a.dist <= horizonDisk ? 0 : 1;
                const bOcean = b.lod === 'ocean' && b.dist <= horizonDisk ? 0 : 1;
                if (aOcean !== bOcean) {
                    return aOcean - bOcean;
                }
                return a.dist - b.dist;
            });
            createBatch(nearest);
        } else {
            // Ocean / coarse shell first so the far water disk fills early.
            const waterFirst = coverageList.filter(t => t.lod === 'ocean' || t.coarse);
            const restCoverage = coverageList.filter(t => t.lod !== 'ocean' && !t.coarse);
            createBatch(waterFirst);
            createBatch(restCoverage);
            createBatch(coastList);
        }

        // Restore pinned meshes once altitude / coast-inland LOD allows their zoom.
        const meshedAfterCreate = new Set(this.meshes.keys());
        for (const key of this.pinned) {
            if (createsLeft <= 0 || this.meshes.has(key) || this.meshes.size >= budget) {
                continue;
            }
            const id = parseTileKey(key);
            if (id.z > this.pinnedZoomCap(id, altitudeM)) {
                continue;
            }
            // Finer QT coverage already owns this footprint — recreating the pin
            // would stack a second layer (the airfield double-mesh bug).
            if (this.meshFullyReplaced(id, meshedAfterCreate)) {
                continue;
            }
            this.createMesh(id);
            meshedAfterCreate.add(key);
            createsLeft -= 1;
        }

        createsLeft += coverReserve;
        const coverMissing = [...cover.ancestors]
            .filter(k => !this.meshes.has(k))
            .map(k => parseTileKey(k))
            .sort((a, b) => a.z - b.z);
        for (const id of coverMissing) {
            if (createsLeft <= 0) {
                break;
            }
            if (this.shouldSkipTerrainLeaf(id, altitudeM)) {
                continue;
            }
            const before = this.meshes.size;
            this.createMesh(id);
            if (this.meshes.size > before) {
                createsLeft -= 1;
            }
        }

        // Live tuning/diagnostics hook (read from the console as __terrainStats).
        // zoomByLevel: leaf counts per QT zoom — should show a spread when LOD
        // rings are working (not a single zoom owning every leaf).
        const zoomByLevel: Record<string, number> = {};
        for (let i = 0; i < leaves.length; i++) {
            const z = String(leaves[i].z);
            zoomByLevel[z] = (zoomByLevel[z] ?? 0) + 1;
        }
        (globalThis as Record<string, unknown>).__terrainStats = {
            meshes: this.meshes.size,
            leaves: leaves.length,
            zoomByLevel,
            budget,
            detailScale: Number(this.detailScale.toFixed(2)),
            frameEmaMs: Number(this.frameEmaMs.toFixed(1)),
            altitudeM: Math.round(altitudeM),
        };

        const layer = lists.get(SceneLayers.Terrain);
        if (layer && this.group.children.length > 0) {
            attachToRenderList(layer, this.group);
        }
        this.dirty = false;
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

    private createMesh(id: TileId): void {
        const key = tileKey(id);
        if (this.meshes.has(key)) {
            return;
        }
        // Never bake DEM land as sea — wait until a height sample is resident.
        if (this.dem.coversTile(id) && !this.demTileHasHeight(id)) {
            void this.dem.requestTile(id);
            return;
        }
        const info = analyzeTileLod(this.source, this.seaLevel, id);
        const padOpts = this.padMeshOptions(id, info.lod, info.deltaH);
        const fullRes = padOpts.fullRes || this.seedDenseMeshes;
        const handle = buildTerrainMesh(id, this.source, this.frame, this.materials, this.seaLevel, {
            deltaH: info.deltaH,
            fullRes,
            uniformLandTone: padOpts.uniformLandTone,
            detailScale: this.appliedDetailScale,
            heightRevision: this.flattenPad.heightRevision,
        });
        if (this.dem.coversTile(id)) {
            const b = tileBounds(id);
            handle.demZoom = this.dem.residentZoomAt(
                0.5 * (b.west + b.east), 0.5 * (b.south + b.north),
            );
            // Built from coarse ancestor data — fetch the native tile so the
            // upgrade pass can re-bake the shoreline at full resolution.
            if (handle.demZoom < id.z) {
                void this.dem.requestTile(id);
            }
        }
        this.meshes.set(key, handle);
        this.group.add(handle.root);
        this.dirty = true;
    }

    /** Finest resident DEM zoom at the tile centre; −1 if nothing resident. */
    private residentDemZoomFor(id: TileId): number {
        const b = tileBounds(id);
        return this.dem.residentZoomAt(0.5 * (b.west + b.east), 0.5 * (b.south + b.north));
    }

    /** True if the tile centre (or a corner) has a resident DEM sample. */
    private demTileHasHeight(id: TileId): boolean {
        const b = tileBounds(id);
        const pts: Array<[number, number]> = [
            [0.5 * (b.west + b.east), 0.5 * (b.south + b.north)],
            [b.west, b.south],
            [b.east, b.north],
        ];
        for (const [lon, lat] of pts) {
            if (this.dem.hasResidentHeight(lon, lat)) {
                return true;
            }
        }
        return false;
    }

    private tileCentreDistance(id: TileId, cam: THREE.Vector3): number {
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const lat = 0.5 * (b.south + b.north);
        const h = this.source.heightAt(lon, lat);
        const ecef = geodeticToEcef(lat, lon, Number.isFinite(h) ? h : this.seaLevel);
        const world = this.frame.ecefToWorld(ecef);
        return world.distanceTo(cam);
    }
}
