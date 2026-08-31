import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    ARRESTOR_CABLE_LOCAL_Z,
    ARRESTOR_CARRIER_ORIGIN,
    ARRESTOR_DECK_MID_X,
} from './arrestorCables';
import {
    BARRICADE_ARMED_FRACTION,
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_HALF_SPAN_M,
    BARRICADE_HEIGHT_M,
    BARRICADE_LOCAL_Z,
    BARRICADE_LOWER_SECONDS,
    BARRICADE_PULL_FALLOFF_M,
    BARRICADE_RAISE_SECONDS,
    BARRICADE_RERIG_SECONDS,
    BARRICADE_DECK_BAND_M,
    BARRICADE_DECK_EDGE_INSET_M,
    BARRICADE_DECK_PROBE_STEP_M,
    BARRICADE_END_GAP_M,
    BARRICADE_ENGAGING_LOOPS,
    BARRICADE_LOOP_BOW_M,
    BARRICADE_LOWER_STRAP_LIFT_M,
    BARRICADE_LOWER_STRAP_LIFT_M,
    BARRICADE_LOOP_BUNCH_M,
    BARRICADE_LOOP_MIN_SPAN_FRAC,
    BARRICADE_LOOP_REST_SPAN_M,
    BARRICADE_LOOP_FREE_END_FRAC,
    BARRICADE_LOOP_LENGTH_M,
    BARRICADE_LOOP_SLACK_REACH_M,
    BARRICADE_WING_GRIP_M,
    BARRICADE_WING_WRAP_RISE_M,
    BARRICADE_WRAP_CLEARANCE_M,
    BARRICADE_LOOP_SLIDE_MAX_M,
    BARRICADE_TOP_SAG_M,
    BARRICADE_WEBBING_HALF_WIDTH_M,
    BarricadeController,
    BarricadeWrapProfile,
    BarricadeState,
    addBarricadeWrapPoint,
    barricadeArmed,
    barricadeEngagementPullAt,
    barricadeGrippedDepthAt,
    barricadeLoopCurve,
    barricadeIsSlipStation,
    barricadeLoopLocalX,
    barricadeLoopSpanAt,
    barricadeLoopStations,
    barricadePathLength,
    barricadeRig,
    barricadeSeatOnDeck,
    barricadeStrapNodeAt,
    barricadeTautPullSampler,
    barricadeWrapColumnDepth,
    barricadeWrapColumnExtent,
    barricadeWrapSpanDepth,
    barricadeWrapFaceDepthAt,
    barricadeWrapDepthAt,
    closeBarricadeWrapGaps,
    createBarricadeWrapProfile,
    finalizeBarricadeWrap,
    foldCollisionHullIntoWrap,
    resetBarricadeWrapProfile,
    barricadeStretchAt,
    buildBarricadeField,
    fitBarricadeRig,
    barricadeWireCurve,
    BARRICADE_WIRE_SAMPLES,
    BARRICADE_WIRE_TAUT_PULL_M,
    layBarricadeBelt,
    computeBarricadeWeb,
    tryBarricadeEngage,
} from './barricade';

const POSE = { position: { ...ARRESTOR_CARRIER_ORIGIN } };

function field(deploy: number) {
    return buildBarricadeField(POSE, BARRICADE_DECK_LOCAL_Y, deploy);
}

/** CG on the deck, `pastM` metres forward of the webbing plane, `offsetM` off centre. */
function deckPos(pastM: number, offsetM = 0, aboveDeckM = 2) {
    return new THREE.Vector3(
        ARRESTOR_CARRIER_ORIGIN.x + ARRESTOR_DECK_MID_X + offsetM,
        ARRESTOR_CARRIER_ORIGIN.y + BARRICADE_DECK_LOCAL_Y + aboveDeckM,
        ARRESTOR_CARRIER_ORIGIN.z + BARRICADE_LOCAL_Z - pastM,
    );
}

describe('barricade layout', () => {

    it('hangs the loops evenly across the whole belt, mast to mast', () => {
        const xs = barricadeLoopLocalX();
        assert.equal(xs.length, BARRICADE_ENGAGING_LOOPS);

        const step = xs[1] - xs[0];
        for (let i = 1; i < xs.length; i++) {
            assert.ok(Math.abs((xs[i] - xs[i - 1]) - step) < 1e-9, 'evenly spaced');
        }
        const mid = (xs[0] + xs[xs.length - 1]) * 0.5;
        assert.ok(Math.abs(mid - ARRESTOR_DECK_MID_X) < 1e-9, 'centred on the landing lane');

        // The belt is cut to the mast-to-mast run, so the webbing spans all of
        // it and the outermost loops sit at the masts when nothing is in the net.
        const halfWidth = (xs[xs.length - 1] - xs[0]) * 0.5;
        assert.ok(Math.abs(halfWidth - BARRICADE_HALF_SPAN_M) < 1e-9,
            `webbing should reach the masts (half width ${halfWidth.toFixed(2)} m)`);
    });

    it('sits forward of every arrestor pendant', () => {
        // Landing runs toward −Z, so "forward" is a smaller local Z than the wires.
        for (const z of ARRESTOR_CABLE_LOCAL_Z) {
            assert.ok(BARRICADE_LOCAL_Z < z, `barricade must be ahead of wire at Z=${z}`);
        }
    });

    it('places the webbing centre on the deck and points the deck axis at the bow', () => {
        const f = field(1);
        assert.ok(Math.abs(f.center.x - (ARRESTOR_CARRIER_ORIGIN.x + ARRESTOR_DECK_MID_X)) < 1e-6);
        assert.ok(Math.abs(f.center.y - (ARRESTOR_CARRIER_ORIGIN.y + BARRICADE_DECK_LOCAL_Y)) < 1e-6);
        assert.ok(Math.abs(f.center.z - (ARRESTOR_CARRIER_ORIGIN.z + BARRICADE_LOCAL_Z)) < 1e-6);
        assert.ok(Math.abs(f.deckAxis.z - (-1)) < 1e-6);
        assert.ok(Math.abs(f.lateralAxis.x - 1) < 1e-6);
    });

    it('rotates with carrier yaw', () => {
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        const f = buildBarricadeField(
            { position: { x: 100, y: 0, z: 200 }, quaternion: yaw },
            BARRICADE_DECK_LOCAL_Y,
            1,
        );
        // Local −Z (roll-out) becomes world −X after +90° yaw about Y.
        assert.ok(Math.abs(f.deckAxis.x - (-1)) < 1e-6, 'deck axis should face −X');
        assert.ok(Math.abs(f.lateralAxis.z - (-1)) < 1e-6, 'lateral axis should face −Z');
    });
});

describe('barricade engagement', () => {

    const vel = new THREE.Vector3(0, 0, -60);

    it('is not armed until the stanchions are nearly upright', () => {
        assert.equal(barricadeArmed(field(0)), false);
        assert.equal(barricadeArmed(field(BARRICADE_ARMED_FRACTION - 0.01)), false);
        assert.equal(barricadeArmed(field(1)), true);
    });

    it('catches an airframe crossing the plane with no hook involved', () => {
        const before = deckPos(-1);
        const after = deckPos(1);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(1)), true);
    });

    it('catches a step that jumps clean over the webbing plane', () => {
        // 60 m/s at 1/60 s is a 1 m step; exaggerate to a full frame skip.
        const before = deckPos(-8);
        const after = deckPos(8);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(1)), true);
    });

    it('ignores a half-raised net', () => {
        const before = deckPos(-1);
        const after = deckPos(1);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(0.5)), false);
    });

    it('ignores an aircraft flying over the top of the webbing', () => {
        const before = deckPos(-1, 0, BARRICADE_HEIGHT_M + 5);
        const after = deckPos(1, 0, BARRICADE_HEIGHT_M + 5);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(1)), false);
    });

    it('ignores an aircraft passing outboard of the stanchions', () => {
        const off = BARRICADE_HALF_SPAN_M + 20;
        const before = deckPos(-1, off);
        const after = deckPos(1, off);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(1)), false);
    });

    it('still catches a wing that overhangs the stanchion', () => {
        // CG just outboard of the stanchion, but the inboard wing fouls the net.
        const off = BARRICADE_HALF_SPAN_M + 3;
        const before = deckPos(-1, off);
        const after = deckPos(1, off);
        assert.equal(tryBarricadeEngage(after, before, vel, 7, field(1)), true);
    });

    it('ignores an aircraft rolling backwards or sitting still', () => {
        const still = new THREE.Vector3(0, 0, 0);
        assert.equal(tryBarricadeEngage(deckPos(0), deckPos(-1), still, 7, field(1)), false);
        const astern = new THREE.Vector3(0, 0, 30);
        assert.equal(tryBarricadeEngage(deckPos(0), deckPos(1), astern, 7, field(1)), false);
    });

    it('catches a slow taxi that never crosses the plane in one step', () => {
        const creep = new THREE.Vector3(0, 0, -4);
        assert.equal(tryBarricadeEngage(deckPos(0.5), deckPos(0.4), creep, 7, field(1)), true);
    });
});

describe('barricade webbing stretch', () => {

    it('pulls hardest at the airframe and tapers to nothing at the falloff reach', () => {
        assert.ok(Math.abs(barricadeStretchAt(0, 0, 10) - 10) < 1e-9);
        assert.ok(barricadeStretchAt(BARRICADE_PULL_FALLOFF_M * 0.5, 0, 10) < 10);
        assert.equal(barricadeStretchAt(BARRICADE_PULL_FALLOFF_M, 0, 10), 0);
        assert.equal(barricadeStretchAt(BARRICADE_PULL_FALLOFF_M + 5, 0, 10), 0);
    });

    it('follows an off-centre airframe', () => {
        const acX = 6;
        assert.ok(barricadeStretchAt(acX, acX, 10) > barricadeStretchAt(0, acX, 10));
    });
});

describe('BarricadeController', () => {

    function step(c: BarricadeController, seconds: number, engaged = false, dt = 1 / 60) {
        for (let t = 0; t < seconds; t += dt) c.update(dt, engaged);
    }

    it('starts stowed and raises over the hydraulic swing time', () => {
        const c = new BarricadeController();
        assert.equal(c.getState(), BarricadeState.STOWED);
        assert.equal(c.getDeploy(), 0);

        c.toggle();
        assert.equal(c.getState(), BarricadeState.RAISING);
        step(c, BARRICADE_RAISE_SECONDS * 0.5);
        assert.ok(c.getDeploy() > 0.3 && c.getDeploy() < 0.7);
        assert.equal(c.isArmed(), false);

        step(c, BARRICADE_RAISE_SECONDS);
        assert.equal(c.getState(), BarricadeState.RAISED);
        assert.equal(c.getDeploy(), 1);
        assert.equal(c.isArmed(), true);
    });

    it('strikes the net back down on a second toggle', () => {
        const c = new BarricadeController();
        c.raise();
        step(c, BARRICADE_RAISE_SECONDS + 1);
        c.toggle();
        assert.equal(c.getState(), BarricadeState.LOWERING);
        step(c, BARRICADE_LOWER_SECONDS + 1);
        assert.equal(c.getState(), BarricadeState.STOWED);
        assert.equal(c.getDeploy(), 0);
    });

    it('expends the webbing on an arrestment and re-rigs before it can be raised again', () => {
        const c = new BarricadeController();
        c.raise();
        step(c, BARRICADE_RAISE_SECONDS + 1);

        // Airframe in the net, then cut free.
        step(c, 3, true);
        assert.equal(c.getState(), BarricadeState.RAISED);
        assert.equal(c.isEngaged(), true);

        c.update(1 / 60, false);
        assert.equal(c.getState(), BarricadeState.RERIGGING);
        assert.ok(c.getRerigRemaining() > 0);

        // Raise is refused while the crew is lacing a replacement.
        c.raise();
        assert.equal(c.getState(), BarricadeState.RERIGGING);

        step(c, BARRICADE_RERIG_SECONDS + 1);
        assert.equal(c.getState(), BarricadeState.STOWED);
        assert.equal(c.getDeploy(), 0);

        c.raise();
        assert.equal(c.getState(), BarricadeState.RAISING);
    });

    it('reset returns a freshly rigged, stowed net', () => {
        const c = new BarricadeController();
        c.raise();
        step(c, BARRICADE_RAISE_SECONDS + 1);
        step(c, 1, true);
        c.update(1 / 60, false);
        c.reset();
        assert.equal(c.getState(), BarricadeState.STOWED);
        assert.equal(c.getDeploy(), 0);
        assert.equal(c.getRerigRemaining(), 0);
        assert.equal(c.isEngaged(), false);
    });
});

describe('barricade webbing shape', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    it('lies flat on the deck aft of the hinge when stowed', () => {
        const web = computeBarricadeWeb(0, deck);
        for (const n of web) {
            assert.ok(Math.abs(n.topY - BARRICADE_DECK_LOCAL_Y) < 1e-9, 'top strap on the deck');
            assert.ok(Math.abs(n.botY - BARRICADE_DECK_LOCAL_Y) < 1e-9, 'bottom strap on the deck');
            assert.ok(Math.abs(n.botZ - BARRICADE_LOCAL_Z) < 1e-9, 'hinge line does not move');
            // Stowed, the assembly is folded aft (a larger local Z) by its own height.
            assert.ok(
                Math.abs(n.topZ - (BARRICADE_LOCAL_Z + BARRICADE_HEIGHT_M)) < 1e-9,
                'folded aft by the stanchion length',
            );
        }
    });

    it('stands 20 ft over the hinge line when fully raised', () => {
        const web = computeBarricadeWeb(1, deck);
        for (const n of web) {
            assert.ok(Math.abs(n.topZ - BARRICADE_LOCAL_Z) < 1e-9, 'upright: top over the hinge');
            assert.ok(n.topY > n.botY, 'upper load strap above the lower one');
        }
        // The stanchion heads carry the full height; mid-span sags under its weight.
        const heads = [web[0], web[web.length - 1]];
        for (const h of heads) {
            assert.ok(
                Math.abs(h.topY - (BARRICADE_DECK_LOCAL_Y + BARRICADE_HEIGHT_M)) < 1e-9,
                'stanchion head at full height',
            );
        }
        const centre = web[Math.floor(web.length / 2)];
        assert.ok(centre.topY < heads[0].topY, 'mid-span sags below the stanchion heads');
        assert.ok(
            heads[0].topY - centre.topY <= BARRICADE_TOP_SAG_M + 1e-9,
            'sag stays within the authored limit',
        );
    });

    it('swings up monotonically: taller and less folded at every step', () => {
        let prev = computeBarricadeWeb(0, deck)[0];
        for (let d = 0.1; d <= 1.0001; d += 0.1) {
            const n = computeBarricadeWeb(d, deck)[0];
            assert.ok(n.topY > prev.topY, `top rises at deploy ${d.toFixed(1)}`);
            assert.ok(n.topZ < prev.topZ, `top folds forward at deploy ${d.toFixed(1)}`);
            prev = n;
        }
    });

    it('keeps the stanchion arm rigid through the swing', () => {
        for (let d = 0; d <= 1.0001; d += 0.05) {
            const head = computeBarricadeWeb(d, deck)[0];
            const arm = Math.hypot(
                head.topY - BARRICADE_DECK_LOCAL_Y,
                head.topZ - BARRICADE_LOCAL_Z,
            );
            assert.ok(
                Math.abs(arm - BARRICADE_HEIGHT_M) < 1e-9,
                `stanchion length must not change (deploy ${d.toFixed(2)}: ${arm})`,
            );
        }
    });

    it('cones the webbing downfield around an engaged airframe', () => {
        const engaged = { stretch: 12, lateral: ARRESTOR_DECK_MID_X };
        const web = computeBarricadeWeb(1, deck, engaged);
        const centre = web[Math.floor(web.length / 2)];
        const head = web[0];

        // The straps trail the airframe by the loops' slack, so they sit short
        // of the full 12 m stretch rather than level with it.
        const dragged = BARRICADE_LOCAL_Z - centre.botZ;
        assert.ok(dragged > 12 - BARRICADE_LOOP_SLACK_REACH_M - 1,
            `centre dragged downfield (${dragged.toFixed(2)} m)`);
        assert.ok(dragged < 12, 'but still lagging the airframe');
        assert.ok(centre.topY < head.topY, 'top edge pulled down over the airframe');
        assert.ok(
            Math.abs(head.botZ - BARRICADE_LOCAL_Z) < 1e-9,
            'stanchions stay put — the net cones back to them',
        );
        // Load straps stay attached to each other: same downfield offset.
        for (const n of web) {
            assert.ok(Math.abs(n.topZ - n.botZ) < 1e-9, 'load straps move together');
        }
    });
});

describe('barricade engaging loops', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const centreNode = () => {
        const web = computeBarricadeWeb(1, deck);
        return web[Math.floor(web.length / 2)];
    };

    it('drapes each loop aft, pinned at both hang points', () => {
        const n = centreNode();
        const pts = barricadeLoopCurve(n, 1, 9);
        assert.equal(pts.length, 9);

        // Ends are pinned to the load straps.
        assert.ok(Math.abs(pts[0].z - n.botZ) < 1e-9, 'lower end on the lower load strap');
        assert.ok(Math.abs(pts[0].y - n.botY) < 1e-9);
        assert.ok(Math.abs(pts[pts.length - 1].z - n.topZ) < 1e-9, 'upper end on the upper load strap');
        assert.ok(Math.abs(pts[pts.length - 1].y - n.topY) < 1e-9);

        // Everything between bellies aft (+Z, toward the groove), never forward.
        let maxBow = 0;
        for (let i = 1; i + 1 < pts.length; i++) {
            const bow = pts[i].z - n.botZ;
            assert.ok(bow > 0, `sample ${i} should bow aft`);
            maxBow = Math.max(maxBow, bow);
        }
        // The belly is whatever it takes to use the webbing up over this gap —
        // at least the authored bow, more where the strap sags and the gap is
        // shorter than the loop was rigged for.
        assert.ok(
            maxBow >= BARRICADE_LOOP_BOW_M - 0.05,
            `belly ${maxBow.toFixed(2)} m should be at least the authored bow`,
        );
        assert.ok(
            Math.abs(barricadePathLength(pts) - BARRICADE_LOOP_LENGTH_M) < 0.02,
            'and the loop is still its cut length',
        );
    });

    it('holds one lateral station all the way up', () => {
        // Height need not climb monotonically — surplus webbing festoons below
        // the loop — but a stripe is sewn to the straps at one station and stays
        // in that vertical plane.
        const n = centreNode();
        const pts = barricadeLoopCurve(n, 1, 9);
        for (const q of pts) {
            assert.ok(Math.abs(q.x - n.x) < 1e-9, 'loop hangs in one vertical plane');
        }
        assert.ok(pts[pts.length - 1].y > pts[0].y, 'and spans from the lower strap to the upper');
    });

    it('bellies widest below mid-height, where the webbing spreads', () => {
        const pts = barricadeLoopCurve(centreNode(), 1, 21);
        let widest = 0;
        for (let i = 1; i + 1 < pts.length; i++) {
            if (pts[i].z > pts[widest].z || widest === 0) widest = i;
        }
        const t = widest / (pts.length - 1);
        assert.ok(t > 0.3 && t < 0.5, `widest at t=${t.toFixed(2)} should sit below mid-height`);
    });

    it('keeps its length while the net is folded, flaked on the deck', () => {
        // Stowed, the assembly lies on the deck and the webbing is flaked out
        // along it — still the same length of strap, just not standing up.
        const n = computeBarricadeWeb(0, deck)[3];
        const pts = barricadeLoopCurve(n, 0, 33);
        assert.ok(
            Math.abs(barricadePathLength(pts) - BARRICADE_LOOP_LENGTH_M) < 0.02,
            'a folded loop is the same webbing as a rigged one',
        );
        for (const q of pts) {
            assert.ok(q.z >= Math.min(n.botZ, n.topZ) - 1e-6,
                'and it flakes aft along the deck, never forward of the hinge');
        }
    });

    it('is carried along by the straps without changing shape', () => {
        // Dragging the whole net downfield moves both hang points together, so
        // the loop is translated, not stretched: its belly is unchanged. Only
        // wrapping something actually spends its length.
        const n = centreNode();
        const free = barricadeLoopCurve(n, 1, 17).map(p => p.z - n.botZ);
        const dragged = { ...n, topZ: n.topZ - 5, botZ: n.botZ - 5 };
        const moved = barricadeLoopCurve(dragged, 1, 17).map(p => p.z - dragged.botZ);
        for (let i = 0; i < free.length; i++) {
            assert.ok(Math.abs(moved[i] - free[i]) < 1e-6,
                `sample ${i} changed shape when only translated`);
        }
    });
});

describe('barricade wrap profile', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    /**
     * Toy airframe in carrier-local space, already past the webbing plane:
     * a 1 m-radius fuselage on the centreline whose nose is `noseDeep` metres
     * through, plus a thin wing out to `span` that is only half as deep
     * (swept back, so the net reaches it later).
     */
    function toyAirframe(noseDeep: number, span: number, centreX = ARRESTOR_DECK_MID_X) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const belly = BARRICADE_DECK_LOCAL_Y + 1.2;
        for (let i = 0; i <= 20; i++) {
            const y = belly + (i / 20) * 2.0;                    // fuselage 1.2-3.2 m up
            for (let j = -4; j <= 4; j++) {
                addBarricadeWrapPoint(p, centreX + j * 0.25, y, BARRICADE_LOCAL_Z - noseDeep);
            }
        }
        const wingY = belly + 0.6;
        for (let j = -span; j <= span; j += 0.4) {
            if (Math.abs(j) < 1) continue;
            addBarricadeWrapPoint(p, centreX + j, wingY, BARRICADE_LOCAL_Z - noseDeep * 0.5);
        }
        return p;
    }

    it('ignores airframe still short of the webbing', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z + 3);
        assert.equal(p.touched, false, 'nothing has pushed the net yet');
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X), 0);
    });

    it('records the deepest hull point per station', () => {
        const p = toyAirframe(6, 8);
        const nose = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X);
        const wing = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 6);
        const clear = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 15);
        assert.ok(Math.abs(nose - 6) < 0.1, `nose station ${nose.toFixed(2)} should read the nose depth`);
        assert.ok(Math.abs(wing - 3) < 0.1, `wing station ${wing.toFixed(2)} should read the swept wing`);
        assert.equal(clear, 0, 'outboard of the wingtip the net is untouched');
    });

    it('samples depth by height, not just by station', () => {
        const p = toyAirframe(6, 8);
        const x = ARRESTOR_DECK_MID_X;
        const atFuselage = barricadeWrapDepthAt(p, x, BARRICADE_DECK_LOCAL_Y + 2.2);
        const aboveCanopy = barricadeWrapDepthAt(p, x, BARRICADE_DECK_LOCAL_Y + 5.5);
        assert.ok(atFuselage > 5, `webbing on the fuselage should be deep, got ${atFuselage.toFixed(2)}`);
        assert.ok(aboveCanopy < 1, `webbing above the airframe should be near the rig, got ${aboveCanopy.toFixed(2)}`);
    });

    it('load straps take the taut path: peak over the nose, straight to the stanchions', () => {
        const p = toyAirframe(6, 8);
        const taut = barricadeTautPullSampler(p);
        const mid = ARRESTOR_DECK_MID_X;

        // The straps lag the airframe by the slack the loops still have to pay
        // out, so a 6 m-deep hull drags them 6 - BARRICADE_LOOP_SLACK_REACH_M.
        const peak = 6 - BARRICADE_LOOP_SLACK_REACH_M;
        assert.ok(Math.abs(taut(mid) - peak) < 0.3,
            `peak pull ${taut(mid).toFixed(2)} should be ${peak.toFixed(2)}`);
        assert.equal(taut(mid - BARRICADE_HALF_SPAN_M), 0, 'pinned at the left stanchion');
        assert.equal(taut(mid + BARRICADE_HALF_SPAN_M), 0, 'pinned at the right stanchion');

        // Outboard of the airframe the cable is a straight run to the rig, so
        // the pull falls off linearly — no kinks, no rebound.
        let prev = taut(mid + 9);
        for (let x = mid + 10; x < mid + BARRICADE_HALF_SPAN_M; x += 1) {
            const v = taut(x);
            assert.ok(v <= prev + 1e-9, `pull must not rise outboard (x=${x.toFixed(1)})`);
            prev = v;
        }
        // Convex hull: the strap bridges over the swept wing rather than dipping to it.
        assert.ok(taut(mid + 6) > 1, 'taut cable rides above the wing it spans');
    });

    it('follows an off-centre airframe', () => {
        const p = toyAirframe(6, 8, ARRESTOR_DECK_MID_X + 7);
        const taut = barricadeTautPullSampler(p);
        assert.ok(taut(ARRESTOR_DECK_MID_X + 7) > taut(ARRESTOR_DECK_MID_X - 7));
    });

    it('drapes the loops onto the hull instead of coning to a point', () => {
        const p = toyAirframe(6, 8);
        const web = computeBarricadeWeb(1, deck, { stretch: 6, lateral: ARRESTOR_DECK_MID_X, profile: p });
        const node = web.reduce((best, n) =>
            Math.abs(n.x - ARRESTOR_DECK_MID_X) < Math.abs(best.x - ARRESTOR_DECK_MID_X) ? n : best);
        const pull = BARRICADE_LOCAL_Z - node.botZ;
        const pts = barricadeLoopCurve(node, 1, 21, pull, [], p);
        const depth = (q: { z: number }) => BARRICADE_LOCAL_Z - q.z;

        // The loop closes on the hull, reaching it where the airframe is.
        const deepest = pts.reduce((a, b) => (depth(b) > depth(a) ? b : a));
        assert.ok(
            Math.abs(depth(deepest) - 6) < 0.5,
            `loop should reach the 6 m hull, got ${depth(deepest).toFixed(2)}`,
        );
        assert.ok(depth(deepest) > pull + 1, 'and reach well past where the straps are');

        // Both ends stay on the load straps.
        assert.ok(Math.abs(depth(pts[0]) - pull) < 1e-6);
        assert.ok(Math.abs(depth(pts[pts.length - 1]) - (BARRICADE_LOCAL_Z - node.topZ)) < 1e-6);

        // A taut strap bridges straight between contacts, so it may sit forward
        // of the hull directly behind it — but never forward of the deepest
        // thing it has actually closed on, bar the clearance off the skin.
        const grip = Math.max(...pts.map(q => barricadeGrippedDepthAt(p, node.x, q.y)));
        const bound = Math.max(grip, pull + BARRICADE_LOOP_BOW_M) + BARRICADE_WRAP_CLEARANCE_M;
        for (const q of pts) {
            assert.ok(
                depth(q) <= bound + 1e-6,
                `sample at y=${q.y.toFixed(2)} is ${depth(q).toFixed(2)} m deep, bound ${bound.toFixed(2)}`,
            );
        }
    });

    it('falls back to a cone when no collision hull is available', () => {
        const eng = { stretch: 10, lateral: ARRESTOR_DECK_MID_X, profile: null };
        const web = computeBarricadeWeb(1, deck, eng);
        const centre = web[Math.floor(web.length / 2)];
        const head = web[0];
        assert.ok(BARRICADE_LOCAL_Z - centre.botZ > 5, 'centre still dragged');
        assert.ok(Math.abs(head.botZ - BARRICADE_LOCAL_Z) < 1e-9, 'stanchions still pinned');
    });
});

describe('barricade wrap from a collision hull', () => {

    /** Body-space triangle soup for a box: |x|<=hx, |y|<=hy, |z|<=hz. */
    function boxSoup(hx: number, hy: number, hz: number): number[] {
        const c: [number, number, number][] = [];
        for (const sx of [-hx, hx]) for (const sy of [-hy, hy]) for (const sz of [-hz, hz]) {
            c.push([sx, sy, sz]);
        }
        // The profile only cares about the point cloud, so emit corners as
        // degenerate triangles rather than building real faces.
        const out: number[] = [];
        for (const p of c) out.push(p[0], p[1], p[2], p[0], p[1], p[2], p[0], p[1], p[2]);
        return out;
    }

    /** Place a body at carrier-local (x, y, z) with an optional roll about +Z. */
    function pose(x: number, y: number, z: number, roll = 0): THREE.Matrix4 {
        return new THREE.Matrix4().compose(
            new THREE.Vector3(x, y, z),
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll),
            new THREE.Vector3(1, 1, 1),
        );
    }

    it('transforms body vertices into the barricade frame', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        // A 2x1x1 m box whose nose sits 4 m past the plane.
        const used = foldCollisionHullIntoWrap(
            p, boxSoup(2, 1, 1),
            pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z - 3),
            9999,
        );
        assert.equal(used, 24, 'every corner vertex folded in');
        assert.equal(p.touched, true);

        // Deepest face is 3 + 1 = 4 m past the plane. The soup is only corners,
        // so the centreline reads 4 m solely because the gap fill bridges the
        // panel between them — without it the webbing would sink through the box.
        const nose = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X);
        assert.ok(Math.abs(nose - 4) < 0.1, `expected 4 m, got ${nose.toFixed(2)}`);
        for (let x = -1.5; x <= 1.5; x += 0.5) {
            const d = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + x);
            assert.ok(Math.abs(d - 4) < 0.1, `hull should be solid at x=${x}, got ${d.toFixed(2)}`);
        }
        // The box is 2 m half-width, so 6 m outboard is clear.
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 6), 0);
    });

    it('carries the airframe attitude into the profile', () => {
        const level = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const banked = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const soup = boxSoup(6, 0.4, 1);   // a wide, thin wing
        const at = (m: THREE.Matrix4, p: BarricadeWrapProfile) =>
            foldCollisionHullIntoWrap(p, soup, m, 9999);

        at(pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 3, BARRICADE_LOCAL_Z - 2), level);
        at(pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 3, BARRICADE_LOCAL_Z - 2, 0.5), banked);

        // Level, both tips sit at the same height; banked, one rides high.
        const tipHeight = (p: BarricadeWrapProfile, x: number) => {
            let hi = -1;
            for (let iy = 0; iy < p.ny; iy++) {
                const ix = Math.round((x - p.x0) / p.binX);
                if (p.depth[iy * p.nx + ix] > 0) hi = p.y0 + iy * p.binY;
            }
            return hi;
        };
        const l = tipHeight(level, ARRESTOR_DECK_MID_X + 5.5);
        const bl = tipHeight(banked, ARRESTOR_DECK_MID_X + 5.5);
        const br = tipHeight(banked, ARRESTOR_DECK_MID_X - 5.5);
        assert.ok(l > 0 && bl > 0 && br > 0, 'all tips register');
        assert.ok(bl > l + 0.4, 'banked wing rides higher than level');
        assert.ok(bl > br + 1.0, 'and higher than its own opposite tip');
    });

    it('strides heavy meshes down to the vertex budget', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const big: number[] = [];
        for (let i = 0; i < 5000; i++) big.push(0, 0, 0);       // 5000 vertices
        const used = foldCollisionHullIntoWrap(
            p, big, pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z - 2), 500,
        );
        assert.ok(used <= 500, `expected <= 500 samples, got ${used}`);
        assert.ok(used > 400, 'and not far below the budget');
    });

    it('leaves the profile untouched for an airframe short of the net', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        foldCollisionHullIntoWrap(
            p, boxSoup(2, 1, 1),
            pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z + 8),
            9999,
        );
        assert.equal(p.touched, false);
    });

    it('resets cleanly between frames', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        foldCollisionHullIntoWrap(
            p, boxSoup(2, 1, 1),
            pose(ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z - 3),
            9999,
        );
        assert.equal(p.touched, true);
        resetBarricadeWrapProfile(p, BARRICADE_DECK_LOCAL_Y);
        assert.equal(p.touched, false);
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X), 0);
        for (const v of p.depth) assert.equal(v, 0);
    });
});

describe('barricade wrap gap fill', () => {

    it('bridges an interior hole without widening the silhouette', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const y = BARRICADE_DECK_LOCAL_Y + 2;
        // Two hull points 3 m apart at different depths, nothing between them.
        addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X - 1.5, y, BARRICADE_LOCAL_Z - 6);
        addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + 1.5, y, BARRICADE_LOCAL_Z - 3);
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X), 0, 'hole before fill');

        closeBarricadeWrapGaps(p);
        // Column depth reads the stored cell directly, so this is the ramp
        // itself rather than a bilinear sample across it.
        const mid = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X);
        assert.ok(Math.abs(mid - 4.5) < 0.6, `ramp should reach ~4.5 m, got ${mid.toFixed(2)}`);
        const lo = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X - 0.75);
        const hi = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 0.75);
        assert.ok(lo > mid && mid > hi, 'ramp runs monotonically between the two hull points');

        // Outside the two hull points nothing was invented.
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X - 4), 0);
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 4), 0);
    });

    it('feathers depth at the vertical edge of the airframe', () => {
        // A one-cell-thick feature must not read full depth just above itself:
        // that taper is how the webbing releases off the top of a fuselage.
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        const y = BARRICADE_DECK_LOCAL_Y + 2;
        for (let x = -1.5; x <= 1.5; x += 0.5) {
            addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, y, BARRICADE_LOCAL_Z - 5);
        }
        closeBarricadeWrapGaps(p);
        const on = barricadeWrapDepthAt(p, ARRESTOR_DECK_MID_X, y);
        const above = barricadeWrapDepthAt(p, ARRESTOR_DECK_MID_X, y + 1.2);
        assert.ok(on > above, 'depth falls off above the airframe');
        assert.ok(above < 1.0, `well clear of the hull should be near the rig, got ${above.toFixed(2)}`);
    });

    it('is a no-op on an untouched profile', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        closeBarricadeWrapGaps(p);
        assert.equal(p.touched, false);
        for (const v of p.depth) assert.equal(v, 0);
    });
});

describe('barricade parts around the forward fuselage', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    /**
     * Airframe with a narrow deep fuselage and broad shallow wings — the shape
     * that makes a barricade behave the way it does.
     */
    function noseAndWings(noseDeep: number, wingDeep: number, halfSpan = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1.15; x <= 1.15; x += 0.2) {
            for (let y = 0.9; y <= 3.1; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - noseDeep);
            }
        }
        for (let x = -halfSpan; x <= halfSpan; x += 0.2) {
            if (Math.abs(x) < 1.15) continue;
            for (let y = 1.4; y <= 1.9; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - wingDeep);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    it('hangs on the wings, not the nose', () => {
        const p = noseAndWings(8, 3);
        assert.ok(
            Math.abs(p.catchDepth - 3) < 0.3,
            `catch depth ${p.catchDepth.toFixed(2)} should be the wings, not the 8 m nose`,
        );
        // The net is never dragged as deep as the nose, so the nose comes through.
        assert.ok(
            barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X) <= p.catchDepth + 1e-6,
            'webbing on the centreline is capped at what the wings can hold',
        );
    });

    it('brackets the fuselage in the parting band', () => {
        const p = noseAndWings(8, 3);
        assert.ok(p.slipRight > p.slipLeft, 'a parting band exists');
        assert.ok(barricadeIsSlipStation(p, ARRESTOR_DECK_MID_X), 'centreline parts');
        assert.ok(!barricadeIsSlipStation(p, ARRESTOR_DECK_MID_X + 5), 'the wing does not part');
        const halfBand = (p.slipRight - p.slipLeft) * 0.5;
        assert.ok(halfBand > 1.0 && halfBand < 3.5, `band half-width ${halfBand.toFixed(2)} m`);
    });

    it('a nose alone carries nothing — the webbing stays put', () => {
        // Wings still short of the net; only the fuselage is through it.
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1.15; x <= 1.15; x += 0.2) {
            for (let y = 0.9; y <= 3.1; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 5);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        assert.equal(p.catchDepth, 0, 'nothing broad enough to gather loops');
        const taut = barricadeTautPullSampler(p);
        assert.equal(taut(ARRESTOR_DECK_MID_X), 0, 'load straps undisturbed by a bare nose');
    });

    it('wraps normally when nothing is narrow enough to slip', () => {
        // A broad flat obstacle: no parting band, the net simply drapes it.
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -5; x <= 5; x += 0.2) {
            for (let y = 1.0; y <= 3.0; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 4);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        assert.ok(Math.abs(p.catchDepth - 4) < 0.2, 'the whole slab catches');
        assert.equal(barricadeIsSlipStation(p, ARRESTOR_DECK_MID_X), false, 'nothing parts');
    });

    it('reads the raw hull until finalized, so a half-built profile is never blank', () => {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X, BARRICADE_DECK_LOCAL_Y + 2, BARRICADE_LOCAL_Z - 5);
        assert.equal(p.finalized, false);
        assert.ok(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X) > 4, 'uncapped before finalize');
        finalizeBarricadeWrap(p);
        assert.equal(p.finalized, true);
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X), 0, 'capped after');
    });
});

describe('barricade loop sliding', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    function partedWeb() {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1.15; x <= 1.15; x += 0.2) {
            for (let y = 0.9; y <= 3.1; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 8);
            }
        }
        for (let x = -6; x <= 6; x += 0.2) {
            if (Math.abs(x) < 1.15) continue;
            for (let y = 1.4; y <= 1.9; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 3);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        const web = computeBarricadeWeb(1, deck, {
            stretch: 8, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        return { p, web, stations: barricadeLoopStations(web, p) };
    }

    it('leaves every loop laced in place when the net is clear', () => {
        const web = computeBarricadeWeb(1, deck);
        const stations = barricadeLoopStations(web, null);
        const rest = barricadeLoopLocalX();
        assert.equal(stations.length, rest.length);
        for (let i = 0; i < stations.length; i++) {
            assert.equal(stations[i].x, rest[i]);
            assert.equal(stations[i].slid, false);
        }
    });



    it('never slides a loop further than the strap fittings allow', () => {
        const { stations } = partedWeb();
        for (const s of stations) {
            assert.ok(
                Math.abs(s.x - s.restX) <= BARRICADE_LOOP_SLIDE_MAX_M + 1e-6,
                `slide of ${(s.x - s.restX).toFixed(2)} m exceeds the limit`,
            );
        }
    });

    it('keeps slid loops hanging on the load straps', () => {
        const { web, stations } = partedWeb();
        for (const s of stations) {
            const on = barricadeStrapNodeAt(web, s.x);
            assert.ok(Math.abs(s.node.topY - on.topY) < 1e-9, 'upper hang point on the strap');
            assert.ok(Math.abs(s.node.botZ - on.botZ) < 1e-9, 'lower hang point on the strap');
            assert.equal(s.node.x, s.x);
        }
    });

    it('interpolates strap hang points between laced stations', () => {
        const web = computeBarricadeWeb(1, deck);
        const a = web[3];
        const b = web[4];
        const mid = barricadeStrapNodeAt(web, (a.x + b.x) * 0.5);
        assert.ok(Math.abs(mid.topY - (a.topY + b.topY) * 0.5) < 1e-9);
        assert.ok(Math.abs(mid.botY - (a.botY + b.botY) * 0.5) < 1e-9);
        // Outside the rig it clamps rather than extrapolating off the ship.
        const past = barricadeStrapNodeAt(web, web[web.length - 1].x + 50);
        assert.equal(past.topY, web[web.length - 1].topY);
    });
});

describe('barricade wraps the wings', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    /** Wing at this height above the deck, and this thick. */
    const WING_Y = 1.6;
    const WING_HALF_T = 0.2;

    /** Narrow deep fuselage plus a broad thin wing that is what actually catches. */
    function wingedHull(noseDeep = 8, wingDeep = 3) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1.15; x <= 1.15; x += 0.15) {
            for (let y = 0.9; y <= 3.1; y += 0.15) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - noseDeep);
            }
        }
        for (let x = -6; x <= 6; x += 0.15) {
            if (Math.abs(x) < 1.15) continue;
            for (let y = WING_Y - WING_HALF_T; y <= WING_Y + WING_HALF_T; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - wingDeep);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    /** The loop hanging nearest the given lateral offset, plus its curve. */
    function loopAt(p: BarricadeWrapProfile, offset: number, samples = 25) {
        const web = computeBarricadeWeb(1, deck, {
            stretch: 8, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        const target = ARRESTOR_DECK_MID_X + offset;
        const st = barricadeLoopStations(web, p)
            .reduce((a, b) => (Math.abs(b.x - target) < Math.abs(a.x - target) ? b : a));
        const pull = BARRICADE_LOCAL_Z - st.node.botZ;
        const pts = barricadeLoopCurve(st.node, 1, samples, pull, [], p);
        return { st, pull, pts, depth: (q: { z: number }) => BARRICADE_LOCAL_Z - q.z };
    }

    it('the load straps lag the wing by the loops’ slack', () => {
        const p = wingedHull();
        const { pull } = loopAt(p, 4.5);
        assert.ok(pull > 0, 'straps are dragged along');
        assert.ok(
            Math.abs(pull - (p.catchDepth - BARRICADE_LOOP_SLACK_REACH_M)) < 0.4,
            `strap pull ${pull.toFixed(2)} should lag the ${p.catchDepth.toFixed(2)} m wing`,
        );
        // If the straps kept pace with the wing there would be no wrap at all.
        assert.ok(pull < p.catchDepth - 1, 'strap sits well behind the wing');
    });

    it('closes forward around the wing, not just against it', () => {
        const p = wingedHull();
        const { pull, pts, depth } = loopAt(p, 4.5);
        const deepest = pts.reduce((a, b) => (depth(b) > depth(a) ? b : a));

        assert.ok(
            Math.abs(depth(deepest) - p.catchDepth) < 0.4,
            `loop should close on the wing at ${p.catchDepth.toFixed(2)} m, got ${depth(deepest).toFixed(2)}`,
        );
        assert.ok(depth(deepest) - pull > 1.2, 'and bulge well forward of the straps');
        // The bulge is at the wing, not somewhere arbitrary.
        assert.ok(
            Math.abs((deepest.y - BARRICADE_DECK_LOCAL_Y) - WING_Y) < BARRICADE_WING_GRIP_M + 0.4,
            `bulge at ${(deepest.y - BARRICADE_DECK_LOCAL_Y).toFixed(2)} m should be at the wing`,
        );
    });

    it('grips above and below the wing, well past its own thickness', () => {
        const p = wingedHull();
        const { pts, depth } = loopAt(p, 4.5, 41);
        const near = depth(pts.reduce((a, b) => (depth(b) > depth(a) ? b : a))) - 0.35;
        const gripped = pts.filter(q => depth(q) >= near);
        const lo = Math.min(...gripped.map(q => q.y)) - BARRICADE_DECK_LOCAL_Y;
        const hi = Math.max(...gripped.map(q => q.y)) - BARRICADE_DECK_LOCAL_Y;

        // The grip is the leading-edge run plus the face grip either side — it
        // is deliberately not the whole column any more, so it is a band around
        // the wing rather than a bar across everything the column contains.
        assert.ok(hi - lo > 2 * WING_HALF_T,
            `grip spans ${(hi - lo).toFixed(2)} m, at least the ${(2 * WING_HALF_T).toFixed(2)} m wing`);
        assert.ok(hi - lo < 2 * WING_HALF_T + 2 * BARRICADE_WING_WRAP_RISE_M + 0.5,
            'and stays a band round the edge, not a bar across the column');
        assert.ok(lo < WING_Y && hi > WING_Y, 'the grip straddles the wing');
    });

    it('closes into a C around the wing section', () => {
        const p = wingedHull();
        const { pts, depth } = loopAt(p, 4.5, 41);
        const peak = pts.reduce((a, b) => (depth(b) > depth(a) ? b : a));
        const iPeak = pts.indexOf(peak);

        // Forward face: a plateau of samples all at the leading edge, not a
        // single point of contact.
        const onFace = pts.filter(q => depth(q) > depth(peak) - 1e-6);
        assert.ok(onFace.length >= 3, `webbing lies along the leading edge (${onFace.length} samples)`);

        // Either side of it the webbing curls aft along the skin — that curl is
        // the wrap, and it has to be a real distance, not a corner.
        const faceLo = Math.min(...onFace.map(q => q.y));
        const faceHi = Math.max(...onFace.map(q => q.y));
        const below = pts.filter(q => q.y < faceLo);
        const above = pts.filter(q => q.y > faceHi);
        assert.ok(below.length > 2 && above.length > 2, 'the loop continues past the face both ways');
        assert.ok(depth(peak) - Math.min(...below.map(depth)) > 0.5,
            'webbing curls aft under the section');
        assert.ok(depth(peak) - Math.min(...above.map(depth)) > 0.5,
            'and aft over it');

        // Monotone away from the face on both sides: it hugs round, it does not
        // wander back and forth.
        for (let i = 1; i <= iPeak; i++) {
            assert.ok(depth(pts[i]) >= depth(pts[i - 1]) - 1e-6,
                `run up to the wing must not fall back (sample ${i})`);
        }
        assert.ok(
            Math.abs(barricadePathLength(pts) - BARRICADE_LOOP_LENGTH_M) < 0.05,
            'and the loop is still its cut length',
        );
    });

    it('leaves an unloaded loop slack, belly and all', () => {
        // A loop outboard of the wingtip has closed on nothing.
        const p = wingedHull();
        const { pts, depth } = loopAt(p, 13);
        const deepest = pts.reduce((a, b) => (depth(b) > depth(a) ? b : a));
        const shallowest = pts.reduce((a, b) => (depth(b) < depth(a) ? b : a));
        assert.ok(
            depth(shallowest) < depth(pts[0]) - 0.3,
            'still bellies aft of its hang points',
        );
        assert.ok(depth(deepest) < 2, 'and is not dragged onto anything');
    });

    it('pays out the slack, then hauls the straps along', () => {
        // The loop has a fixed amount of spare length. Once a wing has used it
        // up, driving deeper does not stretch the loop further — it drags the
        // whole net downfield instead.
        const runs = [2, 3, 5].map(wingDeep => loopAt(wingedHull(8, wingDeep), 4.5));
        const reach = (r: typeof runs[0]) =>
            r.depth(r.pts.reduce((p, q) => (r.depth(q) > r.depth(p) ? q : p))) - r.pull;

        for (const r of runs) {
            assert.ok(reach(r) > 1, `loop still bulges forward (${reach(r).toFixed(2)} m)`);
            assert.ok(
                reach(r) <= BARRICADE_LOOP_SLACK_REACH_M + 0.3,
                `reach ${reach(r).toFixed(2)} must not exceed the loop's slack`,
            );
        }
        for (let i = 1; i < runs.length; i++) {
            assert.ok(runs[i].pull > runs[i - 1].pull,
                'a deeper wing drags the load straps further downfield');
        }
    });

    it('closes on the wing at whatever depth it is presented', () => {
        for (const wingDeep of [2, 3, 5]) {
            const p = wingedHull(8, wingDeep);
            const { pts, depth } = loopAt(p, 4.5, 41);
            const peak = depth(pts.reduce((a, b) => (depth(b) > depth(a) ? b : a)));
            assert.ok(
                peak > wingDeep * 0.85,
                `wing at ${wingDeep} m should be gripped, loop only reached ${peak.toFixed(2)}`,
            );
            assert.ok(peak <= wingDeep + 0.2, 'and not pushed past it');
        }
    });
});

describe('barricade rig fitted to the deck', () => {

    const NOMINAL = barricadeRig();
    const DECK = BARRICADE_DECK_LOCAL_Y;
    /** Anything at or below this is open water, not deck. */
    const SEA = 0;

    /** Deck present only between `leftEdge` and `rightEdge` (carrier-local X). */
    function deckBetween(leftEdge: number, rightEdge: number, y = DECK) {
        return (x: number) => (x >= leftEdge && x <= rightEdge ? y : SEA);
    }

    it('leaves the nominal span alone when the deck is wide enough', () => {
        const rig = fitBarricadeRig(deckBetween(-100, 100));
        assert.ok(Math.abs(rig.leftX - NOMINAL.leftX) < 1e-9);
        assert.ok(Math.abs(rig.rightX - NOMINAL.rightX) < 1e-9);
        assert.equal(rig.loopX.length, BARRICADE_ENGAGING_LOOPS);
    });

    it('pulls a stanchion in off a deck edge it was hanging over', () => {
        // Deck stops 4 m inboard of the nominal left stanchion — the case the
        // narrow forward end of the angled deck actually presents.
        const edge = NOMINAL.leftX + 4;
        const rig = fitBarricadeRig(deckBetween(edge, 100));

        assert.ok(rig.leftX >= edge, 'foot is on deck, not over the edge');
        assert.ok(rig.leftX > NOMINAL.leftX, 'and inboard of where it was rigged');
        assert.ok(
            rig.leftX <= edge + BARRICADE_DECK_EDGE_INSET_M + BARRICADE_DECK_PROBE_STEP_M + 1e-9,
            'but no further in than it needs to be',
        );
        assert.ok(Math.abs(rig.rightX - NOMINAL.rightX) < 1e-9, 'the other end is untouched');
    });

    it('stands both feet on deck when both ends overhang', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 3, NOMINAL.rightX - 3));
        assert.ok(rig.leftX > NOMINAL.leftX);
        assert.ok(rig.rightX < NOMINAL.rightX);
        assert.ok(rig.halfSpan < NOMINAL.halfSpan, 'span narrows to suit');
    });

    it('keeps the whole rig consistent with the fitted span', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 5, NOMINAL.rightX - 2));

        // Nodes run mast, every loop, mast — in order. Rigged, the belt ends sit
        // at the masts, so the outermost node pairs coincide until wire pays out.
        assert.equal(rig.nodeX.length, rig.loopX.length + 2);
        assert.equal(rig.nodeX[0], rig.leftX);
        assert.equal(rig.nodeX[rig.nodeX.length - 1], rig.rightX);
        for (let i = 1; i < rig.nodeX.length; i++) {
            assert.ok(rig.nodeX[i] >= rig.nodeX[i - 1], `node ${i} out of order`);
        }
        for (const x of rig.loopX) {
            assert.ok(x >= rig.leftX - 1e-9 && x <= rig.rightX + 1e-9,
                'loop is on the belt between the masts');
        }
        assert.ok(Math.abs(rig.loopX[0] - rig.leftX) < 1e-9, 'belt starts at the left mast');
        assert.ok(
            Math.abs(rig.loopX[rig.loopX.length - 1] - rig.rightX) < 1e-9,
            'and ends at the right mast',
        );
        assert.ok(Math.abs(rig.midX - (rig.leftX + rig.rightX) / 2) < 1e-9);
    });

    it('gives up gracefully when the probe finds no deck at all', () => {
        const rig = fitBarricadeRig(() => SEA);
        assert.ok(Math.abs(rig.leftX - NOMINAL.leftX) < 1e-9, 'falls back to nominal');
        assert.ok(Math.abs(rig.rightX - NOMINAL.rightX) < 1e-9);
    });

    it('does not collapse the span on a sliver of deck', () => {
        // Only a 1 m strip of deck: pulling both feet onto it would leave no
        // barricade at all, so the nominal rig is kept instead.
        const rig = fitBarricadeRig(deckBetween(-0.5, 0.5));
        assert.ok(rig.halfSpan > 1, `span ${rig.halfSpan.toFixed(2)} must stay usable`);
    });

    it('seats the webbing on the deck under it, never at a fixed datum', () => {
        // A deck 2 m lower than the flat datum: the net has to follow it down,
        // which is exactly what the old clamp to BARRICADE_DECK_LOCAL_Y broke.
        const low = DECK - 2;
        const web = computeBarricadeWeb(1, () => low, null, NOMINAL);
        for (const n of web) {
            assert.ok(
                Math.abs(n.botY - (low + BARRICADE_LOWER_STRAP_LIFT_M)) < 1e-9,
                `lower strap at ${n.botY.toFixed(2)} should sit on the ${low.toFixed(2)} m deck`,
            );
        }
    });

    it('lays the web out on a fitted rig, not the nominal one', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 6, NOMINAL.rightX));
        const web = computeBarricadeWeb(1, () => DECK, null, rig);
        assert.equal(web.length, rig.nodeX.length);
        assert.ok(Math.abs(web[0].x - rig.leftX) < 1e-9, 'web starts at the fitted stanchion');
        assert.ok(Math.abs(web[web.length - 1].x - rig.rightX) < 1e-9);

        // Sag is still zero at the stanchions and largest mid-span, on the new span.
        const heads = [web[0].topY, web[web.length - 1].topY];
        const centre = web[Math.floor(web.length / 2)].topY;
        assert.ok(Math.abs(heads[0] - heads[1]) < 1e-9, 'both heads at full height');
        assert.ok(centre < heads[0], 'mid-span still sags');
    });

    it('arrests across the span it is actually rigged on', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 5, NOMINAL.rightX - 5));
        const field = buildBarricadeField(
            { position: { ...ARRESTOR_CARRIER_ORIGIN } }, BARRICADE_DECK_LOCAL_Y, 1, rig,
        );
        assert.ok(Math.abs(field.halfSpan - rig.halfSpan) < 1e-9,
            'physics span follows the fitted rig');
        assert.ok(field.halfSpan < NOMINAL.halfSpan, 'and is narrower than nominal');
        assert.ok(
            Math.abs(field.center.x - (ARRESTOR_CARRIER_ORIGIN.x + rig.midX)) < 1e-6,
            'centred on the fitted rig',
        );
    });
});

describe('barricade rig avoids the island', () => {

    const NOMINAL = barricadeRig();
    const DECK = BARRICADE_DECK_LOCAL_Y;

    /**
     * The Kuznetsov as measured off `assets/kuz.glb` along the barricade line:
     * flight deck with a slight camber out to +15.8 m of the landing lane's
     * centreline, then the island standing ~7 m proud of it.
     *
     * The nominal starboard stanchion lands at +17.5, squarely on the island —
     * which is what put a stanchion in mid-air seven metres over the deck.
     */
    function kuznetsovAt(x: number): number {
        const rel = x - ARRESTOR_DECK_MID_X;
        if (rel > 15.8) return 20.86;              // island
        if (rel < -24) return 0;                   // over the side
        return DECK + 0.14 + rel * 0.0092;         // deck, cambered to starboard
    }

    it('never seats a stanchion on the superstructure', () => {
        assert.ok(kuznetsovAt(NOMINAL.rightX) > DECK + 5,
            'precondition: the nominal station really is on the island');

        const rig = fitBarricadeRig(kuznetsovAt);
        const under = kuznetsovAt(rig.rightX);
        assert.ok(
            Math.abs(under - rig.deckY) <= BARRICADE_DECK_BAND_M,
            `stbd stanchion on ${under.toFixed(2)} m, deck is ${rig.deckY.toFixed(2)} m`,
        );
        assert.ok(rig.rightX < NOMINAL.rightX, 'pulled inboard off the island');
        assert.ok(rig.rightX - ARRESTOR_DECK_MID_X > 12, 'but the span stays usable');
    });

    it('leaves the port stanchion where it was rigged', () => {
        const rig = fitBarricadeRig(kuznetsovAt);
        assert.ok(Math.abs(rig.leftX - NOMINAL.leftX) < 1e-9,
            'there is deck under the port end, so it does not move');
    });

    it('puts every load-strap node on the flight deck', () => {
        const rig = fitBarricadeRig(kuznetsovAt);
        for (const x of rig.nodeX) {
            const y = kuznetsovAt(x);
            assert.ok(
                Math.abs(y - rig.deckY) <= BARRICADE_DECK_BAND_M,
                `node at ${(x - ARRESTOR_DECK_MID_X).toFixed(2)} m is on ${y.toFixed(2)} m`,
            );
        }
    });

    it('seats webbing back on the deck if a probe strays onto the island', () => {
        const rig = fitBarricadeRig(kuznetsovAt);
        // Deck camber passes through untouched...
        for (const x of rig.nodeX) {
            assert.equal(barricadeSeatOnDeck(rig, kuznetsovAt(x)), kuznetsovAt(x));
        }
        // ...but the island and open water are pulled back to the deck band.
        assert.ok(barricadeSeatOnDeck(rig, 20.86) <= rig.deckY + BARRICADE_DECK_BAND_M);
        assert.ok(barricadeSeatOnDeck(rig, 0) >= rig.deckY - BARRICADE_DECK_BAND_M);
    });

    it('follows the deck camber rather than clamping to a flat datum', () => {
        const rig = fitBarricadeRig(kuznetsovAt);
        const web = computeBarricadeWeb(1, x => barricadeSeatOnDeck(rig, kuznetsovAt(x)), null, rig);
        const port = web[0].botY;
        const stbd = web[web.length - 1].botY;
        assert.ok(stbd > port, 'the net sits slightly higher to starboard, as the deck does');
        assert.ok(stbd - port < 0.6, 'and only by the camber');
    });
});

describe('barricade webbing lies across the wing, not inside it', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const WING_Y = 1.7;

    /**
     * Swept wing: deeper inboard than outboard, which is what exposed the old
     * global cap. `catchDepth` lands on the broad outboard level, so clipping
     * every reading to it buried the webbing behind the deeper wing root.
     */
    function sweptWing(rootDeep = 6, tipDeep = 2.5, halfSpan = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        // Narrow nose, deeper than anything, so a parting band exists too.
        for (let x = -1.0; x <= 1.0; x += 0.15) {
            for (let y = 0.9; y <= 3.1; y += 0.15) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -halfSpan; x <= halfSpan; x += 0.15) {
            if (Math.abs(x) < 1.0) continue;
            const t = (Math.abs(x) - 1.0) / (halfSpan - 1.0);
            const d = rootDeep + (tipDeep - rootDeep) * t;
            for (let y = WING_Y - 0.2; y <= WING_Y + 0.2; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - d);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    it('reads the wing root at its real depth, not clipped to the catch level', () => {
        const p = sweptWing();
        // Just outboard of the parting band, where the wing is still deep.
        const root = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 3.0);
        const tip = barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + 5.6);
        // The reading follows the sweep instead of collapsing to one scalar,
        // which is exactly what the old global cap to catchDepth destroyed.
        assert.ok(root > tip + 1, `root ${root.toFixed(2)} should be deeper than tip ${tip.toFixed(2)}`);
        const across = [2, 3, 4, 5].map(o =>
            barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + o));
        for (let i = 1; i < across.length; i++) {
            assert.ok(across[i] < across[i - 1],
                `depth must fall outboard: ${across.map(v => v.toFixed(2)).join(' ')}`);
        }
    });

    it('never sits behind the wing it is lying on', () => {
        const p = sweptWing();
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        for (const st of barricadeLoopStations(web, p)) {
            const rel = st.node.x - ARRESTOR_DECK_MID_X;
            if (Math.abs(rel) < 1.2 || Math.abs(rel) > 5.5) continue;   // on the wing only
            const pull = barricadeEngagementPullAt(st.node.x, {
                stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
            });
            const pts = barricadeLoopCurve(st.node, 1, 33, pull, [], p);
            // Compare the loop's deepest point: with the net closing on the
            // airframe the loop's samples no longer sit at a fixed height.
            const webbing = Math.max(...pts.map(q => BARRICADE_LOCAL_Z - q.z));
            // Against the depth the curve itself reads at this station — the
            // exact cell max belongs to a neighbouring column.
            const wing = barricadeWrapFaceDepthAt(p, st.node.x,
                (st.node.botY + st.node.topY) * 0.5);
            assert.ok(
                webbing >= wing,
                `at x=${rel.toFixed(1)} webbing is ${webbing.toFixed(2)} m deep but the wing is ${wing.toFixed(2)}`,
            );
        }
    });

    it('stands the webbing clear of the skin so it is not coplanar', () => {
        const p = sweptWing();
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        const st = barricadeLoopStations(web, p)
            .reduce((a, b) => Math.abs(b.node.x - (ARRESTOR_DECK_MID_X + 3))
                < Math.abs(a.node.x - (ARRESTOR_DECK_MID_X + 3)) ? b : a);
        const pull = barricadeEngagementPullAt(st.node.x, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        const pts = barricadeLoopCurve(st.node, 1, 33, pull, [], p);
        const peak = Math.max(...pts.map(q => BARRICADE_LOCAL_Z - q.z));
        const hull = barricadeWrapColumnDepth(p, st.node.x);
        // Compare against the depth the wrap itself reads — the band spans more
        // than one profile column, so a single column understates a swept wing.
        let seen = 0;
        for (const q of pts) {
            seen = Math.max(seen, barricadeWrapFaceDepthAt(p, st.node.x, q.y));
        }
        const stand = peak - seen;
        assert.ok(
            stand >= BARRICADE_WRAP_CLEARANCE_M - 1e-6,
            `webbing stands only ${stand.toFixed(3)} m off the skin`,
        );
        assert.ok(stand < BARRICADE_WRAP_CLEARANCE_M + 0.05, 'but is not floating off it');
        assert.ok(peak > seen, 'and is forward of the section it is lying on');
        void hull;
    });

    it('still lets the nose through without wrapping it', () => {
        const p = sweptWing();
        assert.ok(p.slipRight > p.slipLeft, 'the narrow nose still parts the webbing');
        assert.equal(barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X), 0,
            'no webbing depth on the parting nose');
    });

    it('finds no parting band on an airframe with nothing narrow out front', () => {
        // A slab as wide as it is deep: everything catches, nothing parts.
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -5; x <= 5; x += 0.2) {
            for (let y = 1.0; y <= 3.0; y += 0.2) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 4);
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        assert.equal(p.slipRight, p.slipLeft, 'no parting band at all');
        // ...so the whole face is readable, right through the middle.
        for (let x = -4; x <= 4; x += 1) {
            assert.ok(
                barricadeWrapColumnDepth(p, ARRESTOR_DECK_MID_X + x) > 3.5,
                `station ${x} should read the slab, not be blanked as a parting band`,
            );
        }
    });
});

describe('barricade closes as it is dragged', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const REST = BARRICADE_LOOP_REST_SPAN_M;

    it('leaves the straps at their rigged gap while the net is clear', () => {
        assert.equal(barricadeLoopSpanAt(REST, 0), REST);
        const web = computeBarricadeWeb(1, deck);
        for (const n of web) {
            assert.ok(n.topY > n.botY, 'upper strap above the lower one');
        }
    });

    it('draws the straps together the further the net is hauled', () => {
        const floor = REST * BARRICADE_LOOP_MIN_SPAN_FRAC;
        let prev = barricadeLoopSpanAt(REST, 0);
        let closedAt = Infinity;
        for (let pull = 0.5; pull <= 12; pull += 0.5) {
            const span = barricadeLoopSpanAt(REST, pull);
            assert.ok(span <= prev + 1e-9, `span must never re-open (pull ${pull} m)`);
            // Strictly closing right up until it is as tight as it goes.
            if (span > floor + 1e-9) {
                assert.ok(span < prev, `span must keep closing (pull ${pull} m)`);
            } else {
                closedAt = Math.min(closedAt, pull);
            }
            prev = span;
        }
        assert.ok(closedAt < 12, 'the net does reach its tightest within a run-out');
        assert.ok(closedAt > 2, `should not slam shut immediately (closed at ${closedAt} m)`);
    });

    it('never closes tighter than the loops can reach around an airframe', () => {
        const floor = REST * BARRICADE_LOOP_MIN_SPAN_FRAC;
        for (const pull of [10, 25, 100]) {
            const span = barricadeLoopSpanAt(REST, pull);
            assert.ok(span >= floor - 1e-9, `span ${span.toFixed(2)} fell below the floor`);
        }
    });

    it('closes the net around an engaged airframe, both straps moving', () => {
        const clear = computeBarricadeWeb(1, deck);
        const caught = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        const mid = Math.floor(clear.length / 2);

        assert.ok(caught[mid].topY < clear[mid].topY, 'upper strap comes down');
        assert.ok(caught[mid].botY > clear[mid].botY, 'lower strap comes up');

        const gapBefore = clear[mid].topY - clear[mid].botY;
        const gapAfter = caught[mid].topY - caught[mid].botY;
        assert.ok(gapAfter < gapBefore - 1, `gap ${gapBefore.toFixed(2)} -> ${gapAfter.toFixed(2)}`);
        // The top does most of the closing; the lower strap is nearly on the deck.
        const topMoved = clear[mid].topY - caught[mid].topY;
        const botMoved = caught[mid].botY - clear[mid].botY;
        assert.ok(topMoved > botMoved, 'the upper strap travels further');
    });

    it('closes hardest where the airframe is, not at the stanchions', () => {
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        const gap = (n: { topY: number; botY: number }) => n.topY - n.botY;
        const centre = gap(web[Math.floor(web.length / 2)]);
        const end = gap(web[0]);
        assert.ok(centre < end, 'the net is closed over the aircraft, open at the rig');
    });

    it('keeps the straps parallel in the deck plane, so one tangent orients every strip', () => {
        // Both straps carry the same downfield offset at each station, which is
        // what lets the renderer turn a strip with a single belt direction.
        const web = computeBarricadeWeb(1, deck, {
            stretch: 7, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        for (const n of web) {
            assert.ok(Math.abs(n.topZ - n.botZ) < 1e-9,
                `straps diverge in Z at x=${n.x.toFixed(2)}`);
        }
    });

    it('bends the straps away from the deck-lateral axis when dragged', () => {
        // If the straps stayed straight across the deck there would be nothing
        // for a strip to turn with; the drag is what gives them a direction.
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        let maxSkew = 0;
        for (let i = 1; i < web.length; i++) {
            const dx = web[i].x - web[i - 1].x;
            const dz = web[i].botZ - web[i - 1].botZ;
            maxSkew = Math.max(maxSkew, Math.abs(dz / dx));
        }
        assert.ok(maxSkew > 0.2, `straps should run diagonally, max slope ${maxSkew.toFixed(2)}`);
    });
});

describe('barricade strips close onto the wing', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const WING_Y = 1.75;
    const WING_HALF_T = 0.22;

    function wingedHull(wingDeep = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -6; x <= 6; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            for (let y = WING_Y - WING_HALF_T; y <= WING_Y + WING_HALF_T; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                        BARRICADE_LOCAL_Z - wingDeep + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    /** Web node nearest a lateral offset, engaged and clear, for comparison. */
    function nodes(p: BarricadeWrapProfile, offset: number) {
        const eng = { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p };
        const near = (web: ReturnType<typeof computeBarricadeWeb>) => {
            const target = ARRESTOR_DECK_MID_X + offset;
            return web.reduce((a, b) =>
                Math.abs(b.x - target) < Math.abs(a.x - target) ? b : a);
        };
        return {
            caught: near(computeBarricadeWeb(1, deck, eng)),
            clear: near(computeBarricadeWeb(1, deck)),
        };
    }

    it('reads the vertical extent of what it has caught', () => {
        const p = wingedHull();
        const out = { lo: 1, hi: 0 };
        barricadeWrapColumnExtent(p, ARRESTOR_DECK_MID_X + 4, out);
        assert.ok(out.hi > out.lo, 'the wing registers');
        const mid = (out.lo + out.hi) * 0.5 - BARRICADE_DECK_LOCAL_Y;
        assert.ok(Math.abs(mid - WING_Y) < 0.6, `extent centred at ${mid.toFixed(2)}, wing at ${WING_Y}`);
        assert.ok(out.hi - out.lo < 1.5, 'and is a thin wing, not the whole airframe');
    });

    it('reports no extent where nothing has been caught', () => {
        const p = wingedHull();
        const out = { lo: 1, hi: 0 };
        barricadeWrapColumnExtent(p, ARRESTOR_DECK_MID_X + 14, out);
        assert.ok(out.hi <= out.lo, 'outboard of the wingtip there is nothing to close on');
        // The parting nose does not count either — the webbing is not on it.
        barricadeWrapColumnExtent(p, ARRESTOR_DECK_MID_X, out);
        assert.ok(out.hi <= out.lo, 'the parting nose holds no webbing');
    });

    it('sizes the strip to the wing rather than the rig', () => {
        const p = wingedHull();
        const { caught, clear } = nodes(p, 4);
        const restGap = clear.topY - clear.botY;
        const gap = caught.topY - caught.botY;
        assert.ok(gap < restGap * 0.6,
            `strip should close well in: ${restGap.toFixed(2)} -> ${gap.toFixed(2)} m`);
        assert.ok(gap > 2 * BARRICADE_WING_GRIP_M,
            'but stay wide enough for the webbing to reach round the wing');
    });

    it('centres the closed strip on the wing', () => {
        const p = wingedHull();
        const { caught } = nodes(p, 4);
        const centre = (caught.topY + caught.botY) * 0.5 - BARRICADE_DECK_LOCAL_Y;
        assert.ok(
            Math.abs(centre - WING_Y) < 1.0,
            `strip centred at ${centre.toFixed(2)} m, wing sits at ${WING_Y} m`,
        );
        // The wing is inside the strip, not above or below it.
        assert.ok(caught.botY - BARRICADE_DECK_LOCAL_Y < WING_Y, 'lower strap below the wing');
        assert.ok(caught.topY - BARRICADE_DECK_LOCAL_Y > WING_Y, 'upper strap above the wing');
    });

    it('closes further the harder the wing drives in', () => {
        const shallow = nodes(wingedHull(3), 4).caught;
        const deep = nodes(wingedHull(7), 4).caught;
        assert.ok(
            (deep.topY - deep.botY) < (shallow.topY - shallow.botY),
            'a deeper bite closes the net further',
        );
    });

    it('closes least where nothing was caught', () => {
        // Outboard of the wingtip the net is still being hauled along, so it
        // narrows a little — but nothing like a station gripping the wing.
        const p = wingedHull();
        const outboard = nodes(p, 14);
        const onWing = nodes(p, 4);
        const gap = (n: { topY: number; botY: number }) => n.topY - n.botY;

        assert.ok(gap(outboard.caught) > gap(onWing.caught) + 1,
            `outboard ${gap(outboard.caught).toFixed(2)} should stay far wider than ` +
            `the wing station ${gap(onWing.caught).toFixed(2)}`);
        assert.ok(gap(outboard.caught) < gap(outboard.clear) + 1e-6, 'and never wider than rigged');
    });

    it('never drives the straps through the deck or the stanchion heads', () => {
        const p = wingedHull(8);
        const eng = { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p };
        const web = computeBarricadeWeb(1, deck, eng);
        const clear = computeBarricadeWeb(1, deck);
        for (let i = 0; i < web.length; i++) {
            assert.ok(web[i].botY >= clear[i].botY - 1e-6, `lower strap sank at node ${i}`);
            assert.ok(web[i].topY <= clear[i].topY + 1e-6, `upper strap rose at node ${i}`);
            assert.ok(web[i].topY > web[i].botY, `strap order inverted at node ${i}`);
        }
    });
});

describe('barricade loops stay where they are laced', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const SPAN = 6;
    const WING_Y = 1.75;

    /** Narrow nose plus a swept wing out to ±SPAN. */
    function sweptHull() {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -SPAN; x <= SPAN; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            const t = (Math.abs(x) - 1) / (SPAN - 1);
            const d = 6 + (2.8 - 6) * t;
            for (let y = WING_Y - 0.24; y <= WING_Y + 0.24; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                        BARRICADE_LOCAL_Z - d + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    function gathered() {
        const p = sweptHull();
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
        });
        return { p, web, stations: barricadeLoopStations(web, p) };
    }

    /** Loops whose station lies over the wing (outboard of the fuselage). */
    const overWing = (xs: number[]) =>
        xs.filter(x => {
            const rel = Math.abs(x - ARRESTOR_DECK_MID_X);
            return rel >= 1 && rel <= SPAN + 0.3;
        }).length;

    it('keeps the net evenly laced across the wing', () => {
        // Spacing over the wing must stay the rigged spacing: loops piling up
        // in a couple of stacks and leaving the rest of the strap bare is the
        // failure mode this guards.
        const { stations } = gathered();
        const laced = barricadeLoopLocalX();
        const rigSpacing = laced[1] - laced[0];
        // Spacing has to be measured *along the belt*, not across the deck:
        // the belt is inextensible, so a bight draws the panel inboard and the
        // lateral gaps close up even though no loop has moved on the webbing.
        const { web } = gathered();
        const beltArc = (a: number, b: number) => {
            let L = 0;
            const steps = 60;
            for (let i = 1; i <= steps; i++) {
                const x0 = a + (b - a) * (i - 1) / steps;
                const x1 = a + (b - a) * i / steps;
                L += Math.hypot(x1 - x0,
                    barricadeStrapNodeAt(web, x1).botZ - barricadeStrapNodeAt(web, x0).botZ);
            }
            return L;
        };
        for (const side of [-1, 1]) {
            const onWing = stations
                .filter(s => !s.slid)
                .map(s => s.x)
                .filter(x => {
                    const rel = (x - ARRESTOR_DECK_MID_X) * side;
                    return rel >= 2.5 && rel <= SPAN + 0.3;
                })
                .sort((a, b) => a - b);
            assert.ok(onWing.length >= 2, `wing ${side} carries several loops`);
            for (let i = 1; i < onWing.length; i++) {
                const along = beltArc(onWing[i - 1], onWing[i]);
                assert.ok(Math.abs(along - rigSpacing) < 0.05,
                    `loops keep their spacing along the belt (got ${along.toFixed(3)} m)`);
            }
        }
        // And the wing keeps at least the loops it was laced with.
        assert.ok(overWing(stations.map(s => s.x)) >= overWing(stations.map(s => s.restX)));
    });

    it('runs loops outboard, never inboard', () => {
        const { stations } = gathered();
        for (const s of stations) {
            const restRel = s.restX - ARRESTOR_DECK_MID_X;
            const rel = s.x - ARRESTOR_DECK_MID_X;
            assert.ok(Math.abs(rel) >= Math.abs(restRel) - 1e-6,
                `loop at ${restRel.toFixed(1)} moved inboard to ${rel.toFixed(1)}`);
            assert.ok(Math.sign(rel) === Math.sign(restRel) || Math.abs(restRel) < 1e-9,
                'and never crosses the centreline');
        }
    });

    it('leaves loops the airframe never reached exactly where they were laced', () => {
        const { p, stations } = gathered();
        for (const s of stations) {
            if (s.restX >= p.minX && s.restX <= p.maxX) continue;
            assert.equal(s.x, s.restX, 'untouched loops do not drift');
            assert.equal(s.slid, false);
        }
    });



    it('keeps the lacing order along the strap', () => {
        const { stations } = gathered();
        for (let i = 1; i < stations.length; i++) {
            assert.ok(stations[i].x >= stations[i - 1].x - 1e-6,
                `loop ${i} overtook its neighbour`);
        }
    });


    it('never runs a loop further than the strap fittings allow', () => {
        const { stations } = gathered();
        for (const s of stations) {
            assert.ok(Math.abs(s.x - s.restX) <= BARRICADE_LOOP_SLIDE_MAX_M + 1e-6,
                `ran ${(s.x - s.restX).toFixed(2)} m`);
        }
    });

    it('leaves the net evenly laced when nothing is in it', () => {
        const web = computeBarricadeWeb(1, deck);
        const stations = barricadeLoopStations(web, null);
        for (const s of stations) {
            assert.equal(s.x, s.restX);
            assert.equal(s.slid, false);
        }
    });

    it('pays the strap out rather than dragging the loops along it', () => {
        // The wire lengthens to reach round the airframe. That is what lets
        // every loop hold its station while the middle of the net runs
        // downfield — the strap gets longer, the lacing does not shift.
        const { p, web } = gathered();
        const clear = computeBarricadeWeb(1, deck);
        const length = (nodes: readonly { x: number; botZ: number }[]) => {
            let L = 0;
            for (let i = 1; i < nodes.length; i++) {
                L += Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].botZ - nodes[i - 1].botZ);
            }
            return L;
        };
        const rigged = length(clear);
        const paid = length(web);
        assert.ok(paid > rigged + 0.5,
            `strap should pay out: ${rigged.toFixed(2)} -> ${paid.toFixed(2)} m`);
        // The stanchions do not move, so the extra length is all in the bight.
        assert.ok(Math.abs(web[0].x - clear[0].x) < 1e-9);
        assert.ok(Math.abs(web[web.length - 1].x - clear[clear.length - 1].x) < 1e-9);
        assert.ok(p.touched);
    });
});

describe('barricade belt does not stretch', () => {

    const RIG = barricadeRig();
    const BELT_LEN = 2 * RIG.webHalfWidth;
    const REST_WIRE = RIG.halfSpan - RIG.webHalfWidth;

    /** A bight of `depth` metres centred on `at`, tapering out over `reach`. */
    function bight(depth: number, at = ARRESTOR_DECK_MID_X, reach = 9) {
        return (x: number) => {
            const w = 1 - Math.abs(x - at) / reach;
            return w <= 0 ? 0 : depth * w;
        };
    }

    /** True arc length of the strap between two stations. */
    function arc(a: number, b: number, pullAt: (x: number) => number, steps = 800): number {
        let L = 0;
        for (let i = 1; i <= steps; i++) {
            const x0 = a + (b - a) * (i - 1) / steps;
            const x1 = a + (b - a) * i / steps;
            L += Math.hypot(x1 - x0, pullAt(x1) - pullAt(x0));
        }
        return L;
    }

    it('lays the panel exactly as rigged when nothing is in the net', () => {
        const lay = layBarricadeBelt(RIG, () => 0);
        assert.deepEqual(lay.loopX, RIG.loopX, 'a clear net is untouched');
        assert.ok(Math.abs(lay.endX - lay.startX - BELT_LEN) < 1e-9);
        assert.ok(Math.abs(lay.wireLeftM - REST_WIRE) < 1e-9);
        assert.ok(Math.abs(lay.wireRightM - REST_WIRE) < 1e-9);
    });

    it('keeps the belt its own length however deep the bight', () => {
        for (const depth of [1, 3, 6, 9, 14]) {
            const pullAt = bight(depth);
            const lay = layBarricadeBelt(RIG, pullAt);
            const laid = arc(lay.startX, lay.endX, pullAt);
            assert.ok(
                Math.abs(laid - BELT_LEN) < 0.05,
                `bight ${depth} m: belt measured ${laid.toFixed(3)} m, rigged ${BELT_LEN.toFixed(2)} m`,
            );
        }
    });

    it('never changes a loop’s position along the belt', () => {
        const pullAt = bight(9);
        const lay = layBarricadeBelt(RIG, pullAt);
        const restStart = RIG.midX - RIG.webHalfWidth;
        for (let i = 0; i < lay.loopX.length; i++) {
            const along = arc(lay.startX, lay.loopX[i], pullAt);
            const rigged = RIG.loopX[i] - restStart;
            assert.ok(
                Math.abs(along - rigged) < 0.05,
                `loop ${i} sits ${along.toFixed(3)} m along the belt, sewn at ${rigged.toFixed(3)} m`,
            );
        }
    });

    it('draws the panel inboard as the belt takes its bight', () => {
        const shallow = layBarricadeBelt(RIG, bight(3));
        const deep = layBarricadeBelt(RIG, bight(10));
        const width = (l: typeof shallow) => l.endX - l.startX;

        assert.ok(width(deep) < width(shallow), 'a deeper bight covers less deck');
        assert.ok(width(shallow) < BELT_LEN, 'and any bight covers less than the belt is long');
        assert.ok(deep.startX > RIG.midX - RIG.webHalfWidth, 'left end comes inboard');
        assert.ok(deep.endX < RIG.midX + RIG.webHalfWidth, 'right end comes inboard');
    });

    it('pays the difference out as wire from the stanchions', () => {
        const pullAt = bight(10);
        const lay = layBarricadeBelt(RIG, pullAt);
        assert.ok(lay.wireLeftM > REST_WIRE + 0.1,
            `left wire should pay out: ${REST_WIRE.toFixed(2)} -> ${lay.wireLeftM.toFixed(2)} m`);
        assert.ok(lay.wireRightM > REST_WIRE + 0.1, 'and the right');

        // The belt gave up exactly what the wires took on, in deck coverage.
        const lost = BELT_LEN - (lay.endX - lay.startX);
        const gained = (lay.startX - (RIG.midX - RIG.webHalfWidth))
            + ((RIG.midX + RIG.webHalfWidth) - lay.endX);
        assert.ok(Math.abs(lost - gained) < 1e-6, 'the panel narrows by what the ends move in');
    });

    it('follows an off-centre bight without the loops sliding on the webbing', () => {
        const pullAt = bight(9, ARRESTOR_DECK_MID_X + 7);
        const lay = layBarricadeBelt(RIG, pullAt);
        const laid = arc(lay.startX, lay.endX, pullAt);
        assert.ok(Math.abs(laid - BELT_LEN) < 0.05, 'belt still its own length');
        const restStart = RIG.midX - RIG.webHalfWidth;
        for (let i = 0; i < lay.loopX.length; i++) {
            const along = arc(lay.startX, lay.loopX[i], pullAt);
            assert.ok(Math.abs(along - (RIG.loopX[i] - restStart)) < 0.05,
                `loop ${i} shifted along the webbing`);
        }
    });

    it('feeds the laid stations through to the web, ends included', () => {
        const web = computeBarricadeWeb(1, () => BARRICADE_DECK_LOCAL_Y, {
            stretch: 10, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        assert.equal(web.length, RIG.loopX.length + 2);
        // The stanchions never move; the panel between them does.
        assert.ok(Math.abs(web[0].x - RIG.leftX) < 1e-9);
        assert.ok(Math.abs(web[web.length - 1].x - RIG.rightX) < 1e-9);
        assert.ok(web[1].x > RIG.loopX[0], 'panel drawn inboard on the left');
        assert.ok(web[web.length - 2].x < RIG.loopX[RIG.loopX.length - 1],
            'and on the right');
    });
});

describe('barricade webbing keeps its length', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const L = BARRICADE_LOOP_LENGTH_M;

    function wingedHull(rootDeep = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -6; x <= 6; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            const t = (Math.abs(x) - 1) / 5;
            const d = rootDeep + (2.8 - rootDeep) * t;
            for (let y = 1.5; y <= 2.0; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                        BARRICADE_LOCAL_Z - d + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    /** Every loop's drawn length, for a given state of the net. */
    function loopLengths(profile: BarricadeWrapProfile | null, deploy = 1) {
        const eng = profile
            ? { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile }
            : null;
        const web = computeBarricadeWeb(deploy, deck, eng);
        return barricadeLoopStations(web, profile).map(st =>
            barricadePathLength(barricadeLoopCurve(
                st.node, deploy, 33, barricadeEngagementPullAt(st.node.x, eng), [], profile)));
    }

    it('cuts every loop to one length', () => {
        assert.ok(L > BARRICADE_LOOP_REST_SPAN_M, 'a loop is longer than the gap it spans');
        assert.ok(L < BARRICADE_LOOP_REST_SPAN_M + 2 * BARRICADE_LOOP_BOW_M,
            'but not absurdly so');
    });

    it('holds that length however the net is loaded', () => {
        for (const [what, profile, deploy] of [
            ['half raised', null, 0.5],
            ['rigged', null, 1],
            ['caught', wingedHull(4), 1],
            ['deep bite', wingedHull(9), 1],
        ] as const) {
            for (const len of loopLengths(profile, deploy)) {
                assert.ok(
                    Math.abs(len - L) < 0.02,
                    `${what}: loop drawn ${len.toFixed(3)} m, cut ${L.toFixed(3)} m`,
                );
            }
        }
    });

    it('sags more the less it has to span', () => {
        const node = computeBarricadeWeb(1, deck)[6];
        const belly = (gap: number) => {
            const shrunk = { ...node, topY: node.botY + gap };
            const pts = barricadeLoopCurve(shrunk, 1, 33);
            return Math.max(...pts.map(q => q.z - shrunk.botZ));
        };
        // Aft belly is capped at the rigged bow; past that the surplus hangs
        // down instead, so measure the drop rather than the bulge.
        const drop = (gap: number) => {
            const shrunk = { ...node, topY: node.botY + gap };
            const pts = barricadeLoopCurve(shrunk, 1, 33);
            return shrunk.botY - Math.min(...pts.map(q => q.y));
        };
        const wide = belly(node.topY - node.botY);
        const tight = belly((node.topY - node.botY) * 0.6);
        assert.ok(tight >= wide - 1e-9, 'a shorter gap never bellies less');
        assert.ok(drop((node.topY - node.botY) * 0.6) > drop(node.topY - node.botY),
            'and the surplus it cannot belly hangs down instead');
    });

    it('cannot reach further than it is long', () => {
        // An absurdly deep hull: the loop lies as far forward as its own length
        // allows and no further, rather than stretching to meet it.
        const p = wingedHull(30);
        const eng = { stretch: 30, lateral: ARRESTOR_DECK_MID_X, profile: p };
        const web = computeBarricadeWeb(1, deck, eng);
        for (const st of barricadeLoopStations(web, p)) {
            const pts = barricadeLoopCurve(
                st.node, 1, 33, barricadeEngagementPullAt(st.node.x, eng), [], p);
            assert.ok(Math.abs(barricadePathLength(pts) - L) < 0.02,
                'webbing does not stretch to reach a hull it cannot');
        }
    });
});

describe('barricade wire runs', () => {

    const stanchion = { x: 0, y: 6, z: 0 };
    const panelEnd = { x: 3, y: 6, z: 0 };
    const droop = (pts: { y: number }[]) => Math.min(...pts.map(q => q.y));

    it('hangs off the sheave when nothing is pulling on it', () => {
        const pts = barricadeWireCurve(stanchion, panelEnd, 0);
        assert.equal(pts.length, BARRICADE_WIRE_SAMPLES);
        assert.ok(droop(pts) < 6 - 0.05, 'an idle wire visibly sags');
        // Pinned at both ends.
        assert.ok(Math.abs(pts[0].y - stanchion.y) < 1e-9);
        assert.ok(Math.abs(pts[pts.length - 1].y - panelEnd.y) < 1e-9);
        assert.ok(Math.abs(pts[0].x - stanchion.x) < 1e-9);
        assert.ok(Math.abs(pts[pts.length - 1].x - panelEnd.x) < 1e-9);
    });

    it('comes straight as the arresting engine takes up', () => {
        const idle = droop(barricadeWireCurve(stanchion, panelEnd, 0));
        const part = droop(barricadeWireCurve(stanchion, panelEnd, BARRICADE_WIRE_TAUT_PULL_M * 0.5));
        const taut = droop(barricadeWireCurve(stanchion, panelEnd, BARRICADE_WIRE_TAUT_PULL_M));
        assert.ok(part > idle, 'tension lifts the sag');
        assert.ok(Math.abs(taut - 6) < 1e-9, 'and a loaded wire is dead straight');
    });

    it('sags in proportion to the run, not by a fixed amount', () => {
        const shortRun = droop(barricadeWireCurve(stanchion, { x: 1.5, y: 6, z: 0 }, 0));
        const longRun = droop(barricadeWireCurve(stanchion, { x: 6, y: 6, z: 0 }, 0));
        assert.ok(longRun < shortRun, 'a longer wire hangs lower');
    });

    it('follows the strap downfield as well as across the deck', () => {
        const pts = barricadeWireCurve(stanchion, { x: 3, y: 6, z: -4 }, 0);
        assert.ok(Math.abs(pts[pts.length - 1].z - (-4)) < 1e-9, 'reaches the panel end');
        for (let i = 1; i < pts.length; i++) {
            assert.ok(pts[i].z < pts[i - 1].z, 'runs monotonically downfield');
        }
    });
});

describe('barricade stripes never move along the strap', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    function hull(wingDeep = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -6; x <= 6; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            const t = (Math.abs(x) - 1) / 5;
            const d = wingDeep + (2.8 - wingDeep) * t;
            for (let y = 1.55; y <= 1.95; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                        BARRICADE_LOCAL_Z - d + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    it('holds every station when an aircraft lands in the net', () => {
        for (const wingDeep of [3, 6, 9]) {
            const p = hull(wingDeep);
            const web = computeBarricadeWeb(1, deck, {
                stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p,
            });
            for (const st of barricadeLoopStations(web, p)) {
                assert.equal(st.x, st.restX,
                    `wing ${wingDeep} m: stripe at ${(st.restX - ARRESTOR_DECK_MID_X).toFixed(2)} moved`);
                assert.equal(st.slid, false);
            }
        }
    });

    it('keeps every stripe at its sewn position along the belt', () => {
        // The invariant is the position *on the belt*, not across the deck. The
        // belt is cut to the mast-to-mast run and does not stretch, so a bight
        // makes it cover less deck and the stripes come inboard with it — while
        // each one stays exactly where it is sewn along the webbing.
        const rig = barricadeRig();
        const sewn = rig.loopX.map(x => x - rig.leftX);

        for (const wingDeep of [1, 3, 5, 7, 9]) {
            const p = hull(wingDeep);
            const eng = { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p };
            const web = computeBarricadeWeb(1, deck, eng);
            const stations = barricadeLoopStations(web, p);

            // Arc length along the belt from its left end to each stripe.
            const beltArc = (a: number, b: number) => {
                let L = 0;
                for (let i = 1; i <= 200; i++) {
                    const x0 = a + (b - a) * (i - 1) / 200;
                    const x1 = a + (b - a) * i / 200;
                    L += Math.hypot(x1 - x0,
                        barricadeStrapNodeAt(web, x1).botZ - barricadeStrapNodeAt(web, x0).botZ);
                }
                return L;
            };
            const beltStart = stations[0].x;
            for (let i = 1; i < stations.length; i++) {
                const along = beltArc(beltStart, stations[i].x);
                assert.ok(
                    Math.abs(along - sewn[i]) < 0.15,
                    `wing ${wingDeep} m: stripe ${i} sits ${along.toFixed(2)} m along the belt, sewn at ${sewn[i].toFixed(2)} m`,
                );
            }
        }
    });

    it('holds station for an off-centre aircraft too', () => {
        const p = hull(6);
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X + 6, profile: p,
        });
        for (const st of barricadeLoopStations(web, p)) {
            assert.equal(st.x, st.restX, 'no sideways creep toward the aircraft');
        }
    });
});

describe('barricade stripes festoon rather than stretch', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const node = () => computeBarricadeWeb(1, deck)[8];

    /** How far the loop hangs below its lower hang point. */
    const drop = (gap: number) => {
        const n = node();
        const shrunk = { ...n, topY: n.botY + gap };
        const pts = barricadeLoopCurve(shrunk, 1, 41);
        return shrunk.botY - Math.min(...pts.map(q => q.y));
    };

    /** How far it bellies aft of its hang points. */
    const belly = (gap: number) => {
        const n = node();
        const shrunk = { ...n, topY: n.botY + gap };
        const pts = barricadeLoopCurve(shrunk, 1, 41);
        return Math.max(...pts.map(q => q.z - shrunk.botZ));
    };

    it('keeps its cut length whatever the straps do', () => {
        const n = node();
        for (const frac of [1, 0.8, 0.6, 0.4, 0.25]) {
            const shrunk = { ...n, topY: n.botY + (n.topY - n.botY) * frac };
            const pts = barricadeLoopCurve(shrunk, 1, 41);
            assert.ok(
                Math.abs(barricadePathLength(pts) - BARRICADE_LOOP_LENGTH_M) < 0.02,
                `gap at ${frac}: drawn ${barricadePathLength(pts).toFixed(3)} m`,
            );
        }
    });

    it('hangs further down as the straps close, until it is on the deck', () => {
        const n = node();
        const full = n.topY - n.botY;
        const deckY = n.botY - BARRICADE_LOWER_STRAP_LIFT_M;

        let prev = drop(full);
        let landed = false;
        for (const frac of [0.8, 0.6, 0.45, 0.3]) {
            const d = drop(full * frac);
            assert.ok(d >= prev - 1e-9, `gap ${frac}: droop must not shrink (${d.toFixed(3)} m)`);
            if (d > prev + 1e-9) prev = d;
            else landed = true;
        }
        assert.ok(prev > 0.3, 'it drops by a visible amount before it gets there');
        assert.ok(landed, 'and then stops, because it has reached the deck');

        // Nothing ever goes through the deck.
        for (const frac of [1, 0.8, 0.6, 0.45, 0.3]) {
            const shrunk = { ...n, topY: n.botY + full * frac };
            const pts = barricadeLoopCurve(shrunk, 1, 41);
            const lowest = Math.min(...pts.map(q => q.y));
            assert.ok(lowest >= deckY - 1e-6,
                `gap ${frac}: webbing reached ${(lowest - deckY).toFixed(3)} m below the deck`);
        }
    });

    it('bellies only once the festoon is down on the deck', () => {
        const n = node();
        const full = n.topY - n.botY;
        // While there is room to hang, the belly stays at the rigged bow: the
        // surplus goes downward, not aft.
        assert.ok(belly(full) <= BARRICADE_LOOP_BOW_M + 1e-6,
            `open gap bellied ${belly(full).toFixed(2)} m aft`);
        // Closed right down, the webbing is on the deck and cannot drop any
        // further, so what is left has nowhere to go but out.
        assert.ok(belly(full * 0.3) > belly(full) - 1e-6, 'the belly takes the remainder');
    });

    it('festoons below the lower strap, where spare webbing would hang', () => {
        const n = node();
        const shrunk = { ...n, topY: n.botY + (n.topY - n.botY) * 0.35 };
        const pts = barricadeLoopCurve(shrunk, 1, 41);
        const lowest = pts.reduce((a, b) => (b.y < a.y ? b : a));
        assert.ok(lowest.y < shrunk.botY, 'the slack hangs below the lower hang point');
        // Both ends still pinned to their straps.
        assert.ok(Math.abs(pts[0].y - shrunk.botY) < 1e-9);
        assert.ok(Math.abs(pts[pts.length - 1].y - shrunk.topY) < 1e-9);
    });
});

describe('barricade belt runs mast to mast on extensible wire', () => {

    const RIG = barricadeRig();
    const MAST_SPAN = RIG.rightX - RIG.leftX;

    /** A bight of `depth` metres centred on the lane. */
    const bight = (depth: number, reach = 9) => (x: number) => {
        const w = 1 - Math.abs(x - ARRESTOR_DECK_MID_X) / reach;
        return w <= 0 ? 0 : depth * w;
    };

    function arc(a: number, b: number, pullAt: (x: number) => number, steps = 800): number {
        let L = 0;
        for (let i = 1; i <= steps; i++) {
            const x0 = a + (b - a) * (i - 1) / steps;
            const x1 = a + (b - a) * i / steps;
            L += Math.hypot(x1 - x0, pullAt(x1) - pullAt(x0));
        }
        return L;
    }

    it('cuts the belt to the distance between the masts', () => {
        const lay = layBarricadeBelt(RIG, () => 0);
        assert.ok(Math.abs((lay.endX - lay.startX) - MAST_SPAN) < 1e-9,
            'rigged, the belt reaches mast to mast');
        assert.ok(Math.abs(lay.startX - RIG.leftX) < 1e-9);
        assert.ok(Math.abs(lay.endX - RIG.rightX) < 1e-9);
    });

    it('has no wire out until something loads the net', () => {
        const lay = layBarricadeBelt(RIG, () => 0);
        assert.ok(lay.wireLeftM < 1e-9, 'left wire fully retracted');
        assert.ok(lay.wireRightM < 1e-9, 'right wire fully retracted');
    });

    it('never lets the belt stretch, however deep the bight', () => {
        for (const depth of [1, 3, 6, 9, 14]) {
            const pullAt = bight(depth);
            const lay = layBarricadeBelt(RIG, pullAt);
            const laid = arc(lay.startX, lay.endX, pullAt);
            assert.ok(Math.abs(laid - MAST_SPAN) < 0.05,
                `bight ${depth} m: belt measured ${laid.toFixed(3)} m, cut ${MAST_SPAN.toFixed(2)} m`);
        }
    });

    it('pays wire out of the masts by exactly what the belt gives up in deck', () => {
        for (const depth of [3, 6, 10]) {
            const lay = layBarricadeBelt(RIG, bight(depth));
            const lost = MAST_SPAN - (lay.endX - lay.startX);
            const gained = (lay.startX - RIG.leftX) + (RIG.rightX - lay.endX);
            assert.ok(Math.abs(lost - gained) < 1e-6,
                `bight ${depth} m: belt gave up ${lost.toFixed(3)} m, ends moved ${gained.toFixed(3)} m`);
            assert.ok(lay.wireLeftM > 0 && lay.wireRightM > 0, 'wire is out of both masts');
        }
    });

    it('pays out more wire the deeper the bight', () => {
        let prev = 0;
        for (const depth of [2, 4, 6, 8, 10]) {
            const lay = layBarricadeBelt(RIG, bight(depth));
            assert.ok(lay.wireLeftM > prev, `bight ${depth} m should draw more wire`);
            prev = lay.wireLeftM;
        }
    });

    it('leaves the masts where they are — only the belt ends move', () => {
        const web = computeBarricadeWeb(1, () => BARRICADE_DECK_LOCAL_Y, {
            stretch: 10, lateral: ARRESTOR_DECK_MID_X, profile: null,
        });
        assert.ok(Math.abs(web[0].x - RIG.leftX) < 1e-9, 'left mast fixed');
        assert.ok(Math.abs(web[web.length - 1].x - RIG.rightX) < 1e-9, 'right mast fixed');
        assert.ok(web[1].x > RIG.leftX, 'belt end drawn in off the left mast');
        assert.ok(web[web.length - 2].x < RIG.rightX, 'and off the right');
    });
});

describe('barricade webbing never hangs through the deck', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;

    function hull(rootDeep: number) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                    BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -6; x <= 6; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            const t = (Math.abs(x) - 1) / 5;
            const d = rootDeep + (2.8 - rootDeep) * t;
            for (let y = 1.5; y <= 2.0; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + x, BARRICADE_DECK_LOCAL_Y + y,
                        BARRICADE_LOCAL_Z - d + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    /** Lowest point of any stripe, relative to the deck. */
    function lowest(profile: BarricadeWrapProfile | null, deploy = 1): number {
        const eng = profile
            ? { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile }
            : null;
        const web = computeBarricadeWeb(deploy, deck, eng);
        let low = Infinity;
        for (const st of barricadeLoopStations(web, profile)) {
            const pts = barricadeLoopCurve(
                st.node, deploy, 41, barricadeEngagementPullAt(st.node.x, eng), [], profile);
            for (const q of pts) low = Math.min(low, q.y - BARRICADE_DECK_LOCAL_Y);
        }
        return low;
    }

    it('keeps every stripe on or above the deck, loaded or not', () => {
        for (const [what, profile, deploy] of [
            ['rigged', null, 1],
            ['half raised', null, 0.5],
            ['caught 4 m', hull(4), 1],
            ['caught 6 m', hull(6), 1],
            ['deep bite', hull(9), 1],
        ] as const) {
            const low = lowest(profile, deploy);
            assert.ok(low >= -1e-6, `${what}: webbing reached ${low.toFixed(3)} m below the deck`);
        }
    });

    it('rests the festoon on the deck rather than stopping short of it', () => {
        // Closed down on an airframe the loops have real surplus, and it should
        // be visibly on the deck — not hovering, and not through it.
        const low = lowest(hull(6));
        assert.ok(low < 0.2, `festoon should reach the deck, stopped at ${low.toFixed(3)} m`);
        assert.ok(low >= 0, 'without going through it');
    });

    it('still conserves length with the droop up against the deck', () => {
        const p = hull(6);
        const eng = { stretch: 9, lateral: ARRESTOR_DECK_MID_X, profile: p };
        const web = computeBarricadeWeb(1, deck, eng);
        for (const st of barricadeLoopStations(web, p)) {
            const pts = barricadeLoopCurve(
                st.node, 1, 41, barricadeEngagementPullAt(st.node.x, eng), [], p);
            assert.ok(
                Math.abs(barricadePathLength(pts) - BARRICADE_LOOP_LENGTH_M) < 0.02,
                `capping the droop must not shorten the webbing (${barricadePathLength(pts).toFixed(3)} m)`,
            );
        }
    });

    it('leaves the deck lower as the net is struck, and follows it', () => {
        // Part-raised, the lower strap is closer to the deck, so there is less
        // room to hang — the bound has to move with it.
        for (const deploy of [0.4, 0.7, 1]) {
            assert.ok(lowest(null, deploy) >= -1e-6,
                `deploy ${deploy}: webbing went below the deck`);
        }
    });
});

describe('barricade net does not translate sideways', () => {

    const deck = () => BARRICADE_DECK_LOCAL_Y;
    const RIG = barricadeRig();

    /** Airframe centred `cx` metres off the landing lane. */
    function hull(cx: number, rootDeep = 6) {
        const p = createBarricadeWrapProfile(BARRICADE_DECK_LOCAL_Y);
        for (let x = -1; x <= 1; x += 0.1) {
            for (let y = 0.9; y <= 3.1; y += 0.1) {
                addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + cx + x,
                    BARRICADE_DECK_LOCAL_Y + y, BARRICADE_LOCAL_Z - 9);
            }
        }
        for (let x = -6; x <= 6; x += 0.1) {
            if (Math.abs(x) < 1) continue;
            const t = (Math.abs(x) - 1) / 5;
            const d = rootDeep + (2.8 - rootDeep) * t;
            for (let y = 1.5; y <= 2.0; y += 0.07) {
                for (let c = 0; c < 2; c += 0.3) {
                    addBarricadeWrapPoint(p, ARRESTOR_DECK_MID_X + cx + x,
                        BARRICADE_DECK_LOCAL_Y + y, BARRICADE_LOCAL_Z - d + c);
                }
            }
        }
        closeBarricadeWrapGaps(p);
        finalizeBarricadeWrap(p);
        return p;
    }

    /** Displacement of each stripe from the station it was laced at. */
    function shifts(cx: number, rootDeep = 6): number[] {
        const p = hull(cx, rootDeep);
        const web = computeBarricadeWeb(1, deck, {
            stretch: 9, lateral: ARRESTOR_DECK_MID_X + cx, profile: p,
        });
        return barricadeLoopStations(web, p).map((s, i) => s.x - RIG.loopX[i]);
    }

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

    it('never shifts the lacing bodily to one side', () => {
        // The failure this guards: anchoring the belt at one end makes the whole
        // net slide that way whenever the airframe is off the lane centreline.
        for (const cx of [-8, -6, -3, 0, 3, 6, 8]) {
            const m = mean(shifts(cx));
            assert.ok(Math.abs(m) < 0.05,
                `aircraft ${cx} m off centre shifted the net by ${m.toFixed(3)} m`);
        }
    });

    it('pins the webbing the airframe is actually holding', () => {
        for (const cx of [0, 6]) {
            const d = shifts(cx);
            const stations = RIG.loopX.map(x => x - ARRESTOR_DECK_MID_X - cx);
            // The stripes nearest the aircraft barely move at all.
            let nearest = 0;
            for (let i = 1; i < stations.length; i++) {
                if (Math.abs(stations[i]) < Math.abs(stations[nearest])) nearest = i;
            }
            assert.ok(Math.abs(d[nearest]) < 0.12,
                `stripe on the aircraft moved ${d[nearest].toFixed(3)} m (offset ${cx} m)`);
        }
    });

    it('draws both sides toward the aircraft, not all one way', () => {
        const d = shifts(0);
        assert.ok(d[0] > 0.05, 'left end draws inboard');
        assert.ok(d[d.length - 1] < -0.05, 'right end draws inboard');
    });

    it('leaves the lacing exactly as rigged with nothing in the net', () => {
        const web = computeBarricadeWeb(1, deck);
        const stations = barricadeLoopStations(web, null);
        for (let i = 0; i < stations.length; i++) {
            assert.equal(stations[i].x, RIG.loopX[i], `stripe ${i} moved on a clear net`);
        }
    });

    it('does not shift as the bite deepens', () => {
        // Frame to frame through an arrestment, the net must not creep sideways.
        // A few centimetres of residual is the anchor landing on a profile
        // sample rather than exactly on the deepest point; it grows slowly with
        // the bite and is nothing like the net sliding bodily across the deck.
        for (const rootDeep of [2, 4, 6, 8, 10]) {
            const m = mean(shifts(4, rootDeep));
            assert.ok(Math.abs(m) < 0.1,
                `bite ${rootDeep} m shifted the net by ${m.toFixed(3)} m`);
        }
    });
});
