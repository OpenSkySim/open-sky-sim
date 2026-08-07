/** Shared land/water classification for mesh building and physics. */

import { CoastMaskTile, isLandCell, isNodataCell, isWaterCell, sampleLandMaskNearest } from './coastMask';
import { isWaterHeight } from './meshBuilder';
import { LonLatBounds } from './tiling';

export interface CoastMaskConfig {
    enabled: boolean;
    coverage: LonLatBounds;
}

/** True when lon/lat lies inside the OSM coast mask coverage AABB. */
export function inCoastCoverage(lon: number, lat: number, coverage: LonLatBounds): boolean {
    return lon >= coverage.west && lon <= coverage.east
        && lat >= coverage.south && lat <= coverage.north;
}

/**
 * Sample the coast mask at normalised tile UV.
 * Returns LWM_LAND, LWM_WATER, or LWM_NODATA.
 */
export function sampleMaskUv(tile: CoastMaskTile, u: number, v: number): number {
    return sampleLandMaskNearest(tile, u, v);
}

/**
 * Authoritative land/water test.
 *
 * 1. Coast mask sample wins when not nodata.
 * 2. Inside coast coverage but no mask tile → water.
 * 3. Otherwise fall back to DEM height threshold.
 */
export function isLand(
    lon: number,
    lat: number,
    demHeight: number,
    maskValue: number | undefined,
    seaLevel: number,
    config: CoastMaskConfig | undefined,
): boolean {
    if (maskValue !== undefined && !isNodataCell(maskValue)) {
        return isLandCell(maskValue);
    }
    if (config?.enabled && inCoastCoverage(lon, lat, config.coverage)) {
        return false;
    }
    return !isWaterHeight(demHeight, seaLevel);
}

/** Convenience: is this mask sample water (including nodata-as-fallback)? */
export function isWaterFromMask(maskValue: number): boolean {
    return isWaterCell(maskValue) || isNodataCell(maskValue);
}

/** Grid cell is water for mesh building when landMask is present. */
export function isWaterGridCell(landMask: Uint8Array | undefined, index: number, height: number, seaLevel: number): boolean {
    if (landMask) {
        const v = landMask[index];
        if (!isNodataCell(v)) {
            return isWaterCell(v);
        }
    }
    return isWaterHeight(height, seaLevel);
}
