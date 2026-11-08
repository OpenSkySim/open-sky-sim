import * as THREE from 'three';
import { FrameShift } from '../terrain/geodesy';
import { newSurfaceInputs, readSurfaceInputs, SURFACE_INPUT_FLOATS, SurfaceInputs, writeSurfaceInputs } from '../scene/entities/surfaceInputs';

/**
 * Samples per second of flight time. Poses are interpolated between them;
 * 60 so a half- or quarter-speed video export still gets a fresh sample
 * every two or four frames rather than gliding along straight chords.
 */
export const RECORD_RATE_HZ = 60;
/** How much flight the recorder keeps; older samples are dropped. */
export const RECORD_MAX_SECONDS = 600;

/** Device animation state worth showing in a replay; all in 0..1 except throttle. */
export interface ReplayDevices {
    throttle: number;
    gear: boolean;
    flaps: boolean;
    airbrakes: boolean;
    hook: boolean;
}

export interface ReplayPose {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    velocity: THREE.Vector3;
    devices: ReplayDevices;
    /** The airframe is in pieces: its wreck is what a replay shows. */
    crashed: boolean;
    /** Not shot down or crashed (a shot-down jet falls trailing smoke). */
    alive: boolean;
    /** Stick, rudder, flaps and the rest the moving surfaces are posed from. */
    surfaces: SurfaceInputs;
    /** The camera the flight was watched through. */
    camera: ReplayCamera;
}

/** Which view was on and how it was turned, so a replay can watch the same way. */
export interface ReplayCamera {
    /** The game's view preset (an enum value); -1 when none was recorded. */
    view: number;
    /** Recording id of the aircraft the view followed; -1 for the player. */
    subject: number;
    /** Orbit round the aircraft on top of the preset. */
    yaw: number;
    pitch: number;
    zoom: number;
}

/**
 * Flat, ring-buffered record of the player aircraft's pose over time.
 *
 * Sim time only advances while {@link record} is called, so pauses (menu,
 * spawn) leave no gap. Positions are kept in the live scene frame: a
 * floating-origin re-base must be passed on through {@link rebase}, or the
 * samples would sit where the world used to be.
 */
export class FlightRecorder {
    // px py pz  qx qy qz qw  vx vy vz  throttle flags  t  (spare)  surfaces  camera: view subject yaw pitch zoom
    private static readonly STRIDE = 14 + SURFACE_INPUT_FLOATS + 5;
    private static readonly CAMERA = 14 + SURFACE_INPUT_FLOATS;
    private readonly capacity: number;
    private readonly data: Float64Array;
    private head = 0; // next write slot
    private count = 0;
    private clock = 0;
    /** Clock time the next sample is due at (NaN: take the next one offered). */
    private nextDue = NaN;

    constructor(private readonly rateHz = RECORD_RATE_HZ, maxSeconds = RECORD_MAX_SECONDS) {
        this.capacity = Math.max(2, Math.ceil(rateHz * maxSeconds));
        this.data = new Float64Array(this.capacity * FlightRecorder.STRIDE);
    }

    get length(): number {
        return this.count;
    }

    /** Time of the oldest / newest sample, in recorder seconds. */
    get startTime(): number {
        return this.count === 0 ? 0 : this.time(0);
    }

    get endTime(): number {
        return this.count === 0 ? 0 : this.time(this.count - 1);
    }

    get duration(): number {
        return this.endTime - this.startTime;
    }

    /** Flight time recorded so far, sampled or not: the clock events are stamped with. */
    get now(): number {
        return this.clock;
    }

    clear(): void {
        this.head = 0;
        this.count = 0;
        this.clock = 0;
        this.nextDue = NaN;
    }

    /**
     * Advance by `delta` seconds of flight and keep a sample when one is due.
     * True when it kept one (at {@link endTime}).
     */
    record(delta: number, pose: ReplayPose): boolean {
        this.clock += delta;
        // A schedule rather than "a period since the last one": at the
        // recording rate itself, frames a hair short of the period (vsync
        // jitter) would otherwise each be refused and halve the rate. Early
        // by up to a quarter period is close enough; a long frame resets the
        // schedule instead of owing a burst of catch-up samples.
        const period = 1 / this.rateHz;
        if (this.clock < this.nextDue - period * 0.25) {
            return false;
        }
        this.nextDue = Number.isNaN(this.nextDue)
            ? this.clock + period
            : Math.max(this.nextDue + period, this.clock + period * 0.5);
        const o = this.head * FlightRecorder.STRIDE;
        const d = this.data;
        d[o] = pose.position.x; d[o + 1] = pose.position.y; d[o + 2] = pose.position.z;
        d[o + 3] = pose.quaternion.x; d[o + 4] = pose.quaternion.y;
        d[o + 5] = pose.quaternion.z; d[o + 6] = pose.quaternion.w;
        d[o + 7] = pose.velocity.x; d[o + 8] = pose.velocity.y; d[o + 9] = pose.velocity.z;
        d[o + 10] = pose.devices.throttle;
        d[o + 11] = (pose.devices.gear ? 1 : 0) | (pose.devices.flaps ? 2 : 0)
            | (pose.devices.airbrakes ? 4 : 0) | (pose.devices.hook ? 8 : 0) | (pose.crashed ? 16 : 0) | (pose.alive ? 0 : 32);
        d[o + 12] = this.clock;
        writeSurfaceInputs(pose.surfaces, d, o + 14);
        const c = o + FlightRecorder.CAMERA;
        d[c] = pose.camera.view; d[c + 1] = pose.camera.subject;
        d[c + 2] = pose.camera.yaw; d[c + 3] = pose.camera.pitch; d[c + 4] = pose.camera.zoom;
        this.head = (this.head + 1) % this.capacity;
        this.count = Math.min(this.count + 1, this.capacity);
        return true;
    }

    /** Carry every stored pose across a floating-origin re-base. */
    rebase(shift: FrameShift): void {
        const p = new THREE.Vector3();
        const q = new THREE.Quaternion();
        const d = this.data;
        for (let i = 0; i < this.count; i++) {
            const o = this.slot(i) * FlightRecorder.STRIDE;
            shift.point(p.set(d[o], d[o + 1], d[o + 2]));
            d[o] = p.x; d[o + 1] = p.y; d[o + 2] = p.z;
            shift.orientation(q.set(d[o + 3], d[o + 4], d[o + 5], d[o + 6]));
            d[o + 3] = q.x; d[o + 4] = q.y; d[o + 5] = q.z; d[o + 6] = q.w;
            shift.vector(p.set(d[o + 7], d[o + 8], d[o + 9]));
            d[o + 7] = p.x; d[o + 8] = p.y; d[o + 9] = p.z;
        }
    }

    /**
     * Pose at `t` (recorder seconds, clamped to the recorded span), blended
     * between the two samples around it. False when nothing is recorded.
     *
     * Position follows a cubic Hermite curve through both samples' recorded
     * velocities, so a hard turn replayed slowly bends instead of showing
     * the chords between samples. Where the velocities do not fit the
     * samples (a crash, a catch on the wire) it falls back to a straight
     * blend rather than overshooting.
     */
    sample(t: number, out: ReplayPose): boolean {
        if (this.count === 0) {
            return false;
        }
        t = Math.min(Math.max(t, this.startTime), this.endTime);
        // Binary search for the last sample at or before t.
        let lo = 0;
        let hi = this.count - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this.time(mid) <= t) lo = mid; else hi = mid - 1;
        }
        const next = Math.min(lo + 1, this.count - 1);
        const t0 = this.time(lo);
        const t1 = this.time(next);
        const k = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
        const a = this.slot(lo) * FlightRecorder.STRIDE;
        const b = this.slot(next) * FlightRecorder.STRIDE;
        const d = this.data;
        blendPosition(d, a, d, b, 7, t1 - t0, k, out.position);
        out.velocity.set(
            d[a + 7] + (d[b + 7] - d[a + 7]) * k,
            d[a + 8] + (d[b + 8] - d[a + 8]) * k,
            d[a + 9] + (d[b + 9] - d[a + 9]) * k);
        _qa.set(d[a + 3], d[a + 4], d[a + 5], d[a + 6]);
        _qb.set(d[b + 3], d[b + 4], d[b + 5], d[b + 6]);
        out.quaternion.copy(_qa).slerp(_qb, k);
        out.devices.throttle = d[a + 10] + (d[b + 10] - d[a + 10]) * k;
        const flags = d[a + 11];
        out.devices.gear = (flags & 1) !== 0;
        out.devices.flaps = (flags & 2) !== 0;
        out.devices.airbrakes = (flags & 4) !== 0;
        out.devices.hook = (flags & 8) !== 0;
        out.crashed = (flags & 16) !== 0;
        out.alive = (flags & 32) === 0;
        readSurfaceInputs(d, a + 14, d, b + 14, k, out.surfaces);
        // The view and whom it follows switch at a sample; the orbit glides.
        const ca = a + FlightRecorder.CAMERA;
        const cb = b + FlightRecorder.CAMERA;
        out.camera.view = d[ca];
        out.camera.subject = d[ca + 1];
        out.camera.yaw = d[ca + 2] + (d[cb + 2] - d[ca + 2]) * k;
        out.camera.pitch = d[ca + 3] + (d[cb + 3] - d[ca + 3]) * k;
        out.camera.zoom = d[ca + 4] + (d[cb + 4] - d[ca + 4]) * k;
        return true;
    }

    /**
     * Overwrite the camera of every sample in (`from`, `to`]: a replay that
     * records the views picked while watching it.
     */
    writeCamera(from: number, to: number, cam: ReplayCamera): void {
        // First sample after `from`.
        let lo = 0;
        let hi = this.count;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (this.time(mid) <= from) lo = mid + 1; else hi = mid;
        }
        const d = this.data;
        for (let i = lo; i < this.count && this.time(i) <= to; i++) {
            const c = this.slot(i) * FlightRecorder.STRIDE + FlightRecorder.CAMERA;
            d[c] = cam.view; d[c + 1] = cam.subject;
            d[c + 2] = cam.yaw; d[c + 3] = cam.pitch; d[c + 4] = cam.zoom;
        }
    }

    /** Slot in the ring of the i-th oldest sample. */
    private slot(i: number): number {
        return (this.head - this.count + i + this.capacity * 2) % this.capacity;
    }

    private time(i: number): number {
        return this.data[this.slot(i) * FlightRecorder.STRIDE + 12];
    }
}

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();

type Floats = Float64Array | Float32Array;

/**
 * Position `k` (0..1) of the way between two samples `dt` seconds apart:
 * x, y, z at `d0[a..]` and `d1[b..]`, each sample's velocity `vel` floats
 * further on. A cubic Hermite curve through both velocities, so a turn
 * bends instead of running along the chord; a straight blend where the
 * velocities do not fit the samples (a crash, a catch on the wire), rather
 * than overshooting.
 */
export function blendPosition(
    d0: Floats, a: number, d1: Floats, b: number, vel: number, dt: number, k: number, out: THREE.Vector3,
): THREE.Vector3 {
    if (dt > 0 && velocitiesFit(d0, a, d1, b, vel, dt)) {
        const k2 = k * k;
        const k3 = k2 * k;
        const h00 = 2 * k3 - 3 * k2 + 1;
        const h10 = (k3 - 2 * k2 + k) * dt;
        const h01 = -2 * k3 + 3 * k2;
        const h11 = (k3 - k2) * dt;
        return out.set(
            h00 * d0[a] + h10 * d0[a + vel] + h01 * d1[b] + h11 * d1[b + vel],
            h00 * d0[a + 1] + h10 * d0[a + vel + 1] + h01 * d1[b + 1] + h11 * d1[b + vel + 1],
            h00 * d0[a + 2] + h10 * d0[a + vel + 2] + h01 * d1[b + 2] + h11 * d1[b + vel + 2]);
    }
    return out.set(
        d0[a] + (d1[b] - d0[a]) * k,
        d0[a + 1] + (d1[b + 1] - d0[a + 1]) * k,
        d0[a + 2] + (d1[b + 2] - d0[a + 2]) * k);
}

/**
 * Whether both samples' velocities, carried over the gap, land near where
 * the samples actually are: within a quarter of the chord plus a metre.
 */
function velocitiesFit(d0: Floats, a: number, d1: Floats, b: number, vel: number, dt: number): boolean {
    const cx = d1[b] - d0[a];
    const cy = d1[b + 1] - d0[a + 1];
    const cz = d1[b + 2] - d0[a + 2];
    const tol = 0.25 * Math.hypot(cx, cy, cz) + 1;
    return Math.hypot(d0[a + vel] * dt - cx, d0[a + vel + 1] * dt - cy, d0[a + vel + 2] * dt - cz) <= tol
        && Math.hypot(d1[b + vel] * dt - cx, d1[b + vel + 1] * dt - cy, d1[b + vel + 2] * dt - cz) <= tol;
}

export function newReplayPose(): ReplayPose {
    return {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        velocity: new THREE.Vector3(),
        devices: { throttle: 0, gear: false, flaps: false, airbrakes: false, hook: false },
        crashed: false,
        alive: true,
        surfaces: newSurfaceInputs(),
        camera: { view: -1, subject: -1, yaw: 0, pitch: 0, zoom: 1 },
    };
}

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4];

/** Playback cursor over a recorder: time, speed, pause, seek. */
export class ReplayPlayer {
    time = 0;
    paused = false;
    private speedIndex = 2;

    constructor(private readonly rec: FlightRecorder) {}

    get speed(): number {
        return REPLAY_SPEEDS[this.speedIndex];
    }

    /** Begin at the start of the last `seconds` of the recording. */
    start(seconds = Infinity): void {
        this.time = Math.max(this.rec.startTime, this.rec.endTime - seconds);
        this.paused = false;
        this.speedIndex = 2;
    }

    /** Advance by real `delta`; loops back to the start at the end. */
    advance(delta: number): void {
        if (this.paused) {
            return;
        }
        this.time += delta * this.speed;
        if (this.time >= this.rec.endTime) {
            this.time = this.rec.startTime;
        }
    }

    /** Next speed, wrapping from the fastest back to the slowest. */
    cycleSpeed(): void {
        this.speedIndex = (this.speedIndex + 1) % REPLAY_SPEEDS.length;
    }

    seek(deltaSeconds: number): void {
        this.time = Math.min(Math.max(this.time + deltaSeconds, this.rec.startTime), this.rec.endTime);
    }

    changeSpeed(direction: 1 | -1): void {
        this.speedIndex = Math.min(Math.max(this.speedIndex + direction, 0), REPLAY_SPEEDS.length - 1);
    }

    get fraction(): number {
        const d = this.rec.duration;
        return d > 0 ? (this.time - this.rec.startTime) / d : 0;
    }
}
