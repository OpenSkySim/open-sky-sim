import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WGS84_A } from './geo';
import {
    INLAND_VERTICAL_ERROR_SPLIT_PX,
    SPACE_SKY_ALTITUDE_M,
    TERRAIN_DETAIL_SCALE_MAX,
    TERRAIN_TARGET_FRAME_MS,
    adjustTerrainDetailScale,
    cameraFarForAltitudeM,
    coastFloorRangeM,
    coastMinZoom,
    distanceZoomAdjust,
    effectiveMaxZoom,
    effectiveMaxZoomFrac,
    geometricHorizonDistanceM,
    inlandMaxZoomForFlatness,
    reliefViewFactor,
    terrainCoastMaxZoomForAltitudeM,
    terrainInlandMaxZoomForAltitudeM,
    terrainMaxZoomForAltitudeM,
    terrainMeshBudget,
    terrainViewRangeM,
    terrainZoomCurveForAltitudeM,
    updateMidAltBand,
    verticalErrorPx,
} from './viewRange';
import { TERRAIN_VIEW_RANGE_M } from '../defs';
import { edgeNeighbors } from './tileId';
import { meshResForTile, meshResForZoom } from './terrainMesh';

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

    it('altitude zoom curve stays modest at space altitudes', () => {
        assert.equal(terrainMaxZoomForAltitudeM(100_000, 12), 6);
        assert.equal(terrainMaxZoomForAltitudeM(400_000, 12), 4);
        assert.equal(terrainMaxZoomForAltitudeM(1000, 12), 12);
        assert.equal(terrainMaxZoomForAltitudeM(10_000, 12), 11);
        let prev = terrainZoomCurveForAltitudeM(0);
        for (const h of [10_000, 40_000, 80_000, 120_000, 400_000]) {
            const z = terrainZoomCurveForAltitudeM(h);
            assert.ok(z <= prev + 1e-9, `zoom rose at ${h}: ${prev} → ${z}`);
            prev = z;
        }
    });

    it('mid-alt inland is finer than the approach inland drop', () => {
        // 10 km: altCap 11, mid-alt inland drop 2 → baseline 8.
        assert.equal(terrainInlandMaxZoomForAltitudeM(10_000, 12), 8);
        // Approach band still uses the full inland drop.
        assert.equal(terrainInlandMaxZoomForAltitudeM(1_000, 12), 7);
    });

    it('mid-alt band hysteresis holds across the 8 km cliff', () => {
        // Enter at 8 km, stay active while bobbing down to 7.2 km.
        assert.equal(updateMidAltBand(8_000, false), true);
        assert.equal(updateMidAltBand(7_500, true), true);
        assert.equal(updateMidAltBand(7_199, true), false);
        assert.equal(updateMidAltBand(7_500, false), false);
        assert.equal(updateMidAltBand(8_000, false), true);
    });

    it('effectiveMaxZoom favors coast over inland', () => {
        // absoluteMax 12: coast rides the altitude curve + 5, capped at DEM max.
        assert.equal(terrainCoastMaxZoomForAltitudeM(100_000, 12), 11);
        assert.equal(terrainInlandMaxZoomForAltitudeM(100_000, 12), 4);
        assert.equal(effectiveMaxZoom(100_000, 12, 12, 'coast'), 11);
        // Coast never exceeds the DEM native zoom (no procedural depth).
        assert.equal(terrainCoastMaxZoomForAltitudeM(0, 11), 11);
        // Flat inland at 100 km: altCap 6 − flatness − INLAND_LOD_DROP, floored at 4.
        assert.equal(effectiveMaxZoom(100_000, 12, 9, 'inland', 10), 4);
        assert.ok(
            terrainCoastMaxZoomForAltitudeM(100_000, 12)
                - terrainInlandMaxZoomForAltitudeM(100_000, 12) >= 3,
        );
    });

    it('inland flatness caps: flat < hilly < coast at same altitude', () => {
        // Low alt so INLAND_LOD_DROP still leaves room above the coarse shell.
        const alt = 5_000; // altCap 11
        const abs = 12;
        const flat = inlandMaxZoomForFlatness(alt, abs, 5);
        const mild = inlandMaxZoomForFlatness(alt, abs, 30);
        const rough = inlandMaxZoomForFlatness(alt, abs, 100);
        const hilly = inlandMaxZoomForFlatness(alt, abs, 400);
        const coast = terrainCoastMaxZoomForAltitudeM(alt, abs);
        assert.equal(flat, 4);   // 11 − 3 − 4
        assert.equal(mild, 5);   // 11 − 2 − 4
        assert.equal(rough, 6);  // 11 − 1 − 4
        assert.equal(hilly, 7);  // 11 − 0 − 4
        assert.ok(flat <= mild && mild <= rough && rough <= hilly);
        assert.ok(hilly < coast);
        assert.ok(
            effectiveMaxZoom(alt, abs, 11, 'inland', 5)
                < effectiveMaxZoom(alt, abs, 11, 'inland', 400),
        );
        assert.ok(
            effectiveMaxZoom(alt, abs, 11, 'inland', 400)
                < effectiveMaxZoom(alt, abs, 14, 'coast'),
        );
    });

    it('vertical error: near relief splits, far or flat relief does not', () => {
        // sseFactor for 1024 px wide, 45° fov: 512 / tan(22.5°) ≈ 1236.
        const sseFactor = 512 / Math.tan(Math.PI / 8);
        // 250 m ridge at 20 km → ~15 px: visible (threshold raised to 14).
        assert.ok(verticalErrorPx(250, 20_000, sseFactor) > INLAND_VERTICAL_ERROR_SPLIT_PX);
        // Same ridge at 400 km → ~0.6 px: invisible.
        assert.ok(verticalErrorPx(200, 400_000, sseFactor) < INLAND_VERTICAL_ERROR_SPLIT_PX);
        // Flat farmland (3 m) even at 2 km → ~1.9 px: invisible.
        assert.ok(verticalErrorPx(3, 2_000, sseFactor) < INLAND_VERTICAL_ERROR_SPLIT_PX);
        assert.equal(verticalErrorPx(0, 10_000, sseFactor), 0);
    });

    it('relief view factor: nadir views hide height, oblique views keep it', () => {
        // Tile straight below the camera: horizontal ≈ 0 → floored factor.
        assert.equal(reliefViewFactor(50_000, 50_000), 0.2);
        // Tile out toward the horizon: slant is nearly horizontal → ~1.
        assert.ok(reliefViewFactor(500_000, 50_000) > 0.99);
        // 45° oblique: horizontal = alt → factor ≈ 1/√2.
        const oblique = reliefViewFactor(Math.SQRT2 * 10_000, 10_000);
        assert.ok(Math.abs(oblique - Math.SQRT1_2) < 1e-6);
        // A ridge visible at grazing angle vanishes when viewed from above.
        const sseFactor = 512 / Math.tan(Math.PI / 8);
        const grazing = verticalErrorPx(250, 20_000, sseFactor) * reliefViewFactor(20_000, 2_000);
        const nadir = verticalErrorPx(250, 20_000, sseFactor) * reliefViewFactor(20_000, 19_900);
        assert.ok(grazing > INLAND_VERTICAL_ERROR_SPLIT_PX);
        assert.ok(nadir < INLAND_VERTICAL_ERROR_SPLIT_PX);
    });

    it('mesh budget shrinks at high altitude', () => {
        assert.ok(terrainMeshBudget(100_000) < terrainMeshBudget(5_000));
        assert.ok(terrainMeshBudget(100_000) <= 3000);
        assert.equal(terrainMeshBudget(100_000), 3000);
    });

    it('distance falloff stays shallow', () => {
        assert.ok(distanceZoomAdjust(10_000, 100_000) <= 1.01);
        assert.ok(distanceZoomAdjust(2_000_000, 100_000) >= -1.51);
        const floors = new Set<number>();
        for (let d = 20_000; d <= 1_500_000; d += 25_000) {
            floors.add(Math.floor(effectiveMaxZoomFrac(100_000, 12, 12, 'ocean', d) + 1e-6));
        }
        assert.ok(floors.size >= 2);
    });

    it('detail governor coarsens when slow, relaxes when fast', () => {
        const t = TERRAIN_TARGET_FRAME_MS;
        // Overshoot → scale rises (coarser terrain).
        assert.ok(adjustTerrainDetailScale(1, t * 1.5) > 1);
        // Headroom → scale falls back toward 1.
        assert.ok(adjustTerrainDetailScale(2, t * 0.5) < 2);
        // Near target → stable.
        assert.equal(adjustTerrainDetailScale(2, t), 2);
        // Bounded both ways.
        assert.equal(adjustTerrainDetailScale(TERRAIN_DETAIL_SCALE_MAX, t * 3), TERRAIN_DETAIL_SCALE_MAX);
        assert.equal(adjustTerrainDetailScale(1, t * 0.1), 1);
        // Repeated slow frames converge to the cap without oscillating.
        let s = 1;
        for (let i = 0; i < 200; i++) {
            s = adjustTerrainDetailScale(s, t * 2);
        }
        assert.equal(s, TERRAIN_DETAIL_SCALE_MAX);
    });

    it('coast zoom floor scales with altitude', () => {
        assert.equal(coastMinZoom(11, 12, 0), 11);
        assert.equal(coastMinZoom(11, 12, 100_000), 10);
        assert.equal(coastMinZoom(11, 12, 250_000), 9);
        assert.equal(coastMinZoom(11, 9, 0), 9);
        assert.equal(coastMinZoom(0, 12, 0), 0);
    });

    it('coast floor range is space-only and shorter than full view', () => {
        assert.equal(coastFloorRangeM(1_000), 0);
        const h = 100_000;
        const floorR = coastFloorRangeM(h);
        assert.ok(floorR > 0);
        // Nadir disk must cover tiles under the camera (≥ altitude).
        assert.ok(floorR >= h);
        // Limb beyond the floor disk can coarsen (LOD rings).
        assert.ok(floorR < terrainViewRangeM(h));
        assert.equal(floorR, Math.max(h * 1.25, 80_000));
    });

    it('space coast coarsens toward the limb (LOD rings)', () => {
        const farDist = 2_000_000;
        const coastFar = effectiveMaxZoomFrac(100_000, 14, 14, 'coast', farDist);
        const coastNear = effectiveMaxZoomFrac(100_000, 14, 14, 'coast', 20_000);
        // Near +1 vs far −1 → about 2 zoom of ring span.
        assert.ok(coastNear - coastFar >= 1.9, `near=${coastNear} far=${coastFar}`);
        assert.ok(coastNear - coastFar <= 2.1, `near=${coastNear} far=${coastFar}`);
        // Ocean at the same range still takes the full −1.5 falloff.
        const oceanFar = effectiveMaxZoomFrac(100_000, 14, 14, 'ocean', farDist);
        const oceanNear = effectiveMaxZoomFrac(100_000, 14, 14, 'ocean', 20_000);
        assert.ok(oceanNear - oceanFar > 2.0);
    });

    it('approach coast loses zoom with distance (full falloff)', () => {
        const far = effectiveMaxZoomFrac(1_000, 14, 14, 'coast', 200_000);
        const near = effectiveMaxZoomFrac(1_000, 14, 14, 'coast', 5_000);
        assert.ok(near - far >= 2.0, `near=${near} far=${far}`);
        // Far approach coast must not sit at DEM-max extras.
        assert.ok(far <= 12, `far=${far}`);
    });
});

describe('meshResForZoom', () => {
    it('uses denser grids at DEM / coast zooms', () => {
        assert.ok(meshResForZoom(2) < meshResForZoom(6));
        assert.ok(meshResForZoom(6) < meshResForZoom(9));
        assert.ok(meshResForZoom(9) < meshResForZoom(11));
        assert.equal(meshResForZoom(11), 129);
    });
});

describe('meshResForTile', () => {
    it('flat inland gets sparse grids; hilly capped; coast keeps density', () => {
        const flat = meshResForTile(11, 3, false);
        const mild = meshResForTile(11, 40, false);
        const hilly = meshResForTile(11, 300, false);
        const coast = meshResForTile(11, 3, true);
        assert.equal(flat, 9);
        assert.equal(mild, 13);
        assert.equal(hilly, 17);
        assert.equal(coast, 129);
        assert.ok(flat < mild && mild < hilly);
        assert.ok(hilly < coast);
    });

    it('governor detail scale sparsifies inland grids but never coast', () => {
        // Coast/pad grids are exempt — shoreline quality is a hard requirement.
        assert.equal(meshResForTile(11, 500, true, 1), 129);
        assert.equal(meshResForTile(11, 500, true, 6), 129);
        assert.equal(meshResForTile(11, 500, true, 16), 129);
        // Inland already hard-capped; governor can still thin further (floor 9).
        assert.equal(meshResForTile(11, 500, false, 1), 17);
        assert.equal(meshResForTile(11, 500, false, 6), 9);
        assert.equal(meshResForTile(11, 500, false, 16), 9);
        assert.equal(meshResForTile(7, 5, false, 16), 9);
    });

    it('mid-zoom coast tiles get boosted grids for the silhouette', () => {
        // z7 base is 17 — coast needs the density for distant shorelines.
        assert.equal(meshResForTile(7, 0, true), 65);
        assert.equal(meshResForTile(9, 0, true), 65);
        // Inland mid-zoom stays sparse (hard-capped, not coast-table density).
        assert.equal(meshResForTile(7, 5, false), 9);
    });

    it('never exceeds the zoom-table res', () => {
        for (const z of [2, 4, 5, 6, 8, 10, 11, 12]) {
            for (const d of [0, 20, 100, 500]) {
                const r = meshResForTile(z, d, false);
                assert.ok(r <= meshResForZoom(z), `res ${r} > base at z${z} d${d}`);
                assert.ok(r >= 9);
            }
        }
    });
});

describe('edgeNeighbors', () => {
    it('returns four wrapped neighbors', () => {
        const n = edgeNeighbors({ z: 3, x: 0, y: 1 });
        assert.equal(n.length, 4);
        assert.ok(n.some(t => t.x === (1 << 4) - 1 && t.y === 1));
    });
});
