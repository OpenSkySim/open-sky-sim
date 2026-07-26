import type { Combatant } from '../weapons/combatant';
import type { AiFlightPhase, AiPilotOptions } from './aiPilot';
import type { PilotableAircraft } from './aircraftControls';
import type { WorldQuery } from './worldQuery';

/**
 * Shared surface for every in-worker AI pilot model (classic BFM and Shaw).
 * CombatSim only talks to this contract — never to a concrete class.
 */
export interface AiPilotController {
    update(delta: number): void;
    setPhase(phase: AiFlightPhase): void;
    setTarget(target: Combatant | undefined): void;
    getPhase(): AiFlightPhase;
    get isFiring(): boolean;
    /** Short maneuver / phase label for MFD telemetry and tests. */
    getManeuverLabel(): string;
}

export type AiPilotFactory = (
    aircraft: PilotableAircraft,
    world: WorldQuery,
    options: AiPilotOptions,
) => AiPilotController;
