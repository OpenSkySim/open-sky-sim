import { AirframeCollider, airframeBuffers } from '../barricade/webBarricade';
import * as THREE from 'three';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import { Faction } from '../../weapons/combatant';
import { ForceVectorSample } from '../model/flightModel';
import { KeyboardControlLayoutId, KeyboardPitchStickMode } from '../../input/keyboardLayouts';
import { SerializedArrestorCables, SerializedBarricade, SerializedStaticColliders, SerializedWorld } from './serializedWorld';
import { HeightTileUpdate, SerializedHeightField } from '../../terrain/heightMirror';
import { AC_STRIDE, PROJ_STRIDE, SnapshotBuffers } from './simSnapshotCodec';
import { FrameShift } from '../../terrain/geodesy';
import {
    createSimSharedState,
    isSharedBusy,
    setSharedBusy,
    SimSharedViews,
    tryPullSharedSnapshot,
} from './simSharedState';
import { AiPilotOptions, AiRoute } from '../../ai/aiPilot';
import {
    SimAircraftDesc, SimAircraftSpawn, SimControlInputs,
    SimControlMode, SimFlightModelKind, SimHitEvent, SimToWorkerMessage, WorkerToSimMessage,
    AircraftCollisionMesh, BarricadeWebSnapshot,
} from './simTypes';

const EMPTY_FORCE_VECTORS: ForceVectorSample[] = [];
const EMPTY_MANEUVER_LABELS: Record<string, string> = {};

/**
 * A step with no reply for this long (main thread running all the while)
 * means the worker is gone or wedged. Generous: a world upload queued ahead
 * of a step can take seconds on a slow machine.
 */
const WORKER_STALL_MS = 30_000;
/** A gap between ticks longer than this is the main thread stalling, not the worker. */
const MAIN_THREAD_GAP_MS = 1_000;

/**
 * Playout clock (see CombatSimClient.getPlayoutTime): how far behind the
 * newest snapshot proxies draw (one 120 Hz sim step, so the newest sample,
 * which can sit up to a step before the snapshot's time, is nearly always
 * ahead), how hard it is pulled toward that per frame, and past what error it
 * jumps instead (a stall, a dropped backlog).
 */
const PLAYOUT_LAG_S = 1 / 120;
const PLAYOUT_GAIN = 0.05;
const PLAYOUT_SNAP_S = 0.1;

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
 *
 * When `crossOriginIsolated`, aircraft/projectile floats live in a SharedArrayBuffer
 * double-buffer so pose can be applied every tick without waiting for a starved
 * worker `onmessage`.
 */
/**
 * The sim time a frame of `delta` (s) is worth. After tab resume / long
 * stalls, clamp so one huge frame cannot enqueue a multi-hundred-ms step (and
 * never console.warn here — DevTools makes that a hitch loop). Anything that
 * moves alongside the sim (the carrier) must use the same, or below 10 fps it
 * runs away from the aircraft.
 */
export function simStepFor(delta: number): number {
    return delta > 0.1 ? 0.05 : delta;
}

export class CombatSimClient {

    private readonly worker: Worker;
    private readonly proxies = new Map<string, SimAircraftProxy>();
    private readonly firing = new Map<string, boolean>();

    private busy = false;
    private pendingDelta = 0;

    private readonly shared: SimSharedViews | undefined;
    private lastSharedSeq = 0;
    private sharedIds: string[] = [];
    private sharedForceVectors: Record<string, ForceVectorSample[]> = {};

    private projectiles: Float32Array<ArrayBufferLike> = new Float32Array(0);
    private projectileCount = 0;
    private maneuverLabels: Record<string, string> = EMPTY_MANEUVER_LABELS;
    /** Fired on the main thread whenever a snapshot carries new hits (debris / SFX). */
    onHits: ((hits: SimHitEvent[]) => void) | undefined;
    /**
     * Fired once if the worker dies (failed to load, or stopped answering):
     * nothing will move again until the page is reloaded. index.ts shows it
     * on the boot overlay, as it does a failed boot.
     */
    onFatal: ((message: string) => void) | undefined;
    /** Why the worker is dead; once set, no more steps are sent. */
    private fatal: string | undefined;
    /** Whether any message has come back: an error before one is a worker that never ran. */
    private everAnswered = false;
    /** performance.now() when the step in flight was sent, and of the last tick. */
    private stepSentAt = 0;
    private lastTickAt = 0;

    /** Sim time (s) at the end of the last step posted, counted from boot. */
    private postedTime = 0;
    /** The sim time the latest applied snapshot shows: the end of the step it answered. */
    private snapshotTime = 0;
    /** postedTime + pendingDelta at the last tick: the sim time accounted for so far. */
    private accountedTime = 0;
    /** See {@link getPlayoutTime}. */
    private playoutTime = 0;
    private playoutStarted = false;

    constructor() {
        this.worker = new Worker(new URL('../worker/combatSimWorker.ts', import.meta.url));
        this.post({ type: 'init' });
        if (typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated) {
            this.shared = createSimSharedState();
            this.post({ type: 'attachSharedState', buffer: this.shared.buffer });
        }
        this.worker.onmessage = (event: MessageEvent<WorkerToSimMessage>) => {
            this.everAnswered = true;
            const data = event.data;
            if (data.type === 'state') {
                this.barricadeWeb = data.web;
                if (data.web) this.barricadeWebPeakMs = Math.max(this.barricadeWebPeakMs, data.web.peakMs);
                if (data.shared) {
                    this.sharedIds = data.ids;
                    this.sharedForceVectors = data.forceVectors ?? {};
                    this.maneuverLabels = data.maneuverLabels ?? EMPTY_MANEUVER_LABELS;
                    this.applyHits(data.hits);
                    this.pullSharedPose();
                    this.syncBusyFromShared();
                } else {
                    this.busy = false;
                    this.applySnapshot(data);
                }
                this.flush();
            } else if (data.type === 'error') {
                this.busy = false;
                if (this.shared) {
                    setSharedBusy(this.shared, false);
                }
                console.error('[combatSimWorker]', data.message, data.stack);
                this.flush();
            }
        };
        this.worker.onerror = (event) => {
            console.error('[combatSimWorker] worker error', event.message, event.filename, event.lineno);
            // Logged here; without this the browser logs it a second time.
            event.preventDefault();
            if (!this.everAnswered) {
                // Never answered: the script did not load or threw at the top level.
                this.fail(`the physics worker did not start (${event.message || 'script error'})`);
                return;
            }
            // An uncaught error past start-up leaves the worker running, but the
            // step it was on never replies: stop waiting for it.
            this.releaseStep();
        };
        this.worker.onmessageerror = (event) => {
            // A reply that could not be deserialized: the step it answered is lost.
            console.error('[combatSimWorker] unreadable message from the worker', event.data);
            this.releaseStep();
        };
    }

    /** Whether the worker died (see {@link onFatal}); the sim is frozen for good. */
    isDead(): boolean {
        return this.fatal !== undefined;
    }

    /** Stop waiting for the step in flight, and send the next one. */
    private releaseStep(): void {
        this.busy = false;
        if (this.shared) {
            setSharedBusy(this.shared, false);
        }
        this.flush();
    }

    private fail(reason: string): void {
        if (this.fatal !== undefined) {
            return;
        }
        this.fatal = reason;
        console.error(`[combatSimWorker] ${reason}; the flight is frozen until the page is reloaded.`);
        this.busy = false;
        if (this.shared) {
            setSharedBusy(this.shared, false);
        }
        this.worker.terminate();
        this.onFatal?.(reason);
    }

    /** True when pose is mirrored via SharedArrayBuffer (HD can run uncapped). */
    usesSharedState(): boolean {
        return this.shared !== undefined;
    }

    private post(message: SimToWorkerMessage): void {
        if (this.fatal !== undefined) {
            return;
        }
        this.worker.postMessage(message);
    }

    setWorld(world: SerializedWorld): void {
        this.post({ type: 'setWorld', world });
    }

    /** True when no step is in flight, after taking in any pose it published. */
    isIdle(): boolean {
        this.pullSharedPose();
        this.syncBusyFromShared();
        return !this.busy;
    }

    /**
     * Carry the sim into a re-based scene frame. Refused (false) while a step
     * is in flight: its snapshot would come back in the old frame after the
     * render side had already moved to the new one. The caller retries next
     * frame, and must follow a success with setHeightField and setWorld.
     */
    rebase(shift: FrameShift): boolean {
        if (!this.isIdle()) {
            return false;
        }
        // Rounds already drawn keep being drawn from this buffer until the next
        // snapshot. A copy, since on the shared path it is the worker's memory.
        const rounds = this.projectiles.slice(0, this.projectileCount * PROJ_STRIDE);
        const p = new THREE.Vector3();
        const q = new THREE.Quaternion();
        for (let i = 0; i < this.projectileCount; i++) {
            const base = i * PROJ_STRIDE;
            shift.point(p.fromArray(rounds, base)).toArray(rounds, base);
            shift.orientation(q.fromArray(rounds, base + 3)).toArray(rounds, base + 3);
        }
        this.projectiles = rounds;
        this.post({ type: 'rebase', ...shift.toArrays() });
        return true;
    }

    /** More static ground for the world already sent - see CombatSim.addStaticColliders. */
    addStaticColliders(colliders: SerializedStaticColliders): void {
        this.post({ type: 'addStaticColliders', colliders });
    }

    /** Sampler config for the mirrored DEM. Send before any tiles. */
    setHeightField(config: SerializedHeightField): void {
        this.post({ type: 'setHeightField', config });
    }

    /** Add/drop mirrored DEM tiles; height buffers are transferred, not copied. */
    postHeightTiles(update: HeightTileUpdate): void {
        if (this.fatal !== undefined) {
            return;
        }
        this.worker.postMessage(
            { type: 'heightTiles', update },
            update.add.map(t => t.heights.buffer as ArrayBuffer),
        );
    }

    setArrestorCables(cables: SerializedArrestorCables[]): void {
        this.post({ type: 'setArrestorCables', cables });
    }

    setBarricades(barricades: SerializedBarricade[]): void {
        this.post({ type: 'setBarricades', barricades });
    }

    /** The drawn airframe (body frame) the barricade webbing is to meet this aircraft with; null forgets it. */
    /**
     * The collider the barricade webbing meets aircraft `id` with (see
     * webAirframeWorker): its airframe as drawn, or its type's hull until
     * then; `transfer` hands its buffers over (only for one not kept here).
     */
    setBarricadeAirframe(id: string, airframe: AirframeCollider | null, hull = false, transfer = false): void {
        if (this.fatal !== undefined) {
            return;
        }
        this.worker.postMessage({ type: 'setBarricadeAirframe', id, airframe, hull } satisfies SimToWorkerMessage,
            airframe && transfer ? airframeBuffers(airframe) : []);
    }

    /** The rigged barricade's webbing as of the last snapshot, if one is rigged. */
    getBarricadeWeb(): BarricadeWebSnapshot | undefined {
        return this.barricadeWeb;
    }
    private barricadeWeb: BarricadeWebSnapshot | undefined;

    /** The webbing's dearest step since the last call (ms), every sim step counted (a dev diagnostic). */
    takeBarricadeWebPeakMs(): number {
        const peak = this.barricadeWebPeakMs;
        this.barricadeWebPeakMs = 0;
        return peak;
    }
    private barricadeWebPeakMs = 0;

    setCarrierMeshOrigins(origins: { originX: number; originY: number; originZ: number }[]): void {
        this.post({ type: 'setCarrierMeshOrigins', origins });
    }

    setCarrierVelocity(vx: number, vy: number, vz: number): void {
        this.post({ type: 'setCarrierVelocity', velocity: [vx, vy, vz] });
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

    setFormationLead(id: string, leadId: string | null): void {
        this.post({ type: 'setFormationLead', id, leadId });
    }

    /** Engage every live aircraft of `faction`, re-picking as the fight develops. */
    setTargetFaction(id: string, faction: Faction | null): void {
        this.post({ type: 'setTargetFaction', id, faction });
    }

    setPhase(id: string, phase: number): void {
        this.post({ type: 'setPhase', id, phase });
    }

    setRoute(id: string, route: AiRoute | null): void {
        this.post({ type: 'setRoute', id, route });
    }

    /** Rebuild the in-worker pilot (used when switching AI model on spawn). */
    setPilotOptions(id: string, options: AiPilotOptions): void {
        this.post({ type: 'setPilotOptions', id, options });
    }

    respawn(id: string, spawn: SimAircraftSpawn): void {
        this.post({ type: 'respawn', id, spawn });
    }

    /** Latest AI maneuver / phase label for an aircraft (from the last snapshot). */
    getManeuverLabel(id: string): string | undefined {
        return this.maneuverLabels[id];
    }

    resetAircraft(id: string, position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3, landed: boolean, throttle: number, model: SimFlightModelKind): void {
        this.post({
            type: 'reset', id,
            position: position.toArray() as [number, number, number],
            quaternion: quaternion.toArray() as [number, number, number, number],
            velocity: velocity.toArray() as [number, number, number],
            landed, throttle, model,
        });
    }

    setAircraftConfig(id: string, aircraftConfig: Fm2AircraftConfig, model: SimFlightModelKind): void {
        this.post({ type: 'setAircraftConfig', id, aircraftConfig, model });
    }

    setCollision(id: string, collision: AircraftCollisionMesh | undefined): void {
        this.post({ type: 'setCollision', id, collision });
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

    /** Inject an externally-simulated combatant (e.g. a player model outside the sim worker). */
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

    postKeyDown(id: string, key: string, repeat = false): void {
        this.post({ type: 'keyDown', id, key, repeat });
    }

    postKeyUp(id: string, key: string): void {
        this.post({ type: 'keyUp', id, key });
    }

    setKeyboardLayout(layoutId: KeyboardControlLayoutId): void {
        this.post({ type: 'setKeyboardLayout', layoutId });
    }

    setKeyboardPitchStickMode(mode: KeyboardPitchStickMode): void {
        this.post({ type: 'setKeyboardPitchStickMode', mode });
    }

    postGamepadAxes(id: string, pitch: number, roll: number, yaw: number, throttle: number, connected: boolean): void {
        this.post({ type: 'gamepadAxes', id, pitch, roll, yaw, throttle, connected });
    }

    postTouchAxes(id: string, pitch: number, roll: number, yaw: number, throttle: number, active: boolean): void {
        this.post({ type: 'touchAxes', id, pitch, roll, yaw, throttle, active });
    }

    postInputBlur(id: string): void {
        this.post({ type: 'inputBlur', id });
    }

    setPitchTrim(id: string, trim: number, idleOnTouchdown: boolean, flaps?: boolean): void {
        this.post({ type: 'setPitchTrim', id, trim, idleOnTouchdown, flaps });
    }

    setInputEnabled(id: string, enabled: boolean): void {
        this.post({ type: 'setInputEnabled', id, enabled });
    }

    setForceVectorsRequested(id: string, want: boolean): void {
        this.post({ type: 'setForceVectorsRequested', id, want });
    }

    /** Pump one frame of accumulated time into the worker. Called once per frame. */
    tick(delta: number): void {
        delta = simStepFor(delta);
        // Pull pose from SAB before flush so a delayed onmessage cannot freeze the aircraft.
        this.pullSharedPose();
        this.syncBusyFromShared();
        this.watchForStall();
        this.pendingDelta += delta;
        this.flush();
        this.advancePlayout();
    }

    /**
     * The sim time render-side proxies draw their aircraft at this frame.
     *
     * Snapshots come back a frame late and cover whatever time the frame
     * before had, so drawing each one as it lands makes every frame show the
     * previous frame's worth of motion: under uneven frame times that is
     * motion in anti-phase with how long each frame stays on screen, plus a
     * freeze and a double step whenever the worker misses a frame. This clock
     * instead advances by the time each frame accounts for, and is pulled
     * gently (a few % of rate at most) toward one sim step behind the newest
     * snapshot, so proxies interpolate between real samples nearly always.
     */
    getPlayoutTime(): number {
        return this.playoutTime;
    }

    /** The sim time of the snapshot proxies were last given (see applyStateBuffer). */
    getSnapshotTime(): number {
        return this.snapshotTime;
    }

    private advancePlayout(): void {
        const accounted = this.postedTime + this.pendingDelta;
        // Dropped backlog (flush) shrinks it: never run the clock backwards for that.
        this.playoutTime += Math.max(0, accounted - this.accountedTime);
        this.accountedTime = accounted;
        const ideal = this.snapshotTime - PLAYOUT_LAG_S;
        const err = ideal - this.playoutTime;
        if (!this.playoutStarted || Math.abs(err) > PLAYOUT_SNAP_S) {
            this.playoutTime = ideal;
            this.playoutStarted = true;
        } else {
            this.playoutTime += err * PLAYOUT_GAIN;
        }
    }

    /** A step unanswered for WORKER_STALL_MS of main-thread time: the worker is dead or wedged. */
    private watchForStall(): void {
        const now = performance.now();
        if (now - this.lastTickAt > MAIN_THREAD_GAP_MS) {
            // The page was hidden or the main thread stalled: the reply may be
            // queued behind this very tick, so the clock starts again.
            this.stepSentAt = now;
        }
        this.lastTickAt = now;
        if (this.busy && this.fatal === undefined && now - this.stepSentAt > WORKER_STALL_MS) {
            this.fail(`the physics worker stopped answering (no reply for ${WORKER_STALL_MS / 1000} s)`);
        }
    }

    private syncBusyFromShared(): void {
        if (!this.shared) {
            return;
        }
        this.busy = isSharedBusy(this.shared);
    }

    private pullSharedPose(): void {
        if (!this.shared || this.sharedIds.length === 0) {
            return;
        }
        const pull = tryPullSharedSnapshot(this.shared, this.lastSharedSeq);
        if (!pull) {
            return;
        }
        this.lastSharedSeq = pull.seq;
        // One step in flight at a time, and flush pulls before posting the next: this is its answer.
        this.snapshotTime = this.postedTime;
        const count = Math.min(pull.aircraftCount, this.sharedIds.length);
        for (let i = 0; i < count; i++) {
            const id = this.sharedIds[i];
            this.proxies.get(id)?.applyStateBuffer(
                pull.aircraft, i * AC_STRIDE, this.sharedForceVectors[id] ?? EMPTY_FORCE_VECTORS);
        }
        this.projectiles = pull.projectiles;
        this.projectileCount = pull.projectileCount;
    }

    private flush(): void {
        if (this.shared) {
            this.busy = isSharedBusy(this.shared);
            if (!this.busy) {
                // The worker publishes before it clears BUSY: take that answer
                // in now, while postedTime still dates it.
                this.pullSharedPose();
            }
        }
        if (this.fatal !== undefined || this.busy || this.pendingDelta <= 0 || this.proxies.size === 0) {
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
        // Remainder is discarded (not carried) so pending cannot snowball when
        // snapshot RTT exceeds the step size — realtime pacing over exact catch-up.
        // The cap sits above any one frame (simStepFor clamps those to 0.1 s):
        // at 1/30 every frame past 33 ms lost the rest of its motion - a hitch
        // on top of the slow frame - while the carrier moved the whole frame.
        const MAX_STEP_DELTA = 0.1;
        const MAX_PENDING = 0.2;
        if (this.pendingDelta > MAX_PENDING) {
            this.pendingDelta = MAX_STEP_DELTA;
        }
        const delta = Math.min(this.pendingDelta, MAX_STEP_DELTA);
        this.pendingDelta = 0;
        this.postedTime += delta;
        this.busy = true;
        this.stepSentAt = performance.now();
        if (this.shared) {
            setSharedBusy(this.shared, true);
        }
        this.post({ type: 'step', delta, inputs });
    }

    private applyHits(hits: SimHitEvent[]): void {
        if (hits.length === 0) {
            return;
        }
        this.onHits?.(hits);
    }

    private applySnapshot(snapshot: SnapshotBuffers): void {
        this.snapshotTime = this.postedTime;
        for (let i = 0; i < snapshot.ids.length; i++) {
            const id = snapshot.ids[i];
            this.proxies.get(id)?.applyStateBuffer(
                snapshot.aircraft, i * AC_STRIDE, snapshot.forceVectors[id] ?? EMPTY_FORCE_VECTORS);
        }
        this.maneuverLabels = snapshot.maneuverLabels ?? EMPTY_MANEUVER_LABELS;
        this.projectiles = snapshot.projectiles;
        this.projectileCount = snapshot.projectileCount;
        this.applyHits(snapshot.hits);
    }

    /** Flat projectile buffer from the latest snapshot (PROJ_STRIDE floats each). */
    getProjectileBuffer(): Float32Array {
        return this.projectiles;
    }

    /** Number of live projectiles in {@link getProjectileBuffer}. */
    getProjectileCount(): number {
        return this.projectileCount;
    }
}
