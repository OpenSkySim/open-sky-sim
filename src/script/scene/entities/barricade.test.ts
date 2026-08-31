/**
 * Unit tests for the barricade *installation*.
 *
 * This file used to be twenty-six suites long, most of them checking that the
 * analytic net's curves came out where its constants said they would. That
 * model is gone: the webbing is simulated in {@link ./barricadeSolver} and
 * tested there against the rules webbing obeys, and the shape it produces is
 * checked on its way to the renderer in `combatSim.barricadeWeb.test.ts`.
 *
 * What is left here is the gear the webbing hangs on, and it is all things the
 * solver has no opinion about: where the rig will fit on a real deck, whether
 * the net is up, and whether an airframe has flown into it.
 */
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
    BARRICADE_DECK_BAND_M,
    BARRICADE_DECK_EDGE_INSET_M,
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_DECK_PROBE_STEP_M,
    BARRICADE_HALF_SPAN_M,
    BARRICADE_HEIGHT_M,
    BARRICADE_LOCAL_Z,
    BARRICADE_LOWER_SECONDS,
    BARRICADE_RAISE_SECONDS,
    BARRICADE_RERIG_SECONDS,
    BarricadeController,
    BarricadeState,
    barricadeArmed,
    barricadeRig,
    buildBarricadeField,
    fitBarricadeRig,
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

describe('where the barricade is rigged', () => {

    it('sits forward of every arrestor pendant', () => {
        // Landing runs toward −Z, so "forward" is a smaller local Z than the wires.
        for (const z of ARRESTOR_CABLE_LOCAL_Z) {
            assert.ok(BARRICADE_LOCAL_Z < z, `barricade must be ahead of wire at Z=${z}`);
        }
    });

    it('spans the landing lane symmetrically', () => {
        const rig = barricadeRig();
        assert.ok(Math.abs(rig.midX - ARRESTOR_DECK_MID_X) < 1e-9, 'centred on the lane');
        assert.ok(Math.abs(rig.halfSpan - BARRICADE_HALF_SPAN_M) < 1e-9);
        assert.ok(Math.abs(rig.midX - (rig.leftX + rig.rightX) / 2) < 1e-9);
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
        // The attitude itself travels too: the sim laces the net in carrier-local
        // space and has to be able to get back out of it.
        assert.ok(Math.abs(f.quaternion.y - yaw.y) < 1e-9);
        assert.ok(Math.abs(f.quaternion.w - yaw.w) < 1e-9);
    });

    it('carries the fitted rig with it, not just the span', () => {
        const rig = barricadeRig(-9, 19, 13.9);
        const f = buildBarricadeField(POSE, 13.9, 1, rig);
        assert.equal(f.rig.leftX, -9);
        assert.equal(f.rig.rightX, 19);
        assert.equal(f.rig.deckY, 13.9);
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

    it('ignores an aircraft parked on a steaming carrier', () => {
        // The ship makes twenty-five knots, so an airframe chocked on her deck
        // is doing twelve metres a second down the deck axis without moving an
        // inch relative to the deck. Judged on speed over the sea it reads as
        // charging the net, and expends the webbing on a parked aeroplane.
        const ship = new THREE.Vector3(0, 0, -12.5);
        const parked = ship.clone();
        assert.equal(
            tryBarricadeEngage(deckPos(0), deckPos(0), parked, 7, field(1), ship),
            false,
        );
    });

    it('still catches an aircraft closing on a steaming carrier', () => {
        // Same ship, but this one is overtaking her at sixty metres a second.
        const ship = new THREE.Vector3(0, 0, -12.5);
        const closing = new THREE.Vector3(0, 0, -60);
        assert.equal(
            tryBarricadeEngage(deckPos(1), deckPos(-1), closing, 7, field(1), ship),
            true,
        );
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

    it('rigs to armed in one call for the barricade spawn', () => {
        const c = new BarricadeController();
        c.rigImmediately();
        assert.equal(c.getState(), BarricadeState.RAISED);
        assert.equal(c.getDeploy(), 1);
        assert.equal(c.isArmed(), true);
        // No animation left to run: a spawn a second from the ramp cannot wait.
        c.update(1 / 60, false);
        assert.equal(c.getDeploy(), 1);
    });

    it('counts a fresh webbing assembly every time one goes up', () => {
        // The webbing is expendable, so whatever simulates it has to know when
        // it has been replaced. Deploy alone cannot say: a respawn strikes and
        // re-rigs inside one frame, so the net never appears to come down.
        const c = new BarricadeController();
        const start = c.getRigGeneration();

        c.raise();
        const raised = c.getRigGeneration();
        assert.ok(raised > start, 'running the stanchions up is a fresh assembly');

        // Holding it up is not.
        step(c, BARRICADE_RAISE_SECONDS + 1);
        assert.equal(c.getRigGeneration(), raised, 'a net just standing there is the same net');

        c.lower();
        step(c, BARRICADE_LOWER_SECONDS + 1);
        assert.equal(c.getRigGeneration(), raised, 'striking it does not lace a new one');
        c.raise();
        assert.ok(c.getRigGeneration() > raised, 're-erecting it does');
    });

    it('counts a fresh assembly on respawn, even though it never comes down', () => {
        // beginFlight strikes and re-rigs in the same frame for the barricade
        // spawn, so deploy goes 1 -> 1 and nothing downstream sees a transition.
        const c = new BarricadeController();
        c.rigImmediately();
        const first = c.getRigGeneration();
        step(c, 2, true);
        c.update(1 / 60, false);

        c.reset();
        c.rigImmediately();
        assert.equal(c.getDeploy(), 1, 'the barricade spawn starts with the net across the deck');
        assert.ok(c.getRigGeneration() > first,
            'a respawn re-rigs, so the expended webbing must not carry over');
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

    it('keeps the rig self-consistent on the fitted span', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 5, NOMINAL.rightX - 2));
        assert.ok(rig.leftX < rig.rightX);
        assert.ok(Math.abs(rig.midX - (rig.leftX + rig.rightX) / 2) < 1e-9);
        assert.ok(Math.abs(rig.halfSpan - (rig.rightX - rig.leftX) / 2) < 1e-9);
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

    it('records the deck it was fitted against, so the net is laced on it', () => {
        const low = DECK - 2;
        const rig = fitBarricadeRig(deckBetween(-100, 100, low));
        assert.ok(Math.abs(rig.deckY - low) < 1e-9,
            `rig deck ${rig.deckY.toFixed(2)} should follow the ${low.toFixed(2)} m deck`);
    });

    it('arrests across the span it is actually rigged on', () => {
        const rig = fitBarricadeRig(deckBetween(NOMINAL.leftX + 5, NOMINAL.rightX - 5));
        const f = buildBarricadeField(POSE, BARRICADE_DECK_LOCAL_Y, 1, rig);
        assert.ok(Math.abs(f.halfSpan - rig.halfSpan) < 1e-9,
            'physics span follows the fitted rig');
        assert.ok(f.halfSpan < NOMINAL.halfSpan, 'and is narrower than nominal');
        assert.ok(
            Math.abs(f.center.x - (ARRESTOR_CARRIER_ORIGIN.x + rig.midX)) < 1e-6,
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

    it('puts the whole rigged span on the flight deck', () => {
        const rig = fitBarricadeRig(kuznetsovAt);
        for (let i = 0; i <= 24; i++) {
            const x = rig.leftX + ((rig.rightX - rig.leftX) * i) / 24;
            const y = kuznetsovAt(x);
            assert.ok(
                Math.abs(y - rig.deckY) <= BARRICADE_DECK_BAND_M,
                `station at ${(x - ARRESTOR_DECK_MID_X).toFixed(2)} m is on ${y.toFixed(2)} m`,
            );
        }
    });
});
