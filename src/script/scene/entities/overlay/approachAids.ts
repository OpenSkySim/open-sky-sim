/**
 * Shared ILS / approach geometry for airfield and carrier HUD symbology.
 *
 * Carrier recovery reference (naval fighters in the groove):
 *   AoA        8.0°–8.5° on-speed (indexer donut / E-bracket)
 *   Glide path 3.0° visual (meatball on datum)
 *   Speed      ~130–145 KIAS (weight-dependent; HUD uses mid-band target)
 *   Sink       ~700 fpm on a 3° path at that speed
 */
import * as THREE from 'three';
import { AIRBASE_RUNWAY, RUNWAY_HALF_LENGTH_M } from '../../../defs';
import { WeaponsTarget } from '../weaponsTarget';
import { ARRESTOR_CARRIER_ORIGIN } from '../arrestorCables';

/** Visual / ILS glideslope angle (degrees). */
export const ILS_GLIDESLOPE_DEG = 3.0;
/** ~3° glideslope tangent (same as AI / carrier approach planning). */
export const ILS_GLIDESLOPE_TAN = Math.tan((ILS_GLIDESLOPE_DEG * Math.PI) / 180);

/** Lower bound of the carrier on-speed AoA band (deg). */
export const CARRIER_AOA_ON_SPEED_MIN_DEG = 8.0;
/** Upper bound of the carrier on-speed AoA band (deg). */
export const CARRIER_AOA_ON_SPEED_MAX_DEG = 8.5;
/** Midpoint used when a single on-speed reference is needed. */
export const CARRIER_AOA_ON_SPEED_DEG =
    0.5 * (CARRIER_AOA_ON_SPEED_MIN_DEG + CARRIER_AOA_ON_SPEED_MAX_DEG);

/** Nominal carrier approach speed (KIAS); mid of the 130–145 band. */
export const CARRIER_APPROACH_SPEED_KIAS = 137;
/** Nominal approach sink rate down the groove (ft/min). */
export const CARRIER_APPROACH_SINK_FPM = 700;

const KIAS_TO_MPS = 0.514444;
const FPM_TO_MPS = 0.00508;

/** Nominal carrier approach speed (m/s). */
export const CARRIER_APPROACH_SPEED_MPS = CARRIER_APPROACH_SPEED_KIAS * KIAS_TO_MPS;
/** Nominal approach sink rate (m/s, negative = descending). */
export const CARRIER_APPROACH_SINK_MPS = -CARRIER_APPROACH_SINK_FPM * FPM_TO_MPS;

/** Full-scale localizer deflection ≈ this lateral miss (m). */
const LOC_FULL_SCALE_M = 90;
/** Full-scale glideslope deflection ≈ this altitude miss (m). */
const GS_FULL_SCALE_M = 40;

/** Kuznetsov hull extents in carrier-local space (matches game.ts). */
const KUZ_HULL = { minX: -34.33, maxX: 43.83, minZ: -177.88, maxZ: 124.28 };
const KUZ_DECK_MID_X = (KUZ_HULL.minX + KUZ_HULL.maxX) * 0.5;
/** Touchdown aiming point near the stern threshold. */
const KUZ_TOUCHDOWN_LOCAL_Z = KUZ_HULL.maxZ - 30;
const KUZ_DECK_Y = 13.55;

export type AoaIndexerCue = 'slow' | 'onSpeed' | 'fast';

export function isIlsApproachTarget(t: WeaponsTarget | undefined): boolean {
    return !!t && !t.airborne && (t.targetType === 'Airbase' || t.targetType === 'Carrier');
}

/**
 * Navy AoA indexer cue for the 8.0°–8.5° on-speed band.
 * High AoA → slow; low AoA → fast.
 */
export function aoaIndexerCue(aoaDeg: number): AoaIndexerCue {
    if (aoaDeg > CARRIER_AOA_ON_SPEED_MAX_DEG) return 'slow';
    if (aoaDeg < CARRIER_AOA_ON_SPEED_MIN_DEG) return 'fast';
    return 'onSpeed';
}

/** Target approach speed in the active display unit (kt or km/h). */
export function carrierApproachTargetSpeed(imperial: boolean): number {
    return imperial
        ? CARRIER_APPROACH_SPEED_KIAS
        : Math.round(CARRIER_APPROACH_SPEED_MPS * 3.6);
}

/** Target sink magnitude in the active display unit (fpm or m/s). */
export function carrierApproachTargetSink(imperial: boolean): number {
    return imperial
        ? CARRIER_APPROACH_SINK_FPM
        : Math.round(Math.abs(CARRIER_APPROACH_SINK_MPS) * 10) / 10;
}

export interface IlsDeviation {
    /** -1 = fly left (course to the left), +1 = fly right. */
    localizer: number;
    /** -1 = fly down (above path), +1 = fly up (below path). */
    glideslope: number;
}

/**
 * ILS needle deviations in [-1, 1] for the given aircraft world position.
 * Returns null when the target type is not an approach aid.
 * For carriers, pass the live carrier world origin so the needles track the ship.
 */
export function computeIlsDeviation(
    position: THREE.Vector3,
    targetType: string,
    carrierOrigin: { x: number; y: number; z: number } = ARRESTOR_CARRIER_ORIGIN,
): IlsDeviation | null {
    if (targetType === 'Airbase') {
        return airbaseIls(position);
    }
    if (targetType === 'Carrier') {
        return carrierIls(position, carrierOrigin);
    }
    return null;
}

function airbaseIls(position: THREE.Vector3): IlsDeviation {
    // Approach along +Z (heading 0); touchdown near the south threshold.
    const touchZ = AIRBASE_RUNWAY.z - RUNWAY_HALF_LENGTH_M + 200;
    const centerX = AIRBASE_RUNWAY.x;
    const distToTouch = Math.max(0, touchZ - position.z);
    const desiredAlt = distToTouch * ILS_GLIDESLOPE_TAN;
    // Right of course → positive lateral; CDI: fly opposite → negate.
    const lateral = position.x - centerX;
    const altErr = position.y - desiredAlt;
    return {
        localizer: clamp1(-lateral / LOC_FULL_SCALE_M),
        glideslope: clamp1(-altErr / GS_FULL_SCALE_M),
    };
}

function carrierIls(
    position: THREE.Vector3,
    origin: { x: number; y: number; z: number },
): IlsDeviation {
    // Approach along −Z (heading π); touchdown near stern.
    const centerX = origin.x + KUZ_DECK_MID_X;
    const touchZ = origin.z + KUZ_TOUCHDOWN_LOCAL_Z;
    const distToTouch = Math.max(0, position.z - touchZ);
    const desiredAlt = origin.y + KUZ_DECK_Y + distToTouch * ILS_GLIDESLOPE_TAN;
    // Facing −Z: world +X is left of aircraft → invert lateral sense.
    const lateral = position.x - centerX;
    const altErr = position.y - desiredAlt;
    return {
        localizer: clamp1(lateral / LOC_FULL_SCALE_M),
        glideslope: clamp1(-altErr / GS_FULL_SCALE_M),
    };
}

function clamp1(v: number): number {
    if (v < -1) return -1;
    if (v > 1) return 1;
    return v;
}
