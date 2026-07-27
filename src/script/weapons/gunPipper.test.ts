import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    bulletPositionAtTime,
    computeGunPipperWorldPoint,
    GUN_AIM_DEFAULT_RANGE_M,
    tofForRange,
} from './gunPipper';

describe('tofForRange', () => {
    it('matches range / |bulletVel| for a level in-trail shot', () => {
        const forward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 200);
        const tof = tofForRange(forward, gunVel, 1000, 600);
        // |V| = 1200; gravity path stretch is negligible over 0.5 s.
        assert.ok(Math.abs(tof - 600 / 1200) < 1e-3);
    });

    it('uses full bullet speed, not only the nose component', () => {
        // Large lateral shooter velocity: old speedAlongGun ignored it.
        const forward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(300, 0, 0);
        const tof = tofForRange(forward, gunVel, 1000, 500);
        const speed = Math.hypot(300, 1000);
        assert.ok(Math.abs(tof - 500 / speed) < 1e-3);
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

        const range = targetPos.distanceTo(gunPos);
        const tof = tofForRange(gunForward, gunVel, 1000, range);
        const bulletVel = new THREE.Vector3(0, 0, 1220);
        const expected = new THREE.Vector3();
        bulletPositionAtTime(expected, gunPos, bulletVel, tof);
        assert.ok(
            pipper.distanceTo(expected) < 0.5,
            `pipper should match ballistic point at target range, miss=${pipper.distanceTo(expected).toFixed(3)}`,
        );
        // With a level nose, drop puts the pipper below the target altitude.
        assert.ok(pipper.y < targetPos.y);
    });

    it('matches muzzle-to-pipper distance to target range', () => {
        const gunPos = new THREE.Vector3(10, 3000, -5);
        const gunForward = new THREE.Vector3(0.1, 0.05, 1).normalize();
        const gunVel = new THREE.Vector3(50, -10, 200);
        const targetPos = new THREE.Vector3(40, 3050, 450);
        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, targetPos,
        );
        const range = targetPos.distanceTo(gunPos);
        const travelled = pipper.distanceTo(gunPos);
        assert.ok(
            Math.abs(travelled - range) < 1,
            `path distance should match target range: travelled=${travelled.toFixed(2)} range=${range.toFixed(2)}`,
        );
    });

    it('uses the default range when no target is locked', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);

        const pipper = new THREE.Vector3();
        computeGunPipperWorldPoint(
            pipper, gunPos, gunForward, gunVel, 1000, undefined,
        );

        assert.ok(
            Math.abs(pipper.distanceTo(gunPos) - GUN_AIM_DEFAULT_RANGE_M) < 1,
            'no-lock pipper should sit at the default range along the path',
        );
        assert.ok(pipper.y < gunPos.y, 'expected gravity drop');
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

    it('is safe when out and targetPos alias the same vector', () => {
        const gunPos = new THREE.Vector3(0, 3000, 0);
        const gunForward = new THREE.Vector3(0, 0, 1);
        const gunVel = new THREE.Vector3(0, 0, 220);
        const buf = new THREE.Vector3(0, 3000, 500);
        const range = buf.distanceTo(gunPos);
        computeGunPipperWorldPoint(buf, gunPos, gunForward, gunVel, 1000, buf);
        assert.ok(Math.abs(buf.distanceTo(gunPos) - range) < 1);
        assert.ok(buf.y < 3000);
    });
});
