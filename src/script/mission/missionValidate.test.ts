import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    MISSION_MAX_ENEMY,
    MISSION_SCHEME,
    MISSION_VERSION,
    MissionDoc,
} from './missionFormat';
import { missionSlug, validateMission } from './missionValidate';

/** A minimal mission that must always validate; each test perturbs one field. */
function valid(): Record<string, unknown> {
    return {
        scheme: MISSION_SCHEME,
        version: MISSION_VERSION,
        id: 'gclp-cap',
        name: 'Gran Canaria CAP',
        area: 'home',
        player: { airfield: 'GCLP', airborne: false },
        flights: [{
            id: 'bandit',
            faction: 'enemy',
            count: 2,
            routeId: 'cap-north',
            start: {
                position: { lat: 28.13, lon: -15.42, altitudeM: 4000 },
                headingDeg: 195,
                airborne: true,
                speedMps: 210,
            },
        }],
        routes: [{
            id: 'cap-north',
            loop: true,
            legs: [
                { id: 'l1', at: { lat: 28.13, lon: -15.42, altitudeM: 4000 }, action: 'transit' },
                { id: 'l2', at: { lat: 28.09, lon: -15.30, altitudeM: 4000 }, action: 'transit' },
            ],
        }],
    };
}

/** Apply a patch to the valid fixture, then validate. */
function check(patch: (m: Record<string, unknown>) => void) {
    const m = valid();
    patch(m);
    return validateMission(m);
}

/** Paths of every reported error, for order-independent assertions. */
function paths(issues: { path: string }[]): string[] {
    return issues.map(i => i.path);
}

describe('validateMission', () => {
    it('accepts the reference mission and fills context-free defaults', () => {
        const r = validateMission(valid());
        assert.equal(r.ok, true, r.errors.map(e => `${e.path}: ${e.message}`).join('; '));
        const doc = r.doc as MissionDoc;
        assert.equal(doc.id, 'gclp-cap');
        assert.equal(doc.flights.length, 1);
        // Context-free defaults are applied...
        assert.equal(doc.routes[0].legs[0].captureRadiusM, 2000);
        assert.equal(doc.routes[0].legs[0].at.agl, false);
        // ...and context-dependent ones are deliberately left for missionResolve.
        assert.equal(doc.routes[0].legs[0].speedMps, undefined);
        assert.equal(doc.flights[0].aircraftType, undefined);
    });

    it('never throws, whatever it is handed', () => {
        for (const junk of [undefined, null, 42, 'mission', [], [1, 2], true, () => 0]) {
            const r = validateMission(junk);
            assert.equal(r.ok, false);
            assert.ok(r.errors.length > 0);
        }
    });

    it('reports a wrong scheme as exactly one error at path "scheme"', () => {
        const r = check(m => { m.scheme = 'retro-mission/2'; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['scheme']);
    });

    it('refuses a version from a newer build rather than dropping its fields', () => {
        const r = check(m => { m.version = MISSION_VERSION + 1; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['version']);
        assert.match(r.errors[0].message, /needs a newer build/);
    });

    it('accepts an older version inside the same scheme', () => {
        // Nothing to test until MISSION_VERSION > 1; assert the boundary holds.
        const r = check(m => { m.version = MISSION_VERSION; });
        assert.equal(r.ok, true);
    });

    it('rejects a flight naming a route that does not exist', () => {
        const r = check(m => {
            (m.flights as Record<string, unknown>[])[0].routeId = 'no-such-route';
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['flights[0].routeId']);
    });

    it('rejects more enemy aircraft than the pool holds', () => {
        const r = check(m => {
            const flights = m.flights as Record<string, unknown>[];
            flights[0].count = 5;
            flights.push({ ...flights[0], id: 'bandit-2', count: 4, routeId: undefined });
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['flights']);
        assert.match(r.errors[0].message, new RegExp(`limit of ${MISSION_MAX_ENEMY}`));
    });

    it('counts the two factions against separate budgets', () => {
        // 7 enemy + 6 friendly is exactly the ceiling and must pass.
        const r = check(m => {
            const flights = m.flights as Record<string, unknown>[];
            flights[0].count = 7;
            flights.push({ ...flights[0], id: 'friendly', faction: 'player', count: 6 });
        });
        assert.equal(r.ok, true, r.errors.map(e => e.path).join(', '));
    });

    it('rejects a flight larger than one element', () => {
        const r = check(m => { (m.flights as Record<string, unknown>[])[0].count = 9; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['flights[0].count']);
    });

    it('rejects a fractional aircraft count', () => {
        const r = check(m => { (m.flights as Record<string, unknown>[])[0].count = 2.5; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['flights[0].count']);
    });

    it('rejects a land leg with no airfield', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[1].action = 'land';
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[1].airfield']);
    });

    it('rejects an orbit leg with no hold time', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[1].action = 'orbit';
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[1].holdSeconds']);
    });

    it('rejects an orbit leg holding for zero seconds', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[1].action = 'orbit';
            legs[1].holdSeconds = 0;
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[1].holdSeconds']);
    });

    it('rejects out-of-range coordinates', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[0].at = { lat: 91, lon: -200, altitudeM: 100 };
        });
        assert.equal(r.ok, false);
        assert.deepEqual(
            paths(r.errors).sort(),
            ['routes[0].legs[0].at.lat', 'routes[0].legs[0].at.lon']);
    });

    it('rejects a NaN coordinate rather than passing it downstream', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[0].at = { lat: NaN, lon: -15.4, altitudeM: 100 };
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[0].at.lat']);
    });

    it('rejects duplicate ids within one collection', () => {
        const r = check(m => {
            const legs = (m.routes as { legs: Record<string, unknown>[] }[])[0].legs;
            legs[1].id = 'l1';
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['routes[0].legs[1].id']);
    });

    it('rejects an empty route', () => {
        const r = check(m => { (m.routes as { legs: unknown[] }[])[0].legs = []; });
        assert.equal(r.ok, false);
        assert.ok(paths(r.errors).includes('routes[0].legs'));
    });

    it('rejects a player start with neither an airfield nor a position', () => {
        const r = check(m => { m.player = { airborne: true }; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['player']);
    });

    it('rejects a spawn that is both airborne and on the ground', () => {
        const r = check(m => {
            const start = (m.flights as { start: Record<string, unknown> }[])[0].start;
            start.onGround = true;
        });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['flights[0].start.onGround']);
    });

    it('reports every problem in one pass, not just the first', () => {
        const r = check(m => {
            m.name = '';
            m.area = '';
            (m.flights as Record<string, unknown>[])[0].count = 99;
        });
        assert.equal(r.ok, false);
        assert.ok(r.errors.length >= 3, `expected several errors, got ${r.errors.length}`);
        assert.ok(paths(r.errors).includes('name'));
        assert.ok(paths(r.errors).includes('area'));
        assert.ok(paths(r.errors).includes('flights[0].count'));
    });

    it('warns rather than fails on a near-reversal the turn latch will fly wide', () => {
        const r = check(m => {
            const route = (m.routes as { legs: Record<string, unknown>[] }[])[0];
            route.legs = [
                { id: 'l1', at: { lat: 28.00, lon: -15.40, altitudeM: 4000 }, action: 'transit' },
                { id: 'l2', at: { lat: 28.20, lon: -15.40, altitudeM: 4000 }, action: 'transit' },
                { id: 'l3', at: { lat: 28.00, lon: -15.401, altitudeM: 4000 }, action: 'transit' },
            ];
        });
        assert.equal(r.ok, true, r.errors.map(e => e.path).join(', '));
        assert.deepEqual(paths(r.warnings), ['routes[0].legs[1]']);
        assert.match(r.warnings[0].message, /committed reversal/);
    });

    it('does not warn about a gentle course change', () => {
        const r = validateMission(valid());
        assert.equal(r.warnings.length, 0, paths(r.warnings).join(', '));
    });

    it('warns about a route no flight flies', () => {
        const r = check(m => {
            (m.routes as Record<string, unknown>[]).push({
                id: 'unused',
                loop: false,
                legs: [{ id: 'u1', at: { lat: 28, lon: -15.4, altitudeM: 3000 }, action: 'transit' }],
            });
        });
        assert.equal(r.ok, true);
        assert.deepEqual(paths(r.warnings), ['routes[1]']);
    });
});

describe('missionSlug', () => {
    it('strips everything that could escape the missions directory', () => {
        for (const evil of ['../../etc/passwd', '..\\..\\windows', 'a/b/c', '.hidden', 'C:\\x']) {
            const slug = missionSlug(evil);
            assert.ok(!slug.includes('.'), `"${evil}" -> "${slug}" still has a dot`);
            assert.ok(!slug.includes('/'), `"${evil}" -> "${slug}" still has a slash`);
            assert.ok(!slug.includes('\\'), `"${evil}" -> "${slug}" still has a backslash`);
            assert.ok(!slug.includes(':'), `"${evil}" -> "${slug}" still has a colon`);
        }
    });

    it('is idempotent, including at the 40-character cap', () => {
        // A name whose 40th character lands on a separator: without the second
        // trim this slugs to something that does not survive re-slugging, and
        // the `missionSlug(id) === id` rule would reject an id it produced.
        const name = `${'a'.repeat(39)} tail`;
        const once = missionSlug(name);
        assert.equal(missionSlug(once), once);
        assert.ok(!once.endsWith('-'), `"${once}" ends with a separator`);
        assert.ok(once.length <= 40);
    });

    it('returns the empty string for a name with nothing usable in it', () => {
        assert.equal(missionSlug('...'), '');
        assert.equal(missionSlug(''), '');
        assert.equal(missionSlug('///'), '');
    });

    it('rejects an id that slugs to nothing, which would write a hidden file', () => {
        for (const bad of ['...', '', '///']) {
            const r = check(m => { m.id = bad; });
            assert.equal(r.ok, false, `"${bad}" was accepted as an id`);
            assert.ok(paths(r.errors).includes('id'));
        }
    });

    it('rejects an id that is not already its own slug', () => {
        const r = check(m => { m.id = 'Gran Canaria CAP'; });
        assert.equal(r.ok, false);
        assert.deepEqual(paths(r.errors), ['id']);
        assert.match(r.errors[0].message, /gran-canaria-cap/);
    });
});
