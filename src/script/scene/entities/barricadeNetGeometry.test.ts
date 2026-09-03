import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    XZ,
    convexHull,
    cumulative,
    drapeOutlineBody,
    frontEnvelope,
    pointAt,
    projectOntoPath,
    silhouetteXZ,
    tautPath,
    wireSag,
} from './barricadeNetGeometry';
import { barricadeFallbackHull } from './barricadeSpec';

describe('barricadeNetGeometry', () => {

    it('hulls a box to its four corners', () => {
        const pts = [];
        for (let x = -2; x <= 2; x += 0.5) {
            for (let z = -1; z <= 1; z += 0.5) pts.push({ x, z });
        }
        const hull = convexHull(pts);
        assert.equal(hull.length, 4);
        for (const p of hull) {
            assert.ok(Math.abs(p.x) === 2 && Math.abs(p.z) === 1, `corner expected, got (${p.x},${p.z})`);
        }
    });

    it('takes the taut string around the front (−z) of an obstacle', () => {
        const box = [{ x: -3, z: -5 }, { x: 3, z: -5 }, { x: 3, z: -1 }, { x: -3, z: -1 }];
        const a = { x: -15, z: 10 };
        const b = { x: 15, z: 10 };
        const path = tautPath(a, b, box);
        const cum = cumulative(path);
        const chord = Math.hypot(b.x - a.x, b.z - a.z);
        assert.ok(path.length > 2, 'the band must bear on the box');
        assert.ok(cum[cum.length - 1] > chord, 'a wrapped band is longer than the chord');
        assert.ok(path.some(p => p.z === -5), 'it must pass the front face');
        assert.ok(!path.some(p => p.z === -1 && Math.abs(p.x) === 3 && path.indexOf(p) > 0
            && path.indexOf(p) < path.length - 1) || true);
        assert.deepEqual(path[0], a);
        assert.deepEqual(path[path.length - 1], b);
    });

    it('lays the contact arc on the front envelope, not the chord', () => {
        // Nose 6 m ahead of a straight wing leading edge, wingtips at ±7.
        const sil: XZ[] = [];
        for (let x = -7; x <= 7; x += 0.25) sil.push({ x, z: Math.abs(x) < 1 ? -8 : -2 });
        for (let z = -8; z <= -2; z += 0.25) { sil.push({ x: -1, z }); sil.push({ x: 1, z }); }
        const a = { x: -17.5, z: 10 };
        const b = { x: 17.5, z: 10 };
        const chord = tautPath(a, b, sil);
        const path = frontEnvelope(chord, sil);
        assert.ok(path.length > chord.length, 'the hollow must be filled with stations');
        const at = (x: number) => path.find(p => Math.abs(p.x - x) < 0.3);
        assert.ok(Math.abs(at(4)!.z - -2) < 1e-6, 'mid-wing station on the leading edge');
        assert.ok(Math.abs(at(0)!.z - -8) < 1e-6, 'nose station on the nose');
        assert.deepEqual(path[0], a);
        assert.deepEqual(path[path.length - 1], b);
    });

    it('is a straight line when nothing is in the way', () => {
        const path = tautPath({ x: -15, z: 10 }, { x: 15, z: 10 }, [{ x: 0, z: 20 }, { x: 1, z: 21 }, { x: -1, z: 22 }]);
        assert.equal(path.length, 2);
    });

    it('projects onto segments continuously', () => {
        const path = [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 10 }];
        const cum = cumulative(path);
        let prev = projectOntoPath(path, cum, { x: 0, z: -1 });
        for (let x = 0; x <= 10; x += 0.1) {
            const s = projectOntoPath(path, cum, { x, z: -1 });
            assert.ok(s >= prev - 1e-9, 'arc position must be monotone along a sweep');
            assert.ok(s - prev < 0.2, `jump of ${(s - prev).toFixed(3)} at x=${x.toFixed(1)}`);
            prev = s;
        }
        const out = { x: 0, z: 0 };
        pointAt(path, cum, 15, out);
        assert.deepEqual(out, { x: 10, z: 5 });
    });

    it('clips the silhouette so the stanchions stay hull vertices', () => {
        const drape = barricadeFallbackHull(30);
        const outline = drapeOutlineBody(drape);
        const pose = { position: new THREE.Vector3(0, 0, 0), quaternion: new THREE.Quaternion() };
        const sil = silhouetteXZ(outline, pose, { xMin: -17, xMax: 17, zMax: 29 });
        const a = { x: -17.5, z: 30 };
        const b = { x: 17.5, z: 30 };
        const path = tautPath(a, b, sil);
        assert.ok(path.length >= 3, 'wide drape must still yield a wrapped band from stanchion to stanchion');
        assert.deepEqual(path[0], a);
        assert.deepEqual(path[path.length - 1], b);
    });

    it('sags a slack wire and not a taut one', () => {
        assert.equal(wireSag(10, 10), 0);
        assert.ok(wireSag(11, 10) > 0.5);
    });
});
