import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { boostCoastErrors, coastErrorBoost } from './meshBuilder';
import { buildErrorPyramid, extractMesh, getRtinIndex } from './rtin';

/** Left half ocean (0), right half land (100) — a vertical shoreline. */
function coastalHeights(size: number): Float32Array {
    const h = new Float32Array(size * size);
    const mid = (size - 1) >> 1;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            h[y * size + x] = x <= mid ? 0 : 100;
        }
    }
    return h;
}

describe('boostCoastErrors', () => {
    it('forces more triangles along a straight coastline', () => {
        const size = 17;
        const heights = coastalHeights(size);
        const index = getRtinIndex(size);
        const maxError = 50; // would otherwise collapse most of a flat tile

        const plain = buildErrorPyramid(heights, size, index);
        const plainMesh = extractMesh(plain, size, maxError, index);

        const boosted = buildErrorPyramid(heights, size, index);
        boostCoastErrors(heights, boosted, size, 0, coastErrorBoost(maxError), index);
        const coastMesh = extractMesh(boosted, size, maxError, index);

        assert.ok(
            coastMesh.triangleCount > plainMesh.triangleCount,
            `expected coast refine ${coastMesh.triangleCount} > plain ${plainMesh.triangleCount}`,
        );
        // Full grid on an 16×16 cell tile is 512 tris; coast-only should be
        // well below that but far above the unboosted collapse.
        assert.ok(coastMesh.triangleCount < 512);
        assert.ok(coastMesh.triangleCount >= 32);
    });

    it('is a no-op on all-water tiles', () => {
        const size = 9;
        const heights = new Float32Array(size * size); // all 0
        const index = getRtinIndex(size);
        const errors = buildErrorPyramid(heights, size, index);
        const before = errors.slice();
        boostCoastErrors(heights, errors, size, 0, coastErrorBoost(10), index);
        assert.deepEqual(errors, before);
    });

    it('coastErrorBoost always exceeds the extract threshold', () => {
        assert.ok(coastErrorBoost(1) > 1);
        assert.ok(coastErrorBoost(50) > 50);
        assert.ok(coastErrorBoost(0) > 0);
    });
});
