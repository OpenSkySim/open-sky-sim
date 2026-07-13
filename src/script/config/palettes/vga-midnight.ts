import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#55FF55',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#009A00',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#2c558e',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffa200',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#142901',

    [PaletteCategory.BACKGROUND]: '#753C79',

    [PaletteCategory.FOG_SKY]: '#753C79',
    [PaletteCategory.FOG_TERRAIN]: '#181004',
    [PaletteCategory.FOG_SPECKLE]: '#000000',
    [PaletteCategory.FOG_LIGHT]: '#FFFFFF',

    [PaletteCategory.SKY]: '#202849',

    [PaletteCategory.TERRAIN_DEFAULT]: '#003000',
    [PaletteCategory.TERRAIN_SAND]: '#003000',
    [PaletteCategory.TERRAIN_BARE]: '#003000',
    [PaletteCategory.TERRAIN_GRASS]: '#003000',
    [PaletteCategory.TERRAIN_WATER]: '#203455',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#253D64',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: ['#001800', '#003000'],
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: ['#001800', '#003000'],

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#753C79',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#19191a',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#1c1f20',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#0f0f0f',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#222124',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#050505',

    [PaletteCategory.SCENERY_SPECKLE]: '#505050',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#282828',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#242424',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#0b1d00',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#072b07',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#272300',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#221301',
    [PaletteCategory.SCENERY_FIELD_RED]: '#1d0505',

    [PaletteCategory.SCENERY_TREE_FOLIAGE]: ['#072b07', '#0b1d00'],
    [PaletteCategory.SCENERY_TREE_SHADOW]: ['#003000', '#001800'],
    [PaletteCategory.SCENERY_TREE_TRUNK]: '#2a1810',
    [PaletteCategory.SCENERY_WOOD_PATCH]: ['#051505', '#072b07'],
    [PaletteCategory.SCENERY_BIOME_PINE_PATCH]: ['#051505', '#072b07'],
    [PaletteCategory.SCENERY_BIOME_BUSH_PATCH]: ['#072007', '#0b280b'],
    [PaletteCategory.SCENERY_BIOME_BIRCH_PATCH]: ['#061806', '#0b1d00'],
    [PaletteCategory.SCENERY_BIOME_SCRUB_PATCH]: ['#181008', '#221810'],
    [PaletteCategory.SCENERY_BIOME_PINE_FOLIAGE]: ['#061806', '#0a280a'],
    [PaletteCategory.SCENERY_BIOME_BUSH_FOLIAGE]: ['#082008', '#0c300c'],
    [PaletteCategory.SCENERY_BIOME_SCRUB_FOLIAGE]: ['#201810', '#2a2018'],
    [PaletteCategory.SCENERY_BIOME_BIRCH_FOLIAGE]: ['#0e3a12', '#164a1a'],

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#242424',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#2d1414',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#103232',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#242424',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#282828',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#2a212b',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#160000',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#242424',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#282828',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',

    [PaletteCategory.FX_SMOKE]: '#6c6c6c',
    [PaletteCategory.FX_SMOKE__B]: '#383838',
    [PaletteCategory.FX_SMOKE__C]: '#2c2c2c',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.00015,
    [PaletteCategory.FOG_LIGHT]: 0.0,
    [PaletteCategory.FOG_SPECKLE]: 0.003
};

export const VGAMidnightPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.NIGHT
};
