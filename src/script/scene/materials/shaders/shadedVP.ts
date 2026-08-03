import { LOG_DEPTH_PARS_VERTEX, LOG_DEPTH_VERTEX } from './logDepth';

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
      worldNormal = normal;
    }

    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + (1.0-abs(dot(worldNormal, vec3(0.0, 0.0, 1.0)))) * 0.2;
    shade = shadeUp * shadeRight;

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
