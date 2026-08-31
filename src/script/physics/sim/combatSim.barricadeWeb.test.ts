/**
 * The webbing's trip from the sim to whatever draws it.
 *
 * The rig is solved in the sim worker and drawn on the main thread, which means
 * the shape crosses a process boundary as a block of floats with no schema
 * attached. Nothing in the type system says the reader is unpacking it the way
 * the writer packed it, so it is asserted here instead: the same particle
 * layout at both ends, the same rig laced from the same fitted span, and a
 * shared bank that survives the round trip.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import {
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_LOCAL_Z,
    barricadeRig,
    buildBarricadeField,
} from '../../scene/entities/barricade';
import {
    BarricadeLayout,
    BarricadeWire,
    barricadeSolverSpecForRig,
} from '../../scene/entities/barricadeSolver';
import { ARRESTOR_CARRIER_ORIGIN } from '../../scene/entities/arrestorCables';
import { Faction } from '../../weapons/combatant';
import { defaultFm2Config } from '../fm2/fm2AircraftConfig';
import { CombatSim } from './combatSim';
import { BARRICADE_STRIDE } from './simSnapshotCodec';
import {
    barricadeBank,
    createSimSharedState,
    publishSharedBanks,
    sharedBackBank,
    tryPullSharedSnapshot,
} from './simSharedState';
import { serializeBarricade, serializeWorld } from './serializedWorld';

const O = ARRESTOR_CARRIER_ORIGIN;

/** Closed cube of half-extent `h`, body frame. */
function cube(h: number): number[] {
    return [
        -h, h, -h, -h, h, h, h, h, h, -h, h, -h, h, h, h, h, h, -h,
        -h, -h, -h, h, -h, -h, h, -h, h, -h, -h, -h, h, -h, h, -h, -h, h,
        h, -h, -h, h, h, -h, h, h, h, h, -h, -h, h, h, h, h, -h, h,
        -h, -h, -h, -h, -h, h, -h, h, h, -h, -h, -h, -h, h, h, -h, h, -h,
        -h, -h, h, h, -h, h, h, h, h, -h, -h, h, h, h, h, -h, h, h,
        -h, -h, -h, -h, h, -h, h, h, -h, -h, -h, -h, h, h, -h, h, -h, -h,
    ];
}

function pose(): { position: { x: number; y: number; z: number }; quaternion: THREE.Quaternion } {
    return {
        position: { x: O.x, y: O.y, z: O.z },
        quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.3),
    };
}

/** A sim with one rigged barricade, exactly as the game hands it over. */
function simWithBarricade(deploy = 1): CombatSim {
    const sim = new CombatSim();
    sim.setWorld(serializeWorld(
        [], [], [], [], [], [], [], [],
        [buildBarricadeField(pose(), BARRICADE_DECK_LOCAL_Y, deploy, barricadeRig())],
    ));
    return sim;
}

describe('the barricade the sim hands over', () => {

    it('carries the fitted rig across the hop, not a nominal one', () => {
        // The span is fitted by probing the deck, which only the main thread can
        // do; if the rig did not travel, the sim would lace a net across a
        // different span from the one that was drawn.
        const fitted = barricadeRig(-9, 19, 13.9);
        const ser = serializeBarricade(
            buildBarricadeField(pose(), 13.9, 1, fitted),
        );
        const cloned = structuredClone(ser);
        assert.equal(cloned.rigLeftX, -9);
        assert.equal(cloned.rigRightX, 19);
        assert.equal(cloned.rigDeckY, 13.9);
        assert.equal(cloned.quaternion.length, 4);

        const sim = new CombatSim();
        sim.setBarricades([cloned]);
        sim.step(1 / 60, {});
        const snap = sim.encodeSnapshot();
        assert.equal(snap.barricadeCount, 1);
        // Laced across the span that was actually fitted.
        const layout = new BarricadeLayout(barricadeSolverSpecForRig(-9, 19, 13.9));
        assert.equal(snap.barricadeNodes, layout.count);
    });

    it('publishes a shape the moment the world arrives, before anything flies', () => {
        // The net is rigged whether or not there is an aircraft, and the entity
        // draws nothing at all until a shape turns up.
        const sim = simWithBarricade();
        sim.step(1 / 60, {});
        const snap = sim.encodeSnapshot();
        assert.equal(snap.barricadeCount, 1);
        assert.ok(snap.barricadeNodes > 100, `only ${snap.barricadeNodes} particles`);
        assert.ok(snap.barricades.length >= snap.barricadeNodes * 3);
    });

    it('puts the webbing where the rig is, in carrier-local coordinates', () => {
        const sim = simWithBarricade();
        for (let i = 0; i < 10; i++) sim.step(1 / 60, {});
        const snap = sim.encodeSnapshot();
        const layout = new BarricadeLayout(
            barricadeSolverSpecForRig(
                barricadeRig().leftX, barricadeRig().rightX, BARRICADE_DECK_LOCAL_Y,
            ),
        );
        const at = (i: number) => ({
            x: snap.barricades[i * 3],
            y: snap.barricades[i * 3 + 1],
            z: snap.barricades[i * 3 + 2],
        });

        const head = at(BarricadeWire.UPPER_LEFT);
        assert.ok(Math.abs(head.x - barricadeRig().leftX) < 0.01, 'mast is off station');
        assert.ok(head.y > BARRICADE_DECK_LOCAL_Y + 5, 'mast head is not up');
        assert.ok(Math.abs(head.z - BARRICADE_LOCAL_Z) < 0.01, 'mast is off the hinge line');

        // The whole rig hangs between the masts, above the deck, near the plane.
        for (let i = 0; i < layout.count; i++) {
            const p = at(i);
            assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
                `particle ${i} is not a number`);
            assert.ok(p.y >= BARRICADE_DECK_LOCAL_Y - 0.5,
                `particle ${i} is under the deck at y=${p.y.toFixed(2)}`);
            assert.ok(p.y < BARRICADE_DECK_LOCAL_Y + 12, `particle ${i} is in orbit`);
            assert.ok(Math.abs(p.z - BARRICADE_LOCAL_Z) < 12,
                `particle ${i} is ${(p.z - BARRICADE_LOCAL_Z).toFixed(1)} m off the rig plane`);
        }
    });

    it('survives the shared-bank round trip the worker really uses', () => {
        // The postMessage path is the fallback; with SharedArrayBuffer isolation
        // the shape goes through banks and a control block instead, and that is
        // the path most sessions take.
        const sim = simWithBarricade();
        sim.step(1 / 60, {});
        const shared = createSimSharedState();
        const back = sharedBackBank(shared);
        const snap = sim.encodeSnapshotInto(undefined, undefined, barricadeBank(shared, back));
        publishSharedBanks(shared, 0, 0, snap.barricadeCount, snap.barricadeNodes);

        const pull = tryPullSharedSnapshot(shared, 0);
        assert.ok(pull, 'nothing was published');
        assert.equal(pull.barricadeCount, snap.barricadeCount);
        assert.equal(pull.barricadeNodes, snap.barricadeNodes);
        for (let i = 0; i < snap.barricadeNodes * 3; i++) {
            assert.equal(pull.barricades[i], snap.barricades[i], `float ${i} did not survive`);
        }
    });

    it('fits inside the bank it is given, with room to spare', () => {
        const sim = simWithBarricade();
        sim.step(1 / 60, {});
        const snap = sim.encodeSnapshot();
        assert.ok(snap.barricadeNodes * 3 <= BARRICADE_STRIDE,
            `${snap.barricadeNodes} particles will not fit in a ${BARRICADE_STRIDE}-float block`);
    });

    it('is laid out identically by the sim and by whatever draws it', () => {
        // Neither end is told the layout; both work it out from the fitted span.
        // This is the assertion that they agree — get it wrong and the renderer
        // reads a stripe's floats as a belt node and the net comes out as hash.
        for (const [l, r, deck] of [[-17.5, 17.5, 13.55], [-9, 19, 13.9], [-4, 6, 12]] as const) {
            const a = new BarricadeLayout(barricadeSolverSpecForRig(l, r, deck));
            const b = new BarricadeLayout(barricadeSolverSpecForRig(l, r, deck));
            assert.equal(a.count, b.count);
            assert.equal(a.beltNodes, b.beltNodes);
            for (let i = 0; i < a.beltNodes; i++) {
                assert.equal(a.beltNodeIndex(true, i), b.beltNodeIndex(true, i));
                assert.equal(a.beltNodeIndex(false, i), b.beltNodeIndex(false, i));
            }
            for (let s = 0; s < a.spec.stripes; s++) {
                for (let j = 0; j < a.spec.stripeNodes; j++) {
                    assert.equal(a.stripeNodeIndex(s, j), b.stripeNodeIndex(s, j));
                }
            }
            for (let w = 0; w < 4; w++) {
                for (let j = 0; j <= a.spec.wireNodes + 1; j++) {
                    assert.equal(a.wireNodeIndex(w, j), b.wireNodeIndex(w, j));
                }
            }
        }
    });

    it('gives every particle exactly one owner', () => {
        // A stripe end that is also a belt node, or a wire node that overlaps a
        // stripe, would be silently drawn twice and solved once.
        const layout = new BarricadeLayout(barricadeSolverSpecForRig(-17.5, 17.5, 13.55));
        const seen = new Set<number>();
        const claim = (i: number, what: string) => {
            assert.ok(i >= 0 && i < layout.count, `${what} is out of range at ${i}`);
            assert.ok(!seen.has(i), `${what} collides with another run at particle ${i}`);
            seen.add(i);
        };
        for (let w = 0; w < 4; w++) claim(w, `anchor ${w}`);
        for (const upper of [true, false]) {
            for (let i = 0; i < layout.beltNodes; i++) {
                claim(layout.beltNodeIndex(upper, i), `${upper ? 'upper' : 'lower'} belt ${i}`);
            }
        }
        for (let s = 0; s < layout.spec.stripes; s++) {
            for (let j = 0; j < layout.spec.stripeNodes; j++) {
                claim(layout.stripeNodeIndex(s, j), `stripe ${s} node ${j}`);
            }
        }
        for (let w = 0; w < 4; w++) {
            for (let j = 1; j <= layout.spec.wireNodes; j++) {
                claim(layout.wireNodeIndex(w, j), `wire ${w} node ${j}`);
            }
        }
        for (let t = 0; t < layout.spec.tieDowns; t++) {
            claim(layout.tieDownIndex(t), `tie-down fitting ${t}`);
        }
        assert.equal(seen.size, layout.count, 'some particles belong to nothing');
    });

    it('drapes the webbing over the drawn airframe, not the hitbox', () => {
        // Two different meshes for two different jobs. The hitbox is coarse on
        // purpose — bullets and crashes walk it linearly and want it small — but
        // the webbing is *drawn* lying on the aircraft, so solving it against
        // anything other than the aircraft that is drawn puts the net through
        // the wings. A few hitboxes are broken imports besides: a cube round the
        // cockpit, or nothing at all.
        const sim = simWithBarricade();
        const hitbox = {
            triangles: cube(1.65),
            aabb: { min: [-1.65, -1.65, -1.65] as [number, number, number],
                max: [1.65, 1.65, 1.65] as [number, number, number] },
        };
        const drawn = {
            triangles: cube(9),
            aabb: { min: [-9, -9, -9] as [number, number, number],
                max: [9, 9, 9] as [number, number, number] },
        };
        sim.addAircraft({
            id: 'ac',
            faction: Faction.PLAYER,
            control: 'external',
            kinematic: false,
            aircraftConfig: defaultFm2Config,
            hitRadius: 5,
            maxHealth: 100,
            collision: hitbox,
            spawn: {
                position: [O.x, O.y + BARRICADE_DECK_LOCAL_Y + 2, O.z + BARRICADE_LOCAL_Z + 20],
                quaternion: [0, 0, 0, 1],
                velocity: [0, 0, -60],
                throttle: 0, landed: false, airborne: false,
            },
            enabled: true,
        });

        const pick = (s: CombatSim) => (s as unknown as {
            barricadeHullFor(a: unknown): { aabb: { min: number[]; max: number[] } };
            aircraft: Map<string, unknown>;
        });
        const chosenBefore = pick(sim).barricadeHullFor(pick(sim).aircraft.get('ac'));
        // Hitbox alone is unusable, so it falls through to a stand-in.
        assert.ok(chosenBefore.aabb.max[0] - chosenBefore.aabb.min[0] >= 8,
            'a cockpit-sized hitbox was accepted as the airframe');

        sim.setBarricadeDrape('ac', drawn);
        const chosenAfter = pick(sim).barricadeHullFor(pick(sim).aircraft.get('ac'));
        assert.equal(chosenAfter, drawn, 'the drawn airframe was not preferred');
    });

    it('re-laces the webbing when a fresh assembly goes up', () => {
        // An arrestment leaves the net stretched, dragged downfield and with
        // cable off the drums. A respawn or a re-erection puts a new one on the
        // rig, and the sim has to lace it — otherwise the barricade spawn hands
        // you webbing that was already destroyed on the last sortie.
        const sim = simWithBarricade();
        for (let i = 0; i < 20; i++) sim.step(1 / 60, {});

        // Drag the rigged net well out of shape, the way an arrestment does.
        const solvers = (sim as unknown as { barricadeSolvers: { pos: Float64Array }[] })
            .barricadeSolvers;
        for (let i = 0; i < solvers[0].pos.length; i += 3) solvers[0].pos[i + 2] -= 40;
        sim.step(1 / 60, {});
        const wrecked = sim.encodeSnapshot();

        // Same rig, next assembly.
        sim.setBarricades([serializeBarricade(
            buildBarricadeField(pose(), BARRICADE_DECK_LOCAL_Y, 1, barricadeRig(), 7),
        )]);
        sim.step(1 / 60, {});
        const fresh = sim.encodeSnapshot();

        assert.equal(fresh.barricadeNodes, wrecked.barricadeNodes);
        let moved = 0;
        for (let i = 0; i < fresh.barricadeNodes; i++) {
            moved = Math.max(moved, Math.abs(fresh.barricades[i * 3 + 2] - wrecked.barricades[i * 3 + 2]));
        }
        assert.ok(moved > 20, `the new assembly is the old one, ${moved.toFixed(1)} m out of place`);
        // And it is back on the rig, not 40 m down the deck.
        for (let i = 0; i < fresh.barricadeNodes; i++) {
            assert.ok(Math.abs(fresh.barricades[i * 3 + 2] - BARRICADE_LOCAL_Z) < 12,
                `particle ${i} is still ${(fresh.barricades[i * 3 + 2] - BARRICADE_LOCAL_Z).toFixed(1)} m off the rig`);
        }
    });

    it('re-laces only when the span is refitted, not every time the ship moves', () => {
        // setBarricades arrives every frame the carrier moves. Re-rigging on each
        // one would throw the webbing's state away — and settle a fresh assembly
        // from scratch — sixty times a second.
        const sim = simWithBarricade();
        sim.step(1 / 60, {});
        const before = sim.encodeSnapshot();

        for (let f = 0; f < 30; f++) {
            sim.setBarricades([serializeBarricade(
                buildBarricadeField(pose(), BARRICADE_DECK_LOCAL_Y, 1, barricadeRig()),
            )]);
            sim.step(1 / 60, {});
        }
        const after = sim.encodeSnapshot();
        assert.equal(after.barricadeNodes, before.barricadeNodes);
        // A rig that was re-laced every frame would still be settling; one that
        // was left alone has long since stopped moving.
        let worst = 0;
        for (let i = 0; i < before.barricadeNodes * 3; i++) {
            worst = Math.max(worst, Math.abs(after.barricades[i] - before.barricades[i]));
        }
        assert.ok(worst < 0.5, `the webbing moved ${worst.toFixed(2)} m while nothing touched it`);
    });
});
