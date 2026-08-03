import * as THREE from 'three';
import { PaletteCategory } from '../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../scene/materials/materials';
import { updateUniforms } from '../scene/utils';
import { Ecef, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';
import { RenderFrame } from './renderFrame';
import { TileId, tileBounds } from './tileId';

const MESH_RES = 33; // verts per edge (~2× denser than 17)
const SKIRT_DEPTH = 200; // metres below min height
/** DSM / DEM values at or below this (relative to seaLevel) render as water. */
export const WATER_HEIGHT_EPS_M = 0.5;

/** Three land palette tones used for the triangle checker pattern. */
export const LAND_TONE_CATEGORIES: readonly PaletteCategory[] = [
    PaletteCategory.TERRAIN_SAND,
    PaletteCategory.TERRAIN_GRASS,
    PaletteCategory.TERRAIN_BARE,
];

const _ecef: Ecef = { x: 0, y: 0, z: 0 };

export function isWaterHeight(h: number, seaLevel: number = 0): boolean {
    return !Number.isFinite(h) || h <= seaLevel + WATER_HEIGHT_EPS_M;
}

/**
 * 3-tone index for a surface triangle so edge-adjacent tris tend to differ.
 * `tri` is 0 or 1 within the quad cell (ix, iy).
 */
export function landToneIndex(ix: number, iy: number, tri: number): number {
    return ((ix + 2 * iy + tri) % 3 + 3) % 3;
}

export function paletteForHeight(h: number, slope: number, seaLevel: number = 0): PaletteCategory {
    if (isWaterHeight(h, seaLevel)) {
        return Number.isFinite(h) && h > seaLevel - 2
            ? PaletteCategory.TERRAIN_SHALLOW_WATER
            : PaletteCategory.TERRAIN_WATER;
    }
    if (slope > 0.45) {
        return PaletteCategory.TERRAIN_BARE;
    }
    if (h < 50) {
        return PaletteCategory.TERRAIN_SAND;
    }
    if (h < 400) {
        return PaletteCategory.TERRAIN_GRASS;
    }
    if (h < 1200) {
        return slope > 0.25 ? PaletteCategory.TERRAIN_BARE : PaletteCategory.TERRAIN_GRASS;
    }
    return PaletteCategory.TERRAIN_BARE;
}

export interface TerrainMeshHandle {
    id: TileId;
    root: THREE.Object3D;
    dispose(): void;
}

/**
 * Build a displaced geographic tile mesh in render-frame space.
 * Water triangles use water material; land uses a 3-tone checker pattern.
 */
export function buildTerrainMesh(
    id: TileId,
    source: HeightSource,
    frame: RenderFrame,
    materials: SceneMaterialManager,
    seaLevel: number = 0,
): TerrainMeshHandle {
    const b = tileBounds(id);
    const res = MESH_RES;
    const positions: number[] = [];
    const heights: number[] = [];

    for (let iy = 0; iy < res; iy++) {
        const v = iy / (res - 1);
        const lat = b.north + (b.south - b.north) * v;
        for (let ix = 0; ix < res; ix++) {
            const u = ix / (res - 1);
            const lon = b.west + (b.east - b.west) * u;
            let h = source.heightAt(lon, lat);
            // DSM/DEM zero (and nodata) → flat sea surface.
            if (isWaterHeight(h, seaLevel)) {
                h = seaLevel;
            }
            heights.push(h);
            geodeticToEcef(lat, lon, h, _ecef);
            const w = frame.ecefToWorld(_ecef);
            positions.push(w.x, w.y, w.z);
        }
    }

    const waterIndices: number[] = [];
    const landToneIndices: number[][] = [[], [], []];

    const pushTri = (a: number, bIdx: number, c: number, tone: number) => {
        const water = isWaterHeight(heights[a], seaLevel)
            && isWaterHeight(heights[bIdx], seaLevel)
            && isWaterHeight(heights[c], seaLevel);
        if (water) {
            waterIndices.push(a, bIdx, c);
            return;
        }
        landToneIndices[tone].push(a, bIdx, c);
    };

    // Surface (CCW when viewed from +Y so normals point up).
    for (let iy = 0; iy < res - 1; iy++) {
        for (let ix = 0; ix < res - 1; ix++) {
            const i = iy * res + ix;
            pushTri(i, i + 1, i + res, landToneIndex(ix, iy, 0));
            pushTri(i + 1, i + res + 1, i + res, landToneIndex(ix, iy, 1));
        }
    }

    // Skirts: drop along the ellipsoid normal (same lat/lon, lower height) so
    // seams stay closed on a curved surface at long range.
    const border: Array<[number, number]> = [];
    for (let ix = 0; ix < res; ix++) {
        border.push([ix, 0]);
        border.push([ix, res - 1]);
    }
    for (let iy = 1; iy < res - 1; iy++) {
        border.push([0, iy]);
        border.push([res - 1, iy]);
    }
    const skirtOf = new Map<number, number>();
    for (const [ix, iy] of border) {
        const i = iy * res + ix;
        const v = iy / (res - 1);
        const u = ix / (res - 1);
        const lat = b.north + (b.south - b.north) * v;
        const lon = b.west + (b.east - b.west) * u;
        const h = heights[i];
        geodeticToEcef(lat, lon, h - SKIRT_DEPTH, _ecef);
        const w = frame.ecefToWorld(_ecef);
        positions.push(w.x, w.y, w.z);
        // Skirt verts inherit water/land from the surface vert for tri classify.
        heights.push(h);
        const si = positions.length / 3 - 1;
        skirtOf.set(i, si);
    }

    const addSkirtEdge = (a: number, bIdx: number, tone: number) => {
        const sa = skirtOf.get(a);
        const sb = skirtOf.get(bIdx);
        if (sa === undefined || sb === undefined) {
            return;
        }
        pushTri(a, bIdx, sa, tone);
        pushTri(bIdx, sb, sa, tone);
    };
    for (let ix = 0; ix < res - 1; ix++) {
        addSkirtEdge(ix, ix + 1, landToneIndex(ix, 0, 0));
        addSkirtEdge((res - 1) * res + ix, (res - 1) * res + ix + 1, landToneIndex(ix, res - 2, 0));
    }
    for (let iy = 0; iy < res - 1; iy++) {
        addSkirtEdge(iy * res, (iy + 1) * res, landToneIndex(0, iy, 0));
        addSkirtEdge(iy * res + (res - 1), (iy + 1) * res + (res - 1), landToneIndex(res - 2, iy, 0));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mats: THREE.Material[] = [];
    const indices: number[] = [];

    const addGroup = (tris: number[], category: PaletteCategory) => {
        if (tris.length === 0) {
            return;
        }
        geometry.addGroup(indices.length, tris.length, mats.length);
        indices.push(...tris);
        const mat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category,
            depthWrite: true,
            shaded: false,
            highp: true,
        });
        mat.side = THREE.DoubleSide;
        // Push terrain slightly back so coplanar apron/runway wins the depth test.
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = 1;
        mat.polygonOffsetUnits = 1;
        mats.push(mat);
    };

    addGroup(waterIndices, PaletteCategory.TERRAIN_WATER);
    for (let t = 0; t < LAND_TONE_CATEGORIES.length; t++) {
        addGroup(landToneIndices[t], LAND_TONE_CATEGORIES[t]);
    }

    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, mats.length === 1 ? mats[0] : mats);
    mesh.frustumCulled = false;
    mesh.onBeforeRender = updateUniforms;
    mesh.name = `terrain:${id.z}/${id.x}/${id.y}`;

    return {
        id,
        root: mesh,
        dispose() {
            geometry.dispose();
            // Materials are owned by SceneMaterialManager — do not dispose.
        },
    };
}
