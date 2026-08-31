import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Airfield } from '../../terrain/airfields';
import {
    ecefToGeodetic, enuFromScene, enuToEcef, makeEnuBasis,
} from '../../terrain/geodesy';
import { SceneMaterialManager } from '../materials/materials';
import { AIRFIELD_SURFACE_EPS_M, buildAirfieldModel } from './airfieldModel';

/**
 * The material manager only ever hands back something to bind a geometry to,
 * and building the real one drags in shader sources and a palette. Everything
 * this file checks is in the vertices.
 */
const MATERIALS = {
    build: (p: { category: string }) => {
        const m = new THREE.MeshBasicMaterial();
        m.userData.category = p.category;
        return m;
    },
} as unknown as SceneMaterialManager;

/** Palette categories the built geometry actually uses, per LOD level. */
function categories(objects: THREE.Object3D[]): Set<string> {
    return new Set(objects.map(
        o => ((o as THREE.Mesh).material as THREE.Material).userData.category as string));
}

/** Vertices of the parts drawn in one palette category. */
function verticesOf(objects: THREE.Object3D[], category: string): THREE.Vector3[] {
    return vertices(objects.filter(
        o => ((o as THREE.Mesh).material as THREE.Material).userData.category === category));
}

/** An airfield with somewhere to taxi and park. */
const SURROUNDS = {
    taxiways: [{
        widthM: 23,
        points: [[27.9300, -15.3880], [27.9360, -15.3840]],
    }],
    aprons: [{
        ring: [
            [27.9310, -15.3900], [27.9310, -15.3890],
            [27.9320, -15.3890], [27.9320, -15.3900],
            [27.9310, -15.3900],
        ],
    }],
};

const BASIS = makeEnuBasis(28.0015, -15.3937, 0);

/** Gran Canaria as the bake records it, trimmed to what the builder reads. */
function gclp(overrides: Partial<Airfield> = {}): Airfield {
    return {
        name: 'Gran Canaria',
        icao: 'GCLP',
        iata: 'LPA',
        kind: 'international',
        area: 'home',
        lat: 27.93016,
        lon: -15.38801,
        elevationM: 12.97,
        plane: { heightMsl: 12.97, gradient: -0.00385, headingDeg: 21.4354 },
        runways: [{
            ref: '03L/21R',
            headingDeg: 21.4354,
            lengthM: 3103,
            widthM: 45,
            surface: 'asphalt',
            lit: true,
            lat: 27.931904,
            lon: -15.386584,
            thresholds: [[27.918871, -15.392346], [27.944937, -15.380823]],
        }],
        taxiways: [],
        aprons: [],
        buildings: [],
        pads: [],
        ...overrides,
    };
}

function triangles(objects: THREE.Object3D[]): number {
    let n = 0;
    for (const obj of objects) {
        const geometry = (obj as THREE.Mesh).geometry;
        n += geometry.getAttribute('position').count / 3;
    }
    return n;
}

/** Every vertex of a level, in the model's own frame. */
function vertices(objects: THREE.Object3D[]): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for (const obj of objects) {
        const pos = (obj as THREE.Mesh).geometry.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
            out.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
    }
    return out;
}

/**
 * A vertex back as an elevation above the ellipsoid.
 *
 * Scene Y is not the elevation: the ground curves away from the tangent plane,
 * so an airfield 8 km from the play origin has its two thresholds 4 m further
 * apart in Y than in height. Everything the builder is responsible for lives in
 * elevation, so that is where the assertions belong.
 */
function elevationOf(v: THREE.Vector3, origin: THREE.Vector3): number {
    const scene = v.clone().add(origin);
    const ecef = enuToEcef(BASIS, enuFromScene(scene));
    return ecefToGeodetic(ecef.x, ecef.y, ecef.z).height;
}

describe('airfield model', () => {

    it('builds three levels of detail, coarsening', () => {
        const built = buildAirfieldModel(gclp(), BASIS, MATERIALS);
        assert.ok(built);
        assert.equal(built.model.lod.length, 3);
        const counts = built.model.lod.map(l => triangles(l.flats));
        assert.ok(counts[0] > counts[1], `level 0 ${counts[0]} vs level 1 ${counts[1]}`);
        assert.ok(counts[1] > counts[2], `level 1 ${counts[1]} vs level 2 ${counts[2]}`);
        // The coarsest level is the pavement and nothing else: two triangles.
        assert.equal(counts[2], 2);
    });

    it('is the size of the runway it was given', () => {
        const built = buildAirfieldModel(gclp(), BASIS, MATERIALS)!;
        assert.equal(built.model.maxSize, 3103);
        const flat = vertices(built.model.lod[2].flats);
        // The pavement quad's diagonal is the runway's own diagonal.
        let longest = 0;
        for (const a of flat) {
            for (const b of flat) {
                longest = Math.max(longest, a.distanceTo(b));
            }
        }
        const diagonal = Math.hypot(3103, 45);
        assert.ok(Math.abs(longest - diagonal) < 2,
            `pavement measures ${longest.toFixed(1)} m across, wanted ${diagonal.toFixed(1)}`);
    });

    it('follows the airfield plane down the runway', () => {
        const built = buildAirfieldModel(gclp(), BASIS, MATERIALS)!;
        const heights = vertices(built.model.lod[2].flats)
            .map(v => elevationOf(v, built.origin));
        // -0.385% over 3103 m is 11.95 m of fall between the thresholds.
        const spread = Math.max(...heights) - Math.min(...heights);
        assert.ok(Math.abs(spread - 0.00385 * 3103) < 0.2,
            `pavement falls ${spread.toFixed(2)} m, wanted 11.95`);
    });

    it('lifts the pavement clear of the terrain cut under it', () => {
        // Both are built on the same plane, so without the lift they are
        // coplanar and the quantised terrain wins the depth test in patches.
        const level = buildAirfieldModel(
            gclp({ plane: { heightMsl: 100, gradient: 0, headingDeg: 21.4354 } }),
            BASIS, MATERIALS)!;
        for (const v of vertices(level.model.lod[2].flats)) {
            const h = elevationOf(v, level.origin);
            assert.ok(Math.abs(h - (100 + AIRFIELD_SURFACE_EPS_M)) < 0.05,
                `vertex at ${h.toFixed(2)} m, wanted the plane plus the epsilon`);
        }
    });

    it('paints a paved runway and leaves a grass one bare', () => {
        const paved = buildAirfieldModel(gclp(), BASIS, MATERIALS)!;
        const grass = buildAirfieldModel(gclp({
            runways: [{ ...gclp().runways[0], surface: 'grass' }],
        }), BASIS, MATERIALS)!;
        assert.ok(triangles(paved.model.lod[0].flats) > 100, 'the paint is missing');
        assert.equal(triangles(grass.model.lod[0].flats), 2, 'a grass strip got painted');
    });

    it('draws taxiways and aprons at the two finest levels only', () => {
        const withSurrounds = buildAirfieldModel(gclp({
            taxiways: [{
                widthM: 23,
                points: [[27.9300, -15.3880], [27.9330, -15.3860], [27.9360, -15.3840]],
            }],
            aprons: [{
                ring: [
                    [27.9310, -15.3900], [27.9310, -15.3890],
                    [27.9320, -15.3890], [27.9320, -15.3900],
                    [27.9310, -15.3900],
                ],
            }],
        }), BASIS, MATERIALS)!;
        const bare = buildAirfieldModel(gclp(), BASIS, MATERIALS)!;
        const counts = withSurrounds.model.lod.map(l => triangles(l.flats));
        const bareCounts = bare.model.lod.map(l => triangles(l.flats));
        assert.ok(counts[0] > bareCounts[0], 'no taxiway or apron at level 0');
        assert.ok(counts[1] > bareCounts[1], 'no taxiway or apron at level 1');
        assert.equal(counts[2], bareCounts[2], 'the coarsest level grew a taxiway');
    });

    describe('following the ground', () => {

        it('drapes taxiways and aprons on the terrain, not on the plane', () => {
            // Only the runway strips are cut flat by the bake. Left on the
            // plane, GCLP's taxiway network floats up to 10 m and buries
            // itself by 19 — measured on the real manifest.
            const af = gclp(SURROUNDS);
            const GROUND = 200;
            const draped = buildAirfieldModel(
                af, BASIS, MATERIALS, () => GROUND)!;
            const onPlane = buildAirfieldModel(af, BASIS, MATERIALS)!;

            // The pavement quad is the runway, and it stays on the plane.
            const runwayY = (m: typeof draped) => {
                const vs = vertices(m.model.lod[2].flats);
                return elevationOf(vs[0], m.origin);
            };
            assert.ok(Math.abs(runwayY(draped) - runwayY(onPlane)) < 0.01,
                'the runway moved with the ground');

            // The taxiways did move, onto it. Checked through the taxiway
            // centreline, which is the one part of an airfield with a palette
            // category to itself — the pavement shares the runway's.
            const stripe = verticesOf(draped.model.lod[0].flats, 'SCENERY_FIELD_YELLOW');
            assert.ok(stripe.length > 0, 'nothing was draped');
            for (const v of stripe) {
                const h = elevationOf(v, draped.origin);
                assert.ok(Math.abs(h - (GROUND + AIRFIELD_SURFACE_EPS_M)) < 0.2,
                    `draped vertex at ${h.toFixed(2)} m, wanted the ground plus the lift`);
            }
            // ...and on the plane they sit somewhere else entirely.
            const onPlaneStripe = verticesOf(
                onPlane.model.lod[0].flats, 'SCENERY_FIELD_YELLOW');
            const planeH = elevationOf(onPlaneStripe[0], onPlane.origin);
            assert.ok(Math.abs(planeH - GROUND) > 100,
                'the undraped taxiway was already on the ground');
        });

        it('draws a taxiway whole, however finely OSM noded it', () => {
            // The nodes round a curve can be a few metres apart. An 8 m floor
            // on the *segment* dropped exactly those: 119 of 363 at Belbek,
            // punching holes through the middle of continuous taxiways.
            const coarse = gclp({
                taxiways: [{ widthM: 23, points: [[27.9300, -15.3880], [27.9320, -15.3860]] }],
            });
            // The same run, walked in 5 m steps instead of one 280 m leg.
            const steps: number[][] = [];
            for (let i = 0; i <= 56; i++) {
                steps.push([27.9300 + (0.0020 * i) / 56, -15.3880 + (0.0020 * i) / 56]);
            }
            const fine = gclp({ taxiways: [{ widthM: 23, points: steps }] });

            const area = (a: Airfield) => {
                const built = buildAirfieldModel(a, BASIS, MATERIALS, () => 0)!;
                let sum = 0;
                for (const o of built.model.lod[0].flats) {
                    const p = (o as THREE.Mesh).geometry.getAttribute('position');
                    for (let t = 0; t < p.count; t += 3) {
                        const x = new THREE.Vector3(p.getX(t), p.getY(t), p.getZ(t));
                        const y = new THREE.Vector3(p.getX(t + 1), p.getY(t + 1), p.getZ(t + 1));
                        const z = new THREE.Vector3(p.getX(t + 2), p.getY(t + 2), p.getZ(t + 2));
                        sum += y.sub(x).cross(z.sub(x)).length() / 2;
                    }
                }
                return sum;
            };
            const bare = area(gclp());
            const coarsePaved = area(coarse) - bare;
            const finePaved = area(fine) - bare;
            assert.ok(coarsePaved > 1000, 'the coarse taxiway drew nothing');
            assert.ok(Math.abs(finePaved - coarsePaved) / coarsePaved < 0.05,
                `finely noded taxiway paved ${finePaved.toFixed(0)} m2 `
                + `against ${coarsePaved.toFixed(0)} for the same run`);
        });

        it('cuts a long taxiway into steps so it can follow a rise', () => {
            // One quad per OSM segment is flat across its whole length, so a
            // leg crossing a hill cuts through it.
            const long = gclp({
                taxiways: [{ widthM: 23, points: [[27.930, -15.388], [27.940, -15.388]] }],
            });
            const built = buildAirfieldModel(long, BASIS, MATERIALS, () => 0)!;
            const bare = buildAirfieldModel(gclp(), BASIS, MATERIALS, () => 0)!;
            const added = triangles(built.model.lod[0].flats)
                - triangles(bare.model.lod[0].flats);
            // ~1.1 km of taxiway in 20 m steps, two triangles each.
            assert.ok(added > 80, `only ${added} triangles for a kilometre of taxiway`);
        });
    });

    describe('surface', () => {

        it('paints a concrete field paler than an asphalt one', () => {
            // Soviet-era fields are laid in slabs and read markedly paler from
            // the air; that difference is most of what tells them apart.
            const asphalt = buildAirfieldModel(gclp(SURROUNDS), BASIS, MATERIALS)!;
            const concrete = buildAirfieldModel(gclp({
                ...SURROUNDS,
                runways: [{ ...gclp().runways[0], surface: 'concrete' }],
            }), BASIS, MATERIALS)!;
            const a = categories(asphalt.model.lod[0].flats);
            const c = categories(concrete.model.lod[0].flats);
            assert.ok(a.has('SCENERY_ROAD_SECONDARY'), 'asphalt is not road-coloured');
            assert.ok(c.has('SCENERY_BASE_CONCRETE'), 'concrete has no tone of its own');
            assert.ok(!c.has('SCENERY_ROAD_SECONDARY'),
                'the taxiways stayed asphalt on a concrete field');
        });

        it('keeps the markings the same on either', () => {
            const concrete = buildAirfieldModel(gclp({
                runways: [{ ...gclp().runways[0], surface: 'concrete' }],
            }), BASIS, MATERIALS)!;
            const c = categories(concrete.model.lod[0].flats);
            assert.ok(c.has('SCENERY_BASE_RUNWAY_THRESHOLD'));
            assert.ok(c.has('SCENERY_BASE_RUNWAY_LINES'));
        });
    });

    describe('aprons', () => {

        /** The ring of a 200 x 300 m apron, listed either way round. */
        function apronRing(clockwise: boolean) {
            const ring = [
                [27.9310, -15.3900], [27.9310, -15.3880],
                [27.9330, -15.3880], [27.9330, -15.3900],
                [27.9310, -15.3900],
            ];
            return { ring: clockwise ? [...ring].reverse() : ring };
        }

        /** Face normals of every triangle in a level, in scene axes. */
        function normalsY(objects: THREE.Object3D[]): number[] {
            const out: number[] = [];
            for (const o of objects) {
                const p = (o as THREE.Mesh).geometry.getAttribute('position');
                for (let t = 0; t < p.count; t += 3) {
                    const a = new THREE.Vector3(p.getX(t), p.getY(t), p.getZ(t));
                    const b = new THREE.Vector3(p.getX(t + 1), p.getY(t + 1), p.getZ(t + 1));
                    const c = new THREE.Vector3(p.getX(t + 2), p.getY(t + 2), p.getZ(t + 2));
                    out.push(b.sub(a).cross(c.sub(a)).y);
                }
            }
            return out;
        }

        it('faces up whichever way round OSM listed the ring', () => {
            // OSM promises neither winding on a closed way and uses both: 118
            // apron rings one way and 170 the other across the baked
            // airfields. The mesh material culls back faces, so a ring
            // triangulated blind is simply not there — Saki drew seven of its
            // fourteen.
            for (const clockwise of [false, true]) {
                const built = buildAirfieldModel(
                    gclp({ aprons: [apronRing(clockwise)] }), BASIS, MATERIALS)!;
                const ys = normalsY(built.model.lod[0].flats);
                assert.ok(ys.length > 2, 'the apron produced no triangles');
                for (const y of ys) {
                    assert.ok(y > 0,
                        `a face points down with the ring ${clockwise ? 'clockwise' : 'ccw'}`);
                }
            }
        });

        it('draws the same apron either way round', () => {
            const ccw = buildAirfieldModel(
                gclp({ aprons: [apronRing(false)] }), BASIS, MATERIALS)!;
            const cw = buildAirfieldModel(
                gclp({ aprons: [apronRing(true)] }), BASIS, MATERIALS)!;
            assert.equal(triangles(cw.model.lod[0].flats),
                triangles(ccw.model.lod[0].flats));
        });
    });

    it('survives an airfield with no runway at all', () => {
        assert.equal(buildAirfieldModel(gclp({ runways: [] }), BASIS, MATERIALS), undefined);
    });

    it('lays the runway along its own bearing', () => {
        // Scene axes are x east, z south, so a runway on 090 runs along x and
        // one on 000 runs along z. Getting this backwards draws every runway
        // across its own strip.
        const east = buildAirfieldModel(gclp({
            plane: { heightMsl: 10, gradient: 0, headingDeg: 90 },
            runways: [{ ...gclp().runways[0], headingDeg: 90, ref: '09/27' }],
        }), BASIS, MATERIALS)!;
        const flat = vertices(east.model.lod[2].flats);
        const spanX = Math.max(...flat.map(v => v.x)) - Math.min(...flat.map(v => v.x));
        const spanZ = Math.max(...flat.map(v => v.z)) - Math.min(...flat.map(v => v.z));
        assert.ok(Math.abs(spanX - 3103) < 2, `runway spans ${spanX.toFixed(0)} m east-west`);
        assert.ok(Math.abs(spanZ - 45) < 2, `runway spans ${spanZ.toFixed(0)} m north-south`);
    });
});
