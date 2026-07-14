import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { FlightModel } from '../../physics/model/flightModel';
import { WorkerFlightModel } from '../../physics/model/workerFlightModel';
import { FlightSample } from '../../physics/flightRecorder';
import { defaultFm2Config } from '../../physics/fm2/fm2AircraftConfig';
import { clamp, FORWARD, RIGHT, UP } from '../../utils/math';
import { AiPilot, AiPilotOptions } from '../../ai/aiPilot';
import { PilotableAircraft } from '../../ai/aircraftControls';
import { WorldQuery } from '../../ai/worldQuery';
import { Combatant, Faction } from '../../weapons/combatant';
import { Gun, GunConfig, ProjectileSink } from '../../weapons/gun';
import { Entity, ENTITY_TAGS } from '../entity';
import { ControlAxis, ControlSurfaceConfig, FlyableAircraftDef } from './aircraftDef';
import { ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';

const DEFAULT_HIT_RADIUS = 10;

// Visual control-surface animation constants — mirror PlayerEntity so the AI
// aircraft's flaperons / stabilators / rudders deflect identically.
const FLAPS_EXTENDED_ANGLE = Math.PI / 5;
const ROLL_VIS_TAILERON = 0.6;
const ROLL_VIS_AILERON = 0.15;
const SLAT_AOA_ONSET_RAD = 10 * Math.PI / 180;
const SLAT_AOA_FULL_RAD = 18 * Math.PI / 180;

/** A hinge-pivoted control surface rendered and animated on top of the body. */
interface AiControlSurface {
    model: LODHelper;
    pivot: THREE.Vector3;
    axis: THREE.Vector3;
    control: ControlAxis;
    sign: number;
    range: number;
}

export interface AiAircraftSpawn {
    position: THREE.Vector3;
    heading: number;
    airborne?: boolean;
    velocity?: THREE.Vector3;
    throttle?: number;
}

/**
 * An AI-flown opponent aircraft. Its FM2 flight model runs in a dedicated physics
 * worker and is flown entirely through the normalized {@link PilotableAircraft} control
 * channel by an {@link AiPilot}, exactly as a human drives the player plane. It
 * is also a {@link Combatant} — targetable and damageable by gun fire.
 */
export class AiAircraftEntity implements Entity, PilotableAircraft, Combatant {

    readonly tags: string[] = [ENTITY_TAGS.AIRCRAFT];
    enabled = true;

    readonly faction: Faction;

    private readonly flightModel: FlightModel;
    private readonly pilot: AiPilot;
    private readonly gun: Gun;

    private readonly modelBody: LODHelper;
    private readonly modelShadow: LODHelper;
    private readonly modelLandingGear: LODHelper | undefined;
    private readonly controlSurfaces: AiControlSurface[];

    private readonly obj = new THREE.Object3D();
    private readonly displayPosition = new THREE.Vector3();
    private readonly displayQuaternion = new THREE.Quaternion();
    private readonly shadowPosition = new THREE.Vector3();
    private readonly shadowQuaternion = new THREE.Quaternion();
    private readonly shadowScale = new THREE.Vector3(1, 1, 1);
    private readonly scale = new THREE.Vector3(1, 1, 1);
    private readonly _v = new THREE.Vector3();
    private readonly _q = new THREE.Quaternion();

    // Normalized command state written by the pilot each frame.
    private pitch = 0;
    private roll = 0;
    private yaw = 0;
    private throttle = 0;
    private brakes = false;
    private gearDeployed = true;
    private flapsExtended = true;

    private health = 100;
    private readonly maxHealth = 100;

    constructor(
        models: ModelManager,
        def: FlyableAircraftDef,
        world: WorldQuery,
        weapons: ProjectileSink,
        faction: Faction,
        spawn: AiAircraftSpawn,
        pilotOptions: AiPilotOptions = {},
    ) {
        this.faction = faction;
        this.flightModel = new WorkerFlightModel();
        this.flightModel.setAircraft(def.flight ?? defaultFm2Config);
        this.modelBody = new LODHelper(models.getModel(def.body));
        this.modelShadow = new LODHelper(models.getModel(def.shadow), 5);
        this.modelLandingGear = def.gear ? new LODHelper(models.getModel(def.gear)) : undefined;
        this.controlSurfaces = def.surfaces.map((s: ControlSurfaceConfig): AiControlSurface => ({
            model: new LODHelper(models.getModel(s.model)),
            pivot: new THREE.Vector3().fromArray(s.pivot),
            axis: new THREE.Vector3().fromArray(s.axis),
            control: s.control,
            sign: s.sign,
            range: s.rangeRad,
        }));

        this.pilot = new AiPilot(this, world, pilotOptions);
        const gunConfig: GunConfig = {
            muzzleVelocity: pilotOptions.bulletSpeed ?? 1000,
            roundsPerSecond: 20,
            damage: 8,
            ammo: 2400,
            muzzleOffset: new THREE.Vector3(0, 0, 9),
            spread: 0.004,
        };
        this.gun = new Gun(gunConfig, weapons, faction);

        this.applySpawn(spawn);
    }

    getPilot(): AiPilot {
        return this.pilot;
    }

    respawn(spawn: AiAircraftSpawn): void {
        this.flightModel.reset();
        this.health = this.maxHealth;
        this.pitch = this.roll = this.yaw = 0;
        this.throttle = spawn.throttle ?? 0;
        this.brakes = false;
        this.gearDeployed = !(spawn.airborne ?? false);
        this.flapsExtended = !(spawn.airborne ?? false);
        this.applySpawn(spawn);
        this.enabled = true;
    }

    private applySpawn(spawn: AiAircraftSpawn): void {
        const airborne = spawn.airborne ?? false;
        this.flightModel.position = spawn.position;
        this.flightModel.quaternion = this._q.setFromAxisAngle(UP, spawn.heading);
        this.obj.position.copy(spawn.position);
        this.obj.quaternion.copy(this._q);
        if (spawn.velocity) {
            this.flightModel.velocityVector = spawn.velocity;
        }
        this.throttle = spawn.throttle ?? this.throttle;
        this.flightModel.setThrottle(this.throttle);
        this.flightModel.setLanded(!airborne);
        if (airborne) {
            this.flightModel.syncEffectiveThrottle();
            this.flightModel.snapPhysicsState();
        }
    }

    init(scene: Scene): void {
        // Nothing
    }

    update(delta: number): void {
        if (!this.isCrashed()) {
            this.pilot.update(delta);
        } else {
            this.throttle = 0;
            this.brakes = true;
        }

        this.flightModel.setPitch(this.pitch);
        this.flightModel.setRoll(this.roll);
        this.flightModel.setYaw(this.yaw);
        this.flightModel.setThrottle(this.throttle);
        this.flightModel.setLandingGearDeployed(this.gearDeployed);
        this.flightModel.setFlapsExtended(this.flapsExtended);
        this.flightModel.setWheelBrakes(this.brakes);
        this.flightModel.update(delta);

        this.obj.position.copy(this.flightModel.position);
        this.obj.quaternion.copy(this.flightModel.quaternion);

        this.gun.update(delta);
        if (!this.isCrashed() && this.pilot.isFiring) {
            this.gun.tryFire(this.flightModel.position, this.flightModel.quaternion, this.flightModel.velocityVector);
        }
    }

    // --- PilotableAircraft: control channel ----------------------------------

    setPitch(pitch: number): void { this.pitch = pitch; }
    setRoll(roll: number): void { this.roll = roll; }
    setYaw(yaw: number): void { this.yaw = yaw; }
    setThrottle(throttle: number): void { this.throttle = throttle; }
    setWheelBrakes(applied: boolean): void { this.brakes = applied; }
    setLandingGearDeployed(deployed: boolean): void { this.gearDeployed = deployed; }
    setFlapsExtended(extended: boolean): void { this.flapsExtended = extended; }

    // --- PilotableAircraft: observation --------------------------------------

    getPosition(): THREE.Vector3 { return this.flightModel.position; }
    getVelocity(): THREE.Vector3 { return this.flightModel.velocityVector; }
    getQuaternion(): THREE.Quaternion { return this.flightModel.quaternion; }
    getAirspeed(): number { return this.flightModel.velocityVector.length(); }
    getAltitude(): number { return this.flightModel.position.y; }
    getAngleOfAttack(): number { return this.flightModel.getAngleOfAttack(); }
    getLoadFactorG(): number { return this.flightModel.getLoadFactorG(); }
    getStallStatus(): number { return this.flightModel.getStallStatus(); }
    isLanded(): boolean { return this.flightModel.isLanded(); }
    isCrashed(): boolean { return this.flightModel.isCrashed(); }
    isGearDeployed(): boolean { return this.gearDeployed; }
    isFlapsExtended(): boolean { return this.flapsExtended; }

    // --- Combatant -----------------------------------------------------------

    readPosition(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.flightModel.position); }
    readVelocity(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.flightModel.velocityVector); }
    getHitRadius(): number { return DEFAULT_HIT_RADIUS; }

    isAlive(): boolean {
        return this.enabled && this.health > 0 && !this.isCrashed();
    }

    applyDamage(amount: number): void {
        if (this.health <= 0) {
            return;
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.flightModel.setCrashed(true);
        }
    }

    private get flapsProgressUnit(): number {
        return this.flapsExtended ? 1 : 0;
    }

    private slatDeploymentUnit(): number {
        const flapDeploy = this.flapsProgressUnit;
        const aoa = Math.abs(this.flightModel.getAngleOfAttack());
        const aoaDeploy = aoa <= SLAT_AOA_ONSET_RAD
            ? 0
            : clamp((aoa - SLAT_AOA_ONSET_RAD) / (SLAT_AOA_FULL_RAD - SLAT_AOA_ONSET_RAD), 0, 1);
        return Math.max(flapDeploy, aoaDeploy);
    }

    /** Map a surface's control binding to a normalized deflection value (see PlayerEntity). */
    private surfaceValue(control: ControlAxis, sign: number): number {
        const rollCmd = this.flightModel.getCommandedAileron();
        const roll = Math.abs(this.roll) > Math.abs(rollCmd) ? this.roll : rollCmd;
        const pitch = this.flightModel.getCommandedElevator();
        switch (control) {
            case 'pitch': return sign * pitch;
            case 'roll': return sign * roll;
            case 'yaw': return sign * this.flightModel.getCommandedRudder();
            case 'flaps': return sign * this.flapsProgressUnit;
            case 'slats': return sign * this.slatDeploymentUnit();
            case 'flaperonLeft':
                return this.flapsProgressUnit * -FLAPS_EXTENDED_ANGLE
                    - (1.0 - this.flapsProgressUnit * 0.5) * ROLL_VIS_AILERON * roll;
            case 'flaperonRight':
                return this.flapsProgressUnit * FLAPS_EXTENDED_ANGLE
                    - (1.0 - this.flapsProgressUnit * 0.5) * ROLL_VIS_AILERON * roll;
            case 'stabilatorLeft':
                return sign * (pitch - ROLL_VIS_TAILERON * roll);
            case 'stabilatorRight':
                return sign * (pitch + ROLL_VIS_TAILERON * roll);
            default: return 0;
        }
    }

    /** Telemetry snapshot in the same shape the flight recorder consumes for the player. */
    captureFlightSample(): FlightSample {
        return {
            pitchCmd: this.pitch,
            rollCmd: this.roll,
            yawCmd: this.yaw,
            thrLever: this.throttle,
            gear: this.gearDeployed,
            flaps: this.flapsExtended,
            brake: this.brakes,
            stabilizer: this.flightModel.getCommandedElevator(),
            aileron: this.flightModel.getCommandedAileron(),
            rudder: this.flightModel.getCommandedRudder(),
            effThr: this.flightModel.getEffectiveThrottle(),
            thrustKn: this.flightModel.getEngineThrustKn(),
            position: this.flightModel.position,
            velocity: this.flightModel.velocityVector,
            quaternion: this.flightModel.quaternion,
            aoaRad: this.flightModel.getAngleOfAttack(),
            loadG: this.flightModel.getLoadFactorG(),
            stall: this.flightModel.getStallStatus(),
            landed: this.flightModel.isLanded(),
            crashed: this.flightModel.isCrashed(),
        };
    }

    // --- Render transform (for chase cameras) --------------------------------

    /** Interpolated render-space position, freshly sampled from the flight model. */
    getDisplayPosition(): THREE.Vector3 {
        return this.flightModel.getRenderPosition(this.displayPosition);
    }

    /** Interpolated render-space orientation, freshly sampled from the flight model. */
    getDisplayQuaternion(): THREE.Quaternion {
        return this.flightModel.getRenderQuaternion(this.displayQuaternion);
    }

    // --- Rendering -----------------------------------------------------------

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        this.flightModel.getRenderPosition(this.displayPosition);
        this.flightModel.getRenderQuaternion(this.displayQuaternion);

        if (!this.isCrashed()) {
            this.shadowPosition.copy(this.displayPosition).setY(0);
            this._v.copy(FORWARD).applyQuaternion(this.displayQuaternion).setY(0).normalize();
            this.shadowQuaternion.setFromUnitVectors(FORWARD, this._v);
            this.modelShadow.addToRenderList(
                this.shadowPosition, this.shadowQuaternion, this.shadowScale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
        }

        const lodCount = this.modelBody.model.lod.length;
        const lod = lodCount === 0 ? 0 : Math.min(
            getLodLevel(this.displayPosition, this.scale, targetWidth, camera, this.modelBody.model.maxSize),
            lodCount - 1,
        );
        this.modelBody.addToRenderList(
            this.displayPosition, this.displayQuaternion, this.scale,
            targetWidth, camera, palette,
            SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);

        // Close up, add the articulated parts (gear + hinge-pivoted surfaces).
        if (lod === 0) {
            if (this.gearDeployed) {
                this.modelLandingGear?.addToRenderList(
                    this.displayPosition, this.displayQuaternion, this.scale,
                    targetWidth, camera, palette,
                    SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
            }

            for (let i = 0; i < this.controlSurfaces.length; i++) {
                const d = this.controlSurfaces[i];
                const deflection = this.isCrashed() ? 0 : this.surfaceValue(d.control, d.sign) * d.range;
                this._q
                    .setFromAxisAngle(this._v.copy(d.axis).applyQuaternion(this.displayQuaternion), deflection)
                    .multiply(this.displayQuaternion);
                this._v.copy(d.pivot).applyQuaternion(this.displayQuaternion).add(this.displayPosition);
                d.model.addToRenderList(
                    this._v, this._q, this.scale,
                    targetWidth, camera, palette,
                    SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
            }
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}
