import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    ecefToEnu, ecefToGeodetic, geodeticToEcef, makeEnuBasis, enuToEcef, WGS84_A,
} from './geodesy';

describe('geodesy', () => {
    it('round-trips geodetic → ECEF → geodetic', () => {
        const ecef = geodeticToEcef(28.0015, -15.3937, 123);
        const g = ecefToGeodetic(ecef.x, ecef.y, ecef.z);
        assert.ok(Math.abs(g.lat - 28.0015) < 1e-6);
        assert.ok(Math.abs(g.lon - (-15.3937)) < 1e-6);
        assert.ok(Math.abs(g.height - 123) < 1e-3);
    });

    it('maps the ENU origin to (0,0,0)', () => {
        const basis = makeEnuBasis(28.0015, -15.3937, 0);
        const ecef = geodeticToEcef(28.0015, -15.3937, 0);
        const enu = ecefToEnu(basis, ecef);
        assert.ok(Math.abs(enu.e) < 1e-6);
        assert.ok(Math.abs(enu.n) < 1e-6);
        assert.ok(Math.abs(enu.u) < 1e-6);
    });

    it('round-trips ENU → ECEF → ENU', () => {
        const basis = makeEnuBasis(28.0015, -15.3937, 0);
        const enu = { e: 1000, n: -500, u: 50 };
        const ecef = enuToEcef(basis, enu);
        const back = ecefToEnu(basis, ecef);
        assert.ok(Math.abs(back.e - enu.e) < 1e-6);
        assert.ok(Math.abs(back.n - enu.n) < 1e-6);
        assert.ok(Math.abs(back.u - enu.u) < 1e-6);
    });

    it('places equator ECEF x near WGS84_A', () => {
        const ecef = geodeticToEcef(0, 0, 0);
        assert.ok(Math.abs(ecef.x - WGS84_A) < 1);
        assert.ok(Math.abs(ecef.y) < 1);
        assert.ok(Math.abs(ecef.z) < 1);
    });
});
