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
import { FlattenPadHeightSource, FlattenPadSpec } from './flattenPad';
import { HeightSampler } from './heightSampler';
import { TerrainManifest, basisFromManifest } from './manifest';
import { TerrainQuadtree, leafKeySet } from './quadtree';
import { RenderFrame } from './renderFrame';
import { TerrainMeshHandle, buildTerrainMesh } from './terrainMesh';
import { LonLatBounds, TileId, boundsOverlap, parseTileKey, tileBounds, tileKey } from './tileId';
import { geodeticToEcef, enuToGeodeticApprox, makeEnuBasis } from './geo';
import { EnuBasis } from './geo';
import { COARSE_SHELL_MAX_ZOOM, terrainMaxZoomForAltitudeM, terrainViewRangeM } from './viewRange';
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
    /** Seeded play-area tiles — never pruned by the camera QT. */
    private readonly pinned = new Set<string>();
    private readonly group = new THREE.Group();
    private readonly seaLevel: number;
    private dirty = true;
    /** Active airbase pad; coarse tiles overlapping this must not be meshed. */
    private activePad: FlattenPadSpec | undefined;
    private activePadLonLat: LonLatBounds | undefined;

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
        });
        this.source = this.flattenPad;
        this.sampler = new HeightSampler(this.source, this.frame.basis, this.seaLevel);
        this.qt = new TerrainQuadtree(
            this.source,
            this.frame,
            id => this.dem.requestTile(id),
            {
                maxZoom: options.maxZoom ?? manifest.maxZoom,
                forceRefine: id => this.tileOverlapsActivePad(id),
            },
        );
        this.group.name = 'PlanetTerrain';
    }

    init(_scene: Scene): void {
        //
    }

    /** Load DEM tiles covering a radius around an ENU point (default: origin). */
    async prefetchPlayArea(radiusM: number = 60000, centerE: number = 0, centerN: number = 0): Promise<void> {
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
        const zooms = [Math.min(6, m.maxZoom), Math.min(8, m.maxZoom), m.maxZoom];
        const jobs: Promise<unknown>[] = [];
        for (const z of new Set(zooms)) {
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
                        jobs.push(this.dem.requestTile(id));
                    }
                }
            }
        }
        await Promise.all(jobs);
    }

    /**
     * Force-create DEM meshes for the play area so terrain is visible even before
     * the camera-driven QT has refined (and so we don't depend on leaf ranking).
     */
    seedPlayArea(centerE: number, centerN: number, radiusM: number = 30000): void {
        const m = this.dem.manifest;
        const g = enuToGeodeticApprox(this.frame.basis, centerE, centerN, 0);
        const dLat = radiusM / 110540;
        const dLon = radiusM / (111320 * Math.max(0.2, Math.cos(g.lat * Math.PI / 180)));
        const west = g.lon - dLon;
        const east = g.lon + dLon;
        const south = g.lat - dLat;
        const north = g.lat + dLat;
        this.pinMaxZoomInBounds({ west, south, east, north });
    }

    /**
     * Pin every max-zoom tile overlapping DEM coverage so the archipelago
     * coastline stays sharp from space (not dependent on camera QT / SSE).
     */
    seedDemCoverage(): void {
        this.pinMaxZoomInBounds(this.dem.manifest.coverage);
    }

    private pinMaxZoomInBounds(bounds: LonLatBounds): void {
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

    /**
     * Lock a feathered flat pad (MSL = max DEM under pad) and rebuild seeded meshes
     * so visuals match physics under the airbase.
     */
    lockAirbaseFlattenPad(spec: FlattenPadSpec, seedCenterE: number, seedCenterN: number, seedRadiusM: number): void {
        const h = this.sampleMaxDemUnderPad(spec);
        this.activePad = { ...spec };
        this.activePadLonLat = this.padLonLatBounds(spec);
        this.flattenPad.configure(spec);
        this.flattenPad.setPadHeightMsl(h);
        this.clearMeshes();
        this.seedPlayArea(seedCenterE, seedCenterN, seedRadiusM);
        this.seedDemCoverage();
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
                const h = this.dem.heightAt(g.lon, g.lat);
                if (Number.isFinite(h)) {
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
                const h = this.dem.heightAt(g.lon, g.lat);
                if (Number.isFinite(h)) {
                    hMax = Math.max(hMax, h);
                }
            }
        }
        return Number.isFinite(hMax) ? hMax : this.seaLevel;
    }

    private padLonLatBounds(spec: FlattenPadSpec): LonLatBounds {
        let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
        for (const dx of [-spec.halfW, spec.halfW]) {
            for (const dz of [-spec.halfD, spec.halfD]) {
                const g = enuToGeodeticApprox(
                    this.frame.basis,
                    spec.centerX + dx,
                    spec.centerZ + dz,
                    0,
                );
                west = Math.min(west, g.lon);
                east = Math.max(east, g.lon);
                south = Math.min(south, g.lat);
                north = Math.max(north, g.lat);
            }
        }
        return { west, south, east, north };
    }

    private tileOverlapsActivePad(id: TileId): boolean {
        if (!this.activePadLonLat) {
            return false;
        }
        return boundsOverlap(tileBounds(id), this.activePadLonLat);
    }

    /**
     * Coarse tiles that cross the pad create huge tris that cut through the runway
     * when finer pad meshes exist. At high altitude the QT never reaches maxZoom, so
     * skipping would erase whole ocean leaves (big rectangular holes under space spawn).
     */
    private shouldSkipCoarsePadTile(id: TileId, altitudeM: number): boolean {
        if (!this.tileOverlapsActivePad(id) || id.z >= this.dem.manifest.maxZoom) {
            return false;
        }
        const altCap = terrainMaxZoomForAltitudeM(altitudeM, this.dem.manifest.maxZoom);
        if (altCap < this.dem.manifest.maxZoom) {
            return false;
        }
        return true;
    }

    /**
     * Pinned max-zoom meshes own the DEM footprint. Skip coarser QT leaves only when
     * they lie entirely inside coverage — overlapping (straddling) leaves must still
     * mesh, or the ocean outside the pin set disappears as a rectangular hole.
     */
    private shouldSkipCoarseDemCoverageTile(id: TileId): boolean {
        if (id.z >= this.dem.manifest.maxZoom) {
            return false;
        }
        const b = tileBounds(id);
        const c = this.dem.manifest.coverage;
        return b.west >= c.west && b.east <= c.east
            && b.south >= c.south && b.north <= c.north;
    }

    private shouldSkipTerrainLeaf(id: TileId, altitudeM: number): boolean {
        return this.shouldSkipCoarsePadTile(id, altitudeM)
            || this.shouldSkipCoarseDemCoverageTile(id);
    }

    private clearMeshes(): void {
        for (const key of [...this.meshes.keys()]) {
            const m = this.meshes.get(key)!;
            this.group.remove(m.root);
            m.dispose();
            this.meshes.delete(key);
        }
        this.pinned.clear();
        this.dirty = true;
    }

    update(_delta: number): void {
        // Refinement runs in render3D (needs camera).
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
        this.qt.update(camera, targetWidth, COCKPIT_FOV);
        const leaves = this.qt.getLeaves();
        const want = leafKeySet(leaves);
        const altitudeM = camera.position.y;

        for (const key of [...this.meshes.keys()]) {
            if (this.pinned.has(key)) {
                continue;
            }
            const id = parseTileKey(key);
            const keep = !this.shouldSkipTerrainLeaf(id, altitudeM) && want.has(key);
            if (keep) {
                continue;
            }
            const m = this.meshes.get(key)!;
            this.group.remove(m.root);
            m.dispose();
            this.meshes.delete(key);
            this.dirty = true;
        }

        // Coarse shell first (complete Earth disk), then nearby detail. Avoids
        // LEO holes when fine DEM tiles consume the mesh budget.
        const viewRange = terrainViewRangeM(altitudeM);
        const ranked = leaves
            .map(id => ({ id, dist: this.tileCentreDistance(id, camera.position) }))
            .filter(t => {
                if (this.shouldSkipTerrainLeaf(t.id, altitudeM)) {
                    return false;
                }
                return t.dist <= viewRange || t.id.z <= COARSE_SHELL_MAX_ZOOM;
            })
            .sort((a, b) => {
                if (a.id.z !== b.id.z) {
                    return a.id.z - b.id.z;
                }
                return a.dist - b.dist;
            });

        for (const { id } of ranked) {
            const key = tileKey(id);
            if (this.meshes.has(key)) {
                continue;
            }
            if (this.meshes.size >= 1600) {
                break;
            }
            this.createMesh(id);
        }

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
        const handle = buildTerrainMesh(id, this.source, this.frame, this.materials, this.seaLevel);
        this.meshes.set(key, handle);
        this.group.add(handle.root);
        this.dirty = true;
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
