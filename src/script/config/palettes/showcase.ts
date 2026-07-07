import { HDNoonPalette } from './hd-noon';
import { Palette, PaletteCategory } from './palette';

/** Daytime aircraft colors on a pure black backdrop with fog disabled. */
export const ShowcasePalette: Palette = {
    ...HDNoonPalette,
    colors: {
        ...HDNoonPalette.colors,
        [PaletteCategory.BACKGROUND]: '#000000',
        [PaletteCategory.FOG_SKY]: '#000000',
        [PaletteCategory.FOG_TERRAIN]: '#000000',
        [PaletteCategory.FOG_SPECKLE]: '#000000',
        [PaletteCategory.FOG_LIGHT]: '#000000',
    },
    values: {
        [PaletteCategory.FOG_SKY]: 0,
        [PaletteCategory.FOG_TERRAIN]: 0,
        [PaletteCategory.FOG_LIGHT]: 0,
        [PaletteCategory.FOG_SPECKLE]: 0,
    },
};
