import * as THREE from 'three';
import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import {
    blueHourFactorFor, DEFAULT_SUN_HOURS, formatSunTime, hazeFactorFor, lightWarmthFor,
    nightMixFor, setSunTime, SHADOW_MIN_SUN_Y, sunDirectionAt, sunElevationAt,
    SUN_DIRECTION, SUN_SHADE_AMBIENT, SUN_STATE, SUN_UNIFORMS, twilightFactorFor,
} from './sun';

/** Rec. 709 relative luminance. */
function luminance(v: THREE.Vector3): number {
    return 0.2126 * v.x + 0.7152 * v.y + 0.0722 * v.z;
}

/** The fixed sun this module replaced; the 14:00 solar position must still match it. */
const LEGACY_SUN = new THREE.Vector3(-0.47, 0.76, -0.45).normalize();

// The sun is module-global state; leave it where the rest of the app expects it.
afterEach(() => setSunTime(DEFAULT_SUN_HOURS));

describe('sun position', () => {

    it('reproduces the fixed 14:00 sun the shading was tuned against', () => {
        const dir = sunDirectionAt(14, new THREE.Vector3());
        assert.ok(dir.dot(LEGACY_SUN) > 0.999, `dot ${dir.dot(LEGACY_SUN)}`);
    });

    it('rises due east and sets due west at the equinox', () => {
        const sunrise = sunDirectionAt(6, new THREE.Vector3());
        assert.ok(Math.abs(sunrise.x - 1) < 1e-6, `sunrise east ${sunrise.x}`);
        assert.ok(Math.abs(sunrise.y) < 1e-6, `sunrise on horizon ${sunrise.y}`);

        const sunset = sunDirectionAt(18, new THREE.Vector3());
        assert.ok(Math.abs(sunset.x + 1) < 1e-6, `sunset west ${sunset.x}`);
        assert.ok(Math.abs(sunset.y) < 1e-6, `sunset on horizon ${sunset.y}`);
    });

    it('keeps the sun south of the zenith through the day and below the horizon at night', () => {
        for (let hours = 6.5; hours <= 17.5; hours += 0.5) {
            const dir = sunDirectionAt(hours, new THREE.Vector3());
            assert.ok(dir.y > 0, `${hours}h elevation ${dir.y}`);
            assert.ok(dir.z < 0, `${hours}h should look south, z ${dir.z}`);
        }
        for (const hours of [0, 2, 4, 20, 22]) {
            assert.ok(sunElevationAt(hours) < 0, `${hours}h elevation ${sunElevationAt(hours)}`);
        }
    });

    it('is a unit vector at every time of day', () => {
        for (let hours = 0; hours < 24; hours += 0.25) {
            const dir = sunDirectionAt(hours, new THREE.Vector3());
            assert.ok(Math.abs(dir.length() - 1) < 1e-9, `${hours}h length ${dir.length()}`);
        }
    });
});

describe('setSunTime', () => {

    it('fades the direct shading term out across dusk and back in at dawn', () => {
        setSunTime(12);
        assert.strictEqual(SUN_STATE.dayFactor, 1);
        assert.ok(Math.abs(SUN_UNIFORMS.uSunShade.value.x - SUN_SHADE_AMBIENT) < 1e-6);
        assert.ok(Math.abs(SUN_UNIFORMS.uSunShade.value.y - (1 - SUN_SHADE_AMBIENT)) < 1e-6);

        setSunTime(0);
        assert.strictEqual(SUN_STATE.dayFactor, 0);
        // Night is lit flat: all ambient, no directional term to shape or shadow.
        assert.strictEqual(SUN_UNIFORMS.uSunShade.value.x, 1);
        assert.strictEqual(SUN_UNIFORMS.uSunShade.value.y, 0);
    });

    it('peaks the twilight tint with the sun on the horizon', () => {
        setSunTime(6);
        const atSunrise = SUN_STATE.twilightFactor;
        setSunTime(12);
        const atNoon = SUN_STATE.twilightFactor;
        assert.ok(atSunrise > 0.9, `sunrise ${atSunrise}`);
        assert.strictEqual(atNoon, 0);
    });

    it('runs the palette past the light: still lit at sunset, dark by astronomical twilight', () => {
        setSunTime(18);
        assert.ok(SUN_STATE.nightMix < 0.3, `sunset nightMix ${SUN_STATE.nightMix}`);
        // Civil twilight kills the direct light but not the sky.
        setSunTime(18.5);
        assert.strictEqual(SUN_STATE.dayFactor, 0);
        assert.ok(SUN_STATE.nightMix < 0.7, `civil nightMix ${SUN_STATE.nightMix}`);
        setSunTime(19.5);
        assert.strictEqual(SUN_STATE.nightMix, 1);
    });

    it('splits the light warm-on-direct, cool-on-ambient near the horizon', () => {
        // A low sun leaves the faces it strikes warmer than the ones it misses.
        // The palette's ground tint cannot say that on its own - it moves the
        // base colour, so it warmed lit and shadowed faces identically.
        setSunTime(18);
        const { uSunDirect, uSunAmbient } = SUN_UNIFORMS;
        assert.ok(uSunDirect.value.x / uSunDirect.value.z > 1.4,
            `direct should be red-dominant: ${uSunDirect.value.toArray()}`);
        assert.ok(uSunAmbient.value.z / uSunAmbient.value.x > 1.2,
            `ambient should be blue-dominant: ${uSunAmbient.value.toArray()}`);
    });

    it('spends no brightness on the tint, only hue', () => {
        // The tints are luminance-normalised, so the coloured light has to add
        // up to exactly the scalar ramp the duotone thresholds are cut against.
        for (const hours of [6, 9, 12, 17.5, 18, 21]) {
            setSunTime(hours);
            const { uSunShade, uSunAmbient, uSunDirect } = SUN_UNIFORMS;
            assert.ok(Math.abs(luminance(uSunAmbient.value) - uSunShade.value.x) < 1e-6,
                `${hours}h ambient ${luminance(uSunAmbient.value)} vs ${uSunShade.value.x}`);
            assert.ok(Math.abs(luminance(uSunDirect.value) - uSunShade.value.y) < 1e-6,
                `${hours}h direct ${luminance(uSunDirect.value)} vs ${uSunShade.value.y}`);
        }
    });

    it('leaves a high sun and every night colourless', () => {
        // Neutral tints mean the noon look and the flat night look are byte-for
        // byte what they were before the light carried colour at all.
        for (const hours of [12, 0]) {
            setSunTime(hours);
            const { uSunAmbient, uSunDirect } = SUN_UNIFORMS;
            for (const v of [uSunAmbient.value, uSunDirect.value]) {
                assert.ok(Math.abs(v.x - v.y) < 1e-9 && Math.abs(v.y - v.z) < 1e-9,
                    `${hours}h ${v.toArray()}`);
            }
        }
    });

    it('holds cast shadows through the golden hour and drops them at the horizon', () => {
        setSunTime(12);
        assert.strictEqual(SUN_STATE.shadowStrength, 1);

        // The longest, most dramatic shadows of the day are the low-sun ones,
        // and they used to be gone by 17:20. What actually breaks at a grazing
        // sun is per-caster sweep length, bounded in the volume pass, so this
        // ramp only has to cover the last degree.
        setSunTime(17.5);
        assert.ok(SUN_STATE.elevationDeg < 7, `still low: ${SUN_STATE.elevationDeg}`);
        assert.strictEqual(SUN_STATE.shadowStrength, 1);

        // Right on the horizon there is no caster low enough to sweep sanely.
        setSunTime(18);
        assert.ok(SUN_STATE.dayFactor > 0, `dayFactor ${SUN_STATE.dayFactor}`);
        assert.strictEqual(SUN_STATE.shadowStrength, 0);

        setSunTime(17);
        assert.ok(SUN_STATE.shadowStrength > 0.9, `17h ${SUN_STATE.shadowStrength}`);
        setSunTime(0);
        assert.strictEqual(SUN_STATE.shadowStrength, 0);
    });

    it('never sweeps against a sun lower than the one it still draws', () => {
        // The shader floors its 1/sin(elevation) divisor at SHADOW_MIN_SUN_Y.
        // If that floor sat above the cutoff, shadows would freeze at one
        // length while the sun kept dropping - which is what a hard-coded 0.2
        // (11.5 degrees) did across the whole of the old fade band.
        let lowest = Infinity;
        for (let hours = 0; hours < 24; hours += 1 / 60) {
            setSunTime(hours);
            if (SUN_STATE.shadowStrength > 0) {
                lowest = Math.min(lowest, Math.sin(SUN_STATE.elevationDeg * THREE.MathUtils.DEG2RAD));
            }
        }
        assert.ok(lowest >= SHADOW_MIN_SUN_Y - 1e-9, `drew at sunY ${lowest}, floor ${SHADOW_MIN_SUN_Y}`);
    });

    it('updates the shared uniform vector in place so live materials follow', () => {
        const shared = SUN_UNIFORMS.uSunDir.value;
        assert.strictEqual(shared, SUN_DIRECTION);
        setSunTime(9);
        assert.ok(shared.dot(sunDirectionAt(9, new THREE.Vector3())) > 0.999);
    });

    it('wraps hours outside 0..24', () => {
        setSunTime(26);
        const wrapped = SUN_DIRECTION.clone();
        setSunTime(2);
        assert.ok(wrapped.dot(SUN_DIRECTION) > 0.999);
    });
});

describe('time-of-day ramps', () => {

    it('crosses the palette to midnight between astronomical twilight and a low sun', () => {
        assert.strictEqual(nightMixFor(20), 0);
        assert.strictEqual(nightMixFor(8), 0);
        assert.strictEqual(nightMixFor(-18), 1);
        assert.strictEqual(nightMixFor(-30), 1);

        // Monotonic, and only about a fifth of the way down at sunset itself.
        assert.ok(nightMixFor(0) > 0.15 && nightMixFor(0) < 0.3, `${nightMixFor(0)}`);
        for (let e = 12; e > -22; e -= 0.5) {
            assert.ok(nightMixFor(e - 0.5) >= nightMixFor(e), `not monotonic at ${e}`);
        }
    });

    it('does not mirror the golden hour above and below the horizon', () => {
        // A sun 13 degrees up is plain daylight; 13 degrees down is the tail of
        // the blue hour. The old |elevation| ramp gave both the same warm cast.
        assert.strictEqual(twilightFactorFor(13), 0);
        assert.strictEqual(twilightFactorFor(-13), 0);
        assert.strictEqual(twilightFactorFor(0), 1);

        // Warm above the horizon only while the sun is genuinely low...
        assert.strictEqual(twilightFactorFor(6), 0);
        assert.ok(twilightFactorFor(3) > 0.4 && twilightFactorFor(3) < 0.6, `${twilightFactorFor(3)}`);

        // ...and holding at full strength for the few degrees just under it.
        assert.strictEqual(twilightFactorFor(-4), 1);
        assert.ok(twilightFactorFor(-8) > 0, `${twilightFactorFor(-8)}`);
        assert.strictEqual(twilightFactorFor(-12), 0);
    });

    it('clears the daytime haze as the sun climbs, and drops it at night', () => {
        // The only factor that moves between mid-morning and noon.
        assert.strictEqual(hazeFactorFor(50), 0);
        assert.strictEqual(hazeFactorFor(61), 0);
        assert.strictEqual(hazeFactorFor(6), 1);
        assert.strictEqual(hazeFactorFor(0), 1);

        assert.ok(hazeFactorFor(38) > 0 && hazeFactorFor(38) < 0.3, `${hazeFactorFor(38)}`);
        assert.ok(hazeFactorFor(13) > hazeFactorFor(38), 'lower sun, hazier');

        // Nothing is lighting the air once the golden hour is over.
        assert.strictEqual(hazeFactorFor(-12), 0);
        assert.strictEqual(hazeFactorFor(-38), 0);
        assert.ok(hazeFactorFor(-6) > 0, `${hazeFactorFor(-6)}`);
    });

    it('reddens the beam earlier than it turns the sky', () => {
        // Air mass along the sun's own path, not the sky's golden hour: the
        // beam is already warm where the sky overhead is still plainly blue.
        assert.strictEqual(lightWarmthFor(12), 0);
        assert.strictEqual(lightWarmthFor(40), 0);
        assert.strictEqual(lightWarmthFor(0), 1);
        assert.strictEqual(lightWarmthFor(-10), 1);

        const low = 6;
        assert.ok(lightWarmthFor(low) > 0.3, `at ${low} deg: ${lightWarmthFor(low)}`);
        assert.strictEqual(twilightFactorFor(low), 0, 'the sky has not turned yet');
    });

    it('keeps the blue hour under the horizon', () => {
        assert.strictEqual(blueHourFactorFor(2), 0);
        assert.strictEqual(blueHourFactorFor(30), 0);
        assert.strictEqual(blueHourFactorFor(-6), 1);
        assert.strictEqual(blueHourFactorFor(-18), 0);
        assert.strictEqual(blueHourFactorFor(-40), 0);
        assert.ok(blueHourFactorFor(0) < 0.25, `at sunset ${blueHourFactorFor(0)}`);
    });
});

describe('formatSunTime', () => {

    it('renders the slider value as HH:MM', () => {
        assert.strictEqual(formatSunTime(0), '00:00');
        assert.strictEqual(formatSunTime(6.5), '06:30');
        assert.strictEqual(formatSunTime(14), '14:00');
        assert.strictEqual(formatSunTime(23.75), '23:45');
        assert.strictEqual(formatSunTime(24), '00:00');
    });
});
