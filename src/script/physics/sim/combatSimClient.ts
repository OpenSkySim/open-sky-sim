import * as THREE from 'three';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import { Faction } from '../../weapons/combatant';
import { ForceVectorSample } from '../model/flightModel';
import { SerializedWorld } from './serializedWorld';
import { AC_STRIDE, SnapshotBuffers } from './simSnapshotCodec';
import {
    SimAircraftDesc, SimAircraftSpawn, SimControlInputs,
    SimControlMode, SimHitEvent, SimToWorkerMessage, WorkerToSimMessage,
} from './simTypes';

const EMPTY_FORCE_VECTORS: ForceVectorSample[] = [];

/** A render-side proxy the client mirrors authoritative aircraft state onto. */
export interface SimAircraftProxy {
    readonly simId: string;
    collectInputs(): SimControlInputs;
    /** Read this aircraft's row (starting at `base`) out of the flat snapshot. */
    applyStateBuffer(buffer: Float32Array, base: number, forceVectors: ForceVectorSample[]): void;
}

/**
 * Main-thread owner of the single combat sim worker. Render-side proxies
 * register here; once per frame {@link tick} pumps their control inputs into the
 * worker (coalescing frames that arrive while the worker is busy) and, on each
 * snapshot, mirrors authoritative state back onto every proxy.
 */
export class CombatSimClient {

    private readonly worker: Worker;
    private readonly proxies = new Map<string, SimAircraftProxy>();
    private readonly firing = new Map<string, boolean>();

    private busy = false;
    private pendingDelta = 0;
    private lastFlushTime = 0;
    private lastDelta = 0;

    private projectiles: Float32Array<ArrayBufferLike> = new Float32Array(0);
    private projectileCount = 0;
    private pendingHits: SimHitEvent[] = [];
    /** Fired on the main thread whenever a snapshot carries new hits (debris / SFX). */
    onHits: ((hits: SimHitEvent[]) => void) | undefined;

    constructor() {
        this.worker = new Worker(new URL('../worker/combatSimWorker.ts', import.meta.url));
        this.post({ type: 'init' });
        this.worker.onmessage = (event: MessageEvent<WorkerToSimMessage>) => {
            const data = event.data;
            if (data.type === 'state') {
                this.busy = false;
                const elapsed = performance.now() - this.lastFlushTime;
                if (elapsed > 50) {
                    console.warn(`[siminstr] worker step took ${elapsed.toFixed(1)}ms for delta=${(this.lastDelta * 1000).toFixed(1)}ms (${Math.floor(this.lastDelta / (1 / 120))} substeps)`);
                }
                this.applySnapshot(data);
                this.flush();
            } else if (data.type === 'error') {
                this.busy = false;
                console.error('[combatSimWorker]', data.message, data.stack);
                this.flush();
            }
        };
        this.worker.onerror = (event) => {
            console.error('[combatSimWorker] worker error', event.message, event.filename, event.lineno);
        };
    }

    private post(message: SimToWorkerMessage): void {
        this.worker.postMessage(message);
    }

    setWorld(world: SerializedWorld): void {
        this.post({ type: 'setWorld', world });
    }

    registerProxy(proxy: SimAircraftProxy): void {
        this.proxies.set(proxy.simId, proxy);
    }

    addAircraft(desc: SimAircraftDesc): void {
        this.post({ type: 'addAircraft', desc });
    }

    removeAircraft(id: string): void {
        this.post({ type: 'removeAircraft', id });
    }

    setEnabled(id: string, enabled: boolean): void {
        this.post({ type: 'setEnabled', id, enabled });
    }

    setControlMode(id: string, control: SimControlMode): void {
        this.post({ type: 'setControlMode', id, control });
    }

    setTarget(id: string, targetId: string | null): void {
        this.post({ type: 'setTarget', id, targetId });
    }

    setPhase(id: string, phase: number): void {
        this.post({ type: 'setPhase', id, phase });
    }

    respawn(id: string, spawn: SimAircraftSpawn): void {
        this.post({ type: 'respawn', id, spawn });
    }

    resetAircraft(id: string, position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3, landed: boolean, throttle: number, kinematic: boolean): void {
        this.post({
            type: 'reset', id,
            position: position.toArray() as [number, number, number],
            quaternion: quaternion.toArray() as [number, number, number, number],
            velocity: velocity.toArray() as [number, number, number],
            landed, throttle, kinematic,
        });
    }

    setAircraftConfig(id: string, aircraftConfig: Fm2AircraftConfig, kinematic: boolean): void {
        this.post({ type: 'setAircraftConfig', id, aircraftConfig, kinematic });
    }

    setPosition(id: string, position: THREE.Vector3): void {
        this.post({ type: 'setPosition', id, position: position.toArray() as [number, number, number] });
    }

    setQuaternion(id: string, quaternion: THREE.Quaternion): void {
        this.post({ type: 'setQuaternion', id, quaternion: quaternion.toArray() as [number, number, number, number] });
    }

    setVelocity(id: string, velocity: THREE.Vector3): void {
        this.post({ type: 'setVelocity', id, velocity: velocity.toArray() as [number, number, number] });
    }

    syncEffectiveThrottle(id: string, throttle: number): void {
        this.post({ type: 'syncEffectiveThrottle', id, throttle });
    }

    snapPhysicsState(id: string): void {
        this.post({ type: 'snapPhysicsState', id });
    }

    /** Inject an externally-simulated combatant (e.g. player on the JSBSim worker). */
    setExternalState(id: string, faction: Faction, position: THREE.Vector3, velocity: THREE.Vector3, alive: boolean): void {
        this.post({
            type: 'setExternalState', id, enabled: true, faction,
            position: position.toArray() as [number, number, number],
            velocity: velocity.toArray() as [number, number, number],
            alive,
        });
    }

    clearExternalState(id: string): void {
        this.post({ type: 'clearExternalState', id });
    }

    /** Latch this frame's trigger for an externally-controlled aircraft. */
    setFiring(id: string, firing: boolean): void {
        this.firing.set(id, firing);
    }

    /** Pump one frame of accumulated time into the worker. Called once per frame. */
    tick(delta: number): void {
        if (delta > 0.1) {
            console.warn(`[siminstr] big frame delta=${(delta * 1000).toFixed(1)}ms pending=${(this.pendingDelta * 1000).toFixed(1)}ms busy=${this.busy}`);
        }
        this.pendingDelta += delta;
        this.flush();
    }

    private flush(): void {
        if (this.busy || this.pendingDelta <= 0 || this.proxies.size === 0) {
            return;
        }
        const inputs: Record<string, SimControlInputs> = {};
        for (const proxy of this.proxies.values()) {
            const i = proxy.collectInputs();
            i.firing = this.firing.get(proxy.simId) ?? false;
            inputs[proxy.simId] = i;
        }
        // Cap step size and drop large backlogs so a slow main thread cannot
        // enqueue multi-second worker steps that keep the UI behind forever.
        const MAX_STEP_DELTA = 0.05;
        const MAX_PENDING = 0.2;
        if (this.pendingDelta > MAX_PENDING) {
            this.pendingDelta = MAX_STEP_DELTA;
        }
        const delta = Math.min(this.pendingDelta, MAX_STEP_DELTA);
        this.pendingDelta = 0;
        this.busy = true;
        this.lastFlushTime = performance.now();
        this.lastDelta = delta;
        this.post({ type: 'step', delta, inputs });
    }

    private applySnapshot(snapshot: SnapshotBuffers): void {
        for (let i = 0; i < snapshot.ids.length; i++) {
            const id = snapshot.ids[i];
            this.proxies.get(id)?.applyStateBuffer(
                snapshot.aircraft, i * AC_STRIDE, snapshot.forceVectors[id] ?? EMPTY_FORCE_VECTORS);
        }
        this.projectiles = snapshot.projectiles;
        this.projectileCount = snapshot.projectileCount;
        if (snapshot.hits.length > 0) {
            for (let i = 0; i < snapshot.hits.length; i++) {
                this.pendingHits.push(snapshot.hits[i]);
            }
            // Spawn FX as soon as the worker reports hits — don't wait for the
            // next pumpCombatSim (tick is async; drain-after-tick often saw []).
            this.onHits?.(snapshot.hits);
        }
    }

    /** Flat projectile buffer from the latest snapshot (PROJ_STRIDE floats each). */
    getProjectileBuffer(): Float32Array {
        return this.projectiles;
    }

    /** Number of live projectiles in {@link getProjectileBuffer}. */
    getProjectileCount(): number {
        return this.projectileCount;
    }

    /** Drain hit events accumulated since the last call (for SFX / feedback). */
    drainHits(): SimHitEvent[] {
        if (this.pendingHits.length === 0) {
            return this.pendingHits;
        }
        const hits = this.pendingHits;
        this.pendingHits = [];
        return hits;
    }
}
