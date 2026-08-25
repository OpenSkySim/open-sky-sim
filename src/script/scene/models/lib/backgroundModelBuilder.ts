import * as THREE from 'three';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { PaletteCategory } from '../../../config/palettes/palette';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";

const SKY_SIZE = 100000;

/**
 * The sky billboard. There used to be a matching GROUND plane here, but the
 * planetary terrain supplies its own ground now and an infinite plane fights
 * DEM relief, so only SKY remains.
 */
export class BackgroundModelLibBuilder implements ModelLibBuilder {

    constructor(public type: BackgroundModelLibBuilder.Type) { }

    build(materials: SceneMaterialManager): Model {
        const geometry = this.buildGeometry();
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SKY,
            depthWrite: false,
            highp: true,
            shaded: false
        }));
        mesh.name = this.type;
        mesh.onBeforeRender = updateUniforms;
        return {
            lod: [{
                flats: [mesh],
                volumes: []
            }],
            animations: [],
            maxSize: SKY_SIZE,
            center: new THREE.Vector3()
        };
    }

    private buildGeometry(): THREE.PlaneGeometry {
        const geometry = new THREE.PlaneGeometry(SKY_SIZE, SKY_SIZE, 1, 1);
        geometry.center();
        geometry.rotateX(Math.PI / 2);
        return geometry;
    }
}

export namespace BackgroundModelLibBuilder {
    export enum Type {
        SKY = 'SKY'
    }
}
