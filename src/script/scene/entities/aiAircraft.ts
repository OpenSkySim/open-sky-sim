import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { SimProxyFlightModel } from '../../physics/model/simProxyFlightModel';
import { CombatSimClient } from '../../physics/sim/combatSimClient';
import { SimAircraftSpawn, SimGunConfig } from '../../physics/sim/simTypes';
import { FlightSample } from '../../physics/flightRecorder';
import { defaultFm2Config } from '../../physics/fm2/fm2AircraftConfig';
import { clamp, FORWARD, UP } from '../../utils/math';
import { AiPilotOptions } from '../../ai/aiPilot';
import { Combatant, Faction } from '../../weapons/combatant';
import { Entity, ENTITY_TAGS } from '../entity';
import { ControlAxis, ControlSurfaceConfig, FlyableAircraftDef } from './aircraftDef';
import { ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';
import { WeaponsTarget } from './weaponsTarget';

const DEFAULT_HIT_RADIUS = 10;

// Enemy aircraft are centred on their own origin when framed by the target camera.
const AI_TARGET_LOCAL_CENTER = new THREE.Vector3(0, 0, 0);

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
 * An AI-flown opponent aircraft. Its FM2 flight model, {@link AiPilot} and gun
 * all live in the shared combat sim worker (keyed by {@link simId}); this entity
 * is a snapshot-driven render proxy plus a {@link Combatant}/{@link WeaponsTarget}
 * for the main thread's targeting and cameras.
 */
export class AiAircraftEntity implements Entity, Combatant, WeaponsTarget {

    readonly tags: string[] = [ENTITY_TAGS.AIRCRAFT];
    enabled = true;

    readonly faction: Faction;
    readonly simId: string;

    private readonly combatSim: CombatSimClient;
    private readonly flightModel: SimProxyFlightModel;

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

    // Mirrored render/animation state (authoritative values live in the worker).
    private gearDeployed = true;
    private flapsExtended = true;
    private health = 100;
    private readonly maxHealth = 100;

    constructor(
        models: ModelManager,
        def: FlyableAircraftDef,
        combatSim: CombatSimClient,
        simId: string,
        faction: Faction,
        spawn: AiAircraftSpawn,
        pilotOptions: AiPilotOptions = {},
    ) {
        this.faction = faction;
        this.simId = simId;
        this.combatSim = combatSim;
        this.flightModel = new SimProxyFlightModel(combatSim, simId, false);
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

        const gun: SimGunConfig = {
            muzzleVelocity: pilotOptions.bulletSpeed ?? 1000,
            roundsPerSecond: 20,
            damage: 8,
            ammo: 2400,
            muzzleOffset: [0, 0, 9],
            spread: 0.004,
        };
        // Register this aircraft with the worker before pushing its spawn state.
        this.combatSim.addAircraft({
            id: simId,
            faction,
            control: 'ai',
            kinematic: false,
            aircraftConfig: def.flight ?? defaultFm2Config,
            pilotOptions,
            hitRadius: DEFAULT_HIT_RADIUS,
            maxHealth: this.maxHealth,
            gun,
            spawn: this.toSimSpawn(spawn),
            enabled: true,
        });
        this.applyRenderSpawn(spawn);
    }

    respawn(spawn: AiAircraftSpawn): void {
        this.health = this.maxHealth;
        this.gearDeployed = !(spawn.airborne ?? false);
        this.flapsExtended = !(spawn.airborne ?? false);
        this.combatSim.respawn(this.simId, this.toSimSpawn(spawn));
        this.applyRenderSpawn(spawn);
        this.enabled = true;
    }

    private toSimSpawn(spawn: AiAircraftSpawn): SimAircraftSpawn {
        const airborne = spawn.airborne ?? false;
        this._q.setFromAxisAngle(UP, spawn.heading);
        return {
            position: spawn.position.toArray() as [number, number, number],
            quaternion: this._q.toArray() as [number, number, number, number],
            velocity: spawn.velocity ? (spawn.velocity.toArray() as [number, number, number]) : undefined,
            landed: !airborne,
            throttle: spawn.throttle ?? 0,
            airborne,
        };
    }

    /** Prime the render proxy so cameras don't jump before the first snapshot. */
    private applyRenderSpawn(spawn: AiAircraftSpawn): void {
        const airborne = spawn.airborne ?? false;
        this._q.setFromAxisAngle(UP, spawn.heading);
        this.flightModel.position = spawn.position;
        this.flightModel.quaternion = this._q;
        this.obj.position.copy(spawn.position);
        this.obj.quaternion.copy(this._q);
        if (spawn.velocity) {
            this.flightModel.velocityVector = spawn.velocity;
        }
        this.flightModel.setLanded(!airborne);
        this.gearDeployed = !airborne;
        this.flapsExtended = !airborne;
    }

    init(scene: Scene): void {
        // Nothing
    }

    update(delta: number): void {
        // Physics + AI run in the worker; mirror authoritative state for rendering.
        const gear = this.flightModel.getSimGearDeployed();
        if (gear !== null) {
            this.gearDeployed = gear;
        }
        const flaps = this.flightModel.getSimFlapsExtended();
        if (flaps !== null) {
            this.flapsExtended = flaps;
        }
        const health = this.flightModel.getSimHealth();
        if (health >= 0) {
            this.health = health;
        }
        this.obj.position.copy(this.flightModel.position);
        this.obj.quaternion.copy(this.flightModel.quaternion);
    }

    // --- Combatant -----------------------------------------------------------

    readPosition(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.flightModel.position); }
    readVelocity(target: THREE.Vector3): THREE.Vector3 { return target.copy(this.flightModel.velocityVector); }
    getHitRadius(): number { return DEFAULT_HIT_RADIUS; }

    isCrashed(): boolean {
        return this.flightModel.isCrashed();
    }

    isAlive(): boolean {
        return this.enabled && this.health > 0 && !this.isCrashed();
    }

    /** Damage is applied inside the worker; this is a no-op for the render proxy. */
    applyDamage(_amount: number): void {
        // No-op: authoritative health lives in the combat sim worker.
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
        const roll = this.flightModel.getCommandedAileron();
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
            pitchCmd: this.flightModel.getCommandedElevator(),
            rollCmd: this.flightModel.getCommandedAileron(),
            yawCmd: this.flightModel.getCommandedRudder(),
            thrLever: this.flightModel.getEffectiveThrottle(),
            gear: this.gearDeployed,
            flaps: this.flapsExtended,
            brake: false,
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

    // --- WeaponsTarget: designation from the player's target MFD --------------

    /** Render-space position, so the target camera tracks what is actually drawn. */
    get position(): THREE.Vector3 {
        return this.getDisplayPosition();
    }

    get localCenter(): THREE.Vector3 {
        return AI_TARGET_LOCAL_CENTER;
    }

    get maxSize(): number {
        return this.modelBody.model.maxSize;
    }

    get targetType(): string {
        return 'Enemy plane';
    }

    get targetLocation(): string {
        return 'Airborne';
    }

    get airborne(): boolean {
        return true;
    }

    get targetSpeedMps(): number {
        return this.flightModel.velocityVector.length();
    }

    get targetLoadFactorG(): number {
        return this.flightModel.getLoadFactorG();
    }

    get targetHealthFraction(): number {
        return this.health / this.maxHealth;
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
