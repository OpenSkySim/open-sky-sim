import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    ecefToEnu, ecefToGeodetic, geodeticToEcef, makeEnuBasis, enuToEcef,
} from './geo';
import {
    childrenOf, rootTiles, tileAtLonLat, tileBounds, xCount, yCount,
} from './tileId';
import { isWaterHeight, landToneIndex, paletteForHeight } from './terrainMesh';
import { padBlendWeight } from './flattenPad';
import { PaletteCategory } from '../config/palettes/palette';
import { decodeR16, R16_MAGIC } from './manifest';

describe('geo WGS84', () => {
    it('round-trips geodetic ↔ ECEF near equator', () => {
        const ecef = geodeticToEcef(0, 0, 100);
        const g = ecefToGeodetic(ecef.x, ecef.y, ecef.z);
        assert.ok(Math.abs(g.lat) < 1e-6);
        assert.ok(Math.abs(g.lon) < 1e-6);
        assert.ok(Math.abs(g.height - 100) < 1e-3);
    });

    it('ENU basis maps east/north/up correctly at origin', () => {
        const basis = makeEnuBasis(28.7, -15.6, 0);
        const origin = geodeticToEcef(28.7, -15.6, 0);
        const enu0 = ecefToEnu(basis, origin);
        assert.ok(Math.abs(enu0.e) < 1e-6);
        assert.ok(Math.abs(enu0.n) < 1e-6);
        assert.ok(Math.abs(enu0.u) < 1e-6);

        const up = geodeticToEcef(28.7, -15.6, 1000);
        const enuUp = ecefToEnu(basis, up);
        assert.ok(Math.abs(enuUp.u - 1000) < 1);
        assert.ok(Math.abs(enuUp.e) < 2);
        assert.ok(Math.abs(enuUp.n) < 2);

        const back = enuToEcef(basis, { e: 0, n: 0, u: 500 });
        const g = ecefToGeodetic(back.x, back.y, back.z);
        assert.ok(Math.abs(g.height - 500) < 1);
    });
});

describe('geographic tileId', () => {
    it('roots cover the Earth', () => {
        const roots = rootTiles();
        assert.equal(roots.length, 2);
        assert.equal(xCount(0), 2);
        assert.equal(yCount(0), 1);
        const b0 = tileBounds(roots[0]);
        assert.equal(b0.west, -180);
        assert.equal(b0.east, 0);
        assert.equal(b0.south, -90);
        assert.equal(b0.north, 90);
    });

    it('children subdivide parent', () => {
        const kids = childrenOf({ z: 0, x: 0, y: 0 });
        assert.equal(kids.length, 4);
        assert.equal(kids[0].z, 1);
        const unionWest = Math.min(...kids.map(k => tileBounds(k).west));
        const unionEast = Math.max(...kids.map(k => tileBounds(k).east));
        assert.equal(unionWest, -180);
        assert.equal(unionEast, 0);
    });

    it('tileAtLonLat finds covering tile', () => {
        const id = tileAtLonLat(4, -15.6, 28.7);
        const b = tileBounds(id);
        assert.ok(b.west <= -15.6 && -15.6 <= b.east);
        assert.ok(b.south <= 28.7 && 28.7 <= b.north);
    });
});

describe('paletteForHeight', () => {
    it('classifies water and land', () => {
        assert.equal(paletteForHeight(-10, 0), PaletteCategory.TERRAIN_WATER);
        assert.equal(paletteForHeight(0, 0), PaletteCategory.TERRAIN_SHALLOW_WATER);
        assert.equal(paletteForHeight(0.4, 0), PaletteCategory.TERRAIN_SHALLOW_WATER);
        assert.equal(paletteForHeight(20, 0.1), PaletteCategory.TERRAIN_SAND);
        assert.equal(paletteForHeight(200, 0.1), PaletteCategory.TERRAIN_GRASS);
        assert.equal(paletteForHeight(200, 0.6), PaletteCategory.TERRAIN_BARE);
    });

    it('triangle is water only when all three verts are water', () => {
        const allWater = (a: number, b: number, c: number) =>
            isWaterHeight(a) && isWaterHeight(b) && isWaterHeight(c);
        assert.equal(allWater(0, 0, 0), true);
        assert.equal(allWater(0, 0, 64), false);
        assert.equal(allWater(20, 40, 60), false);
        assert.equal(paletteForHeight(64, 0.1), PaletteCategory.TERRAIN_GRASS);
    });

    it('landToneIndex cycles three tones across neighbors', () => {
        assert.equal(landToneIndex(0, 0, 0), 0);
        assert.equal(landToneIndex(0, 0, 1), 1);
        assert.equal(landToneIndex(1, 0, 0), 1);
        assert.notEqual(landToneIndex(0, 0, 0), landToneIndex(1, 0, 0));
        assert.equal(new Set([
            landToneIndex(0, 0, 0),
            landToneIndex(1, 0, 0),
            landToneIndex(2, 0, 0),
        ]).size, 3);
    });
});

describe('padBlendWeight', () => {
    const spec = { centerX: 0, centerZ: 0, halfW: 100, halfD: 200, featherM: 20 };
    it('is 1 in the core and 0 outside', () => {
        assert.equal(padBlendWeight(0, 0, spec), 1);
        assert.equal(padBlendWeight(50, 100, spec), 1);
        assert.equal(padBlendWeight(120, 0, spec), 0);
        assert.equal(padBlendWeight(0, 220, spec), 0);
    });
    it('feathers at the rim', () => {
        const t = padBlendWeight(90, 0, spec); // in feather (coreW=80)
        assert.ok(t > 0 && t < 1);
    });
});

describe('decodeR16', () => {
    it('decodes a tiny tile', () => {
        const size = 2;
        const buf = new ArrayBuffer(16 + size * size * 2);
        const view = new DataView(buf);
        for (let i = 0; i < 4; i++) {
            view.setUint8(i, R16_MAGIC.charCodeAt(i));
        }
        view.setFloat32(4, 100, true);
        view.setFloat32(8, 1, true);
        view.setUint32(12, size, true);
        view.setUint16(16, 0, true);
        view.setUint16(18, 10, true);
        view.setUint16(20, 65535, true); // nodata
        view.setUint16(22, 5, true);
        const { heights } = decodeR16(buf, 100, 1);
        assert.equal(heights[0], 100);
        assert.equal(heights[1], 110);
        assert.ok(Number.isNaN(heights[2]));
        assert.equal(heights[3], 105);
    });
});
