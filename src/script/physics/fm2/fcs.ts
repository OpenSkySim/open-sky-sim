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
import { clamp } from '../../utils/math';
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
 * `aoaLimiterGain: 0` to opt out of the AoA deflection cap entirely).
 */
const DEFAULT_AOA_LIMIT_DEG = 22;
const DEFAULT_AOA_SOFT_DEG = 17;
const DEFAULT_AOA_LIMITER_GAIN = 0.35;
const DEFAULT_AOA_LIMITER_LEAD_S = 0.30;
/** Positive / negative structural g command limits (limiters ON). */
const DEFAULT_MAX_COMMAND_G = 9.5;
const DEFAULT_MIN_COMMAND_G = -3.0;
/**
 * Direct structural-g deflection cap defaults (analogous to the AoA cap). The g
 * cap turns the +g/−g limits into HARD ceilings by shaping the stabilator
 * deflection command: `gLimiterGain` is the nose-down (nose-up on the −g side)
 * command per g of overshoot past the limit, `gLimiterLeadS` predicts the load
 * factor ahead by ġ so the cap arrests it before it overshoots, and
 * `gLimiterSoftMarginG` is how far below the limit the fade begins.
 */
const DEFAULT_G_LIMITER_GAIN = 0.9;
const DEFAULT_G_LIMITER_LEAD_S = 0.05;
const DEFAULT_G_LIMITER_NEG_LEAD_S = 0.5;
const DEFAULT_G_LIMITER_SOFT_MARGIN_G = 1.5;
const DEFAULT_CAP_BACK_CALC_GAIN = 0.75;
const DEFAULT_CAP_RATE_TAU_S = 0.06;
const DEFAULT_AOA_CAP_Q_FADE_START = 0.3;
const DEFAULT_AOA_CAP_Q_FADE_END = 0.7;

/** Hermite smoothstep for regime fades (0 at edge0, 1 at edge1). */
function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
    return t * t * (3 - 2 * t);
}

/** Blend `a` toward `b` by weight in [0, 1]. */
function lerp(a: number, b: number, w: number): number {
    return a + (b - a) * w;
}

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
 * Nose-up stabilator-DEFLECTION ceiling for the AoA limiter on the POSITIVE-AoA
 * side.
 *
 * Returns the maximum allowed nose-up elevator (stabilator) DEFLECTION command
 * — the same normalized [-1, 1] surface command that stick input produces — for
 * the given AoA, using a rate-led prediction so the cap engages before the
 * limit: full nose-up authority (1) below the soft point, fading linearly to 0
 * at the hard limit, then going NEGATIVE past it to command a genuine nose-DOWN
 * deflection in proportion to the overshoot. The airframe's real aero response
 * to that deflection is what holds the AoA; nothing here touches the airframe
 * state directly. Call with negated arguments to get the (mirrored) nose-down
 * ceiling for the negative-AoA side.
 */
function aoaLimitDeflectionCeiling(aoaDeg: number, aoaRateDegS: number, p: Fm2PitchLawConfig): number {
    const soft = p.aoaSoftDeg ?? DEFAULT_AOA_SOFT_DEG;
    const hard = p.aoaLimitDeg ?? DEFAULT_AOA_LIMIT_DEG;
    const gain = p.aoaLimiterGain ?? DEFAULT_AOA_LIMITER_GAIN;
    const lead = aoaDeg + aoaRateDegS * (p.aoaLimiterLeadS ?? DEFAULT_AOA_LIMITER_LEAD_S);
    if (lead <= soft) return 1;
    if (lead <= hard) return (hard - lead) / Math.max(hard - soft, 1e-3);
    return -clamp((lead - hard) * gain, 0, 1);
}

/**
 * Nose-up stabilator-DEFLECTION ceiling for the STRUCTURAL-G limiter, built the
 * same way as {@link aoaLimitDeflectionCeiling} but on load factor.
 *
 * Given the current load factor `g`, its filtered rate `gRatePerS`, the hard
 * structural limit `hardG` and the soft (fade-start) point `softG`, returns the
 * maximum allowed nose-up deflection command: full authority (1) below the soft
 * point, fading linearly to 0 at the hard limit (using a rate-led prediction so
 * it arrests the load factor before it overshoots), then going NEGATIVE past the
 * limit to command a genuine nose-DOWN deflection proportional to the overshoot.
 * The airframe's real aero response to that deflection is what holds the g;
 * nothing here touches the state. Call with negated arguments and the mirrored
 * (negative) limits to get the nose-down floor for the −g side.
 */
function gLimitDeflectionCeiling(
    g: number, gRatePerS: number, hardG: number, softG: number, gain: number, leadS: number,
): number {
    const lead = g + gRatePerS * leadS;
    if (lead <= softG) return 1;
    if (lead <= hardG) return (hardG - lead) / Math.max(hardG - softG, 1e-3);
    return -clamp((lead - hardG) * gain, 0, 1);
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
     * Upper / lower clamp bounds actually applied to the normalized elevator
     * command this step, in the SAME polarity as {@link elevator} (positive =
     * nose-up / aft-stick). With the FBW limiters ON these are the combined
     * AoA-limit and g-limit deflection caps (the noseUp/noseDown min/max
     * composition); with the limiters OFF (direct law, no clamp) they are +1 / -1.
     */
    elevatorLimitHi: number;
    elevatorLimitLo: number;
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
    private elevatorLimitHi = 1;
    private elevatorLimitLo = -1;
    /** Rate-limited nose-up / nose-down deflection cap bounds. */
    private noseUpCapFilt = 1;
    private noseDownCapFilt = -1;

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
        this.elevatorLimitHi = 1;
        this.elevatorLimitLo = -1;
        this.noseUpCapFilt = 1;
        this.noseDownCapFilt = -1;
    }

    getState(): FcsOutput {
        return {
            elevator: this.elevator,
            aileron: this.aileron,
            rudder: this.rudder,
            elevatorLimitHi: this.elevatorLimitHi,
            elevatorLimitLo: this.elevatorLimitLo,
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
        } else {
            // Default to the full ±1 travel; the g-command law overwrites these with
            // the actual AoA/g deflection caps it applies (the direct pitch law
            // applies no clamp, so ±1 stands).
            this.elevatorLimitHi = 1;
            this.elevatorLimitLo = -1;
            elevatorTarget = this.cfg.pitch.gCommand
                ? this.gCommandPitchLaw(input, dt)
                : this.directPitchLaw(input);
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
        const aerobatic = input.speed < 130 || absAoaDeg > 35;
        // Limiters-off direct path: the pilot has overridden the FBW AoA/g limiter
        // (like a real limiter-off switch). The stick goes straight to the
        // stabilator; the nose swing to ~90° comes purely from the relaxed
        // airframe (AoA-gated CG shift), not from any injected moment or trigger.
        const limitersOff = input.limitersEnabled === false;
        const directHigh = limitersOff;
        const directBlend = directHigh ? 1
            : aerobatic
                ? clamp(Math.abs(input.pitchStick) * (absAoaDeg > 50 ? 1 : (130 - input.speed) / 90), 0, 1)
                : 0;
        const directFlight = directHigh || aerobatic;

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

        // AoA limiter: fade the nose-up authority as AoA approaches the limit.
        const aoaLimiter = directFlight ? 1 : clamp(
            (p.aoaLimitDeg - aoaDeg) / (p.aoaLimitDeg - p.aoaSoftDeg),
            0, 1,
        );
        if (commandedG > 1) {
            commandedG = 1 + (commandedG - 1) * aoaLimiter;
        }

        const gError = commandedG - input.loadFactorG;
        const dampScale = directHigh ? (hi?.directDampScale ?? 0.25)
            : aerobatic ? 0.12 : 1;
        const aoaRateDamp = p.aoaRateDampGain * dampScale;
        // pitchRate about +X is nose-down-positive, so +pitchRate damps a nose-up
        // command; -α̇ term adds dedicated short-period damping.
        const proportional = gGain * gError
            + rateDampGain * dampScale * input.pitchRate
            - aoaRateDamp * this.aoaRateFilt;

        // Integral trim with anti-windup. Bleed the accumulator down when the AoA
        // limiter is active (either direction), OR when the stabilator command is
        // saturated AND the integrator is FIGHTING the current g error (opposite
        // signs) — i.e. it wound up holding the surface hard over while the loop now
        // needs to recover the other way. Leaking only in that windup-stick case
        // preserves full authority while the integrator is legitimately building
        // toward the commanded g (same sign), so a hard pull still reaches +9.5 g,
        // yet a hard forward-stick push can no longer pin the elevator nose-down and
        // sustain far past the -3 g structural command (the negative-g windup).
        const limiterActive = !directFlight && aoaLimiter < 0.999;
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
            directElevator = clamp(input.pitchStick + rateDampGain * 0.35 * input.pitchRate, -1, 1);
        }
        let elevator = gCommandElevator * (1 - directBlend) + directElevator * directBlend;

        // AoA limiter via stabilator-DEFLECTION authority only (limiters ON).
        //
        // The g-command AoA limiter above only fades the COMMANDED g toward 1 g,
        // and it is bypassed entirely in the low-speed `aerobatic` regime. At low
        // dynamic pressure the airframe cannot even reach 1 g at the limit AoA, so
        // the g loop keeps commanding nose-up and the AoA runs past the limit into
        // the always-active aft-CG relaxation — the low-speed "cobra with limiters
        // ON" bug.
        //
        // The fix shapes ONLY the elevator (stabilator) deflection COMMAND: as AoA
        // nears the limit the max nose-up deflection is faded to zero, and past the
        // limit a genuine nose-DOWN deflection is commanded (with an α̇ lead so the
        // approach is damped). This is the identical normalized surface command
        // that stick input produces — it flows through the same actuator lag,
        // `mapControls` stabilator incidence and `AeroSurface` build-up as any
        // other command. The AoA is then held by the airframe's REAL aerodynamic
        // response to that real deflection; the limiter injects no moment/force,
        // clamps no AoA/pitch-rate state and never bypasses the aero. Because
        // arresting the aft-CG (static) divergence is a MOMENT balance — the
        // destabilizing wing/forebody moment and the stabilator counter-moment
        // both scale with the same q — bounding the deflection command holds AoA
        // across the whole speed/altitude envelope, not just at high q.
        // Defaulted so the cap protects EVERY g-command aircraft, including mod /
        // manifest configs that omit the optional `aoaLimiter*` fields; a config
        // can still opt out explicitly with `aoaLimiterGain: 0`.
        //
        // The structural-g DEFLECTION cap (below) is built identically but on load
        // factor, turning the +g/−g limits into hard ceilings. The two caps compose
        // by taking the MOST RESTRICTIVE bound on each side (nose-up = min of the
        // ceilings, nose-down = max of the floors). They act in different regimes —
        // at high q a hard pull hits +9.5 g near ~12° AoA (g cap dominates, AoA cap
        // idle); at low q (300 km/h) g stays low and the AoA cap holds ~19° — so the
        // min/max composition is smooth and does not chatter.
        if (!limitersOff) {
            let noseUp = 1;
            let noseDown = -1;

            // High q: fade the AoA cap out so the G cap alone governs hard pulls.
            // During aggressive roll, fade both caps so turn entry does not excite
            // short-period limit cycles from roll-coupled AoA changes.
            const qNorm = clamp(input.dynamicPressure / Math.max(input.qRef, 1), 0, 1);
            const qFadeStart = p.aoaCapQFadeStart ?? DEFAULT_AOA_CAP_Q_FADE_START;
            const qFadeEnd = p.aoaCapQFadeEnd ?? DEFAULT_AOA_CAP_Q_FADE_END;
            const aoaCapQWeight = 1 - smoothstep(qFadeStart, qFadeEnd, qNorm);
            const maxRollRadS = (this.cfg.roll.maxRollRateDegS ?? 300) * DEG;
            const rollFade = clamp(1 - Math.abs(input.rollRate) / Math.max(maxRollRadS, 1e-3), 0, 1);
            const aoaCapWeight = aoaCapQWeight * (0.25 + 0.75 * rollFade);
            const gCapRollScale = 0.5 + 0.5 * rollFade;

            const aoaLimiterGain = p.aoaLimiterGain ?? DEFAULT_AOA_LIMITER_GAIN;
            if (aoaLimiterGain > 0 && aoaCapWeight > 1e-3) {
                const aoaRateDegS = this.aoaRateFilt / DEG;
                const aoaUpCeiling = aoaLimitDeflectionCeiling(aoaDeg, aoaRateDegS, p);
                const aoaDownCeiling = aoaLimitDeflectionCeiling(-aoaDeg, -aoaRateDegS, p);
                noseUp = Math.min(noseUp, lerp(1, aoaUpCeiling, aoaCapWeight));
                noseDown = Math.max(noseDown, -lerp(1, aoaDownCeiling, aoaCapWeight));
            }

            const gLimiterGain = (p.gLimiterGain ?? DEFAULT_G_LIMITER_GAIN) * gCapRollScale;
            if (gLimiterGain > 0) {
                const g = input.loadFactorG;
                const gr = this.gRateFilt;
                const soft = p.gLimiterSoftMarginG ?? DEFAULT_G_LIMITER_SOFT_MARGIN_G;
                const lead = p.gLimiterLeadS ?? DEFAULT_G_LIMITER_LEAD_S;
                // The −g side uses a longer prediction horizon: the −3 g limit sits
                // much closer to 1-g cruise than +9.5 g and a nose-over builds g
                // fast, so the same lead that keeps the +g side from clipping short
                // of 9.5 g would let the −g transient blow past −3 g.
                const negLead = p.gLimiterNegLeadS ?? DEFAULT_G_LIMITER_NEG_LEAD_S;
                // Nose-up ceiling from the +g limit; nose-down floor from the −g
                // limit (mirrored via negated arguments, like the AoA cap).
                noseUp = Math.min(noseUp,
                    gLimitDeflectionCeiling(g, gr, maxCommandG, maxCommandG - soft, gLimiterGain, lead));
                noseDown = Math.max(noseDown,
                    -gLimitDeflectionCeiling(-g, -gr, -minCommandG, -minCommandG - soft, gLimiterGain, negLead));
            }

            // Rate-limit the nose-up ceiling only (turn/+g chatter source). The
            // nose-down floor snaps instantly so the −g cap can arrest a push
            // without lag-induced overshoot past −3 g.
            const capTau = p.capRateTauS ?? DEFAULT_CAP_RATE_TAU_S;
            const capAlpha = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(capTau, 1e-3));
            if (noseUp >= this.noseUpCapFilt) {
                this.noseUpCapFilt = noseUp;
            } else {
                this.noseUpCapFilt += (noseUp - this.noseUpCapFilt) * capAlpha;
            }
            this.noseDownCapFilt = noseDown;
            const cappedNoseUp = this.noseUpCapFilt;
            const cappedNoseDown = this.noseDownCapFilt;

            const elevatorUncapped = elevator;
            elevator = clamp(elevator, cappedNoseDown, cappedNoseUp);
            const capError = elevator - elevatorUncapped;
            const softG = p.gLimiterSoftMarginG ?? DEFAULT_G_LIMITER_SOFT_MARGIN_G;
            const gNow = input.loadFactorG;
            const gNearLimit = gNow >= maxCommandG - softG || gNow <= minCommandG + softG;
            const aoaNearLimit = absAoaDeg >= (p.aoaSoftDeg ?? DEFAULT_AOA_SOFT_DEG);
            if (Math.abs(capError) > 1e-6 && (gNearLimit || aoaNearLimit)) {
                const backCalc = p.capBackCalcGain ?? DEFAULT_CAP_BACK_CALC_GAIN;
                // Back-calculate only when the cap is restricting nose-up (positive
                // uncapped command clipped down). On the −g side the cap restricts
                // nose-down by raising the floor; feeding that clip back into the
                // integrator fights the push and prevents reaching −3 g.
                if (elevatorUncapped > 0 && capError < 0) {
                    this.pitchIntegral += capError * backCalc / Math.max(iGain, 1e-3);
                    this.pitchIntegral = clamp(this.pitchIntegral, -3, 3);
                }
            }

            // Surface the applied clamp bounds (same +nose-up polarity as the
            // exposed elevator command) so the HUD can mark where the pitch input
            // is being limited.
            this.elevatorLimitHi = clamp(cappedNoseUp, -1, 1);
            this.elevatorLimitLo = clamp(cappedNoseDown, -1, 1);
        } else {
            this.noseUpCapFilt = 1;
            this.noseDownCapFilt = -1;
        }
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
