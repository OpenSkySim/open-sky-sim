/** Screen-space error LOD policy and altitude helpers. */

import { COCKPIT_FAR, TERRAIN_VIEW_RANGE_M } from '../defs';
import { WGS84_A } from './geodesy';
import { approxTileEdgeMetres, TileKey } from './tiling';

/** Cap on mesh / camera range (m) — enough for LEO limb with margin. */
export const TERRAIN_VIEW_RANGE_MAX_M = 3_000_000;

/** Hide atmospheric sky billboard above this AGL (m). */
export const SPACE_SKY_ALTITUDE_M = 80_000;

/** Subtracted from the altitude zoom curve for inland / open-ocean tiles only. */
export const TERRAIN_ZOOM_OFFSET = 1;

/** Target projected error in pixels before a tile is refined. */
export const SSE_TARGET_PX = 2;

/** LOD reconcile cadence; rendering stays per-frame. */
export const RECONCILE_INTERVAL_MS = 100;

/** Frame-time target for the detail governor (~40 FPS). */
export const TARGET_FRAME_MS = 25;

export const DETAIL_SCALE_MIN = 1;
export const DETAIL_SCALE_MAX = 24;

/**
 * Per-frame GPU upload budget. Tile sizes vary far too much for a fixed count
 * to mean anything, so the streamer paces by time instead.
 */
export const TILE_UPLOAD_BUDGET_MS = 4;

/** Adaptive fetch concurrency bounds. */
export const STREAM_CONCURRENCY_MIN = 6;
export const STREAM_CONCURRENCY_MAX = 32;

/** How far ahead along the camera's view direction to prefetch (seconds). */
export const PREFETCH_LOOKAHEAD_S = 4;

/**
 * Prefetch at least this far ahead, however slowly the camera is moving.
 * Without a floor a camera that only turns — an exterior view orbiting the
 * aircraft — would prefetch nothing at all.
 */
export const PREFETCH_MIN_DISTANCE_M = 3000;

/** Mesh cache ceiling in bytes. Tiles are evicted least-recently-drawn first. */
export const MESH_CACHE_BYTES = 256 * 1024 * 1024;

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
 * Raise the camera far plane with altitude so the planetary limb stays in
 * range. Floor is {@link COCKPIT_FAR}; ceiling matches the view-range cap.
 */
export function cameraFarForAltitudeM(altitudeM: number): number {
    return Math.max(COCKPIT_FAR, terrainViewRangeM(altitudeM) * 1.05);
}

/**
 * Dense altitude→zoom anchors used as a hard refinement cap on top of SSE.
 * Prevents the QT from exploding to native zoom when looking straight down
 * from LEO, where every tile's SSE looks large because d is large but the
 * screen footprint is tiny only after projection — the cap is the safety net.
 */
const ZOOM_ALTITUDE_ANCHORS_M: ReadonlyArray<readonly [number, number]> = [
    [0, 12],
    [5_000, 11],
    [15_000, 11],
    [22_000, 10],
    [35_000, 8],
    [55_000, 7],
    [80_000, 6],
    [120_000, 5],
    [200_000, 4.5],
    [400_000, 4],
];

export function terrainZoomCurveForAltitudeM(altitudeM: number): number {
    const h = Math.max(0, altitudeM);
    const anchors = ZOOM_ALTITUDE_ANCHORS_M;
    if (h <= anchors[0][0]) {
        return anchors[0][1];
    }
    for (let i = 1; i < anchors.length; i++) {
        const [h1, z1] = anchors[i - 1];
        const [h2, z2] = anchors[i];
        if (h <= h2) {
            const t = (h - h1) / (h2 - h1);
            return z1 + (z2 - z1) * t;
        }
    }
    return anchors[anchors.length - 1][1];
}

export function terrainMaxZoomForAltitudeM(
    altitudeM: number,
    absoluteMax: number,
    coastal: boolean = false,
): number {
    const z = Math.round(terrainZoomCurveForAltitudeM(altitudeM));
    const capped = Math.min(absoluteMax, Math.max(0, z));
    if (coastal) {
        return capped;
    }
    return Math.max(0, capped - TERRAIN_ZOOM_OFFSET);
}

export function adjustDetailScale(
    current: number,
    frameEmaMs: number,
    targetMs: number = TARGET_FRAME_MS,
): number {
    let next = current;
    if (frameEmaMs > targetMs * 1.08) {
        next = current * 1.06;
    } else if (frameEmaMs < targetMs * 0.82) {
        next = current * 0.985;
    }
    return Math.min(DETAIL_SCALE_MAX, Math.max(DETAIL_SCALE_MIN, next));
}

/**
 * Ellipsoid sagitta (m) for a tile with no DEM: how far the chord between the
 * tile corners sits below the ellipsoid surface. Used as geometricError so the
 * globe stays round from orbit and stops subdividing over open ocean.
 */
export function ellipsoidSagittaM(id: TileKey): number {
    const arc = approxTileEdgeMetres(id);
    return (arc * arc) / (8 * WGS84_A);
}

/**
 * Projected screen-space error in pixels.
 * `geometricErrorM` is a world-space metres bound (tile geometric error or sagitta).
 */
export function screenSpaceErrorPx(
    geometricErrorM: number,
    distanceM: number,
    screenHeightPx: number,
    fovYDeg: number,
): number {
    const d = Math.max(1, distanceM);
    return geometricErrorM * screenHeightPx / (2 * d * Math.tan(fovYDeg * Math.PI / 360));
}

/** True when the tile should split into its four children. */
export function shouldRefine(
    geometricErrorM: number,
    distanceM: number,
    screenHeightPx: number,
    fovYDeg: number,
    detailScale: number = 1,
    targetPx: number = SSE_TARGET_PX,
): boolean {
    return screenSpaceErrorPx(geometricErrorM, distanceM, screenHeightPx, fovYDeg)
        > targetPx * detailScale;
}
