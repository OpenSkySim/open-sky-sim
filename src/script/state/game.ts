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
import { KernelRenderTask, KernelUpdateTask } from '../core/kernel';
import { FlightRecorder } from '../physics/flightRecorder';
import { fm2GroundRestHeight } from '../physics/fm2/fm2AircraftConfig';
import { AIRBASE_RUNWAY as AIRBASE_RUNWAY_RAW, APPROACH_ALTITUDE_M, APPROACH_FINAL_DISTANCE_M, APPROACH_SPEED_MPS, COCKPIT_FAR, COCKPIT_FOV, HI_H_RES, HI_V_RES, H_RES, isTelemetryGraphKey, LO_H_RES, LO_V_RES, PLANE_DISTANCE_TO_GROUND, RUNWAY_HALF_LENGTH_M, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, V_RES } from '../defs';
import { Renderer, RenderLayer, RenderTargetType } from "../render/renderer";
import { SceneCamera } from '../scene/cameras/camera';
import { GroundSmokeEntity } from '../scene/entities/groundSmoke';
import { GroundTargetEntity } from '../scene/entities/groundTarget';
import { CockpitEntity, CockpitMFD1X, CockpitMFD1Y, CockpitMFD2X, CockpitMFD2Y, CockpitMFDSize } from '../scene/entities/overlay/cockpit';
import { ExteriorDataEntity } from '../scene/entities/overlay/exteriorData';
import { HUDEntity } from '../scene/entities/overlay/hud';
import { TelemetryGraph } from '../scene/entities/overlay/telemetryGraph';
import { TelemetryGraphWindow } from '../scene/entities/overlay/telemetryGraphWindow';
import { PlayerEntity, PlayerSpawnState } from '../scene/entities/player';
import { createHillCollider, HillCollider } from '../scene/entities/hillCollider';
import { SceneryField, SceneryFieldSettings } from '../scene/entities/sceneryField';
import { VegetationField } from '../scene/entities/vegetationField';
import { VegetationKind } from '../scene/models/lib/vegetationModelBuilder';
import { SimpleEntity } from '../scene/entities/simpleEntity';
import { SpecklesEntity } from '../scene/entities/speckles';
import { StaticSceneryEntity } from '../scene/entities/staticScenery';
import { Entity } from '../scene/entity';
import { SceneMaterialManager } from "../scene/materials/materials";
import { Model, ModelManager } from "../scene/models/models";
import { HILL_MODEL_BASE_RADIUS, HILL_MODEL_HEIGHT, MOUNTAIN_MODEL_BASE_RADIUS, MOUNTAIN_MODEL_HEIGHT } from '../scene/models/lib/mountainModelBuilder';
import { Scene, SceneLayers } from '../scene/scene';
import { updateTargetCamera } from '../scene/utils';
import { assertIsDefined } from '../utils/asserts';
import { clamp, FORWARD, RIGHT, UP, toDegrees } from '../utils/math';
import { CameraUpdater } from './cameraUpdaters/cameraUpdater';
import { CockpitFrontCameraUpdater } from './cameraUpdaters/cockpitFrontCameraUpdater';
import { CrashedCameraUpdater } from './cameraUpdaters/crashedCameraUpdater';
import { ExteriorFrontBehindCameraUpdater, ExteriorViewHeading } from './cameraUpdaters/exteriorFrontBehindCameraUpdater';
import { AiExteriorCameraUpdater, AI_CHASE_MERGE_DISTANCE_M } from './cameraUpdaters/aiExteriorCameraUpdater';
import { ExteriorSideCameraUpdater, ExteriorViewSide } from './cameraUpdaters/exteriorSideCameraUpdater';
import { TargetFromCameraUpdater } from './cameraUpdaters/targetFromCameraUpdater';
import { TargetToCameraUpdater } from './cameraUpdaters/targetToCameraUpdater';
import { StaticModelCameraUpdater } from './cameraUpdaters/staticModelCameraUpdater';
import { ShowcaseCameraUpdater } from './cameraUpdaters/showcaseCameraUpdater';
import { applyAiChaseCameraParameters, restoreMainCameraParameters } from './stateUtils';
import { forEachStaticAircraftSlot, STATIC_MODEL_VIEWS } from './staticModelViews';
import { SpawnMenuEntity } from '../scene/entities/overlay/spawnMenu';
import { SpawnPanel } from '../osd/spawnPanel';
import { AircraftRegistry, buildF22Def } from './aircraftRegistry';
import { FlyableAircraftDef } from '../scene/entities/aircraftDef';
import { Obstacle, Runway, SceneWorldQuery } from '../ai/worldQuery';
import { AiPilot, AiFlightPhase } from '../ai/aiPilot';
import { PlayerPilotAdapter } from '../ai/playerPilotAdapter';
import { AiAircraftEntity } from '../scene/entities/aiAircraft';
import { WeaponsField } from '../scene/entities/weaponsField';
import { Combatant, Faction } from '../weapons/combatant';

const DEFAULT_START_AIRCRAFT_ID = 'cold_war_planes_f_15c_32nd';
/** Built-in aircraft to spawn when the preferred default pack isn't available. */
const FALLBACK_START_AIRCRAFT_ID = 'f22';
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
const VEGETATION_FIELD_OPTIONS = {
    cellSize: 75,
    fillRatio: 0.68,
    tilesInView: 250,
    treesPerCell: 10,
    maxTreesPerFrame: 14000,
    outerCellStep: 3,
    lowDetailRangeM: 100000,
    // Trees stay full-detail 3D volumes out to this radius (independent of the
    // density ramp), so detailed trees remain visible well ahead when flying.
    fullDetailRangeM: 6000,
    scaleMin: 0.7,
    scaleMax: 1.35,
};
const PLAYER_STARTING_HEADING = 0;
const PLAYER_STARTING_POSITION = new THREE.Vector3(
    AIRBASE_RUNWAY.x,
    APPROACH_ALTITUDE_M,
    AIRBASE_RUNWAY.z - APPROACH_FINAL_DISTANCE_M,
);
const PLAYER_APPROACH_SPAWN: PlayerSpawnState = {
    velocity: FORWARD.clone().applyAxisAngle(UP, PLAYER_STARTING_HEADING).multiplyScalar(APPROACH_SPEED_MPS),
    throttle: 0.38,
    airborne: true,
};

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
    private landTerrainMeshes: THREE.Object3D[] = [];
    private waterTerrainMeshes: THREE.Object3D[] = [];
    private readonly terrainCaster = new THREE.Raycaster();
    private readonly terrainRayOrigin = new THREE.Vector3();
    private readonly terrainRayDir = new THREE.Vector3(0, -1, 0);
    private readonly hillColliders: HillCollider[] = [];
    private readonly obstacles: Obstacle[] = [];
    private worldQuery: SceneWorldQuery | undefined;
    private weaponsField: WeaponsField | undefined;
    private aiOpponent: AiAircraftEntity | undefined;
    private playerPilot: AiPilot | undefined;

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
    private heldOrbitKeys = new Set<string>();
    private _orbitPivot = new THREE.Vector3();
    private _orbitOffset = new THREE.Vector3();
    private _orbitAxis = new THREE.Vector3();

    private cockpitEntities: Entity[] = [];
    private readonly telemetryGraph = new TelemetryGraph();
    private readonly telemetryGraphWindow = new TelemetryGraphWindow();
    private readonly telemetryAccel = new THREE.Vector3();
    private exteriorEntities: Entity[] = [];

    private groundSmoke: GroundSmokeEntity;
    private groundFire: StaticSceneryEntity;
    private spawnMenu: SpawnMenuEntity;
    private spawnPanel: SpawnPanel;

    private aircraftRegistry = new AircraftRegistry();
    private currentDef: FlyableAircraftDef;
    private selectedAircraft = 0;
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
        private audio: AudioSystem) {

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

        this.groundSmoke = new GroundSmokeEntity(models.getModel('lib:groundSmoke'));
        this.groundSmoke.enabled = false;
        this.groundFire = new StaticSceneryEntity(models.getModel('lib:smallFire'));
        this.groundFire.enabled = false;
        this.spawnMenu = new SpawnMenuEntity();
        this.spawnPanel = new SpawnPanel(
            (index) => this.selectAircraftByIndex(index),
            () => void this.beginFlight('approach'),
            () => void this.beginFlight('runway'),
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
            if (this.currentDef.flight) {
                flightModel.setAircraft(this.currentDef.flight);
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
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
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
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
            }
        ];
        const mapLayersLo: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_LO,
                camera: this.mapCamera,
                lists: [SceneLayers.Terrain]
            }
        ];
        const mapLayersHi: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_HI,
                camera: this.mapCamera,
                lists: [SceneLayers.Terrain]
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
                lists: [SceneLayers.Terrain, SceneLayers.EntityFlats, SceneLayers.EntityVolumes, SceneLayers.EntityFX]
            }
        ];
        const mapLayersHd: RenderLayer[] = [
            {
                target: MAP_RENDER_TARGET_HD,
                camera: this.mapCamera,
                lists: [SceneLayers.Terrain]
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
        await this.loadPersistedPacks();
        await this.setupScene();
        this.refreshAircraftMenu();
        this.selectAircraftById(DEFAULT_START_AIRCRAFT_ID, FALLBACK_START_AIRCRAFT_ID);
        await this.beginFlight('approach');
        this.setExteriorBehindFrontView();
        window.addEventListener('resize', () => this.onViewportResize());
    }

    private refreshAircraftMenu() {
        const list = this.aircraftRegistry.list();
        this.selectedAircraft = Math.min(this.selectedAircraft, Math.max(0, list.length - 1));
        this.spawnPanel.setAircraft(list.map(def => def.name), this.selectedAircraft);
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
                    .map(p => this.aircraftRegistry.loadPack(p.id, p.packUrl)),
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
            ...def.surfaces.map(s => s.model),
        ];
        await Promise.all(urls.map(url => this.models.waitForModel(url)));
    }

    private selectAircraftByIndex(index: number) {
        const list = this.aircraftRegistry.list();
        if (index < 0 || index >= list.length) {
            return;
        }
        this.selectedAircraft = index;
        this.spawnPanel.setSelectedIndex(index);
    }

    private selectAircraftById(id: string, fallbackId?: string): void {
        const list = this.aircraftRegistry.list();
        let index = list.findIndex(def => def.id === id);
        if (index < 0 && fallbackId !== undefined) {
            index = list.findIndex(def => def.id === fallbackId);
        }
        if (index >= 0) {
            this.selectAircraftByIndex(index);
        }
    }

    /** Swap the player to the aircraft chosen in the spawn menu, if different. */
    private applySelectedAircraft() {
        const list = this.aircraftRegistry.list();
        const def = list[this.selectedAircraft];
        if (!def || def.id === this.currentDef.id) {
            return;
        }
        this.currentDef = def;
        this.player.loadAircraft(def);
        if (def.flight) {
            this.configService.flightModels.getActive().setAircraft(def.flight);
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
        this.setModStatus(`Importing ${file.name}...`, 0);
        try {
            const form = new FormData();
            form.append('mod', file);
            const res = await fetch('/api/import-mod', { method: 'POST', body: form });

            if (res.status === 405 || res.status === 404) {
                this.setModStatus(
                    'Import unavailable: run npm run serve and open that URL (not a static file server).',
                );
                return;
            }

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
            this.enterSpawnMenu(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.setModStatus(`Import failed: ${msg}`);
        } finally {
            this.modImportInFlight = false;
        }
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

    /** Runway spawn position; Y matches FM2 gear rest height when the aircraft has a flight config. */
    private runwaySpawnPosition(): THREE.Vector3 {
        const y = this.currentDef.flight
            ? fm2GroundRestHeight(this.currentDef.flight)
            : PLANE_DISTANCE_TO_GROUND;
        return PLAYER_LAND_POSITION.clone().setY(y);
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
            this.updateOrbitFromKeys(delta);
            this.recordTelemetry(delta);
            this.scene.update(delta);

            if (this.flightRecorder.isRecording()) {
                this.flightRecorder.record(this.getShownAircraft().captureFlightSample(), delta);
            }

            if (this.player.isCrashed) {
                this.transitionFromPlayerToCrashed();
            }
        } else if (this.state === GameState.SPAWN_MENU) {
            this.scene.update(delta);
        }
    }

    render() {
        this.player.updateDisplayTransform();

        if (this.state === GameState.PLAYER || this.state === GameState.SPAWN_MENU) {
            this.cameraUpdater.update(0);
            if (this.view !== PlayerViewState.AI_CHASE
                && (this.exteriorEnemyLock && this.isF2ExteriorView()
                    || this.viewYaw !== 0 || this.viewPitch !== 0 || this.viewZoom !== 1)) {
                this.orbitCameraAroundAircraft();
            }
            this.playerCamera.update();
            // Aim the target-window camera before the MFD's 3D layer is drawn (and
            // before its orientation is copied to the background cameras), so a
            // moving target stays centred instead of lagging a frame and stuttering.
            if (this.player.weaponsTarget) {
                updateTargetCamera(this.player, this.playerCamera.main, this.targetCamera.main);
            }
            this.targetCamera.update();
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
            const nightVisionPalette = this.player.nightVision ? this.configService.techProfiles.getActive().nightVisionPalette : undefined;
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                if (layer.target === weaponsTargetId) {
                    layer.palette = nightVisionPalette;
                }
            }
        } else if (this.view === PlayerViewState.SHOWCASE) {
            for (let i = 0; i < layers.length; i++) {
                layers[i].palette = ShowcasePalette;
            }
        } else {
            for (let i = 0; i < layers.length; i++) {
                layers[i].palette = undefined;
            }
        }
        this.renderer.render(this.scene, layers);
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
        if (this.view === PlayerViewState.AI_CHASE || this.heldOrbitKeys.size === 0) {
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
        if (this.exteriorEnemyLock && this.isF2ExteriorView() && this.aiOpponent?.enabled) {
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
                this.enterSpawnMenu(false);
                return;
            }
            switch (event.key) {
                case 'F1': {
                    event.preventDefault();
                    this.resetOrbit();
                    if (this.view !== PlayerViewState.COCKPIT_FRONT) {
                        this.setCockpitFrontView();
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
                case 'F12': {
                    event.preventDefault();
                    this.toggleShowcaseView();
                    break;
                }
            }

            if (event.code === 'KeyR') {
                event.preventDefault();
                this.flightRecorder.toggle(this.configService.flightModels.getActiveKey());
            } else if (event.code === 'KeyB') {
                event.preventDefault();
                this.player.setForceVectorsEnabled(!this.player.forceVectorsEnabled);
            } else if (event.code === 'Numpad5') {
                event.preventDefault();
                this.resetOrbit();
            } else if (event.code === 'NumpadMultiply' && this.isF2ExteriorView()) {
                event.preventDefault();
                this.toggleExteriorEnemyLock();
            } else if (event.code === 'NumpadMultiply' && this.view === PlayerViewState.AI_CHASE) {
                event.preventDefault();
                this.resetOrbit();
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
        applyAiChaseCameraParameters(this.playerCamera.main);
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
        this.groundSmoke.enabled = true;
        this.groundSmoke.position.copy(this.player.position);
        this.groundSmoke.reset();

        this.groundFire.enabled = true;
        this.groundFire.position.copy(this.player.position);
        this.groundFire.position.setY(0);

        this.enterSpawnMenu(true);
    }

    private enterSpawnMenu(afterCrash: boolean) {
        this.state = GameState.SPAWN_MENU;
        this.flightRecorder.stop();
        this.player.setSimulationPaused(true);
        this.spawnMenu.afterCrash = afterCrash;
        this.spawnMenu.enabled = true;
        this.spawnPanel.setTitle(afterCrash ? 'The plane crashed.' : 'Retro Flight Sim');
        this.refreshAircraftMenu();
        this.spawnPanel.show();

        if (afterCrash) {
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
        } else {
            this.player.reset(this.runwaySpawnPosition(), PLAYER_LAND_HEADING, PLAYER_LAND_SPAWN);
            this.groundSmoke.enabled = false;
            this.groundFire.enabled = false;
            this.setCockpitFrontView();
        }
    }

    private async beginFlight(spawn: 'approach' | 'runway') {
        const list = this.aircraftRegistry.list();
        const def = list[this.selectedAircraft];
        if (def) {
            await this.preloadAircraftModels(def);
        }
        this.applySelectedAircraft();
        this.state = GameState.PLAYER;
        this.player.setSimulationPaused(false);
        this.spawnMenu.enabled = false;
        this.spawnPanel.hide();
        this.groundSmoke.enabled = false;
        this.groundFire.enabled = false;

        if (spawn === 'approach') {
            this.player.reset(PLAYER_STARTING_POSITION, PLAYER_STARTING_HEADING, PLAYER_APPROACH_SPAWN);
        } else {
            this.player.reset(this.runwaySpawnPosition(), PLAYER_LAND_HEADING, PLAYER_LAND_SPAWN);
        }
        this.spawnOpponent();
        this.setCockpitFrontView();
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
        addObstacle(1330, -800, 45, 22);
        addObstacle(1330, -860, 45, 22);
        addObstacle(1330, -920, 45, 22);
        addObstacle(1670, -810, 45, 22);
        addObstacle(1580, -500, 25, 45);
        // Oil refinery.
        addObstacle(-1200, 1500, 70, 60);
        // SAM radar.
        addObstacle(500, -400, 20, 25);
        // Warehouse.
        addObstacle(-16000, 11000, 45, 22);

        const runway: Runway = {
            center: AIRBASE_RUNWAY.clone(),
            heading: PLAYER_STARTING_HEADING,
            halfLength: RUNWAY_HALF_LENGTH_M,
            halfWidth: RUNWAY_STRIP_HALF_WIDTH,
        };
        this.worldQuery = new SceneWorldQuery(
            this.hillColliders,
            (x, z) => this.isLandAt(x, z),
            this.obstacles,
            runway,
        );

        this.weaponsField = new WeaponsField(this.models, () => this.getCombatants());
        this.scene.add(this.weaponsField);

        this.player.setWeapons(this.weaponsField);
        this.playerPilot = new AiPilot(new PlayerPilotAdapter(this.player), this.worldQuery, {
            cruiseAltitude: 3000,
            cruiseSpeed: 220,
            hardDeck: 150,
        });
        this.player.setAiPilot(this.playerPilot);

        this.aiOpponent = new AiAircraftEntity(
            this.models,
            buildF22Def(),
            this.worldQuery,
            this.weaponsField,
            Faction.ENEMY,
            {
                position: new THREE.Vector3(3000, 3000, 4000),
                heading: Math.PI,
                airborne: true,
                throttle: 0.85,
                velocity: FORWARD.clone().applyAxisAngle(UP, Math.PI).multiplyScalar(250),
            },
            { cruiseAltitude: 3000, cruiseSpeed: 260, combatSpeed: 330, gunRange: 900, hardDeck: 200 },
        );
        this.aiOpponent.enabled = false;
        this.scene.add(this.aiOpponent);

        this.cameraUpdaters.set(
            PlayerViewState.AI_CHASE,
            new AiExteriorCameraUpdater(this.player, this.playerCamera.main, this.aiOpponent));
    }

    private getCombatants(): Combatant[] {
        const list: Combatant[] = [this.player];
        if (this.aiOpponent && this.aiOpponent.enabled) {
            list.push(this.aiOpponent);
        }
        return list;
    }

    /** Spawn/enable the AI opponent airborne near the player and engage. */
    private spawnOpponent() {
        if (!this.aiOpponent) {
            return;
        }
        const p = this.player.position;
        const playerForward = FORWARD.clone()
            .applyQuaternion(this.player.quaternion)
            .setY(0)
            .normalize();
        const playerHeading = Math.atan2(playerForward.x, playerForward.z);
        const heading = playerHeading + Math.PI;
        const right = RIGHT.clone().applyAxisAngle(UP, playerHeading);

        const MERGE_DISTANCE_M = AI_CHASE_MERGE_DISTANCE_M;
        const MERGE_LATERAL_OFFSET_M = 200;
        const position = new THREE.Vector3(p.x, p.y, p.z)
            .addScaledVector(playerForward, MERGE_DISTANCE_M)
            .addScaledVector(right, MERGE_LATERAL_OFFSET_M);

        this.aiOpponent.respawn({
            position,
            heading,
            airborne: true,
            throttle: 0.85,
            velocity: FORWARD.clone().applyAxisAngle(UP, heading).multiplyScalar(260),
        });
        this.aiOpponent.getPilot().setTarget(this.player);
        this.aiOpponent.getPilot().setPhase(AiFlightPhase.ENGAGE);

        // The player's autopilot flies home and lands (RTB); it also knows about
        // the opponent should combat logic be enabled for it later.
        this.playerPilot?.setTarget(this.aiOpponent);
        this.playerPilot?.setPhase(AiFlightPhase.RTB);
    }

    private async setupScene() {
        const ground = new SimpleEntity(this.models.getModel('lib:GROUND'), SceneLayers.BackgroundGround, SceneLayers.BackgroundGround);
        this.scene.add(ground);

        const sky = new SimpleEntity(this.models.getModel('lib:SKY'), SceneLayers.BackgroundSky, SceneLayers.BackgroundSky);
        sky.position.set(0, 7, 0);
        this.scene.add(sky);

        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                const model = this.models.getModel('assets/map.gltf');
                const map = new SimpleEntity(model, SceneLayers.Terrain, SceneLayers.Terrain);
                map.position.x = x * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                map.position.z = z * TERRAIN_MODEL_SIZE * TERRAIN_SCALE;
                map.scale.x = TERRAIN_SCALE * (Math.abs(x) % 2 === 0 ? 1 : -1);
                map.scale.z = TERRAIN_SCALE * (Math.abs(z) % 2 === 0 ? 1 : -1);
                this.scene.add(map);
            }
        }

        await this.models.waitForModel('assets/map.gltf');
        const mapModel = this.models.getModel('assets/map.gltf');
        this.setupTerrainSampler(mapModel);
        this.scatterHillsAndMountains(mapModel);

        const treeKinds = [
            VegetationKind.OAK,
            VegetationKind.PINE,
            VegetationKind.BUSH,
            VegetationKind.BIRCH,
            VegetationKind.SCRUB,
        ];
        const runwayStripExclude = new THREE.Box2().setFromCenterAndSize(
            new THREE.Vector2(AIRBASE_RUNWAY.x, AIRBASE_RUNWAY.z),
            new THREE.Vector2(RUNWAY_STRIP_HALF_WIDTH * 2, RUNWAY_STRIP_HALF_LENGTH * 2),
        );
        const terrainSampler = { isLand: (x: number, z: number) => this.isLandAt(x, z) };
        this.scene.add(new VegetationField(
            terrainSampler,
            this.hillColliders,
            { ...VEGETATION_FIELD_OPTIONS, excludeAreas: [runwayStripExclude] },
            this.materials,
            treeKinds,
        ));

        const speckles = new SpecklesEntity(this.materials);
        this.scene.add(speckles);

        const fieldOptions: SceneryFieldSettings = {
            tilesInField: 7,
            cellsInTile: 2,
            tileLength: 2500.0,
            cellVariations: [
                {
                    probability: 0.4,
                    model: 'assets/farm01.gltf',
                    jitter: 0.9,
                    randomRotation: true
                },
                {
                    probability: 0.25,
                    model: 'lib:cropGreen',
                    jitter: 1.2,
                    randomRotation: false
                },
                {
                    probability: 0.25,
                    model: 'lib:cropYellow',
                    jitter: 1.2,
                    randomRotation: false
                },
                {
                    probability: 0.05,
                    model: 'lib:cropOchre',
                    jitter: 0.8,
                    randomRotation: true
                },
                {
                    probability: 0.05,
                    model: 'lib:cropRed',
                    jitter: 0.8,
                    randomRotation: true
                }
            ]
        };
        const field1 = new SceneryField(this.models, new THREE.Box2().setFromCenterAndSize(new THREE.Vector2(0, 10000), new THREE.Vector2(80000, 10000)), fieldOptions);
        this.scene.add(field1);
        const field2 = new SceneryField(this.models, new THREE.Box2().setFromCenterAndSize(new THREE.Vector2(-10000, -10000), new THREE.Vector2(10000, 15000)), fieldOptions);
        this.scene.add(field2);

        this.addAirBase(this.scene, this.models);

        this.addRefinery(this.scene, this.models);

        const samradar = new GroundTargetEntity(this.models.getModel('assets/samradar01.glb'), 0, 'SAM Radar', 'Stosneehar');
        samradar.position.set(500, 0, -400);
        this.scene.add(samradar);

        const warehouse = new GroundTargetEntity(this.models.getModel('assets/hangar01.gltf'), undefined, 'Warehouse', 'Radlydd');
        warehouse.position.set(-16000, 0, 11000);
        warehouse.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        this.scene.add(warehouse);

        this.scene.add(this.groundSmoke);
        this.scene.add(this.groundFire);
        this.scene.add(this.player);

        this.setupCombat();

        const hud = new HUDEntity(this.player, this.configService);
        this.cockpitEntities.push(hud);
        this.scene.add(hud);

        const cockpit = new CockpitEntity(this.player, this.playerCamera.main, this.targetCamera.main, this.mapCamera);
        this.cockpitEntities.push(cockpit);
        this.scene.add(cockpit);

        const exteriorData = new ExteriorDataEntity(this.player, this.configService);
        exteriorData.enabled = false;
        this.exteriorEntities.push(exteriorData);
        this.scene.add(exteriorData);

        this.scene.add(this.spawnMenu);
    }

    private addRefinery(scene: Scene, models: ModelManager) {
        const x = -1200;
        const z = 1500;
        const refinery = new GroundTargetEntity(models.getModel('assets/refinery_towers01.gltf'), 2, 'Oil Refinery', 'Radlydd');
        refinery.position.set(x, 0, z);
        scene.add(refinery);

        const depot01a = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01a.position.set(x, 0, z - 100);
        scene.add(depot01a);

        const depot01b = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01b.position.set(x, 0, z + 100);
        depot01b.quaternion.setFromAxisAngle(UP, Math.PI);
        scene.add(depot01b);

        const depot01c = new StaticSceneryEntity(models.getModel('assets/refinery_depot01.gltf'), 2);
        depot01c.position.set(x + 100, 0, z - 100);
        scene.add(depot01c);

        const depot02a = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'), 2);
        depot02a.position.set(x - 150, 0, z - 50);
        scene.add(depot02a);

        const depot02b = new StaticSceneryEntity(models.getModel('assets/refinery_depot02.gltf'), 2);
        depot02b.position.set(x + 150, 0, z + 50);
        scene.add(depot02b);
    }

    private addAirBase(scene: Scene, models: ModelManager) {
        const hangarGround1 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
        hangarGround1.position.set(1360, 0, -860);
        hangarGround1.scale.set(200, 1, 200);
        scene.add(hangarGround1);

        const hangarGround2 = new StaticSceneryEntity(models.getModel('lib:pavement'), 5);
        hangarGround2.position.set(1640, 0, -860);
        hangarGround2.scale.set(200, 1, 200);
        scene.add(hangarGround2);

        const runway = new GroundTargetEntity(models.getModel('assets/runway01.gltf'), 0, 'Airbase', 'Stosneehar');
        runway.position.copy(AIRBASE_RUNWAY);
        scene.add(runway);

        const hangar1 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        hangar1.position.set(1330, 0, -800);
        hangar1.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar1);

        const hangar2 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        hangar2.position.set(1330, 0, -860);
        hangar2.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar2);

        const hangar3 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        hangar3.position.set(1330, 0, -920);
        hangar3.quaternion.setFromAxisAngle(UP, Math.PI / 2);
        scene.add(hangar3);

        const hangar4 = new StaticSceneryEntity(models.getModel('assets/hangar01.gltf'));
        hangar4.position.set(1670, 0, -810);
        hangar4.quaternion.setFromAxisAngle(UP, Math.PI);
        scene.add(hangar4);

        forEachStaticAircraftSlot((type, position, heading) => {
            const plane = new StaticSceneryEntity(models.getModel(type.body), type.lodBias);
            plane.position.copy(position);
            plane.quaternion.setFromAxisAngle(UP, heading);
            scene.add(plane);

            const shadow = new StaticSceneryEntity(models.getModel(type.shadow), type.lodBias);
            shadow.position.copy(position).setY(0);
            shadow.quaternion.setFromAxisAngle(UP, heading);
            scene.add(shadow);
        });

        const tower = new StaticSceneryEntity(models.getModel('assets/control01.gltf'));
        tower.position.set(1580, 0, -500);
        tower.quaternion.setFromAxisAngle(UP, -Math.PI / 2);
        scene.add(tower);
    }

    private setupTerrainSampler(mapModel: Model) {
        const water = new Set<string>([
            PaletteCategory.TERRAIN_WATER,
            PaletteCategory.TERRAIN_SHALLOW_WATER,
        ]);
        this.landTerrainMeshes.length = 0;
        this.waterTerrainMeshes.length = 0;
        for (const mesh of mapModel.lod[0].flats) {
            if (water.has(mesh.name)) {
                this.waterTerrainMeshes.push(mesh);
            } else {
                this.landTerrainMeshes.push(mesh);
            }
        }
    }

    private isLandAt(worldX: number, worldZ: number): boolean {
        this.terrainRayOrigin.set(worldX / TERRAIN_SCALE, 500, worldZ / TERRAIN_SCALE);
        this.terrainCaster.set(this.terrainRayOrigin, this.terrainRayDir);
        const landHits = this.terrainCaster.intersectObjects(this.landTerrainMeshes, true);
        if (landHits.length === 0) {
            return false;
        }
        const waterHits = this.terrainCaster.intersectObjects(this.waterTerrainMeshes, true);
        if (waterHits.length === 0) {
            return true;
        }
        return landHits[0].distance <= waterHits[0].distance;
    }

    private scatterHillsAndMountains(mapModel: Model) {
        this.hillColliders.length = 0;
        const grass = mapModel.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_GRASS);
        assertIsDefined(grass);
        for (let i = 0; i < 30; i++) {
            const hill = new StaticSceneryEntity(this.models.getModel('lib:hill'));
            this.randomPosOver(grass, hill.position, 20000);
            hill.scale.set(
                0.8 + Math.random() / 5.0,
                0.5 + Math.random() / 2.0,
                0.8 + Math.random() / 5.0);
            hill.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            this.hillColliders.push(createHillCollider(
                hill.position, hill.quaternion, hill.scale,
                HILL_MODEL_BASE_RADIUS, HILL_MODEL_HEIGHT,
            ));
            this.scene.add(hill);
        }

        const bare = mapModel.lod[0].flats.find(mesh => mesh.name === PaletteCategory.TERRAIN_BARE);
        assertIsDefined(bare);
        for (let i = 0; i < 20; i++) {
            const mountain = new StaticSceneryEntity(this.models.getModel('lib:mountain'));
            this.randomPosOver(bare, mountain.position, 20000);
            mountain.scale.x = 0.8 + Math.random() / 5.0;
            mountain.scale.y = 0.5 + Math.random() / 2.0;
            mountain.scale.z = 0.8 + Math.random() / 5.0;
            mountain.quaternion.setFromAxisAngle(UP, Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4);
            this.hillColliders.push(createHillCollider(
                mountain.position, mountain.quaternion, mountain.scale,
                MOUNTAIN_MODEL_BASE_RADIUS, MOUNTAIN_MODEL_HEIGHT,
            ));
            this.scene.add(mountain);
        }
    }

    private randomPosOver(surface: THREE.Object3D, position: THREE.Vector3, spread: number): THREE.Vector3 {
        assertIsDefined(surface);
        let intersections: THREE.Intersection[] = [];
        const caster = new THREE.Raycaster();
        const p = UP.clone();
        const d = UP.clone().negate();
        const scaledSpread = spread / TERRAIN_SCALE;
        do {
            intersections.length = 0;
            p.x = Math.random() * scaledSpread - scaledSpread / 2;
            p.z = Math.random() * scaledSpread - scaledSpread / 2;
            caster.set(p, d);
            intersections = caster.intersectObject(surface, true);
        } while (intersections.length === 0);
        position.copy(p).setY(0).multiplyScalar(TERRAIN_SCALE);
        return position;
    }

    private getPalette(): Palette {
        return this.palettes[this.currentPalette];
    }
}
