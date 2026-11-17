/**
 * The seated pilot figure: a rigid model made in Blender
 * (blender/pilot/pilot.blend, exported to assets/pilot.glb by
 * blender/pilot/export_pilot.py) and drawn at each aircraft's cockpit eye
 * point, sunk into the seat where the canopy sits close over the head.
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
 * How far (m) to lower the pilot below the eye point so the helmet clears the
 * canopy: rays straight up from the head (front, middle, back) through the
 * body model's LOD 0 meshes. Many cockpit eye points sit close under the
 * canopy for the view; the seated figure sinks to fit. 0 when nothing is hit.
 */
export function pilotDropForBody(model: Model, eye: readonly [number, number, number]): number {
    const lod = model.lod[0];
    if (!lod) return 0;
    const ray = new THREE.Ray();
    const up = new THREE.Vector3(0, 1, 0);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), hit = new THREE.Vector3();
    const rel = new THREE.Matrix4();
    const rootInv = new THREE.Matrix4();
    const H = PILOT_HELMET_CENTER;
    const R = PILOT_HELMET_RADIUS_M;
    const origins = [-R * 0.6, 0, R * 0.8].map(dz =>
        new THREE.Vector3(eye[0] + H[0], eye[1] + H[1], eye[2] + H[2] + dz));
    let clearance = Infinity;
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
            // Mesh frame relative to the render group = the aircraft body frame.
            rel.multiplyMatrices(rootInv, mesh.matrixWorld);
            const index = mesh.geometry.index;
            const count = index ? index.count : pos.count;
            for (let i = 0; i + 2 < count; i += 3) {
                const i0 = index ? index.getX(i) : i;
                const i1 = index ? index.getX(i + 1) : i + 1;
                const i2 = index ? index.getX(i + 2) : i + 2;
                a.fromBufferAttribute(pos, i0).applyMatrix4(rel);
                b.fromBufferAttribute(pos, i1).applyMatrix4(rel);
                c.fromBufferAttribute(pos, i2).applyMatrix4(rel);
                for (const o of origins) {
                    if (Math.max(a.y, b.y, c.y) < o.y) continue;
                    ray.set(o, up);
                    if (ray.intersectTriangle(a, b, c, false, hit)) {
                        clearance = Math.min(clearance, hit.y - o.y);
                    }
                }
            }
        });
    }
    if (!isFinite(clearance)) return 0;
    const crownAboveOrigin = PILOT_CROWN_M - H[1];
    const drop = crownAboveOrigin + PILOT_HEADROOM_M - clearance;
    return THREE.MathUtils.clamp(drop, 0, PILOT_MAX_DROP_M);
}
