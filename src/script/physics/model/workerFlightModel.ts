import * as THREE from 'three';
import { FlightModel } from './flightModel';
import { formatF16ThrottleHud, stepF16ThrottleDetent, isF16AbDetentBand, adjustF16ThrottleInput, getF16ThrottleZone, f16ThrottleAudioLevel, getF16EngineNozzleColor } from '../f16Engine';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';

export type FlightModelType = 'realistic' | 'fm2' | 'arcade' | 'debug';

export class WorkerFlightModel extends FlightModel {
    private worker: Worker;
    private lastState: any = null;
    private modelType: FlightModelType;
    private aircraftConfig: Fm2AircraftConfig | undefined;
    // Afterburner-equipped FM2 aircraft use the F-16 throttle quadrant; others
    // (e.g. the A-4E) use a plain linear lever. Defaults true until an aircraft
    // is selected so the F-16 remains the default behaviour.
    private fm2Afterburner = true;

    constructor(modelType: FlightModelType) {
        super();
        this.modelType = modelType;
        this.worker = new Worker(new URL('../worker/flightWorker.ts', import.meta.url));
        this.worker.postMessage({ type: 'init', modelType });
        this.worker.onmessage = (event) => {
            if (event.data.type === 'state') {
                this.applyState(event.data.state);
            } else if (event.data.type === 'error') {
                console.error(`[flightWorker:${this.modelType}]`, event.data.message, event.data.stack);
            }
        };
        this.worker.onerror = (event) => {
            console.error(`[flightWorker:${this.modelType}] worker error`, event.message, event.filename, event.lineno);
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
        this.engineThrustN = state.engineThrustN;
        this.effectiveThrottle = state.effectiveThrottle;
        
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
                wheelBrakesApplied: this.wheelBrakesApplied
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
        this.worker.postMessage({ type: 'setAircraft', aircraftConfig: config });
    }

    /**
     * Whether this model uses the F-16 throttle quadrant (MIL/AB detents). The
     * Realistic model always does; the FM2 model does only for afterburner
     * aircraft.
     */
    private isF16(): boolean {
        if (this.modelType === 'realistic') return true;
        if (this.modelType === 'fm2') return this.fm2Afterburner;
        return false;
    }

    // F-16 specific overrides to match the F-16 flight models' behavior
    getThrottleHudText(): string {
        if (!this.isF16()) return super.getThrottleHudText();
        return formatF16ThrottleHud(this.throttle);
    }

    useF16ThrottleDetents(): boolean {
        return this.isF16();
    }

    stepThrottleDetent(current: number, direction: 1 | -1): number {
        if (!this.isF16()) return super.stepThrottleDetent(current, direction);
        return stepF16ThrottleDetent(current, direction);
    }

    isInThrottleAbDetentBand(lever: number): boolean {
        if (!this.isF16()) return super.isInThrottleAbDetentBand(lever);
        return isF16AbDetentBand(lever);
    }

    adjustThrottleInput(current: number, step: number): number {
        if (!this.isF16()) return super.adjustThrottleInput(current, step);
        return adjustF16ThrottleInput(current, step);
    }

    getThrottleZone(): string {
        if (!this.isF16()) return 'mil';
        return getF16ThrottleZone(this.effectiveThrottle);
    }

    getThrottleAudioLevel(): number {
        if (!this.isF16()) return super.getThrottleAudioLevel();
        return f16ThrottleAudioLevel(this.effectiveThrottle);
    }

    getEngineNozzleColor(): string {
        if (!this.isF16()) return super.getEngineNozzleColor();
        return getF16EngineNozzleColor(this.effectiveThrottle);
    }
}
