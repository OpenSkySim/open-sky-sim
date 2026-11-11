import * as THREE from 'three';
import { FlightModel } from './flightModel';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import {
    formatF16ThrottleHud, stepF16ThrottleDetent, isF16AbDetentBand,
    adjustF16ThrottleInput, getF16ThrottleZone, f16ThrottleAudioLevel, getF16EngineNozzleColor,
} from '../f16Engine';
import { FcsPitchLimiter } from '../fm2/fcs';
import { CombatSimClient, SimAircraftProxy } from '../sim/combatSimClient';
import { SimControlInputs, SimFlightModelKind } from '../sim/simTypes';
import { AC } from '../sim/simSnapshotCodec';
import { ForceVectorSample } from './flightModel';
import { FrameShift } from '../../terrain/geodesy';

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
    /** False until the first worker snapshot — defaults must not override spawn pose. */
    private simStateReady = false;
    private simAirbrakesExtended = false;
    private simHookDeployed = false;
    private simWingsFolded = false;
    private simFiring = false;
    private simHealth = 100;
    private simAmmo = 0;
    private simAutopilot = false;
    private simWheelBrakes = false;
    private simLimitersEnabled = true;
    private simPitchLimiterMode = 0;
    private simArrestorLatch = -1;
    private simBarricade = 0;
    private readonly simArrestorHook = new THREE.Vector3();

    constructor(
        private readonly client: CombatSimClient,
        readonly simId: string,
        /** The physics the combat sim runs for this aircraft. */
        readonly modelKind: SimFlightModelKind,
    ) {
        super();
        this.client.registerProxy(this);
    }

    activate(): void {
        this.client.registerProxy(this);
    }

    // --- SimAircraftProxy -----------------------------------------------------

    collectInputs(): SimControlInputs {
        // Worker-owned player input overwrites these during step(); keep neutral.
        return {
            pitch: 0,
            roll: 0,
            yaw: 0,
            throttle: 0,
            landingGearDeployed: this.landingGearDeployed,
            flapsExtended: this.flapsExtended,
            airbrakesExtended: this.airbrakesExtended,
            hookDeployed: this.simHookDeployed,
            wheelBrakesApplied: false,
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
        this.simAirbrakesExtended = buf[base + AC.airbrakesExtended] !== 0;
        this.simHookDeployed = buf[base + AC.hookDeployed] !== 0;
        this.simWingsFolded = buf[base + AC.wingsFolded] !== 0;
        this.simStateReady = true;
        this.simFiring = buf[base + AC.firing] !== 0;
        this.simHealth = buf[base + AC.health];
        this.simAmmo = buf[base + AC.ammo];

        this.pitch = buf[base + AC.inPitch];
        this.roll = buf[base + AC.inRoll];
        this.yaw = buf[base + AC.inYaw];
        this.throttle = buf[base + AC.inThrottle];
        this.simWheelBrakes = buf[base + AC.wheelBrakes] !== 0;
        this.simLimitersEnabled = buf[base + AC.limitersEnabled] !== 0;
        this.simPitchLimiterMode = buf[base + AC.pitchLimiterMode];
        this.simAutopilot = buf[base + AC.autopilot] !== 0;
        this.wheelBrakesApplied = this.simWheelBrakes;
        this.pitchLimiterMode = this.simPitchLimiterMode as FcsPitchLimiter;
        this.limitersEnabled = this.simLimitersEnabled;
        this.simArrestorLatch = buf[base + AC.arrestorLatch] ?? -1;
        this.simBarricade = buf[base + AC.barricade] ?? 0;
        this.simArrestorHook.set(
            buf[base + AC.hookX] ?? 0,
            buf[base + AC.hookY] ?? 0,
            buf[base + AC.hookZ] ?? 0,
        );

        // The state is the model's last 120 Hz step, which ends `deltaRemainder`
        // before the snapshot's time. (Its previous step is left out: a parked
        // or crashed aircraft is moved without stepping, and keeps a stale one.)
        this.poses.push(this.client.getSnapshotTime() - buf[base + AC.deltaRemainder],
            this.obj.position, this.obj.quaternion, this.velocity);
    }

    /** Timestamped worker states the render pose is interpolated from. */
    private readonly poses = new PoseHistory();

    getRenderPosition(target: THREE.Vector3): THREE.Vector3 {
        return this.poses.position(this.client.getPlayoutTime(), target) ? target : target.copy(this.obj.position);
    }

    getRenderQuaternion(target: THREE.Quaternion): THREE.Quaternion {
        return this.poses.quaternion(this.client.getPlayoutTime(), target) ? target : target.copy(this.obj.quaternion);
    }

    getRenderVelocity(target: THREE.Vector3): THREE.Vector3 {
        return this.poses.velocity(this.client.getPlayoutTime(), target) ? target : target.copy(this.velocity);
    }

    rebase(shift: FrameShift): void {
        super.rebase(shift);
        this.poses.rebase(shift);
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

    /** Raw pilot controls mirrored by the target branch's input snapshot fields. */
    getSimStickPitch(): number {
        return this.pitch;
    }

    getSimStickRoll(): number {
        return this.roll;
    }

    getSimThrottleLever(): number {
        return this.throttle;
    }

    getSimGearDeployed(): boolean | null {
        return this.simStateReady ? this.simGearDeployed : null;
    }

    getSimFlapsExtended(): boolean | null {
        return this.simStateReady ? this.simFlapsExtended : null;
    }

    getSimAirbrakesExtended(): boolean | null {
        return this.simStateReady ? this.simAirbrakesExtended : null;
    }

    getSimHookDeployed(): boolean | null {
        return this.simStateReady ? this.simHookDeployed : null;
    }

    getSimWingsFolded(): boolean | null {
        return this.simStateReady ? this.simWingsFolded : null;
    }

    /** Clear mirrored gear/flaps until the next worker snapshot (e.g. after respawn). */
    invalidateSimDeviceState(): void {
        this.simStateReady = false;
    }

    getSimAutopilot(): boolean {
        return this.simAutopilot;
    }

    /** What the in-worker pilot is doing (its maneuver label), when it has one. */
    getSimPilotLabel(): string | undefined {
        return this.client.getManeuverLabel(this.simId);
    }

    getSimWheelBrakes(): boolean {
        return this.simWheelBrakes;
    }

    /** Latched arrestor cable index, or -1 when free. */
    /** Barricade engagement from the sim (see BarricadeEngagement). */
    getBarricadeEngagement(): number {
        return this.simBarricade;
    }

    getArrestorLatch(): number {
        return this.simArrestorLatch;
    }

    /** World-space hook position from the latest worker snapshot. */
    getArrestorHookWorld(out: THREE.Vector3): THREE.Vector3 {
        return out.copy(this.simArrestorHook);
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
        this.poses.clear();
        this.client.resetAircraft(
            this.simId, this.obj.position, this.obj.quaternion, this.velocity,
            this.landed, this.throttle, this.modelKind);
    }

    setPitchTrim(trim: number, idleOnTouchdown = false, flaps?: boolean): void {
        this.client.setPitchTrim(this.simId, trim, idleOnTouchdown, flaps);
    }

    syncEffectiveThrottle(): void {
        super.syncEffectiveThrottle();
        this.client.syncEffectiveThrottle(this.simId, this.throttle);
    }

    snapPhysicsState(): void {
        super.snapPhysicsState();
        this.poses.clear();
        this.client.snapPhysicsState(this.simId);
    }

    set position(p: THREE.Vector3) {
        super.position = p;
        this.poses.clear();
        this.client.setPosition(this.simId, p);
    }

    get position(): THREE.Vector3 {
        return super.position;
    }

    set quaternion(q: THREE.Quaternion) {
        super.quaternion = q;
        this.poses.clear();
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
        this.client.setAircraftConfig(this.simId, config, this.modelKind);
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

/** Samples kept: a few frames' worth, enough to bracket the playout time through a missed frame. */
const POSE_HISTORY = 6;
/** Furthest past the newest sample a pose is extrapolated (a worker stall freezes there). */
const MAX_EXTRAPOLATE_S = 0.05;
/** A sample this far off where the one before it was heading is a teleport: start over from it. */
const TELEPORT_M = 50;

interface PoseSample {
    t: number;
    readonly position: THREE.Vector3;
    readonly quaternion: THREE.Quaternion;
    readonly velocity: THREE.Vector3;
}

const _dq = new THREE.Quaternion();
const _guess = new THREE.Vector3();

/**
 * Worker states with the sim time each shows, oldest first, and the pose at
 * any time between them (or a little past the newest, on its velocity and
 * turn rate). Drawn at the client's playout clock, motion on screen follows
 * the frame clock instead of when snapshots happened to land.
 */
export class PoseHistory {
    private readonly samples: PoseSample[] = [];
    private count = 0;

    clear(): void {
        this.count = 0;
    }

    push(t: number, position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3): void {
        if (!Number.isFinite(t)) {
            return;
        }
        const last = this.count > 0 ? this.samples[this.count - 1] : undefined;
        if (last) {
            if (t < last.t - 1e-6) {
                // Time ran backwards (a reset the client did not see): start over.
                this.count = 0;
            } else {
                _guess.copy(last.position).addScaledVector(last.velocity, t - last.t);
                if (_guess.distanceToSquared(position) > TELEPORT_M * TELEPORT_M) {
                    this.count = 0;
                } else if (t - last.t < 1e-6) {
                    // The same step again (no 120 Hz step this frame): refresh it.
                    last.position.copy(position);
                    last.quaternion.copy(quaternion);
                    last.velocity.copy(velocity);
                    return;
                }
            }
        }
        if (this.count === POSE_HISTORY) {
            const oldest = this.samples.shift()!;
            this.samples.push(oldest);
            this.count--;
        }
        let s = this.samples[this.count];
        if (!s) {
            s = { t, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), velocity: new THREE.Vector3() };
            this.samples[this.count] = s;
        }
        s.t = t;
        s.position.copy(position);
        s.quaternion.copy(quaternion);
        s.velocity.copy(velocity);
        this.count++;
    }

    rebase(shift: FrameShift): void {
        for (let i = 0; i < this.count; i++) {
            const s = this.samples[i];
            shift.point(s.position);
            shift.orientation(s.quaternion);
            shift.vector(s.velocity);
        }
    }

    /** Index i with samples[i].t <= t < samples[i+1].t, clamped; -1 when empty. */
    private bracket(t: number): number {
        let i = this.count - 2;
        while (i > 0 && this.samples[i].t > t) {
            i--;
        }
        return i;
    }

    position(t: number, out: THREE.Vector3): boolean {
        if (this.count === 0) {
            return false;
        }
        const newest = this.samples[this.count - 1];
        if (this.count === 1 || t >= newest.t) {
            const dt = Math.min(Math.max(0, t - newest.t), MAX_EXTRAPOLATE_S);
            out.copy(newest.position).addScaledVector(newest.velocity, dt);
            return true;
        }
        const i = this.bracket(t);
        const a = this.samples[i], b = this.samples[i + 1];
        out.lerpVectors(a.position, b.position, PoseHistory.alpha(a, b, t));
        return true;
    }

    velocity(t: number, out: THREE.Vector3): boolean {
        if (this.count === 0) {
            return false;
        }
        const newest = this.samples[this.count - 1];
        if (this.count === 1 || t >= newest.t) {
            out.copy(newest.velocity);
            return true;
        }
        const i = this.bracket(t);
        const a = this.samples[i], b = this.samples[i + 1];
        out.lerpVectors(a.velocity, b.velocity, PoseHistory.alpha(a, b, t));
        return true;
    }

    quaternion(t: number, out: THREE.Quaternion): boolean {
        if (this.count === 0) {
            return false;
        }
        const newest = this.samples[this.count - 1];
        if (this.count === 1) {
            out.copy(newest.quaternion);
            return true;
        }
        if (t >= newest.t) {
            // Carry on turning at the rate between the last two samples.
            const prev = this.samples[this.count - 2];
            const span = newest.t - prev.t;
            const k = span > 1e-6 ? Math.min(Math.max(0, t - newest.t), MAX_EXTRAPOLATE_S) / span : 0;
            _dq.copy(prev.quaternion).invert().premultiply(newest.quaternion);
            if (_dq.w < 0) {
                _dq.set(-_dq.x, -_dq.y, -_dq.z, -_dq.w);
            }
            out.copy(newest.quaternion).premultiply(PoseHistory.powRotation(_dq, k));
            return true;
        }
        const i = this.bracket(t);
        const a = this.samples[i], b = this.samples[i + 1];
        out.slerpQuaternions(a.quaternion, b.quaternion, PoseHistory.alpha(a, b, t));
        return true;
    }

    private static alpha(a: PoseSample, b: PoseSample, t: number): number {
        const span = b.t - a.t;
        return span > 1e-9 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 1;
    }

    /** q^k for a unit quaternion with w >= 0 (rotation angle scaled by k), in place. */
    private static powRotation(q: THREE.Quaternion, k: number): THREE.Quaternion {
        const w = Math.min(1, q.w);
        const half = Math.acos(w);
        const s = Math.sin(half);
        if (s < 1e-9 || k === 0) {
            return q.identity();
        }
        const halfK = half * k;
        const f = Math.sin(halfK) / s;
        return q.set(q.x * f, q.y * f, q.z * f, Math.cos(halfK));
    }
}
