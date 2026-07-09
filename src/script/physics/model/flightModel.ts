import * as THREE from 'three';
import { UP } from '../../utils/math';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';

export const SIM_FPS = 120;
const SIM_DELTA = 1.0 / SIM_FPS;

export abstract class FlightModel {

    protected obj = new THREE.Object3D();
    protected velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    protected crashed: boolean = false;
    protected landed: boolean = true;
    protected landingGearDeployed: boolean = true;
    protected flapsExtended: boolean = true;
    protected wheelBrakesApplied: boolean = false;
    /** FBW AoA/g limiters. True = normal envelope protection; false = pilot override. */
    protected limitersEnabled: boolean = true;

    protected pitch: number = 0; // [-1, 1]
    protected roll: number = 0; // [-1, 1]
    protected yaw: number = 0; // [-1, 1]
    protected throttle: number = 0; // [0, 1]
    protected effectiveThrottle: number = 0; // [0, 1]

    protected angleOfAttackRad: number = 0;
    protected loadFactorG: number = 1;
    protected engineThrustN: number = 0;
    /**
     * Latest FCS-commanded, post-actuator-lag surface deflections in [-1, 1],
     * expressed in the SAME polarity as the raw pilot stick they animate from
     * (positive elevator = nose-up / aft stick, positive aileron = right roll
     * stick, positive rudder = right pedal). These drive the VISIBLE control
     * surfaces so the fly-by-wire shaping (AoA limiter, roll/yaw laws) is
     * visible on the model. They default to 0 until the first physics state.
     */
    protected commandedElevator: number = 0;
    protected commandedAileron: number = 0;
    protected commandedRudder: number = 0;
    /**
     * Upper / lower clamp bounds the FCS applies to the normalized elevator
     * command this step, in the SAME polarity as {@link commandedElevator}
     * (positive = nose-up / aft stick). With the limiters ON these are the
     * combined AoA/g deflection caps; with the limiters OFF (direct law) they are
     * +1 / -1. Used by the HUD to mark the pitch-input limits. Default ±1.
     */
    protected elevatorCommandLimitHigh: number = 1;
    protected elevatorCommandLimitLow: number = -1;
    /** World-frame linear acceleration from the last physics step (m/s²). */
    protected readonly accelWorld = new THREE.Vector3();

    private prevPosition = new THREE.Vector3();
    private prevQuaternion = new THREE.Quaternion();
    private prevVelocity = new THREE.Vector3();
    private deltaRemainder: number = 0;

    abstract step(delta: number): void;

    reset() {
        this.obj.position.set(0, 0, 0);
        this.obj.quaternion.setFromAxisAngle(UP, 0);
        this.velocity.set(0, 0, 0);
        this.crashed = false;
        this.landed = true;
        this.landingGearDeployed = true;
        this.flapsExtended = true;
        this.wheelBrakesApplied = false;
        this.limitersEnabled = true;
        this.pitch = 0;
        this.roll = 0;
        this.yaw = 0;
        this.throttle = 0;
        this.effectiveThrottle = 0;
        this.angleOfAttackRad = 0;
        this.loadFactorG = 1;
        this.engineThrustN = 0;
        this.commandedElevator = 0;
        this.commandedAileron = 0;
        this.commandedRudder = 0;
        this.elevatorCommandLimitHigh = 1;
        this.elevatorCommandLimitLow = -1;
        this.accelWorld.set(0, 0, 0);
        this.deltaRemainder = 0;
        this.syncPreviousState();
    }

    /** Align render interpolation after teleport or airborne spawn. */
    snapPhysicsState(): void {
        this.syncPreviousState();
    }

    update(delta: number): void {
        this.deltaRemainder += delta;
        while (this.deltaRemainder >= SIM_DELTA) {
            this.savePreviousState();
            this.step(SIM_DELTA);
            this.deltaRemainder -= SIM_DELTA;
        }
    }

    /** 1 = latest physics state, 0 = previous physics state. */
    getRenderInterpolationAlpha(): number {
        return 1 - this.deltaRemainder / SIM_DELTA;
    }

    getRenderPosition(target: THREE.Vector3): THREE.Vector3 {
        return target.lerpVectors(this.prevPosition, this.obj.position, this.getRenderInterpolationAlpha());
    }

    getRenderQuaternion(target: THREE.Quaternion): THREE.Quaternion {
        return target.slerpQuaternions(this.prevQuaternion, this.obj.quaternion, this.getRenderInterpolationAlpha());
    }

    getRenderVelocity(target: THREE.Vector3): THREE.Vector3 {
        return target.lerpVectors(this.prevVelocity, this.velocity, this.getRenderInterpolationAlpha());
    }

    private savePreviousState(): void {
        this.prevPosition.copy(this.obj.position);
        this.prevQuaternion.copy(this.obj.quaternion);
        this.prevVelocity.copy(this.velocity);
    }

    private syncPreviousState(): void {
        this.prevPosition.copy(this.obj.position);
        this.prevQuaternion.copy(this.obj.quaternion);
        this.prevVelocity.copy(this.velocity);
    }

    setPitch(pitch: number) {
        this.pitch = pitch;
    }

    setRoll(roll: number) {
        this.roll = roll;
    }

    setYaw(yaw: number) {
        this.yaw = yaw;
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
    }

    /** Match spooled engine state to commanded throttle (e.g. airborne spawn). */
    syncEffectiveThrottle() {
        this.effectiveThrottle = this.throttle;
    }

    /**
     * Select the aircraft this model should simulate. Only the FM2 model is
     * per-aircraft for now; every other model ignores this (generic dynamics).
     */
    setAircraft(_config: Fm2AircraftConfig): void {
        // No-op by default.
    }

    setLandingGearDeployed(deployed: boolean) {
        this.landingGearDeployed = deployed;
    }

    setFlapsExtended(extended: boolean) {
        this.flapsExtended = extended;
    }

    setWheelBrakes(applied: boolean) {
        this.wheelBrakesApplied = applied;
    }

    isWheelBrakesApplied(): boolean {
        return this.wheelBrakesApplied;
    }

    /** Enable/disable the FBW AoA/g limiters (false = pilot limiter override). */
    setLimitersEnabled(enabled: boolean) {
        this.limitersEnabled = enabled;
    }

    isLimitersEnabled(): boolean {
        return this.limitersEnabled;
    }

    setLanded(isLanded: boolean) {
        this.landed = isLanded;
    }

    isLanded(): boolean {
        return this.landed;
    }

    setCrashed(isCrashed: boolean) {
        this.crashed = isCrashed;
    }

    isCrashed(): boolean {
        return this.crashed;
    }

    set position(p: THREE.Vector3) {
        this.obj.position.copy(p);
    }

    get position() {
        return this.obj.position;
    }

    set quaternion(q: THREE.Quaternion) {
        this.obj.quaternion.copy(q);
    }

    get quaternion() {
        return this.obj.quaternion;
    }

    set velocityVector(v: THREE.Vector3) {
        this.velocity.copy(v);
    }

    get velocityVector() {
        return this.velocity;
    }

    getEffectiveThrottle(): number {
        return this.effectiveThrottle;
    }

    // [-1,1] - Values >= 0 mean stall
    abstract getStallStatus(): number;

    getAngleOfAttack(): number {
        return this.angleOfAttackRad;
    }

    getLoadFactorG(): number {
        return this.loadFactorG;
    }

    /**
     * FCS-commanded visible surface deflections in [-1, 1], in raw-stick polarity
     * (see {@link commandedElevator}). Used to animate the control surfaces so the
     * fly-by-wire shaping (incl. the AoA limiter) is visible on the model.
     */
    getCommandedElevator(): number {
        return this.commandedElevator;
    }

    getCommandedAileron(): number {
        return this.commandedAileron;
    }

    getCommandedRudder(): number {
        return this.commandedRudder;
    }

    /**
     * Upper / lower clamp bounds on the normalized elevator command (same
     * +nose-up polarity as {@link getCommandedElevator}). The HUD draws these as
     * the max/min pitch-input limit lines. Default ±1 (no clamp / direct law).
     */
    getElevatorCommandLimitHigh(): number {
        return this.elevatorCommandLimitHigh;
    }

    getElevatorCommandLimitLow(): number {
        return this.elevatorCommandLimitLow;
    }

    getAccelerationWorld(target: THREE.Vector3 = this.accelWorld): THREE.Vector3 {
        return target.copy(this.accelWorld);
    }

    getEngineThrustKn(): number {
        return this.engineThrustN / 1000;
    }

    useF16ThrottleDetents(): boolean {
        return false;
    }

    stepThrottleDetent(current: number, direction: 1 | -1): number {
        return Math.max(0, Math.min(1, current + direction * 0.01));
    }

    isInThrottleAbDetentBand(_lever: number): boolean {
        return false;
    }

    /** Override in models with a non-linear throttle quadrant. */
    adjustThrottleInput(current: number, step: number): number {
        return Math.max(0, Math.min(1, current + step));
    }

    /** Override in models with a non-linear throttle quadrant. */
    getThrottleHudText(): string {
        return `THR ${(100 * this.effectiveThrottle).toFixed(0)}`;
    }

    /** Normalized engine power for audio [0, 1]. */
    getThrottleAudioLevel(): number {
        return this.effectiveThrottle;
    }

    /** CSS color for engine nozzle rendering (MIL black by default). */
    getEngineNozzleColor(): string {
        return '#0a0a0a';
    }
}
