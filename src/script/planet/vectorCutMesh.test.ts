import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildVectorCutMesh, clipSegmentToBounds } from './vectorCutMesh';
import { CoastPolygon } from './coastVector';
import { LonLatBounds } from './tiling';

const BOUNDS: LonLatBounds = { west: 0, south: 0, east: 1, north: 1 };

function flatHeights(size: number, landH: number, waterH: number, landSouth: boolean): Float32Array {
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const v = y / (size - 1);
            out[y * size + x] = (landSouth ? v > 0.5 : v < 0.5) ? landH : waterH;
        }
    }
    return out;
}

describe('clipSegmentToBounds', () => {
    it('returns the full segment when inside', () => {
        const segs = clipSegmentToBounds(0.2, 0.2, 0.8, 0.8, BOUNDS);
        assert.equal(segs.length, 1);
        assert.equal(segs[0][0].lon, 0.2);
        assert.equal(segs[0][1].lat, 0.8);
    });

    it('clips to the tile edge', () => {
        const segs = clipSegmentToBounds(-0.5, 0.5, 1.5, 0.5, BOUNDS);
        assert.equal(segs.length, 1);
        assert.equal(segs[0][0].lon, 0);
        assert.equal(segs[0][1].lon, 1);
    });

    it('returns empty when fully outside', () => {
        assert.equal(clipSegmentToBounds(-2, -2, -1, -1, BOUNDS).length, 0);
    });
});

describe('buildVectorCutMesh', () => {
    it('produces a mesh with coastline constraint edges', () => {
        const size = 17;
        const heights = flatHeights(size, 50, -10, false);
        const polygons: CoastPolygon[] = [{
            exterior: [
                { lon: 0, lat: 0.5 },
                { lon: 1, lat: 0.5 },
                { lon: 1, lat: 1 },
                { lon: 0, lat: 1 },
            ],
            holes: [],
        }];
        const mesh = buildVectorCutMesh({
            bounds: BOUNDS,
            size,
            heights,
            seaLevel: 0,
            maxErrorM: 5,
            polygons,
        });
        assert.ok(mesh);
        assert.ok(mesh!.triangleCount > 2);
        assert.equal(mesh!.vertices.length % 2, 0);
        assert.equal(mesh!.triangles.length, mesh!.triangleCount * 3);
        assert.equal(mesh!.triangleLand.length, mesh!.triangleCount);

        let land = 0;
        let water = 0;
        for (let t = 0; t < mesh!.triangleCount; t++) {
            if (mesh!.triangleLand[t]) {
                land += 1;
            } else {
                water += 1;
            }
        }
        assert.ok(land > 0);
        assert.ok(water > 0);
    });

    it('returns undefined when no segments intersect the tile', () => {
        const size = 17;
        const heights = flatHeights(size, 50, -10, false);
        const polygons: CoastPolygon[] = [{
            exterior: [
                { lon: 2, lat: 2 },
                { lon: 3, lat: 2 },
                { lon: 3, lat: 3 },
                { lon: 2, lat: 3 },
            ],
            holes: [],
        }];
        const mesh = buildVectorCutMesh({
            bounds: BOUNDS,
            size,
            heights,
            seaLevel: 0,
            maxErrorM: 5,
            polygons,
        });
        assert.equal(mesh, undefined);
    });
});
