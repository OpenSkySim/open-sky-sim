import { DITHER_PARS_FRAGMENT } from './dither';
import { LOG_DEPTH_FRAGMENT, LOG_DEPTH_PARS_FRAGMENT } from './logDepth';

export const DepthFragProgram: string = `
  precision lowp float;

  uniform vec3 vCameraPos;
  uniform vec3 vCameraNormal;
  uniform float vCameraD;
  uniform int shadingType;
  uniform vec3 color;
  uniform vec3 colorSecondary;
  uniform int fogType;
  uniform float fogDensity;
  uniform vec3 fogColor;
  uniform float alphaDither;
  uniform float colorDither;
  uniform float overbright;
  uniform float uWaveAnim;
  uniform float uTime;

  varying vec3 vPosition;
${LOG_DEPTH_PARS_FRAGMENT}
${DITHER_PARS_FRAGMENT}
  void main() {
    vec2 screen = gl_FragCoord.xy;

    if (alphaDither > 0.001) {
      float alpha = alphaDither + bayerThreshold(screen);
      if (alpha < 0.5) {
        discard;
      }
    }

    float distance = 0.0;
    float fogSteps = 12.0;

    if (fogType == 1) {
      distance = dot(vPosition, vCameraNormal) + vCameraD;
    } else if (fogType == 2) {
      vec3 dV = vPosition - vCameraPos;
      distance = sqrt(dot(dV, dV));
      fogSteps = 24.0;
    }

    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    if (shadingType != 3) {
      fogFactor = floor(fogFactor * fogSteps + 0.5) / fogSteps;
    }

    vec3 diffuse;
    if (uWaveAnim > 0.5) {
      // Three low-frequency sine trains at different speeds/directions, so the
      // crest pattern never repeats on a visible cycle. Thresholded against the
      // ordered dither (not a smooth mix) so the swell reads as more of the
      // same pixel-art stipple the rest of the palette uses, not a gradient.
      //
      // The crest tone is derived from color itself rather than taken from
      // colorSecondary: several palettes give water a single flat entry with
      // no distinct shade (colorSecondary equals color there), which made the
      // dither pick between two identical colours and rendered as no motion
      // at all.
      float wave = sin(vPosition.x * 0.006 + uTime * 0.9)
                 + sin(vPosition.z * 0.008 - uTime * 0.6) * 0.8
                 + sin((vPosition.x + vPosition.z) * 0.0035 + uTime * 0.35) * 0.6;
      vec3 crest = min(color * 1.35 + 0.03, vec3(1.0));
      diffuse = wave + bayerThreshold(screen) * 0.9 > 0.0 ? crest : color;
    } else if (colorDither > 0.5 || (shadingType == 0 && colorDither > -0.5)) {
      // colorDither: 1 = force two-tone stipple, 0 = duotone-only, -1 = solid primary.
      bool dithering = mod(floor(screen.x + screen.y), 2.0) > 0.5;
      diffuse = dithering ? color : colorSecondary;
    } else {
      diffuse = color;
    }

    // Light sources first: a palette entry stops at white, which is nowhere
    // near enough for the sun, so it is scaled up and left to clip the way a
    // light does rather than sitting wherever the palette left it.
    diffuse *= overbright;
    gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
${LOG_DEPTH_FRAGMENT}
  }
`;
