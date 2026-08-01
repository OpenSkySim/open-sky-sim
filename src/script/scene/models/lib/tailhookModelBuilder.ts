/**
 * Procedural tailhook for carrier recovery.
 * Model origin = hinge; tip along local +Z at {@link TAILHOOK_ARM_LENGTH_M}.
 * Arm is classic navy black/white hazard stripes; tip is black.
 * The player orients it: idle along the body hinge→tip, latched toward the wire.
 */
import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../../materials/materials';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from '../models';
import { TAILHOOK_ARM_LENGTH_M } from '../../entities/arrestorCables';

/** Stripe length along the arm (m). */
const STRIPE_LEN_M = 0.18;
const ARM_THICK_M = 0.08;

export class TailhookModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const L = TAILHOOK_ARM_LENGTH_M;
        const matBlack = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.VEHICLE_PLANE_INTERIOR,
            shaded: false,
            depthWrite: true,
        });
        const matWhite = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_BUILDING_METAL_WHITE,
            shaded: false,
            depthWrite: true,
        });

        const volumes: THREE.Object3D[] = [];
        // Alternating black/white bands along +Z from hinge to tip.
        let z = 0;
        let stripe = 0;
        while (z < L - 1e-4) {
            const len = Math.min(STRIPE_LEN_M, L - z);
            const geom = new THREE.BoxGeometry(ARM_THICK_M, ARM_THICK_M, len);
            const mat = (stripe % 2 === 0) ? matBlack : matWhite;
            const band = new THREE.Mesh(geom, mat);
            band.position.set(0, 0, z + len * 0.5);
            band.onBeforeRender = updateUniforms;
            volumes.push(band);
            z += len;
            stripe++;
        }

        // Tip hook — black for contrast at the catch point.
        const tipGeom = new THREE.BoxGeometry(0.18, 0.12, 0.22);
        const tipMesh = new THREE.Mesh(tipGeom, matBlack);
        tipMesh.position.set(0, 0, L);
        tipMesh.onBeforeRender = updateUniforms;
        volumes.push(tipMesh);

        return {
            lod: [
                { flats: [], volumes },
                { flats: [], volumes },
                { flats: [], volumes: [tipMesh] },
            ],
            animations: [],
            maxSize: L + 0.5,
            center: new THREE.Vector3(0, 0, L * 0.5),
        };
    }
}
