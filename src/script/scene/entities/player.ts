import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { AudioClip } from '../../audio/audioSystem';
import { Palette, PaletteCategory } from "../../config/palettes/palette";
import { AIRBASE_RUNWAY, PLANE_DISTANCE_TO_GROUND, RUNWAY_HALF_LENGTH_M, TERRAIN_MODEL_SIZE, TERRAIN_SCALE } from '../../defs';
import { FlightModel } from '../../physics/model/flightModel';
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
import { GroundTargetEntity } from './groundTarget';
import { ControlAxis, ControlSurfaceConfig, FlyableAircraftDef } from './aircraftDef';


const ENGINE_LOWEST_VOLUME = 0.05; // [0,1]

const LANDING_GEAR_ANIM_DURATION = 3; // Seconds

const FLAPS_ANIM_DURATION = 2; // Seconds
const FLAPS_EXTENDED_ANGLE = Math.PI / 5; // Radians

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
    private hasWingtips = true;

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
    private afterburnerPanesBound = false;
    /** True when the body model comes from an imported (pack) mod. */
    private bodyIsImported = false;
    /** True when the def provides nozzle exits (afterburner glow + plumes). */
    private hasNozzles = false;

    private obj = new THREE.Object3D();

    private displayPosition = new THREE.Vector3();
    private displayQuaternion = new THREE.Quaternion();
    private displayVelocity = new THREE.Vector3();

    private pitch: number = 0; // [-1, 1]
    private roll: number = 0; // [-1, 1]
    private yaw: number = 0; // [-1, 1]
    private throttle: number = 0; // [0, 1]
    private wheelBrakes: boolean = false;

    private velocity: THREE.Vector3 = new THREE.Vector3(); // m/s

    private target: GroundTargetEntity | undefined;
    private targetIndex: number | undefined

    private _nightVision: boolean = false;
    private hudFocus: HUDFocusMode = HUDFocusMode.DISABLED;
    private autopilotEnabled: boolean = false;

    private _v = new THREE.Vector3();
    private _q = new THREE.Quaternion();

    readonly tags: string[] = [];

    enabled: boolean = true;
    private simulationPaused = false;
    private _exteriorView: boolean = false;
    private _showcaseMode = false;
    private showcasePosition = new THREE.Vector3(0, PLANE_DISTANCE_TO_GROUND, 0);
    private showcaseQuaternion = new THREE.Quaternion();

    // Heading increases CCW, radians
    constructor(models: ModelManager, def: FlyableAircraftDef, flightModel: FlightModel, private materials: SceneMaterialManager, inEngineAudio: AudioClip, outEngineAudio: AudioClip, position: THREE.Vector3, heading: number) {
        this.models = models;
        this.afterburnerCones = new AfterburnerCones(materials);
        this.wingtipTrails = new WingtipTrails(materials);

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
        this.bodyIsImported = isPackUrl(def.body);

        this.modelBody = new LODHelper(this.models.getModel(def.body, (_, model) => {
            // Operate on the model the loader hands back rather than this.modelBody:
            // for an already-cached body the listener fires synchronously, before
            // this.modelBody has been reassigned, so this.modelBody would still be
            // the previous aircraft.
            this.bindAfterburnerNozzles(model);
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

        const wingtips = def.fx?.wingtips ?? null;
        this.hasWingtips = !!wingtips;
        if (wingtips) {
            this.wingtipTrails = new WingtipTrails(this.materials, {
                left: new THREE.Vector3().fromArray(wingtips[0]),
                right: new THREE.Vector3().fromArray(wingtips[1]),
            });
        }

        // Auto-place afterburner exhaust plumes at the aircraft's own nozzle
        // exits (importer-provided); falls back to the built-in twin layout.
        const nozzles = def.fx?.nozzles ?? null;
        this.hasNozzles = !!(nozzles && nozzles.length > 0);
        this.afterburnerCones.setNozzles(
            nozzles ? nozzles.map(n => new THREE.Vector3().fromArray(n)) : null,
            def.fx?.nozzleRadius ?? null,
        );

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
        switch (control) {
            case 'pitch': return sign * this.pitch;
            case 'roll': return sign * this.roll;
            case 'yaw': return sign * this.yaw;
            case 'flaps': return sign * this.flapsProgressUnit;
            case 'slats': return sign * this.slatDeploymentUnit();
            case 'flaperonLeft':
                return this.flapsProgressUnit * -FLAPS_EXTENDED_ANGLE - (1.0 - this.flapsProgressUnit * 0.5) * this.roll;
            case 'flaperonRight':
                return this.flapsProgressUnit * FLAPS_EXTENDED_ANGLE - (1.0 - this.flapsProgressUnit * 0.5) * this.roll;
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
        this.updateAutopilot(delta);
        this.flightModel.setPitch(this.pitch);
        this.flightModel.setRoll(this.roll);
        this.flightModel.setYaw(this.yaw);
        this.flightModel.setThrottle(this.throttle);
        this.flightModel.setLandingGearDeployed(this.landingGearState === AircraftDeviceState.EXTENDED);
        this.flightModel.setFlapsExtended(this.flapsState === AircraftDeviceState.EXTENDED);
        this.flightModel.setWheelBrakes(this.wheelBrakes);
        this.flightModel.update(delta);
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
        if (this.hasWingtips) {
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
        this.roll = 0;
        this.yaw = 0;
        this.throttle = spawn?.throttle ?? 0;
        this.wheelBrakes = false;
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
        this.targetIndex = undefined;
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
        if (this.afterburnerPanesBound || this.modelBody.model.lod.length === 0) {
            return;
        }
        this.bindAfterburnerNozzles(this.modelBody.model);
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
        const f16Detents = this.flightModel.useF16ThrottleDetents();
        const lever = this.throttle;
        // An aircraft is afterburner-capable if the flight model runs the F-16
        // quadrant OR the model provides nozzle exits. The latter decouples the
        // effect from the (possibly inherited) flight config so imported jets
        // with plumes reliably light up regardless of what was flown before.
        const hasAfterburner = f16Detents || this.hasNozzles;

        this.afterburnerCones.update(
            lever,
            hasAfterburner,
            this.displayPosition,
            this.displayQuaternion,
        );
    }

    private toggleAutopilot() {
        this.autopilotEnabled = !this.autopilotEnabled;
    }

    private updateAutopilot(delta: number) {
        if (!this.autopilotEnabled) {
            return;
        }

        const pos = this.flightModel.position;
        const vel = this.flightModel.velocityVector;
        const runwayPos = new THREE.Vector3(AIRBASE_RUNWAY.x, AIRBASE_RUNWAY.y, AIRBASE_RUNWAY.z);

        // 1. Alignment (X and Yaw)
        const xDist = pos.x - runwayPos.x;
        // Simple P-controller for roll to correct X-offset
        let targetRoll = -xDist * 0.005;
        targetRoll = THREE.MathUtils.clamp(targetRoll, -Math.PI / 6, Math.PI / 6);
        this.roll = targetRoll;

        // 2. Glideslope (Y)
        // We are approaching from -Z towards +Z. Runway center is at runwayPos.z.
        // Runway start is at runwayPos.z - RUNWAY_HALF_LENGTH_M.
        const touchdownZ = runwayPos.z - RUNWAY_HALF_LENGTH_M + 300;
        const distToTouchdown = touchdownZ - pos.z;

        if (this.isLanded) {
            // We are on the ground, just brake and keep straight
            this.throttle = 0;
            this.wheelBrakes = true;
            this.pitch = 0;
            this.roll = 0;
            this.yaw = 0;
            return;
        }

        if (distToTouchdown < -500) {
            // We missed the runway or finished landing
            this.autopilotEnabled = false;
            return;
        }

        // Target altitude based on 3 degree glideslope (tan(3deg) approx 0.05)
        const targetAlt = Math.max(PLANE_DISTANCE_TO_GROUND + 1.0, distToTouchdown * 0.052);
        const altErr = pos.y - targetAlt;

        // 3. Pitch control
        // Simple PD-like controller for pitch
        let targetPitch = -altErr * 0.05 - vel.y * 0.1;
        
        // Flare logic
        if (pos.y < 15 && distToTouchdown < 400) {
            targetPitch = 0.15; // Nose up for flare
        }
        
        this.pitch = THREE.MathUtils.clamp(targetPitch, -0.3, 0.4);

        // 4. Throttle control
        const targetSpeed = 85; // m/s (approx 300 km/h)
        const speedErr = vel.length() - targetSpeed;
        this.throttle = THREE.MathUtils.clamp(this.throttle - speedErr * 0.05 * delta, 0, 1);

        // 5. Gear and Flaps
        if (pos.y < 400) {
            if (this.landingGearState === AircraftDeviceState.RETRACTED) {
                this.toggleLandingGear();
            }
            if (this.flapsState === AircraftDeviceState.RETRACTED) {
                this.toggleFlaps();
            }
        }
        
        // 6. Yaw control (keep heading 0)
        const worldDir = this.getDisplayWorldDirection(this._v);
        const heading = Math.atan2(worldDir.x, worldDir.z);
        this.yaw = THREE.MathUtils.clamp(-heading * 2.0, -0.5, 0.5);
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
            const lod = getLodLevel(this.displayPosition, this.obj.scale, targetWidth, camera, this.modelBody.model.maxSize);

            this.modelBody.addToRenderList(
                this.displayPosition, this.displayQuaternion, this.obj.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, lod);

            this.afterburnerCones.addToRenderList(SceneLayers.EntityVolumes, lists);

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

            if (this.hasWingtips && !this._showcaseMode) {
                this.wingtipTrails.addToRenderList(SceneLayers.EntityFX, lists, camera);
            }
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }

    setPitch(pitch: number) {
        this.pitch = pitch;
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

    setRoll(roll: number) {
        this.roll = roll;
    }

    setYaw(yaw: number) {
        this.yaw = yaw;
    }

    setWheelBrakes(applied: boolean) {
        this.wheelBrakes = applied;
    }

    setThrottle(throttle: number) {
        this.throttle = throttle;
    }

    adjustThrottle(step: number) {
        this.throttle = this.flightModel.adjustThrottleInput(this.throttle, step);
    }

    stepThrottle(direction: 1 | -1) {
        if (this.flightModel.useF16ThrottleDetents()) {
            this.throttle = this.flightModel.stepThrottleDetent(this.throttle, direction);
        } else {
            this.adjustThrottle(direction * 0.01 * 33);
        }
    }

    useF16ThrottleDetents(): boolean {
        return this.flightModel.useF16ThrottleDetents();
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

    get weaponsTarget(): GroundTargetEntity | undefined {
        return this.target;
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

    getDebugAcceleration(target: THREE.Vector3): THREE.Vector3 {
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

    private setupInput() {
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
                    case 'a': {
                        this.toggleAutopilot();
                        break;
                    }
                }
            }
        });
    }

    private pickTarget() {
        let index = this.targetIndex !== undefined ? this.targetIndex : -1;
        index++;
        if (index >= (this.scene?.countByTag(ENTITY_TAGS.TARGET) || 0)) {
            this.target = undefined;
            this.targetIndex = undefined;
        } else {
            this.target = this.scene?.entityAtByTag(ENTITY_TAGS.TARGET, index) as GroundTargetEntity | undefined;
            this.targetIndex = this.target !== undefined ? index : undefined;
        }
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
