import { FlightModel } from "../physics/model/flightModel";
import { AiPilotModels, ShadowQualities, UnitSystems } from "../state/gameDefs";
import { assertExpr, assertIsDefined } from "../utils/asserts";
import { TechProfile } from "./profiles/profile";

export type ProfileChangeListener = (profile: TechProfile, newId: string, oldId: string) => void;
export type FlightModelChangeListener = (flightModel: FlightModel, newId: string, oldId: string) => void;
export type UnitSystemChangeListener = (unitSystem: UnitSystems) => void;
export type AiPilotModelChangeListener = (model: AiPilotModels) => void;
export type ShadowQualityChangeListener = (quality: ShadowQualities) => void;

export class ConfigService {

    readonly techProfiles: ConfigSet<TechProfile>;
    readonly flightModels: ConfigSet<FlightModel>;
    readonly unitSystem: UnitSystemSetting;
    readonly aiPilotModels: AiPilotModelSetting;
    readonly shadowQuality: ShadowQualitySetting;

    constructor(
        profiles: { [id: string]: TechProfile },
        flightModels: { [id: string]: FlightModel },
        initialTechProfile?: string,
        initialFlightModel?: string,
        initialAiPilotModel?: AiPilotModels,
        initialShadowQuality?: ShadowQualities,
    ) {
        this.techProfiles = new ConfigSet(profiles, initialTechProfile);
        this.flightModels = new ConfigSet(flightModels, initialFlightModel);
        this.unitSystem = new UnitSystemSetting();
        this.aiPilotModels = new AiPilotModelSetting(initialAiPilotModel);
        this.shadowQuality = new ShadowQualitySetting(initialShadowQuality);
    }
}

export type ConfigSetChangeListener<T> = (item: T, newId: string, oldId: string) => void;

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
