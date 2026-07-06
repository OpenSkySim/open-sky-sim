/**
 * Flight-control-system abstraction for the FM2 model.
 *
 * The model asks the FCS to turn pilot stick/pedal inputs (plus the current
 * body rates and flight condition) into normalized surface commands in [-1, 1].
 * Two implementations exist: {@link F16Fcs} (relaxed-stability fly-by-wire) and
 * {@link DirectFcs} (mechanical direct control for conventionally-stable
 * aircraft such as the A-4E).
 */

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

export interface Fcs {
    reset(): void;
    update(input: FcsInput, dt: number): FcsOutput;
    getState(): FcsOutput;
}
