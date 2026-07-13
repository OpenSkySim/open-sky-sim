/**
 * Registry of flyable player aircraft.
 *
 * The F-22 is built in code from the values that used to be hard-wired into
 * PlayerEntity (regression guard — it flies and animates identically). Imported
 * mods are shipped as `.aircraft.pack` archives built by
 * tools/pack_aircraft_mods.py and loaded at runtime into the same
 * {@link FlyableAircraftDef} shape.
 */
import { Fm2AircraftConfig, defaultFm2Config } from '../physics/fm2/fm2AircraftConfig';
import { ControlSurfaceConfig, FlyableAircraftDef } from '../scene/entities/aircraftDef';
import { aircraftPackStore, toPackUrl } from './aircraftPack';

const HINGE_RANGE = Math.PI / 6;

export function buildF22Def(): FlyableAircraftDef {
    return {
        id: 'f22',
        name: 'F-22',
        body: 'assets/f22.glb',
        shadow: 'assets/f22_shadow.glb',
        gear: 'assets/f22_landinggear.glb',
        gearAnimated: true,
        cockpitOffset: [0, 1.0, 8.0],
        fx: { wingtips: null, nozzles: null },
        flight: defaultFm2Config,
        surfaces: [
            {
                role: 'flaperonLeft', model: 'assets/f22_flaperon_left.glb',
                pivot: [4.5, -0.21, -3], axis: [1.681781, -0.152682, 0.57654],
                control: 'flaperonLeft', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'flaperonRight', model: 'assets/f22_flaperon_right.glb',
                pivot: [-4.5, -0.21, -3], axis: [-1.681781, -0.152682, 0.57654],
                control: 'flaperonRight', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'elevatorLeft', model: 'assets/f22_elevator_left.glb',
                pivot: [0, 0, -6], axis: [1, 0, 0],
                control: 'stabilatorLeft', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'elevatorRight', model: 'assets/f22_elevator_right.glb',
                pivot: [0, 0, -6], axis: [1, 0, 0],
                control: 'stabilatorRight', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'rudderLeft', model: 'assets/f22_rudder_left.glb',
                pivot: [2.34, 1.8, -4.05], axis: [0.383502, 0.802989, 0.456217],
                control: 'yaw', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'rudderRight', model: 'assets/f22_rudder_right.glb',
                pivot: [-2.34, 1.8, -4.05], axis: [-0.383502, 0.802989, 0.456217],
                control: 'yaw', sign: 1, rangeRad: HINGE_RANGE,
            },
        ],
    };
}

/** Raw shape of a packed `manifest.json` (subset the sim consumes). */
export interface AircraftManifest {
    id?: string;
    name?: string;
    displayName?: string;
    canonicalName?: string;
    category?: string;
    description?: string;
    tags?: string[];
    sourceMod?: string;
    sourceModId?: string;
    sourceMaterial?: string;
    importMeta?: { confidence?: number; discoveredFrom?: string | null };
    body: string;
    shadow: string;
    gear?: string | null;
    static?: string | null;
    surfaces: {
        role: string; path: string;
        pivot: [number, number, number]; axis: [number, number, number];
        control: string; sign: number; rangeRad: number;
    }[];
    fx?: { wingtips?: [[number, number, number], [number, number, number]] | null; nozzles?: [number, number, number][] | null; nozzleRadius?: number | null };
    cockpitOffset?: [number, number, number];
    flight?: Fm2AircraftConfig | null;
}

function rewriteManifestForPack(id: string, manifest: AircraftManifest): AircraftManifest {
    const packPath = (path: string) => toPackUrl(id, path);
    return {
        ...manifest,
        body: packPath(manifest.body),
        shadow: packPath(manifest.shadow),
        gear: manifest.gear ? packPath(manifest.gear) : manifest.gear,
        static: manifest.static ? packPath(manifest.static) : manifest.static,
        surfaces: manifest.surfaces.map(surface => ({
            ...surface,
            path: packPath(surface.path),
        })),
    };
}

export function manifestToDef(id: string, m: AircraftManifest): FlyableAircraftDef {
    return {
        id: m.id ?? id,
        name: m.displayName ?? m.name ?? id,
        body: m.body,
        shadow: m.shadow,
        gear: m.gear ?? undefined,
        gearAnimated: false, // imported gear models are static (no retract clip)
        cockpitOffset: m.cockpitOffset ?? [0, 1.0, 6.0],
        fx: { wingtips: m.fx?.wingtips ?? null, nozzles: m.fx?.nozzles ?? null, nozzleRadius: m.fx?.nozzleRadius ?? null },
        flight: m.flight ?? undefined,
        surfaces: m.surfaces.map((s): ControlSurfaceConfig => ({
            role: s.role,
            model: s.path,
            pivot: s.pivot,
            axis: s.axis,
            control: s.control as ControlSurfaceConfig['control'],
            sign: s.sign,
            rangeRad: s.rangeRad,
        })),
    };
}

export class AircraftRegistry {
    private defs = new Map<string, FlyableAircraftDef>();
    private order: string[] = [];

    constructor() {
        this.register(buildF22Def());
    }

    private register(def: FlyableAircraftDef): void {
        if (!this.defs.has(def.id)) {
            this.order.push(def.id);
        }
        this.defs.set(def.id, def);
    }

    get(id: string): FlyableAircraftDef | undefined {
        return this.defs.get(id);
    }

    list(): FlyableAircraftDef[] {
        return this.order.map(id => this.defs.get(id)!).filter(Boolean);
    }

    /** Fetch, unpack, and register a mod pack; resolves to its id (or undefined on failure). */
    async loadPack(id: string, url: string): Promise<string | undefined> {
        try {
            const pack = await aircraftPackStore.loadFromUrl(id, url);
            const manifest = JSON.parse(pack.getText('manifest.json')) as AircraftManifest;
            this.register(manifestToDef(id, rewriteManifestForPack(id, manifest)));
            return id;
        } catch (err) {
            console.warn(`[aircraftRegistry] failed to load ${url}`, err);
            return undefined;
        }
    }
}
