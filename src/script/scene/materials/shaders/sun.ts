import * as THREE from 'three';

/**
 * Latitude the sun is modelled at (~29°N, the Canaries). Combined with an
 * equinox declination of 0 this puts sunrise at 06:00 and sunset at 18:00
 * local solar time, and reproduces the old fixed 14:00 sun almost exactly.
 */
const SUN_LATITUDE_RAD: number = 29 * THREE.MathUtils.DEG2RAD;

/** Local solar hour the sim starts at; the sun the shaders were tuned against. */
export const DEFAULT_SUN_HOURS: number = 14;

/** Elevation (degrees) at which the direct sun term is fully off / fully on. */
const DAY_FACTOR_MIN_ELEVATION_DEG = -6; // civil twilight
const DAY_FACTOR_MAX_ELEVATION_DEG = 8;

/**
 * Elevations (degrees) across which the *palette* crosses from the noon set to
 * the midnight one. Deliberately not the ramp the direct light uses: the sun
 * stops lighting the ground at civil twilight, but the sky keeps a usable glow
 * all the way down to the end of astronomical twilight. Sharing the light's
 * ramp used to black the world out around 45 min early, and left the palette
 * already 61% of the way to midnight at the moment of sunset — when the sky is
 * in fact at its brightest and most colourful.
 */
const PALETTE_NIGHT_MIN_ELEVATION_DEG = -18; // astronomical twilight
const PALETTE_NIGHT_MAX_ELEVATION_DEG = 8;

/**
 * Golden hour. The warm band is *not* symmetric about the horizon, which is
 * what a plain |elevation| ramp assumed: the sky over a sun still 13° up is
 * plain blue, while the same 13° under is deep into the blue hour. Above the
 * horizon the warmth is gone by WARM_ABOVE; below it, it holds full strength
 * through WARM_BELOW_FULL — the few degrees where the horizon band burns
 * hardest — before fading out by WARM_BELOW.
 */
const WARM_ABOVE_ELEVATION_DEG = 6;
const WARM_BELOW_FULL_ELEVATION_DEG = -4;
const WARM_BELOW_ELEVATION_DEG = -12;

/**
 * Elevations across which the daytime sky clears. Below HAZE_MAX the air the
 * sun's light crosses is thick enough to wash the zenith towards the horizon
 * colour; above it the dome is at its full authored top-to-bottom contrast.
 *
 * This is the only thing that separates mid-morning from noon. Every other
 * factor here is pinned by then, so without it a ten-hour stretch of the day
 * rendered bit-for-bit identically.
 */
const HAZE_MIN_ELEVATION_DEG = 6;
const HAZE_MAX_ELEVATION_DEG = 50;

/**
 * ...and where it lets go again. Haze is what the sun's light does to the air,
 * so once the sun is far enough under for the golden hour itself to be over,
 * there is nothing left to scatter and the authored night gradient stands on
 * its own. Shares the golden hour's lower edge so the two hand over together.
 */
const HAZE_END_ELEVATION_DEG = -12;

/**
 * Blue hour: the cool cast that takes over the zenith once the sun is under.
 * Absent while the sun is up, peaks a few degrees down, and is gone again by
 * the time the palette has reached midnight anyway.
 */
const BLUE_HOUR_START_ELEVATION_DEG = 2;
const BLUE_HOUR_PEAK_ELEVATION_DEG = -6;
const BLUE_HOUR_END_ELEVATION_DEG = -18;

/**
 * Elevations (degrees) across which cast shadows fade in.
 *
 * This band used to start at 3 and finish at 12, back when shadows came from a
 * depth map that biased along the sun ray and turned to acne once that ray lay
 * near-parallel to the ground. Stencil volumes have no map and no bias, so that
 * reason is gone - and it was costing the golden hour the longest, most
 * dramatic shadows of the day.
 *
 * What genuinely does break at a grazing sun is sweep length: the prism a
 * caster extrudes grows as 1/sin(elevation). That is a *per-caster* problem,
 * not a per-time-of-day one - a hangar roof 10 m up sweeps a manageable prism
 * at 1 degree while an aircraft 3 km up would sweep 170 km - so it is now
 * bounded per caster against ShadowSettings.sweepMax instead. This band only
 * has to cover the last degree, where even a caster on the ground runs away.
 */
const SHADOW_MIN_ELEVATION_DEG = 1;
const SHADOW_MAX_ELEVATION_DEG = 5;

/**
 * sin() of the shadow cutoff: the smallest divisor a sweep is worked out
 * against. Shared with the volume pass so the shader's floor and the elevation
 * the pass switches off at cannot drift apart - a floor above the cutoff would
 * freeze shadows at one length while the sun kept dropping, which is what the
 * old hard-coded 0.2 (11.5 degrees) did through the whole fade band.
 */
export const SHADOW_MIN_SUN_Y = Math.sin(SHADOW_MIN_ELEVATION_DEG * THREE.MathUtils.DEG2RAD);

/**
 * Direction *towards* the sun in world/ENU space (+X east, +Y up, +Z north).
 *
 * Mutated in place by {@link setSunTime}: it is handed to the shaders by
 * reference through {@link SUN_UNIFORMS} and read per frame by the shadow map
 * pass, so the cast shadows always agree with the surface shading.
 */
export const SUN_DIRECTION: THREE.Vector3 = new THREE.Vector3();

/**
 * Chromatic split of the light near the horizon: the direct beam reddens as it
 * crosses more air, while what fills the shadows is blue skylight.
 *
 * Both are normalised to Rec. 709 luminance 1 at load, so these shift hue only.
 * How much light there is stays the job of {@link SUN_SHADE_AMBIENT}'s weights
 * and the palette's own day/night mix - which means this composes with the
 * palette's warm ground tint (that says "the light got warmer") rather than
 * doubling it (this says "the lit side is warmer than the shadowed side").
 * Getting that separation the right way round is the point: pre-dawn and dusk
 * used to tint lit and shadowed faces identically warm, when a real low sun
 * leaves shadows distinctly cooler than the faces it strikes.
 */
const TWILIGHT_DIRECT_TINT = new THREE.Vector3(1.5, 1.0, 0.5);
const TWILIGHT_AMBIENT_TINT = new THREE.Vector3(0.8, 0.94, 1.45);

/**
 * Elevation at which the beam stops being reddened. Its own ramp, not the sky's
 * golden hour: what reddens the light is the air mass along the *sun's* path,
 * which starts to bite well before the sky itself turns, so the beam is already
 * visibly warm at 6 degrees where the sky is still plainly blue. Below the
 * horizon it stays pinned at full - the direct weight is fading out on its own
 * by then, so the tint has nothing left to overstate.
 */
const LIGHT_WARMTH_ELEVATION_DEG = 12;

/** Rec. 709 relative luminance. */
function luminance(v: THREE.Vector3): number {
    return 0.2126 * v.x + 0.7152 * v.y + 0.0722 * v.z;
}

TWILIGHT_DIRECT_TINT.divideScalar(luminance(TWILIGHT_DIRECT_TINT));
TWILIGHT_AMBIENT_TINT.divideScalar(luminance(TWILIGHT_AMBIENT_TINT));

const NEUTRAL_TINT = new THREE.Vector3(1, 1, 1);

/**
 * Ambient floor of the shaded lighting ramp (`shade = AMBIENT + (1 − AMBIENT) · N·L`)
 * with the sun high. A fragment in shadow is pulled back down to exactly this,
 * i.e. it keeps the palette base colour and loses only the direct sun term.
 *
 * As the sun sets the direct weight fades to zero and the ambient floor rises
 * to 1: at night everything is lit flat by the night palette instead of keeping
 * a noon-shaped N·L ramp.
 */
export const SUN_SHADE_AMBIENT = 0.55;

/**
 * Sun state derived from the current time of day. Read (not copied) by the
 * palette builder, the shadow pass and the renderer.
 */
export interface SunState {
    /** Local solar time, 0..24. */
    hours: number;
    /** Sun elevation above the horizon, degrees (negative at night). */
    elevationDeg: number;
    /** 0 below civil twilight, 1 with the sun well up; scales the direct light. */
    dayFactor: number;
    /** 0 = the noon palette, 1 = the midnight one. Lags {@link dayFactor}. */
    nightMix: number;
    /** 0..1 golden hour: peaks at sunset and holds a few degrees under. */
    twilightFactor: number;
    /** 0..1 blue hour: 0 while the sun is up, peaks ~6° under. */
    blueHourFactor: number;
    /** 0..1 daytime haze: 1 with the sun low, 0 with it high. */
    hazeFactor: number;
    /** 0..1 reddening of the direct beam; wider than {@link twilightFactor}. */
    lightWarmth: number;
    /** 0..1 weight for cast shadows; reaches 0 before the sun grazes the horizon. */
    shadowStrength: number;
}

export const SUN_STATE: SunState = {
    hours: DEFAULT_SUN_HOURS,
    elevationDeg: 0,
    dayFactor: 1,
    nightMix: 0,
    twilightFactor: 0,
    blueHourFactor: 0,
    hazeFactor: 0,
    lightWarmth: 0,
    shadowStrength: 1,
};

/**
 * Sun uniforms shared *by reference* with every material the manager builds, so
 * moving the sun is a single in-place write rather than a walk of the material
 * list.
 *
 * `uSunShade` is the scalar (ambient, direct) pair the duotone thresholds are
 * cut against; `uSunAmbient` / `uSunDirect` are the same two weights carrying
 * the light's colour, for the shaded multiply. The scalar is kept rather than
 * derived from the colours so those thresholds stay exactly where they were
 * tuned, whatever the tints do.
 */
export const SUN_UNIFORMS = {
    uSunDir: { value: SUN_DIRECTION },
    uSunShade: { value: new THREE.Vector2(SUN_SHADE_AMBIENT, 1 - SUN_SHADE_AMBIENT) },
    uSunAmbient: { value: new THREE.Vector3(SUN_SHADE_AMBIENT, SUN_SHADE_AMBIENT, SUN_SHADE_AMBIENT) },
    uSunDirect: { value: new THREE.Vector3(1 - SUN_SHADE_AMBIENT, 1 - SUN_SHADE_AMBIENT, 1 - SUN_SHADE_AMBIENT) },
};

/**
 * Writes the direction towards the sun at `hours` local solar time into `out`.
 * Equinox declination, so the day is symmetric around 12:00 and the sun rises
 * due east and sets due west.
 */
export function sunDirectionAt(hours: number, out: THREE.Vector3): THREE.Vector3 {
    const hourAngle = (hours - 12) * 15 * THREE.MathUtils.DEG2RAD;
    const sinElevation = THREE.MathUtils.clamp(Math.cos(SUN_LATITUDE_RAD) * Math.cos(hourAngle), -1, 1);
    const cosElevation = Math.sqrt(Math.max(0, 1 - sinElevation * sinElevation));

    // Azimuth measured clockwise from north; the afternoon half mirrors onto
    // the western side, which acos() cannot tell apart on its own.
    const cosAzimuth = cosElevation > 1e-6
        ? THREE.MathUtils.clamp(-sinElevation * Math.sin(SUN_LATITUDE_RAD) / (cosElevation * Math.cos(SUN_LATITUDE_RAD)), -1, 1)
        : -1;
    let azimuth = Math.acos(cosAzimuth);
    if (hours > 12) {
        azimuth = 2 * Math.PI - azimuth;
    }

    return out.set(
        cosElevation * Math.sin(azimuth),
        sinElevation,
        cosElevation * Math.cos(azimuth));
}

/** Sun elevation in degrees at `hours` local solar time. */
export function sunElevationAt(hours: number): number {
    const hourAngle = (hours - 12) * 15 * THREE.MathUtils.DEG2RAD;
    const sinElevation = THREE.MathUtils.clamp(Math.cos(SUN_LATITUDE_RAD) * Math.cos(hourAngle), -1, 1);
    return Math.asin(sinElevation) * THREE.MathUtils.RAD2DEG;
}

/** Ramps 0 (night) to 1 (sun well up) across civil twilight. */
export function dayFactorFor(elevationDeg: number): number {
    return THREE.MathUtils.smoothstep(elevationDeg, DAY_FACTOR_MIN_ELEVATION_DEG, DAY_FACTOR_MAX_ELEVATION_DEG);
}

/** Weight for cast shadows; see {@link SHADOW_MIN_ELEVATION_DEG}. */
export function shadowStrengthFor(elevationDeg: number): number {
    return THREE.MathUtils.smoothstep(elevationDeg, SHADOW_MIN_ELEVATION_DEG, SHADOW_MAX_ELEVATION_DEG);
}

/** Weight of the midnight palette; see {@link PALETTE_NIGHT_MIN_ELEVATION_DEG}. */
export function nightMixFor(elevationDeg: number): number {
    return 1 - THREE.MathUtils.smoothstep(
        elevationDeg, PALETTE_NIGHT_MIN_ELEVATION_DEG, PALETTE_NIGHT_MAX_ELEVATION_DEG);
}

/** Cubic ease, the shape THREE.MathUtils.smoothstep applies to its own ramp. */
function smooth(t: number): number {
    const c = THREE.MathUtils.clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
}

/** Golden-hour weight; see {@link WARM_ABOVE_ELEVATION_DEG}. */
export function twilightFactorFor(elevationDeg: number): number {
    if (elevationDeg >= 0) {
        return smooth(1 - elevationDeg / WARM_ABOVE_ELEVATION_DEG);
    }
    if (elevationDeg >= WARM_BELOW_FULL_ELEVATION_DEG) {
        return 1;
    }
    return smooth((elevationDeg - WARM_BELOW_ELEVATION_DEG) /
        (WARM_BELOW_FULL_ELEVATION_DEG - WARM_BELOW_ELEVATION_DEG));
}

/** Daytime haze weight; see {@link HAZE_MIN_ELEVATION_DEG}. */
export function hazeFactorFor(elevationDeg: number): number {
    if (elevationDeg >= HAZE_MIN_ELEVATION_DEG) {
        return 1 - THREE.MathUtils.smoothstep(
            elevationDeg, HAZE_MIN_ELEVATION_DEG, HAZE_MAX_ELEVATION_DEG);
    }
    if (elevationDeg >= 0) {
        return 1;
    }
    return smooth((elevationDeg - HAZE_END_ELEVATION_DEG) / -HAZE_END_ELEVATION_DEG);
}

/** Reddening of the direct beam; see {@link LIGHT_WARMTH_ELEVATION_DEG}. */
export function lightWarmthFor(elevationDeg: number): number {
    if (elevationDeg <= 0) {
        return 1;
    }
    return 1 - THREE.MathUtils.smoothstep(elevationDeg, 0, LIGHT_WARMTH_ELEVATION_DEG);
}

/** Blue-hour weight; see {@link BLUE_HOUR_PEAK_ELEVATION_DEG}. */
export function blueHourFactorFor(elevationDeg: number): number {
    if (elevationDeg >= BLUE_HOUR_PEAK_ELEVATION_DEG) {
        return smooth((BLUE_HOUR_START_ELEVATION_DEG - elevationDeg) /
            (BLUE_HOUR_START_ELEVATION_DEG - BLUE_HOUR_PEAK_ELEVATION_DEG));
    }
    return smooth((elevationDeg - BLUE_HOUR_END_ELEVATION_DEG) /
        (BLUE_HOUR_PEAK_ELEVATION_DEG - BLUE_HOUR_END_ELEVATION_DEG));
}

/**
 * Moves the sun to `hours` local solar time. Updates {@link SUN_DIRECTION},
 * {@link SUN_STATE} and the shared shader uniforms in place; the shadow map
 * pass rebuilds its light basis from SUN_DIRECTION on the next frame.
 */
export function setSunTime(hours: number): SunState {
    const wrapped = ((hours % 24) + 24) % 24;
    sunDirectionAt(wrapped, SUN_DIRECTION);

    SUN_STATE.hours = wrapped;
    SUN_STATE.elevationDeg = Math.asin(THREE.MathUtils.clamp(SUN_DIRECTION.y, -1, 1)) * THREE.MathUtils.RAD2DEG;
    SUN_STATE.dayFactor = dayFactorFor(SUN_STATE.elevationDeg);
    SUN_STATE.nightMix = nightMixFor(SUN_STATE.elevationDeg);
    SUN_STATE.twilightFactor = twilightFactorFor(SUN_STATE.elevationDeg);
    SUN_STATE.blueHourFactor = blueHourFactorFor(SUN_STATE.elevationDeg);
    SUN_STATE.hazeFactor = hazeFactorFor(SUN_STATE.elevationDeg);
    SUN_STATE.lightWarmth = lightWarmthFor(SUN_STATE.elevationDeg);
    SUN_STATE.shadowStrength = shadowStrengthFor(SUN_STATE.elevationDeg);

    const direct = (1 - SUN_SHADE_AMBIENT) * SUN_STATE.dayFactor;
    SUN_UNIFORMS.uSunShade.value.set(1 - direct, direct);

    // Same two weights, now carrying the light's colour. The two tints run on
    // different factors because they are different things: the beam reddens
    // with the air mass it crosses, while the cool fill only exists where there
    // is a twilit sky to cast it. Both are neutral with the sun well up and
    // again in the small hours, so noon and midnight look exactly as they did.
    SUN_UNIFORMS.uSunAmbient.value
        .lerpVectors(NEUTRAL_TINT, TWILIGHT_AMBIENT_TINT, SUN_STATE.twilightFactor)
        .multiplyScalar(1 - direct);
    SUN_UNIFORMS.uSunDirect.value
        .lerpVectors(NEUTRAL_TINT, TWILIGHT_DIRECT_TINT, SUN_STATE.lightWarmth)
        .multiplyScalar(direct);

    return SUN_STATE;
}

setSunTime(DEFAULT_SUN_HOURS);

/** Formats a 0..24 hour value as `HH:MM`, for the settings readout. */
export function formatSunTime(hours: number): string {
    const wrapped = ((hours % 24) + 24) % 24;
    const totalMinutes = Math.round(wrapped * 60) % (24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
