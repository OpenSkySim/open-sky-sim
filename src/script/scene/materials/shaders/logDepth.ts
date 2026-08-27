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
  // Orthographic projections leave w at 1, so the log curve would hand every
  // fragment the same depth and the pass would z-fight itself. Same test
  // Three's own chunk makes; the ortho branch falls back to gl_FragCoord.z.
  vIsPerspective = projectionMatrix[2][3] == -1.0 ? 1.0 : 0.0;
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
