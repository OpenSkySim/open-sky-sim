import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RealisticFlightModel } from './model/realisticFlightModel';
import { PLANE_DISTANCE_TO_GROUND } from '../defs';

describe('F-16 realistic landing', () => {
    it('does not snap to deep-stall AOA during low-speed ground roll', () => {
        const model = new RealisticFlightModel();
        model.reset();
        model.position.set(1500, PLANE_DISTANCE_TO_GROUND, -1160);
        model.setThrottle(1.0);
        model.setFlapsExtended(true);
        model.setPitch(0.75);

        for (let i = 0; i < 120; i++) {
            model.update(1 / 60);
        }

        const aoaDeg = Math.abs(model.getAngleOfAttack()) * (180 / Math.PI);
        assert.ok(aoaDeg < 35, `expected moderate AOA during roll, got ${aoaDeg.toFixed(1)}°`);
    });

    it('can land without crash on a stabilized approach', () => {
        const model = new RealisticFlightModel();
        model.reset();
        model.position.set(1500, PLANE_DISTANCE_TO_GROUND, -1160);
        model.setFlapsExtended(true);
        model.setLandingGearDeployed(true);
        model.setThrottle(1.0);
        model.setPitch(0.75);

        for (let i = 0; i < 2400; i++) {
            model.update(1 / 60);
        }

        model.setThrottle(0.45);
        model.setPitch(0.15);
        for (let i = 0; i < 8400; i++) {
            model.update(1 / 60);
        }

        model.setThrottle(0.15);
        model.setPitch(0.08);

        for (let i = 0; i < 12000; i++) {
            model.update(1 / 60);
            if (model.isCrashed()) {
                assert.fail(`crashed at y=${model.position.y.toFixed(1)} vy=${model.velocityVector.y.toFixed(1)}`);
            }
            if (model.isLanded()) {
                assert.ok(model.velocityVector.length() < 95);
                return;
            }
        }

        assert.fail('approach did not land within time limit');
    });
});
