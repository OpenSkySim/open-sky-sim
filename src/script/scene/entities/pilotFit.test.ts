import * as THREE from 'three';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { Model } from '../models/models';
import { PILOT_HELMET_CENTER, PILOT_HELMET_RADIUS_M, PILOT_MODEL_URL, pilotDropForBody, pilotSeatForBody } from './pilotFit';

/** A body model whose only mesh is a flat canopy roof at height y over the cockpit. */
function roofModel(y: number, parented = false): Model {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2));
    roof.position.set(0, y, 5);
    const root = new THREE.Object3D();
    root.add(roof);
    if (parented) {
        // A render group placed somewhere in the world must not move the measurement.
        const group = new THREE.Object3D();
        group.position.set(100, 50, -20);
        group.rotation.y = 1;
        group.add(root);
    }
    return { lod: [{ flats: [], volumes: [root] }], animations: [], maxSize: 10, center: new THREE.Vector3() };
}

/** The glTF JSON chunk of a .glb file. */
function glbJson(path: string): { meshes: { name: string; primitives: { attributes: { POSITION: number } }[] }[]; accessors: { min: number[]; max: number[] }[]; materials: { name: string }[] } {
    const b = readFileSync(path);
    const len = b.readUInt32LE(12);
    return JSON.parse(b.subarray(20, 20 + len).toString('utf8'));
}

describe('pilotFit', () => {
    it('matches the helmet in assets/pilot.glb', () => {
        const gltf = glbJson(PILOT_MODEL_URL);
        const helmet = gltf.meshes.find(m => m.name === 'Helmet');
        assert.ok(helmet, 'Helmet mesh');
        const acc = gltf.accessors[helmet.primitives[0].attributes.POSITION];
        // The dome's top is the crown the canopy fit keeps clear.
        assert.ok(Math.abs(acc.max[1] - (PILOT_HELMET_CENTER[1] + PILOT_HELMET_RADIUS_M)) < 0.005, `crown ${acc.max[1]}`);
        assert.ok(Math.abs((acc.min[2] + acc.max[2]) / 2 - PILOT_HELMET_CENTER[2]) < 0.02, `centre z ${(acc.min[2] + acc.max[2]) / 2}`);
    });

    it('names every material after a pilot palette category', () => {
        const names = glbJson(PILOT_MODEL_URL).materials.map(m => m.name).sort();
        assert.deepEqual(names, [
            'VEHICLE_PILOT_GEAR', 'VEHICLE_PILOT_HELMET', 'VEHICLE_PILOT_SEAT', 'VEHICLE_PILOT_SEAT_CUSHION', 'VEHICLE_PILOT_SEAT_HANDLE', 'VEHICLE_PILOT_SKIN',
            'VEHICLE_PILOT_SUIT', 'VEHICLE_PLANE_INTERIOR',
        ]);
    });

    it('does not move the pilot with plenty of headroom or no canopy', () => {
        assert.equal(pilotDropForBody(roofModel(2), [0, 1, 5]), 0);
        assert.equal(pilotDropForBody({ ...roofModel(2), lod: [{ flats: [], volumes: [] }] }, [0, 1, 5]), 0);
    });

    it('sinks the pilot so the helmet clears a low canopy', () => {
        const eye: [number, number, number] = [0, 1, 5];
        const drop = pilotDropForBody(roofModel(1.05), eye);
        assert.ok(drop > 0.05 && drop < 0.15, `drop ${drop}`);
        assert.ok(Math.abs(pilotDropForBody(roofModel(1.05, true), eye) - drop) < 1e-9);
    });

    it('keeps an eye point that sits closed in under the canopy glass', () => {
        const seat = pilotSeatForBody(jetModel(), [0, 1.15, 5.2]);
        assert.deepEqual(seat, [0, 1.15, 5.2]);
    });

    it('finds the seat under the glass when the eye point floats above the aircraft', () => {
        const seat = pilotSeatForBody(jetModel(), [0, 3, 5.2]);
        assert.ok(seat, 'a seat');
        // Head 45 % of the 2 m canopy behind its front (z 6), crown 15 cm under the glass top (y 1.4).
        assert.ok(Math.abs(seat[0]) < 1e-6, `x ${seat[0]}`);
        assert.ok(Math.abs(seat[2] - (6 - 0.9 - PILOT_HELMET_CENTER[2])) < 1e-3, `z ${seat[2]}`);
        assert.ok(Math.abs(seat[1] - (1.4 - (PILOT_HELMET_CENTER[1] + PILOT_HELMET_RADIUS_M + 0.005) - 0.15)) < 1e-3, `y ${seat[1]}`);
    });

    it('finds the seat under the glass when the eye point is buried in the fuselage', () => {
        const seat = pilotSeatForBody(jetModel(), [0, 0.3, 2]);
        assert.ok(seat && seat[1] > 1, `seat ${seat}`);
    });

    it('gives no pilot to an airframe without canopy glass', () => {
        assert.equal(pilotSeatForBody(jetModel(false), [0, 1.15, 5.2]), null);
    });

    it('keeps a flight-deck eye point under a solid roof with the windscreen ahead', () => {
        // A tall closed fuselage (y 0..2), its windscreen a glass pane 2 m ahead of the seat.
        const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 10));
        fuselage.position.set(0, 1, 5);
        const windscreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8));
        windscreen.position.set(0, 1.3, 7);
        windscreen.userData.glass = true;
        const model: Model = { lod: [{ flats: [], volumes: [fuselage, windscreen] }], animations: [], maxSize: 10, center: new THREE.Vector3() };
        assert.deepEqual(pilotSeatForBody(model, [0.4, 1.3, 5]), [0.4, 1.3, 5]);
        // Too far behind the windscreen to be seen through it: no pilot, not a floating guess.
        assert.equal(pilotSeatForBody(model, [0.4, 1.3, 1]), null);
    });
});

/**
 * A closed box fuselage (y 0..0.8, z 0..8) with a closed canopy box on top
 * (x +-0.4, y 0.8..1.4, z 4..6), the canopy flagged as glass when `glass`.
 */
function jetModel(glass = true): Model {
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 8));
    fuselage.position.set(0, 0.4, 4);
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 2));
    canopy.position.set(0, 1.1, 5);
    canopy.userData.glass = glass;
    return { lod: [{ flats: [], volumes: [fuselage, canopy] }], animations: [], maxSize: 10, center: new THREE.Vector3() };
}
