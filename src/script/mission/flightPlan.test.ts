import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SIM_SHARED_MAX_AIRCRAFT } from '../physics/sim/simSharedState';
import {
    Flight, MAX_FLIGHTS, MISSION_ID_RE, Mission, initialBearingDeg, missionId, normalizeHeadingDeg, validateMission,
} from './flightPlan';

function flight(over: Partial<Flight> = {}): Flight {
    return {
        name: 'Viper 1',
        aircraftId: 'f16',
        control: 'ai',
        start: { kind: 'runway', airfield: 'GCLP', designator: '03L', lat: 27.93, lon: -15.39 },
        waypoints: [{ lat: 28.1, lon: -15.5, altM: 3000, speedMps: 220 }],
        land: { kind: 'runway', airfield: 'GCXO', designator: '30', lat: 28.48, lon: -16.34 },
        ...over,
    };
}

function mission(flights: Flight[] = [flight()]): Mission {
    return { version: 1, name: 'Island hop', area: 'Kanaren', flights };
}

describe('validateMission', () => {
    it('accepts a runway-to-runway AI flight', () => {
        assert.deepEqual(validateMission(mission()), []);
    });

    it('accepts an airborne start and no landing', () => {
        const f = flight({
            start: { kind: 'air', lat: 28, lon: -15, altM: 2000, speedMps: 200, headingDeg: 90 },
            land: undefined,
        });
        assert.deepEqual(validateMission(mission([f])), []);
    });

    it('accepts a side and an AI pilot with a personality, and rejects bad ones', () => {
        const personality = { aggression: 1, defensiveness: 0, skill: 0.5, energyFighting: 0.2, gunDiscipline: 0.9, gLimit: 7.5 };
        assert.deepEqual(validateMission(mission([flight({ side: 'hostile', pilot: { model: 'TUNABLE', personality } })])), []);
        assert.deepEqual(validateMission(mission([flight({ side: 'friendly', pilot: { model: 'SHAW' } })])), []);
        const bad = (over: Record<string, unknown>) => validateMission(mission([flight(over as Partial<Flight>)]));
        assert.deepEqual(bad({ side: 'neutral' }), ["flights[0].side: 'friendly' or 'hostile'"]);
        assert.deepEqual(bad({ pilot: { model: 'TOPGUN' } }), ['flights[0].pilot.model: CLASSIC, SHAW, AGGRESSIVE, ACE, TUNABLE']);
        assert.deepEqual(bad({ pilot: { model: 'TUNABLE', personality: { ...personality, gLimit: 12 } } }),
            ['flights[0].pilot.personality.gLimit: 3-9']);
        assert.deepEqual(bad({ pilot: { model: 'TUNABLE', personality: { ...personality, skill: undefined } } }),
            ['flights[0].pilot.personality.skill: 0-1']);
    });

    it('survives a round trip through JSON', () => {
        assert.deepEqual(validateMission(JSON.parse(JSON.stringify(mission()))), []);
    });

    it('leaves the sim room for the three aircraft that always exist', () => {
        assert.equal(MAX_FLIGHTS, SIM_SHARED_MAX_AIRCRAFT - 3);
        assert.deepEqual(validateMission(mission(Array.from({ length: MAX_FLIGHTS }, () => flight()))), []);
        assert.match(validateMission(mission(Array.from({ length: MAX_FLIGHTS + 1 }, () => flight())))[0],
            /room for/);
    });

    it('allows one player flight, not two', () => {
        assert.deepEqual(validateMission(mission([flight({ control: 'player' }), flight()])), []);
        assert.match(validateMission(mission([flight({ control: 'player' }), flight({ control: 'player' })]))[0],
            /at most one/);
    });

    it('names the field that is wrong', () => {
        const errors = validateMission(mission([flight({
            waypoints: [{ lat: 95, lon: 0, altM: -5, speedMps: 0 }],
        })]));
        assert.deepEqual(errors, [
            'flights[0].waypoints[0]: lat/lon out of range',
            'flights[0].waypoints[0].altM: 0-20000 m',
            'flights[0].waypoints[0].speedMps: 1-700 m/s',
        ]);
    });

    it('takes an MSL or AGL altitude reference, and nothing else', () => {
        const at = (altRef: unknown) => flight({
            start: { kind: 'air', lat: 28, lon: -15, altM: 300, altRef, speedMps: 200, headingDeg: 90 } as Flight['start'],
            waypoints: [{ lat: 28.1, lon: -15.5, altM: 150, altRef, speedMps: 220 } as Flight['waypoints'][0]],
        });
        assert.deepEqual(validateMission(mission([at('agl'), at('msl'), at(undefined)])), []);
        assert.deepEqual(validateMission(mission([at('feet')])), [
            'flights[0].start.altRef: msl or agl',
            'flights[0].waypoints[0].altRef: msl or agl',
        ]);
    });

    it('refuses a newer version, junk and an unknown endpoint kind', () => {
        assert.match(validateMission({ ...mission(), version: 2 })[0], /^version/);
        assert.deepEqual(validateMission(null), ['not a mission object']);
        const bad = flight({ start: { kind: 'boat' } as unknown as Flight['start'] });
        assert.deepEqual(validateMission(mission([bad])), ["flights[0].start.kind: 'runway' or 'air'"]);
    });
});

describe('missionId', () => {
    it('slugs a name into a safe file name', () => {
        assert.equal(missionId('Zürich CAP #2'), 'zurich-cap-2');
        assert.equal(missionId('../../etc/passwd'), 'etc-passwd');
        assert.match(missionId('Island hop'), MISSION_ID_RE);
        assert.equal(missionId('!!!'), '');
    });
});

describe('initialBearingDeg', () => {
    it('reads the compass: north 0, east 90, south 180, west 270', () => {
        const at = { lat: 47, lon: 11 };
        assert.ok(Math.abs(initialBearingDeg(at, { lat: 48, lon: 11 })) < 1e-9);
        assert.ok(Math.abs(initialBearingDeg(at, { lat: 47, lon: 11.01 }) - 90) < 0.01);
        assert.ok(Math.abs(initialBearingDeg(at, { lat: 46, lon: 11 }) - 180) < 1e-9);
        assert.ok(Math.abs(initialBearingDeg(at, { lat: 47, lon: 10.99 }) - 270) < 0.01);
    });

    it('folds headings into 0 up to 360', () => {
        assert.equal(normalizeHeadingDeg(-90), 270);
        assert.equal(normalizeHeadingDeg(360), 0);
        assert.equal(normalizeHeadingDeg(725), 5);
        assert.ok(Object.is(normalizeHeadingDeg(-0), 0));
    });
});
