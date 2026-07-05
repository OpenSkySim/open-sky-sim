/**
 * FM2 — F-16C rigid-body "parts" flight model configuration.
 *
 * This model treats the aircraft as a single rigid body whose aerodynamic
 * forces are built up from discrete lifting surfaces (a component build-up /
 * "parts" model). Each surface generates lift and drag from the LOCAL airflow
 * it experiences, which is the aircraft body velocity PLUS the contribution of
 * the body's angular velocity at the surface location (ω × r). Because every
 * force is applied at the surface's real location, pitching/rolling/yawing
 * MOMENTS — and, crucially, the aerodynamic DAMPING of those rates — emerge
 * naturally from the geometry instead of being hand-authored.
 *
 * Body axes (matching the sim's THREE.js convention, see utils/math.ts):
 *   +X = RIGHT (out the right wing)
 *   +Y = UP
 *   +Z = FORWARD (out the nose)
 * This is a right-handed frame: RIGHT × UP = FORWARD.
 *
 * Reference data:
 *   - Geometry / mass: General Dynamics F-16C (Jane's, USAF fact sheet).
 *   - Inertia: NASA TP-1538 / Stevens & Lewis "Aircraft Control and Simulation"
 *     nominal F-16 (converted from slug·ft² and rotated into the sim body frame).
 *   - Aero coefficients tuned to Rehman, "Aerodynamic Performance Analysis of
 *     F-16C Fighting Falcon" (CD0 ≈ 0.018, K ≈ 0.149, CLα ≈ 3.6–5.7/rad,
 *     L/D_max ≈ 9.7–14) and the sim's existing F16_PROFILE envelope.
 */
import { F16_PROFILE } from '../f16Profile';

const DEG = Math.PI / 180;

/** Reference geometry (SI). */
export const FM2_GEOMETRY = {
    massKg: F16_PROFILE.simMassKg,      // ~13,608 kg typical takeoff gross
    wingAreaM2: F16_PROFILE.wingAreaM2, // 27.87 m² reference planform
    wingSpanM: F16_PROFILE.wingSpanM,   // 9.45 m
    meanChordM: 3.45,                   // mean aerodynamic chord (~11.3 ft)
} as const;

/**
 * Principal moments of inertia in the SIM body frame (kg·m²).
 *
 * NASA/Stevens-Lewis F-16 (aerospace X-fwd,Y-right,Z-down):
 *   Ixx(roll)=9496, Iyy(pitch)=55814, Izz(yaw)=63100 slug·ft²  (× 1.35582 → kg·m²)
 * Mapping to sim axes: roll↔+Z, pitch↔+X, yaw↔+Y. The small Ixz product of
 * inertia (≈1331 kg·m²) is neglected — it is ~2% of the yaw/roll inertias and
 * only produces minor inertial roll↔yaw cross-coupling.
 */
export const FM2_INERTIA = {
    pitch: 55814 * 1.35582, // about +X (RIGHT)  ≈ 75,672 kg·m²
    yaw: 63100 * 1.35582,   // about +Y (UP)     ≈ 85,552 kg·m²
    roll: 9496 * 1.35582,   // about +Z (FORWARD) ≈ 12,874 kg·m²
} as const;

/** How a surface's lift plane is oriented in the body frame. */
export interface SurfaceGeometry {
    name: string;
    /** Application point relative to CG, body frame (m). */
    position: [number, number, number];
    /** Lift direction at positive AoA, body frame unit vector. */
    up: [number, number, number];
    /** Chord (zero-lift reference) direction, body frame unit vector (nominally +Z). */
    forward: [number, number, number];
    /** Planform area of this surface (m²). */
    areaM2: number;
    /** Lift-curve slope (per radian) in the linear range. */
    liftSlopePerRad: number;
    /** Stall angle of attack (rad). Beyond this, CL collapses. */
    stallAoaRad: number;
    /** Profile (zero-lift) drag coefficient of this surface. */
    cd0: number;
    /** Induced-drag factor: CD_i = inducedK · CL². */
    inducedK: number;
    /** ΔAoA (rad) produced per unit control deflection [-1,1] (0 = no control). */
    controlEffectiveness: number;
}

/**
 * The F-16 as a set of rigid lifting surfaces.
 *
 * Lateral split of the wing and horizontal tail is deliberate: it lets roll
 * damping, differential-tail (taileron) roll authority and dihedral/sideslip
 * effects fall out of the geometry rather than being faked. The horizontal and
 * vertical tails sit well aft of the CG (−Z) which provides the static pitch
 * and yaw stability and the aerodynamic pitch/yaw rate damping.
 */
export const FM2_SURFACES: Record<string, SurfaceGeometry> = {
    /**
     * Blended fuselage / strake lifting body. The F-16 is a lifting-body design:
     * the wide forebody and leading-edge strakes carry a large share of the total
     * lift. This surface is sized so the fuselage produces ~30% of the aircraft's
     * lift — its lift-curve contribution (CLα·S = 2.4 × 16.0 ≈ 38.4) is 3/7 of the
     * combined wing contribution (2 × 5.2 × 8.6 ≈ 89.4), so
     * 38.4 / (38.4 + 89.4) ≈ 0.30 of the wing+body lift throughout the linear
     * range. It acts at the CG (no trim moment); parasite form drag stays in
     * FM2_BODY_CD0, so cd0 here is 0 to avoid double-counting.
     */
    fuselage: {
        name: 'fuselage',
        position: [0.0, 0.0, 0.0],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 16.0,
        liftSlopePerRad: 2.4,
        stallAoaRad: 40 * DEG, // a low-aspect body stalls late and gently
        cd0: 0.0,
        inducedK: 0.25,
        controlEffectiveness: 0,
    },
    wingLeft: {
        name: 'wingLeft',
        position: [-2.1, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 8.6,
        liftSlopePerRad: 5.2,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        controlEffectiveness: 0, // ailerons applied separately below
    },
    wingRight: {
        name: 'wingRight',
        position: [2.1, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 8.6,
        liftSlopePerRad: 5.2,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        controlEffectiveness: 0,
    },
    htailLeft: {
        name: 'htailLeft',
        position: [-1.5, 0.0, -4.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 2.95,
        liftSlopePerRad: 3.4,
        stallAoaRad: 26 * DEG,
        cd0: 0.006,
        inducedK: 0.15,
        controlEffectiveness: 0.9, // all-moving stabilator
    },
    htailRight: {
        name: 'htailRight',
        position: [1.5, 0.0, -4.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 2.95,
        liftSlopePerRad: 3.4,
        stallAoaRad: 26 * DEG,
        cd0: 0.006,
        inducedK: 0.15,
        controlEffectiveness: 0.9,
    },
    vtail: {
        name: 'vtail',
        position: [0.0, 1.1, -4.3],
        up: [1, 0, 0], // side force acts along +X
        forward: [0, 0, 1],
        areaM2: 5.1,
        liftSlopePerRad: 2.9,
        stallAoaRad: 30 * DEG,
        cd0: 0.007,
        inducedK: 0.16,
        controlEffectiveness: 0.55, // rudder
    },
};

/**
 * Aileron (roll) parameters — differential incidence added to each wing.
 * Sized so that full deflection produces roughly the F-16's ~360°/s open-loop
 * roll rate (aero roll damping balances control power); the FBW rate loop then
 * caps the commanded rate near 300°/s.
 */
export const FM2_AILERON = {
    /** ΔAoA (rad) at each wing per unit aileron command [-1,1]. */
    maxDeflectionRad: 4.2 * DEG,
} as const;

/** Symmetric flap camber increment (rad of effective wing incidence) with flaps down. */
export const FM2_FLAPS = {
    aoaBiasRad: 8 * DEG,
    stallReductionRad: 1 * DEG,
    extraCd: 0.020,
} as const;

/** Landing gear parasite drag increment (CD referenced to wing area). */
export const FM2_GEAR_CD = 0.022;

/** Fuselage / miscellaneous parasite drag (CD referenced to wing area). */
export const FM2_BODY_CD0 = 0.010;

/** Extra transonic/supersonic wave-drag scale applied above the divergence Mach. */
export const FM2_WAVE_DRAG = {
    machOnset: 0.95,
    scale: 0.55,
} as const;

/**
 * Fly-by-wire control-law gains. The F-16 is aerodynamically relaxed-stability
 * and only flyable through its FBW system, so these gains are what give the
 * aircraft its handling qualities (crisp ~300°/s roll, g/AoA-limited pitch,
 * coordinated yaw) rather than the bare-airframe response.
 */
export const FM2_FCS = {
    /** Positive/negative structural g command limits. */
    maxCommandG: F16_PROFILE.maxLoadFactorG, // 9.5
    minCommandG: -3.0,
    /** Command AoA limiter (deg). Widened fade band so authority tapers gently. */
    aoaLimitDeg: 26,
    aoaSoftDeg: 18,

    /**
     * Pitch loop: stabilator command per unit g error, integral trim, pitch-rate
     * damping, and stick shaping.
     *
     * `pitchStickExpo` blends a cubic into the stick→g map so small deflections are
     * gentle (a light pull no longer demands a near-max-g the jet can't hold at
     * approach speed) while full stick still reaches the structural limit.
     * `integralLeakTauS` bleeds the trim integrator down while the AoA limiter is
     * active, preventing wind-up against the limit (the cause of the pitch hunting).
     */
    pitchGGain: 0.14,
    pitchIGain: 0.6,
    pitchRateDampGain: 1.1,
    pitchAoaRateDampGain: 4.5,
    aoaRateFilterTauS: 0.05,
    pitchStickExpo: 0.8,
    integralLeakTauS: 0.35,
    maxStabilatorRad: 25 * DEG,

    /** Roll loop: rate command and proportional gain to aileron/taileron. */
    maxRollRateDegS: F16_PROFILE.maxRollRateDegS, // 300
    rollRateGain: 0.8,
    rollDamperGain: 0.06,
    /** Fraction of roll command routed to the differential stabilator (taileron). */
    taileronRollFraction: 0.12,

    /** Yaw loop: pedal authority, yaw-rate damper (washed out), aileron-rudder interconnect. */
    maxRudderCmd: 1.0,
    yawDamperGain: 1.6,
    yawDamperWashoutTauS: 1.0,
    ariGain: 0.10,

    /** Actuator first-order lag time constant (s). */
    actuatorTauS: 0.05,
} as const;
