/**
 * Put a resolved mission into the sim, and take it out again.
 *
 * The runner talks to two narrow interfaces rather than to `CombatSimClient`
 * and `AiAircraftEntity` directly, so the whole of it is testable against
 * recording fakes with no worker and no scene. What it is really enforcing is
 * an *order*, and an order is exactly the kind of thing that is easy to get
 * wrong and impossible to see going wrong in the air.
 */

import { AiPilotOptions } from '../ai/aiPilot';
import { AiFlightPhase } from '../ai/aiPilot';
import { Faction } from '../weapons/combatant';
import { MissionFaction } from './missionFormat';
import { ResolvedAircraft, ResolvedMission } from './missionResolve';
import { SerializedRoute } from './route';

/** The slice of `CombatSimClient` the runner uses. */
export interface MissionSimClient {
    setPilotOptions(id: string, options: AiPilotOptions): void;
    setRoute(id: string, route: SerializedRoute | null): void;
    setEnabled(id: string, enabled: boolean): void;
    setTargetFaction(id: string, faction: Faction | null): void;
    setFormationLead(id: string, leadId: string | null): void;
    setPhase(id: string, phase: number): void;
}

/** The slice of `AiAircraftEntity` the runner uses, keyed by sim id. */
export interface MissionAircraftPool {
    /** Put the entity at its start state and enable it. */
    respawn(simId: string, a: ResolvedAircraft): void;
    /** Hide and disable it. Rows are never reclaimed; see the ceiling test. */
    disable(simId: string): void;
    /** Scene XZ of a live mission aircraft, for the terrain mirror focus. */
    positionOf(simId: string): { x: number; z: number } | undefined;
    /** True while the aircraft is alive and in the world. */
    isLive(simId: string): boolean;
}

const FACTION_OF: Record<MissionFaction, Faction> = {
    enemy: Faction.ENEMY,
    player: Faction.PLAYER,
};

/**
 * How many mission aircraft the terrain mirror follows, on top of the player.
 *
 * `HeightFieldSender.update()` ends by calling `ensureLoadedAroundWorld` for
 * every focus point, and that is a maximum-priority fetch into the same 64 MB
 * height store the renderer shares. Thirteen scattered focus points at the
 * 12 km mirror radius would ask for on the order of two hundred fine tiles
 * every quarter second — enough to evict the terrain under the player to load
 * terrain under an aircraft nobody is looking at. So the mirror follows the
 * nearest few and the rest fly on the coarse tier, which the pilot now knows
 * not to trust for its look-ahead.
 */
export const MISSION_MIRROR_FOCUS_COUNT = 3;

export class MissionRunner {

    /** Sim ids this runner enabled, in the order it created them. */
    private readonly active: string[] = [];
    private playerX = 0;
    private playerZ = 0;

    constructor(
        private readonly sim: MissionSimClient,
        private readonly pool: MissionAircraftPool,
    ) { }

    get activeIds(): readonly string[] {
        return this.active;
    }

    /**
     * Spawn and task every aircraft of `mission`, and disable the rest of the
     * pool.
     *
     * The per-aircraft order is the one `spawnOpponent` already uses, with the
     * route added, and it is load-bearing rather than stylistic:
     * `setPilotOptions` forces a pilot rebuild, so anything pushed before it
     * that lives on the pilot is thrown away. The route survives a rebuild by
     * being stored on the aircraft, but the phase is only restored, not the
     * targeting — so options first, then respawn, then route, then targeting,
     * then the phase that starts it all moving.
     */
    start(mission: ResolvedMission, allPoolIds: readonly string[]): void {
        this.stop();
        if (!mission.ok) {
            return;
        }

        for (const a of mission.aircraft) {
            const options: AiPilotOptions = {
                cruiseAltitude: a.pilot.cruiseAltitude,
                cruiseSpeed: a.pilot.cruiseSpeed,
            };
            if (a.pilot.hardDeck !== undefined) options.hardDeck = a.pilot.hardDeck;
            if (a.pilot.skill !== undefined) options.skill = a.pilot.skill;
            if (a.pilot.model !== undefined) options.model = a.pilot.model;

            this.sim.setPilotOptions(a.simId, options);
            this.pool.respawn(a.simId, a);
            this.active.push(a.simId);

            if (a.lead) {
                this.sim.setRoute(a.simId, a.route ?? null);
            } else {
                // Wingmen fly the lead's wing rather than a copy of the route:
                // the wing-slot law in doFormation already solves intra-flight
                // geometry, and giving every member the same fixes and capture
                // radii walks the whole flight onto one point.
                this.sim.setRoute(a.simId, null);
                this.sim.setFormationLead(a.simId, a.leadSimId ?? null);
            }

            if (a.engages !== undefined) {
                this.sim.setTargetFaction(a.simId, FACTION_OF[a.engages]);
            }

            this.sim.setPhase(a.simId, this.entryPhase(a));
        }

        for (const id of allPoolIds) {
            if (!this.active.includes(id)) {
                this.pool.disable(id);
                this.sim.setEnabled(id, false);
            }
        }
    }

    /**
     * Where a member starts from.
     *
     * A parked aircraft has to be sent through the takeoff roll, because
     * GROUND_IDLE has no self-transition and `startTakeoff()` is not on the
     * controller interface the sim talks to. It joins its route by itself out
     * of `doClimbOut`, so nothing has to watch for the climb to finish.
     */
    private entryPhase(a: ResolvedAircraft): AiFlightPhase {
        if (a.onGround) {
            return AiFlightPhase.TAKEOFF_ROLL;
        }
        if (!a.lead) {
            return AiFlightPhase.FORMATION;
        }
        return a.route !== undefined ? AiFlightPhase.WAYPOINT : AiFlightPhase.NAVIGATE;
    }

    /** Tell the runner where the player is, for {@link mirrorFocus}. */
    setPlayerPosition(x: number, z: number): void {
        this.playerX = x;
        this.playerZ = z;
    }

    /**
     * The mission aircraft the terrain mirror should follow: the nearest
     * {@link MISSION_MIRROR_FOCUS_COUNT} live ones to the player.
     *
     * Nearest rather than all, because each focus point is a top-priority tile
     * fetch competing with the renderer for the same budget — and nearest to
     * the *player* because the ones fighting them are the ones whose terrain
     * has to be right.
     */
    mirrorFocus(): Array<{ x: number; z: number }> {
        const live: Array<{ x: number; z: number; d: number }> = [];
        for (const id of this.active) {
            if (!this.pool.isLive(id)) {
                continue;
            }
            const p = this.pool.positionOf(id);
            if (p === undefined) {
                continue;
            }
            live.push({
                x: p.x,
                z: p.z,
                d: Math.hypot(p.x - this.playerX, p.z - this.playerZ),
            });
        }
        live.sort((a, b) => a.d - b.d);
        return live.slice(0, MISSION_MIRROR_FOCUS_COUNT).map(p => ({ x: p.x, z: p.z }));
    }

    /**
     * End the mission: everything it spawned goes away.
     *
     * Clearing the route as well as disabling matters because sim rows are
     * never reclaimed — `removeAircraft` is never called — so a pooled aircraft
     * that is re-enabled later would otherwise wake up still flying the last
     * mission's route.
     */
    stop(): void {
        for (const id of this.active) {
            this.sim.setRoute(id, null);
            this.sim.setFormationLead(id, null);
            this.sim.setTargetFaction(id, null);
            this.pool.disable(id);
            this.sim.setEnabled(id, false);
        }
        this.active.length = 0;
    }
}
