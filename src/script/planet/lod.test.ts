import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TERRAIN_VIEW_RANGE_M } from '../defs';
import {
    SPACE_SKY_ALTITUDE_M, cameraFarForAltitudeM, ellipsoidSagittaM,
    screenSpaceErrorPx, shouldRefine, terrainMaxZoomForAltitudeM, terrainViewRangeM,
} from './lod';

describe('lod', () => {
    it('keeps low-altitude range at the baseline floor', () => {
        assert.equal(terrainViewRangeM(1000), TERRAIN_VIEW_RANGE_M);
        assert.ok(terrainViewRangeM(100_000) > TERRAIN_VIEW_RANGE_M);
    });

    it('raises camera far with altitude', () => {
        assert.ok(cameraFarForAltitudeM(1000) <= cameraFarForAltitudeM(100_000));
    });

    it('caps zoom by altitude', () => {
        assert.ok(terrainMaxZoomForAltitudeM(1000, 12) >= terrainMaxZoomForAltitudeM(100_000, 12));
        assert.ok(terrainMaxZoomForAltitudeM(1000, 12) <= 12);
    });

    it('SSE decreases with distance', () => {
        const near = screenSpaceErrorPx(100, 1000, 200, 50);
        const far = screenSpaceErrorPx(100, 10000, 200, 50);
        assert.ok(near > far);
    });

    it('refines when error projects above the target', () => {
        assert.equal(shouldRefine(100, 500, 200, 50, 1, 2), true);
        assert.equal(shouldRefine(1, 50_000, 200, 50, 1, 2), false);
    });

    it('ellipsoid sagitta grows with tile size', () => {
        const fine = ellipsoidSagittaM({ z: 8, x: 0, y: 0 });
        const coarse = ellipsoidSagittaM({ z: 2, x: 0, y: 0 });
        assert.ok(coarse > fine);
    });

    it('exports space sky altitude', () => {
        assert.ok(SPACE_SKY_ALTITUDE_M > 10_000);
    });
});
