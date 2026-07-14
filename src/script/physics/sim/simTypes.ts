import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import { AiPilotOptions } from '../../ai/aiPilot';
import { ForceVectorSample } from '../model/flightModel';
import { SerializedWorld } from './serializedWorld';

/**
 * Serializable protocol for the unified combat sim worker. One worker owns the
 * authoritative simulation of every aircraft (the player and all AI opponents),
 * their pilots, the projectile pool and hit detection. The main thread posts
 * control inputs + discrete events in, and receives one {@link SimSnapshot} out
 * per physics pump, which the render-side proxies mirror.
 */

export type SimControlMode = 'external' | 'ai';

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

/** The normalized command channel for one externally-controlled aircraft. */
export interface SimControlInputs {
    pitch: number;
    roll: number;
    yaw: number;
    throttle: number;
    landingGearDeployed: boolean;
    flapsExtended: boolean;
    wheelBrakesApplied: boolean;
    pitchLimiterMode: number;
    limitersEnabled: boolean;
    wantForceVectors: boolean;
    /** Trigger held this frame (only meaningful for aircraft with a gun). */
    firing: boolean;
}

export interface SimGunConfig {
    muzzleVelocity: number;
    roundsPerSecond: number;
    damage: number;
    ammo: number;
    muzzleOffset: Vec3;
    spread?: number;
}

export interface SimAircraftSpawn {
    position: Vec3;
    quaternion: Quat;
    velocity?: Vec3;
    landed: boolean;
    throttle: number;
    airborne: boolean;
}

export interface SimAircraftDesc {
    id: string;
    /** Faction (see weapons/combatant.Faction). */
    faction: number;
    control: SimControlMode;
    kinematic: boolean;
    aircraftConfig?: Fm2AircraftConfig;
    /** Present when this aircraft can be flown by an in-worker AI pilot. */
    pilotOptions?: AiPilotOptions;
    hitRadius: number;
    maxHealth: number;
    gun?: SimGunConfig;
    spawn: SimAircraftSpawn;
    enabled: boolean;
}

/** Authoritative per-aircraft state mirrored by the render-side proxy. */
export interface SimAircraftState {
    id: string;
    position: Vec3;
    quaternion: Quat;
    velocity: Vec3;
    prevPosition: Vec3;
    prevQuaternion: Quat;
    prevVelocity: Vec3;
    deltaRemainder: number;
    crashed: boolean;
    landed: boolean;
    angleOfAttackRad: number;
    loadFactorG: number;
    commandedElevator: number;
    commandedAileron: number;
    commandedRudder: number;
    accelWorld: Vec3;
    engineThrustN: number;
    effectiveThrottle: number;
    stall: number;
    forceVectors: ForceVectorSample[];
    gearDeployed: boolean;
    flapsExtended: boolean;
    firing: boolean;
    health: number;
    ammo: number;
}

/** A live projectile, rendered as a tracer on the main thread. */
export interface SimProjectileState {
    position: Vec3;
    quaternion: Quat;
}

/** A confirmed hit this frame, for SFX / feedback on the main thread. */
export interface SimHitEvent {
    position: Vec3;
    targetId: string;
    damage: number;
}

export interface SimSnapshot {
    aircraft: SimAircraftState[];
    projectiles: SimProjectileState[];
    hits: SimHitEvent[];
}

// --- Main thread -> worker messages ------------------------------------------

export type SimToWorkerMessage =
    | { type: 'init' }
    | { type: 'setWorld'; world: SerializedWorld }
    | { type: 'addAircraft'; desc: SimAircraftDesc }
    | { type: 'removeAircraft'; id: string }
    | { type: 'setEnabled'; id: string; enabled: boolean }
    | { type: 'setControlMode'; id: string; control: SimControlMode }
    | { type: 'setTarget'; id: string; targetId: string | null }
    | { type: 'setPhase'; id: string; phase: number }
    | { type: 'respawn'; id: string; spawn: SimAircraftSpawn }
    | { type: 'reset'; id: string; position: Vec3; quaternion: Quat; velocity: Vec3; landed: boolean; throttle: number; kinematic: boolean }
    | { type: 'setAircraftConfig'; id: string; aircraftConfig: Fm2AircraftConfig; kinematic: boolean }
    | { type: 'setPosition'; id: string; position: Vec3 }
    | { type: 'setQuaternion'; id: string; quaternion: Quat }
    | { type: 'setVelocity'; id: string; velocity: Vec3 }
    | { type: 'syncEffectiveThrottle'; id: string; throttle: number }
    | { type: 'snapPhysicsState'; id: string }
    | { type: 'setExternalState'; id: string; enabled: boolean; faction: number; position: Vec3; velocity: Vec3; alive: boolean }
    | { type: 'clearExternalState'; id: string }
    | { type: 'step'; delta: number; inputs: Record<string, SimControlInputs> };

// --- Worker -> main thread messages ------------------------------------------

export type WorkerToSimMessage =
    | ({ type: 'state' } & import('./simSnapshotCodec').SnapshotBuffers)
    | { type: 'error'; message: string; stack?: string };
