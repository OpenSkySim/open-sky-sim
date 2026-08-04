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
 * Dense altitude→zoom anchors. High-alt values kept modest for mesh budget;
 * steps stay ~1 zoom apart for smoother rings.
 */
const ZOOM_ALTITUDE_ANCHORS_M: ReadonlyArray<readonly [number, number]> = [
    [0, 12],
    [5_000, 11],
    [12_000, 10],
    [20_000, 9],
    [35_000, 8],
    [55_000, 7],
    [80_000, 6],
    [120_000, 5],
    [200_000, 4.5],
    [400_000, 4],
];

/** Active terrain mesh budget by camera altitude (draw-call / GPU cap). */
export function terrainMeshBudget(altitudeM: number): number {
    const h = Math.max(0, altitudeM);
    if (h >= 80_000) {
        return 3000;
    }
    if (h >= 40_000) {
        return 4200;
    }
    if (h >= 15_000) {
        return 6500;
    }
    return 9000;
}

/** Max new terrain meshes to build in one frame (avoids hitch spikes). */
export const TERRAIN_MESH_CREATES_PER_FRAME = 64;

/** Frame-time target for the terrain detail governor (~40 FPS). */
export const TERRAIN_TARGET_FRAME_MS = 25;

/** LOD reconcile (refine / create / evict) cadence; rendering stays per-frame. */
export const TERRAIN_RECONCILE_INTERVAL_MS = 100;

/** Governor bounds: 1 = full detail, higher = coarser everything. The max must
 * give the governor enough authority to reach ~40 FPS on weak GPUs, where the
 * mesh count needs to drop well below the nominal budget. */
export const TERRAIN_DETAIL_SCALE_MIN = 1;
export const TERRAIN_DETAIL_SCALE_MAX = 24;

/**
 * One governor step: raise the detail scale (coarser terrain) when the frame
 * EMA overshoots the target, relax slowly when there is headroom. Asymmetric
 * rates avoid oscillation; call once per frame with a smoothed frame time.
 */
export function adjustTerrainDetailScale(
    current: number,
    frameEmaMs: number,
    targetMs: number = TERRAIN_TARGET_FRAME_MS,
): number {
    let next = current;
    if (frameEmaMs > targetMs * 1.08) {
        next = current * 1.06;
    } else if (frameEmaMs < targetMs * 0.82) {
        next = current * 0.985;
    }
    return Math.min(TERRAIN_DETAIL_SCALE_MAX, Math.max(TERRAIN_DETAIL_SCALE_MIN, next));
}

/** Interpolated zoom (fractional) before clamping to an integer level. */
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

/**
 * Cap QT refinement by altitude (smooth dense curve → integer zoom).
 */
export function terrainMaxZoomForAltitudeM(altitudeM: number, absoluteMax: number): number {
    const z = Math.round(terrainZoomCurveForAltitudeM(altitudeM));
    return Math.min(absoluteMax, Math.max(0, z));
}

/** LOD class for QT max-zoom selection. */
export type TerrainLodClass = 'ocean' | 'inland' | 'coast';

/**
 * Extra coast QT levels past DEM maxZoom, reachable only via SSE at close
 * range (no force-split): nearby shoreline silhouettes subdivide, distant
 * coast stays at native DEM zoom.
 */
export const COAST_DETAIL_EXTRA_LEVELS = 3;

/** Extra QT levels inland stays below the altitude curve (coast unchanged). */
export const INLAND_LOD_DROP = 4;

/** Fractional bias applied on top of the altitude curve. */
export function lodClassZoomBias(lodClass: TerrainLodClass): number {
    if (lodClass === 'coast') {
        return 3.5;
    }
    if (lodClass === 'inland') {
        return -2.5 - INLAND_LOD_DROP;
    }
    return 0;
}

/** Coastline tiles: altitude curve + extra room, capped at DEM native zoom. */
export function terrainCoastMaxZoomForAltitudeM(altitudeM: number, absoluteMax: number): number {
    return Math.min(
        absoluteMax,
        terrainMaxZoomForAltitudeM(altitudeM, absoluteMax) + 5,
    );
}

/**
 * Hard floor for coast leaves inside {@link coastFloorRangeM}. Low altitude
 * keeps native DEM (z11); space views step down so the leaf count stays
 * meshable — a z11 floor at 100 km spawned thousands of tiles and left
 * rectangular holes while the create queue caught up.
 */
export function coastMinZoom(
    demMaxZoom: number,
    absoluteMax: number,
    altitudeM = 0,
): number {
    const h = Math.max(0, altitudeM);
    let floor = demMaxZoom;
    if (h >= 200_000) {
        floor = demMaxZoom - 2;
    } else if (h >= 50_000) {
        floor = demMaxZoom - 1;
    }
    return Math.min(absoluteMax, Math.max(0, floor));
}

/**
 * How far (m) the coast zoom floor is enforced. Only used from space — below
 * that the floor is off (approach uses distance falloff + SSE instead).
 */
export function coastFloorRangeM(altitudeM: number): number {
    const h = Math.max(0, altitudeM);
    if (h >= 50_000) {
        return terrainViewRangeM(h);
    }
    return 0;
}

/** Inland DEM baseline (no flatness): well under the altitude curve. */
export function terrainInlandMaxZoomForAltitudeM(altitudeM: number, absoluteMax: number): number {
    return Math.min(
        absoluteMax,
        Math.max(COARSE_SHELL_MAX_ZOOM, terrainMaxZoomForAltitudeM(altitudeM, absoluteMax) - 1 - INLAND_LOD_DROP),
    );
}

/**
 * Inland max zoom from tile height range (m). Flats coarsen; relief keeps
 * more of the altitude curve. Always ≤ coast room at the same altitude.
 * Buckets are a fallback — the primary control is {@link verticalErrorPx},
 * which is distance-aware, so thresholds here are deliberately loose.
 */
export function inlandMaxZoomForFlatness(
    altitudeM: number,
    absoluteMax: number,
    deltaHM: number,
): number {
    const altCap = terrainMaxZoomForAltitudeM(altitudeM, absoluteMax);
    const d = Math.max(0, deltaHM);
    let drop: number;
    if (d < 25) {
        drop = 3;
    } else if (d < 100) {
        drop = 2;
    } else if (d < 300) {
        drop = 1;
    } else {
        drop = 0;
    }
    return Math.min(absoluteMax, Math.max(COARSE_SHELL_MAX_ZOOM, altCap - drop - INLAND_LOD_DROP));
}

/**
 * Projected size (px) of a tile's height range on screen. Below a few pixels
 * the relief cannot be seen, so splitting the tile buys nothing.
 */
export function verticalErrorPx(deltaHM: number, distM: number, sseFactor: number): number {
    return (Math.max(0, deltaHM) / Math.max(1, distM)) * sseFactor;
}

/** Inland tiles split only when their relief projects above this (px). */
export const INLAND_VERTICAL_ERROR_SPLIT_PX = 14;

/**
 * Foreshortening of vertical relief by view angle. Looking straight down the
 * height field projects to ~nothing (factor → floor); near the horizon relief
 * reads as silhouette (factor → 1). Ratio of horizontal offset to slant range,
 * floored so extreme relief right under the camera still refines.
 */
export function reliefViewFactor(distM: number, altitudeM: number): number {
    const d = Math.max(1, distM);
    const h = Math.min(d, Math.max(0, altitudeM));
    const horizontal = Math.sqrt(Math.max(0, d * d - h * h));
    return Math.max(0.2, horizontal / d);
}

/** @deprecated Use coast/inland helpers — kept as coast alias for call sites. */
export function terrainDemMaxZoomForAltitudeM(altitudeM: number, absoluteMax: number): number {
    return terrainCoastMaxZoomForAltitudeM(altitudeM, absoluteMax);
}

/**
 * Effective QT max zoom for a tile (no distance term — used for pins / caps).
 * Coast may exceed DEM sourceMax (procedural depth).
 * Pass `deltaHM` for inland flatness capping.
 */
export function effectiveMaxZoom(
    altitudeM: number,
    absoluteMax: number,
    sourceMax: number,
    lodClass: TerrainLodClass,
    deltaHM: number = 0,
): number {
    if (lodClass === 'coast') {
        return Math.min(absoluteMax, sourceMax, terrainCoastMaxZoomForAltitudeM(altitudeM, absoluteMax));
    }
    const capped = Math.min(absoluteMax, sourceMax);
    if (lodClass === 'inland') {
        return Math.min(capped, inlandMaxZoomForFlatness(altitudeM, absoluteMax, deltaHM));
    }
    return Math.min(terrainMaxZoomForAltitudeM(altitudeM, absoluteMax), capped);
}

/**
 * Fractional max zoom including distance falloff. Coast can oversample past DEM
 * zoom so the shoreline silhouette gains QT depth without new height tiles.
 */
export function effectiveMaxZoomFrac(
    altitudeM: number,
    absoluteMax: number,
    sourceMax: number,
    lodClass: TerrainLodClass,
    distM: number = 0,
    deltaHM: number = 0,
): number {
    const capped = Math.min(absoluteMax, sourceMax);
    if (lodClass === 'inland') {
        const flatCap = inlandMaxZoomForFlatness(altitudeM, absoluteMax, deltaHM);
        // Near-range boost is coast-only — close inland must stay coarse.
        const distAdj = Math.min(0, distanceZoomAdjust(distM, altitudeM));
        const z = terrainZoomCurveForAltitudeM(altitudeM)
            + lodClassZoomBias(lodClass)
            + distAdj;
        return Math.min(capped, flatCap, Math.max(COARSE_SHELL_MAX_ZOOM, z));
    }
    // From space, coast keeps a floor on distance falloff so far-horizon
    // shorelines stay even. On approach/cruise, full falloff + a smaller bias —
    // the space bias (+3.5) plus no falloff used to refine the whole facing DEM
    // coast to z11+ (~6k leaves, ~300 ms reconciles, LOD flicker).
    const distAdj = lodClass === 'coast' && altitudeM >= 50_000
        ? Math.max(0, distanceZoomAdjust(distM, altitudeM))
        : distanceZoomAdjust(distM, altitudeM);
    const bias = lodClass === 'coast' && altitudeM < 50_000
        ? 1.0
        : lodClassZoomBias(lodClass);
    const z = terrainZoomCurveForAltitudeM(altitudeM) + bias + distAdj;
    return Math.min(capped, Math.max(0, z));
}

/**
 * Soft distance→zoom delta (fractional). Shallow range so neighboring rings
 * stay within ~1 zoom of each other before QT balance runs.
 */
export function distanceZoomAdjust(distM: number, altitudeM: number): number {
    const near = Math.max(18_000, altitudeM * 0.9);
    const far = Math.max(near * 5, geometricHorizonDistanceM(altitudeM) * 0.75);
    if (distM <= near) {
        return 1.0;
    }
    if (distM >= far) {
        return -1.5;
    }
    const t = (distM - near) / (far - near);
    const s = t * t * (3 - 2 * t);
    return 1.0 + s * (-2.5);
}

/** Main camera far plane (m) for this altitude. */
export function cameraFarForAltitudeM(altitudeM: number): number {
    return Math.min(
        TERRAIN_VIEW_RANGE_MAX_M + 200_000,
        terrainViewRangeM(altitudeM) + Math.max(100_000, altitudeM * 0.5),
    );
}
