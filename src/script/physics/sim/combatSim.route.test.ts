import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { AiFlightPhase } from '../../ai/aiPilot';
import { RouteLeg, SerializedRoute } from '../../mission/route';
import { Faction } from '../../weapons/combatant';
import { defaultFm2Config } from '../fm2/fm2AircraftConfig';
import { CombatSim } from './combatSim';
import { serializeWorld } from './serializedWorld';

/**
 * The route across the worker boundary.
 *
 * Everything here is about *ordering*, because the route is the one piece of
 * pilot state with two ways to be silently dropped: it can arrive before the
 * world does (`buildPilot` returns early with no world, and the pilot that
 * `setWorld` later builds would never hear about it), and it can be thrown away
 * by the pilot rebuild that `setPilotOptions` forces on every flight start.
 * Both are ordinary sequences a mission launch produces, not edge cases — hence
 * storing the route on the aircraft rather than handing it to the pilot.
 *
 * Driven against `CombatSim` directly, with no worker: the message plumbing is
 * four lines of forwarding, and what is worth pinning is the behaviour behind it.
 */

const AI_ID = 'ai0';

function flatWorld() {
    return serializeWorld([], [], [{
        center: new THREE.Vector3(0, 0, 0),
        heading: 0,
        halfLength: 1000,
        halfWidth: 30,
    }], [], [], []);
}

function addAi(sim: CombatSim, id = AI_ID): void {
    sim.addAircraft({
        id,
        faction: Faction.ENEMY,
        control: 'ai',
        kinematic: false,
        aircraftConfig: defaultFm2Config,
        pilotOptions: { cruiseAltitude: 4000, cruiseSpeed: 210, hardDeck: 150 },
        hitRadius: 10,
        maxHealth: 100,
        spawn: {
            position: [0, 4000, 0],
            quaternion: [0, 0, 0, 1],
            velocity: [0, 0, 210],
            landed: false,
            throttle: 0.7,
            airborne: true,
        },
        enabled: true,
    });
}

function leg(x: number, z: number, over: Partial<RouteLeg> = {}): RouteLeg {
    return {
        x, z, y: 4000, speed: 210, captureRadius: 2500,
        action: 'transit', holdSeconds: 0, ...over,
    };
}

const BOX: SerializedRoute = {
    legs: [leg(0, 15000), leg(15000, 15000), leg(15000, 0)],
    loop: true,
};

function step(sim: CombatSim, seconds: number): void {
    const dt = 1 / 60;
    for (let i = 0; i < Math.round(seconds / dt); i++) {
        sim.step(dt, {});
    }
}

/** Position of an aircraft, read out of the sim's private table. */
function posOf(sim: CombatSim, id = AI_ID): THREE.Vector3 {
    const table = (sim as unknown as {
        aircraft: Map<string, { model: { position: THREE.Vector3 } }>;
    }).aircraft;
    return table.get(id)!.model.position;
}

/** Which legs the aircraft passed inside the capture radius of, in order seen. */
function flyAndRecordCaptures(sim: CombatSim, seconds: number): number[] {
    const dt = 1 / 60;
    const seen: number[] = [];
    for (let i = 0; i < Math.round(seconds / dt); i++) {
        sim.step(dt, {});
        const p = posOf(sim);
        for (let n = 0; n < BOX.legs.length; n++) {
            const l = BOX.legs[n];
            if (Math.hypot(l.x - p.x, l.z - p.z) < l.captureRadius
                && seen[seen.length - 1] !== n) {
                seen.push(n);
            }
        }
    }
    return seen;
}

describe('CombatSim.setRoute', () => {
    it('flies the route when set the ordinary way', () => {
        const sim = new CombatSim();
        sim.setWorld(flatWorld());
        addAi(sim);
        sim.setRoute(AI_ID, BOX);
        sim.setPhase(AI_ID, AiFlightPhase.WAYPOINT);

        const seen = flyAndRecordCaptures(sim, 300);
        assert.deepEqual(seen.slice(0, 3), [0, 1, 2],
            `expected the box in order, saw ${seen.join(',')}`);
    });

    it('keeps a route that arrived before the world did', () => {
        // buildPilot early-returns while `world` is undefined, so the pilot
        // that setWorld builds is a different object from the one setRoute saw.
        const sim = new CombatSim();
        addAi(sim);
        sim.setRoute(AI_ID, BOX);
        sim.setPhase(AI_ID, AiFlightPhase.WAYPOINT);
        sim.setWorld(flatWorld());
        sim.setPhase(AI_ID, AiFlightPhase.WAYPOINT);

        const seen = flyAndRecordCaptures(sim, 300);
        assert.deepEqual(seen.slice(0, 3), [0, 1, 2],
            `route was dropped before the world arrived; saw ${seen.join(',')}`);
    });

    it('keeps a route across the rebuild setPilotOptions forces', () => {
        // Every flight start calls setPilotOptions, which rebuilds the pilot.
        const sim = new CombatSim();
        sim.setWorld(flatWorld());
        addAi(sim);
        sim.setRoute(AI_ID, BOX);
        sim.setPilotOptions(AI_ID, {
            cruiseAltitude: 4000, cruiseSpeed: 210, hardDeck: 150,
        });
        sim.setPhase(AI_ID, AiFlightPhase.WAYPOINT);

        const seen = flyAndRecordCaptures(sim, 300);
        assert.deepEqual(seen.slice(0, 3), [0, 1, 2],
            `route was dropped by the pilot rebuild; saw ${seen.join(',')}`);
    });

    it('clears cleanly and leaves the pilot in a stable phase', () => {
        const sim = new CombatSim();
        sim.setWorld(flatWorld());
        addAi(sim);
        sim.setRoute(AI_ID, BOX);
        sim.setPhase(AI_ID, AiFlightPhase.WAYPOINT);
        step(sim, 5);

        sim.setRoute(AI_ID, null);
        assert.doesNotThrow(() => step(sim, 30));
        const p = posOf(sim);
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
    });

    it('ignores a route for an aircraft that is not there', () => {
        const sim = new CombatSim();
        sim.setWorld(flatWorld());
        assert.doesNotThrow(() => sim.setRoute('nobody', BOX));
    });

    it('does not disturb an aircraft that was never given a route', () => {
        const sim = new CombatSim();
        sim.setWorld(flatWorld());
        addAi(sim);
        sim.setPhase(AI_ID, AiFlightPhase.STRAIGHT);
        step(sim, 20);
        const p = posOf(sim);
        // STRAIGHT holds a latched heading: it should still be running +Z.
        assert.ok(p.z > 1000, `expected to hold heading, ended at z = ${p.z.toFixed(0)}`);
    });
});
