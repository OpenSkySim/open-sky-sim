import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildErrorPyramid, extractMesh, getRtinIndex, triangulate } from './rtin';

describe('rtin', () => {
    it('rejects non 2^k+1 sizes', () => {
        assert.throws(() => getRtinIndex(256));
        assert.throws(() => getRtinIndex(100));
    });

    it('collapses a flat tile to 2 triangles', () => {
        const size = 17;
        const heights = new Float32Array(size * size).fill(100);
        const mesh = triangulate(heights, size, 1);
        assert.equal(mesh.triangleCount, 2);
        assert.equal(mesh.vertices.length / 2, 4);
    });

    it('emits a full grid when maxError is 0 on varied terrain', () => {
        const size = 9;
        const heights = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                heights[y * size + x] = Math.sin(x * 0.7) * 50 + Math.cos(y * 0.5) * 40;
            }
        }
        const mesh = triangulate(heights, size, 0);
        // Full subdivision of an 8×8 cell grid → 8*8*2 = 128 triangles.
        assert.equal(mesh.triangleCount, 128);
    });

    it('keeps extracted mesh error under the threshold', () => {
        const size = 17;
        const heights = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                heights[y * size + x] = (x * 13 + y * 7) % 97;
            }
        }
        const index = getRtinIndex(size);
        const errors = buildErrorPyramid(heights, size, index);
        const maxError = 5;
        const mesh = extractMesh(errors, size, maxError, index);

        // Every discarded midpoint (not present as a vertex) must have had
        // error ≤ maxError — equivalently, every vertex that IS present at an
        // odd grid point either is a corner or had error > 0. We check that
        // no triangle's hypotenuse midpoint (if not a vertex) exceeds maxError.
        const used = new Set<string>();
        for (let i = 0; i < mesh.vertices.length; i += 2) {
            used.add(`${mesh.vertices[i]},${mesh.vertices[i + 1]}`);
        }
        for (let t = 0; t < mesh.triangleCount; t++) {
            const a = mesh.triangles[t * 3];
            const b = mesh.triangles[t * 3 + 1];
            const ax = mesh.vertices[a * 2], ay = mesh.vertices[a * 2 + 1];
            const bx = mesh.vertices[b * 2], by = mesh.vertices[b * 2 + 1];
            // Hypotenuse is the longest edge; in RTIN it's a–b of the leaf.
            const mx = (ax + bx) >> 1;
            const my = (ay + by) >> 1;
            if (mx === ax && my === ay) {
                continue;
            }
            if (!used.has(`${mx},${my}`)) {
                assert.ok(
                    errors[my * size + mx] <= maxError,
                    `midpoint (${mx},${my}) error ${errors[my * size + mx]} > ${maxError}`,
                );
            }
        }
    });

    it('produces indices in range', () => {
        const size = 9;
        const heights = new Float32Array(size * size);
        for (let i = 0; i < heights.length; i++) {
            heights[i] = (i % 7) * 10;
        }
        const mesh = triangulate(heights, size, 2);
        const vCount = mesh.vertices.length / 2;
        for (let i = 0; i < mesh.triangles.length; i++) {
            assert.ok(mesh.triangles[i] < vCount);
        }
    });
});
