/**
 * Aircraft parked in the Kuznetsov's hangar: static, wings folded, gear down,
 * each with its ground shadow, carried with the ship. They are drawn from the
 * flyable aircraft definitions at runtime (nothing is baked into kuz.glb), and
 * a slot whose aircraft is not loaded (a modserver pack on static hosting) is
 * simply left empty until it is.
 *
 * Positions are carrier-local metres in the kuz.glb frame (y up, bow -z), on
 * the hangar floor built by tools/build_kuz_hangar.py.
 */

import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';
import { fm2GroundRestHeight } from '../../physics/fm2/fm2AircraftConfig';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { Entity } from '../entity';
import { Model, ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';
import { FlyableAircraftDef } from './aircraftDef';
import { SHADOW_SURFACE_EPSILON_M } from './aircraftShadow';
import { ArrestorCarrierPose } from './arrestorCables';
import { poseSurface, SurfaceHinge } from './wingSweep';

/** The hangar floor, carrier-local Y (tools/build_kuz_hangar.py Y_FLOOR). */
export const KUZ_HANGAR_FLOOR_Y = 4.2;
/** Past this distance from the hangar the parked aircraft are not drawn (only seen through the lift doors). */
const DRAW_RANGE_M = 3000;
/** Gear clip position for extended (aiAircraft.ts: t = 1). */
const GEAR_DOWN = 1;

export interface ParkedAircraftSlot {
    /** Aircraft ids in order of preference; the first one registered is drawn. */
    ids: readonly string[];
    /** Carrier-local position of the aircraft origin on the floor (m). */
    x: number;
    z: number;
    /** Extra yaw (rad) from nose-to-the-bow. */
    heading: number;
}

/** The Su-33s are the user's own model (aircraftRegistry.ts buildSu33Def, assets/su33d*.glb). */
const SU33_IDS = ['su33d'] as const;
const YAK44_IDS = ['lp_yak44'] as const;

/**
 * Three Su-33s and two Yak-44s, clear of the turntables (z -43, 53.75), the
 * lift doors and the curtain bays. The hangar runs x -7.7..18.3, z -55..98.
 */
export const KUZ_PARKED_AIRCRAFT: readonly ParkedAircraftSlot[] = [
    { ids: SU33_IDS, x: -1.7, z: -20, heading: 0 },
    { ids: SU33_IDS, x: 8.8, z: -20, heading: 0 },
    { ids: SU33_IDS, x: 3.3, z: 4, heading: 0 },
    { ids: YAK44_IDS, x: 5.3, z: 30, heading: 0 },
    { ids: YAK44_IDS, x: 5.3, z: 79, heading: 0 },
];

interface ParkedSurface extends SurfaceHinge {
    model: LODHelper;
    /** Index of the folding wing this surface rides on, or -1. */
    parent: number;
    folds: boolean;
}

/** One parked aircraft, built once its definition is known. */
interface Parked {
    def: FlyableAircraftDef;
    body: LODHelper;
    shadow: LODHelper | undefined;
    gear: LODHelper | undefined;
    surfaces: ParkedSurface[];
    /** Carrier-local pose of the airframe and of its shadow. */
    localPosition: THREE.Vector3;
    localShadowPosition: THREE.Vector3;
    localQuaternion: THREE.Quaternion;
}

const ONE = new THREE.Vector3(1, 1, 1);

export class CarrierParkedAircraftEntity implements Entity {
    readonly tags: string[] = [];
    enabled = true;

    private readonly parked: (Parked | undefined)[];
    private readonly position = new THREE.Vector3();
    private readonly quaternion = new THREE.Quaternion();
    private readonly shadowPosition = new THREE.Vector3();
    private readonly carrierQuat = new THREE.Quaternion();
    private readonly _v = new THREE.Vector3();
    private readonly _q = new THREE.Quaternion();

    constructor(
        private readonly models: ModelManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
        private readonly getDef: (id: string) => FlyableAircraftDef | undefined,
        private readonly slots: readonly ParkedAircraftSlot[] = KUZ_PARKED_AIRCRAFT,
    ) {
        this.parked = slots.map(() => undefined);
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        // Packs load asynchronously: build each slot once its aircraft is registered.
        for (let i = 0; i < this.slots.length; i++) {
            if (this.parked[i] !== undefined) continue;
            const slot = this.slots[i];
            for (const id of slot.ids) {
                const def = this.getDef(id);
                if (def) {
                    this.parked[i] = this.build(def, slot);
                    break;
                }
            }
        }
    }

    private build(def: FlyableAircraftDef, slot: ParkedAircraftSlot): Parked {
        const rest = def.flight ? fm2GroundRestHeight(def.flight) : PLANE_DISTANCE_TO_GROUND;
        const surfaces: ParkedSurface[] = def.surfaces.map(s => ({
            model: new LODHelper(this.models.getModel(s.model)),
            pivot: new THREE.Vector3().fromArray(s.pivot),
            axis: new THREE.Vector3().fromArray(s.axis),
            slide: s.slide ? new THREE.Vector3().fromArray(s.slide) : undefined,
            // Folded for parking: fold surfaces at full travel (surfaceValue: sign * 1), the rest neutral.
            deflection: s.control === 'fold' ? s.sign * s.rangeRad : 0,
            parent: s.sweepParent ? def.surfaces.findIndex(o => o.role === s.sweepParent) : -1,
            folds: s.control === 'fold',
        }));

        const parked: Parked = {
            def,
            body: new LODHelper(this.models.getModel(def.body)),
            shadow: undefined,
            gear: undefined,
            surfaces,
            localPosition: new THREE.Vector3(slot.x, KUZ_HANGAR_FLOOR_Y + rest, slot.z),
            localShadowPosition: new THREE.Vector3(slot.x, KUZ_HANGAR_FLOOR_Y + SHADOW_SURFACE_EPSILON_M, slot.z),
            // Model nose is +z; the bow is -z.
            localQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI + slot.heading),
        };
        if (def.gear) {
            this.models.getModel(def.gear, (_, model) => {
                const gear = new LODHelper(model);
                if (def.gearAnimated ?? true) {
                    gear.setPlaybackDuration(1);
                    gear.setPlaybackPosition(GEAR_DOWN);
                }
                parked.gear = gear;
            });
        }
        // The shadow is the planform with the wings spread: fold it as the wings are.
        const folds = surfaces.filter(s => s.folds && !s.slide && s.parent < 0 && s.deflection !== 0);
        this.models.getModel(def.shadow, (_, model) => {
            parked.shadow = new LODHelper(foldShadowModel(model, folds), 5);
        });
        return parked;
    }

    render3D(
        targetWidth: number,
        _targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        palette: Palette,
    ): void {
        const pose = this.getCarrierPose();
        const carrierPos = pose.position as THREE.Vector3;
        if (camera.position.distanceTo(this._v.set(carrierPos.x, carrierPos.y, carrierPos.z)) > DRAW_RANGE_M) {
            return;
        }
        this.carrierQuat.copy(pose.quaternion ?? this._q.identity());
        for (const p of this.parked) {
            if (!p) continue;
            this.position.copy(p.localPosition).applyQuaternion(this.carrierQuat).add(carrierPos);
            this.quaternion.copy(this.carrierQuat).multiply(p.localQuaternion);

            if (p.shadow) {
                this.shadowPosition.copy(p.localShadowPosition).applyQuaternion(this.carrierQuat).add(carrierPos);
                p.shadow.addToRenderList(
                    this.shadowPosition, this.quaternion, ONE,
                    targetWidth, camera, palette,
                    SceneLayers.EntityFX, SceneLayers.EntityFX, lists);
            }

            const lodCount = p.body.model.lod.length;
            const lod = lodCount === 0 ? 0 : Math.min(
                getLodLevel(this.position, ONE, targetWidth, camera, p.body.model.maxSize),
                lodCount - 1,
            );
            p.body.addToRenderList(
                this.position, this.quaternion, ONE,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);
            if (lod !== 0) continue;

            p.gear?.addToRenderList(
                this.position, this.quaternion, ONE,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
            for (const s of p.surfaces) {
                poseSurface(s, s.parent >= 0 ? p.surfaces[s.parent] : undefined,
                    this.position, this.quaternion, this._v, this._q);
                s.model.addToRenderList(
                    this._v, this._q, ONE,
                    targetWidth, camera, palette,
                    SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
            }
        }
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        //
    }
}

/**
 * The shadow model with each folded wing panel folded too: every triangle is
 * cut at the hinge's vertical plane, and the outboard piece is turned about the
 * hinge (from the hinge's height) and laid flat again at the shadow's height.
 * Works on copies; the loaded model's geometry is shared and left alone.
 */
export function foldShadowModel(model: Model, folds: readonly SurfaceHinge[]): Model {
    if (folds.length === 0) return model;
    const up = new THREE.Vector3(0, 1, 0);
    const cuts = folds.map(f => {
        const n = new THREE.Vector3().crossVectors(f.axis, up).normalize();
        if (n.x * f.pivot.x < 0) n.negate(); // outboard: away from the centreline
        return { f, n, rot: new THREE.Quaternion().setFromAxisAngle(f.axis.clone().normalize(), f.deflection) };
    });
    const lod = model.lod.map(level => {
        const fold = (objs: THREE.Object3D[]) => objs.map(o => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return o;
            mesh.updateMatrix();
            const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
            const pos = src.getAttribute('position');
            let tris: THREE.Vector3[][] = [];
            for (let i = 0; i + 2 < pos.count; i += 3) {
                tris.push([0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(pos, i + k).applyMatrix4(mesh.matrix)));
            }
            for (const { f, n, rot } of cuts) {
                const next: THREE.Vector3[][] = [];
                for (const t of tris) {
                    const [inner, outer] = splitPolygon(t, f.pivot, n);
                    fan(inner, next);
                    const y = t[0].y;
                    fan(outer.map(v => {
                        const w = new THREE.Vector3(v.x, f.pivot.y, v.z).sub(f.pivot).applyQuaternion(rot).add(f.pivot);
                        return w.set(w.x, y, w.z);
                    }), next);
                }
                tris = next;
            }
            const out = new Float32Array(tris.length * 9);
            tris.forEach((t, i) => t.forEach((v, k) => v.toArray(out, i * 9 + k * 3)));
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(out, 3));
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            const copy = new THREE.Mesh(geometry, mesh.material);
            copy.name = mesh.name;
            copy.renderOrder = mesh.renderOrder;
            copy.onBeforeRender = mesh.onBeforeRender;
            copy.userData = mesh.userData;
            return copy;
        });
        return { flats: fold(level.flats), volumes: fold(level.volumes) };
    });
    return { ...model, lod };
}

/** Sutherland–Hodgman split of a polygon by the plane through `at` with normal `n` (XZ only): [behind, in front]. */
function splitPolygon(poly: THREE.Vector3[], at: THREE.Vector3, n: THREE.Vector3): [THREE.Vector3[], THREE.Vector3[]] {
    const side = (v: THREE.Vector3) => (v.x - at.x) * n.x + (v.z - at.z) * n.z;
    const inner: THREE.Vector3[] = [];
    const outer: THREE.Vector3[] = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const sa = side(a), sb = side(b);
        if (sa <= 0) inner.push(a);
        if (sa > 0) outer.push(a);
        if ((sa <= 0) !== (sb <= 0)) {
            const p = a.clone().lerp(b, sa / (sa - sb));
            inner.push(p);
            outer.push(p.clone());
        }
    }
    return [inner, outer];
}

function fan(poly: THREE.Vector3[], out: THREE.Vector3[][]): void {
    for (let k = 2; k < poly.length; k++) {
        out.push([poly[0], poly[k - 1], poly[k]]);
    }
}
