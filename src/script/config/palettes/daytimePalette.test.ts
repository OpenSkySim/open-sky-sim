import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { DEFAULT_SUN_HOURS, setSunTime } from '../../scene/materials/shaders/sun';
import { blendPalettes, daytimePalette } from './daytimePalette';
import { HDMidnightPalette } from './hd-midnight';
import { HDNoonPalette } from './hd-noon';
import { PaletteCategory, PaletteColor, PaletteTime } from './palette';
import { VGAMidnightPalette } from './vga-midnight';
import { VGANoonPalette } from './vga-noon';

afterEach(() => setSunTime(DEFAULT_SUN_HOURS));

describe('blendPalettes', () => {

    it('reproduces the authored palettes at both endpoints', () => {
        const noon = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0, warm: 0, cool: 0, haze: 0 });
        const midnight = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 1, warm: 0, cool: 0, haze: 0 });

        for (const category of Object.values(PaletteCategory)) {
            assert.deepStrictEqual(
                lower(noon.colors[category]), lower(HDNoonPalette.colors[category]), category);
            assert.deepStrictEqual(
                lower(midnight.colors[category]), lower(HDMidnightPalette.colors[category]), category);
        }
        assert.deepStrictEqual(noon.values, HDNoonPalette.values);
        assert.deepStrictEqual(midnight.values, HDMidnightPalette.values);
    });

    it('lands the halfway sky between the two authored skies, in linear light', () => {
        const half = PaletteColor(blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 0, cool: 0, haze: 0 }), PaletteCategory.SKY);
        // #7aa3c4 / #182028 mixed as light, not as gamma-encoded bytes. Brighter
        // than the componentwise sRGB midpoint (#496276) would be, which is the
        // point: half the light left is not half the encoded value.
        assert.strictEqual(half, '#5a7992');
    });

    it('switches HUD colours instead of interpolating them', () => {
        // The canvas painter pre-renders glyphs per colour, so HUD text has to
        // stay one of the literal palette entries at every time of day.
        const day = PaletteColor(VGANoonPalette, PaletteCategory.HUD_TEXT);
        const night = PaletteColor(VGAMidnightPalette, PaletteCategory.HUD_TEXT);
        assert.notStrictEqual(day, night);

        for (const mix of [0, 0.25, 0.49, 0.5, 0.75, 1]) {
            const blended = PaletteColor(
                blendPalettes(VGANoonPalette, VGAMidnightPalette, { nightMix: mix, warm: 1, cool: 0, haze: 0 }), PaletteCategory.HUD_TEXT);
            assert.ok(blended === day || blended === night, `mix ${mix} gave ${blended}`);
        }
    });

    it('burns the horizon at golden hour and barely touches the zenith', () => {
        // The sun sets into the horizon band, not into the whole dome: warming
        // every sky category alike used to flatten the sky's vertical gradient
        // just as a real one becomes most pronounced.
        const plain = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 0, cool: 0, haze: 0 });
        const golden = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 1, cool: 0, haze: 0 });

        const shift = (category: PaletteCategory) =>
            redShift(PaletteColor(plain, category), PaletteColor(golden, category));

        const horizon = shift(PaletteCategory.FOG_SKY);
        const zenith = shift(PaletteCategory.SKY);
        const ground = shift(PaletteCategory.TERRAIN_GRASS);

        assert.ok(horizon > 0 && zenith > 0 && ground > 0, `${horizon} ${zenith} ${ground}`);
        assert.ok(horizon > 2 * ground, `horizon ${horizon} vs ground ${ground}`);
        assert.ok(ground > zenith, `ground ${ground} vs zenith ${zenith}`);
    });

    it('sinks the zenith into blue while the horizon keeps its warmth', () => {
        const golden = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 1, cool: 0, haze: 0 });
        const dusk = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 1, cool: 1, haze: 0 });

        // The blue hour cools and darkens overhead...
        assert.ok(luma(PaletteColor(dusk, PaletteCategory.SKY)) < luma(PaletteColor(golden, PaletteCategory.SKY)));
        assert.ok(redShift(PaletteColor(golden, PaletteCategory.SKY), PaletteColor(dusk, PaletteCategory.SKY)) < 0);

        // ...but the band the sun just left stays the warmer of the two.
        assert.ok(
            redShift(PaletteColor(dusk, PaletteCategory.SKY), PaletteColor(dusk, PaletteCategory.FOG_SKY)) > 0,
            'horizon should stay warmer than the zenith through the blue hour');
    });

    it('warms lit surfaces without brightening them', () => {
        // How much light is left is nightMix's job; the tint only says what
        // colour it is. Without this the ground read *brighter* at sunset than
        // at noon, because its dark base was being pulled towards a bright orange.
        const plain = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 0, cool: 0, haze: 0 });
        const golden = blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.5, warm: 1, cool: 0, haze: 0 });

        for (const category of [PaletteCategory.TERRAIN_GRASS, PaletteCategory.TERRAIN_SAND, PaletteCategory.VEHICLE_PLANE_GREY]) {
            const ratio = luma(PaletteColor(golden, category)) / luma(PaletteColor(plain, category));
            assert.ok(Math.abs(ratio - 1) < 0.05, `${category} luminance ratio ${ratio}`);
        }
    });

    it('flips to the night model set once the night mix passes halfway', () => {
        assert.strictEqual(blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.4, warm: 0, cool: 0, haze: 0 }).time, PaletteTime.DAY);
        assert.strictEqual(blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0.6, warm: 0, cool: 0, haze: 0 }).time, PaletteTime.NIGHT);
    });
});

describe('daytimePalette', () => {

    it('follows the sun: bright at noon, the night palette in the small hours', () => {
        setSunTime(12);
        assert.strictEqual(
            PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.SKY),
            PaletteColor(HDNoonPalette, PaletteCategory.SKY).toLowerCase());

        setSunTime(0);
        assert.strictEqual(
            PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.SKY),
            PaletteColor(HDMidnightPalette, PaletteCategory.SKY).toLowerCase());
    });

    it('is warmer at sunset than an hour before it', () => {
        setSunTime(17);
        const before = redShift('#000000', horizonAt(17));
        const atSunset = redShift('#000000', horizonAt(18));
        assert.ok(atSunset > before, `sunset ${atSunset} vs ${before}`);
    });

    it('still has a lit sky at sunset instead of a half-black one', () => {
        // Sunset is the brightest, most colourful moment of the cycle, so the
        // palette must not already be most of the way to midnight by then.
        setSunTime(18);
        const horizon = luma(horizonAt(18));
        const noon = luma(horizonAt(12));
        const midnight = luma(horizonAt(0));
        assert.ok(horizon > noon * 0.35, `sunset horizon ${horizon} vs noon ${noon}`);
        assert.ok(horizon > midnight * 8, `sunset horizon ${horizon} vs midnight ${midnight}`);
    });

    it('keeps darkening through nautical twilight, well past sunset', () => {
        // The old ramp reached the midnight palette at 18:27 because it shared
        // the direct light's cutoff at 6 degrees below the horizon.
        const dusk = [18, 18.5, 19, 19.5].map(h => luma(horizonAt(h)));
        for (let i = 1; i < dusk.length; i++) {
            assert.ok(dusk[i] < dusk[i - 1], `${dusk[i]} should be darker than ${dusk[i - 1]}`);
        }
        assert.ok(dusk[1] > luma(horizonAt(0)) * 3, 'civil twilight should still be lit');
    });

    it('lights the night models around civil twilight, not before sunset', () => {
        setSunTime(17.9);
        assert.strictEqual(daytimePalette(HDNoonPalette, HDMidnightPalette).time, PaletteTime.DAY);
        setSunTime(18.6);
        assert.strictEqual(daytimePalette(HDNoonPalette, HDMidnightPalette).time, PaletteTime.NIGHT);
    });

    it('hazes the zenith down towards the horizon as the sun drops', () => {
        // The one thing that told mid-morning from noon used to be nothing at
        // all: from 07:30 to 16:30 every factor was pinned and the sky rendered
        // bit-for-bit identically. The dome's vertical contrast now narrows as
        // the sun comes down, which is what a thickening air path does to it.
        const contrast = (hours: number) => {
            setSunTime(hours);
            const palette = daytimePalette(HDNoonPalette, HDMidnightPalette);
            return luma(PaletteColor(palette, PaletteCategory.FOG_SKY))
                - luma(PaletteColor(palette, PaletteCategory.SKY));
        };

        const afternoon = [12, 15, 16, 17].map(contrast);
        for (let i = 1; i < afternoon.length; i++) {
            assert.ok(afternoon[i] < afternoon[i - 1], `${afternoon}`);
        }
        // Still a gradient, not a flat wash.
        assert.ok(afternoon[afternoon.length - 1] > 0, `${afternoon}`);
    });

    it('keeps the hazed sky blue rather than warming it', () => {
        // Haze is an air-path effect, not the golden hour: it must not smuggle
        // in warmth an hour before the twilight ramp is meant to start.
        setSunTime(12);
        const noon = PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.SKY);
        setSunTime(16);
        const afternoon = PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.SKY);

        assert.notStrictEqual(afternoon, noon);

        // It does drift a little warm, but only because the pale horizon colour
        // it moves towards is less blue-dominant than the zenith - the sky is
        // paling, not reddening. Against the golden hour's own pull on the same
        // category it has to stay small.
        const golden = PaletteColor(
            blendPalettes(HDNoonPalette, HDMidnightPalette, { nightMix: 0, warm: 1, cool: 0, haze: 0 }),
            PaletteCategory.SKY);
        const byHaze = redShift(noon, afternoon);
        const byGoldenHour = redShift(noon, golden);
        assert.ok(byHaze < byGoldenHour / 3, `haze ${byHaze} vs golden hour ${byGoldenHour}`);

        // Bluer than it is red, at both ends of the afternoon.
        for (const css of [noon, afternoon]) {
            const [r, , b] = channels(css);
            assert.ok(b > r, `${css} should still read as sky blue`);
        }
    });

    it('leaves the authored gradient alone once the sun is properly down', () => {
        // Nothing is lighting the air at night, so the night palette's own
        // zenith-to-horizon gradient has to survive untouched.
        setSunTime(0);
        const palette = daytimePalette(HDNoonPalette, HDMidnightPalette);
        assert.strictEqual(
            PaletteColor(palette, PaletteCategory.SKY),
            PaletteColor(HDMidnightPalette, PaletteCategory.SKY).toLowerCase());
    });
});

function horizonAt(hours: number): string {
    setSunTime(hours);
    return PaletteColor(daytimePalette(HDNoonPalette, HDMidnightPalette), PaletteCategory.FOG_SKY);
}

function lower(entry: string | [string, string]): string | [string, string] {
    return typeof entry === 'string' ? entry.toLowerCase() : [entry[0].toLowerCase(), entry[1].toLowerCase()];
}

/** How much redder `b` is than `a`, as red minus blue. */
function redShift(a: string, b: string): number {
    const [ar, , ab] = channels(a);
    const [br, , bb] = channels(b);
    return (br - bb) - (ar - ab);
}

/** Rec. 709 relative luminance, in linear light. */
function luma(css: string): number {
    const [r, g, b] = channels(css).map(v => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function channels(css: string): [number, number, number] {
    const n = parseInt(css.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
