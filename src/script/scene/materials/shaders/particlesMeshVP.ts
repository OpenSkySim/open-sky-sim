export const ParticleMeshVertProgram: string = `
precision highp float;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float halfWidth;
uniform float halfHeight;
uniform float minPixels;
uniform int shadingType;

attribute vec3 position;
attribute vec3 offset;
attribute float scale;
attribute float rotation;
attribute vec4 color;

varying vec3 vPosition;
varying vec4 vColor;

void main() {
  vColor = color;
  // Full world position for fog. Zeroing Y made airborne FX (debris at altitude)
  // look ~cameraAltitude metres away under FogQuality.HIGH and vanish into fog.
  vPosition = offset;

  float cosA = cos(rotation);
  float sinA = sin(rotation);
  mat2 rot = mat2(cosA, -sinA, sinA, cosA);

  vec4 viewOffset = viewMatrix * vec4(offset, 1.0);
  float s = scale;
  // Keep distant chips at least minPixels tall so debris stays readable past ~5km
  // without making nearby pieces huge. minPixels==0 disables (ground smoke).
  if (minPixels > 0.0) {
    float z = max(0.001, -viewOffset.z);
    float minS = minPixels * z / (halfHeight * projectionMatrix[1][1]);
    s = max(scale, minS);
  }
  vec3 localPosition = s * vec3(rot * position.xy, position.z);

  vec4 pos = projectionMatrix * (viewOffset + vec4(localPosition, 1.0));
  if (shadingType != 3) {
    pos.x = floor(pos.x / pos.w * halfWidth + 0.5) / halfWidth * pos.w;
    pos.y = floor(pos.y / pos.w * halfHeight + 0.5) / halfHeight * pos.w;
  }
  gl_Position = pos;
}
`;
