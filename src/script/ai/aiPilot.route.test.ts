import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { clamp, FORWARD } from '../utils/math';
import { AiPilotModels } from '../state/gameDefs';
import { Combatant, Faction } from '../weapons/combatant';
import { RouteLeg, SerializedRoute } from '../mission/route';
import { AiFlightPhase } from './aiPilot';
import { AiPilotController } from './aiPilotController';
import { PilotableAircraft } from './aircraftControls';
import { createAiPilot } from './createAiPilot';
import { Obstacle, Runway, WorldQuery } from './worldQuery';

/**
 * Route following, exercised under every pilot model.
 *
 * `FlatWorld` is not a `SceneWorldQuery`, so `avoidObstacles` short-circuits
 * and returns the heading it was handed unchanged — the pure-pursuit rationale
 * in `doWaypoint` is *not* exercised here, only the tracking behaviour.
 *
 * Every case builds its pilot through `createAiPilot` and runs across all four
 * models. That is not thoroughness for its own sake: `new AiPilot(ac, world,
 * { model: SHAW })` silently ignores the option — `model` is read only inside
 * `createAiPilot` — so a suite that constructed `AiPilot` directly would build
 * a CLASSIC pilot four times and pass whether or not the per-frame `setPhase`
 * defect had been fixed.
 */

const DT = 1 / 60;
const MODELS = [
    AiPilotModels.CLASSIC,
    AiPilotModels.SHAW,
    AiPilotModels.AGGRESSIVE,
    AiPilotModels.ACE,
];

class FakeAircraft implements PilotableAircraft {
    readonly position = new THREE.Vector3();
    readonly velocity = new THREE.Vector3();
    readonly quaternion = new THREE.Quaternion();
    heading = 0;
    pitchAngle = 0;
    airspeed = 200;
    crashed = false;

    private pitchCmd = 0;
    private rollCmd = 0;
    private throttleCmd = 0;
    private airbrakes = false;

    setPitch(pitch: number): void { this.pitchCmd = pitch; }
    setRoll(roll: number): void { this.rollCmd = roll; }
    setYaw(_yaw: number): void { /* not modelled */ }
    setThrottle(throttle: number): void { this.throttleCmd = throttle; }
    setWheelBrakes(_applied: boolean): void { /* not modelled */ }
    setLandingGearDeployed(_deployed: boolean): void { /* not modelled */ }
    setFlapsExtended(_extended: boolean): void { /* not modelled */ }
    setAirbrakesExtended(extended: boolean): void { this.airbrakes = extended; }

    getPosition(): THREE.Vector3 { return this.position; }
    getVelocity(): THREE.Vector3 { return this.velocity; }
    getQuaternion(): THREE.Quaternion { return this.quaternion; }
    getAirspeed(): number { return this.airspeed; }
    getAltitude(): number { return this.position.y; }
    getAngleOfAttack(): number { return 0; }
    getLoadFactorG(): number { return 1; }
    getStallStatus(): number { return -1; }
    isLanded(): boolean { return false; }
    isCrashed(): boolean { return this.crashed; }
    isGearDeployed(): boolean { return false; }
    isFlapsExtended(): boolean { return false; }
    isAirbrakesExtended(): boolean { return this.airbrakes; }

    step(delta: number): void {
        const TURN_RATE_MAX = 1.0;
        const PITCH_RATE_MAX = 0.8;
        // Sign matches aiPilot.formation.test.ts: roll right turns toward a
        // decreasing heading, which is what the pilot's heading loop expects.
        this.heading -= this.rollCmd * TURN_RATE_MAX * delta;
        this.pitchAngle = clamp(
            this.pitchAngle + this.pitchCmd * PITCH_RATE_MAX * delta, -1.3, 1.3);
        // The speedbrake is the deceleration authority doWaypoint relies on;
        // without modelling it, a slower leg could never be met.
        const equilibriumSpeed = (50 + this.throttleCmd * 300) * (this.airbrakes ? 0.72 : 1);
        this.airspeed = Math.max(
            30, this.airspeed + (equilibriumSpeed - this.airspeed) * 0.5 * delta);
        const fwd = new THREE.Vector3(
            Math.sin(this.heading) * Math.cos(this.pitchAngle),
            Math.sin(this.pitchAngle),
            Math.cos(this.heading) * Math.cos(this.pitchAngle),
        );
        this.velocity.copy(fwd).multiplyScalar(this.airspeed);
        this.position.addScaledVector(this.velocity, delta);
        this.quaternion.setFromUnitVectors(FORWARD, fwd);
    }
}

class FakeCombatant implements Combatant {
    readonly position = new THREE.Vector3();
    readonly velocity = new THREE.Vector3();
    private alive = true;

    constructor(readonly faction: Faction) { }

    readPosition(t: THREE.Vector3): THREE.Vector3 { return t.copy(this.position); }
    readVelocity(t: THREE.Vector3): THREE.Vector3 { return t.copy(this.velocity); }
    getHitRadius(): number { return 10; }
    isAlive(): boolean { return this.alive; }
    applyDamage(_amount: number): void { this.alive = false; }
    kill(): void { this.alive = false; }
}

function makeRunway(x: number, z: number, heading = 0): Runway {
    return {
        center: new THREE.Vector3(x, 0, z),
        heading,
        halfLength: 1000,
        halfWidth: 30,
    };
}

/**
 * Flat ground, optionally with a mirrored-height-field disk around one focus
 * point — which is how the worker actually sees terrain: measured within
 * SIM_TERRAIN_MIRROR_RADIUS_M of a focus aircraft, and a coarse 611 m-lattice
 * guess everywhere else. Outside the disk this world reports a ridge that is
 * not really there, which is exactly what the coarse tier does between posts.
 */
class FlatWorld implements WorldQuery {
    /** Counts how often a pilot asked to be assigned a field. */
    nearestCalls = 0;
    /** Aircraft the mirror follows; unset means the whole world is measured. */
    focus: { position: THREE.Vector3 } | undefined;
    mirrorRadius = 1000;
    /** Phantom relief the coarse tier invents outside the mirrored disk. */
    phantomRidgeY = 0;

    constructor(private readonly fields: Runway[] = [makeRunway(0, 0)]) { }

    groundHeightAt(x: number, z: number): number {
        return this.isAuthoritativeAt(x, z) ? 0 : this.phantomRidgeY;
    }
    isLand(): boolean { return true; }
    obstacles(): readonly Obstacle[] { return []; }
    runways(): readonly Runway[] { return this.fields; }
    runway(): Runway { return this.fields[0]; }
    nearestRunway(x: number, z: number): Runway {
        this.nearestCalls++;
        let best = this.fields[0];
        let bestD = Infinity;
        for (const f of this.fields) {
            const d = Math.hypot(f.center.x - x, f.center.z - z);
            if (d < bestD) { bestD = d; best = f; }
        }
        return best;
    }
    isAuthoritativeAt(x: number, z: number): boolean {
        if (this.focus === undefined) {
            return true;
        }
        const p = this.focus.position;
        return Math.hypot(x - p.x, z - p.z) <= this.mirrorRadius;
    }
}

function leg(x: number, z: number, over: Partial<RouteLeg> = {}): RouteLeg {
    return {
        x, z, y: 4000, speed: 210, captureRadius: 2000,
        action: 'transit', holdSeconds: 0, ...over,
    };
}

function route(legs: RouteLeg[], loop = false): SerializedRoute {
    return { legs, loop };
}

/** An airborne pilot at 4000 m heading +Z at cruise, already on its route. */
function airborne(model: AiPilotModels, world = new FlatWorld()) {
    const ac = new FakeAircraft();
    ac.position.set(0, 4000, 0);
    ac.velocity.set(0, 0, 210);
    ac.airspeed = 210;
    const pilot: AiPilotController = createAiPilot(ac, world, {
        model,
        cruiseAltitude: 4000,
        cruiseSpeed: 210,
        hardDeck: 150,
    });
    return { ac, pilot, world };
}

function fly(ac: FakeAircraft, pilot: AiPilotController, seconds: number): void {
    for (let i = 0; i < Math.round(seconds / DT); i++) {
        pilot.update(DT);
        ac.step(DT);
    }
}

/** Leg index the pilot is on, read through the private route state. */
function legIndex(pilot: AiPilotController): number {
    const inner = (pilot as unknown as { classic?: unknown });
    const target = (inner.classic ?? pilot) as { routeState: { index: number } };
    return target.routeState.index;
}

describe('AiFlightPhase.WAYPOINT ordinal', () => {
    it('is 11 and is the last member', () => {
        // The ordinal IS the wire format: setPhase(id, phase: number) casts
        // straight to this enum with no range check, so inserting a value ahead
        // of WAYPOINT would silently re-task every route in flight.
        assert.equal(AiFlightPhase.WAYPOINT, 11);
        assert.equal(AiFlightPhase[11], 'WAYPOINT');
        assert.equal(AiFlightPhase[12], undefined);
    });
});

for (const model of MODELS) {
    describe(`route following — ${model}`, () => {
        it('flies a three-leg box in order and enters every capture circle', () => {
            const { ac, pilot } = airborne(model);
            const legs = [leg(0, 12000), leg(12000, 12000), leg(12000, 0)];
            pilot.setRoute(route(legs));
            pilot.setPhase(AiFlightPhase.WAYPOINT);

            const reached = new Set<number>();
            for (let i = 0; i < Math.round(400 / DT); i++) {
                pilot.update(DT);
                ac.step(DT);
                for (let n = 0; n < legs.length; n++) {
                    if (Math.hypot(legs[n].x - ac.position.x, legs[n].z - ac.position.z)
                        < legs[n].captureRadius) {
                        reached.add(n);
                    }
                }
            }
            assert.deepEqual([...reached].sort(), [0, 1, 2],
                `only reached ${[...reached]} — index ended at ${legIndex(pilot)}`);
        });

        it('advances past the first leg', () => {
            // Route progress lives with the route rather than with the phase,
            // which is what makes it survive Shaw, Aggressive and Ace calling
            // classic.setPhase(this.phase) on every frame of their non-ENGAGE
            // path. See the setPhase-idempotence suite below for the state that
            // is *not* naturally immune to that.
            const { ac, pilot } = airborne(model);
            pilot.setRoute(route([leg(0, 8000), leg(0, 30000)]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 60);
            assert.ok(legIndex(pilot) >= 1,
                `leg index stuck at ${legIndex(pilot)} after 60 s`);
        });

        it('settles within 30 m of the leg altitude', () => {
            const { ac, pilot } = airborne(model);
            ac.position.set(0, 3000, 0);
            pilot.setRoute(route([leg(0, 200000, { y: 4000 })]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 120);
            assert.ok(Math.abs(ac.position.y - 4000) < 30,
                `settled at ${ac.position.y.toFixed(0)} m, 1000 m below target`);
        });

        it('decelerates onto a slower leg without a large overshoot', () => {
            // commandFormationSpeed owns the speedbrake; commandSpeed alone
            // bottoms out at idle and a clean airframe stays fast.
            const { ac, pilot } = airborne(model);
            ac.airspeed = 250;
            pilot.setRoute(route([leg(0, 200000, { speed: 210 })]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 90);
            assert.ok(ac.airspeed - 210 < 15,
                `still ${ac.airspeed.toFixed(0)} m/s against a 210 m/s leg`);
        });

        it('survives being put in WAYPOINT with no route at all', () => {
            // buildPilot restores the previous phase on a rebuild, and
            // CombatSim.setPhase accepts this ordinal with no precondition, so
            // this state is reachable without a bug.
            const { ac, pilot } = airborne(model);
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            assert.doesNotThrow(() => fly(ac, pilot, 60));
        });

        it('survives a route with no legs', () => {
            const { ac, pilot } = airborne(model);
            pilot.setRoute(route([]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            assert.doesNotThrow(() => fly(ac, pilot, 30));
        });

        it('releases a one-shot route at the end and falls back to NAVIGATE', () => {
            const { ac, pilot } = airborne(model);
            pilot.setRoute(route([leg(0, 6000)], false));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 90);
            assert.equal(pilot.getPhase(), AiFlightPhase.NAVIGATE);
        });

        it('keeps flying a looping route instead of releasing it', () => {
            const { ac, pilot } = airborne(model);
            pilot.setRoute(route([leg(0, 8000), leg(8000, 8000)], true));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 200);
            assert.equal(pilot.getPhase(), AiFlightPhase.WAYPOINT);
        });

        it('resumes the route at the same leg after the bandit dies', () => {
            const { ac, pilot } = airborne(model);
            pilot.setRoute(route([leg(0, 40000), leg(40000, 40000)]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 20);
            const before = legIndex(pilot);

            const bandit = new FakeCombatant(Faction.PLAYER);
            bandit.position.set(200, 4000, ac.position.z + 1500);
            pilot.setTarget(bandit);
            fly(ac, pilot, 5);

            bandit.kill();
            fly(ac, pilot, 2);
            assert.equal(pilot.getPhase(), AiFlightPhase.WAYPOINT);
            assert.equal(legIndex(pilot), before, 'route restarted instead of resuming');
        });

        it('tracks its leg over coarse terrain that invents a ridge ahead', () => {
            // Off the fine tier the height is a 611 m-lattice guess. The
            // look-ahead horizon reaches ~1.7 km at cruise, well past the
            // mirrored disk, so trusting those probes latches the GPWS. Because
            // that gate returns *before* the phase switch, the aircraft then
            // goes wings-level and climbs without ever steering: the symptom is
            // "never turned", not "flew into a hill".
            const world = new FlatWorld();
            const { ac, pilot } = airborne(model, world);
            world.focus = ac;          // measured only within 1 km of the aircraft
            world.phantomRidgeY = 100000;
            pilot.setRoute(route([leg(20000, 20000)]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 40);
            assert.ok(ac.position.x > 500,
                `never turned toward the leg (x = ${ac.position.x.toFixed(0)})`);
        });

        it('still pulls up for real ground it can actually measure', () => {
            // The tier check must not become a blanket excuse to ignore
            // terrain: inside the mirrored disk the heights are real and the
            // GPWS has to keep working.
            const world = new FlatWorld();
            const { ac, pilot } = airborne(model, world);
            ac.position.set(0, 200, 0);
            world.focus = ac;
            world.mirrorRadius = 1e9;   // everything measured
            world.phantomRidgeY = 0;
            pilot.setRoute(route([leg(0, 40000, { y: 120 })]));
            pilot.setPhase(AiFlightPhase.WAYPOINT);
            fly(ac, pilot, 30);
            assert.ok(ac.position.y > 100,
                `descended to ${ac.position.y.toFixed(0)} m through a 150 m hard deck`);
        });
    });
}

describe('setPhase is idempotent', () => {
    /** Read a private field of the underlying classic pilot. */
    function inner(pilot: AiPilotController): Record<string, number | boolean> {
        const outer = pilot as unknown as { classic?: unknown };
        return (outer.classic ?? pilot) as Record<string, number | boolean>;
    }

    it('does not re-zero the leg altitude trim when the phase is unchanged', () => {
        // The integral is what removes the ~150 m droop of the proportional
        // pitch-attitude cascade. Shaw, Aggressive and Ace call
        // classic.setPhase(this.phase) every frame, so without the
        // unchanged-phase guard this is reset sixty times a second and can
        // never accumulate — the route would be flown persistently low.
        const { ac, pilot } = airborne(AiPilotModels.CLASSIC);
        ac.position.set(0, 3000, 0);
        pilot.setRoute(route([leg(0, 200000, { y: 4000 })]));
        pilot.setPhase(AiFlightPhase.WAYPOINT);
        fly(ac, pilot, 60);

        const trim = inner(pilot).routeAltTrim as number;
        assert.notEqual(trim, 0, 'the altitude integral never accumulated');

        pilot.setPhase(AiFlightPhase.WAYPOINT);
        assert.equal(inner(pilot).routeAltTrim, trim,
            're-entering the phase it is already in wiped the altitude trim');
    });

    it('does not re-arm the formation rejoin law when the phase is unchanged', () => {
        // Pre-existing, and the same root cause: a wingman under any of the
        // three delegating models re-armed the rejoin law on every frame and
        // so could never latch into station-keeping.
        const { ac, pilot } = airborne(AiPilotModels.CLASSIC);
        const lead = new FakeCombatant(Faction.ENEMY);
        lead.position.set(0, 4000, ac.position.z + 200);
        lead.velocity.set(0, 0, 210);
        pilot.setFormationLead(lead);
        pilot.setPhase(AiFlightPhase.FORMATION);
        for (let i = 0; i < Math.round(90 / DT); i++) {
            pilot.update(DT);
            ac.step(DT);
            lead.position.addScaledVector(lead.velocity, DT);
        }
        assert.equal(inner(pilot).formationRejoining, false,
            'never settled out of the rejoin law');

        pilot.setPhase(AiFlightPhase.FORMATION);
        assert.equal(inner(pilot).formationRejoining, false,
            're-entering FORMATION re-armed the rejoin law');
    });

    it('still runs entry effects on a genuine phase change', () => {
        const { pilot } = airborne(AiPilotModels.CLASSIC);
        pilot.setPhase(AiFlightPhase.FORMATION);
        assert.equal(inner(pilot).formationRejoining, true);
        pilot.setPhase(AiFlightPhase.NAVIGATE);
        pilot.setPhase(AiFlightPhase.FORMATION);
        assert.equal(inner(pilot).formationRejoining, true,
            'a real re-entry must re-arm the rejoin law');
    });
});

describe('route landing', () => {
    it('lands at the field the leg names, not the nearest one', () => {
        const near = makeRunway(0, 3000);
        const far = makeRunway(0, -60000);
        const world = new FlatWorld([near, far]);
        const { ac, pilot } = airborne(AiPilotModels.CLASSIC, world);
        pilot.setRoute(route([leg(0, 1000, {
            action: 'land',
            landRunway: {
                cx: far.center.x, cy: far.center.y, cz: far.center.z,
                heading: far.heading, halfLength: far.halfLength, halfWidth: far.halfWidth,
            },
        })]));
        pilot.setPhase(AiFlightPhase.WAYPOINT);
        fly(ac, pilot, 60);

        assert.equal(pilot.getPhase(), AiFlightPhase.RTB);
        // Heading for the far field means running to decreasing z; the nearest
        // field is the other way, so the sign alone separates the two.
        assert.ok(ac.position.z < 1000,
            `tracked toward the near field instead (z = ${ac.position.z.toFixed(0)})`);
    });

    it('re-picks the nearest field exactly once when no leg named one', () => {
        const world = new FlatWorld([makeRunway(0, 0), makeRunway(0, -40000)]);
        const { ac, pilot } = airborne(AiPilotModels.CLASSIC, world);
        pilot.setPhase(AiFlightPhase.RTB);
        fly(ac, pilot, 5);
        const afterFirst = world.nearestCalls;
        assert.equal(afterFirst, 1, 'picked a runway per frame instead of once');

        // Re-entering RTB is what re-decides; staying in it must not.
        pilot.setPhase(AiFlightPhase.STRAIGHT);
        pilot.setPhase(AiFlightPhase.RTB);
        fly(ac, pilot, 5);
        assert.equal(world.nearestCalls, 2);
    });
});
