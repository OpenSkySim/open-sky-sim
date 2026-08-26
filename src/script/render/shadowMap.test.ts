import * as THREE from 'three';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ShadowMapPass, FAR_CASCADE_MAX_SIZE, SHADOW_MAP_SIZES, SHADOW_SETTINGS } from './shadowMap';
import { ShadowQualities } from '../state/gameDefs';
import { SUN_DIRECTION } from '../scene/materials/shaders/sun';
import { SHADOW_ALPHA_DITHER } from '../scene/entities/aircraftShadow';

const MAP_SIZE = 1024;

/** Camera-relative position of an absolute ENU point for a pass rebased at `camera`. */
function relative(point: THREE.Vector3, camera: THREE.Vector3): THREE.Vector3 {
    return point.clone().sub(camera);
}

describe('ShadowMapPass placement', () => {

    it('puts the camera at the centre of both cascades', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        const camera = new THREE.Vector3(1234, 250, -4321);
        pass.updateCamera(camera);

        for (const cascade of [pass.near, pass.far]) {
            const c = relative(camera, camera).applyMatrix4(cascade.matrix);
            assert.ok(Math.abs(c.x - 0.5) < 1e-3 && Math.abs(c.y - 0.5) < 1e-3 && Math.abs(c.z - 0.5) < 1e-3,
                `cascade centre ${c.x}, ${c.y}, ${c.z}`);
        }

        const coord = relative(camera, camera).applyMatrix4(pass.near.matrix);
        assert.ok(Math.abs(coord.x - 0.5) < 1e-3, `x ${coord.x}`);
        assert.ok(Math.abs(coord.y - 0.5) < 1e-3, `y ${coord.y}`);
        assert.ok(Math.abs(coord.z - 0.5) < 1e-3, `z ${coord.z}`);
    });

    it('projects a caster and the ground it shadows onto the same texel', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        const camera = new THREE.Vector3(0, 300, 0);
        pass.updateCamera(camera);

        // The point 500 m down-sun of the camera is what the camera shadows.
        const shadowed = camera.clone().addScaledVector(SUN_DIRECTION, -500);
        const a = relative(camera, camera).applyMatrix4(pass.far.matrix);
        const b = relative(shadowed, camera).applyMatrix4(pass.far.matrix);

        assert.ok(Math.abs(a.x - b.x) < 1e-3, `x ${a.x} vs ${b.x}`);
        assert.ok(Math.abs(a.y - b.y) < 1e-3, `y ${a.y} vs ${b.y}`);
        // Farther from the sun ⇒ deeper in the map, so the caster wins the test.
        assert.ok(b.z > a.z, `expected ${b.z} deeper than ${a.z}`);
    });

    it('keeps ground below the aircraft inside the prism at altitude', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        for (const altitude of [0, 250, 1000, 2000]) {
            const camera = new THREE.Vector3(0, altitude, 0);
            pass.updateCamera(camera);
            const ground = new THREE.Vector3(0, 0, 0);
            const coord = relative(ground, camera).applyMatrix4(pass.far.matrix);
            assert.ok(coord.x > 0 && coord.x < 1 && coord.y > 0 && coord.y < 1,
                `altitude ${altitude} put the ground at ${coord.x}, ${coord.y}`);
        }
    });

    it('snaps the prism to a world texel grid so shadows do not crawl', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        const landmark = new THREE.Vector3(120, 0, -80);

        // Two camera positions a fraction of a texel apart, same altitude band.
        const first = new THREE.Vector3(0, 100, 0);
        const second = new THREE.Vector3(0.37, 100, 0.21);

        pass.updateCamera(first);
        const a = relative(landmark, first).applyMatrix4(pass.far.matrix).multiplyScalar(MAP_SIZE);
        pass.updateCamera(second);
        const b = relative(landmark, second).applyMatrix4(pass.far.matrix).multiplyScalar(MAP_SIZE);

        // The landmark may land on a different texel, but never between texels:
        // the grid itself has not moved, only the window over it.
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        assert.ok(Math.abs(dx - Math.round(dx)) < 1e-2, `x drift ${dx}`);
        assert.ok(Math.abs(dy - Math.round(dy)) < 1e-2, `y drift ${dy}`);
    });

    it('exposes a bias small enough to be a fraction of the depth range', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        assert.ok(pass.near.depthBias > 0 && pass.near.depthBias < 1e-3, `bias ${pass.near.depthBias}`);
        assert.strictEqual(pass.near.texelSize, 1 / MAP_SIZE);
        assert.ok(SHADOW_SETTINGS.intensity > 0 && SHADOW_SETTINGS.intensity <= 1);
        // Cast shadows and the planform silhouettes must read as one mark.
        assert.strictEqual(SHADOW_SETTINGS.stipple, SHADOW_ALPHA_DITHER);
    });

    it('maps every menu quality to a power-of-two map size', () => {
        for (const quality of Object.values(ShadowQualities)) {
            const size = SHADOW_MAP_SIZES[quality];
            assert.ok(size >= 256 && size <= 16384, `${quality} -> ${size}`);
            assert.strictEqual(size & (size - 1), 0, `${quality} -> ${size} is not a power of two`);
        }
        assert.ok(SHADOW_MAP_SIZES[ShadowQualities.LOW] < SHADOW_MAP_SIZES[ShadowQualities.MEDIUM]);
        assert.ok(SHADOW_MAP_SIZES[ShadowQualities.MEDIUM] < SHADOW_MAP_SIZES[ShadowQualities.HIGH]);
        assert.ok(SHADOW_MAP_SIZES[ShadowQualities.HIGH] < SHADOW_MAP_SIZES[ShadowQualities.ULTRA]);
    });

    it('shrinks the depth bias as the map gets finer', () => {
        const camera = new THREE.Vector3(0, 100, 0);
        const coarse = new ShadowMapPass(SHADOW_MAP_SIZES[ShadowQualities.LOW]);
        coarse.updateCamera(camera);
        const fine = new ShadowMapPass(SHADOW_MAP_SIZES[ShadowQualities.ULTRA]);
        fine.updateCamera(camera);
        assert.ok(fine.near.depthBias < coarse.near.depthBias,
            `fine ${fine.near.depthBias} should undercut coarse ${coarse.near.depthBias}`);
        assert.ok(fine.near.depthBias > 0);
        // The near cascade is denser than the wide one at the same resolution,
        // so it must also ask for less bias.
        assert.ok(coarse.near.depthBias < coarse.far.depthBias);
    });

    it('tracks the map size the menu selects, capping the far cascade', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        pass.setMapSize(SHADOW_MAP_SIZES[ShadowQualities.LOW]);
        assert.strictEqual(pass.near.texelSize, 1 / SHADOW_MAP_SIZES[ShadowQualities.LOW]);

        pass.setMapSize(SHADOW_MAP_SIZES[ShadowQualities.ULTRA]);
        assert.strictEqual(pass.near.mapSize, SHADOW_MAP_SIZES[ShadowQualities.ULTRA]);
        assert.strictEqual(pass.far.mapSize, FAR_CASCADE_MAX_SIZE);
    });

    it('hands close ground to the near cascade and distant ground to the far one', () => {
        const pass = new ShadowMapPass(MAP_SIZE);
        const camera = new THREE.Vector3(0, 60, 0);
        pass.updateCamera(camera);

        const inside = (m: THREE.Matrix4, p: THREE.Vector3) => {
            const c = relative(p, camera).applyMatrix4(m);
            return c.x > 0 && c.x < 1 && c.y > 0 && c.y < 1 && c.z > 0 && c.z < 1;
        };
        // Both prisms are tubes along the sun ray, so what decides the cascade
        // is displacement *across* that ray.
        const across = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), SUN_DIRECTION).normalize();
        const underWing = camera.clone().addScaledVector(across, 100);
        const acrossTheField = camera.clone().addScaledVector(across, 300);

        assert.ok(inside(pass.near.matrix, underWing), 'ground beside the aircraft is not in the near cascade');
        assert.ok(!inside(pass.near.matrix, acrossTheField), 'distant ground should fall out of the near cascade');
        assert.ok(inside(pass.far.matrix, acrossTheField), 'distant ground is not in the far cascade');
        // The whole point of the split: near texels are much smaller.
        assert.ok(pass.near.radius < pass.far.radius);
    });
});
