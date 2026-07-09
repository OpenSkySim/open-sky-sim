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
    /** Forebody vortex lift scale (0 = off). Used on fuselage/strakes for cobra. */
    vortexLiftScale?: number;
    /**
     * Scales this surface's ω×r rate-damping contribution once the surface's own
     * flow is past its stall (0..1, default 1). A separated tail damps far less,
     * so a value < 1 lets a transient high-AoA pitch overshoot survive (cobra)
     * without changing normal-envelope damping.
     */
    highAoaDampingScale?: number;
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
        vortexLiftScale: 0.55,
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
        highAoaDampingScale: 0.7, // separated tail still damps pitch rate → helps arrest the cobra apex before it tumbles over the top
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
        highAoaDampingScale: 0.7,
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
    /**
     * Command AoA limiter (deg). With the limiters ON this is what actively holds
     * the airframe below the emergent-cobra CG-relaxation onset (cobraCgOnsetDeg),
     * so a hard pull — at ANY speed, including low dynamic pressure — can never
     * destabilize into a cobra. The g-command law only fades COMMANDED g toward
     * this limit; the direct AoA cap below (aoaLimiter*) adds the low-q authority
     * that actually enforces it. A genuine post-stall departure (deep stall / tail
     * slide) therefore requires the pilot to switch the limiters OFF.
     */
    aoaLimitDeg: 22,
    aoaSoftDeg: 17,
    /**
     * Direct AoA-cap authority. `aoaLimiterGain` = elevator per degree of AoA
     * overshoot past `aoaLimitDeg`; ~0.35/deg reaches full nose-down ~3° over the
     * limit. `aoaLimiterLeadS` predicts AoA ahead by the α̇ rate so the cap
     * arrests the pitch-up before it reaches the limit (and before the emergent
     * aft-CG relaxation onset just above it). This is what holds AoA at low
     * dynamic pressure (e.g. 300 km/h) where the g-loop limiter has no authority.
     */
    aoaLimiterGain: 0.35,
    aoaLimiterLeadS: 0.30,
    /**
     * Direct structural-g cap authority. Built like the AoA cap but on load
     * factor: `gLimiterGain` = nose-down (nose-up on the −g side) command per g of
     * overshoot past the structural limit, `gLimiterLeadS` predicts the load factor
     * ahead by ġ so it arrests before overshoot, and `gLimiterSoftMarginG` is the
     * band below each limit where authority fades in. This holds a hard pull at
     * ~+9.5 g and a hard push at ~−3 g instead of the transient +10 g / −5 g.
     */
    gLimiterGain: 0.9,
    gLimiterLeadS: 0.05,
    gLimiterNegLeadS: 0.5,
    gLimiterSoftMarginG: 1.5,

    /**
     * Pitch loop: stabilator command per unit g error, integral trim, pitch-rate
     * damping, and stick shaping.
     *
     * `pitchStickExpo` blends a cubic into the stick→g map (0 = linear, 1 = pure
     * cubic) so small deflections are very gentle — a logarithmic-style feel where a
     * light pull near centre barely moves the g command — while full stick still
     * reaches the structural limit.
     * `integralLeakTauS` bleeds the trim integrator down while the AoA limiter is
     * active, preventing wind-up against the limit (the cause of the pitch hunting).
     */
    pitchGGain: 0.14,
    pitchIGain: 0.6,
    pitchRateDampGain: 1.1,
    pitchAoaRateDampGain: 4.5,
    aoaRateFilterTauS: 0.05,
    pitchStickExpo: 0.92,
    integralLeakTauS: 0.35,
    maxStabilatorRad: 25 * DEG,
    /** Extra stabilator authority in the aerobatic (low-q / deep-stall) envelope. */
    aerobaticStabilatorGain: 1.65,
    /**
     * AoA (deg) above which the aerobatic stabilator boost also engages at speed.
     * Set just below the FBW AoA-limiter hold (~19°) so a limiters-OFF pull gets
     * the extra authority it needs to punch past the airframe's natural high-q AoA
     * ceiling (~20° at 220 m/s) into the cobra CG-relaxation band. With the limiters
     * ON the AoA cap zeroes the stabilator command at the limit, so the boost adds
     * no AoA — the hold (≈19°) is unchanged — and the normal low-AoA envelope
     * (cruise, hard pulls at ~12°, roll) never engages it.
     */
    aerobaticStabilatorAoaOnsetDeg: 17,

    // --- Emergent Pugachev cobra (no scripted moments, no artificial triggers) ---
    // The airframe carries an ALWAYS-ACTIVE, AoA-gated aft CG shift that relaxes
    // the static margin past stall. It never depends on speed, throttle, or a
    // pilot switch. The cobra only appears when the pilot turns the FBW limiters
    // OFF: with limiters ON the g-command law actively holds AoA below the CG
    // onset, so the relaxation is never reached; with limiters OFF full aft stick
    // drives the stabilator directly, AoA blows past the onset, and the relaxed
    // airframe pitches the nose to ~90° and back.
    /** AoA (deg) above which nose-up authority fades (limiters-off) so recovery is assured. */
    cobraRecoveryAoaDeg: 60,
    /** Pitch / AoA-rate damping scale on the limiters-off direct path. Tuned on a
     *  razor edge: much higher kills the pitch-up, much lower tumbles over the top. */
    cobraDirectDampScale: 0.19,
    /** Aft (−Z) CG offset (m) fully blended in at high AoA to relax static margin. */
    cobraCgOffsetZ: -1.2,
    /** AoA (deg) where the aft-CG blend starts. Kept ABOVE the 22° hard AoA limit
     *  (the FBW limiter actually holds ≈19°, so this is ~4° above the real hold) so
     *  limiters-ON flight never reaches the relaxation regime. A limiters-OFF pull
     *  uses the high-AoA stabilator boost (aerobaticStabilatorAoaOnsetDeg) to climb
     *  past the natural ceiling into this band and cobra. */
    cobraCgOnsetDeg: 23,
    /** AoA (deg) where the aft-CG blend is fully applied. */
    cobraCgFullDeg: 31,
    /** AoA (deg) where the aft-CG blend starts fading back out (re-stabilizing). The
     *  35–55° band arrests the nose near the ~100° apex so it falls back cleanly
     *  instead of tumbling over the top. */
    cobraCgRestabOnsetDeg: 42,
    /** AoA (deg) where the airframe is back to its stable design CG (arrests nose). */
    cobraCgRestabFullDeg: 74,
    /** Re-stabilization overshoot. >1 walks the CG PAST design to a FORWARD offset
     *  at extreme AoA (a nose-down pitch bucket) so a true DIRECT-law full-aft pull
     *  held through the cobra still arrests near ~105° and falls back cleanly
     *  instead of tumbling over the top on residual pitch rate. */
    cobraCgRestabOvershoot: 1.7,

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
