import * as THREE from 'three';

/**
 * High-level Aggressive ("Berserker") posture. Unlike Shaw's
 * Offensive/Neutral/Defensive matrix there is no defensive posture: a
 * tracking threat is answered with {@link AggressiveManeuverType} `SCISSORS_COUNTER`
 * (turn into the threat), never a break-away or disengage.
 */
export type AggressiveState = 'ATTACK' | 'MERGE' | 'COUNTER';

export type AggressiveManeuverType =
    // Attack (bandit roughly in front, in range)
    | 'LEAD_PURSUIT'
    | 'HIGH_YO_YO'
    // Merge (neutral / head-on)
    | 'HEAD_ON_PRESS'
    | 'POST_MERGE_REVERSAL'
    // Counter (bandit tracking us from the rear — never a break/extend)
    | 'SCISSORS_COUNTER';

/**
 * High-level setpoints from {@link AggressiveTacticalFSM}. Shares its field
 * shape with Shaw's `FlightCommand` (see `../shaw/shawTypes.ts`) so it can be
 * consumed by the same reused `FlightControlComputer`, but keeps its own
 * `stateName`/`maneuverName` unions since the Aggressive doctrine's states
 * and maneuvers are distinct from Shaw's.
 */
export interface AggressiveFlightCommand {
    stateName: AggressiveState;
    maneuverName: AggressiveManeuverType;
    /** World-space aim direction the nose should track. */
    targetDirection: THREE.Vector3;
    /** Desired airspeed (m/s). */
    targetSpeed: number;
    /** Preferred load factor hint (g); FCC soft-limits against airframe. */
    targetGForce: number;
    /** When true, cut throttle hard (stand-in for speedbrakes). Aggressive never sets this. */
    useAirbrakes: boolean;
    fireGuns: boolean;
    /** Allow the hard-turn pull when angular error is large. */
    allowHardTurn: boolean;
}
