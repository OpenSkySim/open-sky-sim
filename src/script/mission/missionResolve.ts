/**
 * Turn a stored mission into something the sim can be told.
 *
 * This is the only place geodetic becomes scene metres and a true bearing
 * becomes a scene heading. Main-thread only, and free to import three.js and
 * geodesy — which is precisely why the worker never needs either: everything
 * that crosses over is the flat numbers of `route.ts`.
 *
 * Resolution is where a mission stops being portable and starts being about
 * *this* world: the play area's ENU origin, the airfields that were baked, the
 * aircraft the registry knows. So it is also where a mission can be found
 * unflyable, and it reports that rather than approximating around it.
 */

import * as THREE from 'three';
import { FlyableAircraftDef } from '../scene/entities/aircraftDef';
import { SceneRunway, findRunwayByKey, headingForward } from '../state/activeAirfield';
import { EnuBasis, geodeticToWorld } from '../terrain/geodesy';
import { AiSkillLevel } from '../ai/aiPilot';
import { AiPilotModels } from '../state/gameDefs';
import {
    MISSION_FLIGHT_SPACING_M,
    MISSION_MAX_ENEMY,
    MISSION_MAX_FRIENDLY,
    MissionDoc,
    MissionFaction,
    MissionFlight,
    MissionLeg,
    MissionPoint,
} from './missionFormat';
import { MissionIssue } from './missionValidate';
import { RouteLeg, SerializedRoute } from './route';

/** What the resolver needs to know about the world it is resolving into. */
export interface MissionResolveContext {
    /** ENU basis of the active play area. */
    basis: EnuBasis;
    /** Runways of the active area, as `activeAirfield` built them. */
    sceneRunways: readonly SceneRunway[];
    /**
     * Scene Y of the ground at a scene (x, z), for `agl` fixes. Resolution
     * happens at launch precisely so this can answer from resident tiles.
     */
    groundHeightAt(x: number, z: number): number;
    /** Aircraft the registry can actually spawn. */
    aircraft: readonly FlyableAircraftDef[];
    /** Sim ids free for mission use, split by faction and in a stable order. */
    pool: Record<MissionFaction, readonly string[]>;
}

/** One aircraft the runner will spawn. */
export interface ResolvedAircraft {
    /** Pooled sim id, e.g. `me0`. */
    simId: string;
    faction: MissionFaction;
    /** Flight this belongs to, for the runner's formation wiring. */
    flightId: string;
    /** True for member 0 — the element lead, and the only one given the route. */
    lead: boolean;
    /** Sim id of this member's lead; undefined on the lead itself. */
    leadSimId?: string;
    position: THREE.Vector3;
    /** Scene heading (rad). */
    heading: number;
    airborne: boolean;
    onGround: boolean;
    velocity: THREE.Vector3;
    throttle: number;
    /** Airframe to spawn, or undefined to use whatever the player is flying. */
    def?: FlyableAircraftDef;
    pilot: {
        cruiseAltitude: number;
        cruiseSpeed: number;
        hardDeck?: number;
        skill?: AiSkillLevel;
        model?: AiPilotModels;
    };
    /** Faction to hunt, or undefined for no auto-targeting. */
    engages?: MissionFaction;
    /** The route this aircraft flies; leads only. */
    route?: SerializedRoute;
}

export interface ResolvedPlayerStart {
    position: THREE.Vector3;
    heading: number;
    airborne: boolean;
    velocity: THREE.Vector3;
    aircraftType?: string;
    /** The runway the start was taken from, when it came from one. */
    runway?: SceneRunway;
}

export interface ResolvedMission {
    ok: boolean;
    doc: MissionDoc;
    player?: ResolvedPlayerStart;
    aircraft: ResolvedAircraft[];
    /** Blocks Fly. */
    errors: MissionIssue[];
    /** Worth showing, does not block. */
    warnings: MissionIssue[];
}

/** Default cruise numbers when a flight does not say. */
const DEFAULT_CRUISE_ALT_M = 4000;
const DEFAULT_CRUISE_SPEED_MPS = 210;

/**
 * Throttle guess for an airborne spawn. The sim settles this within a second
 * or two; the point is only to avoid starting every mission aircraft at idle
 * and watching it sink out of formation before the loop catches up.
 */
function throttleFor(speedMps: number): number {
    return Math.max(0.2, Math.min(1, (speedMps - 50) / 300));
}

const SKILLS: Record<string, AiSkillLevel> = {
    ROOKIE: AiSkillLevel.ROOKIE,
    VETERAN: AiSkillLevel.VETERAN,
    ACE: AiSkillLevel.ACE,
};

const MODELS: Record<string, AiPilotModels> = {
    CLASSIC: AiPilotModels.CLASSIC,
    SHAW: AiPilotModels.SHAW,
    AGGRESSIVE: AiPilotModels.AGGRESSIVE,
    ACE: AiPilotModels.ACE,
};

/**
 * A true bearing as a scene heading.
 *
 * Scene axes are x east, y up, z **south**, so a compass bearing is not a scene
 * heading: a runway on 021 true has a scene heading of 159. `activeAirfield`
 * says the same thing in its file header, and this is the only other place in
 * the codebase that has to apply it — everything downstream of the resolver is
 * already in scene space.
 */
export function sceneHeadingFromBearing(bearingDeg: number): number {
    return Math.PI - bearingDeg * Math.PI / 180;
}

class Resolver {
    readonly errors: MissionIssue[] = [];
    readonly warnings: MissionIssue[] = [];

    constructor(private readonly ctx: MissionResolveContext) { }

    err(path: string, message: string): void {
        this.errors.push({ path, message });
    }

    warn(path: string, message: string): void {
        this.warnings.push({ path, message });
    }

    /** Geodetic fix to scene metres, adding terrain under it when `agl`. */
    point(p: MissionPoint, out = new THREE.Vector3()): THREE.Vector3 {
        geodeticToWorld(this.ctx.basis, p.lat, p.lon, p.altitudeM, out);
        if (p.agl) {
            // The editor could only guess the ground under an unstreamed fix,
            // so an AGL altitude is resolved here, at launch, where the tiles
            // are actually resident.
            out.y = this.ctx.groundHeightAt(out.x, out.z) + p.altitudeM;
        }
        return out;
    }

    /** The airframe a flight named, by id then by canonical name. */
    aircraftFor(flight: MissionFlight, path: string): FlyableAircraftDef | undefined {
        const { aircraftType, aircraftCanonicalName } = flight;
        if (aircraftType !== undefined) {
            const byId = this.ctx.aircraft.find(a => a.id === aircraftType);
            if (byId !== undefined) {
                return byId;
            }
        }
        if (aircraftCanonicalName !== undefined) {
            // Pack ids gain _2/_3 suffixes on re-import and packs only exist
            // under the dev server, so the canonical name is what survives a
            // mission being opened on another machine.
            const byName = this.ctx.aircraft.find(
                a => a.canonicalName === aircraftCanonicalName);
            if (byName !== undefined) {
                if (aircraftType !== undefined) {
                    this.warn(path, `no aircraft "${aircraftType}"; using ${byName.id}`);
                }
                return byName;
            }
        }
        if (aircraftType !== undefined || aircraftCanonicalName !== undefined) {
            this.warn(path, 'aircraft not installed; using the player\'s airframe');
        }
        return undefined;
    }

    /** One route, flattened to the flat numbers the worker takes. */
    route(legs: MissionLeg[], loop: boolean, path: string, cruiseSpeed: number): SerializedRoute {
        const out: RouteLeg[] = [];
        const scratch = new THREE.Vector3();
        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i];
            this.point(leg.at, scratch);
            const resolved: RouteLeg = {
                x: scratch.x,
                y: scratch.y,
                z: scratch.z,
                speed: leg.speedMps ?? cruiseSpeed,
                captureRadius: leg.captureRadiusM ?? 2000,
                action: leg.action,
                holdSeconds: leg.holdSeconds ?? 0,
            };
            if (leg.action === 'land') {
                const key = leg.airfield ?? '';
                const runway = findRunwayByKey(this.ctx.sceneRunways, key);
                if (runway === undefined) {
                    // "Land somewhere else" is a mission that flies and is
                    // wrong, so this blocks rather than warns.
                    this.err(`${path}.legs[${i}].airfield`,
                        `no airfield "${key}" in this area`);
                } else {
                    resolved.landRunway = {
                        cx: runway.center.x,
                        cy: runway.center.y,
                        cz: runway.center.z,
                        heading: runway.heading,
                        halfLength: runway.halfLength,
                        halfWidth: runway.halfWidth,
                    };
                }
            }
            out.push(resolved);
        }
        return { legs: out, loop };
    }
}

/**
 * Resolve `doc` against the world in `ctx`.
 *
 * Always returns a result; `ok` says whether it can be flown. Errors are the
 * things that would make the mission quietly wrong — an airfield that is not in
 * this area, more aircraft than the pool holds — and warnings are the things
 * worth saying but not worth refusing over.
 */
export function resolveMission(doc: MissionDoc, ctx: MissionResolveContext): ResolvedMission {
    const r = new Resolver(ctx);
    const aircraft: ResolvedAircraft[] = [];

    // --- the player -------------------------------------------------------
    let player: ResolvedPlayerStart | undefined;
    {
        const start = doc.player;
        let runway: SceneRunway | undefined;
        if (start.airfield !== undefined) {
            runway = findRunwayByKey(ctx.sceneRunways, start.airfield);
            if (runway === undefined) {
                r.err('player.airfield', `no airfield "${start.airfield}" in this area`);
            }
        }
        const position = start.position !== undefined
            ? r.point(start.position)
            : runway?.center.clone();
        if (position !== undefined) {
            const heading = start.headingDeg !== undefined
                ? sceneHeadingFromBearing(start.headingDeg)
                : runway?.heading ?? 0;
            const speed = start.speedMps ?? (start.airborne ? DEFAULT_CRUISE_SPEED_MPS : 0);
            player = {
                position,
                heading,
                airborne: start.airborne,
                velocity: headingForward(heading).multiplyScalar(speed),
                aircraftType: start.aircraftType,
                runway,
            };
            if (start.aircraftType !== undefined
                && !ctx.aircraft.some(a => a.id === start.aircraftType)) {
                r.warn('player.aircraftType', 'aircraft not installed; keeping the current one');
            }
        }
    }

    // --- flights ----------------------------------------------------------
    const budget: Record<MissionFaction, number> = {
        enemy: MISSION_MAX_ENEMY,
        player: MISSION_MAX_FRIENDLY,
    };
    const used: Record<MissionFaction, number> = { enemy: 0, player: 0 };

    for (let f = 0; f < doc.flights.length; f++) {
        const flight = doc.flights[f];
        const path = `flights[${f}]`;
        const pool = ctx.pool[flight.faction];

        used[flight.faction] += flight.count;
        if (used[flight.faction] > budget[flight.faction]) {
            r.err(path,
                `${used[flight.faction]} ${flight.faction} aircraft exceeds the limit of `
                + `${budget[flight.faction]}`);
            continue;
        }
        if (used[flight.faction] > pool.length) {
            r.err(path, `the ${flight.faction} pool only has ${pool.length} aircraft`);
            continue;
        }

        const def = r.aircraftFor(flight, `${path}.aircraftType`);
        const cruiseAltitude = flight.pilot?.cruiseAltitudeM ?? DEFAULT_CRUISE_ALT_M;
        const cruiseSpeed = flight.pilot?.cruiseSpeedMps ?? DEFAULT_CRUISE_SPEED_MPS;

        let route: SerializedRoute | undefined;
        if (flight.routeId !== undefined) {
            const source = doc.routes.find(x => x.id === flight.routeId);
            if (source === undefined) {
                r.err(`${path}.routeId`, `no route with id "${flight.routeId}"`);
            } else {
                const ri = doc.routes.indexOf(source);
                route = r.route(source.legs, source.loop, `routes[${ri}]`, cruiseSpeed);
            }
        }

        const heading = sceneHeadingFromBearing(flight.start.headingDeg);
        const origin = r.point(flight.start.position);
        const forward = headingForward(heading);
        // Starboard of the heading: forward x up, which in this frame
        // (x east, y up, z south) is (-cos h, 0, sin h). Facing north the
        // forward vector is (0, 0, -1) and this gives (1, 0, 0) — east, which
        // is the side it should be. The negation of it is the port wing.
        const right = new THREE.Vector3(-Math.cos(heading), 0, Math.sin(heading));
        const speed = flight.start.speedMps
            ?? (flight.start.airborne ? cruiseSpeed : 0);

        const first = used[flight.faction] - flight.count;
        for (let m = 0; m < flight.count; m++) {
            const simId = pool[first + m];
            // Line abreast: without the offset every member of a flight spawns
            // on the same point and they start the mission inside each other.
            const position = origin.clone()
                .addScaledVector(right, m * MISSION_FLIGHT_SPACING_M);
            aircraft.push({
                simId,
                faction: flight.faction,
                flightId: flight.id,
                lead: m === 0,
                leadSimId: m === 0 ? undefined : pool[first],
                position,
                heading,
                airborne: flight.start.airborne,
                onGround: flight.start.onGround ?? !flight.start.airborne,
                velocity: forward.clone().multiplyScalar(speed),
                throttle: throttleFor(speed),
                def,
                pilot: {
                    cruiseAltitude,
                    cruiseSpeed,
                    hardDeck: flight.pilot?.hardDeckM,
                    skill: flight.pilot?.skill === undefined
                        ? undefined : SKILLS[flight.pilot.skill],
                    model: flight.pilot?.model === undefined
                        ? undefined : MODELS[flight.pilot.model],
                },
                engages: flight.engages,
                // Only the element lead flies the route; the rest fly its wing.
                // Giving every member the same route and the same capture radii
                // converges the whole flight onto one point.
                route: m === 0 ? route : undefined,
            });
        }
    }

    if (player === undefined && r.errors.length === 0) {
        r.err('player', 'the player start could not be resolved');
    }

    return {
        ok: r.errors.length === 0,
        doc,
        player,
        aircraft,
        errors: r.errors,
        warnings: r.warnings,
    };
}
