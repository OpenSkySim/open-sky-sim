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

/**
 * Target projected error in pixels before a tile is refined.
 *
 * Halved from 2, which refines each tile at twice the distance and brings the
 * finer level in well before it reaches the aircraft. At 2 px the mid-field sat
 * a level coarser than the altitude cap allowed, so terrain that could have
 * been drawn at z12 was drawn at z11 and read as flat blocks.
 *
 * This is the knob the frame-time governor scales against (see detailScaleFor),
 * so it is a target rather than a promise: if the frame budget cannot carry the
 * extra tiles the governor multiplies it back up and the detail recedes again.
 */
export const SSE_TARGET_PX = 1;

/** LOD reconcile cadence; rendering stays per-frame. */
export const RECONCILE_INTERVAL_MS = 100;

/** Frame-time target for the detail governor (~40 FPS). */
export const TARGET_FRAME_MS = 25;

export const DETAIL_SCALE_MIN = 1;

/**
 * Ceiling on how far the frame-time governor may back off.
 *
 * This is a *detail* knob, and past a point backing off further stops
 * buying frame time -- the draw list is already down to a few dozen tiles --
 * while the terrain visibly coarsens and then re-refines on every camera or
 * aircraft move. At 24 the governor could switch LOD off outright: the SSE
 * target became 48 px and ~37 tiles were drawn where ~114 belong, which reads
 * as terrain streaming in as you fly rather than simply being there.
 */
export const DETAIL_SCALE_MAX = 4;

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

/**
 * Fastest the view can swing, in rad/s. Matches the numpad orbit rate, which
 * is the quickest way to move the camera relative to the world.
 */
const MAX_VIEW_TURN_RATE_RAD_S = Math.PI;

/**
 * Angular slack added to the culling frustum.
 *
 * The draw list is rebuilt once per {@link RECONCILE_INTERVAL_MS} and culled
 * exactly to the frustum, so a camera that turns during that window sweeps
 * screen edges the last pass had no reason to keep -- and they render as
 * nothing until the next reconcile catches up. Widening the test by rather
 * more than one interval's worth of rotation means the rim is already drawn
 * when the edge reaches it. The extra band costs draw calls, so it is sized
 * from the actual worst-case turn rate rather than picked by eye.
 */
export const FRUSTUM_CULL_MARGIN_RAD =
    MAX_VIEW_TURN_RATE_RAD_S * (RECONCILE_INTERVAL_MS / 1000) * 1.2;

/** Precomputed, since it multiplies a distance on every node visit. */
export const FRUSTUM_CULL_MARGIN_TAN = Math.tan(FRUSTUM_CULL_MARGIN_RAD);

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

/**
 * Climb faster than it recovers, but not by so much that a transient sticks.
 *
 * The old pair (+6% / -1.5%, recovering only below 0.82x target) was a 4x
 * asymmetry on top of a 24x range: a spike that took five seconds to build
 * took over twenty to unwind, and the dead band was wide enough that ordinary
 * frame-time jitter stalled recovery altogether. The governor therefore spent
 * most of its time backed off, which is a quality regression the frame budget
 * was never actually asking for.
 */
const DETAIL_CLIMB = 1.06;
const DETAIL_DECAY = 0.96;

export function adjustDetailScale(
    current: number,
    frameEmaMs: number,
    targetMs: number = TARGET_FRAME_MS,
): number {
    let next = current;
    if (frameEmaMs > targetMs * 1.08) {
        next = current * DETAIL_CLIMB;
    } else if (frameEmaMs < targetMs * 0.9) {
        next = current * DETAIL_DECAY;
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
