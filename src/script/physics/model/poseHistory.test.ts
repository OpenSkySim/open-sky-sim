import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { PoseHistory } from './simProxyFlightModel';

const V = 250; // m/s along +x
const yawAt = (t: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5 * t);

function flown(times: number[]): PoseHistory {
    const h = new PoseHistory();
    const vel = new THREE.Vector3(V, 0, 0);
    for (const t of times) {
        h.push(t, new THREE.Vector3(V * t, 1000, 0), yawAt(t), vel);
    }
    return h;
}

describe('PoseHistory', () => {
    it('interpolates between unevenly spaced samples at the requested time', () => {
        const h = flown([0, 0.0167, 0.05, 0.0583, 0.1]);
        const p = new THREE.Vector3();
        for (const t of [0.01, 0.03, 0.055, 0.09]) {
            assert.ok(h.position(t, p));
            assert.ok(Math.abs(p.x - V * t) < 1e-3, `x at ${t}: ${p.x}`);
        }
    });

    it('extrapolates position and turn past the newest sample, capped', () => {
        const h = flown([0, 0.0167, 0.0333]);
        const p = new THREE.Vector3();
        const q = new THREE.Quaternion();
        h.position(0.04, p);
        assert.ok(Math.abs(p.x - V * 0.04) < 1e-3);
        h.quaternion(0.04, q);
        assert.ok(q.angleTo(yawAt(0.04)) < 1e-4, `turn ${q.angleTo(yawAt(0.04))}`);
        h.position(5, p);
        assert.ok(Math.abs(p.x - V * (0.0333 + 0.05)) < 1e-3, 'held at the extrapolation cap');
    });

    it('starts over on a teleport instead of sliding across it', () => {
        const h = flown([0, 0.0167]);
        h.push(0.0333, new THREE.Vector3(50_000, 1000, 0), yawAt(0), new THREE.Vector3(V, 0, 0));
        const p = new THREE.Vector3();
        h.position(0.02, p);
        assert.equal(p.x, 50_000);
    });

    it('shows motion that follows the frame clock under alternating frame times', () => {
        // Frames of 16.7 / 33.3 ms; the sample for a frame lands one frame late.
        const h = new PoseHistory();
        const vel = new THREE.Vector3(V, 0, 0);
        const p = new THREE.Vector3();
        let wall = 0;
        let prevX: number | undefined;
        for (let i = 0; i < 40; i++) {
            const dt = i % 2 ? 1 / 30 : 1 / 60;
            h.push(wall, new THREE.Vector3(V * wall, 0, 0), yawAt(0), vel);
            wall += dt;
            h.position(wall - 1 / 30 - 1 / 120, p);
            if (prevX !== undefined && i > 4) {
                assert.ok(Math.abs((p.x - prevX) / V - dt) < 1e-6, `frame ${i}`);
            }
            prevX = p.x;
        }
    });
});
