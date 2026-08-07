import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LWM_LAND, LWM_NODATA, LWM_WATER, encodeLwmUncompressed } from './coastMask';
import { decodeLwm } from './coastMask';
import { inCoastCoverage, isInlandWaterCell, isLand, isOceanWaterCell, isWaterGridCell } from './landWater';

describe('landWater', () => {
    const coverage = { west: -19, south: 26, east: -12, north: 31 };
    const config = { enabled: true, coverage };

    it('mask wins over DEM height', () => {
        assert.equal(isLand(-15, 28, 500, LWM_WATER, 0, config), false);
        assert.equal(isLand(-15, 28, -5, LWM_LAND, 0, config), true);
    });

    it('inside coverage with no mask sample defaults to water', () => {
        assert.equal(isLand(-15, 28, 500, undefined, 0, config), false);
    });

    it('outside coverage falls back to DEM height', () => {
        assert.equal(isLand(0, 0, 100, undefined, 0, config), true);
        assert.equal(isLand(0, 0, 0, undefined, 0, config), false);
    });

    it('nodata mask falls through to coverage rule', () => {
        assert.equal(isLand(-15, 28, 500, LWM_NODATA, 0, config), false);
    });

    it('inCoastCoverage respects AABB', () => {
        assert.equal(inCoastCoverage(-15, 28, coverage), true);
        assert.equal(inCoastCoverage(0, 0, coverage), false);
    });

    it('isWaterGridCell uses mask when present', () => {
        const mask = new Uint8Array([LWM_WATER, LWM_LAND]);
        assert.equal(isWaterGridCell(mask, 0, 100, 0), true);
        assert.equal(isWaterGridCell(mask, 1, 0, 0), false);
        assert.equal(isWaterGridCell(undefined, 0, 0, 0), true);
        assert.equal(isWaterGridCell(undefined, 0, 100, 0), false);
    });

    it('isInlandWaterCell detects elevated mask-water', () => {
        const mask = new Uint8Array([LWM_WATER, LWM_WATER, LWM_LAND]);
        assert.equal(isInlandWaterCell(mask, 0, 500, 0), true);
        assert.equal(isInlandWaterCell(mask, 1, 0, 0), false);
        assert.equal(isInlandWaterCell(mask, 2, 500, 0), false);
        assert.equal(isInlandWaterCell(undefined, 0, 500, 0), false);
    });

    it('isOceanWaterCell separates ocean from inland mask-water', () => {
        const mask = new Uint8Array([LWM_WATER, LWM_WATER, LWM_LAND]);
        assert.equal(isOceanWaterCell(mask, 0, 500, 0), false);
        assert.equal(isOceanWaterCell(mask, 1, 0, 0), true);
        assert.equal(isOceanWaterCell(mask, 1, 1, 0), true);
        assert.equal(isOceanWaterCell(undefined, 0, 0, 0), true);
        assert.equal(isOceanWaterCell(undefined, 0, 100, 0), false);
    });
});

describe('coastMask decode', () => {
    it('round-trips LWM1 payload', () => {
        const size = 3;
        const cells = new Uint8Array([LWM_WATER, LWM_LAND, LWM_WATER, LWM_LAND, LWM_LAND, LWM_WATER, 0, 1, 0]);
        const raw = encodeLwmUncompressed(cells, size);
        const tile = decodeLwm(raw);
        assert.equal(tile.size, size);
        assert.deepEqual(tile.cells, cells);
    });
});
