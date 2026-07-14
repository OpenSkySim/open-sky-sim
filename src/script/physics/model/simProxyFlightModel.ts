import * as THREE from 'three';
import { FlightModel } from './flightModel';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import {
    formatF16ThrottleHud, stepF16ThrottleDetent, isF16AbDetentBand,
    adjustF16ThrottleInput, getF16ThrottleZone, f16ThrottleAudioLevel, getF16EngineNozzleColor,
} from '../f16Engine';
import { CombatSimClient, SimAircraftProxy } from '../sim/combatSimClient';
import { SimControlInputs } from '../sim/simTypes';
import { AC } from '../sim/simSnapshotCodec';
import { ForceVectorSample } from './flightModel';

/**
 * Render-side proxy for one aircraft simulated inside the shared combat sim
 * worker. Mirrors the {@link WorkerFlightModel} contract, but instead of owning
 * its own worker it shares a single {@link CombatSimClient}: it forwards
 * teleport/reset/config events, exposes its command buffer for the client to
 * pump, and applies authoritative state from each snapshot.
 */
export class SimProxyFlightModel extends FlightModel implements SimAircraftProxy {

    private lastStall = -1;
    private fm2Afterburner = true;
    private simGearDeployed = true;
    private simFlapsExtended = true;
    private simFiring = false;
    private simHealth = 100;
    private simAmmo = 0;

    constructor(
        private readonly client: CombatSimClient,
        readonly simId: string,
        private readonly kinematicMode: boolean,
    ) {
        super();
        this.client.registerProxy(this);
    }

    activate(): void {
        this.client.registerProxy(this);
    }

    // --- SimAircraftProxy -----------------------------------------------------

    collectInputs(): SimControlInputs {
        return {
            pitch: this.pitch,
            roll: this.roll,
            yaw: this.yaw,
            throttle: this.throttle,
            landingGearDeployed: this.landingGearDeployed,
            flapsExtended: this.flapsExtended,
            wheelBrakesApplied: this.wheelBrakesApplied,
            pitchLimiterMode: this.pitchLimiterMode,
            limitersEnabled: this.limitersEnabled,
            wantForceVectors: this.forceVectorsRequested,
            firing: false,
        };
    }

    applyStateBuffer(buf: Float32Array, base: number, forceVectors: ForceVectorSample[]): void {
        this.obj.position.set(buf[base + AC.posX], buf[base + AC.posY], buf[base + AC.posZ]);
        this.obj.quaternion.set(buf[base + AC.qx], buf[base + AC.qy], buf[base + AC.qz], buf[base + AC.qw]);
        this.velocity.set(buf[base + AC.velX], buf[base + AC.velY], buf[base + AC.velZ]);

        this.crashed = buf[base + AC.crashed] !== 0;
        this.landed = buf[base + AC.landed] !== 0;
        this.angleOfAttackRad = buf[base + AC.aoa];
        this.loadFactorG = buf[base + AC.loadG];
        this.commandedElevator = buf[base + AC.cmdElevator];
        this.commandedAileron = buf[base + AC.cmdAileron];
        this.commandedRudder = buf[base + AC.cmdRudder];
        this.engineThrustN = buf[base + AC.engineThrustN];
        this.effectiveThrottle = buf[base + AC.effectiveThrottle];
        this.accelWorld.set(buf[base + AC.accX], buf[base + AC.accY], buf[base + AC.accZ]);
        this.forceVectors = forceVectors;

        this.lastStall = buf[base + AC.stall];
        this.simGearDeployed = buf[base + AC.gearDeployed] !== 0;
        this.simFlapsExtended = buf[base + AC.flapsExtended] !== 0;
        this.simFiring = buf[base + AC.firing] !== 0;
        this.simHealth = buf[base + AC.health];
        this.simAmmo = buf[base + AC.ammo];

        // @ts-ignore - private on the base, written for render interpolation.
        this.prevPosition.set(buf[base + AC.ppX], buf[base + AC.ppY], buf[base + AC.ppZ]);
        // @ts-ignore
        this.prevQuaternion.set(buf[base + AC.pqx], buf[base + AC.pqy], buf[base + AC.pqz], buf[base + AC.pqw]);
        // @ts-ignore
        this.prevVelocity.set(buf[base + AC.pvX], buf[base + AC.pvY], buf[base + AC.pvZ]);
        // @ts-ignore
        this.deltaRemainder = buf[base + AC.deltaRemainder];
    }

    getSimFiring(): boolean {
        return this.simFiring;
    }

    getSimHealth(): number {
        return this.simHealth;
    }

    getSimAmmo(): number {
        return this.simAmmo;
    }

    getSimGearDeployed(): boolean {
        return this.simGearDeployed;
    }

    getSimFlapsExtended(): boolean {
        return this.simFlapsExtended;
    }

    // --- FlightModel overrides ------------------------------------------------

    update(_delta: number): void {
        // No-op: the client pumps the shared worker once per frame.
    }

    step(_delta: number): void {
        // No-op on the main thread; simulation happens in the worker.
    }

    getStallStatus(): number {
        return this.lastStall;
    }

    reset(): void {
        super.reset();
        this.client.resetAircraft(
            this.simId, this.obj.position, this.obj.quaternion, this.velocity,
            this.landed, this.throttle, this.kinematicMode);
    }

    syncEffectiveThrottle(): void {
        super.syncEffectiveThrottle();
        this.client.syncEffectiveThrottle(this.simId, this.throttle);
    }

    snapPhysicsState(): void {
        super.snapPhysicsState();
        this.client.snapPhysicsState(this.simId);
    }

    set position(p: THREE.Vector3) {
        super.position = p;
        this.client.setPosition(this.simId, p);
    }

    get position(): THREE.Vector3 {
        return super.position;
    }

    set quaternion(q: THREE.Quaternion) {
        super.quaternion = q;
        this.client.setQuaternion(this.simId, q);
    }

    get quaternion(): THREE.Quaternion {
        return super.quaternion;
    }

    set velocityVector(v: THREE.Vector3) {
        super.velocityVector = v;
        this.client.setVelocity(this.simId, v);
    }

    get velocityVector(): THREE.Vector3 {
        return super.velocityVector;
    }

    setAircraft(config: Fm2AircraftConfig): void {
        this.fm2Afterburner = config.engine.afterburner;
        this.client.setAircraftConfig(this.simId, config, this.kinematicMode);
    }

    private isAfterburner(): boolean {
        return this.fm2Afterburner;
    }

    // Afterburner-quadrant overrides (MIL/AB detents, cone glow, audio ramp).
    getThrottleHudText(): string {
        if (!this.isAfterburner()) return super.getThrottleHudText();
        return formatF16ThrottleHud(this.throttle);
    }

    useAfterburnerThrottleDetents(): boolean {
        return this.isAfterburner();
    }

    stepThrottleDetent(current: number, direction: 1 | -1): number {
        if (!this.isAfterburner()) return super.stepThrottleDetent(current, direction);
        return stepF16ThrottleDetent(current, direction);
    }

    isInThrottleAbDetentBand(lever: number): boolean {
        if (!this.isAfterburner()) return super.isInThrottleAbDetentBand(lever);
        return isF16AbDetentBand(lever);
    }

    adjustThrottleInput(current: number, step: number): number {
        if (!this.isAfterburner()) return super.adjustThrottleInput(current, step);
        return adjustF16ThrottleInput(current, step);
    }

    getThrottleZone(): string {
        if (!this.isAfterburner()) return 'mil';
        return getF16ThrottleZone(this.effectiveThrottle);
    }

    getThrottleAudioLevel(): number {
        if (!this.isAfterburner()) return super.getThrottleAudioLevel();
        return f16ThrottleAudioLevel(this.effectiveThrottle);
    }

    getEngineNozzleColor(): string {
        if (!this.isAfterburner()) return super.getEngineNozzleColor();
        return getF16EngineNozzleColor(this.effectiveThrottle);
    }
}
