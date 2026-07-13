/**
 * Per-aircraft configuration for the FM2 rigid-body "parts" flight model.
 *
 * Everything the FM2 model needs to fly a specific airframe is captured here as
 * plain, JSON-serializable data so it can be authored by the mod importer and
 * shipped through the worker. The default-aircraft numbers that used to live as
 * module-level constants are packaged as {@link defaultFm2Config} below, so the
 * default aircraft flies exactly as before.
 *
 * Body axes (sim THREE.js convention, see utils/math.ts):
 *   +X = RIGHT, +Y = UP, +Z = FORWARD. Right-handed: RIGHT × UP = FORWARD.
 */
import {
    FM2_AILERON, FM2_BODY_CD0, FM2_FCS, FM2_FLAPS, FM2_FOREBODY, FM2_GEAR_CD,
    FM2_GEOMETRY, FM2_INERTIA, FM2_SURFACES, FM2_TRANSONIC_PITCH_DAMP, FM2_WAVE_DRAG,
    SurfaceGeometry,
} from './fm2Constants';
import { Fm2ForebodyAsymmetryConfig } from './forebodyAsymmetry';
import { F16_PROFILE } from '../f16Profile';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';

const DEG = Math.PI / 180;

export type { SurfaceGeometry, Fm2ForebodyAsymmetryConfig };

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
    /**
     * Optional dedicated aileron surfaces. When present the roll command is fed to
     * these as a direct incidence (instead of adding it to the wing incidence).
     * Omitted ⇒ no aileron roll authority from separate surfaces.
     */
    aileronLeft?: SurfaceGeometry;
    aileronRight?: SurfaceGeometry;
    /**
     * Optional forward strake / LERX surface, genuinely positioned ahead of the
     * CG. Its own lift curve (vortex lift + unsteady separation lag) acting
     * through this REAL, fixed geometric arm is what can turn a sustained
     * post-stall pull into a genuine nose-up (destabilizing) pitching moment —
     * no scripted CG relocation involved. Omitted ⇒ the airframe has no real
     * source of post-stall pitch-up and stays conventionally stable at all AoA.
     */
    foreStrake?: SurfaceGeometry;
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
 * Engine thrust schedule. When `afterburner` is true the F100-class quadrant and
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

/**
 * Flight-control-system configuration.
 *
 * A SINGLE, config-driven FCS (see fm2/fcs.ts) flies every aircraft. A
 * relaxed-stability fly-by-wire jet and a conventionally-stable mechanical
 * aircraft (e.g. an imported mod) differ ONLY by the values below — the exact
 * same code paths run for both. Per axis, a boolean selects the control law:
 *   - `pitch.gCommand`  true  = relaxed-stability g-command FBW law (PI g
 *                               regulator, AoA limiter, rate/AoA-rate damping,
 *                               limiters-off direct pitch path);
 *                       false = mechanical direct path (stick → elevator with
 *                               pitch-rate damping).
 *   - `roll.rateCommand` true  = roll-rate command FBW loop (dynamic-pressure /
 *                                Mach / AoA-limited commanded rate);
 *                        false = mechanical direct path (stick → aileron with
 *                                roll-rate damping).
 * The yaw law (pedal + washed-out yaw damper + aileron-rudder interconnect) is
 * shared; a mechanical aircraft simply configures lighter gains.
 */
export interface Fm2FcsConfig {
    /** Max stabilator incidence at full pitch command (rad). */
    maxStabilatorRad: number;
    /** Max rudder-equivalent fin incidence at full yaw command (rad). */
    maxRudderRad: number;
    /** Fraction of roll command routed to the differential stabilator. */
    taileronRollFraction: number;
    /** First-order actuator lag shared by all surfaces (s). */
    actuatorTauS: number;
    pitch: Fm2PitchLawConfig;
    roll: Fm2RollLawConfig;
    yaw: Fm2YawLawConfig;
    /**
     * Optional high-AoA / post-stall pitch tuning for the limiters-OFF direct
     * pitch path. When the pilot switches the FBW limiters OFF (see
     * {@link FcsInput.limitersEnabled}) the g-command law passes the stick straight
     * to the stabilator; this tunes only the light rate/AoA-rate damping on that
     * path. Absent ⇒ the limiters-off direct path uses default damping.
     */
    highAoa?: Fm2HighAoaFcsConfig;
}

/**
 * Tuning for the limiters-OFF direct pitch path. Turning the FBW limiters off
 * removes the AoA limiter and structural g clamp and lets full stick drive the
 * stabilator directly; the actual post-stall nose swing (if any) comes purely
 * from the real airframe aerodynamics (surface geometry / lift curves, e.g. a
 * `foreStrake` surface on {@link Fm2SurfaceSet}), not from any FCS-side trigger
 * or cutoff. There is no automatic recovery assist — the pilot's own stick has
 * to come back for the aircraft to recover, exactly like a real departure.
 */
export interface Fm2HighAoaFcsConfig {
    /** Pitch / AoA-rate damping scale on the limiters-off direct path (default 0.25). */
    directDampScale?: number;
}

/** Pitch-axis control law tuning. */
export interface Fm2PitchLawConfig {
    /** true = g-command FBW law; false = direct stick → elevator. */
    gCommand: boolean;
    /** Pitch-rate damping (about +X) folded into the elevator (both laws). */
    rateDampGain: number;
    /** Positive structural g command limit (g-command law). */
    maxCommandG: number;
    /** Negative structural g command limit (g-command law). */
    minCommandG: number;
    /** Stabilator command per unit g error (g-command law). */
    gGain: number;
    /** Integral-trim gain (g-command law). */
    iGain: number;
    /** Angle-of-attack rate (α̇) damping gain (g-command law). */
    aoaRateDampGain: number;
    /** Low-pass filter time constant for α̇ (g-command law). */
    aoaRateFilterTauS: number;
    /** Cubic stick-shaping blend, 0 = linear .. 1 = pure cubic (g-command law). */
    stickExpo: number;
    /** Integral-trim leak time constant while the AoA limiter is active. */
    integralLeakTauS: number;
    /** Command AoA limiter hard limit (deg). */
    aoaLimitDeg: number;
    /** Command AoA limiter soft (fade start) point (deg). */
    aoaSoftDeg: number;
    /**
     * Direct AoA-cap authority (elevator command per degree of AoA overshoot past
     * `aoaLimitDeg`). This is a POSITION command on the stabilator applied on top
     * of the g-command loop whenever the limiters are ON, so it retains authority
     * at low dynamic pressure where the g loop (which needs achievable g) cannot
     * hold AoA. The resulting pitch MOMENT still scales with q, so at near-zero q
     * (tail slide) it cannot force the nose down and the low-speed aerobatic
     * envelope is preserved.
     *
     * OMITTED ⇒ a sensible built-in default (see fcs.ts) is used, so the cap
     * protects every g-command aircraft — including mod / manifest configs that
     * never authored this field. Set explicitly to 0 to opt out (pure g-loop
     * limiter, no deflection cap).
     */
    aoaLimiterGain?: number;
    /**
     * Lead/prediction time (s) for the direct AoA cap: the cap acts on
     * `aoa + aoaRate · lead` so it starts arresting the AoA before the limit is
     * reached, damping the approach instead of bouncing off a hard wall. Omitted
     * ⇒ a built-in default (see fcs.ts) is used.
     */
    aoaLimiterLeadS?: number;
    /**
     * Direct structural-g cap authority (elevator command per g of overshoot past
     * the `maxCommandG` / `minCommandG` structural limit). Built exactly like the
     * AoA cap but on load factor: it shapes ONLY the stabilator DEFLECTION command
     * so the airframe's real aero response holds the load factor inside the
     * structural envelope — it injects no moment and clamps no state. The nose-up
     * ceiling comes from the +g limit and the nose-down floor from the −g limit,
     * and both compose with the AoA cap by taking the most restrictive bound.
     * OMITTED ⇒ a built-in default (see fcs.ts) is used so the g envelope is a hard
     * ceiling for every g-command aircraft; set to 0 to opt out (pure commanded-g
     * clamp, no deflection cap).
     */
    gLimiterGain?: number;
    /**
     * Lead/prediction time (s) for the g cap: it acts on `g + ġ · lead` so it
     * arrests the load factor before it overshoots the limit (killing the +g
     * transient and the −g windup). Omitted ⇒ a built-in default is used.
     */
    gLimiterLeadS?: number;
    /**
     * Prediction time (s) for the g cap on the −g side. The −3 g limit sits much
     * closer to 1-g cruise than +9.5 g and a nose-over builds g quickly, so the −g
     * side needs a longer horizon than `gLimiterLeadS` (which is tuned so the +g
     * side still reaches ~9.5 g). Omitted ⇒ a built-in default is used.
     */
    gLimiterNegLeadS?: number;
    /**
     * Soft band width (g) below each structural limit over which the g cap fades
     * nose authority from full to zero, so it feathers in instead of hitting a
     * wall. Omitted ⇒ a built-in default is used.
     */
    gLimiterSoftMarginG?: number;
    /**
     * Back-calculation anti-windup gain applied to the pitch integrator when the
     * AoA/g deflection cap clips the elevator command. Omitted ⇒ built-in default.
     */
    capBackCalcGain?: number;
    /**
     * Low-pass time constant (s) on the noseUp/noseDown cap bounds so the clamp
     * boundary cannot jump frame-to-frame. Omitted ⇒ built-in default.
     */
    capRateTauS?: number;
    /**
     * Dynamic-pressure band (q/qRef) over which the AoA cap fades out at high q.
     * Below `aoaCapQFadeStart` the AoA cap is fully active; above `aoaCapQFadeEnd`
     * it is disabled so the G cap alone governs high-speed pulls. Omitted ⇒ defaults.
     */
    aoaCapQFadeStart?: number;
    aoaCapQFadeEnd?: number;
}

/**
 * Roll-axis control law tuning.
 *
 * In `rateCommand` mode the commanded body roll rate is `maxRollRateDegS` scaled
 * by a dynamic-pressure gain schedule and faded by Mach / altitude / AoA / flap
 * limiters — all expressed as data here so the loop is generic (nothing about it
 * is specific to any airframe). The optional limiter fields default to the
 * canonical relaxed-stability fighter schedule when omitted.
 */
export interface Fm2RollLawConfig {
    /** true = roll-rate command FBW loop; false = direct stick → aileron. */
    rateCommand: boolean;
    /** Roll-rate command loop proportional gain (rate-command law). */
    rateGain: number;
    /** Roll-rate damping folded into the aileron command (direct law). */
    rateDamp: number;
    /** FBW commanded roll-rate cap (deg/s, rate-command law). */
    maxRollRateDegS: number;
    /** Dynamic-pressure gain schedule floor / ceiling. */
    qGainMin?: number;
    qGainMax?: number;
    /** Mach limiter: onset Mach, fade slope, floor. */
    machLimiterOnset?: number;
    machLimiterSlope?: number;
    machLimiterFloor?: number;
    /** Altitude limiter (m): onset, fade slope, floor. */
    altLimiterOnsetM?: number;
    altLimiterSlopeM?: number;
    altLimiterFloor?: number;
    /** AoA limiter (deg): onset, fade slope, floor. */
    aoaLimiterOnsetDeg?: number;
    aoaLimiterSlopeDeg?: number;
    aoaLimiterFloor?: number;
    /** Roll-authority factor with flaps extended. */
    flapsFactor?: number;
}

/** Yaw-axis control law tuning (shared by fly-by-wire and mechanical aircraft). */
export interface Fm2YawLawConfig {
    /** Pedal authority scale. */
    maxRudderCmd: number;
    /** Washed-out yaw-rate damper gain. */
    damperGain: number;
    damperWashoutTauS: number;
    /** Aileron→rudder interconnect for turn coordination. */
    ariGain: number;
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

/**
 * Transonic pitch-damping augmentation (an added aerodynamic Cmq term).
 *
 * The geometric tail damping alone keeps the short period well-damped through the
 * normal envelope, but as dynamic pressure climbs into the transonic overspeed
 * regime the short-period frequency rises and the FCS's fixed actuator/sensor lag
 * (~0.05 s) erodes its phase margin faster than the natural damping grows — the
 * closed loop goes into a violent load-factor limit cycle (it rings even
 * hands-off around Mach ~0.98). This adds a pitch-rate damping MOMENT that scales
 * with q̄ and only ramps in ABOVE `qKnee` (in qNorm = q/qRef units), so the whole
 * normal maneuvering envelope, the +9.5 g / −3 g structural pulls and the
 * low-speed / high-AoA (cobra) behaviour are untouched — only transonic overspeed
 * is damped. Absent ⇒ no augmentation (legacy behaviour).
 */
export interface Fm2TransonicPitchDampConfig {
    /** qNorm (= q/qRef) above which the augmentation ramps in. Keep above ~2.2 so
     *  the structural-g maneuvering envelope is unaffected. */
    qKnee: number;
    /** Damping moment per unit (q̄ · S · c · pitchRate) once fully ramped (s). */
    gain: number;
    /** Cap on the linear ramp factor `qNorm/qKnee − 1` (default 2). */
    maxRamp?: number;
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
    /**
     * Optional forebody vortex asymmetry (high-alpha nose slice), after Ericsson
     * (ICAS-92-4.6R). Only applied in the subscale/laminar Reynolds regime (see
     * {@link FlightModel.setForebodyLaminar}); at full-scale it is suppressed and
     * the airframe stays laterally symmetric. Absent ⇒ no forebody asymmetry.
     */
    forebodyAsymmetry?: Fm2ForebodyAsymmetryConfig;
    /** Optional transonic pitch-damping augmentation (see the interface). Absent ⇒ off. */
    transonicPitchDamp?: Fm2TransonicPitchDampConfig;
}

/**
 * The default player aircraft, assembled from the FM2 constant tables. Using
 * this config reproduces the previous hard-coded model exactly (regression guard
 * for the default player aircraft).
 */
export const defaultFm2Config: Fm2AircraftConfig = {
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
        aileronLeft: FM2_SURFACES.aileronLeft,
        aileronRight: FM2_SURFACES.aileronRight,
        foreStrake: FM2_SURFACES.foreStrake,
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
        maxStabilatorRad: FM2_FCS.maxStabilatorRad,
        maxRudderRad: 22 * DEG,
        taileronRollFraction: FM2_FCS.taileronRollFraction,
        actuatorTauS: FM2_FCS.actuatorTauS,
        pitch: {
            gCommand: true,
            rateDampGain: FM2_FCS.pitchRateDampGain,
            maxCommandG: FM2_FCS.maxCommandG,
            minCommandG: FM2_FCS.minCommandG,
            gGain: FM2_FCS.pitchGGain,
            iGain: FM2_FCS.pitchIGain,
            aoaRateDampGain: FM2_FCS.pitchAoaRateDampGain,
            aoaRateFilterTauS: FM2_FCS.aoaRateFilterTauS,
            stickExpo: FM2_FCS.pitchStickExpo,
            integralLeakTauS: FM2_FCS.integralLeakTauS,
            aoaLimitDeg: FM2_FCS.aoaLimitDeg,
            aoaSoftDeg: FM2_FCS.aoaSoftDeg,
            aoaLimiterGain: FM2_FCS.aoaLimiterGain,
            aoaLimiterLeadS: FM2_FCS.aoaLimiterLeadS,
            gLimiterGain: FM2_FCS.gLimiterGain,
            gLimiterLeadS: FM2_FCS.gLimiterLeadS,
            gLimiterNegLeadS: FM2_FCS.gLimiterNegLeadS,
            gLimiterSoftMarginG: FM2_FCS.gLimiterSoftMarginG,
            capBackCalcGain: FM2_FCS.capBackCalcGain,
            capRateTauS: FM2_FCS.capRateTauS,
            aoaCapQFadeStart: FM2_FCS.aoaCapQFadeStart,
            aoaCapQFadeEnd: FM2_FCS.aoaCapQFadeEnd,
        },
        // Limiters-off direct pitch tuning. No trigger here: the pilot toggles
        // the FBW limiters; this only tunes the direct path's damping. Whether
        // the airframe actually cobras is decided entirely by its real
        // aerodynamics (surfaces.foreStrake), not by anything here.
        highAoa: {
            directDampScale: FM2_FCS.cobraDirectDampScale,
        },
        roll: {
            rateCommand: true,
            rateGain: FM2_FCS.rollRateGain,
            rateDamp: 0,
            maxRollRateDegS: FM2_FCS.maxRollRateDegS,
            // Canonical relaxed-stability roll-rate command schedule (the values
            // that were the hard-coded default roll law) — now plain per-aircraft data.
            qGainMin: 0.12,
            qGainMax: 1.0,
            machLimiterOnset: 0.85,
            machLimiterSlope: 0.55,
            machLimiterFloor: 0.35,
            altLimiterOnsetM: 12000,
            altLimiterSlopeM: 20000,
            altLimiterFloor: 0.45,
            aoaLimiterOnsetDeg: 15,
            aoaLimiterSlopeDeg: 22,
            aoaLimiterFloor: 0.15,
            flapsFactor: 0.65,
        },
        yaw: {
            maxRudderCmd: FM2_FCS.maxRudderCmd,
            damperGain: FM2_FCS.yawDamperGain,
            damperWashoutTauS: FM2_FCS.yawDamperWashoutTauS,
            ariGain: FM2_FCS.ariGain,
        },
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
    // Forebody vortex asymmetry (Ericsson nose slice). Present but inert at
    // full-scale Reynolds (the default regime); switching the model into the
    // subscale/laminar regime makes a cobra depart into a nose slice, showing the
    // Reynolds coupling the paper identifies as the reason the real cobra stays
    // symmetric.
    forebodyAsymmetry: {
        armZ: FM2_FOREBODY.armZ,
        refAreaM2: FM2_FOREBODY.refAreaM2,
        onsetAoaRad: FM2_FOREBODY.onsetAoaDeg * DEG,
        fullAoaRad: FM2_FOREBODY.fullAoaDeg * DEG,
        maxSideForceCoeff: FM2_FOREBODY.maxSideForceCoeff,
        lockInRateGain: FM2_FOREBODY.lockInRateGain,
        seedDrive: FM2_FOREBODY.seedDrive,
        driveScale: FM2_FOREBODY.driveScale,
        pitchRateArmRatio: FM2_FOREBODY.pitchRateArmRatio,
    },
    // Transonic pitch-damping augmentation: inert through the whole maneuvering
    // envelope (qNorm ≤ qKnee), ramping in only in transonic overspeed to kill the
    // short-period limit cycle the fixed FCS lag would otherwise sustain there.
    transonicPitchDamp: {
        qKnee: FM2_TRANSONIC_PITCH_DAMP.qKnee,
        gain: FM2_TRANSONIC_PITCH_DAMP.gain,
        maxRamp: FM2_TRANSONIC_PITCH_DAMP.maxRamp,
    },
};
