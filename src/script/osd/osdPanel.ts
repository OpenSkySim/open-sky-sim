import { ConfigService } from "../config/configService";
import { JoystickControlDevice } from "../input/devices/joystickControlDevice";
import { KeyboardControlAction, KeyboardControlDevice, KeyboardControlLayoutId, KeyboardControlLayouts } from "../input/devices/keyboardControlDevice";
import { Game } from "../state/game";
import { FlightModels, TechProfiles, UnitSystems } from "../state/gameDefs";
import { assertIsDefined } from "../utils/asserts";


export function setupOSD(config: ConfigService, keyboardInput: KeyboardControlDevice, joystickInput: JoystickControlDevice, game: Game) {
    setupButtons();
    setupGenerationOptions(config);
    setupSceneryOptions(game);
    setupFlightModel(config);
    setupUnitSystem(config);
    setupKeyboardHelp(keyboardInput);
    setupJoystickHelp(joystickInput);
}

function setupSceneryOptions(game: Game) {
    const treesToggle = document.getElementById('scenery-trees') as HTMLInputElement | null;
    assertIsDefined(treesToggle);

    game.setVegetationEnabled(treesToggle.checked);
    treesToggle.addEventListener('change', () => {
        game.setVegetationEnabled(treesToggle.checked);
    });
}

function setupButtons() {
    const helpButton = document.getElementById('help-button');
    assertIsDefined(helpButton);
    const settingsButton = document.getElementById('settings-button');
    assertIsDefined(settingsButton);
    const helpSection = document.getElementById('help');
    assertIsDefined(helpSection);
    const settingsSection = document.getElementById('settings');
    assertIsDefined(settingsSection);
    const panel = document.getElementById('panel');
    assertIsDefined(panel);

    helpButton.addEventListener('click', () => {
        if (helpButton.classList.contains('active')) {
            panel.classList.remove('open');
            helpButton.classList.remove('active');
        } else {
            panel.classList.add('open');
            helpButton.classList.add('active');
            helpSection.classList.add('active');
            settingsButton.classList.remove('active');
            settingsSection.classList.remove('active');
        }
    });

    settingsButton.addEventListener('click', () => {
        if (settingsButton.classList.contains('active')) {
            panel.classList.remove('open');
            settingsButton.classList.remove('active');
        } else {
            panel.classList.add('open');
            settingsButton.classList.add('active');
            settingsSection.classList.add('active');
            helpButton.classList.remove('active');
            helpSection.classList.remove('active');
        }
    });
}

function setupGenerationOptions(config: ConfigService) {
    const genCGA = document.getElementById('gen-cga');
    assertIsDefined(genCGA);
    const genEGA = document.getElementById('gen-ega');
    assertIsDefined(genEGA);
    const genVGA = document.getElementById('gen-vga');
    assertIsDefined(genVGA);
    const genSVGA = document.getElementById('gen-svga');
    assertIsDefined(genSVGA);
    const genHD = document.getElementById('gen-hd');
    assertIsDefined(genHD);

    genCGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.CGA);
    });
    genEGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.EGA);
    });
    genVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.VGA);
    });
    genSVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.SVGA);
    });
    genHD.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.HD);
    });
}

function setupFlightModel(config: ConfigService) {
    const fm2FlightModel = document.getElementById('flightmodel-fm2');
    assertIsDefined(fm2FlightModel);
    const debugFlightModel = document.getElementById('flightmodel-debug');
    assertIsDefined(debugFlightModel);
    const jsbsimFlightModel = document.getElementById('flightmodel-jsbsim');
    assertIsDefined(jsbsimFlightModel);

    fm2FlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.FM2);
    });
    debugFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.DEBUG);
    });
    jsbsimFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.JSBSIM);
    });
}

function setupUnitSystem(config: ConfigService) {
    const unitMetric = document.getElementById('units-metric');
    assertIsDefined(unitMetric);
    const unitImperial = document.getElementById('units-imperial');
    assertIsDefined(unitImperial);

    unitMetric.addEventListener('change', () => {
        config.unitSystem.setActive(UnitSystems.METRIC);
    });
    unitImperial.addEventListener('change', () => {
        config.unitSystem.setActive(UnitSystems.IMPERIAL);
    });
}

function setupKeyboardHelp(keyboardInput: KeyboardControlDevice) {
    const qwertyLayout = document.getElementById('layout-qwerty');
    assertIsDefined(qwertyLayout);
    const qwertzLayout = document.getElementById('layout-qwertz');
    assertIsDefined(qwertzLayout);
    const azertyLayout = document.getElementById('layout-azerty');
    assertIsDefined(azertyLayout);
    const dvorakLayout = document.getElementById('layout-dvorak');
    assertIsDefined(dvorakLayout);
    const arrowsLayout = document.getElementById('layout-arrows');
    assertIsDefined(arrowsLayout);

    qwertyLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.QWERTY);
        updateControlsHelp(KeyboardControlLayoutId.QWERTY);
    });
    qwertzLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.QWERTZ);
        updateControlsHelp(KeyboardControlLayoutId.QWERTZ);
    });
    azertyLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.AZERTY);
        updateControlsHelp(KeyboardControlLayoutId.AZERTY);
    });
    dvorakLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.DVORAK);
        updateControlsHelp(KeyboardControlLayoutId.DVORAK);
    });
    arrowsLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.ARROWS);
        updateControlsHelp(KeyboardControlLayoutId.ARROWS);
    });

    keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.ARROWS);
    updateControlsHelp(KeyboardControlLayoutId.ARROWS);
}

function setupJoystickHelp(joystickInput: JoystickControlDevice) {
    joystickInput.setListener(connected => {
        if (connected) {
            updateJoystickHelp(joystickInput.getDeviceId(), joystickInput.getAxisCount());
        } else {
            disableJoystickHelp();
        }
    });
}

function updateControlsHelp(layoutId: KeyboardControlLayoutId) {
    const pitchPos = document.getElementById('key-pitch-pos');
    assertIsDefined(pitchPos);
    const pitchNeg = document.getElementById('key-pitch-neg');
    assertIsDefined(pitchNeg);
    const rollPos = document.getElementById('key-roll-pos');
    assertIsDefined(rollPos);
    const rollNeg = document.getElementById('key-roll-neg');
    assertIsDefined(rollNeg);
    const yawPos = document.getElementById('key-yaw-pos');
    assertIsDefined(yawPos);
    const yawNeg = document.getElementById('key-yaw-neg');
    assertIsDefined(yawNeg);
    const throttlePos = document.getElementById('key-throttle-pos');
    assertIsDefined(throttlePos);
    const throttleNeg = document.getElementById('key-throttle-neg');
    assertIsDefined(throttleNeg);

    const layout = KeyboardControlLayouts.get(layoutId);
    assertIsDefined(layout);

    pitchPos.innerText = formatControlKey(layout[KeyboardControlAction.PITCH_POS]);
    pitchNeg.innerText = formatControlKey(layout[KeyboardControlAction.PITCH_NEG]);
    rollPos.innerText = formatControlKey(layout[KeyboardControlAction.ROLL_POS]);
    rollNeg.innerText = formatControlKey(layout[KeyboardControlAction.ROLL_NEG]);
    yawPos.innerText = formatControlKey(layout[KeyboardControlAction.YAW_POS]);
    yawNeg.innerText = formatControlKey(layout[KeyboardControlAction.YAW_NEG]);
    throttlePos.innerText = formatControlKey(layout[KeyboardControlAction.THROTTLE_POS]);
    throttleNeg.innerText = formatControlKey(layout[KeyboardControlAction.THROTTLE_NEG]);
}

function formatControlKey(key: string) {
    switch (key) {
        case 'arrowup': return '↑';
        case 'arrowdown': return '↓';
        case 'arrowleft': return '←';
        case 'arrowright': return '→';
        case 'numpadadd': return 'Num+';
        case 'numpadsubtract': return 'Num-';
        default: return key.toUpperCase();
    }
}

function updateJoystickHelp(id: string, axisCount: number) {
    const joystick = document.getElementById('joystick');
    assertIsDefined(joystick);
    const joystickId = document.getElementById('joystick-id');
    assertIsDefined(joystickId);
    const axisPitch = document.getElementById('axis-pitch');
    assertIsDefined(axisPitch);
    const axisRoll = document.getElementById('axis-roll');
    assertIsDefined(axisRoll);
    const axisYaw = document.getElementById('axis-yaw');
    assertIsDefined(axisYaw);
    const axisThrottle = document.getElementById('axis-throttle');
    assertIsDefined(axisThrottle);

    joystick.classList.remove('hidden');
    const lastBracketIndex = id.lastIndexOf('(');
    joystickId.innerText = id.substring(0, lastBracketIndex !== -1 ? lastBracketIndex - 1 : undefined);

    if (axisCount < 4) {
        axisYaw.classList.add('hidden');
    } else {
        axisYaw.classList.remove('hidden');
    }
    if (axisCount < 3) {
        axisThrottle.classList.add('hidden');
    } else {
        axisThrottle.classList.remove('hidden');
    }
    if (axisCount < 2) {
        axisPitch.classList.add('hidden');
    } else {
        axisPitch.classList.remove('hidden');
    }
    if (axisCount < 1) {
        axisRoll.classList.add('hidden');
    } else {
        axisRoll.classList.remove('hidden');
    }
}

function disableJoystickHelp() {
    const joystick = document.getElementById('joystick');
    assertIsDefined(joystick);
    const joystickId = document.getElementById('joystick-id');
    assertIsDefined(joystickId);

    joystick.classList.add('hidden');
    joystickId.innerText = 'No device detected';
}