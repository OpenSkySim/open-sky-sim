import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WGS84_A } from './geo';
import {
    SPACE_SKY_ALTITUDE_M,
    cameraFarForAltitudeM,
    effectiveMaxZoom,
    geometricHorizonDistanceM,
    terrainMaxZoomForAltitudeM,
    terrainViewRangeM,
} from './viewRange';
import { TERRAIN_VIEW_RANGE_M } from '../defs';

describe('viewRange', () => {
    it('keeps low-altitude range at the baseline floor', () => {
        assert.equal(terrainViewRangeM(1000), TERRAIN_VIEW_RANGE_M);
        assert.equal(terrainViewRangeM(0), TERRAIN_VIEW_RANGE_M);
    });

    it('grows toward the geometric horizon at LEO altitude', () => {
        const h = 400_000;
        const horizon = geometricHorizonDistanceM(h);
        assert.ok(horizon > 2_000_000 && horizon < 2_600_000);
        const range = terrainViewRangeM(h);
        assert.ok(range > TERRAIN_VIEW_RANGE_M);
        assert.ok(range >= horizon);
        assert.ok(cameraFarForAltitudeM(h) > range);
    });

    it('uses WGS84 radius for horizon math', () => {
        const h = 10_000;
        const expected = Math.sqrt(2 * WGS84_A * h + h * h);
        assert.ok(Math.abs(geometricHorizonDistanceM(h) - expected) < 1e-6);
    });

    it('space sky threshold is above atmosphere cruise', () => {
        assert.ok(SPACE_SKY_ALTITUDE_M > 20_000);
        assert.ok(SPACE_SKY_ALTITUDE_M < 400_000);
    });

    it('caps QT zoom at LEO so the coarse shell stays intact', () => {
        assert.equal(terrainMaxZoomForAltitudeM(400_000, 12), 4);
        assert.equal(terrainMaxZoomForAltitudeM(120_000, 12), 5);
        assert.equal(terrainMaxZoomForAltitudeM(1000, 12), 12);
        assert.equal(terrainMaxZoomForAltitudeM(400_000, 3), 3);
    });

    it('effectiveMaxZoom exempts DEM from altitude cap', () => {
        // Ocean at LEO: altitude cap wins.
        assert.equal(effectiveMaxZoom(400_000, 12, 4, false), 4);
        assert.equal(effectiveMaxZoom(400_000, 12, 12, false), 4);
        // DEM at LEO: full source max (island coastlines).
        assert.equal(effectiveMaxZoom(400_000, 12, 9, true), 9);
        assert.equal(effectiveMaxZoom(400_000, 12, 12, true), 12);
        // Low altitude: both reach absolute/source max.
        assert.equal(effectiveMaxZoom(1000, 12, 9, true), 9);
        assert.equal(effectiveMaxZoom(1000, 12, 4, false), 4);
    });
});
