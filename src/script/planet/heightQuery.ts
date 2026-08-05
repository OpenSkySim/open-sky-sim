/** CPU ground-height queries over the DEM store (physics / AI hot path). */

import { DemStore } from './demStore';
import { sampleBilinear } from './demTile';
import { applyFlattenPad, FlattenPadSpec } from './flattenPad';
import { EnuBasis, enuToGeodeticApprox } from './geodesy';
import { PlanetManifest } from './manifest';
import { WATER_HEIGHT_EPS_M, isWaterHeight } from './meshBuilder';
import {
    LonLatBounds, TileKey, boundsOverlap, parentOf, tileAtLonLat, tileBounds, tileContainsLonLat,
} from './tiling';

export class HeightQuery {
    private pad: FlattenPadSpec | undefined;
    private padHeightMsl: number | undefined;

    constructor(
        private readonly store: DemStore,
        private readonly basis: EnuBasis,
        private readonly manifest: PlanetManifest,
    ) { }

    get seaLevel(): number {
        return this.manifest.seaLevel;
    }

    configurePad(spec: FlattenPadSpec | undefined, heightMsl?: number): void {
        this.pad = spec ? { ...spec } : undefined;
        this.padHeightMsl = heightMsl;
    }

    get padSpec(): FlattenPadSpec | undefined {
        return this.pad;
    }

    get padHeight(): number | undefined {
        return this.padHeightMsl;
    }

    /** ENU up (≈ MSL metres) at a local east/north point. */
    heightAtEnu(e: number, n: number): number {
        const g = enuToGeodeticApprox(this.basis, e, n, 0);
        const h = this.heightAtLonLat(g.lon, g.lat);
        // Pad blend is in ENU so the feather matches the mesh worker.
        const raw = Number.isFinite(h) ? h : this.manifest.seaLevel;
        if (isWaterHeight(raw, this.manifest.seaLevel)) {
            // Never fill ocean to pad height.
            return this.manifest.seaLevel;
        }
        return applyFlattenPad(raw, e, n, this.pad, this.padHeightMsl);
    }

    isLandEnu(e: number, n: number): boolean {
        return this.heightAtEnu(e, n) > this.manifest.seaLevel + WATER_HEIGHT_EPS_M;
    }

    /** Raw DEM sample (no flatten pad), metres above ellipsoid. */
    heightAtLonLat(lon: number, lat: number): number {
        const hit = this.finestCached(lon, lat);
        if (!hit) {
            return this.manifest.seaLevel;
        }
        const b = tileBounds(hit.id);
        const u = (lon - b.west) / (b.east - b.west);
        const v = (northEdgeV(b, lat));
        const h = sampleBilinear(hit.tile, u, v);
        return Number.isFinite(h) ? h : this.manifest.seaLevel;
    }

    /** Max DEM height under a pad footprint (for locking the flatten height). */
    sampleMaxUnderPad(spec: FlattenPadSpec): number {
        let maxH = -Infinity;
        const step = Math.max(10, Math.min(spec.halfW, spec.halfD) / 8);
        for (let dz = -spec.halfD; dz <= spec.halfD; dz += step) {
            for (let dx = -spec.halfW; dx <= spec.halfW; dx += step) {
                const g = enuToGeodeticApprox(this.basis, spec.centerX + dx, spec.centerZ + dz, 0);
                const h = this.heightAtLonLat(g.lon, g.lat);
                if (h > this.manifest.seaLevel && h > maxH) {
                    maxH = h;
                }
            }
        }
        // Corners.
        for (const dx of [-spec.halfW, spec.halfW]) {
            for (const dz of [-spec.halfD, spec.halfD]) {
                const g = enuToGeodeticApprox(this.basis, spec.centerX + dx, spec.centerZ + dz, 0);
                const h = this.heightAtLonLat(g.lon, g.lat);
                if (h > this.manifest.seaLevel && h > maxH) {
                    maxH = h;
                }
            }
        }
        return Number.isFinite(maxH) ? maxH : this.manifest.seaLevel;
    }

    private finestCached(lon: number, lat: number): { id: TileKey; tile: NonNullable<ReturnType<DemStore['getCached']>> } | undefined {
        // Prefer the finest zoom that is actually cached and covers the point.
        for (let z = this.manifest.maxZoom; z >= this.manifest.minZoom; z--) {
            const id = tileAtLonLat(z, lon, lat);
            const tile = this.store.getCached(id);
            if (tile) {
                return { id, tile };
            }
        }
        // Ancestor walk from a tip tile — covers the case where only a coarse
        // parent was ever requested.
        let id: TileKey | undefined = tileAtLonLat(this.manifest.maxZoom, lon, lat);
        while (id) {
            const best = this.store.bestAvailable(id);
            if (best && tileContainsLonLat(tileBounds(best.id), lon, lat)) {
                return best;
            }
            id = parentOf(id);
        }
        return undefined;
    }
}

function northEdgeV(b: LonLatBounds, lat: number): number {
    return (b.north - lat) / (b.north - b.south);
}

/** True when a tile's lon/lat bounds overlap `b`. */
export function tileOverlapsBounds(id: TileKey, b: LonLatBounds): boolean {
    return boundsOverlap(tileBounds(id), b);
}
