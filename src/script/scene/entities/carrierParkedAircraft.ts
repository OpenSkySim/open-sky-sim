/**
 * Aircraft parked in the Kuznetsov's hangar: static, wings folded, gear down,
 * each with its ground shadow, carried with the ship. They are drawn from the
 * flyable aircraft definitions at runtime (nothing is baked into kuz.glb), and
 * a slot whose aircraft is not loaded is simply left empty until it is.
 *
 * Positions are carrier-local metres in the kuz.glb frame (y up, bow -z), on
 * the hangar floor built by tools/build_kuz_hangar.py.
 */

import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';
import { defaultFm2Config, fm2GroundRestHeight } from '../../physics/fm2/fm2AircraftConfig';
import { fitGearPoints, fittedGearPoints } from '../../physics/fm2/gearFit';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { UP } from '../../utils/math';
import { Entity } from '../entity';
import { Model, ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';
import { FlyableAircraftDef } from './aircraftDef';
import { SHADOW_SURFACE_EPSILON_M } from './aircraftShadow';
import { ArrestorCarrierPose } from './arrestorCables';
import { bakeCollisionMeshFromModel } from './carrierDeck';
import { poseSurface, SurfaceHinge } from './wingSweep';
import type { ChaseTarget } from '../../state/cameraUpdaters/aiExteriorCameraUpdater';

/** The hangar floor, carrier-local Y (tools/build_kuz_hangar.py Y_FLOOR). */
export const KUZ_HANGAR_FLOOR_Y = 4.2;
/** Past this distance from the ship the parked aircraft are not drawn (only seen through the lift doors). */
const DRAW_RANGE_M = 3000;
/** Gear clip position for extended (aiAircraft.ts: t = 1). */
const GEAR_DOWN = 1;

/** The hangar's turntables (build_kuz_hangar.py TURNTABLES_Z, on the centreline): forward, aft. */
export const KUZ_TURNTABLES: readonly { x: number; z: number }[] = [{ x: 5.3, z: -43 }, { x: 5.3, z: 53.75 }];
/** The turntables' radius (build_kuz_hangar.py TURNTABLE); every wheel must stand inside it. */
export const KUZ_TURNTABLE_RADIUS_M = 6;

/**
 * The middle of the aircraft's wheels in its own frame (x, z) and how far the
 * farthest wheel is from it: stood with this over a turntable's centre, every
 * wheel is on the turntable when `reach` is under its radius. The centre of
 * the smallest circle round them all, so no wheel is farther out than it must be.
 */
export function wheelMiddle(points: readonly (readonly number[])[]): { x: number; z: number; reach: number } {
    const pts = points.map(p => ({ x: p[0], z: p[2] }));
    if (pts.length === 0) return { x: 0, z: 0, reach: 0 };
    const reachFrom = (x: number, z: number) => Math.max(...pts.map(p => Math.hypot(p.x - x, p.z - z)));
    // A handful of wheels: try every circle on two of them (as its diameter) or three.
    let best = { x: pts[0].x, z: pts[0].z, reach: reachFrom(pts[0].x, pts[0].z) };
    const consider = (x: number, z: number) => {
        const reach = reachFrom(x, z);
        if (reach < best.reach) best = { x, z, reach };
    };
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const a = pts[i];
            const b = pts[j];
            consider((a.x + b.x) / 2, (a.z + b.z) / 2);
            for (let k = j + 1; k < pts.length; k++) {
                const c = pts[k];
                const d = 2 * (a.x * (b.z - c.z) + b.x * (c.z - a.z) + c.x * (a.z - b.z));
                if (Math.abs(d) < 1e-9) continue;
                const a2 = a.x * a.x + a.z * a.z;
                const b2 = b.x * b.x + b.z * b.z;
                const c2 = c.x * c.x + c.z * c.z;
                consider(
                    (a2 * (b.z - c.z) + b2 * (c.z - a.z) + c2 * (a.z - b.z)) / d,
                    (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d,
                );
            }
        }
    }
    return best;
}

/** The aircraft origin (carrier-local x, z) that puts `wheels` over `centre` at this yaw. */
export function originOverWheels(
    centre: { x: number; z: number }, wheels: { x: number; z: number }, yaw: number,
): { x: number; z: number } {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return {
        x: centre.x - (wheels.x * c + wheels.z * s),
        z: centre.z - (-wheels.x * s + wheels.z * c),
    };
}

export interface ParkedAircraftSlot {
    /** Aircraft ids in order of preference; the first one registered is drawn. */
    ids: readonly string[];
    /** Carrier-local position of the aircraft origin on the floor (m). */
    x: number;
    z: number;
    /** Extra yaw (rad) from nose-to-the-bow. */
    heading: number;
    /** F2 camera distance behind it (m): as far back as the hangar allows there. */
    chaseDistance: number;
    /**
     * Stand on this turntable ({@link KUZ_TURNTABLES} index) instead: the
     * wheels' middle over its centre, so the nose wheel and mains are all on it.
     */
    turntable?: number;
}

/** The Su-33s are the user's own model (aircraftRegistry.ts buildSu33Def, assets/su33d*.glb). */
const SU33_IDS = ['su33d'] as const;
const YAK44_IDS = ['lp_yak44'] as const;

/**
 * Three Su-33s and two Yak-44s, clear of the turntables (z -43, 53.75), the
 * lift doors and the curtain bays. The hangar runs x -7.7..18.3, z -55..98.
 * The two forward Su-33s stand out at the sides, leaving the centreline clear
 * from the third one's spot to the forward turntable: that is the hangar
 * spawn's way out (carrierHangarSpawn.ts).
 */
export const KUZ_PARKED_AIRCRAFT: readonly ParkedAircraftSlot[] = [
    { ids: SU33_IDS, x: -3.3, z: -20, heading: 0, chaseDistance: 20 },
    { ids: SU33_IDS, x: 13.2, z: -20, heading: 0, chaseDistance: 20 },
    // The Yak-44 behind it noses in at z 20.
    { ids: SU33_IDS, x: 5.3, z: 4, heading: 0, chaseDistance: 14 },
    { ids: YAK44_IDS, x: 5.3, z: 30, heading: 0, chaseDistance: 18 },
    // On the aft turntable, all its wheels on it (x, z: until its gear is in).
    { ids: YAK44_IDS, x: 5.3, z: 53.75, heading: 0, chaseDistance: 18, turntable: 1 },
];
/** The slot the hangar spawn's aircraft starts from (left empty while it is out). */
export const KUZ_HANGAR_SPAWN_SLOT = 2;

/**
 * An aircraft on the carrier the F2 view can follow: its pose now, the camera
 * close behind it (the hangar is 7 m high), and whether it is there to follow.
 */
export interface CarrierChaseTarget extends ChaseTarget {
    readonly chaseDistance: number;
    readonly chaseHeight: number;
    isAvailable(): boolean;
}

/** F2 camera behind and above an aircraft in the hangar (m): inside the hangar, under the beams. */
export const HANGAR_CHASE_DISTANCE_M = 14;
export const HANGAR_CHASE_HEIGHT_M = 1.5;

interface StaticSurface extends SurfaceHinge {
    model: LODHelper;
    /** Index of the folding wing this surface rides on, or -1. */
    parent: number;
    folds: boolean;
    /** Fold deflection at full travel (sign * rangeRad). */
    foldRange: number;
}

const ONE = new THREE.Vector3(1, 1, 1);

/**
 * One aircraft drawn still, gear down, from its flyable definition: the body,
 * the gear at the end of its clip, the hinged surfaces (posed as in flight,
 * the folding ones at {@link fold}) and its ground shadow, folded to match.
 */
export class StaticAircraft {
    /** Height of the origin above the ground when standing on its wheels (m). */
    readonly rest: number;
    /** 0 spread .. 1 folded; eased as the wing fold is in flight. */
    fold = 1;
    /** Where its wheels stand, body frame (fitted to the drawn gear once that is in). */
    wheels: [number, number, number][];
    /** True once {@link wheels} come from its drawn gear. */
    gearFitted = false;
    private readonly body: LODHelper;
    private gear: LODHelper | undefined;
    private shadowFolded: LODHelper | undefined;
    private shadowSpread: LODHelper | undefined;
    private readonly surfaces: StaticSurface[];
    private readonly _v = new THREE.Vector3();
    private readonly _q = new THREE.Quaternion();

    constructor(models: ModelManager, readonly def: FlyableAircraftDef) {
        this.rest = def.flight ? fm2GroundRestHeight(def.flight) : PLANE_DISTANCE_TO_GROUND;
        this.wheels = fittedGearPoints(def.id) ?? (def.flight ?? defaultFm2Config).gear.points;
        this.body = new LODHelper(models.getModel(def.body));
        this.surfaces = def.surfaces.map(s => ({
            model: new LODHelper(models.getModel(s.model)),
            pivot: new THREE.Vector3().fromArray(s.pivot),
            axis: new THREE.Vector3().fromArray(s.axis),
            slide: s.slide ? new THREE.Vector3().fromArray(s.slide) : undefined,
            deflection: 0,
            parent: s.sweepParent ? def.surfaces.findIndex(o => o.role === s.sweepParent) : -1,
            folds: s.control === 'fold',
            foldRange: s.control === 'fold' ? s.sign * s.rangeRad : 0,
        }));
        if (def.gear) {
            models.getModel(def.gear, (_, model) => {
                const gear = new LODHelper(model);
                if (def.gearAnimated ?? true) {
                    gear.setPlaybackDuration(1);
                    gear.setPlaybackPosition(GEAR_DOWN);
                }
                this.gear = gear;
                // A type nobody has flown yet still has the default legs: read its own.
                if (fittedGearPoints(def.id) === undefined) {
                    const triangles = bakeCollisionMeshFromModel(model, undefined, 1)?.triangles;
                    const fitted = triangles ? fitGearPoints(triangles, (def.flight ?? defaultFm2Config).gear) : undefined;
                    if (fitted) this.wheels = fitted;
                }
                this.gearFitted = true;
            });
        }
        // The shadow model is the planform with the wings spread: a folded copy too.
        const folds = this.surfaces
            .filter(s => s.folds && !s.slide && s.parent < 0 && s.foldRange !== 0)
            .map(s => ({ pivot: s.pivot, axis: s.axis, deflection: s.foldRange }));
        models.getModel(def.shadow, (_, model) => {
            this.shadowSpread = new LODHelper(model, 5);
            this.shadowFolded = new LODHelper(foldShadowModel(model, folds), 5);
        });
    }

    /** Draw it with its origin at `position`; the shadow lies at `shadowPosition`. */
    render(
        position: THREE.Vector3, quaternion: THREE.Quaternion, shadowPosition: THREE.Vector3,
        targetWidth: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette,
    ): void {
        const shadow = this.fold >= 0.5 ? this.shadowFolded : this.shadowSpread;
        shadow?.addToRenderList(
            shadowPosition, quaternion, ONE,
            targetWidth, camera, palette,
            SceneLayers.EntityFX, SceneLayers.EntityFX, lists);

        const lodCount = this.body.model.lod.length;
        const lod = lodCount === 0 ? 0 : Math.min(
            getLodLevel(position, ONE, targetWidth, camera, this.body.model.maxSize),
            lodCount - 1,
        );
        this.body.addToRenderList(
            position, quaternion, ONE,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);
        if (lod !== 0) return;

        this.gear?.addToRenderList(
            position, quaternion, ONE,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
        // As surfaceInputs.ts surfaceValue('fold'): smoothstep, the panels easing like hydraulics.
        const f = THREE.MathUtils.clamp(this.fold, 0, 1);
        const eased = f * f * (3 - 2 * f);
        for (const s of this.surfaces) {
            s.deflection = s.foldRange * eased;
        }
        for (const s of this.surfaces) {
            poseSurface(s, s.parent >= 0 ? this.surfaces[s.parent] : undefined,
                position, quaternion, this._v, this._q);
            s.model.addToRenderList(
                this._v, this._q, ONE,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
        }
    }
}

export class CarrierParkedAircraftEntity implements Entity {
    readonly tags: string[] = [];
    enabled = true;

    private readonly parked: (StaticAircraft | undefined)[];
    private readonly hidden = new Set<number>();
    private readonly position = new THREE.Vector3();
    private readonly quaternion = new THREE.Quaternion();
    private readonly shadowPosition = new THREE.Vector3();
    private readonly carrierQuat = new THREE.Quaternion();
    private readonly yaw = new THREE.Quaternion();
    private readonly _v = new THREE.Vector3();
    /** Turntable slots whose wheel fit has been logged. */
    private readonly logged = new Set<number>();
    /** One F2 target per slot, the same objects for the entity's life. */
    private readonly targets: CarrierChaseTarget[];

    constructor(
        private readonly models: ModelManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
        private readonly getDef: (id: string) => FlyableAircraftDef | undefined,
        private readonly slots: readonly ParkedAircraftSlot[] = KUZ_PARKED_AIRCRAFT,
    ) {
        this.parked = slots.map(() => undefined);
        this.targets = slots.map((_, i) => this.chaseTargetFor(i));
    }

    /** The parked aircraft the F2 view can step through, in slot order. */
    chaseTargets(): CarrierChaseTarget[] {
        return this.targets.filter(t => t.isAvailable());
    }

    private chaseTargetFor(i: number): CarrierChaseTarget {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const yaw = new THREE.Quaternion();
        const slot = this.slots[i];
        const pose = () => {
            const carrier = this.getCarrierPose();
            const q = carrier.quaternion ?? quaternion.identity();
            const c = carrier.position as THREE.Vector3;
            const at = this.slotOrigin(i);
            position.set(at.x, KUZ_HANGAR_FLOOR_Y + (this.parked[i]?.rest ?? 0), at.z).applyQuaternion(q).add(c);
            yaw.setFromAxisAngle(UP, Math.PI + slot.heading);
            quaternion.copy(q).multiply(yaw);
        };
        return {
            chaseDistance: slot.chaseDistance,
            chaseHeight: HANGAR_CHASE_HEIGHT_M,
            isAvailable: () => this.parked[i] !== undefined && !this.hidden.has(i),
            getDisplayPosition: () => { pose(); return position; },
            getDisplayQuaternion: () => { pose(); return quaternion; },
        };
    }

    /**
     * The slot's aircraft origin, carrier-local (x, z): its own x, z, or on a
     * turntable with the wheels' middle over the centre.
     */
    private slotOrigin(i: number): { x: number; z: number } {
        const slot = this.slots[i];
        const p = this.parked[i];
        if (slot.turntable === undefined || !p) return slot;
        const wheels = wheelMiddle(p.wheels);
        if (p.gearFitted && !this.logged.has(i)) {
            this.logged.add(i);
            const fits = wheels.reach <= KUZ_TURNTABLE_RADIUS_M - 0.3;
            (fits ? console.info : console.warn)(`[hangar] ${p.def.id} on turntable ${slot.turntable}: `
                + `farthest wheel ${wheels.reach.toFixed(2)} m from the middle${fits ? '' : ', past the turntable'} `
                + JSON.stringify(p.wheels.map(w => w.map(c => +c.toFixed(2)))));
        }
        return originOverWheels(KUZ_TURNTABLES[slot.turntable], wheels, Math.PI + slot.heading);
    }

    /** Leave a slot empty (its aircraft is out, e.g. on the hangar spawn) or fill it again. */
    setSlotHidden(index: number, hidden: boolean): void {
        if (hidden) this.hidden.add(index);
        else this.hidden.delete(index);
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        // Packs load asynchronously: build each slot once its aircraft is registered.
        for (let i = 0; i < this.slots.length; i++) {
            if (this.parked[i] !== undefined) continue;
            for (const id of this.slots[i].ids) {
                const def = this.getDef(id);
                if (def) {
                    this.parked[i] = new StaticAircraft(this.models, def);
                    break;
                }
            }
        }
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
        this.carrierQuat.copy(pose.quaternion ?? this.yaw.identity());
        this.parked.forEach((p, i) => {
            if (!p || this.hidden.has(i)) return;
            const slot = this.slots[i];
            const at = this.slotOrigin(i);
            this.position.set(at.x, KUZ_HANGAR_FLOOR_Y + p.rest, at.z)
                .applyQuaternion(this.carrierQuat).add(carrierPos);
            this.shadowPosition.set(at.x, KUZ_HANGAR_FLOOR_Y + SHADOW_SURFACE_EPSILON_M, at.z)
                .applyQuaternion(this.carrierQuat).add(carrierPos);
            // Model nose is +z; the bow is -z.
            this.yaw.setFromAxisAngle(UP, Math.PI + slot.heading);
            this.quaternion.copy(this.carrierQuat).multiply(this.yaw);
            p.render(this.position, this.quaternion, this.shadowPosition, targetWidth, camera, lists, palette);
        });
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
