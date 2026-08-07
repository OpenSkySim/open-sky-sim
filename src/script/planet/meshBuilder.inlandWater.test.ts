import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LWM_WATER } from './coastMask';
import { makeEnuBasis } from './geodesy';
import { buildTileMesh } from './meshBuilder';

const SIZE = 17;
const basis = makeEnuBasis(28, -15, 0);

function buildWithMask(heights: Float32Array, landMask: Uint8Array) {
    return buildTileMesh({
        id: { z: 10, x: 512, y: 256 },
        heights,
        size: SIZE,
        geometricErrorM: 1,
        maxErrorM: 1,
        seaLevel: 0,
        basis,
        landMask,
    });
}

describe('buildTileMesh inland water', () => {
    it('still applies depth bias on open-ocean tiles', () => {
        const heights = new Float32Array(SIZE * SIZE).fill(0);
        const landMask = new Uint8Array(SIZE * SIZE).fill(LWM_WATER);

        const mesh = buildWithMask(heights, landMask);
        let minY = Infinity;
        for (let i = 0; i < mesh.positions.length; i += 3) {
            minY = Math.min(minY, mesh.positions[i + 1]);
        }
        // Skirt bottoms aside, surface ocean verts sit below centre by depth bias.
        assert.ok(minY < -0.4, `expected ocean depth bias, minY=${minY}`);
    });
});
