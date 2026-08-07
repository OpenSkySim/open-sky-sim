import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { inflateSync } from 'fflate';
import { decodePdm, encodePdmUncompressed, lonLatToUv, sampleBilinear } from './demTile';
import { tileBounds } from './tiling';

/**
 * PDM rows are north-first (row 0 = north edge). These tests guard against
 * accidental north/south flips in sampling or mesh placement.
 */
describe('DEM north/south orientation', () => {
    it('samples row 0 at the north edge and the last row at the south edge', () => {
        const size = 5;
        const heights = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                heights[y * size + x] = y === 0 ? 1000 : y === size - 1 ? 10 : 500;
            }
        }
        const tile = decodePdm(encodePdmUncompressed(heights, size));
        const b = { west: 0, south: 0, east: 1, north: 1 };
        const north = sampleBilinear(tile, 0.5, lonLatToUv(0.5, b.north, b.west, b.south, b.east, b.north).v);
        const south = sampleBilinear(tile, 0.5, lonLatToUv(0.5, b.south, b.west, b.south, b.east, b.north).v);
        assert.ok(north > south + 100, `north=${north} south=${south}`);
    });

    it('matches the baked Canary Islands tile against the source raster ordering', () => {
        const id = { z: 13, x: 7372, y: 2832 };
        const path = `assets/planet/${id.z}/${id.x}/${id.y}.pdm`;
        if (!fs.existsSync(path)) {
            return;
        }
        const tile = decodePdm(inflateSync(fs.readFileSync(path)));
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const north = sampleBilinear(
            tile,
            0.5,
            lonLatToUv(lon, b.north, b.west, b.south, b.east, b.north).v,
        );
        const south = sampleBilinear(
            tile,
            0.5,
            lonLatToUv(lon, b.south, b.west, b.south, b.east, b.north).v,
        );
        // Source GeoTIFF: north edge ~69 m, south edge ~341 m on this tile.
        assert.ok(north < south - 50, `expected higher ground south; north=${north} south=${south}`);
    });
});
