import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCoastDistanceGrid, demTileIsCoastal } from './coast';

describe('coast', () => {
    it('detects mixed land/water tiles', () => {
        const land = new Float32Array([100, 100, 100, 100]);
        const water = new Float32Array([0, 0, 0, 0]);
        const mixed = new Float32Array([0, 0, 100, 100]);
        assert.equal(demTileIsCoastal(land, 0), false);
        assert.equal(demTileIsCoastal(water, 0), false);
        assert.equal(demTileIsCoastal(mixed, 0), true);
    });

    it('buildCoastDistanceGrid marks shoreline at zero', () => {
        const size = 4;
        const heights = new Float32Array(size * size);
        // Left half water, right half land.
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                heights[y * size + x] = x < 2 ? 0 : 50;
            }
        }
        const dist = buildCoastDistanceGrid(heights, size, 0);
        assert.equal(dist[1 * size + 1], 0); // water side of boundary
        assert.equal(dist[1 * size + 2], 0); // land side of boundary
        assert.ok(dist[1 * size + 0] > 0); // interior water
        assert.ok(dist[1 * size + 3] > 0); // interior land
    });
});
