import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MissionLegAction } from './missionFormat';
import {
    RouteLeg,
    RouteState,
    SerializedRoute,
    newRouteState,
    routeAdvance,
    routeCaptured,
} from './route';

const DT = 1 / 60;

function leg(
    x: number, z: number,
    over: Partial<RouteLeg> = {},
): RouteLeg {
    return {
        x, z, y: 4000,
        speed: 210,
        captureRadius: 2000,
        action: 'transit' as MissionLegAction,
        holdSeconds: 0,
        ...over,
    };
}

function route(legs: RouteLeg[], loop = false): SerializedRoute {
    return { legs, loop };
}

/** Step the sequencer for `seconds` while parked at one point. */
function hold(r: SerializedRoute, s: RouteState, x: number, z: number, seconds: number): void {
    for (let i = 0; i < Math.round(seconds / DT); i++) {
        routeAdvance(r, s, x, z, DT);
    }
}

describe('routeCaptured', () => {
    it('is horizontal only, so a fix below or above still captures', () => {
        const l = leg(0, 0, { y: 9000, captureRadius: 1000 });
        assert.equal(routeCaptured(l, 500, 500), true);
        assert.equal(routeCaptured(l, 900, 900), false);
    });

    it('excludes the boundary, so the radius is the last miss', () => {
        const l = leg(0, 0, { captureRadius: 1000 });
        assert.equal(routeCaptured(l, 1000, 0), false);
        assert.equal(routeCaptured(l, 999, 0), true);
    });
});

describe('routeAdvance', () => {
    it('advances exactly once on crossing a capture circle, and not before', () => {
        const r = route([leg(0, 0), leg(10000, 0)]);
        const s = newRouteState();

        routeAdvance(r, s, 3000, 0, DT);
        assert.equal(s.index, 0, 'advanced while still outside the circle');

        routeAdvance(r, s, 1500, 0, DT);
        assert.equal(s.index, 1);

        // Still inside leg 0's circle, but the state has moved on and must not
        // re-trigger on the fix it already captured.
        routeAdvance(r, s, 1500, 0, DT);
        assert.equal(s.index, 1);
    });

    it('holds an orbit leg for its full dwell before advancing', () => {
        const r = route([leg(0, 0, { action: 'orbit', holdSeconds: 10 }), leg(10000, 0)]);
        const s = newRouteState();

        hold(r, s, 0, 0, 9.9);
        assert.equal(s.index, 0, 'advanced before the dwell was up');

        hold(r, s, 0, 0, 0.2);
        assert.equal(s.index, 1);
    });

    it('does not count dwell while outside the orbit fix', () => {
        const r = route([leg(0, 0, { action: 'orbit', holdSeconds: 5 }), leg(10000, 0)]);
        const s = newRouteState();
        hold(r, s, 50000, 0, 30);
        assert.equal(s.index, 0);
        assert.equal(s.hold, 0);
    });

    it('resets the dwell clock for the next orbit leg', () => {
        const r = route([
            leg(0, 0, { action: 'orbit', holdSeconds: 2 }),
            leg(1000, 0, { action: 'orbit', holdSeconds: 2 }),
            leg(10000, 0),
        ]);
        const s = newRouteState();
        hold(r, s, 0, 0, 2.1);
        assert.equal(s.index, 1);
        assert.ok(s.hold < 0.1, `dwell carried over: ${s.hold}`);
        hold(r, s, 1000, 0, 1.5);
        assert.equal(s.index, 1, 'advanced on the previous leg\'s accumulated dwell');
        hold(r, s, 1000, 0, 0.7);
        assert.equal(s.index, 2);
    });

    it('wraps a looping route and never reports done', () => {
        const r = route([leg(0, 0), leg(5000, 0), leg(5000, 5000), leg(0, 5000)], true);
        const s = newRouteState();
        routeAdvance(r, s, 0, 0, DT);
        routeAdvance(r, s, 5000, 0, DT);
        routeAdvance(r, s, 5000, 5000, DT);
        assert.equal(s.index, 3);
        routeAdvance(r, s, 0, 5000, DT);
        assert.equal(s.index, 0, 'did not wrap');
        assert.equal(s.done, false);
    });

    it('pins the index and reports done at the end of a one-shot route', () => {
        const r = route([leg(0, 0), leg(5000, 0)]);
        const s = newRouteState();
        routeAdvance(r, s, 0, 0, DT);
        assert.equal(s.index, 1);
        routeAdvance(r, s, 5000, 0, DT);
        assert.equal(s.done, true);
        assert.equal(s.index, 1, 'index ran past the last leg');

        // Once done it stays done, however long the aircraft loiters there.
        hold(r, s, 5000, 0, 30);
        assert.equal(s.index, 1);
        assert.equal(s.done, true);
    });

    it('is a no-op on an empty route and never indexes out of range', () => {
        const r = route([]);
        const s = newRouteState();
        assert.doesNotThrow(() => hold(r, s, 0, 0, 5));
        assert.equal(s.index, 0);
        assert.equal(s.done, false);
    });

    it('restarts rather than reading past the end when the route is replaced', () => {
        // A pilot can hold an index into a longer route it was flying a moment
        // ago; reading legs[3] of a 2-leg route hands the pilot `undefined` and
        // its `leg.action` throws inside the worker step handler.
        const s: RouteState = { index: 3, hold: 4, done: false };
        const r = route([leg(0, 0), leg(5000, 0)]);
        assert.doesNotThrow(() => routeAdvance(r, s, 40000, 0, DT));
        assert.equal(s.index, 0);
        assert.equal(s.hold, 0);
    });

    it('flies a three-leg box in order when stepped along it', () => {
        const legs = [leg(0, 0), leg(8000, 0), leg(8000, 8000)];
        const r = route(legs);
        const s = newRouteState();
        for (const target of legs) {
            // Walk in from well outside each capture circle.
            for (let d = 6000; d >= 0; d -= 500) {
                routeAdvance(r, s, target.x + d, target.z, DT);
            }
        }
        assert.equal(s.done, true);
        assert.equal(s.index, 2);
    });
});
