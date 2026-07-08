/**
 * Per-aircraft configuration for the FM2 rigid-body "parts" flight model.
 *
 * Everything the FM2 model needs to fly a specific airframe is captured here as
 * plain, JSON-serializable data so it can be authored by the mod importer and
 * shipped through the worker. The F-16 numbers that used to live as module-level
 * constants are packaged as {@link f16Fm2Config} below, so the default aircraft
 * flies exactly as before.
 *
 * Body axes (sim THREE.js convention, see utils/math.ts):
 *   +X = RIGHT, +Y = UP, +Z = FORWARD. Right-handed: RIGHT × UP = FORWARD.
 */
import {
    FM2_AILERON, FM2_BODY_CD0, FM2_FCS, FM2_FLAPS, FM2_GEAR_CD, FM2_GEOMETRY,
    FM2_INERTIA, FM2_SURFACES, FM2_WAVE_DRAG, SurfaceGeometry,
} from './f16Fm2Config';
import { F16_PROFILE } from '../f16Profile';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';

const DEG = Math.PI / 180;

export type { SurfaceGeometry };

/** Reference mass / planform geometry (SI). */
export interface Fm2GeometryConfig {
    massKg: number;
    wingAreaM2: number;
    wingSpanM: number;
    meanChordM: number;
}

/** Principal moments of inertia in the sim body frame (kg·m²). */
export interface Fm2InertiaConfig {
    pitch: number; // about +X (RIGHT)
    yaw: number;   // about +Y (UP)
    roll: number;  // about +Z (FORWARD)
}

/** The set of rigid lifting surfaces that build up the airframe forces. */
export interface Fm2SurfaceSet {
    fuselage: SurfaceGeometry;
    wingLeft: SurfaceGeometry;
    wingRight: SurfaceGeometry;
    htailLeft: SurfaceGeometry;
    htailRight: SurfaceGeometry;
    vtail: SurfaceGeometry;
}

export interface Fm2FlapsConfig {
    aoaBiasRad: number;
    stallReductionRad: number;
    extraCd: number;
}

export interface Fm2WaveDragConfig {
    machOnset: number;
    scale: number;
}

/** Spring-damper landing-gear contact model. */
export interface Fm2GearConfig {
    /** Contact points in the body frame (m); Y ≈ -PLANE_DISTANCE_TO_GROUND. */
    points: [number, number, number][];
    stiffness: number;   // N/m
    damping: number;     // N·s/m
    rollFriction: number;
    brakeFriction: number;
    sideFriction: number;
}

/** Body-frame altitude (m) when level on a flat runway: -min(gear Y). */
export function fm2GroundRestHeight(config: Fm2AircraftConfig): number {
    return -Math.min(...config.gear.points.map(p => p[1]));
}

/**
 * Engine thrust schedule. When `afterburner` is true the F-16 F100 quadrant and
 * thrust lapse are used verbatim; otherwise a simple linear idle→military
 * schedule with the same ISA density lapse is applied and the throttle behaves
 * as a plain 0–100% lever.
 */
export interface Fm2EngineConfig {
    afterburner: boolean;
    idleThrustKn: number;
    milThrustKn: number;
    abMinThrustKn: number;
    abMaxThrustKn: number;
    milLeverEnd: number;
    abMinLeverEnd: number;
}

export type FcsMode = 'fbw' | 'direct';

/**
 * Flight-control-system configuration. `fbw` selects the F-16 fly-by-wire laws
 * (relaxed-stability g/rate command); `direct` is a mechanical control path
 * (stick → surface, plus a yaw damper) for conventionally-stable aircraft.
 */
export interface Fm2FcsConfig {
    mode: FcsMode;
    /** Max stabilator incidence at full pitch command (rad). */
    maxStabilatorRad: number;
    /** Max rudder-equivalent fin incidence at full yaw command (rad). */
    maxRudderRad: number;
    /** Fraction of roll command routed to the differential stabilator. */
    taileronRollFraction: number;
    /** Extra stabilator gain in the low-q / deep-stall aerobatic envelope. */
    aerobaticStabilatorGain?: number;
    /** Extra stabilator gain during high-speed cobra entry. */
    cobraStabilatorGain?: number;
    /** Direct-mode handling gains (ignored in fbw mode). */
    direct?: Fm2DirectFcsConfig;
}

/** Direct (mechanical) control-law tuning. */
export interface Fm2DirectFcsConfig {
    /** Pitch-rate damping (about +X) folded into the elevator command. */
    pitchRateDamp: number;
    /** Roll-rate damping (about +Z) folded into the aileron command. */
    rollRateDamp: number;
    /** Washed-out yaw-rate damper gain. */
    yawDamperGain: number;
    yawDamperWashoutTauS: number;
    /** Aileron→rudder interconnect for turn coordination. */
    ariGain: number;
    /** First-order actuator lag (s). */
    actuatorTauS: number;
}

/** Speed / stall / touchdown envelope. */
export interface Fm2EnvelopeConfig {
    stallAoaRad: number;
    minFlyingSpeedMps: number;
    /** Reference cruise condition used to normalize FBW dynamic-pressure fades. */
    cruiseAltitudeM: number;
    cruiseSpeedMps: number;
    maxLoadFactorG: number;
    landingMaxSpeedMps: number;
    landingMaxVerticalSpeedMps: number;
    landingMinPitchRad: number;
    landingMaxRollRad: number;
}

/** Everything the FM2 model needs to fly one specific airframe. */
export interface Fm2AircraftConfig {
    geometry: Fm2GeometryConfig;
    inertia: Fm2InertiaConfig;
    surfaces: Fm2SurfaceSet;
    aileronMaxDeflectionRad: number;
    flaps: Fm2FlapsConfig;
    gearCd: number;
    bodyCd0: number;
    waveDrag: Fm2WaveDragConfig;
    gear: Fm2GearConfig;
    engine: Fm2EngineConfig;
    fcs: Fm2FcsConfig;
    envelope: Fm2EnvelopeConfig;
}

/**
 * The F-16C, assembled from the existing FM2 constant tables. Using this config
 * reproduces the previous hard-coded model exactly (regression guard for the
 * default player aircraft).
 */
export const f16Fm2Config: Fm2AircraftConfig = {
    geometry: {
        massKg: FM2_GEOMETRY.massKg,
        wingAreaM2: FM2_GEOMETRY.wingAreaM2,
        wingSpanM: FM2_GEOMETRY.wingSpanM,
        meanChordM: FM2_GEOMETRY.meanChordM,
    },
    inertia: {
        pitch: FM2_INERTIA.pitch,
        yaw: FM2_INERTIA.yaw,
        roll: FM2_INERTIA.roll,
    },
    surfaces: {
        fuselage: FM2_SURFACES.fuselage,
        wingLeft: FM2_SURFACES.wingLeft,
        wingRight: FM2_SURFACES.wingRight,
        htailLeft: FM2_SURFACES.htailLeft,
        htailRight: FM2_SURFACES.htailRight,
        vtail: FM2_SURFACES.vtail,
    },
    aileronMaxDeflectionRad: FM2_AILERON.maxDeflectionRad,
    flaps: {
        aoaBiasRad: FM2_FLAPS.aoaBiasRad,
        stallReductionRad: FM2_FLAPS.stallReductionRad,
        extraCd: FM2_FLAPS.extraCd,
    },
    gearCd: FM2_GEAR_CD,
    bodyCd0: FM2_BODY_CD0,
    waveDrag: { machOnset: FM2_WAVE_DRAG.machOnset, scale: FM2_WAVE_DRAG.scale },
    gear: {
        points: [
            [0.0, -PLANE_DISTANCE_TO_GROUND, 2.6],   // nose
            [-1.2, -PLANE_DISTANCE_TO_GROUND, -0.6], // left main
            [1.2, -PLANE_DISTANCE_TO_GROUND, -0.6],  // right main
        ],
        stiffness: 4.0e6,
        damping: 1.6e5,
        rollFriction: 0.04,
        brakeFriction: 0.55,
        sideFriction: 0.8,
    },
    engine: {
        afterburner: true,
        idleThrustKn: 0.5,
        milThrustKn: 76.3,
        abMinThrustKn: 104.0,
        abMaxThrustKn: F16_PROFILE.abThrustKn,
        milLeverEnd: F16_PROFILE.milLeverEnd,
        abMinLeverEnd: F16_PROFILE.abMinLeverEnd,
    },
    fcs: {
        mode: 'fbw',
        maxStabilatorRad: FM2_FCS.maxStabilatorRad,
        maxRudderRad: 22 * DEG,
        taileronRollFraction: FM2_FCS.taileronRollFraction,
        aerobaticStabilatorGain: FM2_FCS.aerobaticStabilatorGain,
        cobraStabilatorGain: FM2_FCS.cobraStabilatorGain,
    },
    envelope: {
        stallAoaRad: F16_PROFILE.stallAoaDeg * DEG,
        minFlyingSpeedMps: F16_PROFILE.minFlyingSpeedMps,
        cruiseAltitudeM: F16_PROFILE.cruiseAltitudeM,
        cruiseSpeedMps: F16_PROFILE.cruiseSpeedMps,
        maxLoadFactorG: F16_PROFILE.maxLoadFactorG,
        landingMaxSpeedMps: F16_PROFILE.landingMaxSpeedMps,
        landingMaxVerticalSpeedMps: F16_PROFILE.landingMaxVerticalSpeedMps,
        landingMinPitchRad: F16_PROFILE.landingMinPitchDeg * DEG,
        landingMaxRollRad: F16_PROFILE.landingMaxRollDeg * DEG,
    },
};
