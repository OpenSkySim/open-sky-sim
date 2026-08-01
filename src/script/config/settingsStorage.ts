import { KeyboardControlLayoutId } from "../input/devices/keyboardControlDevice";
import { AiPilotModels, FlightModels, TechProfiles } from "../state/gameDefs";

const STORAGE_KEY = 'retroflightsim.settings';

/** Spawn menu start modes (approach / runway / merge / carrier). */
export type SpawnMode = 'approach' | 'runway' | 'headon' | 'carrier' | 'carrierTakeoff';

export interface AppSettings {
    techProfile: string;
    flightModel: string;
    keyboardLayout: KeyboardControlLayoutId;
    aiPilotModel: AiPilotModels;
    /** Last aircraft (+ livery) id chosen in the spawn menu. */
    aircraftId: string;
    /** Last spawn mode used to start a flight. */
    spawnMode: SpawnMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
    techProfile: TechProfiles.HD,
    flightModel: FlightModels.FM2,
    keyboardLayout: KeyboardControlLayoutId.ARROWS,
    aiPilotModel: AiPilotModels.CLASSIC,
    aircraftId: 'f22',
    spawnMode: 'headon',
};

const TECH_PROFILES = new Set<string>(Object.values(TechProfiles));
const FLIGHT_MODELS = new Set<string>(Object.values(FlightModels));
const KEYBOARD_LAYOUTS = new Set<number>(Object.values(KeyboardControlLayoutId).filter(v => typeof v === 'number') as number[]);
const AI_PILOT_MODELS = new Set<string>(Object.values(AiPilotModels));
const SPAWN_MODES = new Set<SpawnMode>(['approach', 'runway', 'headon', 'carrier', 'carrierTakeoff']);

export function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_SETTINGS };
        }

        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return {
            techProfile: isValidTechProfile(parsed.techProfile) ? parsed.techProfile : DEFAULT_SETTINGS.techProfile,
            flightModel: isValidFlightModel(parsed.flightModel) ? parsed.flightModel : DEFAULT_SETTINGS.flightModel,
            keyboardLayout: isValidKeyboardLayout(parsed.keyboardLayout) ? parsed.keyboardLayout : DEFAULT_SETTINGS.keyboardLayout,
            aiPilotModel: isValidAiPilotModel(parsed.aiPilotModel) ? parsed.aiPilotModel : DEFAULT_SETTINGS.aiPilotModel,
            aircraftId: isValidAircraftId(parsed.aircraftId) ? parsed.aircraftId : DEFAULT_SETTINGS.aircraftId,
            spawnMode: isValidSpawnMode(parsed.spawnMode) ? parsed.spawnMode : DEFAULT_SETTINGS.spawnMode,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(settings: AppSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore quota / private-mode failures; settings still apply for the session.
    }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
    const next = { ...loadSettings(), ...partial };
    saveSettings(next);
    return next;
}

function isValidTechProfile(value: unknown): value is string {
    return typeof value === 'string' && TECH_PROFILES.has(value);
}

function isValidFlightModel(value: unknown): value is string {
    return typeof value === 'string' && FLIGHT_MODELS.has(value);
}

function isValidKeyboardLayout(value: unknown): value is KeyboardControlLayoutId {
    return typeof value === 'number' && KEYBOARD_LAYOUTS.has(value);
}

function isValidAiPilotModel(value: unknown): value is AiPilotModels {
    return typeof value === 'string' && AI_PILOT_MODELS.has(value);
}

function isValidAircraftId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length < 200;
}

function isValidSpawnMode(value: unknown): value is SpawnMode {
    return typeof value === 'string' && SPAWN_MODES.has(value as SpawnMode);
}
