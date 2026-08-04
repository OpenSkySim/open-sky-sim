import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SurfacePadCollider, sampleSurfacePadY, sampleSurfacePadYMax } from './surfacePad';

describe('surface pad', () => {
    const pad: SurfacePadCollider = {
        centerX: 100,
        centerZ: -200,
        heading: 0,
        halfLength: 1500,
        halfWidth: 40,
        surfaceY: 51.5,
        baseY: 50,
        feather: 15,
    };

    it('returns the surface top everywhere inside the pad', () => {
        assert.equal(sampleSurfacePadY(100, -200, pad), 51.5);
        assert.equal(sampleSurfacePadY(100 + 40, -200 - 1500, pad), 51.5);
        assert.equal(sampleSurfacePadY(100 - 39, -200 + 1499, pad), 51.5);
    });

    it('ramps down to the base height across the feather skirt', () => {
        const midSkirt = sampleSurfacePadY(100 + 40 + 7.5, -200, pad);
        assert.ok(Math.abs(midSkirt - 50.75) < 1e-6, `expected mid-skirt blend, got ${midSkirt}`);
        const nearEdge = sampleSurfacePadY(100, -200 - 1500 - 14.99, pad);
        assert.ok(nearEdge > 50 && nearEdge < 50.1, 'skirt end approaches baseY');
    });

    it('returns -Infinity outside the footprint plus skirt', () => {
        assert.equal(sampleSurfacePadY(100 + 56, -200, pad), -Infinity);
        assert.equal(sampleSurfacePadY(100, -200 + 1516, pad), -Infinity);
    });

    it('respects the pad heading when rotating into local space', () => {
        const rotated: SurfacePadCollider = { ...pad, centerX: 0, centerZ: 0, heading: Math.PI / 2 };
        // Heading pi/2: pad long axis lies along world X.
        assert.equal(sampleSurfacePadY(1400, 0, rotated), 51.5);
        assert.equal(sampleSurfacePadY(0, 1400, rotated), -Infinity);
    });

    it('sampleSurfacePadYMax picks the highest overlapping pad', () => {
        const low: SurfacePadCollider = { ...pad, surfaceY: 50.5 };
        assert.equal(sampleSurfacePadYMax(100, -200, [low, pad]), 51.5);
        assert.equal(sampleSurfacePadYMax(0, 5000, [low, pad]), -Infinity);
        assert.equal(sampleSurfacePadYMax(0, 0, []), -Infinity);
    });
});
