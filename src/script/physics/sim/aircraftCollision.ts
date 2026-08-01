/**
 * Body-frame TCA collider helpers for bullet hits and solid-world crashes.
 * Triangles are a flat soup (9 floats per triangle) in the same frame as body glTF.
 */
import * as THREE from 'three';
import { AircraftCollisionMesh } from '../../scene/entities/aircraftDef';
import { Obstacle } from '../../ai/worldQuery';

export type { AircraftCollisionMesh };

const EPS = 1e-8;

/** Scratch for segment–triangle and AABB transforms (worker-safe, no alloc in hot paths). */
const _invQ = new THREE.Quaternion();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _pvec = new THREE.Vector3();
const _tvec = new THREE.Vector3();
const _qvec = new THREE.Vector3();
const _d = new THREE.Vector3();
const _corner = new THREE.Vector3();
const _world = new THREE.Vector3();
const _best = new THREE.Vector3();
const _normal = new THREE.Vector3();

/** World-space solid contact against terrain or an obstacle cylinder. */
export interface SolidWorldContact {
    /** Deepest penetrating sample (world). */
    point: THREE.Vector3;
    /** Unit normal pointing out of the solid (into free air). */
    normal: THREE.Vector3;
    /** Metres the sample is past the allowed surface (margin already applied). */
    penetration: number;
}

/**
 * Closest-point segment vs sphere for broadphase; writes the earliest surface
 * intersection along the segment into `outHit` when it hits.
 * `seg` = end - start.
 */
export function segmentHitsSphere(
    start: THREE.Vector3,
    seg: THREE.Vector3,
    segLenSq: number,
    center: THREE.Vector3,
    radius: number,
    outHit: THREE.Vector3,
    scratch: THREE.Vector3,
): boolean {
    // |start + t*seg - center|^2 = r^2, smallest t in [0,1]
    scratch.copy(start).sub(center);
    const a = segLenSq;
    const b = 2 * scratch.dot(seg);
    const c = scratch.lengthSq() - radius * radius;
    if (a < 1e-12) {
        if (c > 0) return false;
        outHit.copy(start);
        return true;
    }
    const disc = b * b - 4 * a * c;
    if (disc < 0) return false;
    const sqrtDisc = Math.sqrt(disc);
    const inv2a = 0.5 / a;
    let t = (-b - sqrtDisc) * inv2a;
    if (t < 0 || t > 1) {
        t = (-b + sqrtDisc) * inv2a;
        if (t < 0 || t > 1) return false;
    }
    outHit.copy(seg).multiplyScalar(t).add(start);
    return true;
}

/**
 * Ray–triangle (Möller–Trumbore) for a finite segment [origin, origin+dir]
 * with |dir| = segment length. Returns parametric t in [0,1], or -1 on miss.
 * Triangles are body-frame; origin/dir must be too.
 */
export function segmentHitsTriangleBody(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
): number {
    _a.set(ax, ay, az);
    _b.set(bx, by, bz);
    _c.set(cx, cy, cz);
    _e1.subVectors(_b, _a);
    _e2.subVectors(_c, _a);
    _pvec.crossVectors(dir, _e2);
    const det = _e1.dot(_pvec);
    if (det > -EPS && det < EPS) return -1;
    const invDet = 1 / det;
    _tvec.subVectors(origin, _a);
    const u = _tvec.dot(_pvec) * invDet;
    if (u < 0 || u > 1) return -1;
    _qvec.crossVectors(_tvec, _e1);
    const v = dir.dot(_qvec) * invDet;
    if (v < 0 || u + v > 1) return -1;
    const t = _e2.dot(_qvec) * invDet;
    return t >= 0 && t <= 1 ? t : -1;
}

/** Transform a world-space segment into the aircraft body frame. */
export function worldSegmentToBody(
    worldStart: THREE.Vector3,
    worldEnd: THREE.Vector3,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    outStart: THREE.Vector3,
    outEnd: THREE.Vector3,
): void {
    _invQ.copy(quaternion).invert();
    outStart.copy(worldStart).sub(position).applyQuaternion(_invQ);
    outEnd.copy(worldEnd).sub(position).applyQuaternion(_invQ);
}

/** Axis-aligned body-frame AABB vs body-frame segment (slab method). */
export function segmentHitsAabbBody(
    start: THREE.Vector3,
    end: THREE.Vector3,
    min: readonly [number, number, number],
    max: readonly [number, number, number],
): boolean {
    _d.subVectors(end, start);
    let tmin = 0;
    let tmax = 1;
    for (let i = 0; i < 3; i++) {
        const s = start.getComponent(i);
        const d = _d.getComponent(i);
        const mn = min[i];
        const mx = max[i];
        if (Math.abs(d) < EPS) {
            if (s < mn || s > mx) return false;
            continue;
        }
        let t1 = (mn - s) / d;
        let t2 = (mx - s) / d;
        if (t1 > t2) {
            const tmp = t1; t1 = t2; t2 = tmp;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
    }
    return true;
}

/** True when the world segment hits the body-frame collision mesh.
 *  When `outHitWorld` is provided, writes the earliest impact point in world space. */
export function segmentHitsCollisionMesh(
    worldStart: THREE.Vector3,
    worldEnd: THREE.Vector3,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    mesh: AircraftCollisionMesh,
    bodyStart: THREE.Vector3,
    bodyEnd: THREE.Vector3,
    outHitWorld?: THREE.Vector3,
): boolean {
    worldSegmentToBody(worldStart, worldEnd, position, quaternion, bodyStart, bodyEnd);
    if (!segmentHitsAabbBody(bodyStart, bodyEnd, mesh.aabb.min, mesh.aabb.max)) {
        return false;
    }
    _d.subVectors(bodyEnd, bodyStart);
    const tris = mesh.triangles;
    let bestT = Infinity;
    for (let i = 0; i + 8 < tris.length; i += 9) {
        const t = segmentHitsTriangleBody(
            bodyStart, _d,
            tris[i], tris[i + 1], tris[i + 2],
            tris[i + 3], tris[i + 4], tris[i + 5],
            tris[i + 6], tris[i + 7], tris[i + 8],
        );
        if (t >= 0 && t < bestT) {
            bestT = t;
        }
    }
    if (bestT === Infinity) {
        return false;
    }
    if (outHitWorld) {
        // Body-frame hit → world.
        outHitWorld.copy(_d).multiplyScalar(bestT).add(bodyStart);
        outHitWorld.applyQuaternion(quaternion).add(position);
    }
    return true;
}

const AABB_CORNERS: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];

/** Sample body AABB corners (and center) in world space; invoke visitor. */
export function forEachAabbWorldSample(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    aabb: AircraftCollisionMesh['aabb'],
    visit: (world: THREE.Vector3) => boolean | void,
): boolean {
    const { min, max } = aabb;
    for (let i = 0; i < AABB_CORNERS.length; i++) {
        const c = AABB_CORNERS[i];
        _corner.set(
            c[0] ? max[0] : min[0],
            c[1] ? max[1] : min[1],
            c[2] ? max[2] : min[2],
        );
        _world.copy(_corner).applyQuaternion(quaternion).add(position);
        if (visit(_world) === true) return true;
    }
    _world.copy(position);
    return visit(_world) === true;
}

/**
 * True when any AABB sample is below local terrain by more than `margin` metres.
 * `groundHeightAt` returns solid ground Y (flat datum and hills).
 */
export function collisionMeshHitsTerrain(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    mesh: AircraftCollisionMesh,
    groundHeightAt: (x: number, z: number) => number,
    margin: number,
): boolean {
    return findCollisionMeshTerrainContact(
        position, quaternion, mesh, groundHeightAt, margin, _best, _normal,
    ) !== null;
}

/**
 * Deepest terrain penetration of the collision AABB, or null if clear.
 * Writes into `outPoint` / `outNormal` (heightfield normal) when contacting.
 */
export function findCollisionMeshTerrainContact(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    mesh: AircraftCollisionMesh,
    groundHeightAt: (x: number, z: number) => number,
    margin: number,
    outPoint: THREE.Vector3,
    outNormal: THREE.Vector3,
): SolidWorldContact | null {
    let bestPen = 0;
    let bestX = 0;
    let bestZ = 0;
    forEachAabbWorldSample(position, quaternion, mesh.aabb, (w) => {
        const gy = groundHeightAt(w.x, w.z);
        const pen = (gy - margin) - w.y;
        if (pen > bestPen) {
            bestPen = pen;
            _best.copy(w);
            bestX = w.x;
            bestZ = w.z;
        }
    });
    if (bestPen <= 0) {
        return null;
    }
    const e = 0.5;
    const hL = groundHeightAt(bestX - e, bestZ);
    const hR = groundHeightAt(bestX + e, bestZ);
    const hD = groundHeightAt(bestX, bestZ - e);
    const hU = groundHeightAt(bestX, bestZ + e);
    outNormal.set(-(hR - hL) / (2 * e), 1, -(hU - hD) / (2 * e)).normalize();
    outPoint.copy(_best);
    return { point: outPoint, normal: outNormal, penetration: bestPen };
}

/** True when any AABB sample lies inside an upright obstacle cylinder. */
export function collisionMeshHitsObstacle(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    mesh: AircraftCollisionMesh,
    obstacle: Obstacle,
): boolean {
    return findCollisionMeshObstacleContact(
        position, quaternion, mesh, obstacle, _best, _normal,
    ) !== null;
}

/**
 * Deepest cylinder penetration of the collision AABB, or null if clear.
 * Side hits use a horizontal outward normal; roof hits use +Y.
 */
export function findCollisionMeshObstacleContact(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    mesh: AircraftCollisionMesh,
    obstacle: Obstacle,
    outPoint: THREE.Vector3,
    outNormal: THREE.Vector3,
): SolidWorldContact | null {
    const ox = obstacle.position.x;
    const oy = obstacle.position.y;
    const oz = obstacle.position.z;
    const r = obstacle.radius;
    const top = oy + obstacle.height;
    const reach = Math.hypot(
        Math.max(Math.abs(mesh.aabb.min[0]), Math.abs(mesh.aabb.max[0])),
        Math.max(Math.abs(mesh.aabb.min[2]), Math.abs(mesh.aabb.max[2])),
    );
    const dx0 = position.x - ox;
    const dz0 = position.z - oz;
    if (Math.hypot(dx0, dz0) > r + reach) {
        return null;
    }
    let bestPen = 0;
    forEachAabbWorldSample(position, quaternion, mesh.aabb, (w) => {
        if (w.y < oy || w.y > top) return;
        const dx = w.x - ox;
        const dz = w.z - oz;
        const dist = Math.hypot(dx, dz);
        if (dist > r) return;
        const sidePen = r - dist;
        const roofPen = top - w.y;
        const useRoof = dist < r * 0.25 && roofPen < sidePen;
        const pen = useRoof ? roofPen : sidePen;
        if (pen > bestPen) {
            bestPen = pen;
            _best.copy(w);
            if (useRoof) {
                _normal.set(0, 1, 0);
            } else if (dist > 1e-4) {
                _normal.set(dx / dist, 0, dz / dist);
            } else {
                _normal.set(1, 0, 0);
            }
        }
    });
    if (bestPen <= 0) {
        return null;
    }
    outPoint.copy(_best);
    outNormal.copy(_normal);
    return { point: outPoint, normal: outNormal, penetration: bestPen };
}

/** Sphere (hit-radius) vs upright cylinder — fallback when no collision mesh. */
export function sphereHitsObstacle(
    position: THREE.Vector3,
    radius: number,
    obstacle: Obstacle,
): boolean {
    const dx = position.x - obstacle.position.x;
    const dz = position.z - obstacle.position.z;
    if (Math.hypot(dx, dz) > obstacle.radius + radius) return false;
    const y0 = position.y - radius;
    const y1 = position.y + radius;
    const top = obstacle.position.y + obstacle.height;
    return y1 >= obstacle.position.y && y0 <= top;
}
