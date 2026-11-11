/**
 * A mission for the waypoint editor (F12 map): planes, each with a type, AI or
 * player control, where it starts, the waypoints it flies and where it lands.
 *
 * Pure data and validation, no three.js, DOM or fs: the dev server
 * (tools/missions.ts) validates with this before it writes a file, and the
 * browser before it sends one.
 *
 * Stored geodetically, because scene metres move with the play area. Altitude
 * is metres above sea level, or above the ground at the point when its
 * `altRef` is 'agl'; speed true airspeed in m/s; the editor shows feet
 * and knots.
 */

import { AI_G_LIMIT_MAX, AI_G_LIMIT_MIN, AI_PERSONALITY_KEYS, AiPersonality } from '../ai/tunable/aiPersonality';

export const MISSION_VERSION = 1;
/**
 * The sim holds 16 aircraft and throws past that (SIM_SHARED_MAX_AIRCRAFT);
 * 'player', 'wing0' and 'ai0' always hold three of them.
 */
export const MAX_FLIGHTS = 13;
export const MAX_WAYPOINTS = 100;
export const MAX_ALT_M = 20_000;
export const MAX_SPEED_MPS = 700;
const MAX_NAME = 80;

export type FlightControl = 'ai' | 'player';

/**
 * Whose side an AI flight is on. Friendly flies with the player and fights
 * hostile flights; hostile attacks the player and every friendly flight.
 * Omitted means friendly (missions saved before there was a choice). The
 * player's own flight is always friendly.
 */
export type FlightSide = 'friendly' | 'hostile';

/** The AI pilot models (AiPilotModels' values; kept as strings so this file stays free of the game). */
export const FLIGHT_PILOT_MODELS = ['CLASSIC', 'SHAW', 'AGGRESSIVE', 'ACE', 'TUNABLE'] as const;
export type FlightPilotModel = typeof FLIGHT_PILOT_MODELS[number];

/** Who flies an AI flight. Omitted: the classic pilot. */
export interface FlightPilot {
    model: FlightPilotModel;
    /** The TUNABLE model's knobs; the other models ignore it. */
    personality?: AiPersonality;
}

/**
 * What an altitude is measured from: mean sea level, or the ground under the
 * point. Omitted means MSL (missions saved before there was a choice).
 */
export type AltitudeRef = 'msl' | 'agl';

export interface Waypoint {
    lat: number;
    lon: number;
    /** Held on the leg to this waypoint. */
    altM: number;
    /** AGL: `altM` above the terrain at this waypoint, held as the MSL that makes there. */
    altRef?: AltitudeRef;
    speedMps: number;
}

/**
 * Where a flight starts or lands: one end of a runway, or a point in the air.
 * A runway is named as the spawn picker names it (activeAirfield.runwayKey),
 * `designator` the end flown toward on take-off or landing (`21R`); `lat`/`lon`
 * are its middle, to draw it before the airfield's tiles have loaded.
 */
export type FlightEndpoint =
    | { kind: 'runway'; airfield: string; designator: string; lat: number; lon: number }
    | { kind: 'air'; lat: number; lon: number; altM: number; altRef?: AltitudeRef; speedMps: number; headingDeg: number };

export interface Flight {
    name: string;
    /** A FlyableAircraftDef id from the aircraft registry. */
    aircraftId: string;
    control: FlightControl;
    /** AI flights only; omitted is friendly. */
    side?: FlightSide;
    /** AI flights only; omitted is the classic pilot. */
    pilot?: FlightPilot;
    start: FlightEndpoint;
    waypoints: Waypoint[];
    /** Omitted: the flight holds at its last waypoint. */
    land?: FlightEndpoint;
}

export interface Mission {
    version: number;
    name: string;
    /** The terrain area it was made in (manifest area name). */
    area?: string;
    flights: Flight[];
}

/** The file name a mission is saved under: its name, slugged. */
export function missionId(name: string): string {
    // Accents come off rather than splitting the word: Zürich is zurich. Cut
    // before trimming dashes, so a cut on a separator cannot end in one.
    return name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40).replace(/^-+|-+$/g, '');
}

export const MISSION_ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Initial great-circle bearing from `a` to `b`: degrees clockwise from north, 0 up to 360. */
export function initialBearingDeg(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const rad = Math.PI / 180;
    const lat1 = a.lat * rad;
    const lat2 = b.lat * rad;
    const dLon = (b.lon - a.lon) * rad;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return normalizeHeadingDeg(Math.atan2(y, x) / rad);
}

/** A compass heading folded into 0 up to 360 (360 itself reads as 0). */
export function normalizeHeadingDeg(deg: number): number {
    const h = ((deg % 360) + 360) % 360;
    // -0 and float dust just under 360 both mean north.
    return h >= 360 - 1e-9 ? 0 : h + 0;
}

/** Errors in `m`, empty when it is a mission this build can fly. */
export function validateMission(m: unknown): string[] {
    const errors: string[] = [];
    const fail = (where: string, what: string): void => {
        errors.push(`${where}: ${what}`);
    };
    if (!isObject(m)) {
        return ['not a mission object'];
    }
    if (m.version !== MISSION_VERSION) {
        fail('version', `expected ${MISSION_VERSION}, got ${String(m.version)}`);
    }
    if (!isName(m.name) || !missionId(m.name)) {
        fail('name', `1-${MAX_NAME} characters with a letter or digit`);
    }
    if (m.area !== undefined && typeof m.area !== 'string') {
        fail('area', 'not a string');
    }
    if (!Array.isArray(m.flights)) {
        fail('flights', 'not a list');
        return errors;
    }
    if (m.flights.length > MAX_FLIGHTS) {
        fail('flights', `${m.flights.length} is more than the ${MAX_FLIGHTS} the sim has room for`);
    }
    let players = 0;
    m.flights.forEach((f: unknown, i: number) => {
        const at = `flights[${i}]`;
        if (!isObject(f)) {
            fail(at, 'not an object');
            return;
        }
        if (!isName(f.name)) {
            fail(`${at}.name`, `1-${MAX_NAME} characters`);
        }
        if (typeof f.aircraftId !== 'string' || !f.aircraftId) {
            fail(`${at}.aircraftId`, 'missing');
        }
        if (f.control === 'player') {
            players++;
        } else if (f.control !== 'ai') {
            fail(`${at}.control`, "'ai' or 'player'");
        }
        if (f.side !== undefined && f.side !== 'friendly' && f.side !== 'hostile') {
            fail(`${at}.side`, "'friendly' or 'hostile'");
        }
        if (f.pilot !== undefined) {
            checkPilot(f.pilot, `${at}.pilot`, fail);
        }
        checkEndpoint(f.start, `${at}.start`, fail);
        if (f.land !== undefined) {
            checkEndpoint(f.land, `${at}.land`, fail);
        }
        if (!Array.isArray(f.waypoints)) {
            fail(`${at}.waypoints`, 'not a list');
        } else if (f.waypoints.length > MAX_WAYPOINTS) {
            fail(`${at}.waypoints`, `more than ${MAX_WAYPOINTS}`);
        } else {
            f.waypoints.forEach((w: unknown, j: number) => {
                const wat = `${at}.waypoints[${j}]`;
                if (!isObject(w)) {
                    fail(wat, 'not an object');
                    return;
                }
                checkPoint(w, wat, fail);
                checkFlight(w, wat, fail);
            });
        }
    });
    if (players > 1) {
        fail('flights', `${players} player flights, at most one`);
    }
    return errors;
}

type Fail = (where: string, what: string) => void;

function checkPilot(p: unknown, at: string, fail: Fail): void {
    if (!isObject(p)) {
        fail(at, 'not an object');
        return;
    }
    if (!(FLIGHT_PILOT_MODELS as readonly unknown[]).includes(p.model)) {
        fail(`${at}.model`, FLIGHT_PILOT_MODELS.join(', '));
    }
    if (p.personality === undefined) {
        return;
    }
    if (!isObject(p.personality)) {
        fail(`${at}.personality`, 'not an object');
        return;
    }
    for (const k of AI_PERSONALITY_KEYS) {
        const [lo, hi] = k === 'gLimit' ? [AI_G_LIMIT_MIN, AI_G_LIMIT_MAX] : [0, 1];
        if (!inRange(p.personality[k], lo, hi)) {
            fail(`${at}.personality.${k}`, `${lo}-${hi}`);
        }
    }
}

function checkEndpoint(e: unknown, at: string, fail: Fail): void {
    if (!isObject(e)) {
        fail(at, 'missing');
        return;
    }
    if (e.kind !== 'runway' && e.kind !== 'air') {
        fail(`${at}.kind`, "'runway' or 'air'");
        return;
    }
    checkPoint(e, at, fail);
    if (e.kind === 'runway') {
        if (typeof e.airfield !== 'string' || !e.airfield) {
            fail(`${at}.airfield`, 'missing');
        }
        if (typeof e.designator !== 'string' || !e.designator) {
            fail(`${at}.designator`, 'missing');
        }
    } else {
        checkFlight(e, at, fail);
        if (!inRange(e.headingDeg, 0, 360)) {
            fail(`${at}.headingDeg`, '0-360');
        }
    }
}

function checkPoint(p: Record<string, unknown>, at: string, fail: Fail): void {
    if (!inRange(p.lat, -90, 90) || !inRange(p.lon, -180, 180)) {
        fail(at, 'lat/lon out of range');
    }
}

function checkFlight(p: Record<string, unknown>, at: string, fail: Fail): void {
    if (!inRange(p.altM, 0, MAX_ALT_M)) {
        fail(`${at}.altM`, `0-${MAX_ALT_M} m`);
    }
    if (p.altRef !== undefined && p.altRef !== 'msl' && p.altRef !== 'agl') {
        fail(`${at}.altRef`, 'msl or agl');
    }
    if (!inRange(p.speedMps, 1, MAX_SPEED_MPS)) {
        fail(`${at}.speedMps`, `1-${MAX_SPEED_MPS} m/s`);
    }
}

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isName(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0 && v.length <= MAX_NAME;
}

function inRange(v: unknown, lo: number, hi: number): boolean {
    return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
}
