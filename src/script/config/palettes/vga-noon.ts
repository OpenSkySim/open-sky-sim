import { Palette, PaletteCategory, PaletteColors, PaletteTime, PaletteValues } from "./palette";

const colors: PaletteColors = {
    [PaletteCategory.HUD_TEXT]: '#FFFFFF',
    [PaletteCategory.HUD_TEXT_EFFECT]: '#000000',
    [PaletteCategory.HUD_TEXT_SECONDARY]: '#AAAAAA',
    [PaletteCategory.HUD_TEXT_WARN]: '#FF0000',

    [PaletteCategory.COCKPIT_AI_SKY]: '#2c558e',
    [PaletteCategory.COCKPIT_AI_GROUND]: '#ffa200',
    [PaletteCategory.COCKPIT_MFD_BACKGROUND]: '#142901',

    [PaletteCategory.BACKGROUND]: '#D3D3D3',

    [PaletteCategory.FOG_SKY]: '#D3D3D3',
    [PaletteCategory.FOG_TERRAIN]: '#D3D3D3',
    [PaletteCategory.FOG_SPECKLE]: '#FFFFFF',
    [PaletteCategory.FOG_LIGHT]: '#D3D3D3',

    [PaletteCategory.SKY]: '#10A2FB',
    [PaletteCategory.SKY_CLOUD]: ['#FFFFFF', '#B8D4E8'],
    [PaletteCategory.SKY_SUN]: '#FFFFC0',

    [PaletteCategory.TERRAIN_DEFAULT]: '#078C02',
    [PaletteCategory.TERRAIN_SAND]: '#c8a860',
    [PaletteCategory.TERRAIN_GRASS]: '#078C02',
    [PaletteCategory.TERRAIN_BARE]: '#7a4b2e',
    [PaletteCategory.TERRAIN_FOREST]: '#046004',
    [PaletteCategory.TERRAIN_SCRUB]: '#6b7a1e',
    [PaletteCategory.TERRAIN_CROP]: '#9aa816',
    [PaletteCategory.TERRAIN_URBAN]: '#8e8880',
    [PaletteCategory.TERRAIN_SNOW]: '#e4e4f0',
    [PaletteCategory.TERRAIN_WETLAND]: '#1f6b46',
    [PaletteCategory.TERRAIN_WATER]: '#0d2474',
    [PaletteCategory.TERRAIN_SHALLOW_WATER]: '#0b2aa0',
    [PaletteCategory.SCENERY_MOUNTAIN_GRASS]: ['#034401', '#078C02'],
    [PaletteCategory.SCENERY_MOUNTAIN_BARE]: ['#034401', '#078C02'],

    [PaletteCategory.LIGHT_RED]: '#FF0000',
    [PaletteCategory.LIGHT_GREEN]: '#00FF00',
    [PaletteCategory.LIGHT_YELLOW]: '#FFFFBA',

    [PaletteCategory.GLASS]: '#10A2FB',

    [PaletteCategory.VEHICLE_PLANE_GREY]: '#828385',
    [PaletteCategory.VEHICLE_PLANE_NAVY]: '#6f7981',
    [PaletteCategory.VEHICLE_PLANE_INTAKE]: '#58595A',
    [PaletteCategory.VEHICLE_PLANE_ENGINE]: '#4B484E',
    [PaletteCategory.VEHICLE_PLANE_INTERIOR]: '#202020',

    [PaletteCategory.SCENERY_SPECKLE]: '#707070',

    [PaletteCategory.SCENERY_ROAD_MAIN]: '#4D4D4D',
    [PaletteCategory.SCENERY_ROAD_SECONDARY]: '#555555',

    [PaletteCategory.SCENERY_FIELD_GREEN]: '#006d00',
    [PaletteCategory.SCENERY_FIELD_GREEN_LIGHT]: '#148214',
    [PaletteCategory.SCENERY_FIELD_YELLOW]: '#dbb228',
    [PaletteCategory.SCENERY_FIELD_OCHRE]: '#b66908',
    [PaletteCategory.SCENERY_FIELD_RED]: '#aa1414',

    [PaletteCategory.SCENERY_TREE_FOLIAGE]: ['#148214', '#28a028'],
    [PaletteCategory.SCENERY_TREE_SHADOW]: ['#000000', '#2a2a2a'],
    [PaletteCategory.SCENERY_TREE_TRUNK]: '#6b4423',
    [PaletteCategory.SCENERY_WOOD_PATCH]: ['#006d00', '#148214'],
    [PaletteCategory.SCENERY_BIOME_PINE_PATCH]: ['#004020', '#006030'],
    [PaletteCategory.SCENERY_BIOME_BUSH_PATCH]: ['#005000', '#007800'],
    [PaletteCategory.SCENERY_BIOME_BIRCH_PATCH]: ['#005818', '#148214'],
    [PaletteCategory.SCENERY_BIOME_SCRUB_PATCH]: ['#403020', '#605030'],
    [PaletteCategory.SCENERY_BIOME_PINE_FOLIAGE]: ['#005028', '#007838'],
    [PaletteCategory.SCENERY_BIOME_BUSH_FOLIAGE]: ['#006800', '#009800'],
    [PaletteCategory.SCENERY_BIOME_SCRUB_FOLIAGE]: ['#504028', '#706040'],
    [PaletteCategory.SCENERY_BIOME_BIRCH_FOLIAGE]: ['#1e8a10', '#42a028'],

    [PaletteCategory.SCENERY_BUILDING_PLASTER_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_RED]: '#e16565',
    [PaletteCategory.SCENERY_BUILDING_PLASTER_TEAL]: '#37aaaa',
    [PaletteCategory.SCENERY_BUILDING_CONCRETE]: '#9A9A9A',
    [PaletteCategory.SCENERY_BUILDING_METAL]: '#C0C0C0',
    [PaletteCategory.SCENERY_BUILDING_METAL_WHITE]: '#d8d8d8',
    [PaletteCategory.SCENERY_BUILDING_METAL_RED]: '#d60000',

    [PaletteCategory.SCENERY_BASE_RUNWAY_LINES]: '#9A9A9A',
    [PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD]: '#C0C0C0',
    [PaletteCategory.SCENERY_BASE_CONCRETE]: '#808080',

    [PaletteCategory.FX_FIRE]: '#ff8800',
    [PaletteCategory.FX_FIRE__B]: '#ffff00',

    [PaletteCategory.FX_SMOKE]: '#2c2c2c',
    [PaletteCategory.FX_SMOKE__B]: '#383838',
    [PaletteCategory.FX_SMOKE__C]: '#6c6c6c',
};

const values: PaletteValues = {
    [PaletteCategory.FOG_SKY]: 0.003,
    [PaletteCategory.FOG_TERRAIN]: 0.000006,
    [PaletteCategory.FOG_LIGHT]: 0.000005,
    [PaletteCategory.FOG_SPECKLE]: 0.0005
};

export const VGANoonPalette: Palette = {
    colors: colors,
    values: values,
    time: PaletteTime.DAY
};
