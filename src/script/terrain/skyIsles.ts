/**
 * Sky Isles: an invented area in the open Pacific, 100 x 100 km, holding fifty
 * floating islands between 500 m and 5 km up - each one a real mountainous
 * island of 1-300 km2 at its real size and height (Stromboli, Samothraki,
 * Tristan da Cunha, Saba, Ua Pou, El Hierro...) lifted into the sky with a
 * rock underside hanging below it.
 *
 * Everything on an island is real and baked once by tools/bake_sky_isles.py
 * into assets/skyisles/islands.json: per island a grid of ground heights, of
 * the distance to its coast, of the satellite colour and of the land cover
 * class, and its OSM roads, buildings, aprons and runways. Only where each
 * island floats, how high and how deep its rock hangs is drawn from one seed
 * here (generateSkyIsles), so it is the same every session. Its airfield is
 * its real runway, at its real airport's name.
 *
 * Two pure functions of an island and a point on it, {@link isleTopU} and
 * {@link isleBottomU}, say where its ground and its underside are. The
 * renderer samples them into a mesh (skyIsleEntity.ts) and the physics asks
 * them directly (SkyIsleField), so the ground an aircraft rolls on is the
 * ground on screen.
 *
 * Coordinates on an island are metres east (`e`) and north (`n`) of its
 * centre and up (`u`) from sea level, in the tangent plane at that centre.
 * Heights are bent down by the earth's curvature away from the centre so that
 * a level plateau is level the way an airfield's geodetic height is level:
 * the runway the airfield code lays at a constant height sits flush on it.
 *
 * Unlike the rest of the ground, an island is not solid all the way down: it
 * only counts as ground for whoever is above its underside (groundProbe.ts).
 */

import * as THREE from 'three';
import { EnuBasis, geodeticToEcef, geodeticToWorld } from './geodesy';
import { GROUND_PROBE } from './groundProbe';
import { TerrainArea } from './manifest';
import { TerrainClass } from './tones';
import type { Airfield, AirfieldRunway } from './airfields';

const SEED = 0x5ca1ab1e;

/** Centre of the area: open ocean, ~1300 km south-east of Hawaii. */
const CENTRE_LAT = 8.0;
const CENTRE_LON = -145.0;
const HALF_SIZE_M = 150_000;
const EARTH_R_M = 6_371_000;

/** Where the baked shapes are served. */
export const SKY_ISLES_DATA_URL = 'assets/skyisles/islands.json';

const metresPerDeg = (lat: number, lon: number) => {
    const d = 1e-3;
    const a = geodeticToEcef(lat, lon, 0);
    const b = geodeticToEcef(lat + d, lon, 0);
    const c = geodeticToEcef(lat, lon + d, 0);
    return {
        lat: Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / d,
        lon: Math.hypot(c.x - a.x, c.y - a.y, c.z - a.z) / d,
    };
};

const AREA_SCALE = metresPerDeg(CENTRE_LAT, CENTRE_LON);

/** The area as the area picker and the spawn search see it. */
export const SKY_ISLES_AREA: TerrainArea = {
    name: 'Sky Isles',
    south: CENTRE_LAT - HALF_SIZE_M / AREA_SCALE.lat,
    north: CENTRE_LAT + HALF_SIZE_M / AREA_SCALE.lat,
    west: CENTRE_LON - HALF_SIZE_M / AREA_SCALE.lon,
    east: CENTRE_LON + HALF_SIZE_M / AREA_SCALE.lon,
};

/** Areas that exist without a bake: appended to the baked ones wherever areas are offered. */
export const SYNTHETIC_AREAS: readonly TerrainArea[] = [SKY_ISLES_AREA];

// ---------------------------------------------------------------------------
// Noise

function hash2(ix: number, iz: number, seed: number): number {
    let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iz, 0x165667b1) ^ Math.imul(seed, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, z: number, seed: number): number {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

/** Fractal value noise in [0, 1], its longest wavelength `wavelengthM`. */
function fbm(e: number, n: number, seed: number, octaves: number, wavelengthM: number): number {
    let sum = 0, amp = 1, norm = 0, f = 1 / wavelengthM;
    for (let o = 0; o < octaves; o++) {
        sum += amp * valueNoise(e * f, n * f, seed + o * 101);
        norm += amp;
        amp *= 0.5;
        f *= 2.03;
    }
    return sum / norm;
}

function smoothstep(a: number, b: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

/** mulberry32 */
function rng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------------------------------------------------------------------------
// Baked shapes

/** One island as tools/bake_sky_isles.py writes it. */
export interface SkyIsleShapeFile {
    name: string;
    region: string;
    /** Where the real island is. */
    lat: number;
    lon: number;
    realExtentM: number;
    realTopM: number;
    /** Flying size over real size. */
    scale: number;
    nx: number;
    ny: number;
    cellM: number;
    /** South-west corner of the grid, island metres. */
    e0: number;
    n0: number;
    maxDistM: number;
    /** Base64 int16: quarter metres above sea level. */
    height: string;
    /** Base64 int16: metres to the coast, negative at sea. */
    dist: string;
    areaKm2?: number;
    /** Base64 bytes, 3 per cell: the satellite colour. */
    rgb?: string;
    /** Base64 bytes: TerrainClass per cell, OSM land use over ESA WorldCover. */
    cls?: string;
    /** OSM land use as vectors: polygons, no two overlapping. */
    fills?: SkyIsleFillsFile;
    osm?: SkyIsleOsmFile;
}

/** Land-use polygons as baked: rings like lines, polygon k's rings polyRings[k]..polyRings[k + 1], the first outer. */
interface SkyIsleFillsFile extends SkyIsleLinesFile {
    cls: string;
    polyRings: string;
}

/**
 * Land-use polygons: polygon k is TerrainClass cls[k], its rings
 * polyRings[k] .. polyRings[k + 1] of `rings`, the first its outline
 * (counter-clockwise from above), the rest holes.
 */
export interface SkyIsleFills {
    count: number;
    cls: Uint8Array;
    polyRings: Uint32Array;
    rings: SkyIsleLines;
}

/** Polylines or rings as baked: start offsets and int32 decimetre (e, n) pairs. */
interface SkyIsleLinesFile {
    count: number;
    starts: string;
    pts: string;
}

export interface SkyIsleOsmRunway {
    /** Centre, island metres. */
    e: number;
    n: number;
    headingDeg: number;
    lengthM: number;
    widthM: number;
    ref: string;
    paved: boolean;
}

export interface SkyIsleAerodrome {
    e: number;
    n: number;
    name: string;
    icao: string;
    iata: string;
}

interface SkyIsleOsmFile {
    roads: SkyIsleLinesFile & { cls: string };
    buildings: SkyIsleLinesFile & { height: string };
    paved: SkyIsleLinesFile;
    runways: SkyIsleOsmRunway[];
    aerodromes: SkyIsleAerodrome[];
}

/** Polylines or rings: line i is points starts[i] .. starts[i + 1], (e, n) metre pairs. */
export interface SkyIsleLines {
    count: number;
    starts: Uint32Array;
    pts: Float32Array;
}

/** Road classes as baked: 0 motorway .. 6 residential, 7 service, 8 track, 9 taxiway. */
export const enum SkyIsleRoadClass {
    Motorway = 0, Trunk, Primary, Secondary, Tertiary, Unclassified, Residential, Service, Track, Taxiway,
}

export interface SkyIsleOsm {
    roads: SkyIsleLines & { cls: Uint8Array };
    buildings: SkyIsleLines & { heightM: Float32Array };
    paved: SkyIsleLines;
    runways: SkyIsleOsmRunway[];
    aerodromes: SkyIsleAerodrome[];
}

export interface SkyIslesFile {
    version: number;
    islands: SkyIsleShapeFile[];
}

/** A baked shape, decoded: grids row-major from the south-west, rows northward. */
export interface SkyIsleShape {
    name: string;
    region: string;
    realLat: number;
    realLon: number;
    realExtentM: number;
    realTopM: number;
    nx: number;
    ny: number;
    cellM: number;
    e0: number;
    n0: number;
    maxDistM: number;
    /** Highest ground, m above the island's sea level. */
    topM: number;
    height: Float32Array;
    dist: Float32Array;
    /** Farthest land from the centre, m. */
    reachM: number;
    /** Satellite colour, 3 bytes per cell, when baked. */
    rgb?: Uint8Array;
    /** TerrainClass per cell (OSM land use over WorldCover), when baked. */
    cls?: Uint8Array;
    fills?: SkyIsleFills;
    osm?: SkyIsleOsm;
}

function decodeBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function decodeI16(b64: string): Int16Array {
    const bytes = decodeBytes(b64);
    return new Int16Array(bytes.buffer, 0, bytes.length >> 1);
}

function decodeLines(f: SkyIsleLinesFile): SkyIsleLines {
    const sb = decodeBytes(f.starts), pb = decodeBytes(f.pts);
    const dm = new Int32Array(pb.buffer, 0, pb.length >> 2);
    const pts = new Float32Array(dm.length);
    for (let i = 0; i < dm.length; i++) pts[i] = dm[i] / 10;
    return { count: f.count, starts: new Uint32Array(sb.buffer, 0, sb.length >> 2), pts };
}

function decodeFills(f: SkyIsleFillsFile): SkyIsleFills {
    const pr = decodeBytes(f.polyRings);
    return {
        count: f.count,
        cls: decodeBytes(f.cls),
        polyRings: new Uint32Array(pr.buffer, 0, pr.length >> 2),
        // Rings, not polygons: their count is the start table's.
        rings: (l => ({ ...l, count: l.starts.length - 1 }))(decodeLines(f)),
    };
}

function decodeOsm(f: SkyIsleOsmFile): SkyIsleOsm {
    const hb = decodeBytes(f.buildings.height);
    const dm = new Uint16Array(hb.buffer, 0, hb.length >> 1);
    const heightM = new Float32Array(dm.length);
    for (let i = 0; i < dm.length; i++) heightM[i] = dm[i] / 10;
    return {
        roads: { ...decodeLines(f.roads), cls: decodeBytes(f.roads.cls) },
        buildings: { ...decodeLines(f.buildings), heightM },
        paved: decodeLines(f.paved),
        runways: f.runways,
        aerodromes: f.aerodromes,
    };
}

export function decodeSkyIsleShape(f: SkyIsleShapeFile): SkyIsleShape {
    const h = decodeI16(f.height), d = decodeI16(f.dist);
    const height = new Float32Array(h.length), dist = new Float32Array(d.length);
    let topM = 0, reachM = 0;
    for (let j = 0; j < f.ny; j++) {
        for (let i = 0; i < f.nx; i++) {
            const k = j * f.nx + i;
            height[k] = h[k] / 4;
            dist[k] = d[k];
            if (d[k] > 0) {
                topM = Math.max(topM, height[k]);
                reachM = Math.max(reachM, Math.hypot(f.e0 + (i + 0.5) * f.cellM, f.n0 + (j + 0.5) * f.cellM));
            }
        }
    }
    return {
        name: f.name, region: f.region, realLat: f.lat, realLon: f.lon,
        realExtentM: f.realExtentM, realTopM: f.realTopM,
        nx: f.nx, ny: f.ny, cellM: f.cellM, e0: f.e0, n0: f.n0, maxDistM: f.maxDistM,
        topM, height, dist, reachM: reachM + f.cellM,
        rgb: f.rgb ? decodeBytes(f.rgb) : undefined,
        cls: f.cls ? decodeBytes(f.cls) : undefined,
        fills: f.fills ? decodeFills(f.fills) : undefined,
        osm: f.osm ? decodeOsm(f.osm) : undefined,
    };
}

/** Bilinear sample of a shape grid at island (e, n); `outside` past the grid. */
function sampleGrid(s: SkyIsleShape, grid: Float32Array, e: number, n: number, outside: number): number {
    const fx = (e - s.e0) / s.cellM - 0.5;
    const fy = (n - s.n0) / s.cellM - 0.5;
    if (fx < 0 || fy < 0 || fx > s.nx - 1 || fy > s.ny - 1) return outside;
    const x0 = Math.min(s.nx - 2, Math.floor(fx)), y0 = Math.min(s.ny - 2, Math.floor(fy));
    const tx = fx - x0, ty = fy - y0;
    const k = y0 * s.nx + x0;
    return grid[k] * (1 - tx) * (1 - ty) + grid[k + 1] * tx * (1 - ty)
        + grid[k + s.nx] * (1 - tx) * ty + grid[k + s.nx + 1] * tx * ty;
}

/** Grid cell under island (e, n), or -1 off the grid. */
function cellAt(s: SkyIsleShape, e: number, n: number): number {
    const i = Math.floor((e - s.e0) / s.cellM), j = Math.floor((n - s.n0) / s.cellM);
    return i < 0 || j < 0 || i >= s.nx || j >= s.ny ? -1 : j * s.nx + i;
}

/** TerrainClass of the ground at (e, n), its cell's; Unknown off the grid or unbaked. */
export function isleClassAt(isle: SkyIsle, e: number, n: number): TerrainClass {
    const c = isle.shape.cls;
    const k = cellAt(isle.shape, e, n);
    return c && k >= 0 ? c[k] as TerrainClass : TerrainClass.Unknown;
}

/**
 * The satellite colour of the ground at (e, n) as 0xRRGGBB, bilinear between
 * cell centres over the cells that have one; -1 where there is none.
 */
export function isleColourAt(isle: SkyIsle, e: number, n: number): number {
    const s = isle.shape;
    const rgb = s.rgb;
    if (!rgb) return -1;
    const fx = Math.min(s.nx - 1.001, Math.max(0, (e - s.e0) / s.cellM - 0.5));
    const fy = Math.min(s.ny - 1.001, Math.max(0, (n - s.n0) / s.cellM - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    let r = 0, g = 0, b = 0, w = 0;
    for (let q = 0; q < 4; q++) {
        const k = (y0 + (q >> 1)) * s.nx + x0 + (q & 1);
        const wq = ((q & 1) ? tx : 1 - tx) * ((q >> 1) ? ty : 1 - ty);
        if (rgb[k * 3] === 0 && rgb[k * 3 + 1] === 0 && rgb[k * 3 + 2] === 0) continue;
        r += rgb[k * 3] * wq; g += rgb[k * 3 + 1] * wq; b += rgb[k * 3 + 2] * wq; w += wq;
    }
    if (w < 1e-3) return -1;
    return (Math.round(r / w) << 16) | (Math.round(g / w) << 8) | Math.round(b / w);
}

// ---------------------------------------------------------------------------
// Islands

export interface SkyIsleRunway {
    /** Centre, island metres. */
    e: number;
    n: number;
    /** True bearing of the low designator's direction. */
    headingDeg: number;
    lengthM: number;
    widthM: number;
    /** The plateau it is cut into, m above the island's sea level. */
    groundM: number;
}

/** A waterfall pours off the coast here, outward along (de, dn). */
export interface SkyIsleWaterfall {
    e: number;
    n: number;
    de: number;
    dn: number;
}

export interface SkyIsle {
    index: number;
    /** The real island's name. */
    name: string;
    shape: SkyIsleShape;
    /** Where it floats. */
    lat: number;
    lon: number;
    /** Its sea level: how high its coast floats, m. */
    altM: number;
    /** How far the rock hangs below the top at its deepest, m. */
    depthM: number;
    seed: number;
    /** Its real runway, levelled; the airport's name and codes. */
    runway?: SkyIsleRunway;
    aerodrome?: SkyIsleAerodrome;
    waterfalls: SkyIsleWaterfall[];
    /** Caves straight through the underside, wide enough to fly through. */
    tunnels: SkyIsleTunnel[];
    /** Metres per degree here, for island metres to lat/lon. */
    mPerDegLat: number;
    mPerDegLon: number;
}

/**
 * A cave through an island's underside: a level tube from (ae, an) to
 * (be, bn) at height u, radius r, both ends open where it leaves the rock.
 */
export interface SkyIsleTunnel {
    ae: number;
    an: number;
    be: number;
    bn: number;
    u: number;
    r: number;
}

/** Rock between the top and the underside at the coast, m. */
const RIM_THICKNESS_M = 16;
/** The top rounds down this far over the last {@link RIM_BAND_M} before the coast, m. */
const RIM_DROP_M = 10;
const RIM_BAND_M = 70;
/** Flat ground around a runway: its half width and how far past each end, m. */
const AIRFIELD_FLAT_HALF_WIDTH_M = 75;
const AIRFIELD_FLAT_END_M = 60;
/** Flattened ground blends into the hills over this distance, m. */
const FLAT_BLEND_M = 150;
/** Where an island's coast may be, m: from the sea itself up to 6 km. */
const ALT_MIN_M = 0;
const ALT_MAX_M = 6000;
/**
 * An island drawn lower than this does not float: it sits in the sea like the
 * real one, its coast at sea level and its underside hidden under the water.
 */
const GROUNDED_BELOW_M = 400;
/** Lowest a floating island's underside may reach above the sea, m. */
const MIN_CLEARANCE_M = 180;
/** How far a grounded island's rock reaches below the sea, m. */
const GROUNDED_FOOT_M = 60;

/** Metres from the island's coast, positive inland. */
export function isleCoastDist(isle: SkyIsle, e: number, n: number): number {
    const coast = sampleGrid(isle.shape, isle.shape.dist, e, n, -1e4);
    const rw = isle.runway;
    if (!rw) return coast;
    // The levelled strip is land even where the real runway runs out onto a
    // breakwater or reclaimed ground the grid's coast does not reach.
    const { along, across } = runwayLocal(rw, e, n);
    const pad = -Math.max(Math.abs(along) - (rw.lengthM / 2 + AIRFIELD_FLAT_END_M),
        Math.abs(across) - AIRFIELD_FLAT_HALF_WIDTH_M);
    return Math.max(coast, pad);
}

/** Largest distance from the centre to the coast, for bounding boxes. */
export function maxRimRadius(isle: SkyIsle): number {
    const rw = isle.runway;
    if (!rw) return isle.shape.reachM;
    const padReach = Math.hypot(rw.e, rw.n) + Math.hypot(rw.lengthM / 2 + AIRFIELD_FLAT_END_M, AIRFIELD_FLAT_HALF_WIDTH_M);
    return Math.max(isle.shape.reachM, padReach);
}

/** Runway frame: metres along the runway's heading and across it (to its right). */
function runwayLocal(rw: { e: number; n: number; headingDeg: number }, e: number, n: number): { along: number; across: number } {
    const h = rw.headingDeg * Math.PI / 180;
    const de = e - rw.e, dn = n - rw.n;
    return {
        along: de * Math.sin(h) + dn * Math.cos(h),
        across: de * Math.cos(h) - dn * Math.sin(h),
    };
}

/**
 * How much of a point's ground is levelled for the runway (1 all of it, 0
 * none) and the height it is levelled to.
 */
function flatten(isle: SkyIsle, e: number, n: number, out: { w: number; groundM: number }): { w: number; groundM: number } {
    out.w = 0;
    out.groundM = 0;
    const rw = isle.runway;
    if (rw) {
        const { along, across } = runwayLocal(rw, e, n);
        const d = Math.max(Math.abs(along) - (rw.lengthM / 2 + AIRFIELD_FLAT_END_M),
            Math.abs(across) - AIRFIELD_FLAT_HALF_WIDTH_M);
        const w = 1 - smoothstep(0, FLAT_BLEND_M, d);
        if (w > out.w) {
            out.w = w;
            out.groundM = rw.groundM;
        }
    }
    return out;
}

const FLAT = { w: 0, groundM: 0 };

/** 1 on ground flattened for the runway, 0 on the natural ground. */
export function isleFlatWeight(isle: SkyIsle, e: number, n: number): number {
    return flatten(isle, e, n, FLAT).w;
}

/** Drop of the earth's surface below the island's tangent plane, m. */
const curvatureDrop = (e: number, n: number) => (e * e + n * n) / (2 * EARTH_R_M);

/** The real island's ground at (e, n), m above its sea level, levelled where it is flattened. */
function isleRelief(isle: SkyIsle, e: number, n: number, dist: number): number {
    const natural = sampleGrid(isle.shape, isle.shape.height, e, n, 0);
    const f = flatten(isle, e, n, FLAT);
    const ground = natural + (f.groundM - natural) * f.w;
    return ground - RIM_DROP_M * (1 - smoothstep(0, RIM_BAND_M, dist));
}

/** Height above sea of the island's ground at (e, n), in its tangent frame. */
export function isleTopU(isle: SkyIsle, e: number, n: number): number {
    const dist = Math.max(0, isleCoastDist(isle, e, n));
    return isle.altM + isleRelief(isle, e, n, dist) - curvatureDrop(e, n);
}

/**
 * Height above sea of the island's underside at (e, n), in its tangent frame:
 * a rock cone hanging under the whole outline, deepest under the land
 * farthest from any coast, lumpy, with spikes.
 */
export function isleBottomU(isle: SkyIsle, e: number, n: number): number {
    if (isle.altM <= 0) return -GROUNDED_FOOT_M - curvatureDrop(e, n);
    return undersideU(isle, e, n);
}

function undersideU(isle: SkyIsle, e: number, n: number): number {
    const dist = Math.max(0, isleCoastDist(isle, e, n));
    const top = isle.altM + isleRelief(isle, e, n, dist);
    const k = isle.shape.maxDistM * 0.45;
    const profile = (1 - Math.exp(-dist / k)) / (1 - Math.exp(-isle.shape.maxDistM / k));
    const lumps = fbm(e, n, isle.seed + 17, 3, 700);
    const spikes = Math.max(0, fbm(e, n, isle.seed + 29, 2, 260) - 0.55) * 2.2;
    // Crags: ridged noise, sharp crests between rounded hollows.
    const ridge = 1 - Math.abs(2 * fbm(e, n, isle.seed + 41, 4, 420) - 1);
    // Ledges: the depth stepped into bands, as strata break.
    const ledge = Math.floor(fbm(e, n, isle.seed + 53, 2, 900) * 7) / 7;
    const thick = RIM_THICKNESS_M
        + isle.depthM * Math.pow(profile, 0.75)
        * (0.55 + 0.35 * lumps + 0.6 * spikes + 0.35 * ridge * ridge + 0.25 * ledge);
    return Math.max(MIN_CLEARANCE_M * 0.5, top - thick) - curvatureDrop(e, n);
}

/**
 * The floor of the cave at (e, n) for a point at height u inside one, in
 * island u; NaN when the point is in none.
 */
export function isleCaveFloorU(isle: SkyIsle, e: number, n: number, u: number): number {
    for (const t of isle.tunnels) {
        const de = t.be - t.ae, dn = t.bn - t.an;
        const len2 = de * de + dn * dn;
        const k = ((e - t.ae) * de + (n - t.an) * dn) / len2;
        if (k < 0 || k > 1) continue;
        const side = Math.hypot(e - t.ae - de * k, n - t.an - dn * k);
        const dv = u - t.u;
        if (side * side + dv * dv >= t.r * t.r) continue;
        return t.u - Math.sqrt(t.r * t.r - side * side);
    }
    return NaN;
}

/** Distance from (e, n, u) to the nearest cave's axis over its radius: under 1 inside one. */
export function isleCaveDepth(isle: SkyIsle, e: number, n: number, u: number): number {
    let best = Infinity;
    for (const t of isle.tunnels) {
        const de = t.be - t.ae, dn = t.bn - t.an;
        const len2 = de * de + dn * dn;
        const k = Math.max(0, Math.min(1, ((e - t.ae) * de + (n - t.an) * dn) / len2));
        const d = Math.hypot(e - t.ae - de * k, n - t.an - dn * k, u - t.u) / t.r;
        best = Math.min(best, d);
    }
    return best;
}

/** True for an island that sits in the sea rather than floating over it. */
export function isleGrounded(isle: SkyIsle): boolean {
    return isle.altM <= 0;
}

/** Lat/lon of a point given in island metres. */
export function isleLatLon(isle: SkyIsle, e: number, n: number): { lat: number; lon: number } {
    return { lat: isle.lat + n / isle.mPerDegLat, lon: isle.lon + e / isle.mPerDegLon };
}

/** The island at the middle of the area: it has a real airport. */
const HUB_NAME = 'Pantelleria';
const HUB_ALT_M = 3000;

/**
 * The islands, always the same ones for the same shapes: each shape put
 * somewhere in the area at its own height, from the sea (a few sit in it, see
 * GROUNDED_BELOW_M) to 6 km. The first is the hub at the middle - the area's
 * home base.
 */
/** Plan cells the placement tests islands against one another in, m. */
const PLACE_CELL_M = 1000;
/** Deepest an underside hangs below its coast (depthM), so islands can stack, m. */
const MAX_DEPTH_M = 3200;

/**
 * The plan cells an island covers when its middle sits on a cell corner:
 * every cell with land in it, grown by one cell all round so neighbours keep
 * about a kilometre of sky between their coasts.
 */
function footprintCells(shape: SkyIsleShape): FootCell[] {
    const cells = new Map<string, FootCell>();
    const add = (ci: number, cj: number, land: boolean, corridor: boolean) => {
        const key = `${ci},${cj}`;
        const c = cells.get(key) ?? { di: ci, dj: cj, land: false, corridor: false };
        c.land ||= land;
        c.corridor ||= corridor;
        cells.set(key, c);
    };
    for (let j = 0; j < shape.ny; j++) {
        for (let i = 0; i < shape.nx; i++) {
            if (shape.dist[j * shape.nx + i] <= 0) continue;
            const ci = Math.floor((shape.e0 + (i + 0.5) * shape.cellM) / PLACE_CELL_M);
            const cj = Math.floor((shape.n0 + (j + 0.5) * shape.cellM) / PLACE_CELL_M);
            for (let dj = -1; dj <= 1; dj++) {
                for (let di = -1; di <= 1; di++) add(ci + di, cj + dj, true, false);
            }
        }
    }
    // The runway and its approaches: no rock close over or under them.
    const rw = shape.osm?.runways[0];
    if (rw) {
        const h = rw.headingDeg * Math.PI / 180;
        const reach = rw.lengthM / 2 + APPROACH_CLEAR_M;
        for (let a = -reach; a <= reach; a += PLACE_CELL_M / 4) {
            for (let b = -PLACE_CELL_M / 2; b <= PLACE_CELL_M / 2; b += PLACE_CELL_M / 4) {
                const e = rw.e + Math.sin(h) * a + Math.cos(h) * b;
                const n = rw.n + Math.cos(h) * a - Math.sin(h) * b;
                add(Math.floor(e / PLACE_CELL_M), Math.floor(n / PLACE_CELL_M), false, true);
            }
        }
    }
    return [...cells.values()];
}

interface FootCell { di: number; dj: number; land: boolean; corridor: boolean }

/** How far past each runway end its approach is kept clear of other islands, m. */
const APPROACH_CLEAR_M = 3000;
/** Height kept clear over and under a runway and its approaches, m. */
const APPROACH_GAP_M = 1500;
/** Sky between stacked islands elsewhere, m. */
const STACK_GAP_M = 450;

export function generateSkyIsles(shapes: readonly SkyIsleShape[]): SkyIsle[] {
    const rand = rng(SEED);
    // The hub first, then the biggest, so the large ones find room.
    const order = [...shapes].sort((a, b) =>
        Number(b.name === HUB_NAME) - Number(a.name === HUB_NAME) || b.reachM - a.reachM);
    const isles: SkyIsle[] = [];
    // Each plan cell's islands as height spans. Rock shares a cell with rock
    // only with sky between them; with a runway or its approach only with a
    // lot of it. Approaches may cross each other at any height.
    // A cell's entry: the island's rock span where it has land, the runway's
    // height where it has an approach.
    const cells = new Map<string, { bottom: number; top: number; land: boolean; corridor: boolean; runwayU: number }[]>();
    const limit = Math.floor((HALF_SIZE_M - 1200) / PLACE_CELL_M);
    const apart = (b0: number, t0: number, b1: number, t1: number) => b0 > t1 ? b0 - t1 : b1 - t0;
    const fits = (ci: number, cj: number, foot: FootCell[], bottom: number, top: number, runwayU: number) => {
        for (const c of foot) {
            const i = ci + c.di, j = cj + c.dj;
            if (c.land && (i < -limit || j < -limit || i >= limit || j >= limit)) return false;
            for (const o of cells.get(`${i},${j}`) ?? []) {
                if (c.land && o.land && apart(bottom, top, o.bottom, o.top) < STACK_GAP_M) return false;
                if (c.land && o.corridor && apart(bottom, top, o.runwayU, o.runwayU) < APPROACH_GAP_M) return false;
                if (c.corridor && o.land && apart(runwayU, runwayU, o.bottom, o.top) < APPROACH_GAP_M) return false;
            }
        }
        return true;
    };
    for (const shape of order) {
        const hub = isles.length === 0 && shape.name === HUB_NAME;
        const r = shape.reachM;
        const foot = footprintCells(shape);
        const rw0 = shape.osm?.runways[0];
        const runwayGroundM = rw0 ? sampleGrid(shape, shape.height, rw0.e, rw0.n, 0) : 0;
        let done = false;
        for (let tries = 0; tries < 3000 && !done; tries++) {
            const drawn = hub ? HUB_ALT_M : ALT_MIN_M + rand() * (ALT_MAX_M - ALT_MIN_M);
            const altM = drawn < GROUNDED_BELOW_M ? 0 : drawn;
            const depthM = altM <= 0 ? 0
                : Math.max(120, Math.min(r * (0.8 + rand() * 1.0), MAX_DEPTH_M, (altM - MIN_CLEARANCE_M) / 1.8));
            const ci = hub ? 0 : Math.floor((rand() * 2 - 1) * limit);
            const cj = hub ? 0 : Math.floor((rand() * 2 - 1) * limit);
            const e = ci * PLACE_CELL_M, n = cj * PLACE_CELL_M;
            const bottom = altM <= 0 ? -GROUNDED_FOOT_M
                : Math.max(MIN_CLEARANCE_M * 0.5, altM - depthM * 1.8 - RIM_THICKNESS_M);
            const top = altM + shape.topM;
            const runwayU = altM + runwayGroundM;
            if (!hub && !fits(ci, cj, foot, bottom, top, runwayU)) continue;
            const lat = CENTRE_LAT + n / AREA_SCALE.lat;
            const lon = CENTRE_LON + e / AREA_SCALE.lon;
            const scale = metresPerDeg(lat, lon);
            const isle: SkyIsle = {
                index: isles.length, name: shape.name, shape, lat, lon, altM, depthM,
                seed: Math.floor(rand() * 1e9), waterfalls: [], tunnels: [],
                mPerDegLat: scale.lat, mPerDegLon: scale.lon,
            };
            placeRunway(isle);
            if (altM > 0) placeWaterfalls(isle, rand);
            if (altM > 0) placeTunnels(isle, rand);
            isles.push(isle);
            for (const c of foot) {
                const key = `${ci + c.di},${cj + c.dj}`;
                const list = cells.get(key) ?? [];
                list.push({ bottom, top, land: c.land, corridor: c.corridor, runwayU });
                cells.set(key, list);
            }
            done = true;
        }
    }
    return isles;
}

/**
 * Caves through the underside: one for a small island, up to three for a big
 * one, each a level tube crossing the rock where it hangs deep, from where it
 * comes out of the underside on one side to where it does on the other.
 * Never so high that it would break the top, never through the rim.
 */
function placeTunnels(isle: SkyIsle, rand: () => number): void {
    const reach = isle.shape.reachM;
    if (isle.depthM < 350 || reach < 1200) return;
    const want = reach > 8000 ? 3 : reach > 3500 ? 2 : 1;
    const step = 40;
    for (let tries = 0; tries < 40 && isle.tunnels.length < want; tries++) {
        const a = rand() * Math.PI * 2;
        const de = Math.cos(a), dn = Math.sin(a);
        const off = (rand() * 2 - 1) * reach * 0.35;
        const pe = -dn * off, pn = de * off;
        if (isleCoastDist(isle, pe, pn) < 300) continue;
        const bottom = undersideU(isle, pe, pn), top = isleTopU(isle, pe, pn);
        const r = Math.max(80, Math.min(150, (top - bottom) * 0.12));
        const u = bottom + r + (top - bottom - 2 * r) * (0.15 + rand() * 0.25);
        // Out both ways until the tube is clear of the rock below; give up if
        // the top comes down onto it or the coast comes first.
        const ends: number[] = [];
        let ok = true;
        for (const dir of [-1, 1]) {
            let s = 0, out = NaN;
            while (s < reach * 2) {
                s += step;
                const e = pe + de * s * dir, n = pn + dn * s * dir;
                if (isleCoastDist(isle, e, n) <= 0 || isleTopU(isle, e, n) - u < r + 60) break;
                if (undersideU(isle, e, n) > u + r + 15) {
                    out = s;
                    break;
                }
            }
            if (!Number.isFinite(out)) {
                ok = false;
                break;
            }
            ends.push(out * dir);
        }
        if (!ok || ends[1] - ends[0] < 400) continue;
        const t: SkyIsleTunnel = {
            ae: pe + de * (ends[0] - r), an: pn + dn * (ends[0] - r),
            be: pe + de * (ends[1] + r), bn: pn + dn * (ends[1] + r), u, r,
        };
        // Apart from the ones already there.
        if (isle.tunnels.some(o => Math.abs(o.u - u) < (o.r + r) * 1.6
            && Math.hypot((o.ae + o.be) / 2 - (t.ae + t.be) / 2, (o.an + o.bn) / 2 - (t.an + t.bn) / 2) < reach * 0.4)) continue;
        isle.tunnels.push(t);
    }
}

/** The real island's natural ground along a runway's centreline and edges: its mean, m. */
function runwayGround(isle: SkyIsle, rw: SkyIsleOsmRunway): number {
    const h = rw.headingDeg * Math.PI / 180;
    const ae = Math.sin(h), an = Math.cos(h);
    const xe = Math.cos(h), xn = -Math.sin(h);
    const steps = Math.max(4, Math.ceil(rw.lengthM / 2 / 60));
    let sum = 0, count = 0;
    for (let a = -steps; a <= steps; a++) {
        for (const b of [-1, 0, 1]) {
            const e = rw.e + ae * rw.lengthM / 2 * a / steps + xe * rw.widthM / 2 * b;
            const n = rw.n + an * rw.lengthM / 2 * a / steps + xn * rw.widthM / 2 * b;
            sum += sampleGrid(isle.shape, isle.shape.height, e, n, 0);
            count++;
        }
    }
    return sum / count;
}

/** The island's real runway - the longest paved one - levelled at its mean ground, and its airport. */
function placeRunway(isle: SkyIsle): void {
    const osm = isle.shape.osm;
    const rw = osm?.runways[0];
    if (!osm || !rw) return;
    isle.runway = {
        e: rw.e, n: rw.n, headingDeg: rw.headingDeg, lengthM: rw.lengthM, widthM: rw.widthM,
        groundM: Math.max(2, runwayGround(isle, rw)),
    };
    let best: SkyIsleAerodrome | undefined;
    for (const a of osm.aerodromes) {
        if (!best || Math.hypot(a.e - rw.e, a.n - rw.n) < Math.hypot(best.e - rw.e, best.n - rw.n)) best = a;
    }
    isle.aerodrome = best;
}

/** Waterfalls where the coast is high: the steepest drop off the edge into the sky. */
function placeWaterfalls(isle: SkyIsle, rand: () => number): void {
    const s = isle.shape;
    const candidates: { e: number; n: number; g: number }[] = [];
    for (let j = 1; j < s.ny - 1; j++) {
        for (let i = 1; i < s.nx - 1; i++) {
            const k = j * s.nx + i;
            const d = s.dist[k];
            if (d <= 0 || d > s.cellM * 1.5) continue;
            candidates.push({ e: s.e0 + (i + 0.5) * s.cellM, n: s.n0 + (j + 0.5) * s.cellM, g: s.height[k] + rand() * 30 });
        }
    }
    candidates.sort((a, b) => b.g - a.g);
    const count = Math.min(candidates.length, 1 + Math.floor(rand() * (s.reachM > 2000 ? 4 : 2)));
    for (const c of candidates) {
        if (isle.waterfalls.length >= count) break;
        if (isle.waterfalls.some(w => Math.hypot(w.e - c.e, w.n - c.n) < s.reachM * 0.5)) continue;
        // Outward: down the distance field.
        const g = s.cellM;
        const de = isleCoastDist(isle, c.e - g, c.n) - isleCoastDist(isle, c.e + g, c.n);
        const dn = isleCoastDist(isle, c.e, c.n - g) - isleCoastDist(isle, c.e, c.n + g);
        const len = Math.hypot(de, dn) || 1;
        isle.waterfalls.push({ e: c.e, n: c.n, de: de / len, dn: dn / len });
    }
}

// ---------------------------------------------------------------------------
// What stands on the islands

export interface SkyIsleTree {
    e: number;
    n: number;
    /** Ground under it, island u. */
    u: number;
    heightM: number;
    radiusM: number;
}

/** Share of tree sites that grow a tree, by TerrainClass. */
const TREE_DENSITY: Readonly<Partial<Record<TerrainClass, number>>> = {
    [TerrainClass.Tree]: 0.85,
    [TerrainClass.Mangrove]: 0.9,
    [TerrainClass.Shrub]: 0.22,
    [TerrainClass.Wetland]: 0.1,
    [TerrainClass.Heath]: 0.05,
    [TerrainClass.Grass]: 0.03,
    [TerrainClass.Crop]: 0.03,
    [TerrainClass.Built]: 0.04,
    [TerrainClass.Ground]: 0.03,
};

/**
 * Trees on an island where its land cover has them - forest thick, shrubland
 * thin - never on levelled ground; where no cover is baked, jungle in noise
 * patches. A few giants among them.
 */
export function isleTrees(isle: SkyIsle, spacingM = 45): SkyIsleTree[] {
    const rand = rng(isle.seed ^ 0x7ee5);
    const out: SkyIsleTree[] = [];
    const reach = maxRimRadius(isle);
    const covered = isle.shape.cls !== undefined;
    for (let n = -reach; n <= reach; n += spacingM) {
        for (let e = -reach; e <= reach; e += spacingM) {
            const te = e + (rand() - 0.5) * spacingM * 0.9;
            const tn = n + (rand() - 0.5) * spacingM * 0.9;
            const r1 = rand(), r2 = rand(), r3 = rand();
            if (isleCoastDist(isle, te, tn) < 20) continue;
            if (isleFlatWeight(isle, te, tn) > 0.02) continue;
            if (covered) {
                if (r1 > (TREE_DENSITY[isleClassAt(isle, te, tn)] ?? 0)) continue;
            } else {
                const forest = fbm(te, tn, isle.seed + 7, 3, 650);
                if (forest < 0.45 || r1 > (forest - 0.38) * 2.2) continue;
            }
            const giant = r2 < 0.015;
            const heightM = giant ? 45 + r3 * 25 : 9 + r3 * 14;
            out.push({
                e: te, n: tn, u: isleTopU(isle, te, tn) - 1, heightM,
                radiusM: heightM * (giant ? 0.28 : 0.33),
            });
        }
    }
    return out;
}

/** True where the land cover is forest (or, unbaked, the noise jungle grows): for the ground's colour under it. */
export function isleForested(isle: SkyIsle, e: number, n: number): boolean {
    if (isle.shape.cls) {
        const c = isleClassAt(isle, e, n);
        return c === TerrainClass.Tree || c === TerrainClass.Mangrove;
    }
    return fbm(e, n, isle.seed + 7, 3, 650) >= 0.48 && isleFlatWeight(isle, e, n) < 0.3
        && sampleGrid(isle.shape, isle.shape.height, e, n, 0) < isle.shape.topM * 0.8;
}

/** The real island's ground at (e, n) as a fraction of its highest point. */
export function isleHeightFraction(isle: SkyIsle, e: number, n: number): number {
    return isle.shape.topM > 0 ? sampleGrid(isle.shape, isle.shape.height, e, n, 0) / isle.shape.topM : 0;
}

/** One OSM building on an island, with the box that stands in for it as a collider. */
export interface SkyIsleBuilding {
    /** Footprint, counter-clockwise from above: e, n pairs. */
    ring: Float32Array;
    heightM: number;
    /** Lowest ground under its corners, island u: its floor. */
    groundU: number;
    /** Its footprint's box along its longest wall: centre, bearing (rad from east, counter-clockwise), half sizes. */
    e: number;
    n: number;
    angle: number;
    halfLength: number;
    halfWidth: number;
}

/** The island's OSM buildings, standing on its ground. */
export function isleBuildings(isle: SkyIsle): SkyIsleBuilding[] {
    const b = isle.shape.osm?.buildings;
    if (!b) return [];
    const out: SkyIsleBuilding[] = [];
    for (let i = 0; i < b.count; i++) {
        const ring = b.pts.subarray(b.starts[i] * 2, b.starts[i + 1] * 2);
        const m = ring.length / 2;
        let groundU = Infinity, longest = -1, angle = 0;
        for (let k = 0; k < m; k++) {
            const e = ring[k * 2], n = ring[k * 2 + 1];
            groundU = Math.min(groundU, isleTopU(isle, e, n));
            const k2 = (k + 1) % m;
            const de = ring[k2 * 2] - e, dn = ring[k2 * 2 + 1] - n;
            const len = de * de + dn * dn;
            if (len > longest) {
                longest = len;
                angle = Math.atan2(dn, de);
            }
        }
        const ca = Math.cos(angle), sa = Math.sin(angle);
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (let k = 0; k < m; k++) {
            const e = ring[k * 2], n = ring[k * 2 + 1];
            const a = e * ca + n * sa, c = -e * sa + n * ca;
            a0 = Math.min(a0, a); a1 = Math.max(a1, a);
            b0 = Math.min(b0, c); b1 = Math.max(b1, c);
        }
        const am = (a0 + a1) / 2, bm = (b0 + b1) / 2;
        const ce = am * ca - bm * sa, cn = am * sa + bm * ca;
        // Harbour sheds and pier ends past the grid's coast would hang off
        // the edge of the rock: leave them out.
        if (isleCoastDist(isle, ce, cn) <= 0) continue;
        // An L or a T can be deeper than its longest edge: length is the longer side.
        const ha = (a1 - a0) / 2, hb = (b1 - b0) / 2;
        out.push({
            ring, heightM: b.heightM[i], groundU,
            e: ce, n: cn, angle: ha >= hb ? angle : angle + Math.PI / 2,
            halfLength: Math.max(ha, hb), halfWidth: Math.min(ha, hb),
        });
    }
    return out;
}

// ---------------------------------------------------------------------------
// Airfields

function designator(headingDeg: number): string {
    const n = Math.round(((headingDeg % 360) + 360) % 360 / 10) % 36 || 36;
    return String(n).padStart(2, '0');
}

/**
 * An island's airfield as the baked airfields look, so everything that
 * handles those - drawing, lights, solid pavement, the spawn picker, the AI's
 * runways - handles it too. No pads: its ground is the island's plateau.
 */
export function isleAirfield(isle: SkyIsle): Airfield | undefined {
    const rw = isle.runway;
    if (!rw) return undefined;
    const elevation = isle.altM + rw.groundM;
    const h = rw.headingDeg * Math.PI / 180;
    const ae = Math.sin(h), an = Math.cos(h);
    const xe = Math.cos(h), xn = -Math.sin(h);
    const at = (along: number, across: number) =>
        isleLatLon(isle, rw.e + ae * along + xe * across, rw.n + an * along + xn * across);
    const mid = at(0, 0);
    const lowEnd = at(-rw.lengthM / 2, 0), highEnd = at(rw.lengthM / 2, 0);
    const runway: AirfieldRunway = {
        ref: isle.shape.osm?.runways[0]?.ref || `${designator(rw.headingDeg)}/${designator(rw.headingDeg + 180)}`,
        headingDeg: rw.headingDeg,
        lengthM: rw.lengthM,
        widthM: rw.widthM,
        surface: isle.shape.osm?.runways[0]?.paved === false ? 'grass' : 'asphalt',
        lit: true,
        lat: mid.lat,
        lon: mid.lon,
        thresholds: [[lowEnd.lat, lowEnd.lon], [highEnd.lat, highEnd.lon]],
    };
    // Its aprons, taxiways and buildings are the island's own OSM ones.
    const ad = isle.aerodrome;
    return {
        name: ad?.name || `${isle.name} Airport`,
        icao: ad?.icao ?? '',
        iata: ad?.iata ?? '',
        kind: 'aerodrome',
        area: SKY_ISLES_AREA.name,
        lat: mid.lat,
        lon: mid.lon,
        elevationM: elevation,
        plane: { heightMsl: elevation, gradient: 0, headingDeg: rw.headingDeg },
        runways: [runway],
        taxiways: [],
        aprons: [],
        buildings: [],
        pads: [],
    };
}

/** Every island's airfield. */
export function skyIsleAirfields(isles: readonly SkyIsle[]): Airfield[] {
    return isles.flatMap(i => {
        const a = isleAirfield(i);
        return a ? [a] : [];
    });
}

// ---------------------------------------------------------------------------
// The islands in the scene

/** An island's tangent frame in scene axes: its sea-level centre and unit e, n, u. */
export interface SkyIsleFrame {
    c: [number, number, number];
    e: [number, number, number];
    n: [number, number, number];
    u: [number, number, number];
}

export function skyIsleFrame(basis: EnuBasis, isle: SkyIsle): SkyIsleFrame {
    const c = geodeticToWorld(basis, isle.lat, isle.lon, 0);
    const up = geodeticToWorld(basis, isle.lat, isle.lon, 1000).sub(c).normalize();
    const east = geodeticToWorld(basis, isle.lat, isle.lon + 1e-3, 0).sub(c);
    const north = new THREE.Vector3().crossVectors(up, east).normalize();
    east.crossVectors(north, up).normalize();
    return { c: c.toArray(), e: east.toArray(), n: north.toArray(), u: up.toArray() };
}

/** Island metres to a scene offset from the frame's centre. */
export function frameOffset(f: SkyIsleFrame, e: number, n: number, u: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(
        e * f.e[0] + n * f.n[0] + u * f.u[0],
        e * f.e[1] + n * f.n[1] + u * f.u[1],
        e * f.e[2] + n * f.n[2] + u * f.u[2],
    );
}

/** What the worker is sent: the islands and their frames in the current scene. */
export interface SerializedSkyIsles {
    isles: SkyIsle[];
    frames: SkyIsleFrame[];
}

/** Where a scene (x, z) lands on one island, from {@link SkyIsleField.solve}. */
interface IsleHit {
    e: number;
    n: number;
}

/**
 * The islands as ground: the physics' height queries, in scene coordinates.
 * Built for one scene frame; rebuilt after a re-base (the islands stay put on
 * the earth, the frame moves).
 */
export class SkyIsleField {
    private readonly reach: number[];
    private readonly hit: IsleHit = { e: 0, n: 0 };
    private readonly caveHit: IsleHit = { e: 0, n: 0 };

    constructor(readonly isles: readonly SkyIsle[], readonly frames: readonly SkyIsleFrame[]) {
        this.reach = isles.map(i => maxRimRadius(i) + 60);
    }

    static forBasis(isles: readonly SkyIsle[], basis: EnuBasis): SkyIsleField {
        return new SkyIsleField(isles, isles.map(i => skyIsleFrame(basis, i)));
    }

    static deserialize(s: SerializedSkyIsles): SkyIsleField {
        return new SkyIsleField(s.isles, s.frames);
    }

    serialize(): SerializedSkyIsles {
        return { isles: [...this.isles], frames: [...this.frames] };
    }

    /**
     * Island (e, n) under scene (x, z) on the surface at island height `u`:
     * the frame's up leans by up to half a degree in the scene, which at
     * 3 km up is metres sideways.
     */
    private solve(f: SkyIsleFrame, x: number, z: number, u: number, out: IsleHit): IsleHit {
        const dx = x - f.c[0] - u * f.u[0];
        const dz = z - f.c[2] - u * f.u[2];
        const det = f.e[0] * f.n[2] - f.n[0] * f.e[2];
        out.e = (dx * f.n[2] - f.n[0] * dz) / det;
        out.n = (f.e[0] * dz - dx * f.e[2]) / det;
        return out;
    }

    private sceneY(f: SkyIsleFrame, e: number, n: number, u: number): number {
        return f.c[1] + e * f.e[1] + n * f.n[1] + u * f.u[1];
    }

    /**
     * Highest island ground at scene (x, z) for a query from height `probeY`:
     * an island counts only if the probe is not below its underside there.
     * -Infinity where there is none.
     */
    surfaceYAt(x: number, z: number, probeY: number = GROUND_PROBE.y): number {
        let best = -Infinity;
        for (let i = 0; i < this.isles.length; i++) {
            const f = this.frames[i];
            const r = this.reach[i];
            if (Math.abs(x - f.c[0]) > r || Math.abs(z - f.c[2]) > r) continue;
            const isle = this.isles[i];
            let h = this.solve(f, x, z, isle.altM, this.hit);
            if (isleCoastDist(isle, h.e, h.n) < -isle.shape.cellM) continue;
            const top0 = isleTopU(isle, h.e, h.n);
            h = this.solve(f, x, z, top0, this.hit);
            if (isleCoastDist(isle, h.e, h.n) <= 0) continue;
            const topY = this.sceneY(f, h.e, h.n, isleTopU(isle, h.e, h.n));
            if (topY <= best) continue;
            if (probeY !== Infinity) {
                // Island (e, n) at the probe's own height: the frame's up
                // leans (a degree or so far out), which over the km between
                // the top and a probe under it is many metres sideways.
                let c = this.solve(f, x, z, (probeY - f.c[1]) / f.u[1], this.caveHit);
                let u = (probeY - this.sceneY(f, c.e, c.n, 0)) / f.u[1];
                c = this.solve(f, x, z, u, this.caveHit);
                u = (probeY - this.sceneY(f, c.e, c.n, 0)) / f.u[1];
                if (u < isleBottomU(isle, c.e, c.n)) continue;
                // In a cave: its floor is the ground, the rock over it is not.
                if (isle.tunnels.length > 0) {
                    const floorU = isleCaveFloorU(isle, c.e, c.n, u);
                    if (!Number.isNaN(floorU)) {
                        best = Math.max(best, this.sceneY(f, c.e, c.n, floorU));
                        continue;
                    }
                }
            }
            best = topY;
        }
        return best;
    }

    /** Index of the island over scene (x, z), the highest where they stack; -1 for none. */
    isleAt(x: number, z: number): number {
        let best = -1, bestAlt = -Infinity;
        for (let i = 0; i < this.isles.length; i++) {
            const f = this.frames[i];
            const r = this.reach[i];
            if (Math.abs(x - f.c[0]) > r || Math.abs(z - f.c[2]) > r) continue;
            const isle = this.isles[i];
            const h = this.solve(f, x, z, isle.altM, this.hit);
            if (isleCoastDist(isle, h.e, h.n) > 0 && isle.altM > bestAlt) {
                best = i;
                bestAlt = isle.altM;
            }
        }
        return best;
    }

    /** Height above sea of the top of the island over scene (x, z), or undefined. */
    altitudeAt(x: number, z: number): number | undefined {
        const i = this.isleAt(x, z);
        if (i < 0) return undefined;
        const isle = this.isles[i];
        const h = this.solve(this.frames[i], x, z, isle.altM, this.hit);
        return isleTopU(isle, h.e, h.n) + curvatureDrop(h.e, h.n);
    }

    /** Scene Y of the underside of the island over scene (x, z), or undefined. */
    bottomYAt(x: number, z: number): number | undefined {
        const i = this.isleAt(x, z);
        if (i < 0) return undefined;
        const isle = this.isles[i];
        const f = this.frames[i];
        const h = this.solve(f, x, z, isle.altM, this.hit);
        return this.sceneY(f, h.e, h.n, isleBottomU(isle, h.e, h.n));
    }
}

let loading: Promise<SkyIsle[]> | undefined;

/**
 * The islands, loaded once: the baked shapes floated into place. Empty (with
 * a warning) when the shapes are not there - the area then has only sea.
 */
export function loadSkyIsles(url: string = SKY_ISLES_DATA_URL): Promise<SkyIsle[]> {
    loading ??= fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<SkyIslesFile>;
        })
        .then(file => generateSkyIsles(file.islands.map(decodeSkyIsleShape)))
        .catch(err => {
            console.warn(`sky isles: no island shapes at ${url} (${err}); run tools/bake_sky_isles.py`);
            return [];
        });
    return loading;
}
