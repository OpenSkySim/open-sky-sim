import { AudioSystem } from './audio/audioSystem';
import { ConfigService } from './config/configService';
import { PaletteCategory } from './config/palettes/palette';
import { HDNoonPalette } from './config/palettes/hd-noon';
import { CGAProfile } from './config/profiles/cga';
import { EGAProfile } from './config/profiles/ega';
import { DisplayShading, FogQuality } from './config/profiles/profile';
import { HDProfile } from './config/profiles/hd';
import { SVGAProfile } from './config/profiles/svga';
import { VGAProfile } from './config/profiles/vga';
import { Kernel } from './core/kernel';
import { FPS_CAP, H_RES, V_RES } from './defs';
import { JoystickControlDevice } from './input/devices/joystickControlDevice';
import { KeyboardControlDevice, KeyboardControlLayoutId } from './input/devices/keyboardControlDevice';
import { setupOSD } from './osd/osdPanel';
import { WorkerJsbsimFlightModel } from './physics/model/workerJsbsimFlightModel';
import { CombatSimClient } from './physics/sim/combatSimClient';
import { SimProxyFlightModel } from './physics/model/simProxyFlightModel';
import { PLAYER_SIM_ID } from './physics/sim/simIds';
import { Renderer } from './render/renderer';
import { SceneMaterialManager } from './scene/materials/materials';
import { BackgroundModelLibBuilder } from './scene/models/lib/backgroundModelBuilder';
import { FieldModelLibBuilder, FieldModelType } from './scene/models/lib/fieldModelBuilder';
import { HILL_MODEL_BASE_RADIUS, HILL_MODEL_HEIGHT, MOUNTAIN_MODEL_BASE_RADIUS, MOUNTAIN_MODEL_HEIGHT, MountainModelLibBuilder } from './scene/models/lib/mountainModelBuilder';
import { TracerModelLibBuilder } from './scene/models/lib/tracerModelBuilder';
import { ModelManager } from './scene/models/models';
import { Game, GameRenderTask, GameUpdateTask } from './state/game';
import { FlightModels, TechProfiles } from './state/gameDefs';


async function setup(): Promise<[Kernel, ConfigService, KeyboardControlDevice, JoystickControlDevice, Game]> {
    // Single authoritative combat sim worker. The player's FM2/DEBUG models are
    // render-side proxies bound to it (id PLAYER_SIM_ID); JSBSim keeps its own
    // worker. AI opponents register with the same client (see Game.setupCombat).
    const combatSim = new CombatSimClient();
    const config = new ConfigService(
        { [TechProfiles.CGA]: CGAProfile, [TechProfiles.EGA]: EGAProfile, [TechProfiles.VGA]: VGAProfile, [TechProfiles.SVGA]: SVGAProfile, [TechProfiles.HD]: HDProfile },
        {
            [FlightModels.FM2]: new SimProxyFlightModel(combatSim, PLAYER_SIM_ID, false),
            [FlightModels.DEBUG]: new SimProxyFlightModel(combatSim, PLAYER_SIM_ID, true),
            [FlightModels.JSBSIM]: new WorkerJsbsimFlightModel(),
        }
    );
    config.flightModels.setActive(FlightModels.FM2);
    config.flightModels.getActive().activate();
    const materials = new SceneMaterialManager(HDNoonPalette, FogQuality.HIGH, DisplayShading.FULL);
    const renderer = new Renderer(materials, H_RES, V_RES, HDNoonPalette);
    const models = new ModelManager(materials, [
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.GROUND),
        new BackgroundModelLibBuilder(BackgroundModelLibBuilder.Type.SKY),
        new FieldModelLibBuilder('pavement', FieldModelType.SQUARE, PaletteCategory.SCENERY_ROAD_SECONDARY),
        new FieldModelLibBuilder('cropGreen', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_GREEN_LIGHT, 200),
        new FieldModelLibBuilder('cropYellow', FieldModelType.SQUARE, PaletteCategory.SCENERY_FIELD_YELLOW, 200),
        new FieldModelLibBuilder('cropOchre', FieldModelType.HEXAGON, PaletteCategory.SCENERY_FIELD_OCHRE, 400),
        new FieldModelLibBuilder('cropRed', FieldModelType.TRIANGLE, PaletteCategory.SCENERY_FIELD_RED, 400),
        new MountainModelLibBuilder('hill', HILL_MODEL_BASE_RADIUS, HILL_MODEL_HEIGHT, PaletteCategory.SCENERY_MOUNTAIN_GRASS, false, false),
        new MountainModelLibBuilder('mountain', MOUNTAIN_MODEL_BASE_RADIUS, MOUNTAIN_MODEL_HEIGHT, PaletteCategory.SCENERY_MOUNTAIN_GRASS, false, false),
        new TracerModelLibBuilder('tracer'),
    ]);
    const audio = new AudioSystem();
    const game = new Game(config, models, materials, renderer, audio, combatSim);
    config.techProfiles.setActive(TechProfiles.HD);
    await game.setup();

    const keyboardInput = new KeyboardControlDevice(game.getPlayer());
    keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.ARROWS);
    const joystickInput = new JoystickControlDevice(game.getPlayer());

    const kernel = new Kernel();
    kernel.setTargetFPS(config.techProfiles.getActive().fpsCap ? FPS_CAP : undefined);
    kernel.addUpdateTask(materials);
    kernel.addUpdateTask(keyboardInput);
    kernel.addUpdateTask(joystickInput);
    kernel.addUpdateTask(new GameUpdateTask(game));
    kernel.addRenderTask(new GameRenderTask(game));

    config.techProfiles.addChangeListener(profile => kernel.setTargetFPS(profile.fpsCap ? FPS_CAP : undefined));

    return [kernel, config, keyboardInput, joystickInput, game];
}

window.addEventListener("load", () => {
    void setup().then(([kernel, config, keyboardInput, joystickInput, game]) => {
        kernel.start();
        setupOSD(config, keyboardInput, joystickInput);
    });
});
