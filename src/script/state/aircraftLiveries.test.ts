import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { expandLiveries, groupAircraftByModel, liveryAircraftId } from './aircraftRegistry';

const manifest = {
    id: 'lp_ka29', name: 'Ka-29 (Lowpoly)', displayName: 'Ka-29 (Lowpoly)', canonicalName: 'Ka-29 (Lowpoly)',
    body: 'lp_ka29.glb', shadow: 'lp_ka29_shadow.glb', surfaces: [],
};

describe('expandLiveries', () => {
    it('leaves a pack without liveries as it is', () => {
        assert.deepEqual(expandLiveries('lp_ka29', manifest), [{ id: 'lp_ka29', manifest }]);
    });

    it('gives every livery with a body its own aircraft of the same model', () => {
        const out = expandLiveries('lp_ka29', {
            ...manifest,
            liveries: [
                { id: 'default', name: 'Navy grey' },
                { id: 'arctic', name: 'Arctic', body: 'lp_ka29_skin_arctic.glb' },
                { id: 'broken', name: 'No body' },
            ],
        });
        assert.deepEqual(out.map(e => e.id), ['lp_ka29', liveryAircraftId('lp_ka29', 'arctic')]);
        assert.equal(out[0].manifest.body, 'lp_ka29.glb');
        assert.equal(out[1].manifest.body, 'lp_ka29_skin_arctic.glb');
        assert.equal(out[1].manifest.id, 'lp_ka29~arctic');
        assert.deepEqual(out.map(e => e.manifest.sourceMaterial), ['Navy grey', 'Arctic']);
        assert.ok(out.every(e => e.manifest.canonicalName === 'Ka-29 (Lowpoly)'));
    });

    it('gives a livery its own painted surfaces and gear where it has them', () => {
        const surf = { pivot: [0, 0, 0] as [number, number, number], axis: [1, 0, 0] as [number, number, number], control: 'yaw', sign: 1, rangeRad: 0.4 };
        const out = expandLiveries('lp_ka29', {
            ...manifest,
            gear: 'lp_ka29_gear.glb',
            surfaces: [{ ...surf, role: 'rudderLeft', path: 'lp_ka29_rudderLeft.glb' }, { ...surf, role: 'rotor', path: 'lp_ka29_rotor.glb' }],
            liveries: [
                { id: 'default', name: 'Blue' },
                { id: 'red', name: 'Red', body: 'b.glb', gear: 'lp_ka29_skin_red_gear.glb',
                  surfaces: { rudderLeft: 'lp_ka29_skin_red_rudderLeft.glb' } },
            ],
        });
        assert.deepEqual(out[0].manifest.surfaces.map(s => s.path), ['lp_ka29_rudderLeft.glb', 'lp_ka29_rotor.glb']);
        assert.deepEqual(out[1].manifest.surfaces.map(s => s.path), ['lp_ka29_skin_red_rudderLeft.glb', 'lp_ka29_rotor.glb']);
        assert.equal(out[0].manifest.gear, 'lp_ka29_gear.glb');
        assert.equal(out[1].manifest.gear, 'lp_ka29_skin_red_gear.glb');
    });

    it('groups the liveries under one aircraft in the spawn menu', () => {
        const defs = expandLiveries('lp_ka29', {
            ...manifest,
            liveries: [{ id: 'default', name: 'Navy grey' }, { id: 'arctic', name: 'Arctic', body: 'a.glb' }],
        }).map(e => ({
            id: e.id, name: e.manifest.displayName, canonicalName: e.manifest.canonicalName,
            modelName: 'Ka-29', liveryName: e.manifest.sourceMaterial,
        }));
        const groups = groupAircraftByModel(defs as never);
        assert.equal(groups.length, 1);
        assert.deepEqual(groups[0].variants.map(v => v.liveryName), ['Arctic', 'Navy grey']);
    });
});
