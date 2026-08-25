/**
 * CPU ground-height queries.
 *
 * The old HeightQuery walked from maxZoom downwards through whatever the
 * *renderer* happened to have in its LRU, so the same (x, z) returned
 * different heights depending on where the camera was. That fed spawns,
 * collisions, AI and scenery placement, and the physics worker's entire
 * terrain model was a boot-time snapshot of 25,921 such calls.
 *
 * Here the fine tier is pinned to a single zoom and lives in its own store
 * that the renderer cannot influence, and a coarse tier is loaded in full at
 * boot so a query outside the streamed area returns a coarse answer with a
 * stated bound rather than a silent lie. `heightResolutionAt` reports which
 * tier answered, so the HUD can prove it never changes as you climb.
 */

import { DemTile, sampleBilinear } from './demTile';
import { EnuBasis, enuToGeodeticApprox } from './geodesy';
import { FlattenPad, applyFlattenPad } from './flattenPad';
import { TerrainManifest } from './manifest';
import { TileKey, tileAtLonLat, tileBounds } from './tiling';
import { TileStore } from './tileStore';

/** Heights at or below seaLevel + this are open water. */
export const WATER_HEIGHT_EPS_M = 0.5;

export type HeightTier = 'fine' | 'coarse' | 'none';

export interface HeightFieldOptions {
    manifest: TerrainManifest;
    store: TileStore<DemTile>;
    basis: EnuBasis;
    pads?: FlattenPad[];
}

export class HeightField {
    private readonly manifest: TerrainManifest;
    private readonly store: TileStore<DemTile>;
    private readonly basis: EnuBasis;
    private readonly pads: FlattenPad[];
    /** Always-resident coarse tier, keyed by tile. */
    private readonly coarse = new Map<string, DemTile>();

    constructor(opts: HeightFieldOptions) {
        this.manifest = opts.manifest;
        this.store = opts.store;
        this.basis = opts.basis;
        this.pads = opts.pads ?? [];
    }

    get seaLevel(): number {
        return this.manifest.seaLevel;
    }

    get queryZoom(): number {
        return this.manifest.height.queryZoom;
    }

    get coarseZoom(): number {
        return this.manifest.height.coarseZoom;
    }

    /** Load the coarse tier in full. Cheap: a handful of tiles. */
    async loadCoarse(): Promise<void> {
        const z = this.coarseZoom;
        const cov = this.manifest.coverage;
        const span = 180 / (1 << z);
        const x0 = Math.floor((cov.west + 180) / span);
        const x1 = Math.floor((cov.east + 180) / span);
        const y0 = Math.floor((90 - cov.north) / span);
        const y1 = Math.floor((90 - cov.south) / span);
        const jobs: Array<Promise<void>> = [];
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const id: TileKey = { z, x, y };
                jobs.push(this.store.request(id, Number.MAX_SAFE_INTEGER).then(tile => {
                    if (tile) {
                        this.coarse.set(`${z}/${x}/${y}`, tile);
                        this.store.setPinned(id, true);
                    }
                }));
            }
        }
        await Promise.all(jobs);
    }

    /** Ensure the fine tier covers a lon/lat box. Await before relying on it. */
    async ensureLoaded(bounds: {
        west: number; south: number; east: number; north: number;
    }): Promise<void> {
        const z = this.queryZoom;
        const span = 180 / (1 << z);
        const x0 = Math.floor((bounds.west + 180) / span);
        const x1 = Math.floor((bounds.east + 180) / span);
        const y0 = Math.floor((90 - bounds.north) / span);
        const y1 = Math.floor((90 - bounds.south) / span);
        const jobs: Array<Promise<unknown>> = [];
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                jobs.push(this.store.request({ z, x, y }, Number.MAX_SAFE_INTEGER));
            }
        }
        await Promise.all(jobs);
    }

    /** Ensure the fine tier covers a radius (m) around an ENU point. */
    async ensureLoadedAroundEnu(e: number, n: number, radiusM: number): Promise<void> {
        const c = enuToGeodeticApprox(this.basis, e, n, 0);
        const dLat = radiusM / 110540;
        const dLon = radiusM / (111320 * Math.max(0.1, Math.cos(c.lat * Math.PI / 180)));
        await this.ensureLoaded({
            west: c.lon - dLon,
            east: c.lon + dLon,
            south: c.lat - dLat,
            north: c.lat + dLat,
        });
    }

    /** Which tier would answer a query here. */
    heightResolutionAt(e: number, n: number): HeightTier {
        const g = enuToGeodeticApprox(this.basis, e, n, 0);
        if (this.fineTile(g.lon, g.lat)) {
            return 'fine';
        }
        return this.coarseTile(g.lon, g.lat) ? 'coarse' : 'none';
    }

    /**
     * ENU up (metres above the ellipsoid) at a local east/north point.
     * Synchronous and independent of anything the renderer is doing.
     */
    heightAtEnu(e: number, n: number): number {
        const g = enuToGeodeticApprox(this.basis, e, n, 0);
        const raw = this.heightAtLonLat(g.lon, g.lat);
        if (isWaterHeight(raw, this.manifest.seaLevel)) {
            return raw;
        }
        let h = raw;
        for (const pad of this.pads) {
            h = applyFlattenPad(h, e, n, pad);
        }
        return h;
    }

    isLandEnu(e: number, n: number): boolean {
        return this.heightAtEnu(e, n) > this.manifest.seaLevel + WATER_HEIGHT_EPS_M;
    }

    /** Raw sample, no pad. Fine tier if resident, else coarse, else sea level. */
    heightAtLonLat(lon: number, lat: number): number {
        const fine = this.fineTile(lon, lat);
        if (fine) {
            const h = sampleAt(fine.tile, fine.id, lon, lat);
            if (Number.isFinite(h)) {
                return h;
            }
        }
        const coarse = this.coarseTile(lon, lat);
        if (coarse) {
            const h = sampleAt(coarse.tile, coarse.id, lon, lat);
            if (Number.isFinite(h)) {
                return h;
            }
        }
        return this.manifest.seaLevel;
    }

    private fineTile(lon: number, lat: number): { id: TileKey; tile: DemTile } | undefined {
        const id = tileAtLonLat(this.queryZoom, lon, lat);
        // peek, not get: a CPU height query must never reorder a cache whose
        // eviction the renderer also depends on.
        const tile = this.store.peek(id);
        return tile ? { id, tile } : undefined;
    }

    private coarseTile(lon: number, lat: number): { id: TileKey; tile: DemTile } | undefined {
        const id = tileAtLonLat(this.coarseZoom, lon, lat);
        const tile = this.coarse.get(`${id.z}/${id.x}/${id.y}`);
        return tile ? { id, tile } : undefined;
    }
}

export function isWaterHeight(h: number, seaLevel: number): boolean {
    return !Number.isFinite(h) || h <= seaLevel + WATER_HEIGHT_EPS_M;
}

function sampleAt(tile: DemTile, id: TileKey, lon: number, lat: number): number {
    const b = tileBounds(id);
    const u = (lon - b.west) / (b.east - b.west);
    const v = (b.north - lat) / (b.north - b.south);
    return sampleBilinear(tile, u, v);
}
