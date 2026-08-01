/**
 * Flat-shaded carrier-style ski-jump for the mid-runway ramp.
 * Curved deck matches {@link skiJumpDeckHeight}; origin at base (y=0), tip at +Z.
 * Top deck is dark gray asphalt; sides/underside use a lighter threshold tone.
 */
import * as THREE from 'three';
import { PaletteCategory } from '../../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../../materials/materials';
import { updateUniforms } from '../../utils';
import { Model, ModelLibBuilder } from '../models';
import {
    skiJumpDeckHeight,
    SKI_JUMP_HEIGHT_M,
    SKI_JUMP_LENGTH_M,
    SKI_JUMP_WIDTH_M,
} from '../../entities/skiJump';

/** Segments along the takeoff axis for the curved deck. */
const DECK_SEGMENTS = 16;

export class SkiJumpModelLibBuilder implements ModelLibBuilder {
    type: string;

    constructor(
        type: string,
        private length = SKI_JUMP_LENGTH_M,
        private height = SKI_JUMP_HEIGHT_M,
        private width = SKI_JUMP_WIDTH_M,
        private deckColor: PaletteCategory = PaletteCategory.SCENERY_ROAD_MAIN,
        private sideColor: PaletteCategory = PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD,
    ) {
        this.type = type;
    }

    build(materials: SceneMaterialManager): Model {
        const L = this.length;
        const H = this.height;
        const hw = this.width * 0.5;
        const segs = DECK_SEGMENTS;
        const deckVerts: number[] = [];
        const sideVerts: number[] = [];

        const pushTri = (
            out: number[],
            ax: number, ay: number, az: number,
            bx: number, by: number, bz: number,
            cx: number, cy: number, cz: number,
        ) => {
            out.push(ax, ay, az, bx, by, bz, cx, cy, cz);
        };

        for (let i = 0; i < segs; i++) {
            const t0 = i / segs;
            const t1 = (i + 1) / segs;
            const z0 = t0 * L;
            const z1 = t1 * L;
            const y0 = skiJumpDeckHeight(t0, H);
            const y1 = skiJumpDeckHeight(t1, H);

            // Deck (upward) — dark gray; CCW when viewed from +Y so the normal faces up.
            pushTri(deckVerts, -hw, y0, z0, hw, y1, z1, hw, y0, z0);
            pushTri(deckVerts, -hw, y0, z0, -hw, y1, z1, hw, y1, z1);
            // Left side
            pushTri(sideVerts, -hw, 0, z0, -hw, y0, z0, -hw, y1, z1);
            pushTri(sideVerts, -hw, 0, z0, -hw, y1, z1, -hw, 0, z1);
            // Right side
            pushTri(sideVerts, hw, 0, z0, hw, 0, z1, hw, y1, z1);
            pushTri(sideVerts, hw, 0, z0, hw, y1, z1, hw, y0, z0);
            // Underside
            pushTri(sideVerts, -hw, 0, z0, -hw, 0, z1, hw, 0, z1);
            pushTri(sideVerts, -hw, 0, z0, hw, 0, z1, hw, 0, z0);
        }

        // Vertical tip face at z=L
        pushTri(sideVerts, -hw, 0, L, -hw, H, L, hw, H, L);
        pushTri(sideVerts, -hw, 0, L, hw, H, L, hw, 0, L);

        const makeMesh = (verts: number[], category: PaletteCategory) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            geometry.computeVertexNormals();
            const mesh = new THREE.Mesh(geometry, materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category,
                depthWrite: true,
                shaded: false,
                colorDither: false,
            }));
            mesh.onBeforeRender = updateUniforms;
            return mesh;
        };

        const deck = makeMesh(deckVerts, this.deckColor);
        const sides = makeMesh(sideVerts, this.sideColor);

        return {
            lod: [
                { flats: [], volumes: [deck, sides] },
                { flats: [], volumes: [deck, sides] },
            ],
            animations: [],
            maxSize: Math.max(L, this.width, H),
            center: new THREE.Vector3(0, H * 0.5, L * 0.5),
        };
    }
}
