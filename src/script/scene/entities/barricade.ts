/**
 * Carrier emergency barricade ("rig the barricade"): the nylon barrier net that
 * is raised across the landing area when an aircraft cannot take a wire —
 * hook damage, hook-up failure, or a fouled deck.
 *
 * This module is the *installation*: where the gear is rigged, whether it is up,
 * and whether an airframe has flown into it. The webbing itself — belts,
 * stripes, wires, and everything they do under load — is simulated in
 * {@link ./barricadeSolver}, which is a physical model rather than a set of
 * fitted curves. Nothing here has an opinion about what the net looks like.
 *
 * Modelled on the real gear:
 *  - Expendable webbing assembly of interconnected nylon straps, ~20 ft (6.1 m)
 *    tall, spanning the landing area.
 *  - An upper and a lower horizontal *load strap*, each carrying an arresting-gear
 *    size cable, stretched between the stanchion heads.
 *  - Between them hangs a dense row of wide nylon *engaging loops* — a hundred
 *    feet of them, each draping slack so it bows aft, toward the aircraft. They
 *    are what the photographs of a rigged barricade actually show: not a few
 *    taut vertical straps but a curtain of ribs. (US4566658 calls them
 *    "rectangularly formed loops", taped up to the upper load strap until an
 *    impact frees them; on penetration they slide along the load straps toward
 *    the fuselage and equalise the load across both wings.)
 *  - Two stanchions hinged into the deck, normally folded flush; hydraulics swing
 *    them upright and the webbing goes taut with them.
 *  - The webbing engages the *wings* — not the hook — and feeds the load through
 *    the purchase cable into the same arresting engines the pendants use.
 *  - It is a one-shot: the webbing is expended in an arrestment and replaced.
 *
 * Geometry lives in carrier-local space and is transformed with the same pose
 * helpers as {@link ./arrestorCables}, so the net rides a steaming, yawing ship.
 */
import * as THREE from 'three';
import {
    ARRESTOR_DECK_MID_X,
    ArrestorCarrierPose,
    carrierLocalToWorld,
} from './arrestorCables';

/**
 * Local Z of the barricade plane, forward of the four pendants
 * (see `ARRESTOR_CABLE_LOCAL_Z`, stern → bow, landing along −Z). Far enough
 * up the angled deck to leave the wires a clear run and still leave deck
 * ahead for the barricade's own pull-out.
 */
export const BARRICADE_LOCAL_Z = 30;

/** Webbing height above the deck when fully raised (m) — 20 ft. */
export const BARRICADE_HEIGHT_M = 6.1;

/** Half-distance between the two stanchions (m) — the rigged span, ~115 ft. */
export const BARRICADE_HALF_SPAN_M = 17.5;

/** Seconds for the stanchions to swing from flush-with-deck to upright. */
export const BARRICADE_RAISE_SECONDS = 5;

/** Seconds for the stanchions to fold back down. */
export const BARRICADE_LOWER_SECONDS = 4;

/** Deploy fraction at or above which the webbing will actually take a load. */
export const BARRICADE_ARMED_FRACTION = 0.9;

/** Minimum along-deck closure to engage the webbing (m/s). */
export const BARRICADE_MIN_ENGAGE_SPEED_MPS = 2.0;

/** Along-deck half-thickness of the catch volume (m), for slow rolls that never "cross". */
export const BARRICADE_CATCH_DEPTH_M = 2.5;

/** Lowest CG height relative to the deck that still engages (m). */
export const BARRICADE_ENGAGE_LOW_M = -1.5;

/** Headroom above the webbing top that still engages (m) — a wing clipping the top edge. */
export const BARRICADE_ENGAGE_HIGH_MARGIN_M = 0.5;

/** Assumed wing half-span (m) when a caller has no airframe geometry to hand. */
export const BARRICADE_DEFAULT_WING_HALF_SPAN_M = 7.0;

/**
 * Deck run-out from webbing contact to full stop (m). Much shorter than a
 * pendant arrestment: the barricade is engaged further up the deck and the
 * engine is set for a hard, short pull.
 *
 * The webbing panel is a hundred feet across, and that sets the ceiling on this
 * far more tightly than the deck does. Its ends are tethered to the masts, so
 * dragging it a hundred metres asks a thirty-metre belt to reach somewhere it
 * cannot: the panel closes up and finishes as a bundle round the fuselage with
 * the wings clear, instead of a net draped over the aircraft. Measured, the
 * panel arrives 5.6 m wide off a 105 m run-out and 14.8 m off a 60 m one.
 *
 * It is also the more honest figure. This is the emergency gear, taken when the
 * hook has failed and the deck is fouled — 60 m off a landing speed is about
 * 3 g, which is what a barricade engagement is, where 105 m is a gentler 1.7 g
 * than the pendants manage.
 */
export const BARRICADE_PULL_OUT_M = 60;

/** Release the wreck-wrapped webbing once relative groundspeed exceeds this (m/s). */
export const BARRICADE_RELEASE_SPEED_MPS = 3.0;

/**
 * Where one barricade is actually rigged, in carrier-local X.
 *
 * The nominal span assumes a deck as wide as the pendant lane, but the angled
 * deck narrows going forward and the barricade sits well ahead of the wires.
 * Fitting the rig to the deck that is really there is what keeps the stanchions
 * bolted to something — see {@link fitBarricadeRig}.
 */
export interface BarricadeRig {
    /** Flight-deck height the rig was fitted against (carrier-local Y). */
    deckY: number;
    /** Stanchion stations. */
    leftX: number;
    rightX: number;
    midX: number;
    halfSpan: number;
}

/** Rig spanning `leftX`..`rightX`; defaults to the nominal, deck-agnostic span. */
export function barricadeRig(
    leftX: number = ARRESTOR_DECK_MID_X - BARRICADE_HALF_SPAN_M,
    rightX: number = ARRESTOR_DECK_MID_X + BARRICADE_HALF_SPAN_M,
    deckY: number = BARRICADE_DECK_LOCAL_Y,
): BarricadeRig {
    return {
        deckY,
        leftX,
        rightX,
        midX: (leftX + rightX) * 0.5,
        halfSpan: Math.max(0.5, (rightX - leftX) * 0.5),
    };
}

/** Below this carrier-local Y a deck probe has missed — open water, not deck. */
export const BARRICADE_DECK_MISS_BELOW_M = 8;

/**
 * How far a probe may sit from the flight-deck datum and still count as deck (m).
 *
 * "Solid" is not the same as "flight deck". The island rises some seven metres
 * out of the deck right beside the barricade's starboard end, and a probe that
 * only asks for the highest surface will happily plant a stanchion on the roof
 * of it. The deck itself is nearly flat — a few tens of centimetres of camber
 * across the whole span — so a band this wide passes real deck and rejects
 * superstructure.
 */
export const BARRICADE_DECK_BAND_M = 2.0;

/** Keep the stanchion feet this far inboard of the deck edge (m). */
export const BARRICADE_DECK_EDGE_INSET_M = 1.0;

/** Step used when hunting inboard for the deck edge (m). */
export const BARRICADE_DECK_PROBE_STEP_M = 0.5;

/** Most the span may be pulled in per side before giving up on the fit (m). */
export const BARRICADE_DECK_PROBE_REACH_M = 12;

/**
 * Pull each stanchion inboard until it is standing on deck.
 *
 * The barricade is rigged forward of the pendants, where the angled deck is
 * narrower than the landing lane, so the nominal span can hang its outboard
 * ends over the edge. Probing inboard from each nominal station and stopping at
 * the first solid deck keeps both feet on the ship — and keeps the webbing
 * panel, the loops and the arrest span consistent with them, since they are all
 * derived from the same rig.
 *
 * @param deckLocalYAt Carrier-local deck height at a station, or a value at or
 *   below {@link BARRICADE_DECK_MISS_BELOW_M} where there is no deck.
 */
export function fitBarricadeRig(deckLocalYAt: (localX: number) => number): BarricadeRig {
    const nominal = barricadeRig();
    const steps = Math.ceil(BARRICADE_DECK_PROBE_REACH_M / BARRICADE_DECK_PROBE_STEP_M);

    // The landing lane's centreline is deck by construction — that is the datum
    // every other station is judged against.
    const deckY = deckLocalYAt(nominal.midX);
    if (deckY <= BARRICADE_DECK_MISS_BELOW_M) return nominal;

    const onDeck = (x: number) => {
        const y = deckLocalYAt(x);
        return y > BARRICADE_DECK_MISS_BELOW_M && Math.abs(y - deckY) <= BARRICADE_DECK_BAND_M;
    };
    const probe = (from: number, inboard: 1 | -1): number => {
        for (let i = 0; i <= steps; i++) {
            const x = from + inboard * i * BARRICADE_DECK_PROBE_STEP_M;
            if (!onDeck(x)) continue;
            // Deck outboard of here too, so this station is comfortably clear
            // of the edge and the rig can stay where it was laced.
            if (onDeck(x - inboard * BARRICADE_DECK_EDGE_INSET_M)) return x;
            // Otherwise this is the edge itself: step in so the foot is seated.
            const seated = x + inboard * BARRICADE_DECK_EDGE_INSET_M;
            return onDeck(seated) ? seated : x;
        }
        return from;   // no deck anywhere along the probe: leave it nominal
    };

    const leftX = probe(nominal.leftX, 1);
    const rightX = probe(nominal.rightX, -1);
    return rightX - leftX > 2
        ? barricadeRig(leftX, rightX, deckY)
        : barricadeRig(nominal.leftX, nominal.rightX, deckY);
}

/** Deck-level world state of one carrier's barricade. */
export interface BarricadeField {
    /** Carrier origin in world space. */
    originX: number;
    originY: number;
    originZ: number;
    /** Unit vector along the roll-out direction (toward the bow). */
    deckAxis: THREE.Vector3;
    /** Unit vector along deck +X (stanchion-to-stanchion). */
    lateralAxis: THREE.Vector3;
    /** World centre of the webbing at the stanchion feet. */
    center: THREE.Vector3;
    /** Half-distance between stanchions (m). */
    halfSpan: number;
    /** Webbing height when fully raised (m). */
    height: number;
    /** 0 = folded flush, 1 = fully upright. */
    deploy: number;
    /**
     * Where the rig was actually fitted, in carrier-local coordinates.
     *
     * The fit needs deck probes and so is done on the main thread, but the
     * webbing is simulated in the sim worker, which has to be rigging the same
     * net — so the fitted stations travel with the field rather than being
     * re-derived at the far end from a nominal span.
     */
    rig: BarricadeRig;
    /**
     * Which webbing assembly is on the rig; see
     * {@link BarricadeController.getRigGeneration}. Whatever simulates the
     * webbing re-laces when this changes.
     */
    rigGeneration: number;
    /**
     * Carrier attitude, for mapping carrier-local geometry to world and back.
     *
     * {@link deckAxis} and {@link lateralAxis} carry the same information, but
     * only as two of the three basis vectors; anything that has to transform a
     * pose rather than a direction wants the rotation itself.
     */
    quaternion: THREE.Quaternion;
}

/**
 * Deck surface height in carrier-local Y under the barricade. Matches the
 * flat-deck datum the pendants are rigged on (`ARRESTOR_DECK_Y_FALLBACK`).
 */
export const BARRICADE_DECK_LOCAL_Y = 13.55;

/**
 * Build the world-space barricade for a carrier pose.
 *
 * @param deckLocalY Deck surface height in carrier-local Y (the stanchion feet).
 * @param deploy 0..1 raise fraction.
 */
export function buildBarricadeField(
    pose: ArrestorCarrierPose,
    deckLocalY: number,
    deploy: number,
    rig: BarricadeRig = barricadeRig(),
    rigGeneration = 0,
): BarricadeField {
    const q = pose.quaternion;
    const deckAxis = new THREE.Vector3(0, 0, -1);
    const lateralAxis = new THREE.Vector3(1, 0, 0);
    if (q) {
        deckAxis.applyQuaternion(q);
        lateralAxis.applyQuaternion(q);
    }
    const center = carrierLocalToWorld(
        rig.midX, deckLocalY, BARRICADE_LOCAL_Z, pose, new THREE.Vector3(),
    );
    return {
        originX: pose.position.x,
        originY: pose.position.y,
        originZ: pose.position.z,
        deckAxis: deckAxis.normalize(),
        lateralAxis: lateralAxis.normalize(),
        center,
        // Arrest across the span that is actually rigged, so the physics agrees
        // with what is drawn when the fit has pulled the stanchions in.
        halfSpan: rig.halfSpan,
        height: BARRICADE_HEIGHT_M,
        deploy: Math.max(0, Math.min(1, deploy)),
        rig,
        rigGeneration,
        quaternion: q ? q.clone() : new THREE.Quaternion(),
    };
}

/** True once the webbing is upright enough to take a load. */
export function barricadeArmed(field: BarricadeField): boolean {
    return field.deploy >= BARRICADE_ARMED_FRACTION;
}

/**
 * Does this airframe engage the webbing on this step?
 *
 * Unlike a pendant trap there is no hook test — the barricade catches the wings,
 * so the gate is purely geometric: the aircraft must cross the webbing plane
 * inside the stanchion span and within the vertical window the net covers.
 *
 * A step that jumps clean over the plane still counts (crossing test), and an
 * aircraft already inside the catch slab counts too (slow rolls).
 */
export function tryBarricadeEngage(
    pos: THREE.Vector3,
    prevPos: THREE.Vector3 | null,
    vel: THREE.Vector3,
    wingHalfSpanM: number,
    field: BarricadeField,
    shipVel?: THREE.Vector3,
): boolean {
    if (!barricadeArmed(field)) return false;
    // Closure with the *ship*, not speed over the sea. A carrier steams at
    // twenty-five knots, so an aircraft chocked on her deck is doing twelve
    // metres a second down the deck axis and reads as charging the net —
    // which is exactly what it did, expending the webbing on an airframe that
    // had not moved an inch relative to the deck it was parked on.
    const closure = shipVel
        ? vel.dot(field.deckAxis) - shipVel.dot(field.deckAxis)
        : vel.dot(field.deckAxis);
    if (closure < BARRICADE_MIN_ENGAGE_SPEED_MPS) return false;

    // Vertical window: the deck line up to the top of the webbing.
    const dy = pos.y - field.center.y;
    if (dy < BARRICADE_ENGAGE_LOW_M) return false;
    if (dy > field.height * field.deploy + BARRICADE_ENGAGE_HIGH_MARGIN_M) return false;

    // Lateral window: stanchion span widened by the wings that would foul it.
    const lateral = _tmpA.subVectors(pos, field.center).dot(field.lateralAxis);
    if (Math.abs(lateral) > field.halfSpan + wingHalfSpanM) return false;

    const planeAlong = field.center.dot(field.deckAxis);
    const along = pos.dot(field.deckAxis);
    if (prevPos) {
        const prevAlong = prevPos.dot(field.deckAxis);
        if (prevAlong < planeAlong && along >= planeAlong) return true;
    }
    return Math.abs(along - planeAlong) <= BARRICADE_CATCH_DEPTH_M;
}

const _tmpA = new THREE.Vector3();

/** Seconds the deck crew needs to lace a fresh webbing assembly after an arrestment. */
export const BARRICADE_RERIG_SECONDS = 12;

export enum BarricadeState {
    /** Stanchions folded flush, webbing stowed. */
    STOWED = 'STOWED',
    /** Stanchions swinging up. */
    RAISING = 'RAISING',
    /** Rigged and armed. */
    RAISED = 'RAISED',
    /** Stanchions folding back down. */
    LOWERING = 'LOWERING',
    /** Webbing expended in an arrestment; crew is rigging a replacement. */
    RERIGGING = 'RERIGGING',
}

/**
 * Raise / lower state for one ship's barricade, plus the one-shot rule: the
 * webbing is expendable, so an arrestment consumes it and the crew has to lace
 * a fresh assembly before it can be rigged again.
 *
 * Lives on the main thread; {@link getDeploy} feeds both the visual and the
 * serialized field handed to the combat sim.
 */
export class BarricadeController {

    private deploy = 0;
    private state = BarricadeState.STOWED;
    private rerigRemaining = 0;
    private wasEngaged = false;
    private rigGeneration = 0;

    getDeploy(): number {
        return this.deploy;
    }

    /**
     * Which webbing assembly is currently on the rig.
     *
     * Bumped every time a fresh one goes up — a new sortie, the barricade spawn
     * rigging one on the spot, or the crew running the stanchions up again. The
     * simulated webbing is expendable and comes out of an arrestment stretched,
     * dragged downfield and with cable off the drums, so whatever is holding it
     * needs to know when it has been replaced. Inferring that from the deploy
     * fraction does not work: a respawn strikes and re-rigs in the same frame,
     * so the net never appears to come down at all.
     */
    getRigGeneration(): number {
        return this.rigGeneration;
    }

    getState(): BarricadeState {
        return this.state;
    }

    /** Seconds left before a fresh webbing is ready (0 when ready now). */
    getRerigRemaining(): number {
        return this.rerigRemaining;
    }

    isArmed(): boolean {
        return this.deploy >= BARRICADE_ARMED_FRACTION;
    }

    /** True while an airframe is in the webbing. */
    isEngaged(): boolean {
        return this.wasEngaged;
    }

    raise(): void {
        if (this.state === BarricadeState.RERIGGING) return;
        if (this.state === BarricadeState.RAISED || this.state === BarricadeState.RAISING) return;
        this.state = BarricadeState.RAISING;
        this.rigGeneration++;
    }

    lower(): void {
        if (this.state === BarricadeState.STOWED || this.state === BarricadeState.RERIGGING) return;
        this.state = BarricadeState.LOWERING;
    }

    /** Pilot / air boss toggle: rig it if it is down, strike it if it is up. */
    toggle(): void {
        if (this.state === BarricadeState.RAISED || this.state === BarricadeState.RAISING) {
            this.lower();
        } else {
            this.raise();
        }
    }

    /**
     * Fully rigged and armed at once, skipping the raise animation. For the
     * barricade spawn, which starts seconds from the ramp with the net already
     * across the deck — there is no time to watch the stanchions come up.
     */
    rigImmediately(): void {
        this.deploy = 1;
        this.state = BarricadeState.RAISED;
        this.rerigRemaining = 0;
        this.wasEngaged = false;
        this.rigGeneration++;
    }

    /** Back to stowed and freshly rigged (respawn / new sortie). */
    reset(): void {
        this.deploy = 0;
        this.state = BarricadeState.STOWED;
        this.rerigRemaining = 0;
        this.wasEngaged = false;
        this.rigGeneration++;
        // Auto-raise the barricade when rigged
        this.raise();
    }

    /**
     * Advance the raise/lower animation and the re-rig timer.
     *
     * @param engaged Whether the sim currently reports an airframe in the webbing.
     *   The falling edge is the arrestment completing — the deck crew cuts the
     *   wreck free, the expended webbing comes down, and a replacement is rigged.
     */
    update(delta: number, engaged: boolean): void {
        if (this.wasEngaged && !engaged) {
            this.state = BarricadeState.RERIGGING;
            this.rerigRemaining = BARRICADE_RERIG_SECONDS;
        }
        this.wasEngaged = engaged;

        switch (this.state) {
            case BarricadeState.RAISING:
                this.deploy = Math.min(1, this.deploy + delta / BARRICADE_RAISE_SECONDS);
                if (this.deploy >= 1) this.state = BarricadeState.RAISED;
                break;
            case BarricadeState.LOWERING:
                this.deploy = Math.max(0, this.deploy - delta / BARRICADE_LOWER_SECONDS);
                if (this.deploy <= 0) this.state = BarricadeState.STOWED;
                break;
            case BarricadeState.RERIGGING:
                // The expended webbing drops while the replacement is laced up.
                this.deploy = Math.max(0, this.deploy - delta / BARRICADE_LOWER_SECONDS);
                this.rerigRemaining = Math.max(0, this.rerigRemaining - delta);
                if (this.rerigRemaining <= 0 && this.deploy <= 0) {
                    this.state = BarricadeState.STOWED;
                }
                break;
            default:
                break;
        }
    }
}
