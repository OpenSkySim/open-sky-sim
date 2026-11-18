/**
 * The hangar spawn: the player's aircraft starts parked in the Kuznetsov's
 * hangar, wings folded, and is brought up to the flight deck before the
 * flight starts:
 *
 *   1. it taxis forward from its slot to the forward turntable,
 *   2. the turntable turns it nose to port,
 *   3. it is pushed back, tail first, through the door onto the forward lift,
 *   4. the lift rises to the deck with it,
 *   5. it taxis forward to take-off position 1, spreading its wings.
 *
 * The sim cannot run any of that: it takes the highest carrier triangle as the
 * ground, which in the hangar is the deck above. So the player is spawned at
 * position 1 as usual but held and hidden, a {@link StaticAircraft} of the same
 * type is driven along the route, and at the end it is handed back to the
 * player at exactly that spot. The lift is kuz.glb's 'lift_fwd' node, raised in
 * place (tools/build_kuz_hangar.py MOVABLE_LIFTS).
 *
 * Everything here is carrier-local (kuz.glb frame: y up, bow -z, heading 0
 * facing +z), carried into the world by the carrier pose each frame.
 */

import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { UP } from '../../utils/math';
import { Entity } from '../entity';
import { ModelManager } from '../models/models';
import { Scene } from '../scene';
import { FlyableAircraftDef } from './aircraftDef';
import { SHADOW_SURFACE_EPSILON_M } from './aircraftShadow';
import { ArrestorCarrierPose } from './arrestorCables';
import { CarrierDeckSurface } from './carrierDeckSurface';
import {
    CarrierChaseTarget, HANGAR_CHASE_DISTANCE_M, HANGAR_CHASE_HEIGHT_M,
    KUZ_HANGAR_FLOOR_Y, KUZ_HANGAR_SPAWN_SLOT, KUZ_PARKED_AIRCRAFT, KUZ_TURNTABLE_RADIUS_M, KUZ_TURNTABLES,
    StaticAircraft,
} from './carrierParkedAircraft';

/** The forward turntable's centre. */
const TURNTABLE = KUZ_TURNTABLES[0];
const TURNTABLE_RADIUS_M = KUZ_TURNTABLE_RADIUS_M;
/** On the forward lift: the nose clears the hull line (x 23.8) with the tail out over the net. */
const LIFT_STOP_X = 34.8;
/** The forward lift's hole in the deck (carrierDeckMarkings.ts LIFT_HOLES_Z, inboard edge to the net). */
const LIFT_HOLE = { x0: 23.8, x1: 39.8, z0: -50.99, z1: -35.09 };
/** The deck beside the hole, carrier-local Y: where the raised lift's top stops. */
const DECK_AT_LIFT_Y = 14.07;
const LIFT_RISE_M = DECK_AT_LIFT_Y - KUZ_HANGAR_FLOOR_Y;

const TAXI_SPEED_MPS = 3.5;
const PUSHBACK_SPEED_MPS = 2.5;
const DECK_TAXI_SPEED_MPS = 4;
const TURN_S = 6;
const LIFT_S = 12;
const UNFOLD_S = 6;
const PAUSE_S = 1.2;
/** Bezier handle length for the deck taxi from the lift to position 1 (m). */
const DECK_HANDLE_M = 16;

interface Phase {
    duration: number;
    /** Pose at u in 0..1 (eased by the phase itself where it moves). */
    pose(u: number, t: number, out: ActorPose): void;
}

interface ActorPose {
    x: number;
    z: number;
    heading: number;
    /** Carrier-local Y of the ground under the wheels. */
    groundY: number;
    fold: number;
    liftRise: number;
}

const smooth = (u: number) => {
    const c = THREE.MathUtils.clamp(u, 0, 1);
    return c * c * (3 - 2 * c);
};

export interface HangarSpawnEnd {
    /** Carrier-local take-off position and heading the player is spawned at. */
    x: number;
    z: number;
    heading: number;
}

export class CarrierHangarSpawnEntity implements Entity {
    readonly tags: string[] = [];
    enabled = true;

    private actor: StaticAircraft | undefined;
    private phases: Phase[] = [];
    private phaseIndex = 0;
    private phaseTime = 0;
    private running = false;
    private onDone: (() => void) | undefined;
    /** Lift height above the hangar floor; lowered again once the flight has started. */
    private liftRise = 0;
    private lowering = false;
    private readonly liftBaseY = new WeakMap<THREE.Object3D, number>();

    private readonly pose: ActorPose = { x: 0, z: 0, heading: 0, groundY: 0, fold: 1, liftRise: 0 };
    private readonly position = new THREE.Vector3();
    private readonly shadowPosition = new THREE.Vector3();
    private readonly quaternion = new THREE.Quaternion();
    private readonly carrierQuat = new THREE.Quaternion();
    private readonly yaw = new THREE.Quaternion();

    constructor(
        private readonly models: ModelManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
        private readonly deck: CarrierDeckSurface,
        /** kuz.glb's movable lift meshes ('lift_fwd...'), once the carrier has loaded. */
        private readonly getLiftMeshes: () => THREE.Object3D[],
        private readonly onSlotHidden: (index: number, hidden: boolean) => void,
    ) {}

    /** The aircraft on its way up, for the F2 view to follow while it is out. */
    readonly chaseTarget: CarrierChaseTarget = {
        chaseDistance: HANGAR_CHASE_DISTANCE_M + 2,
        chaseHeight: HANGAR_CHASE_HEIGHT_M + 0.5,
        isAvailable: () => this.active && this.actor !== undefined,
        getDisplayPosition: () => { this.evaluate(); this.worldPose(); return this.position; },
        getDisplayQuaternion: () => { this.evaluate(); this.worldPose(); return this.quaternion; },
    };

    /** True from {@link start} until the aircraft has been handed over. */
    get active(): boolean {
        return this.onDone !== undefined;
    }

    /**
     * Bring `def` up from the hangar to `end` (the take-off spawn), then call
     * `onDone`, at which point the player should take over there.
     */
    start(def: FlyableAircraftDef, end: HangarSpawnEnd, onDone: () => void): void {
        this.actor = new StaticAircraft(this.models, def);
        this.onDone = onDone;
        this.phases = buildPhases(this.deck, end, wheelCentre(def));
        this.phaseIndex = 0;
        this.phaseTime = 0;
        this.running = false;
        this.lowering = false;
        this.onSlotHidden(KUZ_HANGAR_SPAWN_SLOT, true);
    }

    /** Abandon a sequence still under way (another spawn, the menu's restart). */
    cancel(): void {
        if (!this.active) return;
        this.onDone = undefined;
        this.actor = undefined;
        this.running = false;
        this.lowering = true;
        this.onSlotHidden(KUZ_HANGAR_SPAWN_SLOT, false);
    }

    /** The clock only runs while nothing (loading, the menu) holds the game. */
    setRunning(running: boolean): void {
        this.running = running;
    }

    init(_scene: Scene): void {
        //
    }

    update(delta: number): void {
        if (this.active && this.running) {
            this.phaseTime += delta;
            while (this.phaseIndex < this.phases.length && this.phaseTime >= this.phases[this.phaseIndex].duration) {
                this.phaseTime -= this.phases[this.phaseIndex].duration;
                this.phaseIndex++;
            }
            if (this.phaseIndex >= this.phases.length) {
                const done = this.onDone;
                this.onDone = undefined;
                this.actor = undefined;
                this.lowering = true;
                this.onSlotHidden(KUZ_HANGAR_SPAWN_SLOT, false);
                done?.();
            }
        }
        if (this.active) {
            this.evaluate();
            this.liftRise = this.pose.liftRise;
        } else if (this.lowering) {
            this.liftRise = Math.max(0, this.liftRise - delta * LIFT_RISE_M / LIFT_S);
            this.lowering = this.liftRise > 0;
        }
        this.placeLift();
    }

    private evaluate(): void {
        const i = Math.min(this.phaseIndex, this.phases.length - 1);
        const phase = this.phases[i];
        const u = this.phaseIndex >= this.phases.length ? 1 : this.phaseTime / phase.duration;
        phase.pose(u, this.phaseTime, this.pose);
    }

    private placeLift(): void {
        for (const mesh of this.getLiftMeshes()) {
            let base = this.liftBaseY.get(mesh);
            if (base === undefined) {
                base = mesh.position.y;
                this.liftBaseY.set(mesh, base);
            }
            mesh.position.y = base + this.liftRise;
        }
    }

    /** The actor's world pose this frame (carrier pose applied). */
    private worldPose(): void {
        const pose = this.getCarrierPose();
        const c = pose.position as THREE.Vector3;
        this.carrierQuat.copy(pose.quaternion ?? this.yaw.identity());
        const p = this.pose;
        const rest = this.actor?.rest ?? 0;
        this.position.set(p.x, p.groundY + rest, p.z).applyQuaternion(this.carrierQuat).add(c);
        this.shadowPosition.set(p.x, p.groundY + SHADOW_SURFACE_EPSILON_M, p.z).applyQuaternion(this.carrierQuat).add(c);
        this.yaw.setFromAxisAngle(UP, p.heading);
        this.quaternion.copy(this.carrierQuat).multiply(this.yaw);
    }

    render3D(
        targetWidth: number,
        _targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        palette: Palette,
    ): void {
        if (!this.active || !this.actor) return;
        this.evaluate();
        this.worldPose();
        this.actor.fold = this.pose.fold;
        this.actor.render(this.position, this.quaternion, this.shadowPosition, targetWidth, camera, lists, palette);
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

/** The route, phase by phase. */
/**
 * The middle of the aircraft's wheels in its own frame (x, z): it stops with
 * this over the turntable's centre and turns about it, so all the wheels stand
 * on the turntable. Warns when one would not fit.
 */
function wheelCentre(def: FlyableAircraftDef): { x: number; z: number } {
    const points = def.flight?.gear.points ?? [];
    if (points.length === 0) return { x: 0, z: 0 };
    const x = points.reduce((a, p) => a + p[0], 0) / points.length;
    const z = points.reduce((a, p) => a + p[2], 0) / points.length;
    const reach = Math.max(...points.map(p => Math.hypot(p[0] - x, p[2] - z)));
    if (reach > TURNTABLE_RADIUS_M - 0.3) {
        console.warn(`[hangarSpawn] ${def.id}: a wheel is ${reach.toFixed(1)} m from the middle, past the turntable`);
    }
    return { x, z };
}

function buildPhases(deck: CarrierDeckSurface, end: HangarSpawnEnd, wheels: { x: number; z: number }): Phase[] {
    const slot = KUZ_PARKED_AIRCRAFT[KUZ_HANGAR_SPAWN_SLOT];
    const floor = KUZ_HANGAR_FLOOR_Y;
    const bow = Math.PI + slot.heading;
    const port = Math.PI * 1.5; // nose to -x
    const hold = (x: number, z: number, heading: number, groundY: number, liftRise: number,
        duration = PAUSE_S): Phase => ({
        duration,
        pose: (_u, _t, o) => Object.assign(o, { x, z, heading, groundY, fold: 1, liftRise }),
    });

    // Origin on the turntable for a heading: the wheels' middle on its centre.
    const onTurntable = (heading: number) => {
        const c = Math.cos(heading), sn = Math.sin(heading);
        return {
            x: TURNTABLE.x - (wheels.x * c + wheels.z * sn),
            z: TURNTABLE.z - (-wheels.x * sn + wheels.z * c),
        };
    };
    const arrive = onTurntable(bow);
    const leave = onTurntable(port);
    const taxiLen = Math.hypot(arrive.x - slot.x, arrive.z - slot.z);
    const pushLen = LIFT_STOP_X - leave.x;

    // On deck: a cubic from the lift, nose to port, to position 1 along its lane.
    const p0 = new THREE.Vector2(LIFT_STOP_X, leave.z);
    const d0 = new THREE.Vector2(-1, 0);
    const p3 = new THREE.Vector2(end.x, end.z);
    const d3 = new THREE.Vector2(Math.sin(end.heading), Math.cos(end.heading));
    const curve = new THREE.CubicBezierCurve(
        p0, p0.clone().addScaledVector(d0, DECK_HANDLE_M),
        p3.clone().addScaledVector(d3, -DECK_HANDLE_M), p3);
    const deckLen = curve.getLength();
    const deckDuration = Math.max(deckLen / DECK_TAXI_SPEED_MPS, UNFOLD_S);
    const groundAt = (x: number, z: number) => {
        if (x >= LIFT_HOLE.x0 && x <= LIFT_HOLE.x1 && z >= LIFT_HOLE.z0 && z <= LIFT_HOLE.z1) {
            return DECK_AT_LIFT_Y;
        }
        const h = deck.heightAt(x, z);
        return Number.isFinite(h) ? h : DECK_AT_LIFT_Y;
    };
    const at = new THREE.Vector2();
    const tangent = new THREE.Vector2();

    return [
        hold(slot.x, slot.z, bow, floor, 0),
        {
            // 1. Forward along the centreline to the turntable.
            duration: taxiLen / TAXI_SPEED_MPS + 2,
            pose: (u, _t, o) => {
                const s = smooth(u);
                Object.assign(o, {
                    x: slot.x + (arrive.x - slot.x) * s, z: slot.z + (arrive.z - slot.z) * s,
                    heading: bow, groundY: floor, fold: 1, liftRise: 0,
                });
            },
        },
        hold(arrive.x, arrive.z, bow, floor, 0),
        {
            // 2. The turntable turns it nose to port.
            duration: TURN_S,
            pose: (u, _t, o) => Object.assign(o, {
                ...onTurntable(bow + (port - bow) * smooth(u)), heading: bow + (port - bow) * smooth(u),
                groundY: floor, fold: 1, liftRise: 0,
            }),
        },
        hold(leave.x, leave.z, port, floor, 0),
        {
            // 3. Pushed back, tail first, through the door onto the lift.
            duration: pushLen / PUSHBACK_SPEED_MPS + 2,
            pose: (u, _t, o) => Object.assign(o, {
                x: leave.x + pushLen * smooth(u), z: leave.z, heading: port,
                groundY: floor, fold: 1, liftRise: 0,
            }),
        },
        hold(LIFT_STOP_X, leave.z, port, floor, 0),
        {
            // 4. Up to the flight deck.
            duration: LIFT_S,
            pose: (u, _t, o) => {
                const rise = LIFT_RISE_M * smooth(u);
                Object.assign(o, { x: LIFT_STOP_X, z: leave.z, heading: port, groundY: floor + rise, fold: 1, liftRise: rise });
            },
        },
        hold(LIFT_STOP_X, leave.z, port, DECK_AT_LIFT_Y, LIFT_RISE_M),
        {
            // 5. Forward to position 1, spreading the wings on the way.
            duration: deckDuration,
            pose: (u, t, o) => {
                const s = curve.getUtoTmapping(smooth(u), 0);
                curve.getPoint(s, at);
                curve.getTangent(s, tangent);
                Object.assign(o, {
                    x: at.x, z: at.y, heading: Math.atan2(tangent.x, tangent.y),
                    groundY: groundAt(at.x, at.y), fold: 1 - smooth(t / UNFOLD_S), liftRise: LIFT_RISE_M,
                });
            },
        },
        {
            ...hold(end.x, end.z, end.heading, groundAt(end.x, end.z), LIFT_RISE_M),
            pose: (_u, _t, o) => Object.assign(o, {
                x: end.x, z: end.z, heading: end.heading, groundY: groundAt(end.x, end.z), fold: 0, liftRise: LIFT_RISE_M,
            }),
        },
    ];
}
