import * as THREE from 'three';
import { Fm2FlightModel } from '../model/fm2FlightModel';
import { AiFlightPhase, AiPilotOptions } from '../../ai/aiPilot';
import { AiPilotController } from '../../ai/aiPilotController';
import { createAiPilot } from '../../ai/createAiPilot';
import { PilotableAircraft } from '../../ai/aircraftControls';
import { SceneWorldQuery } from '../../ai/worldQuery';
import { Combatant, Faction } from '../../weapons/combatant';
import { Gun, GunConfig, ProjectileSink } from '../../weapons/gun';
import { clamp, FORWARD } from '../../utils/math';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';
import { KeyboardControlLayoutId } from '../../input/keyboardLayouts';
import { FcsPitchLimiter } from '../fm2/fcs';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import { ForceVectorSample } from '../model/flightModel';
import {
    deserializeWorldQuery,
    deserializeArrestorCables,
    deserializeBarricades,
    SerializedArrestorCables,
    SerializedBarricade,
    SerializedWorld,
} from './serializedWorld';
import {
    HeightTileUpdate, MirroredHeightField, SerializedHeightField,
} from '../../terrain/heightMirror';
import {
    applyArrestorVelocity,
    ArrestorCableField,
    ARRESTOR_PULL_OUT_M,
    ARRESTOR_RELEASE_SPEED_MPS,
    DEFAULT_ARRESTOR_HOOK_BODY,
    hookWorldPos,
    trySnag,
} from '../../scene/entities/arrestorCables';
import {
    BarricadeField,
    BARRICADE_DEFAULT_WING_HALF_SPAN_M,
    BARRICADE_PULL_OUT_M,
    BARRICADE_RELEASE_SPEED_MPS,
    tryBarricadeEngage,
} from '../../scene/entities/barricade';
import {
    BarricadeSolver,
    barricadeFallbackHull,
    barricadeHullIsUsable,
    barricadeSolverSpecForRig,
} from '../../scene/entities/barricadeSolver';
import { triangleBvhFor } from '../collision/triangleBvh';

/**
 * How often a barricade with nothing in it is advanced (s).
 *
 * A rigged net just hangs — gravity and the wind over the deck are both steady,
 * and it settles to a standstill and stays there. Solving it at the full rate is
 * a millisecond a frame spent watching it not move.
 */
const BARRICADE_IDLE_STEP_S = 1 / 20;

import { AC, AC_STRIDE, BARRICADE_STRIDE, PROJ_STRIDE, SnapshotBuffers } from './simSnapshotCodec';
import {
    AircraftCollisionMesh,
    findCollisionMeshTerrainContact,
    segmentHitsCollisionMesh,
    segmentHitsSphere,
    SolidWorldContact,
} from './aircraftCollision';
import {
    SimAircraftDesc, SimAircraftSpawn, SimControlInputs,
    SimControlMode, SimHitEvent,
} from './simTypes';
import { fm2UsesAfterburner, SimPlayerInput, SimPlayerInputSink } from './simPlayerInput';

/** Seconds a tracer lives before self-destructing (mirrors WeaponsField). */
const PROJECTILE_LIFESPAN = 2.5;
/** Max ship-relative groundspeed (m/s) before kinematic deck park engages. */
const CARRIER_PARK_REL_SPEED_MPS = 2.0;
const PROJECTILE_GRAVITY = 9.80665;
const PROJECTILE_POOL_SIZE = 480;
/** Allow this much mesh–terrain overlap (m) when gear is down (spring travel). */
const GEAR_TERRAIN_MARGIN_M = 0.8;
/** Belly/wingtip scrape margin when gear is up (m). */
const BELLY_TERRAIN_MARGIN_M = 0.05;
/** Impact speed into a solid that still destroys the airframe (m/s). */
const SOLID_CRASH_IMPACT_MPS = 55;
/** Penetration past the margin that forces a wreck (m). */
const SOLID_CRASH_PENETRATION_M = 3.5;

// --- Faction target selection --------------------------------------------------
/** Seconds between full re-scans for aircraft engaging a whole faction. */
const TARGET_SCAN_INTERVAL = 0.5;
/**
 * A challenger must beat the incumbent's score by this factor to steal the
 * fight. Without the margin, two enemies at similar range make the AI swap back
 * and forth every scan instead of committing to one of them.
 */
const TARGET_SWITCH_MARGIN = 0.75;
/**
 * How hard a target off the nose is penalised, as a fraction of its range at
 * 180 degrees off. Picking purely by range would have the AI turn its back on
 * the aircraft it is already pointing at for one barely closer behind it.
 */
const TARGET_ATA_WEIGHT = 1.0;
/** Minimum inward speed (m/s) before scrape FX / damage. */
const SOLID_SCRAPE_FX_MPS = 6;
/** Health lost per (m/s) of inward impact on a non-fatal scrape. */
const SOLID_SCRAPE_DAMAGE_PER_MPS = 0.35;
/** Min seconds between scrape FX bursts per aircraft. */
const SOLID_SCRAPE_FX_COOLDOWN_S = 0.1;
/** Extra separation after resolving penetration (m). */
const SOLID_SLOP_M = 0.05;
/**
 * Contact-point drag rate (1/s) while the collider scrapes a solid.
 * Mild on purpose — only bleeds speed at the hit part (with torque), no bounce.
 */
const SOLID_CONTACT_DRAG_PER_S = 0.45;
/** Fraction of aircraft mass used when converting contact drag to an impulse. */
const SOLID_CONTACT_DRAG_MASS_FRAC = 0.12;
/** Cap on per-step contact-velocity bleed (keeps scrapes from slamming the brakes). */
const SOLID_CONTACT_DRAG_MAX_FRAC = 0.01;

const NEUTRAL_INPUTS: SimControlInputs = {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    landingGearDeployed: true, flapsExtended: true, airbrakesExtended: false,
    hookDeployed: false, wheelBrakesApplied: false,
    pitchLimiterMode: FcsPitchLimiter.SOFT, limitersEnabled: true,
    wantForceVectors: false, firing: false,
};

interface ProjectileSlot {
    active: boolean;
    faction: Faction;
    damage: number;
    life: number;
    readonly pos: THREE.Vector3;
    readonly prevPos: THREE.Vector3;
    readonly vel: THREE.Vector3;
}

/**
 * One simulated aircraft: an {@link Fm2FlightModel} plus its command buffer, an
 * optional in-worker {@link AiPilotController} and gun. Implements {@link PilotableAircraft}
 * (so a pilot can fly it) and {@link Combatant} (so it can be targeted/hit).
 */
class SimAircraft implements PilotableAircraft, Combatant, SimPlayerInputSink {

    readonly id: string;
    readonly faction: Faction;
    control: SimControlMode;
    enabled: boolean;
    kinematic: boolean;

    model: Fm2FlightModel;
    pilot: AiPilotController | undefined;
    gun: Gun | undefined;

    health: number;
    maxHealth: number;
    readonly hitRadius: number;
    collision: AircraftCollisionMesh | undefined;
    private afterburner = false;

    /** Firing decision resolved this frame (pilot solution or external trigger). */
    firing = false;

    /**
     * When set, this aircraft engages *any* live combatant of this faction and
     * the sim re-picks the best one as the fight develops (see
     * {@link CombatSim.selectTargetFor}). Mutually exclusive with an explicit
     * {@link CombatSim.setTarget}, which clears it.
     */
    targetFaction: Faction | undefined;
    /** Id of the auto-selected target, so a re-scan can score the incumbent. */
    autoTargetId: string | undefined;

    /** Seconds since last solid-world scrape FX (smoke/sparks). */
    scrapeFxCooldown = 0;

    /** Latched arrestor cable index within the active field, or -1. */
    arrestorLatch = -1;
    /** Which arrestor field is latched (carrier index), or -1. */
    arrestorFieldIndex = -1;
    /** Deck-axis projection of the hook at snag time (for pull-out distance). */
    arrestorSnagAlong = 0;
    /** True after pull-out finished; cable stays bent until the plane taxis away. */
    arrestorHeld = false;
    /** Drawn airframe the barricade's webbing drapes over, when one is known. */
    barricadeDrape: AircraftCollisionMesh | undefined;
    /** True while the wings are wrapped in a carrier barricade's webbing. */
    barricadeEngaged = false;
    /** Which barricade is engaged (carrier index), or -1. */
    barricadeFieldIndex = -1;
    /** Deck-axis projection of the CG at webbing contact (for pull-out distance). */
    barricadeSnagAlong = 0;
    /** True after the barricade pull-out finished. */
    barricadeHeld = false;
    /** Wing half-span used for the barricade's lateral catch window (m). */
    wingHalfSpanM = BARRICADE_DEFAULT_WING_HALF_SPAN_M;
    /** Sticky: stay on-deck until gear up / leave carrier height / not landed. */
    carrierDeckSticky = false;
    /** Ship-local XZ park offset valid while kinematically locked to the deck. */
    carrierParkLocalValid = false;
    carrierParkLocalX = 0;
    carrierParkLocalZ = 0;
    readonly hookBody = new THREE.Vector3();
    readonly prevHook = new THREE.Vector3();
    hasPrevHook = false;
    readonly hookNow = new THREE.Vector3();
    /** Previous-step CG, for the barricade's plane-crossing test. */
    readonly prevPos = new THREE.Vector3();
    hasPrevPos = false;

    // Normalized command buffer, written by the pilot (ai) or the client (external).
    private inPitch = 0;
    private inRoll = 0;
    private inYaw = 0;
    private inThrottle = 0;
    private inGear = true;
    private inFlaps = true;
    private inAirbrakes = false;
    /** Tailhook lowered (player 'H'); AI pilots auto-hook with the gear. */
    private inHook = false;
    private inBrakes = false;
    private inLimiterMode = FcsPitchLimiter.SOFT;
    private inLimiters = true;
    private inForceVectors = false;
    private externalFiring = false;

    private readonly tmp = new THREE.Vector3();

    constructor(desc: SimAircraftDesc, world: SceneWorldQuery | undefined, sink: ProjectileSink) {
        this.id = desc.id;
        this.faction = desc.faction as Faction;
        this.control = desc.control;
        this.enabled = desc.enabled;
        this.kinematic = desc.kinematic;
        this.hitRadius = desc.hitRadius;
        this.collision = desc.collision;
        // Barricade catches wings, so its lateral window follows the airframe.
        if (desc.collision) {
            const { min, max } = desc.collision.aabb;
            this.wingHalfSpanM = Math.max(Math.abs(min[0]), Math.abs(max[0]));
        }
        this.maxHealth = desc.maxHealth;
        this.health = desc.maxHealth;
        this.afterburner = fm2UsesAfterburner(desc.aircraftConfig);
        const hook = desc.aircraftConfig?.hook ?? DEFAULT_ARRESTOR_HOOK_BODY;
        this.hookBody.set(hook[0], hook[1], hook[2]);
        this.model = new Fm2FlightModel(desc.aircraftConfig, { kinematic: desc.kinematic });
        this.bindWorld(world);
        if (desc.gun) {
            const cfg: GunConfig = {
                muzzleVelocity: desc.gun.muzzleVelocity,
                roundsPerSecond: desc.gun.roundsPerSecond,
                damage: desc.gun.damage,
                ammo: desc.gun.ammo,
                muzzleOffset: new THREE.Vector3().fromArray(desc.gun.muzzleOffset),
                spread: desc.gun.spread,
            };
            this.gun = new Gun(cfg, sink, this.faction);
        }
        this.buildPilot(desc.pilotOptions, world);
        this.applySpawn(desc.spawn);
    }

    /** Push terrain/obstacle query into the flight model. */
    bindWorld(world: SceneWorldQuery | undefined): void {
        this.model.setWorldQuery(world);
    }

    private pilotOptions: AiPilotOptions | undefined;

    buildPilot(options: AiPilotOptions | undefined, world: SceneWorldQuery | undefined, forceRebuild = false): void {
        this.pilotOptions = options ?? this.pilotOptions;
        if (!this.pilotOptions || !world) {
            return;
        }
        if (this.pilot && !forceRebuild) {
            return;
        }
        const prevPhase = this.pilot?.getPhase();
        this.pilot = createAiPilot(this, world, this.pilotOptions);
        if (prevPhase !== undefined) {
            this.pilot.setPhase(prevPhase);
        }
    }

    /** Replace pilot options and rebuild the controller (e.g. AI model switch on spawn). */
    setPilotOptions(options: AiPilotOptions, world: SceneWorldQuery | undefined): void {
        this.buildPilot(options, world, true);
    }

    applySpawn(spawn: SimAircraftSpawn): void {
        this.arrestorLatch = -1;
        this.arrestorFieldIndex = -1;
        this.arrestorSnagAlong = 0;
        this.arrestorHeld = false;
        this.barricadeEngaged = false;
        this.barricadeFieldIndex = -1;
        this.barricadeSnagAlong = 0;
        this.barricadeHeld = false;
        this.carrierDeckSticky = false;
        this.carrierParkLocalValid = false;
        this.hasPrevHook = false;
        this.hasPrevPos = false;
        this.model.position = this.tmp.fromArray(spawn.position);
        this.model.quaternion = new THREE.Quaternion().fromArray(spawn.quaternion);
        if (spawn.velocity) {
            this.model.velocityVector = this.tmp.fromArray(spawn.velocity);
        }
        this.inThrottle = spawn.throttle;
        this.model.setThrottle(spawn.throttle);
        this.model.setLanded(spawn.landed);
        this.inGear = !spawn.airborne;
        this.inFlaps = !spawn.airborne;
        this.inAirbrakes = false;
        this.inHook = false;
        if (spawn.airborne) {
            this.model.syncEffectiveThrottle();
            this.model.snapPhysicsState();
        }
    }

    respawn(spawn: SimAircraftSpawn): void {
        this.model.reset();
        this.health = this.maxHealth;
        this.inPitch = this.inRoll = this.inYaw = 0;
        this.inBrakes = false;
        this.inAirbrakes = false;
        this.inHook = false;
        this.gun?.reset();
        this.applySpawn(spawn);
        this.enabled = true;
    }

    resetGun(): void {
        this.gun?.reset();
    }

    setExternalInputs(inputs: SimControlInputs): void {
        this.inPitch = inputs.pitch;
        this.inRoll = inputs.roll;
        this.inYaw = inputs.yaw;
        this.inThrottle = inputs.throttle;
        this.inGear = inputs.landingGearDeployed;
        this.inFlaps = inputs.flapsExtended;
        this.inAirbrakes = inputs.airbrakesExtended;
        this.inHook = inputs.hookDeployed;
        this.inBrakes = inputs.wheelBrakesApplied;
        this.inLimiterMode = inputs.pitchLimiterMode;
        this.inLimiters = inputs.limitersEnabled;
        this.inForceVectors = inputs.wantForceVectors;
        this.externalFiring = inputs.firing;
    }

    applyInputsToModel(): void {
        // Dead airframes: no thrust, no stick — wreck coasts ballistically.
        if (this.health <= 0) {
            this.inThrottle = 0;
            this.inPitch = 0;
            this.inRoll = 0;
            this.inYaw = 0;
        }
        this.model.setPitch(this.inPitch);
        this.model.setRoll(this.inRoll);
        this.model.setYaw(this.inYaw);
        this.model.setThrottle(this.inThrottle);
        if (this.health <= 0) {
            this.model.syncEffectiveThrottle();
        }
        this.model.setLandingGearDeployed(this.inGear);
        this.model.setFlapsExtended(this.inFlaps);
        this.model.setAirbrakesExtended(this.inAirbrakes);
        this.model.setWheelBrakes(this.inBrakes);
        this.model.setPitchLimiterMode(this.inLimiterMode);
        this.model.setLimitersEnabled(this.inLimiters);
        this.model.setForceVectorsRequested(this.inForceVectors);
    }

    resolveFiring(): void {
        if (this.model.isCrashed()) {
            this.firing = false;
            return;
        }
        this.firing = this.control === 'ai'
            ? (this.pilot?.isFiring ?? false)
            : this.externalFiring;
    }

    // --- PilotableAircraft: control channel (pilot writes the buffer) ---------

    setPitch(pitch: number): void { this.inPitch = pitch; }
    setRoll(roll: number): void { this.inRoll = roll; }
    setYaw(yaw: number): void { this.inYaw = yaw; }
    setThrottle(throttle: number): void { this.inThrottle = throttle; }
    setWheelBrakes(applied: boolean): void { this.inBrakes = applied; }
    setLandingGearDeployed(deployed: boolean): void { this.inGear = deployed; }
    setFlapsExtended(extended: boolean): void { this.inFlaps = extended; }
    setAirbrakesExtended(extended: boolean): void { this.inAirbrakes = extended; }

    // --- SimPlayerInputSink (worker keyboard / gamepad) ------------------------

    isOnGround(): boolean {
        return this.model.position.y <= PLANE_DISTANCE_TO_GROUND + 0.05;
    }

    getThrottle(): number {
        return this.inThrottle;
    }

    getAfterburner(): boolean {
        return this.afterburner;
    }

    toggleGear(): void {
        this.inGear = !this.inGear;
    }

    toggleFlaps(): void {
        this.inFlaps = !this.inFlaps;
    }

    toggleAirbrakes(): void {
        this.inAirbrakes = !this.inAirbrakes;
    }

    toggleHook(): void {
        this.inHook = !this.inHook;
    }

    setHookDeployed(deployed: boolean): void {
        this.inHook = deployed;
    }

    toggleAutopilot(): void {
        this.control = this.control === 'ai' ? 'external' : 'ai';
    }

    setPitchLimiterMode(mode: FcsPitchLimiter): void {
        this.inLimiterMode = mode;
    }

    setAfterburnerFromConfig(config: Fm2AircraftConfig): void {
        this.afterburner = fm2UsesAfterburner(config);
    }

    // --- PilotableAircraft: observation --------------------------------------

    getPosition(): THREE.Vector3 { return this.model.position; }
    getVelocity(): THREE.Vector3 { return this.model.velocityVector; }
    getQuaternion(): THREE.Quaternion { return this.model.quaternion; }
    getAirspeed(): number { return this.model.velocityVector.length(); }
    getAltitude(): number { return this.model.position.y; }
    getAngleOfAttack(): number { return this.model.getAngleOfAttack(); }
    getLoadFactorG(): number { return this.model.getLoadFactorG(); }
    getStallStatus(): number { return this.model.getStallStatus(); }
    isLanded(): boolean { return this.model.isLanded(); }
    isCrashed(): boolean { return this.model.isCrashed(); }
    isGearDeployed(): boolean { return this.inGear; }
    isFlapsExtended(): boolean { return this.inFlaps; }
    isAirbrakesExtended(): boolean { return this.inAirbrakes; }
    /** AI pilots have no hook control of their own: theirs follows the gear. */
    isHookDeployed(): boolean { return this.control === 'ai' ? this.inGear : this.inHook; }

    // --- Combatant -----------------------------------------------------------

    readPosition(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.model.position); }
    readVelocity(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.model.velocityVector); }
    getHitRadius(): number { return this.hitRadius; }
    isAlive(): boolean { return this.enabled && this.health > 0 && !this.model.isCrashed(); }

    applyDamage(amount: number): void {
        if (this.health <= 0) {
            return;
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            // Gun kill: flameout only — keep integrating so the wreck coasts
            // instead of freezing mid-air (setCrashed is for ground impacts).
            this.inThrottle = 0;
            this.model.setThrottle(0);
            this.model.syncEffectiveThrottle();
        }
    }

    forceVectors(): ForceVectorSample[] {
        return this.model.getForceVectorSnapshot();
    }

    /** Pack this aircraft's numeric state into the flat snapshot row at `base`. */
    writeInto(out: Float32Array, base: number, input: SimPlayerInput | undefined): void {
        const m = this.model as unknown as {
            prevPosition: THREE.Vector3; prevQuaternion: THREE.Quaternion; prevVelocity: THREE.Vector3;
            deltaRemainder: number;
        };
        const pos = this.model.position;
        const quat = this.model.quaternion;
        const vel = this.model.velocityVector;
        const acc = this.model.getAccelerationWorld();
        out[base + AC.posX] = pos.x; out[base + AC.posY] = pos.y; out[base + AC.posZ] = pos.z;
        out[base + AC.qx] = quat.x; out[base + AC.qy] = quat.y; out[base + AC.qz] = quat.z; out[base + AC.qw] = quat.w;
        out[base + AC.velX] = vel.x; out[base + AC.velY] = vel.y; out[base + AC.velZ] = vel.z;
        out[base + AC.ppX] = m.prevPosition.x; out[base + AC.ppY] = m.prevPosition.y; out[base + AC.ppZ] = m.prevPosition.z;
        out[base + AC.pqx] = m.prevQuaternion.x; out[base + AC.pqy] = m.prevQuaternion.y; out[base + AC.pqz] = m.prevQuaternion.z; out[base + AC.pqw] = m.prevQuaternion.w;
        out[base + AC.pvX] = m.prevVelocity.x; out[base + AC.pvY] = m.prevVelocity.y; out[base + AC.pvZ] = m.prevVelocity.z;
        out[base + AC.deltaRemainder] = m.deltaRemainder;
        out[base + AC.crashed] = this.model.isCrashed() ? 1 : 0;
        out[base + AC.landed] = this.model.isLanded() ? 1 : 0;
        out[base + AC.aoa] = this.model.getAngleOfAttack();
        out[base + AC.loadG] = this.model.getLoadFactorG();
        out[base + AC.cmdElevator] = this.model.getCommandedElevator();
        out[base + AC.cmdAileron] = this.model.getCommandedAileron();
        out[base + AC.cmdRudder] = this.model.getCommandedRudder();
        out[base + AC.accX] = acc.x; out[base + AC.accY] = acc.y; out[base + AC.accZ] = acc.z;
        out[base + AC.engineThrustN] = this.model.getEngineThrustKn() * 1000;
        out[base + AC.effectiveThrottle] = this.model.getEffectiveThrottle();
        out[base + AC.stall] = this.model.getStallStatus();
        out[base + AC.gearDeployed] = this.inGear ? 1 : 0;
        out[base + AC.flapsExtended] = this.inFlaps ? 1 : 0;
        out[base + AC.airbrakesExtended] = this.inAirbrakes ? 1 : 0;
        out[base + AC.hookDeployed] = this.isHookDeployed() ? 1 : 0;
        out[base + AC.firing] = this.firing ? 1 : 0;
        out[base + AC.health] = this.health;
        out[base + AC.ammo] = this.gun?.ammoRemaining ?? 0;

        const mirror = {
            pitch: this.inPitch, roll: this.inRoll, yaw: this.inYaw, throttle: this.inThrottle,
            pitchStickUnits: 0, wheelBrakes: this.inBrakes,
            limitersEnabled: this.inLimiters, pitchLimiterMode: this.inLimiterMode,
            autopilot: this.control === 'ai',
        };
        input?.readMirror(mirror, this.control);
        out[base + AC.inPitch] = mirror.pitch;
        out[base + AC.inRoll] = mirror.roll;
        out[base + AC.inYaw] = mirror.yaw;
        out[base + AC.inThrottle] = mirror.throttle;
        out[base + AC.pitchStickUnits] = mirror.pitchStickUnits;
        out[base + AC.wheelBrakes] = mirror.wheelBrakes ? 1 : 0;
        out[base + AC.limitersEnabled] = mirror.limitersEnabled ? 1 : 0;
        out[base + AC.pitchLimiterMode] = mirror.pitchLimiterMode;
        out[base + AC.autopilot] = mirror.autopilot ? 1 : 0;
        out[base + AC.arrestorLatch] = this.arrestorLatch;
        out[base + AC.barricadeEngaged] = this.barricadeEngaged ? 1 : 0;
        out[base + AC.hookX] = this.hookNow.x;
        out[base + AC.hookY] = this.hookNow.y;
        out[base + AC.hookZ] = this.hookNow.z;
    }
}

/**
 * A combatant whose kinematic state is injected from the main thread (e.g. the
 * player while flying the separate JSBSim worker). AI pilots can target it, and
 * projectiles can hit it, without it being simulated here.
 */
class ExternalCombatant implements Combatant {
    faction: Faction = Faction.PLAYER;
    private readonly pos = new THREE.Vector3();
    private readonly vel = new THREE.Vector3();
    private alive = true;
    hitRadius = 10;

    setState(faction: Faction, position: THREE.Vector3, velocity: THREE.Vector3, alive: boolean): void {
        this.faction = faction;
        this.pos.copy(position);
        this.vel.copy(velocity);
        this.alive = alive;
    }

    readPosition(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.pos); }
    readVelocity(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.vel); }
    getHitRadius(): number { return this.hitRadius; }
    isAlive(): boolean { return this.alive; }
    applyDamage(_amount: number): void { /* damage is owned by the external model */ }
}

/**
 * The authoritative, headless combat simulation. Owns every aircraft, their
 * pilots, guns and the projectile pool. Steps at the aircraft models' fixed
 * internal timestep; pilots run once per pump reading the previous step's
 * positions so all aircraft advance from a consistent world state.
 */
export class CombatSim implements ProjectileSink {

    private world: SceneWorldQuery | undefined;
    private arrestorFields: ArrestorCableField[] = [];
    private barricades: BarricadeField[] = [];
    /** One rigged net per barricade, simulated here and drawn on the main thread. */
    private barricadeSolvers: BarricadeSolver[] = [];
    /**
     * Time owed to each idle rig.
     *
     * A net with nothing in it is quasi-static — it hangs, and the wind over
     * the deck is steady — so it is stepped at a coarser rate and the frames in
     * between are banked here. An engaged rig always runs at full rate.
     */
    private barricadeIdle: number[] = [];
    /** Which webbing assembly each solver is currently lacing. */
    private barricadeRigGeneration: number[] = [];
    /** World velocity of the moving carrier (m/s); trap scrub is relative to this. */
    private readonly carrierVel = new THREE.Vector3();
    private readonly aircraft = new Map<string, SimAircraft>();
    private readonly order: string[] = [];
    private readonly external = new Map<string, ExternalCombatant>();
    /** Worker-side keyboard/gamepad handlers for externally-controlled aircraft. */
    private readonly playerInputs = new Map<string, SimPlayerInput>();

    private readonly projectiles: ProjectileSlot[] = [];
    private readonly hits: SimHitEvent[] = [];

    // Scratch vectors for hit detection.
    private readonly seg = new THREE.Vector3();
    private readonly toCenter = new THREE.Vector3();
    private readonly closest = new THREE.Vector3();
    private readonly carrierOriginScratch = { x: 0, y: 0, z: 0 };
    private readonly cPos = new THREE.Vector3();
    private readonly cVel = new THREE.Vector3();
    private readonly bodyStart = new THREE.Vector3();
    private readonly bodyEnd = new THREE.Vector3();
    private readonly segEnd = new THREE.Vector3();
    private readonly cQuat = new THREE.Quaternion();
    private readonly contactPoint = new THREE.Vector3();
    private readonly contactNormal = new THREE.Vector3();

    // Scratch + timing for faction target selection.
    private targetScanTimer = 0;
    private readonly selfPos = new THREE.Vector3();
    private readonly selfFwd = new THREE.Vector3();
    private readonly losTmp = new THREE.Vector3();
    private readonly candidatePos = new THREE.Vector3();
    /** Reused candidate-id set — {@link selectTargetFor} runs inside the step loop. */
    private readonly candidateIds = new Set<string>();

    /** The DEM, mirrored tile by tile from the render thread. */
    private readonly heightField = new MirroredHeightField();

    /**
     * Scene Y -> true altitude, handed to every flight model this sim owns.
     *
     * Bound once and shared: it reads the mirrored DEM's frame live, so a model
     * created before the height field arrives simply gets scene Y back until it
     * does. See `MirroredHeightField.geodeticAltitudeAtWorld`.
     */
    private readonly altitudeAt = (x: number, y: number, z: number): number =>
        this.heightField.geodeticAltitudeAtWorld(x, y, z);

    constructor() {
        for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            this.projectiles.push({
                active: false, faction: Faction.PLAYER, damage: 0, life: 0,
                pos: new THREE.Vector3(), prevPos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
            });
        }
    }

    /** Sampler config for the mirrored DEM (basis, sea level, zooms, pads). */
    setHeightField(config: SerializedHeightField): void {
        this.heightField.configure(config);
    }

    /** Add/drop mirrored DEM tiles. */
    applyHeightTiles(update: HeightTileUpdate): void {
        this.heightField.applyTiles(update);
    }

    setWorld(world: SerializedWorld): void {
        this.world = deserializeWorldQuery(
            world, (x, z) => this.heightField.heightAtWorld(x, z),
        );
        this.arrestorFields = deserializeArrestorCables(world);
        this.barricades = deserializeBarricades(world);
        this.syncBarricadeSolvers();
        // Any aircraft added before the world arrived can now get its pilot + terrain.
        for (const a of this.aircraft.values()) {
            a.bindWorld(this.world);
            a.buildPilot(undefined, this.world);
        }
    }

    /** Update trap-cable world segments when the carrier moves. */
    setBarricades(barricades: SerializedBarricade[]): void {
        this.barricades = deserializeBarricades({ barricades } as SerializedWorld);
        this.syncBarricadeSolvers();
    }

    /**
     * Lace a net for each barricade, and only when there is a new net to lace.
     *
     * This arrives every frame the carrier moves, carrying a fresh deploy
     * fraction and pose, so it has to be cheap in the common case: re-rigging
     * unconditionally would throw away the webbing's state — and settle a new
     * assembly from scratch — sixty times a second. What actually calls for a
     * fresh rig is the *geometry* changing, which happens when the deck probe
     * refits the stanchions and essentially never after that.
     */
    private syncBarricadeSolvers(): void {
        while (this.barricadeSolvers.length > this.barricades.length) {
            this.barricadeSolvers.pop();
            this.barricadeIdle.pop();
            this.barricadeRigGeneration.pop();
        }
        for (let i = 0; i < this.barricades.length; i++) {
            const field = this.barricades[i];
            const rig = field.rig;
            const existing = this.barricadeSolvers[i];
            const sameRig = existing
                && existing.spec.leftX === rig.leftX
                && existing.spec.rightX === rig.rightX
                && existing.spec.deckY === rig.deckY;
            if (sameRig && this.barricadeRigGeneration[i] === field.rigGeneration) {
                continue;
            }
            if (sameRig) {
                // Same rig, fresh webbing: the stanchions have not moved, so
                // the net is re-laced on them rather than rebuilt from nothing.
                existing.reset(field.deploy);
            } else {
                this.barricadeSolvers[i] = new BarricadeSolver(
                    barricadeSolverSpecForRig(rig.leftX, rig.rightX, rig.deckY),
                );
                this.barricadeSolvers[i].reset(field.deploy);
            }
            this.barricadeRigGeneration[i] = field.rigGeneration;
            this.barricadeIdle[i] = 0;
        }
    }

    /**
     * Advance every rigged net.
     *
     * The webbing is driven by the aircraft in it, so the airframe is handed
     * over in carrier-local space — the frame the rig is laced in — and the
     * solver collides against its real hull. Nothing here feeds back into the
     * flight model yet; the arrestment is still the scripted pull-out in
     * {@link resolveBarricade}.
     */
    private stepBarricadeWebbing(delta: number): void {
        for (let i = 0; i < this.barricadeSolvers.length; i++) {
            const solver = this.barricadeSolvers[i];
            const field = this.barricades[i];
            solver.setDeploy(field.deploy);

            let engaged: SimAircraft | undefined;
            for (const a of this.aircraft.values()) {
                if (a.barricadeEngaged && a.barricadeFieldIndex === i) {
                    engaged = a;
                    break;
                }
            }

            if (engaged) {
                this.barricadeIdle[i] = 0;
                this.webQuat.copy(field.quaternion).invert();
                this.webPos
                    .set(field.originX, field.originY, field.originZ)
                    .subVectors(engaged.model.position, this.webPos)
                    .applyQuaternion(this.webQuat);
                this.webAirframe.copy(this.webQuat).multiply(engaged.model.quaternion);
                solver.setAirframe(
                    triangleBvhFor(this.barricadeHullFor(engaged)),
                    { position: this.webPos, quaternion: this.webAirframe },
                );
            } else {
                solver.setAirframe(null);
                // Nothing in it: bank the frame and step on the coarse cadence.
                this.barricadeIdle[i] += delta;
                if (this.barricadeIdle[i] < BARRICADE_IDLE_STEP_S) continue;
                solver.step(this.barricadeIdle[i]);
                this.barricadeIdle[i] = 0;
                continue;
            }
            solver.step(delta);
        }
    }

    /**
     * Hand the airframe the load its webbing is actually carrying.
     *
     * Only the part across the deck. The along-deck retardation stays with
     * {@link applyArrestorVelocity} and its tuned run-out, because that is the
     * arresting engine's job and it is the number the whole feel of a trap is
     * built on. What the engine cannot tell you is where the net has hold of
     * you: a wing caught off centre is dragged back toward the middle and the
     * nose comes round with it, and that is a real moment from real tension on
     * real geometry rather than anything anyone tuned.
     */
    private applyWebbingLoad(a: SimAircraft, field: BarricadeField, delta: number): void {
        const solver = this.barricadeSolvers[a.barricadeFieldIndex];
        if (!solver || delta <= 0) return;

        // Carrier-local out to world, since that is the frame the airframe flies in.
        solver.airframeForce(this.webForce).applyQuaternion(field.quaternion);
        solver.airframeTorque(this.webTorque).applyQuaternion(field.quaternion);

        // Everything along the deck belongs to the arresting engine, and that
        // includes the couple that comes with it — the net catches an airframe
        // well above its centre of gravity, so the retardation it applies is
        // also a large nose-down pitching moment. Feeding that back on top of a
        // run-out that already accounts for it would put the aircraft on its
        // nose. Take only what the engine has no way of expressing: the load
        // across the deck, and the yaw that goes with catching one wing first.
        this.webForce.addScaledVector(field.deckAxis, -this.webForce.dot(field.deckAxis));
        this.webUp.crossVectors(field.deckAxis, field.lateralAxis).normalize();
        this.webTorque.copy(this.webUp).multiplyScalar(this.webTorque.dot(this.webUp));

        a.model.applyExternalWrench(
            this.webForce.multiplyScalar(delta),
            this.webTorque.multiplyScalar(delta),
        );
    }

    private readonly webQuat = new THREE.Quaternion();
    private readonly webAirframe = new THREE.Quaternion();
    private readonly webPos = new THREE.Vector3();
    /**
     * The hull the webbing collides against.
     *
     * The drawn model if the main thread has handed one over, since that is the
     * shape the webbing is drawn lying on. Failing that the airframe's own
     * hitbox — and a few of those are broken imports, a cube around the cockpit
     * or absent altogether, so those fall through to a stand-in the size of the
     * aircraft. Cached: the substitute is built once per span.
     */
    private barricadeHullFor(a: SimAircraft): AircraftCollisionMesh {
        // The drawn model first: that is what the webbing has to be lying on.
        if (barricadeHullIsUsable(a.barricadeDrape, a.wingHalfSpanM)) {
            console.log(`[BARRICADE] Using barricadeDrape mesh for arrestment (span: ${a.wingHalfSpanM.toFixed(1)}m)`);
            return a.barricadeDrape;
        }
        if (barricadeHullIsUsable(a.collision, a.wingHalfSpanM)) {
            console.log(`[BARRICADE] Using aircraft collision mesh for arrestment (span: ${a.wingHalfSpanM.toFixed(1)}m)`);
            return a.collision;
        }
        let hull = this.barricadeFallbackHulls.get(a.wingHalfSpanM);
        if (!hull) {
            hull = barricadeFallbackHull(a.wingHalfSpanM);
            this.barricadeFallbackHulls.set(a.wingHalfSpanM, hull);
        }
        console.log(`[BARRICADE] Using fallback geometric hull for arrestment (span: ${a.wingHalfSpanM.toFixed(1)}m, tris: ${hull.triangles.length / 9})`);
        return hull;
    }

    private readonly barricadeFallbackHulls = new Map<number, AircraftCollisionMesh>();
    private readonly webForce = new THREE.Vector3();
    private readonly webTorque = new THREE.Vector3();
    private readonly webUp = new THREE.Vector3();

    setArrestorCables(cables: SerializedArrestorCables[]): void {
        this.arrestorFields = deserializeArrestorCables({ arrestorCables: cables } as SerializedWorld);
    }

    /** Update carrier mesh origins for ground contact when the ship moves. */
    setCarrierMeshOrigins(origins: { originX: number; originY: number; originZ: number }[]): void {
        this.world?.setCarrierMeshOrigins(origins);
    }

    /** World-frame carrier velocity for ship-relative arrestor scrub. */
    setCarrierVelocity(vx: number, vy: number, vz: number): void {
        this.carrierVel.set(vx, vy, vz);
    }

    addAircraft(desc: SimAircraftDesc): void {
        if (this.aircraft.has(desc.id)) {
            this.aircraft.delete(desc.id);
        } else {
            this.order.push(desc.id);
        }
        const added = new SimAircraft(desc, this.world, this);
        added.model.setAltitudeAt(this.altitudeAt);
        this.aircraft.set(desc.id, added);
        if (desc.control === 'external') {
            this.playerInputs.set(desc.id, new SimPlayerInput());
            this.playerInputs.get(desc.id)!.syncThrottle(desc.spawn.throttle);
        }
    }

    removeAircraft(id: string): void {
        this.aircraft.delete(id);
        this.playerInputs.delete(id);
        const i = this.order.indexOf(id);
        if (i >= 0) this.order.splice(i, 1);
    }

    setEnabled(id: string, enabled: boolean): void {
        const a = this.aircraft.get(id);
        if (a) a.enabled = enabled;
    }

    setControlMode(id: string, control: SimControlMode): void {
        const a = this.aircraft.get(id);
        if (a) {
            a.buildPilot(undefined, this.world);
            a.control = control;
        }
    }

    keyDown(id: string, key: string, repeat: boolean): void {
        const a = this.aircraft.get(id);
        const input = this.playerInputs.get(id);
        if (!a || !input) return;
        input.keyDown(key, repeat, a);
    }

    keyUp(id: string, key: string): void {
        const a = this.aircraft.get(id);
        const input = this.playerInputs.get(id);
        if (!a || !input) return;
        input.keyUp(key, a);
    }

    setKeyboardLayout(layoutId: KeyboardControlLayoutId): void {
        for (const input of this.playerInputs.values()) {
            input.setKeyboardLayout(layoutId);
        }
    }

    gamepadAxes(id: string, pitch: number, roll: number, yaw: number, throttle: number, connected: boolean): void {
        this.playerInputs.get(id)?.setGamepadAxes(pitch, roll, yaw, throttle, connected);
    }

    inputBlur(id: string): void {
        this.playerInputs.get(id)?.blur();
    }

    setInputEnabled(id: string, enabled: boolean): void {
        this.playerInputs.get(id)?.setInputEnabled(enabled);
    }

    setForceVectorsRequested(id: string, want: boolean): void {
        this.playerInputs.get(id)?.setForceVectorsRequested(want);
    }

    setTarget(id: string, targetId: string | null): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        // An explicit target wins over — and cancels — faction auto-selection.
        a.targetFaction = undefined;
        a.autoTargetId = undefined;
        a.pilot?.setTarget(targetId ? this.resolveCombatant(targetId) : undefined);
    }

    /**
     * Engage a whole faction rather than one named aircraft: the sim picks the
     * best live target of `faction` now and re-picks as the fight develops, so
     * an opponent fights every hostile in the air instead of tunnelling on the
     * one aircraft it was handed at spawn. Pass null to stop auto-selecting.
     */
    setTargetFaction(id: string, faction: Faction | null): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        a.autoTargetId = undefined;
        a.targetFaction = faction ?? undefined;
        if (faction === null) return;
        this.selectTargetFor(a, true);
    }

    /** Assign the aircraft whose wing this pilot flies in the FORMATION phase. */
    setFormationLead(id: string, leadId: string | null): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        a.pilot?.setFormationLead(leadId ? this.resolveCombatant(leadId) : undefined);
    }

    setPhase(id: string, phase: number): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        a.pilot?.setPhase(phase as AiFlightPhase);
    }

    /** Rebuild the in-worker pilot with new options (AI model switch applies here). */
    setPilotOptions(id: string, options: AiPilotOptions): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.setPilotOptions(options, this.world);
    }

    respawn(id: string, spawn: SimAircraftSpawn): void {
        this.aircraft.get(id)?.respawn(spawn);
    }

    resetAircraft(id: string, position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3, landed: boolean, throttle: number, kinematic: boolean): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        this.rebuildIfKinematicChanged(a, kinematic);
        a.arrestorLatch = -1;
        a.arrestorFieldIndex = -1;
        a.arrestorSnagAlong = 0;
        a.arrestorHeld = false;
        a.barricadeEngaged = false;
        a.barricadeFieldIndex = -1;
        a.barricadeSnagAlong = 0;
        a.barricadeHeld = false;
        a.carrierDeckSticky = false;
        a.carrierParkLocalValid = false;
        a.hasPrevHook = false;
        a.model.reset();
        a.model.position = position;
        a.model.quaternion = quaternion;
        a.model.velocityVector = velocity;
        a.model.setLanded(landed);
        a.model.setThrottle(throttle);
        // Match PlayerEntity.reset: gear/flaps down, hook stowed, on every
        // spawn/teleport.
        a.setLandingGearDeployed(true);
        a.setFlapsExtended(true);
        a.setHookDeployed(false);
        a.health = a.maxHealth;
        a.resetGun();
        this.playerInputs.get(id)?.syncThrottle(throttle);
    }

    setAircraftConfig(
        id: string,
        config: Fm2AircraftConfig,
        kinematic: boolean,
        collision?: AircraftCollisionMesh,
    ): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        // Carry over the live rigid-body state across the model swap.
        const next = new Fm2FlightModel(config, { kinematic });
        next.setAltitudeAt(this.altitudeAt);
        next.reset();
        next.setCrashed(a.model.isCrashed());
        next.setLanded(a.model.isLanded());
        next.position = a.model.position;
        next.quaternion = a.model.quaternion;
        next.velocityVector = a.model.velocityVector;
        a.model = next;
        a.kinematic = kinematic;
        a.collision = collision;
        a.setAfterburnerFromConfig(config);
        const hook = config.hook ?? DEFAULT_ARRESTOR_HOOK_BODY;
        a.hookBody.set(hook[0], hook[1], hook[2]);
        a.bindWorld(this.world);
    }

    /**
     * The mesh the barricade webbing drapes over, if the caller has one.
     *
     * The webbing is drawn lying on the airframe, so it is solved against the
     * airframe that is drawn rather than the coarse hitbox {@link setCollision}
     * carries — that one is right for bullets and crashes and wrong here, and
     * against it the net reads as threaded through the wings.
     */
    setBarricadeDrape(id: string, drape: AircraftCollisionMesh | undefined): void {
        const a = this.aircraft.get(id);
        if (a) a.barricadeDrape = drape;
    }

    setCollision(id: string, collision: AircraftCollisionMesh | undefined): void {
        const a = this.aircraft.get(id);
        if (a) a.collision = collision;
    }

    private rebuildIfKinematicChanged(a: SimAircraft, kinematic: boolean): void {
        if (a.kinematic === kinematic) return;
        const next = new Fm2FlightModel(undefined, { kinematic });
        next.setAltitudeAt(this.altitudeAt);
        next.setCrashed(a.model.isCrashed());
        next.setLanded(a.model.isLanded());
        next.position = a.model.position;
        next.quaternion = a.model.quaternion;
        next.velocityVector = a.model.velocityVector;
        a.model = next;
        a.kinematic = kinematic;
        a.bindWorld(this.world);
    }

    setPosition(id: string, position: THREE.Vector3): void {
        const a = this.aircraft.get(id);
        if (a) a.model.position = position;
    }

    setQuaternion(id: string, quaternion: THREE.Quaternion): void {
        const a = this.aircraft.get(id);
        if (a) a.model.quaternion = quaternion;
    }

    setVelocity(id: string, velocity: THREE.Vector3): void {
        const a = this.aircraft.get(id);
        if (a) a.model.velocityVector = velocity;
    }

    syncEffectiveThrottle(id: string, throttle: number): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.model.setThrottle(throttle);
        a.model.syncEffectiveThrottle();
    }

    snapPhysicsState(id: string): void {
        this.aircraft.get(id)?.model.snapPhysicsState();
    }

    setExternalState(id: string, enabled: boolean, faction: Faction, position: THREE.Vector3, velocity: THREE.Vector3, alive: boolean): void {
        if (!enabled) {
            this.external.delete(id);
            return;
        }
        let ext = this.external.get(id);
        if (!ext) {
            ext = new ExternalCombatant();
            this.external.set(id, ext);
        }
        ext.setState(faction, position, velocity, alive);
    }

    clearExternalState(id: string): void {
        this.external.delete(id);
    }

    /**
     * Refresh auto-selected targets. A full re-scan runs on
     * {@link TARGET_SCAN_INTERVAL}; a target that has died or gone away is
     * replaced immediately, because waiting for the next scan would drop the
     * pilot out of ENGAGE (and, for a wingman, back into formation) for up to
     * half a second.
     */
    private updateAutoTargets(delta: number): void {
        this.targetScanTimer -= delta;
        const rescan = this.targetScanTimer <= 0;
        if (rescan) {
            this.targetScanTimer = TARGET_SCAN_INTERVAL;
        }
        for (const a of this.aircraft.values()) {
            if (a.targetFaction === undefined || !a.enabled || !a.pilot) continue;
            // Only the *loss* of a target forces an off-schedule scan. Having no
            // target at all must not, or an aircraft with nothing to fight would
            // re-scan every single step.
            const current = a.autoTargetId === undefined
                ? undefined
                : this.resolveCombatant(a.autoTargetId);
            const lost = a.autoTargetId !== undefined && (current === undefined || !current.isAlive());
            if (rescan || lost) {
                this.selectTargetFor(a, false);
            }
        }
    }

    /**
     * Pick the best live target of `a.targetFaction`: nearest, penalised by how
     * far off the nose it is, with {@link TARGET_SWITCH_MARGIN} hysteresis in
     * favour of the fight already in progress. `force` assigns even when the
     * winner is unchanged (used when the mode is first switched on).
     */
    private selectTargetFor(a: SimAircraft, force: boolean): void {
        const faction = a.targetFaction;
        if (faction === undefined) return;

        a.readPosition(this.selfPos);
        this.selfFwd.copy(FORWARD).applyQuaternion(a.model.quaternion);

        let bestId: string | undefined;
        let bestScore = Infinity;
        for (const id of this.combatantIds()) {
            if (id === a.id) continue;
            const c = this.resolveCombatant(id);
            // resolveCombatant falls back to a disabled aircraft when nothing
            // else stands in for it; those are not in the air to be shot at.
            if (!c || !c.isAlive() || c.faction !== faction) continue;
            if (c instanceof SimAircraft && !c.enabled) continue;

            c.readPosition(this.candidatePos);
            this.losTmp.copy(this.candidatePos).sub(this.selfPos);
            const range = this.losTmp.length();
            if (range < 1e-3) continue;
            const ata = Math.acos(clamp(this.losTmp.dot(this.selfFwd) / range, -1, 1));
            let score = range * (1 + TARGET_ATA_WEIGHT * ata / Math.PI);
            if (id === a.autoTargetId) {
                score *= TARGET_SWITCH_MARGIN;
            }
            if (score < bestScore) {
                bestScore = score;
                bestId = id;
            }
        }

        if (!force && bestId === a.autoTargetId) return;
        a.autoTargetId = bestId;
        a.pilot?.setTarget(bestId ? this.resolveCombatant(bestId) : undefined);
    }

    /**
     * Every id that can resolve to a combatant: sim aircraft plus external
     * mirrors, deduped. Returns a reused set — consume it before calling again.
     */
    private combatantIds(): Iterable<string> {
        this.candidateIds.clear();
        for (const id of this.aircraft.keys()) {
            this.candidateIds.add(id);
        }
        for (const id of this.external.keys()) {
            this.candidateIds.add(id);
        }
        return this.candidateIds;
    }

    private resolveCombatant(id: string): Combatant | undefined {
        const a = this.aircraft.get(id);
        if (a && a.enabled) return a;
        return this.external.get(id) ?? a;
    }

    step(delta: number, inputs: Record<string, SimControlInputs>): void {
        this.hits.length = 0;
        // 0. Worker-side player input → control inputs for externally-flown aircraft.
        for (const [id, input] of this.playerInputs) {
            const a = this.aircraft.get(id);
            if (!a?.enabled || a.control !== 'external') continue;
            inputs[id] = input.tick(delta, a);
        }
        // 1. External inputs first, so pilots (below) and models read a consistent buffer.
        for (const a of this.aircraft.values()) {
            if (!a.enabled) continue;
            if (a.control === 'external') {
                a.setExternalInputs(inputs[a.id] ?? NEUTRAL_INPUTS);
            }
        }
        // 2. Re-pick faction targets before the pilots read them.
        this.updateAutoTargets(delta);
        // 3. Run AI pilots, reading the previous step's world positions.
        for (const a of this.aircraft.values()) {
            if (!a.enabled || a.control !== 'ai' || !a.pilot) continue;
            if (a.health <= 0) {
                // Kill stick so the wreck is not flown by the AI.
                a.setPitch(0);
                a.setRoll(0);
                a.setYaw(0);
                a.setThrottle(0);
                continue;
            }
            a.pilot.update(delta);
        }
        // 4. Advance every model from the now-consistent command buffers.
        for (const a of this.aircraft.values()) {
            if (!a.enabled) continue;
            if (a.scrapeFxCooldown > 0) {
                a.scrapeFxCooldown = Math.max(0, a.scrapeFxCooldown - delta);
            }
            a.applyInputsToModel();
            const parked = this.applyKinematicCarrierPark(a);
            if (!parked) {
                const onCarrierFrame = this.beginCarrierRelativeFrame(a);
                a.model.update(delta);
                this.endCarrierRelativeFrame(a, delta, onCarrierFrame);
            }
            if (!parked) {
                this.resolveSolidWorldContact(a, delta);
            }
            this.resolveArrestor(a, delta);
            this.resolveBarricade(a, delta);
            a.resolveFiring();
        }
        // 5. Guns + projectiles (hits already cleared; scrapes may have appended).
        for (const a of this.aircraft.values()) {
            if (!a.enabled || !a.gun) continue;
            a.gun.update(delta);
            if (a.firing && a.isAlive()) {
                a.gun.tryFire(a.model.position, a.model.quaternion, a.model.velocityVector);
            }
        }
        this.updateProjectiles(delta);
        // 6. The webbing, last: it is driven by where the airframes ended up.
        this.stepBarricadeWebbing(delta);
    }

    /** {@link ProjectileSink} — guns push rounds here. */
    spawnProjectile(origin: THREE.Vector3, velocity: THREE.Vector3, faction: Faction, damage: number): void {
        const slot = this.projectiles.find(s => !s.active);
        if (!slot) return;
        slot.active = true;
        slot.faction = faction;
        slot.damage = damage;
        slot.life = PROJECTILE_LIFESPAN;
        slot.pos.copy(origin);
        slot.prevPos.copy(origin);
        slot.vel.copy(velocity);
    }

    private updateProjectiles(delta: number): void {
        const combatants = this.collectCombatants();
        for (let i = 0; i < this.projectiles.length; i++) {
            const slot = this.projectiles[i];
            if (!slot.active) continue;
            slot.life -= delta;
            if (slot.life <= 0) {
                slot.active = false;
                continue;
            }
            slot.prevPos.copy(slot.pos);
            slot.vel.y -= PROJECTILE_GRAVITY * delta;
            slot.pos.addScaledVector(slot.vel, delta);
            this.checkHit(slot, combatants);
        }
    }

    /**
     * Solid-world contact against the heightfield (flat ground, hills, ski jump,
     * carrier deck). Building cylinders are AI avoidance only — they do not stop
     * the airframe. Soft gear-down scrapes defer to gear springs so taxi/landing
     * is not scrubbed to a halt by the collision mesh.
     */
    private resolveSolidWorldContact(a: SimAircraft, delta: number): void {
        if (a.model.isCrashed() || !this.world) return;

        const contact = this.findSolidWorldContact(a);
        if (!contact) return;

        this.applySolidWorldResponse(a, contact, delta);
    }

    /**
     * Arrestor-cable snag + deck-axis deceleration. Snags only with the hook
     * down; once latched, scrub along-deck speed to stop over
     * {@link ARRESTOR_PULL_OUT_M}.
     * After stop the cable stays bent until the aircraft taxis away.
     */
    private resolveArrestor(a: SimAircraft, delta: number): void {
        if (a.model.isCrashed() || this.arrestorFields.length === 0) return;

        hookWorldPos(a.model.position, a.model.quaternion, a.hookBody, a.hookNow);

        if (a.arrestorLatch < 0) {
            for (let fi = 0; fi < this.arrestorFields.length; fi++) {
                const field = this.arrestorFields[fi];
                const idx = trySnag(
                    a.hookNow,
                    a.hasPrevHook ? a.prevHook : null,
                    a.model.velocityVector,
                    field,
                    a.isHookDeployed(),
                );
                if (idx >= 0) {
                    a.arrestorLatch = idx;
                    a.arrestorFieldIndex = fi;
                    a.arrestorSnagAlong = a.hookNow.dot(field.deckAxis);
                    a.arrestorHeld = false;
                    break;
                }
            }
        }

        if (a.arrestorLatch >= 0 && a.arrestorFieldIndex >= 0) {
            const field = this.arrestorFields[a.arrestorFieldIndex];
            const vel = a.model.velocityVector;
            const shipAlong = this.carrierVel.dot(field.deckAxis);
            if (!a.arrestorHeld) {
                const traveled = a.hookNow.dot(field.deckAxis) - a.arrestorSnagAlong;
                const remaining = ARRESTOR_PULL_OUT_M - traveled;
                const stillPulling = applyArrestorVelocity(
                    vel, field.deckAxis, delta, remaining, shipAlong,
                );
                a.model.snapPhysicsState();
                if (!stillPulling) {
                    a.model.setLanded(true);
                    a.arrestorHeld = true;
                }
            } else {
                // Ride with the ship along-deck; taxi relative speed can release.
                const along = vel.dot(field.deckAxis);
                vel.addScaledVector(field.deckAxis, shipAlong - along);
                a.model.snapPhysicsState();
                const relSpeed = Math.hypot(
                    vel.x - this.carrierVel.x,
                    vel.z - this.carrierVel.z,
                );
                if (relSpeed > ARRESTOR_RELEASE_SPEED_MPS || !a.isHookDeployed()) {
                    a.arrestorLatch = -1;
                    a.arrestorFieldIndex = -1;
                    a.arrestorHeld = false;
                }
            }
        }

        a.prevHook.copy(a.hookNow);
        a.hasPrevHook = true;
    }

    /**
     * Emergency barricade: the webbing catches the *wings*, so there is no hook
     * test — any airframe that crosses a raised net inside the stanchion span
     * and below its top edge is engaged, and is then scrubbed to a stop over
     * {@link BARRICADE_PULL_OUT_M} exactly like a pendant arrestment.
     *
     * An aircraft already latched to a wire never loads the webbing; the wire
     * stops it first.
     */
    private resolveBarricade(a: SimAircraft, delta: number): void {
        const pos = a.model.position;
        const prev = a.hasPrevPos ? a.prevPos : null;

        if (!a.model.isCrashed() && this.barricades.length > 0) {
            if (!a.barricadeEngaged && a.arrestorLatch < 0) {
                for (let fi = 0; fi < this.barricades.length; fi++) {
                    const field = this.barricades[fi];
                    if (!tryBarricadeEngage(
                        pos, prev, a.model.velocityVector, a.wingHalfSpanM, field, this.carrierVel,
                    )) {
                        continue;
                    }
                    a.barricadeEngaged = true;
                    a.barricadeFieldIndex = fi;
                    a.barricadeSnagAlong = pos.dot(field.deckAxis);
                    a.barricadeHeld = false;
                    break;
                }
            }

            if (a.barricadeEngaged && a.barricadeFieldIndex >= 0) {
                const field = this.barricades[a.barricadeFieldIndex];
                const vel = a.model.velocityVector;
                const shipAlong = this.carrierVel.dot(field.deckAxis);
                if (!a.barricadeHeld) {
                    const traveled = pos.dot(field.deckAxis) - a.barricadeSnagAlong;
                    const stillPulling = applyArrestorVelocity(
                        vel, field.deckAxis, delta, BARRICADE_PULL_OUT_M - traveled, shipAlong,
                    );
                    this.applyWebbingLoad(a, field, delta);
                    a.model.snapPhysicsState();
                    if (!stillPulling) {
                        a.model.setLanded(true);
                        a.barricadeHeld = true;
                    }
                } else {
                    // Ride with the ship until the deck crew cuts the webbing free.
                    const along = vel.dot(field.deckAxis);
                    vel.addScaledVector(field.deckAxis, shipAlong - along);
                    a.model.snapPhysicsState();
                    const relSpeed = Math.hypot(
                        vel.x - this.carrierVel.x,
                        vel.z - this.carrierVel.z,
                    );
                    if (relSpeed > BARRICADE_RELEASE_SPEED_MPS) {
                        a.barricadeEngaged = false;
                        a.barricadeFieldIndex = -1;
                        a.barricadeHeld = false;
                    }
                }
            }
        }

        a.prevPos.copy(pos);
        a.hasPrevPos = true;
    }

    /**
     * Idle on-deck: lock XZ to ship-local offset, match carrier velocity, skip FM2
     * so gear springs cannot bob the airframe. Mid-arrestor pull keeps dynamic FM2.
     */
    private applyKinematicCarrierPark(a: SimAircraft): boolean {
        this.updateCarrierDeckSticky(a);
        if (!a.carrierDeckSticky || !a.isLanded() || !a.isGearDeployed()) {
            a.carrierParkLocalValid = false;
            return false;
        }
        if (a.getThrottle() > 0.05) {
            a.carrierParkLocalValid = false;
            return false;
        }
        // Still pulling out — do not freeze pose.
        if (a.barricadeEngaged && !a.barricadeHeld) {
            a.carrierParkLocalValid = false;
            return false;
        }
        if (a.arrestorLatch >= 0 && !a.arrestorHeld) {
            a.carrierParkLocalValid = false;
            return false;
        }
        // Rollout / landing: keep FM2 until nearly stopped relative to the deck.
        const vel = a.model.velocityVector;
        const relSpd = Math.hypot(vel.x - this.carrierVel.x, vel.z - this.carrierVel.z);
        if (relSpd > CARRIER_PARK_REL_SPEED_MPS) {
            a.carrierParkLocalValid = false;
            return false;
        }
        if (!this.world?.carrierOrigin(this.carrierOriginScratch)) {
            a.carrierParkLocalValid = false;
            return false;
        }
        const origin = this.carrierOriginScratch;
        const pos = a.model.position;
        if (!a.carrierParkLocalValid) {
            a.carrierParkLocalX = pos.x - origin.x;
            a.carrierParkLocalZ = pos.z - origin.z;
            a.carrierParkLocalValid = true;
        }
        pos.x = origin.x + a.carrierParkLocalX;
        pos.z = origin.z + a.carrierParkLocalZ;
        vel.x = this.carrierVel.x;
        vel.y = 0;
        vel.z = this.carrierVel.z;
        a.model.clearAngularVelocity();
        a.model.snapPhysicsState();
        return true;
    }

    private updateCarrierDeckSticky(a: SimAircraft): void {
        if (!this.world || a.model.isCrashed() || !a.isGearDeployed() || !a.isLanded()) {
            a.carrierDeckSticky = false;
            return;
        }
        const pos = a.model.position;
        // Finite means a deck triangle covers this point. Testing `> 0` instead
        // assumed a deck sits above the tangent plane, which is only true near
        // the play area's origin.
        const carrierY = this.world.carrierHeightAt(pos.x, pos.z);
        if (!Number.isFinite(carrierY)) {
            a.carrierDeckSticky = false;
            return;
        }
        if (this.isOnCarrierDeck(a)) {
            a.carrierDeckSticky = true;
        }
    }

    /**
     * Run FM2 in the carrier's horizontal frame so gear friction sees deck-relative
     * speed (not ship cruise). Used for taxi / takeoff roll / arrestor pull.
     */
    private beginCarrierRelativeFrame(a: SimAircraft): boolean {
        if (!this.shouldUseCarrierRelativeFrame(a)) return false;
        const vel = a.model.velocityVector;
        vel.x -= this.carrierVel.x;
        vel.z -= this.carrierVel.z;
        a.model.snapPhysicsState();
        return true;
    }

    private endCarrierRelativeFrame(a: SimAircraft, delta: number, active: boolean): void {
        if (!active) return;
        const pos = a.model.position;
        const vel = a.model.velocityVector;
        pos.x += this.carrierVel.x * delta;
        pos.z += this.carrierVel.z * delta;
        vel.x += this.carrierVel.x;
        vel.z += this.carrierVel.z;
        a.model.snapPhysicsState();
    }

    private shouldUseCarrierRelativeFrame(a: SimAircraft): boolean {
        if (!this.world || a.model.isCrashed() || !a.isGearDeployed()) return false;
        this.updateCarrierDeckSticky(a);
        if (!a.carrierDeckSticky && !this.isOnCarrierDeck(a)) return false;
        if (a.isLanded() || a.arrestorLatch >= 0 || a.barricadeEngaged) return true;
        return a.model.getGearCompressionMean() > 0.005;
    }

    /** True when gear contact height matches the carrier mesh (not plain terrain). */
    private isOnCarrierDeck(a: SimAircraft): boolean {
        const pos = a.model.position;
        const carrierY = this.world!.carrierHeightAt(pos.x, pos.z);
        if (!Number.isFinite(carrierY)) return false;
        const groundY = this.world!.groundHeightAt(pos.x, pos.z);
        return Math.abs(carrierY - groundY) < 0.15;
    }

    private findSolidWorldContact(a: SimAircraft): SolidWorldContact | null {
        const pos = a.model.position;
        const quat = a.model.quaternion;
        const gearDown = a.isGearDeployed();
        const groundAt = (x: number, z: number) => this.world!.groundHeightAt(x, z);

        if (a.collision) {
            const terrainMargin = gearDown ? GEAR_TERRAIN_MARGIN_M : BELLY_TERRAIN_MARGIN_M;
            const contact = findCollisionMeshTerrainContact(
                pos, quat, a.collision, groundAt, terrainMargin,
                this.contactPoint, this.contactNormal,
            );
            if (contact && this.isUnresolvedTerrain(contact.point.x, contact.point.z)) {
                return null;
            }
            return contact;
        }

        // No baked mesh: CG belly vs terrain only.
        const groundY = groundAt(pos.x, pos.z);
        const margin = gearDown ? GEAR_TERRAIN_MARGIN_M : BELLY_TERRAIN_MARGIN_M;
        const bellyY = pos.y - (gearDown ? PLANE_DISTANCE_TO_GROUND : a.hitRadius * 0.35);
        const terrainPen = (groundY - margin) - bellyY;
        if (terrainPen <= 0 || this.isUnresolvedTerrain(pos.x, pos.z)) {
            return null;
        }
        this.contactPoint.set(pos.x, bellyY, pos.z);
        this.contactNormal.set(0, 1, 0);
        return {
            point: this.contactPoint,
            normal: this.contactNormal,
            penetration: terrainPen,
        };
    }

    /**
     * True when the solid here is DEM relief we only know at the coarse tier.
     * Coarse is a ~600 m lattice over 3.7 km of relief: an aircraft must not be
     * wrecked against a surface that inaccurate, so it flies through instead
     * until the fine tiles for that spot have been mirrored — or until the
     * render thread says there are none, in which case coarse is what everyone
     * has and it stands. Water is exempt (sea level is exact at every tier), as
     * is anything standing on the DEM (pads, decks, scenery): those are
     * authored, not sampled.
     */
    private isUnresolvedTerrain(x: number, z: number): boolean {
        if (!this.world || this.heightField.isAuthoritativeAt(x, z)) {
            return false;
        }
        if (!this.heightField.isLandAtWorld(x, z)) {
            return false;
        }
        const demY = this.heightField.heightAtWorld(x, z);
        return Math.abs(this.world.groundHeightAt(x, z) - demY) < 0.01;
    }

    private applySolidWorldResponse(a: SimAircraft, contact: SolidWorldContact, delta: number): void {
        const n = contact.normal;
        const pos = a.model.position;

        // Contact-point speed into the surface (CG + spin), for FX / fatality.
        const impactSpeed = a.model.contactSpeedIntoNormal(contact.point, n);

        // Soft rolling contact: gear springs own the vertical constraint — do not
        // push the body or apply scrapes that fight taxi on deck.
        if (a.isGearDeployed() && impactSpeed < SOLID_SCRAPE_FX_MPS && contact.penetration < 0.35) {
            return;
        }

        // Heightfield penetration is vertical depth — lift in Y only.
        pos.y += contact.penetration + SOLID_SLOP_M;

        // Mild drag at the hit point (linear + torque). No bounce / no velocity dump.
        a.model.applyContactDragAt(
            contact.point,
            delta,
            SOLID_CONTACT_DRAG_PER_S,
            SOLID_CONTACT_DRAG_MASS_FRAC,
            SOLID_CONTACT_DRAG_MAX_FRAC,
        );
        a.model.snapPhysicsState();

        const fatal = impactSpeed >= SOLID_CRASH_IMPACT_MPS
            || contact.penetration >= SOLID_CRASH_PENETRATION_M;
        if (fatal) {
            a.model.setCrashed(true);
            a.applyDamage(a.health);
            this.emitScrapeFx(a, contact.point, /*force*/ true);
            return;
        }

        if (impactSpeed >= SOLID_SCRAPE_FX_MPS) {
            const dmg = impactSpeed * SOLID_SCRAPE_DAMAGE_PER_MPS;
            a.applyDamage(dmg);
            if (a.health <= 0) {
                a.model.setCrashed(true);
            }
            this.emitScrapeFx(a, contact.point, false);
        } else if (contact.penetration > 0.15) {
            this.emitScrapeFx(a, contact.point, false);
        }
    }

    private emitScrapeFx(a: SimAircraft, point: THREE.Vector3, force: boolean): void {
        if (!force && a.scrapeFxCooldown > 0) return;
        a.scrapeFxCooldown = SOLID_SCRAPE_FX_COOLDOWN_S;
        const vel = a.model.velocityVector;
        this.hits.push({
            position: [point.x, point.y, point.z],
            velocity: [vel.x, vel.y, vel.z],
            targetId: a.id,
            damage: force ? 50 : 5,
            source: 'scrape',
        });
    }

    private checkHit(slot: ProjectileSlot, combatants: Combatant[]): void {
        this.seg.copy(slot.pos).sub(slot.prevPos);
        const segLenSq = this.seg.lengthSq();
        this.segEnd.copy(slot.pos);
        for (let i = 0; i < combatants.length; i++) {
            const c = combatants[i];
            if (c.faction === slot.faction || !c.isAlive()) continue;
            c.readPosition(this.cPos);

            let hit = false;
            const simA = c instanceof SimAircraft ? c : undefined;
            if (simA?.collision) {
                this.cQuat.copy(simA.model.quaternion);
                hit = segmentHitsCollisionMesh(
                    slot.prevPos, this.segEnd,
                    this.cPos, this.cQuat, simA.collision,
                    this.bodyStart, this.bodyEnd,
                    this.closest,
                );
            } else {
                const radius = c.getHitRadius();
                hit = segmentHitsSphere(
                    slot.prevPos, this.seg, segLenSq,
                    this.cPos, radius,
                    this.closest, this.toCenter,
                );
            }
            if (!hit) continue;

            c.applyDamage(slot.damage);
            c.readVelocity(this.cVel);
            this.hits.push({
                position: [this.closest.x, this.closest.y, this.closest.z],
                velocity: [this.cVel.x, this.cVel.y, this.cVel.z],
                targetId: this.combatantId(c),
                damage: slot.damage,
            });
            slot.active = false;
            return;
        }
    }

    private combatantId(c: Combatant): string {
        for (const [id, a] of this.aircraft) {
            if (a === c) return id;
        }
        for (const [id, e] of this.external) {
            if (e === c) return id;
        }
        return '';
    }

    private collectCombatants(): Combatant[] {
        const list: Combatant[] = [];
        for (const a of this.aircraft.values()) {
            if (a.enabled) list.push(a);
        }
        for (const e of this.external.values()) {
            list.push(e);
        }
        return list;
    }

    /** Encode a transferable snapshot (see {@link SnapshotBuffers}). */
    encodeSnapshot(): SnapshotBuffers {
        return this.encodeSnapshotInto(undefined, undefined);
    }

    /**
     * Pack aircraft/projectile floats into optional preallocated banks (SharedArrayBuffer
     * mirrors). When banks are omitted, allocates fresh transferable arrays.
     */
    encodeSnapshotInto(
        aircraftBank: Float32Array | undefined,
        projectileBank: Float32Array | undefined,
        barricadeBank?: Float32Array,
    ): SnapshotBuffers {
        const ids: string[] = [];
        for (const id of this.order) {
            if (this.aircraft.has(id)) ids.push(id);
        }
        if (ids.length > (aircraftBank ? aircraftBank.length / AC_STRIDE : Infinity)) {
            throw new Error(`encodeSnapshot: aircraft count ${ids.length} exceeds shared bank`);
        }
        const aircraft = aircraftBank
            ?? new Float32Array(ids.length * AC_STRIDE);
        const forceVectors: Record<string, ForceVectorSample[]> = {};
        const maneuverLabels: Record<string, string> = {};
        for (let i = 0; i < ids.length; i++) {
            const a = this.aircraft.get(ids[i])!;
            a.writeInto(aircraft, i * AC_STRIDE, this.playerInputs.get(ids[i]));
            const fv = a.forceVectors();
            if (fv.length > 0) {
                forceVectors[ids[i]] = fv;
            }
            if (a.pilot) {
                maneuverLabels[ids[i]] = a.pilot.getManeuverLabel();
            }
        }

        let projectileCount = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            if (this.projectiles[i].active) projectileCount++;
        }
        if (projectileCount > (projectileBank ? projectileBank.length / PROJ_STRIDE : Infinity)) {
            throw new Error(`encodeSnapshot: projectile count ${projectileCount} exceeds shared bank`);
        }
        const projectiles = projectileBank
            ?? new Float32Array(projectileCount * PROJ_STRIDE);
        let k = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            const slot = this.projectiles[i];
            if (!slot.active) continue;
            projectiles[k] = slot.pos.x;
            projectiles[k + 1] = slot.pos.y;
            projectiles[k + 2] = slot.pos.z;
            this.projectileQuat(slot);
            projectiles[k + 3] = this.qScratch.x;
            projectiles[k + 4] = this.qScratch.y;
            projectiles[k + 5] = this.qScratch.z;
            projectiles[k + 6] = this.qScratch.w;
            k += PROJ_STRIDE;
        }

        // The webbing: one block of carrier-local particle positions per rig.
        // Every rig laces the same number of particles, so one node count
        // describes them all and the reader can stride straight through.
        const barricadeCount = Math.min(
            this.barricadeSolvers.length,
            barricadeBank ? Math.floor(barricadeBank.length / BARRICADE_STRIDE) : Infinity,
        );
        const barricadeNodes = this.barricadeSolvers[0]?.count ?? 0;
        const barricades = barricadeBank
            ?? new Float32Array(barricadeCount * BARRICADE_STRIDE);
        for (let i = 0; i < barricadeCount; i++) {
            this.barricadeSolvers[i].writeTo(barricades, i * BARRICADE_STRIDE);
        }

        return {
            ids, aircraft, forceVectors, maneuverLabels,
            projectiles, projectileCount,
            barricades, barricadeCount, barricadeNodes,
            hits: this.hits.slice(),
        };
    }

    private readonly qScratch = new THREE.Quaternion();
    private readonly dirScratch = new THREE.Vector3();
    private projectileQuat(slot: ProjectileSlot): void {
        if (slot.vel.lengthSq() > 1e-6) {
            this.dirScratch.copy(slot.vel).normalize();
            this.qScratch.setFromUnitVectors(FORWARD, this.dirScratch);
        }
    }
}
