import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeEnuBasis } from './geodesy';
import { tileAtLonLat } from './tiling';
import { tileOriginWorld } from './tileMesh';

const HOME = { lat: 28.0015, lon: -15.3937 };
const BASIS = makeEnuBasis(HOME.lat, HOME.lon, 0);
const Z = 9;

/** Where a tile holding a point `dLat`/`dLon` from home is placed. */
function originNear(dLat: number, dLon: number) {
    return tileOriginWorld(tileAtLonLat(Z, HOME.lon + dLon, HOME.lat + dLat), 0, BASIS);
}

describe('tileOriginWorld', () => {
    /**
     * Placement has to agree with the axes the vertices inside the tile are
     * baked in, and both have to agree with the compass. Get the sign wrong
     * and the terrain still tiles seamlessly — as a mirror image of the
     * world it is supposed to be. See `sceneFromEnu`.
     */
    it('places a northern tile at negative z and an eastern one at positive x', () => {
        const north = originNear(0.5, 0);
        const east = originNear(0, 0.5);
        assert.ok(north.z < 0, `tile to the north sits at z ${north.z}`);
        assert.ok(east.x > 0, `tile to the east sits at x ${east.x}`);
    });

    it('is symmetric about the origin', () => {
        const north = originNear(0.5, 0);
        const south = originNear(-0.5, 0);
        assert.ok(north.z < 0 && south.z > 0, `${north.z} / ${south.z}`);
    });
});
