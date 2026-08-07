import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyFlattenPad, padBlendWeight, FlattenPadSpec } from './flattenPad';
import { TerrainTone, toneForTriangle } from './meshBuilder';

describe('flattenPad', () => {
    const pad: FlattenPadSpec = {
        centerX: 0,
        centerZ: 0,
        halfW: 100,
        halfD: 200,
        featherM: 20,
    };

    it('is fully blended at the centre', () => {
        assert.equal(padBlendWeight(0, 0, pad), 1);
    });

    it('is zero outside the pad', () => {
        assert.equal(padBlendWeight(200, 0, pad), 0);
        assert.equal(padBlendWeight(0, 300, pad), 0);
    });

    it('ramps across the feather', () => {
        const edge = padBlendWeight(90, 0, pad); // inside feather (halfW=100, feather=20 → core at 80)
        assert.ok(edge > 0 && edge < 1, `edge=${edge}`);
    });

    it('applyFlattenPad lerps toward the pad height', () => {
        const h = applyFlattenPad(50, 0, 0, pad, 10);
        assert.equal(h, 10);
        const outside = applyFlattenPad(50, 500, 0, pad, 10);
        assert.equal(outside, 50);
    });

    it('is a no-op without a pad', () => {
        assert.equal(applyFlattenPad(50, 0, 0, undefined, undefined), 50);
    });
});

describe('toneForTriangle', () => {
    it('paints majority-water triangles as water (coarse coast wedges)', () => {
        // One mountain vertex + two sea vertices — the classic blocky-land bug.
        assert.equal(toneForTriangle(0, 0, 800, 0), TerrainTone.Water);
        assert.equal(toneForTriangle(0, 1200, 0, 0), TerrainTone.Water);
    });

    it('does not paint low beach land as shallow water', () => {
        assert.equal(toneForTriangle(0, 0, 5, 0), TerrainTone.Water);
        assert.equal(toneForTriangle(3, 5, 8, 0), TerrainTone.Grass);
        assert.equal(toneForTriangle(0, 4, 6, 0), TerrainTone.Grass);
    });

    it('keeps elevated inland triangles as solid grass green', () => {
        assert.equal(toneForTriangle(50, 60, 70, 0), TerrainTone.Grass);
        assert.equal(toneForTriangle(200, 400, 900, 0), TerrainTone.Grass);
    });

    it('paints all-water triangles as water', () => {
        assert.equal(toneForTriangle(0, 0, 0, 0), TerrainTone.Water);
        assert.equal(toneForTriangle(-1, 0.2, 0, 0), TerrainTone.Water);
    });

    it('paints open water near shore by distance as shallow', () => {
        assert.equal(toneForTriangle(0, 0, 0, 0, 0, [10, 20, 30]), TerrainTone.ShallowWater);
        assert.equal(toneForTriangle(0, 0, 0, 0, 0, [200, 300, 400]), TerrainTone.Water);
    });
});
