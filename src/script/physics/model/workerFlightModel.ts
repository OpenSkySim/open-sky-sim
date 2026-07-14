import * as THREE from 'three';
import { FlightModel } from './flightModel';
import { formatF16ThrottleHud, stepF16ThrottleDetent, isF16AbDetentBand, adjustF16ThrottleInput, getF16ThrottleZone, f16ThrottleAudioLevel, getF16EngineNozzleColor } from '../f16Engine';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';

/**
 * Main-thread proxy for the single FM2 flight model that runs in the physics
 * Web Worker. Every aircraft uses this one model; per-aircraft handling comes
 * from the {@link Fm2AircraftConfig} sent over via {@link setAircraft}.
 */
export class WorkerFlightModel extends FlightModel {
    private worker: Worker;
    private lastState: any = null;
    private aircraftConfig: Fm2AircraftConfig | undefined;
    // Afterburner-equipped aircraft use the MIL/AB detented throttle quadrant;
    // others (e.g. imported mods) use a plain linear lever. Defaults true until
    // an aircraft is selected so the afterburner quadrant is the default.
    private fm2Afterburner = true;

    /**
     * @param kinematic When true this proxy drives the no-aerodynamics free-fly
     *   ("DEBUG") mode of the single FM2 model. Handling still comes from the
     *   aircraft config; only the integration path differs.
     */
    constructor(private readonly kinematic: boolean = false) {
        super();
        this.worker = new Worker(new URL('../worker/flightWorker.ts', import.meta.url));
        this.worker.postMessage({ type: 'init', kinematic });
        this.worker.onmessage = (event) => {
            if (event.data.type === 'state') {
                this.applyState(event.data.state);
            } else if (event.data.type === 'error') {
                console.error('[flightWorker]', event.data.message, event.data.stack);
            }
        };
        this.worker.onerror = (event) => {
            console.error('[flightWorker] worker error', event.message, event.filename, event.lineno);
        };
    }

    private applyState(state: any) {
        this.lastState = state;
        this.obj.position.fromArray(state.position);
        this.obj.quaternion.fromArray(state.quaternion);
        this.velocity.fromArray(state.velocity);
        
        this.crashed = state.crashed;
        this.landed = state.landed;
        this.angleOfAttackRad = state.angleOfAttackRad;
        this.loadFactorG = state.loadFactorG;
        this.commandedElevator = state.commandedElevator ?? 0;
        this.commandedAileron = state.commandedAileron ?? 0;
        this.commandedRudder = state.commandedRudder ?? 0;
        this.elevatorCommandLimitHigh = state.elevatorLimitHigh ?? 1;
        this.elevatorCommandLimitLow = state.elevatorLimitLow ?? -1;
        this.governedPitchStick = state.governedPitchStick ?? this.pitch;
        this.engineThrustN = state.engineThrustN;
        this.effectiveThrottle = state.effectiveThrottle;
        if (state.accelWorld) {
            this.accelWorld.fromArray(state.accelWorld);
        }
        this.forceVectors = state.forceVectors ?? [];
        
        // @ts-ignore
        this.prevPosition.fromArray(state.prevPosition);
        // @ts-ignore
        this.prevQuaternion.fromArray(state.prevQuaternion);
        // @ts-ignore
        this.prevVelocity.fromArray(state.prevVelocity);
        // @ts-ignore
        this.deltaRemainder = state.deltaRemainder;
    }

    update(delta: number): void {
        this.worker.postMessage({
            type: 'update',
            delta,
            inputs: {
                pitch: this.pitch,
                roll: this.roll,
                yaw: this.yaw,
                throttle: this.throttle,
                landingGearDeployed: this.landingGearDeployed,
                flapsExtended: this.flapsExtended,
                wheelBrakesApplied: this.wheelBrakesApplied,
                limitersEnabled: this.limitersEnabled,
                wantForceVectors: this.forceVectorsRequested
            }
        });
    }

    step(delta: number): void {
        // No-op on main thread, simulation happens in worker
    }

    getStallStatus(): number {
        return this.lastState?.stall ?? -1;
    }

    reset() {
        super.reset();
        this.worker.postMessage({
            type: 'reset',
            position: this.obj.position.toArray(),
            quaternion: this.obj.quaternion.toArray(),
            velocity: this.velocity.toArray(),
            landed: this.landed,
            throttle: this.throttle
        });
    }

    syncEffectiveThrottle() {
        super.syncEffectiveThrottle();
        this.worker.postMessage({
            type: 'syncEffectiveThrottle',
            throttle: this.throttle
        });
    }

    snapPhysicsState() {
        super.snapPhysicsState();
        this.worker.postMessage({
            type: 'snapPhysicsState'
        });
    }

    set position(p: THREE.Vector3) {
        super.position = p;
        this.worker.postMessage({
            type: 'setPosition',
            position: p.toArray()
        });
    }

    get position() {
        return super.position;
    }

    set quaternion(q: THREE.Quaternion) {
        super.quaternion = q;
        this.worker.postMessage({
            type: 'setQuaternion',
            quaternion: q.toArray()
        });
    }

    get quaternion() {
        return super.quaternion;
    }

    set velocityVector(v: THREE.Vector3) {
        super.velocityVector = v;
        this.worker.postMessage({
            type: 'setVelocity',
            velocity: v.toArray()
        });
    }

    get velocityVector() {
        return super.velocityVector;
    }

    setAircraft(config: Fm2AircraftConfig): void {
        this.aircraftConfig = config;
        this.fm2Afterburner = config.engine.afterburner;
        this.worker.postMessage({ type: 'setAircraft', aircraftConfig: config, kinematic: this.kinematic });
    }

    /**
     * Whether this aircraft uses the MIL/AB detented throttle quadrant:
     * true only for afterburner-equipped aircraft.
     */
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
