/**
 * The editing model: every change a person can make to a mission, and undo.
 *
 * Pure — no DOM, no canvas, no three.js — so the whole of it is testable, and
 * so the panel is left owning only pixels and pointers.
 *
 * Undo is a stack of whole-document snapshots rather than a stack of inverse
 * commands. A mission is a few kilobytes of JSON, so the memory argument for
 * command objects does not apply, and a snapshot restores *exactly* what was
 * there — including the fields a hand-written inverse would forget. Getting
 * undo subtly wrong is worse than not having it.
 */

import {
    DEFAULT_CAPTURE_RADIUS_M,
    MISSION_MAX_FLIGHT_SIZE,
    MISSION_SCHEME,
    MISSION_VERSION,
    MissionDoc,
    MissionFaction,
    MissionFlight,
    MissionLeg,
    MissionLegAction,
    MissionPoint,
    MissionRoute,
} from './missionFormat';
import { missionSlug } from './missionValidate';

/** What the properties panel is currently showing. */
export type Selection =
    | { kind: 'none' }
    | { kind: 'player' }
    | { kind: 'flight'; flightId: string }
    | { kind: 'leg'; routeId: string; legId: string };

const UNDO_LIMIT = 100;

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

/** A slug unique within `taken`, suffixing until it is. */
function uniqueId(base: string, taken: Iterable<string>): string {
    const used = new Set(taken);
    const root = missionSlug(base) || 'item';
    if (!used.has(root)) {
        return root;
    }
    for (let n = 2; ; n++) {
        const candidate = `${root}-${n}`;
        if (!used.has(candidate)) {
            return candidate;
        }
    }
}

/** An empty mission, for File > New. */
export function emptyMission(id: string, name: string, area: string): MissionDoc {
    return {
        scheme: MISSION_SCHEME,
        version: MISSION_VERSION,
        id,
        name,
        area,
        player: { airborne: false },
        flights: [],
        routes: [],
    };
}

export class MissionEdit {

    private current: MissionDoc;
    private readonly undoStack: MissionDoc[] = [];
    private readonly redoStack: MissionDoc[] = [];
    /** The document as last saved, for the dirty check. */
    private saved: string;
    selection: Selection = { kind: 'none' };

    constructor(doc: MissionDoc) {
        this.current = clone(doc);
        this.saved = JSON.stringify(this.current);
    }

    get doc(): MissionDoc {
        return this.current;
    }

    get isDirty(): boolean {
        return JSON.stringify(this.current) !== this.saved;
    }

    get canUndo(): boolean { return this.undoStack.length > 0; }
    get canRedo(): boolean { return this.redoStack.length > 0; }

    /** Replace the document wholesale (load, or a fresh mission). Clears history. */
    reset(doc: MissionDoc): void {
        this.current = clone(doc);
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.saved = JSON.stringify(this.current);
        this.selection = { kind: 'none' };
    }

    /** Mark the current document as the saved one. */
    markSaved(savedUtc?: string): void {
        if (savedUtc !== undefined) {
            this.current.savedUtc = savedUtc;
        }
        this.saved = JSON.stringify(this.current);
    }

    /**
     * Run `mutate` on a copy and keep it, pushing the previous state for undo.
     *
     * Everything public goes through here, so there is exactly one place that
     * can forget to record history.
     */
    private commit(mutate: (doc: MissionDoc) => void): void {
        const before = clone(this.current);
        const next = clone(this.current);
        mutate(next);
        this.undoStack.push(before);
        if (this.undoStack.length > UNDO_LIMIT) {
            this.undoStack.shift();
        }
        this.redoStack.length = 0;
        this.current = next;
    }

    undo(): void {
        const prev = this.undoStack.pop();
        if (prev === undefined) {
            return;
        }
        this.redoStack.push(clone(this.current));
        this.current = prev;
        this.clampSelection();
    }

    redo(): void {
        const next = this.redoStack.pop();
        if (next === undefined) {
            return;
        }
        this.undoStack.push(clone(this.current));
        this.current = next;
        this.clampSelection();
    }

    /** Drop a selection that undo has just removed from the document. */
    private clampSelection(): void {
        const s = this.selection;
        if (s.kind === 'flight' && !this.current.flights.some(f => f.id === s.flightId)) {
            this.selection = { kind: 'none' };
        }
        if (s.kind === 'leg') {
            const route = this.current.routes.find(r => r.id === s.routeId);
            if (route === undefined || !route.legs.some(l => l.id === s.legId)) {
                this.selection = { kind: 'none' };
            }
        }
    }

    // --- document ---------------------------------------------------------

    setName(name: string): void {
        this.commit(d => { d.name = name; });
    }

    setDescription(description: string): void {
        this.commit(d => { d.description = description || undefined; });
    }

    setArea(area: string): void {
        this.commit(d => { d.area = area; });
    }

    // --- routes and legs --------------------------------------------------

    addRoute(name?: string): string {
        const id = uniqueId(name ?? 'route', this.current.routes.map(r => r.id));
        this.commit(d => {
            d.routes.push({ id, name: name ?? `Route ${d.routes.length + 1}`, loop: true, legs: [] });
        });
        return id;
    }

    removeRoute(routeId: string): void {
        this.commit(d => {
            d.routes = d.routes.filter(r => r.id !== routeId);
            // A flight pointing at a route that no longer exists is a validator
            // error, so clear the reference rather than leaving the mission
            // unflyable with no visible cause.
            for (const f of d.flights) {
                if (f.routeId === routeId) {
                    f.routeId = undefined;
                }
            }
        });
    }

    /** Append a fix to the end of a route. */
    addLeg(routeId: string, at: MissionPoint, action: MissionLegAction = 'transit'): string | undefined {
        const route = this.current.routes.find(r => r.id === routeId);
        if (route === undefined) {
            return undefined;
        }
        const id = uniqueId('l', route.legs.map(l => l.id));
        this.commit(d => {
            const r = d.routes.find(x => x.id === routeId)!;
            r.legs.push({
                id, at: { ...at }, action,
                captureRadiusM: DEFAULT_CAPTURE_RADIUS_M,
                holdSeconds: action === 'orbit' ? 60 : 0,
            });
        });
        return id;
    }

    /**
     * Insert a fix after `index`.
     *
     * With `addLeg` alone, correcting a route past its third fix means deleting
     * everything after the mistake and replacing it — which is the difference
     * between an editor and a recorder.
     */
    insertLeg(routeId: string, index: number, at: MissionPoint): string | undefined {
        const route = this.current.routes.find(r => r.id === routeId);
        if (route === undefined) {
            return undefined;
        }
        const id = uniqueId('l', route.legs.map(l => l.id));
        const clamped = Math.max(0, Math.min(route.legs.length, index + 1));
        this.commit(d => {
            const r = d.routes.find(x => x.id === routeId)!;
            r.legs.splice(clamped, 0, {
                id, at: { ...at }, action: 'transit',
                captureRadiusM: DEFAULT_CAPTURE_RADIUS_M, holdSeconds: 0,
            });
        });
        return id;
    }

    moveLeg(routeId: string, legId: string, lat: number, lon: number): void {
        this.commit(d => {
            const leg = d.routes.find(r => r.id === routeId)?.legs.find(l => l.id === legId);
            if (leg !== undefined) {
                leg.at.lat = lat;
                leg.at.lon = lon;
            }
        });
    }

    deleteLeg(routeId: string, legId: string): void {
        this.commit(d => {
            const route = d.routes.find(r => r.id === routeId);
            if (route !== undefined) {
                route.legs = route.legs.filter(l => l.id !== legId);
            }
        });
    }

    /** Move a leg from one position in the route to another. */
    reorderLeg(routeId: string, from: number, to: number): void {
        this.commit(d => {
            const route = d.routes.find(r => r.id === routeId);
            if (route === undefined
                || from < 0 || from >= route.legs.length
                || to < 0 || to >= route.legs.length) {
                return;
            }
            const [leg] = route.legs.splice(from, 1);
            route.legs.splice(to, 0, leg);
        });
    }

    setLegField<K extends keyof MissionLeg>(
        routeId: string, legId: string, key: K, value: MissionLeg[K],
    ): void {
        this.commit(d => {
            const leg = d.routes.find(r => r.id === routeId)?.legs.find(l => l.id === legId);
            if (leg === undefined) {
                return;
            }
            leg[key] = value;
            // An orbit leg with no dwell is a validator error; give it one so
            // switching the action in a dropdown does not break the mission.
            if (key === 'action') {
                if (value === 'orbit' && !(leg.holdSeconds && leg.holdSeconds > 0)) {
                    leg.holdSeconds = 60;
                }
            }
        });
    }

    setLegAltitude(routeId: string, legId: string, altitudeM: number, agl?: boolean): void {
        this.commit(d => {
            const leg = d.routes.find(r => r.id === routeId)?.legs.find(l => l.id === legId);
            if (leg === undefined) {
                return;
            }
            leg.at.altitudeM = altitudeM;
            if (agl !== undefined) {
                leg.at.agl = agl;
            }
        });
    }

    setRouteLoop(routeId: string, loop: boolean): void {
        this.commit(d => {
            const route = d.routes.find(r => r.id === routeId);
            if (route !== undefined) {
                route.loop = loop;
            }
        });
    }

    // --- flights ----------------------------------------------------------

    addFlight(faction: MissionFaction, at: MissionPoint, headingDeg = 0): string {
        const id = uniqueId(faction === 'enemy' ? 'bandit' : 'friendly',
            this.current.flights.map(f => f.id));
        this.commit(d => {
            d.flights.push({
                id,
                name: id,
                faction,
                count: 1,
                start: {
                    position: { ...at },
                    headingDeg,
                    airborne: true,
                    onGround: false,
                },
            });
        });
        return id;
    }

    removeFlight(flightId: string): void {
        this.commit(d => {
            d.flights = d.flights.filter(f => f.id !== flightId);
        });
    }

    duplicateFlight(flightId: string): string | undefined {
        const source = this.current.flights.find(f => f.id === flightId);
        if (source === undefined) {
            return undefined;
        }
        const id = uniqueId(flightId, this.current.flights.map(f => f.id));
        this.commit(d => {
            const src = d.flights.find(f => f.id === flightId)!;
            d.flights.push({ ...clone(src), id, name: id });
        });
        return id;
    }

    assignRoute(flightId: string, routeId: string | undefined): void {
        this.commit(d => {
            const flight = d.flights.find(f => f.id === flightId);
            if (flight !== undefined) {
                flight.routeId = routeId;
            }
        });
    }

    setFlightField<K extends keyof MissionFlight>(
        flightId: string, key: K, value: MissionFlight[K],
    ): void {
        this.commit(d => {
            const flight = d.flights.find(f => f.id === flightId);
            if (flight === undefined) {
                return;
            }
            flight[key] = value;
            if (key === 'count') {
                flight.count = Math.max(1,
                    Math.min(MISSION_MAX_FLIGHT_SIZE, Math.round(flight.count)));
            }
        });
    }

    setFlightStart(
        flightId: string, at: MissionPoint | undefined, headingDeg?: number,
    ): void {
        this.commit(d => {
            const flight = d.flights.find(f => f.id === flightId);
            if (flight === undefined) {
                return;
            }
            if (at !== undefined) {
                flight.start.position = { ...at };
            }
            if (headingDeg !== undefined) {
                flight.start.headingDeg = ((headingDeg % 360) + 360) % 360;
            }
        });
    }

    setFlightPilot(flightId: string, patch: Partial<MissionFlight['pilot']>): void {
        this.commit(d => {
            const flight = d.flights.find(f => f.id === flightId);
            if (flight === undefined) {
                return;
            }
            flight.pilot = { ...flight.pilot, ...patch };
        });
    }

    // --- the player -------------------------------------------------------

    setPlayerStart(patch: Partial<MissionDoc['player']>): void {
        this.commit(d => {
            d.player = { ...d.player, ...patch };
        });
    }

    // --- lookups ----------------------------------------------------------

    route(routeId: string | undefined): MissionRoute | undefined {
        return routeId === undefined
            ? undefined : this.current.routes.find(r => r.id === routeId);
    }

    flight(flightId: string | undefined): MissionFlight | undefined {
        return flightId === undefined
            ? undefined : this.current.flights.find(f => f.id === flightId);
    }
}
