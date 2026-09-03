/**
 * Pure geometry of a barricade net wrapped around an airframe.
 *
 * Shared by the physics ({@link ./barricadeRigModel}, in the sim worker)
 * and the node builder ({@link ./barricadeNetShape}): nothing here has
 * state or a frame of reference beyond "carrier-local XZ, landing along
 * −Z". The central object is the TAUT PATH — the shortest route a
 * tensioned band takes from one stanchion to the other around the front
 * of the aircraft's silhouette — because that path is at once what the
 * belts *are* and what their forces act along.
 */
import * as THREE from 'three';
import { TriangleBvh, bvhHit, bvhSegmentHit } from '../../physics/collision/triangleBvh';
import { AircraftCollisionMesh } from './aircraftDef';
import { BarricadeAirframePose } from './barricadeSpec';

/** A point in the deck plane. */
export interface XZ {
    x: number;
    z: number;
}

/** The caught aircraft, in carrier-local coordinates. */
export interface BarricadeNetAircraft extends BarricadeAirframePose {
    drape: AircraftCollisionMesh;
}

/** Downward-ray start height above any airframe (m). */
const RAY_TOP_M = 40;

const _hit = bvhHit();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _p0 = new THREE.Vector3();
const _p1 = new THREE.Vector3();

/**
 * Body-frame outline points of a drape (x, y, z triples): its vertices
 * and its edges sampled at 0.25 m, deduplicated on a 0.25 m XZ grid and
 * cached per mesh.
 *
 * Deduplicated in the BODY frame on purpose: deduplicating the transformed
 * points would let the surviving vertex set change from frame to frame as
 * the aircraft moves, which puts ~0.1 m of jitter into the path length —
 * and the wires would read that as slack/taut chatter.
 */
const outlineCache = new WeakMap<AircraftCollisionMesh, Float64Array>();
export function drapeOutlineBody(drape: AircraftCollisionMesh): Float64Array {
    const cached = outlineCache.get(drape);
    if (cached) return cached;
    const t = drape.triangles;
    const seen = new Set<number>();
    const pts: number[] = [];
    const add = (x: number, y: number, z: number) => {
        const key = Math.round(x * 4) * 65536 + Math.round(z * 4);
        if (seen.has(key)) return;
        seen.add(key);
        pts.push(x, y, z);
    };
    // Vertices alone miss a long straight edge — a wing's leading edge on
    // a coarse mesh has nothing between root and tip — so every triangle
    // edge is sampled at the grid pitch too.
    for (let i = 0; i + 8 < t.length; i += 9) {
        for (let e = 0; e < 3; e++) {
            const a = i + e * 3;
            const b = i + ((e + 1) % 3) * 3;
            const len = Math.hypot(t[b] - t[a], t[b + 2] - t[a + 2]);
            const steps = Math.max(1, Math.ceil(len / 0.25));
            for (let k = 0; k <= steps; k++) {
                const u = k / steps;
                add(t[a] + (t[b] - t[a]) * u, t[a + 1] + (t[b + 1] - t[a + 1]) * u, t[a + 2] + (t[b + 2] - t[a + 2]) * u);
            }
        }
    }
    const out = Float64Array.from(pts);
    outlineCache.set(drape, out);
    return out;
}

/**
 * The airframe's silhouette in carrier XZ, clamped into the rig's box so
 * that both stanchions are guaranteed strict vertices of any hull built
 * over it.
 */
export function silhouetteXZ(
    outline: Float64Array,
    pose: BarricadeAirframePose,
    clip: { xMin: number; xMax: number; zMax: number },
): XZ[] {
    const out: XZ[] = [];
    for (let i = 0; i + 2 < outline.length; i += 3) {
        _v.set(outline[i], outline[i + 1], outline[i + 2])
            .applyQuaternion(pose.quaternion).add(pose.position);
        out.push({
            x: Math.max(clip.xMin, Math.min(clip.xMax, _v.x)),
            z: Math.min(clip.zMax, _v.z),
        });
    }
    return out;
}

/** Andrew monotone-chain convex hull in XZ, counter-clockwise. */
export function convexHull(pts: XZ[]): XZ[] {
    if (pts.length < 3) return pts.slice();
    const p = pts.slice().sort((a, b) => a.x - b.x || a.z - b.z);
    const cross = (o: XZ, a: XZ, b: XZ) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const lower: XZ[] = [];
    for (const pt of p) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
        lower.push(pt);
    }
    const upper: XZ[] = [];
    for (let i = p.length - 1; i >= 0; i--) {
        const pt = p[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
        upper.push(pt);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

/**
 * Taut string in the XZ plane from `a` to `b` around the FRONT (−z) side
 * of the silhouette: the chain of the convex hull of {a, b, points} that
 * runs from a to b via the smallest-z side. Exactly the path a tensioned
 * band takes around an obstacle; a straight line when nothing is in the
 * way. Its interior vertices are the silhouette points the band bears on.
 */
export function tautPath(a: XZ, b: XZ, silhouette: XZ[]): XZ[] {
    const hull = convexHull([a, b, ...silhouette]);
    const ia = hull.findIndex(p => Math.abs(p.x - a.x) < 1e-6 && Math.abs(p.z - a.z) < 1e-6);
    const ib = hull.findIndex(p => Math.abs(p.x - b.x) < 1e-6 && Math.abs(p.z - b.z) < 1e-6);
    if (ia < 0 || ib < 0) return [a, b];
    const arc = (from: number, to: number) => {
        const out: XZ[] = [];
        for (let i = from; ; i = (i + 1) % hull.length) {
            out.push(hull[i]);
            if (i === to) break;
        }
        return out;
    };
    const arc1 = arc(ia, ib);
    const arc2 = arc(ib, ia).reverse();
    const minZ = (c: XZ[]) => Math.min(...c.map(p => p.z));
    return minZ(arc1) <= minZ(arc2) ? arc1 : arc2;
}

/**
 * Push the band's contact arc back onto the front silhouette.
 *
 * The taut string is the convex hull, and across the hollow between a
 * wingtip and the nose that is a straight chord metres ahead of the wing's
 * leading edge. The real net was never there: the aircraft flew *into* a
 * flat curtain, the nose pushed the middle of the belt forward first and
 * the leading edges pushed the stripes at their stations after it, so
 * between the two contact vertices the belt lies on whatever the airframe
 * pushed it with — the front envelope, min z at each lateral station —
 * and the stripes hooked on those edges are what hold it in the hollow
 * against the wire tension. Outside the contact arc, where nothing hooks,
 * the straight runs to the stanchions stay as the taut string put them.
 */
export function frontEnvelope(path: XZ[], silhouette: XZ[], step = 0.5): XZ[] {
    if (path.length < 4) return path;
    const a = path[1];
    const b = path[path.length - 2];
    const x0 = Math.min(a.x, b.x);
    const x1 = Math.max(a.x, b.x);
    const bins = Math.floor((x1 - x0) / step);
    if (bins < 2) return path;
    const minZ = new Float64Array(bins + 1).fill(Infinity);
    for (const p of silhouette) {
        const i = Math.round((p.x - x0) / step);
        if (i >= 0 && i <= bins && p.z < minZ[i]) minZ[i] = p.z;
    }
    // Empty bins take the nearer neighbour on each side, linearly.
    let last = -1;
    for (let i = 0; i <= bins; i++) {
        if (!Number.isFinite(minZ[i])) continue;
        if (last >= 0 && i - last > 1) {
            for (let j = last + 1; j < i; j++) {
                minZ[j] = minZ[last] + ((minZ[i] - minZ[last]) * (j - last)) / (i - last);
            }
        }
        last = i;
    }
    const inner: XZ[] = [];
    for (let i = 1; i < bins; i++) {
        if (Number.isFinite(minZ[i])) inner.push({ x: x0 + i * step, z: minZ[i] });
    }
    if (a.x > b.x) inner.reverse();
    return [path[0], a, ...inner, b, path[path.length - 1]];
}

/** Cumulative arc length along a polyline; `cum[0] = 0`. */
export function cumulative(path: XZ[]): number[] {
    const cum = [0];
    for (let i = 1; i < path.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));
    }
    return cum;
}

/** The point at arc position `s` along a polyline (clamped to its ends). */
export function pointAt(path: XZ[], cum: number[], s: number, out: XZ): XZ {
    const total = cum[cum.length - 1];
    const sc = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < path.length - 1 && cum[i] < sc) i++;
    const span = cum[i] - cum[i - 1];
    const t = span > 1e-9 ? (sc - cum[i - 1]) / span : 0;
    out.x = path[i - 1].x + (path[i].x - path[i - 1].x) * t;
    out.z = path[i - 1].z + (path[i].z - path[i - 1].z) * t;
    return out;
}

/**
 * Arc position of the closest point on the polyline to `p` — on the
 * SEGMENTS, so it moves continuously as `p` does.
 */
export function projectOntoPath(path: XZ[], cum: number[], p: XZ): number {
    let bestD = Infinity;
    let bestS = 0;
    for (let i = 1; i < path.length; i++) {
        const ax = path[i - 1].x;
        const az = path[i - 1].z;
        const dx = path[i].x - ax;
        const dz = path[i].z - az;
        const lenSq = dx * dx + dz * dz;
        let t = lenSq > 1e-12 ? ((p.x - ax) * dx + (p.z - az) * dz) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const qx = ax + dx * t;
        const qz = az + dz * t;
        const d = (p.x - qx) * (p.x - qx) + (p.z - qz) * (p.z - qz);
        if (d < bestD) {
            bestD = d;
            bestS = cum[i - 1] + (cum[i] - cum[i - 1]) * t;
        }
    }
    return bestS;
}

/**
 * How far from the aircraft's own centreline the bare fuselage extends (m).
 *
 * The collision mesh has no part names to test against (mods are told apart
 * only by material colour), so this is what stands in for "is this the
 * plain skin — nose, canopy, spine, belly — or something that actually
 * catches the net": the fuselage is the only thing that wide a barricade
 * catch is allowed to graze without hooking on it, and it never runs much
 * past a seat and an intake duct either side of the keel.
 *
 * 1.3 m read as "close enough to be the fuselage" for most of a real
 * airframe's width but let the nose cone through: a probe landing on the
 * tip of the nose is only ~1.5 m from the CG's own X on a typical fighter,
 * just outside 1.3, so it read as a wing hook and dragged the belt metres
 * ahead of the aircraft's own nose into a sharp forward point. Widened past
 * that so the whole nose is excluded along with the rest of the skin.
 */
export const FUSELAGE_HALF_WIDTH_M = 2.2;

/**
 * True when a probe hit at `hitX` (with the airframe centred at `cgX`) is
 * the bare fuselage rather than a wing, intake lip, or fin that genuinely
 * catches the net.
 *
 * Width alone would also throw out the fin and a centreline intake — both
 * legitimately narrow — so a hit within the fuselage's own width still
 * counts as a catch if it stands tall: the fin rises well above the spine,
 * an intake lip usually doesn't, and neither does the bare skin the whole
 * problem is about.
 */
export function isBareFuselageHit(hitX: number, cgX: number, topY: number, ceilingY: number): boolean {
    return Math.abs(hitX - cgX) < FUSELAGE_HALF_WIDTH_M && topY < ceilingY - 1.0;
}

/** Sag of a slack cable of length L over chord c (m), parabolic. */
export function wireSag(length: number, chord: number): number {
    if (length <= chord) return 0;
    return Math.sqrt((3 * chord * (length - chord)) / 8);
}

/** Front-most surface of the drape at height y along station x (carrier z), or NaN. */
export function hullFrontZ(
    bvh: TriangleBvh, a: BarricadeNetAircraft,
    x: number, y: number, zFrom: number, zTo: number,
): number {
    _q.copy(a.quaternion).invert();
    _p0.set(x, y, zFrom).sub(a.position).applyQuaternion(_q);
    _p1.set(x, y, zTo).sub(a.position).applyQuaternion(_q);
    if (!bvhSegmentHit(bvh, _p0.x, _p0.y, _p0.z, _p1.x, _p1.y, _p1.z, _hit)) return NaN;
    return _v.set(_hit.x, _hit.y, _hit.z).applyQuaternion(a.quaternion).add(a.position).z;
}

/** Bottom surface of the drape above (x, z), carrier-local, or +Infinity. */
export function hullBottomY(bvh: TriangleBvh, a: BarricadeNetAircraft, x: number, y0: number, z: number): number {
    _q.copy(a.quaternion).invert();
    _p0.set(x, y0 - RAY_TOP_M, z).sub(a.position).applyQuaternion(_q);
    _p1.set(0, 2 * RAY_TOP_M, 0).applyQuaternion(_q).add(_p0);
    if (!bvhSegmentHit(bvh, _p0.x, _p0.y, _p0.z, _p1.x, _p1.y, _p1.z, _hit)) return Infinity;
    return _v.set(_hit.x, _hit.y, _hit.z).applyQuaternion(a.quaternion).add(a.position).y;
}

/** Top surface of the drape under (x, z), carrier-local, or −Infinity. */
export function hullTopY(bvh: TriangleBvh, a: BarricadeNetAircraft, x: number, y0: number, z: number): number {
    _q.copy(a.quaternion).invert();
    _p0.set(x, y0 + RAY_TOP_M, z).sub(a.position).applyQuaternion(_q);
    _p1.set(0, -2 * RAY_TOP_M, 0).applyQuaternion(_q).add(_p0);
    if (!bvhSegmentHit(bvh, _p0.x, _p0.y, _p0.z, _p1.x, _p1.y, _p1.z, _hit)) return -Infinity;
    return _v.set(_hit.x, _hit.y, _hit.z).applyQuaternion(a.quaternion).add(a.position).y;
}

/**
 * The point the net first caught on, in the aircraft's body frame: the
 * leading (smallest carrier-z) outline vertex at engage time — the nose
 * tip or a wing/intake leading edge. The panel stays hooked at this point
 * ever after, however the airframe yaws or slides.
 */
export function barricadeCatchAnchorBody(
    outline: Float64Array, pose: BarricadeAirframePose, out: THREE.Vector3,
): THREE.Vector3 {
    let bestZ = Infinity;
    for (let i = 0; i + 2 < outline.length; i += 3) {
        _v.set(outline[i], outline[i + 1], outline[i + 2])
            .applyQuaternion(pose.quaternion).add(pose.position);
        if (_v.z < bestZ) {
            bestZ = _v.z;
            out.set(outline[i], outline[i + 1], outline[i + 2]);
        }
    }
    return out;
}
