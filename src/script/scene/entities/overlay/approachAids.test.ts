import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { AIRBASE_RUNWAY, RUNWAY_HALF_LENGTH_M } from '../../../defs';
import {
    aoaIndexerCue,
    CARRIER_AOA_ON_SPEED_MAX_DEG,
    CARRIER_AOA_ON_SPEED_MIN_DEG,
    CARRIER_APPROACH_SPEED_KIAS,
    carrierApproachTargetSpeed,
    computeIlsDeviation,
    ILS_GLIDESLOPE_DEG,
    isIlsApproachTarget,
} from './approachAids';

describe('approachAids', () => {
    it('detects airbase and carrier as ILS targets', () => {
        assert.equal(isIlsApproachTarget({
            position: new THREE.Vector3(),
            localCenter: new THREE.Vector3(),
            maxSize: 1,
            targetType: 'Airbase',
            targetLocation: 'x',
            airborne: false,
        }), true);
        assert.equal(isIlsApproachTarget({
            position: new THREE.Vector3(),
            localCenter: new THREE.Vector3(),
            maxSize: 1,
            targetType: 'Carrier',
            targetLocation: 'x',
            airborne: false,
        }), true);
        assert.equal(isIlsApproachTarget({
            position: new THREE.Vector3(),
            localCenter: new THREE.Vector3(),
            maxSize: 1,
            targetType: 'SAM Radar',
            targetLocation: 'x',
            airborne: false,
        }), false);
        assert.equal(isIlsApproachTarget({
            position: new THREE.Vector3(),
            localCenter: new THREE.Vector3(),
            maxSize: 1,
            targetType: 'Airbase',
            targetLocation: 'x',
            airborne: true,
        }), false);
    });

    it('AoA indexer is on-speed only in the 8.0–8.5 band', () => {
        assert.equal(aoaIndexerCue(7.9), 'fast');
        assert.equal(aoaIndexerCue(8.0), 'onSpeed');
        assert.equal(aoaIndexerCue(8.25), 'onSpeed');
        assert.equal(aoaIndexerCue(8.5), 'onSpeed');
        assert.equal(aoaIndexerCue(8.6), 'slow');
        assert.ok(CARRIER_AOA_ON_SPEED_MIN_DEG === 8.0);
        assert.ok(CARRIER_AOA_ON_SPEED_MAX_DEG === 8.5);
    });

    it('carrier approach target speed is mid-band KIAS', () => {
        assert.equal(CARRIER_APPROACH_SPEED_KIAS, 137);
        assert.equal(carrierApproachTargetSpeed(true), 137);
        assert.equal(carrierApproachTargetSpeed(false), Math.round(137 * 0.514444 * 3.6));
        assert.equal(ILS_GLIDESLOPE_DEG, 3.0);
    });

    it('airbase ILS is near zero on the 3° path', () => {
        const touchZ = AIRBASE_RUNWAY.z - RUNWAY_HALF_LENGTH_M + 200;
        const dist = 2000;
        const pos = new THREE.Vector3(
            AIRBASE_RUNWAY.x,
            dist * Math.tan((ILS_GLIDESLOPE_DEG * Math.PI) / 180),
            touchZ - dist,
        );
        const d = computeIlsDeviation(pos, 'Airbase');
        assert.ok(d);
        assert.ok(Math.abs(d!.localizer) < 0.05, `loc ${d!.localizer}`);
        assert.ok(Math.abs(d!.glideslope) < 0.05, `gs ${d!.glideslope}`);
    });

    it('airbase ILS deflects when right of course', () => {
        const touchZ = AIRBASE_RUNWAY.z - RUNWAY_HALF_LENGTH_M + 200;
        const pos = new THREE.Vector3(AIRBASE_RUNWAY.x + 90, 100, touchZ - 2000);
        const d = computeIlsDeviation(pos, 'Airbase');
        assert.ok(d);
        // Right of course → fly left → negative localizer.
        assert.ok(d!.localizer < -0.5, `loc ${d!.localizer}`);
    });
});
