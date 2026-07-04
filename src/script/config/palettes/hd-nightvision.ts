import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF3333',

    [PaletteCategory.COCKPIT_AI_SKY]: '#3a68a8',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffb820',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#1a3a10',

    [PaletteCategory.BACKGROUND]: '#282828',

    [PaletteCategory.FOG_SKY]: '#181818',
    [PaletteCategory.FOG_TERRAIN]: '#181818',
    [PaletteCategory.FOG_SPECKLE]: '#181818',
    [PaletteCategory.FOG_LIGHT]: '#181818',

    [PaletteCategory.SKY]: '#282828',

    [PaletteCategory.TERRAIN_DEFAULT]: '#404040',
    [PaletteCategory.TERRAIN_SAND]: '#404040',
    [PaletteCategory.TERRAIN_BARE]: '#404040',
    [PaletteCategory.TERRAIN_GRASS]: '#404040',
    [PaletteCategory.TERRAIN_WATER]: '#282828',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#282828',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: '#404040',
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: '#404040',

    [PaletteCategory.LIGHT_RED]: '#e0e0e0',
    [PaletteCategory.LIGHT_GREEN]: '#e0e0e0',
    [PaletteCategory.LIGHT_YELLOW]: '#e0e0e0',

    [PaletteCategory.GLASS]: '#282828',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#c8c8c8',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#b5b5b5',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#d4d4d4',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#dedede',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#282828',

    [PaletteCategory.SCENERY_SPECKLE]: '#505050',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#444444',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#484848',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#707070',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#707070',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#707070',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#707070',
    [PaletteCategory.SCENERY_FIELD_RED]: '#707070',

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#848484',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#848484',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#848484',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#626262',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#6c6c6c',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#6c6c6c',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#6c6c6c',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#737373',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#737373',

    [PaletteCategory.FX_FIRE]: '#f4f4f4',
    [PaletteCategory.FX_FIRE__B]: '#d8d8d8',

    [PaletteCategory.FX_SMOKE]: '#b0b0b0',
    [PaletteCategory.FX_SMOKE__B]: '#848484',
    [PaletteCategory.FX_SMOKE__C]: '#484848',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00005,
    [PaletteCategory.FOG_LIGHT]: 0.00007,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const HDNightVisionPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
