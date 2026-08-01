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
            aircraftPos, aircraftQuat, () => 14,
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
            aircraftPos, aircraftQuat, () => 0,
            pos, quat, scale, tmp,
        );
        assert.ok(scale.z < 0.6, `expected foreshortened length, got ${scale.z}`);
        assert.ok(Math.abs(scale.x - 1) < 1e-6, 'width unchanged by pitch');
    });

    it('aligns heading with projected forward', () => {
        const aircraftPos = new THREE.Vector3(0, 20, 0);
        const aircraftQuat = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2);
        setAircraftShadowPose(
            aircraftPos, aircraftQuat, () => 0,
            pos, quat, scale, tmp,
        );
        const shadowFwd = tmp.copy(FORWARD).applyQuaternion(quat);
        assert.ok(Math.abs(shadowFwd.x - 1) < 1e-5, `expected +X heading, got ${shadowFwd.toArray()}`);
    });
});
