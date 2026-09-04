/**
 * Physical model of a rigged carrier barricade: belts, stripes and wires as a
 * constrained particle system rather than a set of fitted curves.
 *
 * The rig is three kinds of webbing and one kind of cable, and each obeys one
 * rule:
 *
 *  - The two **load belts** run mast to mast. They are cut to length and do not
 *    stretch, so they are chains of rope constraints — driven into a bight round
 *    an airframe they cover less deck and draw inboard, because there is no
 *    other way for a fixed length to reach.
 *  - The **stripes** (engaging loops) are sewn to the belts, so a stripe's two
 *    end particles *are* belt nodes. They too are inextensible, and they are cut
 *    longer than the gap they span — that surplus is what lets them belly aft
 *    when the net is clear and wrap a wing when it is not.
 *  - The **wires** from each mast are the only extensible run, and they do not
 *    stretch either: they *pay out*, off a sheave against the arresting engine's
 *    holding force. Runout distance is therefore something the rig arrives at,
 *    not a number written down in advance.
 *
 * Everything else is left to gravity, the wind over the deck, and contact:
 *
 *  - Belt sag, stripe drape and the festoon of a slack stripe are gravity.
 *  - The aft bow of a rigged net is the wind over the deck. The ship steams into
 *    wind toward −Z, so in her own frame the air runs aft (+Z) and the webbing
 *    bellies toward the groove. The belts are thin cable and barely feel it; the
 *    stripes are wide flat nylon and feel it a lot, which is the whole reason a
 *    rigged barricade reads as a curtain of ribs.
 *  - Wrapping a wing is friction against the real collision hull. Webbing driven
 *    onto a leading edge is dragged round it and grips; webbing driven onto a
 *    fuselage is narrow enough to part the stripes and pass between them. Both
 *    fall out of contact, neither is special-cased.
 *
 * Integration is small-steps XPBD (Müller et al., *Small Steps in Physics
 * Simulation*, 2019): many substeps, one Gauss–Seidel pass each. That is what
 * makes stiff inextensible chains stable at the closure speeds involved without
 * a high iteration count. Solving in XPBD form rather than plain PBD also leaves
 * a real Lagrange multiplier on every constraint, so webbing *tension* is a
 * quantity the rig can be asked for — which is what the arresting engine's
 * payout law and the load on the airframe are both computed from.
 *
 * All state is carrier-local, the same frame as {@link ./barricade}. Positions
 * are Float64 so that length conservation survives a long arrestment; the
 * transferable Float32 view for the renderer is taken on the way out.
 */
import * as THREE from 'three';
import { AircraftCollisionMesh } from './aircraftDef';
import {
    BvhClosest,
    BvhHit,
    TriangleBvh,
    bvhClosest,
    bvhClosestPoint,
    bvhContainsPoint,
    bvhHit,
    bvhSegmentHit,
} from '../../physics/collision/triangleBvh';

/** Gravity in carrier-local Y (m/s²). */
export const BARRICADE_GRAVITY = 9.81;

/**
 * Wind over the deck in carrier-local Z (m/s).
 *
 * A carrier turns into wind for flight operations, so in her own frame the air
 * runs from bow to stern — aft, toward the groove, which is +Z here. Roughly
 * 25 kt over the deck.
 */
export const BARRICADE_DECK_WIND_MPS = 13;

/**
 * Default substeps per {@link BarricadeSolver.step}.
 *
 * The hardest case is not the rigged net but an arrestment, where the webbing is
 * pulled between an airframe and two masts hard enough that a coarse solve
 * simply cannot keep up: at 16 the residual reads as a stripe stretched 65% and
 * a belt 5%, neither of which is the material giving — it is the solver failing.
 * At 32 both resolve. Raising the webbing's own stiffness does almost nothing
 * (65% -> 55% for four times the modulus), which is what says it is residual.
 *
 * On the rigged net it also settles the upper belt's droop: 0.46 m at 16, 0.36
 * at 24, 0.30 at 32, and no better beyond. An idle net runs at a coarser cadence
 * anyway, so most of this cost lands only while something is in the webbing.
 */
export const BARRICADE_SUBSTEPS = 32;

/** Default constraint sweeps per substep; direction alternates, so keep it even. */
export const BARRICADE_SOLVER_PASSES = 6;

/** Longest step the solver will take in one go (s); longer calls are split. */
export const BARRICADE_MAX_STEP_S = 1 / 30;

/**
 * How far webbing sits off the skin it is lying on (m).
 *
 * Strap and hull cannot occupy the same plane, and a particle resting exactly
 * on a triangle flickers in and out of contact.
 */
export const BARRICADE_SKIN_M = 0.04;

/**
 * Coulomb friction between webbing and airframe skin.
 *
 * Nylon on aluminium, so a real number rather than a large one. It was 0.85 for
 * as long as the clamp using it was inverted and the value made no difference to
 * anything; with the clamp fixed it grips, and 0.85 grips hard enough to sling
 * an off-centre catch clean across the deck.
 */
export const BARRICADE_HULL_FRICTION = 0.65;

/**
 * Smallest wing half-span a stand-in hull is built to (m).
 *
 * A floor rather than a guess: carrier aircraft run from about eight metres of
 * span upward, and the alternative is sizing the substitute from a span that was
 * measured off the very hull it is replacing.
 */
export const BARRICADE_MIN_FALLBACK_HALF_SPAN_M = 4;

/**
 * Give of a wire's interior segments (m/N).
 *
 * Deliberately floppy: they exist so a bare run hangs in a catenary when the net
 * is idle. The load belongs to the end-to-end constraint, and a hanger stiff
 * enough to compete for it is a hanger that stops the cable paying out.
 */
const WIRE_HANGER_COMPLIANCE = 1e-4;

/** Coulomb friction between webbing and the flight deck. */
export const BARRICADE_DECK_FRICTION = 0.6;

/**
 * Closest two stripe fittings can bunch on a belt (m).
 *
 * The fittings have width and cannot pass through one another, so a run of
 * stripes shouldered aside by a fuselage piles up against its neighbours
 * instead of merging into one another.
 */
export const BARRICADE_FITTING_GAP_M = 0.12;

/**
 * How far a fitting must be pulled before it moves along the belt at all (m).
 *
 * Stiction. Without it a fitting chases the belt's every millimetre of settling
 * and the whole panel creeps sideways for as long as it is rigged — centimetres
 * a second, which is nothing to look at for a moment and several metres by the
 * time an aircraft turns up.
 *
 * Set to 0.015m: balances stripe stability against belt motion (prevents
 * drift during settling, ~1.5cm threshold) with stripe engagement during
 * aircraft impact (impact forces >> settling forces, easily overcomes 1.5cm).
 * Original 0.02m prevented aircraft engagement; 0.005m was too low and allowed drift.
 */
export const BARRICADE_FITTING_STICTION_M = 0.015;

/**
 * Shortest an engine may wind its wire, as a fraction of the rigged run.
 *
 * A backstop, not a working limit: pre-tensioning takes up centimetres, and
 * anything wanting to haul the panel halfway to its own mast has gone wrong.
 */
const BARRICADE_MIN_WIRE_FRAC = 0.5;

/** Velocity retained per second while a fresh assembly is being laced. */
const SETTLE_DAMPING = 12;

/** Frames of settling {@link BarricadeSolver.reset} runs before handing the rig over. */
const SETTLE_STEPS = 180;

/** Scratch for the gap measurements a lacing pass takes. */
const _gaps: number[] = [];


/** Geometry and material of one rigged barricade. */
export interface BarricadeSolverSpec {
    /** Stanchion stations in carrier-local X. */
    leftX: number;
    rightX: number;
    /** Half-width of the webbing panel; the rest of the span is bare wire. */
    webHalfWidth: number;
    /** Carrier-local Z of the hinge line the stanchions swing about. */
    planeZ: number;
    /** Flight-deck surface in carrier-local Y under the rig. */
    deckY: number;
    /** Webbing height above the deck when fully raised (m). */
    height: number;
    /** Lower belt's height above the deck when fully raised (m). */
    lowerLift: number;
    /** Engaging stripes across the panel. */
    stripes: number;
    /** Particles along one stripe, both belt nodes included. */
    stripeNodes: number;
    /**
     * Belt segments between adjacent stripe stations.
     *
     * One is usually right. The belt only has to form the overall bight, which
     * is metres across; it is the stripes that wrap anything. Subdividing it
     * lengthens the chain the solver has to carry tension along, which costs
     * accuracy and time for detail nothing needs.
     */
    beltSegmentsPerStripe: number;
    /** Interior particles on each bare wire run. */
    wireNodes: number;
    /**
     * Deck tie-downs holding the lower belt down along its length.
     *
     * Without them the rig has no answer to its own stripes: both belts are
     * held only at their ends, so stripe tension hauls them toward each other
     * until the stripes go slack, and a net cut shorter simply pulls them
     * closer still. Nothing about that equilibrium is taut. The lower load
     * strap is what breaks it — pinned to deck fittings across the landing
     * area, it cannot be lifted, so the stripes have something to hang from
     * and the panel stands to its full height.
     */
    tieDowns: number;
    /**
     * Load at which a tie-down parts (N).
     *
     * They are there to hold the rigged net down, not to hold an aeroplane.
     * The whole point of a barricade is that the webbing goes *with* the
     * airframe and runs out down the deck, so the fittings have to let go —
     * well below what the arresting engines hold, or the net would tear itself
     * apart against its own deck anchors rather than pay out.
     */
    tieDownBreakN: number;
    /**
     * Load at which auxiliary cables snap (N).
     *
     * The upper structure is held by auxiliary cables that are intentionally
     * designed to fail under excessive load to prevent catastrophic damage
     * to the ship when an aircraft is caught by the barricade.
     */
    auxCableBreakN: number;
    /**
     * How fast a stripe fitting can travel along a belt (m/s).
     *
     * The stripes are not sewn to the belts, they ride them on fittings, and
     * this is what a barricade is *for*. A fuselage is two and a half metres
     * across — narrower than a few stripe spacings — so it does not gather the
     * webbing, it shoulders it aside, and the stripes run outboard until they
     * bunch on something broad enough to hold: the wings. Pin them and the
     * physics has no answer for a fuselage arriving at a stripe that cannot get
     * out of its way, so the webbing simply tears instead of catching.
     *
     * Not free-running, because the fittings bind under load: this is the creep
     * rate, and it is what decides how much of the load ends up on the wings
     * rather than on the nose.
     */
    slideSpeed: number;
    /**
     * Surplus stripe length as a fraction of the gap the stripe actually spans.
     *
     * A stripe cut exactly to the gap would stand as a taut bar. The surplus is
     * what bellies aft when the net is clear and what pays out to reach round a
     * wing when it is not.
     *
     * Tempting to turn down — it is the obvious lever on how much the rigged net
     * wobbles — and it costs more than it looks. With the lower belt tied down
     * the net no longer collapses when it is cut short, but the surplus is what
     * lets a stripe be *shoved aside*: at 3% the fuselage stopped parting the
     * webbing altogether, which is the behaviour the whole gear is built around.
     * The belly is the price of the parting.
     */
    stripeSlack: number;
    /**
     * Surplus belt length as a fraction of the panel width.
     *
     * Tiny, but it cannot be zero: a belt cut exactly to the gap between two
     * taut wires has to stand dead straight, and a rigged barricade visibly
     * sags. A shallow-sag cable needs only about a thousandth of its length —
     * mid-span sag runs as the square root of this, so 4e-4 over a 100 ft panel
     * is roughly the 0.37 m a rigged net droops.
     */
    beltSlack: number;
    /**
     * Axial stiffness of a stripe (N at 100% strain).
     *
     * The stripes are nylon, and nylon stretches. Wide webbing runs to something
     * like a tenth of its length at working load, which is why the assembly is
     * expendable — it comes out of an arrestment too far gone to re-rig. The
     * belts and the wires are steel and get no compliance at all, which is the
     * distinction that matters: the load path is a stretchy net on inextensible
     * cable, not a uniformly rubbery one.
     *
     * It also earns its keep numerically. A perfectly rigid run driven by a
     * fuselage it cannot get out of the way of has no solution the solver can
     * reach, and the residual comes out as a bogus stretch far larger than the
     * real webbing would ever show.
     */
    stripeAxialStiffnessN: number;
    /** Mass of one stripe particle (kg). */
    stripeMass: number;
    /** Mass of one belt node (kg). */
    beltMass: number;
    /** Mass of one wire node (kg). */
    wireMass: number;
    /** Wind coupling of a stripe particle (1/s) — wide flat nylon. */
    stripeDrag: number;
    /** Wind coupling of a belt or wire node (1/s) — bare cable. */
    cableDrag: number;
    /**
     * Force each wire holds before the arresting engine lets it run (N).
     *
     * Below this the rig simply holds; above it the cable pays out and the
     * aircraft is decelerated by the engine rather than stopped by the webbing.
     * Four wires at this figure come to roughly the 200 kN that takes a fighter
     * off 60 m/s in the length of a flight deck.
     */
    engineHoldN: number;
    /**
     * Fastest the drum will turn (m/s).
     *
     * The engine is a constant-force machine: it lets cable go at whatever rate
     * is demanded and keeps the tension at {@link engineHoldN} while it does,
     * which is what spreads an arrestment over a hundred metres of deck instead
     * of a metre. This is only the mechanical ceiling on that — reach it and the
     * cable genuinely cannot keep up, and the shortfall starts landing on the
     * webbing instead.
     */
    enginePayoutMaxMps: number;
    /**
     * Tension the engines hold the rigged belts at (N).
     *
     * What *would* make a rigged barricade taut, and is off because it cannot
     * be made stable. A cable hanging between two masts sags by wL²/8T, so a
     * belt carrying only its own weight droops a third of a metre across the
     * landing area and every stripe hung on it has that much slack to wave
     * about with; wound to 22 kN it sags a third as far.
     *
     * The trouble is the arrestment. A winch holding a set point has to stop
     * holding it the moment the net is loaded, and every way of drawing that
     * line leaves the drum hauling on some substeps and paying out on others.
     * Measured, that put a *centred* trap five metres off the centreline and,
     * before the retract was gated on the net being clear, spun it most of a
     * half turn. Set this above zero and the rigged net does come taut — and
     * the arrestment stops being trustworthy.
     */
    enginePreTensionN: number;
    /**
     * How fast the engine winds cable back in when nothing is overhauling it (m/s).
     *
     * An arresting engine is a *retracting* system: between arrestments it holds
     * the purchase cable in and the webbing out, which is what makes a rigged
     * barricade stand up taut rather than hang. Without it the payout ratchets —
     * length only ever comes off the drum, so every transient while the
     * stanchions swing up is permanent, the slack accumulates, and the wind over
     * the deck lays the whole panel out flat sixty metres downwind.
     *
     * Slow next to the tens of metres a second an arrestment pays out at, so it
     * does nothing to the run-out and everything to the rigged net.
     */
    engineRetractMps: number;
    /**
     * Axial stiffness of a purchase cable (N at 100% strain).
     *
     * Steel, so this is enormous next to the webbing's and the cable counts as
     * inextensible for every practical purpose. It is here because it is what
     * turns the engine's holding *force* into a length the solver can aim at:
     * the wire is paid out until it is stretched exactly as far as
     * {@link engineHoldN} would stretch it, and no further.
     */
    wireAxialStiffnessN: number;
    /** Velocity retained per second by the webbing (aerodynamic-free damping). */
    damping: number;
    /**
     * Substeps per step.
     *
     * The one knob that buys both stiffness and contact accuracy: each substep
     * is a fresh solve of a smaller prediction, so an inextensible chain settles
     * closer to its cut length and a fast wing moves less between contact tests.
     */
    substeps: number;
    /** Constraint sweeps per substep; direction alternates, so keep this even. */
    solverPasses: number;
    /** Deck surface under a lateral station; defaults to a flat {@link deckY}. */
    deckYAt?: (x: number) => number;
}

/** Nominal rig: 24 stripes over a 100 ft panel on a 115 ft span, 20 ft tall. */
export function defaultBarricadeSolverSpec(
    partial: Partial<BarricadeSolverSpec> = {},
): BarricadeSolverSpec {
    return {
        leftX: -17.5,
        rightX: 17.5,
        webHalfWidth: 12.0,
        planeZ: 30,
        deckY: 13.55,
        height: 5.25,
        lowerLift: 0.45,
        stripes: 24,
        stripeNodes: 11,
        beltSegmentsPerStripe: 1,
        wireNodes: 3,
        tieDowns: 6,
        tieDownBreakN: 6000,
        auxCableBreakN: 15000,
        slideSpeed: 6,
        stripeSlack: 0.09,
        beltSlack: 4e-4,
        stripeAxialStiffnessN: 350000,
        stripeMass: 0.5,
        beltMass: 1.5,
        wireMass: 2,
        stripeDrag: 2.2,
        cableDrag: 0.25,
        engineHoldN: 45000,
        enginePayoutMaxMps: 80,
        enginePreTensionN: 0,
        engineRetractMps: 2,
        wireAxialStiffnessN: 50e6,
        damping: 0.6,
        substeps: BARRICADE_SUBSTEPS,
        solverPasses: BARRICADE_SOLVER_PASSES,
        ...partial,
    };
}

/**
 * Bare wire between each mast and the end of the webbing panel, as rigged (m).
 *
 * The panel is 100 ft across a 115 ft span, so a few feet of cable shows at each
 * end of a rigged barricade — it is in every photograph of one. It also gives
 * the wire somewhere to be: a panel laced right out to the masts leaves the
 * arresting engines pulling on a run of zero length, with no direction to pull
 * in until the net has already moved.
 */
export const BARRICADE_SOLVER_END_GAP_M = 2.26;

/**
 * Rig a barricade across a fitted stanchion span.
 *
 * The span comes from the deck — it is narrower than nominal wherever the
 * angled deck has been probed and found wanting — so the panel is sized off
 * whatever span there turned out to be, and never so wide that the wire runs
 * out of length.
 */
export function barricadeSolverSpecForRig(
    leftX: number,
    rightX: number,
    deckY: number,
    partial: Partial<BarricadeSolverSpec> = {},
): BarricadeSolverSpec {
    const halfSpan = Math.max(0.5, (rightX - leftX) * 0.5);
    return defaultBarricadeSolverSpec({
        leftX,
        rightX,
        deckY,
        webHalfWidth: Math.max(halfSpan * 0.5, halfSpan - BARRICADE_SOLVER_END_GAP_M),
        ...partial,
    });
}

/** The four bare wire runs, in the order the solver stores them. */
export const enum BarricadeWire {
    UPPER_LEFT = 0,
    UPPER_RIGHT = 1,
    LOWER_LEFT = 2,
    LOWER_RIGHT = 3,
}

/**
 * A stand-in hull for an airframe whose own is missing or unusable.
 *
 * Collision hulls are imported from the source model, and a few arrive broken —
 * a cube around the cockpit, or nothing at all. The webbing then collides with
 * whatever that is and passes clean through the wings, which is not a subtle
 * failure: it draws the net threaded through the aeroplane.
 *
 * Something the size and shape of the aircraft is far better than that, and the
 * barricade only ever needs the gross form anyway — a fuselage to part around
 * and a wing to gather on. Built from the wing span the flight model already
 * knows, so it fits the aircraft it stands in for.
 */
export function barricadeFallbackHull(wingHalfSpanM: number): AircraftCollisionMesh {
    // Floored, because the span is itself often derived from the broken hull
    // this is standing in for — a cockpit-sized hitbox reports a cockpit-sized
    // wing, and a stand-in built from that is no better than the thing it
    // replaces. Nothing that lands on a carrier is narrower than this.
    const halfSpan = Math.max(BARRICADE_MIN_FALLBACK_HALF_SPAN_M, wingHalfSpanM);
    const halfLen = halfSpan * 1.1;
    const box = (
        cx: number, cy: number, cz: number,
        hx: number, hy: number, hz: number,
    ): number[] => {
        const x0 = cx - hx, x1 = cx + hx;
        const y0 = cy - hy, y1 = cy + hy;
        const z0 = cz - hz, z1 = cz + hz;
        return [
            x0, y1, z0, x0, y1, z1, x1, y1, z1, x0, y1, z0, x1, y1, z1, x1, y1, z0,
            x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z0, x1, y0, z1, x0, y0, z1,
            x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z0, x1, y1, z1, x1, y0, z1,
            x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y0, z0, x0, y1, z1, x0, y1, z0,
            x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y0, z1, x1, y1, z1, x0, y1, z1,
            x0, y0, z0, x0, y1, z0, x1, y1, z0, x0, y0, z0, x1, y1, z0, x1, y0, z0,
        ];
    };
    const fuseHalfW = Math.max(0.9, halfSpan * 0.18);
    return {
        triangles: [
            ...box(0, 0, 0, fuseHalfW, 1.0, halfLen),
            ...box(0, -0.3, -halfLen * 0.08, halfSpan, 0.2, halfLen * 0.25),
        ],
        aabb: {
            min: [-halfSpan, -1.0, -halfLen],
            max: [halfSpan, 1.0, halfLen],
        },
    };
}

/**
 * Is this hull big enough to be the aircraft it belongs to?
 *
 * A hull barely wider than a cockpit is not a mis-modelled aeroplane, it is a
 * broken import, and colliding webbing against it is worse than not having one.
 */
export function barricadeHullIsUsable(
    mesh: AircraftCollisionMesh | undefined,
    wingHalfSpanM: number,
): mesh is AircraftCollisionMesh {
    if (!mesh || mesh.triangles.length < 9) return false;
    const { min, max } = mesh.aabb;
    return (max[0] - min[0]) >= Math.max(4, wingHalfSpanM)
        && (max[2] - min[2]) >= Math.max(4, wingHalfSpanM * 0.6);
}

/** Pose of the engaged airframe, body frame → carrier-local. */
export interface BarricadeAirframePose {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
}

/**
 * Where every particle of a rig sits in the flat position array.
 *
 * Split out from the solver because the two ends of the wire need it and only
 * one of them has a solver: the sim owns the rig and writes its particles into
 * the snapshot, and the renderer reads them back with no physics of its own.
 * Both work the layout out from the same spec, so neither has to be told it.
 */
export class BarricadeLayout {

    /** Belt nodes per belt: stripe stations plus the subdivisions between them. */
    readonly beltNodes: number;
    /** Particle count. */
    readonly count: number;

    /** Index of the first particle of each group. */
    readonly upperBelt0: number;
    readonly lowerBelt0: number;
    readonly stripe0: number;
    readonly wire0: number;
    readonly tieDown0: number;

    constructor(readonly spec: BarricadeSolverSpec) {
        const { stripes, stripeNodes, beltSegmentsPerStripe, wireNodes } = spec;
        this.beltNodes = (stripes - 1) * beltSegmentsPerStripe + 1;
        this.upperBelt0 = 4;
        this.lowerBelt0 = this.upperBelt0 + this.beltNodes;
        this.stripe0 = this.lowerBelt0 + this.beltNodes;
        // A stripe owns every one of its own particles, ends included: the ends
        // ride the belts rather than being part of them.
        this.wire0 = this.stripe0 + stripes * stripeNodes;
        this.tieDown0 = this.wire0 + 4 * wireNodes;
        this.count = this.tieDown0 + spec.tieDowns;
    }

    /** Particle index of belt node `i`, upper or lower. */
    beltNodeIndex(upper: boolean, i: number): number {
        return (upper ? this.upperBelt0 : this.lowerBelt0) + i;
    }

    /** Belt node a stripe is laced at when the net is clear. */
    stripeBeltNode(stripe: number): number {
        return stripe * this.spec.beltSegmentsPerStripe;
    }

    /**
     * Particle index of node `j` of stripe `s`, counted from the lower belt up.
     *
     * The two ends are the fittings that ride the belts. They are the stripe's
     * own particles, not the belt's, which is what lets a fuselage shoulder a
     * stripe out of its path.
     */
    stripeNodeIndex(s: number, j: number): number {
        const last = this.spec.stripeNodes - 1;
        const clamped = j <= 0 ? 0 : j >= last ? last : j;
        return this.stripe0 + s * this.spec.stripeNodes + clamped;
    }

    /** Particle index of the fitting stripe `s` rides on the given belt. */
    stripeFitting(s: number, upper: boolean): number {
        return this.stripeNodeIndex(s, upper ? this.spec.stripeNodes - 1 : 0);
    }

    /** Particle index of node `j` of wire `w`, counted from the stanchion out. */
    wireNodeIndex(w: BarricadeWire, j: number): number {
        const last = this.spec.wireNodes + 1;
        if (j <= 0) return w;
        if (j >= last) {
            const upper = w === BarricadeWire.UPPER_LEFT || w === BarricadeWire.UPPER_RIGHT;
            const left = w === BarricadeWire.UPPER_LEFT || w === BarricadeWire.LOWER_LEFT;
            return this.beltNodeIndex(upper, left ? 0 : this.beltNodes - 1);
        }
        return this.wire0 + w * this.spec.wireNodes + (j - 1);
    }

    /** Lateral station of belt node `i` on the rigged (undeformed) panel. */
    beltStationX(i: number): number {
        const mid = (this.spec.leftX + this.spec.rightX) * 0.5;
        const w = this.spec.webHalfWidth;
        return mid - w + (2 * w * i) / (this.beltNodes - 1);
    }

    /** Particle index of the deck fitting for tie-down `t`. */
    tieDownIndex(t: number): number {
        return this.tieDown0 + t;
    }

    /**
     * Lower-belt node that tie-down `t` is shackled to.
     *
     * Spread across the panel and kept off the two ends, which the wires to the
     * masts already hold.
     */
    tieDownBeltNode(t: number): number {
        const n = this.spec.tieDowns;
        if (n <= 0) return 0;
        const last = this.beltNodes - 1;
        // Mirrored about the centreline rather than rounded independently.
        // Rounding each station on its own put one fitting half a node off
        // centre, and a rig that is not symmetric does not behave symmetrically:
        // it showed up as the belt sitting off centre on a net nothing had
        // touched.
        const half = n >> 1;
        if (t < half) return Math.round(((t + 1) * last) / (n + 1));
        if (n % 2 === 1 && t === half) return Math.round(last / 2);
        return last - Math.round(((n - t) * last) / (n + 1));
    }
}

/** One rope constraint, as laid down while the rig is being laced. */
interface LacedConstraint {
    a: number;
    b: number;
    rest: number;
    /**
     * Give of the run, in metres of stretch per newton. Zero for steel; a
     * stripe's is its rest length over the webbing's axial stiffness, so a long
     * run yields proportionally more than a short one, as springs in series do.
     */
    compliance: number;
    /** Tension at which the run stops holding and starts running (N); 0 = never. */
    maxTension: number;
    /** Tension at which the run parts for good (N); 0 = never. */
    breakTension: number;
}

const _t0 = new THREE.Vector3();
const _t1 = new THREE.Vector3();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion();
const _iq0 = new THREE.Quaternion();
const _iq1 = new THREE.Quaternion();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _p = new THREE.Vector3();
const _s0 = new THREE.Vector3();
const _s1 = new THREE.Vector3();
const _hit: BvhHit = bvhHit();
const _near: BvhClosest = bvhClosest();

/**
 * One rigged barricade, simulated.
 *
 * Construct once per rig; {@link reset} lays the webbing out and settles it,
 * {@link setDeploy} swings the stanchions, {@link setAirframe} hands over the
 * aircraft in the net, and {@link step} advances time.
 */
export class BarricadeSolver {

    readonly spec: BarricadeSolverSpec;
    /** Where each particle lives in {@link pos}; shared with whatever draws it. */
    readonly layout: BarricadeLayout;

    /** Belt nodes per belt: stripe stations plus the subdivisions between them. */
    readonly beltNodes: number;
    /** Particle count. */
    readonly count: number;

    /** Positions, 3 per particle, carrier-local. */
    readonly pos: Float64Array;
    private readonly vel: Float64Array;
    /** Position at the start of the current substep. */
    private readonly prev: Float64Array;
    private readonly invMass: Float64Array;
    /**
     * Contact normal for this substep, 3 per particle, and the speed the skin
     * under it was going along that normal. Zero normal means no contact.
     *
     * Kept so the velocity update can treat a contact as a contact. Deriving
     * velocity from the whole positional correction turns a depenetration into
     * an impulse the size of however deep the strap had drifted, and at a
     * 0.5 ms substep a tenth of a metre of push-out reads back as 190 m/s: the
     * net stayed on the airframe for the whole run-out and was then flung clear
     * of it the instant the tension came off.
     */
    private readonly contactN: Float64Array;
    private readonly contactVn: Float64Array;
    /** Wind coupling rate per particle (1/s). */
    private readonly drag: Float64Array;

    /** Constraint endpoints, rest lengths and accumulated multipliers. */
    private readonly cA: Int32Array;
    private readonly cB: Int32Array;
    private readonly cRest: Float64Array;
    /** Rest length as laced; the wires scale off this as they pay out. */
    private readonly cRigged: Float64Array;
    /** Metres of give per newton; zero on everything made of steel. */
    private readonly cCompliance: Float64Array;
    /**
     * Most a run may carry before it stops resisting and simply gives (N).
     *
     * Only the wires have one: it is the arresting engine's holding force, and
     * capping the multiplier at it is what makes the engine an engine. Zero
     * means no limit, which is everything woven or shackled into the rig.
     */
    private readonly cMaxTension: Float64Array;
    /** Load at which a run parts for good (N); 0 = never. Only the tie-downs have one. */
    private readonly cBreak: Float64Array;
    /** Cleared when a run has parted, and not solved again until the net is re-laced. */
    private readonly cIntact: Uint8Array;
    /**
     * True while a fresh assembly is being laced onto the rig.
     *
     * Nothing parts during lacing. The break load models an aeroplane tearing
     * the fittings out of the deck, not the deck crew hauling the webbing up to
     * tension — and taking the net from slack to taut is momentarily a far
     * harder pull than holding it there, so an armed tie-down snaps on the
     * assembly it is supposed to be holding.
     */
    private lacing = false;
    private readonly cLambda: Float64Array;
    private readonly constraints: number;

    /** Constraint range belonging to each wire run. */
    private readonly wireFirst = new Int32Array(4);
    private readonly wireEnd = new Int32Array(4);
    /** Constraint ranges by material, for the per-run strain read-outs. */
    private beltCFirst = 0;
    private beltCEnd = 0;
    private stripeCFirst = 0;
    private stripeCEnd = 0;
    private tieCFirst = 0;
    private tieCEnd = 0;
    /** Rigged length of each bare wire run (m). */
    private readonly wireRest = new Float64Array(4);
    /** Cable let out by the arresting engine beyond the rigged run (m). */
    private readonly wirePayout = new Float64Array(4);
    /** Tension in each wire at the end of the last substep (N). */
    private readonly wireTensionN = new Float64Array(4);

    /** Arc position of each stripe's fitting along its belt (m from the port end). */
    private readonly uUpper: Float64Array;
    private readonly uLower: Float64Array;
    /** Cumulative arc length along each belt, rebuilt every attachment pass. */
    private readonly arcUpper: Float64Array;
    private readonly arcLower: Float64Array;

    private deploy = 0;
    /** Where the stanchions were when the current step began. */
    private deployFrom = 0;
    /** Live damping; {@link settle} raises it while a fresh rig is being laced. */
    private dampingRate: number;
    private bvh: TriangleBvh | null = null;
    private hasPose = false;
    private readonly poseT0 = new THREE.Vector3();
    private readonly poseT1 = new THREE.Vector3();
    private readonly poseQ0 = new THREE.Quaternion();
    private readonly poseQ1 = new THREE.Quaternion();

    /** Force and moment the webbing put on the airframe over the last step. */
    private readonly forceOnAirframe = new THREE.Vector3();
    private readonly torqueOnAirframe = new THREE.Vector3();
    private readonly _impulse = new THREE.Vector3();
    private readonly _arm = new THREE.Vector3();
    private readonly _moment = new THREE.Vector3();

    constructor(spec: BarricadeSolverSpec = defaultBarricadeSolverSpec()) {
        this.spec = spec;
        this.dampingRate = spec.damping;
        this.layout = new BarricadeLayout(spec);
        const { stripes, wireNodes } = spec;
        this.beltNodes = this.layout.beltNodes;
        this.count = this.layout.count;

        this.uUpper = new Float64Array(stripes);
        this.uLower = new Float64Array(stripes);
        this.arcUpper = new Float64Array(this.beltNodes);
        this.arcLower = new Float64Array(this.beltNodes);

        this.pos = new Float64Array(this.count * 3);
        this.vel = new Float64Array(this.count * 3);
        this.prev = new Float64Array(this.count * 3);
        this.contactN = new Float64Array(this.count * 3);
        this.contactVn = new Float64Array(this.count);
        this.invMass = new Float64Array(this.count);
        this.drag = new Float64Array(this.count);

        // Anchors are the stanchion fittings: driven, never solved for.
        for (let i = 0; i < 4; i++) {
            this.invMass[i] = 0;
            this.drag[i] = 0;
        }
        for (let i = 4; i < this.layout.stripe0; i++) {
            this.invMass[i] = 1 / spec.beltMass;
            this.drag[i] = spec.cableDrag;
        }
        for (let i = this.layout.stripe0; i < this.layout.wire0; i++) {
            this.invMass[i] = 1 / spec.stripeMass;
            this.drag[i] = spec.stripeDrag;
        }
        for (let i = this.layout.wire0; i < this.layout.tieDown0; i++) {
            this.invMass[i] = 1 / spec.wireMass;
            this.drag[i] = spec.cableDrag;
        }
        // Deck fittings: bolted to the ship, like the stanchion hinges.
        for (let i = this.layout.tieDown0; i < this.count; i++) {
            this.invMass[i] = 0;
            this.drag[i] = 0;
        }

        const laced = this.lace();
        this.constraints = laced.length;
        this.cA = new Int32Array(this.constraints);
        this.cB = new Int32Array(this.constraints);
        this.cRest = new Float64Array(this.constraints);
        this.cRigged = new Float64Array(this.constraints);
        this.cCompliance = new Float64Array(this.constraints);
        this.cMaxTension = new Float64Array(this.constraints);
        this.cBreak = new Float64Array(this.constraints);
        this.cIntact = new Uint8Array(this.constraints).fill(1);
        this.cLambda = new Float64Array(this.constraints);
        for (let c = 0; c < this.constraints; c++) {
            this.cA[c] = laced[c].a;
            this.cB[c] = laced[c].b;
            this.cRest[c] = laced[c].rest;
            this.cRigged[c] = laced[c].rest;
            this.cCompliance[c] = laced[c].compliance;
            this.cMaxTension[c] = laced[c].maxTension;
            this.cBreak[c] = laced[c].breakTension;
        }

        this.reset(0);
    }

    // ---- topology --------------------------------------------------------

    /** Particle index of belt node `i`, upper or lower. */
    beltNodeIndex(upper: boolean, i: number): number {
        return this.layout.beltNodeIndex(upper, i);
    }

    /** Belt node a stripe is laced at when the net is clear. */
    stripeBeltNode(stripe: number): number {
        return this.layout.stripeBeltNode(stripe);
    }

    /** Particle index of node `j` of stripe `s`, counted from the lower belt up. */
    stripeNodeIndex(s: number, j: number): number {
        return this.layout.stripeNodeIndex(s, j);
    }

    /** Particle index of the fitting stripe `s` rides on the given belt. */
    stripeFitting(s: number, upper: boolean): number {
        return this.layout.stripeFitting(s, upper);
    }

    /** How far along the belt a stripe's fitting has run (m from the port end). */
    stripeSlide(s: number, upper: boolean): number {
        return (upper ? this.uUpper : this.uLower)[s];
    }

    /** Particle index of node `j` of wire `w`, counted from the stanchion out. */
    wireNodeIndex(w: BarricadeWire, j: number): number {
        return this.layout.wireNodeIndex(w, j);
    }

    /** Lateral station of belt node `i` on the rigged (undeformed) panel. */
    beltStationX(i: number): number {
        return this.layout.beltStationX(i);
    }

    /**
     * Copy the rig's particles out for the hop to whatever draws them.
     *
     * Float32 is the width the snapshot carries, and plenty: these are metres
     * of carrier-local position, so the rounding is well under a millimetre and
     * nowhere near anything the eye or the solver depends on. The solver keeps
     * Float64 internally, where length conservation over a long arrestment does
     * depend on it.
     */
    writeTo(out: Float32Array, offset = 0): number {
        const n = this.count * 3;
        for (let i = 0; i < n; i++) out[offset + i] = this.pos[i];
        return n;
    }

    /**
     * Lace one run of webbing: the segments themselves, plus the reach
     * constraints that make it behave like a single cut length.
     *
     * A chain solved by one Gauss–Seidel pass per substep passes tension along
     * one node at a time, so a forty-seven node belt under four tonnes of sag
     * load settles several percent long — which is a belt that stretches, and
     * the whole point is that it does not. The fix is to also constrain node
     * *i* to node *i + 2, + 4, + 8 …* and finally end to end, each capped at
     * the webbing actually cut between them. None of these can over-constrain
     * anything: a slack run's chord is shorter than its arc by definition, so
     * they sit idle until the run is genuinely pulled straight. Coarse first,
     * fine last, so a pass settles the long haul and then cleans up locally.
     */
    private static chain(
        out: LacedConstraint[],
        nodes: number[],
        segRest: number[],
        axialStiffnessN = 0,
        maxTension = 0,
    ): void {
        const n = nodes.length;
        const cut = [0];
        for (let i = 0; i < segRest.length; i++) cut.push(cut[i] + segRest[i]);

        const strides = new Set<number>([n - 1]);
        if (maxTension <= 0) {
            for (let s = 1; s < n - 1; s <<= 1) strides.add(s);
        } else {
            // A capped run carries its load on the end-to-end constraint and
            // hangs its interior particles on soft segments.
            //
            // The segments used to be the whole run, on the reasoning that
            // capping each of a series caps the series. True of the force — and
            // useless, because a chain of four short segments through 2 kg nodes
            // cannot *propagate* a load in two Gauss-Seidel passes. Measured,
            // the wires then never paid out at all through an entire arrestment
            // and the panel ends were dragged downfield as though untethered, so
            // the net closed up round the fuselage instead of staying spread
            // across the deck for the wings to catch.
            strides.add(1);
        }
        for (const stride of [...strides].sort((a, b) => b - a)) {
            for (let i = 0; i + stride < n; i++) {
                const rest = cut[i + stride] - cut[i];
                // On a capped run only the full span carries load; the rest
                // are hangers, soft enough not to fight it for the job.
                const spanning = maxTension <= 0 || stride === n - 1;
                out.push({
                    a: nodes[i],
                    b: nodes[i + stride],
                    rest,
                    compliance: spanning
                        ? (axialStiffnessN > 0 ? rest / axialStiffnessN : 0)
                        : WIRE_HANGER_COMPLIANCE,
                    maxTension: spanning ? maxTension : 0,
                    breakTension: 0,
                });
            }
        }
    }

    /** Wire runs from the mast to the panel; nothing else changes length. */
    private lace(): LacedConstraint[] {
        const { stripes, stripeNodes, wireNodes, height, lowerLift, stripeSlack } = this.spec;
        const out: LacedConstraint[] = [];
        const nodes: number[] = [];
        const rests: number[] = [];

        // Wires first: they are what holds the panel out to the masts, so the
        // rest of the pass works from ends that are already where they belong.
        // Lower wires are arresting cables (hold aircraft load), upper are auxiliary cables.
        const bare = Math.max(
            0.25,
            (this.spec.rightX - this.spec.leftX) * 0.5 - this.spec.webHalfWidth,
        );
        const upperWireLength = 4.8; // Auxiliary cables are 4.8m
        for (let w = 0; w < 4; w++) {
            this.wireFirst[w] = out.length;
            const isUpperWire = w < BarricadeWire.LOWER_LEFT;
            const wireLength = isUpperWire ? upperWireLength : bare;
            this.wireRest[w] = wireLength;
            nodes.length = 0;
            rests.length = 0;
            for (let j = 0; j <= wireNodes + 1; j++) nodes.push(this.wireNodeIndex(w, j));
            for (let j = 0; j <= wireNodes; j++) rests.push(wireLength / (wireNodes + 1));
            // Only lower wires (LOWER_LEFT=2, LOWER_RIGHT=3) are arresting cables with engine hold
            const isArrestingWire = w >= BarricadeWire.LOWER_LEFT;
            const maxTension = isArrestingWire ? this.spec.engineHoldN : 0;
            // Upper auxiliary cables are rigid (compliance = 0), lower wires use normal stiffness
            const stiffness = isArrestingWire ? this.spec.wireAxialStiffnessN : 0;
            const breakTension = isArrestingWire ? 0 : this.spec.auxCableBreakN;
            BarricadeSolver.chain(
                out, nodes, rests, stiffness, maxTension,
            );
            // Add break tension to auxiliary cable constraints
            if (breakTension > 0) {
                const start = this.wireFirst[w];
                const end = out.length;
                for (let c = start; c < end; c++) {
                    out[c].breakTension = breakTension;
                }
            }
            this.wireEnd[w] = out.length;
        }

        // Belts: fixed inextensible length, bar the slack that lets a rigged net
        // droop instead of standing like a drawn bowstring. Solved with multi-stride
        // distance constraints (no axial stiffness = infinite stiffness = fixed length).
        // The belts cannot stretch; only the arresting wires pay out to accommodate
        // the aircraft impact (max 100m extension).
        this.beltCFirst = out.length;
        const beltFactor = 1 + this.spec.beltSlack;
        for (const upper of [true, false]) {
            nodes.length = 0;
            rests.length = 0;
            for (let i = 0; i < this.beltNodes; i++) nodes.push(this.beltNodeIndex(upper, i));
            for (let i = 0; i + 1 < this.beltNodes; i++) {
                rests.push((this.beltStationX(i + 1) - this.beltStationX(i)) * beltFactor);
            }
            // Chain with axialStiffnessN=0 and maxTension=0 creates inextensible
            // constraints via multi-stride rigid distance constraints.
            BarricadeSolver.chain(out, nodes, rests);
        }

        this.beltCEnd = out.length;

        // Y connectors: upper belt bends down 90° to meet lower belt, and both
        // connect together to the arresting wire. Upper belt maintains vertical gap
        // by connecting upward from the junction point; lower belt is at junction.
        const upperBeltLeft = this.beltNodeIndex(true, 0);
        const upperBeltRight = this.beltNodeIndex(true, this.beltNodes - 1);
        const lowerBeltLeft = this.beltNodeIndex(false, 0);
        const lowerBeltRight = this.beltNodeIndex(false, this.beltNodes - 1);

        // Both belts connect to the same arresting wire endpoint (junction point)
        const wireLowerLeft = this.layout.wireNodeIndex(BarricadeWire.LOWER_LEFT, wireNodes + 1);
        const wireLowerRight = this.layout.wireNodeIndex(BarricadeWire.LOWER_RIGHT, wireNodes + 1);

        // Lower-left belt connects directly to wire
        out.push({
            a: lowerBeltLeft,
            b: wireLowerLeft,
            rest: 0,
            compliance: 0,
            maxTension: 0,
            breakTension: 0,
        });

        // Upper-left belt held above lower belt by auxiliary cable
        const gapBelts = height - lowerLift;
        out.push({
            a: upperBeltLeft,
            b: wireLowerLeft,
            rest: gapBelts,
            compliance: 0,
            maxTension: 0,
            breakTension: 0,
        });

        // Lower-right belt connects directly to wire
        out.push({
            a: lowerBeltRight,
            b: wireLowerRight,
            rest: 0,
            compliance: 0,
            maxTension: 0,
            breakTension: 0,
        });

        // Upper-right belt held above lower belt by auxiliary cable
        out.push({
            a: upperBeltRight,
            b: wireLowerRight,
            rest: gapBelts,
            compliance: 0,
            maxTension: 0,
            breakTension: 0,
        });

        // Stripes: one length of webbing, cut longer than the gap it spans.
        this.stripeCFirst = out.length;
        const gap = height - lowerLift;
        const stripeSeg = (gap * (1 + stripeSlack)) / (stripeNodes - 1);
        for (let s = 0; s < stripes; s++) {
            nodes.length = 0;
            rests.length = 0;
            for (let j = 0; j < stripeNodes; j++) nodes.push(this.stripeNodeIndex(s, j));
            for (let j = 0; j + 1 < stripeNodes; j++) rests.push(stripeSeg);
            BarricadeSolver.chain(out, nodes, rests, this.spec.stripeAxialStiffnessN);
        }
        this.stripeCEnd = out.length;

        // Tie-downs: a short strap from a deck fitting to the lower belt. Rest
        // length zero, so the belt is held at the fitting rather than merely
        // stopped from wandering too far off it.
        this.tieCFirst = out.length;
        for (let t = 0; t < this.spec.tieDowns; t++) {
            out.push({
                a: this.layout.tieDownIndex(t),
                b: this.beltNodeIndex(false, this.layout.tieDownBeltNode(t)),
                rest: 0,
                compliance: 0,
                maxTension: 0,
                breakTension: this.spec.tieDownBreakN,
            });
        }
        this.tieCEnd = out.length;
        return out;
    }

    // ---- rigging ---------------------------------------------------------

    /** Deck surface under a lateral station. */
    private deckAt(x: number): number {
        return this.spec.deckYAt ? this.spec.deckYAt(x) : this.spec.deckY;
    }

    /** Place the four stanchion fittings for a raise fraction. */
    private placeAnchors(deploy: number): void {
        const { leftX, rightX, planeZ, height, lowerLift } = this.spec;
        const angle = Math.max(0, Math.min(1, deploy)) * Math.PI * 0.5;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const set = (i: number, x: number, arm: number) => {
            this.pos[i * 3] = x;
            this.pos[i * 3 + 1] = this.deckAt(x) + arm * sin;
            this.pos[i * 3 + 2] = planeZ + arm * cos;
        };
        set(BarricadeWire.UPPER_LEFT, leftX, height);
        set(BarricadeWire.UPPER_RIGHT, rightX, height);
        set(BarricadeWire.LOWER_LEFT, leftX, lowerLift);
        set(BarricadeWire.LOWER_RIGHT, rightX, lowerLift);

        // The deck fittings ride the same hinge as everything else, so a stowed
        // net lies flush aft of the hinge line with its tie-downs rather than
        // being held across a landing area it is supposed to be clear of.
        for (let t = 0; t < this.spec.tieDowns; t++) {
            set(
                this.layout.tieDownIndex(t),
                this.beltStationX(this.layout.tieDownBeltNode(t)),
                lowerLift,
            );
        }
    }

    /**
     * Swing the stanchions. The webbing is not repositioned — it follows,
     * because it is laced to fittings that have moved.
     *
     * The fittings travel across the coming step rather than jumping to the new
     * angle at the top of it. Hydraulics swing the stanchions in about five
     * seconds, which is only centimetres a frame, but a whole frame's worth
     * delivered inside one substep is a snatch on the wire — enough to show up
     * as the webbing visibly stretching as the net goes up.
     */
    setDeploy(deploy: number): void {
        this.deployFrom = this.deploy;
        this.deploy = Math.max(0, Math.min(1, deploy));
    }

    /** How far the stanchions are up, 0 flush to 1 rigged. */
    getDeploy(): number {
        return this.deploy;
    }

    /**
     * Lace a fresh assembly at a given raise fraction and let it hang.
     *
     * The layout is only a starting guess — straight belts, stripes strung on a
     * token aft bow so the solver has a plane to work in. Settling under gravity
     * and the wind over the deck is what produces the shape.
     */
    reset(deploy: number): void {
        this.deploy = Math.max(0, Math.min(1, deploy));
        this.deployFrom = this.deploy;
        this.placeAnchors(this.deploy);
        this.vel.fill(0);
        this.wirePayout.fill(0);
        this.wireTensionN.fill(0);
        this.cLambda.fill(0);
        // The deck crew has laced a fresh assembly and wound the engines back
        // in: every run is its cut length again, not the length the last
        // arrestment pulled off the drums, and the tie-downs the last one
        // snapped are shackled up again.
        this.cRest.set(this.cRigged);
        this.cIntact.fill(1);
        this.bvh = null;
        this.hasPose = false;
        this.forceOnAirframe.set(0, 0, 0);
        this.torqueOnAirframe.set(0, 0, 0);

        const { stripes, stripeNodes, wireNodes } = this.spec;
        const at = (i: number, x: number, y: number, z: number) => {
            this.pos[i * 3] = x;
            this.pos[i * 3 + 1] = y;
            this.pos[i * 3 + 2] = z;
        };

        // Belts: straight between the panel ends, at the height the fittings
        // have swung to.
        for (const upper of [true, false]) {
            const l = upper ? BarricadeWire.UPPER_LEFT : BarricadeWire.LOWER_LEFT;
            const r = upper ? BarricadeWire.UPPER_RIGHT : BarricadeWire.LOWER_RIGHT;
            for (let i = 0; i < this.beltNodes; i++) {
                const t = i / (this.beltNodes - 1);
                at(
                    this.beltNodeIndex(upper, i),
                    this.beltStationX(i),
                    this.pos[l * 3 + 1] + (this.pos[r * 3 + 1] - this.pos[l * 3 + 1]) * t,
                    this.pos[l * 3 + 2] + (this.pos[r * 3 + 2] - this.pos[l * 3 + 2]) * t,
                );
            }
        }

        // Stripes: fittings on their laced stations, and the webbing between
        // them strung on a token aft bow so the surplus has a side to fall on
        // rather than an unstable straight line.
        for (let s = 0; s < stripes; s++) {
            const station = this.stripeBeltNode(s);
            const loBelt = this.beltNodeIndex(false, station);
            const hiBelt = this.beltNodeIndex(true, station);
            const lo = this.stripeNodeIndex(s, 0);
            const hi = this.stripeNodeIndex(s, stripeNodes - 1);
            at(lo, this.pos[loBelt * 3], this.pos[loBelt * 3 + 1], this.pos[loBelt * 3 + 2]);
            at(hi, this.pos[hiBelt * 3], this.pos[hiBelt * 3 + 1], this.pos[hiBelt * 3 + 2]);
            for (let j = 1; j < stripeNodes - 1; j++) {
                const t = j / (stripeNodes - 1);
                const bow = 0.3 * Math.sin(Math.PI * t);
                at(
                    this.stripeNodeIndex(s, j),
                    this.pos[lo * 3] + (this.pos[hi * 3] - this.pos[lo * 3]) * t,
                    this.pos[lo * 3 + 1] + (this.pos[hi * 3 + 1] - this.pos[lo * 3 + 1]) * t,
                    this.pos[lo * 3 + 2] + (this.pos[hi * 3 + 2] - this.pos[lo * 3 + 2]) * t + bow,
                );
            }
        }

        // Each fitting starts on the station its stripe was laced at.
        for (const upper of [true, false]) {
            const arc = upper ? this.arcUpper : this.arcLower;
            const u = upper ? this.uUpper : this.uLower;
            arc[0] = 0;
            for (let i = 1; i < this.beltNodes; i++) {
                arc[i] = arc[i - 1]
                    + this.distance(this.beltNodeIndex(upper, i - 1), this.beltNodeIndex(upper, i));
            }
            for (let s = 0; s < stripes; s++) u[s] = arc[this.stripeBeltNode(s)];
        }

        // Wires: straight from the mast to the end of the panel.
        for (let w = 0; w < 4; w++) {
            const a = this.wireNodeIndex(w, 0);
            const b = this.wireNodeIndex(w, wireNodes + 1);
            for (let j = 1; j <= wireNodes; j++) {
                const t = j / (wireNodes + 1);
                at(
                    this.wireNodeIndex(w, j),
                    this.pos[a * 3] + (this.pos[b * 3] - this.pos[a * 3]) * t,
                    this.pos[a * 3 + 1] + (this.pos[b * 3 + 1] - this.pos[a * 3 + 1]) * t,
                    this.pos[a * 3 + 2] + (this.pos[b * 3 + 2] - this.pos[a * 3 + 2]) * t,
                );
            }
            // Recalibrate lower wire rest lengths, but keep upper wires fixed at 4m
            const isUpperWire = w < BarricadeWire.LOWER_LEFT;
            if (!isUpperWire) {
                this.wireRest[w] = this.distance(a, b);
                // Update constraint rest lengths to match
                const actualSegRest = this.wireRest[w] / (wireNodes + 1);
                for (let c = this.wireFirst[w]; c < this.wireEnd[w]; c++) {
                    this.cRest[c] = actualSegRest * ((this.cRest[c] / this.cRigged[c]) > 1.5 ? 2 : 1);
                }
            }
        }

        this.lacing = true;
        this.settle();
        this.lacing = false;
    }

    /**
     * Run the rig to quiescence.
     *
     * The damping is wound right up for this: the rig is being *laced*, not
     * flown, and nobody wants to watch a fresh assembly swing itself to a stop.
     * Gradual damping transition prevents oscillation shock when settling ends.
     */
    private settle(): void {
        this.dampingRate = SETTLE_DAMPING;
        for (let i = 0; i < SETTLE_STEPS; i++) {
            // Gradually reduce damping over last 60 frames to avoid shock
            if (i > SETTLE_STEPS - 60) {
                const transitionProgress = (i - (SETTLE_STEPS - 60)) / 60;
                // Smoothly interpolate from SETTLE_DAMPING to spec.damping
                this.dampingRate = SETTLE_DAMPING * (1 - transitionProgress) + this.spec.damping * transitionProgress;
            }
            this.step(1 / 60);
        }
        this.dampingRate = this.spec.damping;
        this.vel.fill(0);
    }

    // ---- the airframe in the net ----------------------------------------

    /**
     * Hand over the aircraft the webbing is in contact with.
     *
     * The pose given is where the airframe will be at the *end* of the next
     * step; the solver keeps the previous one and interpolates, so each substep
     * collides against where the aircraft actually was, not where it ended up.
     * Passing `null` clears the airframe.
     */
    setAirframe(bvh: TriangleBvh | null, pose?: BarricadeAirframePose): void {
        if (!bvh || !pose) {
            this.bvh = null;
            this.hasPose = false;
            return;
        }
        if (this.bvh !== bvh || !this.hasPose) {
            this.poseT0.copy(pose.position);
            this.poseQ0.copy(pose.quaternion);
        } else {
            this.poseT0.copy(this.poseT1);
            this.poseQ0.copy(this.poseQ1);
        }
        this.poseT1.copy(pose.position);
        this.poseQ1.copy(pose.quaternion);
        this.bvh = bvh;
        this.hasPose = true;
    }

    /** Airframe pose a fraction of the way through the step. */
    private poseAt(s: number, outT: THREE.Vector3, outQ: THREE.Quaternion): void {
        outT.lerpVectors(this.poseT0, this.poseT1, s);
        outQ.copy(this.poseQ0).slerp(this.poseQ1, s);
    }

    // ---- integration -----------------------------------------------------

    /**
     * Advance the rig.
     *
     * Long calls are split so the substep never grows enough to let a stiff
     * chain overshoot; a frame the game dropped must not blow the net apart.
     */
    step(dt: number): void {
        if (!(dt > 0)) return;
        this.forceOnAirframe.set(0, 0, 0);
        this.torqueOnAirframe.set(0, 0, 0);
        let remaining = dt;
        let done = 0;
        while (remaining > 1e-9) {
            const slice = Math.min(remaining, BARRICADE_MAX_STEP_S);
            this.integrate(slice, done / dt, (done + slice) / dt);
            done += slice;
            remaining -= slice;
        }
        // Force is the impulse the contacts delivered, spread over the step.
        this.forceOnAirframe.multiplyScalar(1 / dt);
        this.torqueOnAirframe.multiplyScalar(1 / dt);


        // The stanchions have finished travelling; a step nobody re-commanded
        // leaves them where they are.
        this.deployFrom = this.deploy;
    }

    /** One slice of the step, covering airframe motion from `s0` to `s1`. */
    private integrate(dt: number, s0: number, s1: number): void {
        const substeps = this.spec.substeps;
        const h = dt / substeps;
        const keep = Math.exp(-this.dampingRate * h);
        for (let k = 0; k < substeps; k++) {
            const from = s0 + ((s1 - s0) * k) / substeps;
            const to = s0 + ((s1 - s0) * (k + 1)) / substeps;
            this.predict(h, keep);
            this.placeAnchors(this.deployFrom + (this.deploy - this.deployFrom) * to);
            this.solve(h);
            this.payOut(h);
            this.contact(h, from, to);
            this.finish(h);
        }
    }

    /** Gravity, wind and the ballistic guess for where each particle lands. */
    private predict(h: number, keep: number): void {
        const wind = BARRICADE_DECK_WIND_MPS;
        for (let i = 4; i < this.count; i++) {
            const o = i * 3;
            let vx = this.vel[o];
            let vy = this.vel[o + 1] - BARRICADE_GRAVITY * h;
            let vz = this.vel[o + 2];
            // Drag as a relaxation toward the airstream: unconditionally stable
            // however coarse the substep, unlike a force proportional to v².
            const f = 1 - Math.exp(-this.drag[i] * h);
            vx += (0 - vx) * f;
            vy += (0 - vy) * f;
            vz += (wind - vz) * f;
            vx *= keep;
            vy *= keep;
            vz *= keep;
            this.vel[o] = vx;
            this.vel[o + 1] = vy;
            this.vel[o + 2] = vz;
            this.prev[o] = this.pos[o];
            this.prev[o + 1] = this.pos[o + 1];
            this.prev[o + 2] = this.pos[o + 2];
            this.pos[o] += vx * h;
            this.pos[o + 1] += vy * h;
            this.pos[o + 2] += vz * h;
        }
        for (let i = 0; i < 4; i++) {
            const o = i * 3;
            this.prev[o] = this.pos[o];
            this.prev[o + 1] = this.pos[o + 1];
            this.prev[o + 2] = this.pos[o + 2];
        }
    }

    /**
     * Project the rope constraints, sweeping the list forwards then backwards.
     *
     * Rope, not spring: webbing resists being pulled longer and does nothing at
     * all when pushed shorter, which is what lets a stripe go slack and festoon
     * instead of holding itself out straight.
     *
     * The sweep alternates direction because Gauss–Seidel gives the last
     * constraint touched the final say. Going one way only, the wires were
     * solved against the masts and then dragged back out of true by the belt and
     * stripe passes behind them, leaving the panel ends hanging 5 cm long — a
     * cable visibly stretching, which is precisely what a wire does not do.
     * Reversing the second sweep lets both ends of the rig win in turn.
     */
    private solve(h: number): void {
        this.cLambda.fill(0);
        const invH2 = 1 / (h * h);
        for (let pass = 0; pass < this.spec.solverPasses; pass++) {
            const back = (pass & 1) === 1;
            for (let k = 0; k < this.constraints; k++) {
                this.project(back ? this.constraints - 1 - k : k, invH2);
            }
            this.attach(h, back);
        }
    }

    /**
     * Keep every stripe fitting on its belt, and let it creep along.
     *
     * Two things happen here, and the order matters. The fitting is threaded on
     * the belt, so it is held to the belt line exactly. But *where* along that
     * line it sits is free — it goes wherever the stripe is pulling it, limited
     * only by how fast the fitting will run under load and by the neighbours it
     * cannot pass. That is what parts the webbing around a fuselage and gathers
     * it on a wing.
     *
     * The sweep alternates with the constraint pass for the same reason that
     * one does. Each fitting is clamped against its neighbours, and in a single
     * direction one of those neighbours has already moved this pass and the
     * other has not — so a run of fittings being shoved along drifts the way the
     * sweep runs. On a symmetric rig that came out as the whole net creeping to
     * starboard, and an aircraft catching it off centre to port being pushed the
     * same way as one catching it to starboard.
     */
    private attach(h: number, reverse = false): void {
        const maxSlide = this.spec.slideSpeed * h;
        const stripes = this.spec.stripes;
        for (const upper of [true, false]) {
            const arc = upper ? this.arcUpper : this.arcLower;
            const u = upper ? this.uUpper : this.uLower;
            arc[0] = 0;
            for (let i = 1; i < this.beltNodes; i++) {
                arc[i] = arc[i - 1]
                    + this.distance(this.beltNodeIndex(upper, i - 1), this.beltNodeIndex(upper, i));
            }
            const total = arc[this.beltNodes - 1];

            for (let k = 0; k < stripes; k++) {
                const s = reverse ? stripes - 1 - k : k;
                const e = this.stripeFitting(s, upper);
                let want = this.beltClosestArc(upper, arc, e, u[s]);
                // The fitting binds. Below a nudge it does not move at all, and
                // past that it creeps rather than runs.
                const pull = want - u[s];
                if (Math.abs(pull) <= BARRICADE_FITTING_STICTION_M) {
                    this.pinToBelt(upper, arc, e, u[s]);
                    continue;
                }
                if (pull > maxSlide) want = u[s] + maxSlide;
                else if (pull < -maxSlide) want = u[s] - maxSlide;
                // Fittings have width and cannot swap places, so a run of them
                // shoved aside piles up rather than passing through itself.
                const lo = s > 0 ? u[s - 1] + BARRICADE_FITTING_GAP_M : 0;
                const hi = s < stripes - 1 ? u[s + 1] - BARRICADE_FITTING_GAP_M : total;
                u[s] = Math.max(0, Math.min(total, Math.max(lo, Math.min(hi, want))));
                this.pinToBelt(upper, arc, e, u[s]);
            }
        }
    }

    /** Arc position of the point on a belt nearest a fitting, searched near it. */
    private beltClosestArc(
        upper: boolean,
        arc: Float64Array,
        e: number,
        near: number,
    ): number {
        // The fitting can only have crept a few millimetres since last substep,
        // so the whole belt need not be searched — only the span around it.
        let seg = 0;
        while (seg + 2 < this.beltNodes && arc[seg + 1] < near) seg++;
        const from = Math.max(0, seg - 2);
        const to = Math.min(this.beltNodes - 2, seg + 2);
        const eo = e * 3;
        const ex = this.pos[eo];
        const ey = this.pos[eo + 1];
        const ez = this.pos[eo + 2];

        let bestD = Infinity;
        let bestArc = near;
        for (let i = from; i <= to; i++) {
            const ao = this.beltNodeIndex(upper, i) * 3;
            const bo = this.beltNodeIndex(upper, i + 1) * 3;
            const dx = this.pos[bo] - this.pos[ao];
            const dy = this.pos[bo + 1] - this.pos[ao + 1];
            const dz = this.pos[bo + 2] - this.pos[ao + 2];
            const lenSq = dx * dx + dy * dy + dz * dz;
            if (lenSq < 1e-12) continue;
            let t = ((ex - this.pos[ao]) * dx + (ey - this.pos[ao + 1]) * dy
                + (ez - this.pos[ao + 2]) * dz) / lenSq;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const px = this.pos[ao] + dx * t;
            const py = this.pos[ao + 1] + dy * t;
            const pz = this.pos[ao + 2] + dz * t;
            const d = (ex - px) ** 2 + (ey - py) ** 2 + (ez - pz) ** 2;
            if (d < bestD) {
                bestD = d;
                bestArc = arc[i] + (arc[i + 1] - arc[i]) * t;
            }
        }
        return bestArc;
    }

    /** Hold a fitting on the belt line at a given arc position. */
    private pinToBelt(upper: boolean, arc: Float64Array, e: number, u: number): void {
        let i = 0;
        while (i + 2 < this.beltNodes && arc[i + 1] < u) i++;
        const span = arc[i + 1] - arc[i];
        const t = span > 1e-9 ? Math.max(0, Math.min(1, (u - arc[i]) / span)) : 0;
        const a = this.beltNodeIndex(upper, i);
        const b = this.beltNodeIndex(upper, i + 1);
        const ao = a * 3;
        const bo = b * 3;
        const eo = e * 3;

        const px = this.pos[ao] + (this.pos[bo] - this.pos[ao]) * t;
        const py = this.pos[ao + 1] + (this.pos[bo + 1] - this.pos[ao + 1]) * t;
        const pz = this.pos[ao + 2] + (this.pos[bo + 2] - this.pos[ao + 2]) * t;

        const we = this.invMass[e];
        const wa = this.invMass[a];
        const wb = this.invMass[b];
        const sum = we + wa * (1 - t) * (1 - t) + wb * t * t;
        if (sum < 1e-12) return;
        const cx = (px - this.pos[eo]) / sum;
        const cy = (py - this.pos[eo + 1]) / sum;
        const cz = (pz - this.pos[eo + 2]) / sum;

        this.pos[eo] += we * cx;
        this.pos[eo + 1] += we * cy;
        this.pos[eo + 2] += we * cz;
        const ka = wa * (1 - t);
        this.pos[ao] -= ka * cx;
        this.pos[ao + 1] -= ka * cy;
        this.pos[ao + 2] -= ka * cz;
        const kb = wb * t;
        this.pos[bo] -= kb * cx;
        this.pos[bo + 1] -= kb * cy;
        this.pos[bo + 2] -= kb * cz;
    }

    /** Pull one run of webbing back to the length it is willing to be. */
    private project(c: number, invH2: number): void {
        if (this.cIntact[c] === 0) return;
        const a = this.cA[c];
        const b = this.cB[c];
        const wa = this.invMass[a];
        const wb = this.invMass[b];
        const w = wa + wb;
        if (w <= 0) return;
        const pos = this.pos;
        const ao = a * 3;
        const bo = b * 3;
        const dx = pos[bo] - pos[ao];
        const dy = pos[bo + 1] - pos[ao + 1];
        const dz = pos[bo + 2] - pos[ao + 2];
        const d = Math.hypot(dx, dy, dz);
        if (d < 1e-9) return;
        const violation = d - this.cRest[c];
        if (violation <= 0) return;
        // Steel runs have zero compliance and this reduces to the plain PBD
        // correction; a nylon stripe yields by its own modulus instead. Either
        // way the multiplier is what tension is read off.
        const alpha = this.cCompliance[c] * invH2;
        let dLambda = (-violation - alpha * this.cLambda[c]) / (w + alpha);
        // A capped run holds up to its limit and then simply runs. Clamping the
        // multiplier is the whole arresting engine: the cable puts a fixed load
        // on the aircraft for as long as the run-out lasts, whatever length it
        // takes. Everything the constraint could not hold is left as violation,
        // which is cable off the drum, and payOut books it as such.
        const cap = this.cMaxTension[c];
        if (cap > 0) {
            const floor = -cap / invH2;
            if (this.cLambda[c] + dLambda < floor) dLambda = floor - this.cLambda[c];
        }
        // A tie-down that is asked for more than it can hold parts, and stays
        // parted — the fitting is torn out of the deck, not stretched. The load
        // it was carrying goes to its neighbours, which is how a run of them
        // lets go one after another as the net is dragged away.
        const breaking = this.lacing ? 0 : this.cBreak[c];
        if (breaking > 0 && -(this.cLambda[c] + dLambda) * invH2 > breaking) {
            this.cIntact[c] = 0;
            this.cLambda[c] = 0;
            return;
        }
        this.cLambda[c] += dLambda;
        const s = dLambda / d;
        pos[ao] -= dx * s * wa;
        pos[ao + 1] -= dy * s * wa;
        pos[ao + 2] -= dz * s * wa;
        pos[bo] += dx * s * wb;
        pos[bo + 1] += dy * s * wb;
        pos[bo + 2] += dz * s * wb;
    }

    /**
     * Let the arresting engines run.
     *
     * A wire under less than the engine's holding force does not move; past it
     * the cable pays out against a dashpot, which is what a constant-runout
     * arresting engine does and what makes the aircraft stop over a distance
     * rather than against a wall. The length only ever grows — the engine is not
     * hauling anything back in mid-arrestment.
     */
    private payOut(h: number): void {
        const maxGrow = this.spec.enginePayoutMaxMps * h;
        const maxHaul = this.spec.engineRetractMps * h;
        const invH2 = 1 / (h * h);
        // The engines hold the rigged net up to tension only while nothing is in
        // it. From the moment an airframe is in the webbing this is an
        // arrestment and the drums are paying out — a winch still hauling for
        // its set point in the middle of that is fighting the run-out, and it
        // pumps energy into a net that is already being dragged: it came out as
        // a *centred* trap slewing the aircraft most of a half turn.
        const holdingOnly = this.bvh === null;
        for (let w = 0; w < 4; w++) {
            let laid = 0;
            let tension = 0;
            for (let c = this.wireFirst[w]; c < this.wireEnd[w]; c++) {
                // Hangers are not cable and must not be counted as paid out.
                if (this.cMaxTension[c] <= 0) continue;
                // The multiplier *is* the load the cable carried this substep.
                const carried = -this.cLambda[c] * invH2;
                if (carried > tension) tension = carried;

                // Clamped at the cap means the engine is at its holding force
                // and the drum is turning. That test is exact — it is the same
                // clamp the solver applied — where comparing lengths is not:
                // the stretch that distinguishes a rigged cable from a running
                // one is a fraction of a millimetre, well under the residual
                // the solver leaves behind, so a length test has the engines
                // paying out while the net simply hangs there.
                const cap = this.cMaxTension[c];
                if (cap > 0 && this.cLambda[c] <= -cap / invH2 + 1e-15) {
                    const over = this.distance(this.cA[c], this.cB[c]) - this.cRest[c];
                    if (over > 0) this.cRest[c] += Math.min(over, maxGrow);
                } else if (cap > 0 && holdingOnly && carried < this.spec.enginePreTensionN) {
                    // Slack enough to wind in. The engine hauls until the cable
                    // is at its pre-tension — not merely until it is back to the
                    // length it was rigged at, which leaves a belt hanging in a
                    // catenary carrying nothing. It will not reel against a real
                    // load, which is what keeps this out of the way of a run-out
                    // in progress: there the cable is at the holding force the
                    // whole time.
                    this.cRest[c] = Math.max(
                        this.cRigged[c] * BARRICADE_MIN_WIRE_FRAC,
                        this.cRest[c] - maxHaul,
                    );
                }
                laid = this.cRest[c];
            }
            this.wireTensionN[w] = tension;
            this.wirePayout[w] = Math.max(0, laid - this.wireRest[w]);
        }
    }

    /**
     * Non-penetration, last word of the substep.
     *
     * The deck and the airframe both get a swept test, because at closure speed
     * a substep moves a particle further than a wing is thick and a static
     * push-out would find nothing to push out of. Contacts run *after* the rope
     * pass, so a strap pinned between belt tension and a leading edge ends up a
     * few millimetres long rather than a few centimetres inside the wing — the
     * webbing is what gives, which is also what it does in life.
     */
    private contact(h: number, s0: number, s1: number): void {
        this.contactN.fill(0);
        const bvh = this.bvh;
        const useHull = bvh !== null && this.hasPose;
        if (useHull) {
            this.poseAt(s0, _t0, _q0);
            this.poseAt(s1, _t1, _q1);
            _iq0.copy(_q0).invert();
            _iq1.copy(_q1).invert();
        }
        for (let i = 4; i < this.count; i++) {
            const o = i * 3;
            if (this.invMass[i] <= 0) continue;
            if (useHull) this.hullContact(i, o, h, bvh as TriangleBvh);
            this.deckContact(o);
        }
    }

    /** Keep one particle out of the airframe, with friction where it lands. */
    private hullContact(i: number, o: number, h: number, bvh: TriangleBvh): void {
        // The swept path in *body* space already accounts for the aircraft's
        // own motion, so a stationary strap and a moving wing is the same
        // problem as a moving strap and a stationary wing.
        _a.set(this.prev[o], this.prev[o + 1], this.prev[o + 2]).sub(_t0).applyQuaternion(_iq0);
        _b.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]).sub(_t1).applyQuaternion(_iq1);

        let nx = 0;
        let ny = 0;
        let nz = 0;
        if (bvhSegmentHit(bvh, _a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _hit)) {
            // Stay on the side the strap came from.
            const side = (_a.x - _hit.x) * _hit.nx + (_a.y - _hit.y) * _hit.ny
                + (_a.z - _hit.z) * _hit.nz;
            const sign = side >= 0 ? 1 : -1;
            nx = _hit.nx * sign;
            ny = _hit.ny * sign;
            nz = _hit.nz * sign;
            _b.set(
                _hit.x + nx * BARRICADE_SKIN_M,
                _hit.y + ny * BARRICADE_SKIN_M,
                _hit.z + nz * BARRICADE_SKIN_M,
            );
        } else if (bvhContainsPoint(bvh, _b.x, _b.y, _b.z)) {
            // Escaped anyway — a stripe pinched between two panels, or a rope
            // correction that pushed it through. Out by the shortest road.
            if (!bvhClosestPoint(bvh, _b.x, _b.y, _b.z, 1e4, _near)) return;
            const dx = _near.x - _b.x;
            const dy = _near.y - _b.y;
            const dz = _near.z - _b.z;
            const len = Math.hypot(dx, dy, dz);
            if (len < 1e-9) return;
            nx = dx / len;
            ny = dy / len;
            nz = dz / len;
            _b.set(
                _near.x + nx * BARRICADE_SKIN_M,
                _near.y + ny * BARRICADE_SKIN_M,
                _near.z + nz * BARRICADE_SKIN_M,
            );
        } else {
            return;
        }

        // Where the contact ends up in carrier-local, and where the skin under
        // it was going, so friction is measured against the wing and not
        // against the ship.
        const beforeX = this.pos[o];
        const beforeY = this.pos[o + 1];
        const beforeZ = this.pos[o + 2];
        _p.copy(_b).applyQuaternion(_q1).add(_t1);
        _s0.copy(_b).applyQuaternion(_q0).add(_t0);
        _s1.copy(_p);
        const surfVx = (_s1.x - _s0.x) / h;
        const surfVy = (_s1.y - _s0.y) / h;
        const surfVz = (_s1.z - _s0.z) / h;

        // The contact normal is a body-frame direction; friction and the load
        // it feeds back to the airframe are both carrier-local.
        _a.set(nx, ny, nz).applyQuaternion(_q1);
        const lnx = _a.x;
        const lny = _a.y;
        const lnz = _a.z;

        const corrX = _p.x - beforeX;
        const corrY = _p.y - beforeY;
        const corrZ = _p.z - beforeZ;
        const normalPush = Math.max(0, corrX * lnx + corrY * lny + corrZ * lnz);

        // Coulomb: tangential slip is capped by the normal load, so webbing
        // pressed hard onto a leading edge stops sliding and starts wrapping.
        let dtx = _p.x - this.prev[o] - surfVx * h;
        let dty = _p.y - this.prev[o + 1] - surfVy * h;
        let dtz = _p.z - this.prev[o + 2] - surfVz * h;
        const dn = dtx * lnx + dty * lny + dtz * lnz;
        dtx -= dn * lnx;
        dty -= dn * lny;
        dtz -= dn * lnz;
        // Coulomb: below the limit the strap does not move on the skin at all,
        // and above it the skin takes that much out of the slide and no more.
        //
        // This had the two cases the wrong way round — it left `mu * push` of
        // slip *in* rather than taking it out, so raising the coefficient made
        // the webbing slide more, and past a certain point the guard skipped
        // friction altogether. It is why sweeping the coefficient from 0.85 to
        // 6.0 changed the outcome by nothing at all, and why a strap driven onto
        // a wing would never grip it.
        const slip = Math.hypot(dtx, dty, dtz);
        // Detect leading edge: high curvature manifests as stripe particles having
        // large normal components relative to their motion. Boost friction aggressively
        // for leading edges to prevent aircraft from slipping through while wrapping.
        const isLeadingEdge = Math.abs(dn) > slip * 0.5;
        const frictionMult = isLeadingEdge ? 2.5 : 1.0;
        const maxSlip = BARRICADE_HULL_FRICTION * normalPush * frictionMult;
        let px = _p.x;
        let py = _p.y;
        let pz = _p.z;
        if (slip > 1e-9) {
            const take = slip <= maxSlip ? 1 : maxSlip / slip;
            px -= dtx * take;
            py -= dty * take;
            pz -= dtz * take;
        }

        // The webbing pushed on the airframe exactly as hard as the airframe
        // pushed on the webbing.
        const mass = 1 / this.invMass[i];
        this._impulse.set(-lnx, -lny, -lnz).multiplyScalar((mass * normalPush) / h);
        this.forceOnAirframe.add(this._impulse);
        this._arm.set(px - this.poseT1.x, py - this.poseT1.y, pz - this.poseT1.z);
        this._moment.crossVectors(this._arm, this._impulse);
        this.torqueOnAirframe.add(this._moment);

        this.pos[o] = px;
        this.pos[o + 1] = py;
        this.pos[o + 2] = pz;

        // What the strap is resting on, and how fast that surface is going into
        // it. The velocity update needs both: a wing sweeping into webbing has
        // to carry it along, while webbing merely pushed back out of a hull it
        // had sagged into must not be launched by it.
        this.contactN[o] = lnx;
        this.contactN[o + 1] = lny;
        this.contactN[o + 2] = lnz;
        this.contactVn[i] = surfVx * lnx + surfVy * lny + surfVz * lnz;
    }

    /** Webbing lies on the deck; it does not hang through it. */
    private deckContact(o: number): void {
        const floor = this.deckAt(this.pos[o]);
        if (this.pos[o + 1] >= floor) return;
        const push = floor - this.pos[o + 1];
        this.pos[o + 1] = floor;
        // Straight up, and the deck is not going anywhere in the frame the rig
        // is laced in. Overwrites any hull contact from this substep: the deck
        // is solved last and it is the harder of the two.
        this.contactN[o] = 0;
        this.contactN[o + 1] = 1;
        this.contactN[o + 2] = 0;
        this.contactVn[o / 3] = 0;
        let dtx = this.pos[o] - this.prev[o];
        let dtz = this.pos[o + 2] - this.prev[o + 2];
        // Same Coulomb clamp as the hull contact, and it had the same inversion.
        const slip = Math.hypot(dtx, dtz);
        const maxSlip = BARRICADE_DECK_FRICTION * push;
        if (slip > 1e-9) {
            const take = slip <= maxSlip ? 1 : maxSlip / slip;
            this.pos[o] -= dtx * take;
            this.pos[o + 2] -= dtz * take;
        }
    }

    /**
     * Velocities follow from where the particles actually ended up — except
     * across a contact, where they follow from the surface.
     *
     * Everywhere else the positional change over a substep *is* the velocity,
     * which is the whole point of the formulation. A non-penetration correction
     * is the exception: its size says how far the strap had drifted into the
     * hull, not how hard anything hit it, and dividing that by half a
     * millisecond invents an impulse out of nothing. So along the contact
     * normal the strap simply takes the speed of the skin it is lying on —
     * inelastic, no rebound, which is what nylon on aluminium does. The
     * tangential part is left alone, because there the positional change is
     * real sliding and the Coulomb clamp has already had its say.
     */
    private finish(h: number): void {
        const inv = 1 / h;
        for (let i = 4; i < this.count; i++) {
            const o = i * 3;
            let vx = (this.pos[o] - this.prev[o]) * inv;
            let vy = (this.pos[o + 1] - this.prev[o + 1]) * inv;
            let vz = (this.pos[o + 2] - this.prev[o + 2]) * inv;
            const nx = this.contactN[o];
            const ny = this.contactN[o + 1];
            const nz = this.contactN[o + 2];
            if (nx !== 0 || ny !== 0 || nz !== 0) {
                const excess = vx * nx + vy * ny + vz * nz - this.contactVn[i];
                vx -= excess * nx;
                vy -= excess * ny;
                vz -= excess * nz;
            }
            this.vel[o] = vx;
            this.vel[o + 1] = vy;
            this.vel[o + 2] = vz;
        }
    }

    // ---- read-out --------------------------------------------------------

    /** Arc length of one stripe, lower belt to upper (m). */
    stripeLength(s: number): number {
        let len = 0;
        for (let j = 0; j + 1 < this.spec.stripeNodes; j++) {
            len += this.distance(this.stripeNodeIndex(s, j), this.stripeNodeIndex(s, j + 1));
        }
        return len;
    }

    /** Arc length of one belt across the whole panel (m). */
    beltLength(upper: boolean): number {
        let len = 0;
        for (let i = 0; i + 1 < this.beltNodes; i++) {
            len += this.distance(this.beltNodeIndex(upper, i), this.beltNodeIndex(upper, i + 1));
        }
        return len;
    }

    /** Cable the arresting engine has let out of one mast (m). */
    wirePaidOut(w: BarricadeWire): number {
        return this.wirePayout[w];
    }

    /** Tension in one wire at the end of the last substep (N). */
    wireTension(w: BarricadeWire): number {
        return this.wireTensionN[w];
    }

    /** Load the webbing put on the airframe over the last step (N, carrier-local). */
    airframeForce(out: THREE.Vector3): THREE.Vector3 {
        return out.copy(this.forceOnAirframe);
    }

    /** Moment about the airframe's own origin over the last step (N·m). */
    airframeTorque(out: THREE.Vector3): THREE.Vector3 {
        return out.copy(this.torqueOnAirframe);
    }

    /** Fastest particle in the rig (m/s) — zero once it has settled. */
    maxSpeed(): number {
        let best = 0;
        for (let i = 4; i < this.count; i++) {
            const o = i * 3;
            const v = Math.hypot(this.vel[o], this.vel[o + 1], this.vel[o + 2]);
            if (v > best) best = v;
        }
        return best;
    }

    /** Worst strain over a range of constraints, as a fraction of rest length. */
    private maxStrain(first: number, end: number): number {
        let worst = 0;
        for (let c = first; c < end; c++) {
            const rest = this.cRest[c];
            if (rest <= 1e-9) continue;
            const strain = (this.distance(this.cA[c], this.cB[c]) - rest) / rest;
            if (strain > worst) worst = strain;
        }
        return worst;
    }

    /**
     * Worst strain in either load belt.
     *
     * The belts carry arresting-gear cable and are cut to the panel: this is the
     * number that has to stay near zero however hard the net is driven, and any
     * of it that is not zero is the solver's residual rather than the rig
     * giving.
     */
    maxBeltStrain(): number {
        return this.maxStrain(this.beltCFirst, this.beltCEnd);
    }

    /**
     * Worst strain in any stripe.
     *
     * Unlike the belts this is *meant* to be non-zero. The stripes are nylon
     * webbing and stretch like it, which is why the assembly is expendable and
     * why an arrestment is survivable at all — something in the load path has to
     * give, and it is designed to be this.
     */
    maxStripeStrain(): number {
        return this.maxStrain(this.stripeCFirst, this.stripeCEnd);
    }

    /**
     * Worst wire run measured against the cable actually off its drum.
     *
     * Deliberately end to end rather than segment by segment. The interior
     * particles are there so an idle wire can hang in a catenary, and under load
     * they carry a kink of a few millimetres that reads as several percent on a
     * half-metre chord while saying nothing whatever about the run: what matters
     * is that the mast never gets further from the panel than the length of
     * cable joining them. A wire gets longer by paying out, never by stretching,
     * and this is the number that says so.
     */
    maxWireStrain(): number {
        let worst = 0;
        for (let w = 0; w < 4; w++) {
            const laid = this.wireRest[w] + this.wirePayout[w];
            if (laid <= 1e-9) continue;
            const span = this.distance(
                this.wireNodeIndex(w, 0),
                this.wireNodeIndex(w, this.spec.wireNodes + 1),
            );
            const strain = (span - laid) / laid;
            if (strain > worst) worst = strain;
        }
        return worst;
    }

    private distance(a: number, b: number): number {
        const ao = a * 3;
        const bo = b * 3;
        return Math.hypot(
            this.pos[bo] - this.pos[ao],
            this.pos[bo + 1] - this.pos[ao + 1],
            this.pos[bo + 2] - this.pos[ao + 2],
        );
    }
}
