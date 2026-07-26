import assert from 'node:assert/strict';
import * as THREE from 'three';
import { describe, it } from 'node:test';
import { Model } from '../models/models';
import { deriveWingtipOriginsFromModel } from './wingtipOrigins';

function modelWithWingVertices(leftX: number, rightX: number, y = -0.3, z = 0): Model {
    const positions = new Float32Array([
        leftX, y, z,       rightX, y, z,
        leftX, y, z - 0.5, rightX, y, z - 0.5,
        leftX, y, z + 0.5, rightX, y, z + 0.5,
        0, y - 0.1, z,    0.2, y - 0.1, z,
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mesh = new THREE.Mesh(geometry);
    return {
        lod: [{ flats: [], volumes: [mesh] }],
        animations: [],
        maxSize: Math.abs(leftX) * 2,
        center: new THREE.Vector3(),
    };
}

describe('deriveWingtipOriginsFromModel', () => {
    it('uses the outermost mesh vertex on each wing', () => {
        const model = modelWithWingVertices(8.79, -8.79, 0.15, 0.4);
        const result = deriveWingtipOriginsFromModel(model);
        assert.ok(result);
        assert.ok(Math.abs(result.left.x - 8.79) < 1e-6);
        assert.ok(Math.abs(result.right.x + 8.79) < 1e-6);
        assert.ok(Math.abs(result.left.y - 0.15) < 1e-6);
        assert.ok(Math.abs(result.left.z - 0.4) < 1e-6);
    });

    it('does not mirror asymmetric wing meshes', () => {
        const positions = new Float32Array([
            8, -0.3, 0,    -6, -0.3, 0,
            8, -0.3, -0.5, -6, -0.3, -0.5,
            7.5, -0.35, 0.2, -5.5, -0.35, 0.2,
            0, -0.4, 0,    0.2, -0.4, 0,
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
        assert.ok(Math.abs(result.right.x + 6) < 1e-6);
    });

    it('returns null for insufficient span', () => {
        const model = modelWithWingVertices(0.2, -0.2);
        assert.equal(deriveWingtipOriginsFromModel(model), null);
    });

    it('returns null for empty model', () => {
        const model: Model = {
            lod: [{ flats: [], volumes: [] }],
            animations: [],
            maxSize: 0,
            center: new THREE.Vector3(),
        };
        assert.equal(deriveWingtipOriginsFromModel(model), null);
    });
});
