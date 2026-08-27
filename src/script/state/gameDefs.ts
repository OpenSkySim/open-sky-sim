import { TerrainColourMode } from '../terrain/tones';

export enum TechProfiles {
    VGA = 'VGA',
    SVGA = 'SVGA',
    HD = 'HD',
}

/**
 * Every aircraft flies the single FM2 rigid-body "parts" model; handling
 * differences (fly-by-wire vs mechanical, etc.) are expressed purely as
 * per-aircraft config. FM2 is the full 6-DOF aerodynamic model; DEBUG selects the
 * same model's no-aerodynamics "free-fly" mode (stick rotates the airframe
 * directly) for inspecting scenery and models. JSBSIM runs the official JSBSim
 * F-16A model (via the `@0x62/jsbsim-wasm` WebAssembly build) in place of FM2;
 * unlike FM2 it always flies that one bundled airframe, independent of the
 * in-game aircraft/mod selected (see WorkerJsbsimFlightModel).
 */
export enum FlightModels {
    FM2 = 'FM2',
    DEBUG = 'DEBUG',
    JSBSIM = 'JSBSIM'
}

export enum UnitSystems {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
}

/**
 * Selectable in-worker AI pilot models. CLASSIC is the existing BFM AiPilot;
 * SHAW is the Robert L. Shaw Fighter Combat tactical FSM + FCC; AGGRESSIVE is
 * a "Berserker" doctrine that never disengages/breaks defensively, always
 * pressing the attack; ACE is an elite dogfighter that fights in the vertical,
 * manages energy deliberately and flies post-stall maneuvers (Cobra, Kulbit).
 * Applied on the next opponent spawn/enable (not mid-dogfight).
 *
 * Note this is the AI *model* — orthogonal to `AiSkillLevel.ACE`, which is the
 * difficulty tier the classic pilot's reaction/discipline tuning reads.
 */
export enum AiPilotModels {
    CLASSIC = 'CLASSIC',
    SHAW = 'SHAW',
    AGGRESSIVE = 'AGGRESSIVE',
    ACE = 'ACE',
}

/**
 * Resolution of the realtime sun shadow map. OFF skips the depth pass entirely
 * and brings back the flat planform silhouette under each aircraft.
 */
export enum ShadowQualities {
    OFF = 'OFF',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    ULTRA = 'ULTRA',
}

/**
 * How a terrain facet turns its two baked observations - the landcover class
 * and the satellite colour - into a colour on screen.
 *
 * The setting; the numbering the shader branches on is TerrainColourMode in
 * terrain/tones, which both this and the vertex program read.
 */
export enum TerrainColours {
    /** Landcover class picks a palette tone. The most retro of the four. */
    LANDCOVER = 'LANDCOVER',
    /** Satellite colour, snapped to the small colour table the bake derived. */
    SWATCH = 'SWATCH',
    /** Palette tone for the hue, satellite luminance for a banded shade. */
    HYBRID = 'HYBRID',
    /** The satellite colour itself. */
    IMAGERY = 'IMAGERY',
    /** The same four, shaded Gouraud instead of flat. */
    LANDCOVER_SMOOTH = 'LANDCOVER_SMOOTH',
    SWATCH_SMOOTH = 'SWATCH_SMOOTH',
    HYBRID_SMOOTH = 'HYBRID_SMOOTH',
    IMAGERY_SMOOTH = 'IMAGERY_SMOOTH',
}

/** uTerrainMode value per setting. */
export const TERRAIN_COLOUR_MODE_INDEX: Readonly<Record<TerrainColours, TerrainColourMode>> = {
    [TerrainColours.LANDCOVER]: TerrainColourMode.Landcover,
    [TerrainColours.SWATCH]: TerrainColourMode.Swatch,
    [TerrainColours.HYBRID]: TerrainColourMode.Hybrid,
    [TerrainColours.IMAGERY]: TerrainColourMode.Imagery,
    [TerrainColours.LANDCOVER_SMOOTH]: TerrainColourMode.Landcover,
    [TerrainColours.SWATCH_SMOOTH]: TerrainColourMode.Swatch,
    [TerrainColours.HYBRID_SMOOTH]: TerrainColourMode.Hybrid,
    [TerrainColours.IMAGERY_SMOOTH]: TerrainColourMode.Imagery,
};

/**
 * Whether a setting shades Gouraud.
 *
 * Colour and shading are independent choices sharing one control, so this is a
 * second lookup rather than a wider mode enum - the shader branches on the
 * colour model and multiplies by this, and neither has to know about the other.
 */
export const TERRAIN_COLOUR_SMOOTH: Readonly<Record<TerrainColours, boolean>> = {
    [TerrainColours.LANDCOVER]: false,
    [TerrainColours.SWATCH]: false,
    [TerrainColours.HYBRID]: false,
    [TerrainColours.IMAGERY]: false,
    [TerrainColours.LANDCOVER_SMOOTH]: true,
    [TerrainColours.SWATCH_SMOOTH]: true,
    [TerrainColours.HYBRID_SMOOTH]: true,
    [TerrainColours.IMAGERY_SMOOTH]: true,
};

export enum HUDFocusMode {
    DISABLED,
    PARTIAL,
    FULL,
    _LENGTH
}
