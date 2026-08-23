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
        { x: 0, y: 0, z: 0, r: 110 },
        { x: 95, y: 20, z: 45, r: 85 },
        { x: -90, y: 15, z: -40, r: 80 },
        { x: 15, y: 55, z: -15, r: 70 },
        { x: -50, y: 30, z: 60, r: 65 },
        { x: 70, y: 10, z: -70, r: 60 },
    ],
    medium: [
        { x: -170, y: 0, z: 0, r: 150 },
        { x: 30, y: 30, z: 30, r: 190 },
        { x: 200, y: 8, z: -25, r: 160 },
        { x: 60, y: 85, z: -10, r: 120 },
        { x: -60, y: 60, z: 45, r: 105 },
        { x: -140, y: 40, z: -80, r: 90 },
        { x: 150, y: 60, z: 80, r: 95 },
        { x: 10, y: 120, z: -40, r: 80 },
    ],
    large: [
        { x: -230, y: 0, z: 0, r: 200 },
        { x: 30, y: 15, z: 60, r: 260 },
        { x: 260, y: 8, z: -45, r: 210 },
        { x: 80, y: 120, z: -15, r: 180 },
        { x: -90, y: 170, z: 45, r: 150 },
        { x: 15, y: 250, z: 0, r: 120 },
        { x: -200, y: 60, z: -120, r: 140 },
        { x: 220, y: 70, z: 120, r: 150 },
        { x: -50, y: 220, z: -60, r: 100 },
        { x: 120, y: 280, z: 20, r: 90 },
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
