/**
 * FM2 fly-by-wire / stability-augmentation control laws.
 *
 * The bare F-16 airframe is (by design) close to neutrally/negatively stable and
 * is only flyable through its FBW system. This module maps the pilot's stick and
 * pedal inputs into control-surface commands and closes rate/g loops around the
 * airframe so that the handling qualities — not the raw aerodynamics — define the
 * feel:
 *   - Pitch: a g-command law with pitch-rate damping, an angle-of-attack limiter
 *     and the structural g envelope.
 *   - Roll: a roll-rate command (capped near ~300°/s, faded by dynamic pressure,
 *     Mach, altitude and AoA) driving ailerons plus a differential stabilator.
 *   - Yaw: a washed-out yaw-rate damper plus an aileron-rudder interconnect for
 *     turn coordination, with direct pedal authority on top.
 *
 * Outputs are normalized commands in [-1, 1]; the flight model converts them into
 * physical surface incidence for the aero parts. First-order actuator lag is
 * applied so surfaces cannot snap instantaneously.
 */
import { clamp } from '../../utils/math';
import { computeMachNumber } from '../aeroUtils';
import { computeF16CommandedRollRate, F16_ROLL_CAT1 } from '../f16RollControl';
import { FM2_FCS } from './f16Fm2Config';

const DEG = Math.PI / 180;

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
}

export class F16Fcs {
    private elevator = 0;
    private aileron = 0;
    private rudder = 0;
    private yawRateLowPass = 0;
    private pitchIntegral = 0;
    private prevAoa = 0;
    private aoaRateFilt = 0;
    private prevAoaValid = false;

    reset(): void {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
        this.pitchIntegral = 0;
        this.prevAoa = 0;
        this.aoaRateFilt = 0;
        this.prevAoaValid = false;
    }

    getState(): FcsOutput {
        return { elevator: this.elevator, aileron: this.aileron, rudder: this.rudder };
    }

    update(input: FcsInput, dt: number): FcsOutput {
        const elevatorTarget = this.pitchLaw(input, dt);
        const aileronTarget = this.rollLaw(input);
        const rudderTarget = this.yawLaw(input, aileronTarget, dt);

        // First-order actuator lag toward the commanded deflection.
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(FM2_FCS.actuatorTauS, 1e-3));
        this.elevator += (elevatorTarget - this.elevator) * a;
        this.aileron += (aileronTarget - this.aileron) * a;
        this.rudder += (rudderTarget - this.rudder) * a;

        return this.getState();
    }

    /**
     * g-command pitch law: a PI regulator drives the load factor to the commanded
     * value (so neutral stick holds 1 g / level flight with no steady error, like
     * the F-16's integral trim), with pitch-rate damping and an AoA limiter.
     */
    private pitchLaw(input: FcsInput, dt: number): number {
        const { maxCommandG, minCommandG, pitchGGain, pitchIGain, pitchRateDampGain } = FM2_FCS;

        // Stick shaping: a cubic "expo" (logarithmic-style) curve. Near neutral the
        // response is dominated by the small (1-e) linear term so a light pull barely
        // changes the g command; authority ramps up steeply toward the ends, and full
        // stick (±1) still maps to ±1 so the structural limit remains reachable. This
        // keeps fine pitch corrections around centre from having an outsized impact.
        const e = FM2_FCS.pitchStickExpo;
        const shapedStick = (1 - e) * input.pitchStick + e * input.pitchStick ** 3;

        // Stick → commanded load factor (about 1 g at neutral stick).
        let commandedG: number;
        if (shapedStick >= 0) {
            commandedG = 1 + shapedStick * (maxCommandG - 1);
        } else {
            commandedG = 1 + shapedStick * (1 - minCommandG);
        }

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
        const fAoa = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(FM2_FCS.aoaRateFilterTauS, 1e-3));
        this.aoaRateFilt += (aoaRate - this.aoaRateFilt) * fAoa;

        // AoA limiter: fade the nose-up authority as AoA approaches the limit.
        const aoaDeg = input.aoaRad / DEG;
        const aoaLimiter = clamp(
            (FM2_FCS.aoaLimitDeg - aoaDeg) / (FM2_FCS.aoaLimitDeg - FM2_FCS.aoaSoftDeg),
            0, 1,
        );
        if (commandedG > 1) {
            commandedG = 1 + (commandedG - 1) * aoaLimiter;
        }

        const gError = commandedG - input.loadFactorG;
        // pitchRate about +X is nose-down-positive, so +pitchRate damps a nose-up
        // command; -α̇ term adds dedicated short-period damping.
        const proportional = pitchGGain * gError
            + pitchRateDampGain * input.pitchRate
            - FM2_FCS.pitchAoaRateDampGain * this.aoaRateFilt;

        // Integral trim with anti-windup. Freeze the accumulator whenever the AoA
        // limiter is active (in either error direction) and bleed it down, so it
        // cannot wind up below the limiter band and get chopped above it — the
        // pumping action that drives the low-speed pitch limit cycle.
        const limiterActive = aoaLimiter < 0.999;
        const raw = proportional + pitchIGain * (this.pitchIntegral + gError * dt);
        const outputSaturated = raw <= -1 || raw >= 1;
        if (!outputSaturated && !limiterActive) {
            this.pitchIntegral = clamp(this.pitchIntegral + gError * dt, -3, 3);
        } else if (limiterActive) {
            const leak = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(FM2_FCS.integralLeakTauS, 1e-3));
            this.pitchIntegral -= this.pitchIntegral * leak;
        }
        const elevator = proportional + pitchIGain * this.pitchIntegral;
        return clamp(elevator, -1, 1);
    }

    /** Roll-rate command law → aileron (and differential tail via the model). */
    private rollLaw(input: FcsInput): number {
        if (input.landed) {
            return 0;
        }
        const mach = computeMachNumber(input.speed, input.altitudeM);
        const commandedRateRad = computeF16CommandedRollRate({
            stick: input.rollStick,
            dynamicPressure: input.dynamicPressure,
            qRef: input.qRef,
            mach,
            altitudeM: input.altitudeM,
            aoaRad: input.aoaRad,
            flapsExtended: input.flapsExtended,
            landed: input.landed,
            config: F16_ROLL_CAT1,
        });
        // Close the loop on body roll rate (about +Z). A positive aileron command
        // produces a NEGATIVE roll moment (see the model's control mapping), so the
        // error is (rate − command) to keep the feedback negative.
        const rateError = input.rollRate - commandedRateRad;
        return clamp(FM2_FCS.rollRateGain * rateError, -1, 1);
    }

    /** Yaw damper (washed out) + aileron-rudder interconnect + pedal. */
    private yawLaw(input: FcsInput, aileronCmd: number, dt: number): number {
        // Washout: high-pass the yaw rate so a steady turn is not opposed.
        const tau = Math.max(FM2_FCS.yawDamperWashoutTauS, 1e-3);
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
        this.yawRateLowPass += (input.yawRate - this.yawRateLowPass) * a;
        const yawRateHighPass = input.yawRate - this.yawRateLowPass;

        const damper = -FM2_FCS.yawDamperGain * yawRateHighPass;
        const ari = FM2_FCS.ariGain * aileronCmd; // coordinate turns
        const pedal = input.yawPedal * FM2_FCS.maxRudderCmd;
        return clamp(pedal + damper + ari, -1, 1);
    }
}
