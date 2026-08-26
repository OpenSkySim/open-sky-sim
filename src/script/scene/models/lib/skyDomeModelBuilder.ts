import * as THREE from 'three';
import { domeShade } from '../../atmosphere/skyModel';
import { Palette, PaletteCategory, PaletteColor } from '../../../config/palettes/palette';
import { SceneMaterialManager } from "../../materials/materials";
import { DITHER_PARS_FRAGMENT } from '../../materials/shaders/dither';
import { LOG_DEPTH_FRAGMENT, LOG_DEPTH_PARS_FRAGMENT, LOG_DEPTH_PARS_VERTEX, LOG_DEPTH_VERTEX } from '../../materials/shaders/logDepth';
import { Model, ModelLibBuilder } from "../models";

/**
 * The sky, as a vertex-coloured dome.
 *
 * This replaces a flat billboard that carried one palette colour and let
 * distance fog fade it towards a second one at the horizon. That gave a
 * top-to-bottom gradient and nothing else: one colour for the whole ring of the
 * horizon, whichever way you faced. Half of what the scattering model computes
 * is directional - the sky opposite a setting sun stays deep blue while the sky
 * around it burns orange, and the Mie forward lobe piles a washed-out halo onto
 * the solar side - and none of that could reach the screen through a single
 * uniform. A dome can carry it, one vertex at a time.
 *
 * The dome is drawn in the background-sky pass, where the camera sits at the
 * origin and copies only the main camera's rotation, so its radius is arbitrary
 * and it never parallaxes. Colours are baked into a vertex attribute whenever
 * the sun moves rather than evaluated per pixel: the scattering model is CPU
 * code, and a few hundred vertices is the right granularity for a sky that
 * changes only when a setting does.
 */

/** Radius in the background-sky camera's space; well inside its far plane. */
const DOME_RADIUS = 1000;

/**
 * Rings, in degrees of elevation. Bunched hard near the horizon: the entire
 * sunset happens in the bottom fifteen degrees while everything above forty is
 * nearly flat, and evenly-spaced rings would spend most of their vertices where
 * there is nothing to see.
 *
 * The skirt below zero is there because the horizon drops away as you climb -
 * at 10 km it sits over three degrees down - and without it the band between
 * the true horizon and the top of the terrain would show the clear colour.
 */
const RING_ELEVATIONS_DEG = [
    -20, -8, -3, -1, 0, 1, 2.5, 4.5, 7, 10.5, 15, 21, 30, 42, 58, 90,
];

/**
 * Segments around the compass. The azimuthal signal is broad - one bright lobe
 * around the sun, one deep blue arc opposite it - so this is about resolving a
 * smooth gradient rather than any fine detail.
 */
const AZIMUTH_SEGMENTS = 32;

/**
 * How the authored zenith and horizon colours are mixed along a ring, before
 * the atmosphere's directional gain is applied on top. Reproduces the shape the
 * old fogged billboard had, so the sky at noon still reads as it was drawn.
 */
function verticalBlend(elevationDeg: number): number {
    const t = Math.min(1, Math.max(0, elevationDeg / 35));
    return t * t * (3 - 2 * t);
}

/**
 * Dithered quantisation of the vertex-interpolated colour.
 *
 * A smooth per-vertex gradient would read as modern the moment it landed in a
 * flat-shaded, 320x200 scene. The billboard it replaces was banded, not smooth:
 * its fog term was quantised to twelve or twenty-four steps. This does the same
 * to the dome, and dithers across each step with the same ordered matrix the
 * rest of the renderer stipples with, so the bands break up the way a 90s sky
 * did rather than showing as hard contours.
 */
const SKY_BANDS = 24.0;

/**
 * Exponent the directional gain is softened by before it is applied.
 *
 * The gains are ratios against the same direction with the sun high, and they
 * are correct - but they are correct about the *physical* sky, which is far
 * more saturated than any of the authored palettes. Applying a ratio derived
 * from a deeply saturated blue to a gently desaturated one overshoots: at
 * sunset it walked the zenith past neutral into warm grey, when the physical
 * zenith it came from is still plainly blue.
 *
 * Raising the gain to a power under one compresses every shift towards 1 by
 * the same proportion, so the ordering across the dome is untouched and only
 * the amount is reined in. 1 would be the raw ratio; 0 would be no sky change
 * at all.
 */
const GAIN_SOFTNESS = 0.8;

const SKY_VERTEX_PROGRAM = `
  precision highp float;

  attribute vec3 skyColor;
  varying vec3 vSkyColor;
${LOG_DEPTH_PARS_VERTEX}
  void main() {
    vSkyColor = skyColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
${LOG_DEPTH_VERTEX}
  }
`;

const SKY_FRAGMENT_PROGRAM = `
  precision highp float;

  uniform float uBands;
  varying vec3 vSkyColor;
${LOG_DEPTH_PARS_FRAGMENT}
${DITHER_PARS_FRAGMENT}
  void main() {
    // Ordered-dither the quantisation so the bands break up instead of
    // showing as contours. bayerThreshold is the same matrix the shadow and
    // cloud stipples use, so the sky grains like the rest of the frame.
    float threshold = bayerThreshold(gl_FragCoord.xy);
    vec3 banded = floor(vSkyColor * uBands + 0.5 + threshold) / uBands;
    gl_FragColor = vec4(clamp(banded, 0.0, 1.0), 1.0);
${LOG_DEPTH_FRAGMENT}
  }
`;

/** A chromaticity sums to 1, so this is the colourless point. */
const NEUTRAL_CHROMA = 1 / 3;

/**
 * How far past the authored sky's own colourfulness the atmosphere's may go.
 *
 * Two numbers rather than one, because the palettes are not evenly stylised.
 * Their blues are pulled a long way down from the real thing - a noon sky here
 * is a gentle grey-blue where the physics is nearly spectral - so a cool sky
 * has to be reined in hard or a mid-afternoon turns vivid periwinkle. Their
 * warms are not stylised down at all, and a sunset really is that saturated, so
 * reining it to the same degree left the horizon a dull mauve with none of the
 * fire in it.
 */
const SATURATION_HEADROOM_COOL = 2.5;
const SATURATION_HEADROOM_WARM = 6.0;

/** Chromaticity red-minus-blue at which a colour counts as fully warm. */
const FULLY_WARM_CHROMA = 0.3;

/** Rec. 709, for the night floor and the gamut fit. */
const LUMA_WEIGHTS = [0.2126, 0.7152, 0.0722];

/** Direction of each vertex, parallel to the geometry's position buffer. */
export interface SkyDome {
    mesh: THREE.Mesh;
    /** Unit view directions, one per vertex, in world ENU. */
    directions: Float32Array;
}

/**
 * Repaints `dome` for the sun at `sunDir`.
 *
 * Takes the two *authored* palettes rather than the blended one on purpose. The
 * blended palette's sky colours already carry the atmosphere's slot gains - the
 * azimuth-averaged horizon and the zenith - so painting the per-direction gain
 * onto those applies the same physics twice, and the whole dome comes out
 * orange at sunset, zenith included.
 *
 * What the dome wants underneath is the plain authored gradient at the current
 * `nightMix`, with the directional gain supplying every bit of the change.
 */
export function paintSkyDome(
    dome: SkyDome, noon: Palette, midnight: Palette, nightMix: number, sunDir: THREE.Vector3,
): void {
    const zenith = blendAuthored(noon, midnight, PaletteCategory.SKY, nightMix);
    const horizon = blendAuthored(noon, midnight, PaletteCategory.FOG_SKY, nightMix);
    // The authored midnight sky is the floor. Physics says the sky at civil
    // twilight is darker than it - and physics is right - but that palette is
    // an artistic endpoint, not a measurement, and letting the dome duck under
    // it made dusk darker than midnight, so the sky brightened as night fell.
    const nightZenith = blendAuthored(noon, midnight, PaletteCategory.SKY, 1);
    const nightHorizon = blendAuthored(noon, midnight, PaletteCategory.FOG_SKY, 1);

    const sunElevationDeg = Math.asin(Math.max(-1, Math.min(1, sunDir.y))) * THREE.MathUtils.RAD2DEG;
    // Compass bearing of the sun, for the azimuth each vertex is measured from.
    const sunBearing = Math.atan2(sunDir.x, sunDir.z);

    // The brightness ratio is raised to this. GAIN_SOFTNESS reins in
    // the overshoot; the night term takes the exponent to zero as the authored
    // midnight palette takes over, so the two never darken the sky twice.
    // Multiplicative rather than a lerp towards 1 on purpose: a lerp crushes
    // the ratios between directions as it goes, and twilight - which is where
    // the sky is most obviously brighter towards the sun than away from it -
    // came out flat.
    const exponent = GAIN_SOFTNESS * (1 - nightMix);
    const scratch: [number, number, number] = [0, 0, 0];
    const attribute = dome.mesh.geometry.getAttribute('skyColor') as THREE.BufferAttribute;
    const colors = attribute.array as Float32Array;
    const directions = dome.directions;

    for (let i = 0; i < colors.length; i += 3) {
        const x = directions[i];
        const y = directions[i + 1];
        const z = directions[i + 2];

        const elevationDeg = Math.asin(Math.max(-1, Math.min(1, y))) * THREE.MathUtils.RAD2DEG;
        let azimuth = Math.atan2(x, z) - sunBearing;
        // Fold onto 0..180: the sky is mirror-symmetric about the sun's plane.
        azimuth = Math.abs(Math.atan2(Math.sin(azimuth), Math.cos(azimuth))) * THREE.MathUtils.RAD2DEG;

        const blend = verticalBlend(elevationDeg);
        const shade = domeShade(sunElevationDeg, elevationDeg, azimuth);

        // Where the authored gradient sits for this vertex, and how much of the
        // sky's own colour to put over it.
        let baseLuminance = 0;
        let baseTotal = 0;
        let floorLuminance = 0;
        for (let c = 0; c < 3; c++) {
            const base = horizon[c] + (zenith[c] - horizon[c]) * blend;
            scratch[c] = base;
            baseLuminance += LUMA_WEIGHTS[c] * base;
            baseTotal += base;
            floorLuminance += LUMA_WEIGHTS[c]
                * (nightHorizon[c] + (nightZenith[c] - nightHorizon[c]) * blend);
        }

        // Hue: from the authored colour towards the sky's own. Fades back out
        // as the authored night takes over.
        const trust = shade.hueWeight * (1 - nightMix);

        // How colourful the authored sky is, and how colourful the real one is,
        // as distance from neutral. The real sky is far the more saturated of
        // the two at every hour - deep blue where the palette is a gentle
        // grey-blue - so its chroma is reined back towards the palette's own
        // level before it is trusted. Taken neat it turned a mid-afternoon sky
        // vivid periwinkle.
        let authoredSaturation = 0;
        let skySaturation = 0;
        for (let c = 0; c < 3; c++) {
            const authored = baseTotal > 1e-9 ? scratch[c] / baseTotal : NEUTRAL_CHROMA;
            authoredSaturation += Math.abs(authored - NEUTRAL_CHROMA);
            skySaturation += Math.abs(shade.chroma[c] - NEUTRAL_CHROMA);
        }
        const warmth = Math.min(1, Math.max(0,
            (shade.chroma[0] - shade.chroma[2]) / FULLY_WARM_CHROMA));
        const headroom = SATURATION_HEADROOM_COOL
            + (SATURATION_HEADROOM_WARM - SATURATION_HEADROOM_COOL) * warmth;
        const reined = skySaturation > 1e-6
            ? Math.min(1, headroom * authoredSaturation / skySaturation)
            : 1;

        let chromaLuminance = 0;
        for (let c = 0; c < 3; c++) {
            const authored = baseTotal > 1e-9 ? scratch[c] / baseTotal : NEUTRAL_CHROMA;
            const sky = NEUTRAL_CHROMA + (shade.chroma[c] - NEUTRAL_CHROMA) * reined;
            scratch[c] = authored + (sky - authored) * trust;
            chromaLuminance += LUMA_WEIGHTS[c] * scratch[c];
        }

        // Brightness: the authored level, scaled by what the sky has actually
        // lost since the sun was high, and never below the authored night.
        const target = Math.max(
            floorLuminance, baseLuminance * Math.pow(shade.brightness, exponent));
        const scale = chromaLuminance > 1e-9 ? target / chromaLuminance : 0;
        for (let c = 0; c < 3; c++) {
            scratch[c] *= scale;
        }

        fitToGamut(scratch);
        colors[i] = scratch[0];
        colors[i + 1] = scratch[1];
        colors[i + 2] = scratch[2];
    }
    attribute.needsUpdate = true;
}

/**
 * Brings an out-of-gamut colour back inside it, keeping its hue.
 *
 * A saturated sky colour asks for more red than the display has: the horizon
 * towards a sun sitting exactly on it is very nearly monochromatic red, and no
 * amount of green and blue will carry it at the brightness the physics wants.
 * Something has to give, and which one decides whether a sunset reads as deep
 * red or as washed pink.
 *
 * Dimming is the right answer here, because brightness is already decided
 * before this: each vertex is scaled to an explicit target luminance, so the
 * ordering across the dome survives losing some of it. An earlier version
 * desaturated instead, to protect that ordering back when the gain carried hue
 * and brightness together - and it turned every deep sunset colour pale, since
 * the strongest hues are exactly the ones that overflow.
 */
function fitToGamut(c: [number, number, number]): void {
    const peak = Math.max(c[0], c[1], c[2]);
    if (peak <= 1) {
        return;
    }
    const scale = 1 / peak;
    for (let i = 0; i < 3; i++) {
        c[i] *= scale;
    }
}

/** The two authored palettes' colour for `category`, mixed in linear light. */
function blendAuthored(
    noon: Palette, midnight: Palette, category: PaletteCategory, nightMix: number,
): [number, number, number] {
    const day = toLinear(PaletteColor(noon, category));
    const night = toLinear(PaletteColor(midnight, category));
    return [
        day[0] + (night[0] - day[0]) * nightMix,
        day[1] + (night[1] - day[1]) * nightMix,
        day[2] + (night[2] - day[2]) * nightMix,
    ];
}

function toLinear(css: string): [number, number, number] {
    const n = parseInt(css.slice(1), 16);
    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return [channel((n >> 16) & 0xff), channel((n >> 8) & 0xff), channel(n & 0xff)];
}

export class SkyDomeModelLibBuilder implements ModelLibBuilder {

    constructor(public type: string) { }

    build(_materials: SceneMaterialManager): Model {
        const { geometry, directions } = buildDomeGeometry();
        const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
            vertexShader: SKY_VERTEX_PROGRAM,
            fragmentShader: SKY_FRAGMENT_PROGRAM,
            uniforms: { uBands: { value: SKY_BANDS } },
            // The rings are wound so that, seen from the camera at the centre,
            // the triangles face it - so these are front faces, not back ones.
            // BackSide reads like the obvious choice for a dome viewed from
            // inside and is exactly wrong here: it culled all 960 triangles,
            // leaving the flat background clear colour standing in for the sky,
            // which looks identical whichever way you turn. skyDomeModelBuilder
            // .test.ts checks the winding against this, so the two cannot drift.
            side: THREE.FrontSide,
            depthWrite: false,
            // Its colours are vertex data, not palette uniforms, so the
            // material manager has nothing to do here and never sees it.
            userData: {},
        }));
        mesh.name = 'skyDome';
        mesh.frustumCulled = false;
        // Directions only, never the mesh: userData is walked and serialised in
        // places (three's own toJSON among them), and a mesh that reaches
        // itself through its userData is a cycle that throws when it is.
        (mesh.userData as SkyDomeUserData).skyDirections = directions;

        return {
            lod: [{ flats: [mesh], volumes: [] }],
            animations: [],
            maxSize: 2 * DOME_RADIUS,
            center: new THREE.Vector3(),
        };
    }
}

interface SkyDomeUserData {
    skyDirections?: Float32Array;
}

/** Reads the dome back off a built model, for painting. */
export function skyDomeOf(model: Model): SkyDome | undefined {
    const mesh = model.lod[0]?.flats[0] as THREE.Mesh | undefined;
    const directions = mesh && (mesh.userData as SkyDomeUserData).skyDirections;
    return mesh && directions ? { mesh, directions } : undefined;
}

function buildDomeGeometry(): { geometry: THREE.BufferGeometry; directions: Float32Array } {
    const rings = RING_ELEVATIONS_DEG.length;
    const columns = AZIMUTH_SEGMENTS + 1; // duplicated seam, so UV-less wrap is clean
    const count = rings * columns;

    const positions = new Float32Array(count * 3);
    const directions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let r = 0; r < rings; r++) {
        const elevation = RING_ELEVATIONS_DEG[r] * THREE.MathUtils.DEG2RAD;
        const cosElevation = Math.cos(elevation);
        const sinElevation = Math.sin(elevation);
        for (let c = 0; c < columns; c++) {
            const azimuth = 2 * Math.PI * c / AZIMUTH_SEGMENTS;
            const i = (r * columns + c) * 3;
            const x = cosElevation * Math.sin(azimuth);
            const y = sinElevation;
            const z = cosElevation * Math.cos(azimuth);
            directions[i] = x; directions[i + 1] = y; directions[i + 2] = z;
            positions[i] = x * DOME_RADIUS;
            positions[i + 1] = y * DOME_RADIUS;
            positions[i + 2] = z * DOME_RADIUS;
            colors[i] = colors[i + 1] = colors[i + 2] = 0;
        }
    }

    const index: number[] = [];
    for (let r = 0; r < rings - 1; r++) {
        for (let c = 0; c < AZIMUTH_SEGMENTS; c++) {
            const a = r * columns + c;
            const b = a + 1;
            const d = (r + 1) * columns + c;
            const e = d + 1;
            index.push(a, d, b, b, d, e);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('skyColor', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(index);
    geometry.computeBoundingSphere();
    return { geometry, directions };
}
