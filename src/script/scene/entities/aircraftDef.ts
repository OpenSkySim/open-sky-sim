import { Fm2AircraftConfig } from '../../physics/fm2/fm2AircraftConfig';

/**
 * How a control surface's deflection is driven from the pilot's inputs.
 *   pitch/roll/yaw : signed stick/pedal input.
 *   flaps          : flap deployment progress [0,1].
 *   slats          : leading-edge slats — follow flaps and high AoA.
 *   flaperonLeft/Right : the F-22's combined flap + roll blend (kept so the
 *                        default aircraft animates exactly as before).
 */
export type ControlAxis = 'pitch' | 'roll' | 'yaw' | 'flaps' | 'slats' | 'flaperonLeft' | 'flaperonRight';

/** A single animated control surface loaded as its own hinge-pivoted model. */
export interface ControlSurfaceConfig {
    role: string;
    /** glTF/GLB path of the hinge-pivoted surface model. */
    model: string;
    /** Hinge pivot in the aircraft body frame (m). */
    pivot: [number, number, number];
    /** Hinge axis (body frame unit vector). */
    axis: [number, number, number];
    control: ControlAxis;
    /** Deflection sign multiplier. */
    sign: number;
    /** Maximum deflection scale (rad) applied to the control value. */
    rangeRad: number;
}

/** Optional visual effects; omit or null to disable per aircraft. */
export interface AircraftFxConfig {
    /** Wingtip vortex trail origins [left, right] (body frame); null disables. */
    wingtips?: [[number, number, number], [number, number, number]] | null;
    /** Reserved for future per-aircraft nozzle FX; null uses defaults. */
    nozzles?: [number, number, number][] | null;
}

/** Everything needed to build and fly a player aircraft. */
export interface FlyableAircraftDef {
    id: string;
    name: string;
    /** Exterior body model path. */
    body: string;
    /** Flattened shadow silhouette model path. */
    shadow: string;
    /** Landing-gear model path (optional). */
    gear?: string;
    /** True when the gear model carries a retract/extend animation clip. */
    gearAnimated?: boolean;
    surfaces: ControlSurfaceConfig[];
    fx?: AircraftFxConfig;
    /** Cockpit eye offset from the aircraft origin (body frame, m): [x, y, z]. */
    cockpitOffset: [number, number, number];
    /** FM2 flight-dynamics config; when set, the FM2 model flies this aircraft. */
    flight?: Fm2AircraftConfig;
}
