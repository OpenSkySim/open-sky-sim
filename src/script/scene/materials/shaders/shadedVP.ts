import { LOG_DEPTH_PARS_VERTEX, LOG_DEPTH_VERTEX } from './logDepth';

export const ShadedVertProgram: string = `
  precision highp float;

  uniform float halfWidth;
  uniform float halfHeight;
  uniform mat3 normalModelMatrix;
  uniform int shadingType;
  // Direction towards the sun (ENU) and its shading weights, all moved by the
  // time-of-day setting; see shaders/sun.ts. uSunShade is the scalar (ambient,
  // direct) pair; uSunAmbient / uSunDirect are the same two weights in colour.
  uniform vec3 uSunDir;
  uniform vec2 uSunShade;
  uniform vec3 uSunAmbient;
  uniform vec3 uSunDirect;

  varying float shade;
  varying vec3 vLight;
  varying float vWorldY;
${LOG_DEPTH_PARS_VERTEX}
  void main() {
    vec3 worldNormal;

    if (shadingType == 2 || shadingType == 3) {
      worldNormal = normalize(normalModelMatrix * normal);
    } else {
      // STATIC / DUOTONE: attribute is already in world/ENU for unrotated meshes.
      worldNormal = normalize(normal);
    }

    float ndl = max(dot(worldNormal, uSunDir), 0.0);
    // Ambient floor so land keeps the palette base colour in shadow. The direct
    // weight fades to 0 as the sun sets, leaving night lit flat by its palette.
    shade = uSunShade.x + uSunShade.y * ndl;
    // Same ramp in colour: a reddened beam over a blue skylight fill, so a low
    // sun leaves the faces it strikes warmer than the ones it misses. Both
    // tints are luminance-normalised, so this matches shade in brightness.
    vLight = uSunAmbient + uSunDirect * ndl;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldY = worldPos.y;
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    if (shadingType != 3) {
      pos.x = floor(pos.x / pos.w * halfWidth + 0.5) / halfWidth * pos.w;
      pos.y = floor(pos.y / pos.w * halfHeight + 0.5) / halfHeight * pos.w;
    }
    gl_Position = pos;
${LOG_DEPTH_VERTEX}
  }
`;
