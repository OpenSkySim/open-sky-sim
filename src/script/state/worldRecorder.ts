import * as THREE from 'three';
import { FrameShift } from '../terrain/geodesy';
import { FORWARD } from '../utils/math';
import { blendPosition } from './flightRecorder';
import { newSurfaceInputs, readSurfaceInputs, SURFACE_INPUT_FLOATS, SurfaceInputs, writeSurfaceInputs } from '../scene/entities/surfaceInputs';

/** Floats per recorded aircraft: id, position, orientation, velocity, throttle, flags, surface inputs. */
const ACTOR_STRIDE = 13 + SURFACE_INPUT_FLOATS;
const FLAG_GEAR = 1;
const FLAG_CRASHED = 2;
/** Shot down (no health left) but not yet on the ground: it falls trailing smoke. */
const FLAG_DEAD = 4;
/** Floats per recorded gun round, as the sim hands them over: position, orientation. */
export const ROUND_STRIDE = 7;
/**
 * Speed a replayed tracer is carried forward at between two samples: the
 * guns' 1000 m/s muzzle velocity plus a typical shooter's own speed. Only
 * ever applied for under one sample interval, so the error stays a metre.
 */
const ROUND_REPLAY_SPEED_MPS = 1200;

/** One aircraft's state at one instant, as recorded for a replay. */
export interface ActorState {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    velocity: THREE.Vector3;
    throttle: number;
    gear: boolean;
    crashed: boolean;
    /** Still flying under its own power: not shot down, not crashed. */
    alive: boolean;
    /** Stick, rudder, flaps and the rest its moving surfaces are posed from. */
    surfaces: SurfaceInputs;
}

export function newActorState(): ActorState {
    return {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        velocity: new THREE.Vector3(),
        throttle: 0,
        gear: false,
        crashed: false,
        alive: true,
        surfaces: newSurfaceInputs(),
    };
}

/** What a frame of the world holds; built by the caller, copied by {@link WorldRecorder.record}. */
export interface WorldFrameInput {
    /** Stable small integer per aircraft for the whole recording, with its state. */
    actors: { id: number; state: ActorState }[];
    /** The sim's projectile buffer and how many rounds in it are live. */
    rounds?: { buffer: Float32Array; count: number };
    carrier?: { position: THREE.Vector3; quaternion: THREE.Quaternion };
}

interface WorldFrame {
    t: number;
    actors: Float32Array;
    rounds: Float32Array | undefined;
    /** px py pz qx qy qz qw, kept in doubles: the ship is what the deck landing is measured against. */
    carrier: Float64Array | undefined;
}

/**
 * Everything around the player that a replay should show moving: the other
 * aircraft, gun rounds in flight and the carrier. One frame per player
 * sample, on the {@link FlightRecorder}'s clock, so both play back together.
 * Frames before the player recorder's start are trimmed by the caller.
 */
export class WorldRecorder {
    private frames: WorldFrame[] = [];
    /** Frames before this index have been trimmed (dropped in batches). */
    private head = 0;

    get length(): number {
        return this.frames.length - this.head;
    }

    clear(): void {
        this.frames = [];
        this.head = 0;
    }

    record(t: number, input: WorldFrameInput): void {
        const actors = new Float32Array(input.actors.length * ACTOR_STRIDE);
        input.actors.forEach(({ id, state: s }, i) => {
            const o = i * ACTOR_STRIDE;
            actors[o] = id;
            actors[o + 1] = s.position.x; actors[o + 2] = s.position.y; actors[o + 3] = s.position.z;
            actors[o + 4] = s.quaternion.x; actors[o + 5] = s.quaternion.y;
            actors[o + 6] = s.quaternion.z; actors[o + 7] = s.quaternion.w;
            actors[o + 8] = s.velocity.x; actors[o + 9] = s.velocity.y; actors[o + 10] = s.velocity.z;
            actors[o + 11] = s.throttle;
            actors[o + 12] = (s.gear ? FLAG_GEAR : 0) | (s.crashed ? FLAG_CRASHED : 0) | (s.alive ? 0 : FLAG_DEAD);
            writeSurfaceInputs(s.surfaces, actors, o + 13);
        });
        const r = input.rounds;
        const rounds = r && r.count > 0 ? r.buffer.slice(0, r.count * ROUND_STRIDE) : undefined;
        const c = input.carrier;
        const carrier = c
            ? Float64Array.of(c.position.x, c.position.y, c.position.z, c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w)
            : undefined;
        this.frames.push({ t, actors, rounds, carrier });
    }

    /** Drop every frame older than `t` (the player recorder's start). */
    trimBefore(t: number): void {
        while (this.head < this.frames.length && this.frames[this.head].t < t) {
            this.head++;
        }
        if (this.head > 1024 && this.head * 2 > this.frames.length) {
            this.frames = this.frames.slice(this.head);
            this.head = 0;
        }
    }

    /** Carry every stored pose across a floating-origin re-base. */
    rebase(shift: FrameShift): void {
        const p = new THREE.Vector3();
        const q = new THREE.Quaternion();
        for (let f = this.head; f < this.frames.length; f++) {
            const { actors, rounds, carrier } = this.frames[f];
            for (let o = 0; o < actors.length; o += ACTOR_STRIDE) {
                shift.point(p.set(actors[o + 1], actors[o + 2], actors[o + 3]));
                actors[o + 1] = p.x; actors[o + 2] = p.y; actors[o + 3] = p.z;
                shift.orientation(q.set(actors[o + 4], actors[o + 5], actors[o + 6], actors[o + 7]));
                actors[o + 4] = q.x; actors[o + 5] = q.y; actors[o + 6] = q.z; actors[o + 7] = q.w;
                shift.vector(p.set(actors[o + 8], actors[o + 9], actors[o + 10]));
                actors[o + 8] = p.x; actors[o + 9] = p.y; actors[o + 10] = p.z;
            }
            if (rounds) {
                for (let o = 0; o < rounds.length; o += ROUND_STRIDE) {
                    shift.point(p.set(rounds[o], rounds[o + 1], rounds[o + 2]));
                    rounds[o] = p.x; rounds[o + 1] = p.y; rounds[o + 2] = p.z;
                    shift.orientation(q.set(rounds[o + 3], rounds[o + 4], rounds[o + 5], rounds[o + 6]));
                    rounds[o + 3] = q.x; rounds[o + 4] = q.y; rounds[o + 5] = q.z; rounds[o + 6] = q.w;
                }
            }
            if (carrier) {
                shift.point(p.set(carrier[0], carrier[1], carrier[2]));
                carrier[0] = p.x; carrier[1] = p.y; carrier[2] = p.z;
                shift.orientation(q.set(carrier[3], carrier[4], carrier[5], carrier[6]));
                carrier[3] = q.x; carrier[4] = q.y; carrier[5] = q.z; carrier[6] = q.w;
            }
        }
    }

    /**
     * Index of the last frame at or before `t`, clamped to the recording;
     * -1 when nothing is recorded.
     */
    private frameAt(t: number): number {
        let lo = this.head;
        let hi = this.frames.length - 1;
        if (hi < lo) return -1;
        if (t <= this.frames[lo].t) return lo;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (this.frames[mid].t <= t) lo = mid; else hi = mid - 1;
        }
        return lo;
    }

    /**
     * Aircraft `id` at time `t`, blended between the two frames around it.
     * False when it is not in the recording at that moment (not yet spawned,
     * or removed): it should not be drawn.
     */
    sampleActor(id: number, t: number, out: ActorState): boolean {
        const i = this.frameAt(t);
        if (i < 0) return false;
        const f0 = this.frames[i];
        const a = findActor(f0.actors, id);
        if (a < 0) return false;
        const f1 = this.frames[Math.min(i + 1, this.frames.length - 1)];
        let b = f1 === f0 ? a : findActor(f1.actors, id);
        const d0 = f0.actors;
        let d1 = f1.actors;
        if (b < 0) {
            b = a;
            d1 = d0;
        }
        const dt = f1.t - f0.t;
        const k = dt > 0 ? THREE.MathUtils.clamp((t - f0.t) / dt, 0, 1) : 0;
        blendPosition(d0, a + 1, d1, b + 1, 7, dt, k, out.position);
        out.velocity.set(
            d0[a + 8] + (d1[b + 8] - d0[a + 8]) * k,
            d0[a + 9] + (d1[b + 9] - d0[a + 9]) * k,
            d0[a + 10] + (d1[b + 10] - d0[a + 10]) * k);
        _qa.set(d0[a + 4], d0[a + 5], d0[a + 6], d0[a + 7]);
        _qb.set(d1[b + 4], d1[b + 5], d1[b + 6], d1[b + 7]);
        out.quaternion.copy(_qa).slerp(_qb, k);
        out.throttle = d0[a + 11] + (d1[b + 11] - d0[a + 11]) * k;
        const flags = d0[a + 12];
        out.gear = (flags & FLAG_GEAR) !== 0;
        out.crashed = (flags & FLAG_CRASHED) !== 0;
        out.alive = (flags & FLAG_DEAD) === 0;
        readSurfaceInputs(d0, a + 13, d1, b + 13, k, out.surfaces);
        return true;
    }

    /**
     * Gun rounds in flight at `t`, written into `out` (grown as needed) as
     * position + orientation per round. Rounds have no identity between
     * frames, so the frame at or before `t` is carried forward along each
     * round's heading rather than blended with the next.
     */
    sampleRounds(t: number, out: { buffer: Float32Array; count: number }): void {
        out.count = 0;
        const i = this.frameAt(t);
        if (i < 0) return;
        const f = this.frames[i];
        const src = f.rounds;
        if (!src) return;
        const n = src.length / ROUND_STRIDE;
        if (out.buffer.length < src.length) {
            out.buffer = new Float32Array(src.length);
        }
        const ahead = Math.max(0, t - f.t) * ROUND_REPLAY_SPEED_MPS;
        const dst = out.buffer;
        for (let o = 0; o < src.length; o += ROUND_STRIDE) {
            _qa.set(src[o + 3], src[o + 4], src[o + 5], src[o + 6]);
            _v.copy(FORWARD).applyQuaternion(_qa).multiplyScalar(ahead);
            dst[o] = src[o] + _v.x;
            dst[o + 1] = src[o + 1] + _v.y;
            dst[o + 2] = src[o + 2] + _v.z;
            dst[o + 3] = src[o + 3]; dst[o + 4] = src[o + 4];
            dst[o + 5] = src[o + 5]; dst[o + 6] = src[o + 6];
        }
        out.count = n;
    }

    /** The carrier's pose at `t`, blended; false when none was recorded then. */
    sampleCarrier(t: number, outPosition: THREE.Vector3, outQuaternion: THREE.Quaternion): boolean {
        const i = this.frameAt(t);
        if (i < 0) return false;
        const f0 = this.frames[i];
        const c0 = f0.carrier;
        if (!c0) return false;
        const f1 = this.frames[Math.min(i + 1, this.frames.length - 1)];
        const c1 = f1.carrier ?? c0;
        const dt = f1.t - f0.t;
        const k = dt > 0 ? THREE.MathUtils.clamp((t - f0.t) / dt, 0, 1) : 0;
        outPosition.set(
            c0[0] + (c1[0] - c0[0]) * k,
            c0[1] + (c1[1] - c0[1]) * k,
            c0[2] + (c1[2] - c0[2]) * k);
        _qa.set(c0[3], c0[4], c0[5], c0[6]);
        _qb.set(c1[3], c1[4], c1[5], c1[6]);
        outQuaternion.copy(_qa).slerp(_qb, k);
        return true;
    }
}

function findActor(actors: Float32Array, id: number): number {
    for (let o = 0; o < actors.length; o += ACTOR_STRIDE) {
        if (actors[o] === id) return o;
    }
    return -1;
}

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _v = new THREE.Vector3();
