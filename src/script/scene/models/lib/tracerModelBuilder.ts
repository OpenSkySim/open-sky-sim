import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../../materials/materials';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from '../models';

/** Length of the tracer streak along its travel axis (local +Z), in metres. */
const TRACER_LENGTH = 12;
const TRACER_WIDTH = 0.6;

/**
 * A short, bright tracer streak used to render gun projectiles. Built as a thin
 * emissive box oriented along local +Z (the projectile's travel direction), so
 * the entity only needs to align it with the velocity vector.
 */
export class TracerModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(type: string, private color: PaletteCategory = PaletteCategory.LIGHT_YELLOW) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const geometry = new THREE.BoxGeometry(TRACER_WIDTH, TRACER_WIDTH, TRACER_LENGTH);
        const material = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: this.color,
            shaded: false,
            depthWrite: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.onBeforeRender = updateUniforms;

        const point = new THREE.Points(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
            materials.build({
                type: SceneMaterialPrimitiveType.POINT,
                category: this.color,
                depthWrite: false,
            }),
        );
        point.onBeforeRender = updateUniforms;

        return {
            lod: [
                { flats: [], volumes: [mesh] },
                { flats: [], volumes: [mesh] },
                { flats: [point], volumes: [] },
            ],
            animations: [],
            maxSize: TRACER_LENGTH,
            center: new THREE.Vector3(),
        };
    }
}
