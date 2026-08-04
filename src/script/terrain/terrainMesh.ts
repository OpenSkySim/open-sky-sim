import * as THREE from 'three';
import { PaletteCategory } from '../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../scene/materials/materials';
import { updateUniforms } from '../scene/utils';
import { Ecef, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';
import { RenderFrame } from './renderFrame';
import { TileId, tileBounds } from './tileId';

const SKIRT_DEPTH = 200; // metres below min height

/**
 * Verts per tile edge. High zooms track ~30 m DEM: z11 tile ≈ 9 km → 129
 * intervals ≈ 70 m; z12 ≈ 35 m.
 */
export function meshResForZoom(z: number): number {
    if (z <= 3) {
        return 9;
    }
    if (z <= 5) {
        return 13;
    }
    if (z <= 7) {
        return 17;
    }
    if (z <= 9) {
        return 33;
    }
    if (z <= 11) {
        return 129;
    }
    // z12 ≈ 4.5 km tile → ~35 m cells (DEM-native shoreline sampling).
    if (z === 12) {
        return 129;
    }
    return 97;
}

/**
 * Grid res for a tile: flat land does not need a dense grid. Coast / pad tiles
 * request `fullRes` (shoreline pattern and pad feather need the density).
 * Skirts hide the cracks between neighbours of differing density.
 *
 * Inland (esp. high zoom / close range) is hard-capped — beaches own the
 * triangle budget. `detailScale` can sparsify inland further under load.
 */
export function meshResForTile(
    z: number,
    deltaHM: number,
    fullRes: boolean,
    detailScale = 1,
): number {
    const base = meshResForZoom(z);
    let res: number;
    if (fullRes) {
        // Coast/pad: land/water boundary == grid step. Boost mid zooms (z5–z10)
        // so tiles still climbing toward the z11 floor aren't km-scale stairs.
        res = z >= 5 && z <= 10 ? Math.max(base, z <= 9 ? 65 : 129) : base;
    } else {
        // Inland: absolute caps, not fractions of the coast zoom table.
        // Close-range z11 tiles would otherwise still carry 65² verts.
        const d = Math.max(0, deltaHM);
        if (d < 10) {
            res = Math.min(base, 9);
        } else if (d < 60) {
            res = Math.min(base, 13);
        } else {
            res = Math.min(base, 17);
        }
    }
    // Coast/pad grids are exempt from the governor: shoreline silhouette
    // quality is a hard requirement, so load-shedding happens inland only.
    const divisor = fullRes ? 1 : detailScale >= 16 ? 4 : detailScale >= 6 ? 2 : 1;
    if (divisor > 1) {
        res = Math.max(9, ((res - 1) / divisor | 0) + 1);
    }
    return res;
}
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
    /** Verts per edge the mesh was built with — lets reconcile spot stale grids. */
    res: number;
    /** Finest resident DEM zoom at build time (set by the owner) — a mesh baked
     * from coarse ancestor data is rebuilt once the native-zoom tile arrives. */
    demZoom?: number;
    /** Height-source revision at bake time (flatten pad lock generation). */
    heightRevision?: number;
    /** Whether the mesh used the full zoom-table grid (coast / pad feather). */
    fullRes?: boolean;
    /** Single grass tone (no 3-tone checker) — flat pad interior. */
    uniformLandTone?: boolean;
    /** Palette materials used when F8 LOD wireframe is off. */
    paletteMaterials: THREE.Material[];
    dispose(): void;
}

export interface TerrainMeshOptions {
    /** Tile height range (m) — drives adaptive grid density. */
    deltaH?: number;
    /** Force the full zoom-table grid (coast / pad tiles). */
    fullRes?: boolean;
    /** Frame-time governor scale (1 = full grids, higher = sparser). */
    detailScale?: number;
    /** Flatten-pad height revision at bake time. */
    heightRevision?: number;
    /** One land material for the whole tile (flat pad — avoids checker shimmer). */
    uniformLandTone?: boolean;
}

/**
 * Terrain materials are unshaded, so their uniforms are camera-global — every
 * tile with the same palette category can share one material. Sharing keeps
 * SceneMaterialManager's registry small (setPalette iterates it per frame) and
 * lets three.js reuse GL program state across the thousands of tile draws.
 */
const sharedTerrainMats = new WeakMap<SceneMaterialManager, Map<PaletteCategory, THREE.Material>>();

/** Per-zoom materials for F8 LOD wireframe (rawColor, not palette). */
const sharedLodDebugMats = new WeakMap<SceneMaterialManager, Map<number, THREE.Material>>();

/** Live handles so F8 can recolor existing tiles without a rebuild. */
const liveTerrainMeshes = new Set<TerrainMeshHandle>();

/** F8 debug: wireframe + one color per QT zoom level. */
let terrainWireframe = false;

/** Distinct colours for zoom 0…n — cycle if the QT goes past the table. */
const LOD_DEBUG_COLORS: readonly string[] = [
    '#e6194b', // 0 red
    '#3cb44b', // 1 green
    '#ffe119', // 2 yellow
    '#4363d8', // 3 blue
    '#f58231', // 4 orange
    '#911eb4', // 5 purple
    '#42d4f4', // 6 cyan
    '#f032e6', // 7 magenta
    '#bfef45', // 8 lime
    '#fabebe', // 9 pink
    '#469990', // 10 teal
    '#e6beff', // 11 lavender
    '#9a6324', // 12 brown
    '#ffd8b1', // 13 apricot
    '#800000', // 14 maroon
    '#aaffc3', // 15 mint
];

export function lodDebugColor(z: number): string {
    const i = ((Math.max(0, z | 0) % LOD_DEBUG_COLORS.length) + LOD_DEBUG_COLORS.length)
        % LOD_DEBUG_COLORS.length;
    return LOD_DEBUG_COLORS[i];
}

function sharedTerrainMaterial(materials: SceneMaterialManager, category: PaletteCategory): THREE.Material {
    let byCategory = sharedTerrainMats.get(materials);
    if (!byCategory) {
        byCategory = new Map();
        sharedTerrainMats.set(materials, byCategory);
    }
    let mat = byCategory.get(category);
    if (!mat) {
        mat = materials.build({
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
        mat.wireframe = false;
        byCategory.set(category, mat);
    }
    return mat;
}

function sharedLodDebugMaterial(materials: SceneMaterialManager, z: number): THREE.Material {
    let byZoom = sharedLodDebugMats.get(materials);
    if (!byZoom) {
        byZoom = new Map();
        sharedLodDebugMats.set(materials, byZoom);
    }
    let mat = byZoom.get(z);
    if (!mat) {
        mat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.TERRAIN_GRASS,
            rawColor: lodDebugColor(z),
            colorDither: false,
            depthWrite: true,
            shaded: false,
            highp: true,
        });
        mat.side = THREE.DoubleSide;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = 1;
        mat.polygonOffsetUnits = 1;
        mat.wireframe = true;
        byZoom.set(z, mat);
    }
    return mat;
}

function applyTerrainMeshDebugStyle(
    handle: TerrainMeshHandle,
    materials: SceneMaterialManager,
): void {
    const mesh = handle.root as THREE.Mesh;
    if (terrainWireframe) {
        mesh.material = sharedLodDebugMaterial(materials, handle.id.z);
        return;
    }
    const mats = handle.paletteMaterials;
    mesh.material = mats.length === 1 ? mats[0] : mats;
}

/** Toggle F8 LOD wireframe: edge-only, one colour per zoom level. */
export function setTerrainWireframe(materials: SceneMaterialManager, enabled: boolean): void {
    terrainWireframe = enabled;
    for (const handle of liveTerrainMeshes) {
        applyTerrainMeshDebugStyle(handle, materials);
    }
}

export function isTerrainWireframe(): boolean {
    return terrainWireframe;
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
    opts: TerrainMeshOptions = {},
): TerrainMeshHandle {
    const b = tileBounds(id);
    const res = opts.fullRes === undefined && opts.deltaH === undefined
        ? meshResForZoom(id.z)
        : meshResForTile(id.z, opts.deltaH ?? Infinity, opts.fullRes ?? false, opts.detailScale ?? 1);
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
    const landTone = (ix: number, iy: number, tri: number) =>
        opts.uniformLandTone ? 1 : landToneIndex(ix, iy, tri);

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
            pushTri(i, i + 1, i + res, landTone(ix, iy, 0));
            pushTri(i + 1, i + res + 1, i + res, landTone(ix, iy, 1));
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
        addSkirtEdge(ix, ix + 1, landTone(ix, 0, 0));
        addSkirtEdge((res - 1) * res + ix, (res - 1) * res + ix + 1, landTone(ix, res - 2, 0));
    }
    for (let iy = 0; iy < res - 1; iy++) {
        addSkirtEdge(iy * res, (iy + 1) * res, landTone(0, iy, 0));
        addSkirtEdge(iy * res + (res - 1), (iy + 1) * res + (res - 1), landTone(res - 2, iy, 0));
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
        mats.push(sharedTerrainMaterial(materials, category));
    };

    addGroup(waterIndices, PaletteCategory.TERRAIN_WATER);
    for (let t = 0; t < LAND_TONE_CATEGORIES.length; t++) {
        addGroup(landToneIndices[t], LAND_TONE_CATEGORIES[t]);
    }

    geometry.setIndex(indices);
    // No vertex normals: terrain materials are unshaded (flat/highp shaders
    // never read them) and computing them dominates tile build time.
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, mats.length === 1 ? mats[0] : mats);
    mesh.frustumCulled = false;
    mesh.onBeforeRender = updateUniforms;
    mesh.name = `terrain:${id.z}/${id.x}/${id.y}`;

    const handle: TerrainMeshHandle = {
        id,
        root: mesh,
        res,
        heightRevision: opts.heightRevision,
        fullRes: opts.fullRes ?? false,
        uniformLandTone: opts.uniformLandTone ?? false,
        paletteMaterials: mats,
        dispose() {
            liveTerrainMeshes.delete(handle);
            geometry.dispose();
            // Materials are owned by SceneMaterialManager — do not dispose.
        },
    };
    liveTerrainMeshes.add(handle);
    applyTerrainMeshDebugStyle(handle, materials);
    return handle;
}
