import { FlightModel } from "../physics/model/flightModel";
import { DEFAULT_SUN_HOURS } from "../scene/materials/shaders/sun";
import { AiPilotModels, ShadowQualities, TerrainColours, UnitSystems } from "../state/gameDefs";
import { assertExpr, assertIsDefined } from "../utils/asserts";
import {
    TERRAIN_DETAIL_DISTANCE_DEFAULT_M, clampDetailDistanceM,
} from "../terrain/lod";
import { TechProfile } from "./profiles/profile";

export type ProfileChangeListener = (profile: TechProfile, newId: string, oldId: string) => void;
export type FlightModelChangeListener = (flightModel: FlightModel, newId: string, oldId: string) => void;
export type UnitSystemChangeListener = (unitSystem: UnitSystems) => void;
export type AiPilotModelChangeListener = (model: AiPilotModels) => void;
export type ShadowQualityChangeListener = (quality: ShadowQualities) => void;
export type TerrainColourChangeListener = (mode: TerrainColours) => void;
export type DaytimeChangeListener = (hours: number) => void;
export type TerrainDetailChangeListener = (distanceM: number) => void;

export class ConfigService {

    readonly techProfiles: ConfigSet<TechProfile>;
    readonly flightModels: ConfigSet<FlightModel>;
    readonly unitSystem: UnitSystemSetting;
    readonly aiPilotModels: AiPilotModelSetting;
    readonly shadowQuality: ShadowQualitySetting;
    readonly terrainColour: TerrainColourSetting;
    readonly terrainDetail: TerrainDetailSetting;
    readonly daytime: DaytimeSetting;

    constructor(
        profiles: { [id: string]: TechProfile },
        flightModels: { [id: string]: FlightModel },
        initialTechProfile?: string,
        initialFlightModel?: string,
        initialAiPilotModel?: AiPilotModels,
        initialShadowQuality?: ShadowQualities,
        initialDaytime?: number,
        initialTerrainColour?: TerrainColours,
        initialTerrainDetailM?: number,
    ) {
        this.techProfiles = new ConfigSet(profiles, initialTechProfile);
        this.flightModels = new ConfigSet(flightModels, initialFlightModel);
        this.unitSystem = new UnitSystemSetting();
        this.aiPilotModels = new AiPilotModelSetting(initialAiPilotModel);
        this.shadowQuality = new ShadowQualitySetting(initialShadowQuality);
        this.terrainColour = new TerrainColourSetting(initialTerrainColour);
        this.terrainDetail = new TerrainDetailSetting(initialTerrainDetailM);
        this.daytime = new DaytimeSetting(initialDaytime);
    }
}

export type ConfigSetChangeListener<T> = (item: T, newId: string, oldId: string) => void;

/**
 * Local solar time of day, in hours (0..24). Drives the sun direction, the
 * blended sky/terrain palette and the cast shadows; see
 * {@link setSunTime} and {@link daytimePalette}.
 */
export class DaytimeSetting {
    private active: number;
    private listeners: Set<DaytimeChangeListener> = new Set();

    constructor(initialActive: number = DEFAULT_SUN_HOURS) {
        this.active = clampDaytime(initialActive);
    }

    getActive(): number {
        return this.active;
    }

    setActive(hours: number) {
        const clamped = clampDaytime(hours);
        if (clamped === this.active) return;
        this.active = clamped;
        this.notifyActive();
    }

    /** Push the current value to listeners (used once after they register). */
    notifyActive() {
        for (const listener of this.listeners.values()) {
            listener(this.active);
        }
    }

    addChangeListener(listener: DaytimeChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: DaytimeChangeListener) {
        this.listeners.delete(listener);
    }
}

/**
 * How far out terrain keeps full detail, in metres.
 *
 * Past it the far field is allowed to coarsen faster than screen space alone
 * would coarsen it — see {@link detailFalloff} — which is where most of the
 * triangle count above the horizon goes. The top of the slider is
 * {@link DETAIL_DISTANCE_OFF}: no falloff, the behaviour before this existed.
 */
export class TerrainDetailSetting {
    private active: number;
    private listeners: Set<TerrainDetailChangeListener> = new Set();

    constructor(initialActive: number = TERRAIN_DETAIL_DISTANCE_DEFAULT_M) {
        this.active = clampDetailDistanceM(initialActive);
    }

    getActive(): number {
        return this.active;
    }

    setActive(distanceM: number) {
        const clamped = clampDetailDistanceM(distanceM);
        if (clamped === this.active) return;
        this.active = clamped;
        this.notifyActive();
    }

    /** Push the current value to listeners (used once after they register). */
    notifyActive() {
        for (const listener of this.listeners.values()) {
            listener(this.active);
        }
    }

    addChangeListener(listener: TerrainDetailChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: TerrainDetailChangeListener) {
        this.listeners.delete(listener);
    }
}

/** 24:00 wraps to 00:00 so the slider's two ends are the same midnight. */
export function clampDaytime(hours: number): number {
    if (!Number.isFinite(hours)) return DEFAULT_SUN_HOURS;
    return ((hours % 24) + 24) % 24;
}

class ConfigSet<T> {
    private active: string;
    private set: Map<string, T>;
    private listeners: Set<ConfigSetChangeListener<T>> = new Set();

    constructor(obj: { [id: string]: T }, initialActive?: string) {
        [this.active, this.set] = this.setupMap(obj, initialActive);
    }

    private setupMap(obj: { [id: string]: T }, initialActive?: string): [string, Map<string, T>] {
        const map = new Map(Object.entries(obj));
        assertExpr(map.size > 0);
        const fallback = Object.keys(obj)[0];
        const active = initialActive !== undefined && map.has(initialActive) ? initialActive : fallback;
        return [active, map];
    }

    setActive(id: string) {
        if (id === this.active) return;
        assertExpr(this.set.has(id));

        const oldId = this.active;
        this.active = id;
        const set = this.getActive();
        for (const l of this.listeners.values()) {
            l(set, id, oldId);
        }
    }

    /** Apply the current active item to listeners (used once after listeners are registered). */
    notifyActive() {
        const set = this.getActive();
        for (const l of this.listeners.values()) {
            l(set, this.active, this.active);
        }
    }

    getActive(): T {
        const item = this.set.get(this.active);
        assertIsDefined(item);
        return item;
    }

    getActiveKey(): string {
        return this.active;
    }

    addChangeListener(listener: ConfigSetChangeListener<T>) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: ConfigSetChangeListener<T>) {
        this.listeners.delete(listener);
    }
}

export class UnitSystemSetting {
    private active: UnitSystems = UnitSystems.METRIC;
    private listeners: Set<UnitSystemChangeListener> = new Set();

    getActive(): UnitSystems {
        return this.active;
    }

    setActive(system: UnitSystems) {
        if (system === this.active) return;
        this.active = system;
        for (const listener of this.listeners.values()) {
            listener(system);
        }
    }

    addChangeListener(listener: UnitSystemChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: UnitSystemChangeListener) {
        this.listeners.delete(listener);
    }
}

export class AiPilotModelSetting {
    private active: AiPilotModels;
    private listeners: Set<AiPilotModelChangeListener> = new Set();

    constructor(initialActive: AiPilotModels = AiPilotModels.CLASSIC) {
        this.active = initialActive;
    }

    getActive(): AiPilotModels {
        return this.active;
    }

    setActive(model: AiPilotModels) {
        if (model === this.active) return;
        this.active = model;
        for (const listener of this.listeners.values()) {
            listener(model);
        }
    }

    addChangeListener(listener: AiPilotModelChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: AiPilotModelChangeListener) {
        this.listeners.delete(listener);
    }
}

/**
 * Which of the four terrain colour models is on screen.
 *
 * Every one of them is served by the same baked bytes, so this is a uniform
 * write and nothing else - no re-stream, no re-upload, no re-bake.
 */
export class TerrainColourSetting {
    private active: TerrainColours;
    private listeners: Set<TerrainColourChangeListener> = new Set();

    constructor(initialActive: TerrainColours = TerrainColours.HYBRID) {
        this.active = initialActive;
    }

    getActive(): TerrainColours {
        return this.active;
    }

    setActive(mode: TerrainColours) {
        if (mode === this.active) return;
        this.active = mode;
        this.notifyActive();
    }

    /** Push the current value to listeners (used once after they register). */
    notifyActive() {
        for (const listener of this.listeners.values()) {
            listener(this.active);
        }
    }

    addChangeListener(listener: TerrainColourChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: TerrainColourChangeListener) {
        this.listeners.delete(listener);
    }
}

export class ShadowQualitySetting {
    private active: ShadowQualities;
    private listeners: Set<ShadowQualityChangeListener> = new Set();

    constructor(initialActive: ShadowQualities = ShadowQualities.LOW) {
        this.active = initialActive;
    }

    getActive(): ShadowQualities {
        return this.active;
    }

    setActive(quality: ShadowQualities) {
        if (quality === this.active) return;
        this.active = quality;
        this.notifyActive();
    }

    /** Push the current value to listeners (used once after they register). */
    notifyActive() {
        for (const listener of this.listeners.values()) {
            listener(this.active);
        }
    }

    addChangeListener(listener: ShadowQualityChangeListener) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: ShadowQualityChangeListener) {
        this.listeners.delete(listener);
    }
}
