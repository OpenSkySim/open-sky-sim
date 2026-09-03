import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { AiFlightPhase } from '../ai/aiPilot';
import { Faction } from '../weapons/combatant';
import { makeEnuBasis } from '../terrain/geodesy';
import { MISSION_SCHEME, MISSION_VERSION, MissionDoc } from './missionFormat';
import { validateMission } from './missionValidate';
import { MissionResolveContext, ResolvedAircraft, resolveMission } from './missionResolve';
import { MISSION_MIRROR_FOCUS_COUNT, MissionRunner } from './missionRunner';
import { SerializedRoute } from './route';

const BASIS = makeEnuBasis(28.0015, -15.3937, 0);

/** Every call the runner makes, in order, as `method:id` plus its payload. */
type Call = { m: string; id: string; arg?: unknown };

class FakeSim {
    readonly calls: Call[] = [];
    setPilotOptions(id: string, arg: unknown): void { this.calls.push({ m: 'setPilotOptions', id, arg }); }
    setRoute(id: string, arg: SerializedRoute | null): void { this.calls.push({ m: 'setRoute', id, arg }); }
    setEnabled(id: string, arg: boolean): void { this.calls.push({ m: 'setEnabled', id, arg }); }
    setTargetFaction(id: string, arg: Faction | null): void { this.calls.push({ m: 'setTargetFaction', id, arg }); }
    setFormationLead(id: string, arg: string | null): void { this.calls.push({ m: 'setFormationLead', id, arg }); }
    setPhase(id: string, arg: number): void { this.calls.push({ m: 'setPhase', id, arg }); }

    /** Names of the calls made against one id, in order. */
    forId(id: string): string[] {
        return this.calls.filter(c => c.id === id).map(c => c.m);
    }
    of(id: string, m: string): Call | undefined {
        return this.calls.find(c => c.id === id && c.m === m);
    }
}

class FakePool {
    readonly spawned = new Map<string, ResolvedAircraft>();
    readonly disabled: string[] = [];
    readonly dead = new Set<string>();

    respawn(simId: string, a: ResolvedAircraft): void { this.spawned.set(simId, a); }
    disable(simId: string): void { this.disabled.push(simId); this.spawned.delete(simId); }
    positionOf(simId: string): { x: number; z: number } | undefined {
        const a = this.spawned.get(simId);
        return a === undefined ? undefined : { x: a.position.x, z: a.position.z };
    }
    isLive(simId: string): boolean {
        return this.spawned.has(simId) && !this.dead.has(simId);
    }
}

const POOL_IDS = {
    enemy: ['me0', 'me1', 'me2', 'me3', 'me4', 'me5', 'me6'],
    player: ['mf0', 'mf1', 'mf2', 'mf3', 'mf4', 'mf5'],
};
const ALL_POOL = [...POOL_IDS.enemy, ...POOL_IDS.player];

function ctx(): MissionResolveContext {
    return {
        basis: BASIS,
        sceneRunways: [{
            center: new THREE.Vector3(0, 0, 0), heading: 0, halfLength: 1500,
            halfWidth: 25, slope: 0, ref: '03/21', surface: 'asphalt',
            icao: 'GCLP', name: 'Gran Canaria', primary: true,
        }],
        groundHeightAt: () => 0,
        aircraft: [],
        pool: POOL_IDS,
    };
}

function mission(over: Record<string, unknown> = {}): MissionDoc {
    const v = validateMission({
        scheme: MISSION_SCHEME,
        version: MISSION_VERSION,
        id: 'test',
        name: 'Test',
        area: 'home',
        player: { airfield: 'GCLP', airborne: false },
        flights: [],
        routes: [],
        ...over,
    });
    assert.equal(v.ok, true, v.errors.map(e => `${e.path}: ${e.message}`).join('; '));
    return v.doc as MissionDoc;
}

function flight(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'bandit', faction: 'enemy', count: 1,
        start: {
            position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
            headingDeg: 0, airborne: true, speedMps: 210,
        },
        ...over,
    };
}

const BOX = {
    id: 'box', loop: true,
    legs: [
        { id: 'l1', at: { lat: 28.1, lon: -15.4, altitudeM: 4000 }, action: 'transit' },
        { id: 'l2', at: { lat: 28.2, lon: -15.4, altitudeM: 4000 }, action: 'transit' },
    ],
};

function run(doc: MissionDoc) {
    const sim = new FakeSim();
    const pool = new FakePool();
    const runner = new MissionRunner(sim, pool);
    const resolved = resolveMission(doc, ctx());
    assert.equal(resolved.ok, true, resolved.errors.map(e => e.path).join(', '));
    runner.start(resolved, ALL_POOL);
    return { sim, pool, runner, resolved };
}

describe('MissionRunner.start — ordering', () => {
    it('sets pilot options before the route, and the phase last', () => {
        // setPilotOptions forces a pilot rebuild, so anything pushed before it
        // that lives on the pilot is discarded. The phase goes last because it
        // is what starts the aircraft moving.
        const { sim } = run(mission({
            flights: [flight({ routeId: 'box', engages: 'player' })],
            routes: [BOX],
        }));
        assert.deepEqual(sim.forId('me0'), [
            'setPilotOptions', 'setRoute', 'setTargetFaction', 'setPhase',
        ]);
    });

    it('gives the route to the lead and only the lead', () => {
        const { sim } = run(mission({
            flights: [flight({ count: 3, routeId: 'box' })],
            routes: [BOX],
        }));
        const withRoute = sim.calls.filter(c => c.m === 'setRoute' && c.arg !== null);
        assert.equal(withRoute.length, 1, 'more than one aircraft was given the route');
        assert.equal(withRoute[0].id, 'me0');
    });

    it('puts every non-lead on the lead\'s wing', () => {
        const { sim } = run(mission({
            flights: [flight({ count: 3, routeId: 'box' })],
            routes: [BOX],
        }));
        for (const id of ['me1', 'me2']) {
            assert.equal(sim.of(id, 'setFormationLead')?.arg, 'me0');
            assert.equal(sim.of(id, 'setPhase')?.arg, AiFlightPhase.FORMATION);
        }
        assert.equal(sim.of('me0', 'setFormationLead'), undefined,
            'the lead was put on its own wing');
    });

    it('starts a routed lead in WAYPOINT and an unrouted one in NAVIGATE', () => {
        const routed = run(mission({
            flights: [flight({ routeId: 'box' })], routes: [BOX],
        }));
        assert.equal(routed.sim.of('me0', 'setPhase')?.arg, AiFlightPhase.WAYPOINT);

        const loitering = run(mission({ flights: [flight()] }));
        assert.equal(loitering.sim.of('me0', 'setPhase')?.arg, AiFlightPhase.NAVIGATE);
    });

    it('sends a parked flight through the takeoff roll', () => {
        // GROUND_IDLE has no self-transition, and startTakeoff is not on the
        // controller interface, so a parked aircraft would sit there forever.
        const { sim } = run(mission({
            flights: [flight({
                routeId: 'box',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 0 },
                    headingDeg: 0, airborne: false,
                },
            })],
            routes: [BOX],
        }));
        assert.equal(sim.of('me0', 'setPhase')?.arg, AiFlightPhase.TAKEOFF_ROLL);
        // It still gets the route: doClimbOut joins it unaided.
        assert.notEqual(sim.of('me0', 'setRoute')?.arg, null);
    });

    it('only sets a target faction for a flight that engages', () => {
        const hunting = run(mission({ flights: [flight({ engages: 'player' })] }));
        assert.equal(hunting.sim.of('me0', 'setTargetFaction')?.arg, Faction.PLAYER);

        const passive = run(mission({ flights: [flight()] }));
        assert.equal(passive.sim.of('me0', 'setTargetFaction'), undefined,
            'a flight with no `engages` was given auto-targeting anyway');
    });
});

describe('MissionRunner.start — the pool', () => {
    it('disables every slot the mission did not use', () => {
        const { sim, pool } = run(mission({ flights: [flight({ count: 2 })] }));
        const disabled = sim.calls
            .filter(c => c.m === 'setEnabled' && c.arg === false).map(c => c.id);
        assert.deepEqual(disabled.sort(), ALL_POOL.filter(id => !['me0', 'me1'].includes(id)).sort());
        assert.ok(!pool.disabled.includes('me0'));
    });

    it('never collides with the ids that exist outside a mission', () => {
        const { runner } = run(mission({
            flights: [flight({ count: 3 }), flight({ id: 'blue', faction: 'player', count: 2 })],
        }));
        assert.equal(new Set(runner.activeIds).size, runner.activeIds.length);
        for (const id of runner.activeIds) {
            assert.ok(!['player', 'ai0', 'wing0'].includes(id), `${id} collides`);
        }
    });

    it('draws the two factions from separate sub-pools', () => {
        const { runner } = run(mission({
            flights: [
                flight({ count: 2 }),
                flight({ id: 'blue', faction: 'player', count: 2 }),
            ],
        }));
        assert.deepEqual([...runner.activeIds], ['me0', 'me1', 'mf0', 'mf1']);
    });

    it('does nothing at all for a mission that failed to resolve', () => {
        const sim = new FakeSim();
        const pool = new FakePool();
        const runner = new MissionRunner(sim, pool);
        runner.start({
            ok: false, doc: mission(), aircraft: [], errors: [{ path: 'x', message: 'no' }],
            warnings: [],
        }, ALL_POOL);
        assert.equal(runner.activeIds.length, 0);
        assert.equal(pool.spawned.size, 0);
    });
});

describe('MissionRunner.stop', () => {
    it('clears the route of everything it started, and only that', () => {
        const { sim, runner } = run(mission({
            flights: [flight({ count: 2, routeId: 'box' })], routes: [BOX],
        }));
        const started = [...runner.activeIds];
        sim.calls.length = 0;
        runner.stop();

        const cleared = sim.calls
            .filter(c => c.m === 'setRoute' && c.arg === null).map(c => c.id);
        assert.deepEqual(cleared.sort(), [...started].sort());
        assert.equal(runner.activeIds.length, 0);
    });

    it('is safe to call twice, and before any start', () => {
        const runner = new MissionRunner(new FakeSim(), new FakePool());
        assert.doesNotThrow(() => { runner.stop(); runner.stop(); });
    });

    it('is called by start, so a second mission does not stack on the first', () => {
        const sim = new FakeSim();
        const pool = new FakePool();
        const runner = new MissionRunner(sim, pool);
        const first = resolveMission(mission({ flights: [flight({ count: 3 })] }), ctx());
        runner.start(first, ALL_POOL);
        const second = resolveMission(mission({ flights: [flight({ count: 1 })] }), ctx());
        runner.start(second, ALL_POOL);
        assert.deepEqual([...runner.activeIds], ['me0']);
    });
});

describe('MissionRunner.mirrorFocus', () => {
    it('follows only the nearest few, so the height store is not swamped', () => {
        const { runner, pool } = run(mission({ flights: [flight({ count: 5 })] }));
        runner.setPlayerPosition(0, 0);
        const focus = runner.mirrorFocus();
        assert.equal(focus.length, MISSION_MIRROR_FOCUS_COUNT);
        assert.ok(pool.spawned.size > MISSION_MIRROR_FOCUS_COUNT,
            'the test needs more aircraft than focus slots to mean anything');
    });

    it('picks the ones closest to the player', () => {
        const { runner, pool } = run(mission({ flights: [flight({ count: 5 })] }));
        // The flight is line abreast at 120 m spacing; sit on top of the last.
        const last = pool.positionOf('me4')!;
        runner.setPlayerPosition(last.x, last.z);
        const focus = runner.mirrorFocus();
        const xs = focus.map(f => Math.round(f.x));
        assert.ok(xs.includes(Math.round(last.x)), 'skipped the nearest aircraft');
        const nearestX = Math.round(pool.positionOf('me0')!.x);
        assert.ok(!xs.includes(nearestX), 'included the furthest aircraft over a nearer one');
    });

    it('drops aircraft that are no longer alive', () => {
        const { runner, pool } = run(mission({ flights: [flight({ count: 2 })] }));
        runner.setPlayerPosition(0, 0);
        assert.equal(runner.mirrorFocus().length, 2);
        pool.dead.add('me0');
        pool.dead.add('me1');
        assert.equal(runner.mirrorFocus().length, 0);
    });
});
