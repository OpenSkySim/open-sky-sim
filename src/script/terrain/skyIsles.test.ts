import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { geodeticToWorld, makeEnuBasis } from './geodesy';
import {
    decodeSkyIsleShape, generateSkyIsles, isleAirfield, isleBottomU, isleBuildings, isleCoastDist, isleTopU,
    maxRimRadius, SKY_ISLES_AREA, SkyIsleField, SkyIslesFile,
} from './skyIsles';
import { sceneRunwayOf } from '../state/activeAirfield';

/** Baked by tools/bake_sky_isles.py and not committed (98 MB): a fresh checkout skips these tests. */
const DATA = 'assets/skyisles/islands.json';
const missing = existsSync(DATA) ? false : `${DATA} not baked (tools/bake_sky_isles.py)`;
const file = (missing ? { islands: [] } : JSON.parse(readFileSync(DATA, 'utf-8'))) as SkyIslesFile;
const shapes = file.islands.map(decodeSkyIsleShape);
const isles = generateSkyIsles(shapes);
const centre = { lat: (SKY_ISLES_AREA.south + SKY_ISLES_AREA.north) / 2, lon: (SKY_ISLES_AREA.west + SKY_ISLES_AREA.east) / 2 };
const basis = makeEnuBasis(centre.lat, centre.lon, 0);
const field = SkyIsleField.forBasis(isles, basis);

describe('Sky Isles', { skip: missing }, () => {
    it('floats every baked island inside the 300 km box, the same way every time', () => {
        assert.equal(isles.length, shapes.length);
        assert.deepEqual(generateSkyIsles(shapes).map(i => i.lat), isles.map(i => i.lat));
        for (const i of isles) {
            assert.ok(i.lat > SKY_ISLES_AREA.south && i.lat < SKY_ISLES_AREA.north, i.name);
            assert.ok(i.lon > SKY_ISLES_AREA.west && i.lon < SKY_ISLES_AREA.east, i.name);
        }
        assert.equal(isles[0].name, 'Pantelleria', 'the hub');
        const alts = isles.map(i => i.altM);
        assert.ok(Math.min(...alts) >= 0 && Math.max(...alts) <= 6000, 'coasts between the sea and 6 km');
        assert.ok(alts.every(a => a === 0 || a >= 400), 'in the sea, or clear of it');
        assert.ok(Math.max(...alts) > 5000, 'some up high');
        assert.ok(alts.filter(a => a === 0).length >= 1, 'some sitting in the sea');
        const airfields = isles.filter(i => i.runway).length;
        assert.equal(airfields, shapes.filter(s => (s.osm?.runways.length ?? 0) > 0).length, 'every real runway');
        assert.ok(airfields >= 15, `${airfields} airfields`);
        assert.ok(isles[0].runway, 'the hub has one');
        assert.ok(isles[0].aerodrome?.icao, 'with its real airport');
    });

    it('keeps every underside above the sea and below its top', () => {
        for (const isle of isles) {
            const r = maxRimRadius(isle);
            for (let k = 0; k < 400; k++) {
                const e = Math.sin(k * 12.9898) * r, n = Math.cos(k * 78.233) * r;
                if (isleCoastDist(isle, e, n) <= 0) continue;
                const top = isleTopU(isle, e, n), bottom = isleBottomU(isle, e, n);
                assert.ok(bottom < top - 10, `${isle.name}: ${bottom} vs ${top}`);
                if (isle.altM > 0) {
                    assert.ok(bottom > 50, `${isle.name}: underside ${bottom} m`);
                } else {
                    assert.ok(bottom < 0, `${isle.name}: a grounded island's rock reaches under the sea`);
                }
            }
        }
    });

    it('is ground from above and open air from below', () => {
        const hub = isles[0];
        const rw = hub.runway!;
        const p = geodeticToWorld(basis, hub.lat + rw.n / hub.mPerDegLat, hub.lon + rw.e / hub.mPerDegLon, 0);
        const top = field.surfaceYAt(p.x, p.z, Infinity);
        assert.ok(Math.abs(top - (hub.altM + rw.groundM)) < 3, `top ${top}`);
        assert.equal(field.surfaceYAt(p.x, p.z, top + 5), top);
        assert.equal(field.surfaceYAt(p.x, p.z, top - 50), top, 'inside the rock is still the rock');
        assert.equal(field.surfaceYAt(p.x, p.z, 20), -Infinity, 'under it is the sea');
        const far = geodeticToWorld(basis, SKY_ISLES_AREA.south + 0.001, SKY_ISLES_AREA.west + 0.001, 0);
        assert.equal(field.surfaceYAt(far.x, far.z, Infinity), -Infinity);
    });

    it('lets the caves be flown through: their floor is the ground, the rock beside them is not air', () => {
        const caves = isles.flatMap(i => i.tunnels.map(t => ({ isle: i, t })));
        assert.ok(caves.length >= 30, `${caves.length} caves`);
        for (const { isle, t } of caves.slice(0, 40)) {
            const f = SkyIsleField.forBasis([isle], basis);
            const frame = f.frames[0];
            // A point along it deep in the rock (a cave may cross a dip in the
            // underside, where it is open air anyway).
            let me = NaN, mn = NaN;
            for (let k = 0.05; k < 1 && Number.isNaN(me); k += 0.05) {
                const e = t.ae + (t.be - t.ae) * k, n = t.an + (t.bn - t.an) * k;
                if (isleBottomU(isle, e, n) < t.u - t.r * 1.5 && isleTopU(isle, e, n) > t.u + t.r * 1.5) {
                    me = e;
                    mn = n;
                }
            }
            if (Number.isNaN(me)) continue;
            const at = (u: number) => ({
                x: frame.c[0] + me * frame.e[0] + mn * frame.n[0] + u * frame.u[0],
                y: frame.c[1] + me * frame.e[1] + mn * frame.n[1] + u * frame.u[1],
                z: frame.c[2] + me * frame.e[2] + mn * frame.n[2] + u * frame.u[2],
            });
            // In the middle of the cave: the floor under it, a radius down.
            const mid = at(t.u);
            const floor = f.surfaceYAt(mid.x, mid.z, mid.y);
            assert.ok(Math.abs(mid.y - floor - t.r) < 10, `${isle.name}: cave floor ${(mid.y - floor).toFixed(1)} below, r ${t.r.toFixed(0)}`);
            // Just over its roof: solid rock, so the island's top.
            const roof = at(t.u + t.r * 1.3);
            assert.ok(f.surfaceYAt(roof.x, roof.z, roof.y) > roof.y, `${isle.name}: rock over the cave`);
        }
    });

    it('lays each runway flat on its plateau', () => {
        for (const isle of isles.filter(i => i.runway)) {
            const airfield = isleAirfield(isle)!;
            const rw = sceneRunwayOf(airfield, airfield.runways[0], basis, 0)!;
            for (const t of [-0.95, -0.5, 0, 0.5, 0.95]) {
                const x = rw.center.x + Math.sin(rw.heading) * rw.halfLength * t;
                const z = rw.center.z + Math.cos(rw.heading) * rw.halfLength * t;
                const runway = rw.center.y + rw.slope * rw.halfLength * t;
                // From just above it: another island may float far overhead.
                const ground = field.surfaceYAt(x, z, runway + 20);
                assert.ok(Math.abs(ground - runway) < 0.6, `${airfield.name} at ${t}: island ${ground.toFixed(2)} runway ${runway.toFixed(2)}`);
            }
        }
    });

    it('carries the real islands: area, colour, cover and OSM', () => {
        for (const s of file.islands) {
            assert.ok(s.areaKm2! >= 0.8 && s.areaKm2! <= 320, `${s.name}: ${s.areaKm2} km2`);
        }
        // A few remote islands are outside the ESA composite and fall back to tones.
        assert.ok(shapes.filter(s => s.rgb).length >= 40, 'imagery on most islands');
        for (const s of shapes) {
            if (s.rgb) assert.equal(s.rgb.length, s.nx * s.ny * 3, `${s.name}: imagery`);
            assert.equal(s.cls?.length, s.nx * s.ny, `${s.name}: land-use class per cell`);
            assert.ok(s.cls!.every(c => c < 16), `${s.name}: TerrainClass ids`);
            if (s.fills) {
                const f = s.fills;
                assert.equal(f.polyRings.length, f.count + 1, `${s.name}: fill ring table`);
                assert.equal(f.polyRings[f.count], f.rings.count, `${s.name}: every ring belongs to a fill`);
                assert.ok(f.cls.every(c => c < 16), `${s.name}: fill classes`);
            }
            assert.ok(s.osm, `${s.name}: OSM`);
        }
        assert.ok(shapes.filter(s => s.fills && s.fills.count > 0).length >= 90, 'land use as vectors on most islands');
        const buildings = isles.reduce((sum, i) => sum + isleBuildings(i).length, 0);
        assert.ok(buildings > 5000, `${buildings} buildings`);
        for (const isle of isles) {
            for (const b of isleBuildings(isle)) {
                assert.ok(isleCoastDist(isle, b.e, b.n) > 0, isle.name);
                assert.ok(b.heightM >= 2.5 && b.halfLength >= b.halfWidth - 1e-3, isle.name);
            }
        }
    });
});
