import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLeafTile, isPastLeaf, leafZoomOf } from './leafZoom';
import { tileAtLonLat } from './tiling';

// Mallorca, snapped to z11 tile edges.
const MALLORCA = { name: 'Mallorca', west: 2.28515625, south: 39.111328125, east: 3.515625, north: 40.078125, leafZoom: 11 };
const KANAREN = { name: 'Kanaren', west: -18.5009765625, south: 27.333984375, east: -12.7001953125, north: 30.2783203125 };

describe('leafZoomOf', () => {
    it('is the pyramid maxZoom where no area caps it', () => {
        const at = leafZoomOf([KANAREN], 12);
        assert.equal(at(tileAtLonLat(12, -15.4, 27.9)), 12);
        assert.equal(leafZoomOf(undefined, 12)(tileAtLonLat(12, 2.7, 39.6)), 12);
    });

    it('is the area cap for tiles whose centre lies inside it', () => {
        const at = leafZoomOf([KANAREN, MALLORCA], 12);
        const palma11 = tileAtLonLat(11, 2.65, 39.57);
        assert.equal(at(palma11), 11);
        assert.ok(isLeafTile(at, palma11));
        assert.ok(isPastLeaf(at, tileAtLonLat(12, 2.65, 39.57)));
        assert.ok(!isLeafTile(at, tileAtLonLat(10, 2.65, 39.57)));
        assert.ok(isLeafTile(at, tileAtLonLat(12, -15.4, 27.9)));
    });

    it('reads caps off a merged area\'s parts, a capped part winning over an uncapped one', () => {
        const { name: _, leafZoom: __, ...box } = MALLORCA;
        const malle2 = {
            name: 'Malle2', west: 0.52734375, south: 38.4521484375, east: 4.7900390625, north: 40.2978515625,
            parts: [
                { west: 0.52734375, south: 38.4521484375, east: 4.7900390625, north: 40.2978515625 },
                { ...box, leafZoom: 11 },
            ],
        };
        const at = leafZoomOf([malle2], 12);
        assert.equal(at(tileAtLonLat(12, 2.65, 39.57)), 11);
        assert.equal(at(tileAtLonLat(12, 1.43, 38.98)), 12); // Ibiza
    });

    it('ignores a cap at or above maxZoom, and a lowered maxZoom wins', () => {
        assert.equal(leafZoomOf([{ ...MALLORCA, leafZoom: 12 }], 12)(tileAtLonLat(12, 2.65, 39.57)), 12);
        assert.equal(leafZoomOf([MALLORCA], 10)(tileAtLonLat(10, 2.65, 39.57)), 10);
    });
});
