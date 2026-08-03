import * as THREE from 'three';
import { FORWARD, RIGHT } from '../../utils/math';

/** Lift above solid ground so the silhouette clears coplanar deck/terrain depth. */
export const SHADOW_SURFACE_EPSILON_M = 0.08;
/** Ground-shadow opacity via screen-space stipple (higher = denser / more opaque). */
export const SHADOW_ALPHA_DITHER = 0.4;

/**
 * Places a planform shadow on solid ground under the aircraft and squashes it
 * by attitude (bank/pitch project onto the ground plane).
 */
export function setAircraftShadowPose(
    aircraftPosition: THREE.Vector3,
    aircraftQuaternion: THREE.Quaternion,
    groundHeightAt: (x: number, z: number) => number,
    outPosition: THREE.Vector3,
    outQuaternion: THREE.Quaternion,
    outScale: THREE.Vector3,
    tmp: THREE.Vector3,
): void {
    outPosition.copy(aircraftPosition);
    outPosition.y = groundHeightAt(outPosition.x, outPosition.z) + SHADOW_SURFACE_EPSILON_M;

    tmp.copy(FORWARD).applyQuaternion(aircraftQuaternion).setY(0);
    const headingLen = tmp.length();
    if (headingLen > 1e-6) {
        tmp.multiplyScalar(1 / headingLen);
        outQuaternion.setFromUnitVectors(FORWARD, tmp);
    } else {
        outQuaternion.identity();
    }

    const shadowLength = Math.max(0.2, tmp.copy(FORWARD).applyQuaternion(aircraftQuaternion).setY(0).length());
    const shadowWidth = Math.max(0.2, tmp.copy(RIGHT).applyQuaternion(aircraftQuaternion).setY(0).length());
    outScale.set(shadowWidth, 1, shadowLength);
}
