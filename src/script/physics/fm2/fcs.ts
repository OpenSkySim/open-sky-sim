/**
 * Unified flight-control system for the FM2 model.
 *
 * A SINGLE, config-driven class flies every aircraft. The model asks the FCS to
 * turn pilot stick/pedal inputs (plus the current body rates and flight
 * condition) into normalized surface commands in [-1, 1]. Whether an aircraft
 * behaves as a relaxed-stability fly-by-wire jet or a conventionally stable
 * mechanical aircraft (e.g. an imported mod) is determined ENTIRELY by {@link Fm2FcsConfig}
 * — there is no separate class per handling type. Per axis a boolean picks the
 * control law:
 *   - Pitch (`pitch.gCommand`): a g-command law with pitch-rate damping, an
 *     angle-of-attack limiter and the structural g envelope, OR a mechanical
 *     direct path (stick → elevator with pitch-rate damping).
 *   - Roll (`roll.rateCommand`): a roll-rate command loop (capped and faded by
 *     dynamic pressure, Mach, altitude and AoA) OR a mechanical direct path
 *     (stick → aileron with roll-rate damping).
 *   - Yaw: a washed-out yaw-rate damper plus an aileron-rudder interconnect and
 *     direct pedal authority — shared by both handling types (gains differ).
 *
 * Outputs are normalized commands in [-1, 1]; the flight model converts them
 * into physical surface incidence for the aero parts. First-order actuator lag
 * is applied so surfaces cannot snap instantaneously.
 */
import { clamp, lerp } from '../../utils/math';
import { computeMachNumber } from '../aeroUtils';
import { Fm2FcsConfig, Fm2PitchLawConfig, Fm2RollLawConfig } from './fm2AircraftConfig';

const DEG = Math.PI / 180;

/**
 * Built-in FBW envelope-limit defaults. The AoA cap and structural-g clamp are
 * FLIGHT-SAFETY features, so they must be active for EVERY fly-by-wire
 * (g-command) aircraft the sim can fly — including mod / manifest aircraft whose
 * `.aircraft.json` flight block omits some of these fields. Without a default
 * those omitted fields read as `undefined`, the limit is skipped, and full stick
 * runs the AoA / g away even with the limiters ON. These are the canonical
 * relaxed-stability fighter values; any config may override them (set
 * `aoaLimiterGain: 0` to disable predicted-AoA recovery).
 */
const DEFAULT_AOA_LIMIT_DEG = 28;
const DEFAULT_AOA_SOFT_DEG = 24;
const DEFAULT_AOA_LIMITER_GAIN = 0.35;
const DEFAULT_AOA_LIMITER_LEAD_S = 0.08;
/** Positive / negative structural g command limits (limiters ON). */
const DEFAULT_MAX_COMMAND_G = 9.5;
const DEFAULT_MIN_COMMAND_G = -3.0;
/**
 * Predictive structural-G governor defaults. It converts predicted overshoot into
 * a recovery G reference and reduces pitch demand through the soft margin, before
 * the PI loop and actuator produce a stabilator command.
 */
const DEFAULT_G_LIMITER_GAIN = 0.9;
const DEFAULT_G_LIMITER_LEAD_S = 0.05;
const DEFAULT_G_LIMITER_NEG_LEAD_S = 0.02;
const DEFAULT_G_LIMITER_SOFT_MARGIN_G = 1.0;
/**
 * Time constant (s) for the low-pass filter Fm2Fcs applies to the governor's
 * raw pull/push SOFT-BAND AUTHORITY fraction before it is turned into a G
 * reference / stick stop. The soft band's authority is a function of a
 * *predicted* AoA/G that includes short-period rate noise; without this filter
 * a small wobble near the soft-band edge snaps authority between 0 and 1 every
 * frame, which shows up as aggressive, high-frequency stabilator chatter at
 * high AoA. Recovery (past the HARD boundary) is a separate, unfiltered signal
 * — see `computeRawPitchEnvelopeAuthority` — so this filter's lag can never
 * delay the actual envelope-protection cutoff, only smooth the "stick stop"
 * feel below it.
 */
const DEFAULT_ENVELOPE_AUTHORITY_TAU_S = 0.15;
/**
 * Extra lookahead (s), on top of the recovery lead, used ONLY for the soft-band
 * authority prediction. Looking further ahead here spreads the pull/push
 * authority reduction over more time (and more of the soft band), so the
 * governed G reference — and the stabilator command it drives — eases in
 * smoothly instead of reacting sharply once the (shorter-lead) recovery
 * boundary is already close.
 */
const DEFAULT_ENVELOPE_AUTHORITY_LEAD_S = 0.2;

/**
 * Stick [-1, 1] → commanded body roll rate (rad/s) for the rate-command roll
 * law. The peak rate (`maxRollRateDegS`) is scaled by a dynamic-pressure gain
 * schedule and faded by Mach, altitude, AoA and flap limiters. Every parameter
 * comes from {@link Fm2RollLawConfig}, so the loop is fully generic; the omitted
 * fields fall back to the canonical relaxed-stability fighter schedule.
 */
export function computeCommandedRollRate(input: FcsInput, roll: Fm2RollLawConfig): number {
    if (input.landed || Math.abs(input.rollStick) < 1e-6) {
        return 0;
    }
    const mach = computeMachNumber(input.speed, input.altitudeM);
    const flapFactor = input.flapsExtended ? (roll.flapsFactor ?? 0.65) : 1;
    const limiter = rollMachLimiter(mach, roll)
        * rollAltitudeLimiter(input.altitudeM, roll)
        * rollAoaLimiter(input.aoaRad, roll)
        * flapFactor;
    const qGain = rollDynamicPressureGain(input.dynamicPressure, input.qRef, roll);
    return input.rollStick * roll.maxRollRateDegS * DEG * qGain * limiter;
}

/** Gain falls as dynamic pressure rises so the command cannot overstress the airframe. */
function rollDynamicPressureGain(dynamicPressure: number, qRef: number, roll: Fm2RollLawConfig): number {
    const min = roll.qGainMin ?? 0.12;
    const max = roll.qGainMax ?? 1.0;
    const q = Math.max(dynamicPressure, 1);
    const ref = Math.max(qRef, 1);
    const raw = min + (max - min) * Math.sqrt(ref / (ref + q));
    return clamp(raw, min, max);
}

function rollMachLimiter(mach: number, roll: Fm2RollLawConfig): number {
    const onset = roll.machLimiterOnset ?? 0.85;
    if (mach <= onset) {
        return 1;
    }
    return clamp(1 - (mach - onset) / (roll.machLimiterSlope ?? 0.55), roll.machLimiterFloor ?? 0.35, 1);
}

function rollAltitudeLimiter(altitudeM: number, roll: Fm2RollLawConfig): number {
    const onset = roll.altLimiterOnsetM ?? 12000;
    if (altitudeM <= onset) {
        return 1;
    }
    return clamp(1 - (altitudeM - onset) / (roll.altLimiterSlopeM ?? 20000), roll.altLimiterFloor ?? 0.45, 1);
}

function rollAoaLimiter(aoaRad: number, roll: Fm2RollLawConfig): number {
    const onset = roll.aoaLimiterOnsetDeg ?? 15;
    const aoaDeg = Math.abs(aoaRad) / DEG;
    if (aoaDeg <= onset) {
        return 1;
    }
    return clamp(1 - (aoaDeg - onset) / (roll.aoaLimiterSlopeDeg ?? 22), roll.aoaLimiterFloor ?? 0.15, 1);
}

/**
 * A predictive reference governor, expressed in the pilot's pitch-command
 * domain. It never clamps the final stabilator command: it reduces the requested
 * manoeuvre before the predicted AoA / G reaches the envelope, and requests an
 * aerodynamic recovery manoeuvre once prediction is outside it.
 */
export interface PredictivePitchEnvelope {
    /** Governed load-factor reference for the PI pitch loop. */
    commandedG: number;
    /** Governed stick used by the low-energy direct-stick blend. */
    pitchStick: number;
    /** Pilot-facing available pull / push authority for the HUD. */
    pitchLimitHi: number;
    pitchLimitLo: number;
    /** True while the governor is reducing demand or commanding recovery. */
    active: boolean;
}

/** Cubic Hermite smoothstep, 0 below `edge0`, 1 above `edge1`, eased between. */
function smoothstep01(edge0: number, edge1: number, value: number): number {
    const t = clamp((value - edge0) / Math.max(edge1 - edge0, 1e-3), 0, 1);
    return t * t * (3 - 2 * t);
}

/** Smoothly reduce authority across an envelope soft band. */
function envelopeAuthority(soft: number, hard: number, value: number): number {
    return 1 - smoothstep01(soft, hard, value);
}

const DEFAULT_AOA_RATE_DAMP_Q_FADE_START_NORM = 1.3;
const DEFAULT_AOA_RATE_DAMP_Q_FADE_END_NORM = 1.9;
const DEFAULT_AOA_RATE_DAMP_Q_FADE_FLOOR = 0.55;
const DEFAULT_AOA_RATE_DAMP_Q_FADE_TAU_S = 2.0;

/**
 * Fade multiplier ([0, 1]) applied to `aoaRateDampGain` above a normalized
 * dynamic pressure (qNorm) threshold. See {@link Fm2PitchLawConfig.aoaRateDampQFadeStartNorm}.
 * Takes the (separately time-filtered — see `Fm2Fcs.qNormFilt`) qNorm so a
 * fast-changing q from a maneuver does not itself trigger the fade; only
 * dynamic pressure that has been sustained long enough for the resonance this
 * targets to actually build does.
 */
function aoaRateDampQFade(qNorm: number, p: Fm2PitchLawConfig): number {
    const start = p.aoaRateDampQFadeStartNorm ?? DEFAULT_AOA_RATE_DAMP_Q_FADE_START_NORM;
    const end = p.aoaRateDampQFadeEndNorm ?? DEFAULT_AOA_RATE_DAMP_Q_FADE_END_NORM;
    const floor = p.aoaRateDampQFadeFloor ?? DEFAULT_AOA_RATE_DAMP_Q_FADE_FLOOR;
    return 1 - smoothstep01(start, end, qNorm) * (1 - floor);
}

/** Invert the configured cubic stick curve to expose an effective stick stop. */
function stickForCommandG(targetG: number, p: Fm2PitchLawConfig): number {
    const maxG = p.maxCommandG ?? DEFAULT_MAX_COMMAND_G;
    const minG = p.minCommandG ?? DEFAULT_MIN_COMMAND_G;
    const positive = targetG >= 1;
    const targetShape = positive
        ? clamp((targetG - 1) / Math.max(maxG - 1, 1e-3), 0, 1)
        : clamp((1 - targetG) / Math.max(1 - minG, 1e-3), 0, 1);
    const expo = p.stickExpo;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) * 0.5;
        const shaped = (1 - expo) * mid + expo * mid ** 3;
        if (shaped < targetShape) lo = mid;
        else hi = mid;
    }
    return positive ? hi : -hi;
}

/**
 * Raw (unfiltered, per-frame) pull/push authority and recovery fractions from
 * the predicted AoA/G boundaries. `Fm2Fcs` low-pass filters only the AUTHORITY
 * fraction before it is turned into a G reference / stick stop (see
 * `DEFAULT_ENVELOPE_AUTHORITY_TAU_S`); RECOVERY is the hard-limit safety cutoff
 * and is always applied unfiltered. Kept as a separate, pure step so the raw
 * math stays simple to unit test.
 */
export interface RawPitchEnvelopeAuthority {
    /** [0, 1] fraction of pull authority still available (1 = fully available). */
    pullAuthority: number;
    /** [0, 1] fraction of push authority still available (1 = fully available). */
    pushAuthority: number;
    /** [0, 1] pull recovery demand once the predicted boundary is exceeded. */
    pullRecovery: number;
    /** [0, 1] push recovery demand once the predicted boundary is exceeded. */
    pushRecovery: number;
}

/**
 * Compute the raw, per-frame pull/push authority and recovery fractions from
 * the predicted AoA / load factor. Pure function of the current state (no
 * filtering) — see {@link RawPitchEnvelopeAuthority}.
 */
export function computeRawPitchEnvelopeAuthority(
    input: Pick<FcsInput, 'aoaRad' | 'loadFactorG' | 'dynamicPressure' | 'qRef'>,
    aoaRateRadS: number,
    gRatePerS: number,
    actuatorTauS: number,
    p: Fm2PitchLawConfig,
): RawPitchEnvelopeAuthority {
    const maxG = p.maxCommandG ?? DEFAULT_MAX_COMMAND_G;
    const minG = p.minCommandG ?? DEFAULT_MIN_COMMAND_G;
    const aoaHard = p.aoaLimitDeg ?? DEFAULT_AOA_LIMIT_DEG;
    const aoaSoft = p.aoaSoftDeg ?? DEFAULT_AOA_SOFT_DEG;
    const gSoftMargin = p.gLimiterSoftMarginG ?? DEFAULT_G_LIMITER_SOFT_MARGIN_G;
    // The command must traverse the servo after the governor. Include that delay
    // in prediction so the reference starts backing off before the current
    // stabilator deflection can produce an overshoot. This lead protects the
    // RECOVERY boundary (the hard AoA/G ceiling) — it stays unfiltered and
    // reacts every frame, so it is not stretched by the authority filter's own
    // time constant (that would just inflate the prediction and cut pull
    // authority off far too early during a normal, fast-building hard pull).
    // Low dynamic pressure gives the stabilator less moment to arrest a pitch-up.
    // Use the q schedule only to lengthen prediction in that regime; it never
    // disables either envelope boundary.
    const qNorm = clamp(input.dynamicPressure / Math.max(input.qRef, 1), 0, 1);
    const lowQLeadS = (1 - qNorm) * 0.22;
    const aoaLeadS = (p.aoaLimiterLeadS ?? DEFAULT_AOA_LIMITER_LEAD_S) + actuatorTauS + lowQLeadS;
    const gLeadS = (p.gLimiterLeadS ?? DEFAULT_G_LIMITER_LEAD_S) + actuatorTauS;
    const gNegLeadS = (p.gLimiterNegLeadS ?? DEFAULT_G_LIMITER_NEG_LEAD_S) + actuatorTauS;
    const aoaPred = input.aoaRad / DEG + (aoaRateRadS / DEG) * aoaLeadS;
    const gPred = input.loadFactorG + gRatePerS * gLeadS;
    const gNegPred = -input.loadFactorG - gRatePerS * gNegLeadS;

    // The soft-band AoA AUTHORITY looks further ahead than the recovery
    // boundary above: a longer lookahead starts easing pull/push authority
    // earlier and over more of the soft band, so the stabilator eases in
    // smoothly well before the hard limit instead of reacting sharply once it
    // is already close. This extra lookahead is independent of the (short,
    // unfiltered) recovery lead so the hard-limit safety cutoff timing is
    // unaffected. It is NOT applied to the G authority: the g loop is already
    // a PI regulator whose rate naturally decelerates as it nears its
    // setpoint, so extending its lookahead just makes the (fast) transient
    // rate spike at the START of a hard pull look like a bigger overshoot than
    // it is, cutting pull/push authority off far too early.
    const authorityLeadExtraS = p.envelopeAuthorityLeadS ?? DEFAULT_ENVELOPE_AUTHORITY_LEAD_S;
    const aoaAuthorityPred = input.aoaRad / DEG + (aoaRateRadS / DEG) * (aoaLeadS + authorityLeadExtraS);
    const gAuthorityPred = gPred;
    const gNegAuthorityPred = gNegPred;

    const pullAoaAuthority = envelopeAuthority(aoaSoft, aoaHard, aoaAuthorityPred);
    const pushAoaAuthority = envelopeAuthority(aoaSoft, aoaHard, -aoaAuthorityPred);
    const pullGAuthority = envelopeAuthority(maxG - gSoftMargin, maxG, gAuthorityPred);
    // A push has less available envelope between 1 g and −3 g. Keep its soft
    // band narrow so normal forward-stick authority remains available until the
    // longer negative-G prediction calls for recovery.
    const pushGAuthority = envelopeAuthority(
        -minG - Math.min(gSoftMargin, 0.05), -minG, gNegAuthorityPred,
    );
    const pullAuthority = Math.min(pullAoaAuthority, pullGAuthority);
    const pushAuthority = Math.min(pushAoaAuthority, pushGAuthority);

    const aoaRecovery = Math.max(0, aoaPred - aoaHard) * (p.aoaLimiterGain ?? DEFAULT_AOA_LIMITER_GAIN);
    const gRecovery = Math.max(0, gPred - maxG) * (p.gLimiterGain ?? DEFAULT_G_LIMITER_GAIN);
    const negAoaRecovery = Math.max(0, -aoaPred - aoaHard) * (p.aoaLimiterGain ?? DEFAULT_AOA_LIMITER_GAIN);
    const negGRecovery = Math.max(0, gNegPred + minG) * (p.gLimiterGain ?? DEFAULT_G_LIMITER_GAIN);
    const pullRecovery = clamp(Math.max(aoaRecovery, gRecovery), 0, 1);
    const pushRecovery = clamp(Math.max(negAoaRecovery, negGRecovery), 0, 1);

    return { pullAuthority, pushAuthority, pullRecovery, pushRecovery };
}

/**
 * Turn a (possibly time-filtered) {@link RawPitchEnvelopeAuthority} into the
 * governed G reference / stick stop. Pure function — the filtering itself
 * lives in `Fm2Fcs.update`, which owns the per-step filter state.
 */
export function applyPitchEnvelopeAuthority(
    input: Pick<FcsInput, 'pitchStick' | 'loadFactorG'>,
    commandedG: number,
    authority: RawPitchEnvelopeAuthority,
    p: Fm2PitchLawConfig,
): PredictivePitchEnvelope {
    const maxG = p.maxCommandG ?? DEFAULT_MAX_COMMAND_G;
    const minG = p.minCommandG ?? DEFAULT_MIN_COMMAND_G;
    const { pullAuthority, pushAuthority, pullRecovery, pushRecovery } = authority;

    // Limit the requested turn rate to what the current envelope state can still
    // achieve. Once a further pull cannot create more turn, this becomes a smooth
    // stick stop instead of continually increasing then abruptly cancelling the
    // elevator command.
    const pullGStop = maxG + (clamp(input.loadFactorG, 1, maxG) - maxG) * (1 - pullAuthority);
    const pushGStop = minG + (clamp(input.loadFactorG, minG, 1) - minG) * (1 - pushAuthority);
    const pitchLimitHi = stickForCommandG(pullGStop, p);
    const pitchLimitLo = stickForCommandG(pushGStop, p);
    let governedG = commandedG;
    if (commandedG >= 1) {
        governedG = Math.min(commandedG, pullGStop);
    } else {
        governedG = Math.max(commandedG, pushGStop);
    }
    // Recovery is a load-factor REFERENCE, not an elevator reversal. The existing
    // PI loop and the aircraft's real aero produce the nose-down/up response.
    if (pullRecovery > 0) {
        governedG = Math.min(governedG, 1 - pullRecovery * (1 - minG));
    }
    if (pushRecovery > 0) {
        governedG = Math.max(governedG, 1 + pushRecovery * (maxG - 1));
    }
    governedG = clamp(governedG, minG, maxG);

    let pitchStick = input.pitchStick >= 0
        ? Math.min(input.pitchStick, pitchLimitHi)
        : Math.max(input.pitchStick, pitchLimitLo);
    // The low-energy direct-stick blend must obey the same governed reference,
    // otherwise it can bypass the PI loop exactly where AoA protection is needed.
    if (pullRecovery > 0) {
        pitchStick = Math.min(pitchStick, -pullRecovery);
    }
    if (pushRecovery > 0) {
        pitchStick = Math.max(pitchStick, pushRecovery);
    }
    return {
        commandedG: governedG,
        pitchStick: clamp(pitchStick, -1, 1),
        pitchLimitHi,
        pitchLimitLo,
        active: pitchLimitHi < 0.999 || pitchLimitLo > -0.999 || pullRecovery > 1e-6 || pushRecovery > 1e-6,
    };
}

/**
 * Convenience wrapper combining the raw authority computation and its
 * application with NO time filtering — used by callers (and unit tests) that
 * want the instantaneous governor response. `Fm2Fcs.update` calls the two
 * steps separately so it can low-pass filter the authority in between (see
 * `DEFAULT_ENVELOPE_AUTHORITY_TAU_S`), which is what removes the high-AoA
 * elevator chatter.
 */
export function governPredictivePitchEnvelope(
    input: Pick<FcsInput, 'pitchStick' | 'aoaRad' | 'loadFactorG' | 'dynamicPressure' | 'qRef'>,
    commandedG: number,
    aoaRateRadS: number,
    gRatePerS: number,
    actuatorTauS: number,
    p: Fm2PitchLawConfig,
): PredictivePitchEnvelope {
    const raw = computeRawPitchEnvelopeAuthority(input, aoaRateRadS, gRatePerS, actuatorTauS, p);
    return applyPitchEnvelopeAuthority(input, commandedG, raw, p);
}

export interface FcsInput {
    pitchStick: number; // [-1, 1] positive = nose up / pull
    rollStick: number;  // [-1, 1] positive = roll right
    yawPedal: number;   // [-1, 1] positive = nose right
    /** Body angular velocity components (rad/s). */
    pitchRate: number;  // about +X
    yawRate: number;    // about +Y
    rollRate: number;   // about +Z
    loadFactorG: number;
    aoaRad: number;
    dynamicPressure: number;
    qRef: number;
    speed: number;
    altitudeM: number;
    /**
     * Pilot FBW limiter state. When true (default) the AoA limiter and structural
     * g clamp are active (normal envelope protection). When false the pilot has
     * switched the limiters OFF: the pitch law passes the stick straight to the
     * stabilator with only light damping, so full aft stick lets the relaxed
     * airframe perform an (emergent) Pugachev cobra.
     */
    limitersEnabled: boolean;
    flapsExtended: boolean;
    landed: boolean;
}

export interface FcsOutput {
    /** Elevator command, positive = nose up. */
    elevator: number;
    /** Aileron command, positive = roll right. */
    aileron: number;
    /** Rudder command, positive = nose right. */
    rudder: number;
    /**
     * Available pull / push authority in the same polarity as {@link elevator}
     * (positive = nose-up / aft-stick). With the FBW limiters ON these come from
     * the predictive pitch governor; with the limiters OFF they are +1 / -1.
     */
    elevatorLimitHi: number;
    elevatorLimitLo: number;
    /**
     * Effective pitch stick after the envelope governor (limiters ON) or the raw
     * pilot stick (limiters OFF / mechanical direct pitch). Same [-1, 1] polarity
     * as {@link FcsInput.pitchStick}; drives the HUD stick indicator.
     */
    governedPitchStick: number;
}

export class Fm2Fcs {
    private elevator = 0;
    private aileron = 0;
    private rudder = 0;
    private yawRateLowPass = 0;
    private pitchIntegral = 0;
    private prevAoa = 0;
    private aoaRateFilt = 0;
    private prevAoaValid = false;
    private prevG = 0;
    private gRateFilt = 0;
    private prevGValid = false;
    // Slowly time-filtered qNorm, used ONLY to gate the aoaRateDampGain high-q
    // fade (see `aoaRateDampQFade`). A slow tau means a fast-changing q from a
    // maneuver (e.g. a hard push/pull) does not itself de-rate the damping —
    // only dynamic pressure sustained long enough for the targeted resonance to
    // actually build does.
    private qNormFilt = 0;
    private elevatorLimitHi = 1;
    private elevatorLimitLo = -1;
    private governedPitchStick = 0;
    // Low-pass filtered predictive-envelope soft-band authority (see
    // DEFAULT_ENVELOPE_AUTHORITY_TAU_S). Starts fully available, same as the
    // instantaneous governor at 1 g / low AoA. Recovery (past the hard
    // boundary) is NOT filtered — it is the safety cutoff and must react
    // every frame.
    private pullAuthorityFilt = 1;
    private pushAuthorityFilt = 1;

    constructor(private readonly cfg: Fm2FcsConfig) { }

    reset(): void {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
        this.pitchIntegral = 0;
        this.prevAoa = 0;
        this.aoaRateFilt = 0;
        this.prevAoaValid = false;
        this.prevG = 0;
        this.gRateFilt = 0;
        this.prevGValid = false;
        this.qNormFilt = 0;
        this.elevatorLimitHi = 1;
        this.elevatorLimitLo = -1;
        this.governedPitchStick = 0;
        this.pullAuthorityFilt = 1;
        this.pushAuthorityFilt = 1;
    }

    getState(): FcsOutput {
        return {
            elevator: this.elevator,
            aileron: this.aileron,
            rudder: this.rudder,
            elevatorLimitHi: this.elevatorLimitHi,
            elevatorLimitLo: this.elevatorLimitLo,
            governedPitchStick: this.governedPitchStick,
        };
    }

    update(input: FcsInput, dt: number): FcsOutput {
        let elevatorTarget: number;
        let aileronTarget: number;
        let rudderTarget: number;

        if (input.limitersEnabled === false) {
            // DIRECT LAW: the pilot has switched the FBW limiters OFF, so the FCS
            // stops governing the controls entirely. Pilot stick/pedal map straight
            // to the normalized surface-deflection command — no g-command law, no
            // AoA/g deflection caps, no roll-rate command loop, no yaw damper / ARI,
            // no envelope protection. The only thing between this command and the
            // surface is the physical actuator lag below (which is the servo, not a
            // control law). The signs mirror the fly-by-wire outputs so the surfaces
            // deflect the SAME direction as limiters-ON, just uncapped:
            //  - elevator = +pitchStick  (aft stick → +cmd = nose-up, exposed as-is)
            //  - aileron  = −rollStick   (FBW commands −aileron for a +roll moment;
            //               `mapControls` and getCommandedAileron negate it back)
            //  - rudder   = +yawPedal    (pilot yaw enters as yawPedal = −this.yaw;
            //               getCommandedRudder negates it back to pilot polarity)
            // Full authority: right pedal drives full rudder (not scaled by
            // maxRudderCmd). This direct authority is what lets a full-aft-stick pull
            // punch past the natural AoA ceiling — together with the high-AoA
            // stabilator boost in the model — into the aft-CG relaxation band for the
            // emergent cobra.
            elevatorTarget = clamp(input.pitchStick, -1, 1);
            aileronTarget = clamp(-input.rollStick, -1, 1);
            rudderTarget = clamp(input.yawPedal, -1, 1);
            // Direct law: no elevator clamp, so the bounds are the full ±1 travel.
            this.elevatorLimitHi = 1;
            this.elevatorLimitLo = -1;
            this.governedPitchStick = clamp(input.pitchStick, -1, 1);
        } else {
            // Default to the full ±1 travel; the g-command law overwrites these with
            // the actual AoA/g deflection caps it applies (the direct pitch law
            // applies no clamp, so ±1 stands).
            this.elevatorLimitHi = 1;
            this.elevatorLimitLo = -1;
            if (this.cfg.pitch.gCommand) {
                elevatorTarget = this.gCommandPitchLaw(input, dt);
            } else {
                this.governedPitchStick = clamp(input.pitchStick, -1, 1);
                elevatorTarget = this.directPitchLaw(input);
            }
            aileronTarget = this.cfg.roll.rateCommand
                ? this.rateCommandRollLaw(input)
                : this.directRollLaw(input);
            rudderTarget = this.yawLaw(input, aileronTarget, dt);
        }

        // First-order actuator lag toward the commanded deflection.
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(this.cfg.actuatorTauS, 1e-3));
        this.elevator += (elevatorTarget - this.elevator) * a;
        this.aileron += (aileronTarget - this.aileron) * a;
        this.rudder += (rudderTarget - this.rudder) * a;

        return this.getState();
    }

    /**
     * Mechanical direct pitch: stick straight through, with a touch of pitch-rate
     * damping. pitchRate about +X is nose-down-positive, so +pitchRate opposes a
     * nose-up (positive) elevator command.
     */
    private directPitchLaw(input: FcsInput): number {
        return clamp(input.pitchStick + this.cfg.pitch.rateDampGain * input.pitchRate, -1, 1);
    }

    /**
     * g-command pitch law: a PI regulator drives the load factor to the commanded
     * value (so neutral stick holds 1 g / level flight with no steady error, like
     * a fly-by-wire integral trim), with pitch-rate damping and an AoA limiter.
     *
     * Outside the normal envelope (low energy or deep stall) the law blends toward
     * direct stick→elevator so hammerheads and tail slides remain controllable.
     *
     * When the pilot switches the FBW limiters OFF (`input.limitersEnabled` false)
     * the AoA limiter and structural g clamp are bypassed and the stick is passed
     * straight to the stabilator (light damping only); full aft stick then lets the
     * always-active relaxed airframe pitch up into an emergent Pugachev cobra.
     */
    private gCommandPitchLaw(input: FcsInput, dt: number): number {
        const p = this.cfg.pitch;
        const { gGain, iGain, rateDampGain } = p;
        // Structural g clamp, defaulted so it protects configs that omit the fields.
        const maxCommandG = p.maxCommandG ?? DEFAULT_MAX_COMMAND_G;
        const minCommandG = p.minCommandG ?? DEFAULT_MIN_COMMAND_G;
        const hi = this.cfg.highAoa;

        const aoaDeg = input.aoaRad / DEG;
        const absAoaDeg = Math.abs(aoaDeg);
        // Limiters-off direct path: the pilot has overridden the FBW AoA/g limiter
        // (like a real limiter-off switch). The stick goes straight to the
        // stabilator; the nose swing to ~90° comes purely from the relaxed
        // airframe (AoA-gated CG shift), not from any injected moment or trigger.
        const limitersOff = input.limitersEnabled === false;
        const directHigh = limitersOff;

        // Stick shaping: a cubic "expo" (logarithmic-style) curve. Near neutral the
        // response is dominated by the small (1-e) linear term so a light pull barely
        // changes the g command; authority ramps up steeply toward the ends, and full
        // stick (±1) still maps to ±1 so the structural limit remains reachable. This
        // keeps fine pitch corrections around centre from having an outsized impact.
        const e = p.stickExpo;
        const shapedStick = (1 - e) * input.pitchStick + e * input.pitchStick ** 3;

        // Stick → commanded load factor (about 1 g at neutral stick). The stick
        // map already bounds this to [minCommandG, maxCommandG]; the explicit clamp
        // makes the structural limit hard even if an override pushes it further.
        let commandedG: number;
        if (shapedStick >= 0) {
            commandedG = 1 + shapedStick * (maxCommandG - 1);
        } else {
            commandedG = 1 + shapedStick * (1 - minCommandG);
        }
        commandedG = clamp(commandedG, minCommandG, maxCommandG);

        // Angle-of-attack rate (α̇), low-pass filtered. This is the short-period
        // damper: when the aircraft is energy-limited it cannot hold the commanded
        // g, so the load-factor loop alone hunts around the AoA limit. Damping α̇
        // directly kills that oscillation regardless of available thrust.
        let aoaRate = 0;
        if (this.prevAoaValid && dt > 0) {
            aoaRate = (input.aoaRad - this.prevAoa) / dt;
        }
        this.prevAoa = input.aoaRad;
        this.prevAoaValid = true;
        const fAoa = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(p.aoaRateFilterTauS, 1e-3));
        this.aoaRateFilt += (aoaRate - this.aoaRateFilt) * fAoa;

        // Load-factor rate (ġ), low-pass filtered with the same short time
        // constant. Feeds the g cap's lead term so it arrests the load factor
        // before it overshoots the structural limit.
        let gRate = 0;
        if (this.prevGValid && dt > 0) {
            gRate = (input.loadFactorG - this.prevG) / dt;
        }
        this.prevG = input.loadFactorG;
        this.prevGValid = true;
        this.gRateFilt += (gRate - this.gRateFilt) * fAoa;

        // Predictive reference governor: shapes the requested manoeuvre before it
        // reaches either boundary. Unlike the former post-PI deflection clamps,
        // both the G-loop reference and the low-energy direct-stick blend consume
        // the same available-pitch budget. Only the soft-band AUTHORITY fraction
        // is low-pass filtered (see DEFAULT_ENVELOPE_AUTHORITY_TAU_S) before it is
        // turned into a G reference / stick stop: the predicted AoA/G includes
        // short-period rate noise, and without this filter a small wobble right
        // at the soft-band edge snapped authority between 0 and 1 every frame —
        // the source of the aggressive high-AoA elevator chatter. RECOVERY (past
        // the HARD boundary) stays unfiltered and reacts every frame — it is the
        // safety cutoff, so it must not inherit the authority filter's lag.
        const rawAuthority = computeRawPitchEnvelopeAuthority(
            input, this.aoaRateFilt, this.gRateFilt, this.cfg.actuatorTauS, p,
        );
        const authorityTauS = p.envelopeAuthorityTauS ?? DEFAULT_ENVELOPE_AUTHORITY_TAU_S;
        const fAuthority = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(authorityTauS, 1e-3));
        this.pullAuthorityFilt += (rawAuthority.pullAuthority - this.pullAuthorityFilt) * fAuthority;
        this.pushAuthorityFilt += (rawAuthority.pushAuthority - this.pushAuthorityFilt) * fAuthority;
        const envelope = applyPitchEnvelopeAuthority(input, commandedG, {
            pullAuthority: this.pullAuthorityFilt,
            pushAuthority: this.pushAuthorityFilt,
            pullRecovery: rawAuthority.pullRecovery,
            pushRecovery: rawAuthority.pushRecovery,
        }, p);
        commandedG = envelope.commandedG;
        const gError = commandedG - input.loadFactorG;
        // Continuous fade into the aerobatic/low-energy regime instead of a hard
        // boolean threshold: a hard flip instantaneously changed pitch/AoA-rate
        // damping by ~8x and switched the direct-stick blend on/off whenever AoA
        // or speed hovered right at the boundary — a second source of high-AoA
        // elevator chatter, compounding the governor's own soft band above.
        const aoaAerobaticWeight = smoothstep01(30, 40, absAoaDeg);
        const speedAerobaticWeight = 1 - smoothstep01(100, 160, input.speed);
        const aerobaticWeight = clamp(Math.max(aoaAerobaticWeight, speedAerobaticWeight), 0, 1);
        const dampScale = directHigh ? (hi?.directDampScale ?? 0.25)
            : lerp(aerobaticWeight, 1, 0.12);
        // Only the g-command path's α̇ damping fades with q (see
        // `aoaRateDampQFade`); the limiters-off direct path already uses its own
        // fixed, low damping scale and must stay untouched by this schedule.
        // qNorm itself is slowly time-filtered (see `qNormFilt`) so a fast
        // maneuver's momentary q swing cannot trigger the fade — only dynamic
        // pressure sustained long enough for the targeted resonance to build.
        const qNormRaw = input.dynamicPressure / Math.max(input.qRef, 1);
        const qFadeTauS = p.aoaRateDampQFadeTauS ?? DEFAULT_AOA_RATE_DAMP_Q_FADE_TAU_S;
        const fQ = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(qFadeTauS, 1e-3));
        this.qNormFilt += (qNormRaw - this.qNormFilt) * fQ;
        const qFade = directHigh ? 1 : aoaRateDampQFade(this.qNormFilt, p);
        const aoaRateDamp = p.aoaRateDampGain * dampScale * qFade;
        // pitchRate about +X is nose-down-positive, so +pitchRate damps a nose-up
        // command; -α̇ term adds dedicated short-period damping.
        const proportional = gGain * gError
            + rateDampGain * dampScale * input.pitchRate
            - aoaRateDamp * this.aoaRateFilt;

        // Integral trim with anti-windup. Bleed the accumulator down whenever the
        // predictive governor is reducing manoeuvre demand, OR when the stabilator command is
        // saturated AND the integrator is FIGHTING the current g error (opposite
        // signs) — i.e. it wound up holding the surface hard over while the loop now
        // needs to recover the other way. Leaking only in that windup-stick case
        // preserves full authority while the integrator is legitimately building
        // toward the commanded g (same sign), so a hard pull still reaches +9.5 g,
        // yet a hard forward-stick push can no longer pin the elevator nose-down and
        // sustain far past the -3 g structural command (the negative-g windup).
        const limiterActive = envelope.active;
        const raw = proportional + iGain * (this.pitchIntegral + gError * dt);
        const outputSaturated = raw <= -1 || raw >= 1;
        const windupStick = outputSaturated && this.pitchIntegral * gError < 0;
        if (!outputSaturated && !limiterActive) {
            this.pitchIntegral = clamp(this.pitchIntegral + gError * dt, -3, 3);
        } else if (limiterActive || windupStick) {
            const leak = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(p.integralLeakTauS, 1e-3));
            this.pitchIntegral -= this.pitchIntegral * leak;
        }
        const gCommandElevator = proportional + iGain * this.pitchIntegral;
        let directElevator: number;
        if (directHigh) {
            // Limiters off: stick → stabilator with light pitch-rate / AoA-rate
            // damping (so it isn't numerically divergent), no g clamp, no AoA
            // limiter. The pilot's own stick is what has to come back to recover
            // — there is no automatic cutoff; holding full aft stick keeps
            // commanding nose-up for as long as the real airframe can sustain it.
            const damp = hi?.directDampScale ?? 0.25;
            const dampTerm = rateDampGain * damp * input.pitchRate - p.aoaRateDampGain * damp * this.aoaRateFilt;
            directElevator = clamp(input.pitchStick + dampTerm, -1, 1);
        } else {
            directElevator = clamp(envelope.pitchStick + rateDampGain * 0.35 * input.pitchRate, -1, 1);
        }
        const directBlend = directHigh ? 1
            : aerobaticWeight * clamp(Math.abs(envelope.pitchStick) * (absAoaDeg > 50 ? 1 : (130 - input.speed) / 90), 0, 1);
        let elevator = gCommandElevator * (1 - directBlend) + directElevator * directBlend;
        // The HUD shows available stick authority, not a synthetic elevator clamp.
        this.elevatorLimitHi = envelope.pitchLimitHi;
        this.elevatorLimitLo = envelope.pitchLimitLo;
        this.governedPitchStick = directHigh
            ? clamp(input.pitchStick, -1, 1)
            : envelope.pitchStick;
        return clamp(elevator, -1, 1);
    }

    /**
     * Mechanical direct roll: stick straight through, with roll-rate damping. Roll
     * sign is negated so direct-mode aircraft match the surface mapping convention
     * used by the fly-by-wire path (positive stick → negative aileron command).
     */
    private directRollLaw(input: FcsInput): number {
        return clamp(-input.rollStick - this.cfg.roll.rateDamp * input.rollRate, -1, 1);
    }

    /** Roll-rate command law → aileron (and differential tail via the model). */
    private rateCommandRollLaw(input: FcsInput): number {
        if (input.landed) {
            return 0;
        }
        const commandedRateRad = computeCommandedRollRate(input, this.cfg.roll);
        // Close the loop on body roll rate (about +Z). A positive aileron command
        // produces a NEGATIVE roll moment (see the model's control mapping), so the
        // error is (rate − command) to keep the feedback negative.
        const rateError = input.rollRate - commandedRateRad;
        return clamp(this.cfg.roll.rateGain * rateError, -1, 1);
    }

    /** Yaw damper (washed out) + aileron-rudder interconnect + pedal. */
    private yawLaw(input: FcsInput, aileronCmd: number, dt: number): number {
        const yaw = this.cfg.yaw;
        // Washout: high-pass the yaw rate so a steady turn is not opposed.
        const tau = Math.max(yaw.damperWashoutTauS, 1e-3);
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
        this.yawRateLowPass += (input.yawRate - this.yawRateLowPass) * a;
        const yawRateHighPass = input.yawRate - this.yawRateLowPass;

        const damper = -yaw.damperGain * yawRateHighPass;
        const ari = yaw.ariGain * aileronCmd; // coordinate turns
        const pedal = input.yawPedal * yaw.maxRudderCmd;
        return clamp(pedal + damper + ari, -1, 1);
    }
}
