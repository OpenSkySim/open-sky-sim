import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";

/**
 * Distance the disc is parked at, in the background-sky camera's space. That
 * camera sits at the origin and only copies the main camera's rotation, so
 * anything here is effectively at infinity however far the player flies.
 *
 * Kept small on purpose. Fog is applied by distance, and while the sun's
 * categories fall through to the sparse FOG_TERRAIN density rather than the
 * thick FOG_SKY one, the night-vision profiles are dense enough to visibly wash
 * a disc parked out at tens of thousands of units. At this range no profile
 * fogs it by more than a percent or two.
 */
export const SUN_DISTANCE = 500;

/**
 * Apparent diameters, in degrees. The real sun spans 0.53, which at a 50 degree
 * vertical FOV over 200 scanlines is a pixel and a half: technically right and
 * visually absent. Every sim of the era drew it several times oversize, and so
 * does this - about four times, which lands it around 9 px at 320x200 and 18 px
 * at 640x400.
 */
const DISC_DIAMETER_DEG = 2.2;
const INNER_GLOW_DIAMETER_DEG = 4.2;
const OUTER_GLOW_DIAMETER_DEG = 7.5;

/**
 * Segment counts. Low enough that the silhouette is visibly faceted at the
 * sizes above, which is the point: a perfect circle would read as a modern
 * sprite dropped into a flat-shaded scene.
 */
const DISC_SEGMENTS = 12;
const GLOW_SEGMENTS = 10;

/**
 * Ordered-dither opacity of the two corona steps (higher = denser). There is no
 * alpha blending in this pipeline, so the falloff around the disc is built the
 * way the era built it: concentric rings at decreasing stipple densities.
 */
const INNER_GLOW_DITHER = 0.62;
const OUTER_GLOW_DITHER = 0.3;

/**
 * Draw order within the background-sky pass. The sky billboard leaves this at
 * its default 0; nothing in the pass writes depth, so paint order alone decides
 * what covers what, and the corona has to land on top of the sky before the
 * disc lands on top of the corona.
 */
const OUTER_GLOW_RENDER_ORDER = 1;
const INNER_GLOW_RENDER_ORDER = 2;
const DISC_RENDER_ORDER = 3;

/**
 * Elevation below which the disc is hidden: half its own apparent diameter
 * under the horizon, i.e. the moment its upper limb finishes setting.
 */
export const SUN_SET_ELEVATION_DEG = -DISC_DIAMETER_DEG / 2;

/** Half-angle in degrees to a radius at {@link SUN_DISTANCE}. */
function radiusForDiameter(diameterDeg: number): number {
    return SUN_DISTANCE * Math.tan(diameterDeg / 2 * THREE.MathUtils.DEG2RAD);
}

/** The model is built in the XY plane, so its face normal is +Z. */
const MODEL_NORMAL = new THREE.Vector3(0, 0, 1);
const towardsCamera = new THREE.Vector3();

/**
 * Parks the sun `sunDir` points at, writing into `position` / `quaternion`.
 *
 * Both are in the background-sky camera's space, where the camera is pinned at
 * the origin, so the disc goes out along the sun direction and its normal comes
 * straight back down it.
 */
export function placeSun(sunDir: THREE.Vector3, position: THREE.Vector3, quaternion: THREE.Quaternion): void {
    position.copy(sunDir).multiplyScalar(SUN_DISTANCE);
    quaternion.setFromUnitVectors(MODEL_NORMAL, towardsCamera.copy(sunDir).negate());
}

/**
 * The sun: a faceted disc with a two-step dithered corona, drawn into the
 * background-sky layer so the terrain pass paints over it and the disc really
 * does set behind the horizon.
 *
 * The model is built facing +Z; whoever places it owns pointing that normal
 * back down the sun direction (see Game.updateSunEntity).
 */
export class SunModelLibBuilder implements ModelLibBuilder {

    constructor(public type: string) { }

    build(materials: SceneMaterialManager): Model {
        const flats = [
            this.buildRing(materials, OUTER_GLOW_DIAMETER_DEG, GLOW_SEGMENTS, PaletteCategory.SKY_SUN_GLOW,
                OUTER_GLOW_DITHER, OUTER_GLOW_RENDER_ORDER, 'sunGlowOuter'),
            this.buildRing(materials, INNER_GLOW_DIAMETER_DEG, GLOW_SEGMENTS, PaletteCategory.SKY_SUN_GLOW,
                INNER_GLOW_DITHER, INNER_GLOW_RENDER_ORDER, 'sunGlowInner'),
            this.buildRing(materials, DISC_DIAMETER_DEG, DISC_SEGMENTS, PaletteCategory.SKY_SUN,
                0, DISC_RENDER_ORDER, 'sunDisc'),
        ];

        return {
            lod: [{ flats, volumes: [] }],
            animations: [],
            maxSize: 2 * radiusForDiameter(OUTER_GLOW_DIAMETER_DEG),
            center: new THREE.Vector3(),
        };
    }

    private buildRing(
        materials: SceneMaterialManager, diameterDeg: number, segments: number,
        category: PaletteCategory, alphaDither: number, renderOrder: number, name: string,
    ): THREE.Mesh {
        const geometry = new THREE.CircleGeometry(radiusForDiameter(diameterDeg), segments);
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category,
            depthWrite: false,
            shaded: false,
            alphaDither,
            // One flat tone per step. The corona's gradation comes from the
            // stipple density, not from a second palette tone.
            colorDither: false,
        }));
        mesh.name = name;
        mesh.renderOrder = renderOrder;
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }
}
