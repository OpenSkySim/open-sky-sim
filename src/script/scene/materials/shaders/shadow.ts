/**
 * GLSL for receiving the realtime sun shadow map (see render/shadowMap.ts).
 *
 * The shadow map is an orthographic depth prism aligned with the sun, packed
 * into RGBA8 (three's `packDepthToRGBA`). Everything is expressed in the same
 * camera-relative space the main pass renders in, so the lookup is a plain
 * matrix multiply on the interpolated world position.
 *
 * The shadow itself is drawn exactly like the flat planform silhouettes it
 * replaces: the same 4x4 ordered-dither threshold at the same density, filling
 * with the same SCENERY_TREE_SHADOW palette colour. A cast shadow and the
 * fallback silhouette under a parked aircraft are then the same mark on screen,
 * one just projected properly.
 *
 * Every declaration is explicitly `highp`: the fragment programs that include
 * this default to lowp, which cannot hold metre-scale world coordinates nor
 * unpack a 24-bit depth. All of it is compiled out unless the material declares
 * `RECEIVE_SHADOW`. The including fragment program must emit
 * {@link DITHER_PARS_FRAGMENT} before this, for `bayerThreshold`.
 */

export const SHADOW_PARS_VERTEX: string = `
#ifdef RECEIVE_SHADOW
  varying highp vec3 vShadowWorldPos;
#endif
`;

/** Emit right after the vertex program has computed `worldPos`. */
export const SHADOW_VERTEX: string = `
#ifdef RECEIVE_SHADOW
  vShadowWorldPos = worldPos.xyz;
#endif
`;

export const SHADOW_PARS_FRAGMENT: string = `
#ifdef RECEIVE_SHADOW
  uniform highp sampler2D uShadowMapNear;
  uniform highp sampler2D uShadowMapFar;
  uniform highp mat4 uShadowMatrixNear;
  uniform highp mat4 uShadowMatrixFar;
  // x = intensity (0 disables the whole lookup), y = stipple density.
  uniform highp vec2 uShadowTone;
  // SCENERY_TREE_SHADOW for the current palette — what a stippled pixel fills with.
  uniform highp vec3 uShadowColor;
  // Per cascade: x = depth bias, y = texel size.
  uniform highp vec2 uShadowNear;
  uniform highp vec2 uShadowFar;

  varying highp vec3 vShadowWorldPos;

  // three's UnpackFactors4. Spelled out rather than pulled from <packing>
  // because that chunk declares its helpers at the shader's default precision.
  const highp vec4 SHADOW_UNPACK = vec4(0.99609375, 0.0038909912, 1.5199184e-05, 5.9604645e-08);

  highp float unpackShadowDepth(highp vec4 rgba) {
    return dot(rgba, SHADOW_UNPACK);
  }

  /** True while the PCF taps stay inside the cascade, margin included. */
  bool insideCascade(highp vec3 coord, highp float texel) {
    return coord.x > texel && coord.x < 1.0 - texel
        && coord.y > texel && coord.y < 1.0 - texel
        && coord.z > 0.0 && coord.z < 1.0;
  }

  /** Fraction of the four taps blocked from the sun, 0..1. */
  highp float shadowCoverage(sampler2D map, highp vec3 coord, highp vec2 cascade, highp float biasScale) {
    // 2x2 PCF: four half-texel taps, enough to take the staircase off the
    // silhouette without smearing it at 320x200.
    highp float depth = coord.z - cascade.x * biasScale;
    highp float t = 0.5 * cascade.y;
    highp float lit = step(depth, unpackShadowDepth(texture2D(map, coord.xy + vec2(-t, -t))));
    lit += step(depth, unpackShadowDepth(texture2D(map, coord.xy + vec2(t, -t))));
    lit += step(depth, unpackShadowDepth(texture2D(map, coord.xy + vec2(-t, t))));
    lit += step(depth, unpackShadowDepth(texture2D(map, coord.xy + vec2(t, t))));
    return 1.0 - 0.25 * lit;
  }

  /** 0 = fully lit, uShadowTone.x = fully shadowed. */
  highp float sunShadowAmount(highp float biasScale, vec2 screen) {
    if (uShadowTone.x <= 0.0) {
      return 0.0;
    }
    // Tight cascade first; outside it, the wide one. Both are tubes along the
    // sun ray, so whatever casts a shadow into a cascade is inside it too.
    highp vec4 nearPos = uShadowMatrixNear * vec4(vShadowWorldPos, 1.0);
    highp vec3 coord = nearPos.xyz / nearPos.w;
    highp float coverage;
    if (insideCascade(coord, uShadowNear.y)) {
      coverage = shadowCoverage(uShadowMapNear, coord, uShadowNear, biasScale);
    } else {
      highp vec4 farPos = uShadowMatrixFar * vec4(vShadowWorldPos, 1.0);
      coord = farPos.xyz / farPos.w;
      // Outside both (or beyond the depth range) nothing is known: keep it lit.
      if (!insideCascade(coord, uShadowFar.y)) {
        return 0.0;
      }
      coverage = shadowCoverage(uShadowMapFar, coord, uShadowFar, biasScale);
    }
    // Stipple: the shadow covers uShadowTone.y of the pixels in a 4x4 ordered
    // pattern, so it reads as semi-transparent. PCF coverage thins it towards
    // the silhouette edge instead of blurring it.
    if (coverage * uShadowTone.y + bayerThreshold(screen) < 0.5) {
      return 0.0;
    }
    return uShadowTone.x;
  }
#endif
`;
