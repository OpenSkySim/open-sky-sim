/**
 * FM2 — default-aircraft rigid-body "parts" flight model configuration.
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
    /**
     * Zero-lift angle of attack (rad), i.e. camber. Linear lift is
     * slope·(α − zeroLiftAoaRad), so a cambered surface makes lift at α = 0
     * (cl0 = −slope·zeroLiftAoaRad). Omitted ⇒ 0 (symmetric section).
     */
    zeroLiftAoaRad?: number;
    /**
     * Peak lift coefficient. The linear lift is capped at ±clMax (rounding the
     * curve over to a realistic maximum) and the post-stall plateau / vortex lift
     * are referenced to it. Omitted ⇒ slope·stallAoaRad (legacy curve).
     */
    clMax?: number;
    /** Stall angle of attack (rad). Beyond this, CL collapses. */
    stallAoaRad: number;
    /** Profile (zero-lift) drag coefficient of this surface. */
    cd0: number;
    /** Induced-drag factor: CD_i = inducedK · CL². */
    inducedK: number;
    /**
     * Fully-separated (90° AoA) bluff-body drag coefficient, referenced to this
     * surface's own area. Past stall the attached parabolic polar (CD0 + K·CL²)
     * is blended into a flat-plate CDP = flatPlateCd · ½(1 − cos 2α), which peaks
     * at α = 90° and eases back toward 180° (Walter Bislin's whole-range AoA
     * model). Omitted ⇒ 2.0 (thin flat-plate normal to the flow).
     */
    flatPlateCd?: number;
    /** ΔAoA (rad) produced per unit control deflection [-1,1] (0 = no control). */
    controlEffectiveness: number;
    /** Forebody vortex lift scale (0 = off). Used on forward strake/LERX surfaces
     *  with a real arm ahead of the CG so the growth is a genuine pitching moment. */
    vortexLiftScale?: number;
    /**
     * Scales this surface's ω×r rate-damping contribution once the surface's own
     * flow is past its stall (0..1, default 1). A separated tail damps far less,
     * so a value < 1 lets a transient high-AoA pitch overshoot survive (cobra)
     * without changing normal-envelope damping.
     */
    highAoaDampingScale?: number;
    /**
     * Unsteady separation-state time constant (s). Models the finite time for
     * flow separation and forebody-vortex breakdown to develop, per Ericsson's
     * cobra analysis (ICAS-92-4.6R): the AoA the SEPARATED flow "sees" lags the
     * geometric AoA with this first-order constant, so separation is delayed on
     * a rapid pitch-up (dynamic-lift overshoot) and reattachment is delayed on
     * the way down (hysteresis). Only the CL/CD separation blend and the vortex
     * window are lagged; the attached (potential-flow) lift stays instantaneous.
     * Omitted ⇒ 0 (quasi-steady; the surface tracks geometric AoA exactly).
     */
    unsteadyTauS?: number;
}

/**
 * The default aircraft as a set of rigid lifting surfaces.
 *
 * Lateral split of the wing and horizontal tail is deliberate: it lets roll
 * damping, differential-tail (taileron) roll authority and dihedral/sideslip
 * effects fall out of the geometry rather than being faked. The horizontal and
 * vertical tails sit well aft of the CG (−Z) which provides the static pitch
 * and yaw stability and the aerodynamic pitch/yaw rate damping.
 */
export const FM2_SURFACES: Record<string, SurfaceGeometry> = {
    /**
     * Main fuselage lifting body. This airframe is a lifting-body design: the
     * wide forebody carries a large share of the total lift, acting at the CG
     * (no trim moment). The forward leading-edge strake/LERX portion is broken
     * out into its own `foreStrake` surface below — genuinely ahead of the CG —
     * since a real forward arm (not this CG-located main body) is what can turn
     * a surface's own post-stall vortex lift into a real pitching moment. This
     * surface is sized (together with `foreStrake`) so the two combined still
     * produce ~30% of the aircraft's lift — combined lift-curve contribution
     * (CLα·S = 2.4 × 13.0 + 2.8 × 3.0 ≈ 39.6) is ~3/7 of the combined
     * wing+aileron contribution (2 × (5.2 × 7.1 + 4.5 × 1.5) ≈ 87.3), so
     * 39.6 / (39.6 + 87.3) ≈ 0.31 of the wing+body lift throughout the linear
     * range. Parasite form drag stays in FM2_BODY_CD0, so cd0 here is 0 to avoid
     * double-counting.
     */
    fuselage: {
        name: 'fuselage',
        position: [0.0, 0.0, 0.0],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 13.0,
        liftSlopePerRad: 2.4,
        // Lifting-body camber (cl0 ≈ 2.4 × 1.9° ≈ 0.08 of the ~0.2 total).
        zeroLiftAoaRad: -1.9 * DEG,
        clMax: 1.5,
        stallAoaRad: 40 * DEG, // a low-aspect body stalls late and gently
        cd0: 0.0,
        inducedK: 0.25,
        // Wide lifting body: broadside it is a rounded bluff shape, not a sharp
        // flat plate, so its 90° Cd is well below the thin-surface 2.0.
        flatPlateCd: 1.3,
        controlEffectiveness: 0,
        // At the CG (arm = 0): whatever this surface's lift curve does past
        // stall produces no pitching moment, so it carries no vortex lift — that
        // now lives entirely on `foreStrake`, which has a real forward arm.
    },
    /**
     * Forward strake / LERX, genuinely positioned ahead of the CG (unlike the
     * old scripted CG relocation this replaces, this is real geometry). Below
     * its own stall it behaves like an ordinary small lifting surface (folded
     * into the fuselage's ~30% lift share, see above); past stall its vortex
     * lift keeps growing (the raised-cosine window in `liftCoefficient`,
     * peaking ~50°) while the wing and tail are losing lift to their own
     * separation — the real "pitch-up" mechanism behind strake-equipped
     * fighters' post-stall departure tendency. The unsteady separation lag
     * (Ericsson, ICAS-92-4.6R) delays that vortex breakdown on a rapid pitch-up
     * and its reattachment on the way down, giving genuine aerodynamic
     * hysteresis instead of a scripted one.
     */
    foreStrake: {
        name: 'foreStrake',
        position: [0.0, 0.0, 3.2],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 5.0,
        // Deliberately a gentle linear-range lift-curve slope: below stall this
        // surface must stay aerodynamically inert enough not to relax the
        // airframe's normal-envelope static margin (real LERX behave this way —
        // a nearly flat lift curve pre-stall, then a strong vortex kick past it).
        // `clMax` (the post-stall attached-lift asymptote) and `vortexLiftScale`
        // are independent of this slope, so the post-stall kick is unaffected.
        liftSlopePerRad: 0.4,
        clMax: 1.2,
        stallAoaRad: 18 * DEG,
        cd0: 0.006,
        inducedK: 0.2,
        flatPlateCd: 1.3, // bluff strake, same character as the main body
        controlEffectiveness: 0,
        vortexLiftScale: 2.5,
        unsteadyTauS: 0.30,
    },
    wingLeft: {
        name: 'wingLeft',
        position: [-2.4, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        // Inboard wing panel. The outboard 1.5 m² is carved out into the aileron
        // surface below, so wing + aileron conserve the 8.6 m² half-wing planform
        // (hence the total lift and the high-AoA flat-plate lift/drag the cobra is
        // tuned around are unchanged by promoting the ailerons to real surfaces).
        areaM2: 7.1,
        liftSlopePerRad: 5.2,
        // Thin cambered wing (cl0 ≈ 5.2 × 1.3° ≈ 0.12 of the ~0.2 total). The
        // LERX-blended wing reaches a high transient CLmax; ~1.5 rounds the linear
        // curve over at a realistic peak while the decoupled high-AoA regime keeps
        // the tuned post-stall / cobra behaviour.
        zeroLiftAoaRad: -1.3 * DEG,
        clMax: 1.5,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        flatPlateCd: 1.9, // thin wing panel broadside to the flow
        controlEffectiveness: 0, // ailerons are their own surfaces below
        // Wing separation lag (shorter than the forebody's): supports the
        // dynamic-lift overshoot on the cobra pitch-up (Ericsson, ICAS-92-4.6R).
        unsteadyTauS: 0.18,
    },
    wingRight: {
        name: 'wingRight',
        position: [2.4, 0.0, -0.15],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 7.1,
        liftSlopePerRad: 5.2,
        zeroLiftAoaRad: -1.3 * DEG,
        clMax: 1.5,
        stallAoaRad: 24 * DEG,
        cd0: 0.0085,
        inducedK: 0.118,
        flatPlateCd: 1.9,
        controlEffectiveness: 0,
        unsteadyTauS: 0.18,
    },
    /**
     * Ailerons as their own outboard lifting surfaces. Deflection is fed in as a
     * direct incidence (controlDeltaAoa) by the model, so their differential lift
     * at the outboard station (x ≈ ±3.4 m) produces the roll moment via r × F, and
     * roll damping still comes from the full wing panels responding to ω × r.
     */
    aileronLeft: {
        name: 'aileronLeft',
        position: [-3.4, 0.0, -0.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 1.5,
        liftSlopePerRad: 4.5,
        clMax: 1.5,
        // Stall margin well above the small (~2.5°) roll deflection so the loaded
        // aileron always stays attached and delivers its full (20%) roll share.
        stallAoaRad: 28 * DEG,
        cd0: 0.009,
        inducedK: 0.15,
        flatPlateCd: 1.9, // matches the wing panel so total high-AoA drag is conserved
        controlEffectiveness: 1.0,
    },
    aileronRight: {
        name: 'aileronRight',
        position: [3.4, 0.0, -0.6],
        up: [0, 1, 0],
        forward: [0, 0, 1],
        areaM2: 1.5,
        liftSlopePerRad: 4.5,
        clMax: 1.5,
        stallAoaRad: 28 * DEG,
        cd0: 0.009,
        inducedK: 0.15,
        flatPlateCd: 1.9,
        controlEffectiveness: 1.0,
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
        flatPlateCd: 2.0,
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
        flatPlateCd: 2.0,
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
        flatPlateCd: 2.0,
        controlEffectiveness: 0.55, // rudder
    },
};

/**
 * Aileron (roll) parameters — direct incidence commanded on the dedicated
 * outboard aileron surfaces (aileronLeft/aileronRight above). The differential
 * stabilator is the primary roll effector (see `taileronRollFraction`); the
 * ailerons supply only the remaining ~20% of the roll moment, so full deflection
 * is a modest ~2.5°. Their long outboard arm (±3.4 m) means even this small
 * deflection is a meaningful share of the roll authority.
 */
export const FM2_AILERON = {
    /** ΔAoA (rad) at each aileron surface per unit aileron command [-1,1]. */
    maxDeflectionRad: 2.5 * DEG,
} as const;

/** Symmetric flap camber increment (rad of effective wing incidence) with flaps down. */
export const FM2_FLAPS = {
    aoaBiasRad: 8 * DEG,
    stallReductionRad: 1 * DEG,
    extraCd: 0.020,
} as const;

/**
 * Forebody vortex asymmetry (high-alpha nose slice) tuning, after Ericsson,
 * ICAS-92-4.6R. The model only APPLIES this in the subscale/laminar Reynolds
 * regime; at full-scale (default) it is suppressed and the airframe stays
 * laterally symmetric through the cobra — exactly the Reynolds coupling the
 * paper describes. Values are sized so that, once past ~35° AoA, the saturated
 * side force on the long nose arm overpowers the fin's directional stability and
 * a cobra departs into a nose slice, while below onset (the whole normal
 * envelope) it produces nothing.
 */
export const FM2_FOREBODY = {
    /** Nose vortex side-force point ahead of the CG (m, body +Z). */
    armZ: 3.6,
    /** Referenced to the wing planform. */
    refAreaM2: FM2_GEOMETRY.wingAreaM2,
    onsetAoaDeg: 35,
    fullAoaDeg: 55,
    /** Peak asymmetric Cy (wing-area referenced). */
    maxSideForceCoeff: 0.42,
    /** Yaw-rate lock-in gain (per rad/s). */
    lockInRateGain: 6.0,
    /** Micro-asymmetry seed drive (+ = initial slice to the right). */
    seedDrive: 0.06,
    /** tanh saturation scale for the lock-in drive. */
    driveScale: 0.5,
    /** Pitch-rate nose-AoA-shift factor (1 + x/X_CG); delays onset on pitch-up. */
    pitchRateArmRatio: 1.0,
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
 * Transonic pitch-damping augmentation (added aerodynamic Cmq). Inert through the
 * whole maneuvering envelope (structural-g pulls top out near qNorm ≈ 2.2) and
 * ramps in only in transonic overspeed to damp the short-period limit cycle the
 * FCS's fixed actuator/sensor lag would otherwise sustain there (the hands-off
 * ~Mach 0.98 −4 g ↔ +8 g ring). See {@link Fm2TransonicPitchDampConfig}.
 */
export const FM2_TRANSONIC_PITCH_DAMP = {
    qKnee: 2.0,
    gain: 0.5,
    maxRamp: 2.0,
} as const;

/**
 * Fly-by-wire control-law gains. This airframe is aerodynamically relaxed-stability
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
     * the airframe well inside its normal envelope, so a hard pull — at ANY
     * speed, including low dynamic pressure — can never reach the AoA where the
     * real airframe aerodynamics (foreStrake vortex lift, tail stall) could
     * start a post-stall departure. The g-command law only fades COMMANDED g
     * toward this limit; the direct AoA cap below (aoaLimiter*) adds the low-q
     * authority that actually enforces it. A genuine post-stall departure (deep
     * stall / tail slide / cobra) therefore requires the pilot to switch the
     * limiters OFF.
     */
    aoaLimitDeg: 22,
    aoaSoftDeg: 17,
    /**
     * Direct AoA-cap authority. `aoaLimiterGain` = elevator per degree of AoA
     * overshoot past `aoaLimitDeg`; ~0.35/deg reaches full nose-down ~3° over the
     * limit. `aoaLimiterLeadS` predicts AoA ahead by the α̇ rate so the cap
     * arrests the pitch-up before it reaches the limit. This is what holds AoA
     * at low dynamic pressure (e.g. 300 km/h) where the g-loop limiter has no
     * authority.
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
    /** Back-calculation anti-windup gain when the deflection cap clips the elevator. */
    capBackCalcGain: 0.75,
    /** Low-pass time constant (s) on the noseUp/noseDown cap bounds. */
    capRateTauS: 0.06,
    /** Dynamic-pressure band (q/qRef) over which the AoA cap fades out at high q. */
    aoaCapQFadeStart: 0.3,
    aoaCapQFadeEnd: 0.7,

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

    // --- Emergent Pugachev cobra: no scripted CG relocation, no automatic
    // recovery cutoff, no injected moment. Whether the airframe cobras at all
    // is decided purely by its real aerodynamics — see the `foreStrake` surface
    // above and the tail's own stall — once the pilot switches the FBW limiters
    // OFF (limiters ON, the g-command law holds AoA below any of this). Recovery
    // depends on the pilot releasing the stick, exactly like the real maneuver.
    /** Pitch / AoA-rate damping scale on the limiters-off direct path. */
    cobraDirectDampScale: 0.19,

    /** Roll loop: rate command and proportional gain to aileron/taileron. */
    maxRollRateDegS: F16_PROFILE.maxRollRateDegS, // 300
    rollRateGain: 0.8,
    rollDamperGain: 0.06,
    /**
     * Fraction of roll command routed to the differential stabilator (taileron).
     * The all-moving tail is the PRIMARY roll effector here: at 0.6 (≈15° of
     * differential stabilator at full roll) the taileron produces ~80% of the
     * roll moment, with the small outboard ailerons (see FM2_AILERON) supplying
     * the remaining ~20%. Because the horizontal tails sit close to the
     * centreline (roll arm ≈ ±1.5 m vs the ailerons' ±3.4 m) a tail-dominant roll
     * is inherently slower than an aileron-dominant one — peak roll rate is
     * ~150°/s rather than ~185°/s. Roll is commanded (roll = 0) in the cobra, so
     * this split does not affect the emergent-cobra tuning.
     */
    taileronRollFraction: 0.6,

    /** Yaw loop: pedal authority, yaw-rate damper (washed out), aileron-rudder interconnect. */
    maxRudderCmd: 1.0,
    yawDamperGain: 1.6,
    yawDamperWashoutTauS: 1.0,
    ariGain: 0.10,

    /** Actuator first-order lag time constant (s). */
    actuatorTauS: 0.05,
} as const;
