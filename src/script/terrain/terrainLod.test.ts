import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HeightSource } from './heightSource';
import { analyzeTileLod, classifyTileLod, tileHeightRangeM } from './terrainLod';
import { TileId, tileBounds } from './tileId';

function fakeSource(heightAt: (lon: number, lat: number) => number): HeightSource {
    return {
        heightAt,
        rawHeightAt: heightAt,
        maxZoomAt: () => 9,
        coversTile: () => true,
    };
}

const tile: TileId = { z: 8, x: 100, y: 50 };

describe('classifyTileLod', () => {
    it('labels mixed water/land as coast', () => {
        let n = 0;
        const src = fakeSource(() => ((n++ % 2 === 0) ? 0 : 120));
        assert.equal(classifyTileLod(src, 0, tile), 'coast');
    });

    it('labels all land as inland', () => {
        const src = fakeSource(() => 200);
        assert.equal(classifyTileLod(src, 0, tile), 'inland');
    });

    it('labels all water as ocean', () => {
        const src = fakeSource(() => 0);
        assert.equal(classifyTileLod(src, 0, tile), 'ocean');
    });

    it('catches a narrow shoreline sliver on coarse tiles', () => {
        // A water channel at 30–40% across the tile misses the old 9-point
        // sampling (west / mid / east) — the tile froze as blocky inland.
        const coarse: TileId = { z: 6, x: 10, y: 20 };
        const b = tileBounds(coarse);
        const chanW = b.west + (b.east - b.west) * 0.30;
        const chanE = b.west + (b.east - b.west) * 0.40;
        const src = fakeSource(lon => (lon >= chanW && lon <= chanE ? 0 : 150));
        assert.equal(classifyTileLod(src, 0, coarse), 'coast');
    });

    it('catches a shoreline strip between interior sample columns', () => {
        // Vertical water band at ~12% — between the 0 and 0.25 columns of a 5×5.
        const fine: TileId = { z: 10, x: 40, y: 20 };
        const b = tileBounds(fine);
        const chanW = b.west + (b.east - b.west) * 0.10;
        const chanE = b.west + (b.east - b.west) * 0.15;
        const src = fakeSource(lon => (lon >= chanW && lon <= chanE ? 0 : 150));
        assert.equal(classifyTileLod(src, 0, fine), 'coast');
    });

    it('catches shoreline sitting only on a tile edge', () => {
        const id: TileId = { z: 9, x: 12, y: 8 };
        const b = tileBounds(id);
        const band = (b.north - b.south) * 0.02;
        const src = fakeSource((_lon, lat) => (lat <= b.south + band ? 0 : 180));
        assert.equal(classifyTileLod(src, 0, id), 'coast');
    });

    it('catches shoreline that sits only in the neighbouring tile', () => {
        // All samples inside the tile are land; water begins just south of the
        // border — without outward sampling this freezes as inland and the
        // visible coast becomes the coarse QT edge (space-view blocky corner).
        const id: TileId = { z: 7, x: 20, y: 10 };
        const b = tileBounds(id);
        const src = fakeSource((_lon, lat) => (lat < b.south ? 0 : 200));
        assert.equal(classifyTileLod(src, 0, id), 'coast');
    });
});

describe('analyzeTileLod / tileHeightRangeM', () => {
    it('reports zero range for flat inland', () => {
        const src = fakeSource(() => 120);
        const info = analyzeTileLod(src, 0, tile);
        assert.equal(info.lod, 'inland');
        assert.equal(info.deltaH, 0);
        assert.equal(tileHeightRangeM(src, 0, tile), 0);
    });

    it('reports height span for hilly inland', () => {
        let n = 0;
        const heights = [100, 100, 100, 100, 350, 100, 100, 100, 100];
        const src = fakeSource(() => heights[n++ % heights.length]);
        const info = analyzeTileLod(src, 0, tile);
        assert.equal(info.lod, 'inland');
        assert.equal(info.deltaH, 250);
    });

    it('includes coast land/water span in deltaH', () => {
        let n = 0;
        const src = fakeSource(() => ((n++ % 2 === 0) ? 0 : 80));
        const info = analyzeTileLod(src, 0, tile);
        assert.equal(info.lod, 'coast');
        assert.ok(info.deltaH >= 80);
    });

    it('treats unloaded DEM as inland, not ocean', () => {
        const src: HeightSource = {
            heightAt: () => 0,
            rawHeightAt: () => Number.NaN,
            maxZoomAt: () => 11,
            coversTile: () => true,
        };
        assert.equal(classifyTileLod(src, 0, tile), 'inland');
    });
});
