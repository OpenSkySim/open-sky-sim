import * as THREE from 'three';
import { AudioSystem } from '../audio/audioSystem';
import { ConfigService } from '../config/configService';
import { CGAMidnightPalette } from '../config/palettes/cga-midnight';
import { CGANoonPalette } from '../config/palettes/cga-noon';
import { EGAMidnightPalette } from '../config/palettes/ega-midnight';
import { EGANoonPalette } from '../config/palettes/ega-noon';
import { Palette, PaletteCategory, PaletteColor } from '../config/palettes/palette';
import { SVGAMidnightPalette } from '../config/palettes/svga-midnight';
import { SVGANoonPalette } from '../config/palettes/svga-noon';
import { ShowcasePalette } from '../config/palettes/showcase';
import { HDMidnightPalette } from '../config/palettes/hd-midnight';
import { HDNoonPalette } from '../config/palettes/hd-noon';
import { VGAMidnightPalette } from '../config/palettes/vga-midnight';
import { VGANoonPalette } from '../config/palettes/vga-noon';
import { DisplayResolution, getDisplayResolutionSize } from '../config/profiles/profile';
import { loadSettings, SpawnMode, updateSettings } from '../config/settingsStorage';
import { KernelRenderTask, KernelUpdateTask } from '../core/kernel';
import { FlightRecorder } from '../physics/flightRecorder';
import { fm2GroundRestHeight } from '../physics/fm2/fm2AircraftConfig';
import { AIRBASE_RUNWAY as AIRBASE_RUNWAY_RAW, APPROACH_ALTITUDE_M, APPROACH_FINAL_DISTANCE_M, APPROACH_SPEED_MPS, COCKPIT_FAR, COCKPIT_FOV, HI_H_RES, HI_V_RES, HIGH_ALTITUDE_M, H_RES, isTelemetryGraphKey, LO_H_RES, LO_V_RES, PLANE_DISTANCE_TO_GROUND, RUNWAY_HALF_LENGTH_M, SPACE_ALTITUDE_M, V_RES } from '../defs';
import { terrainMaxZoomForAltitudeM } from '../terrain/lod';
import { Renderer, RenderLayer, RenderTargetType } from "../render/renderer";
import { SceneCamera } from '../scene/cameras/camera';
import { DebrisField } from '../scene/entities/debrisField';
import { DamageSmokeField } from '../scene/entities/damageSmokeField';
import { GroundTargetEntity } from '../scene/entities/groundTarget';
import { ArrestorCablesEntity } from '../scene/entities/arrestorCablesEntity';
import { ARRESTOR_CARRIER_ORIGIN, ArrestorCarrierPose } from '../scene/entities/arrestorCables';
import { ShipWakeEntity } from '../scene/entities/shipWake';
import { CockpitEntity, CockpitMFD1X, CockpitMFD1Y, CockpitMFD2X, CockpitMFD2Y, CockpitMFDSize } from '../scene/entities/overlay/cockpit';
import { ExteriorDataEntity } from '../scene/entities/overlay/exteriorData';
import { HUDEntity } from '../scene/entities/overlay/hud';
import { PerfHudEntity } from '../scene/entities/overlay/perfHud';
import { TelemetryGraph } from '../scene/entities/overlay/telemetryGraph';
import { TelemetryGraphWindow } from '../scene/entities/overlay/telemetryGraphWindow';
import { PlayerEntity, PlayerSpawnState } from '../scene/entities/player';
import {
    bakeCollisionMeshFromModel,
    createCarrierMeshCollider,
    sampleCarrierMeshSurfaceYMax,
    CarrierMeshCollider,
} from '../scene/entities/carrierDeck';
import {
    createSkiJumpCollider, sampleSkiJumpSurfaceYMax, SkiJumpCollider,
} from '../scene/entities/skiJump';
import { SurfacePadCollider, sampleSurfacePadYMax } from '../scene/entities/surfacePad';
import { SceneryField, SceneryFieldSettings } from '../scene/entities/sceneryField';
import { SimpleEntity } from '../scene/entities/simpleEntity';
import { StaticSceneryEntity } from '../scene/entities/staticScenery';
import { Entity } from '../scene/entity';
import { SceneMaterialManager } from "../scene/materials/materials";
import { ModelManager } from "../scene/models/models";
import { Scene, SceneLayers } from '../scene/scene';
import { updateTargetCamera } from '../scene/utils';
import { assertIsDefined } from '../utils/asserts';
import { clamp, FORWARD, RIGHT, UP, toDegrees } from '../utils/math';
import { CameraUpdater } from './cameraUpdaters/cameraUpdater';
import { CockpitFrontCameraUpdater } from './cameraUpdaters/cockpitFrontCameraUpdater';
import { CrashedCameraUpdater } from './cameraUpdaters/crashedCameraUpdater';
import { ExteriorFrontBehindCameraUpdater, ExteriorViewHeading } from './cameraUpdaters/exteriorFrontBehindCameraUpdater';
import { AiExteriorCameraUpdater, AI_SPAWN_DISTANCE_M } from './cameraUpdaters/aiExteriorCameraUpdater';
import { ExteriorSideCameraUpdater, ExteriorViewSide } from './cameraUpdaters/exteriorSideCameraUpdater';
import { TargetFromCameraUpdater } from './cameraUpdaters/targetFromCameraUpdater';
import { TargetToCameraUpdater } from './cameraUpdaters/targetToCameraUpdater';
import { StaticModelCameraUpdater } from './cameraUpdaters/staticModelCameraUpdater';
import { ShowcaseCameraUpdater } from './cameraUpdaters/showcaseCameraUpdater';
import { restoreMainCameraParameters } from './stateUtils';
import { forEachStaticAircraftSlot, STATIC_MODEL_VIEWS } from './staticModelViews';
import { SpawnMenuEntity } from '../scene/entities/overlay/spawnMenu';
import { setBootProgress } from '../osd/bootProgress';
import { SpawnPanel } from '../osd/spawnPanel';
import { AircraftRegistry, buildF22Def, groupAircraftByModel } from './aircraftRegistry';
import { FlyableAircraftDef } from '../scene/entities/aircraftDef';
import { flightConfigWithArrestorHook } from '../scene/entities/arrestorCables';
import { Obstacle, Runway } from '../ai/worldQuery';
import { AiFlightPhase, AiPilotOptions, AiSkillLevel } from '../ai/aiPilot';
import { AiAircraftEntity } from '../scene/entities/aiAircraft';
import { WeaponsField } from '../scene/entities/weaponsField';
import { Faction } from '../weapons/combatant';
import { CombatSimClient } from '../physics/sim/combatSimClient';
import { SimProxyFlightModel } from '../physics/model/simProxyFlightModel';
import { serializeWorld, defaultArrestorCableField, sampleHeightGrid } from '../physics/sim/serializedWorld';
import { SimAircraftDesc, SimAircraftSpawn, SimGunConfig } from '../physics/sim/simTypes';
import { PLAYER_SIM_ID, aiSimId } from '../physics/sim/simIds';
import { AiPilotModels } from './gameDefs';
import {
    DEFAULT_TERRAIN_URL, SPACE_SKY_ALTITUDE_M, TerrainEntity, cameraFarForAltitudeM,
    isTerrainWireframe, loadTerrainManifest, setTerrainWireframe,
} from '../terrain';
import { OsmMapEntity } from '../scene/entities/osmMap';
import {
    AIRBASE_LOCAL, TARGET_LOCAL, airbaseOffset, PLAY_ORIGIN, SCENERY_SURFACE_EPS_M,
} from './worldLayout';

/** How many AI opponents the combat sim spawns. */
/** Loose cloud deck: base altitude and per-puff undulation, well under HIGH_ALTITUDE_M. */
const CLOUD_BASE_ALTITUDE_M = 1400;
const CLOUD_ALTITUDE_VARIATION_M = 500;
/** High-altitude cirrus streak layer, just under HIGH_ALTITUDE_M — a separate, higher band above the cumulus deck. */
const CIRRUS_BASE_ALTITUDE_M = 9200;
const CIRRUS_ALTITUDE_VARIATION_M = 400;

const AI_OPPONENT_COUNT = 1;
/** Seconds the AI flies straight before engaging. */
const AI_STRAIGHT_DURATION_SEC = 1;
/** Spawn distance ahead of the player when a same-heading merge begins (m). */
const AI_ENGAGE_SPAWN_DISTANCE_M = 300;
/** Spawn distance ahead of the player for a head-on merge (m). */
const AI_HEADON_SPAWN_DISTANCE_M = 3000;

/** Player/AI hit-sphere radius (m) — shared airframe. */
const PLAYER_HIT_RADIUS_M = 10;
/** Shared boresight gun for player and AI (same FM/FX airframe). */
const PLAYER_GUN: SimGunConfig = {
    muzzleVelocity: 1000,
    roundsPerSecond: 20,
    damage: 8,
    ammo: 2400,
    muzzleOffset: [0, 0, 9],
    spread: 0.003,
};

/** Legacy shipped packs kept out of the spawn menu when present in dist/. */
const EXCLUDED_PACK_IDS = new Set(['a4e', 'f16']);


const MAIN_RENDER_TARGET_LO = 'MAIN_RENDER_TARGET_LO';
const CANVAS_RENDER_TARGET_LO = 'CANVAS_RENDER_TARGET_LO';
const MAIN_RENDER_TARGET_HI = 'MAIN_RENDER_TARGET_HI';
const CANVAS_RENDER_TARGET_HI = 'CANVAS_RENDER_TARGET_HI';
const MAIN_RENDER_TARGET_HD = 'MAIN_RENDER_TARGET_HD';
const CANVAS_RENDER_TARGET_HD = 'CANVAS_RENDER_TARGET_HD';
const WEAPONSTARGET_RENDER_TARGET_LO = 'WEAPONSTARGET_RENDER_TARGET_LO';
const MAP_RENDER_TARGET_LO = 'MAP_RENDER_TARGET_LO';
const WEAPONSTARGET_RENDER_TARGET_HI = 'WEAPONSTARGET_RENDER_TARGET_HI';
const MAP_RENDER_TARGET_HI = 'MAP_RENDER_TARGET_HI';
const WEAPONSTARGET_RENDER_TARGET_HD = 'WEAPONSTARGET_RENDER_TARGET_HD';
const MAP_RENDER_TARGET_HD = 'MAP_RENDER_TARGET_HD';

const AIRBASE_RUNWAY = new THREE.Vector3(AIRBASE_RUNWAY_RAW.x, AIRBASE_RUNWAY_RAW.y, AIRBASE_RUNWAY_RAW.z);
const RUNWAY_SPAWN_INSET_M = 120;
/** Paved runway strip only — biome patches fill the shoulders beside it. */
const RUNWAY_STRIP_HALF_WIDTH = 75;
const RUNWAY_STRIP_HALF_LENGTH = RUNWAY_HALF_LENGTH_M + 150;
/** Half-width of the physical pavement, matching assets/runway01.gltf (±40 m). */
const RUNWAY_PAVEMENT_HALF_WIDTH = 40;
/** Skirt around pad edges blending down to the surrounding ground — no hard vertical lip. */
const SURFACE_PAD_FEATHER_M = 15;
/** Hangar-ground pavement half extent: lib:pavement unit square × scale 200. */
const HANGAR_GROUND_HALF_M = 100;
/** Kuznetsov carrier origin — open water (matches {@link ARRESTOR_CARRIER_ORIGIN}). */
const KUZ_POSITION = new THREE.Vector3(
    ARRESTOR_CARRIER_ORIGIN.x,
    ARRESTOR_CARRIER_ORIGIN.y,
    ARRESTOR_CARRIER_ORIGIN.z,
);
const KUZ_IDENTITY_QUAT = new THREE.Quaternion();
/**
 * Carrier hull AABB from `assets/kuz.glb` (approx).
 * Used for approach spawn alignment along the deck axis.
 */
const KUZ_HULL = {
    minX: -34.33,
    maxX: 43.83,
    minZ: -177.88,
    maxZ: 124.28,
};
/** Lateral centreline of the carrier deck relative to {@link KUZ_POSITION}. */
const KUZ_DECK_MID_X = (KUZ_HULL.minX + KUZ_HULL.maxX) * 0.5;
/** Approximate flat-deck height for approach altitude planning (m). */
const CARRIER_DECK_Y = 14;
/** Final approach distance to the carrier stern threshold (m). */
const CARRIER_APPROACH_FINAL_DISTANCE_M = 2500;
/** Carrier final altitude (m); ~3° glide to the deck over {@link CARRIER_APPROACH_FINAL_DISTANCE_M}. */
const CARRIER_APPROACH_ALTITUDE_M = CARRIER_DECK_Y + 130;
const PLAYER_STARTING_HEADING = 0;
/** Land approach final distance — keep the airport in view at spawn. */
const LAND_APPROACH_FINAL_M = 3500;
/** Boot / respawn DEM + mesh preload radius around the plane (m). */
const TERRAIN_PRELOAD_RADIUS_M = 30000;
/** High-alt seed: fine DEM zoom over a wider disk than approach (m). */
const HIGH_ALT_PRELOAD_RADIUS_M = 50000;
/** Outer coarse ring so the forward horizon is not an empty void (m). */
const HIGH_ALT_OUTER_RADIUS_M = 120000;
const HIGH_ALT_OUTER_ZOOM = 8;
/** Nominal approach spawn (Y updated at flight start from DEM). */
const PLAYER_STARTING_POSITION = new THREE.Vector3(
    AIRBASE_RUNWAY.x,
    APPROACH_ALTITUDE_M,
    AIRBASE_RUNWAY.z - LAND_APPROACH_FINAL_M,
);
const PLAYER_LAND_POSITION = new THREE.Vector3(
    AIRBASE_RUNWAY.x,
    PLANE_DISTANCE_TO_GROUND,
    AIRBASE_RUNWAY.z - RUNWAY_HALF_LENGTH_M + RUNWAY_SPAWN_INSET_M,
);
const PLAYER_LAND_HEADING = PLAYER_STARTING_HEADING;
const PLAYER_LAND_SPAWN: PlayerSpawnState = {
    throttle: 0,
    airborne: false,
};
const PLAYER_APPROACH_SPAWN: PlayerSpawnState = {
    velocity: FORWARD.clone().applyAxisAngle(UP, PLAYER_STARTING_HEADING).multiplyScalar(APPROACH_SPEED_MPS),
    throttle: 0.38,
    airborne: true,
};
const PLAYER_SPACE_SPAWN: PlayerSpawnState = {
    velocity: FORWARD.clone().applyAxisAngle(UP, PLAYER_STARTING_HEADING).multiplyScalar(APPROACH_SPEED_MPS),
    throttle: 1,
    airborne: true,
};

/** Kuznetsov cruise speed (45 km/h → m/s), bow heading world −Z at identity. */
const CARRIER_SPEED_KMH = 45;
const CARRIER_SPEED_MPS = CARRIER_SPEED_KMH / 3.6;

/** Carrier landing: final toward the ski-jump bow along -Z. */
const PLAYER_CARRIER_HEADING = Math.PI;

/** On-deck takeoff: 120 m aft of the bow tip, facing the ski jump (-Z). */
const CARRIER_TAKEOFF_FROM_BOW_M = 120;
const PLAYER_CARRIER_TAKEOFF_HEADING = Math.PI;
const PLAYER_CARRIER_TAKEOFF_LOCAL_Z = KUZ_HULL.minZ + CARRIER_TAKEOFF_FROM_BOW_M;

enum PlayerViewState {
    CRASHED,
    COCKPIT_FRONT,
    EXTERIOR_BEHIND,
    EXTERIOR_FRONT,
    EXTERIOR_LEFT,
    EXTERIOR_RIGHT,
    TARGET_TO,
    TARGET_FROM,
    STATIC_MODEL,
    AI_CHASE,
    SHOWCASE,
}

enum GameState {
    SPAWN_MENU,
    PLAYER,
}

interface ShowcaseHighlightState {
    object: THREE.Object3D;
    originalMaterial: THREE.Material | THREE.Material[];
}

// Numpad orbit: while held, the numpad grid moves the camera around the aircraft.
// 4/6 orbit left/right (yaw), 8/2 raise/lower the camera (elevation), the corners
// combine both, and 5 recenters. Each entry is a direction that gets integrated
// over time at ORBIT_RATE.
const NUMPAD_ORBIT_DIR: Record<string, { yaw: number, pitch: number }> = {
    Numpad4: { yaw: -1, pitch: 0 },
    Numpad6: { yaw: 1, pitch: 0 },
    Numpad8: { yaw: 0, pitch: -1 },
    Numpad2: { yaw: 0, pitch: 1 },
    Numpad7: { yaw: -1, pitch: -1 },
    Numpad9: { yaw: 1, pitch: -1 },
    Numpad1: { yaw: -1, pitch: 1 },
    Numpad3: { yaw: 1, pitch: 1 },
};

// Numpad zoom: while held, / zooms out and * zooms in by scaling the orbit radius.
const NUMPAD_ZOOM_DIR: Record<string, number> = {
    NumpadDivide: 1,
    NumpadMultiply: -1,
};

// Orbit speed in radians per second while a numpad key is held.
const ORBIT_RATE = Math.PI;

// Keep the elevation short of straight up/down so the orbit never gimbal-flips.
const ORBIT_PITCH_LIMIT = Math.PI / 2 - 0.05;

// Zoom speed (fraction of radius per second) and radius multiplier bounds.
const ZOOM_RATE = 1.5;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 5.0;

export class GameUpdateTask implements KernelUpdateTask {

    constructor(private game: Game) { }

    update(delta: number) {
        this.game.update(delta);
    }
}

export class GameRenderTask implements KernelRenderTask {

    constructor(private game: Game) { }

    render() {
        this.game.render();
    }
}

export class Game {

    private state: GameState = GameState.SPAWN_MENU;

    private scene: Scene = new Scene();
    private readonly skiJumps: SkiJumpCollider[] = [];
    private readonly carrierMeshes: CarrierMeshCollider[] = [];
    /** Flat solid surfaces (runway strip, pavement pads); gear rests on them, not the terrain below. */
    private readonly surfacePads: SurfacePadCollider[] = [];
    /** Static scenery collision soups (hangars, tower, depots...); solid like the carrier deck. */
    private readonly sceneryMeshes: CarrierMeshCollider[] = [];
    /**
     * Baked scenery colliders held here until all scenery is placed, then moved
     * into {@link sceneryMeshes}. Keeps ground sampling during placement from
     * seeing earlier buildings and stacking later ones on their roofs.
     */
    private readonly stagedSceneryMeshes: CarrierMeshCollider[] = [];
    /** Geographic DEM / ocean terrain when `terrain=planet` (default). */
    private planetTerrain!: TerrainEntity;
    /** Canvas OSM for left MFD; when set, WebGL MAP target is skipped. */
    private osmMapEntity: OsmMapEntity | undefined;
    /** Atmospheric sky billboard; disabled above {@link SPACE_SKY_ALTITUDE_M}. */
    private skyEntity: SimpleEntity | undefined;
    /** Puffy low-poly cloud deck; disabled above {@link SPACE_SKY_ALTITUDE_M} alongside the sky. */
    private cloudField: SceneryField | undefined;
    /** High-altitude cirrus streak layer; disabled above {@link SPACE_SKY_ALTITUDE_M} alongside the sky. */
    private cirrusField: SceneryField | undefined;
    /**
     * Excludes the cloud/cirrus decks from the weapons-target MFD's camera
     * pass — that pass already rebuilds the whole render list a second time
     * for a tiny picture-in-picture view, and paying full cloud-field LOD
     * cost again there is pure waste. Declared once (not inline per RenderLayer)
     * so it stays a stable function reference; reads cloudField/cirrusField
     * live via `this`, so field init order relative to setupScene() doesn't matter.
     */
    private readonly excludeSkyFieldsFilter = (entity: Entity): boolean =>
        entity !== this.cloudField && entity !== this.cirrusField;
    /** F9-toggled live FPS / draw-call / terrain-LOD readout. */
    private perfHud: PerfHudEntity | undefined;

    /** Live Kuznetsov entity; cables / trap physics / ILS follow its pose. */
    private kuz: GroundTargetEntity | undefined;
    private readonly syncedCarrierPos = new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN);
    private readonly syncedCarrierQuat = new THREE.Quaternion(Number.NaN, Number.NaN, Number.NaN, Number.NaN);
    /** World bow direction and velocity for the steaming carrier. */
    private readonly carrierBowDir = new THREE.Vector3(0, 0, -1);
    private readonly carrierVelocity = new THREE.Vector3();
    private readonly obstacles: Obstacle[] = [];
    private weaponsField: WeaponsField | undefined;
    private debrisField: DebrisField | undefined;
    private damageSmoke: DamageSmokeField | undefined;
    /** Countdown before AI opponents leave STRAIGHT and enter ENGAGE. */
    private aiStraightTimer = 0;
    /** All AI opponents; `aiOpponent` is the first, used by chase cam / targeting. */
    private readonly aiOpponents: AiAircraftEntity[] = [];
    private aiOpponent: AiAircraftEntity | undefined;

    private playerCamera: SceneCamera;
    private targetCamera: SceneCamera;
    private mapCamera: THREE.OrthographicCamera;
    private cameraUpdaters: Map<PlayerViewState, CameraUpdater> = new Map();
    private cameraUpdater: CameraUpdater;
    private player: PlayerEntity;

    private palettes = [VGANoonPalette, VGAMidnightPalette];
    private currentPalette = 0;

    private cockpitRenderLayersLo: RenderLayer[];
    private cockpitTargetRenderLayersLo: RenderLayer[];
    private exteriorRenderLayersLo: RenderLayer[];
    private showcaseRenderLayersLo: RenderLayer[];
    private cockpitRenderLayersHi: RenderLayer[];
    private cockpitTargetRenderLayersHi: RenderLayer[];
    private exteriorRenderLayersHi: RenderLayer[];
    private showcaseRenderLayersHi: RenderLayer[];
    private cockpitRenderLayersHd: RenderLayer[];
    private cockpitTargetRenderLayersHd: RenderLayer[];
    private exteriorRenderLayersHd: RenderLayer[];
    private showcaseRenderLayersHd: RenderLayer[];
    /** Weapons-target MFD is refreshed every Nth frame to cut dual-scene cost. */
    private targetMfdFrame = 0;

    private hdResolutionWidth = 0;
    private hdResolutionHeight = 0;

    private view: PlayerViewState = PlayerViewState.COCKPIT_FRONT;
    private viewBeforeShowcase: PlayerViewState | null = null;
    private staticModelIndex = 0;
    private staticModelCameraUpdater: StaticModelCameraUpdater;

    // Numpad orbit: how far the camera is currently orbited around the aircraft,
    // relative to the active view's default position (yaw about world UP, pitch
    // about the horizontal axis). Both zero leaves the active camera untouched.
    private viewYaw: number = 0;
    private viewPitch: number = 0;
    private viewZoom: number = 1;
    /** F2 exterior view: numpad * toggles the camera to track the AI opponent. */
    private exteriorEnemyLock = false;
    private cockpitPadlock = false;
    private aiChaseHeading = ExteriorViewHeading.BACK;
    private heldOrbitKeys = new Set<string>();
    private _orbitPivot = new THREE.Vector3();
    private _orbitOffset = new THREE.Vector3();
    private _orbitAxis = new THREE.Vector3();
    private _debugDebrisVel = new THREE.Vector3();
    private _debugDebrisPos = new THREE.Vector3();
    private _damageSmokeVel = new THREE.Vector3();

    private cockpitEntities: Entity[] = [];
    private readonly telemetryGraph = new TelemetryGraph();
    private readonly telemetryGraphWindow = new TelemetryGraphWindow();
    private readonly telemetryAccel = new THREE.Vector3();
    private exteriorEntities: Entity[] = [];

    private spawnMenu: SpawnMenuEntity;
    private spawnPanel: SpawnPanel;

    private aircraftRegistry = new AircraftRegistry();
    private currentDef: FlyableAircraftDef;
    private selectedAircraftId = 'f22';
    private modUploadInput?: HTMLInputElement;
    private modImportInFlight = false;
    private modStatusToken?: symbol;
    private showcaseRaycaster = new THREE.Raycaster();
    private showcasePointerNdc = new THREE.Vector2();
    private showcasePointerInside = false;
    private showcasePointerDown = false;
    private showcaseHighlight: ShowcaseHighlightState | undefined;

    private flightRecorder = new FlightRecorder();

    constructor(private configService: ConfigService, private models: ModelManager, private materials: SceneMaterialManager, private renderer: Renderer,
        private audio: AudioSystem, private combatSim: CombatSimClient) {

        this.playerCamera = new SceneCamera(new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, PLANE_DISTANCE_TO_GROUND, COCKPIT_FAR));
        this.targetCamera = new SceneCamera(new THREE.PerspectiveCamera(COCKPIT_FOV, 1, PLANE_DISTANCE_TO_GROUND, COCKPIT_FAR));
        this.mapCamera = new THREE.OrthographicCamera(-10000, 10000, 10000, -10000, 10, 1000);
        this.mapCamera.setRotationFromAxisAngle(RIGHT, -Math.PI / 2);
        this.mapCamera.position.set(0, 500, 0);

        this.currentDef = buildF22Def();
        this.player = new PlayerEntity(this.models,
            this.currentDef,
            configService.flightModels.getActive(),
            this.materials,
            this.audio.getGlobal('assets/engine-loop-02.ogg', true),
            this.audio.getGlobal('assets/engine-loop-01.ogg', true),
            PLAYER_STARTING_POSITION, PLAYER_STARTING_HEADING);

        this.spawnMenu = new SpawnMenuEntity();
        this.spawnPanel = new SpawnPanel(
            (modelIndex) => this.selectAircraftModel(modelIndex),
            (liveryIndex) => this.selectAircraftLivery(liveryIndex),
            () => void this.beginFlight('approach'),
            () => void this.beginFlight('runway'),
            () => void this.beginFlight('headon'),
            () => void this.beginFlight('carrier'),
            () => void this.beginFlight('carrierTakeoff'),
            () => void this.beginFlight('highAlt'),
            () => void this.beginFlight('space'),
        );

        this.cameraUpdaters.set(PlayerViewState.CRASHED, new CrashedCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdaters.set(PlayerViewState.COCKPIT_FRONT, new CockpitFrontCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdaters.set(PlayerViewState.EXTERIOR_BEHIND, new ExteriorFrontBehindCameraUpdater(this.player, this.playerCamera.main, ExteriorViewHeading.FRONT));
        this.cameraUpdaters.set(PlayerViewState.EXTERIOR_FRONT, new ExteriorFrontBehindCameraUpdater(this.player, this.playerCamera.main, ExteriorViewHeading.BACK));
        this.cameraUpdaters.set(PlayerViewState.EXTERIOR_LEFT, new ExteriorSideCameraUpdater(this.player, this.playerCamera.main, ExteriorViewSide.LEFT));
        this.cameraUpdaters.set(PlayerViewState.EXTERIOR_RIGHT, new ExteriorSideCameraUpdater(this.player, this.playerCamera.main, ExteriorViewSide.RIGHT));
        this.cameraUpdaters.set(PlayerViewState.TARGET_TO, new TargetToCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdaters.set(PlayerViewState.TARGET_FROM, new TargetFromCameraUpdater(this.player, this.playerCamera.main));
        this.staticModelCameraUpdater = new StaticModelCameraUpdater(this.player, this.playerCamera.main);
        this.cameraUpdaters.set(PlayerViewState.STATIC_MODEL, this.staticModelCameraUpdater);
        this.cameraUpdaters.set(PlayerViewState.SHOWCASE, new ShowcaseCameraUpdater(this.player, this.playerCamera.main));
        this.cameraUpdater = this.getCameraUpdater(this.view);
        this.configService.techProfiles.addChangeListener(profile => {
            if (profile.resolution === DisplayResolution.HD_RES) {
                this.updateHdResolution();
                this.renderer.setUpscaleFilter(true);
            } else {
                this.setStandardCameraAspect();
                const [width, height] = getDisplayResolutionSize(profile.resolution);
                this.renderer.setComposeSize(width, height);
                this.renderer.setUpscaleFilter(false);
                this.hdResolutionWidth = 0;
                this.hdResolutionHeight = 0;
            }
            this.palettes = [profile.noonPalette, profile.midnightPalette];
            this.materials.setFog(profile.fogQuality);
            this.materials.setShadingType(profile.shading);
            this.renderer.setPalette(this.getPalette());
            this.renderer.setTextEffect(profile.textEffect);
        });
        this.configService.flightModels.addChangeListener(flightModel => {
            this.player.setFlightModel(flightModel);
            flightModel.setAircraft(flightConfigWithArrestorHook(this.currentDef));
            // FM2/DEBUG are simulated in the combat worker; JSBSim runs in its own
            // worker, so the sim-owned player aircraft is disabled and its state is
            // injected as an external combatant (see update) for AI targeting.
            const simOwned = flightModel instanceof SimProxyFlightModel;
            this.combatSim.setEnabled(PLAYER_SIM_ID, simOwned);
            if (simOwned) {
                this.combatSim.clearExternalState(PLAYER_SIM_ID);
            }
        })

        const playerLayersLo: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_LO,
                camera: this.playerCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: MAIN_RENDER_TARGET_LO,
                camera: this.playerCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: MAIN_RENDER_TARGET_LO,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
            }
        ];
        const playerLayersHi: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_HI,
                camera: this.playerCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: MAIN_RENDER_TARGET_HI,
                camera: this.playerCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: MAIN_RENDER_TARGET_HI,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
            }
        ];
        const targetLayersLo: RenderLayer[] = [
            {
                target: WEAPONSTARGET_RENDER_TARGET_LO,
                camera: this.targetCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_LO,
                camera: this.targetCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_LO,
                camera: this.targetCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                entityFilter: this.excludeSkyFieldsFilter
            }
        ];
        const targetLayersHi: RenderLayer[] = [
            {
                target: WEAPONSTARGET_RENDER_TARGET_HI,
                camera: this.targetCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_HI,
                camera: this.targetCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_HI,
                camera: this.targetCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                entityFilter: this.excludeSkyFieldsFilter
            }
        ];
        const mapLayersLo: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_LO,
                camera: this.mapCamera,
                lists: [SceneLayers.MapBasemap]
            }
        ];
        const mapLayersHi: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_HI,
                camera: this.mapCamera,
                lists: [SceneLayers.MapBasemap]
            }
        ];
        const canvasLayersLo: RenderLayer[] = [
            {
                target: CANVAS_RENDER_TARGET_LO,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Overlay]
            }
        ];
        const canvasLayersHi: RenderLayer[] = [
            {
                target: CANVAS_RENDER_TARGET_HI,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Overlay]
            }
        ];
        this.cockpitRenderLayersLo = [...playerLayersLo, ...mapLayersLo, ...canvasLayersLo];
        this.cockpitTargetRenderLayersLo = [...playerLayersLo, ...mapLayersLo, ...targetLayersLo, ...canvasLayersLo];
        this.exteriorRenderLayersLo = [...playerLayersLo, ...canvasLayersLo];
        const showcaseLayersLo: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_LO,
                camera: this.playerCamera.main,
                lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                palette: ShowcasePalette,
            }
        ];
        this.showcaseRenderLayersLo = showcaseLayersLo;
        this.cockpitRenderLayersHi = [...playerLayersHi, ...mapLayersHi, ...canvasLayersHi];
        this.cockpitTargetRenderLayersHi = [...playerLayersHi, ...mapLayersHi, ...targetLayersHi, ...canvasLayersHi];
        this.exteriorRenderLayersHi = [...playerLayersHi, ...canvasLayersHi];
        const showcaseLayersHi: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_HI,
                camera: this.playerCamera.main,
                lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                palette: ShowcasePalette,
            }
        ];
        this.showcaseRenderLayersHi = showcaseLayersHi;

        const playerLayersHd: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_HD,
                camera: this.playerCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: MAIN_RENDER_TARGET_HD,
                camera: this.playerCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: MAIN_RENDER_TARGET_HD,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
            }
        ];
        const targetLayersHd: RenderLayer[] = [
            {
                target: WEAPONSTARGET_RENDER_TARGET_HD,
                camera: this.targetCamera.bgSky,
                lists: [SceneLayers.BackgroundSky]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_HD,
                camera: this.targetCamera.bgGround,
                lists: [SceneLayers.BackgroundGround]
            },
            {
                target: WEAPONSTARGET_RENDER_TARGET_HD,
                camera: this.targetCamera.main,
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                entityFilter: this.excludeSkyFieldsFilter
            }
        ];
        const mapLayersHd: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_HD,
                camera: this.mapCamera,
                lists: [SceneLayers.MapBasemap]
            }
        ];
        const canvasLayersHd: RenderLayer[] = [
            {
                target: CANVAS_RENDER_TARGET_HD,
                camera: this.playerCamera.main,
                lists: [SceneLayers.Overlay]
            }
        ];
        this.cockpitRenderLayersHd = [...playerLayersHd, ...mapLayersHd, ...canvasLayersHd];
        this.cockpitTargetRenderLayersHd = [...playerLayersHd, ...mapLayersHd, ...targetLayersHd, ...canvasLayersHd];
        this.exteriorRenderLayersHd = [...playerLayersHd, ...canvasLayersHd];
        const showcaseLayersHd: RenderLayer[] = [
            {
                target: MAIN_RENDER_TARGET_HD,
                camera: this.playerCamera.main,
                lists: [SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX],
                palette: ShowcasePalette,
            }
        ];
        this.showcaseRenderLayersHd = showcaseLayersHd;
    }

    async setup() {
        setBootProgress(5, 'Initializing renderer...');
        const textColors = this.getTextColors();

        this.renderer.createRenderTarget(MAIN_RENDER_TARGET_LO, RenderTargetType.WEBGL, 0, 0, LO_H_RES, LO_V_RES);
        this.renderer.createRenderTarget(CANVAS_RENDER_TARGET_LO, RenderTargetType.CANVAS, 0, 0, LO_H_RES, LO_V_RES, { textColors });
        this.renderer.createRenderTarget(MAIN_RENDER_TARGET_HI, RenderTargetType.WEBGL, 0, 0, HI_H_RES, HI_V_RES);
        this.renderer.createRenderTarget(CANVAS_RENDER_TARGET_HI, RenderTargetType.CANVAS, 0, 0, HI_H_RES, HI_V_RES, { textColors });
        const LO_MFD_SIZE = CockpitMFDSize(LO_V_RES, LO_H_RES);
        this.renderer.createRenderTarget(MAP_RENDER_TARGET_LO, RenderTargetType.WEBGL, CockpitMFD1X(LO_H_RES, LO_V_RES, LO_MFD_SIZE), CockpitMFD1Y(LO_H_RES, LO_V_RES, LO_MFD_SIZE), LO_MFD_SIZE, LO_MFD_SIZE);
        this.renderer.createRenderTarget(WEAPONSTARGET_RENDER_TARGET_LO, RenderTargetType.WEBGL, CockpitMFD2X(LO_H_RES, LO_V_RES, LO_MFD_SIZE), CockpitMFD2Y(LO_H_RES, LO_V_RES, LO_MFD_SIZE), LO_MFD_SIZE, LO_MFD_SIZE);
        const HI_MFD_SIZE = CockpitMFDSize(HI_V_RES, HI_H_RES);
        this.renderer.createRenderTarget(MAP_RENDER_TARGET_HI, RenderTargetType.WEBGL, CockpitMFD1X(HI_H_RES, HI_V_RES, HI_MFD_SIZE), CockpitMFD1Y(HI_H_RES, HI_V_RES, HI_MFD_SIZE), HI_MFD_SIZE, HI_MFD_SIZE);
        this.renderer.createRenderTarget(WEAPONSTARGET_RENDER_TARGET_HI, RenderTargetType.WEBGL, CockpitMFD2X(HI_H_RES, HI_V_RES, HI_MFD_SIZE), CockpitMFD2Y(HI_H_RES, HI_V_RES, HI_MFD_SIZE), HI_MFD_SIZE, HI_MFD_SIZE);
        this.renderer.setPalette(this.getPalette());
        this.materials.setPalette(this.getPalette());
        this.setupControls();
        setBootProgress(15, 'Loading aircraft packs...');
        await this.loadPersistedPacks();
        const settings = loadSettings();
        setBootProgress(25, 'Building scene...');
        await this.setupScene(settings.spawnMode);
        this.selectAircraftById(settings.aircraftId, 'f22');
        setBootProgress(90, 'Loading aircraft...');
        await this.beginFlight(settings.spawnMode);
        await this.waitForRequiredTerrain(90, 99);
        setBootProgress(100, 'Ready');
        window.addEventListener('resize', () => this.onViewportResize());
    }

    private aircraftModelGroups() {
        return groupAircraftByModel([...this.aircraftRegistry.list()]);
    }

    private selectedAircraftDef(): FlyableAircraftDef | undefined {
        return this.aircraftRegistry.get(this.selectedAircraftId)
            ?? this.aircraftModelGroups()[0]?.variants[0];
    }

    private findSelectionIndices(id: string): { modelIndex: number; liveryIndex: number } {
        const groups = this.aircraftModelGroups();
        for (let modelIndex = 0; modelIndex < groups.length; modelIndex++) {
            const liveryIndex = groups[modelIndex].variants.findIndex(def => def.id === id);
            if (liveryIndex >= 0) {
                return { modelIndex, liveryIndex };
            }
        }
        return { modelIndex: 0, liveryIndex: 0 };
    }

    private refreshAircraftMenu() {
        const groups = this.aircraftModelGroups();
        const def = this.selectedAircraftDef();
        if (def) {
            this.selectedAircraftId = def.id;
        }
        const { modelIndex, liveryIndex } = this.findSelectionIndices(this.selectedAircraftId);
        this.spawnPanel.setSelection(groups, modelIndex, liveryIndex);
    }

    /** Load aircraft packs produced by prior F10 imports (survives page reload / rebuild). */
    private async loadPersistedPacks(): Promise<void> {
        try {
            const res = await fetch('/api/aircraft-packs');
            if (!res.ok) {
                return;
            }
            const packs: { id: string; packUrl: string }[] = await res.json();
            await Promise.all(
                packs
                    .filter(p => !EXCLUDED_PACK_IDS.has(p.id))
                    .map(async p => {
                        this.models.invalidatePack(p.id);
                        return this.aircraftRegistry.loadPack(p.id, p.packUrl);
                    }),
            );
        } catch {
            // No modserver (static hosting) — built-in packs only.
        }
    }

    /** Wait for an aircraft's glTF parts to finish loading before first render. */
    private async preloadAircraftModels(def: FlyableAircraftDef): Promise<void> {
        const urls = [
            def.body,
            def.shadow,
            ...(def.gear ? [def.gear] : []),
            ...(def.collision ? [def.collision] : []),
            ...def.surfaces.map(s => s.model),
        ];
        await Promise.all(urls.map(url => this.models.waitForModel(url)));
    }

    private selectAircraftModel(modelIndex: number, liveryIndex = 0): void {
        const groups = this.aircraftModelGroups();
        const group = groups[modelIndex];
        if (!group) {
            return;
        }
        const variant = group.variants[Math.min(liveryIndex, group.variants.length - 1)];
        this.selectedAircraftId = variant.id;
        this.refreshAircraftMenu();
        this.persistSpawnSelection();
    }

    private selectAircraftLivery(liveryIndex: number): void {
        const { modelIndex } = this.findSelectionIndices(this.selectedAircraftId);
        this.selectAircraftModel(modelIndex, liveryIndex);
    }

    private selectAircraftById(id: string, fallbackId?: string): void {
        if (this.aircraftRegistry.get(id)) {
            this.selectedAircraftId = id;
        } else if (fallbackId && this.aircraftRegistry.get(fallbackId)) {
            this.selectedAircraftId = fallbackId;
        }
        this.refreshAircraftMenu();
        this.persistSpawnSelection();
    }

    private persistSpawnSelection(spawnMode?: SpawnMode): void {
        updateSettings({
            aircraftId: this.selectedAircraftId,
            ...(spawnMode !== undefined ? { spawnMode } : {}),
        });
    }

    /** Swap the player (and AI opponents) to the aircraft chosen in the spawn menu. */
    private applySelectedAircraft() {
        const def = this.selectedAircraftDef();
        if (!def || def.id === this.currentDef.id) {
            return;
        }
        this.currentDef = def;
        this.player.loadAircraft(def);
        this.configService.flightModels.getActive().setAircraft(flightConfigWithArrestorHook(def));
        this.combatSim.setCollision(PLAYER_SIM_ID, def.collisionMesh);
        // Same airframe for AI — only the control channel differs.
        for (let i = 0; i < this.aiOpponents.length; i++) {
            this.aiOpponents[i].loadAircraft(def);
            this.combatSim.setCollision(this.aiOpponents[i].simId, def.collisionMesh);
        }
    }

    /** F10: open a file picker to upload a Unity mod .zip for import. */
    private triggerModImport(): void {
        if (this.modImportInFlight) {
            return;
        }
        if (!this.modUploadInput) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.zip';
            input.style.display = 'none';
            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                input.value = '';
                if (file) {
                    void this.importModFromFile(file);
                }
            });
            document.body.appendChild(input);
            this.modUploadInput = input;
        }
        this.modUploadInput.click();
    }

    /** Upload the mod to the dev server, register the imported plane(s), and open the menu. */
    private async importModFromFile(file: File): Promise<void> {
        this.modImportInFlight = true;
        this.setModStatus(
            file.size > 20_000_000
                ? `Importing all liveries from ${file.name} (may take several minutes)...`
                : `Importing all liveries from ${file.name}...`,
            0,
        );
        try {
            const healthRes = await fetch('/api/health').catch(() => null);
            if (!healthRes?.ok) {
                this.setModStatus(
                    'Import unavailable: run npm run serve (or npm start) and open http://localhost:8020.',
                );
                return;
            }

            const form = new FormData();
            form.append('mod', file);
            const res = await fetch('/api/import-mod', { method: 'POST', body: form });
            await this.finishModImportResponse(res);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.setModStatus(`Import failed: ${msg}`);
        } finally {
            this.modImportInFlight = false;
        }
    }

    private async finishModImportResponse(res: Response): Promise<void> {
        let data: { ok?: boolean; error?: string; log?: string; imported?: { id: string; name: string; packUrl: string }[] };
        try {
            data = await res.json();
        } catch {
            this.setModStatus(`Import failed: unexpected response (HTTP ${res.status}).`);
            return;
        }

        if (!res.ok || !data.ok) {
            const msg = data.error || `HTTP ${res.status}`;
            this.setModStatus(`Import failed: ${msg}`);
            if (data.log) {
                console.warn('[mod import]\n' + data.log);
            }
            return;
        }

        const imported: { id: string; name: string; packUrl: string }[] = data.imported ?? [];
        this.setModStatus(`Loading ${imported.length} aircraft pack(s)...`, 0);
        const registered: string[] = [];
        await Promise.all(imported.map(async (entry) => {
            this.models.invalidatePack(entry.id);
            const id = await this.aircraftRegistry.loadPack(entry.id, entry.packUrl);
            if (id) {
                registered.push(entry.name);
            }
        }));

        if (registered.length === 0) {
            this.setModStatus('Import failed: no aircraft could be loaded.');
            return;
        }

        this.refreshAircraftMenu();
        this.selectAircraftById(imported[0].id);
        const firstDef = this.aircraftRegistry.get(imported[0].id);
        if (firstDef) {
            this.setModStatus(`Loading models for ${firstDef.name}...`, 0);
            await this.preloadAircraftModels(firstDef);
        }
        this.setModStatus(`Imported: ${registered.join(', ')}. Select and fly from the menu.`, 20000);
        this.enterSpawnMenu();
    }

    /** Show a transient status message in the #mod-status overlay. */
    private setModStatus(text: string, autoHideMs = 8000): void {
        const el = document.getElementById('mod-status');
        if (!el) {
            return;
        }
        el.textContent = text;
        el.classList.remove('hidden');
        const token = Symbol();
        this.modStatusToken = token;
        if (autoHideMs > 0) {
            window.setTimeout(() => {
                if (this.modStatusToken === token) {
                    el.classList.add('hidden');
                }
            }, autoHideMs);
        }
    }

    private setShowcasePickLabel(text: string | null): void {
        const el = document.getElementById('showcase-pick');
        if (!el) {
            return;
        }
        if (!text || this.view !== PlayerViewState.SHOWCASE) {
            el.textContent = '';
            el.classList.add('hidden');
            return;
        }
        el.textContent = `Mesh: ${text}`;
        el.classList.remove('hidden');
    }

    private updateShowcasePointerFromEvent(event: MouseEvent): boolean {
        const container = document.getElementById('container');
        if (!container) {
            this.showcasePointerInside = false;
            return false;
        }
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        this.showcasePointerInside = inside;
        if (!inside || rect.width <= 0 || rect.height <= 0) {
            return false;
        }
        this.showcasePointerNdc.set(
            (x / rect.width) * 2 - 1,
            -(y / rect.height) * 2 + 1,
        );
        return true;
    }

    private applyShowcaseHighlight(object: THREE.Object3D | null): void {
        if (!object || !('material' in object)) {
            this.clearShowcaseHighlight();
            return;
        }
        if (this.showcaseHighlight?.object === object) {
            return;
        }
        this.clearShowcaseHighlight();
        const drawable = object as THREE.Mesh | THREE.LineSegments | THREE.Points;
        const originalMaterial = drawable.material;
        const clones = Array.isArray(originalMaterial)
            ? originalMaterial.map(m => m.clone())
            : originalMaterial.clone();

        const tint = (m: THREE.Material) => {
            if ('uniforms' in m) {
                const shader = m as THREE.ShaderMaterial;
                const uniforms = shader.uniforms as Record<string, { value: unknown }>;
                if (uniforms.color?.value instanceof THREE.Color) {
                    uniforms.color.value = new THREE.Color('#ffff66');
                }
                if (uniforms.colorSecondary?.value instanceof THREE.Color) {
                    uniforms.colorSecondary.value = new THREE.Color('#ffe066');
                }
            }
            if ('color' in m) {
                const mat = m as THREE.MeshBasicMaterial;
                if (mat.color) {
                    mat.color.set('#ffff66');
                }
            }
        };

        if (Array.isArray(clones)) {
            clones.forEach(tint);
            drawable.material = clones;
        } else {
            tint(clones);
            drawable.material = clones;
        }

        this.showcaseHighlight = { object, originalMaterial };
    }

    private clearShowcaseHighlight(): void {
        if (!this.showcaseHighlight) {
            return;
        }
        if ('material' in this.showcaseHighlight.object) {
            const drawable = this.showcaseHighlight.object as THREE.Mesh | THREE.LineSegments | THREE.Points;
            drawable.material = this.showcaseHighlight.originalMaterial;
        }
        this.showcaseHighlight = undefined;
    }

    private updateShowcasePicking(targetWidth: number): void {
        if (this.view !== PlayerViewState.SHOWCASE) {
            return;
        }
        if (!this.showcasePointerInside) {
            this.setShowcasePickLabel(null);
            if (!this.showcasePointerDown) {
                this.clearShowcaseHighlight();
            }
            return;
        }

        this.showcaseRaycaster.setFromCamera(this.showcasePointerNdc, this.playerCamera.main);
        const intersections = this.player.raycastShowcase(
            this.showcaseRaycaster,
            targetWidth,
            this.playerCamera.main,
            ShowcasePalette,
        );
        const hit = intersections.length > 0 ? intersections[0].object : null;
        this.setShowcasePickLabel(hit ? (hit.name || '(unnamed)') : null);

        if (this.showcasePointerDown) {
            this.applyShowcaseHighlight(hit);
        } else {
            this.clearShowcaseHighlight();
        }
    }

    private clearShowcasePickingState(): void {
        this.showcasePointerDown = false;
        this.showcasePointerInside = false;
        this.setShowcasePickLabel(null);
        this.clearShowcaseHighlight();
    }

    /** Horizontal ENU spawn of the plane (used for terrain preload before Y is known). */
    private spawnCenterEnu(spawn: SpawnMode): { x: number; z: number } {
        if (spawn === 'runway') {
            return { x: PLAYER_LAND_POSITION.x, z: PLAYER_LAND_POSITION.z };
        }
        if (spawn === 'carrier') {
            const p = this.carrierApproachSpawnPosition();
            return { x: p.x, z: p.z };
        }
        if (spawn === 'carrierTakeoff') {
            const pose = this.carrierPose();
            return {
                x: pose.position.x + KUZ_DECK_MID_X,
                z: pose.position.z + PLAYER_CARRIER_TAKEOFF_LOCAL_Z,
            };
        }
        if (spawn === 'highAlt' || spawn === 'space') {
            return { x: AIRBASE_RUNWAY.x, z: AIRBASE_RUNWAY.z };
        }
        // Approach and head-on.
        return { x: AIRBASE_RUNWAY.x, z: AIRBASE_RUNWAY.z - LAND_APPROACH_FINAL_M };
    }

    /** Pin the tiles around the plane so the spawn area cannot be evicted. */
    private async preloadTerrainAroundPlane(x: number, z: number, spawn?: SpawnMode): Promise<void> {
        const plan = this.terrainSeedPlan(spawn);
        for (const ring of plan.rings) {
            await this.planetTerrain.pinArea(
                x, z, ring.radiusM, ring.zoom ?? this.planetTerrain.maxZoom,
            );
        }
    }

    private reportTerrainBootProgress(meshed: number, total: number, min: number, max: number): void {
        const frac = total > 0 ? meshed / total : 1;
        const pct = min + (max - min) * frac;
        const label = total > 0
            ? `Loading terrain (${meshed}/${total})...`
            : 'Loading terrain...';
        setBootProgress(pct, label);
    }

    private async waitForRequiredTerrain(min: number, max: number): Promise<void> {
        await this.planetTerrain.waitForPinned((done, total) => {
            this.reportTerrainBootProgress(done, total, min, max);
        });
        this.player.updateDisplayTransform();
        this.cameraUpdater.update(0);
        this.playerCamera.update();
        this.render();
    }

    /**
     * Prefetch radius + pin rings for the spawn altitude.
     * High-alt: dense DEM-max core (fullRes inland) + coarse outer ring.
     */
    private terrainSeedPlan(spawn?: SpawnMode): {
        prefetchRadiusM: number;
        rings: { radiusM: number; zoom?: number; dense?: boolean }[];
    } {
        const demMax = this.planetTerrain.maxZoom;
        if (spawn === 'highAlt' && demMax !== undefined) {
            return {
                prefetchRadiusM: HIGH_ALT_OUTER_RADIUS_M,
                rings: [
                    { radiusM: HIGH_ALT_OUTER_RADIUS_M, zoom: HIGH_ALT_OUTER_ZOOM },
                    { radiusM: HIGH_ALT_PRELOAD_RADIUS_M, zoom: demMax, dense: true },
                ],
            };
        }
        if (spawn === 'space' && demMax !== undefined) {
            return {
                prefetchRadiusM: HIGH_ALT_OUTER_RADIUS_M,
                rings: [{
                    radiusM: HIGH_ALT_OUTER_RADIUS_M,
                    zoom: terrainMaxZoomForAltitudeM(SPACE_ALTITUDE_M, demMax),
                }],
            };
        }
        return {
            prefetchRadiusM: TERRAIN_PRELOAD_RADIUS_M,
            rings: [{ radiusM: TERRAIN_PRELOAD_RADIUS_M }],
        };
    }

    /** Runway spawn position; Y matches FM2 gear rest height above local ground. */
    private runwaySpawnPosition(): THREE.Vector3 {
        const gearY = this.currentDef.flight
            ? fm2GroundRestHeight(this.currentDef.flight)
            : PLANE_DISTANCE_TO_GROUND;
        const pos = PLAYER_LAND_POSITION.clone();
        pos.y = this.groundHeightAt(pos.x, pos.z) + gearY;
        return pos;
    }

    /** Short final toward the runway, AGL above DEM. */
    private landApproachSpawnPosition(): THREE.Vector3 {
        const x = AIRBASE_RUNWAY.x;
        const z = AIRBASE_RUNWAY.z - LAND_APPROACH_FINAL_M;
        const groundY = this.groundHeightAt(x, z);
        return new THREE.Vector3(x, groundY + APPROACH_ALTITUDE_M, z);
    }

    /** Overhead the airbase at high altitude (10 km AGL). */
    private highAltSpawnPosition(): THREE.Vector3 {
        const x = AIRBASE_RUNWAY.x;
        const z = AIRBASE_RUNWAY.z;
        return new THREE.Vector3(x, this.groundHeightAt(x, z) + HIGH_ALTITUDE_M, z);
    }

    /** Overhead the airbase at LEO altitude. */
    private spaceSpawnPosition(): THREE.Vector3 {
        const x = AIRBASE_RUNWAY.x;
        const z = AIRBASE_RUNWAY.z;
        return new THREE.Vector3(x, this.groundHeightAt(x, z) + SPACE_ALTITUDE_M, z);
    }

    /** Highest solid ground Y at (x, z): DEM/flat datum, hills, ski jumps, surface pads, scenery + carrier meshes. */
    private groundHeightAt(x: number, z: number): number {
        const demY = this.planetTerrain.heightAtEnu(x, z);
        return Math.max(
            demY,
            sampleSkiJumpSurfaceYMax(x, z, this.skiJumps),
            sampleSurfacePadYMax(x, z, this.surfacePads),
            sampleCarrierMeshSurfaceYMax(x, z, this.sceneryMeshes),
            sampleCarrierMeshSurfaceYMax(x, z, this.carrierMeshes),
        );
    }

    /**
     * Max ground Y under a footprint so wide buildings are not buried by DEM relief.
     * Samples a grid in [x±halfW]×[z±halfD].
     */
    private groundHeightMaxUnder(
        x: number,
        z: number,
        halfW: number,
        halfD: number,
        step: number = 20,
    ): number {
        const sx = Math.max(5, step);
        const sz = Math.max(5, step);
        let y = this.groundHeightAt(x, z);
        for (let dz = -halfD; dz <= halfD; dz += sz) {
            for (let dx = -halfW; dx <= halfW; dx += sx) {
                y = Math.max(y, this.groundHeightAt(x + dx, z + dz));
            }
        }
        // Include corners even when half extents are not multiples of step.
        y = Math.max(
            y,
            this.groundHeightAt(x - halfW, z - halfD),
            this.groundHeightAt(x + halfW, z - halfD),
            this.groundHeightAt(x - halfW, z + halfD),
            this.groundHeightAt(x + halfW, z + halfD),
        );
        return y;
    }

    /** On-deck carrier takeoff spawn; Y = deck surface + FM2 gear rest height. */
    private carrierTakeoffSpawnPosition(): THREE.Vector3 {
        const gearY = this.currentDef.flight
            ? fm2GroundRestHeight(this.currentDef.flight)
            : PLANE_DISTANCE_TO_GROUND;
        const pose = this.carrierPose();
        const x = pose.position.x + KUZ_DECK_MID_X;
        const z = pose.position.z + PLAYER_CARRIER_TAKEOFF_LOCAL_Z;
        return new THREE.Vector3(x, this.groundHeightAt(x, z) + gearY, z);
    }

    /** Final approach spawn relative to the live carrier stern. */
    private carrierApproachSpawnPosition(): THREE.Vector3 {
        const pose = this.carrierPose();
        return new THREE.Vector3(
            pose.position.x + KUZ_DECK_MID_X,
            CARRIER_APPROACH_ALTITUDE_M,
            pose.position.z + KUZ_HULL.maxZ + CARRIER_APPROACH_FINAL_DISTANCE_M,
        );
    }

    /** Approach airspeed in world frame (ship speed + relative groove speed). */
    private carrierApproachSpawn(): PlayerSpawnState {
        const speed = CARRIER_SPEED_MPS + APPROACH_SPEED_MPS;
        return {
            velocity: FORWARD.clone().applyAxisAngle(UP, PLAYER_CARRIER_HEADING).multiplyScalar(speed),
            throttle: 0.38,
            airborne: true,
        };
    }

    /** On-deck takeoff: world velocity matches ship cruise along the bow. */
    private carrierTakeoffSpawn(): PlayerSpawnState {
        return {
            velocity: FORWARD.clone().applyAxisAngle(UP, PLAYER_CARRIER_TAKEOFF_HEADING).multiplyScalar(CARRIER_SPEED_MPS),
            throttle: 0,
            airborne: false,
        };
    }

    private onViewportResize() {
        if (this.configService.techProfiles.getActive().resolution === DisplayResolution.HD_RES) {
            this.updateHdResolution();
        }
    }

    private updateHdResolution() {
        const [width, height] = this.renderer.getMaxViewportResolution();
        if (width === this.hdResolutionWidth && height === this.hdResolutionHeight) {
            return;
        }

        this.hdResolutionWidth = width;
        this.hdResolutionHeight = height;

        if (!this.renderer.hasRenderTarget(MAIN_RENDER_TARGET_HD)) {
            const textColors = this.getTextColors();
            this.renderer.createRenderTarget(MAIN_RENDER_TARGET_HD, RenderTargetType.WEBGL, 0, 0, width, height);
            this.renderer.createRenderTarget(CANVAS_RENDER_TARGET_HD, RenderTargetType.CANVAS, 0, 0, width, height, { textColors });
            const mfdSize = CockpitMFDSize(height, width);
            this.renderer.createRenderTarget(MAP_RENDER_TARGET_HD, RenderTargetType.WEBGL, CockpitMFD1X(width, height, mfdSize), CockpitMFD1Y(width, height, mfdSize), mfdSize, mfdSize);
            this.renderer.createRenderTarget(WEAPONSTARGET_RENDER_TARGET_HD, RenderTargetType.WEBGL, CockpitMFD2X(width, height, mfdSize), CockpitMFD2Y(width, height, mfdSize), mfdSize, mfdSize);
        } else {
            this.renderer.resizeRenderTarget(MAIN_RENDER_TARGET_HD, 0, 0, width, height);
            this.renderer.resizeRenderTarget(CANVAS_RENDER_TARGET_HD, 0, 0, width, height);
            const mfdSize = CockpitMFDSize(height, width);
            this.renderer.resizeRenderTarget(MAP_RENDER_TARGET_HD, CockpitMFD1X(width, height, mfdSize), CockpitMFD1Y(width, height, mfdSize), mfdSize, mfdSize);
            this.renderer.resizeRenderTarget(WEAPONSTARGET_RENDER_TARGET_HD, CockpitMFD2X(width, height, mfdSize), CockpitMFD2Y(width, height, mfdSize), mfdSize, mfdSize);
        }

        this.renderer.setComposeSize(width, height);
        this.setHdCameraAspect(width, height);
    }

    private setHdCameraAspect(width: number, height: number) {
        const aspect = width / height;
        this.playerCamera.main.aspect = aspect;
        this.playerCamera.main.updateProjectionMatrix();
        this.playerCamera.update();
    }

    private setStandardCameraAspect() {
        const aspect = H_RES / V_RES;
        this.playerCamera.main.aspect = aspect;
        this.playerCamera.main.updateProjectionMatrix();
        this.targetCamera.main.aspect = 1;
        this.targetCamera.main.updateProjectionMatrix();
        this.playerCamera.update();
        this.targetCamera.update();
    }

    private getTextColors(): string[] {
        return Array.from(new Set(
            [CGANoonPalette, CGAMidnightPalette, EGANoonPalette, EGAMidnightPalette, VGANoonPalette, VGAMidnightPalette, SVGANoonPalette, SVGAMidnightPalette, HDNoonPalette, HDMidnightPalette]
                .flatMap(p => ([
                    PaletteColor(p, PaletteCategory.HUD_TEXT),
                    PaletteColor(p, PaletteCategory.HUD_TEXT_WARN),
                    PaletteColor(p, PaletteCategory.HUD_TEXT_SECONDARY),
                    PaletteColor(p, PaletteCategory.HUD_TEXT_EFFECT)
                ]))
        ));
    }

    update(delta: number) {
        if (this.state === GameState.PLAYER) {
            if ((this.view === PlayerViewState.TARGET_TO || this.view === PlayerViewState.TARGET_FROM) && !this.player.weaponsTarget) {
                this.setCockpitFrontView();
            }
            if (this.cockpitPadlock && (!this.player.weaponsTarget || this.view !== PlayerViewState.COCKPIT_FRONT)) {
                this.setCockpitPadlock(false);
            }
            this.updateOrbitFromKeys(delta);
            this.recordTelemetry(delta);
            this.advanceCarrier(delta);
            this.syncCarrierSystems();
            this.scene.update(delta);
            this.pumpCombatSim(delta);
            this.updateAiStraightTimer(delta);

            if (this.flightRecorder.isRecording()) {
                this.flightRecorder.record(this.getShownAircraft().captureFlightSample(), delta);
            }

            if (this.player.isCrashed) {
                this.transitionFromPlayerToCrashed();
            }
        } else if (this.state === GameState.SPAWN_MENU) {
            this.advanceCarrier(delta);
            this.syncCarrierSystems();
            this.scene.update(delta);
            this.pumpCombatSim(delta);
        }
    }

    /** Steam the Kuznetsov at {@link CARRIER_SPEED_MPS} along its bow (−Z at identity). */
    private advanceCarrier(delta: number): void {
        if (!this.kuz) return;
        this.carrierBowDir.set(0, 0, -1).applyQuaternion(this.kuz.quaternion);
        this.carrierVelocity.copy(this.carrierBowDir).multiplyScalar(CARRIER_SPEED_MPS);
        this.kuz.position.addScaledVector(this.carrierVelocity, delta);
    }

    /** Carrier pose for arrestor visuals / latched hook (always live). */
    private carrierPose(): ArrestorCarrierPose {
        if (this.kuz) {
            return {
                position: this.kuz.position,
                quaternion: this.kuz.quaternion,
                velocity: this.carrierVelocity,
            };
        }
        return { position: KUZ_POSITION, quaternion: KUZ_IDENTITY_QUAT, velocity: this.carrierVelocity };
    }

    /**
     * When the Kuznetsov moves, keep trap cables, deck collision, and the
     * combat-sim worker in sync with its world pose.
     */
    private syncCarrierSystems(): void {
        if (!this.kuz) return;
        const p = this.kuz.position;
        const q = this.kuz.quaternion;
        if (
            Math.abs(p.x - this.syncedCarrierPos.x) < 1e-4 &&
            Math.abs(p.y - this.syncedCarrierPos.y) < 1e-4 &&
            Math.abs(p.z - this.syncedCarrierPos.z) < 1e-4 &&
            Math.abs(q.x - this.syncedCarrierQuat.x) < 1e-6 &&
            Math.abs(q.y - this.syncedCarrierQuat.y) < 1e-6 &&
            Math.abs(q.z - this.syncedCarrierQuat.z) < 1e-6 &&
            Math.abs(q.w - this.syncedCarrierQuat.w) < 1e-6
        ) {
            return;
        }
        this.syncedCarrierPos.copy(p);
        this.syncedCarrierQuat.copy(q);

        for (const m of this.carrierMeshes) {
            m.originX = p.x;
            m.originY = p.y;
            m.originZ = p.z;
        }

        const field = defaultArrestorCableField(p.x, p.y, p.z, q);
        this.combatSim.setArrestorCables([{
            originX: field.originX,
            originY: field.originY,
            originZ: field.originZ,
            deckAxis: [field.deckAxis.x, field.deckAxis.y, field.deckAxis.z],
            segmentsLocal: field.segments.map(s => [
                s.a.x - field.originX, s.a.y - field.originY, s.a.z - field.originZ,
                s.b.x - field.originX, s.b.y - field.originY, s.b.z - field.originZ,
            ] as [number, number, number, number, number, number]),
        }]);
        this.combatSim.setCarrierMeshOrigins(
            this.carrierMeshes.map(c => ({
                originX: c.originX, originY: c.originY, originZ: c.originZ,
            })),
        );
        this.combatSim.setCarrierVelocity(
            this.carrierVelocity.x, this.carrierVelocity.y, this.carrierVelocity.z,
        );
    }

    /**
     * Pump one frame into the combat sim worker after entities have latched their
     * inputs. When the player is flying the separate JSBSim worker (not sim-owned),
     * inject its live state so in-worker AI pilots can still target it.
     */
    private pumpCombatSim(delta: number): void {
        if (!(this.configService.flightModels.getActive() instanceof SimProxyFlightModel)) {
            this.combatSim.setExternalState(
                PLAYER_SIM_ID, Faction.PLAYER,
                this.player.position, this.player.velocityVector, this.player.isAlive());
        }
        this.combatSim.tick(delta);
    }

    render() {
        this.player.updateDisplayTransform();

        if (this.state === GameState.PLAYER || this.state === GameState.SPAWN_MENU) {
            this.cameraUpdater.update(0);
            if (!this.cockpitPadlock
                && (this.view !== PlayerViewState.AI_CHASE
                    && (this.exteriorEnemyLock && this.isF2ExteriorView()
                        || this.viewYaw !== 0 || this.viewPitch !== 0 || this.viewZoom !== 1)
                    || this.view === PlayerViewState.AI_CHASE
                        && (this.viewYaw !== 0 || this.viewPitch !== 0 || this.viewZoom !== 1))) {
                this.orbitCameraAroundAircraft();
            }
            this.playerCamera.update();
            this.applyAltitudeCameraFar();
            // Aim the target-window camera before the MFD's 3D layer is drawn (and
            // before its orientation is copied to the background cameras), so a
            // moving target stays centred instead of lagging a frame and stuttering.
            if (this.player.weaponsTarget) {
                updateTargetCamera(this.player, this.playerCamera.main, this.targetCamera.main);
            }
            this.targetCamera.update();
            this.applySpaceSkyState();
        }
        const resolution = this.configService.techProfiles.getActive().resolution;
        if (resolution === DisplayResolution.HD_RES) {
            this.updateHdResolution();
        }
        const showcasePickWidth = resolution === DisplayResolution.LO_RES
            ? LO_H_RES
            : resolution === DisplayResolution.HI_RES
                ? HI_H_RES
                : this.hdResolutionWidth || H_RES;
        this.updateShowcasePicking(showcasePickWidth);

        let layers: RenderLayer[];
        if (this.view === PlayerViewState.SHOWCASE) {
            if (resolution === DisplayResolution.LO_RES) {
                layers = this.showcaseRenderLayersLo;
            } else if (resolution === DisplayResolution.HI_RES) {
                layers = this.showcaseRenderLayersHi;
            } else {
                layers = this.showcaseRenderLayersHd;
            }
        } else if (resolution === DisplayResolution.LO_RES) {
            layers = this.cockpitRenderLayersLo;
            if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                layers = this.exteriorRenderLayersLo;
            } else if (this.player.weaponsTarget) {
                layers = this.cockpitTargetRenderLayersLo;
            }
        } else if (resolution === DisplayResolution.HI_RES) {
            layers = this.cockpitRenderLayersHi;
            if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                layers = this.exteriorRenderLayersHi;
            } else if (this.player.weaponsTarget) {
                layers = this.cockpitTargetRenderLayersHi;
            }
        } else {
            layers = this.cockpitRenderLayersHd;
            if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                layers = this.exteriorRenderLayersHd;
            } else if (this.player.weaponsTarget) {
                layers = this.cockpitTargetRenderLayersHd;
            }
        }

        if (this.player.weaponsTarget && this.view !== PlayerViewState.SHOWCASE) {
            const weaponsTargetId = resolution === DisplayResolution.LO_RES ? WEAPONSTARGET_RENDER_TARGET_LO
                : resolution === DisplayResolution.HI_RES ? WEAPONSTARGET_RENDER_TARGET_HI
                    : WEAPONSTARGET_RENDER_TARGET_HD;
            const mapTargetId = resolution === DisplayResolution.LO_RES ? MAP_RENDER_TARGET_LO
                : resolution === DisplayResolution.HI_RES ? MAP_RENDER_TARGET_HI
                    : MAP_RENDER_TARGET_HD;
            const nightVisionPalette = this.player.nightVision ? this.configService.techProfiles.getActive().nightVisionPalette : undefined;
            // Interleave map/target MFD refreshes so both never rebuild in one frame.
            const slot = this.targetMfdFrame++ % 4;
            const refreshMap = slot === 0 || slot === 2;
            const refreshTargetMfd = slot === 1;
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                if (layer.target === weaponsTargetId) {
                    layer.palette = nightVisionPalette;
                    layer.skipRefresh = !refreshTargetMfd;
                } else if (layer.target === mapTargetId) {
                    layer.skipRefresh = !refreshMap;
                } else {
                    layer.skipRefresh = false;
                }
            }
        } else if (this.view === PlayerViewState.SHOWCASE) {
            for (let i = 0; i < layers.length; i++) {
                layers[i].palette = ShowcasePalette;
                layers[i].skipRefresh = false;
            }
        } else {
            for (let i = 0; i < layers.length; i++) {
                layers[i].palette = undefined;
                layers[i].skipRefresh = false;
            }
            // HD cockpit map still costs a terrain pass every frame with no lock — half-rate it.
            if (resolution === DisplayResolution.HD_RES && this.view === PlayerViewState.COCKPIT_FRONT) {
                const refreshMap = (this.targetMfdFrame++ & 1) === 0;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].target === MAP_RENDER_TARGET_HD) {
                        layers[i].skipRefresh = !refreshMap;
                    }
                }
            }
        }
        // Canvas OSM paints MFD1; empty WebGL MAP target would cover it (compose order).
        if (this.osmMapEntity) {
            layers = layers.filter(l =>
                l.target !== MAP_RENDER_TARGET_LO
                && l.target !== MAP_RENDER_TARGET_HI
                && l.target !== MAP_RENDER_TARGET_HD);
        }
        this.applySpaceClearColor(layers);
        this.renderer.render(this.scene, layers);
    }

    /** Raise main / target far planes with altitude so the planetary limb stays in range. */
    private applyAltitudeCameraFar(): void {
        const far = cameraFarForAltitudeM(this.playerCamera.main.position.y);
        if (Math.abs(this.playerCamera.main.far - far) > 1) {
            this.playerCamera.main.far = far;
            this.playerCamera.main.updateProjectionMatrix();
        }
        if (Math.abs(this.targetCamera.main.far - far) > 1) {
            this.targetCamera.main.far = far;
            this.targetCamera.main.updateProjectionMatrix();
        }
    }

    /** Hide the flat sky billboard in space; restore it in atmosphere. */
    private applySpaceSkyState(): void {
        if (!this.skyEntity) {
            return;
        }
        const inSpace = this.playerCamera.main.position.y >= SPACE_SKY_ALTITUDE_M
            && this.view !== PlayerViewState.SHOWCASE;
        this.skyEntity.enabled = !inSpace;
        if (this.cloudField) {
            this.cloudField.enabled = !inSpace;
        }
        if (this.cirrusField) {
            this.cirrusField.enabled = !inSpace;
        }
    }

    /** Black clear behind terrain when above the atmosphere threshold. */
    private applySpaceClearColor(layers: RenderLayer[]): void {
        const inSpace = this.skyEntity !== undefined
            && !this.skyEntity.enabled
            && this.view !== PlayerViewState.SHOWCASE;
        const mainTargets = new Set([MAIN_RENDER_TARGET_LO, MAIN_RENDER_TARGET_HI, MAIN_RENDER_TARGET_HD]);
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (inSpace && mainTargets.has(layer.target)) {
                layer.clearColor = '#000000';
            } else {
                layer.clearColor = undefined;
            }
        }
    }

    getPlayer(): PlayerEntity {
        return this.player;
    }

    private resetOrbit() {
        this.viewYaw = 0;
        this.viewPitch = 0;
        this.viewZoom = 1;
    }

    // Accumulates the orbit yaw/pitch/zoom from any held numpad keys.
    private updateOrbitFromKeys(delta: number) {
        if (this.heldOrbitKeys.size === 0) {
            return;
        }
        let yawDir = 0;
        let pitchDir = 0;
        let zoomDir = 0;
        for (const code of this.heldOrbitKeys) {
            const dir = NUMPAD_ORBIT_DIR[code];
            if (dir) {
                yawDir += dir.yaw;
                pitchDir += dir.pitch;
            }
            const zoom = NUMPAD_ZOOM_DIR[code];
            if (zoom !== undefined) {
                zoomDir += zoom;
            }
        }
        this.viewYaw += yawDir * ORBIT_RATE * delta;
        this.viewPitch = clamp(this.viewPitch + pitchDir * ORBIT_RATE * delta,
            -ORBIT_PITCH_LIMIT, ORBIT_PITCH_LIMIT);
        if (zoomDir !== 0) {
            this.viewZoom = clamp(this.viewZoom * (1 + zoomDir * ZOOM_RATE * delta),
                ZOOM_MIN, ZOOM_MAX);
        }
    }

    // Orbits the active player camera around the view pivot by `viewYaw` (about the
    // world UP axis) and `viewPitch` (elevation), keeping the subject centred.
    private orbitCameraAroundAircraft() {
        if (this.view === PlayerViewState.STATIC_MODEL) {
            this._orbitPivot.copy(STATIC_MODEL_VIEWS[this.staticModelIndex].position);
        } else if (this.view === PlayerViewState.AI_CHASE && this.aiOpponent) {
            this._orbitPivot.copy(this.aiOpponent.getDisplayPosition());
        } else {
            this._orbitPivot.copy(this.player.getDisplayPosition());
        }
        this._orbitOffset
            .copy(this.playerCamera.main.position)
            .sub(this._orbitPivot)
            .applyAxisAngle(UP, this.viewYaw);
        // Elevation: rotate about the horizontal axis perpendicular to the offset.
        this._orbitAxis
            .copy(UP)
            .cross(this._orbitOffset);
        if (this._orbitAxis.lengthSq() > 1e-6) {
            this._orbitAxis.normalize();
            this._orbitOffset.applyAxisAngle(this._orbitAxis, this.viewPitch);
        }
        this._orbitOffset.multiplyScalar(this.viewZoom);
        this.playerCamera.main.position
            .copy(this._orbitPivot)
            .add(this._orbitOffset);
        this.playerCamera.main.up.copy(UP);
        if (this.view === PlayerViewState.AI_CHASE && this.aiOpponent?.enabled) {
            this.playerCamera.main.lookAt(this.player.getDisplayPosition());
        } else if (this.exteriorEnemyLock && this.isF2ExteriorView() && this.aiOpponent?.enabled) {
            this.playerCamera.main.lookAt(this.aiOpponent.getDisplayPosition());
        } else {
            this.playerCamera.main.lookAt(this._orbitPivot);
        }
    }

    private isF2ExteriorView(): boolean {
        return this.view === PlayerViewState.EXTERIOR_BEHIND
            || this.view === PlayerViewState.EXTERIOR_FRONT;
    }

    private toggleExteriorEnemyLock(): void {
        if (!this.aiOpponent?.enabled) {
            return;
        }
        this.exteriorEnemyLock = !this.exteriorEnemyLock;
        this.resetOrbit();
        this.syncExteriorEnemyLockTarget();
    }

    private syncExteriorEnemyLockTarget(): void {
        const target = this.exteriorEnemyLock && this.aiOpponent?.enabled
            ? this.aiOpponent
            : undefined;
        (this.cameraUpdaters.get(PlayerViewState.EXTERIOR_BEHIND) as ExteriorFrontBehindCameraUpdater)
            .setLookAtTarget(target);
        (this.cameraUpdaters.get(PlayerViewState.EXTERIOR_FRONT) as ExteriorFrontBehindCameraUpdater)
            .setLookAtTarget(target);
    }

    private clearExteriorEnemyLock(): void {
        if (!this.exteriorEnemyLock) {
            return;
        }
        this.exteriorEnemyLock = false;
        this.syncExteriorEnemyLockTarget();
    }

    private setCockpitPadlock(enabled: boolean): void {
        this.cockpitPadlock = enabled && !!this.player.weaponsTarget;
        if (this.cockpitPadlock) {
            this.resetOrbit();
        }
        (this.cameraUpdaters.get(PlayerViewState.COCKPIT_FRONT) as CockpitFrontCameraUpdater)
            .setPadlock(this.cockpitPadlock);
    }

    /** Tab: emit debris + hit smoke from the enemy plane for VFX debugging. */
    private debugEmitDebris(): void {
        if (!this.aiOpponent?.enabled) {
            return;
        }
        this._debugDebrisPos.copy(this.aiOpponent.getDisplayPosition());
        this.aiOpponent.readVelocity(this._debugDebrisVel);
        this.debrisField?.spawnDebugBurst(this._debugDebrisPos, this._debugDebrisVel);
        this.damageSmoke?.spawnDebugLeak(this.aiOpponent.simId);
    }

    private getDamageSmokePose(targetId: string): { position: THREE.Vector3; quaternion: THREE.Quaternion; velocity: THREE.Vector3; isAlive: boolean; isCrashed: boolean } | undefined {
        if (targetId === PLAYER_SIM_ID) {
            return {
                position: this.player.getDisplayPosition(),
                quaternion: this.player.getDisplayQuaternion(),
                velocity: this.player.getDisplayVelocity(),
                isAlive: this.player.isAlive(),
                isCrashed: this.player.isCrashed,
            };
        }
        for (let i = 0; i < this.aiOpponents.length; i++) {
            const ai = this.aiOpponents[i];
            if (ai.simId === targetId && ai.enabled) {
                ai.readVelocity(this._damageSmokeVel);
                return {
                    position: ai.getDisplayPosition(),
                    quaternion: ai.getDisplayQuaternion(),
                    velocity: this._damageSmokeVel,
                    isAlive: ai.isAlive(),
                    isCrashed: ai.isCrashed(),
                };
            }
        }
        return undefined;
    }

    private openTelemetryGraphWindow(): void {
        const borderColor = PaletteColor(this.getPalette(), PaletteCategory.HUD_TEXT_SECONDARY);
        this.telemetryGraphWindow.open(this.telemetryGraph, borderColor);
    }

    /** The aircraft currently on screen: the AI opponent in the F6 chase view, otherwise the player. */
    private getShownAircraft(): PlayerEntity | AiAircraftEntity {
        if (this.view === PlayerViewState.AI_CHASE && this.aiOpponent && this.aiOpponent.enabled) {
            return this.aiOpponent;
        }
        return this.player;
    }

    private recordTelemetry(delta: number): void {
        this.player.getAccelerationWorld(this.telemetryAccel);
        this.telemetryGraph.record(delta, {
            g: this.player.loadFactorG,
            aoaDeg: toDegrees(this.player.angleOfAttack),
            accelG: this.telemetryAccel.length() / 9.80665,
            stick: this.player.pitchStickUnitsValue,
            elevator: this.player.commandedElevator,
        });
    }

    private setupControls() {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (isTelemetryGraphKey(event)) {
                event.preventDefault();
                this.openTelemetryGraphWindow();
                return;
            }
            if (event.code === 'F10') {
                event.preventDefault();
                this.triggerModImport();
                return;
            }
            if (this.state === GameState.SPAWN_MENU) {
                return;
            }
            if (this.state !== GameState.PLAYER) {
                return;
            }
            if (event.code === 'Escape') {
                event.preventDefault();
                this.enterSpawnMenu();
                return;
            }
            switch (event.key) {
                case 'F1': {
                    event.preventDefault();
                    this.resetOrbit();
                    if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                        this.setCockpitFrontView();
                    } else if (this.player.weaponsTarget) {
                        // Second F1 in cockpit toggles padlock on the current target.
                        this.setCockpitPadlock(!this.cockpitPadlock);
                    }
                    break;
                }
                case 'F2': {
                    event.preventDefault();
                    this.resetOrbit();
                    this.setExteriorBehindFrontView();
                    break;
                }
                case 'F3': {
                    event.preventDefault();
                    this.resetOrbit();
                    this.setExteriorSideView();
                    break;
                }
                case 'F6': {
                    event.preventDefault();
                    this.resetOrbit();
                    this.setAiChaseView();
                    break;
                }
                case 'F8': {
                    event.preventDefault();
                    // Terrain wireframe coloured by QT zoom (one hue per LOD).
                    setTerrainWireframe(!isTerrainWireframe());
                    break;
                }
                case 'F9': {
                    event.preventDefault();
                    if (this.perfHud) {
                        this.perfHud.enabled = !this.perfHud.enabled;
                    }
                    break;
                }
                case 'F12': {
                    event.preventDefault();
                    this.toggleShowcaseView();
                    break;
                }
            }

            if (event.code === 'KeyR') {
                event.preventDefault();
                this.flightRecorder.toggle(this.configService.flightModels.getActiveKey());
            } else if (event.code === 'KeyV') {
                event.preventDefault();
                this.player.setForceVectorsEnabled(!this.player.forceVectorsEnabled);
            } else if (event.code === 'Tab') {
                if (event.repeat) {
                    return;
                }
                event.preventDefault();
                this.debugEmitDebris();
            } else if (event.code === 'Numpad5') {
                event.preventDefault();
                this.resetOrbit();
            } else if (event.code === 'NumpadMultiply' && this.isF2ExteriorView()) {
                event.preventDefault();
                this.toggleExteriorEnemyLock();
            } else if (event.code === 'NumpadMultiply' && this.view === PlayerViewState.COCKPIT_FRONT) {
                event.preventDefault();
                if (this.player.weaponsTarget) {
                    this.setCockpitPadlock(!this.cockpitPadlock);
                }
            } else if (event.code in NUMPAD_ORBIT_DIR || event.code in NUMPAD_ZOOM_DIR) {
                event.preventDefault();
                this.heldOrbitKeys.add(event.code);
            }
        }, { capture: true });

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.heldOrbitKeys.delete(event.code);
        });

        window.addEventListener('blur', () => {
            this.heldOrbitKeys.clear();
            this.clearShowcasePickingState();
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            this.updateShowcasePointerFromEvent(event);
        });
        document.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button !== 0 || this.view !== PlayerViewState.SHOWCASE) {
                return;
            }
            this.showcasePointerDown = true;
            this.updateShowcasePointerFromEvent(event);
        });
        document.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button !== 0) {
                return;
            }
            this.showcasePointerDown = false;
            this.clearShowcaseHighlight();
        });

        document.addEventListener('keypress', (event: KeyboardEvent) => {
            if (this.state === GameState.PLAYER) {
                switch (event.key) {
                    case '4': {
                        if (this.player.weaponsTarget) {
                            this.setTargetView();
                        }
                        break;
                    }
                }
            } else if (this.state === GameState.SPAWN_MENU) {
                switch (event.key) {
                    case '1': {
                        void this.beginFlight('approach');
                        break;
                    }
                    case '2': {
                        void this.beginFlight('runway');
                        break;
                    }
                    case '3': {
                        void this.beginFlight('headon');
                        break;
                    }
                    case '4': {
                        void this.beginFlight('carrier');
                        break;
                    }
                    case '5': {
                        void this.beginFlight('carrierTakeoff');
                        break;
                    }
                    case '6': {
                        void this.beginFlight('highAlt');
                        break;
                    }
                    case '7': {
                        void this.beginFlight('space');
                        break;
                    }
                }
            }

            switch (event.key) {
                case 'n': {
                    this.currentPalette = (this.currentPalette + 1) % this.palettes.length;
                    this.renderer.setPalette(this.getPalette());
                    break;
                }
            }
        });
    }

    private leaveShowcaseIfActive() {
        if (this.view !== PlayerViewState.SHOWCASE) {
            return;
        }
        this.player.setShowcaseMode(false);
        this.player.setSimulationPaused(false);
        this.scene.setRenderFilter(undefined);
        this.viewBeforeShowcase = null;
        this.clearShowcasePickingState();
    }

    private toggleShowcaseView() {
        if (this.view === PlayerViewState.SHOWCASE) {
            this.exitShowcaseView();
        } else if (!this.player.isCrashed) {
            this.enterShowcaseView();
        }
    }

    private enterShowcaseView() {
        this.viewBeforeShowcase = this.view;
        this.resetOrbit();
        restoreMainCameraParameters(this.playerCamera.main);
        this.player.setShowcaseMode(true);
        this.player.setSimulationPaused(true);
        this.scene.setRenderFilter(entity => entity === this.player);
        this.clearShowcasePickingState();
        this.setShowcaseView();
    }

    private exitShowcaseView() {
        this.player.setShowcaseMode(false);
        this.player.setSimulationPaused(false);
        this.scene.setRenderFilter(undefined);
        this.resetOrbit();
        const previous = this.viewBeforeShowcase ?? PlayerViewState.COCKPIT_FRONT;
        this.viewBeforeShowcase = null;
        restoreMainCameraParameters(this.playerCamera.main);
        this.clearShowcasePickingState();
        this.restoreView(previous);
    }

    private setShowcaseView() {
        this.view = PlayerViewState.SHOWCASE;
        this.player.exteriorView = true;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = false;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.exteriorEntities[i].enabled = false;
        }
    }

    private restoreView(view: PlayerViewState) {
        switch (view) {
            case PlayerViewState.COCKPIT_FRONT:
                this.setCockpitFrontView();
                break;
            case PlayerViewState.EXTERIOR_BEHIND:
            case PlayerViewState.EXTERIOR_FRONT:
                this.setExteriorView(view);
                break;
            case PlayerViewState.EXTERIOR_LEFT:
            case PlayerViewState.EXTERIOR_RIGHT:
                this.setExteriorView(view);
                break;
            case PlayerViewState.TARGET_TO:
            case PlayerViewState.TARGET_FROM:
                if (this.player.weaponsTarget) {
                    this.setExteriorView(view);
                } else {
                    this.setCockpitFrontView();
                }
                break;
            case PlayerViewState.STATIC_MODEL:
                this.setStaticModelView(this.staticModelIndex);
                break;
            default:
                this.setCockpitFrontView();
                break;
        }
    }

    private setCockpitFrontView() {
        this.leaveShowcaseIfActive();
        restoreMainCameraParameters(this.playerCamera.main);
        this.view = PlayerViewState.COCKPIT_FRONT;
        this.player.exteriorView = false;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        // Entering cockpit always starts unlocked; toggle padlock with F1 / Numpad*.
        this.setCockpitPadlock(false);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = true;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.exteriorEntities[i].enabled = false;
        }
    }

    private setExteriorBehindFrontView() {
        restoreMainCameraParameters(this.playerCamera.main);
        if (this.view !== PlayerViewState.EXTERIOR_BEHIND) {
            this.setExteriorView(PlayerViewState.EXTERIOR_BEHIND);
        } else {
            this.setExteriorView(PlayerViewState.EXTERIOR_FRONT);
        }
    }

    private setExteriorSideView() {
        restoreMainCameraParameters(this.playerCamera.main);
        if (this.view !== PlayerViewState.EXTERIOR_RIGHT) {
            this.setExteriorView(PlayerViewState.EXTERIOR_RIGHT);
        } else {
            this.setExteriorView(PlayerViewState.EXTERIOR_LEFT);
        }
    }

    private setTargetView() {
        restoreMainCameraParameters(this.playerCamera.main);
        if (this.view !== PlayerViewState.TARGET_TO) {
            this.setExteriorView(PlayerViewState.TARGET_TO);
        } else {
            this.setExteriorView(PlayerViewState.TARGET_FROM);
        }
    }

    private setAiChaseView() {
        if (!this.aiOpponent || !this.aiOpponent.enabled || !this.cameraUpdaters.has(PlayerViewState.AI_CHASE)) {
            return;
        }
        restoreMainCameraParameters(this.playerCamera.main);
        if (this.view !== PlayerViewState.AI_CHASE) {
            this.aiChaseHeading = ExteriorViewHeading.BACK;
        } else {
            this.aiChaseHeading = this.aiChaseHeading === ExteriorViewHeading.BACK
                ? ExteriorViewHeading.FRONT
                : ExteriorViewHeading.BACK;
        }
        (this.cameraUpdaters.get(PlayerViewState.AI_CHASE) as AiExteriorCameraUpdater)
            .setHeading(this.aiChaseHeading);
        this.setExteriorView(PlayerViewState.AI_CHASE);
    }

    private cycleStaticModelView() {
        if (this.view !== PlayerViewState.STATIC_MODEL) {
            this.staticModelIndex = 0;
        } else {
            this.staticModelIndex = (this.staticModelIndex + 1) % STATIC_MODEL_VIEWS.length;
        }
        this.setStaticModelView(this.staticModelIndex);
    }

    private setStaticModelView(index: number) {
        restoreMainCameraParameters(this.playerCamera.main);
        const entry = STATIC_MODEL_VIEWS[index];
        this.staticModelCameraUpdater.setTarget(entry.position, entry.heading);
        this.setExteriorView(PlayerViewState.STATIC_MODEL);
    }

    private setExteriorView(view: PlayerViewState) {
        this.leaveShowcaseIfActive();
        if (view !== PlayerViewState.EXTERIOR_BEHIND && view !== PlayerViewState.EXTERIOR_FRONT) {
            this.clearExteriorEnemyLock();
        }
        this.setCockpitPadlock(false);
        this.view = view;
        this.player.exteriorView = true;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = false;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.exteriorEntities[i].enabled = true;
        }
    }

    private getCameraUpdater(view: PlayerViewState): CameraUpdater {
        const updater = this.cameraUpdaters.get(view);
        assertIsDefined(updater);
        return updater;
    }

    transitionFromPlayerToCrashed() {
        if (this.view === PlayerViewState.CRASHED) {
            return;
        }
        this.damageSmoke?.ensureCrashPlume(PLAYER_SIM_ID);
        this.leaveShowcaseIfActive();
        this.resetOrbit();
        restoreMainCameraParameters(this.playerCamera.main);
        this.view = PlayerViewState.CRASHED;
        this.player.exteriorView = true;
        this.cameraUpdater = this.getCameraUpdater(this.view);
        for (let i = 0; i < this.cockpitEntities.length; i++) {
            this.cockpitEntities[i].enabled = false;
        }
        for (let i = 0; i < this.exteriorEntities.length; i++) {
            this.exteriorEntities[i].enabled = false;
        }
    }

    private enterSpawnMenu() {
        this.state = GameState.SPAWN_MENU;
        this.flightRecorder.stop();
        this.player.setSimulationPaused(true);
        this.spawnMenu.afterCrash = false;
        this.spawnMenu.enabled = true;
        this.spawnPanel.setTitle('Retro Flight Sim');
        this.refreshAircraftMenu();
        this.spawnPanel.show();

        this.player.reset(this.runwaySpawnPosition(), PLAYER_LAND_HEADING, PLAYER_LAND_SPAWN);
        this.damageSmoke?.reset();
        this.setCockpitFrontView();
    }

    /** Begin a flight using the aircraft + livery chosen in the spawn menu. */
    private async beginFlight(spawn: SpawnMode) {
        this.persistSpawnSelection(spawn);
        const def = this.selectedAircraftDef();
        if (def) {
            await this.preloadAircraftModels(def);
        }
        this.applySelectedAircraft();
        this.state = GameState.PLAYER;
        this.player.setSimulationPaused(false);
        this.spawnMenu.enabled = false;
        this.spawnPanel.hide();
        this.damageSmoke?.reset();

        if (spawn === 'runway') {
            this.player.reset(this.runwaySpawnPosition(), PLAYER_LAND_HEADING, PLAYER_LAND_SPAWN);
        } else if (spawn === 'carrier') {
            this.player.reset(
                this.carrierApproachSpawnPosition(),
                PLAYER_CARRIER_HEADING,
                this.carrierApproachSpawn(),
            );
        } else if (spawn === 'carrierTakeoff') {
            this.player.reset(
                this.carrierTakeoffSpawnPosition(),
                PLAYER_CARRIER_TAKEOFF_HEADING,
                this.carrierTakeoffSpawn(),
            );
        } else if (spawn === 'highAlt') {
            this.player.reset(this.highAltSpawnPosition(), PLAYER_STARTING_HEADING, PLAYER_SPACE_SPAWN);
        } else if (spawn === 'space') {
            this.player.reset(this.spaceSpawnPosition(), PLAYER_STARTING_HEADING, PLAYER_SPACE_SPAWN);
        } else {
            // Approach and head-on both start on a short final toward the runway.
            this.player.reset(this.landApproachSpawnPosition(), PLAYER_STARTING_HEADING, PLAYER_APPROACH_SPAWN);
        }
        // Warm DEM/meshes around the live spawn (covers menu respawns too).
        await this.preloadTerrainAroundPlane(this.player.position.x, this.player.position.z, spawn);
        this.spawnOpponent(spawn === 'headon');
        this.setCockpitFrontView();
        if (this.aiOpponent?.enabled) {
            this.player.setWeaponsTarget(this.aiOpponent);
        }
    }

    /**
     * Build the shared combat systems: a {@link SceneWorldQuery} for AI terrain
     * and obstacle awareness, the projectile pool, the player's gun + AI
     * autopilot, and one AI-flown opponent.
     */
    private setupCombat() {
        this.obstacles.length = 0;
        const addObstacle = (x: number, z: number, radius: number, height: number) =>
            this.obstacles.push({ position: new THREE.Vector3(x, 0, z), radius, height });
        // Airbase hangars + control tower.
        {
            const h1 = airbaseOffset(AIRBASE_LOCAL.hangar1.x, AIRBASE_LOCAL.hangar1.z);
            const h2 = airbaseOffset(AIRBASE_LOCAL.hangar2.x, AIRBASE_LOCAL.hangar2.z);
            const h3 = airbaseOffset(AIRBASE_LOCAL.hangar3.x, AIRBASE_LOCAL.hangar3.z);
            const h4 = airbaseOffset(AIRBASE_LOCAL.hangar4.x, AIRBASE_LOCAL.hangar4.z);
            const tw = airbaseOffset(AIRBASE_LOCAL.tower.x, AIRBASE_LOCAL.tower.z);
            addObstacle(h1.x, h1.z, 45, 22);
            addObstacle(h2.x, h2.z, 45, 22);
            addObstacle(h3.x, h3.z, 45, 22);
            addObstacle(h4.x, h4.z, 45, 22);
            addObstacle(tw.x, tw.z, 25, 45);
            const ref = airbaseOffset(TARGET_LOCAL.refinery.x, TARGET_LOCAL.refinery.z);
            addObstacle(ref.x, ref.z, 70, 60);
            const sam = airbaseOffset(TARGET_LOCAL.sam.x, TARGET_LOCAL.sam.z);
            addObstacle(sam.x, sam.z, 20, 25);
            const wh = airbaseOffset(TARGET_LOCAL.warehouse.x, TARGET_LOCAL.warehouse.z);
            addObstacle(wh.x, wh.z, 45, 22);
        }

        const runway: Runway = {
            center: AIRBASE_RUNWAY.clone(),
            heading: PLAYER_STARTING_HEADING,
            halfLength: RUNWAY_HALF_LENGTH_M,
            halfWidth: RUNWAY_STRIP_HALF_WIDTH,
        };

        // Hand the static world (terrain hills, ski jump, carrier deck, obstacles, runway)
        // to the sim worker so its AI pilots can navigate; then register the player as a
        // sim-owned aircraft (its physics + gun + autopilot all live there).
        this.combatSim.setWorld(serializeWorld(
            [], this.obstacles, runway, this.skiJumps, this.carrierMeshes,
            (() => {
                const pose = this.carrierPose();
                return [defaultArrestorCableField(
                    pose.position.x, pose.position.y, pose.position.z, pose.quaternion,
                )];
            })(),
            sampleHeightGrid((x, z) => this.planetTerrain.heightAtEnu(x, z), AIRBASE_RUNWAY.x, AIRBASE_RUNWAY.z),
            this.surfacePads,
            this.sceneryMeshes,
        ));
        this.combatSim.addAircraft({
            id: PLAYER_SIM_ID,
            faction: Faction.PLAYER,
            control: 'external',
            kinematic: false,
            aircraftConfig: flightConfigWithArrestorHook(this.currentDef),
            pilotOptions: { cruiseAltitude: 3000, cruiseSpeed: 220, hardDeck: 150 },
            hitRadius: PLAYER_HIT_RADIUS_M,
            maxHealth: 100,
            gun: PLAYER_GUN,
            collision: this.currentDef.collisionMesh,
            spawn: this.playerSimSpawn(),
            enabled: true,
        });
        this.player.setCombatSimClient(this.combatSim);
        this.player.setHasGun(true);
        this.player.setGroundHeightAt((x, z) => this.groundHeightAt(x, z));

        // The weapons field is now a pure renderer of the worker's projectile pool.
        this.weaponsField = new WeaponsField(this.models, this.combatSim);
        this.scene.add(this.weaponsField);

        this.debrisField = new DebrisField(this.materials);
        this.scene.add(this.debrisField);
        this.damageSmoke = new DamageSmokeField(this.materials);
        this.damageSmoke.setPoseProvider((targetId) => this.getDamageSmokePose(targetId));
        this.scene.add(this.damageSmoke);
        this.combatSim.onHits = (hits) => {
            const gunHits = hits.filter(h => h.source !== 'scrape');
            const scrapes = hits.filter(h => h.source === 'scrape');
            if (gunHits.length > 0) {
                this.debrisField?.spawnFromHits(gunHits);
                this.damageSmoke?.spawnFromHits(gunHits);
            }
            if (scrapes.length > 0) {
                this.damageSmoke?.spawnGroundScrapes(scrapes);
                this.debrisField?.spawnGroundScrapes(scrapes);
            }
        };

        // Spawn N AI opponents (the snapshot + worker are already multi-aircraft;
        // each gets a distinct sim id ai0..aiN-1). They start disabled until the
        // player triggers a merge (see spawnOpponent). Same FlyableAircraftDef /
        // FM / FX as the player — only control: 'ai' vs keyboard/joystick.
        this.aiOpponents.length = 0;
        for (let i = 0; i < AI_OPPONENT_COUNT; i++) {
            const ai = new AiAircraftEntity(
                this.models,
                this.currentDef,
                this.combatSim,
                aiSimId(i),
                Faction.ENEMY,
                {
                    position: PLAYER_STARTING_POSITION.clone().add(
                        FORWARD.clone().applyAxisAngle(UP, PLAYER_STARTING_HEADING).multiplyScalar(AI_SPAWN_DISTANCE_M)),
                    heading: PLAYER_STARTING_HEADING,
                    airborne: true,
                    throttle: PLAYER_APPROACH_SPAWN.throttle,
                    velocity: PLAYER_APPROACH_SPAWN.velocity!.clone(),
                },
                this.materials,
                PLAYER_GUN,
                this.opponentPilotOptions(),
            );
            ai.enabled = false;
            this.combatSim.setEnabled(ai.simId, false);
            ai.setGroundHeightAt((x, z) => this.groundHeightAt(x, z));
            this.scene.add(ai);
            this.aiOpponents.push(ai);
        }
        this.aiOpponent = this.aiOpponents[0];

        this.cameraUpdaters.set(
            PlayerViewState.AI_CHASE,
            new AiExteriorCameraUpdater(this.player, this.playerCamera.main, this.aiOpponent!));
    }

    /** Current player transform as a combat-sim spawn descriptor. */
    private playerSimSpawn(): SimAircraftSpawn {
        return {
            position: this.player.position.toArray() as [number, number, number],
            quaternion: this.player.quaternion.toArray() as [number, number, number, number],
            velocity: this.player.velocityVector.toArray() as [number, number, number],
            landed: this.player.isLanded,
            throttle: this.player.throttleUnit,
            airborne: !this.player.isLanded,
        };
    }

    /** Pilot options for the next opponent spawn (includes active AI model). */
    private opponentPilotOptions(): AiPilotOptions {
        const model = this.configService.aiPilotModels.getActive();
        return {
            cruiseAltitude: APPROACH_ALTITUDE_M,
            cruiseSpeed: APPROACH_SPEED_MPS,
            combatSpeed: 180,
            gunRange: 900,
            hardDeck: 200,
            // CLASSIC-only knob; Shaw and Aggressive each run their own tactical
            // matrix (Offensive/Neutral/Defensive, resp. Attack/Merge/Counter).
            alwaysEngage: model === AiPilotModels.CLASSIC,
            skill: AiSkillLevel.ACE,
            model,
        };
    }

    /**
     * Spawn/enable AI opponents at the player's altitude/speed.
     * Same-heading: ahead on the player's nose. Head-on: ahead facing the player.
     */
    private spawnOpponent(headOn = false) {
        if (this.aiOpponents.length === 0) {
            return;
        }
        const p = this.player.position;
        const playerForward = FORWARD.clone()
            .applyQuaternion(this.player.quaternion)
            .setY(0)
            .normalize();
        const playerHeading = Math.atan2(playerForward.x, playerForward.z);
        const right = RIGHT.clone().applyAxisAngle(UP, playerHeading);
        const speed = this.player.velocityVector.length();
        const aiHeading = headOn ? playerHeading + Math.PI : playerHeading;
        const aiForward = headOn
            ? playerForward.clone().negate()
            : playerForward.clone();
        const velocity = aiForward.multiplyScalar(speed);
        // Preserve vertical speed so co-altitude spawn stays level with the player.
        velocity.y = this.player.velocityVector.y;

        const standoff = headOn ? AI_HEADON_SPAWN_DISTANCE_M : AI_ENGAGE_SPAWN_DISTANCE_M;
        const pilotOptions = this.opponentPilotOptions();
        const LATERAL_SPACING_M = 80;
        for (let i = 0; i < this.aiOpponents.length; i++) {
            const ai = this.aiOpponents[i];
            // Ahead at standoff; fan extras slightly aside.
            const lateral = this.aiOpponents.length === 1 ? 0 : (i - (this.aiOpponents.length - 1) / 2) * LATERAL_SPACING_M;
            const position = new THREE.Vector3(p.x, p.y, p.z)
                .addScaledVector(playerForward, standoff)
                .addScaledVector(right, lateral);

            // Rebuild pilot so OSD AI-model changes apply on this merge.
            this.combatSim.setPilotOptions(ai.simId, pilotOptions);
            ai.respawn({
                position,
                heading: aiHeading,
                airborne: !this.player.isLanded,
                throttle: this.player.throttleUnit,
                velocity,
            });
            this.combatSim.setTarget(ai.simId, PLAYER_SIM_ID);
            this.combatSim.setPhase(ai.simId, AiFlightPhase.ENGAGE);
        }
        this.aiStraightTimer = 0;

        // The player's in-worker autopilot flies home and lands (RTB); it also
        // knows about the primary opponent should combat logic be enabled for it later.
        this.combatSim.setTarget(PLAYER_SIM_ID, this.aiOpponents[0].simId);
        this.combatSim.setPhase(PLAYER_SIM_ID, AiFlightPhase.RTB);
    }

    /** After the straight-flight hold, promote AI opponents into ENGAGE. */
    private updateAiStraightTimer(delta: number): void {
        if (this.aiStraightTimer <= 0) {
            return;
        }
        this.aiStraightTimer -= delta;
        if (this.aiStraightTimer > 0) {
            return;
        }
        this.aiStraightTimer = 0;
        for (let i = 0; i < this.aiOpponents.length; i++) {
            const ai = this.aiOpponents[i];
            if (ai.enabled) {
                this.combatSim.setPhase(ai.simId, AiFlightPhase.ENGAGE);
            }
        }
    }

    private async setupScene(spawn: SpawnMode) {
        const manifest = await loadTerrainManifest();

        this.skyEntity = new SimpleEntity(this.models.getModel('lib:SKY'), SceneLayers.BackgroundSky, SceneLayers.BackgroundSky);
        this.skyEntity.position.set(0, 7, 0);
        this.scene.add(this.skyEntity);

        // Low-poly cumulus deck, tiled around the camera (see SceneryField) with a
        // huge bounding area so it always covers wherever the player roams. Altitude
        // undulates smoothly per puff so the deck doesn't look perfectly flat.
        const cloudFieldOptions: SceneryFieldSettings = {
            tilesInField: 9,
            cellsInTile: 2,
            tileLength: 6000,
            cellVariations: [
                // Lower (negative) LOD bias than the default: clouds are huge,
                // numerous and never inspected up close like a vehicle, so
                // their haze-tier LOD levels (see cloudModelBuilder.ts) should
                // start shedding detail well before the default bias would
                // ever let them.
                { probability: 0.12, model: 'lib:cloudLarge', jitter: 1, randomRotation: true, lodBias: -2 },
                { probability: 0.18, model: 'lib:cloudMedium', jitter: 1, randomRotation: true, lodBias: -2 },
                { probability: 0.15, model: 'lib:cloudSmall', jitter: 1, randomRotation: true, lodBias: -2 },
                { probability: 0.55, model: 'lib:cloudNone', jitter: 0, randomRotation: false },
            ],
            statsKey: 'cloud',
        };
        const cloudAltitudeAt = (x: number, z: number) =>
            CLOUD_BASE_ALTITUDE_M + Math.sin(x * 0.00021) * Math.cos(z * 0.00017) * CLOUD_ALTITUDE_VARIATION_M;
        this.cloudField = new SceneryField(
            this.models,
            new THREE.Box2(new THREE.Vector2(-1e7, -1e7), new THREE.Vector2(1e7, 1e7)),
            cloudFieldOptions,
            cloudAltitudeAt,
        );
        this.scene.add(this.cloudField);

        // High-altitude cirrus streaks — a separate, sparser, much higher
        // band above the cumulus deck. Bigger tiles since streaks are large
        // and meant to read as occasional wisps rather than a solid layer.
        // No random rotation: real cirrus streaks all align with the same
        // high-altitude wind shear, so every streak keeps the same heading.
        const cirrusFieldOptions: SceneryFieldSettings = {
            tilesInField: 7,
            cellsInTile: 2,
            tileLength: 60000,
            cellVariations: [
                { probability: 0.08, model: 'lib:cirrusWide', jitter: 1, randomRotation: false },
                { probability: 0.12, model: 'lib:cirrusThin', jitter: 1, randomRotation: false },
                { probability: 0.8, model: 'lib:cirrusNone', jitter: 0, randomRotation: false },
            ],
            statsKey: 'cirrus',
        };
        const cirrusAltitudeAt = (x: number, z: number) =>
            CIRRUS_BASE_ALTITUDE_M + Math.sin(x * 0.00013 + 5) * Math.cos(z * 0.00009 + 5) * CIRRUS_ALTITUDE_VARIATION_M;
        this.cirrusField = new SceneryField(
            this.models,
            new THREE.Box2(new THREE.Vector2(-1e7, -1e7), new THREE.Vector2(1e7, 1e7)),
            cirrusFieldOptions,
            cirrusAltitudeAt,
        );
        this.scene.add(this.cirrusField);

        setBootProgress(35, 'Loading terrain...');
        this.planetTerrain = new TerrainEntity({
            manifest,
            manifestUrl: DEFAULT_TERRAIN_URL,
            materials: this.materials,
            enuOrigin: PLAY_ORIGIN,
        });
        await this.planetTerrain.load(DEFAULT_TERRAIN_URL);
        this.planetTerrain.setLodCamera(this.playerCamera.main);
        this.scene.add(this.planetTerrain);
        const center = this.spawnCenterEnu(spawn);
        setBootProgress(45, 'Loading terrain tiles...');
        // The airbase flatten pad is baked into both the mesh and the height
        // field, so there is no pad to lock here any more — that DEM sample and
        // the re-mesh it forced were the slowest step in the old boot.
        await this.preloadTerrainAroundPlane(center.x, center.z, spawn);
        setBootProgress(50, 'Building terrain meshes...');
        this.osmMapEntity = new OsmMapEntity(this.planetTerrain.basis);
        this.scene.add(this.osmMapEntity);

        setBootProgress(60, 'Loading airbase...');
        await this.addAirBase(this.scene, this.models);

        setBootProgress(75, 'Loading scenery...');
        await this.addRefinery(this.scene, this.models);

        const samradar = new GroundTargetEntity(this.models.getModel('assets/samradar01.glb'), 0, 'SAM Radar', 'Stosneehar');
        {
            const p = airbaseOffset(TARGET_LOCAL.sam.x, TARGET_LOCAL.sam.z);
            samradar.position.set(p.x, this.groundHeightMaxUnder(p.x, p.z, 25, 25), p.z);
        }
        this.scene.add(samradar);
        await this.addSolidSceneryMesh('assets/samradar01.glb', samradar);

        const warehouse = new GroundTargetEntity(this.models.getModel('assets/hangar01.gltf'), undefined, 'Warehouse', 'Radlydd');
        {
            const p = airbaseOffset(TARGET_LOCAL.warehouse.x, TARGET_LOCAL.warehouse.z);
            warehouse.position.set(p.x, this.groundHeightMaxUnder(p.x, p.z, 30, 40), p.z);
        }
        warehouse.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        this.scene.add(warehouse);
        await this.addSolidSceneryMesh('assets/hangar01.gltf', warehouse);

        // All scenery is placed — its colliders become solid ground from here on.
        this.activateSceneryColliders();

        this.scene.add(this.player);

        this.setupCombat();

        const hud = new HUDEntity(this.player, this.configService);
        this.cockpitEntities.push(hud);
        this.scene.add(hud);

        const cockpit = new CockpitEntity(
            this.player, this.playerCamera.main, this.targetCamera.main, this.mapCamera, this.osmMapEntity,
        );
        this.cockpitEntities.push(cockpit);
        this.scene.add(cockpit);

        const exteriorData = new ExteriorDataEntity(this.player, this.configService);
        exteriorData.enabled = false;
        this.exteriorEntities.push(exteriorData);
        this.scene.add(exteriorData);

        this.scene.add(this.spawnMenu);

        this.perfHud = new PerfHudEntity();
        this.scene.add(this.perfHud);
    }

    private async addRefinery(scene: Scene, models: ModelManager) {
        const base = airbaseOffset(TARGET_LOCAL.refinery.x, TARGET_LOCAL.refinery.z);
        const x = base.x;
        const z = base.z;
        const yAt = (px: number, pz: number, halfW = 40, halfD = 40) =>
            this.groundHeightMaxUnder(px, pz, halfW, halfD);

        const refinery = new GroundTargetEntity(models.getModel('assets/refinery_towers01.gltf'), 2, 'Oil Refinery', 'Radlydd');
        refinery.position.set(x, yAt(x, z, 80, 80), z);
        scene.add(refinery);
        await this.addSolidSceneryMesh('assets/refinery_towers01.gltf', refinery);

        const depot01a = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01a.position.set(x, yAt(x, z - 100), z - 100);
        scene.add(depot01a);
        await this.addSolidSceneryMesh('assets/refinery_depot01.gltf', depot01a);

        const depot01b = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01b.position.set(x, yAt(x, z + 100), z + 100);
        depot01b.quaternion.setFromAxisAngle(UP, Math.PI);
        scene.add(depot01b);
        await this.addSolidSceneryMesh('assets/refinery_depot01.gltf', depot01b);

        const depot01c = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01c.position.set(x + 100, yAt(x + 100, z - 100), z - 100);
        scene.add(depot01c);
        await this.addSolidSceneryMesh('assets/refinery_depot01.gltf', depot01c);

        const depot02a = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'), 2);
        depot02a.position.set(x - 150, yAt(x - 150, z - 50), z - 50);
        scene.add(depot02a);
        await this.addSolidSceneryMesh('assets/refinery_depot02.gltf', depot02a);

        const depot02b = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'), 2);
        depot02b.position.set(x + 150, yAt(x + 150, z + 50), z + 50);
        scene.add(depot02b);
        await this.addSolidSceneryMesh('assets/refinery_depot02.gltf', depot02b);
    }

    /** Register a flat lifted pavement as solid ground with a feathered edge skirt. */
    private addSurfacePad(
        centerX: number, centerZ: number, heading: number,
        halfLength: number, halfWidth: number,
        surfaceY: number, baseY: number,
    ): void {
        this.surfacePads.push({
            centerX, centerZ, heading, halfLength, halfWidth,
            surfaceY, baseY, feather: SURFACE_PAD_FEATHER_M,
        });
    }

    /**
     * Bake a placed scenery model into a solid ground collider (same soup
     * sampling as the carrier deck), applying the entity's rotation and scale.
     * Staged until {@link activateSceneryColliders} so it does not disturb
     * the placement of nearby scenery still being positioned.
     */
    private async addSolidSceneryMesh(
        url: string,
        entity: { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 },
    ): Promise<void> {
        await this.models.waitForModel(url);
        const root = new THREE.Matrix4().compose(new THREE.Vector3(), entity.quaternion, entity.scale);
        const soup = bakeCollisionMeshFromModel(this.models.getModel(url), root);
        if (soup) {
            this.stagedSceneryMeshes.push(createCarrierMeshCollider(
                entity.position.x, entity.position.y, entity.position.z, soup,
            ));
        }
    }

    /** Make all staged scenery colliders solid; call once all scenery is placed. */
    private activateSceneryColliders(): void {
        this.sceneryMeshes.push(...this.stagedSceneryMeshes);
        this.stagedSceneryMeshes.length = 0;
    }

    private async addAirBase(scene: Scene, models: ModelManager) {
        this.surfacePads.length = 0;
        this.sceneryMeshes.length = 0;
        this.stagedSceneryMeshes.length = 0;
        const yAt = (px: number, pz: number, halfW = 40, halfD = 40) =>
            this.groundHeightMaxUnder(px, pz, halfW, halfD);
        const place = (dx: number, dz: number, halfW = 40, halfD = 40) => {
            const p = airbaseOffset(dx, dz);
            return { x: p.x, y: yAt(p.x, p.z, halfW, halfD), z: p.z };
        };

        const hangarGround1 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
        {
            const p = place(AIRBASE_LOCAL.hangarGround1.x, AIRBASE_LOCAL.hangarGround1.z, 100, 100);
            hangarGround1.position.set(p.x, p.y + SCENERY_SURFACE_EPS_M, p.z);
            this.addSurfacePad(p.x, p.z, 0, HANGAR_GROUND_HALF_M, HANGAR_GROUND_HALF_M, p.y + SCENERY_SURFACE_EPS_M, p.y);
        }
        hangarGround1.scale.set(200, 1, 200);
        scene.add(hangarGround1);

        const hangarGround2 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
        {
            const p = place(AIRBASE_LOCAL.hangarGround2.x, AIRBASE_LOCAL.hangarGround2.z, 100, 100);
            hangarGround2.position.set(p.x, p.y + SCENERY_SURFACE_EPS_M, p.z);
            this.addSurfacePad(p.x, p.z, 0, HANGAR_GROUND_HALF_M, HANGAR_GROUND_HALF_M, p.y + SCENERY_SURFACE_EPS_M, p.y);
        }
        hangarGround2.scale.set(200, 1, 200);
        scene.add(hangarGround2);

        const runway = new GroundTargetEntity(models.getModel('assets/runway01.gltf'), 0, 'Airbase', 'Stosneehar');
        runway.position.copy(AIRBASE_RUNWAY);
        const runwayPadY = yAt(AIRBASE_RUNWAY.x, AIRBASE_RUNWAY.z, 80, 900);
        runway.position.y = runwayPadY + SCENERY_SURFACE_EPS_M;
        scene.add(runway);
        // The pavement is solid ground: gear/physics rest on its top, not the pad below.
        this.addSurfacePad(
            AIRBASE_RUNWAY.x, AIRBASE_RUNWAY.z, PLAYER_STARTING_HEADING,
            RUNWAY_HALF_LENGTH_M, RUNWAY_PAVEMENT_HALF_WIDTH,
            runway.position.y, runwayPadY,
        );

        // Kuznetsov carrier from data/kuz.blend (exported via tools/export_kuz.py).
        // Collision soup is baked from the same GLB used for rendering.
        await this.models.waitForModel('assets/kuz.glb');
        const kuzModel = models.getModel('assets/kuz.glb');
        this.carrierMeshes.length = 0;
        const kuzCollision = bakeCollisionMeshFromModel(kuzModel);
        if (kuzCollision) {
            this.carrierMeshes.push(createCarrierMeshCollider(
                KUZ_POSITION.x,
                KUZ_POSITION.y,
                KUZ_POSITION.z,
                kuzCollision,
            ));
        }
        const kuz = new GroundTargetEntity(kuzModel, 0, 'Carrier', 'Stosneehar');
        kuz.position.copy(KUZ_POSITION);
        this.kuz = kuz;
        scene.add(kuz);

        const arrestorCables = new ArrestorCablesEntity(
            this.materials,
            () => this.carrierPose(),
            () => this.player,
            (x, z) => this.groundHeightAt(x, z),
        );
        scene.add(arrestorCables);
        this.player.setArrestorCarrierPoseProvider(() => this.carrierPose());

        const shipWake = new ShipWakeEntity(this.materials, () => this.carrierPose());
        scene.add(shipWake);

        // Carrier-style ski jump 90 m ahead of the runway spawn, rising toward +Z (takeoff).
        this.skiJumps.length = 0;
        const skiJumpAheadM = 90;
        const skiJumpOrigin = PLAYER_LAND_POSITION.clone().setY(0).add(
            FORWARD.clone().applyAxisAngle(UP, PLAYER_LAND_HEADING).multiplyScalar(skiJumpAheadM),
        );
        skiJumpOrigin.y = yAt(skiJumpOrigin.x, skiJumpOrigin.z, 30, 40);
        this.skiJumps.push(createSkiJumpCollider(
            skiJumpOrigin.x,
            skiJumpOrigin.y,
            skiJumpOrigin.z,
            PLAYER_LAND_HEADING,
        ));
        const skiJump = new StaticSceneryEntity(models.getModel('lib:skiJump'));
        skiJump.position.copy(skiJumpOrigin);
        skiJump.quaternion.setFromAxisAngle(UP, PLAYER_LAND_HEADING);
        scene.add(skiJump);

        const hangar1 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        {
            const p = place(AIRBASE_LOCAL.hangar1.x, AIRBASE_LOCAL.hangar1.z, 40, 50);
            hangar1.position.set(p.x, p.y, p.z);
        }
        hangar1.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar1);
        await this.addSolidSceneryMesh('assets/hangar01.gltf', hangar1);

        const hangar2 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        {
            const p = place(AIRBASE_LOCAL.hangar2.x, AIRBASE_LOCAL.hangar2.z, 40, 50);
            hangar2.position.set(p.x, p.y, p.z);
        }
        hangar2.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar2);
        await this.addSolidSceneryMesh('assets/hangar01.gltf', hangar2);

        const hangar3 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        {
            const p = place(AIRBASE_LOCAL.hangar3.x, AIRBASE_LOCAL.hangar3.z, 40, 50);
            hangar3.position.set(p.x, p.y, p.z);
        }
        hangar3.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar3);
        await this.addSolidSceneryMesh('assets/hangar01.gltf', hangar3);

        const hangar4 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        {
            const p = place(AIRBASE_LOCAL.hangar4.x, AIRBASE_LOCAL.hangar4.z, 40, 50);
            hangar4.position.set(p.x, p.y, p.z);
        }
        hangar4.quaternion.setFromAxisAngle(UP, Math.PI);
        scene.add(hangar4);
        await this.addSolidSceneryMesh('assets/hangar01.gltf', hangar4);

        const staticAircraft: Promise<void>[] = [];
        forEachStaticAircraftSlot((type, position, heading) => {
            const gy = yAt(position.x, position.z, 15, 15);
            const plane = new StaticSceneryEntity(models.getModel(type.body), type.lodBias);
            plane.position.copy(position).setY(gy + PLANE_DISTANCE_TO_GROUND);
            plane.quaternion.setFromAxisAngle(UP, heading);
            scene.add(plane);
            staticAircraft.push(this.addSolidSceneryMesh(type.body, plane));

            const shadow = new StaticSceneryEntity(models.getModel(type.shadow), type.lodBias);
            shadow.position.copy(position).setY(gy + SCENERY_SURFACE_EPS_M);
            shadow.quaternion.setFromAxisAngle(UP, heading);
            scene.add(shadow);
        });
        await Promise.all(staticAircraft);

        const tower = new StaticSceneryEntity(models.getModel('assets/control01.gltf'));
        {
            const p = place(AIRBASE_LOCAL.tower.x, AIRBASE_LOCAL.tower.z, 30, 30);
            tower.position.set(p.x, p.y, p.z);
        }
        tower.quaternion.setFromAxisAngle(UP, -Math.PI / 2);
        scene.add(tower);
        await this.addSolidSceneryMesh('assets/control01.gltf', tower);
    }

    private isLandAt(worldX: number, worldZ: number): boolean {
        return this.planetTerrain.isLandEnu(worldX, worldZ);
    }

    private getPalette(): Palette {
        return this.palettes[this.currentPalette];
    }
}
