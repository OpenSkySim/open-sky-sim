/**
 * Generated stand-ins for the drawn airframes the webbing solver is tested
 * against. The meshes the tests were written with were baked from third-party
 * models that cannot ship in the repo, so these are built from primitives
 * instead: a lofted fuselage, wing and tail panels with a thin airfoil
 * section, and gear legs (strut and wheel) as separate parts below, the way
 * the drawn meshes have them (withoutGear finds the gear by that).
 *
 * Four layouts span what the net meets: a twin-fin wide-body (the F-22's
 * bounds), a single-fin small jet (the F-16A's), a cranked delta without
 * tailplanes (the F-16XL's) and a wide-span twin-fin (the F-14A's, wings
 * forward). Body frame as the game's: +Z forward, +Y up, metres, wheels at
 * y = -2. Every part is closed and wound outward.
 *
 * Node-only, so named as a test file (outside the app's typecheck); it holds
 * no tests itself.
 */

export type Vec3 = readonly [number, number, number];

/** A fuselage cross-section: station z, centre height, half width and half height, superellipse exponent (2, the default, an ellipse; larger boxier). */
interface Section { z: number; cy: number; hw: number; hh: number; p?: number; cx?: number }

/** A lifting-surface station: its leading edge, chord (along -z) and thickness ratio. */
interface PanelStation { le: Vec3; chord: number; thick: number }

interface GearLeg { x: number; z: number; wheelR: number; wheelW: number }

export interface DummyAirframeSpec {
    /** Fuselage sections, tail to nose; the nose closes to a point ahead of the last one. */
    fuselage: Section[];
    nose: Vec3;
    /** Lifting surfaces (wing, tailplanes, fins), each a list of stations from one tip (or root) to the other. */
    panels: PanelStation[][];
    gear: GearLeg[];
    /**
     * Wingtip launchers with their missiles, right side (mirrored). They hold
     * the upper belt: without them it slid out along a swept leading edge and
     * off the tips, and the net let a 60 m/s catch go.
     */
    tipStores?: TipStore[];
}

/** A missile on a wingtip rail: its axis (x, y), tail and nose stations, radius. */
interface TipStore { x: number; y: number; zTail: number; zNose: number; r: number }

const WHEEL_BOTTOM_Y = -2;
/** Top of every gear strut (m): inside the fuselage's underside, and low enough for withoutGear to call it gear. */
const STRUT_TOP_Y = -0.7;
const FUSELAGE_RING = 16;
/**
 * Station spacing along the fuselage and along a panel's span (m). Kept coarse: the sim steps
 * the web on a time budget, and a heavier collision mesh buys fewer substeps.
 */
const STATION_STEP_M = 0.8;
const PANEL_STEP_M = 1;
const NOSE_RINGS = 4;
/** Airfoil section: chord fractions, round-nosed with a finite trailing edge (NACA 4-digit thickness, as a share of its maximum). */
const AIRFOIL_T = [0.01, 0.05, 0.15, 0.3, 0.5, 0.75, 1];
const naca = (x: number) => 5 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4) / 0.5;
const AIRFOIL_H = AIRFOIL_T.map(naca);
/** Thinnest a panel gets (m): a skin a few centimetres thick is a blade the net's links cut across. */
const MIN_PANEL_THICK_M = 0.1;

type Tri = number[];

/** Outward winding: flip the whole part if its signed volume came out negative. */
function wound(tris: Tri): Tri {
    let v = 0;
    for (let o = 0; o < tris.length; o += 9) {
        const [ax, ay, az, bx, by, bz, cx, cy, cz] = tris.slice(o, o + 9);
        v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
    }
    if (v >= 0) return tris;
    for (let o = 0; o < tris.length; o += 9) {
        for (let k = 0; k < 3; k++) {
            const t = tris[o + 3 + k];
            tris[o + 3 + k] = tris[o + 6 + k];
            tris[o + 6 + k] = t;
        }
    }
    return tris;
}

/**
 * Rings of equal size joined into a tube, each end closed by a fan to the
 * given point (an apex, or the end ring's centre for a flat cap).
 */
function loft(rings: Vec3[][], startCap: Vec3, endCap: Vec3): Tri {
    const out: Tri = [];
    const tri = (a: Vec3, b: Vec3, c: Vec3) => out.push(...a, ...b, ...c);
    const m = rings[0].length;
    for (let i = 0; i + 1 < rings.length; i++) {
        const r0 = rings[i], r1 = rings[i + 1];
        for (let j = 0; j < m; j++) {
            const k = (j + 1) % m;
            tri(r0[j], r0[k], r1[k]);
            tri(r0[j], r1[k], r1[j]);
        }
    }
    const first = rings[0], last = rings[rings.length - 1];
    for (let j = 0; j < m; j++) {
        const k = (j + 1) % m;
        tri(startCap, first[k], first[j]);
        tri(endCap, last[j], last[k]);
    }
    return wound(out);
}

function centroid(ring: Vec3[]): Vec3 {
    let x = 0, y = 0, z = 0;
    for (const p of ring) { x += p[0]; y += p[1]; z += p[2]; }
    return [x / ring.length, y / ring.length, z / ring.length];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function fuselage(sections: Section[], nose: Vec3): Tri {
    const rings: Vec3[][] = [];
    for (let i = 0; i + 1 < sections.length; i++) {
        const a = sections[i], b = sections[i + 1];
        const n = Math.max(1, Math.ceil((b.z - a.z) / STATION_STEP_M));
        for (let s = 0; s < n; s++) {
            const t = s / n;
            rings.push(fuselageRing({
                z: lerp(a.z, b.z, t), cx: lerp(a.cx ?? 0, b.cx ?? 0, t), cy: lerp(a.cy, b.cy, t), hw: lerp(a.hw, b.hw, t), hh: lerp(a.hh, b.hh, t),
                p: lerp(a.p ?? 2, b.p ?? 2, t),
            }));
        }
    }
    // An ogive from the last section to the tip: a cone's crease there let hanging links cut across it.
    const last = sections[sections.length - 1];
    for (let s = 0; s < NOSE_RINGS; s++) {
        const t = s / NOSE_RINGS, r = Math.sqrt(1 - t * t);
        rings.push(fuselageRing({
            z: lerp(last.z, nose[2], t), cx: lerp(last.cx ?? 0, nose[0], t), cy: lerp(last.cy, nose[1], t), hw: last.hw * r, hh: last.hh * r, p: 2,
        }));
    }
    return loft(rings, centroid(rings[0]), nose);
}

function fuselageRing(s: Section): Vec3[] {
    const ring: Vec3[] = [];
    const e = 2 / (s.p ?? 2);
    for (let j = 0; j < FUSELAGE_RING; j++) {
        const a = (2 * Math.PI * j) / FUSELAGE_RING;
        const c = Math.cos(a), sn = Math.sin(a);
        ring.push([(s.cx ?? 0) + s.hw * Math.sign(c) * Math.abs(c) ** e, s.cy + s.hh * Math.sign(sn) * Math.abs(sn) ** e, s.z]);
    }
    return ring;
}

/** A wing, tailplane or fin through its stations, round-nosed, at least MIN_PANEL_THICK_M thick. */
function panel(stations: PanelStation[]): Tri {
    const dense: PanelStation[] = [];
    for (let i = 0; i + 1 < stations.length; i++) {
        const a = stations[i], b = stations[i + 1];
        const len = Math.hypot(b.le[0] - a.le[0], b.le[1] - a.le[1], b.le[2] - a.le[2]);
        const n = Math.max(1, Math.ceil(len / PANEL_STEP_M));
        for (let s = 0; s < n; s++) {
            const t = s / n;
            dense.push({
                le: [lerp(a.le[0], b.le[0], t), lerp(a.le[1], b.le[1], t), lerp(a.le[2], b.le[2], t)],
                chord: lerp(a.chord, b.chord, t), thick: lerp(a.thick, b.thick, t),
            });
        }
    }
    dense.push(stations[stations.length - 1]);
    // Thickness runs across the span and the chord: for a wing that is up, for a fin sideways.
    const s0 = stations[0].le, s1 = stations[stations.length - 1].le;
    const span = [s1[0] - s0[0], s1[1] - s0[1], 0];
    const sl = Math.hypot(span[0], span[1]);
    const up: Vec3 = [-span[1] / sl, span[0] / sl, 0];
    const rings = dense.map(st => {
        const h = Math.max(st.chord * st.thick, MIN_PANEL_THICK_M) / 2;
        const at = (t: number, side: number): Vec3 => [st.le[0] + up[0] * side * h, st.le[1] + up[1] * side * h, st.le[2] - t * st.chord];
        const ring: Vec3[] = [at(0, 0)];
        for (let i = 0; i < AIRFOIL_T.length; i++) ring.push(at(AIRFOIL_T[i], AIRFOIL_H[i]));
        for (let i = AIRFOIL_T.length - 1; i >= 0; i--) ring.push(at(AIRFOIL_T[i], -AIRFOIL_H[i]));
        return ring;
    });
    return loft(rings, centroid(rings[0]), centroid(rings[rings.length - 1]));
}

/** An axis-aligned box. */
function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Tri {
    const ring = (z: number): Vec3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
    return loft([ring(z0), ring(z1)], [(x0 + x1) / 2, (y0 + y1) / 2, z0], [(x0 + x1) / 2, (y0 + y1) / 2, z1]);
}

/** A wheel (a 12-sided drum on a lateral axle) and its strut, as two separate closed parts that overlap. */
function gearLeg(g: GearLeg): Tri[] {
    const cy = WHEEL_BOTTOM_Y + g.wheelR;
    const ring = (x: number): Vec3[] => Array.from({ length: 12 }, (_, j) => {
        const a = (2 * Math.PI * (j + 0.5)) / 12;
        return [x, cy + g.wheelR * Math.cos(a), g.z + g.wheelR * Math.sin(a)] as Vec3;
    });
    const x0 = g.x - g.wheelW / 2, x1 = g.x + g.wheelW / 2;
    const wheel = loft([ring(x0), ring(x1)], [x0, cy, g.z], [x1, cy, g.z]);
    const strut = box(g.x - 0.08, cy - 0.05, g.z - 0.08, g.x + 0.08, STRUT_TOP_Y, g.z + 0.08);
    return [wheel, strut];
}

const mirrorPanel = (st: PanelStation[]): PanelStation[] => st.map(s => ({ ...s, le: [-s.le[0], s.le[1], s.le[2]] as Vec3 }));

/** A wing or tailplane from one tip through the root to the other (outboard stations given right side, root first). */
function spanning(right: PanelStation[]): PanelStation[] {
    return [...mirrorPanel(right.slice(1)).reverse(), ...right];
}

/** A missile on the wingtip: a tube with an ogive nose, its axis in the tip's chord plane. */
function tipStore(m: TipStore): Tri[] {
    const body = fuselage([
        { z: m.zTail, cx: m.x, cy: m.y, hw: m.r, hh: m.r },
        { z: m.zNose - 4 * m.r, cx: m.x, cy: m.y, hw: m.r, hh: m.r },
    ], [m.x, m.y, m.zNose]);
    return [body];
}

export function buildDummyAirframe(spec: DummyAirframeSpec): Float32Array {
    const stores = (spec.tipStores ?? []).flatMap(m => [m, { ...m, x: -m.x }]).flatMap(tipStore);
    const parts: Tri[] = [fuselage(spec.fuselage, spec.nose), ...spec.panels.map(panel), ...stores, ...spec.gear.flatMap(gearLeg)];
    return Float32Array.from(parts.flat());
}

const st = (x: number, y: number, z: number, chord: number, thick: number): PanelStation => ({ le: [x, y, z], chord, thick });

/** A twin-fin jet with a wide flat body: 18.8 m long, 13.6 m span. */
const TWIN_TAIL: DummyAirframeSpec = {
    fuselage: [
        { z: -7.5, cy: 0.1, hw: 1.4, hh: 0.45, p: 3 },
        { z: -4, cy: 0, hw: 2.0, hh: 0.7, p: 3 },
        { z: 0, cy: -0.3, hw: 2.3, hh: 0.8, p: 2.7 },
        { z: 2, cy: -0.25, hw: 2.15, hh: 0.88, p: 2.4 },
        { z: 4, cy: -0.05, hw: 1.65, hh: 0.95 },
        { z: 5.5, cy: 0.1, hw: 1.25, hh: 0.95 },
        { z: 8, cy: 0, hw: 0.8, hh: 0.6 },
        { z: 10, cy: -0.2, hw: 0.4, hh: 0.35, p: 2 },
    ],
    nose: [0, -0.3, 11.3],
    panels: [
        spanning([st(0, -0.1, 3, 7, 0.05), st(6.8, 0.1, -1.6, 1.4, 0.04)]),
        spanning([st(0, 0, -4.5, 3, 0.05), st(4.5, 0, -6.2, 1.2, 0.04)]),
        [st(1.6, 0.4, -3, 3.5, 0.05), st(2.7, 3, -4.9, 1.5, 0.04)],
        [st(-1.6, 0.4, -3, 3.5, 0.05), st(-2.7, 3, -4.9, 1.5, 0.04)],
    ],
    gear: [
        { x: 0, z: 5.5, wheelR: 0.3, wheelW: 0.2 },
        { x: 1.7, z: -1, wheelR: 0.4, wheelW: 0.3 },
        { x: -1.7, z: -1, wheelR: 0.4, wheelW: 0.3 },
    ],
};

/** A single-fin small jet: 15.6 m long, 10 m span. */
const SINGLE_TAIL: DummyAirframeSpec = {
    fuselage: [
        { z: -7, cy: 0.1, hw: 0.6, hh: 0.6, p: 2 },
        { z: -5, cy: 0, hw: 0.95, hh: 0.85 },
        { z: -2, cy: -0.1, hw: 1.0, hh: 0.9 },
        { z: 1, cy: -0.2, hw: 1.0, hh: 0.8 },
        { z: 3, cy: 0, hw: 0.9, hh: 1.0 },
        { z: 5, cy: -0.05, hw: 0.6, hh: 0.75 },
        { z: 7, cy: -0.2, hw: 0.4, hh: 0.4, p: 2 },
    ],
    nose: [0, -0.3, 8.6],
    panels: [
        spanning([st(0, -0.1, 1, 5, 0.05), st(5, -0.1, -1.6, 1.4, 0.04)]),
        spanning([st(0, 0, -4.8, 2.6, 0.05), st(2.9, 0, -6, 1, 0.04)]),
        [st(0, 0.6, -3.6, 3.6, 0.05), st(0, 2.85, -5.8, 1.2, 0.04)],
    ],
    gear: [
        { x: 0, z: 3.5, wheelR: 0.28, wheelW: 0.2 },
        { x: 1.2, z: -1, wheelR: 0.38, wheelW: 0.25 },
        { x: -1.2, z: -1, wheelR: 0.38, wheelW: 0.25 },
    ],
    tipStores: [{ x: 5, y: -0.1, zTail: -3.8, zNose: -1.3, r: 0.065 }],
};

/**
 * A cranked delta with no tailplanes: 15.7 m long, 9.9 m span. The outer
 * panel is short and only ~35 deg swept, with a long tip along its missile:
 * swept 58 deg to a short tip, it let the upper belt slide out and off, and
 * the net let 60 m/s catches go.
 */
const CRANKED_DELTA: DummyAirframeSpec = {
    ...SINGLE_TAIL,
    fuselage: [{ ...SINGLE_TAIL.fuselage[0], z: -7.1 }, ...SINGLE_TAIL.fuselage.slice(1)],
    panels: [
        spanning([st(0, -0.1, 3.5, 10.5, 0.04), st(3.2, -0.1, -1.6, 5.3, 0.04), st(4.85, -0.1, -2.9, 3.8, 0.04)]),
        SINGLE_TAIL.panels[2],
    ],
    tipStores: [{ x: 4.95, y: -0.1, zTail: -6.6, zNose: -2.3, r: 0.065 }],
};

/**
 * A wide-span twin-fin jet: 17.3 m long, 17.6 m span. Its body is the two
 * nacelles' width; the glove beyond them is the wing's thick root, not body
 * (a 6 m wide body held the straps' eyes down across its top at 38 % strain).
 */
const WIDE_WING: DummyAirframeSpec = {
    fuselage: [
        { z: -8.2, cy: 0.2, hw: 2.1, hh: 0.5, p: 3 },
        { z: -6, cy: 0.1, hw: 2.1, hh: 0.75, p: 3 },
        { z: -3, cy: 0, hw: 2.0, hh: 0.85, p: 2.7 },
        { z: 0, cy: 0, hw: 1.85, hh: 0.85, p: 2.4 },
        { z: 1.5, cy: 0.15, hw: 1.6, hh: 0.95 },
        { z: 3, cy: 0.3, hw: 1.2, hh: 1.0 },
        { z: 4.5, cy: 0.35, hw: 0.85, hh: 0.95 },
        { z: 6.2, cy: 0.3, hw: 0.6, hh: 0.75 },
        { z: 8, cy: 0.1, hw: 0.35, hh: 0.4, p: 2 },
    ],
    nose: [0, 0, 9.05],
    panels: [
        spanning([st(0, -0.1, 3, 8, 0.05), st(3.2, -0.1, -0.4, 3.4, 0.07), st(8.8, 0, -2.6, 1.6, 0.05)]),
        spanning([st(0, 0, -5.5, 3, 0.05), st(4.5, 0, -7.4, 1, 0.04)]),
        [st(1.6, 0.6, -5, 3.2, 0.05), st(1.9, 2.67, -7, 1.2, 0.04)],
        [st(-1.6, 0.6, -5, 3.2, 0.05), st(-1.9, 2.67, -7, 1.2, 0.04)],
    ],
    gear: [
        { x: 0, z: 6, wheelR: 0.3, wheelW: 0.25 },
        { x: 2.4, z: -1.5, wheelR: 0.45, wheelW: 0.3 },
        { x: -2.4, z: -1.5, wheelR: 0.45, wheelW: 0.3 },
    ],
};

export const DUMMY_AIRFRAMES = {
    twinTail: TWIN_TAIL,
    singleTail: SINGLE_TAIL,
    crankedDelta: CRANKED_DELTA,
    wideWing: WIDE_WING,
} as const;
