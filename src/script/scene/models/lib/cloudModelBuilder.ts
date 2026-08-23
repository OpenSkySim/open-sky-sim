import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";
import { mergeGeometries } from './vegetationModelBuilder';

/** A single faceted puff within a cloud cluster, in local space (metres). */
export interface CloudPuffLobe {
    x: number;
    y: number;
    z: number;
    r: number;
}

/**
 * Hand-placed lobe clusters, low-poly icosahedrons merged into one mesh —
 * the same "clump of overlapping blobs" trick used for tree canopies
 * (see vegetationModelBuilder.ts), just scaled up and flattened out for
 * puffy, flat-shaded 90s-style cumulus silhouettes.
 */
export const CLOUD_PUFF_SHAPES: Record<string, CloudPuffLobe[]> = {
    small: [
        { x: 0, y: 0, z: 0, r: 70 },
        { x: 60, y: 15, z: 30, r: 55 },
        { x: -55, y: 10, z: -25, r: 50 },
        { x: 10, y: 35, z: -10, r: 45 },
    ],
    medium: [
        { x: -110, y: 0, z: 0, r: 95 },
        { x: 20, y: 20, z: 20, r: 120 },
        { x: 130, y: 5, z: -15, r: 100 },
        { x: 40, y: 55, z: -5, r: 75 },
        { x: -40, y: 40, z: 30, r: 65 },
    ],
    large: [
        { x: -150, y: 0, z: 0, r: 130 },
        { x: 20, y: 10, z: 40, r: 170 },
        { x: 170, y: 5, z: -30, r: 140 },
        { x: 50, y: 80, z: -10, r: 120 },
        { x: -60, y: 110, z: 30, r: 100 },
        { x: 10, y: 170, z: 0, r: 80 },
    ],
};

/**
 * Squash every vertex below `localFlattenY` (lobe-local space, pre-translate)
 * onto that plane. Lobes anchored at the cluster's lowest point end up as a
 * clean hemisphere-on-a-disk; lobes stacked higher for a towering silhouette
 * fall fully above the cut and stay round, since their underside is buried
 * inside the puffs below anyway. Gives the whole cluster one level, flat
 * underside — like real cumulus — instead of a floating blob.
 */
function flattenBase(geometry: THREE.BufferGeometry, localFlattenY: number): THREE.BufferGeometry {
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) < localFlattenY) {
            pos.setY(i, localFlattenY);
        }
    }
    pos.needsUpdate = true;
    return geometry;
}

export class CloudModelLibBuilder implements ModelLibBuilder {

    constructor(public type: string, private lobes: CloudPuffLobe[]) { }

    build(materials: SceneMaterialManager): Model {
        if (this.lobes.length === 0) {
            // An "empty" cloud kind — lets a field's cell variations include
            // gaps of open sky without needing per-cell density logic.
            return {
                lod: [{ flats: [], volumes: [] }],
                animations: [],
                maxSize: 0,
                center: new THREE.Vector3(),
            };
        }

        const baseY = Math.min(...this.lobes.map(l => l.y));
        const geometry = mergeGeometries(this.lobes.map(l => {
            const g = new THREE.IcosahedronGeometry(l.r, 1);
            flattenBase(g, baseY - l.y);
            g.translate(l.x, l.y, l.z);
            return g;
        }));
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SKY_CLOUD,
            depthWrite: true,
            // Lit like terrain (per-face shade toward the light, dithered
            // terminator) rather than a flat billboard fill — clouds are
            // real volumes with a sunlit top and a shadowed, flat underside.
            shaded: true,
        }));
        mesh.onBeforeRender = updateUniforms;

        let maxRadius = 0;
        let maxY = 0;
        for (const l of this.lobes) {
            maxRadius = Math.max(maxRadius, Math.hypot(l.x, l.z) + l.r);
            maxY = Math.max(maxY, l.y + l.r);
        }

        return {
            lod: [{
                flats: [],
                volumes: [mesh]
            }],
            animations: [],
            maxSize: 2 * maxRadius,
            center: new THREE.Vector3(0, maxY / 2, 0)
        };
    }
}
