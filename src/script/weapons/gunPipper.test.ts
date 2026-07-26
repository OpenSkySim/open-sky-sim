import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    computeGunPipperWorldPoint,
    GUN_AIM_DEFAULT_RANGE_M,
    GUN_PROJECTILE_GRAVITY,
    tofForRange,
} from './gunPipper';

describe('tofForRange', () => {
    it('is range divided by speed along the gun axis', () => {
        const forward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 200);
        const tof = tofForRange(forward, gunVel, 1000, 600);
        assert.ok(Math.abs(tof - 600 / 1200) < 1e-6);
    });
});

describe('computeGunPipperWorldPoint', () => {
    it('places the pipper at the bullet position for the target range', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);
        const targetPos = new THREE.Vector3(0, 3000, 500);

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, targetPos,
        );

        const speedAlong = 1220;
        const tof = 500 / speedAlong;
        const expected = new THREE.Vector3(0, 3000 - 0.5 * GUN_PROJECTILE_GRAVITY * tof * tof, 220 * tof + 1000 * tof);
        assert.ok(
            pipper.distanceTo(expected) < 0.5,
            `pipper should match ballistic point at target range, miss=${pipper.distanceTo(expected).toFixed(3)}`,
        );
        // With a level nose, drop puts the pipper below the target altitude.
        assert.ok(pipper.y < targetPos.y);
    });

    it('uses the default range when no target is locked', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, undefined,
        );

        const speedAlong = gunVel.z + 1000;
        const tof = GUN_AIM_DEFAULT_RANGE_M / speedAlong;
        const expectedY = gunPos.y - 0.5 * GUN_PROJECTILE_GRAVITY * tof * tof;
        assert.ok(Math.abs(pipper.y - expectedY) < 0.5, 'expected gravity drop at default range');
        assert.ok(pipper.z > gunPos.z, 'impact should be ahead of the gun');
    });

    it('moves farther along the gun line as target range increases', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);
        const near = new THREE.Vector3();
        const far = new THREE.Vector3();
        computeGunPipperWorldPoint(
            near, gunPos, gunForward, gunVel, 1000, new THREE.Vector3(0, 3000, 300),
        );
        computeGunPipperWorldPoint(
            far, gunPos, gunForward, gunVel, 1000, new THREE.Vector3(0, 3000, 900),
        );
        assert.ok(far.z > near.z, 'longer range should push the pipper farther ahead');
        assert.ok(far.y < near.y, 'longer range should drop farther under gravity');
    });
});
