import { SUN_STATE } from "../../scene/materials/shaders/sun";
import { Palette, PaletteCategory, PaletteColor, PaletteColors, PaletteTime, PaletteValues } from "./palette";

/**
 * Builds the palette for a given sun position by blending a profile's noon and
 * midnight palettes and casting the golden / blue hour over the result.
 *
 * The two authored palettes stay the endpoints: noon is exactly the noon
 * palette, midnight exactly the midnight one, and everything in between is
 * interpolated, so a new tech profile only has to author those two.
 *
 * All mixing happens in linear light, not in the 8-bit sRGB the palettes are
 * authored in. Lerping gamma-encoded channels is what used to turn the orange
 * cast over a blue sky into flat grey an hour before sunset, and the sunset
 * itself into brown: complementary hues cancel in gamma space instead of
 * passing through a saturated midpoint.
 */

/**
 * How the low sun reaches each part of the frame. A real one does not tint the
 * dome uniformly: the horizon band burns orange while the zenith deepens into
 * blue, so the sky's top-to-bottom contrast *increases* through sunset. Tinting
 * every sky category by one shared amount - which is what this used to do -
 * collapsed the whole dome onto the same orange, and left the zenith warmer
 * than the horizon once the sun was well down.
 */
enum TintTier {
    /** The band the sun sets into: the clear colour and the fog colours. */
    HORIZON = 'HORIZON',
    /** Overhead, plus the canopy glass authored to match it. */
    ZENITH = 'ZENITH',
    /** Cloud decks, lit from underneath by the raking light. */
    CLOUD = 'CLOUD',
    /** The sun disc and its corona: reddens hardest, never goes blue. */
    SUN = 'SUN',
    /** Everything the sun lands on. */
    GROUND = 'GROUND',
}

interface Tint {
    /** Colour this tier is pulled towards at golden hour. */
    readonly warm: string;
    /** Weight of {@link Tint.warm} at a full {@link SunState.twilightFactor}. */
    readonly warmStrength: number;
    /** Weight of {@link TWILIGHT_COOL_TINT} at a full blue hour. */
    readonly coolStrength: number;
    /**
     * Rescale back to the untinted luminance after tinting. Sky tiers want the
     * raw mix - a sunset horizon really is a different brightness from a noon
     * one - but lit surfaces do not: their base colours are dark, so pulling
     * them towards a bright orange made the ground *brighter* at sunset
     * than at noon. The sun's colour changes here, not its strength; how much
     * light is left is already the job of `nightMix` and the shaded N.L term.
     */
    readonly preserveLuma?: boolean;
    /**
     * Weight, at full {@link SunState.hazeFactor}, of a pull towards the
     * horizon colour. Only the zenith uses it: a low sun's light crosses enough
     * air to wash the top of the dome down towards the bottom of it, which is
     * the one thing that tells mid-morning apart from noon. Every other factor
     * here is pinned by 07:30 and stays pinned until 16:30.
     */
    readonly hazeStrength?: number;
}

/** Colour the blue hour pulls towards once the sun is under the horizon. */
const TWILIGHT_COOL_TINT = '#2a4a80';

const TINTS: Record<TintTier, Tint> = {
    [TintTier.HORIZON]: { warm: '#ff6a28', warmStrength: 0.85, coolStrength: 0.10 },
    [TintTier.ZENITH]: { warm: '#ff7a3c', warmStrength: 0.12, coolStrength: 0.45, hazeStrength: 0.35 },
    [TintTier.CLOUD]: { warm: '#ff8a4a', warmStrength: 0.55, coolStrength: 0.25 },
    // The setting sun looks through the most atmosphere of anything on screen,
    // so it reddens further than the band around it - and it is the one thing
    // the blue hour must not touch: what is left of it after sunset is the
    // reddest object in the frame, not the coolest.
    [TintTier.SUN]: { warm: '#ff4a10', warmStrength: 0.92, coolStrength: 0 },
    [TintTier.GROUND]: { warm: '#ff9a5e', warmStrength: 0.28, coolStrength: 0.30, preserveLuma: true },
};

const TIER_BY_CATEGORY: ReadonlyMap<PaletteCategory, TintTier> = new Map([
    [PaletteCategory.BACKGROUND, TintTier.HORIZON],
    [PaletteCategory.FOG_SKY, TintTier.HORIZON],
    [PaletteCategory.FOG_TERRAIN, TintTier.HORIZON],
    [PaletteCategory.FOG_LIGHT, TintTier.HORIZON],
    [PaletteCategory.SKY, TintTier.ZENITH],
    [PaletteCategory.GLASS, TintTier.ZENITH],
    [PaletteCategory.SKY_CLOUD, TintTier.CLOUD],
    [PaletteCategory.SKY_SUN, TintTier.SUN],
    [PaletteCategory.SKY_SUN_GLOW, TintTier.SUN],
]);

/**
 * Categories whose colour is an instrument reading or its own light source
 * (HUD, cockpit gauges, nav lights, fire and smoke). These are emissive or
 * symbolic, so the sun neither tints nor darkens them: they switch between the
 * two authored colours rather than interpolating. HUD text in particular must
 * stay one of the literal palette colours, because the canvas painter
 * pre-renders its glyphs per colour (see Game.getTextColors).
 */
const UNLIT_PREFIXES: readonly string[] = ['HUD', 'COCKPIT', 'LIGHT_', 'FX'];

/**
 * Night mix at which the world flips to the night model set (lit windows, nav
 * beacons). Models are tagged day-only / night-only, so this is a hard switch
 * however smoothly the colours themselves cross over. On the palette's own
 * night ramp this lands around 5 degrees below the horizon, i.e. roughly when
 * real street lighting comes on; on the old ramp it fired 1 degree *above* it.
 */
const NIGHT_MODELS_THRESHOLD = 0.5;

type Rgb = [number, number, number];

function parseHex(css: string): Rgb {
    const n = parseInt(css.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex(rgb: Rgb): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + ((clamp(rgb[0]) << 16) | (clamp(rgb[1]) << 8) | clamp(rgb[2])).toString(16).padStart(6, '0');
}

/** sRGB 0..255 to linear 0..1. Exact enough to round-trip every byte value. */
function toLinear(rgb: Rgb): Rgb {
    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return [channel(rgb[0]), channel(rgb[1]), channel(rgb[2])];
}

/** Linear 0..1 back to sRGB 0..255. */
function toSrgb(rgb: Rgb): Rgb {
    const channel = (v: number) => {
        const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return c * 255;
    };
    return [channel(rgb[0]), channel(rgb[1]), channel(rgb[2])];
}

/** Parsed straight to linear; the tints are constants, so this is worth caching. */
const linearCache: Map<string, Rgb> = new Map();

function linearOf(css: string): Rgb {
    let rgb = linearCache.get(css);
    if (rgb === undefined) {
        rgb = toLinear(parseHex(css));
        linearCache.set(css, rgb);
    }
    return rgb;
}

/** Rec. 709 relative luminance of a linear-light colour. */
function luma(rgb: Rgb): number {
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

function isUnlit(category: PaletteCategory): boolean {
    return UNLIT_PREFIXES.some(prefix => (category as string).startsWith(prefix));
}

function blendColor(
    dayCss: string, nightCss: string, tint: Tint, light: SkyLight, hazeTarget: Rgb,
): string {
    const base = mix(linearOf(dayCss), linearOf(nightCss), light.nightMix);
    let rgb = base;

    const hazeAmount = light.haze * (tint.hazeStrength ?? 0);
    if (hazeAmount > 0) {
        rgb = mix(rgb, hazeTarget, hazeAmount);
    }

    const { warm, cool } = light;
    const warmAmount = warm * tint.warmStrength;
    if (warmAmount > 0) {
        rgb = mix(rgb, linearOf(tint.warm), warmAmount);
    }
    const coolAmount = cool * tint.coolStrength;
    if (coolAmount > 0) {
        rgb = mix(rgb, linearOf(TWILIGHT_COOL_TINT), coolAmount);
    }

    if (tint.preserveLuma && rgb !== base) {
        const tinted = luma(rgb);
        if (tinted > 1e-6) {
            const scale = luma(base) / tinted;
            rgb = [rgb[0] * scale, rgb[1] * scale, rgb[2] * scale];
        }
    }

    return toHex(toSrgb(rgb));
}

/** Everything about where the sun is that the palette cares about. */
export interface SkyLight {
    /** 0 = the noon palette, 1 = the midnight palette. */
    nightMix: number;
    /** 0..1 golden-hour weight (see {@link SunState.twilightFactor}). */
    warm: number;
    /** 0..1 blue-hour weight (see {@link SunState.blueHourFactor}). */
    cool: number;
    /** 0..1 daytime haze (see {@link SunState.hazeFactor}). */
    haze: number;
}

/** Noon, with the sun straight overhead and no tint of any kind. */
export const CLEAR_NOON: SkyLight = { nightMix: 0, warm: 0, cool: 0, haze: 0 };

export function blendPalettes(day: Palette, night: Palette, light: SkyLight): Palette {
    const colors = {} as PaletteColors;
    const night_ = light.nightMix;

    // What the zenith hazes towards: the horizon colour at this same time of
    // day, so the dome's gradient narrows without either end leaving the ramp.
    const hazeTarget = mix(
        linearOf(PaletteColor(day, PaletteCategory.FOG_SKY)),
        linearOf(PaletteColor(night, PaletteCategory.FOG_SKY)),
        night_);

    for (const category of Object.values(PaletteCategory)) {
        const dayEntry = day.colors[category];
        const nightEntry = night.colors[category];
        if (isUnlit(category)) {
            colors[category] = night_ < NIGHT_MODELS_THRESHOLD ? dayEntry : nightEntry;
            continue;
        }

        const tint = TINTS[TIER_BY_CATEGORY.get(category) ?? TintTier.GROUND];

        if (typeof dayEntry === 'string' && typeof nightEntry === 'string') {
            colors[category] = blendColor(dayEntry, nightEntry, tint, light, hazeTarget);
        } else {
            // One of the two authored a dither pair; blend both tones, falling
            // back to the flat colour for whichever side has only one.
            const [dayA, dayB] = typeof dayEntry === 'string' ? [dayEntry, dayEntry] : dayEntry;
            const [nightA, nightB] = typeof nightEntry === 'string' ? [nightEntry, nightEntry] : nightEntry;
            colors[category] = [
                blendColor(dayA, nightA, tint, light, hazeTarget),
                blendColor(dayB, nightB, tint, light, hazeTarget),
            ];
        }
    }

    const values = {} as PaletteValues;
    for (const key of Object.keys(day.values) as (keyof PaletteValues)[]) {
        values[key] = day.values[key] + (night.values[key] - day.values[key]) * night_;
    }

    return {
        colors,
        values,
        time: night_ < NIGHT_MODELS_THRESHOLD ? PaletteTime.DAY : PaletteTime.NIGHT,
    };
}

/**
 * The palette for the sun as {@link setSunTime} last left it. Call after moving
 * the sun; the caller owns pushing the result to the renderer.
 */
export function daytimePalette(day: Palette, night: Palette): Palette {
    return blendPalettes(day, night, {
        nightMix: SUN_STATE.nightMix,
        warm: SUN_STATE.twilightFactor,
        cool: SUN_STATE.blueHourFactor,
        haze: SUN_STATE.hazeFactor,
    });
}
