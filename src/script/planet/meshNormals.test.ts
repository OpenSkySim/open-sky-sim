import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { faceNormal } from './meshBuilder';

describe('faceNormal', () => {
    it('points +Y for a flat ENU triangle with Martini-style winding', () => {
        const positions = new Float32Array([
            0, 0, 0,
            10, 0, -10,
            10, 0, 0,
        ]);
        const [nx, ny, nz] = faceNormal(positions, 0, 1, 2);
        assert.ok(ny > 0.99, `ny=${ny}`);
        assert.ok(Math.abs(nx) < 1e-5);
        assert.ok(Math.abs(nz) < 1e-5);
    });

    it('tilts west when the east edge is higher', () => {
        const positions = new Float32Array([
            0, 0, 0,
            10, 4, -10,
            10, 4, 0,
        ]);
        const [nx, ny] = faceNormal(positions, 0, 1, 2);
        assert.ok(ny > 0.5, `ny=${ny}`);
        assert.ok(nx < -0.1, `nx=${nx}`);
    });

    it('gives independent face normals (no smoothing across a ridge)', () => {
        // Two tris sharing an edge, opposite slopes.
        const positions = new Float32Array([
            0, 0, 0,
            10, 0, 0,
            5, 4, -5,
            5, 4, 5,
        ]);
        const a = faceNormal(positions, 0, 1, 2);
        const b = faceNormal(positions, 0, 3, 1);
        // Must disagree — smooth shading would average these.
        const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        assert.ok(dot < 0.95, `faces too similar after "smooth": dot=${dot}`);
    });
});
