import { FlightModel } from "../physics/model/flightModel";
import { assertExpr, assertIsDefined } from "../utils/asserts";
import { TechProfile } from "./profiles/profile";

export type ProfileChangeListener = (profile: TechProfile, newId: string, oldId: string) => void;
export type FlightModelChangeListener = (flightModel: FlightModel, newId: string, oldId: string) => void;

export class ConfigService {

    readonly techProfiles: ConfigSet<TechProfile>;
    readonly flightModels: ConfigSet<FlightModel>;

    constructor(
        profiles: { [id: string]: TechProfile },
        flightModels: { [id: string]: FlightModel },
        initialTechProfile?: string,
        initialFlightModel?: string,
    ) {
        this.techProfiles = new ConfigSet(profiles, initialTechProfile);
        this.flightModels = new ConfigSet(flightModels, initialFlightModel);
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

    getActiveId(): string {
        return this.active;
    }

    addChangeListener(listener: ConfigSetChangeListener<T>) {
        this.listeners.add(listener);
    }

    removeChangeListener(listener: ConfigSetChangeListener<T>) {
        this.listeners.delete(listener);
    }
}
