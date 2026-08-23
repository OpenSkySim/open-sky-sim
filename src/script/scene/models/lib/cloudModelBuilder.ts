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

/** Deterministic [0,1) hash — avoids Math.random() so a model's shape is stable across rebuilds. */
function hash01(n: number): number {
    const s = Math.sin(n * 12.9898) * 43758.5453;
    return s - Math.floor(s);
}

/** Half-angle (rad) of the cone around straight-up that growth puffs are scattered within. */
const HAZE_SCATTER_HALF_ANGLE = Math.PI * 0.3;

interface HazeTier {
    puffsPerLobe: number;
    /** Screen-space stipple density: higher = more opaque, lower = more see-through. */
    alphaDither: number;
    distMin: number;
    distMax: number;
    radiusMin: number;
    radiusMax: number;
}

/**
 * Density bands, closest/densest to farthest/sparsest — mimics how a real
 * cumulus top softens gradually from the solid body into thin haze rather
 * than cutting off at one uniform transparency.
 */
const HAZE_TIERS: HazeTier[] = [
    { puffsPerLobe: 4, alphaDither: 0.98, distMin: 0.15, distMax: 0.28, radiusMin: 0.45, radiusMax: 0.65 },
    { puffsPerLobe: 4, alphaDither: 0.95, distMin: 0.25, distMax: 0.4, radiusMin: 0.4, radiusMax: 0.6 },
    { puffsPerLobe: 4, alphaDither: 0.88, distMin: 0.35, distMax: 0.5, radiusMin: 0.35, radiusMax: 0.55 },
    { puffsPerLobe: 5, alphaDither: 0.75, distMin: 0.5, distMax: 0.68, radiusMin: 0.3, radiusMax: 0.48 },
    { puffsPerLobe: 5, alphaDither: 0.6, distMin: 0.68, distMax: 0.88, radiusMin: 0.26, radiusMax: 0.42 },
    { puffsPerLobe: 4, alphaDither: 0.45, distMin: 0.88, distMax: 1.08, radiusMin: 0.2, radiusMax: 0.34 },
    { puffsPerLobe: 4, alphaDither: 0.3, distMin: 1.08, distMax: 1.3, radiusMin: 0.15, radiusMax: 0.28 },
];

/**
 * Extra icosahedron puffs — same construction as the solid lobes, just
 * smaller and scattered over each lobe's top (confined to a cone around
 * straight-up, so they only ever sit over the top, never the sides or
 * underside). Each puff's own bottom is then clamped to stay at or above the
 * cluster's flat base (`minY`), so a wide-angle puff on a low lobe can never
 * dip below the solid body's underside. Rendered separately per tier with a
 * dithered stipple (see build()) so they read as soft, semi-transparent
 * growth billowing off the cloud top, thinning out with distance from the
 * solid body.
 */
function buildHazeTierGeometry(lobes: CloudPuffLobe[], tier: HazeTier, tierIndex: number, minY: number): THREE.BufferGeometry {
    const puffs: THREE.BufferGeometry[] = [];
    for (let li = 0; li < lobes.length; li++) {
        const l = lobes[li];
        for (let i = 0; i < tier.puffsPerLobe; i++) {
            const seed = li * 131 + tierIndex * 977 + i;
            const theta = hash01(seed * 1.7) * HAZE_SCATTER_HALF_ANGLE; // angle off straight-up
            const phi = hash01(seed * 3.1 + 11) * Math.PI * 2; // spin around up axis
            const dirX = Math.sin(theta) * Math.cos(phi);
            const dirY = Math.cos(theta);
            const dirZ = Math.sin(theta) * Math.sin(phi);
            const dist = l.r * (tier.distMin + hash01(seed * 5.3 + 3) * (tier.distMax - tier.distMin));
            const puffR = l.r * (tier.radiusMin + hash01(seed * 7.9 + 5) * (tier.radiusMax - tier.radiusMin));
            const puffY = Math.max(l.y + dirY * dist, minY + puffR);

            const g = new THREE.IcosahedronGeometry(puffR, 1);
            g.translate(l.x + dirX * dist, puffY, l.z + dirZ * dist);
            puffs.push(g);
        }
    }
    return mergeGeometries(puffs);
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

        // Screen-space stipple discard — no real alpha blend pipeline here,
        // just soft, semi-transparent growth puffs over the cloud top, one
        // mesh per density tier since alphaDither is a per-material uniform.
        const hazeMeshes = HAZE_TIERS.map((tier, i) => {
            const m = new THREE.Mesh(buildHazeTierGeometry(this.lobes, tier, i, baseY), materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: PaletteCategory.SKY_CLOUD,
                depthWrite: false,
                shaded: false,
                alphaDither: tier.alphaDither,
            }));
            m.onBeforeRender = updateUniforms;
            return m;
        });

        // Growth puffs reach up to ~1.2r out from a lobe's centre plus their
        // own ~0.5r radius; pad the bound generously.
        const HAZE_REACH = 1.7;
        let maxRadius = 0;
        let maxY = 0;
        for (const l of this.lobes) {
            maxRadius = Math.max(maxRadius, Math.hypot(l.x, l.z) + l.r * HAZE_REACH);
            maxY = Math.max(maxY, l.y + l.r * HAZE_REACH);
        }

        return {
            lod: [{
                flats: [],
                volumes: [mesh, ...hazeMeshes]
            }],
            animations: [],
            maxSize: 2 * maxRadius,
            center: new THREE.Vector3(0, maxY / 2, 0)
        };
    }
}
