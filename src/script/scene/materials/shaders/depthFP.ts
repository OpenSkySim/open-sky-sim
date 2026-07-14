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

  varying vec3 vPosition;

  void main() {
    vec2 screen = gl_FragCoord.xy;

    if (alphaDither > 0.001) {
      mat4 bayesian = mat4(
        0.0, 12.0,  3.0, 15.0,
        8.0,  4.0, 11.0,  7.0,
        2.0, 14.0,  1.0, 13.0,
       10.0,  6.0,  9.0,  5.0
      ) * (1.0 / 16.0) - 0.5;

      int modX = int(mod(screen.x, 4.0));
      int modY = int(mod(screen.y, 4.0));
      for (int x = 0; x < 4; x++) {
        for (int y = 0; y < 4; y++) {
          if (x == modX && y == modY) {
            float alpha = alphaDither + bayesian[x][y];
            if (alpha < 0.5) {
              discard;
            }
          }
        }
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
    // colorDither: 1 = force two-tone stipple, 0 = duotone-only, -1 = solid primary.
    if (colorDither > 0.5 || (shadingType == 0 && colorDither > -0.5)) {
      bool dithering = mod(floor(screen.x + screen.y), 2.0) > 0.5;
      diffuse = dithering ? color : colorSecondary;
    } else {
      diffuse = color;
    }

    gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
  }
`;