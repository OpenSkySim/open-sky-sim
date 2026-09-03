/**
 * The route an AI pilot actually flies, and the sequencer that walks it.
 *
 * Plain numbers throughout: this IS the wire format and IS the in-worker type.
 * `CombatSimClient.post()` is a bare `worker.postMessage`, so a `THREE.Vector3`
 * would arrive on the far side as a bare `{x, y, z}` with no prototype and no
 * methods — the route would look right in the debugger and throw on first use.
 * Keeping the type flat removes the question entirely, and lets `simTypes.ts`
 * reference it with `import type` without dragging the mission schema into the
 * worker bundle.
 *
 * The sequencer is pure and synchronous so it can be tested at 1/60 without a
 * sim, a world, or a pilot. Everything that needs three.js — turning a `land`
 * leg back into a `Runway`, projecting a spawn speed along a heading — happens
 * on the main thread in `missionResolve.ts`, before any of this crosses over.
 */

import type { MissionLegAction } from './missionFormat';

/**
 * Integral trim on the commanded leg altitude, matching FORMATION_ALT_TRIM_* in
 * aiPilot.ts. The altitude loop ends in a proportional-only pitch-attitude
 * cascade, which droops roughly 150 m against a standing demand; without a
 * bounded integral a route flown at 4000 m settles at 3850 m and stays there.
 * The bound is what stops the integral winding up during a terrain pull-up,
 * when the altitude demand is being ignored entirely.
 */
export const ROUTE_ALT_TRIM_RATE = 0.03;
export const ROUTE_ALT_TRIM_MAX = 400;

export interface RouteLeg {
    /** Scene metres, east. */
    x: number;
    /** Scene metres, SOUTH — scene z is negated north (see geodesy.ts). */
    z: number;
    /** Absolute scene Y, already curvature-corrected by `missionResolve`. */
    y: number;
    /** m/s. */
    speed: number;
    /** Metres, horizontal only — see {@link routeCaptured}. */
    captureRadius: number;
    action: MissionLegAction;
    /** Seconds to hold over the fix on an `orbit` leg; 0 otherwise. */
    holdSeconds: number;
    /**
     * `action: 'land'`: the destination runway, flattened so the leg is
     * self-contained. Indexing into `world.runways()` instead would couple the
     * route to `setWorld` ordering, and the worker's `Runway` type carries no
     * identity to name a field by, so there would be nothing stable to store.
     */
    landRunway?: {
        cx: number;
        cy: number;
        cz: number;
        heading: number;
        halfLength: number;
        halfWidth: number;
    };
}

export interface SerializedRoute {
    legs: RouteLeg[];
    loop: boolean;
}

/** Mutable per-pilot progress along a {@link SerializedRoute}. */
export interface RouteState {
    /** Index of the leg being flown. Pinned at the last leg once `done`. */
    index: number;
    /** Seconds accumulated over the current fix; only an `orbit` leg uses it. */
    hold: number;
    /**
     * Set when a non-looping route runs out of legs. The pilot reads this to
     * drop back to NAVIGATE and release the route — without it, a finished
     * flight orbits its last fix forever.
     */
    done: boolean;
}

export function newRouteState(): RouteState {
    return { index: 0, hold: 0, done: false };
}

/**
 * Horizontal-only capture. Altitude is deliberately not part of the test: the
 * altitude loop lags its demand by design, so a climbing aircraft would arrive
 * over the fix hundreds of metres low and orbit it waiting for a condition the
 * geometry has already satisfied.
 */
export function routeCaptured(leg: RouteLeg, px: number, pz: number): boolean {
    return Math.hypot(leg.x - px, leg.z - pz) < leg.captureRadius;
}

/**
 * Advance `state` in place given where the aircraft is now.
 *
 * Called once per frame from the pilot, BEFORE the terrain-avoidance gate:
 * `update()` returns early while a pull-up is active, so bookkeeping placed
 * after that gate would freeze mid-manoeuvre and the aircraft would silently
 * overfly its fix while climbing away from a hill.
 *
 * Total, and safe against a state that no longer matches its route — a pilot
 * can be handed a shorter route while holding an index into the old one.
 */
export function routeAdvance(
    route: SerializedRoute,
    state: RouteState,
    px: number,
    pz: number,
    delta: number,
): void {
    const legs = route.legs;
    if (legs.length === 0 || state.done) {
        return;
    }
    if (state.index < 0 || state.index >= legs.length) {
        // The route was replaced under us. Restart rather than read past the
        // end: `legs[index]` would be undefined and the pilot's `leg.action`
        // would throw inside the worker step handler, stalling the sim.
        state.index = 0;
        state.hold = 0;
    }
    const leg = legs[state.index];
    if (!routeCaptured(leg, px, pz)) {
        return;
    }
    if (leg.action === 'orbit' && leg.holdSeconds > 0) {
        state.hold += delta;
        if (state.hold < leg.holdSeconds) {
            return;
        }
    }
    state.hold = 0;
    const next = state.index + 1;
    if (next < legs.length) {
        state.index = next;
        return;
    }
    if (route.loop) {
        state.index = 0;
        return;
    }
    state.done = true;
}
