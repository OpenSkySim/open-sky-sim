/**
 * Forebody vortex asymmetry — the high-alpha "nose slice", after Ericsson,
 * "Cobra Maneuver Considerations" (ICAS-92-4.6R, 1992).
 *
 * The paper's central finding is a LATERAL/directional one. A slender forebody
 * (radome / nose) sheds a pair of body vortices; above a critical angle of
 * attack that pair becomes ASYMMETRIC, producing a side force. Because the nose
 * sits on a long moment arm ahead of the CG, that side force makes a large
 * YAWING moment — the "nose slice" — that the twin fins cannot always counter.
 * Ericsson's key twist: which direction the asymmetry locks into is set by the
 * COUPLING between boundary-layer transition and the vehicle's own motion (the
 * "moving-wall" effect). A small yaw/roll perturbation biases transition so the
 * asymmetry reinforces the motion (positive feedback) and the aircraft departs.
 *
 * This coupling is strongly Reynolds-number dependent:
 *   - LAMINAR / subscale flow (wind-tunnel Reynolds numbers): the asymmetry
 *     develops and locks in, so a rapid high-alpha maneuver would nose-slice.
 *     Ericsson concludes the cobra "could probably not be performed in laminar
 *     flow because of the expected nose-slice tendency".
 *   - FULL-SCALE flight (high Reynolds number): transition moves forward and the
 *     coupling changes, keeping the separation effectively symmetric — which is
 *     why the Su-27 / MiG-29 cobra does NOT depart in reality. Hence the paper's
 *     warning: subscale dynamic tests mislead unless full-scale Re is matched.
 *
 * We expose this as an OPTIONAL, config-driven mechanism that the model gates on
 * a Reynolds "regime" flag:
 *   - full-scale (default) ⇒ the mechanism is inert; the airframe stays laterally
 *     symmetric through the cobra (matching real full-scale behaviour).
 *   - subscale / laminar   ⇒ the asymmetry is live; a cobra develops a nose-slice
 *     yaw departure, demonstrating exactly the Reynolds coupling the paper
 *     describes.
 *
 * Body axes (sim THREE.js convention): +X = RIGHT, +Y = UP, +Z = FORWARD.
 */

/** Tuning for the forebody vortex asymmetry (nose slice). All AoA in radians. */
export interface Fm2ForebodyAsymmetryConfig {
    /**
     * Forebody side-force application point along the body +Z (nose) axis (m),
     * measured from the design CG. This is the long lever that turns a modest
     * side force into the large yawing moment behind the nose slice.
     */
    armZ: number;
    /** Reference area for the side-force coefficient (m²), e.g. the wing area. */
    refAreaM2: number;
    /** AoA (rad) where the asymmetric side force starts to develop. */
    onsetAoaRad: number;
    /** AoA (rad) where it is fully developed. */
    fullAoaRad: number;
    /**
     * Peak magnitude of the asymmetric side-force coefficient (Cy), referenced to
     * `refAreaM2`. Sized so that, on its long nose arm, the resulting yawing
     * moment overpowers the fin's directional stability / yaw damping in the
     * high-alpha band (the departure) once the lock-in saturates.
     */
    maxSideForceCoeff: number;
    /**
     * Moving-wall lock-in gain (per rad/s of yaw rate). The asymmetry direction is
     * driven by the vehicle's own coning/yaw motion, so a small yaw rate biases
     * the side force to reinforce that motion — the positive feedback that makes
     * the departure grow.
     */
    lockInRateGain: number;
    /**
     * Deterministic micro-asymmetry seed (dimensionless drive). The paper notes
     * the departure direction is set by "nose micro-asymmetries"; this small bias
     * gives the lock-in a definite direction even from perfectly symmetric
     * initial conditions (so the departure is repeatable rather than depending on
     * numerical noise). Sign picks the initial slice direction (+ = nose right).
     */
    seedDrive: number;
    /** Saturation scale for the tanh() lock-in drive (dimensionless). */
    driveScale: number;
    /**
     * Pitch-rate nose-AoA-shift factor, the (1 + x/X_CG) term of Ericsson's
     * effective nose incidence α_n = α − α̇·(1 + x/X_CG). A rapid nose-up pitch
     * makes the nose "see" a lower AoA, delaying the asymmetry onset during the
     * cobra pitch-up; on the pitch-down the nose sees a higher AoA. Omitted/0 ⇒
     * no pitch-rate coupling (quasi-steady onset).
     */
    pitchRateArmRatio?: number;
}

/** Smooth Hermite step (0 below `a`, 1 above `b`, C¹ in between). */
function smoothstep(a: number, b: number, x: number): number {
    if (b <= a) return x >= b ? 1 : 0;
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

/**
 * Asymmetric forebody side-force coefficient Cy (referenced to `cfg.refAreaM2`),
 * positive → side force toward body +X (nose-slice to the right).
 *
 * This is the Reynolds-agnostic aerodynamic law; the model decides WHETHER to
 * apply it (subscale/laminar regime) or suppress it (full-scale, symmetric). It
 * combines:
 *   1. an AoA envelope that fades the asymmetry in across onset→full, optionally
 *      shifted by the pitch-rate nose-AoA term (Ericsson α_n);
 *   2. a lock-in drive `seed + gain·yawRate`, saturated through tanh so the side
 *      force direction follows (and reinforces) the vehicle's coning motion.
 *
 * @param aoaRad        aircraft angle of attack (rad)
 * @param yawRateRadS   body yaw rate about +Y (rad/s) — the coning motion
 * @param pitchRateRadS body pitch rate about +X (rad/s)
 * @param speed         airspeed (m/s), for the pitch-rate-induced nose AoA
 * @param cfg           forebody asymmetry tuning
 */
export function forebodyAsymmetryCy(
    aoaRad: number, yawRateRadS: number, pitchRateRadS: number, speed: number,
    cfg: Fm2ForebodyAsymmetryConfig,
): number {
    const sign = Math.sign(aoaRad) || 1;
    const arm = cfg.pitchRateArmRatio ?? 0;
    // Ericsson's pitch-rate-induced nose incidence: α̇ at the nose ≈ q·armZ/U, and
    // the effective nose AoA is α − α̇·(1 + x/X_CG). During a nose-up pull α̇ shares
    // the AoA sign, so the nose sees a LOWER magnitude (delayed onset); on the way
    // down it sees more.
    const alphaDotNose = speed > 1 ? (pitchRateRadS * cfg.armZ) / speed : 0;
    const aoaEffMag = Math.abs(aoaRad) - arm * alphaDotNose * sign;

    const env = smoothstep(cfg.onsetAoaRad, cfg.fullAoaRad, aoaEffMag);
    if (env <= 0) return 0;

    // Moving-wall lock-in: the coning/yaw motion (plus the micro-asymmetry seed)
    // sets the asymmetry direction; tanh saturates it to ±1.
    const drive = cfg.seedDrive + cfg.lockInRateGain * yawRateRadS;
    const lock = Math.tanh(drive / Math.max(cfg.driveScale, 1e-3));

    return env * cfg.maxSideForceCoeff * lock;
}
