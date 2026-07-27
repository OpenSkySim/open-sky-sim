import assert from 'node:assert/strict';
import * as THREE from 'three';
import { describe, it } from 'node:test';
import { Model } from '../scene/models/models';
import { getLodLevel, resolveLodLevel } from './helpers';

function modelWithLodLevels(populated: boolean[]): Model {
    return {
        lod: populated.map(hasGeometry => ({
            flats: hasGeometry ? [new THREE.Mesh()] : [],
            volumes: hasGeometry ? [new THREE.Mesh()] : [],
        })),
        animations: [],
        maxSize: 16,
        center: new THREE.Vector3(),
    };
}

describe('resolveLodLevel', () => {
    it('falls back to LOD 0 when higher levels are empty placeholders', () => {
        const model = modelWithLodLevels([true, false, false, false, false, false]);
        assert.equal(resolveLodLevel(model, 3), 0);
    });

    it('uses the requested level when it has geometry', () => {
        const model = modelWithLodLevels([true, true, true]);
        assert.equal(resolveLodLevel(model, 2), 2);
    });

    it('walks down to the nearest populated level', () => {
        const model = modelWithLodLevels([true, false, true]);
        assert.equal(resolveLodLevel(model, 2), 2);
        assert.equal(resolveLodLevel(model, 1), 0);
    });

    it('culls when the request is beyond the coarsest authored LOD', () => {
        const model = modelWithLodLevels([true, true, true]);
        assert.equal(resolveLodLevel(model, 3), -1);
    });

    it('keeps single-populated imports visible beyond the placeholder LOD count', () => {
        const model = modelWithLodLevels([true, false, false, false, false, false]);
        assert.equal(resolveLodLevel(model, 6), 0);
        assert.equal(resolveLodLevel(model, 99), 0);
    });

    it('culls when every level is empty', () => {
        const model = modelWithLodLevels([false, false]);
        assert.equal(resolveLodLevel(model, 0), -1);
    });
});

describe('getLodLevel + resolveLodLevel (imported aircraft)', () => {
    it('keeps single-LOD mod aircraft visible at long range', () => {
        const model = modelWithLodLevels([true, false, false, false, false, false]);
        const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 40000);
        camera.position.set(0, 500, 0);
        const position = new THREE.Vector3(0, 500, 8000);
        const scale = new THREE.Vector3(1, 1, 1);
        const requested = getLodLevel(position, scale, 320, camera, model.maxSize);
        const lodCount = model.lod.length;
        const forced = lodCount === 0 ? 0 : Math.min(requested, lodCount - 1);
        assert.equal(resolveLodLevel(model, forced), 0);
        assert.equal(resolveLodLevel(model, requested), 0);
    });
});
