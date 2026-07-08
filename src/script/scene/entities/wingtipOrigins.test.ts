import assert from 'node:assert/strict';
import * as THREE from 'three';
import { describe, it } from 'node:test';
import { F16_PROFILE } from '../../physics/f16Profile';
import { Model } from '../models/models';
import { FlyableAircraftDef } from './aircraftDef';
import { deriveWingtipOriginsFromModel, isPlausibleWingtipDerivation, resolveWingtipOrigins } from './wingtipOrigins';

function minimalDef(overrides: Partial<FlyableAircraftDef> = {}): FlyableAircraftDef {
    return {
        id: 'test',
        name: 'Test',
        body: 'body.glb',
        shadow: 'shadow.glb',
        cockpitOffset: [0, 1, 6],
        surfaces: [],
        ...overrides,
    };
}

function modelWithWingVertices(leftX: number, rightX: number): Model {
    const positions = new Float32Array([
        leftX, -0.3, -1,   rightX, -0.3, -1,
        leftX, -0.3, 0,    rightX, -0.3, 0,
        leftX, -0.3, 1,    rightX, -0.3, 1,
        0, -0.4, 0,        0.2, -0.4, 0,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry);
    (mesh as THREE.Mesh & { isMesh: boolean }).isMesh = true;
    return {
        lod: [{ flats: [], volumes: [mesh] }],
        animations: [],
        maxSize: Math.abs(leftX) * 2,
        center: new THREE.Vector3(),
    };
}

describe('resolveWingtipOrigins', () => {
    it('uses explicit fx.wingtips when provided', () => {
        const explicit: [[number, number, number], [number, number, number]] = [
            [5, -0.1, -2], [-5, -0.1, -2],
        ];
        const result = resolveWingtipOrigins(minimalDef({
            fx: { wingtips: explicit },
        }));
        assert.deepEqual(result, explicit);
    });

    it('derives from aileron/flaperon surface pivots', () => {
        const result = resolveWingtipOrigins(minimalDef({
            surfaces: [
                {
                    role: 'flaperonLeft', model: 'l.glb',
                    pivot: [4.5, -0.21, -3], axis: [1, 0, 0],
                    control: 'flaperonLeft', sign: 1, rangeRad: 0.5,
                },
                {
                    role: 'flaperonRight', model: 'r.glb',
                    pivot: [-4.5, -0.21, -3], axis: [-1, 0, 0],
                    control: 'flaperonRight', sign: 1, rangeRad: 0.5,
                },
            ],
        }));
        assert.ok(Math.abs(result[0][0] - 4.5) < 1e-6);
        assert.ok(Math.abs(result[1][0] + 4.5) < 1e-6);
        assert.ok(Math.abs(result[0][1] + 0.21) < 1e-6);
        assert.ok(Math.abs(result[0][2] + 3) < 1e-6);
    });

    it('falls back to flight wingSpanM / 2', () => {
        const result = resolveWingtipOrigins(minimalDef({
            flight: { geometry: { wingSpanM: 10 } } as FlyableAircraftDef['flight'],
        }));
        assert.ok(Math.abs(result[0][0] - 5) < 1e-6);
        assert.ok(Math.abs(result[1][0] + 5) < 1e-6);
    });

    it('falls back to F-16 half-span when no flight config', () => {
        const result = resolveWingtipOrigins(minimalDef());
        const halfSpan = F16_PROFILE.wingSpanM * 0.5;
        assert.ok(Math.abs(result[0][0] - halfSpan) < 1e-6);
        assert.ok(Math.abs(result[1][0] + halfSpan) < 1e-6);
    });

    it('returns symmetric left/right pairs', () => {
        const result = resolveWingtipOrigins(minimalDef({
            surfaces: [
                {
                    role: 'aileronLeft', model: 'l.glb',
                    pivot: [6, -0.5, -2], axis: [1, 0, 0],
                    control: 'roll', sign: 1, rangeRad: 0.4,
                },
                {
                    role: 'aileronRight', model: 'r.glb',
                    pivot: [-6, -0.5, -2], axis: [-1, 0, 0],
                    control: 'roll', sign: -1, rangeRad: 0.4,
                },
            ],
        }));
        assert.equal(result[0][0], -result[1][0]);
        assert.equal(result[0][1], result[1][1]);
        assert.equal(result[0][2], result[1][2]);
    });
});

describe('deriveWingtipOriginsFromModel', () => {
    it('picks outermost X vertices from body mesh', () => {
        const model = modelWithWingVertices(7.2, -7.2);
        const result = deriveWingtipOriginsFromModel(model);
        assert.ok(result);
        assert.ok(Math.abs(result.left.x - 7.2) < 1e-6);
        assert.ok(Math.abs(result.right.x + 7.2) < 1e-6);
    });

    it('returns null for insufficient span', () => {
        const positions = new Float32Array([
            0.05, -0.3, -1,   -0.05, -0.3, -1,
            0.05, -0.3, 0,    -0.05, -0.3, 0,
            0.05, -0.3, 1,    -0.05, -0.3, 1,
            0.02, -0.3, 0,    -0.02, -0.3, 0,
        ]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingBox();
        const mesh = new THREE.Mesh(geometry);
        const model: Model = {
            lod: [{ flats: [], volumes: [mesh] }],
            animations: [],
            maxSize: 0.1,
            center: new THREE.Vector3(),
        };
        assert.equal(deriveWingtipOriginsFromModel(model), null);
    });

    it('returns symmetric outermost tips even when mesh min-X is asymmetric', () => {
        const positions = new Float32Array([
            8, -0.3, 0,    -1, -0.3, 0,
            8, -0.3, -0.5, -1, -0.3, -0.5,
            0, -0.4, 0,    0.2, -0.4, 0,
            7.5, -0.35, 0.2, 0.1, -0.35, 0.2,
        ]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mesh = new THREE.Mesh(geometry);
        const model: Model = {
            lod: [{ flats: [], volumes: [mesh] }],
            animations: [],
            maxSize: 16,
            center: new THREE.Vector3(),
        };
        const result = deriveWingtipOriginsFromModel(model);
        assert.ok(result);
        assert.ok(Math.abs(result.left.x - 8) < 1e-6);
        assert.ok(Math.abs(result.right.x + 8) < 1e-6);
    });
});

describe('isPlausibleWingtipDerivation', () => {
    it('rejects wildly different span from baseline', () => {
        const derived = {
            left: new THREE.Vector3(12, 0, 0),
            right: new THREE.Vector3(-12, 0, 0),
        };
        assert.equal(isPlausibleWingtipDerivation(derived, 4.5), false);
    });

    it('accepts close match to baseline', () => {
        const derived = {
            left: new THREE.Vector3(5, -0.2, -1),
            right: new THREE.Vector3(-5, -0.2, -1),
        };
        assert.equal(isPlausibleWingtipDerivation(derived, 4.5), true);
    });
});
