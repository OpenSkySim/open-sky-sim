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
import { AircraftTailhookConfig, ControlSurfaceConfig, FlyableAircraftDef, AircraftCollisionMesh, SwingWingsConfig } from '../scene/entities/aircraftDef';
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

/** Su-33 outer wing fold: up and over to lean inboard (published folded span 7.4 m). */
const SU33_WING_FOLD_RAD = 126 * Math.PI / 180;

/**
 * The Su-33 (Flanker-D): an original model built in Blender by
 * tools/build_su33_blender.py (data/su33d.blend; pivots and axes below are the
 * ones it prints). All-moving canards and tailerons, split flaps and
 * flaperons, leading-edge flaps, twin rudders, dorsal airbrake; the outer wings
 * fold at x 3.55 m and the stabilator tips at x 3.29 m (R key), with the
 * flaperons and outer leading-edge flaps riding the folding panels. It flies
 * the default FM2 airframe on its own gear layout.
 */
export function buildSu33Def(): FlyableAircraftDef {
    const gearPoints: [number, number, number][] = [
        [0, -2, 2.44], [2.135, -2, -3.37], [-2.135, -2, -3.37],
    ];
    return {
        id: 'su33d',
        name: '*Su-33',
        body: 'assets/su33d.glb',
        shadow: 'assets/su33d_shadow.glb',
        gear: 'assets/su33d_gear.glb',
        gearAnimated: true,
        cockpitOffset: [0, 1.38, 5.1],
        fx: {
            wingtips: [[7.15, 0.224, -6.3], [-7.15, 0.224, -6.3]],
            nozzles: [[1.16, -0.13, -9.5], [-1.16, -0.13, -9.5]],
            nozzleRadius: 0.42,
        },
        flight: { ...defaultFm2Config, gear: { ...defaultFm2Config.gear, points: gearPoints } },
        surfaces: [
            // Folding outer wings first: the flaperons and LE flaps below ride them.
            {
                role: 'wingFoldLeft', model: 'assets/su33d_wing_fold_left.glb',
                pivot: [3.55, 0.3628, -3.4], axis: [0, 0, -1],
                control: 'fold', sign: -1, rangeRad: SU33_WING_FOLD_RAD,
            },
            {
                role: 'wingFoldRight', model: 'assets/su33d_wing_fold_right.glb',
                pivot: [-3.55, 0.3628, -3.4], axis: [0, 0, 1],
                control: 'fold', sign: -1, rangeRad: SU33_WING_FOLD_RAD,
            },
            {
                role: 'flapInnerLeft', model: 'assets/su33d_flap_inner_left.glb',
                pivot: [2.2, 0.356, -4.5812], axis: [0.9479, -0.0157, -0.3181],
                control: 'flaps', sign: -1, rangeRad: 0.6,
            },
            {
                role: 'flapInnerRight', model: 'assets/su33d_flap_inner_right.glb',
                pivot: [-2.2, 0.356, -4.5812], axis: [0.9479, 0.0157, 0.3181],
                control: 'flaps', sign: -1, rangeRad: 0.6,
            },
            {
                role: 'flapLeft', model: 'assets/su33d_flap_left.glb',
                pivot: [3.575, 0.3331, -5.0426], axis: [0.9479, -0.0173, -0.3181],
                control: 'flaps', sign: -1, rangeRad: 0.5, sweepParent: 'wingFoldLeft',
            },
            {
                role: 'flapRight', model: 'assets/su33d_flap_right.glb',
                pivot: [-3.575, 0.3331, -5.0426], axis: [0.9479, 0.0173, 0.3181],
                control: 'flaps', sign: -1, rangeRad: 0.5, sweepParent: 'wingFoldRight',
            },
            {
                role: 'aileronLeft', model: 'assets/su33d_aileron_left.glb',
                // Right roll (+) lowers the left trailing edge, as the taileron does.
                pivot: [5.1, 0.3053, -5.5544], axis: [0.9479, -0.0198, -0.3181],
                control: 'roll', sign: -1, rangeRad: 0.35, sweepParent: 'wingFoldLeft',
            },
            {
                role: 'aileronRight', model: 'assets/su33d_aileron_right.glb',
                pivot: [-5.1, 0.3053, -5.5544], axis: [0.9479, 0.0198, 0.3181],
                control: 'roll', sign: 1, rangeRad: 0.35, sweepParent: 'wingFoldRight',
            },
            {
                role: 'slatInnerLeft', model: 'assets/su33d_slat_inner_left.glb',
                pivot: [2.15, 0.4658, -0.6991], axis: [0.76, -0.0228, -0.6496],
                control: 'slats', sign: 1, rangeRad: 0.52,
            },
            {
                role: 'slatInnerRight', model: 'assets/su33d_slat_inner_right.glb',
                pivot: [-2.15, 0.4658, -0.6991], axis: [0.76, 0.0228, 0.6496],
                control: 'slats', sign: 1, rangeRad: 0.52,
            },
            {
                role: 'slatLeft', model: 'assets/su33d_slat_left.glb',
                pivot: [3.575, 0.423, -1.9171], axis: [0.7599, -0.0246, -0.6496],
                control: 'slats', sign: 1, rangeRad: 0.52, sweepParent: 'wingFoldLeft',
            },
            {
                role: 'slatRight', model: 'assets/su33d_slat_right.glb',
                pivot: [-3.575, 0.423, -1.9171], axis: [0.7599, 0.0246, 0.6496],
                control: 'slats', sign: 1, rangeRad: 0.52, sweepParent: 'wingFoldRight',
            },
            {
                // Nose up: canard leading edge up, against the tail.
                role: 'canardLeft', model: 'assets/su33d_canard_left.glb',
                pivot: [1.5, 0.45, 1.4], axis: [1, 0, 0],
                control: 'pitch', sign: -1, rangeRad: 0.35,
            },
            {
                role: 'canardRight', model: 'assets/su33d_canard_right.glb',
                pivot: [-1.5, 0.45, 1.4], axis: [1, 0, 0],
                control: 'pitch', sign: -1, rangeRad: 0.35,
            },
            {
                role: 'elevatorLeft', model: 'assets/su33d_stab_left.glb',
                pivot: [0, -0.08, -7.75], axis: [1, 0, 0],
                control: 'stabilatorLeft', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'elevatorRight', model: 'assets/su33d_stab_right.glb',
                pivot: [0, -0.08, -7.75], axis: [1, 0, 0],
                control: 'stabilatorRight', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'stabFoldLeft', model: 'assets/su33d_stab_fold_left.glb',
                pivot: [2.71, -0.08, -8.0], axis: [0, 0, -1],
                control: 'fold', sign: -1, rangeRad: Math.PI / 2, sweepParent: 'elevatorLeft',
            },
            {
                role: 'stabFoldRight', model: 'assets/su33d_stab_fold_right.glb',
                pivot: [-2.71, -0.08, -8.0], axis: [0, 0, 1],
                control: 'fold', sign: -1, rangeRad: Math.PI / 2, sweepParent: 'elevatorRight',
            },
            {
                role: 'rudderLeft', model: 'assets/su33d_rudder_left.glb',
                pivot: [2.0124, 0.95, -7.136], axis: [0.0019, 0.996, -0.0896],
                control: 'yaw', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'rudderRight', model: 'assets/su33d_rudder_right.glb',
                pivot: [-2.0124, 0.95, -7.136], axis: [-0.0019, 0.996, -0.0896],
                control: 'yaw', sign: 1, rangeRad: HINGE_RANGE,
            },
            {
                role: 'speedbrake', model: 'assets/su33d_speedbrake.glb',
                pivot: [0, 1.4537, 2.6], axis: [1, 0, 0],
                control: 'airbrake', sign: 1, rangeRad: 0.9,
            },
        ],
    };
}

/** Raw shape of a packed `manifest.json` (subset the sim consumes). */
interface AircraftManifest {
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
    gearAnimated?: boolean;
    static?: string | null;
    collision?: string | null;
    collisionMesh?: AircraftCollisionMesh | null;
    surfaces: {
        role: string; path: string;
        pivot: [number, number, number]; axis: [number, number, number];
        control: string; sign: number; rangeRad: number; sweepParent?: string;
        slide?: [number, number, number];
    }[];
    swingWings?: SwingWingsConfig | null;
    tailhook?: AircraftTailhookConfig | null;
    fx?: { wingtips?: [[number, number, number], [number, number, number]] | null; nozzles?: [number, number, number][] | null; nozzleRadius?: number | null };
    attachments?: { name: string; position: [number, number, number]; forward: [number, number, number] }[] | null;
    cockpitOffset?: [number, number, number];
    pilotSeats?: [number, number, number][] | null;
    spawn?: { offset?: number; rotation?: number; dotColors?: [number, number, number] };
    groundOffsetY?: number;
    groundRestHeightM?: number;
    flight?: Fm2AircraftConfig | null;
}

function rewriteManifestForPack(id: string, manifest: AircraftManifest): AircraftManifest {
    // Packs store assets by basename. Tolerate legacy manifests that still list
    // import-relative paths (e.g. tools/mods/imports/…_collision.gltf).
    const packEntry = (path: string) => path.replace(/\\/g, '/').split('/').pop() ?? path;
    const packPath = (path: string) => toPackUrl(id, packEntry(path));
    return {
        ...manifest,
        body: packPath(manifest.body),
        shadow: packPath(manifest.shadow),
        gear: manifest.gear ? packPath(manifest.gear) : manifest.gear,
        static: manifest.static ? packPath(manifest.static) : manifest.static,
        collision: manifest.collision ? packPath(manifest.collision) : manifest.collision,
        surfaces: manifest.surfaces.map(surface => ({
            ...surface,
            path: packPath(surface.path),
        })),
        tailhook: manifest.tailhook?.model
            ? { ...manifest.tailhook, model: packPath(manifest.tailhook.model) }
            : manifest.tailhook,
    };
}

function modelDisplayName(m: AircraftManifest): string {
    const full = m.displayName ?? m.name ?? '';
    const paren = full.lastIndexOf(' (');
    if (paren > 0) {
        return full.slice(0, paren);
    }
    return m.canonicalName ?? full;
}

function liveryDisplayName(m: AircraftManifest): string | undefined {
    if (m.sourceMaterial) {
        return m.sourceMaterial;
    }
    const full = m.displayName ?? m.name ?? '';
    const paren = full.lastIndexOf(' (');
    if (paren > 0 && full.endsWith(')')) {
        return full.slice(paren + 2, -1);
    }
    return undefined;
}

export interface AircraftModelGroup {
    key: string;
    label: string;
    variants: FlyableAircraftDef[];
}

/** Group flyable defs by airframe type for model + livery spawn selection. */
export function groupAircraftByModel(defs: FlyableAircraftDef[]): AircraftModelGroup[] {
    const groups = new Map<string, AircraftModelGroup>();
    for (const def of defs) {
        const key = def.canonicalName ?? def.id;
        const label = def.modelName ?? def.name;
        let group = groups.get(key);
        if (!group) {
            group = { key, label, variants: [] };
            groups.set(key, group);
        }
        group.variants.push(def);
    }
    for (const group of groups.values()) {
        group.variants.sort((a, b) =>
            (a.liveryName ?? a.name).localeCompare(b.liveryName ?? b.name),
        );
    }
    return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function manifestToDef(id: string, m: AircraftManifest): FlyableAircraftDef {
    return {
        id: m.id ?? id,
        name: m.displayName ?? m.name ?? id,
        canonicalName: m.canonicalName,
        modelName: modelDisplayName(m),
        liveryName: liveryDisplayName(m),
        body: m.body,
        shadow: m.shadow,
        gear: m.gear ?? undefined,
        gearAnimated: m.gearAnimated ?? false,
        collision: m.collision ?? undefined,
        collisionMesh: m.collisionMesh ?? undefined,
        cockpitOffset: m.cockpitOffset ?? [0, 1.0, 6.0],
        pilotSeats: m.pilotSeats ?? undefined,
        spawn: m.spawn ?? undefined,
        attachments: m.attachments ?? undefined,
        fx: { wingtips: m.fx?.wingtips ?? null, nozzles: m.fx?.nozzles ?? null, nozzleRadius: m.fx?.nozzleRadius ?? null },
        flight: m.flight ?? undefined,
        swingWings: m.swingWings ?? undefined,
        tailhook: m.tailhook ?? undefined,
        surfaces: m.surfaces.map((s): ControlSurfaceConfig => {
            const role = s.role;
            // Older packs mapped speedbrakes to the flaps axis; drive them from airbrake.
            const control = (role.startsWith('speedbrake') && s.control === 'flaps')
                ? 'airbrake'
                : s.control as ControlSurfaceConfig['control'];
            return {
                role,
                model: s.path,
                pivot: s.pivot,
                axis: s.axis,
                control,
                sign: s.sign,
                rangeRad: s.rangeRad,
                sweepParent: s.sweepParent,
                slide: s.slide,
            };
        }),
    };
}

export class AircraftRegistry {
    private defs = new Map<string, FlyableAircraftDef>();
    private order: string[] = [];

    constructor() {
        this.register(buildF22Def());
        this.register(buildSu33Def());
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
