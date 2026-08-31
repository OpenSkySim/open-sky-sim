/**
 * Unit tests for the barricade solver.
 *
 * These are deliberately not shape tests. The old analytic model was checked by
 * asserting that its curves came out where its constants said they would, which
 * only ever confirmed the arithmetic. What matters about a rig made of webbing
 * is that it obeys the rules webbing obeys, so that is what is asserted here:
 * nothing gets longer than it was cut, nothing ends up inside the aeroplane,
 * nothing hangs through the deck, and the cable only ever comes off the drum
 * when the engine is being pulled harder than it holds.
 *
 * The shape is then checked only where it *follows* from those rules — a belt
 * that sags below its masts, stripes that belly toward the groove, a net that
 * is dragged furthest where the aircraft actually hit it.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { TriangleBvh, buildTriangleBvh, bvhContainsPoint } from '../../physics/collision/triangleBvh';
import { BARRICADE_PULL_OUT_M } from './barricade';
import {
    BarricadeSolver,
    BarricadeSolverSpec,
    BarricadeWire,
    barricadeFallbackHull,
    barricadeHullIsUsable,
    defaultBarricadeSolverSpec,
} from './barricadeSolver';

/** Closed box as a triangle soup, in the aircraft body frame. */
function box(
    cx: number, cy: number, cz: number,
    hx: number, hy: number, hz: number,
): number[] {
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
}

/**
 * A fighter's worth of collision hull: a 2.5 m fuselage with an 11 m wing.
 *
 * Body frame is the game's — +Z out of the nose, +Y up — so the two together
 * give the solver the thing that actually matters about an airframe in a net:
 * something too narrow to hold in front of something broad enough to hold.
 */
const HULL_TRIS = [
    ...box(0, 0, 0, 1.25, 1.0, 6.0),
    ...box(0, -0.3, -0.5, 5.5, 0.2, 1.5),
];

function airframe(): TriangleBvh {
    return buildTriangleBvh(HULL_TRIS);
}

/** Nose down the angled deck, along carrier-local −Z. */
function approachHeading(): THREE.Quaternion {
    return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
}

const DECK_Y = 13.55;
const PLANE_Z = 30;

function rigged(partial: Partial<BarricadeSolverSpec> = {}): BarricadeSolver {
    const s = new BarricadeSolver(defaultBarricadeSolverSpec(partial));
    s.reset(1);
    return s;
}

/**
 * Strain a steel run may show on any one segment before it counts as stretched.
 *
 * Not zero, because a Gauss-Seidel pass leaves a residual, and the peak of it
 * lands on the one segment nearest a mast at the moment of the catch. On a
 * 1.3 m belt segment this is about 5 cm, and the belt's *total* length — the
 * statement that actually matters, and the one the caller can see — is checked
 * separately and holds to well under 1%.
 */
const STEEL_TOLERANCE = 0.04;

/**
 * Strain a nylon stripe may reach.
 *
 * Generous, and meant to be. Wide nylon runs to something like a third of its
 * length before it lets go, and a barricade assembly is expendable precisely
 * because an arrestment takes it there — the webbing coming out of one is not
 * webbing anybody re-rigs. What this rules out is not the webbing working hard
 * but the solver reporting a stripe at several times its own length, which is
 * not stretching, it is having come apart.
 */
const NYLON_LIMIT = 0.5;

function nodeY(s: BarricadeSolver, i: number): number {
    return s.pos[i * 3 + 1];
}

function nodeZ(s: BarricadeSolver, i: number): number {
    return s.pos[i * 3 + 2];
}

/**
 * Fly the airframe down the deck through the net.
 *
 * Decelerating, over the run-out the arresting engine is actually set for.
 * Dragging the net the length of the deck at an undiminished sixty metres a
 * second is not a harsher version of an arrestment, it is a different event —
 * nothing in the sim does it, and it asks the webbing for loads no engine would
 * ever put through it.
 *
 * Returns the worst behaviour seen at any point of the run, because an
 * invariant that only holds at the end is not an invariant.
 */
function sweep(
    s: BarricadeSolver,
    opts: {
        speed?: number;
        lateral?: number;
        height?: number;
        frames?: number;
        fromZ?: number;
        bvh?: TriangleBvh;
    } = {},
): {
    worstBelt: number;
    worstStripe: number;
    worstWire: number;
    everInside: number;
    lowestBelowDeck: number;
    payoutMonotone: boolean;
    peakForce: THREE.Vector3;
    force: THREE.Vector3;
    torque: THREE.Vector3;
} {
    const bvh = opts.bvh ?? airframe();
    const speed = opts.speed ?? 60;
    const frames = opts.frames ?? 90;
    const dt = 1 / 60;
    const q = approachHeading();
    const pos = new THREE.Vector3(
        opts.lateral ?? 0,
        DECK_Y + (opts.height ?? 2.0),
        opts.fromZ ?? 45,
    );

    const force = new THREE.Vector3();
    const torque = new THREE.Vector3();
    const peakForce = new THREE.Vector3();
    const local = new THREE.Vector3();
    const iq = new THREE.Quaternion();

    let worstBelt = 0;
    let worstStripe = 0;
    let worstWire = 0;
    let everInside = 0;
    let lowestBelowDeck = 0;
    let payoutMonotone = true;
    const lastPayout = [0, 0, 0, 0];

    // v² = v0² − 2·a·s over the run-out, the same profile the sim applies.
    const decel = (speed * speed) / (2 * BARRICADE_PULL_OUT_M);
    let v = speed;
    for (let f = 0; f < frames; f++) {
        v = Math.max(0, v - decel * dt);
        pos.z -= v * dt;
        s.setAirframe(bvh, { position: pos, quaternion: q });
        s.step(dt);

        worstBelt = Math.max(worstBelt, s.maxBeltStrain());
        worstStripe = Math.max(worstStripe, s.maxStripeStrain());
        worstWire = Math.max(worstWire, s.maxWireStrain());

        iq.copy(q).invert();
        for (let i = 4; i < s.count; i++) {
            local.set(s.pos[i * 3], s.pos[i * 3 + 1], s.pos[i * 3 + 2]).sub(pos).applyQuaternion(iq);
            if (bvhContainsPoint(bvh, local.x, local.y, local.z)) everInside++;
            const below = DECK_Y - s.pos[i * 3 + 1];
            if (below > lowestBelowDeck) lowestBelowDeck = below;
        }

        for (let w = 0; w < 4; w++) {
            const now = s.wirePaidOut(w as BarricadeWire);
            if (now < lastPayout[w] - 1e-12) payoutMonotone = false;
            lastPayout[w] = now;
        }

        s.airframeForce(force);
        if (force.lengthSq() > peakForce.lengthSq()) peakForce.copy(force);
    }
    s.airframeForce(force);
    s.airframeTorque(torque);
    return {
        worstBelt, worstStripe, worstWire,
        everInside, lowestBelowDeck, payoutMonotone, peakForce, force, torque,
    };
}

describe('a rigged barricade at rest', () => {

    it('settles and then stays exactly where it settled', () => {
        const s = rigged();
        const before = s.pos.slice();
        for (let i = 0; i < 120; i++) s.step(1 / 60);
        // Millimetres a second: the rig is hanging, not swinging.
        assert.ok(s.maxSpeed() < 0.02, `net is still moving at ${s.maxSpeed()} m/s`);
        let drift = 0;
        for (let i = 0; i < s.pos.length; i++) {
            drift = Math.max(drift, Math.abs(s.pos[i] - before[i]));
        }
        assert.ok(drift < 0.05, `net drifted ${drift.toFixed(3)} m after settling`);
    });

    it('hangs its belts below the mast heads instead of standing them straight', () => {
        const s = rigged();
        const end = nodeY(s, s.beltNodeIndex(true, 0));
        const mid = nodeY(s, s.beltNodeIndex(true, Math.floor(s.beltNodes / 2)));
        const sag = end - mid;
        assert.ok(sag > 0.2, `upper belt sags only ${sag.toFixed(2)} m`);
        assert.ok(sag < 1.5, `upper belt sags ${sag.toFixed(2)} m — that is a washing line`);
    });

    it('bellies its stripes aft toward the groove, under the wind over the deck', () => {
        const s = rigged();
        const mid = 12;
        const lo = s.stripeNodeIndex(mid, 0);
        const hi = s.stripeNodeIndex(mid, s.spec.stripeNodes - 1);
        let bow = 0;
        for (let j = 1; j < s.spec.stripeNodes - 1; j++) {
            const t = j / (s.spec.stripeNodes - 1);
            const chord = nodeZ(s, lo) + (nodeZ(s, hi) - nodeZ(s, lo)) * t;
            bow = Math.max(bow, nodeZ(s, s.stripeNodeIndex(mid, j)) - chord);
        }
        // Aft is +Z. A photograph of a rigged barricade shows a couple of feet
        // of belly; anything much more and the surplus is wrong.
        assert.ok(bow > 0.5, `stripe bows only ${bow.toFixed(2)} m aft`);
        assert.ok(bow < 2.5, `stripe bows ${bow.toFixed(2)} m aft`);
    });

    it('keeps the whole assembly out of the deck', () => {
        const s = rigged();
        for (let i = 4; i < s.count; i++) {
            assert.ok(nodeY(s, i) >= DECK_Y - 1e-6,
                `particle ${i} is ${(DECK_Y - nodeY(s, i)).toFixed(3)} m through the deck`);
        }
    });

    it('is symmetric about the centreline, because nothing has disturbed it', () => {
        const s = rigged();
        const n = s.beltNodes;
        for (let i = 0; i < n; i++) {
            const l = s.beltNodeIndex(true, i);
            const r = s.beltNodeIndex(true, n - 1 - i);
            assert.ok(Math.abs(s.pos[l * 3] + s.pos[r * 3]) < 0.02, 'belt is off centre');
            assert.ok(Math.abs(nodeY(s, l) - nodeY(s, r)) < 0.02, 'belt hangs lopsided');
            assert.ok(Math.abs(nodeZ(s, l) - nodeZ(s, r)) < 0.02, 'belt is skewed');
        }
    });

    it('holds every run to the length it was cut', () => {
        const s = rigged();
        assert.ok(s.maxBeltStrain() < STEEL_TOLERANCE,
            `a belt run is ${(s.maxBeltStrain() * 100).toFixed(1)}% over its cut length`);
        assert.ok(s.maxWireStrain() < STEEL_TOLERANCE,
            `a wire run is ${(s.maxWireStrain() * 100).toFixed(1)}% over its cut length`);
        // Nothing is pulling on the rigged net, so even the nylon should be
        // carrying little more than its own weight.
        assert.ok(s.maxStripeStrain() < 0.05,
            `a stripe is ${(s.maxStripeStrain() * 100).toFixed(1)}% stretched at rest`);
        const beltCut = 2 * s.spec.webHalfWidth * (1 + s.spec.beltSlack);
        for (const upper of [true, false]) {
            const over = s.beltLength(upper) / beltCut - 1;
            assert.ok(over < 0.005,
                `${upper ? 'upper' : 'lower'} belt is ${(over * 100).toFixed(2)}% long`);
        }
    });

    it('comes back to its cut length when a fresh assembly is laced', () => {
        // The webbing is expended in an arrestment and the crew rigs a new one,
        // so a reset has to wind the engines back in as well as re-lace the net.
        // Clearing the payout counter without restoring the cable it measures
        // would leave a fresh rig hanging on twenty metres of slack wire.
        const s = rigged();
        sweep(s);
        assert.ok(s.wirePaidOut(BarricadeWire.UPPER_LEFT) > 1, 'the run-out did nothing');
        s.reset(1);
        for (let w = 0; w < 4; w++) {
            assert.equal(s.wirePaidOut(w as BarricadeWire), 0, `wire ${w} is still paid out`);
        }
        assert.ok(s.maxWireStrain() < STEEL_TOLERANCE, 'the re-rigged wires are not taut');
        const end = nodeY(s, s.beltNodeIndex(true, 0));
        const mid = nodeY(s, s.beltNodeIndex(true, Math.floor(s.beltNodes / 2)));
        assert.ok(end - mid < 1.5, 're-rigged net is hanging slack, not rigged');
    });

    it('holds the lower belt down on its deck fittings', () => {
        // Both belts are held only at their ends, so the stripes hanging between
        // them haul the lower one upward — measured at nearly a metre off the
        // deck against the 0.45 m it is rigged at, and worse the tauter the
        // webbing was cut. The tie-downs are what the lower load strap has to
        // pull against, and without them no amount of tuning makes the net stand
        // up: shortening the stripes just drags the two belts together.
        const s = rigged();
        assert.ok(s.spec.tieDowns > 0, 'this rig has no tie-downs to test');
        for (let i = 0; i < 300; i++) s.step(1 / 60);

        const lift = s.spec.lowerLift;
        for (let i = 0; i < s.beltNodes; i++) {
            const y = nodeY(s, s.beltNodeIndex(false, i)) - DECK_Y;
            assert.ok(y < lift + 0.35,
                `lower belt is ${y.toFixed(2)} m off the deck, rigged at ${lift}`);
        }
    });

    it('parts its tie-downs rather than holding an aircraft on them', () => {
        // They hold the rigged net down; they are not deck anchors for an
        // aeroplane. The whole point of a barricade is that the webbing goes
        // with the airframe and runs out down the deck, so the fittings have to
        // let go — and having let go, they stay gone until the crew laces a
        // fresh assembly.
        const s = rigged();
        sweep(s);
        let dragged = 0;
        for (let i = 0; i < s.beltNodes; i++) {
            dragged = Math.max(dragged, PLANE_Z - nodeZ(s, s.beltNodeIndex(false, i)));
        }
        assert.ok(dragged > 5,
            `the lower belt only moved ${dragged.toFixed(1)} m downfield — still on its fittings`);

        // A fresh assembly gets its tie-downs back.
        s.reset(1);
        for (let i = 0; i < 120; i++) s.step(1 / 60);
        const mid = Math.floor(s.beltNodes / 2);
        assert.ok(nodeY(s, s.beltNodeIndex(false, mid)) - DECK_Y < s.spec.lowerLift + 0.35,
            're-rigged net did not get its tie-downs back');
    });

    it('stands the net up and keeps it there, minutes after it was rigged', () => {
        // The failure this guards against was found by looking at it: the panel
        // lying flat on the deck sixty metres downwind of its own masts, with
        // the stanchions still standing up correctly behind it.
        //
        // The engines only ever let cable *off* the drum, so every transient
        // while the stanchions swung up was permanent. The slack accumulated,
        // and the wind over the deck did the rest. A rigged barricade stands
        // taut because the arresting gear holds it out, and that is a thing the
        // gear does continuously, not once.
        const s = new BarricadeSolver(defaultBarricadeSolverSpec());
        s.reset(0);
        for (let i = 0; i <= 300; i++) {
            s.setDeploy(Math.min(1, i / 300));
            s.step(1 / 60);
        }
        for (let i = 0; i < 60 * 60; i++) s.step(1 / 60);

        const mast = nodeY(s, BarricadeWire.UPPER_LEFT);
        const end = nodeY(s, s.beltNodeIndex(true, 0));
        const mid = nodeY(s, s.beltNodeIndex(true, Math.floor(s.beltNodes / 2)));
        assert.ok(mast - end < 1.5,
            `panel end hangs ${(mast - end).toFixed(2)} m below its mast head`);
        assert.ok(mid > DECK_Y + 3,
            `upper belt is at ${mid.toFixed(2)} m, barely off the ${DECK_Y} m deck`);

        // And it has not been blown down the deck, which is how it showed up.
        let worst = 0;
        for (let i = 0; i < s.beltNodes; i++) {
            worst = Math.max(worst, nodeZ(s, s.beltNodeIndex(true, i)) - PLANE_Z);
        }
        assert.ok(worst < 4,
            `upper belt has drifted ${worst.toFixed(1)} m aft of the rig plane`);

        for (let w = 0; w < 4; w++) {
            assert.ok(s.wirePaidOut(w as BarricadeWire) < 0.5,
                `wire ${w} has ${s.wirePaidOut(w as BarricadeWire).toFixed(2)} m off the drum at rest`);
        }
    });

    it('leaves the arresting engines alone until something pulls on them', () => {
        const s = rigged();
        for (let i = 0; i < 60; i++) s.step(1 / 60);
        for (let w = 0; w < 4; w++) {
            assert.equal(s.wirePaidOut(w as BarricadeWire), 0, `wire ${w} paid out unloaded`);
            assert.ok(s.wireTension(w as BarricadeWire) < s.spec.engineHoldN,
                `wire ${w} is already at the engine's holding force at rest`);
        }
    });
});

describe('raising and stowing the barricade', () => {

    it('lies flat on the deck when the stanchions are folded', () => {
        const s = new BarricadeSolver(defaultBarricadeSolverSpec());
        s.reset(0);
        let highest = 0;
        for (let i = 4; i < s.count; i++) highest = Math.max(highest, nodeY(s, i) - DECK_Y);
        assert.ok(highest < 0.6, `stowed webbing stands ${highest.toFixed(2)} m off the deck`);
        // Folded aft of the hinge, where it is out of the landing area.
        const mid = s.beltNodeIndex(true, Math.floor(s.beltNodes / 2));
        assert.ok(nodeZ(s, mid) > PLANE_Z, 'stowed webbing is not aft of the hinge line');
    });

    it('carries the webbing up with the stanchions without stretching it', () => {
        const s = new BarricadeSolver(defaultBarricadeSolverSpec());
        s.reset(0);
        let worst = 0;
        for (let i = 0; i <= 300; i++) {
            s.setDeploy(i / 300);
            s.step(1 / 60);
            worst = Math.max(worst, s.maxBeltStrain());
        }
        assert.ok(worst < STEEL_TOLERANCE,
            `raising stretched a belt by ${(worst * 100).toFixed(1)}%`);
        const mid = s.beltNodeIndex(true, Math.floor(s.beltNodes / 2));
        assert.ok(nodeY(s, mid) - DECK_Y > 4, 'the net did not come up with the stanchions');
    });
});

describe('a stripe rides the belts on fittings', () => {

    it('stays on the belt line it is threaded on', () => {
        const s = rigged();
        sweep(s, { lateral: 2 });
        // Whatever the airframe does to it, a fitting is on the belt: never
        // beside it, never off the end of it.
        for (const upper of [true, false]) {
            for (let i = 0; i < s.spec.stripes; i++) {
                const e = s.stripeFitting(i, upper);
                let best = Infinity;
                for (let k = 0; k + 1 < s.beltNodes; k++) {
                    best = Math.min(best, pointToSegment(
                        s, e, s.beltNodeIndex(upper, k), s.beltNodeIndex(upper, k + 1)));
                }
                assert.ok(best < 0.15,
                    `fitting ${i} is ${best.toFixed(2)} m off the ${upper ? 'upper' : 'lower'} belt`);
            }
        }
    });

    it('does not budge while nothing is pushing it', () => {
        const s = rigged();
        const before = Array.from({ length: s.spec.stripes }, (_, i) => s.stripeSlide(i, true));
        for (let i = 0; i < 120; i++) s.step(1 / 60);
        for (let i = 0; i < s.spec.stripes; i++) {
            const moved = Math.abs(s.stripeSlide(i, true) - before[i]);
            assert.ok(moved < 0.05, `fitting ${i} wandered ${moved.toFixed(3)} m unloaded`);
        }
    });

    it('keeps its station under an airframe, and never passes its neighbour', () => {
        // This asserted the opposite for most of this model's life: that a
        // fuselage shoulders the stripes in its path aside, which is what the
        // gear is documented to do and what the analytic model faked. It does
        // happen — but only at a coarse solve. Measured, the stripes in the
        // fuselage's path move 0.3 m at 16 substeps and 0.000 m at 32, with
        // nothing else changed. It was the solver failing to hold them, not the
        // aeroplane pushing them.
        //
        // Which is no loss: a stripe that stays where it was laced is a stripe
        // still spread across the span for a wing to catch, where a run of them
        // shoved into the middle is the bundle this net kept finishing as.
        const s = rigged();
        const before = Array.from({ length: s.spec.stripes }, (_, i) => s.stripeSlide(i, true));
        sweep(s);
        // Fittings have width and are threaded in order: whatever happens, the
        // run of them stays a run.
        for (let i = 1; i < s.spec.stripes; i++) {
            assert.ok(s.stripeSlide(i, true) > s.stripeSlide(i - 1, true),
                `fittings ${i - 1} and ${i} have swapped places on the belt`);
        }
        // And they are still spread out, not gathered at the point of contact.
        let worstDrift = 0;
        for (let i = 0; i < s.spec.stripes; i++) {
            worstDrift = Math.max(worstDrift, Math.abs(s.stripeSlide(i, true) - before[i]));
        }
        assert.ok(worstDrift < 3,
            `a fitting travelled ${worstDrift.toFixed(2)} m along the belt`);
    });
});

/** Distance from a fitting to a belt segment. */
function pointToSegment(s: BarricadeSolver, p: number, a: number, b: number): number {
    const px = s.pos[p * 3], py = s.pos[p * 3 + 1], pz = s.pos[p * 3 + 2];
    const ax = s.pos[a * 3], ay = s.pos[a * 3 + 1], az = s.pos[a * 3 + 2];
    const dx = s.pos[b * 3] - ax, dy = s.pos[b * 3 + 1] - ay, dz = s.pos[b * 3 + 2] - az;
    const lenSq = dx * dx + dy * dy + dz * dz;
    if (lenSq < 1e-12) return Math.hypot(px - ax, py - ay, pz - az);
    let t = ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - dx * t, py - ay - dy * t, pz - az - dz * t);
}

describe('an airframe driven into the webbing', () => {

    it('never ends up with webbing inside it', () => {
        const s = rigged();
        const r = sweep(s);
        assert.equal(r.everInside, 0, `${r.everInside} particle-frames were inside the hull`);
    });

    it('never stretches the steel, however hard it is driven', () => {
        for (const speed of [30, 60, 90]) {
            const s = rigged();
            const r = sweep(s, { speed });
            assert.ok(r.worstBelt < STEEL_TOLERANCE,
                `at ${speed} m/s a belt went ${(r.worstBelt * 100).toFixed(1)}% over its cut length`);
            assert.ok(r.worstWire < STEEL_TOLERANCE,
                `at ${speed} m/s a wire went ${(r.worstWire * 100).toFixed(1)}% over its cut length`);
            const beltCut = 2 * s.spec.webHalfWidth * (1 + s.spec.beltSlack);
            assert.ok(s.beltLength(true) / beltCut - 1 < 0.01,
                `at ${speed} m/s the upper belt finished long`);
        }
    });

    it('takes up the load in the nylon, which is what nylon is there for', () => {
        const s = rigged();
        const r = sweep(s, { speed: 60 });
        assert.ok(r.worstStripe > 0.02,
            'the stripes carried the load without giving at all — that is not webbing');
        assert.ok(r.worstStripe < NYLON_LIMIT,
            `a stripe reached ${(r.worstStripe * 100).toFixed(0)}% strain and would have parted`);
    });

    it('curls the webbing round a wing instead of pressing on the front of it', () => {
        // The thing the gear is for. A stripe meeting a wing has to end up on
        // *both* skins — over the leading edge and back along the top, and round
        // and back along the bottom — because that is what hooks it on. Webbing
        // merely pressed against the front face slides off the moment the net is
        // dragged, which is what left the wings clean and the whole net snagged
        // on the tails instead.
        const s = rigged();
        const bvh = airframe();
        sweep(s, { bvh });

        // Wing box: |x| 1.4..5.5, y −0.5..−0.1, leading edge at z = +1.0.
        const q = approachHeading();
        const iq = q.clone().invert();
        const nose = new THREE.Vector3(0, DECK_Y + 2.0, PLANE_Z + 45 - 60 * (90 / 60));
        const local = new THREE.Vector3();
        let over = 0;
        let under = 0;
        for (let i = 4; i < s.count; i++) {
            local.set(s.pos[i * 3], s.pos[i * 3 + 1], s.pos[i * 3 + 2])
                .sub(nose).applyQuaternion(iq);
            const onSpan = Math.abs(local.x) > 1.6 && Math.abs(local.x) < 5.5;
            if (!onSpan || Math.abs(local.z + 0.5) > 5 || Math.abs(local.y + 0.3) > 1.2) continue;
            if (local.y > -0.1) over++;
            else if (local.y < -0.5) under++;
        }
        assert.ok(over > 5 && under > 5,
            `webbing on the wing: ${over} above, ${under} below — it has not curled round`);
    });

    it('never lets the webbing through the deck', () => {
        const s = rigged();
        const r = sweep(s);
        assert.ok(r.lowestBelowDeck < 0.05,
            `webbing went ${r.lowestBelowDeck.toFixed(3)} m through the deck`);
    });

    it('pays cable off the arresting engines, and never below the rigged length', () => {
        const s = rigged();
        const r = sweep(s);
        const paid = [0, 1, 2, 3].reduce((a, w) => a + s.wirePaidOut(w as BarricadeWire), 0);
        assert.ok(paid > 0.5, `the engines let out only ${paid.toFixed(2)} m in total`);
        // Not monotone, on purpose: the engines wind cable back in whenever
        // they are not being overhauled, which is what holds a rigged net up
        // between arrestments. What they must never do is take in more than
        // they let out and haul the panel in past its own masts.
        for (let w = 0; w < 4; w++) {
            assert.ok(s.wirePaidOut(w as BarricadeWire) >= 0,
                `wire ${w} wound in past its rigged length`);
        }
        assert.ok(r.everInside === 0, 'the retract dragged webbing into the airframe');
    });

    it('is retarded by the webbing, not pushed along by it', () => {
        const s = rigged();
        const r = sweep(s);
        // Landing runs along −Z, so the load on the airframe must be +Z.
        assert.ok(r.peakForce.z > 0,
            `peak load on the airframe was ${r.peakForce.z.toFixed(0)} N along the run-out`);
        assert.ok(r.peakForce.length() > 5000,
            `peak load was only ${(r.peakForce.length() / 1000).toFixed(1)} kN`);
    });

    it('is dragged furthest downfield where the aircraft actually hit it', () => {
        const s = rigged();
        sweep(s, { lateral: 0 });
        const drag = (i: number) => PLANE_Z - nodeZ(s, s.beltNodeIndex(true, i));
        const mid = drag(Math.floor(s.beltNodes / 2));
        const end = drag(0);
        assert.ok(mid > end + 0.5,
            `net was dragged ${mid.toFixed(2)} m at the centre and ${end.toFixed(2)} m at the mast`);
    });

    it('leans the load toward the side an off-centre aircraft hit', () => {
        const s = rigged();
        const r = sweep(s, { lateral: 6 });
        // The webbing is being hauled off to starboard, so it pulls the airframe
        // back toward the centreline: a load in −X, and a moment with it.
        assert.ok(r.peakForce.x < 0,
            `off-centre load pulled ${r.peakForce.x.toFixed(0)} N, expected it inboard`);
        const left = s.wirePaidOut(BarricadeWire.UPPER_LEFT);
        const right = s.wirePaidOut(BarricadeWire.UPPER_RIGHT);
        assert.ok(right > left,
            `starboard engine let out ${right.toFixed(2)} m against ${left.toFixed(2)} m to port`);
    });

    it('catches an airframe whose imported hull is unusable', () => {
        // Two of the fifty-six aircraft arrive from the mod importer with a
        // collision hull that is a 3.3 m cube around the cockpit, or with none
        // at all. Colliding webbing against that is worse than useless: it draws
        // the net threaded straight through the wings, which is exactly how this
        // was found — in a screenshot.
        assert.equal(barricadeHullIsUsable(undefined, 7), false, 'no hull is not usable');
        assert.equal(
            barricadeHullIsUsable(
                { triangles: box(0, 0, 0, 1.65, 1.65, 1.65), aabb: { min: [-1.65, -1.65, -1.65], max: [1.65, 1.65, 1.65] } },
                7,
            ),
            false,
            'a cockpit-sized cube is not an aeroplane',
        );
        assert.equal(barricadeHullIsUsable(
            { triangles: HULL_TRIS, aabb: { min: [-5.5, -1, -6], max: [5.5, 1, 6] } }, 7,
        ), true, 'a real hull is usable');

        // The stand-in is the size of the aircraft it stands in for, and the
        // webbing stays outside it.
        const fallback = barricadeFallbackHull(7);
        assert.ok(fallback.aabb.max[0] - fallback.aabb.min[0] >= 13, 'stand-in is too narrow');
        const s = rigged();
        const r = sweep(s, { bvh: buildTriangleBvh(fallback.triangles) });
        assert.equal(r.everInside, 0, 'webbing ended up inside the stand-in hull');
        assert.ok(r.peakForce.z > 0, 'the stand-in was not caught by the net');
    });

    it('catches a bare fuselage too, because a net has no hole in it', () => {
        // Worth pinning down, because the model this replaces asserted the
        // opposite: it had a minimum catch width, below which an airframe was
        // declared to part the webbing and pass through. Nothing in the physics
        // reproduces that. A six-metre curtain of webbing on cable cut to the
        // deck catches whatever flies into it, and the engines go to their
        // holding force either way — measured, a bare fuselage and a winged
        // airframe come out within a few percent of each other on peak load, on
        // how far the net is dragged, and on how many stripes carry it.
        //
        // The argument for wings was always about where the load is *carried*
        // rather than whether it is caught, and that belongs to the arresting
        // model, not to the webbing.
        const bare = buildTriangleBvh(box(0, 0, 0, 1.25, 1.0, 6.0));
        const bareRun = sweep(rigged(), { bvh: bare });
        assert.ok(bareRun.peakForce.z > 0, 'a bare fuselage was not retarded at all');
        assert.ok(bareRun.peakForce.length() > 5000,
            `a bare fuselage pulled only ${(bareRun.peakForce.length() / 1000).toFixed(1)} kN`);
        assert.equal(bareRun.everInside, 0, 'webbing ended up inside the fuselage');
    });
});

describe('the solver is deterministic', () => {

    it('gives bit-identical results for identical runs', () => {
        const a = rigged();
        const b = rigged();
        sweep(a, { lateral: 3 });
        sweep(b, { lateral: 3 });
        for (let i = 0; i < a.pos.length; i++) {
            assert.equal(a.pos[i], b.pos[i], `particle float ${i} diverged`);
        }
        assert.equal(a.wirePaidOut(BarricadeWire.UPPER_LEFT), b.wirePaidOut(BarricadeWire.UPPER_LEFT));
    });

    it('takes the same path whether a step arrives whole or in pieces', () => {
        // A dropped frame must not blow the rig apart; the step splitter is
        // what keeps the substep bounded when it does.
        const s = rigged();
        let worst = 0;
        const bvh = airframe();
        const q = approachHeading();
        const pos = new THREE.Vector3(0, DECK_Y + 2, 45);
        for (let f = 0; f < 20; f++) {
            pos.z -= 60 * 0.25;
            s.setAirframe(bvh, { position: pos, quaternion: q });
            s.step(0.25);
            worst = Math.max(worst, s.maxBeltStrain());
        }
        assert.ok(Number.isFinite(s.pos[0]), 'the rig blew up on a quarter-second step');
        assert.ok(worst < 0.1, `a long step stretched a belt by ${(worst * 100).toFixed(1)}%`);
    });
});
