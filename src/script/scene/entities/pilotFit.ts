/**
 * The seated pilot figure: a rigid model made in Blender
 * (blender/pilot/pilot.blend, exported to assets/pilot.glb by
 * blender/pilot/export_pilot.py), placed in each aircraft under its canopy
 * glass.
 *
 * Many imported aircraft carry an eye point that is an importer default rather
 * than the cockpit, so the eye point is only trusted when the pilot placed
 * there sits enclosed under canopy glass. Otherwise the seat is found from the
 * glass itself, and an aircraft with no glass to sit under (a drone, a
 * transport flown from under a solid roof, an opaque canopy) gets no pilot.
 */
import * as THREE from 'three';
import { Model } from '../models/models';

type V3 = [number, number, number];

/** The pilot model; its origin is the cockpit eye point, +Z forward, +Y up. */
export const PILOT_MODEL_URL = 'assets/pilot.glb';

/**
 * The helmet in assets/pilot.glb, relative to the eye point (m): centre and
 * radius of its dome. Keep in step with pilot.blend when the helmet moves.
 */
export const PILOT_HELMET_CENTER: V3 = [0, -0.05, -0.12];
export const PILOT_HELMET_RADIUS_M = 0.128;
/** Helmet crown above the eye point (m), a little over the model's top. */
const PILOT_CROWN_M = PILOT_HELMET_CENTER[1] + PILOT_HELMET_RADIUS_M + 0.005;

/** Headroom kept between the helmet crown and the canopy above it (m). */
const PILOT_HEADROOM_M = 0.03;
/** Never sink the pilot further than this below the eye point (m). */
const PILOT_MAX_DROP_M = 0.3;

/**
 * Seat found from the glass: the head sits this share of the canopy glass's
 * length behind its front, the crown this far under the glass (m). Measured
 * against the aircraft whose own eye points are right (median within 4 cm
 * along, 5 cm up).
 */
const GLASS_HEAD_BEHIND_FRACTION = 0.45;
const GLASS_CROWN_HEADROOM_M = 0.15;
/** The canopy: glass at most this far under the highest glass (m), so lights and sensor balls drop out. */
const CANOPY_BAND_M = 0.5;
/** Of the canopy glass, the front this long (m): the cockpit, not a transport's cabin windows. */
const CANOPY_FRONT_M = 3;

/**
 * Points on the visible pilot (helmet, face, shoulders, upper chest),
 * relative to the eye point: each must be closed in by the airframe or its
 * glass, or the pilot would poke out of the canopy or float above the plane.
 */
const VISIBLE_SAMPLES: V3[] = [
    [0, PILOT_HELMET_CENTER[1] + PILOT_HELMET_RADIUS_M, PILOT_HELMET_CENTER[2]],
    [0, PILOT_HELMET_CENTER[1], PILOT_HELMET_CENTER[2] + PILOT_HELMET_RADIUS_M],
    [0, PILOT_HELMET_CENTER[1], PILOT_HELMET_CENTER[2] - PILOT_HELMET_RADIUS_M],
    [0.118, PILOT_HELMET_CENTER[1], PILOT_HELMET_CENTER[2]],
    [-0.118, PILOT_HELMET_CENTER[1], PILOT_HELMET_CENTER[2]],
    [0, -0.06, -0.01],
    [0.17, -0.29, -0.16],
    [-0.17, -0.29, -0.16],
    [0, -0.38, -0.01],
];
const ENCLOSURE_DIRS: THREE.Vector3[] = [
    [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0],
    [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
].map(d => new THREE.Vector3(...d).normalize());

/** An airframe's triangles in its body frame, with which ones are canopy glass. */
interface BodyTris {
    /** 9 floats per triangle. */
    tri: Float32Array;
    glass: Uint8Array;
}

/** Collect the body model's LOD 0 triangles in the aircraft body frame. */
function bodyTriangles(model: Model): BodyTris {
    const tri: number[] = [];
    const glass: number[] = [];
    const lod = model.lod[0];
    if (!lod) return { tri: new Float32Array(0), glass: new Uint8Array(0) };
    const a = new THREE.Vector3();
    const rel = new THREE.Matrix4();
    const rootInv = new THREE.Matrix4();
    for (const root of lod.volumes) {
        // Roots keep their own glTF transform; a render group above them carries the world pose.
        root.updateWorldMatrix(true, true);
        if (root.parent) rootInv.copy(root.parent.matrixWorld).invert();
        else rootInv.identity();
        root.traverse(obj => {
            const mesh = obj as THREE.Mesh;
            if (!mesh.isMesh || !mesh.visible) return;
            const pos = mesh.geometry.getAttribute('position');
            if (!pos) return;
            rel.multiplyMatrices(rootInv, mesh.matrixWorld);
            const isGlass = mesh.userData.glass === true ? 1 : 0;
            const index = mesh.geometry.index;
            const count = index ? index.count : pos.count;
            for (let i = 0; i + 2 < count; i += 3) {
                for (let k = 0; k < 3; k++) {
                    a.fromBufferAttribute(pos, index ? index.getX(i + k) : i + k).applyMatrix4(rel);
                    tri.push(a.x, a.y, a.z);
                }
                glass.push(isGlass);
            }
        });
    }
    return { tri: new Float32Array(tri), glass: new Uint8Array(glass) };
}

/** Nearest two-sided hit of the ray o + t d (t > 0): index and distance, or index -1. */
function raycast(body: BodyTris, o: THREE.Vector3, d: THREE.Vector3, glassOnly = false): { i: number; t: number } {
    const T = body.tri;
    let best = Infinity;
    let bi = -1;
    for (let i = 0, n = body.glass.length; i < n; i++) {
        if (glassOnly && !body.glass[i]) continue;
        const j = i * 9;
        const e1x = T[j + 3] - T[j], e1y = T[j + 4] - T[j + 1], e1z = T[j + 5] - T[j + 2];
        const e2x = T[j + 6] - T[j], e2y = T[j + 7] - T[j + 1], e2z = T[j + 8] - T[j + 2];
        const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-12) continue;
        const inv = 1 / det;
        const sx = o.x - T[j], sy = o.y - T[j + 1], sz = o.z - T[j + 2];
        const u = (sx * px + sy * py + sz * pz) * inv;
        if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
        const v = (d.x * qx + d.y * qy + d.z * qz) * inv;
        if (v < 0 || u + v > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (t > 1e-5 && t < best) {
            best = t;
            bi = i;
        }
    }
    return { i: bi, t: best };
}

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
/** A windscreen this close ahead of the face (m) counts as glass to be seen through. */
const WINDSCREEN_REACH_M = 3;

/** How far (m) the pilot at `eye` sinks so the helmet keeps its headroom under whatever is above it. */
function dropAt(body: BodyTris, eye: V3): number {
    const R = PILOT_HELMET_RADIUS_M;
    const H = PILOT_HELMET_CENTER;
    let clearance = Infinity;
    const o = new THREE.Vector3();
    for (const dz of [-R * 0.6, 0, R * 0.8]) {
        o.set(eye[0] + H[0], eye[1] + H[1], eye[2] + H[2] + dz);
        clearance = Math.min(clearance, raycast(body, o, UP).t);
    }
    if (!isFinite(clearance)) return 0;
    const drop = PILOT_CROWN_M - H[1] + PILOT_HEADROOM_M - clearance;
    return THREE.MathUtils.clamp(drop, 0, PILOT_MAX_DROP_M);
}

/** The pilot origin for an eye point, sunk to fit; null unless it sits closed in under canopy glass. */
function seatAt(body: BodyTris, eye: V3): V3 | null {
    const seat: V3 = [eye[0], eye[1] - dropAt(body, eye), eye[2]];
    const p = new THREE.Vector3();
    // Glass to be seen through: the canopy straight above the helmet, or (a
    // transport's flight deck under a solid roof) the windscreen straight ahead.
    p.set(seat[0], seat[1] + PILOT_HELMET_CENTER[1] + PILOT_HELMET_RADIUS_M + 0.01, seat[2] + PILOT_HELMET_CENTER[2]);
    const above = raycast(body, p, UP);
    p.set(seat[0], seat[1] + PILOT_HELMET_CENTER[1], seat[2] + PILOT_HELMET_CENTER[2] + PILOT_HELMET_RADIUS_M + 0.01);
    const ahead = raycast(body, p, FORWARD);
    const underGlass = above.i >= 0 && body.glass[above.i] === 1;
    const behindGlass = ahead.i >= 0 && body.glass[ahead.i] === 1 && ahead.t < WINDSCREEN_REACH_M;
    if (!underGlass && !behindGlass) return null;
    for (const s of VISIBLE_SAMPLES) {
        p.set(seat[0] + s[0], seat[1] + s[1], seat[2] + s[2]);
        for (const d of ENCLOSURE_DIRS) {
            if (raycast(body, p, d).i < 0) return null;
        }
    }
    return seat;
}

/** The box round the front of the canopy glass (the highest glass, its front few metres). */
interface CanopyBox {
    xmin: number;
    xmax: number;
    zmin: number;
    zmax: number;
    /** Top of the highest glass. */
    ymax: number;
}

/** The front of the canopy glass, or null without glass. */
function canopyFront(body: BodyTris): CanopyBox | null {
    const T = body.tri;
    let ymax = -Infinity;
    for (let i = 0; i < body.glass.length; i++) {
        if (!body.glass[i]) continue;
        ymax = Math.max(ymax, T[i * 9 + 1], T[i * 9 + 4], T[i * 9 + 7]);
    }
    if (!isFinite(ymax)) return null;
    const isCanopy = (i: number) => body.glass[i] === 1
        && Math.max(T[i * 9 + 1], T[i * 9 + 4], T[i * 9 + 7]) > ymax - CANOPY_BAND_M;
    let zmax = -Infinity;
    for (let i = 0; i < body.glass.length; i++) {
        if (isCanopy(i)) zmax = Math.max(zmax, T[i * 9 + 2], T[i * 9 + 5], T[i * 9 + 8]);
    }
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity;
    for (let i = 0; i < body.glass.length; i++) {
        if (!isCanopy(i)) continue;
        const j = i * 9;
        if ((T[j + 2] + T[j + 5] + T[j + 8]) / 3 <= zmax - CANOPY_FRONT_M) continue;
        for (let k = 0; k < 9; k += 3) {
            xmin = Math.min(xmin, T[j + k]);
            xmax = Math.max(xmax, T[j + k]);
            zmin = Math.min(zmin, T[j + k + 2]);
        }
    }
    return { xmin, xmax, zmin, zmax, ymax };
}

/** An eye point under the canopy glass, or null when the airframe has no canopy glass over a seat. */
function eyeFromGlass(body: BodyTris): V3 | null {
    const box = canopyFront(body);
    if (!box) return null;
    const { xmin, xmax, zmin, zmax, ymax } = box;
    const x = (xmin + xmax) / 2;
    const headZ = zmax - GLASS_HEAD_BEHIND_FRACTION * (zmax - zmin);
    // The glass over the head, coming down from above it.
    const hit = raycast(body, new THREE.Vector3(x, ymax + 1, headZ), DOWN, true);
    if (hit.i < 0) return null;
    const glassY = ymax + 1 - hit.t;
    return [x, glassY - PILOT_CROWN_M - GLASS_CROWN_HEADROOM_M, headZ - PILOT_HELMET_CENTER[2]];
}

/** Seat search across the canopy (m): lateral offsets in order, centre first, then left/right seats. */
const SEARCH_X_M = [0, 0.25, -0.25, 0.45, -0.45, 0.6, -0.6];
const SEARCH_STEP_M = 0.25;
const SEARCH_DEPTH_M = 0.8;

/**
 * Last resort: step an eye point through the space under the front of the
 * canopy glass and take the first spot where the pilot sits enclosed with
 * glass to see through. Finds side-by-side cockpits (a centre console where
 * the canopy-centred guess lands) and flight decks seen through side windows
 * and windscreen rather than a glass roof.
 */
function searchUnderGlass(body: BodyTris): V3 | null {
    const box = canopyFront(body);
    if (!box) return null;
    const cx = (box.xmin + box.xmax) / 2;
    const halfWidth = (box.xmax - box.xmin) / 2;
    const top = box.ymax - PILOT_CROWN_M - PILOT_HEADROOM_M;
    // Head positions along the glass, nearest the usual one (as eyeFromGlass) first.
    const headZ = box.zmax - GLASS_HEAD_BEHIND_FRACTION * (box.zmax - box.zmin);
    const zs: number[] = [];
    for (let z = box.zmax - SEARCH_STEP_M / 2; z >= box.zmin; z -= SEARCH_STEP_M / 2) zs.push(z);
    zs.sort((a, b) => Math.abs(a - headZ) - Math.abs(b - headZ));
    for (const dx of SEARCH_X_M) {
        if (Math.abs(dx) > halfWidth) continue;
        for (const z of zs) {
            for (let y = top; y >= top - SEARCH_DEPTH_M; y -= SEARCH_STEP_M / 2) {
                const seat = seatAt(body, [cx + dx, y, z - PILOT_HELMET_CENTER[2]]);
                if (seat) return seat;
            }
        }
    }
    return null;
}

/** Placements already worked out, per airframe model and eye point. */
const seatCache = new Map<string, V3 | null>();

/**
 * Where to draw the pilot (its origin, in the aircraft body frame), or null
 * for no pilot: the given eye point when the pilot sits closed in under the
 * canopy glass there, else a seat found under the glass (first the canopy-centred
 * guess, then a search across it), else none. Cached by
 * `key` (the body model's URL) since every aircraft of a type shares it.
 */
export function pilotSeatForBody(model: Model, eye: readonly [number, number, number], key?: string): V3 | null {
    const cacheKey = key === undefined ? undefined : `${key}|${eye.join(',')}`;
    if (cacheKey !== undefined && seatCache.has(cacheKey)) return seatCache.get(cacheKey) ?? null;
    const body = bodyTriangles(model);
    let seat = seatAt(body, [eye[0], eye[1], eye[2]]);
    if (!seat) {
        const fromGlass = eyeFromGlass(body);
        seat = fromGlass ? seatAt(body, fromGlass) : null;
    }
    if (!seat) seat = searchUnderGlass(body);
    if (cacheKey !== undefined) seatCache.set(cacheKey, seat);
    return seat;
}

/**
 * How far (m) to lower the pilot below the eye point so the helmet clears the
 * canopy: rays straight up from the head (front, middle, back) through the
 * body model's LOD 0 meshes. 0 when nothing is above.
 */
export function pilotDropForBody(model: Model, eye: readonly [number, number, number]): number {
    return dropAt(bodyTriangles(model), [eye[0], eye[1], eye[2]]);
}
