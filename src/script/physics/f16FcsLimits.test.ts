import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    clampLoadFactorAcceleration,
    computeF16EnvelopeAuthority,
    computeF16PitchGLimit,
    computeLoadFactorG,
} from './f16FcsLimits';

describe('F-16 FCS g limits', () => {
    it('fades pitch pull authority in the last g below the cap', () => {
        assert.equal(computeF16PitchGLimit(8, 1, 9.5), 1);
        assert.equal(computeF16PitchGLimit(9.5, 1, 9.5), 0);
        assert.ok(Math.abs(computeF16PitchGLimit(9, 1, 9.5) - 0.5) < 1e-6);
        assert.equal(computeF16PitchGLimit(9.5, -1, 9.5), 1);
    });

    it('fades envelope authority linearly near the cap', () => {
        assert.equal(computeF16EnvelopeAuthority(8.4, 9.5), 1);
        assert.equal(computeF16EnvelopeAuthority(9.5, 9.5), 0);
    });

    it('clamps acceleration so load factor never exceeds 9.5g', () => {
        const up = new THREE.Vector3(0, 1, 0);
        const accel = new THREE.Vector3(0, 120, 0);
        clampLoadFactorAcceleration(accel, up, 9.5);
        assert.ok(computeLoadFactorG(accel, up) <= 9.5 + 1e-6);
    });

    it('leaves sub-limit acceleration unchanged', () => {
        const up = new THREE.Vector3(0, 1, 0);
        const accel = new THREE.Vector3(0, 40, 0);
        const before = accel.clone();
        clampLoadFactorAcceleration(accel, up, 9.5);
        assert.ok(accel.distanceTo(before) < 1e-6);
    });
});
