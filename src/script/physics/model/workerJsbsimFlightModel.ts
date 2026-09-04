import * as THREE from 'three';
import { FlightModel } from './flightModel';

/**
 * Main-thread proxy for the {@link JsbsimFlightModel} that runs in the JSBSim
 * physics Web Worker (see physics/worker/jsbsimWorker.ts). Structurally mirrors
 * {@link WorkerFlightModel}; `setAircraft` is left as the inherited no-op since
 * this model always flies the bundled F-16 (see jsbsimFlightModel.ts).
 */
export class WorkerJsbsimFlightModel extends FlightModel {
    private worker: Worker | null = null;
    private lastState: any = null;

    /**
     * Spins up the JSBSim worker (and its WASM module) on first activation,
     * rather than unconditionally at boot — most players never select JSBSIM,
     * and the load is not cheap. Idempotent across repeated activations.
     */
    activate(): void {
        if (this.worker) return;
        this.worker = new Worker(new URL('../worker/jsbsimWorker.ts', import.meta.url));
        this.worker.postMessage({ type: 'init' });
        this.worker.onmessage = (event) => {
            if (event.data.type === 'state') {
                this.applyState(event.data.state);
            } else if (event.data.type === 'error') {
                console.error('[jsbsimWorker]', event.data.message, event.data.stack);
            }
        };
        this.worker.onerror = (event) => {
            console.error('[jsbsimWorker] worker error', event.message, event.filename, event.lineno);
        };
    }

    /** No-ops if called before {@link activate} has spun up the worker. */
    private post(message: any): void {
        this.worker?.postMessage(message);
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
        this.post({
            type: 'update',
            delta,
            inputs: {
                pitch: this.pitch,
                roll: this.roll,
                yaw: this.yaw,
                throttle: this.throttle,
                landingGearDeployed: this.landingGearDeployed,
                flapsExtended: this.flapsExtended,
                airbrakesExtended: this.airbrakesExtended,
                wheelBrakesApplied: this.wheelBrakesApplied,
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
        this.post({
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
        this.post({
            type: 'syncEffectiveThrottle',
            throttle: this.throttle
        });
    }

    snapPhysicsState() {
        super.snapPhysicsState();
        this.post({
            type: 'snapPhysicsState'
        });
    }

    set position(p: THREE.Vector3) {
        super.position = p;
        this.post({
            type: 'setPosition',
            position: p.toArray()
        });
    }

    get position() {
        return super.position;
    }

    set quaternion(q: THREE.Quaternion) {
        super.quaternion = q;
        this.post({
            type: 'setQuaternion',
            quaternion: q.toArray()
        });
    }

    get quaternion() {
        return super.quaternion;
    }

    set velocityVector(v: THREE.Vector3) {
        super.velocityVector = v;
        this.post({
            type: 'setVelocity',
            velocity: v.toArray()
        });
    }

    get velocityVector() {
        return super.velocityVector;
    }
}
