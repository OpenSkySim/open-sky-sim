import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { FlightRecorder, ReplayPlayer, newReplayPose } from './flightRecorder';

function pose(x: number, yaw = 0) {
    const p = newReplayPose();
    p.position.set(x, 100, 0);
    p.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    p.devices.gear = true;
    p.devices.throttle = 0.5;
    return p;
}

describe('FlightRecorder', () => {
    it('overwrites the camera over a span of samples', () => {
        const r = new FlightRecorder(10, 60);
        for (let i = 0; i < 5; i++) {
            const p = pose(i);
            p.camera = { view: 1, subject: -1, yaw: 0, pitch: 0, zoom: 1 };
            r.record(0.1, p);
        }
        const t = (i: number) => r.startTime + i * 0.1;
        r.writeCamera(t(1), t(3) + 1e-9, { view: 7, subject: 2, yaw: 0.5, pitch: 0, zoom: 1 });
        const out = newReplayPose();
        const views = [0, 1, 2, 3, 4].map(i => (r.sample(t(i) + 1e-9, out), out.camera.view));
        assert.deepEqual(views, [1, 1, 7, 7, 1]);
        r.sample(t(2) + 1e-9, out);
        assert.equal(out.camera.subject, 2);
        assert.ok(r.endTime > r.startTime); // times untouched
    });

    it('records the camera: view and subject switch, the orbit glides', () => {
        const r = new FlightRecorder(10, 60);
        const a = pose(0);
        a.camera = { view: 12, subject: -1, yaw: 0, pitch: 0.2, zoom: 1 };
        const b = pose(10);
        b.camera = { view: 13, subject: 4, yaw: 1, pitch: 0.4, zoom: 2 };
        r.record(0.1, a);
        r.record(0.1, b);
        const out = newReplayPose();
        assert.equal(out.camera.view, -1);
        r.sample(r.startTime + 0.025, out);
        assert.equal(out.camera.view, 12);
        assert.equal(out.camera.subject, -1);
        assert.ok(Math.abs(out.camera.yaw - 0.25) < 1e-9);
        assert.ok(Math.abs(out.camera.zoom - 1.25) < 1e-9);
        r.sample(r.endTime, out);
        assert.equal(out.camera.view, 13);
        assert.equal(out.camera.subject, 4);
    });

    it('records the control surface inputs', () => {
        const r = new FlightRecorder(10, 60);
        const a = pose(0);
        a.surfaces.yaw = -1;
        a.surfaces.fold = 0.2;
        const b = pose(10);
        b.surfaces.yaw = 1;
        b.surfaces.fold = 0.6;
        r.record(0.1, a);
        r.record(0.1, b);
        const out = newReplayPose();
        assert.ok(r.sample((r.startTime + r.endTime) / 2, out));
        assert.ok(Math.abs(out.surfaces.yaw) < 1e-9);
        assert.ok(Math.abs(out.surfaces.fold - 0.4) < 1e-9);
        // The time column must not have been overwritten by the surfaces.
        assert.ok(r.endTime > r.startTime);
    });

    it('interpolates between samples', () => {
        const r = new FlightRecorder(10, 60);
        r.record(0.1, pose(0));
        r.record(0.1, pose(10));
        const out = newReplayPose();
        assert.ok(r.sample((r.startTime + r.endTime) / 2, out));
        assert.ok(Math.abs(out.position.x - 5) < 1e-9);
        assert.equal(out.devices.gear, true);
    });

    it('slerps orientation', () => {
        const r = new FlightRecorder(10, 60);
        r.record(0.1, pose(0, 0));
        r.record(0.1, pose(0, Math.PI / 2));
        const out = newReplayPose();
        r.sample((r.startTime + r.endTime) / 2, out);
        const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
        assert.ok(out.quaternion.angleTo(expected) < 1e-9);
    });

    it('drops the oldest samples once full', () => {
        const r = new FlightRecorder(10, 1); // 10 slots
        for (let i = 0; i < 25; i++) r.record(0.1, pose(i));
        assert.equal(r.length, 10);
        const out = newReplayPose();
        r.sample(r.startTime, out);
        assert.equal(Math.round(out.position.x), 15);
        r.sample(r.endTime, out);
        assert.equal(Math.round(out.position.x), 24);
    });

    it('records nothing between sample ticks', () => {
        const r = new FlightRecorder(10, 60);
        for (let i = 0; i < 50; i++) r.record(0.01, pose(i));
        assert.ok(r.length >= 4 && r.length <= 6);
    });

    it('returns false when empty and clamps outside the span', () => {
        const r = new FlightRecorder(10, 60);
        const out = newReplayPose();
        assert.equal(r.sample(0, out), false);
        r.record(0.1, pose(1));
        r.record(0.1, pose(2));
        r.sample(1e6, out);
        assert.equal(Math.round(out.position.x), 2);
    });

    it('follows the recorded velocities through a turn', () => {
        // A 100 m/s circle of radius 200 m sampled at 5 Hz: the chord midpoint
        // sits ~1.6 m inside the arc; the Hermite curve should be on it.
        const r = new FlightRecorder(5, 60);
        const w = 100 / 200;
        let t = 0;
        for (let i = 0; i < 3; i++) {
            t += 0.2;
            const p = newReplayPose();
            p.position.set(200 * Math.cos(w * t), 0, 200 * Math.sin(w * t));
            p.velocity.set(-100 * Math.sin(w * t), 0, 100 * Math.cos(w * t));
            r.record(0.2, p);
        }
        const out = newReplayPose();
        const mid = r.startTime + 0.1;
        r.sample(mid, out);
        const radius = Math.hypot(out.position.x, out.position.z);
        assert.ok(Math.abs(radius - 200) < 0.05, `radius ${radius}`);
    });

    it('falls back to a straight blend when velocities do not fit', () => {
        const r = new FlightRecorder(10, 60);
        const a = pose(0);
        a.velocity.set(0, 500, 0); // nothing like the 10 m it moved
        r.record(0.1, a);
        r.record(0.1, pose(10));
        const out = newReplayPose();
        r.sample((r.startTime + r.endTime) / 2, out);
        assert.ok(Math.abs(out.position.x - 5) < 1e-9);
        assert.ok(Math.abs(out.position.y - 100) < 1e-9);
    });

    it('keeps every frame at its own rate despite jitter', () => {
        const r = new FlightRecorder(60, 60);
        for (let i = 0; i < 120; i++) r.record(i % 2 ? 0.0163 : 0.0170, pose(i));
        assert.ok(r.length >= 118, `kept ${r.length} of 120`);
    });

    it('applies a rebase to every stored pose', () => {
        const r = new FlightRecorder(10, 60);
        r.record(0.1, pose(1));
        r.record(0.1, pose(2));
        const shift = {
            point: (p: THREE.Vector3) => p.set(p.x - 1000, p.y, p.z),
            orientation: (q: THREE.Quaternion) => q,
            vector: (v: THREE.Vector3) => v,
        };
        r.rebase(shift as never);
        const out = newReplayPose();
        r.sample(r.endTime, out);
        assert.equal(Math.round(out.position.x), -998);
    });
});

describe('ReplayPlayer', () => {
    it('loops, pauses, seeks and changes speed', () => {
        const r = new FlightRecorder(10, 60);
        for (let i = 0; i < 11; i++) r.record(0.1, pose(i)); // ~1 s
        const p = new ReplayPlayer(r);
        p.start();
        assert.equal(p.time, r.startTime);
        p.advance(0.5);
        assert.ok(Math.abs(p.time - (r.startTime + 0.5)) < 1e-9);
        p.paused = true;
        p.advance(10);
        assert.ok(Math.abs(p.time - (r.startTime + 0.5)) < 1e-9);
        p.paused = false;
        p.changeSpeed(1);
        assert.equal(p.speed, 2);
        p.advance(10); // past the end -> loops
        assert.equal(p.time, r.startTime);
        p.seek(-100);
        assert.equal(p.time, r.startTime);
    });
});
