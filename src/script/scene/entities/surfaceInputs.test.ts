import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { newSurfaceInputs, spinAngle, surfaceValue } from './surfaceInputs';

describe('spinAngle', () => {
    it('turns at the given rate, signed, within one turn', () => {
        assert.ok(Math.abs(spinAngle(2, 0.5) - 1) < 1e-12);
        assert.ok(Math.abs(spinAngle(-2, 0.5) + 1) < 1e-12);
        const a = spinAngle(12, 1000);
        assert.ok(Math.abs(a) < 2 * Math.PI);
    });

    it('is not driven by the pilot inputs', () => {
        assert.equal(surfaceValue(newSurfaceInputs(), 'spin', 1), 0);
    });
});
