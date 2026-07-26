import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    computeGunPipperWorldPoint,
    GUN_AIM_DEFAULT_RANGE_M,
    GUN_PROJECTILE_GRAVITY,
    solveGunInterceptTime,
} from './gunPipper';

describe('solveGunInterceptTime', () => {
    it('lengthens time-of-flight when the target is moving away', () => {
        const relPos = new THREE.Vector3(0, 0, 900);
        const relVel = new THREE.Vector3(0, 0, 200);
        const tof = solveGunInterceptTime(relPos, relVel, 1000);
        assert.ok(tof > 0.9 && tof < 1.5);
    });

    it('shortens time-of-flight when the target is closing', () => {
        const relPos = new THREE.Vector3(0, 0, 900);
        const relVel = new THREE.Vector3(0, 0, -200);
        const tof = solveGunInterceptTime(relPos, relVel, 1000);
        assert.ok(tof > 0.7 && tof < 0.9);
    });
});

describe('computeGunPipperWorldPoint', () => {
    it('overlays the target when the nose points at a perfect in-trail solution', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);
        const targetPos = new THREE.Vector3(0, 3000, 500);
        const targetVel = new THREE.Vector3(0, 0, 220);
        // Perfect solution: nose lofted for gravity hold-over at ~0.5 s TOF.
        const tof = 500 / 1000;
        const holdOver = 0.5 * GUN_PROJECTILE_GRAVITY * tof * tof;
        gunForward.set(0, holdOver, 500).normalize();

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, targetPos, targetVel,
        );

        assert.ok(
            pipper.distanceTo(targetPos) < 20,
            `pipper should sit on target when on solution, miss=${pipper.distanceTo(targetPos).toFixed(2)}`,
        );
    });

    it('leads a crossing target away from the raw target position', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);
        const targetPos = new THREE.Vector3(0, 3000, 500);
        const targetVel = new THREE.Vector3(200, 0, 220);

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, targetPos, targetVel,
        );

        assert.ok(
            Math.abs(pipper.x - targetPos.x) > 30,
            'crossing target should shift the pipper laterally for lead',
        );
    });

    it('drops below the gun line at the default range with no target', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, undefined, undefined,
        );

        const speedAlong = gunVel.z + 1000;
        const tof = GUN_AIM_DEFAULT_RANGE_M / speedAlong;
        const expectedY = gunPos.y - 0.5 * GUN_PROJECTILE_GRAVITY * tof * tof;
        assert.ok(Math.abs(pipper.y - expectedY) < 0.5, 'expected gravity drop at default range');
        assert.ok(pipper.z > gunPos.z, 'impact should be ahead of the gun');
    });
});
