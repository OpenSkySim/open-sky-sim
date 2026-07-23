import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { AudioClip } from '../../audio/audioSystem';
import { Palette, PaletteCategory } from "../../config/palettes/palette";
import { AIRBASE_RUNWAY, PITCH_STICK_AFT_UNITS, PITCH_STICK_FWD_UNITS, PLANE_DISTANCE_TO_GROUND, RUNWAY_HALF_LENGTH_M, TERRAIN_MODEL_SIZE, TERRAIN_SCALE } from '../../defs';
import { FlightModel } from '../../physics/model/flightModel';
import { FcsPitchLimiter } from '../../physics/fm2/fcs';
import { FlightSample } from '../../physics/flightRecorder';
import { LODHelper, getLodLevel } from '../../render/helpers';
import { CanvasPainter } from "../../render/screen/canvasPainter";
import { HUDFocusMode } from '../../state/gameDefs';
import { clamp, easeOutQuad, easeOutQuint, FORWARD, RIGHT, UP } from '../../utils/math';
import { Entity, ENTITY_TAGS } from "../entity";
import { SceneMaterialData, SceneMaterialManager } from '../materials/materials';
import { Model, ModelManager } from '../models/models';
import { isPackUrl } from '../../state/aircraftPack';
import { Scene, SceneLayers } from "../scene";
import { AfterburnerCones } from './afterburnerCones';
import { WingtipTrails } from './wingtipTrails';
import { AircraftForceVectors } from './aircraftForceVectors';
import { countBodyMeshVertices, deriveWingtipOriginsFromModel } from './wingtipOrigins';
import { WeaponsTarget } from './weaponsTarget';
import { ControlAxis, ControlSurfaceConfig, FlyableAircraftDef } from './aircraftDef';
import { Combatant, Faction } from '../../weapons/combatant';
import { CombatSimClient } from '../../physics/sim/combatSimClient';
import { PLAYER_SIM_ID } from '../../physics/sim/simIds';


const ENGINE_LOWEST_VOLUME = 0.05; // [0,1]

const LANDING_GEAR_ANIM_DURATION = 3; // Seconds

const FLAPS_ANIM_DURATION = 2; // Seconds
const FLAPS_EXTENDED_ANGLE = Math.PI / 5; // Radians

/**
 * Visible roll-deflection gains (fraction of a surface's hinge range at full
 * roll). Roll is tail-dominant (~80% differential stabilator / ~20% aileron),
 * so the stabilator shows the large, clearly visible roll deflection and the
 * flaperon only its small aileron share. Visual only — the physics split lives
 * in the FM2 config (taileronRollFraction / aileron max deflection).
 */
const ROLL_VIS_TAILERON = 0.6;
const ROLL_VIS_AILERON = 0.15;

/** Slats begin deploying above this absolute AoA (rad). */
const SLAT_AOA_ONSET_RAD = 10 * Math.PI / 180;
/** Slats reach full extension at this absolute AoA (rad). */
const SLAT_AOA_FULL_RAD = 18 * Math.PI / 180;

interface ControlSurfaceDescriptor {
    model: LODHelper;
    position: THREE.Vector3;
    axis: THREE.Vector3;
    value: () => number;
    range: number;
}

export enum AircraftDeviceState {
    RETRACTING,
    RETRACTED,
    EXTENDING,
    EXTENDED
}

export interface PlayerSpawnState {
    velocity?: THREE.Vector3;
    throttle?: number;
    airborne?: boolean;
}

export class PlayerEntity implements Entity {

    private scene: Scene | undefined;
    private readonly models: ModelManager;
    private modelBody!: LODHelper;
    private modelShadow!: LODHelper;
    private modelLandingGear: LODHelper | undefined;
    private shadowPosition = new THREE.Vector3();
    private shadowQuaternion = new THREE.Quaternion();
    private shadowScale = new THREE.Vector3();

    private controlSurfaceDescriptors: ControlSurfaceDescriptor[] = [];
    private cockpitOffset = new THREE.Vector3();

    private flightModel: FlightModel;

    private inEngineAudio: AudioClip;
    private outEngineAudio: AudioClip;
    private enginePlaying: boolean = false;
    private engineStarted: boolean = false;

    private landingGearState: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private landingGearProgress = LANDING_GEAR_ANIM_DURATION;

    private flapsState: AircraftDeviceState = AircraftDeviceState.EXTENDED;
    private flapsProgress = FLAPS_ANIM_DURATION;
    private flapsProgressUnit = 1.0;

    private afterburnerCones: AfterburnerCones;
    private wingtipTrails: WingtipTrails;
    private forceVectors: AircraftForceVectors;
    private _forceVectorsEnabled = false;
    private afterburnerPanesBound = false;
    private wingtipsReady = false;
    /** True when the body model comes from an imported (pack) mod. */
    private bodyIsImported = false;
    /** True when the def provides nozzle exits (afterburner glow + plumes). */
    private hasNozzles = false;
    /** Body-frame point where thrust is drawn (engine nozzle centroid). */
    private thrustOrigin = new THREE.Vector3();
    private hasThrustOrigin = false;

    private obj = new THREE.Object3D();

    private displayPosition = new THREE.Vector3();
    private displayQuaternion = new THREE.Quaternion();
    private displayVelocity = new THREE.Vector3();

    private pitch: number = 0; // [-1, 1] normalized command to flight model
    private pitchStickUnits: number = 0; // [-PITCH_STICK_FWD_UNITS, +PITCH_STICK_AFT_UNITS]
    private roll: number = 0; // [-1, 1]
    private yaw: number = 0; // [-1, 1]
    private throttle: number = 0; // [0, 1]
    private wheelBrakes: boolean = false;
    /** FBW AoA/g limiters on (true) or overridden off by the pilot (false). */
    private limitersEnabled: boolean = true;
    /** Active pitch AoA/g limiter strategy (keys 1/2/3). */
    private pitchLimiterMode: FcsPitchLimiter = FcsPitchLimiter.SOFT;

    private velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    private target: WeaponsTarget | undefined;

    private _nightVision: boolean = false;
    private hudFocus: HUDFocusMode = HUDFocusMode.DISABLED;
    private autopilotEnabled: boolean = false;

    /**
     * Shared combat sim client. The player's physics, gun and autopilot all run
     * inside its worker (id {@link PLAYER_SIM_ID}); this entity is a render proxy
     * plus input source. Undefined until the game wires combat up.
     */
    private combatSim: CombatSimClient | undefined;
    /** True once the sim has been told this aircraft carries a gun. */
    private hasGunFlag = false;
    private firing: boolean = false;
    private readonly maxHealth = 100;
    private health = this.maxHealth;
    readonly faction: Faction = Faction.PLAYER;

    private _v = new THREE.Vector3();
    private _q = new THREE.Quaternion();

    readonly tags: string[] = [ENTITY_TAGS.AIRCRAFT];

    enabled: boolean = true;
    private simulationPaused = false;
    private _exteriorView: boolean = false;
    private _showcaseMode = false;
    private showcasePosition = new THREE.Vector3(0, PLANE_DISTANCE_TO_GROUND, 0);
    private showcaseQuaternion = new THREE.Quaternion();
    private showcasePickLists: Map<string, THREE.Scene> = new Map([
        ['showcasePickFlats', new THREE.Scene()],
        ['showcasePickVolumes', new THREE.Scene()],
    ]);
    private showcasePickTmpPoint = new THREE.Vector3();
    private showcasePickTmpClosest = new THREE.Vector3();
    private showcasePickSphere = new THREE.Sphere();

    // Heading increases CCW, radians
    constructor(models: ModelManager, def: FlyableAircraftDef, flightModel: FlightModel, private materials: SceneMaterialManager, inEngineAudio: AudioClip, outEngineAudio: AudioClip, position: THREE.Vector3, heading: number) {
        this.models = models;
        this.afterburnerCones = new AfterburnerCones(materials);
        this.wingtipTrails = new WingtipTrails(materials);
        this.forceVectors = new AircraftForceVectors(materials);

        this.buildFromDef(def);

        this.flightModel = flightModel;
        this.flightModel.position = position;
        this.flightModel.quaternion = this._q.setFromAxisAngle(UP, heading);
        this.obj.position.copy(position);
        this.obj.quaternion.setFromAxisAngle(UP, heading);
        this.updateDisplayTransform();
        this.inEngineAudio = inEngineAudio;
        this.outEngineAudio = outEngineAudio;

        this.bindAfterburnerPaneMaterials();
    }

    /** (Re)build all visual models and control surfaces from an aircraft def. */
    private buildFromDef(def: FlyableAircraftDef): void {
        this.afterburnerPanesBound = false;
        this.wingtipsReady = false;
        this.bodyIsImported = isPackUrl(def.body);

        this.wingtipTrails = new WingtipTrails(this.materials);
        this.wingtipTrails.reset();

        this.modelBody = new LODHelper(this.models.getModel(def.body, (_, model) => {
            // Operate on the model the loader hands back rather than this.modelBody:
            // for an already-cached body the listener fires synchronously, before
            // this.modelBody has been reassigned, so this.modelBody would still be
            // the previous aircraft.
            this.bindAfterburnerNozzles(model);
            this.bindWingtipOrigins(model);
        }));
        this.modelShadow = new LODHelper(this.models.getModel(def.shadow), 5);

        this.modelLandingGear = undefined;
        if (def.gear) {
            const animated = def.gearAnimated ?? true;
            this.models.getModel(def.gear, (_, model) => {
                this.modelLandingGear = new LODHelper(model);
                if (animated) {
                    this.modelLandingGear.setPlaybackDuration(LANDING_GEAR_ANIM_DURATION);
                    this.modelLandingGear.setPlaybackPosition(1);
                }
            });
        }

        this.cockpitOffset.fromArray(def.cockpitOffset);

        // Auto-place afterburner exhaust plumes at the aircraft's own nozzle
        // exits (importer-provided); falls back to the built-in twin layout.
        const nozzles = def.fx?.nozzles ?? null;
        this.hasNozzles = !!(nozzles && nozzles.length > 0);
        this.afterburnerCones.setNozzles(
            nozzles ? nozzles.map(n => new THREE.Vector3().fromArray(n)) : null,
            def.fx?.nozzleRadius ?? null,
        );

        // Anchor the thrust force arrow at the nozzle exit(s): thrust physically
        // acts at the tailpipe, not the CG. Use the centroid when several exist.
        this.hasThrustOrigin = this.hasNozzles;
        if (nozzles && nozzles.length > 0) {
            this.thrustOrigin.set(0, 0, 0);
            for (const n of nozzles) {
                this.thrustOrigin.add(this._v.fromArray(n));
            }
            this.thrustOrigin.multiplyScalar(1 / nozzles.length);
        }

        this.controlSurfaceDescriptors = def.surfaces.map((s: ControlSurfaceConfig) => ({
            model: new LODHelper(this.models.getModel(s.model)),
            position: new THREE.Vector3().fromArray(s.pivot),
            axis: new THREE.Vector3().fromArray(s.axis),
            value: () => this.surfaceValue(s.control, s.sign),
            range: s.rangeRad,
        }));
    }

    /** Swap the visual aircraft at runtime (flight model swapped separately). */
    loadAircraft(def: FlyableAircraftDef): void {
        this.buildFromDef(def);
        this.bindAfterburnerPaneMaterials();
    }

    /** Normalized [0, 1] slat deployment from flaps and high angle of attack. */
    private slatDeploymentUnit(): number {
        const flapDeploy = this.flapsProgressUnit;
        const aoa = Math.abs(this.flightModel.getAngleOfAttack());
        const aoaDeploy = aoa <= SLAT_AOA_ONSET_RAD
            ? 0
            : clamp((aoa - SLAT_AOA_ONSET_RAD) / (SLAT_AOA_FULL_RAD - SLAT_AOA_ONSET_RAD), 0, 1);
        return Math.max(flapDeploy, aoaDeploy);
    }

    /** Map a surface's control binding to a normalized deflection value. */
    private surfaceValue(control: ControlAxis, sign: number): number {
        // FCS-mediated axes are driven by the FCS-commanded (limited) deflection —
        // NOT raw stick — so fly-by-wire shaping (AoA limiter, roll/yaw laws) is
        // visible on the model. The commanded values are exposed in the same
        // polarity/scale as the raw stick, so the existing per-surface sign/range
        // still render correctly. Flaps/slats are not FCS-mediated (kept as-is).
        //
        // Roll is a special case: the rate-command loop relaxes the aileron
        // command back toward neutral once the commanded roll rate is reached, so
        // in a SUSTAINED roll the surfaces would barely deflect even at full
        // stick. To keep the roll visible on the model we blend in the pilot's
        // roll demand and take the larger magnitude (both share +right polarity).
        const rollCmd = this.flightModel.getCommandedAileron();
        const rollDemand = this.rollInput;
        const roll = Math.abs(rollDemand) > Math.abs(rollCmd) ? rollDemand : rollCmd;
        const pitch = this.flightModel.getCommandedElevator();
        switch (control) {
            case 'pitch': return sign * pitch;
            case 'roll': return sign * roll;
            case 'yaw': return sign * this.flightModel.getCommandedRudder();
            case 'flaps': return sign * this.flapsProgressUnit;
            case 'slats': return sign * this.slatDeploymentUnit();
            // Flaperons: flap camber blended with the ailerons' SHARE of the roll.
            // Roll is tail-dominant (~20% aileron), so the flaperon shows only a
            // small roll deflection.
            case 'flaperonLeft':
                return this.flapsProgressUnit * -FLAPS_EXTENDED_ANGLE
                    - (1.0 - this.flapsProgressUnit * 0.5) * ROLL_VIS_AILERON * roll;
            case 'flaperonRight':
                return this.flapsProgressUnit * FLAPS_EXTENDED_ANGLE
                    - (1.0 - this.flapsProgressUnit * 0.5) * ROLL_VIS_AILERON * roll;
            // All-moving stabilator: pitch plus the DOMINANT differential
            // (taileron) roll deflection, so the tail-driven roll is clearly
            // visible. Left/right take opposite roll signs; a right roll raises
            // the right stabilator trailing edge (same sense as the right aileron).
            case 'stabilatorLeft':
                return sign * (pitch - ROLL_VIS_TAILERON * roll);
            case 'stabilatorRight':
                return sign * (pitch + ROLL_VIS_TAILERON * roll);
            default: return 0;
        }
    }

    /** Cockpit eye offset in the body frame (m). */
    getCockpitOffset(target: THREE.Vector3): THREE.Vector3 {
        return target.copy(this.cockpitOffset);
    }

    init(scene: Scene): void {
        this.scene = scene;
        this.setupInput();
    }

    update(delta: number): void {
        if (this.simulationPaused) {
            return;
        }
        // Physics + autopilot now run in the shared combat sim worker. For manual
        // flight we latch our control inputs onto the (proxy) flight model so the
        // client can pump them into the worker; the worker ignores them while its
        // in-worker autopilot is flying (control mode is flipped in toggleAutopilot).
        this.flightModel.setPitch(this.pitch);
        this.flightModel.setRoll(this.roll);
        this.flightModel.setYaw(this.yaw);
        this.flightModel.setThrottle(this.throttle);
        this.flightModel.setLandingGearDeployed(this.landingGearState === AircraftDeviceState.EXTENDED);
        this.flightModel.setFlapsExtended(this.flapsState === AircraftDeviceState.EXTENDED);
        this.flightModel.setWheelBrakes(this.wheelBrakes);
        this.flightModel.setLimitersEnabled(this.limitersEnabled);
        this.flightModel.setPitchLimiterMode(this.pitchLimiterMode);
        this.flightModel.update(delta);

        // Mirror sim-authoritative health; while the in-worker autopilot flies,
        // mirror its gear/flaps commands so the airframe animates correctly.
        const simHealth = this.flightModel.getSimHealth();
        if (simHealth >= 0) {
            this.health = simHealth;
        }
        if (this.autopilotEnabled) {
            const gear = this.flightModel.getSimGearDeployed();
            if (gear !== null) {
                this.setLandingGearDeployed(gear);
            }
            const flaps = this.flightModel.getSimFlapsExtended();
            if (flaps !== null) {
                this.setFlapsExtended(flaps);
            }
        }

        this.obj.position.copy(this.flightModel.position);
        this.obj.quaternion.copy(this.flightModel.quaternion);
        this.velocity.copy(this.flightModel.velocityVector);

        // Avoid flying out of bounds, wraps around
        const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        let isOutBounds = false;
        if (this.obj.position.x > terrainHalfSize) {
            this.obj.position.x = -terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.x < -terrainHalfSize) {
            this.obj.position.x = terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.z > terrainHalfSize) {
            this.obj.position.z = -terrainHalfSize;
            isOutBounds = true;
        }
        if (this.obj.position.z < -terrainHalfSize) {
            this.obj.position.z = terrainHalfSize;
            isOutBounds = true;
        }
        if (isOutBounds) {
            this.flightModel.position = this.obj.position;
        }

        this.updateAudio();
        this.bindAfterburnerPaneMaterials();
        this.updateAfterburnerPaneColors();
        this.updateDisplayTransform();
        if (this.wingtipsReady) {
            this.wingtipTrails.update(
                this.displayPosition,
                this.displayQuaternion,
                this.displayVelocity,
                !this.isLanded && !this.isCrashed,
            );
        }

        if (!this.isCrashed) {
            this.updateLandingGear(delta);
            this.updateFlaps(delta);
        }

        this.updateWeapons(delta);
    }

    private updateWeapons(_delta: number): void {
        // The gun is simulated in the combat worker; just latch the trigger.
        this.combatSim?.setFiring(PLAYER_SIM_ID, this.firing && !this.isCrashed && this.controlsEnabled);
    }

    updateDisplayTransform(): void {
        if (this._showcaseMode) {
            this.displayPosition.copy(this.showcasePosition);
            this.displayQuaternion.copy(this.showcaseQuaternion);
            this.displayVelocity.set(0, 0, 0);
            return;
        }
        this.flightModel.getRenderPosition(this.displayPosition);
        this.flightModel.getRenderQuaternion(this.displayQuaternion);
        this.flightModel.getRenderVelocity(this.displayVelocity);
    }

    reset(position: THREE.Vector3, heading: number, spawn?: PlayerSpawnState) {
        this.flightModel.reset();
        this.flightModel.position = position;
        this.flightModel.quaternion = this._q.setFromAxisAngle(UP, heading);
        this.obj.position.copy(position);
        this.obj.quaternion.setFromAxisAngle(UP, heading);

        const airborne = spawn?.airborne ?? false;
        if (spawn?.velocity) {
            this.velocity.copy(spawn.velocity);
            this.flightModel.velocityVector = spawn.velocity;
        } else {
            this.velocity.set(0, 0, 0);
        }
        this.flightModel.setLanded(!airborne);

        this.pitch = 0;
        this.pitchStickUnits = 0;
        this.roll = 0;
        this.yaw = 0;
        this.throttle = spawn?.throttle ?? 0;
        this.wheelBrakes = false;
        this.limitersEnabled = true;
        this.pitchLimiterMode = FcsPitchLimiter.SOFT;
        this.flightModel.setThrottle(this.throttle);
        if (airborne) {
            this.flightModel.syncEffectiveThrottle();
            this.flightModel.snapPhysicsState();
        }
        this.updateDisplayTransform();

        this.landingGearState = AircraftDeviceState.EXTENDED;
        this.modelLandingGear?.setPlaybackPosition(1);
        this.landingGearProgress = LANDING_GEAR_ANIM_DURATION;

        this.flapsState = AircraftDeviceState.EXTENDED;
        this.flapsProgress = FLAPS_ANIM_DURATION;
        this.flapsProgressUnit = 1.0;

        this.engineStarted = false;

        this.wingtipTrails.reset();

        this.target = undefined;

        this.health = this.maxHealth;
        this.firing = false;
    }

    private updateFlaps(delta: number) {
        if (this.flapsState === AircraftDeviceState.EXTENDING) {
            this.flapsProgress += delta;
            if (this.flapsProgress >= FLAPS_ANIM_DURATION) {
                this.flapsProgress = FLAPS_ANIM_DURATION;
                this.flapsProgressUnit = 1.0;
                this.flapsState = AircraftDeviceState.EXTENDED;
            }
        } else if (this.flapsState === AircraftDeviceState.RETRACTING) {
            this.flapsProgress -= delta;
            if (this.flapsProgress <= 0) {
                this.flapsProgress = 0;
                this.flapsProgressUnit = 0;
                this.flapsState = AircraftDeviceState.RETRACTED;
            }
        }
        if (this.flapsState === AircraftDeviceState.EXTENDING || this.flapsState === AircraftDeviceState.RETRACTING) {
            this.flapsProgressUnit = this.flapsProgress / FLAPS_ANIM_DURATION;
        }
    }

    private updateLandingGear(delta: number) {
        if (this.landingGearState === AircraftDeviceState.EXTENDING || this.landingGearState === AircraftDeviceState.RETRACTING) {
            this.modelLandingGear?.update(delta);
        }
        if (this.landingGearState === AircraftDeviceState.EXTENDING) {
            this.landingGearProgress += delta;
            if (this.landingGearProgress >= LANDING_GEAR_ANIM_DURATION) {
                this.landingGearProgress = LANDING_GEAR_ANIM_DURATION;
                this.landingGearState = AircraftDeviceState.EXTENDED;
            }
        } else if (this.landingGearState === AircraftDeviceState.RETRACTING) {
            this.landingGearProgress -= delta;
            if (this.landingGearProgress <= 0) {
                this.landingGearProgress = 0;
                this.landingGearState = AircraftDeviceState.RETRACTED;
            }
        }
    }

    /** Retry hook (from the update loop) once the body model has loaded. */
    private bindAfterburnerPaneMaterials() {
        if (this.modelBody.model.lod.length === 0) {
            return;
        }
        if (!this.afterburnerPanesBound) {
            this.bindAfterburnerNozzles(this.modelBody.model);
        }
        this.bindWingtipOrigins(this.modelBody.model);
    }

    private bindAfterburnerNozzles(model: Model) {
        if (this.afterburnerPanesBound) {
            return;
        }
        // Only imported (mod) jets get their nozzle glow removed; the built-in
        // aircraft keep their authored FX_FIRE nozzle interiors.
        if (this.bodyIsImported) {
            this.hideNozzleFireMeshes(model);
        }
        this.afterburnerPanesBound = true;
    }

    private bindWingtipOrigins(model: Model): void {
        if (this.wingtipsReady) {
            return;
        }
        const vertexCount = countBodyMeshVertices(model);
        if (vertexCount < 8) {
            return;
        }
        const derived = deriveWingtipOriginsFromModel(model);
        if (!derived) {
            return;
        }
        this.wingtipTrails.setTipOrigins(derived.left, derived.right);
        this.wingtipTrails.reset();
        this.wingtipsReady = true;
    }

    /**
     * Hide an imported jet's FX_FIRE nozzle-interior meshes (and any authored
     * FireCone FX) so the nozzle itself does not glow; the exhaust is represented
     * solely by the procedural afterburner plume.
     */
    private hideNozzleFireMeshes(model: Model) {
        for (const level of model.lod) {
            for (const obj of [...level.flats, ...level.volumes]) {
                if (!('isMesh' in obj) && !('isPoints' in obj)) {
                    continue;
                }
                const drawable = obj as THREE.Mesh | THREE.Points;
                const material = drawable.material as ShaderMaterial;
                const data = material.userData as SceneMaterialData;
                if (data.category === PaletteCategory.FX_FIRE) {
                    drawable.visible = false;
                }
            }
        }
    }

    private updateAfterburnerPaneColors() {
        const abDetents = this.flightModel.useAfterburnerThrottleDetents();
        const lever = this.throttle;
        // An aircraft is afterburner-capable if the flight model runs the
        // afterburner quadrant OR the model provides nozzle exits. The latter
        // decouples the effect from the (possibly inherited) flight config so
        // imported jets with plumes reliably light up regardless of what was
        // flown before.
        const hasAfterburner = abDetents || this.hasNozzles;

        this.afterburnerCones.update(
            lever,
            hasAfterburner,
            this.displayPosition,
            this.displayQuaternion,
        );
    }

    private toggleAutopilot() {
        this.autopilotEnabled = !this.autopilotEnabled;
        // Hand flying control to (or take it back from) the in-worker autopilot.
        this.combatSim?.setControlMode(PLAYER_SIM_ID, this.autopilotEnabled ? 'ai' : 'external');
    }

    private updateAudio() {
        const engineAudio = this._exteriorView ? this.outEngineAudio : this.inEngineAudio;

        if (this.isCrashed) {
            if (this.enginePlaying === true) {
                engineAudio.stop();
                this.enginePlaying = false;
            }
            return;
        }

        let throttle = this.flightModel.getThrottleAudioLevel();

        if (throttle > 0 && this.enginePlaying === false) {
            engineAudio.play();
            this.enginePlaying = true;
        }

        if (this.enginePlaying) {
            if (throttle > ENGINE_LOWEST_VOLUME) {
                this.engineStarted = true;
            }
            if (this.engineStarted) {
                throttle = Math.max(ENGINE_LOWEST_VOLUME, throttle);
            }
            const x = throttle;
            const factorRate = easeOutQuad(x);
            const factorGain = easeOutQuint(x);
            engineAudio.rate = 0.25 + 1.75 * factorRate;
            engineAudio.gain = 1.0 * factorGain;
        }
    }

    setFlightModel(flightModel: FlightModel) {
        flightModel.reset();
        flightModel.setCrashed(this.flightModel.isCrashed());
        flightModel.setLanded(this.flightModel.isLanded());
        this.flightModel = flightModel;
        this.flightModel.position = this.obj.position;
        this.flightModel.quaternion = this.obj.quaternion;
        this.flightModel.velocityVector = this.velocity;
        this.updateDisplayTransform();
        this.updateAfterburnerPaneColors();
    }

    set exteriorView(isExteriorView: boolean) {
        if (isExteriorView === this._exteriorView) return;

        this._exteriorView = isExteriorView;
        if (this.enginePlaying && !isExteriorView) {
            this.outEngineAudio.stop();
            this.inEngineAudio.play();
        }
        else if (this.enginePlaying && isExteriorView) {
            this.outEngineAudio.play();
            this.inEngineAudio.stop();
        }
    }

    get exteriorView(): boolean {
        return this._exteriorView;
    }

    get nightVision(): boolean {
        return this._nightVision;
    }

    get isLanded(): boolean {
        return this.flightModel.isLanded();
    }

    get isOnGround(): boolean {
        return this.flightModel.position.y <= PLANE_DISTANCE_TO_GROUND + 0.05;
    }

    get isCrashed(): boolean {
        return this.flightModel.isCrashed();
    }

    get isAutopilotEnabled(): boolean {
        return this.autopilotEnabled;
    }

    get forceVectorsEnabled(): boolean {
        return this._forceVectorsEnabled;
    }

    /** Toggle the debug per-part force-vector overlay (lift/drag/thrust/weight). */
    setForceVectorsEnabled(enabled: boolean): void {
        this._forceVectorsEnabled = enabled;
        this.flightModel.setForceVectorsRequested(enabled);
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {

        if (!this.isCrashed && !this._showcaseMode) {
            this.shadowPosition.copy(this.displayPosition).setY(0);
            this.shadowQuaternion.setFromUnitVectors(FORWARD, this.getDisplayWorldDirection(this._v).setY(0).normalize());
            const shadowLength = Math.max(0.2, this._v.copy(FORWARD).applyQuaternion(this.displayQuaternion).setY(0).length());
            const shadowWidth = Math.max(0.2, this._v.copy(RIGHT).applyQuaternion(this.displayQuaternion).setY(0).length());
            this.shadowScale.set(shadowWidth, 1, shadowLength);
            this.modelShadow.addToRenderList(
                this.shadowPosition, this.shadowQuaternion, this.shadowScale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists);
        }

        if (this._exteriorView) {
            this.updateDisplayTransform();
            this.updateAfterburnerPaneColors();
            const lodCount = this.modelBody.model.lod.length;
            const lod = lodCount === 0 ? 0 : Math.min(
                getLodLevel(this.displayPosition, this.obj.scale, targetWidth, camera, this.modelBody.model.maxSize),
                lodCount - 1,
            );

            this.modelBody.addToRenderList(
                this.displayPosition, this.displayQuaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);

            this.afterburnerCones.addToRenderList(SceneLayers.EntityVolumes, lists);

            if (this._forceVectorsEnabled) {
                const samples = this.flightModel.getForceVectors();
                if (this.hasThrustOrigin) {
                    for (const s of samples) {
                        if (s.part === 'engine') {
                            s.origin[0] = this.thrustOrigin.x;
                            s.origin[1] = this.thrustOrigin.y;
                            s.origin[2] = this.thrustOrigin.z;
                        }
                    }
                }
                this.forceVectors.update(this.displayPosition, this.displayQuaternion, samples);
                this.forceVectors.addToRenderList(SceneLayers.EntityVolumes, lists);
            }

            if (lod === 0) {
                const showLandingGear = this._showcaseMode
                    || this.landingGearState !== AircraftDeviceState.RETRACTED;
                if (showLandingGear) {
                    this.modelLandingGear?.addToRenderList(
                        this.displayPosition, this.displayQuaternion, this.obj.scale,
                        targetWidth, camera, palette,
                        SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
                }

                for (let i = 0; i < this.controlSurfaceDescriptors.length; i++) {
                    const d = this.controlSurfaceDescriptors[i];
                    const deflection = this._showcaseMode || this.isCrashed ? 0 : d.value() * d.range;

                    this._q.setFromAxisAngle(this._v.copy(d.axis).applyQuaternion(this.displayQuaternion), deflection).multiply(this.displayQuaternion);
                    this._v.copy(d.position).applyQuaternion(this.displayQuaternion).add(this.displayPosition);
                    d.model.addToRenderList(
                        this._v, this._q, this.obj.scale,
                        targetWidth, camera, palette,
                        SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
                }
            }

            if (!this._showcaseMode && this.wingtipsReady) {
                this.wingtipTrails.addToRenderList(SceneLayers.EntityFX, lists, camera);
            }
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }

    /**
     * Build temporary showcase render lists and return ray intersections against
     * the same mesh objects used by exterior rendering (LOD 0).
     */
    raycastShowcase(raycaster: THREE.Raycaster, targetWidth: number, camera: THREE.Camera, palette: Palette): THREE.Intersection[] {
        const flats = this.showcasePickLists.get('showcasePickFlats');
        const volumes = this.showcasePickLists.get('showcasePickVolumes');
        if (!flats || !volumes) {
            return [];
        }
        flats.clear();
        volumes.clear();

        this.modelBody.addToRenderList(
            this.displayPosition, this.displayQuaternion, this.obj.scale,
            targetWidth, camera, palette,
            'showcasePickFlats', 'showcasePickVolumes', this.showcasePickLists, 0);

        const showLandingGear = this._showcaseMode || this.landingGearState !== AircraftDeviceState.RETRACTED;
        if (showLandingGear) {
            this.modelLandingGear?.addToRenderList(
                this.displayPosition, this.displayQuaternion, this.obj.scale,
                targetWidth, camera, palette,
                'showcasePickFlats', 'showcasePickVolumes', this.showcasePickLists, 0);
        }

        for (let i = 0; i < this.controlSurfaceDescriptors.length; i++) {
            const d = this.controlSurfaceDescriptors[i];
            this._q.copy(this.displayQuaternion);
            this._v.copy(d.position).applyQuaternion(this.displayQuaternion).add(this.displayPosition);
            d.model.addToRenderList(
                this._v, this._q, this.obj.scale,
                targetWidth, camera, palette,
                'showcasePickFlats', 'showcasePickVolumes', this.showcasePickLists, 0);
        }

        const objects = [...flats.children, ...volumes.children];
        if (objects.length === 0) {
            return [];
        }
        const intersections = raycaster.intersectObjects(objects, true);
        if (intersections.length > 0) {
            return intersections;
        }

        // Fallback for thin/holed imported meshes: if the ray misses triangles,
        // select the nearest mesh whose world-space bounding sphere lies close
        // to the ray. This greatly improves hover reliability on models with
        // sparse geometry or cutouts.
        for (const root of objects) {
            root.updateMatrixWorld(true);
        }
        let bestObject: THREE.Object3D | null = null;
        let bestDistance = Infinity;
        for (const root of objects) {
            root.traverse((obj) => {
                if (!('isMesh' in obj)) {
                    return;
                }
                const mesh = obj as THREE.Mesh;
                const geometry = mesh.geometry;
                if (!geometry.boundingSphere) {
                    geometry.computeBoundingSphere();
                }
                if (!geometry.boundingSphere) {
                    return;
                }
                this.showcasePickSphere.copy(geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
                raycaster.ray.closestPointToPoint(this.showcasePickSphere.center, this.showcasePickTmpClosest);
                const toClosest = this.showcasePickTmpPoint.copy(this.showcasePickTmpClosest).sub(raycaster.ray.origin);
                const alongRay = toClosest.dot(raycaster.ray.direction);
                if (alongRay < 0) {
                    return;
                }
                const d2 = this.showcasePickTmpClosest.distanceToSquared(this.showcasePickSphere.center);
                const radius = this.showcasePickSphere.radius * 1.25;
                if (d2 > radius * radius) {
                    return;
                }
                if (alongRay < bestDistance) {
                    bestDistance = alongRay;
                    bestObject = mesh;
                }
            });
        }
        if (!bestObject) {
            return [];
        }
        this.showcasePickTmpPoint.copy(raycaster.ray.direction).multiplyScalar(bestDistance).add(raycaster.ray.origin);
        return [{
            distance: bestDistance,
            point: this.showcasePickTmpPoint.clone(),
            object: bestObject,
        } as THREE.Intersection];
    }

    setPitch(pitch: number) {
        this.pitchStickUnits = pitch >= 0
            ? pitch * PITCH_STICK_AFT_UNITS
            : pitch * PITCH_STICK_FWD_UNITS;
        this.pitch = this.normalizedPitchFromStickUnits(this.pitchStickUnits);
    }

    stepPitchStickUnits(delta: number) {
        this.pitchStickUnits = clamp(
            this.pitchStickUnits + delta,
            -PITCH_STICK_FWD_UNITS,
            PITCH_STICK_AFT_UNITS,
        );
        this.pitch = this.normalizedPitchFromStickUnits(this.pitchStickUnits);
    }

    private normalizedPitchFromStickUnits(units: number): number {
        return units >= 0
            ? units / PITCH_STICK_AFT_UNITS
            : units / PITCH_STICK_FWD_UNITS;
    }

    setSimulationPaused(paused: boolean): void {
        this.simulationPaused = paused;
    }

    setShowcaseMode(enabled: boolean): void {
        if (enabled === this._showcaseMode) {
            return;
        }
        this._showcaseMode = enabled;
        if (enabled) {
            this.showcasePosition.set(0, PLANE_DISTANCE_TO_GROUND, 0);
            this.showcaseQuaternion.identity();
        }
        this.updateDisplayTransform();
    }

    get showcaseMode(): boolean {
        return this._showcaseMode;
    }

    get controlsEnabled(): boolean {
        return !this.simulationPaused;
    }

    /** True while a keyboard flight-stick key (pitch/roll/yaw) is physically held. */
    flightStickKeysHeld = false;

    setRoll(roll: number) {
        this.roll = roll;
    }

    setYaw(yaw: number) {
        this.yaw = yaw;
    }

    setWheelBrakes(applied: boolean) {
        this.wheelBrakes = applied;
    }

    /** Drive the gear to a target state (used by the AI pilot). */
    setLandingGearDeployed(deployed: boolean) {
        const isDeployed = this.landingGearState === AircraftDeviceState.EXTENDED
            || this.landingGearState === AircraftDeviceState.EXTENDING;
        if (deployed !== isDeployed) {
            this.toggleLandingGear();
        }
    }

    /** Drive the flaps to a target state (used by the AI pilot). */
    setFlapsExtended(extended: boolean) {
        const isExtended = this.flapsState === AircraftDeviceState.EXTENDED
            || this.flapsState === AircraftDeviceState.EXTENDING;
        if (extended !== isExtended) {
            this.toggleFlaps();
        }
    }

    /** Wire the shared combat sim client (physics/gun/autopilot run in its worker). */
    setCombatSimClient(client: CombatSimClient) {
        this.combatSim = client;
    }

    /** Mark that this aircraft carries a gun (config lives in the sim descriptor). */
    setHasGun(hasGun: boolean) {
        this.hasGunFlag = hasGun;
    }

    // --- Combatant ---------------------------------------------------------

    readPosition(target: THREE.Vector3): THREE.Vector3 {
        return target.copy(this.obj.position);
    }

    readVelocity(target: THREE.Vector3): THREE.Vector3 {
        return target.copy(this.velocity);
    }

    getHitRadius(): number {
        return 10;
    }

    isAlive(): boolean {
        return !this.isCrashed && this.health > 0;
    }

    applyDamage(amount: number): void {
        if (this.health <= 0) {
            return;
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            // Flameout only; ground impact still sets crashed via the flight model.
            this.flightModel.setThrottle(0);
            this.flightModel.syncEffectiveThrottle();
        }
    }

    get healthFraction(): number {
        return this.health / this.maxHealth;
    }

    get gunAmmo(): number {
        const ammo = this.flightModel.getSimAmmo();
        return ammo >= 0 ? ammo : 0;
    }

    get hasGun(): boolean {
        return this.hasGunFlag;
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
    }

    adjustThrottle(step: number) {
        this.throttle = this.flightModel.adjustThrottleInput(this.throttle, step);
    }

    stepThrottle(direction: 1 | -1) {
        if (this.flightModel.useAfterburnerThrottleDetents()) {
            this.throttle = this.flightModel.stepThrottleDetent(this.throttle, direction);
        } else {
            this.adjustThrottle(direction * 0.01 * 33);
        }
    }

    useAfterburnerThrottleDetents(): boolean {
        return this.flightModel.useAfterburnerThrottleDetents();
    }

    isInThrottleAbDetentBand(): boolean {
        return this.flightModel.isInThrottleAbDetentBand(this.throttle);
    }

    set position(p: THREE.Vector3) {
        this.obj.position.copy(p);
    }

    get position() {
        return this.obj.position;
    }

    set quaternion(q: THREE.Quaternion) {
        this.obj.quaternion.copy(q);
    }

    get quaternion() {
        return this.obj.quaternion;
    }

    getDisplayPosition(): THREE.Vector3 {
        return this.displayPosition;
    }

    getDisplayQuaternion(): THREE.Quaternion {
        return this.displayQuaternion;
    }

    getDisplayVelocity(): THREE.Vector3 {
        return this.displayVelocity;
    }

    getDisplayWorldDirection(v: THREE.Vector3): THREE.Vector3 {
        return v.copy(FORWARD).applyQuaternion(this.displayQuaternion);
    }

    getDisplayWorldUp(v: THREE.Vector3): THREE.Vector3 {
        return v.copy(UP).applyQuaternion(this.displayQuaternion);
    }

    getDisplayWorldRight(v: THREE.Vector3): THREE.Vector3 {
        return v.copy(RIGHT).applyQuaternion(this.displayQuaternion);
    }

    getWorldDirection(v: THREE.Vector3): THREE.Vector3 {
        return this.obj.getWorldDirection(v);
    }

    getWorldUp(v: THREE.Vector3): THREE.Vector3 {
        return v
            .copy(UP)
            .applyQuaternion(this.obj.quaternion);
    }

    getWorldRight(v: THREE.Vector3): THREE.Vector3 {
        return v
            .copy(RIGHT)
            .applyQuaternion(this.obj.quaternion);
    }

    get throttleUnit(): number {
        return this.throttle;
    }

    get pitchInput(): number {
        return this.pitch;
    }

    get pitchStickUnitsValue(): number {
        return this.pitchStickUnits;
    }

    get commandedElevator(): number {
        return this.flightModel.getCommandedElevator();
    }

    /** Max nose-up / nose-down elevator-command clamp bounds (same +nose-up
     *  polarity as the pitch input), ±1 with the FBW limiters OFF. */
    get elevatorLimitHigh(): number {
        return this.flightModel.getElevatorCommandLimitHigh();
    }

    get elevatorLimitLow(): number {
        return this.flightModel.getElevatorCommandLimitLow();
    }

    get rollInput(): number {
        return this.roll;
    }

    get yawInput(): number {
        return this.yaw;
    }

    get rawSpeed(): number {
        return this.velocity.length();
    }

    get velocityVector(): THREE.Vector3 {
        return this.velocity;
    }

    get weaponsTarget(): WeaponsTarget | undefined {
        return this.target;
    }

    /** Designate a weapons target (or clear with undefined). */
    setWeaponsTarget(target: WeaponsTarget | undefined): void {
        this.target = target;
    }

    get stallStatus(): number {
        return this.flightModel.getStallStatus();
    }

    get angleOfAttack(): number {
        return this.flightModel.getAngleOfAttack();
    }

    get loadFactorG(): number {
        return this.flightModel.getLoadFactorG();
    }

    getAccelerationWorld(target: THREE.Vector3): THREE.Vector3 {
        return this.flightModel.getAccelerationWorld(target);
    }

    get engineThrustKn(): number {
        return this.flightModel.getEngineThrustKn();
    }

    /** Snapshot of pilot commands and rigid-body state for the flight recorder. */
    captureFlightSample(): FlightSample {
        return {
            pitchCmd: this.pitch,
            rollCmd: this.roll,
            yawCmd: this.yaw,
            thrLever: this.throttle,
            gear: this.landingGearState === AircraftDeviceState.EXTENDED,
            flaps: this.flapsState === AircraftDeviceState.EXTENDED,
            brake: this.wheelBrakes,
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

    get throttleHudText(): string {
        return this.flightModel.getThrottleHudText();
    }

    get hudFocusMode(): HUDFocusMode {
        return this.hudFocus;
    }

    get landingGear(): AircraftDeviceState {
        return this.landingGearState;
    }

    get flaps(): AircraftDeviceState {
        return this.flapsState;
    }

    get wheelBrakesApplied(): boolean {
        return this.wheelBrakes;
    }

    get fcsLimitersEnabled(): boolean {
        return this.limitersEnabled;
    }

    /** Active pitch AoA/g limiter strategy (keys 1/2/3). */
    get fcsPitchLimiterMode(): FcsPitchLimiter {
        return this.pitchLimiterMode;
    }

    private setupInput() {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === ' ' || event.code === 'Space') {
                if (!this.isCrashed && this.controlsEnabled) {
                    this.firing = true;
                    event.preventDefault();
                }
            }
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === ' ' || event.code === 'Space') {
                this.firing = false;
            }
        });
        document.addEventListener('blur', () => {
            this.firing = false;
        });

        document.addEventListener('keypress', (event: KeyboardEvent) => {
            if (!this.isCrashed && this.controlsEnabled) {
                switch (event.key) {
                    case 't': {
                        this.pickTarget();
                        break;
                    }
                    case 'i': {
                        this._nightVision = !this._nightVision;
                        break;
                    }
                    case 'h': {
                        this.hudFocus += 1;
                        this.hudFocus %= HUDFocusMode._LENGTH;
                        break;
                    }
                    case 'f': {
                        this.toggleFlaps();
                        break;
                    }
                    case 'g': {
                        this.toggleLandingGear();
                        break;
                    }
                    case 'l': {
                        this.toggleLimiters();
                        break;
                    }
                    case 'a': {
                        this.toggleAutopilot();
                        break;
                    }
                    case '1': {
                        this.pitchLimiterMode = FcsPitchLimiter.SOFT;
                        break;
                    }
                    case '2': {
                        this.pitchLimiterMode = FcsPitchLimiter.PREDICTIVE;
                        break;
                    }
                    case '3': {
                        this.pitchLimiterMode = FcsPitchLimiter.SMOOTH;
                        break;
                    }
                }
            }
        });
    }

    private pickTarget() {
        const candidates = this.collectTargets();
        if (candidates.length === 0) {
            this.target = undefined;
            return;
        }
        const current = this.target !== undefined ? candidates.indexOf(this.target) : -1;
        const next = current + 1;
        this.target = next >= candidates.length ? undefined : candidates[next];
    }

    /**
     * The designatable weapons targets, in cycling order: the fixed ground
     * installations followed by any live airborne enemy aircraft.
     */
    private collectTargets(): WeaponsTarget[] {
        const result: WeaponsTarget[] = [];
        if (!this.scene) {
            return result;
        }
        for (const entity of this.scene.listByTag(ENTITY_TAGS.TARGET)) {
            result.push(entity as unknown as WeaponsTarget);
        }
        for (const entity of this.scene.listByTag(ENTITY_TAGS.AIRCRAFT)) {
            if (entity === this) {
                continue;
            }
            const combatant = entity as unknown as Combatant;
            if (combatant.faction === Faction.ENEMY && combatant.isAlive()) {
                result.push(entity as unknown as WeaponsTarget);
            }
        }
        return result;
    }

    private toggleLimiters() {
        this.limitersEnabled = !this.limitersEnabled;
    }

    private toggleFlaps() {
        if (this.flapsState === AircraftDeviceState.EXTENDED || this.flapsState === AircraftDeviceState.EXTENDING) {
            this.flapsState = AircraftDeviceState.RETRACTING;
        } else {
            this.flapsState = AircraftDeviceState.EXTENDING;
        }
    }

    private toggleLandingGear() {
        if (this.landingGearState === AircraftDeviceState.EXTENDED || this.landingGearState === AircraftDeviceState.EXTENDING) {
            if (!this.isLanded) {
                if (this.landingGearState === AircraftDeviceState.EXTENDED) {
                    this.modelLandingGear?.setPlaybackPosition(1.0);
                }
                this.landingGearState = AircraftDeviceState.RETRACTING;
                this.modelLandingGear?.playBackwards();
            }
        } else {
            if (this.landingGearState === AircraftDeviceState.RETRACTED) {
                this.modelLandingGear?.setPlaybackPosition(0.0);
            }
            this.landingGearState = AircraftDeviceState.EXTENDING;
            this.modelLandingGear?.play();
        }
    }
}
