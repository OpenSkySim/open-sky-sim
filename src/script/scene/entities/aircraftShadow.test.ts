import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { FORWARD, RIGHT, UP } from '../../utils/math';
import { setAircraftShadowPose, SHADOW_SURFACE_EPSILON_M } from './aircraftShadow';

describe('setAircraftShadowPose', () => {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    it('places the shadow on dynamic ground height under the aircraft', () => {
        const aircraftPos = new THREE.Vector3(10, 50, -20);
        const aircraftQuat = new THREE.Quaternion();
        setAircraftShadowPose(
            aircraftPos, aircraftQuat, () => 14, 8,
            pos, quat, scale, tmp,
        );
        assert.equal(pos.x, 10);
        assert.equal(pos.y, 14 + SHADOW_SURFACE_EPSILON_M);
        assert.equal(pos.z, -20);
        assert.ok(Math.abs(scale.x - 1) < 1e-6);
        assert.ok(Math.abs(scale.z - 1) < 1e-6);
    });

    it('squashes length when pitched nose-up', () => {
        const aircraftPos = new THREE.Vector3(0, 100, 0);
        const aircraftQuat = new THREE.Quaternion().setFromAxisAngle(RIGHT, Math.PI / 3);
        setAircraftShadowPose(
            aircraftPos, aircraftQuat, () => 0, 8,
            pos, quat, scale, tmp,
        );
        assert.ok(scale.z < 0.6, `expected foreshortened length, got ${scale.z}`);
        assert.ok(Math.abs(scale.x - 1) < 1e-6, 'width unchanged by pitch');
    });

    it('aligns heading with projected forward', () => {
        const aircraftPos = new THREE.Vector3(0, 20, 0);
        const aircraftQuat = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2);
        setAircraftShadowPose(
            aircraftPos, aircraftQuat, () => 0, 8,
            pos, quat, scale, tmp,
        );
        const shadowFwd = tmp.copy(FORWARD).applyQuaternion(quat);
        assert.ok(Math.abs(shadowFwd.x - 1) < 1e-5, `expected +X heading, got ${shadowFwd.toArray()}`);
    });

    it('tilts onto the local ground slope', () => {
        // Ground rising 1 m per 2 m of +X: a 26.5 degree bank of the silhouette.
        const ground = (x: number, _z: number) => 0.5 * x;
        setAircraftShadowPose(
            new THREE.Vector3(0, 40, 0), new THREE.Quaternion(), ground, 10,
            pos, quat, scale, tmp,
        );
        const normal = tmp.copy(UP).applyQuaternion(quat);
        const expected = new THREE.Vector3(-0.5, 1, 0).normalize();
        assert.ok(normal.distanceTo(expected) < 1e-5,
            `expected slope normal ${expected.toArray()}, got ${normal.toArray()}`);
    });

    it('clears every corner of the footprint over a ridge', () => {
        // A ridge running along Z: the fitted plane is level, so a horizontal
        // placement at the centre height would bury the crest.
        const ground = (x: number, _z: number) => 20 - Math.abs(x);
        const radius = 10;
        setAircraftShadowPose(
            new THREE.Vector3(0, 60, 0), new THREE.Quaternion(), ground, radius,
            pos, quat, scale, tmp,
        );
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
            tmp.copy(UP).applyQuaternion(quat), pos);
        for (const dx of [-radius, 0, radius]) {
            for (const dz of [-radius, 0, radius]) {
                const p = new THREE.Vector3(dx, ground(dx, dz), dz);
                assert.ok(plane.distanceToPoint(p) < 0,
                    `ground at (${dx}, ${dz}) pokes through the shadow plane`);
            }
        }
    });

    it('keeps the single-sample placement when the footprint is degenerate', () => {
        setAircraftShadowPose(
            new THREE.Vector3(0, 60, 0), new THREE.Quaternion(), (x) => 0.5 * x, 0,
            pos, quat, scale, tmp,
        );
        assert.equal(pos.y, SHADOW_SURFACE_EPSILON_M);
        const normal = tmp.copy(UP).applyQuaternion(quat);
        assert.ok(normal.distanceTo(UP) < 1e-9, 'no tilt without a footprint');
    });
});
