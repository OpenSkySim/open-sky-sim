import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SIM_SHARED_MAX_AIRCRAFT } from '../physics/sim/simSharedState';
import {
    MISSION_AI_MODELS,
    MISSION_FACTIONS,
    MISSION_LEG_ACTIONS,
    MISSION_MAX_AIRCRAFT,
    MISSION_MAX_ENEMY,
    MISSION_MAX_FLIGHT_SIZE,
    MISSION_MAX_FRIENDLY,
    MISSION_POOL_IDS,
    MISSION_SKILLS,
} from './missionFormat';

/**
 * `missionFormat.ts` deliberately keeps no import from the sim: it is loaded by
 * the dev server, which has no business pulling in the physics worker's module
 * graph to read a schema. The cost of that is a literal that can drift from the
 * bank it describes — so the assertion lives here, in a test, where importing
 * the real constant is free.
 */

/** Rows held for the whole session by entities that exist outside any mission. */
const NON_MISSION_ROWS = 3; // 'player', 'wing0', 'ai0'

describe('mission aircraft budget', () => {
    it('leaves exactly the rows the shared bank has spare', () => {
        assert.equal(
            MISSION_MAX_AIRCRAFT + NON_MISSION_ROWS,
            SIM_SHARED_MAX_AIRCRAFT,
            'the mission budget no longer matches the shared bank — either the bank grew, '
            + 'or an entity was added that holds a row for the session. Both change how many '
            + 'aircraft a mission may spawn before encodeSnapshotInto throws and stalls the sim.');
    });

    it('splits that budget between the two fixed sub-pools', () => {
        // AiAircraftEntity.faction is readonly and the sim protocol has no
        // setFaction, so the split is structural: a flight draws from the
        // sub-pool that already matches its faction, and the two cannot be
        // borrowed against each other.
        assert.equal(MISSION_MAX_ENEMY + MISSION_MAX_FRIENDLY, MISSION_MAX_AIRCRAFT);
        assert.ok(MISSION_MAX_ENEMY > 0 && MISSION_MAX_FRIENDLY > 0);
    });

    it('reserves exactly as many sim ids as the budget allows', () => {
        // The pool is built at boot and never destroyed, so these ids are the
        // rows. If the lists and the budget ever disagree, either a flight
        // cannot be placed or the bank overflows and the sim stalls.
        assert.equal(MISSION_POOL_IDS.enemy.length, MISSION_MAX_ENEMY);
        assert.equal(MISSION_POOL_IDS.player.length, MISSION_MAX_FRIENDLY);
    });

    it('reserves ids that cannot collide with the three permanent aircraft', () => {
        // Widened on purpose: `as const` narrows these to a literal union, and
        // the point here is that no *arbitrary* reserved id appears among them.
        const all: string[] = [...MISSION_POOL_IDS.enemy, ...MISSION_POOL_IDS.player];
        assert.equal(new Set(all).size, all.length, 'duplicate id in the pool');
        for (const reserved of ['player', 'ai0', 'wing0']) {
            assert.ok(!all.includes(reserved), `${reserved} is also a mission pool id`);
        }
    });

    it('allows a flight no larger than the smaller sub-pool could field', () => {
        assert.ok(
            MISSION_MAX_FLIGHT_SIZE >= Math.min(MISSION_MAX_ENEMY, MISSION_MAX_FRIENDLY),
            'a flight cap below a sub-pool means part of the pool is unreachable');
    });
});

describe('mission enumerations', () => {
    it('lists every member of each union exactly once', () => {
        for (const values of
            [MISSION_FACTIONS, MISSION_LEG_ACTIONS, MISSION_SKILLS, MISSION_AI_MODELS]) {
            assert.equal(new Set(values).size, values.length, `duplicate in ${values.join(', ')}`);
            assert.ok(values.length > 0);
        }
    });
});
