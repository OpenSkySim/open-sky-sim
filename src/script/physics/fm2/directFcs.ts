/**
 * Direct (mechanical) flight-control laws.
 *
 * Unlike the F-16 fly-by-wire system, a conventionally-stable aircraft such as
 * the A-4E flies "cables and pushrods": the stick moves the surfaces more or
 * less directly, and the airframe's own aerodynamic stability provides the
 * handling. This FCS therefore maps stick/pedal straight to surface commands,
 * with only light rate damping and a washed-out yaw damper to take the edge off
 * the Dutch roll. There is no g-command loop, AoA limiter or roll-rate loop.
 */
import { clamp } from '../../utils/math';
import { Fm2DirectFcsConfig } from './fm2AircraftConfig';
import { Fcs, FcsInput, FcsOutput } from './fcs';

export class DirectFcs implements Fcs {
    private elevator = 0;
    private aileron = 0;
    private rudder = 0;
    private yawRateLowPass = 0;

    constructor(private readonly cfg: Fm2DirectFcsConfig) { }

    reset(): void {
        this.elevator = 0;
        this.aileron = 0;
        this.rudder = 0;
        this.yawRateLowPass = 0;
    }

    getState(): FcsOutput {
        return { elevator: this.elevator, aileron: this.aileron, rudder: this.rudder };
    }

    update(input: FcsInput, dt: number): FcsOutput {
        // Elevator: stick straight through, with a touch of pitch-rate damping.
        // pitchRate about +X is nose-down-positive, so +pitchRate opposes a
        // nose-up (positive) elevator command.
        const elevatorTarget = clamp(
            input.pitchStick + this.cfg.pitchRateDamp * input.pitchRate, -1, 1);

        // Aileron: stick straight through, with roll-rate damping.
        const aileronTarget = clamp(
            input.rollStick - this.cfg.rollRateDamp * input.rollRate, -1, 1);

        // Rudder: pedal + washed-out yaw damper + aileron-rudder interconnect.
        const tau = Math.max(this.cfg.yawDamperWashoutTauS, 1e-3);
        const aw = dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
        this.yawRateLowPass += (input.yawRate - this.yawRateLowPass) * aw;
        const yawRateHighPass = input.yawRate - this.yawRateLowPass;
        const rudderTarget = clamp(
            input.yawPedal
            - this.cfg.yawDamperGain * yawRateHighPass
            + this.cfg.ariGain * aileronTarget,
            -1, 1);

        // First-order actuator lag toward the commanded deflection.
        const a = dt <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(this.cfg.actuatorTauS, 1e-3));
        this.elevator += (elevatorTarget - this.elevator) * a;
        this.aileron += (aileronTarget - this.aileron) * a;
        this.rudder += (rudderTarget - this.rudder) * a;

        return this.getState();
    }
}
