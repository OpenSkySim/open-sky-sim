/**
 * Geometry, materials and node layout of a rigged carrier barricade.
 *
 * Split out from the solver ({@link ./barricadeRigModel}) because two things
 * need to agree on where every particle of a rig lives in a flat position
 * array without either one owning the physics: the sim solves the rig and
 * writes its particles into the snapshot, and the renderer reads them back
 * with no physics of its own. Both derive the same layout from the same
 * spec, so neither has to be told it by the other.
 */
import * as THREE from 'three';
import { AircraftCollisionMesh } from './aircraftDef';

/**
 * Smallest wing half-span a stand-in hull is built to (m).
 *
 * A floor rather than a guess: carrier aircraft run from about eight metres
 * of span upward, and the alternative is sizing the substitute from a span
 * that was measured off the very hull it is replacing.
 */
export const BARRICADE_MIN_FALLBACK_HALF_SPAN_M = 4;

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
     * One is usually right. The belt only has to form the overall bight,
     * which is metres across; it is the stripes that wrap anything.
     * Subdividing it lengthens the chain the solver has to carry tension
     * along, which costs accuracy and time for detail nothing needs.
     */
    beltSegmentsPerStripe: number;
    /** Interior particles on each bare wire run. */
    wireNodes: number;
    /**
     * Deck tie-downs holding the lower belt down along its length.
     *
     * Without them the rig has no answer to its own stripes: both belts are
     * held only at their ends, so stripe tension hauls them toward each
     * other until the stripes go slack, and a net cut shorter simply pulls
     * them closer still. Nothing about that equilibrium is taut. The lower
     * load strap is what breaks it — pinned to deck fittings across the
     * landing area, it cannot be lifted, so the stripes have something to
     * hang from and the panel stands to its full height.
     */
    tieDowns: number;
    /**
     * Surplus stripe length as a fraction of the gap the stripe actually spans.
     *
     * A stripe cut exactly to the gap would stand as a taut bar. The
     * surplus is what bellies aft when the net is clear and what pays out
     * to reach round a wing when it is not.
     */
    stripeSlack: number;
    /**
     * Force each purchase cable holds before the arresting engine lets it run (N).
     *
     * Below this the rig simply holds; above it the cable pays out and the
     * aircraft is decelerated by the engine rather than stopped by the
     * webbing.
     */
    engineHoldN: number;
    /** Fastest the drum will turn (m/s). Must exceed any engage speed, or the
     * wire goes rigid mid-arrestment and the load spikes off the cap. */
    enginePayoutMaxMps: number;
    /**
     * Metres of payout over which the engine ramps up to its full holding
     * force.
     *
     * The first instants of an arrestment are the webbing stretching and the
     * bight forming; a hold force that arrives all at once instead is a jerk
     * into a multi-tonne airframe.
     * The ramp starts at a fraction of the hold force and reaches all of it
     * once this much cable is off the drum.
     */
    engineSoftStartM: number;
    /** How fast the engine winds cable back in when nothing is overhauling it (m/s). */
    engineRetractMps: number;
    /**
     * Axial stiffness of a purchase cable (N at 100% strain).
     *
     * Steel, so this is enormous next to the webbing's and the cable counts
     * as inextensible for every practical purpose.
     */
    wireAxialStiffnessN: number;
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
        webHalfWidth: 15.24,
        planeZ: 30,
        deckY: 13.55,
        height: 6.1,
        lowerLift: 0.45,
        stripes: 24,
        // 13, not 11: at 11 a stripe samples the airframe every 0.63 m and
        // spans every hollow between fuselage, intake and wing like a
        // convex hull — the drawn net floats off the skin. 13 is the most
        // BARRICADE_MAX_NODES admits (4 + 2·24 + 24·13 + 12 + 6 = 382).
        stripeNodes: 13,
        beltSegmentsPerStripe: 1,
        wireNodes: 3,
        tieDowns: 6,
        stripeSlack: 0.06,
        // 220 kN per purchase cable: two cables and the wrap-angle loss put
        // ~3.7 g on a 12 t airframe, the MK-7 figure. The same total at 5-6 g
        // was tried — it stops in 30 m but the nose gear cannot hold the
        // pitch-down and the airframe digs into the deck.
        engineHoldN: 220000,
        enginePayoutMaxMps: 90,
        engineSoftStartM: 3,
        engineRetractMps: 2,
        wireAxialStiffnessN: 50e6,
        ...partial,
    };
}

/**
 * Bare wire between each mast and the end of the webbing panel, as rigged (m).
 *
 * The panel is 100 ft across a 115 ft span, so a few feet of cable shows at
 * each end of a rigged barricade — it is in every photograph of one. It also
 * gives the wire somewhere to be: a panel laced right out to the masts
 * leaves the arresting engines pulling on a run of zero length, with no
 * direction to pull in until the net has already moved.
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

/**
 * Fraction of the engines' combined hold force that ends up retarding the
 * aircraft along the deck, once the bight is fully formed.
 *
 * Less than one for wrap-angle losses: the four wires pull from the masts,
 * not from dead astern, and some of their tension is spent holding the net
 * across the deck rather than dragging it down it.
 */
export const BARRICADE_ARREST_EFFICIENCY = 0.8;

/**
 * Deck an arrestment is expected to take from webbing contact to a stop (m).
 *
 * Nothing scripts this distance — the aircraft is stopped by wire tension at
 * the engines' capped hold force, and this is simply that energy balance
 * read forward: ½mv² over the mean retarding force. Tests use it as the
 * yardstick the physical run-out has to land near.
 */
export function barricadeStoppingDistance(
    massKg: number,
    speedMps: number,
    spec: BarricadeSolverSpec = defaultBarricadeSolverSpec(),
): number {
    // Two purchase cables, one per side: both belts of a side end in one
    // U-shackle, and one cable runs from there to the deck sheave.
    const meanForce = BARRICADE_ARREST_EFFICIENCY * 2 * spec.engineHoldN;
    return (0.5 * massKg * speedMps * speedMps) / Math.max(1, meanForce);
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
 * Collision hulls are imported from the source model, and a few arrive
 * broken — a cube around the cockpit, or nothing at all. The webbing then
 * collides with whatever that is and passes clean through the wings, which
 * is not a subtle failure: it draws the net threaded through the aeroplane.
 *
 * Something the size and shape of the aircraft is far better than that, and
 * the barricade only ever needs the gross form anyway — a fuselage to part
 * around and a wing to gather on. Built from the wing span the flight model
 * already knows, so it fits the aircraft it stands in for.
 */
export function barricadeFallbackHull(wingHalfSpanM: number): AircraftCollisionMesh {
    // Floored, because the span is itself often derived from the broken hull
    // this is standing in for — a cockpit-sized hitbox reports a
    // cockpit-sized wing, and a stand-in built from that is no better than
    // the thing it replaces. Nothing that lands on a carrier is narrower
    // than this.
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
 * Trim a barricade drape down to the parts the webbing is allowed to hold:
 * fuselage, wings, vertical tail, intakes — the structure above the belly
 * line. Everything hanging BELOW it — landing gear legs, wheels, drop
 * tanks, pylons, the tailhook — is cut away.
 *
 * Geometric, not name-based, because mod meshes carry no part names (they
 * are merged per material colour). The belly line is taken off the
 * gear-down bounding box: the bottom of the box is the wheels, and the
 * struts and stores live in the bottom fifth of the airframe's height.
 * Webbing that would have wrapped a gear leg wedges into the pocket
 * between belly, struts and deck where nothing can ever comb it out; with
 * the gear cut from the drape it is rolled over and lies flat on the deck
 * under the aircraft, which is what the real net does.
 */
export function barricadeDrapeTrim(mesh: AircraftCollisionMesh): AircraftCollisionMesh {
    const { min, max } = mesh.aabb;
    const height = max[1] - min[1];
    // Deep enough to take most of the strut, shallow enough to keep the
    // lower fuselage and the intake lips — the net is supposed to HOLD at
    // the intakes, and a cut that shaves them leaves the drawn webbing
    // floating where the collision skin no longer exists.
    const cutY = min[1] + Math.min(0.25 * height, 1.2);
    const t = mesh.triangles;
    const kept: number[] = [];
    for (let i = 0; i + 8 < t.length; i += 9) {
        const cy = (t[i + 1] + t[i + 4] + t[i + 7]) / 3;
        if (cy >= cutY) kept.push(...t.slice(i, i + 9));
    }
    if (kept.length < 9) return mesh;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < kept.length; i += 3) {
        minX = Math.min(minX, kept[i]);
        maxX = Math.max(maxX, kept[i]);
        minY = Math.min(minY, kept[i + 1]);
        maxY = Math.max(maxY, kept[i + 1]);
        minZ = Math.min(minZ, kept[i + 2]);
        maxZ = Math.max(maxZ, kept[i + 2]);
    }
    return {
        triangles: kept,
        aabb: { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
    };
}

/**
 * Is this hull big enough to be the aircraft it belongs to?
 *
 * A hull barely wider than a cockpit is not a mis-modelled aeroplane, it is
 * a broken import, and colliding webbing against it is worse than not
 * having one.
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
 * The airframe as the rig sees it: a rigid body in carrier-local
 * coordinates. Velocity is relative to the ship (the frame the rig is laced
 * in), the angular velocity is in the aircraft's own body frame, and the
 * inertia is the principal diagonal about the body axes.
 */
export interface BarricadeAirframeBody extends BarricadeAirframePose {
    velocity: THREE.Vector3;
    angularVelocityBody: THREE.Vector3;
    massKg: number;
    inertiaBody: THREE.Vector3;
}

/**
 * Where every particle of a rig sits in the flat position array.
 *
 * Split out from the solver because the two ends of the snapshot channel
 * need it and only one of them has a solver: the sim owns the rig and
 * writes its particles into the snapshot, and the renderer reads them back
 * with no physics of its own. Both work the layout out from the same spec,
 * so neither has to be told it.
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
        // A stripe owns every one of its own particles, ends included: the
        // ends ride the belts rather than being part of them.
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
     * The two ends are the fittings that ride the belts. They are the
     * stripe's own particles, not the belt's, which is what lets a fuselage
     * shoulder a stripe out of its path.
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
     * Spread across the panel and kept off the two ends, which the wires to
     * the masts already hold.
     */
    tieDownBeltNode(t: number): number {
        const n = this.spec.tieDowns;
        if (n <= 0) return 0;
        const last = this.beltNodes - 1;
        // Mirrored about the centreline rather than rounded independently.
        // Rounding each station on its own put one fitting half a node off
        // centre, and a rig that is not symmetric does not behave
        // symmetrically: it showed up as the belt sitting off centre on a
        // net nothing had touched.
        const half = n >> 1;
        if (t < half) return Math.round(((t + 1) * last) / (n + 1));
        if (n % 2 === 1 && t === half) return Math.round(last / 2);
        return last - Math.round(((n - t) * last) / (n + 1));
    }
}
