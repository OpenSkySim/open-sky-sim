import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from "../../materials/materials";
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from "../models";
import { mergeGeometries } from './vegetationModelBuilder';

/**
 * A single elongated wisp within a cirrus streak, in local space (metres).
 * Built from a unit icosahedron squashed thin (height) and stretched long
 * (length) — the same "clump of blobs" trick as the cumulus puffs, just
 * anisotropic so it reads as a fibrous streak instead of a round puff.
 */
export interface CirrusWisp {
    x: number;
    y: number;
    z: number;
    length: number; // along X
    width: number; // along Z
    height: number; // along Y — kept thin
}

/**
 * Hand-placed streak clusters for the high-altitude cirrus layer. Unlike the
 * cumulus puffs, these have no flat base — cirrus is thin ice-crystal haze
 * with no real underside to speak of, so every wisp is just a squashed,
 * elongated blob.
 */
export const CIRRUS_STREAK_SHAPES: Record<string, CirrusWisp[]> = {
    thin: [
        { x: 0, y: 0, z: 0, length: 4500, width: 800, height: 175 },
        { x: 2600, y: 30, z: 225, length: 3100, width: 600, height: 140 },
        { x: -2350, y: -25, z: -175, length: 2800, width: 550, height: 130 },
    ],
    wide: [
        { x: 0, y: 0, z: 0, length: 7000, width: 1300, height: 225 },
        { x: 3800, y: 50, z: 325, length: 4750, width: 1000, height: 190 },
        { x: -3600, y: -40, z: -375, length: 4500, width: 950, height: 180 },
        { x: 1100, y: 80, z: -850, length: 3500, width: 750, height: 150 },
    ],
};

export class CirrusModelLibBuilder implements ModelLibBuilder {

    constructor(public type: string, private wisps: CirrusWisp[]) { }

    build(materials: SceneMaterialManager): Model {
        if (this.wisps.length === 0) {
            // An "empty" cirrus kind — lets a field's cell variations include
            // gaps of open sky without needing per-cell density logic.
            return {
                lod: [{ flats: [], volumes: [] }],
                animations: [],
                maxSize: 0,
                center: new THREE.Vector3(),
            };
        }

        const geometry = mergeGeometries(this.wisps.map(w => {
            const g = new THREE.IcosahedronGeometry(1, 1);
            g.scale(w.length / 2, w.height / 2, w.width / 2);
            g.translate(w.x, w.y, w.z);
            return g;
        }));
        const mesh = new THREE.Mesh(geometry, materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SKY_CLOUD,
            depthWrite: false,
            shaded: false,
            // Thin, high-altitude streaks — mostly see-through, and dithered
            // with the palette's shadow tone alongside the lit one so they
            // read as fibrous wisps rather than a flat, uniform wash.
            alphaDither: 0.35,
            colorDither: true,
        }));
        mesh.onBeforeRender = updateUniforms;

        let maxRadius = 0;
        let maxY = 0;
        for (const w of this.wisps) {
            const reach = Math.max(w.length, w.width) / 2;
            maxRadius = Math.max(maxRadius, Math.hypot(w.x, w.z) + reach);
            maxY = Math.max(maxY, w.y + w.height / 2);
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
