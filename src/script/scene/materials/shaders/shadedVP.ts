import { H_RES_HALF, V_RES_HALF } from "../../../defs";

export const ShadedVertProgram: string = `
  precision highp float;

  uniform mat3 normalModelMatrix;

  varying float shade;

  void main() {
    vec3 worldNormal = normalize(normalModelMatrix * normal);
    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + (1.0-abs(dot(worldNormal, vec3(0.0, 0.0, 1.0)))) * 0.2;
    shade = shadeUp * shadeRight;

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    pos.x = floor(pos.x / pos.w * ${H_RES_HALF}.0 + 0.5) / ${H_RES_HALF}.0 * pos.w;
    pos.y = floor(pos.y / pos.w * ${V_RES_HALF}.0) / ${V_RES_HALF}.0 * pos.w;
    gl_Position = pos;
  }
`;