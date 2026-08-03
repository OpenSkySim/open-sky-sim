import { TERRAIN_VIEW_RANGE_M } from '../defs';
import { WGS84_A } from './geo';

/** Cap on mesh / camera range (m) — enough for LEO limb with margin. */
export const TERRAIN_VIEW_RANGE_MAX_M = 3_000_000;

/**
 * Coarse QT zoom always meshed for the facing hemisphere (global shell).
 * Keep ≥ altitude zoom cap at LEO so the disk cannot lose children to the budget.
 */
export const COARSE_SHELL_MAX_ZOOM = 4;

/** Hide atmospheric sky billboard above this AGL (m). */
export const SPACE_SKY_ALTITUDE_M = 80_000;

/** Geometric horizon distance (m) for a spherical Earth of radius `radiusM`. */
export function geometricHorizonDistanceM(altitudeM: number, radiusM: number = WGS84_A): number {
    const h = Math.max(0, altitudeM);
    return Math.sqrt(Math.max(0, 2 * radiusM * h + h * h));
}

/** Terrain mesh / QT near-range for this camera altitude (m). */
export function terrainViewRangeM(altitudeM: number): number {
    const horizon = geometricHorizonDistanceM(altitudeM) * 1.15;
    return Math.min(TERRAIN_VIEW_RANGE_MAX_M, Math.max(TERRAIN_VIEW_RANGE_M, horizon));
}

/**
 * Cap QT refinement by altitude so high-altitude views keep a complete coarse
 * shell (avoids parent-split holes when children fail facing / mesh budget).
 */
export function terrainMaxZoomForAltitudeM(altitudeM: number, absoluteMax: number): number {
    const h = Math.max(0, altitudeM);
    let z: number;
    if (h >= 250_000) {
        z = 4;
    } else if (h >= 100_000) {
        z = 5;
    } else if (h >= 40_000) {
        z = 7;
    } else if (h >= 15_000) {
        z = 9;
    } else {
        z = absoluteMax;
    }
    return Math.min(absoluteMax, z);
}

/**
 * Effective QT max zoom for a tile: DEM coverage ignores the altitude cap so
 * island coastlines stay sharp from LEO; ocean stays altitude-capped.
 */
export function effectiveMaxZoom(
    altitudeM: number,
    absoluteMax: number,
    sourceMax: number,
    inDem: boolean,
): number {
    const capped = Math.min(absoluteMax, sourceMax);
    if (inDem) {
        return capped;
    }
    return Math.min(terrainMaxZoomForAltitudeM(altitudeM, absoluteMax), capped);
}

/** Main camera far plane (m) for this altitude. */
export function cameraFarForAltitudeM(altitudeM: number): number {
    return Math.min(
        TERRAIN_VIEW_RANGE_MAX_M + 200_000,
        terrainViewRangeM(altitudeM) + Math.max(100_000, altitudeM * 0.5),
    );
}
