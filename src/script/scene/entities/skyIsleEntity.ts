/**
 * One floating island of the Sky Isles (terrain/skyIsles.ts) on screen: the
 * rock - its top drawn like the terrain itself, the wall at the rim and the
 * underside hanging below it - then, close up, its real roads, buildings and
 * aprons from OSM, its trees where the land use has them, the vines under
 * the rim, and the waterfalls pouring off the edge.
 *
 * The top is the terrain's own land material (TerrainEntity's), so it obeys
 * the Terrain colour setting and the land-use blend exactly as the ground
 * does: each facet carries the satellite colour and the TerrainClass (OSM land
 * use over WorldCover) of its middle, and close up the island's OSM land use
 * lies over it as vector fills cut to those facets. No ground texture.
 *
 * The rock is sampled from the same functions the physics asks
 * (isleTopU / isleBottomU) on a grid, so the ground on screen is the ground
 * under the wheels to within the grid's chords. The finest level samples the
 * island's own baked grid and no finer. That level, with the roads, trees and buildings on it, is
 * built only near the island, a few milliseconds a frame (BUILD_BUDGET_MS),
 * and let go again on the way out; the coarser two are built at boot.
 */

import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { LODHelper } from '../../render/helpers';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { BUILDING_TONES, BuildingTone } from '../../terrain/buildingTones';
import { makeNoCoverTexture } from '../../terrain/coverTextures';
import { FrameShift } from '../../terrain/geodesy';
import {
    frameOffset, isleBottomU, isleBuildings, isleCaveDepth, isleClassAt, isleCoastDist, isleColourAt, isleForested,
    isleFlatWeight, isleHeightFraction, isleTopU, maxRimRadius, SkyIsle, SkyIsleFrame, SkyIsleRoadClass,
} from '../../terrain/skyIsles';
import { PtmTile } from '../../terrain/ptm';
import { buildTreeMeshes, scatterTreeSpecies, treeSpacingM } from '../../terrain/treeBillboards';
import { TerrainClass } from '../../terrain/tones';
import { Entity } from '../entity';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { ModelLodLevel, Model } from '../models/models';
import { Scene, SceneLayers } from '../scene';
import { updateUniforms } from '../utils';

const enum Tone {
    Grass = 0,
    Forest = 1,
    Rock = 2,
    Dirt = 3,
    Moss = 4,
    Foliage = 5,
    Trunk = 6,
    Water = 7,
    Scrub = 8,
    Sand = 9,
    DarkFoliage = 10,
    Foam = 11,
    Spray = 12,
    Road = 13,
    RoadMinor = 14,
}

const ISLE_TONES: readonly PaletteCategory[] = [
    PaletteCategory.TERRAIN_GRASS,
    PaletteCategory.TERRAIN_FOREST,
    PaletteCategory.SCENERY_MOUNTAIN_BARE,
    PaletteCategory.TERRAIN_BARE,
    PaletteCategory.SCENERY_MOUNTAIN_GRASS,
    PaletteCategory.SCENERY_TREE_FOLIAGE,
    PaletteCategory.SCENERY_TREE_TRUNK,
    PaletteCategory.TERRAIN_WATER,
    PaletteCategory.TERRAIN_SCRUB,
    PaletteCategory.TERRAIN_SAND,
    PaletteCategory.SCENERY_BIOME_PINE_FOLIAGE,
    PaletteCategory.TERRAIN_SNOW,
    PaletteCategory.TERRAIN_SHALLOW_WATER,
    PaletteCategory.SCENERY_ROAD_MAIN,
    PaletteCategory.SCENERY_ROAD_SECONDARY,
];

/**
 * What a class looks like where there is no imagery: the terrain bake's own
 * CLASS_COLORS (tools/bake_planet_cover.py), 0xRRGGBB by TerrainClass.
 */
const CLASS_RGB: readonly number[] = [
    0x6B6A5E, 0x2E4A2A, 0x6B6A45, 0x7B7D4E, 0x6D7A3C, 0x8E8A84, 0x8A7256, 0xE8ECF0,
    0x1E3A52, 0x4A6350, 0x2F5040, 0x7D7A5C, 0xCBB287, 0x6B6A5E, 0x6E5E4E, 0x6B6A5E,
];

/** Camera distance from the rim out to which each level is drawn, m; past the last, the last. */
const LOD_RANGE_M = [9_000, 28_000];
/** Level 0 is built once the camera is this close to the rim, and let go past NEAR_DROP_M. */
const NEAR_BUILD_M = 13_000;
const NEAR_DROP_M = 20_000;
/** Main-thread time a frame spends building level 0, ms. */
const BUILD_BUDGET_MS = 4;
/** A building shows while it is at least this many pixels big. */
const BUILDING_MIN_PX = 1.5;

/** Grid spacing of the rock at a level, m: the island's own cell, then two and four times coarser. */
function spacingFor(isle: SkyIsle, level: number): number {
    const cell = isle.shape.cellM;
    return level === 0 ? cell : level === 1 ? Math.max(70, cell * 2) : Math.max(200, cell * 4);
}

/** Road width by SkyIsleRoadClass, m. */
const ROAD_WIDTH_M = [20, 15, 10, 8, 7, 5.5, 5, 4, 3, 18];
/** Roads float this far over the facets they are draped on, m. */
const ROAD_LIFT_M = 0.6;
const PAVED_LIFT_M = 0.35;

/** The materials every island shares. */
export interface SkyIsleMaterials {
    /** Rock, underside, trees, roads, water: palette tones. */
    ground: THREE.Material;
    /** The top: the terrain's own land material. */
    land: THREE.ShaderMaterial;
    buildings: THREE.Material;
    /** For the trees: the terrain's billboard material, built per mesh like the terrain's. */
    manager: SceneMaterialManager;
    /** The terrain's tree sprite atlas (getTreeAtlas); without one, no trees. */
    treeAtlas: THREE.Texture | undefined;
}

export function buildSkyIsleMaterials(
    materials: SceneMaterialManager, land: THREE.ShaderMaterial, treeAtlas: THREE.Texture | undefined,
): SkyIsleMaterials {
    return {
        manager: materials,
        treeAtlas,
        ground: materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.TERRAIN_GRASS,
            depthWrite: true,
            shaded: true,
            vertexTones: ISLE_TONES,
        }),
        land,
        buildings: materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_WALL_PLASTER,
            depthWrite: true,
            shaded: true,
            vertexTones: BUILDING_TONES,
            prominenceCut: true,
        }),
    };
}

/** Flat-shaded triangles with a tone each, in scene axes about the island's centre; optionally a `site` per object. */
class TriangleBuilder {
    private readonly pos: number[] = [];
    private readonly nrm: number[] = [];
    private readonly tone: number[] = [];
    private readonly site: number[] | undefined;
    private readonly siteNow = [0, 0, 0, 0];
    private readonly a = new THREE.Vector3();
    private readonly b = new THREE.Vector3();
    private readonly c = new THREE.Vector3();
    private readonly n = new THREE.Vector3();
    private readonly t = new THREE.Vector3();

    constructor(private readonly frame: SkyIsleFrame, withSites = false) {
        if (withSites) this.site = [];
    }

    get count(): number {
        return this.tone.length / 3;
    }

    /** The object the next triangles belong to (see prominenceCut): its centre, and its size in m. */
    setSite(e: number, n: number, u: number, prominenceM: number): void {
        frameOffset(this.frame, e, n, u, this.t);
        this.siteNow[0] = this.t.x;
        this.siteNow[1] = this.t.y;
        this.siteNow[2] = this.t.z;
        this.siteNow[3] = Math.round(prominenceM * 10);
    }

    /** One triangle given in island metres (e, n, u), counter-clockwise seen from outside. */
    tri(ae: number, an: number, au: number, be: number, bn: number, bu: number,
        ce: number, cn: number, cu: number, tone: number): void {
        frameOffset(this.frame, ae, an, au, this.a);
        frameOffset(this.frame, be, bn, bu, this.b);
        frameOffset(this.frame, ce, cn, cu, this.c);
        const { a, b, c, n } = this;
        n.subVectors(c, b).cross(this.t.subVectors(a, b)).normalize();
        this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        for (let k = 0; k < 3; k++) {
            this.nrm.push(n.x, n.y, n.z);
            this.tone.push(tone);
            if (this.site) this.site.push(this.siteNow[0], this.siteNow[1], this.siteNow[2], this.siteNow[3]);
        }
    }

    /** Both sides of a thin sheet. */
    sheet(ae: number, an: number, au: number, be: number, bn: number, bu: number,
        ce: number, cn: number, cu: number, tone: number): void {
        this.tri(ae, an, au, be, bn, bu, ce, cn, cu, tone);
        this.tri(ae, an, au, ce, cn, cu, be, bn, bu, tone);
    }

    mesh(material: THREE.Material): THREE.Mesh | undefined {
        if (this.tone.length === 0) return undefined;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
        g.setAttribute('tone', new THREE.Uint8BufferAttribute(this.tone, 1));
        // The shaded material reads a measured colour where its alpha is set: none here.
        g.setAttribute('rawColor', new THREE.Uint8BufferAttribute(new Uint8Array(this.tone.length * 4), 4, true));
        if (this.site) g.setAttribute('site', new THREE.Float32BufferAttribute(this.site, 4));
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, material);
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }
}

let noCoverTexture: THREE.Texture | undefined;

/**
 * The top's per-draw uniforms on the terrain's shared land material: no
 * leaf dissolve and no depth push (an island has no parent tile), and no
 * cover texture - the facets are the colour. Tiles drawn after set theirs
 * again.
 */
const isleLandBeforeRender: THREE.Mesh['onBeforeRender'] = function (
    this: THREE.Mesh, renderer, scene, camera, geometry, material, group,
) {
    updateUniforms.call(this, renderer, scene, camera, geometry, material, group);
    const u = (material as THREE.ShaderMaterial).uniforms;
    if (!u?.uLodFadeM) return;
    u.uDepthPush.value = 0;
    u.uLodUnder.value = 0;
    u.uLodFadeM.value = 0;
    u.uLodFadeCap.value = 1;
    // Land-use fills: the size reveal dithers a small one away from afar.
    u.uLodFills.value = this.userData.isleFills === true ? 1 : 0;
    noCoverTexture ??= makeNoCoverTexture();
    u.uHasCoverTex.value = 0;
    u.uCoverTex.value = noCoverTexture;
};

/** Buildings smaller on screen than BUILDING_MIN_PX are collapsed in the vertex shader. */
const buildingsBeforeRender: THREE.Mesh['onBeforeRender'] = function (
    this: THREE.Mesh, renderer, scene, camera, geometry, material, group,
) {
    updateUniforms.call(this, renderer, scene, camera, geometry, material, group);
    const u = (material as THREE.ShaderMaterial).uniforms;
    if (!u?.uProminencePerM) return;
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 60;
    const pixelAngle = fov * Math.PI / 180 / Math.max(1, renderer.getContext().drawingBufferHeight);
    u.uProminencePerM.value = BUILDING_MIN_PX * pixelAngle;
    u.uProminenceRangeM.value = LOD_RANGE_M[0] + 4000;
};

/**
 * The top's facets for the terrain land material: position, normal, the
 * satellite colour (coverColor) and TerrainClass (coverClass) of each facet,
 * and no land-use region (regionSize 0, always shown).
 */
class LandBuilder {
    private readonly pos: number[] = [];
    private readonly nrm: number[] = [];
    private readonly col: number[] = [];
    private readonly cls: number[] = [];
    private readonly region: number[] = [];
    private readonly a = new THREE.Vector3();
    private readonly b = new THREE.Vector3();
    private readonly c = new THREE.Vector3();
    private readonly n = new THREE.Vector3();
    private readonly t = new THREE.Vector3();

    /**
     * `fills`: land-use polygons drawn over the top (TerrainEntity's fills):
     * drawn over the top, and dithered away while too small for
     * their distance (regionSize).
     */
    constructor(private readonly frame: SkyIsleFrame, private readonly fills = false) { }

    /** Also the top facet record DrawnTop keeps, when `record` is given. */
    tri(ae: number, an: number, au: number, be: number, bn: number, bu: number,
        ce: number, cn: number, cu: number, rgb: number, cls: number, regionM = 0, record?: number[]): void {
        record?.push(ae, an, au, be, bn, bu, ce, cn, cu);
        frameOffset(this.frame, ae, an, au, this.a);
        frameOffset(this.frame, be, bn, bu, this.b);
        frameOffset(this.frame, ce, cn, cu, this.c);
        const { a, b, c, n } = this;
        n.subVectors(c, b).cross(this.t.subVectors(a, b)).normalize();
        this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        for (let k = 0; k < 3; k++) {
            this.nrm.push(n.x, n.y, n.z);
            this.col.push((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255);
            this.cls.push(cls);
            this.region.push(regionM);
        }
    }

    get count(): number {
        return this.cls.length / 3;
    }

    /** Triangle t's corners (scene axes, x y z each) and its colour and class. */
    triangle(t: number): { pos: number[]; rgb: number[]; cls: number } {
        return {
            pos: this.pos.slice(t * 9, t * 9 + 9),
            rgb: this.col.slice(t * 9, t * 9 + 3),
            cls: this.cls[t * 3],
        };
    }

    mesh(material: THREE.Material): THREE.Mesh | undefined {
        if (this.cls.length === 0) return undefined;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
        g.setAttribute('coverColor', new THREE.BufferAttribute(new Uint8Array(this.col), 3, true));
        g.setAttribute('coverClass', new THREE.BufferAttribute(new Float32Array(this.cls), 1));
        g.setAttribute('regionSize', new THREE.BufferAttribute(new Float32Array(this.region), 1));
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, material);
        mesh.userData.isleFills = this.fills;
        mesh.onBeforeRender = isleLandBeforeRender;
        return mesh;
    }
}

/**
 * The top as drawn: the grid addRock sampled, and the height of the facet
 * over any point - a full cell is split along its south-west to north-east
 * diagonal; a coast cell falls back to the smooth ground.
 */
class DrawnTop {
    constructor(
        private readonly isle: SkyIsle,
        readonly E0: number,
        readonly spacing: number,
        readonly n0: number,
        private readonly top: Float64Array,
        private readonly dist: Float64Array,
        /** Every top facet as drawn: (e, n, u) x 3 each, in cell order. */
        readonly facets: Float64Array,
        /** Facets of cell (i, j) are facetStart[j * cells + i] .. the next. */
        readonly facetStart: Int32Array,
    ) {
        this.covered = new Uint8Array(facets.length / 9);
    }

    /** 1 for a facet a land-use fill covers whole (addFills): its trees come from the fill. */
    readonly covered: Uint8Array;

    get cells(): number {
        return this.n0 - 1;
    }

    at(e: number, n: number): number {
        const u = (e - this.E0) / this.spacing, v = (n - this.E0) / this.spacing;
        const i = Math.floor(u), j = Math.floor(v);
        if (i < 0 || j < 0 || i >= this.n0 - 1 || j >= this.n0 - 1) return isleTopU(this.isle, e, n);
        const k = j * this.n0 + i;
        if (this.dist[k] <= 0 || this.dist[k + 1] <= 0 || this.dist[k + this.n0] <= 0 || this.dist[k + this.n0 + 1] <= 0) {
            return isleTopU(this.isle, e, n);
        }
        const tx = u - i, ty = v - j;
        const sw = this.top[k], se = this.top[k + 1], nw = this.top[k + this.n0], ne = this.top[k + this.n0 + 1];
        return tx >= ty ? sw + tx * (se - sw) + ty * (ne - se) : sw + ty * (nw - sw) + tx * (ne - nw);
    }
}

/** A builder step: yields to let the frame go on, returns its result at the end. */
type Steps<T> = Generator<void, T, void>;

/**
 * The rock of one island sampled on a grid `spacingM` apart: the top (into
 * `land`), the underside, and the wall between them along the coast (into
 * `rock`). Marching squares on the distance to the coast, so the outline is
 * the real island's at any spacing, cut between the grid's nodes rather than
 * along them. Yields every few rows.
 */
function* addRock(rock: TriangleBuilder, land: LandBuilder, isle: SkyIsle, spacingM: number): Steps<DrawnTop> {
    const reach = maxRimRadius(isle) + spacingM;
    const cells = Math.ceil(2 * reach / spacingM);
    const n0 = cells + 1;
    const E0 = -cells * spacingM / 2, N0 = E0;
    const dist = new Float64Array(n0 * n0);
    const top = new Float64Array(n0 * n0);
    const bot = new Float64Array(n0 * n0);
    for (let j = 0; j < n0; j++) {
        for (let i = 0; i < n0; i++) {
            const e = E0 + i * spacingM, n = N0 + j * spacingM;
            const k = j * n0 + i;
            dist[k] = isleCoastDist(isle, e, n);
            if (dist[k] > -2 * spacingM) {
                top[k] = isleTopU(isle, e, n);
                bot[k] = isleBottomU(isle, e, n);
            }
        }
        if ((j & 15) === 15) yield;
    }
    const baked = isle.shape.cls !== undefined;
    // Where nothing was baked: a class by slope, height and the noise forest.
    const guessClass = (e: number, n: number, u0: number, u1: number, u2: number, d: number): TerrainClass => {
        const steep = (Math.max(u0, u1, u2) - Math.min(u0, u1, u2)) / spacingM;
        const high = isleHeightFraction(isle, e, n);
        if (steep > 0.65 || high > 0.85) return TerrainClass.Bare;
        if (d < 30 && high < 0.03) return TerrainClass.Sand;
        if (isleForested(isle, e, n)) return TerrainClass.Tree;
        return steep > 0.35 ? TerrainClass.Shrub : TerrainClass.Grass;
    };
    const bottomTone = (u: number, d: number): number => {
        if (d < 30) return Tone.Moss;
        const band = Math.floor((u + isle.seed % 97) / 55) % 4;
        return band === 1 ? Tone.Dirt : band === 3 ? Tone.Moss : Tone.Rock;
    };
    // One cell's inside polygon: corners SW, SE, NE, NW (counter-clockwise from
    // above), with the coast's crossing points between inside and outside ones.
    const pe: number[] = [], pn: number[] = [], pt: number[] = [], pb: number[] = [], coast: boolean[] = [];
    const corner = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const facets: number[] = [];
    const facetStart = new Int32Array(cells * cells + 1);
    for (let j = 0; j < cells; j++) {
        for (let i = 0; i < cells; i++) {
            facetStart[j * cells + i] = facets.length / 9;
            const ks = corner.map(([di, dj]) => (j + dj) * n0 + i + di);
            const ins = ks.map(k => dist[k] > 0);
            if (!ins.some(Boolean)) continue;
            pe.length = pn.length = pt.length = pb.length = coast.length = 0;
            for (let c = 0; c < 4; c++) {
                const a = ks[c], b = ks[(c + 1) & 3];
                const ae = E0 + (i + corner[c][0]) * spacingM, an = N0 + (j + corner[c][1]) * spacingM;
                if (ins[c]) {
                    pe.push(ae); pn.push(an); pt.push(top[a]); pb.push(bot[a]); coast.push(false);
                }
                if (ins[c] !== ins[(c + 1) & 3]) {
                    const t = dist[a] / (dist[a] - dist[b]);
                    const be = E0 + (i + corner[(c + 1) & 3][0]) * spacingM, bn = N0 + (j + corner[(c + 1) & 3][1]) * spacingM;
                    const e = ae + (be - ae) * t, n = an + (bn - an) * t;
                    pe.push(e); pn.push(n);
                    pt.push(isleTopU(isle, e, n)); pb.push(isleBottomU(isle, e, n));
                    coast.push(true);
                }
            }
            const m = pe.length;
            const ce = pe.reduce((a, b) => a + b, 0) / m, cn = pn.reduce((a, b) => a + b, 0) / m;
            const cd = Math.max(0, isleCoastDist(isle, ce, cn));
            for (let q = 1; q + 1 < m; q++) {
                const te = (pe[0] + pe[q] + pe[q + 1]) / 3, tn = (pn[0] + pn[q] + pn[q + 1]) / 3;
                const cls = baked ? isleClassAt(isle, te, tn) : guessClass(te, tn, pt[0], pt[q], pt[q + 1], cd);
                const sat = isleColourAt(isle, te, tn);
                land.tri(pe[0], pn[0], pt[0], pe[q], pn[q], pt[q], pe[q + 1], pn[q + 1], pt[q + 1],
                    sat >= 0 ? sat : CLASS_RGB[cls] ?? CLASS_RGB[0], cls, 0, facets);
                // A cave's mouth: no underside where a cave comes out through it.
                const caveMouth = isle.tunnels.length > 0
                    && isleCaveDepth(isle, te, tn, (pb[0] + pb[q] + pb[q + 1]) / 3) < 1.05;
                if (!caveMouth) {
                    rock.tri(pe[0], pn[0], pb[0], pe[q + 1], pn[q + 1], pb[q + 1], pe[q], pn[q], pb[q],
                        bottomTone(pb[q], cd));
                }
            }
            // Two crossing points in a row are a stretch of coast: the wall, facing out.
            for (let q = 0; q < m; q++) {
                const r = (q + 1) % m;
                if (!coast[q] || !coast[r]) continue;
                rock.tri(pe[q], pn[q], pt[q], pe[q], pn[q], pb[q], pe[r], pn[r], pb[r], Tone.Rock);
                rock.tri(pe[q], pn[q], pt[q], pe[r], pn[r], pb[r], pe[r], pn[r], pt[r], Tone.Rock);
            }
        }
        if ((j & 7) === 7) yield;
    }
    facetStart[cells * cells] = facets.length / 9;
    return new DrawnTop(isle, E0, spacingM, n0, top, dist, new Float64Array(facets), facetStart);
}

/** Land-use fills float this far over the facets they are cut to, m. */
const FILL_LIFT_M = 0.25;

/**
 * Sutherland-Hodgman: the part of polygon (xs, ys) left of the directed edge
 * a -> b, written back into xs, ys.
 */
function clipLeft(xs: number[], ys: number[], ax: number, ay: number, bx: number, by: number,
    tx: number[], ty: number[]): void {
    tx.length = ty.length = 0;
    const m = xs.length;
    const side = (x: number, y: number) => (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    for (let k = 0; k < m; k++) {
        const px = xs[k], py = ys[k], qx = xs[(k + 1) % m], qy = ys[(k + 1) % m];
        const sp = side(px, py), sq = side(qx, qy);
        if (sp >= 0) {
            tx.push(px);
            ty.push(py);
        }
        if ((sp >= 0) !== (sq >= 0)) {
            const t = sp / (sp - sq);
            tx.push(px + (qx - px) * t);
            ty.push(py + (qy - py) * t);
        }
    }
    xs.length = ys.length = 0;
    for (let k = 0; k < tx.length; k++) {
        xs.push(tx[k]);
        ys.push(ty[k]);
    }
}

/**
 * The island's OSM land use as vector fills over its top, the way the
 * terrain draws its own: each polygon triangulated, each triangle cut to
 * every drawn facet under it, so a fill lies on the ground exactly and ends
 * at the coast the rock ends at. Colour from the satellite under it, class
 * from OSM; regionSize (the polygon's width) lets the shader dither away the
 * ones too small to see from where the camera is.
 */
function* addFills(out: LandBuilder, isle: SkyIsle, top: DrawnTop): Steps<void> {
    const fills = isle.shape.fills;
    if (!fills) return;
    const { rings, polyRings, cls } = fills;
    const cells = top.cells;
    const S = top.spacing, E0 = top.E0;
    const F = top.facets;
    const xs: number[] = [], ys: number[] = [], tx: number[] = [], ty: number[] = [];
    const cellOf = (v: number) => Math.floor((v - E0) / S);
    let done = 0;
    for (let p = 0; p < fills.count; p++) {
        const ringOf = (r: number): THREE.Vector2[] => {
            const v: THREE.Vector2[] = [];
            for (let q = rings.starts[r]; q < rings.starts[r + 1]; q++) v.push(new THREE.Vector2(rings.pts[q * 2], rings.pts[q * 2 + 1]));
            return v;
        };
        const outer = ringOf(polyRings[p]);
        if (outer.length < 3) continue;
        const holes: THREE.Vector2[][] = [];
        for (let r = polyRings[p] + 1; r < polyRings[p + 1]; r++) holes.push(ringOf(r));
        const all = [outer, ...holes];
        let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity, area2 = 0;
        for (let k = 0; k < outer.length; k++) {
            const a = outer[k], b = outer[(k + 1) % outer.length];
            minE = Math.min(minE, a.x); maxE = Math.max(maxE, a.x);
            minN = Math.min(minN, a.y); maxN = Math.max(maxN, a.y);
            area2 += a.x * b.y - b.x * a.y;
        }
        // The width the size reveal compares against: the smaller of the box's
        // sides and the side of a square of the polygon's area.
        const regionM = Math.max(1, Math.min(maxE - minE, maxN - minN, Math.sqrt(Math.abs(area2) / 2)));
        const c = cls[p];
        const sat = isleColourAt(isle, (minE + maxE) / 2, (minN + maxN) / 2);
        const rgb = sat >= 0 ? sat : CLASS_RGB[c] ?? CLASS_RGB[0];

        // The cells it covers, a window of the grid.
        const i0 = Math.max(0, cellOf(minE)), i1 = Math.min(cells - 1, cellOf(maxE));
        const j0 = Math.max(0, cellOf(minN)), j1 = Math.min(cells - 1, cellOf(maxN));
        if (i1 < i0 || j1 < j0) continue;
        const W = i1 - i0 + 1, H = j1 - j0 + 1;
        // Cells an edge passes through: cut there. Sampled at a quarter cell,
        // plus both ends, which no edge can skip a cell between.
        const edge = new Uint8Array(W * H);
        const mark = (e: number, n: number) => {
            const i = cellOf(e) - i0, j = cellOf(n) - j0;
            if (i >= 0 && j >= 0 && i < W && j < H) edge[j * W + i] = 1;
        };
        for (const ring of all) {
            for (let k = 0; k < ring.length; k++) {
                const a = ring[k], b = ring[(k + 1) % ring.length];
                const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (S * 0.25)));
                for (let s = 0; s <= steps; s++) mark(a.x + (b.x - a.x) * s / steps, a.y + (b.y - a.y) * s / steps);
            }
        }
        // Cells wholly inside (even-odd over every ring, at the cell's middle):
        // their facets are drawn whole, one triangle each.
        const crossings: number[] = [];
        for (let j = 0; j < H; j++) {
            const n = E0 + (j0 + j + 0.5) * S;
            crossings.length = 0;
            for (const ring of all) {
                for (let k = 0; k < ring.length; k++) {
                    const a = ring[k], b = ring[(k + 1) % ring.length];
                    if ((a.y > n) !== (b.y > n)) crossings.push(a.x + (n - a.y) / (b.y - a.y) * (b.x - a.x));
                }
            }
            crossings.sort((x, y) => x - y);
            for (let q = 0; q + 1 < crossings.length; q += 2) {
                const ia = Math.max(0, Math.ceil((crossings[q] - E0) / S - 0.5) - i0);
                const ib = Math.min(W - 1, Math.floor((crossings[q + 1] - E0) / S - 0.5) - i0);
                for (let i = ia; i <= ib; i++) {
                    if (edge[j * W + i]) continue;
                    const k = (j0 + j) * cells + i0 + i;
                    for (let f = top.facetStart[k]; f < top.facetStart[k + 1]; f++) {
                        const o = f * 9;
                        top.covered[f] = 1;
                        out.tri(F[o], F[o + 1], F[o + 2] + FILL_LIFT_M, F[o + 3], F[o + 4], F[o + 5] + FILL_LIFT_M,
                            F[o + 6], F[o + 7], F[o + 8] + FILL_LIFT_M, rgb, c, regionM);
                    }
                }
            }
        }
        // Cells an edge crosses: the polygon's rings cut to each facet there
        // (Sutherland-Hodgman, the facet being convex), what is left triangulated.
        const ringE = all.map(r => r.map(v => v.x)), ringN = all.map(r => r.map(v => v.y));
        const ringBox = all.map(r => {
            let a = Infinity, b = -Infinity, cc = Infinity, dd = -Infinity;
            for (const v of r) { a = Math.min(a, v.x); b = Math.max(b, v.x); cc = Math.min(cc, v.y); dd = Math.max(dd, v.y); }
            return [a, b, cc, dd];
        });
        for (let j = 0; j < H; j++) {
            for (let i = 0; i < W; i++) {
                if (!edge[j * W + i]) continue;
                const k = (j0 + j) * cells + i0 + i;
                const ce0 = E0 + (i0 + i) * S, cn0 = E0 + (j0 + j) * S;
                for (let f = top.facetStart[k]; f < top.facetStart[k + 1]; f++) {
                    const o = f * 9;
                    const pieces: THREE.Vector2[][] = [];
                    for (let r = 0; r < all.length; r++) {
                        const bx = ringBox[r];
                        if (bx[1] < ce0 || bx[0] > ce0 + S || bx[3] < cn0 || bx[2] > cn0 + S) continue;
                        xs.length = ys.length = 0;
                        for (let q = 0; q < ringE[r].length; q++) { xs.push(ringE[r][q]); ys.push(ringN[r][q]); }
                        for (let fe = 0; fe < 3 && xs.length >= 3; fe++) {
                            const s0 = o + fe * 3, t0 = o + ((fe + 1) % 3) * 3;
                            clipLeft(xs, ys, F[s0], F[s0 + 1], F[t0], F[t0 + 1], tx, ty);
                        }
                        if (xs.length >= 3) pieces[r] = xs.map((x, q) => new THREE.Vector2(x, ys[q]));
                    }
                    const piece = pieces[0];
                    if (!piece) continue;
                    const holePieces = pieces.slice(1).filter(h => h && h.length >= 3);
                    // Heights on the facet's own plane.
                    const e0 = F[o], n0 = F[o + 1], u0 = F[o + 2];
                    const e1 = F[o + 3] - e0, n1 = F[o + 4] - n0, u1 = F[o + 5] - u0;
                    const e2 = F[o + 6] - e0, n2 = F[o + 7] - n0, u2 = F[o + 8] - u0;
                    const det = e1 * n2 - e2 * n1;
                    if (Math.abs(det) < 1e-9) continue;
                    const uAt = (v: THREE.Vector2) => {
                        const de = v.x - e0, dn = v.y - n0;
                        const s1 = (de * n2 - e2 * dn) / det, s2 = (e1 * dn - de * n1) / det;
                        return u0 + s1 * u1 + s2 * u2 + FILL_LIFT_M;
                    };
                    const pts = [piece, ...holePieces].flat();
                    for (const [ia, ib, ic] of THREE.ShapeUtils.triangulateShape(piece, holePieces)) {
                        let a = pts[ia], b = pts[ib];
                        const d = pts[ic];
                        if ((b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x) < 0) [a, b] = [b, a];
                        out.tri(a.x, a.y, uAt(a), b.x, b.y, uAt(b), d.x, d.y, uAt(d), rgb, c, regionM);
                    }
                }
            }
        }
        if ((++done & 31) === 0) yield;
    }
}

/**
 * Parameters in (0, 1) where the segment a-b crosses a grid line or a cell
 * diagonal of `top`, sorted: between two of them it lies on one facet.
 */
function facetCuts(top: DrawnTop, ae: number, an: number, be: number, bn: number, out: number[]): void {
    out.length = 0;
    const s = top.spacing;
    const u0 = (ae - top.E0) / s, v0 = (an - top.E0) / s;
    const u1 = (be - top.E0) / s, v1 = (bn - top.E0) / s;
    const cross = (p0: number, p1: number) => {
        if (p0 === p1) return;
        const lo = Math.min(p0, p1), hi = Math.max(p0, p1);
        for (let k = Math.ceil(lo); k <= hi; k++) {
            const t = (k - p0) / (p1 - p0);
            if (t > 1e-6 && t < 1 - 1e-6) out.push(t);
        }
    };
    cross(u0, u1);
    cross(v0, v1);
    cross(u0 - v0, u1 - v1);
    out.sort((x, y) => x - y);
}

/** A strip `halfW` either side of a polyline, cut to the facets it crosses and laid on them. */
function drapeStrip(out: TriangleBuilder, top: DrawnTop, pts: Float32Array, from: number, to: number,
    halfW: number, lift: number, tone: number, cuts: number[]): void {
    for (let p = from; p + 1 < to; p++) {
        const ae = pts[p * 2], an = pts[p * 2 + 1], be = pts[p * 2 + 2], bn = pts[p * 2 + 3];
        const len = Math.hypot(be - ae, bn - an);
        if (len < 0.01) continue;
        // Across, to the right; the ends overlap the next segment's a little to close the joint.
        const xe = (bn - an) / len * halfW, xn = -(be - ae) / len * halfW;
        const de = (be - ae) / len * Math.min(halfW, len / 2) * 0.5, dn = (bn - an) / len * Math.min(halfW, len / 2) * 0.5;
        facetCuts(top, ae, an, be, bn, cuts);
        cuts.push(1);
        let pe = ae - (p > from ? de : 0), pn = an - (p > from ? dn : 0), pu = top.at(pe, pn) + lift;
        for (const t of cuts) {
            const ne = ae + (be - ae) * t + (t === 1 && p + 2 < to ? de : 0);
            const nn = an + (bn - an) * t + (t === 1 && p + 2 < to ? dn : 0);
            const nu = top.at(ne, nn) + lift;
            const pl = top.at(pe - xe, pn - xn) + lift, pr = top.at(pe + xe, pn + xn) + lift;
            const nl = top.at(ne - xe, nn - xn) + lift, nr = top.at(ne + xe, nn + xn) + lift;
            // Never below the centreline's facet: on a cross slope the far edge would sink.
            const lp = Math.max(pl, pu), rp = Math.max(pr, pu), ln = Math.max(nl, nu), rn = Math.max(nr, nu);
            out.tri(pe - xe, pn - xn, lp, pe + xe, pn + xn, rp, ne + xe, nn + xn, rn, tone);
            out.tri(pe - xe, pn - xn, lp, ne + xe, nn + xn, rn, ne - xe, nn - xn, ln, tone);
            pe = ne; pn = nn; pu = nu;
        }
    }
}

/** The island's OSM roads and taxiways, draped on its top. */
function* addRoads(out: TriangleBuilder, isle: SkyIsle, top: DrawnTop): Steps<void> {
    const roads = isle.shape.osm?.roads;
    if (!roads) return;
    const cuts: number[] = [];
    for (let i = 0; i < roads.count; i++) {
        const cls = roads.cls[i];
        const tone = cls === SkyIsleRoadClass.Track ? Tone.Dirt
            : cls <= SkyIsleRoadClass.Secondary || cls === SkyIsleRoadClass.Taxiway ? Tone.Road : Tone.RoadMinor;
        drapeStrip(out, top, roads.pts, roads.starts[i], roads.starts[i + 1],
            (ROAD_WIDTH_M[cls] ?? 4) / 2, ROAD_LIFT_M + cls * 0.02, tone, cuts);
        if ((i & 127) === 127) yield;
    }
}

/** Aprons: their rings filled, laid on the (levelled) ground. */
function addPaved(out: TriangleBuilder, isle: SkyIsle, top: DrawnTop): void {
    const paved = isle.shape.osm?.paved;
    if (!paved) return;
    for (let i = 0; i < paved.count; i++) {
        const contour: THREE.Vector2[] = [];
        for (let p = paved.starts[i]; p < paved.starts[i + 1]; p++) {
            contour.push(new THREE.Vector2(paved.pts[p * 2], paved.pts[p * 2 + 1]));
        }
        const u = contour.map(v => top.at(v.x, v.y) + PAVED_LIFT_M);
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, [])) {
            const pa = contour[a], pb = contour[b], pc = contour[c];
            // Counter-clockwise from above, whatever order the triangulator gave.
            const ccw = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x) > 0;
            const [q, r] = ccw ? [b, c] : [c, b];
            out.tri(pa.x, pa.y, u[a], contour[q].x, contour[q].y, u[q], contour[r].x, contour[r].y, u[r], Tone.Road);
        }
    }
}

/**
 * The island's OSM buildings: footprints extruded to their height, a flat
 * roof on each, every vertex tagged with its building's centre and size so
 * the shader drops the ones too small to see from where the camera is.
 */
function* addBuildings(out: TriangleBuilder, isle: SkyIsle, top: DrawnTop): Steps<void> {
    const walls = [BuildingTone.WallPlaster, BuildingTone.WallPlaster, BuildingTone.WallPlaster,
        BuildingTone.WallBrick, BuildingTone.WallConcrete];
    const roofs = [BuildingTone.RoofTileRed, BuildingTone.RoofTileBrown, BuildingTone.RoofTileRed, BuildingTone.RoofGrey];
    let count = 0;
    for (const b of isleBuildings(isle)) {
        const m = b.ring.length / 2;
        let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < m; k++) {
            const g = top.at(b.ring[k * 2], b.ring[k * 2 + 1]);
            lo = Math.min(lo, g);
            hi = Math.max(hi, g);
        }
        const floor = lo - 1;
        const roof = Math.max(hi + 2.5, lo + b.heightM);
        out.setSite(b.e, b.n, (floor + roof) / 2, Math.max(roof - floor, b.halfLength * 2));
        const hash = Math.abs(Math.floor(b.e * 7.31 + b.n * 3.17));
        const big = b.heightM > 11 || b.halfLength * b.halfWidth > 150;
        const wall = walls[hash % walls.length];
        const roofTone = big ? (hash & 1 ? BuildingTone.RoofGrey : BuildingTone.RoofWhite) : roofs[(hash >> 3) % roofs.length];
        for (let k = 0; k < m; k++) {
            const k2 = (k + 1) % m;
            const ae = b.ring[k * 2], an = b.ring[k * 2 + 1], be = b.ring[k2 * 2], bn = b.ring[k2 * 2 + 1];
            // Counter-clockwise ring: outward is to the right of a -> b.
            out.tri(ae, an, floor, be, bn, floor, be, bn, roof, wall);
            out.tri(ae, an, floor, be, bn, roof, ae, an, roof, wall);
        }
        const contour: THREE.Vector2[] = [];
        for (let k = 0; k < m; k++) contour.push(new THREE.Vector2(b.ring[k * 2], b.ring[k * 2 + 1]));
        for (const [a, c, d] of THREE.ShapeUtils.triangulateShape(contour, [])) {
            const pa = contour[a], pc = contour[c], pd = contour[d];
            const ccw = (pc.x - pa.x) * (pd.y - pa.y) - (pc.y - pa.y) * (pd.x - pa.x) > 0;
            const [q, r] = ccw ? [pc, pd] : [pd, pc];
            out.tri(pa.x, pa.y, roof, q.x, q.y, roof, r.x, r.y, roof, roofTone);
        }
        if ((++count & 255) === 0) yield;
    }
}

/** Cells of the grid the tree scatter looks up roads and buildings in, m. */
const TREE_KEEP_OFF_CELL_M = 40;

/**
 * Where no tree may stand, in island metres: the levelled runway strip, the
 * last few metres before the coast, on a road (its half width and a margin)
 * or in a building's box.
 */
function treeKeepOff(isle: SkyIsle): (e: number, n: number) => boolean {
    const C = TREE_KEEP_OFF_CELL_M;
    const key = (e: number, n: number) => `${Math.floor(e / C)},${Math.floor(n / C)}`;
    const cells = new Map<string, number[]>();
    const add = (e0: number, n0: number, e1: number, n1: number, item: number) => {
        for (let i = Math.floor(e0 / C); i <= Math.floor(e1 / C); i++) {
            for (let j = Math.floor(n0 / C); j <= Math.floor(n1 / C); j++) {
                const k = `${i},${j}`;
                const list = cells.get(k);
                if (list) list.push(item); else cells.set(k, [item]);
            }
        }
    };
    // Road segments: items 0.., (ae, an, be, bn, half width) each.
    const seg: number[] = [];
    const roads = isle.shape.osm?.roads;
    if (roads) {
        for (let r = 0; r < roads.count; r++) {
            const w = (ROAD_WIDTH_M[roads.cls[r]] ?? 4) / 2 + 2;
            for (let p = roads.starts[r]; p + 1 < roads.starts[r + 1]; p++) {
                const ae = roads.pts[p * 2], an = roads.pts[p * 2 + 1], be = roads.pts[p * 2 + 2], bn = roads.pts[p * 2 + 3];
                add(Math.min(ae, be) - w, Math.min(an, bn) - w, Math.max(ae, be) + w, Math.max(an, bn) + w, seg.length / 5);
                seg.push(ae, an, be, bn, w);
            }
        }
    }
    const roadCount = seg.length / 5;
    // Buildings: items roadCount.., by their boxes.
    const houses = isleBuildings(isle);
    houses.forEach((b, i) => {
        const r = b.halfLength + 2;
        add(b.e - r, b.n - r, b.e + r, b.n + r, roadCount + i);
    });
    return (e: number, n: number) => {
        if (isleCoastDist(isle, e, n) < 6 || isleFlatWeight(isle, e, n) > 0.02) return true;
        for (const item of cells.get(key(e, n)) ?? []) {
            if (item < roadCount) {
                const o = item * 5;
                const ae = seg[o], an = seg[o + 1], de = seg[o + 2] - ae, dn = seg[o + 3] - an;
                const len2 = de * de + dn * dn || 1;
                const t = Math.max(0, Math.min(1, ((e - ae) * de + (n - an) * dn) / len2));
                if (Math.hypot(e - ae - de * t, n - an - dn * t) < seg[o + 4]) return true;
            } else {
                const b = houses[item - roadCount];
                const ca = Math.cos(b.angle), sa = Math.sin(b.angle);
                const de = e - b.e, dn = n - b.n;
                if (Math.abs(de * ca + dn * sa) < b.halfLength + 2 && Math.abs(-de * sa + dn * ca) < b.halfWidth + 2) return true;
            }
        }
        return false;
    };
}

/**
 * The island's trees, shrubs and heath as the terrain grows them: the same
 * scatter (treeBillboards.ts, by TerrainClass and its spacing per class) over
 * the land as drawn - the land-use fills, and the top's facets no fill covers
 * whole - built into the same instanced billboards from the same atlas.
 */
function* addTreeBillboards(
    isle: SkyIsle, frame: SkyIsleFrame, land: LandBuilder, fills: LandBuilder, top: DrawnTop, mats: SkyIsleMaterials,
): Steps<THREE.InstancedMesh[]> {
    if (!mats.treeAtlas) return [];
    const pos: number[] = [], attrs: number[] = [];
    const take = (b: LandBuilder, t: number) => {
        const tri = b.triangle(t);
        for (const v of tri.pos) pos.push(v);
        for (let k = 0; k < 3; k++) attrs.push(tri.rgb[0], tri.rgb[1], tri.rgb[2], tri.cls);
    };
    for (let t = 0; t < land.count; t++) {
        if (!top.covered[t]) take(land, t);
    }
    for (let t = 0; t < fills.count; t++) take(fills, t);
    yield;
    // A tile as the scatter reads one: positions in metres (quantScale 1),
    // r, g, b and the class per corner.
    const tile = {
        landPositions: new Float32Array(pos),
        landAttrs: new Uint8Array(attrs),
        quantScale: 1,
    } as unknown as PtmTile;
    const keepOff = treeKeepOff(isle);
    // Scene axes (mesh-local) back to island metres: the frame is orthonormal.
    const toE = (x: number, y: number, z: number) => x * frame.e[0] + y * frame.e[1] + z * frame.e[2];
    const toN = (x: number, y: number, z: number) => x * frame.n[0] + y * frame.n[1] + z * frame.n[2];
    const groups = scatterTreeSpecies(tile, 1, (x, z, y) => keepOff(toE(x, y, z), toN(x, y, z)));
    yield;
    if (groups.length === 0) return [];
    const meshes = buildTreeMeshes(groups, mats.manager, mats.treeAtlas, treeSpacingM(1));
    for (const m of meshes) {
        m.onBeforeRender = updateUniforms;
        // The island's object moves them; their own matrix stays put.
        m.matrixAutoUpdate = true;
    }
    return meshes;
}

/** Vines and roots hanging from the underside, just inside the coast. */
function addVines(out: TriangleBuilder, isle: SkyIsle): void {
    // An island in the sea has nothing hanging under it.
    if (isle.altM <= 0) return;
    const s = isle.shape;
    let v = 0;
    for (let j = 1; j < s.ny - 1; j++) {
        for (let i = 1; i < s.nx - 1; i++) {
            const k = j * s.nx + i;
            const d = s.dist[k];
            // Coast cells, thinned to roughly one vine per 45 m of coast.
            if (d <= 0 || d > s.cellM) continue;
            v++;
            const keep = Math.abs(Math.sin(v * 12.9898 + isle.seed)) < Math.min(1, s.cellM / 45);
            if (!keep) continue;
            const e = s.e0 + (i + 0.5) * s.cellM, n = s.n0 + (j + 0.5) * s.cellM;
            const u = isleBottomU(isle, e, n) + 2;
            const len = 30 + 110 * Math.abs(Math.sin(v * 3.17 + isle.seed));
            const w = 3 + 4 * Math.abs(Math.sin(v * 5.3));
            const a = v * 2.4;
            const te = Math.cos(a) * w, tn = Math.sin(a) * w;
            out.sheet(e - te, n - tn, u, e + te, n + tn, u, e, n, u - len, v % 3 === 0 ? Tone.Forest : Tone.Moss);
        }
    }
}

/** Sides round a cave, and its rings along it a radius times this apart. */
const CAVE_SIDES = 14;
const CAVE_RING_STEP = 0.5;

/**
 * The caves through the underside, from inside: a rough rock tube, faces
 * turned in, the radius wandering by a sixth so it reads as rock and not a
 * pipe, the floor kept smoother than the walls. Drawn only where the tube is
 * in the rock; its ends come out through the mouths addRock leaves open.
 */
function addCaves(out: TriangleBuilder, isle: SkyIsle): void {
    for (const t of isle.tunnels) {
        const de = t.be - t.ae, dn = t.bn - t.an;
        const len = Math.hypot(de, dn);
        const ae = de / len, an = dn / len;
        // Across: to the right of the axis, level.
        const xe = an, xn = -ae;
        const rings = Math.max(2, Math.ceil(len / (t.r * CAVE_RING_STEP)));
        const ring = (i: number) => {
            const k = i / rings;
            const ce = t.ae + de * k, cn = t.an + dn * k;
            const pts: number[] = [];
            for (let j = 0; j < CAVE_SIDES; j++) {
                const a = 2 * Math.PI * j / CAVE_SIDES;
                const floor = Math.sin(a) < -0.5;
                const wobble = 1 + (Math.sin(i * 1.7 + j * 2.3 + isle.seed) * 0.5
                    + Math.sin(i * 0.61 - j * 1.3 + isle.seed * 0.3) * 0.5) * (floor ? 0.05 : 0.16);
                const rr = t.r * wobble;
                pts.push(ce + xe * Math.cos(a) * rr, cn + xn * Math.cos(a) * rr, t.u + Math.sin(a) * rr);
            }
            return { ce, cn, pts };
        };
        // Inside the rock: under the top and over the underside there.
        const inRock = (ce: number, cn: number) =>
            isleBottomU(isle, ce, cn) < t.u + t.r && isleTopU(isle, ce, cn) > t.u - t.r;
        let prev = ring(0);
        for (let i = 1; i <= rings; i++) {
            const next = ring(i);
            if (inRock(prev.ce, prev.cn) || inRock(next.ce, next.cn)) {
                for (let j = 0; j < CAVE_SIDES; j++) {
                    const j2 = (j + 1) % CAVE_SIDES;
                    const a = prev.pts, b = next.pts;
                    const tone = Math.sin(2 * Math.PI * j / CAVE_SIDES) < -0.5 ? Tone.Dirt
                        : (i + j) % 5 === 0 ? Tone.Moss : Tone.Rock;
                    // Wound to face the axis: seen from inside the tube.
                    out.tri(a[j * 3], a[j * 3 + 1], a[j * 3 + 2], b[j2 * 3], b[j2 * 3 + 1], b[j2 * 3 + 2],
                        b[j * 3], b[j * 3 + 1], b[j * 3 + 2], tone);
                    out.tri(a[j * 3], a[j * 3 + 1], a[j * 3 + 2], a[j2 * 3], a[j2 * 3 + 1], a[j2 * 3 + 2],
                        b[j2 * 3], b[j2 * 3 + 1], b[j2 * 3 + 2], tone);
                }
            }
            prev = next;
        }
    }
}

/** Waterfalls off the coast: a sheet from the lip curving out and down, spray at its foot. */
function addWaterfalls(out: TriangleBuilder, isle: SkyIsle): void {
    for (const w of isle.waterfalls) {
        const oe = w.de, on = w.dn;
        const te = -on, tn = oe;
        const halfW = 10 + Math.min(25, isle.shape.reachM / 250);
        const lip = isleTopU(isle, w.e, w.n) - 1;
        const fall = Math.min(lip - 60, 140 + isle.depthM * 0.45, 520);
        const steps = 8;
        let pe = w.e + oe * 2, pn = w.n + on * 2, pu = lip, pw = halfW;
        for (let s = 1; s <= steps; s++) {
            const f = s / steps;
            const out_ = 2 + 45 * Math.sqrt(f);
            const ne = w.e + oe * out_, nn = w.n + on * out_, nu = lip - fall * f * f * 0.3 - fall * f * 0.7;
            const nw = halfW * (1 + f * 0.8);
            // Light falling water, breaking into spray as it goes.
            const tone = s >= steps - 1 ? Tone.Foam : s % 2 === 0 ? Tone.Spray : Tone.Foam;
            out.sheet(pe - te * pw, pn - tn * pw, pu, pe + te * pw, pn + tn * pw, pu,
                ne + te * nw, nn + tn * nw, nu, tone);
            out.sheet(pe - te * pw, pn - tn * pw, pu, ne + te * nw, nn + tn * nw, nu,
                ne - te * nw, nn - tn * nw, nu, tone);
            pe = ne; pn = nn; pu = nu; pw = nw;
        }
    }
}

/** One level of an island: the rock alone, or at level 0 everything on it too. */
function* buildLevel(
    isle: SkyIsle, frame: SkyIsleFrame, mats: SkyIsleMaterials, level: number, terrainTop = false,
): Steps<ModelLodLevel> {
    const rock = new TriangleBuilder(frame);
    const land = new LandBuilder(frame);
    const top = yield* addRock(rock, land, isle, spacingFor(isle, level));
    addWaterfalls(rock, isle);
    addCaves(rock, isle);
    const volumes: THREE.Mesh[] = [];
    // With the island's own baked terrain drawn over it (a placed
    // TerrainEntity), only the rock: wall, underside, caves, falls, vines.
    if (level === 0 && terrainTop) {
        addVines(rock, isle);
    }
    if (level === 0 && !terrainTop) {
        const fills = new LandBuilder(frame, true);
        yield* addFills(fills, isle, top);
        const f = fills.mesh(mats.land);
        if (f) volumes.push(f);
        addPaved(rock, isle, top);
        yield* addRoads(rock, isle, top);
        volumes.push(...(yield* addTreeBillboards(isle, frame, land, fills, top, mats)));
        addVines(rock, isle);
        const houses = new TriangleBuilder(frame, true);
        yield* addBuildings(houses, isle, top);
        const h = houses.mesh(mats.buildings);
        if (h) {
            h.onBeforeRender = buildingsBeforeRender;
            volumes.push(h);
        }
    }
    const l = terrainTop ? undefined : land.mesh(mats.land);
    if (l) volumes.unshift(l);
    const g = rock.mesh(mats.ground);
    if (g) volumes.unshift(g);
    return { flats: [], volumes };
}

function drain<T>(steps: Steps<T>): T {
    for (;;) {
        const r = steps.next();
        if (r.done) return r.value;
    }
}

function disposeLevel(level: ModelLodLevel): void {
    for (const m of [...level.flats, ...level.volumes]) {
        (m as THREE.Mesh).geometry?.dispose();
    }
}

/** A level that is built on demand: built within `buildM` of the rim, let go past `dropM`. */
interface LazyLevel {
    level: number;
    buildM: number;
    dropM: number;
    state: 'none' | 'building' | 'ready';
    steps: Steps<ModelLodLevel> | undefined;
}

/**
 * Builds the islands' levels a few milliseconds a frame, the most wanted
 * first: the closest island's, level 0 before level 1 at the same distance.
 * A job paused for a closer one keeps its place and resumes later.
 */
export class SkyIsleBuilder implements Entity {
    readonly tags: string[] = [];
    enabled = true;
    private readonly obj = new THREE.Object3D();

    constructor(private readonly isles: readonly SkyIsleEntity[]) { }

    get position(): THREE.Vector3 {
        return this.obj.position;
    }

    rebase(_shift: FrameShift): void {
        //
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        const until = performance.now() + BUILD_BUDGET_MS;
        while (performance.now() < until) {
            let best: SkyIsleEntity | undefined;
            let bestKey = Infinity;
            for (const isle of this.isles) {
                const key = isle.wantKey();
                if (key < bestKey) {
                    bestKey = key;
                    best = isle;
                }
            }
            if (!best || !best.work(until)) return;
        }
    }

    render3D(): void {
        //
    }

    render2D(): void {
        //
    }
}

/**
 * An island in the scene. Its level of detail is picked by the camera's
 * distance from the island's rim rather than from its size on screen: a
 * 9 km island is large on screen from anywhere in the area, and its houses
 * are not. Only the coarsest level is built up front; the finer two are
 * built by the SkyIsleBuilder as the camera comes near.
 */
export class SkyIsleEntity implements Entity {
    readonly tags: string[] = [];
    enabled = true;
    private lodHelper: LODHelper;
    private readonly model: Model;
    private readonly obj = new THREE.Object3D();
    private readonly reach: number;
    private readonly top: number;
    /** Camera distance from the rim at the last draw, m. */
    private distM = Infinity;
    private readonly lazy: LazyLevel[] = [
        { level: 0, buildM: NEAR_BUILD_M, dropM: NEAR_DROP_M, state: 'none', steps: undefined },
        { level: 1, buildM: LOD_RANGE_M[1] + 6_000, dropM: LOD_RANGE_M[1] + 14_000, state: 'none', steps: undefined },
    ];

    /** `terrainTop`: the island's own baked terrain is drawn over it, so only the rock is built. */
    constructor(
        readonly isle: SkyIsle, private readonly frame: SkyIsleFrame, private readonly mats: SkyIsleMaterials,
        private readonly terrainTop = false,
    ) {
        this.obj.position.fromArray(frame.c);
        this.reach = maxRimRadius(isle);
        this.top = isle.altM + isle.shape.topM / 2;
        this.model = {
            lod: [{ flats: [], volumes: [] }, { flats: [], volumes: [] }, drain(this.levelSteps(2))],
            animations: [],
            maxSize: this.reach * 2,
            center: new THREE.Vector3(),
        };
        this.lodHelper = new LODHelper(this.model);
    }

    private levelSteps(level: number): Steps<ModelLodLevel> {
        return buildLevel(this.isle, this.frame, this.mats, level, this.terrainTop);
    }

    /** How much this island wants a level built: lower is sooner, Infinity not at all. */
    wantKey(): number {
        for (const l of this.lazy) {
            if (l.state !== 'ready' && this.distM < l.buildM) return this.distM + l.level * 3_000;
        }
        return Infinity;
    }

    /** Builds the most wanted level a while; false when there was nothing to do. */
    work(until: number): boolean {
        const l = this.lazy.find(x => x.state !== 'ready' && this.distM < x.buildM);
        if (!l) return false;
        if (!l.steps) {
            l.steps = this.levelSteps(l.level);
            l.state = 'building';
        }
        while (performance.now() < until) {
            const r = l.steps.next();
            if (r.done) {
                this.model.lod[l.level] = r.value;
                this.lodHelper = new LODHelper(this.model);
                l.steps = undefined;
                l.state = 'ready';
                return true;
            }
        }
        return true;
    }

    get position(): THREE.Vector3 {
        return this.obj.position;
    }

    rebase(shift: FrameShift): void {
        shift.object(this.obj);
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        const d = this.distM;
        for (const l of this.lazy) {
            if (d <= l.dropM || l.state === 'none') continue;
            if (l.state === 'ready') {
                disposeLevel(this.model.lod[l.level]);
                this.model.lod[l.level] = { flats: [], volumes: [] };
                this.lodHelper = new LODHelper(this.model);
            } else {
                l.steps?.return(undefined as unknown as ModelLodLevel);
            }
            l.steps = undefined;
            l.state = 'none';
        }
    }

    render3D(targetWidth: number, _targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        const p = camera.position;
        const dh = Math.max(0, Math.hypot(p.x - this.obj.position.x, p.z - this.obj.position.z) - this.reach);
        const dv = Math.max(0, Math.abs(p.y - this.obj.position.y - this.top) - 500);
        const d = Math.hypot(dh, dv);
        this.distM = d;
        // The finest level built that is wanted at this distance.
        const ready = (level: number) => level === 2 || this.lazy[level].state === 'ready';
        let level = d < LOD_RANGE_M[0] ? 0 : d < LOD_RANGE_M[1] ? 1 : 2;
        while (!ready(level)) level++;
        this.lodHelper.addToRenderList(
            this.obj.position, this.obj.quaternion, this.obj.scale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, level);
    }

    render2D(_w: number, _h: number, _camera: THREE.Camera, _lists: Set<string>, _painter: CanvasPainter, _palette: Palette): void {
        // Nothing
    }
}
