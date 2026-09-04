import { AudioSystem } from "../audio/audioSystem";
import { ConfigService } from "../config/configService";
import { loadSettings, updateSettings } from "../config/settingsStorage";
import {
    DETAIL_DISTANCE_OFF, TERRAIN_DETAIL_DISTANCE_MAX_M, TERRAIN_DETAIL_DISTANCE_MIN_M,
} from "../terrain/lod";
import { DEFAULT_TERRAIN_URL, loadTerrainManifest } from "../terrain/manifest";
import { terrainAreas } from "../terrain/playArea";
import { PLAY_ORIGIN } from "../state/worldLayout";
import { homeArea } from "../terrain/playArea";
import { JoystickControlDevice } from "../input/devices/joystickControlDevice";
import { KeyboardControlAction, KeyboardControlDevice, KeyboardControlLayoutId, KeyboardControlLayouts } from "../input/devices/keyboardControlDevice";
import { formatSunTime } from "../scene/materials/shaders/sun";
import { AiPilotModels, FlightModels, ShadowQualities, TechProfiles, TerrainColours, UnitSystems } from "../state/gameDefs";
import { assertIsDefined } from "../utils/asserts";


export function setupOSD(config: ConfigService, keyboardInput: KeyboardControlDevice, joystickInput: JoystickControlDevice, audio: AudioSystem) {
    setupButtons();
    setupGenerationOptions(config);
    setupDaytime(config);
    setupVolume(audio);
    setupTerrainDetail(config);
    setupShadowQuality(config);
    setupTerrainColour(config);
    setupArea();
    setupFlightModel(config);
    setupUnitSystem(config);
    setupAiPilotModel(config);
    setupKeyboardHelp(keyboardInput);
    setupJoystickHelp(joystickInput);
    syncSettingsUI(config, keyboardInput);
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
    const genVGA = document.getElementById('gen-vga');
    assertIsDefined(genVGA);
    const genSVGA = document.getElementById('gen-svga');
    assertIsDefined(genSVGA);
    const genHD = document.getElementById('gen-hd');
    assertIsDefined(genHD);

    genVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.VGA);
        updateSettings({ techProfile: TechProfiles.VGA });
    });
    genSVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.SVGA);
        updateSettings({ techProfile: TechProfiles.SVGA });
    });
    genHD.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.HD);
        updateSettings({ techProfile: TechProfiles.HD });
    });
}

/**
 * Time-of-day slider. The setting is the single source of truth: the in-game
 * `N` day/night key writes to it too, and the change listener below is what
 * moves the slider and persists the value, whichever end drove the change.
 */
function setupDaytime(config: ConfigService) {
    const slider = document.getElementById('daytime-slider') as HTMLInputElement | null;
    assertIsDefined(slider);
    const readout = document.getElementById('daytime-value');
    assertIsDefined(readout);

    slider.addEventListener('input', () => {
        config.daytime.setActive(parseFloat(slider.value));
    });

    config.daytime.addChangeListener(hours => {
        const value = hours.toString();
        if (slider.value !== value) {
            slider.value = value;
        }
        readout.textContent = formatSunTime(hours);
        updateSettings({ daytime: hours });
    });

    slider.value = config.daytime.getActive().toString();
    readout.textContent = formatSunTime(config.daytime.getActive());
}

function setupVolume(audio: AudioSystem) {
    const slider = document.getElementById('volume-slider') as HTMLInputElement | null;
    assertIsDefined(slider);
    const readout = document.getElementById('volume-value');
    assertIsDefined(readout);

    const settings = loadSettings();
    const volumePercent = settings.volume * 100;

    slider.value = volumePercent.toString();
    readout.textContent = `${Math.round(volumePercent)}%`;
    audio.setMasterVolume(settings.volume);

    slider.addEventListener('input', () => {
        const volume = parseFloat(slider.value) / 100;
        audio.setMasterVolume(volume);
        readout.textContent = `${Math.round(parseFloat(slider.value))}%`;
        updateSettings({ volume });
    });
}

/**
 * Terrain detail distance slider.
 *
 * The slider is in kilometres and the setting is in metres, because kilometres
 * are what the label has to read and metres are what every distance in the LOD
 * is already in. The top step is off — `DETAIL_DISTANCE_OFF` — rather than a
 * very large number, so "off" is exact instead of merely far.
 */
function setupTerrainDetail(config: ConfigService) {
    const slider = document.getElementById('terraindetail-slider') as HTMLInputElement | null;
    assertIsDefined(slider);
    const readout = document.getElementById('terraindetail-value');
    assertIsDefined(readout);

    const offKm = TERRAIN_DETAIL_DISTANCE_MAX_M / 1000;
    slider.min = (TERRAIN_DETAIL_DISTANCE_MIN_M / 1000).toString();
    slider.max = (offKm + 2).toString();

    const toMetres = (km: number) =>
        (km > offKm ? DETAIL_DISTANCE_OFF : km * 1000);
    const toKm = (m: number) =>
        (Number.isFinite(m) ? m / 1000 : offKm + 2);

    slider.addEventListener('input', () => {
        config.terrainDetail.setActive(toMetres(parseFloat(slider.value)));
    });

    config.terrainDetail.addChangeListener(distanceM => {
        const value = toKm(distanceM).toString();
        if (slider.value !== value) {
            slider.value = value;
        }
        readout.textContent = Number.isFinite(distanceM)
            ? `${Math.round(distanceM / 1000)} km`
            : 'Off';
        updateSettings({
            terrainDetailDistanceM: Number.isFinite(distanceM) ? distanceM : null,
        });
    });

    const initial = config.terrainDetail.getActive();
    slider.value = toKm(initial).toString();
    readout.textContent = Number.isFinite(initial)
        ? `${Math.round(initial / 1000)} km`
        : 'Off';
}

/**
 * The area picker.
 *
 * Populated from the terrain manifest rather than from a fixed list, because
 * what is baked differs per clone — a fresh one has whatever areas its owner
 * imported, and possibly only the shipped one.
 *
 * Switching reloads the page. The ENU origin is chosen once when the world is
 * built and everything from scenery placement to the physics worker's terrain
 * mirror is positioned against it, so moving it in a live session would mean
 * tearing all of that down; a reload runs the boot path that already does it
 * correctly.
 */
function setupArea() {
    const select = document.getElementById('area-select') as HTMLSelectElement | null;
    const fly = document.getElementById('area-fly') as HTMLButtonElement | null;
    const row = document.getElementById('area-row');
    if (!select || !fly || !row) {
        return;
    }

    loadTerrainManifest(DEFAULT_TERRAIN_URL).then(manifest => {
        const areas = terrainAreas(manifest);
        const home = homeArea(areas, PLAY_ORIGIN);
        if (areas.length < 2) {
            // Nothing to choose between. Hide it rather than show a combobox
            // with one entry and a button that reloads to where you already are.
            row.classList.add('hidden');
            const heading = row.previousElementSibling?.previousElementSibling;
            heading?.classList.add('hidden');
            row.previousElementSibling?.classList.add('hidden');
            return;
        }
        const saved = loadSettings().terrainArea;
        for (const area of areas) {
            const option = document.createElement('option');
            option.value = area.name;
            const isHome = home !== undefined && area.name === home.name;
            option.textContent = isHome ? `${area.name} (home)` : area.name;
            select.appendChild(option);
        }
        const selectable = areas.some(a => a.name === saved);
        select.value = selectable ? saved : (home?.name ?? areas[0].name);
        const initial = select.value;
        const sync = () => { fly.disabled = select.value === initial; };
        select.addEventListener('change', sync);
        sync();
        fly.addEventListener('click', () => {
            updateSettings({ terrainArea: select.value });
            window.location.reload();
        });
    }).catch(() => {
        row.classList.add('hidden');
    });
}

const SHADOW_QUALITY_RADIO_IDS: Record<ShadowQualities, string> = {
    [ShadowQualities.OFF]: 'shadows-off',
    [ShadowQualities.LOW]: 'shadows-low',
    [ShadowQualities.MEDIUM]: 'shadows-medium',
    [ShadowQualities.HIGH]: 'shadows-high',
    [ShadowQualities.ULTRA]: 'shadows-ultra',
};

function setupShadowQuality(config: ConfigService) {
    for (const quality of Object.values(ShadowQualities)) {
        const input = document.getElementById(SHADOW_QUALITY_RADIO_IDS[quality]);
        assertIsDefined(input);
        input.addEventListener('change', () => {
            config.shadowQuality.setActive(quality);
            updateSettings({ shadowQuality: quality });
        });
    }
}

const TERRAIN_COLOUR_RADIO_IDS: Record<TerrainColours, string> = {
    [TerrainColours.LANDCOVER]: 'terraincolour-landcover',
    [TerrainColours.SWATCH]: 'terraincolour-swatch',
    [TerrainColours.HYBRID]: 'terraincolour-hybrid',
    [TerrainColours.IMAGERY]: 'terraincolour-imagery',
};

function setupTerrainColour(config: ConfigService) {
    for (const mode of Object.values(TerrainColours)) {
        const input = document.getElementById(TERRAIN_COLOUR_RADIO_IDS[mode]);
        assertIsDefined(input);
        input.addEventListener('change', () => {
            config.terrainColour.setActive(mode);
            updateSettings({ terrainColour: mode });
        });
    }
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
        updateSettings({ flightModel: FlightModels.FM2 });
    });
    debugFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.DEBUG);
        updateSettings({ flightModel: FlightModels.DEBUG });
    });
    jsbsimFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.JSBSIM);
        updateSettings({ flightModel: FlightModels.JSBSIM });
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

function setupAiPilotModel(config: ConfigService) {
    const classic = document.getElementById('aipilot-classic');
    assertIsDefined(classic);
    const shaw = document.getElementById('aipilot-shaw');
    assertIsDefined(shaw);
    const aggressive = document.getElementById('aipilot-aggressive');
    assertIsDefined(aggressive);
    const ace = document.getElementById('aipilot-ace');
    assertIsDefined(ace);

    classic.addEventListener('change', () => {
        config.aiPilotModels.setActive(AiPilotModels.CLASSIC);
        updateSettings({ aiPilotModel: AiPilotModels.CLASSIC });
    });
    shaw.addEventListener('change', () => {
        config.aiPilotModels.setActive(AiPilotModels.SHAW);
        updateSettings({ aiPilotModel: AiPilotModels.SHAW });
    });
    aggressive.addEventListener('change', () => {
        config.aiPilotModels.setActive(AiPilotModels.AGGRESSIVE);
        updateSettings({ aiPilotModel: AiPilotModels.AGGRESSIVE });
    });
    ace.addEventListener('change', () => {
        config.aiPilotModels.setActive(AiPilotModels.ACE);
        updateSettings({ aiPilotModel: AiPilotModels.ACE });
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
        updateSettings({ keyboardLayout: KeyboardControlLayoutId.QWERTY });
    });
    qwertzLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.QWERTZ);
        updateControlsHelp(KeyboardControlLayoutId.QWERTZ);
        updateSettings({ keyboardLayout: KeyboardControlLayoutId.QWERTZ });
    });
    azertyLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.AZERTY);
        updateControlsHelp(KeyboardControlLayoutId.AZERTY);
        updateSettings({ keyboardLayout: KeyboardControlLayoutId.AZERTY });
    });
    dvorakLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.DVORAK);
        updateControlsHelp(KeyboardControlLayoutId.DVORAK);
        updateSettings({ keyboardLayout: KeyboardControlLayoutId.DVORAK });
    });
    arrowsLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.ARROWS);
        updateControlsHelp(KeyboardControlLayoutId.ARROWS);
        updateSettings({ keyboardLayout: KeyboardControlLayoutId.ARROWS });
    });

    updateControlsHelp(keyboardInput.getKeyboardLayoutId());
}

function syncSettingsUI(config: ConfigService, keyboardInput: KeyboardControlDevice) {
    const techProfileRadioIds: Record<string, string> = {
        [TechProfiles.VGA]: 'gen-vga',
        [TechProfiles.SVGA]: 'gen-svga',
        [TechProfiles.HD]: 'gen-hd',
    };
    const flightModelRadioIds: Record<string, string> = {
        [FlightModels.FM2]: 'flightmodel-fm2',
        [FlightModels.DEBUG]: 'flightmodel-debug',
        [FlightModels.JSBSIM]: 'flightmodel-jsbsim',
    };
    const keyboardLayoutRadioIds: Record<KeyboardControlLayoutId, string> = {
        [KeyboardControlLayoutId.QWERTY]: 'layout-qwerty',
        [KeyboardControlLayoutId.QWERTZ]: 'layout-qwertz',
        [KeyboardControlLayoutId.AZERTY]: 'layout-azerty',
        [KeyboardControlLayoutId.DVORAK]: 'layout-dvorak',
        [KeyboardControlLayoutId.ARROWS]: 'layout-arrows',
    };
    const aiPilotModelRadioIds: Record<string, string> = {
        [AiPilotModels.CLASSIC]: 'aipilot-classic',
        [AiPilotModels.SHAW]: 'aipilot-shaw',
        [AiPilotModels.AGGRESSIVE]: 'aipilot-aggressive',
        [AiPilotModels.ACE]: 'aipilot-ace',
    };

    checkRadio(techProfileRadioIds[config.techProfiles.getActiveKey()]);
    checkRadio(flightModelRadioIds[config.flightModels.getActiveKey()]);
    checkRadio(keyboardLayoutRadioIds[keyboardInput.getKeyboardLayoutId()]);
    checkRadio(aiPilotModelRadioIds[config.aiPilotModels.getActive()]);
    checkRadio(SHADOW_QUALITY_RADIO_IDS[config.shadowQuality.getActive()]);
    checkRadio(TERRAIN_COLOUR_RADIO_IDS[config.terrainColour.getActive()]);
}

function checkRadio(id: string | undefined) {
    if (!id) return;
    const input = document.getElementById(id);
    if (input instanceof HTMLInputElement) {
        input.checked = true;
    }
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
