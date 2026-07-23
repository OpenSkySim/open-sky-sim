import * as THREE from 'three';
import { Fm2FlightModel } from '../model/fm2FlightModel';
import { AiPilot, AiFlightPhase, AiPilotOptions } from '../../ai/aiPilot';
import { PilotableAircraft } from '../../ai/aircraftControls';
import { SceneWorldQuery } from '../../ai/worldQuery';
import { Combatant, Faction } from '../../weapons/combatant';
import { Gun, GunConfig, ProjectileSink } from '../../weapons/gun';
import { FORWARD } from '../../utils/math';
import { FcsPitchLimiter } from '../fm2/fcs';
import { Fm2AircraftConfig } from '../fm2/fm2AircraftConfig';
import { ForceVectorSample } from '../model/flightModel';
import { deserializeWorldQuery, SerializedWorld } from './serializedWorld';
import { AC, AC_STRIDE, PROJ_STRIDE, SnapshotBuffers } from './simSnapshotCodec';
import {
    SimAircraftDesc, SimAircraftSpawn, SimControlInputs,
    SimControlMode, SimHitEvent,
} from './simTypes';

/** Seconds a tracer lives before self-destructing (mirrors WeaponsField). */
const PROJECTILE_LIFESPAN = 2.5;
const PROJECTILE_GRAVITY = 9.80665;
const PROJECTILE_POOL_SIZE = 480;

const NEUTRAL_INPUTS: SimControlInputs = {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    landingGearDeployed: true, flapsExtended: true, wheelBrakesApplied: false,
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
 * optional in-worker {@link AiPilot} and gun. Implements {@link PilotableAircraft}
 * (so a pilot can fly it) and {@link Combatant} (so it can be targeted/hit).
 */
class SimAircraft implements PilotableAircraft, Combatant {

    readonly id: string;
    readonly faction: Faction;
    control: SimControlMode;
    enabled: boolean;
    kinematic: boolean;

    model: Fm2FlightModel;
    pilot: AiPilot | undefined;
    gun: Gun | undefined;

    health: number;
    maxHealth: number;
    readonly hitRadius: number;

    /** Firing decision resolved this frame (pilot solution or external trigger). */
    firing = false;

    // Normalized command buffer, written by the pilot (ai) or the client (external).
    private inPitch = 0;
    private inRoll = 0;
    private inYaw = 0;
    private inThrottle = 0;
    private inGear = true;
    private inFlaps = true;
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
        this.maxHealth = desc.maxHealth;
        this.health = desc.maxHealth;
        this.model = new Fm2FlightModel(desc.aircraftConfig, { kinematic: desc.kinematic });
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

    private pilotOptions: AiPilotOptions | undefined;

    buildPilot(options: AiPilotOptions | undefined, world: SceneWorldQuery | undefined): void {
        this.pilotOptions = options ?? this.pilotOptions;
        if (this.pilot || !this.pilotOptions || !world) {
            return;
        }
        this.pilot = new AiPilot(this, world, this.pilotOptions);
    }

    applySpawn(spawn: SimAircraftSpawn): void {
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
    writeInto(out: Float32Array, base: number): void {
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
        out[base + AC.firing] = this.firing ? 1 : 0;
        out[base + AC.health] = this.health;
        out[base + AC.ammo] = this.gun?.ammoRemaining ?? 0;
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
    private readonly aircraft = new Map<string, SimAircraft>();
    private readonly order: string[] = [];
    private readonly external = new Map<string, ExternalCombatant>();

    private readonly projectiles: ProjectileSlot[] = [];
    private readonly hits: SimHitEvent[] = [];

    // Scratch vectors for hit detection.
    private readonly seg = new THREE.Vector3();
    private readonly toCenter = new THREE.Vector3();
    private readonly closest = new THREE.Vector3();
    private readonly cPos = new THREE.Vector3();
    private readonly cVel = new THREE.Vector3();

    constructor() {
        for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            this.projectiles.push({
                active: false, faction: Faction.PLAYER, damage: 0, life: 0,
                pos: new THREE.Vector3(), prevPos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
            });
        }
    }

    setWorld(world: SerializedWorld): void {
        this.world = deserializeWorldQuery(world);
        // Any aircraft added before the world arrived can now get its pilot.
        for (const a of this.aircraft.values()) {
            a.buildPilot(undefined, this.world);
        }
    }

    addAircraft(desc: SimAircraftDesc): void {
        if (this.aircraft.has(desc.id)) {
            this.aircraft.delete(desc.id);
        } else {
            this.order.push(desc.id);
        }
        this.aircraft.set(desc.id, new SimAircraft(desc, this.world, this));
    }

    removeAircraft(id: string): void {
        this.aircraft.delete(id);
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

    setTarget(id: string, targetId: string | null): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        a.pilot?.setTarget(targetId ? this.resolveCombatant(targetId) : undefined);
    }

    setPhase(id: string, phase: number): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        a.buildPilot(undefined, this.world);
        a.pilot?.setPhase(phase as AiFlightPhase);
    }

    respawn(id: string, spawn: SimAircraftSpawn): void {
        this.aircraft.get(id)?.respawn(spawn);
    }

    resetAircraft(id: string, position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3, landed: boolean, throttle: number, kinematic: boolean): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        this.rebuildIfKinematicChanged(a, kinematic);
        a.model.reset();
        a.model.position = position;
        a.model.quaternion = quaternion;
        a.model.velocityVector = velocity;
        a.model.setLanded(landed);
        a.model.setThrottle(throttle);
        a.health = a.maxHealth;
        a.resetGun();
    }

    setAircraftConfig(id: string, config: Fm2AircraftConfig, kinematic: boolean): void {
        const a = this.aircraft.get(id);
        if (!a) return;
        // Carry over the live rigid-body state across the model swap.
        const next = new Fm2FlightModel(config, { kinematic });
        next.reset();
        next.setCrashed(a.model.isCrashed());
        next.setLanded(a.model.isLanded());
        next.position = a.model.position;
        next.quaternion = a.model.quaternion;
        next.velocityVector = a.model.velocityVector;
        a.model = next;
        a.kinematic = kinematic;
    }

    private rebuildIfKinematicChanged(a: SimAircraft, kinematic: boolean): void {
        if (a.kinematic === kinematic) return;
        const next = new Fm2FlightModel(undefined, { kinematic });
        next.setCrashed(a.model.isCrashed());
        next.setLanded(a.model.isLanded());
        next.position = a.model.position;
        next.quaternion = a.model.quaternion;
        next.velocityVector = a.model.velocityVector;
        a.model = next;
        a.kinematic = kinematic;
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

    private resolveCombatant(id: string): Combatant | undefined {
        const a = this.aircraft.get(id);
        if (a && a.enabled) return a;
        return this.external.get(id) ?? a;
    }

    step(delta: number, inputs: Record<string, SimControlInputs>): void {
        // 1. External inputs first, so pilots (below) and models read a consistent buffer.
        for (const a of this.aircraft.values()) {
            if (!a.enabled) continue;
            if (a.control === 'external') {
                a.setExternalInputs(inputs[a.id] ?? NEUTRAL_INPUTS);
            }
        }
        // 2. Run AI pilots, reading the previous step's world positions.
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
        // 3. Advance every model from the now-consistent command buffers.
        for (const a of this.aircraft.values()) {
            if (!a.enabled) continue;
            a.applyInputsToModel();
            a.model.update(delta);
            a.resolveFiring();
        }
        // 4. Guns + projectiles.
        this.hits.length = 0;
        for (const a of this.aircraft.values()) {
            if (!a.enabled || !a.gun) continue;
            a.gun.update(delta);
            if (a.firing && a.isAlive()) {
                a.gun.tryFire(a.model.position, a.model.quaternion, a.model.velocityVector);
            }
        }
        this.updateProjectiles(delta);
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

    private checkHit(slot: ProjectileSlot, combatants: Combatant[]): void {
        this.seg.copy(slot.pos).sub(slot.prevPos);
        const segLenSq = this.seg.lengthSq();
        for (let i = 0; i < combatants.length; i++) {
            const c = combatants[i];
            if (c.faction === slot.faction || !c.isAlive()) continue;
            c.readPosition(this.cPos);
            const radius = c.getHitRadius();
            this.toCenter.copy(this.cPos).sub(slot.prevPos);
            let t = segLenSq > 1e-6 ? this.toCenter.dot(this.seg) / segLenSq : 0;
            t = Math.max(0, Math.min(1, t));
            this.closest.copy(this.seg).multiplyScalar(t).add(slot.prevPos);
            if (this.closest.distanceToSquared(this.cPos) <= radius * radius) {
                c.applyDamage(slot.damage);
                c.readVelocity(this.cVel);
                this.hits.push({
                    position: [this.cPos.x, this.cPos.y, this.cPos.z],
                    velocity: [this.cVel.x, this.cVel.y, this.cVel.z],
                    targetId: this.combatantId(c),
                    damage: slot.damage,
                });
                slot.active = false;
                return;
            }
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
        const ids: string[] = [];
        for (const id of this.order) {
            if (this.aircraft.has(id)) ids.push(id);
        }
        const aircraft = new Float32Array(ids.length * AC_STRIDE);
        const forceVectors: Record<string, ForceVectorSample[]> = {};
        for (let i = 0; i < ids.length; i++) {
            const a = this.aircraft.get(ids[i])!;
            a.writeInto(aircraft, i * AC_STRIDE);
            const fv = a.forceVectors();
            if (fv.length > 0) {
                forceVectors[ids[i]] = fv;
            }
        }

        let projectileCount = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            if (this.projectiles[i].active) projectileCount++;
        }
        const projectiles = new Float32Array(projectileCount * PROJ_STRIDE);
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

        return { ids, aircraft, forceVectors, projectiles, projectileCount, hits: this.hits.slice() };
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
