import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { newActorState, WorldRecorder, ROUND_STRIDE } from './worldRecorder';

function actor(x: number, opts: { vx?: number; crashed?: boolean; gear?: boolean } = {}) {
    const s = newActorState();
    s.position.set(x, 500, 0);
    s.velocity.set(opts.vx ?? 0, 0, 0);
    s.crashed = opts.crashed ?? false;
    s.gear = opts.gear ?? false;
    s.throttle = 0.8;
    return s;
}

function rounds(...xs: number[]) {
    const buffer = new Float32Array(xs.length * ROUND_STRIDE);
    xs.forEach((x, i) => {
        buffer[i * ROUND_STRIDE] = x;
        buffer[i * ROUND_STRIDE + 6] = 1; // identity: heading +Z
    });
    return { buffer, count: xs.length };
}

describe('WorldRecorder', () => {
    it('blends the control surface inputs', () => {
        const w = new WorldRecorder();
        const a = actor(0);
        a.surfaces.pitch = -0.5;
        a.surfaces.flaps = 1;
        const b = actor(100);
        b.surfaces.pitch = 0.5;
        b.surfaces.flaps = 1;
        b.surfaces.roll = 1;
        w.record(1, { actors: [{ id: 0, state: a }] });
        w.record(2, { actors: [{ id: 0, state: b }] });
        const out = newActorState();
        assert.ok(w.sampleActor(0, 1.75, out));
        assert.ok(Math.abs(out.surfaces.pitch - 0.25) < 1e-6);
        assert.ok(Math.abs(out.surfaces.roll - 0.75) < 1e-6);
        assert.equal(out.surfaces.flaps, 1);
        assert.equal(out.surfaces.yaw, 0);
    });

    it('blends an aircraft between frames and keeps its flags', () => {
        const w = new WorldRecorder();
        w.record(1, { actors: [{ id: 3, state: actor(0, { gear: true }) }] });
        w.record(2, { actors: [{ id: 3, state: actor(100, { gear: true }) }] });
        const out = newActorState();
        assert.ok(w.sampleActor(3, 1.25, out));
        assert.ok(Math.abs(out.position.x - 25) < 1e-4);
        assert.equal(out.gear, true);
        assert.ok(Math.abs(out.throttle - 0.8) < 1e-6);
        assert.equal(out.alive, true);
    });

    it('curves through recorded velocities like the player track', () => {
        const w = new WorldRecorder();
        // 100 m in 1 s at a steady 100 m/s: the curve is the line.
        w.record(0, { actors: [{ id: 0, state: actor(0, { vx: 100 }) }] });
        w.record(1, { actors: [{ id: 0, state: actor(100, { vx: 100 }) }] });
        const out = newActorState();
        w.sampleActor(0, 0.3, out);
        assert.ok(Math.abs(out.position.x - 30) < 1e-3);
    });

    it('hides an aircraft before it appears and holds one that left', () => {
        const w = new WorldRecorder();
        w.record(0, { actors: [] });
        w.record(1, { actors: [{ id: 1, state: actor(10) }] });
        w.record(2, { actors: [] });
        const out = newActorState();
        assert.equal(w.sampleActor(1, 0.5, out), false);
        assert.equal(w.sampleActor(1, 1.5, out), true);
        assert.ok(Math.abs(out.position.x - 10) < 1e-6);
        assert.equal(w.sampleActor(1, 2.5, out), false);
        assert.equal(w.sampleActor(7, 1, out), false);
    });

    it('carries gun rounds forward along their heading between frames', () => {
        const w = new WorldRecorder();
        w.record(0, { actors: [], rounds: rounds(5, 9) });
        w.record(0.1, { actors: [] });
        const out = { buffer: new Float32Array(0), count: 0 };
        w.sampleRounds(0.01, out);
        assert.equal(out.count, 2);
        assert.ok(Math.abs(out.buffer[0] - 5) < 1e-4);
        assert.ok(Math.abs(out.buffer[2] - 12) < 1e-3); // 0.01 s at 1200 m/s along +Z
        assert.ok(Math.abs(out.buffer[ROUND_STRIDE] - 9) < 1e-4);
        w.sampleRounds(0.1, out);
        assert.equal(out.count, 0);
    });

    it('copies the rounds rather than keeping the sim buffer', () => {
        const w = new WorldRecorder();
        const live = rounds(1);
        w.record(0, { actors: [], rounds: live });
        live.buffer[0] = 999;
        const out = { buffer: new Float32Array(0), count: 0 };
        w.sampleRounds(0, out);
        assert.equal(out.buffer[0], 1);
    });

    it('blends the carrier and keeps the crash flag', () => {
        const w = new WorldRecorder();
        const q = new THREE.Quaternion();
        w.record(0, { actors: [{ id: 0, state: actor(0) }], carrier: { position: new THREE.Vector3(0, 0, 0), quaternion: q } });
        w.record(1, { actors: [{ id: 0, state: actor(0, { crashed: true }) }], carrier: { position: new THREE.Vector3(0, 0, -15), quaternion: q } });
        const p = new THREE.Vector3();
        const r = new THREE.Quaternion();
        assert.ok(w.sampleCarrier(0.5, p, r));
        assert.ok(Math.abs(p.z + 7.5) < 1e-9);
        const a = newActorState();
        w.sampleActor(0, 0.5, a);
        assert.equal(a.crashed, false);
        w.sampleActor(0, 1, a);
        assert.equal(a.crashed, true);
        // Shot down, still falling: dead but not crashed.
        const dead = actor(0);
        dead.alive = false;
        w.record(2, { actors: [{ id: 0, state: dead }] });
        w.sampleActor(0, 2, a);
        assert.equal(a.alive, false);
        assert.equal(a.crashed, false);
    });

    it('trims old frames and re-bases the rest', () => {
        const w = new WorldRecorder();
        for (let i = 0; i < 3000; i++) {
            w.record(i, { actors: [{ id: 0, state: actor(i) }] });
        }
        w.trimBefore(2500);
        assert.equal(w.length, 500);
        const shift = {
            point: (v: THREE.Vector3) => v.set(v.x - 1000, v.y, v.z),
            orientation: (q: THREE.Quaternion) => q,
            vector: (v: THREE.Vector3) => v,
        };
        w.rebase(shift as never);
        const out = newActorState();
        w.sampleActor(0, 2600, out);
        assert.ok(Math.abs(out.position.x - 1600) < 1e-3);
        // Before the trimmed start: clamped to the oldest frame left.
        w.sampleActor(0, 10, out);
        assert.ok(Math.abs(out.position.x - 1500) < 1e-3);
    });
});
