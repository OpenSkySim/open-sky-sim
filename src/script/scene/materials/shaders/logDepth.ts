/** GLSL snippets for Three.js logarithmic depth (custom ShaderMaterials). */

export const LOG_DEPTH_PARS_VERTEX = `
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  varying float vFragDepth;
  varying float vIsPerspective;
#endif
`;

export const LOG_DEPTH_VERTEX = `
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  vFragDepth = 1.0 + gl_Position.w;
  vIsPerspective = 1.0;
#endif
`;

export const LOG_DEPTH_PARS_FRAGMENT = `
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  varying float vFragDepth;
  varying float vIsPerspective;
#endif
`;

export const LOG_DEPTH_FRAGMENT = `
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2(vFragDepth) * logDepthBufFC * 0.5;
#endif
`;
