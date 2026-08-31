/**
 * Carrier emergency barricade ("rig the barricade"): the nylon barrier net that
 * is raised across the landing area when an aircraft cannot take a wire —
 * hook damage, hook-up failure, or a fouled deck.
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

/**
 * Half-width of the webbing panel itself (m) — 100 ft across. The load straps
 * run bare from here out to the stanchion heads, the 5–10 ft gap visible at
 * each end of a rigged barricade.
 */
export const BARRICADE_WEBBING_HALF_WIDTH_M = 15.24;

/** Engaging loops hung across the webbing panel. */
export const BARRICADE_ENGAGING_LOOPS = 24;

/**
 * How far each loop drapes aft at its widest (m). The loops hang slack so they
 * belly out toward the groove — this is the "row of ribs" read of a rigged net.
 */
export const BARRICADE_LOOP_BOW_M = 1.6;

/**
 * Height fraction at which a loop bows widest. Slightly below mid-height: the
 * webbing is gathered at the upper load strap and spreads toward the deck.
 */
export const BARRICADE_LOOP_BOW_PEAK = 0.85;

/**
 * Fraction of a loop at each end that is always treated as free webbing.
 *
 * Guarantees somewhere for slack to go however much of the loop is lying on the
 * airframe. Without it a loop closed right down onto a wing has no free span at
 * all, and its surplus can only be absorbed by bellying the part that is
 * gripping — which lifts the net back off the wing.
 */
export const BARRICADE_LOOP_FREE_END_FRAC = 0.22;

/**
 * Clearance kept between a festoon of spare webbing and the deck (m).
 *
 * Slack webbing hangs until it reaches the deck and then piles on it — it does
 * not carry on through. Once the droop is down on the deck the loop has to put
 * what is left somewhere else, and it bellies instead.
 */
export const BARRICADE_LOOP_DECK_CLEARANCE_M = 0.05;

/**
 * Furthest a festoon of spare webbing may hang below the lower load strap (m).
 *
 * The strap is barely off the deck, so webbing cannot keep dropping — it piles
 * on the deck instead. Anything the droop cannot take goes back into the belly.
 */
export const BARRICADE_LOOP_MAX_DROOP_M = 0.45;

/** Points sampled along each engaging loop when measuring its length. */
export const BARRICADE_LOOP_ARC_SAMPLES = 33;

/**
 * Length of one engaging loop (m) — fixed, because webbing does not stretch.
 *
 * Read off how it hangs when the net is clear: a belly of
 * {@link BARRICADE_LOOP_BOW_M} across its rigged gap. Every shape the loop
 * takes under load has to come out to this same length, which is what makes it
 * go slack and sag whenever the path it has to follow is shorter.
 */
export function barricadeLoopLength(restSpanY: number): number {
    const n = BARRICADE_LOOP_ARC_SAMPLES;
    let len = 0;
    let py = 0;
    let pz = 0;
    for (let i = 1; i < n; i++) {
        const t = i / (n - 1);
        const y = restSpanY * t;
        const z = BARRICADE_LOOP_BOW_M * Math.sin(Math.PI * Math.pow(t, BARRICADE_LOOP_BOW_PEAK));
        len += Math.hypot(y - py, z - pz);
        py = y;
        pz = z;
    }
    return len;
}

/** Lower load strap sits this far above the deck when raised (m). */
export const BARRICADE_LOWER_STRAP_LIFT_M = 0.45;

/** Mid-span sag of the upper load strap under its own weight (m). */
export const BARRICADE_TOP_SAG_M = 0.55;

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
 * Deck run-out from webbing contact to full stop (m). Shorter than a pendant
 * arrestment: the barricade is engaged further up the deck and the arresting
 * engine is set for a hard, short pull.
 */
export const BARRICADE_PULL_OUT_M = 105;

/** Release the wreck-wrapped webbing once relative groundspeed exceeds this (m/s). */
export const BARRICADE_RELEASE_SPEED_MPS = 3.0;

/** Lateral reach (m) over which an engaged aircraft drags the webbing forward. */
export const BARRICADE_PULL_FALLOFF_M = 14;

/** Cap on how far an engagement drags the webbing's top edge down (m). */
export const BARRICADE_MAX_TOP_DIP_M = 2.2;

/** Fraction of the downfield stretch that also drags the top edge down. */
export const BARRICADE_TOP_DIP_PER_STRETCH = 0.25;

/**
 * The load belts are cut to the distance between the two masts, and that is the
 * whole of their length — they do not stretch.
 *
 * Each end is shackled to a wire that pays out of its mast. Rigged, the wire is
 * fully in and the belt reaches mast to mast; driven into a bight it covers less
 * deck, its ends draw inboard, and the wire comes out to bridge the difference.
 * That, not the belt lengthening, is where the extra reach comes from.
 */
export const BARRICADE_END_GAP_M = 0;

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
    /** Half-width of the webbing panel; the rest is bare load strap. */
    webHalfWidth: number;
    /** Station of every engaging loop. */
    loopX: number[];
    /** Every load-strap node: stanchion, each loop, stanchion. */
    nodeX: number[];
}

/** Rig spanning `leftX`..`rightX`; defaults to the nominal, deck-agnostic span. */
export function barricadeRig(
    leftX: number = ARRESTOR_DECK_MID_X - BARRICADE_HALF_SPAN_M,
    rightX: number = ARRESTOR_DECK_MID_X + BARRICADE_HALF_SPAN_M,
    deckY: number = BARRICADE_DECK_LOCAL_Y,
): BarricadeRig {
    const midX = (leftX + rightX) * 0.5;
    const halfSpan = Math.max(0.5, (rightX - leftX) * 0.5);
    // The belt is the full run between the masts, so the webbing spans it all.
    const webHalfWidth = Math.max(0.5, halfSpan - BARRICADE_END_GAP_M);
    const n = BARRICADE_ENGAGING_LOOPS;
    const loopX: number[] = [];
    for (let i = 0; i < n; i++) {
        loopX.push(midX - webHalfWidth + (2 * webHalfWidth * i) / (n - 1));
    }
    return {
        deckY,
        leftX, rightX, midX, halfSpan, webHalfWidth,
        loopX,
        nodeX: [leftX, ...loopX, rightX],
    };
}

/** Local X of each engaging loop on the nominal rig. */
export function barricadeLoopLocalX(): number[] {
    return barricadeRig().loopX;
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
): boolean {
    if (!barricadeArmed(field)) return false;
    if (vel.dot(field.deckAxis) < BARRICADE_MIN_ENGAGE_SPEED_MPS) return false;

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

/**
 * How far the webbing is dragged forward at lateral offset {@link lateralM},
 * given an engaged aircraft {@link acLateralM} off centre that has run
 * {@link stretchM} past the barricade plane.
 *
 * The net does not translate rigidly: it cones back to the stanchions, so the
 * pull falls off linearly with lateral distance from the airframe.
 */
export function barricadeStretchAt(
    lateralM: number,
    acLateralM: number,
    stretchM: number,
): number {
    const w = 1 - Math.abs(lateralM - acLateralM) / BARRICADE_PULL_FALLOFF_M;
    return w <= 0 ? 0 : stretchM * w;
}

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

    getDeploy(): number {
        return this.deploy;
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
    }

    /** Back to stowed and freshly rigged (respawn / new sortie). */
    reset(): void {
        this.deploy = 0;
        this.state = BarricadeState.STOWED;
        this.rerigRemaining = 0;
        this.wasEngaged = false;
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


/**
 * One horizontal station of the rigged webbing: the two load-strap points that
 * an engaging strap (or a stanchion) is laced between.
 */
export interface BarricadeWebNode {
    /** Carrier-local X — fixed by the rig, never moves. */
    x: number;
    /** Upper load strap. */
    topY: number;
    topZ: number;
    /** Lower load strap. */
    botY: number;
    botZ: number;
}

/** Downfield pull of the airframe currently in the webbing. */
export interface BarricadeEngagement {
    /** Metres the airframe has run past the webbing plane. */
    stretch: number;
    /** Carrier-local X of the airframe. */
    lateral: number;
    /**
     * Front hull of the airframe. When present the webbing is draped over the
     * real collision geometry; without it the net falls back to coning toward
     * the aircraft's centreline, which is all a bare CG position supports.
     */
    profile?: BarricadeWrapProfile | null;
}

/** Per-station downfield pull for one engaging loop. */
export function barricadeEngagementPullAt(
    x: number,
    engagement: BarricadeEngagement | null | undefined,
    rig: BarricadeRig = barricadeRig(),
): number {
    if (!engagement) return 0;
    if (engagement.profile?.touched) {
        return barricadeTautPullSampler(engagement.profile, rig)(x);
    }
    return barricadeStretchAt(x, engagement.lateral, engagement.stretch);
}

/**
 * Lateral stations of the load straps, outboard to outboard: stanchion head,
 * every engaging loop's hang point, stanchion head. The first and last spans
 * are the bare run from the webbing panel out to the stanchions.
 */
export function barricadeWebNodeX(rig: BarricadeRig = barricadeRig()): number[] {
    return rig.nodeX;
}

/**
 * Carrier-local shape of the webbing for a given raise fraction.
 *
 * The stanchions are hinged into the deck and stowed lying aft, so raising is a
 * single rotation through `deploy · 90°`: the load straps' separation, height
 * and downfield offset all fall out of it. At deploy 0 the whole assembly lies
 * flat on the deck aft of the hinge line; at 1 it stands upright and taut.
 *
 * @param deckLocalYAt Deck surface in carrier-local Y at a given local X.
 * @param engagement Airframe in the net, if any — it drags the webbing downfield.
 */
export function computeBarricadeWeb(
    deploy: number,
    deckLocalYAt: (localX: number) => number,
    engagement?: BarricadeEngagement | null,
    rig: BarricadeRig = barricadeRig(),
): BarricadeWebNode[] {
    const d = Math.max(0, Math.min(1, deploy));
    const angle = d * Math.PI * 0.5;
    const headY = BARRICADE_HEIGHT_M * Math.sin(angle);
    const headZ = BARRICADE_LOCAL_Z + BARRICADE_HEIGHT_M * Math.cos(angle);
    const mid = rig.midX;

    // One sampler for the whole strap: the hull is built once, not per node.
    const wrap = engagement?.profile?.touched ? engagement.profile : null;
    const taut = wrap ? barricadeTautPullSampler(wrap, rig) : null;
    const pullAt = (px: number) => taut
        ? taut(px)
        : engagement
            ? Math.max(0, barricadeStretchAt(px, engagement.lateral, engagement.stretch)
                - BARRICADE_LOOP_SLACK_REACH_M)
            : 0;

    // The belt is inextensible: driven into a bight it covers less deck, so the
    // panel draws inboard and the wire out to each stanchion pays out. Loops
    // ride the belt and keep their spacing along it.
    const lay = layBarricadeBelt(rig, pullAt);
    const stations = [rig.leftX, ...lay.loopX, rig.rightX];

    return stations.map(x => {
        const deckY = deckLocalYAt(x);
        // Self-weight sag: zero at the stanchions, largest mid-span.
        const t = (x - mid) / rig.halfSpan;
        const sag = BARRICADE_TOP_SAG_M * (1 - t * t) * d;
        // How far the airframe has driven the webbing forward at this station,
        // and how much of that the load straps have had to follow.
        const depth = wrap
            ? barricadeWrapColumnDepth(wrap, x)
            : engagement
                ? barricadeStretchAt(x, engagement.lateral, engagement.stretch)
                : 0;
        const restTop = deckY + headY - sag;
        const restBot = deckY + BARRICADE_LOWER_STRAP_LIFT_M * d;
        const restSpan = Math.max(0.1, restTop - restBot);
        const pull = pullAt(x);
        // Webbing wrapped around the airframe is webbing no longer spanning the
        // gap, so the straps draw together as the net is hauled along.
        let span = barricadeLoopSpanAt(restSpan, pull);
        let topY = restTop - (restSpan - span) * BARRICADE_LOOP_TOP_CLOSE_SHARE;
        let botY = restBot + (restSpan - span) * (1 - BARRICADE_LOOP_TOP_CLOSE_SHARE);

        // Where the net has actually caught something, close onto *that* rather
        // than by a blind share of the gap: the straps draw down until the
        // webbing is snug round the structure and centre themselves on it, so a
        // strip ends up sitting on the wing at the wing's own height and size.
        const ext = wrap ? barricadeWrapSpanExtent(wrap, x, _extent) : null;
        if (ext && ext.hi > ext.lo) {
            // Room for the section plus the webbing curled round both sides of
            // it — close tighter than this and the loop cannot wrap at all.
            const snug = Math.max(
                restSpan * BARRICADE_LOOP_MIN_SPAN_FRAC,
                (ext.hi - ext.lo)
                    + 2 * (BARRICADE_WING_FACE_GRIP_M + BARRICADE_WING_WRAP_RISE_M),
            );
            const frac = Math.min(1, pull / BARRICADE_LOOP_CLOSE_PULL_M);
            span = Math.min(span, restSpan + (snug - restSpan) * frac);
            if (span < restSpan) {
                const half = span * 0.5;
                const centre = Math.min(
                    restTop - half,
                    Math.max(restBot + half, (ext.lo + ext.hi) * 0.5),
                );
                topY = centre + half;
                botY = centre - half;
            }
        }
        return {
            x,
            topY,
            topZ: headZ - pull,
            botY,
            botZ: BARRICADE_LOCAL_Z - pull,
        };
    });
}

/**
 * Sample one engaging loop from its lower to its upper hang point.
 *
 * Unloaded, the webbing hangs slack and bellies aft (local +Z) toward the
 * groove — the bow is what makes a rigged barricade read as a curtain of ribs
 * rather than a row of bars, and it scales with {@link deploy} because a folded
 * net has nothing to drape.
 *
 * Loaded, the loop stops being a free curve and becomes a strap lying on the
 * airframe: every sample is pushed downfield to the front-hull depth at its own
 * height, so the webbing tightens over the nose, follows the wing back, and
 * releases over {@link BARRICADE_WRAP_FEATHER_M} where the aircraft ends. The
 * hang points stay on the load straps throughout — the loop wraps, it does not
 * detach.
 *
 * @param samples Points along the loop, ends included (>= 2).
 * @param nodePull Downfield pull already baked into this loop's hang points (m).
 * @param profile Airframe front hull, when the collision geometry is known.
 */
export function barricadeLoopCurve(
    node: BarricadeWebNode,
    deploy: number,
    samples: number,
    nodePull = 0,
    out: { x: number; y: number; z: number }[] = [],
    profile?: BarricadeWrapProfile | null,
): { x: number; y: number; z: number }[] {
    const n = Math.max(2, samples | 0);
    // Slip stations are skipped: a loop shoved onto the nose taper is sliding
    // off it, not gripping it.
    const wrap = profile?.touched && !barricadeIsSlipStation(profile, node.x) ? profile : null;

    if (_loopY.length !== n) {
        _loopY.length = n;
        _loopDepth.length = n;
        _loopOnHull.length = n;
        _loopRaw.length = n;
        _loopTaut.length = n;
    }
    for (let i = 0; i < n; i++) {
        _loopY[i] = node.botY + (node.topY - node.botY) * (i / (n - 1));
    }

    // ---- What the loop is lying on -------------------------------------
    // The airframe's real front profile at this station, height by height. No
    // vertical smearing: a column can hold a wing and a pylon a metre below it
    // with air between, and flattening that to one depth is what turned a
    // stripe into a straight bar across the lot instead of a strap gripping the
    // leading edge.
    let face = 0;
    let iPeak = 0;
    if (wrap) {
        for (let i = 0; i < n; i++) {
            _loopRaw[i] = barricadeWrapFaceDepthAt(wrap, node.x, _loopY[i]);
            if (_loopRaw[i] > face) {
                face = _loopRaw[i];
                iPeak = i;
            }
        }
    }
    const contact = face > 0;

    const botDepth = BARRICADE_LOCAL_Z - node.botZ;
    const topDepth = BARRICADE_LOCAL_Z - node.topZ;

    if (contact && wrap) {
        // ---- The taut path over it -------------------------------------
        // A strap pulled from one hang point to the other touches only what
        // pokes through the line and runs straight between. That is what
        // bridges it past a pylon and onto the leading edge, with no special
        // case needed to tell them apart.
        _loopDepth[0] = botDepth;
        _loopDepth[n - 1] = topDepth;
        for (let i = 1; i < n - 1; i++) _loopDepth[i] = _loopRaw[i];
        upperConvexEnvelope(_loopY, _loopDepth);

        // ---- The grip round the leading edge ---------------------------
        // Contiguous run of the deepest structure — the edge itself, not the
        // shallower clutter the strap merely bridges.
        let lo = iPeak;
        while (lo > 0 && _loopRaw[lo - 1] >= face - BARRICADE_WING_FACE_BAND_M) lo--;
        let hi = iPeak;
        while (hi < n - 1 && _loopRaw[hi + 1] >= face - BARRICADE_WING_FACE_BAND_M) hi++;
        const loY = _loopY[lo] - BARRICADE_WING_FACE_GRIP_M;
        const hiY = _loopY[hi] + BARRICADE_WING_FACE_GRIP_M;
        const nose = face + BARRICADE_WRAP_CLEARANCE_M;

        /** Depth of the webbing wrapped round the edge, at a given height. */
        const curlAt = (y: number, aft: number): number => {
            if (y >= loY && y <= hiY) return nose;
            const off = y < loY ? loY - y : y - hiY;
            if (off > BARRICADE_WING_WRAP_RISE_M) return Number.NEGATIVE_INFINITY;
            return nose - aft * (off / BARRICADE_WING_WRAP_RISE_M);
        };

        /** Lay the wrap on with a given aft curl; returns its path length. */
        const layWrap = (aft: number): number => {
            let len = 0;
            for (let i = 0; i < n; i++) {
                const taut = _loopTaut[i];
                const curl = curlAt(_loopY[i], aft);
                // Held forward against the edge where the curl reaches, taut
                // everywhere else — the webbing takes whichever is further on.
                _loopDepth[i] = curl > taut ? curl : taut;
                _loopOnHull[i] = curl > taut
                    || (_loopRaw[i] > 0 && Math.abs(_loopDepth[i] - _loopRaw[i]) < 1e-6);
            }
            _loopDepth[0] = botDepth;
            _loopDepth[n - 1] = topDepth;
            _loopOnHull[0] = false;
            _loopOnHull[n - 1] = false;
            for (let i = 1; i < n; i++) {
                len += Math.hypot(_loopY[i] - _loopY[i - 1], _loopDepth[i] - _loopDepth[i - 1]);
            }
            return len;
        };

        for (let i = 0; i < n; i++) _loopTaut[i] = _loopDepth[i];

        // Webbing spends its length on the edge first and the curl second: a
        // loop that cannot afford the full wrap gives up curl rather than
        // lifting off the wing it is holding.
        if (layWrap(BARRICADE_WING_WRAP_AFT_M) > BARRICADE_LOOP_LENGTH_M) {
            let loA = 0;
            let hiA = BARRICADE_WING_WRAP_AFT_M;
            for (let it = 0; it < 18; it++) {
                const mid = (loA + hiA) * 0.5;
                if (layWrap(mid) > BARRICADE_LOOP_LENGTH_M) hiA = mid;
                else loA = mid;
            }
            layWrap(loA);
        }
    } else {
        for (let i = 0; i < n; i++) {
            _loopDepth[i] = 0;
            _loopOnHull[i] = false;
        }
        _loopDepth[0] = BARRICADE_LOCAL_Z - node.botZ;
        _loopDepth[n - 1] = BARRICADE_LOCAL_Z - node.topZ;
    }

    // Chord between the hang points, and how far the wrap pushes the webbing
    // forward of it at each sample.
    if (_loopChord.length !== n) {
        _loopChord.length = n;
        _loopReach.length = n;
        _loopFree.length = n;
    }
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        _loopChord[i] = node.botZ + (node.topZ - node.botZ) * t;
        const wrapped = BARRICADE_LOCAL_Z - _loopDepth[i];
        // Signed: the wrap pushes the webbing forward round the leading edge
        // and pulls it back aft along the skin, and both are the shape, not slack.
        _loopReach[i] = contact ? _loopChord[i] - wrapped : 0;
        // Slack goes into the runs that are not on the airframe. Webbing that
        // is wrapping the section must keep the shape it was given — bellying
        // there breaks the curl open — so those samples take none of it.
        _loopFree[i] = _loopOnHull[i]
            ? 0
            : Math.sin(Math.PI * Math.pow(t, BARRICADE_LOOP_BOW_PEAK));
    }

    // A loop wrapping a section along its whole length has no free run to put
    // slack in. Free the ends nearest the straps so it still has somewhere.
    // Measured as capacity rather than counted: the shape function is ~0 at the
    // hang points, so a couple of nominally free samples can still be no use.
    let capacity = 0;
    for (let i = 0; i < n; i++) capacity += _loopFree[i];
    if (capacity < 0.5) {
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            if (t < BARRICADE_LOOP_FREE_END_FRAC || t > 1 - BARRICADE_LOOP_FREE_END_FRAC) {
                _loopFree[i] = Math.sin(Math.PI * Math.pow(t, BARRICADE_LOOP_BOW_PEAK));
            }
        }
    }

    /**
     * Path length with the wrap scaled by `k`, an aft belly of `aft`, and a
     * downward droop of `down`.
     */
    const lengthOf = (k: number, aft: number, down: number): number => {
        let len = 0;
        for (let i = 1; i < n; i++) {
            const z0 = _loopChord[i - 1] - k * _loopReach[i - 1] + aft * _loopFree[i - 1];
            const z1 = _loopChord[i] - k * _loopReach[i] + aft * _loopFree[i];
            const y0 = _loopY[i - 1] - down * _loopFree[i - 1];
            const y1 = _loopY[i] - down * _loopFree[i];
            len += Math.hypot(y1 - y0, z1 - z0);
        }
        return len;
    };

    // The loop is a fixed length of webbing. Either it has slack to give up —
    // and bellies until it is used up — or the wrap is asking for more than it
    // has, and it simply cannot reach that far.
    let k = 1;
    let aft = 0;
    let down = 0;
    if (lengthOf(1, 0, 0) > BARRICADE_LOOP_LENGTH_M) {
        let lo = 0;
        let hi = 1;
        for (let it = 0; it < 24; it++) {
            const mid = (lo + hi) * 0.5;
            if (lengthOf(mid, 0, 0) > BARRICADE_LOOP_LENGTH_M) hi = mid;
            else lo = mid;
        }
        k = (lo + hi) * 0.5;
    } else if (lengthOf(1, BARRICADE_LOOP_BOW_M, 0) >= BARRICADE_LOOP_LENGTH_M) {
        // Enough spare to belly aft the way it hangs when rigged, no more.
        let lo = 0;
        let hi = BARRICADE_LOOP_BOW_M;
        for (let it = 0; it < 24; it++) {
            const mid = (lo + hi) * 0.5;
            if (lengthOf(1, mid, 0) < BARRICADE_LOOP_LENGTH_M) lo = mid;
            else hi = mid;
        }
        aft = (lo + hi) * 0.5;
    } else {
        // More spare than the rigged belly can hold — the straps have closed on
        // the airframe and the webbing between them has nowhere to go but down.
        // It festoons below the loop rather than ballooning further aft.
        aft = BARRICADE_LOOP_BOW_M;
        let hi = 0.5;
        for (let it = 0; it < 14 && lengthOf(1, aft, hi) < BARRICADE_LOOP_LENGTH_M; it++) hi *= 2;
        let lo = 0;
        for (let it = 0; it < 24; it++) {
            const mid = (lo + hi) * 0.5;
            if (lengthOf(1, aft, mid) < BARRICADE_LOOP_LENGTH_M) lo = mid;
            else hi = mid;
        }
        down = (lo + hi) * 0.5;

        // Webbing hangs to the deck and no further. Find the droop that just
        // grazes it, and if that is less than the length wanted, take up the
        // rest as belly — spare webbing lying on the deck bulges, it does not
        // keep dropping.
        const deckY = node.botY
            - BARRICADE_LOWER_STRAP_LIFT_M * Math.max(0, Math.min(1, deploy));
        let maxDown = Number.POSITIVE_INFINITY;
        for (let i = 0; i < n; i++) {
            if (_loopFree[i] <= 1e-6) continue;
            const room = _loopY[i] - deckY - BARRICADE_LOOP_DECK_CLEARANCE_M;
            maxDown = Math.min(maxDown, Math.max(0, room) / _loopFree[i]);
        }
        if (down > maxDown) {
            down = maxDown;
            let hiB = BARRICADE_LOOP_BOW_M;
            for (let it = 0; it < 16 && lengthOf(1, hiB, down) < BARRICADE_LOOP_LENGTH_M; it++) {
                hiB *= 2;
            }
            let loB = 0;
            for (let it = 0; it < 24; it++) {
                const mid = (loB + hiB) * 0.5;
                if (lengthOf(1, mid, down) < BARRICADE_LOOP_LENGTH_M) loB = mid;
                else hiB = mid;
            }
            aft = (loB + hiB) * 0.5;
        }
    }

    out.length = 0;
    for (let i = 0; i < n; i++) {
        out.push({
            x: node.x,
            y: _loopY[i] - down * _loopFree[i],
            z: _loopChord[i] - k * _loopReach[i] + aft * _loopFree[i],
        });
    }
    return out;
}

const _loopOnHull: boolean[] = [];
const _loopRaw: number[] = [];
const _loopTaut: number[] = [];
const _loopChord: number[] = [];
const _loopReach: number[] = [];
const _loopFree: number[] = [];

/** Arc length of a sampled path. */
export function barricadePathLength(pts: readonly { x: number; y: number; z: number }[]): number {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
    }
    return len;
}



const _loopY: number[] = [];
const _loopDepth: number[] = [];

/** Lateral resolution of the wrap profile (m per bin). */
export const BARRICADE_WRAP_BIN_X_M = 0.75;
/** Vertical resolution of the wrap profile (m per bin). */
export const BARRICADE_WRAP_BIN_Y_M = 0.5;
/** Vertical reach (m) over which the webbing releases above/below the airframe. */
export const BARRICADE_WRAP_FEATHER_M = 0.9;

/**
 * The airframe's *front hull* as the webbing sees it: for every cell of a grid
 * laid over the barricade plane, how far past that plane the nearest piece of
 * aircraft sits.
 *
 * This is what a net actually drapes over. A sheet pushed downfield by a solid
 * body conforms to the body's leading surface at each point, so the deepest
 * cells are under the nose and the shallowest out at the wingtips — which is
 * why a barricade arrestment photographs as webbing stretched taut over the
 * nose with the loops fanning back to the stanchions.
 *
 * Built from the collision mesh's own vertices, so it follows the real
 * planform: swept wings pull the net back, a tall fin tents it upward.
 */
export interface BarricadeWrapProfile {
    /** Carrier-local X of column 0's centre, and column pitch. */
    x0: number;
    binX: number;
    nx: number;
    /** Carrier-local Y of row 0's centre, and row pitch. */
    y0: number;
    binY: number;
    ny: number;
    /** `nx * ny` depths past the webbing plane (m); 0 where the cell is clear. */
    depth: Float32Array;
    /** Lateral extent of the cells the airframe actually reached. */
    minX: number;
    maxX: number;
    /** False until at least one point has been added past the plane. */
    touched: boolean;
    /**
     * Deepest structure the webbing can actually hold on to (m).
     *
     * A pointed forward fuselage does not catch webbing — the straps slide off
     * the taper and the nose simply comes through the hole. What arrests the
     * net is everything behind that: wing leading edges, roots, tail. The net
     * is therefore never dragged deeper than this, however far the nose has
     * gone, which is why an aircraft in a barricade photographs with its nose
     * out the far side and the webbing bunched back on the wings.
     */
    catchDepth: number;
    /** Lateral band of the parting nose — webbing here slips aside instead of catching. */
    slipLeft: number;
    slipRight: number;
    /**
     * True once {@link finalizeBarricadeWrap} has classified the hull. Until
     * then the profile is just the raw front hull and reads uncapped, so a
     * half-built profile can never silently measure zero everywhere.
     */
    finalized: boolean;
}

/** Allocate a wrap profile spanning the rigged net, rooted at the deck. */
export function createBarricadeWrapProfile(deckLocalY: number): BarricadeWrapProfile {
    const nx = Math.ceil((2 * BARRICADE_HALF_SPAN_M) / BARRICADE_WRAP_BIN_X_M) + 1;
    // A tall fin can tent the net above its own top edge, so allow headroom.
    const ny = Math.ceil((BARRICADE_HEIGHT_M + 2 * BARRICADE_WRAP_FEATHER_M) / BARRICADE_WRAP_BIN_Y_M) + 1;
    return {
        x0: ARRESTOR_DECK_MID_X - BARRICADE_HALF_SPAN_M,
        binX: BARRICADE_WRAP_BIN_X_M,
        nx,
        y0: deckLocalY - BARRICADE_WRAP_FEATHER_M,
        binY: BARRICADE_WRAP_BIN_Y_M,
        ny,
        depth: new Float32Array(nx * ny),
        minX: 0,
        maxX: 0,
        touched: false,
        catchDepth: 0,
        slipLeft: 0,
        slipRight: 0,
        finalized: false,
    };
}

/** Clear a profile for reuse; the deck may have moved, so re-root it. */
export function resetBarricadeWrapProfile(p: BarricadeWrapProfile, deckLocalY: number): void {
    p.depth.fill(0);
    p.y0 = deckLocalY - BARRICADE_WRAP_FEATHER_M;
    p.minX = 0;
    p.maxX = 0;
    p.touched = false;
    p.catchDepth = 0;
    p.slipLeft = 0;
    p.slipRight = 0;
    p.finalized = false;
}

/**
 * Fold one carrier-local airframe vertex into the profile. Points still short
 * of the webbing plane are ignored — they are not pushing anything yet.
 */
export function addBarricadeWrapPoint(
    p: BarricadeWrapProfile,
    x: number,
    y: number,
    z: number,
): void {
    const depth = BARRICADE_LOCAL_Z - z;
    if (depth <= 0) return;
    const ix = Math.round((x - p.x0) / p.binX);
    const iy = Math.round((y - p.y0) / p.binY);
    if (ix < 0 || ix >= p.nx || iy < 0 || iy >= p.ny) return;
    const i = iy * p.nx + ix;
    if (depth > p.depth[i]) p.depth[i] = depth;
    if (!p.touched) {
        p.minX = x;
        p.maxX = x;
        p.touched = true;
    } else {
        if (x < p.minX) p.minX = x;
        if (x > p.maxX) p.maxX = x;
    }
}

/**
 * Front-hull depth at a point on the webbing, bilinearly sampled (m).
 *
 * Zero inside the parting band: the narrow forward fuselage carries no webbing,
 * it goes through the hole. Everywhere else the reading is the hull as measured
 * — it deliberately is *not* clipped to
 * {@link BarricadeWrapProfile.catchDepth}, because a swept wing runs deeper
 * inboard than the catch level and clipping to a single scalar buried the
 * webbing behind the very wing it is supposed to be lying on.
 */
export function barricadeWrapDepthAt(p: BarricadeWrapProfile, x: number, y: number): number {
    if (!p.touched) return 0;
    if (barricadeIsSlipStation(p, x)) return 0;
    const fx = (x - p.x0) / p.binX;
    const fy = (y - p.y0) / p.binY;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    if (ix < 0 || ix + 1 >= p.nx || iy < 0 || iy + 1 >= p.ny) return 0;
    const tx = fx - ix;
    const ty = fy - iy;
    const d = p.depth;
    const row0 = iy * p.nx + ix;
    const row1 = row0 + p.nx;
    const a = d[row0] + (d[row0 + 1] - d[row0]) * tx;
    const b = d[row1] + (d[row1 + 1] - d[row1]) * tx;
    return a + (b - a) * ty;
}

/**
 * Hull depth at a point, dilated vertically by {@link BARRICADE_WING_GRIP_M}.
 *
 * This is the surface the webbing actually ends up on: a wing's own frontal
 * profile is only a few tens of centimetres tall, but the strap folded around
 * it covers the leading edge plus a grip of webbing above and below.
 */
export function barricadeGrippedDepthAt(
    p: BarricadeWrapProfile,
    x: number,
    y: number,
): number {
    const g = BARRICADE_WING_GRIP_M;
    // Lateral taps as well as vertical: a webbing band is wider than one
    // profile cell, so it rides the highest cell it spans. Sampling the
    // bilinear field at a single point instead reads *between* cells and can
    // undershoot the hull by a fraction of a bin — enough, on a steep wing, to
    // put the strap back inside the skin the clearance just lifted it off.
    let best = 0;
    const halfBin = p.binX * 0.5;
    for (const dx of [0, -halfBin, halfBin]) {
        for (const dy of [0, -g * 0.5, g * 0.5, -g, g]) {
            const d = barricadeWrapDepthAt(p, x + dx, y + dy);
            if (d > best) best = d;
        }
    }
    return best;
}

/**
 * Vertical extent of the airframe in one column of the profile, in carrier-local
 * Y. `hi <= lo` when the column is clear.
 *
 * This is what the net has to close around: the webbing stops drawing together
 * once it is snug on the structure it has caught, so a strip ends up sized to
 * the wing it is lying on rather than still spanning the full rigged gap.
 */
export function barricadeWrapColumnExtent(
    p: BarricadeWrapProfile,
    x: number,
    out: { lo: number; hi: number },
): { lo: number; hi: number } {
    out.lo = 1;
    out.hi = 0;
    if (!p.touched || barricadeIsSlipStation(p, x)) return out;
    const ix = Math.round((x - p.x0) / p.binX);
    if (ix < 0 || ix >= p.nx) return out;
    let lo = -1;
    let hi = -1;
    for (let iy = 0; iy < p.ny; iy++) {
        if (p.depth[iy * p.nx + ix] <= 0) continue;
        if (lo < 0) lo = iy;
        hi = iy;
    }
    if (lo < 0) return out;
    // Each occupied row covers a whole cell, so widen by half a bin either way.
    // Without this a thin wing that lands in a single row reports zero height,
    // reads as "nothing caught", and the webbing hangs straight through it.
    out.lo = p.y0 + lo * p.binY - p.binY * 0.5;
    out.hi = p.y0 + hi * p.binY + p.binY * 0.5;
    return out;
}

const _extent = { lo: 1, hi: 0 };
const _extentTap = { lo: 1, hi: 0 };

/**
 * Vertical extent of the airframe around a station, taking in the neighbouring
 * profile columns.
 *
 * A webbing band is wider than one cell of the grid, so asking a single column
 * misses a section whose samples happen to fall either side of it — and a loop
 * that finds nothing simply hangs free straight through the wing.
 */
export function barricadeWrapSpanExtent(
    p: BarricadeWrapProfile,
    x: number,
    out: { lo: number; hi: number },
): { lo: number; hi: number } {
    out.lo = 1;
    out.hi = 0;
    // Half a bin: enough to catch a section whose samples fall between two
    // columns, without reaching a whole column away and over-reading the depth
    // of a swept wing at the neighbouring station.
    for (const dx of [0, -p.binX * 0.5, p.binX * 0.5]) {
        barricadeWrapColumnExtent(p, x + dx, _extentTap);
        if (_extentTap.hi <= _extentTap.lo) continue;
        if (out.hi <= out.lo) {
            out.lo = _extentTap.lo;
            out.hi = _extentTap.hi;
        } else {
            out.lo = Math.min(out.lo, _extentTap.lo);
            out.hi = Math.max(out.hi, _extentTap.hi);
        }
    }
    return out;
}

/**
 * Front-hull depth at a point, dilated laterally only.
 *
 * This is the surface a webbing band lies against, height by height. The
 * vertical dilation {@link barricadeGrippedDepthAt} applies is deliberately
 * absent here: it smears a whole column to one depth, which is exactly what
 * stops a stripe following the section it is on.
 */
export function barricadeWrapFaceDepthAt(
    p: BarricadeWrapProfile,
    x: number,
    y: number,
): number {
    // Straight bilinear, no lateral taps. The samples either side that
    // `barricadeGrippedDepthAt` takes are there to stop a section falling
    // between columns, but the bilinear read already interpolates across them —
    // and half a bin away, on the gradient at a wing root, it reads a metre
    // deeper than the station actually is and stands the webbing off in mid-air.
    return barricadeWrapDepthAt(p, x, y);
}

/** Deepest cell around a station, taking in the neighbouring columns. */
export function barricadeWrapSpanDepth(p: BarricadeWrapProfile, x: number): number {
    return Math.max(
        barricadeWrapColumnDepth(p, x),
        barricadeWrapColumnDepth(p, x - p.binX * 0.5),
        barricadeWrapColumnDepth(p, x + p.binX * 0.5),
    );
}

/** Deepest cell in a column — how far the airframe pushes the net at station `x`. */
export function barricadeWrapColumnDepth(p: BarricadeWrapProfile, x: number): number {
    if (!p.touched) return 0;
    if (barricadeIsSlipStation(p, x)) return 0;
    const ix = Math.round((x - p.x0) / p.binX);
    if (ix < 0 || ix >= p.nx) return 0;
    let best = 0;
    for (let iy = 0; iy < p.ny; iy++) {
        const v = p.depth[iy * p.nx + ix];
        if (v > best) best = v;
    }
    return best;
}

/**
 * Downfield pull of the *load straps* at each lateral station.
 *
 * The straps are cables under tension, so they do not follow every lump of the
 * airframe the way the slack webbing does — they take the taut path over it.
 * That is the upper convex hull of the column depths, pinned to zero at both
 * stanchions, which also produces the straight runs from the outermost fouled
 * station back to the rig.
 */
export function barricadeTautPullSampler(
    p: BarricadeWrapProfile,
    rig: BarricadeRig = barricadeRig(),
): (x: number) => number {
    const left = rig.leftX;
    const right = rig.rightX;
    if (!p.touched) return () => 0;

    const xs: number[] = [left];
    const ds: number[] = [0];
    for (let ix = 0; ix < p.nx; ix++) {
        const x = p.x0 + ix * p.binX;
        if (x <= left || x >= right) continue;
        xs.push(x);
        // The parting nose carries no load, so the straps bridge straight over
        // it — exactly what the convex hull would do anyway, but this stops a
        // deep nose column dictating the peak. Everywhere else the strap lags
        // the airframe by whatever slack the loops still have to pay out.
        ds.push(Math.max(0, barricadeWrapColumnDepth(p, x) - BARRICADE_LOOP_SLACK_REACH_M));
    }
    xs.push(right);
    ds.push(0);

    upperConvexEnvelope(xs, ds);

    return (x: number) => {
        if (x <= xs[0] || x >= xs[xs.length - 1]) return 0;
        for (let i = 1; i < xs.length; i++) {
            if (x <= xs[i]) {
                const t = (x - xs[i - 1]) / Math.max(1e-9, xs[i] - xs[i - 1]);
                return ds[i - 1] + (ds[i] - ds[i - 1]) * t;
            }
        }
        return 0;
    };
}

/**
 * Rewrite {@link depth} in place as the taut path over the same points: the
 * upper convex envelope in (position, depth).
 *
 * A strap pulled tight over a row of obstructions takes exactly this path — it
 * lies on whatever pokes through the line and runs dead straight between those
 * contact points. Used both across the deck, for the load straps spanning an
 * airframe, and up a single loop, for the webbing folding over a wing.
 */
export function upperConvexEnvelope(pos: readonly number[], depth: number[]): void {
    const n = pos.length;
    if (n < 3) return;
    const hx: number[] = [];
    const hd: number[] = [];
    const hi: number[] = [];
    for (let i = 0; i < n; i++) {
        while (hx.length >= 2) {
            const m = hx.length;
            const cross =
                (hx[m - 1] - hx[m - 2]) * (depth[i] - hd[m - 2]) -
                (pos[i] - hx[m - 2]) * (hd[m - 1] - hd[m - 2]);
            if (cross < 0) break;
            hx.pop();
            hd.pop();
            hi.pop();
        }
        hx.push(pos[i]);
        hd.push(depth[i]);
        hi.push(i);
    }
    // Straight runs between contact points.
    for (let k = 1; k < hi.length; k++) {
        const i0 = hi[k - 1];
        const i1 = hi[k];
        const span = Math.max(1e-9, pos[i1] - pos[i0]);
        for (let i = i0 + 1; i < i1; i++) {
            depth[i] = hd[k - 1] + (hd[k] - hd[k - 1]) * ((pos[i] - pos[i0]) / span);
        }
    }
}

/**
 * Close interior holes in a wrap profile.
 *
 * The profile is built from collision *vertices*, so a single large triangle —
 * a flat wing panel, a fuselage side — registers only at its corners and leaves
 * the cells between them empty. Left alone the webbing would sink through the
 * middle of the panel it is supposed to be lying on.
 *
 * Filling each scanline between its outermost occupied cells fixes that without
 * inventing any airframe: the silhouette's extent is untouched, only the gaps
 * strictly inside it are bridged, and the bridge is a linear ramp between the
 * two hull depths that straddle it — which is what the surface between two hull
 * points actually does.
 */
export function closeBarricadeWrapGaps(p: BarricadeWrapProfile): void {
    if (!p.touched) return;
    const d = p.depth;
    for (let iy = 0; iy < p.ny; iy++) {
        const row = iy * p.nx;
        let first = -1;
        let last = -1;
        for (let ix = 0; ix < p.nx; ix++) {
            if (d[row + ix] > 0) {
                if (first < 0) first = ix;
                last = ix;
            }
        }
        if (first < 0 || last - first < 2) continue;
        let runStart = first;
        for (let ix = first + 1; ix <= last; ix++) {
            if (d[row + ix] <= 0) continue;
            const gap = ix - runStart;
            if (gap > 1) {
                const a = d[row + runStart];
                const b = d[row + ix];
                for (let k = 1; k < gap; k++) {
                    d[row + runStart + k] = a + (b - a) * (k / gap);
                }
            }
            runStart = ix;
        }
    }
}

/**
 * Fold an airframe's collision triangle soup into a wrap profile.
 *
 * `bodyToCarrier` takes body-space vertices straight to carrier-local space, so
 * the profile it builds is already in the barricade's own frame — bank, pitch
 * and yaw all come along, which is what lets a wing-down aircraft tent the net
 * on one side.
 *
 * @param budget Cap on vertices sampled; heavier meshes are strided down. The
 *   profile is a coarse grid, so dropping vertices costs nothing visible.
 * @returns Number of vertices folded in.
 */
export function foldCollisionHullIntoWrap(
    profile: BarricadeWrapProfile,
    triangles: readonly number[],
    bodyToCarrier: THREE.Matrix4,
    budget: number,
    scratch: THREE.Vector3 = new THREE.Vector3(),
): number {
    const verts = (triangles.length / 3) | 0;
    if (verts === 0) return 0;
    const stride = Math.max(1, Math.ceil(verts / Math.max(1, budget)));
    let used = 0;
    for (let v = 0; v < verts; v += stride) {
        const i = v * 3;
        scratch
            .set(triangles[i], triangles[i + 1], triangles[i + 2])
            .applyMatrix4(bodyToCarrier);
        addBarricadeWrapPoint(profile, scratch.x, scratch.y, scratch.z);
        used++;
    }
    closeBarricadeWrapGaps(profile);
    finalizeBarricadeWrap(profile);
    return used;
}

/**
 * How wide a piece of airframe has to be before the webbing can hang on it (m).
 *
 * This is the whole reason a barricade does not simply wrap the nose. The
 * engaging loops are laced 4 ft apart and ride the load straps freely, so
 * anything narrower than a few loop spacings just parts them and keeps going —
 * a fuselage is ~2.5 m across and slips straight through. It takes something
 * spanning several stations at once, which in practice means the wings, to
 * gather enough loops to take the load.
 */
export const BARRICADE_CATCH_MIN_WIDTH_M = 4.0;

/** Furthest a loop can be shoved along the load straps before it snags (m). */
export const BARRICADE_LOOP_SLIDE_MAX_M = 4.0;

/** Spacing loops bunch to once they have been parted by the fuselage (m). */
export const BARRICADE_LOOP_BUNCH_M = 0.45;

/**
 * How far the webbing folds around a leading edge before it runs back to the
 * load straps (m).
 *
 * Webbing does not merely rest against a wing, it closes around it: the loop
 * goes over the leading edge and is dragged along the top and bottom surfaces
 * until it grips. Holding hull depth for this much above and below the wing is
 * what turns "pressed against" into "wrapped around", and it is why a barricade
 * ensnares a wing rather than sliding off it the way it does off a fuselage.
 */
export const BARRICADE_WING_GRIP_M = 0.7;

/**
 * How far the webbing follows the wing's upper and lower surfaces aft of the
 * leading edge before it leaves for the load strap (m).
 *
 * This is what makes a strap *wrap* a wing rather than merely press against the
 * front of it. Webbing driven onto a leading edge does not stop there: it is
 * dragged round the edge and lies back along the skin above and below, which is
 * what grips the wing and why a barricade holds an aircraft at all. Seen from
 * the side the loop closes into a C round the section.
 */
export const BARRICADE_WING_WRAP_AFT_M = 1.1;

/** Height over which the webbing curls off the leading edge onto the skin (m). */
export const BARRICADE_WING_WRAP_RISE_M = 0.55;

/**
 * How far past the section's own extent the webbing stays flat on the leading
 * edge before it starts curling round (m).
 *
 * Deliberately small: it is the *curl* that grips a wing, so a generous flat
 * band here just eats the room the wrap needs and leaves the strap pressed
 * against the front of the section instead of closed around it.
 */
export const BARRICADE_WING_FACE_GRIP_M = 0.12;

/**
 * How far behind the deepest structure still counts as the leading edge (m).
 *
 * The webbing grips the edge; a pylon or rail a metre further back is something
 * the strap bridges past, not something it wraps. This is what separates them.
 */
export const BARRICADE_WING_FACE_BAND_M = 0.5;

/**
 * How far the webbing stands proud of the hull it is lying on (m).
 *
 * Strap and skin cannot occupy the same plane. Without this the webbing is
 * exactly coplanar with the wing's leading face and the depth test hides it
 * inside the wing, so the loops appear to be threaded *through* the wing rather
 * than lying across the front of it.
 */
export const BARRICADE_WRAP_CLEARANCE_M = 0.18;

/** Rigged vertical gap between the two load straps at full deploy (m). */
export const BARRICADE_LOOP_REST_SPAN_M =
    BARRICADE_HEIGHT_M - BARRICADE_LOWER_STRAP_LIFT_M;

/** The engaging loops are all cut to the same length as rigged (m). */
export const BARRICADE_LOOP_LENGTH_M = barricadeLoopLength(BARRICADE_LOOP_REST_SPAN_M);

/** Tightest the webbing will close, as a fraction of its rigged gap. */
export const BARRICADE_LOOP_MIN_SPAN_FRAC = 0.18;

/**
 * How much the two load straps close together per metre the net is dragged
 * downfield (m/m).
 *
 * Webbing does not stretch, so length spent wrapping around the airframe is
 * length no longer available to span the gap between the straps: the further
 * the net is hauled along with the aircraft, the more of each loop is wrapped
 * and the tighter the net closes on it. That closing is what turns a flat sheet
 * into a bag around the airframe.
 */
export const BARRICADE_LOOP_CLOSE_PER_PULL = 0.7;

/**
 * Drag over which the net finishes closing onto the structure it has caught (m).
 *
 * Where the webbing has something to grip, it does not just narrow at some
 * generic rate — it draws down onto *that* and stops there. This is how long
 * that takes, so a wing is wrapped snugly within a few metres of run-out rather
 * than the strips still standing the full height of the rig over it.
 */
export const BARRICADE_LOOP_CLOSE_PULL_M = 4;

/**
 * Share of the closure taken by the upper load strap.
 *
 * The lower strap is already almost on the deck and has nowhere to go, so most
 * of the closing is the top of the net coming down over the aircraft.
 */
export const BARRICADE_LOOP_TOP_CLOSE_SHARE = 0.65;

/**
 * How far a loop can bulge downfield on its own slack before it starts hauling
 * the load straps along with it (m).
 *
 * The loops are longer than the gap between the straps — that is what lets them
 * belly aft when the net is clear. Caught on a wing, that spare length pays out
 * first: the wing runs ahead of the straps by roughly this much, and only then
 * does the strap take up.
 */
export const BARRICADE_LOOP_SLACK_REACH_M = 1.8;

/**
 * Vertical gap between the load straps once the net has been dragged
 * {@link pullM} metres downfield, from a rigged gap of {@link restSpanY}.
 *
 * Bounded below by {@link BARRICADE_LOOP_MIN_SPAN_FRAC}: however far the
 * aircraft goes, the loops still have to reach around it.
 */
export function barricadeLoopSpanAt(restSpanY: number, pullM: number): number {
    const close = Math.min(
        Math.max(0, pullM) * BARRICADE_LOOP_CLOSE_PER_PULL,
        restSpanY * (1 - BARRICADE_LOOP_MIN_SPAN_FRAC),
    );
    return restSpanY - close;
}

/** Raw (uncapped) deepest cell in a column. */
function rawColumnDepth(p: BarricadeWrapProfile, ix: number): number {
    let best = 0;
    for (let iy = 0; iy < p.ny; iy++) {
        const v = p.depth[iy * p.nx + ix];
        if (v > best) best = v;
    }
    return best;
}

/**
 * Work out what the webbing can hold on to, and what it parts around.
 *
 * Sweeps a depth threshold down the hull and measures how wide the airframe is
 * at each level. Deep levels are just nose — a metre or two across, far too
 * narrow to gather loops. The catch depth is the deepest level that is still
 * {@link BARRICADE_CATCH_MIN_WIDTH_M} wide, which on any real airframe lands on
 * the wings. Everything deeper than that is the part that comes through the
 * hole, and the band it occupies is where loops get shouldered aside.
 *
 * Measuring width rather than local slope matters: the profile grid is coarse
 * next to a fuselage, so a nose taper reads as nearly flat from one column to
 * the next and a slope test misses it entirely. Width does not care about the
 * bin size.
 *
 * Called by {@link foldCollisionHullIntoWrap}; only needed separately when a
 * profile is assembled point by point.
 */
export function finalizeBarricadeWrap(p: BarricadeWrapProfile): void {
    p.catchDepth = 0;
    p.slipLeft = 0;
    p.slipRight = 0;
    p.finalized = true;
    if (!p.touched) return;

    let peak = 0;
    let peakDepth = 0;
    const cols = new Float32Array(p.nx);
    for (let ix = 0; ix < p.nx; ix++) {
        const d = rawColumnDepth(p, ix);
        cols[ix] = d;
        if (d > peakDepth) {
            peakDepth = d;
            peak = ix;
        }
    }
    if (peakDepth <= 0) return;

    // Deepest level at which the airframe is still broad enough to gather loops.
    let catchDepth = 0;
    for (let ix = 0; ix < p.nx; ix++) {
        const level = cols[ix];
        if (level <= catchDepth) continue;
        let lo = -1;
        let hi = -1;
        for (let j = 0; j < p.nx; j++) {
            if (cols[j] < level) continue;
            if (lo < 0) lo = j;
            hi = j;
        }
        // hi and lo are cell indices, so the span they cover is one cell wider
        // than the gap between their centres.
        if (hi > lo && (hi - lo + 1) * p.binX >= BARRICADE_CATCH_MIN_WIDTH_M) {
            catchDepth = level;
        }
    }
    // Nothing broad in the net yet — a nose on its own parts the webbing and
    // carries nothing, so the net stays where it was rigged.
    p.catchDepth = catchDepth;

    // Nothing sticks out past what the webbing can hold — a broad airframe with
    // no narrow nose in front of it — so there is nothing to part around.
    if (peakDepth <= catchDepth) return;

    // The parting band: the contiguous run around the peak that is deeper than
    // anything the webbing can hold, i.e. the part coming out the far side.
    //
    // It can never grow wider than the webbing's own catch width. A swept wing
    // runs deeper at the root than the broad catch level does, so an unbounded
    // "deeper than catchDepth" walk marches straight out along the wing and
    // declares most of the airframe un-catchable. Once the run is as wide as
    // BARRICADE_CATCH_MIN_WIDTH_M there is by definition enough structure there
    // to gather loops, so it is no longer parting anything.
    const maxCols = Math.floor(BARRICADE_CATCH_MIN_WIDTH_M / p.binX);
    let l = peak;
    let r = peak;
    while (r - l < maxCols) {
        const canL = l > 0 && cols[l - 1] > catchDepth;
        const canR = r < p.nx - 1 && cols[r + 1] > catchDepth;
        if (!canL && !canR) break;
        // Follow the deeper side first so the band stays centred on the spike.
        if (canL && (!canR || cols[l - 1] >= cols[r + 1])) l--;
        else r++;
    }
    p.slipLeft = p.x0 + (l - 0.5) * p.binX;
    p.slipRight = p.x0 + (r + 0.5) * p.binX;
}

/** Is this station inside the parting nose, where webbing cannot stay put? */
export function barricadeIsSlipStation(p: BarricadeWrapProfile, x: number): boolean {
    return p.touched && p.slipRight > p.slipLeft && x > p.slipLeft && x < p.slipRight;
}

/** Where one engaging loop hangs, once the airframe has shoved it aside. */
export interface BarricadeLoopStation {
    /** Lateral station the loop is laced at when the net is clear. */
    restX: number;
    /** Where it has been pushed to. */
    x: number;
    /** Hang points on the load straps at {@link x}. */
    node: BarricadeWebNode;
    /** True when the fuselage parted this loop rather than catching it. */
    slid: boolean;
}

/** Interpolate the load straps at an arbitrary lateral station. */
export function barricadeStrapNodeAt(
    web: readonly BarricadeWebNode[],
    x: number,
): BarricadeWebNode {
    if (x <= web[0].x) return { ...web[0], x };
    const last = web[web.length - 1];
    if (x >= last.x) return { ...last, x };
    for (let i = 1; i < web.length; i++) {
        if (x > web[i].x) continue;
        const a = web[i - 1];
        const b = web[i];
        const t = (x - a.x) / Math.max(1e-9, b.x - a.x);
        return {
            x,
            topY: a.topY + (b.topY - a.topY) * t,
            topZ: a.topZ + (b.topZ - a.topZ) * t,
            botY: a.botY + (b.botY - a.botY) * t,
            botZ: a.botZ + (b.botZ - a.botZ) * t,
        };
    }
    return { ...last, x };
}

/**
 * Place every engaging loop, accounting for the fuselage parting the webbing.
 *
 * The loops are not fixed to the load straps — they ride them on D-ring
 * fittings and are free to run along. A fuselage driving through the net does
 * not stretch the loops in its path, it shoulders them aside; they slide out to
 * the flanks and bunch there, which is how the load ends up on the wings.
 *
 * Loops outside the parting band stay exactly where they were laced.
 */
export function barricadeLoopStations(
    web: readonly BarricadeWebNode[],
    profile?: BarricadeWrapProfile | null,
): BarricadeLoopStation[] {
    // The loops are whatever the web was built with — the stanchion nodes at
    // either end are not loops.
    const rest = web.slice(1, -1).map(n => n.x);
    const inner = rest[rest.length - 1];
    const outer = rest[0];
    const wrap = profile?.touched && profile.finalized && profile.slipRight > profile.slipLeft
        ? profile
        : null;
    if (!wrap) {
        return rest.map(x => ({ restX: x, x, node: barricadeStrapNodeAt(web, x), slid: false }));
    }

    const mid = (wrap.slipLeft + wrap.slipRight) * 0.5;
    const out: BarricadeLoopStation[] = rest.map(x => ({
        restX: x, x, node: web[0], slid: false,
    }));

    // A loop is sewn to the load strap and never travels along it. Whatever the
    // airframe does, every stripe stays on the station it was laced at — the
    // strap pays out to reach round the aircraft instead. Loops shifting
    // sideways as an aircraft settles into the net reads as the webbing
    // sliding, which is not what webbing sewn to a strap does.
    void mid;
    for (const st of out) st.node = barricadeStrapNodeAt(web, st.x);
    return out;
}

/**
 * Clamp a raw deck probe to the flight deck the rig was fitted to.
 *
 * Keeps the webbing on the deck if a node's probe lands on the island or falls
 * off the edge into open water — real deck, with its slight camber, passes
 * through untouched.
 */
export function barricadeSeatOnDeck(rig: BarricadeRig, sampled: number): number {
    const lo = rig.deckY - BARRICADE_DECK_BAND_M;
    const hi = rig.deckY + BARRICADE_DECK_BAND_M;
    return sampled < lo ? lo : sampled > hi ? hi : sampled;
}

/** Where the webbing panel ends up once the belt has taken its bight. */
export interface BarricadeBeltLay {
    /** Lateral station of every engaging loop. */
    loopX: number[];
    /** Lateral station of each end of the webbing panel. */
    startX: number;
    endX: number;
    /** Bare wire paid out between each stanchion and the belt (m). */
    wireLeftM: number;
    wireRightM: number;
}

/** Samples used to measure the belt's arc length across the rig. */
const BELT_ARC_SAMPLES = 240;
const _beltX: number[] = [];
const _beltArc: number[] = [];
const _beltPull: number[] = [];

/**
 * Lay the webbing panel out along the deformed load strap.
 *
 * The belt does not stretch. Its length is fixed and the loops are sewn to it,
 * so no loop ever changes its position *along the belt* — what changes is where
 * the belt lies. Driven into a bight round an airframe, the belt spends length
 * running downfield and back, so the lateral span it covers has to shrink: both
 * ends draw inboard and every loop with them, keeping its own spacing along the
 * webbing.
 *
 * The slack is made up by the wire between each stanchion and the end of the
 * panel, which pays out from the arresting engine exactly as a purchase cable
 * does. That wire is the only part of the run that gets longer.
 *
 * @param pullAt Downfield offset of the strap at a lateral station.
 */
export function layBarricadeBelt(
    rig: BarricadeRig,
    pullAt: (x: number) => number,
): BarricadeBeltLay {
    const restStart = rig.midX - rig.webHalfWidth;
    const beltLen = 2 * rig.webHalfWidth;

    // Cumulative arc length of the strap across the whole rig.
    _beltX.length = 0;
    _beltArc.length = 0;
    const step = (rig.rightX - rig.leftX) / BELT_ARC_SAMPLES;
    _beltPull.length = 0;
    let prevZ = pullAt(rig.leftX);
    let arc = 0;
    _beltX.push(rig.leftX);
    _beltArc.push(0);
    _beltPull.push(prevZ);
    for (let i = 1; i <= BELT_ARC_SAMPLES; i++) {
        const x = rig.leftX + i * step;
        const z = pullAt(x);
        arc += Math.hypot(step, z - prevZ);
        prevZ = z;
        _beltX.push(x);
        _beltArc.push(arc);
        _beltPull.push(z);
    }

    /** Arc length from the left stanchion to a lateral station. */
    const arcAt = (x: number): number => {
        if (x <= _beltX[0]) return 0;
        const last = _beltX.length - 1;
        if (x >= _beltX[last]) return _beltArc[last];
        const i = Math.min(last, Math.max(1, Math.ceil((x - rig.leftX) / step)));
        const t = (x - _beltX[i - 1]) / step;
        return _beltArc[i - 1] + (_beltArc[i] - _beltArc[i - 1]) * t;
    };

    /** Lateral station at a given arc length from the left stanchion. */
    const xAtArc = (s: number): number => {
        const last = _beltArc.length - 1;
        if (s <= 0) return _beltX[0];
        if (s >= _beltArc[last]) return _beltX[last];
        let lo = 0;
        let hi = last;
        while (lo + 1 < hi) {
            const mid = (lo + hi) >> 1;
            if (_beltArc[mid] <= s) lo = mid;
            else hi = mid;
        }
        const span = _beltArc[hi] - _beltArc[lo];
        const t = span > 1e-9 ? (s - _beltArc[lo]) / span : 0;
        return _beltX[lo] + (_beltX[hi] - _beltX[lo]) * t;
    };

    const restEnd = restStart + beltLen;
    const excess = (arcAt(restEnd) - arcAt(restStart)) - beltLen;
    if (excess <= 1e-6) {
        // Strap undeformed: the panel is exactly as rigged. Returning the laced
        // stations verbatim keeps a clear net bit-identical to the rig rather
        // than nudged by the arc-length round trip, and skips the search.
        return {
            loopX: rig.loopX.slice(),
            startX: restStart,
            endX: restEnd,
            wireLeftM: Math.hypot(restStart - rig.leftX, pullAt(restStart) - pullAt(rig.leftX)),
            wireRightM: Math.hypot(rig.rightX - restEnd, pullAt(rig.rightX) - pullAt(restEnd)),
        };
    }

    // The airframe pins the webbing it is holding: that material cannot slide
    // past the thing pressing on it, and wire feeds in from *both* masts to
    // supply the bight. So the belt is measured outward from there.
    //
    // Anchoring at one end instead — the obvious thing, and what this used to
    // do — makes the whole lacing slide toward that end whenever the bight is
    // off centre, which is not the belt narrowing but the net translating.
    let anchorX = rig.midX;
    let deepest = -Infinity;
    for (let i = 0; i < _beltX.length; i++) {
        if (_beltPull[i] > deepest) {
            deepest = _beltPull[i];
            anchorX = _beltX[i];
        }
    }
    anchorX = Math.max(restStart, Math.min(restEnd, anchorX));

    // Arc along the rest belt from its left end to the pinned material.
    const anchorRest = anchorX - restStart;
    const anchorArc = arcAt(anchorX);

    /** Lateral station of the material sewn `restFromStart` along the belt. */
    const atRest = (restFromStart: number) =>
        xAtArc(anchorArc + (restFromStart - anchorRest));

    const startX = atRest(0);
    const loopX = rig.loopX.map(x => atRest(x - restStart));
    const endX = atRest(beltLen);

    return {
        loopX,
        startX,
        endX,
        wireLeftM: Math.hypot(startX - rig.leftX, pullAt(startX) - pullAt(rig.leftX)),
        wireRightM: Math.hypot(rig.rightX - endX, pullAt(rig.rightX) - pullAt(endX)),
    };
}

/** Droop at the middle of a slack wire run, as a fraction of its length. */
export const BARRICADE_WIRE_SAG_FRAC = 0.055;

/** Downfield pull (m) by which the arresting engine has pulled a wire run straight. */
export const BARRICADE_WIRE_TAUT_PULL_M = 2.5;

/** Points sampled along each bare wire run, ends included. */
export const BARRICADE_WIRE_SAMPLES = 6;

/**
 * Sample the bare wire between a stanchion and the end of the webbing panel.
 *
 * Rigged and idle there is nothing pulling on it, so it hangs in a shallow
 * catenary off the sheave. Once an aircraft is in the net the arresting engine
 * has the purchase cable in tension and the run comes straight — which is also
 * when it is longest, since this is the length that pays out as the belt takes
 * its bight.
 *
 * @param pullM Downfield offset of the panel end; stands in for the tension.
 */
export function barricadeWireCurve(
    stanchion: { x: number; y: number; z: number },
    panelEnd: { x: number; y: number; z: number },
    pullM: number,
    samples: number = BARRICADE_WIRE_SAMPLES,
    out: { x: number; y: number; z: number }[] = [],
): { x: number; y: number; z: number }[] {
    const n = Math.max(2, samples | 0);
    const run = Math.hypot(panelEnd.x - stanchion.x, panelEnd.y - stanchion.y,
        panelEnd.z - stanchion.z);
    const slack = Math.max(0, 1 - Math.abs(pullM) / BARRICADE_WIRE_TAUT_PULL_M);
    const sag = run * BARRICADE_WIRE_SAG_FRAC * slack;
    out.length = 0;
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        // 4t(1-t) is the parabola pinned at both ends, peaking mid-run.
        const droop = sag * 4 * t * (1 - t);
        out.push({
            x: stanchion.x + (panelEnd.x - stanchion.x) * t,
            y: stanchion.y + (panelEnd.y - stanchion.y) * t - droop,
            z: stanchion.z + (panelEnd.z - stanchion.z) * t,
        });
    }
    return out;
}
