import * as THREE from 'three';
import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { daytimePalette } from '../../../config/palettes/daytimePalette';
import { HDMidnightPalette } from '../../../config/palettes/hd-midnight';
import { HDNoonPalette } from '../../../config/palettes/hd-noon';
import { PaletteCategory, PaletteColor } from '../../../config/palettes/palette';
import { DisplayShading, FogQuality } from '../../../config/profiles/profile';
import { SceneMaterialManager } from '../../materials/materials';
import { COCKPIT_FOV, H_RES, V_RES } from '../../../defs';
import { DEFAULT_SUN_HOURS, setSunTime, SUN_DIRECTION } from '../../materials/shaders/sun';
import { placeSun, SUN_DISTANCE, SUN_SET_ELEVATION_DEG, SunModelLibBuilder } from './sunModelBuilder';

afterEach(() => setSunTime(DEFAULT_SUN_HOURS));

function build(): THREE.Mesh[] {
    const materials = new SceneMaterialManager(HDNoonPalette, FogQuality.HIGH, DisplayShading.FULL);
    return new SunModelLibBuilder('sun').build(materials).lod[0].flats as THREE.Mesh[];
}

/** Apparent diameter of a mesh at {@link SUN_DISTANCE}, in degrees. */
function apparentDiameterDeg(mesh: THREE.Mesh): number {
    mesh.geometry.computeBoundingSphere();
    const radius = mesh.geometry.boundingSphere!.radius;
    return 2 * Math.atan(radius / SUN_DISTANCE) * THREE.MathUtils.RAD2DEG;
}

describe('SunModelLibBuilder', () => {

    it('stacks the corona under the disc in paint order', () => {
        // Nothing in the background-sky pass writes depth, so the render order
        // is the only thing keeping the disc on top of its own glow.
        const flats = build();
        assert.strictEqual(flats.length, 3);

        const orders = flats.map(m => m.renderOrder);
        for (let i = 1; i < orders.length; i++) {
            assert.ok(orders[i] > orders[i - 1], `render orders ${orders}`);
        }
        // ...and above the sky billboard, which leaves renderOrder at 0.
        assert.ok(orders[0] > 0, `first ${orders[0]}`);
    });

    it('draws the disc smallest and the corona stepped out around it', () => {
        const [outer, inner, disc] = build().map(apparentDiameterDeg);
        assert.ok(disc < inner && inner < outer, `${disc} ${inner} ${outer}`);
        // Oversize versus the real 0.53 degrees, or it would be a pixel and a
        // half at 320x200 — but not so large it reads as a moon.
        assert.ok(disc > 1.5 && disc < 4, `disc ${disc} deg`);
    });

    it('stipples the corona and leaves the disc solid', () => {
        const [outer, inner, disc] = build().map(m => (m.material as THREE.ShaderMaterial).uniforms.alphaDither.value as number);
        assert.strictEqual(disc, 0, 'the disc itself must be opaque');
        assert.ok(outer > 0 && inner > outer, `outer ${outer} inner ${inner}`);
    });

    it('hides the disc once its upper limb is under the horizon', () => {
        const disc = apparentDiameterDeg(build()[2]);
        assert.ok(SUN_SET_ELEVATION_DEG < 0, `${SUN_SET_ELEVATION_DEG}`);
        assert.ok(Math.abs(SUN_SET_ELEVATION_DEG + disc / 2) < 0.05,
            `cutoff ${SUN_SET_ELEVATION_DEG} vs half-diameter ${disc / 2}`);
    });
});

describe('placeSun', () => {

    const place = (hours: number) => {
        setSunTime(hours);
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        placeSun(SUN_DIRECTION, position, quaternion);
        return { position, quaternion };
    };

    it('parks the disc down the sun direction, face-on to the camera', () => {
        for (const hours of [6, 9, 12, 15, 18]) {
            const { position, quaternion } = place(hours);
            assert.ok(Math.abs(position.length() - SUN_DISTANCE) < 1e-6, `${hours}h ${position.length()}`);
            assert.ok(position.clone().normalize().dot(SUN_DIRECTION) > 1 - 1e-6, `${hours}h off-axis`);

            // The camera sits at the origin, so the face normal must come back
            // down the same line or the disc is edge-on and invisible.
            const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
            assert.ok(normal.dot(SUN_DIRECTION) < -(1 - 1e-6), `${hours}h normal ${normal.toArray()}`);
        }
    });

    it('lands the disc dead centre of a camera pointed at it', () => {
        const camera = new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, 5, 50000);
        for (const hours of [7, 12, 17]) {
            const { position } = place(hours);
            camera.position.set(0, 0, 0);
            camera.lookAt(position);
            camera.updateMatrixWorld(true);

            const ndc = position.clone().project(camera);
            assert.ok(Math.hypot(ndc.x, ndc.y) < 1e-5, `${hours}h ndc ${ndc.x},${ndc.y}`);
            assert.ok(ndc.z > -1 && ndc.z < 1, `${hours}h behind the near/far planes: ${ndc.z}`);
        }
    });

    it('puts the disc above the horizon line while the sun is up', () => {
        // Level camera facing the sun's compass bearing: the disc must project
        // into the upper half of the frame whenever the sun is above 0 degrees.
        const camera = new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, 5, 50000);
        for (const hours of [7, 10, 12, 16, 17.5]) {
            const { position } = place(hours);
            camera.position.set(0, 0, 0);
            camera.lookAt(position.x, 0, position.z);
            camera.updateMatrixWorld(true);

            const ndc = position.clone().project(camera);
            assert.ok(ndc.y > 0, `${hours}h should sit above the horizon, ndc.y ${ndc.y}`);
        }
    });
});

describe('sun disc colour', () => {

    const sunAt = (hours: number) => {
        setSunTime(hours);
        return PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.SKY_SUN);
    };

    it('reddens hard as it drops to the horizon', () => {
        const noon = sunAt(12);
        const sunset = sunAt(18);
        assert.ok(redShift(noon, sunset) > 60, `noon ${noon} sunset ${sunset}`);
    });

    it('stays the reddest thing in the frame through the blue hour', () => {
        setSunTime(18);
        const palette = daytimePalette(HDNoonPalette, HDMidnightPalette);
        const sun = PaletteColor(palette, PaletteCategory.SKY_SUN);
        for (const category of [PaletteCategory.FOG_SKY, PaletteCategory.SKY, PaletteCategory.SKY_CLOUD]) {
            assert.ok(redShift(PaletteColor(palette, category), sun) > 0,
                `sun ${sun} should be warmer than ${category} ${PaletteColor(palette, category)}`);
        }
    });
});

/** How much redder `b` is than `a`, as red minus blue. */
function redShift(a: string, b: string): number {
    const channels = (css: string) => {
        const n = parseInt(css.slice(1), 16);
        return [(n >> 16) & 0xff, n & 0xff];
    };
    const [ar, ab] = channels(a);
    const [br, bb] = channels(b);
    return (br - bb) - (ar - ab);
}
