import { KeyboardControlLayoutId } from "../input/devices/keyboardControlDevice";
import { FlightModels, TechProfiles } from "../state/gameDefs";

const STORAGE_KEY = 'retroflightsim.settings';

export interface AppSettings {
    techProfile: string;
    flightModel: string;
    keyboardLayout: KeyboardControlLayoutId;
}

export const DEFAULT_SETTINGS: AppSettings = {
    techProfile: TechProfiles.HD,
    flightModel: FlightModels.ARCADE,
    keyboardLayout: KeyboardControlLayoutId.ARROWS,
};

const TECH_PROFILES = new Set<string>(Object.values(TechProfiles));
const FLIGHT_MODELS = new Set<string>(Object.values(FlightModels));
const KEYBOARD_LAYOUTS = new Set<number>(Object.values(KeyboardControlLayoutId).filter(v => typeof v === 'number') as number[]);

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
