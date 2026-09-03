import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { FlyableAircraftDef } from '../scene/entities/aircraftDef';
import { SceneRunway, headingForward } from '../state/activeAirfield';
import { makeEnuBasis } from '../terrain/geodesy';
import { AiSkillLevel } from '../ai/aiPilot';
import { AiPilotModels } from '../state/gameDefs';
import { MISSION_SCHEME, MISSION_VERSION, MissionDoc } from './missionFormat';
import { validateMission } from './missionValidate';
import {
    MissionResolveContext, resolveMission, sceneHeadingFromBearing,
} from './missionResolve';

const ORIGIN = { lat: 28.0015, lon: -15.3937 };
const BASIS = makeEnuBasis(ORIGIN.lat, ORIGIN.lon, 0);

function runway(over: Partial<SceneRunway> = {}): SceneRunway {
    return {
        center: new THREE.Vector3(0, 0, 0),
        heading: 0,
        halfLength: 1500,
        halfWidth: 25,
        slope: 0,
        ref: '03/21',
        surface: 'asphalt',
        icao: 'GCLP',
        name: 'Gran Canaria',
        primary: true,
        ...over,
    };
}

function def(id: string, canonicalName?: string): FlyableAircraftDef {
    return {
        id, name: id, body: '', shadow: '', surfaces: [],
        cockpitOffset: [0, 0, 0], canonicalName,
    } as FlyableAircraftDef;
}

function ctx(over: Partial<MissionResolveContext> = {}): MissionResolveContext {
    return {
        basis: BASIS,
        sceneRunways: [runway()],
        groundHeightAt: () => 0,
        aircraft: [def('f22'), def('mig29', 'MiG-29')],
        pool: {
            enemy: ['me0', 'me1', 'me2', 'me3', 'me4', 'me5', 'me6'],
            player: ['mf0', 'mf1', 'mf2', 'mf3', 'mf4', 'mf5'],
        },
        ...over,
    };
}

/** Build a valid doc through the real validator, so fixtures cannot drift. */
function doc(over: Record<string, unknown> = {}): MissionDoc {
    const raw = {
        scheme: MISSION_SCHEME,
        version: MISSION_VERSION,
        id: 'test',
        name: 'Test',
        area: 'home',
        player: { airfield: 'GCLP', airborne: false },
        flights: [{
            id: 'bandit',
            faction: 'enemy',
            count: 1,
            start: {
                position: { lat: 28.13, lon: -15.42, altitudeM: 4000 },
                headingDeg: 195,
                airborne: true,
                speedMps: 210,
            },
        }],
        routes: [],
        ...over,
    };
    const v = validateMission(raw);
    assert.equal(v.ok, true, v.errors.map(e => `${e.path}: ${e.message}`).join('; '));
    return v.doc as MissionDoc;
}

function paths(issues: { path: string }[]): string[] {
    return issues.map(i => i.path);
}

describe('sceneHeadingFromBearing', () => {
    it('turns 021 true into a scene heading of 159', () => {
        // The worked example in activeAirfield.ts's own file header.
        const h = sceneHeadingFromBearing(21);
        assert.ok(Math.abs(h * 180 / Math.PI - 159) < 1e-9, `${h * 180 / Math.PI}`);
    });

    it('agrees with what headingForward reads back as a bearing', () => {
        for (const bearing of [0, 21, 90, 195, 270, 359]) {
            const f = headingForward(sceneHeadingFromBearing(bearing));
            // North is -z, east is +x, so the compass bearing of a scene
            // forward vector is atan2(x, -z).
            const back = (Math.atan2(f.x, -f.z) * 180 / Math.PI + 360) % 360;
            assert.ok(Math.abs(back - bearing) < 1e-6,
                `${bearing} true resolved to a vector reading ${back.toFixed(3)}`);
        }
    });
});

describe('resolveMission — geometry', () => {
    it('puts a fix 1 km due north of the origin at negative scene z', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1,
                start: {
                    position: {
                        lat: ORIGIN.lat + 1000 / 110574, lon: ORIGIN.lon, altitudeM: 4000,
                    },
                    headingDeg: 0, airborne: true,
                },
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, true, paths(r.errors).join(', '));
        const p = r.aircraft[0].position;
        assert.ok(Math.abs(p.z + 1000) < 5, `expected z ≈ -1000, got ${p.z.toFixed(1)}`);
        assert.ok(Math.abs(p.x) < 5, `expected x ≈ 0, got ${p.x.toFixed(1)}`);
    });

    it('points the spawn velocity along the bearing it was given', () => {
        const r = resolveMission(doc(), ctx());
        const v = r.aircraft[0].velocity;
        const bearing = (Math.atan2(v.x, -v.z) * 180 / Math.PI + 360) % 360;
        assert.ok(Math.abs(bearing - 195) < 1e-6, `flew off on ${bearing.toFixed(2)}`);
        assert.ok(Math.abs(v.length() - 210) < 1e-6);
    });

    it('spawns a flight line abreast to starboard, not stacked on one point', () => {
        const m = doc({
            flights: [{
                id: 'four', faction: 'enemy', count: 4,
                start: {
                    position: { lat: ORIGIN.lat, lon: ORIGIN.lon, altitudeM: 4000 },
                    headingDeg: 0, airborne: true, speedMps: 210,
                },
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.aircraft.length, 4);
        for (let i = 1; i < 4; i++) {
            const d = r.aircraft[i].position.distanceTo(r.aircraft[i - 1].position);
            assert.ok(Math.abs(d - 120) < 1e-6, `member ${i} is ${d.toFixed(1)} m off its neighbour`);
        }
        // Heading 000 true means facing north; starboard is east, so +x.
        assert.ok(r.aircraft[3].position.x > r.aircraft[0].position.x,
            'the flight lined up to port');
        assert.ok(Math.abs(r.aircraft[3].position.z - r.aircraft[0].position.z) < 1e-6,
            'the offset was not perpendicular to the heading');
    });

    it('resolves an agl fix against the ground under it', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1,
                start: {
                    position: {
                        lat: ORIGIN.lat, lon: ORIGIN.lon, altitudeM: 500, agl: true,
                    },
                    headingDeg: 0, airborne: true,
                },
            }],
        });
        const r = resolveMission(m, ctx({ groundHeightAt: () => 1800 }));
        assert.equal(r.aircraft[0].position.y, 2300);
    });
});

describe('resolveMission — flights and pools', () => {
    it('gives the route to the element lead only', () => {
        const m = doc({
            flights: [{
                id: 'pair', faction: 'enemy', count: 2, routeId: 'box',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
            routes: [{
                id: 'box', loop: true,
                legs: [
                    { id: 'l1', at: { lat: 28.1, lon: -15.4, altitudeM: 4000 }, action: 'transit' },
                    { id: 'l2', at: { lat: 28.2, lon: -15.4, altitudeM: 4000 }, action: 'transit' },
                ],
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.aircraft[0].lead, true);
        assert.ok(r.aircraft[0].route !== undefined);
        assert.equal(r.aircraft[0].route!.legs.length, 2);
        assert.equal(r.aircraft[1].lead, false);
        assert.equal(r.aircraft[1].route, undefined,
            'the wingman was given its own copy of the route');
        assert.equal(r.aircraft[1].leadSimId, r.aircraft[0].simId);
    });

    it('draws each faction from its own sub-pool', () => {
        const m = doc({
            flights: [
                {
                    id: 'red', faction: 'enemy', count: 2,
                    start: {
                        position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                        headingDeg: 0, airborne: true,
                    },
                },
                {
                    id: 'blue', faction: 'player', count: 2,
                    start: {
                        position: { lat: 28.0, lon: -15.4, altitudeM: 4000 },
                        headingDeg: 0, airborne: true,
                    },
                },
            ],
        });
        const r = resolveMission(m, ctx());
        assert.deepEqual(
            r.aircraft.map(a => a.simId),
            ['me0', 'me1', 'mf0', 'mf1']);
        assert.equal(new Set(r.aircraft.map(a => a.simId)).size, 4);
        for (const a of r.aircraft) {
            assert.ok(!['player', 'ai0', 'wing0'].includes(a.simId));
        }
    });

    it('errors rather than clamping when a faction is over budget', () => {
        // The validator catches this first — that is the primary defence, and
        // asserted in missionValidate.test.ts. The resolver checks again
        // because it is reachable another way: an editor holding an in-memory
        // doc it has not re-validated since the last edit.
        const base = doc();
        const over: MissionDoc = {
            ...base,
            flights: [{ ...base.flights[0], id: 'horde', count: 8 }],
        };
        assert.equal(validateMission(over).ok, false, 'the validator should refuse this too');

        const r = resolveMission(over, ctx());
        assert.equal(r.ok, false);
        assert.ok(r.errors[0].message.includes('limit of 7'),
            `unexpected message: ${r.errors[0].message}`);
        assert.equal(r.aircraft.length, 0, 'spawned part of an over-budget flight');
    });

    it('errors when the pool is smaller than the budget allows', () => {
        const base = doc();
        const m: MissionDoc = {
            ...base,
            flights: [{ ...base.flights[0], count: 3 }],
        };
        const r = resolveMission(m, ctx({
            pool: { enemy: ['me0'], player: ['mf0'] },
        }));
        assert.equal(r.ok, false);
        assert.ok(r.errors[0].message.includes('pool only has 1'),
            `unexpected message: ${r.errors[0].message}`);
    });

    it('maps pilot skill and model onto the sim enums', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1,
                pilot: { skill: 'VETERAN', model: 'SHAW', cruiseSpeedMps: 190 },
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.aircraft[0].pilot.skill, AiSkillLevel.VETERAN);
        assert.equal(r.aircraft[0].pilot.model, AiPilotModels.SHAW);
        assert.equal(r.aircraft[0].pilot.cruiseSpeed, 190);
    });
});

describe('resolveMission — airframes', () => {
    it('falls back to the canonical name when the pack id has changed', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1,
                aircraftType: 'mig29_2', aircraftCanonicalName: 'MiG-29',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, true);
        assert.equal(r.aircraft[0].def?.id, 'mig29');
        assert.equal(paths(r.warnings).length, 1);
    });

    it('warns and uses the player airframe when nothing matches', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1, aircraftType: 'nope',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, true, 'an uninstalled aircraft must not block the mission');
        assert.equal(r.aircraft[0].def, undefined);
        assert.equal(r.warnings.length, 1);
    });
});

describe('resolveMission — airfields', () => {
    it('resolves an ICAO-less field by name', () => {
        // Four of the twenty-four shipped airfields have no ICAO, and
        // pickStartRunway cannot match any of them.
        const gatow = runway({ icao: '', name: 'Berlin-Gatow', center: new THREE.Vector3(500, 0, 500) });
        const m = doc({ player: { airfield: 'Berlin-Gatow', airborne: false } });
        const r = resolveMission(m, ctx({ sceneRunways: [runway(), gatow] }));
        assert.equal(r.ok, true, paths(r.errors).join(', '));
        assert.equal(r.player?.runway?.name, 'Berlin-Gatow');
    });

    it('blocks the mission when a land leg names a field that is not here', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1, routeId: 'home',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
            routes: [{
                id: 'home', loop: false,
                legs: [{
                    id: 'l1', at: { lat: 28.1, lon: -15.4, altitudeM: 2000 },
                    action: 'land', airfield: 'EGLL',
                }],
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[0].airfield']);
    });

    it('flattens a resolvable land leg onto the route', () => {
        const m = doc({
            flights: [{
                id: 'a', faction: 'enemy', count: 1, routeId: 'home',
                start: {
                    position: { lat: 28.1, lon: -15.4, altitudeM: 4000 },
                    headingDeg: 0, airborne: true,
                },
            }],
            routes: [{
                id: 'home', loop: false,
                legs: [{
                    id: 'l1', at: { lat: 28.1, lon: -15.4, altitudeM: 2000 },
                    action: 'land', airfield: 'GCLP',
                }],
            }],
        });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, true, paths(r.errors).join(', '));
        const landing = r.aircraft[0].route!.legs[0].landRunway;
        assert.ok(landing !== undefined, 'the runway was not flattened onto the leg');
        assert.equal(landing!.halfLength, 1500);
    });

    it('blocks the mission when the player start field is not here', () => {
        const m = doc({ player: { airfield: 'EGLL', airborne: false } });
        const r = resolveMission(m, ctx());
        assert.equal(r.ok, false);
        assert.ok(paths(r.errors).includes('player.airfield'));
    });

    it('takes the player start from the named runway when no position is given', () => {
        const rw = runway({ center: new THREE.Vector3(120, 30, -400), heading: 1.2 });
        const m = doc({ player: { airfield: 'GCLP', airborne: false } });
        const r = resolveMission(m, ctx({ sceneRunways: [rw] }));
        assert.equal(r.player?.position.x, 120);
        assert.equal(r.player?.position.z, -400);
        assert.equal(r.player?.heading, 1.2);
    });
});
