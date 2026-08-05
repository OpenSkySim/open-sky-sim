import { LOG_DEPTH_PARS_VERTEX, LOG_DEPTH_VERTEX } from './logDepth';

/**
 * Directional sun in world/ENU space (+X east, +Y up, +Z north).
 * Fixed 14:00 local solar time at ~29°N (Canaries): ~49° elevation, SW azimuth.
 */
const SUN_DIR = 'normalize(vec3(-0.47, 0.76, -0.45))';

export const ShadedVertProgram: string = `
  precision highp float;

  uniform float halfWidth;
  uniform float halfHeight;
  uniform mat3 normalModelMatrix;
  uniform int shadingType;

  varying float shade;
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

    float ndl = max(dot(worldNormal, ${SUN_DIR}), 0.0);
    // Ambient floor so land keeps the palette base colour in shadow.
    shade = 0.55 + 0.45 * ndl;

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
