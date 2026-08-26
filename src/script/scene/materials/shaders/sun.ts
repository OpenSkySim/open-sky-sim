import * as THREE from 'three';

/**
 * Direction *towards* the sun in world/ENU space (+X east, +Y up, +Z north).
 * Fixed 14:00 local solar time at ~29°N (Canaries): ~49° elevation, SW azimuth.
 *
 * Shared by the shaded vertex program (N·L) and the shadow map pass, so the
 * cast shadows always agree with the surface shading.
 */
export const SUN_DIRECTION: THREE.Vector3 = new THREE.Vector3(-0.47, 0.76, -0.45).normalize();

/** {@link SUN_DIRECTION} as a GLSL constructor, for inlining into shaders. */
export const SUN_DIR_GLSL: string =
    `vec3(${SUN_DIRECTION.x.toFixed(6)}, ${SUN_DIRECTION.y.toFixed(6)}, ${SUN_DIRECTION.z.toFixed(6)})`;

/**
 * Ambient floor of the shaded lighting ramp (`shade = AMBIENT + (1 − AMBIENT) · N·L`).
 * A fragment in shadow is pulled back down to exactly this, i.e. it keeps the
 * palette base colour and loses only the direct sun term.
 */
export const SUN_SHADE_AMBIENT = 0.55;

export const SUN_SHADE_AMBIENT_GLSL: string = SUN_SHADE_AMBIENT.toFixed(2);

/** Weight of the direct sun term in that same ramp. */
export const SUN_SHADE_DIRECT_GLSL: string = (1 - SUN_SHADE_AMBIENT).toFixed(2);
