import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CoastPolygon } from './coastVector';
import { LWM_LAND, LWM_WATER } from './coastMask';
import { makeEnuBasis } from './geodesy';
import { buildSurfaceMesh, buildTileMesh } from './meshBuilder';
import { tileBounds } from './tiling';

const SIZE = 17;
const ID = { z: 10, x: 512, y: 256 };
const BOUNDS = tileBounds(ID);
const basis = makeEnuBasis(28, -15, 0);

/** North half land (positive height), south half water (below sea level). */
function coastalFixture(): { heights: Float32Array; landMask: Uint8Array } {
    const heights = new Float32Array(SIZE * SIZE);
    const landMask = new Uint8Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const i = y * SIZE + x;
            const land = y < SIZE / 2;
            heights[i] = land ? 50 : -10;
            landMask[i] = land ? LWM_LAND : LWM_WATER;
        }
    }
    return { heights, landMask };
}

/** Land polygon covering the northern part of the tile, cut at a non-grid-aligned latitude. */
function nonGridAlignedPolygon(): CoastPolygon[] {
    const lat = BOUNDS.south + (BOUNDS.north - BOUNDS.south) * 0.53; // deliberately off-grid
    return [{
        exterior: [
            { lon: BOUNDS.west, lat },
            { lon: BOUNDS.east, lat },
            { lon: BOUNDS.east, lat: BOUNDS.north },
            { lon: BOUNDS.west, lat: BOUNDS.north },
        ],
        holes: [],
    }];
}

/** Polygon entirely outside the tile bounds — should not intersect. */
function nonIntersectingPolygon(): CoastPolygon[] {
    return [{
        exterior: [
            { lon: BOUNDS.east + 10, lat: BOUNDS.south },
            { lon: BOUNDS.east + 11, lat: BOUNDS.south },
            { lon: BOUNDS.east + 11, lat: BOUNDS.north },
            { lon: BOUNDS.east + 10, lat: BOUNDS.north },
        ],
        holes: [],
    }];
}

describe('buildSurfaceMesh', () => {
    it('cuts a vector mesh with ground-truth triangleLand when polygons intersect', () => {
        const { heights, landMask } = coastalFixture();
        const { mesh, triangleLand } = buildSurfaceMesh(
            heights, BOUNDS, SIZE, 0, 1, landMask, nonGridAlignedPolygon(),
        );
        assert.ok(triangleLand, 'expected vector-cut triangleLand to be populated');
        assert.equal(triangleLand!.length, mesh.triangleCount);
        assert.ok(mesh.vertices instanceof Float32Array);
    });

    it('falls back to RTIN when polygons do not intersect the tile', () => {
        const { heights, landMask } = coastalFixture();
        const { mesh, triangleLand } = buildSurfaceMesh(
            heights, BOUNDS, SIZE, 0, 1, landMask, nonIntersectingPolygon(),
        );
        assert.equal(triangleLand, undefined);
        assert.ok(mesh.vertices instanceof Uint16Array);
    });

    it('uses plain RTIN when no polygons are supplied', () => {
        const { heights, landMask } = coastalFixture();
        const { mesh, triangleLand } = buildSurfaceMesh(
            heights, BOUNDS, SIZE, 0, 1, landMask, undefined,
        );
        assert.equal(triangleLand, undefined);
        assert.ok(mesh.vertices instanceof Uint16Array);
    });
});

describe('buildTileMesh with OSM vector polygons', () => {
    it('engages the vector-cut path and produces different geometry than the raster path', () => {
        const { heights, landMask } = coastalFixture();
        const withVector = buildTileMesh({
            id: ID,
            heights,
            size: SIZE,
            geometricErrorM: 1,
            maxErrorM: 1,
            seaLevel: 0,
            basis,
            landMask,
            polygons: nonGridAlignedPolygon(),
        });
        const withoutVector = buildTileMesh({
            id: ID,
            heights,
            size: SIZE,
            geometricErrorM: 1,
            maxErrorM: 1,
            seaLevel: 0,
            basis,
            landMask,
            polygons: undefined,
        });

        assert.ok(withVector.triangleCount > 0);
        assert.equal(withVector.indices.length, withVector.triangleCount * 3);
        const groupSum = withVector.groups.reduce((sum, _v, i) => (i % 2 === 1 ? sum + withVector.groups[i] : sum), 0);
        assert.equal(groupSum, withVector.indices.length);

        const differs = withVector.triangleCount !== withoutVector.triangleCount
            || withVector.indices.length !== withoutVector.indices.length;
        assert.ok(differs, 'expected the CDT-cut mesh to differ from the plain RTIN mesh');
    });

    it('falls back to the raster path without throwing when polygons miss the tile', () => {
        const { heights, landMask } = coastalFixture();
        const result = buildTileMesh({
            id: ID,
            heights,
            size: SIZE,
            geometricErrorM: 1,
            maxErrorM: 1,
            seaLevel: 0,
            basis,
            landMask,
            polygons: nonIntersectingPolygon(),
        });
        assert.ok(result.triangleCount > 0);
        assert.equal(result.indices.length, result.triangleCount * 3);
    });
});
