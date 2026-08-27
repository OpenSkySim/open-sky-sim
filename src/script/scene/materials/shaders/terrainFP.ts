import { LOG_DEPTH_FRAGMENT, LOG_DEPTH_PARS_FRAGMENT } from './logDepth';

/**
 * Terrain land fragments.
 *
 * ConstantFragProgram with one substitution: the base colour is the varying
 * the terrain vertex program resolved per facet, not a material-wide uniform.
 * Fog is identical, deliberately — terrain has to recede into exactly the same
 * haze as everything standing on it.
 *
 * The duotone branch that program carries is gone: it exists for authored
 * two-tone surfaces, and every terrain mode is a single colour under coloured
 * light.
 */
export const TerrainFragProgram: string = `
  precision highp float;

  uniform float distance;
  uniform int shadingType;
  uniform int fogType;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying vec3 vLight;
  varying vec3 vBase;
${LOG_DEPTH_PARS_FRAGMENT}
  void main() {
    float fogSteps = 12.0;
    if (fogType == 2) {
      fogSteps = 24.0;
    }

    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    if (shadingType != 3) {
      fogFactor = floor(fogFactor * fogSteps + 0.5) / fogSteps;
    }

    vec3 diffuse = vBase * vLight;
    gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
${LOG_DEPTH_FRAGMENT}
  }
`;
