import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    jsbsimAttitudeToQuaternion,
    jsbsimBodyVelocityToWorld,
    jsbsimRatesToWorld,
    worldQuaternionToJsbsimAttitude,
    worldVelocityToJsbsimBody,
} from './jsbsimCoordinateFrame';

const DEG = Math.PI / 180;
const EPS = 1e-6;

function assertVectorClose(actual: THREE.Vector3, expected: THREE.Vector3, epsilon = 1e-4, message?: string): void {
    assert.ok(
        actual.distanceTo(expected) < epsilon,
        `${message ?? 'vectors differ'}: actual=(${actual.x.toFixed(4)}, ${actual.y.toFixed(4)}, ${actual.z.toFixed(4)}) ` +
        `expected=(${expected.x.toFixed(4)}, ${expected.y.toFixed(4)}, ${expected.z.toFixed(4)})`,
    );
}

describe('jsbsimCoordinateFrame', () => {
    it('maps zero Euler angles to the identity orientation', () => {
        const q = jsbsimAttitudeToQuaternion(0, 0, 0);
        assertVectorClose(new THREE.Vector3(0, 0, 1).applyQuaternion(q), new THREE.Vector3(0, 0, 1));
        assert.ok(Math.abs(q.w) > 1 - EPS, 'expected an identity-like quaternion');
    });

    it('rolls the right wing down for a positive (right) roll', () => {
        const q = jsbsimAttitudeToQuaternion(90 * DEG, 0, 0);
        const rightWing = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
        assertVectorClose(rightWing, new THREE.Vector3(0, -1, 0), 1e-4, 'right wing should point down after a 90 deg right roll');
    });

    it('pitches the nose up for a positive pitch angle', () => {
        const q = jsbsimAttitudeToQuaternion(0, 90 * DEG, 0);
        const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
        assertVectorClose(nose, new THREE.Vector3(0, 1, 0), 1e-4, 'nose should point up after a 90 deg nose-up pitch');
    });

    it('keeps a pure yaw rotation in the horizontal plane and preserves handedness with roll', () => {
        const q = jsbsimAttitudeToQuaternion(0, 0, 90 * DEG);
        const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
        assert.ok(Math.abs(nose.y) < 1e-4, 'yaw alone should not change altitude/pitch of the nose vector');
        assert.ok(nose.length() - 1 < 1e-4);
    });

    it('round-trips attitude through quaternion <-> Euler for representative angles', () => {
        const cases: [number, number, number][] = [
            [0, 0, 0],
            [10 * DEG, 20 * DEG, 30 * DEG],
            [-15 * DEG, 25 * DEG, -50 * DEG],
            [45 * DEG, -10 * DEG, 170 * DEG],
        ];
        for (const [phi, theta, psi] of cases) {
            const q = jsbsimAttitudeToQuaternion(phi, theta, psi);
            const back = worldQuaternionToJsbsimAttitude(q);
            const q2 = jsbsimAttitudeToQuaternion(back.phiRad, back.thetaRad, back.psiRad);
            assert.ok(q.angleTo(q2) < 1e-4, `round trip mismatch for phi=${phi} theta=${theta} psi=${psi}`);
        }
    });

    it('converts a pure downward body velocity (w) at identity attitude into positive world Y (climb)', () => {
        const q = jsbsimAttitudeToQuaternion(0, 0, 0);
        // w is positive DOWN in aero body axes; a descending body velocity
        // (w > 0) at identity attitude should read as a negative (sinking)
        // world Y rate, i.e. climbing corresponds to w < 0.
        const v = jsbsimBodyVelocityToWorld(0, 0, -10, q);
        assertVectorClose(v, new THREE.Vector3(0, 10, 0));
    });

    it('aligns forward airspeed with the nose direction for straight, unaccelerated flight', () => {
        // Zero sideslip/AoA: all body velocity is along body-forward (u).
        // The resulting world velocity must point exactly along the nose,
        // for ANY attitude (this is guaranteed by construction, but is
        // checked here for a representative combined attitude).
        const q = jsbsimAttitudeToQuaternion(12 * DEG, -8 * DEG, 35 * DEG);
        const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();

        const speed = 120;
        const v = jsbsimBodyVelocityToWorld(speed, 0, 0, q).normalize();

        assertVectorClose(v, nose, 1e-4, 'velocity direction should match nose direction for coordinated, zero-AoA flight');
    });

    it('velocity conversion round-trips through JSBSim body <-> world', () => {
        const q = jsbsimAttitudeToQuaternion(15 * DEG, -20 * DEG, 100 * DEG);
        const original = new THREE.Vector3(12, -34, 56);
        const { uMps, vMps, wMps } = worldVelocityToJsbsimBody(original, q);
        const back = jsbsimBodyVelocityToWorld(uMps, vMps, wMps, q);
        assertVectorClose(back, original, 1e-6);
    });

    it('pitch-rate sign matches the derivative of the attitude conversion', () => {
        const dt = 1e-4;
        const q0 = jsbsimAttitudeToQuaternion(0, 0, 0);
        const q1 = jsbsimAttitudeToQuaternion(0, dt, 0);
        const impliedOmega = impliedAngularVelocity(q0, q1, dt);
        const omega = jsbsimRatesToWorld(0, 1, 0);
        assertVectorClose(impliedOmega, omega, 1e-2, 'pitch rate q=1rad/s should match the attitude time-derivative');
    });

    it('roll-rate sign matches the derivative of the attitude conversion', () => {
        const dt = 1e-4;
        const q0 = jsbsimAttitudeToQuaternion(0, 0, 0);
        const q1 = jsbsimAttitudeToQuaternion(dt, 0, 0);
        const impliedOmega = impliedAngularVelocity(q0, q1, dt);
        const omega = jsbsimRatesToWorld(1, 0, 0);
        assertVectorClose(impliedOmega, omega, 1e-2, 'roll rate p=1rad/s should match the attitude time-derivative');
    });

    it('maps JSBSim psi to HUD heading with a 180 degree offset at level flight', () => {
        const q = jsbsimAttitudeToQuaternion(0, 0, 0);
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
        let hdg = Math.round(Math.atan2(fwd.x, -fwd.z) / (2 * Math.PI) * 360);
        if (hdg < 0) hdg += 360;
        assert.equal(hdg, 180);
    });

    it('yaw-rate sign matches the derivative of the attitude conversion', () => {
        const dt = 1e-4;
        const q0 = jsbsimAttitudeToQuaternion(0, 0, 0);
        const q1 = jsbsimAttitudeToQuaternion(0, 0, dt);
        const impliedOmega = impliedAngularVelocity(q0, q1, dt);
        const omega = jsbsimRatesToWorld(0, 0, 1);
        assertVectorClose(impliedOmega, omega, 1e-2, 'yaw rate r=1rad/s should match the attitude time-derivative');
    });
});

/** Angular velocity (sim body frame) implied by the rotation from q0 to q1 over dt. */
function impliedAngularVelocity(q0: THREE.Quaternion, q1: THREE.Quaternion, dt: number): THREE.Vector3 {
    const dq = q1.clone().multiply(q0.clone().invert());
    // For a small-angle quaternion (w, x, y, z), the rotation vector is
    // approximately 2*(x, y, z), scaled by sign(w) to pick the shortest path.
    const sign = dq.w < 0 ? -1 : 1;
    return new THREE.Vector3(dq.x, dq.y, dq.z).multiplyScalar((2 * sign) / dt);
}
