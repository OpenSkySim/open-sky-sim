import * as THREE from 'three';

/**
 * Something the player can designate as a weapons target: shown in the target
 * MFD (MFD2), framed by the target camera, and boxed by the main HUD. Implemented
 * by fixed {@link GroundTargetEntity} installations and by airborne enemy aircraft.
 */
export interface WeaponsTarget {
    /** World/display position used for the target camera, range and bearing. */
    readonly position: THREE.Vector3;
    /** Offset from {@link position} to the visual centre of the target. */
    readonly localCenter: THREE.Vector3;
    /** Largest visible extent (m); drives the target-camera zoom factor. */
    readonly maxSize: number;
    /** Short type label shown in the target MFD. */
    readonly targetType: string;
    /** Location / status label shown in the target MFD. */
    readonly targetLocation: string;
    /** True for airborne targets (enemy aircraft), false for fixed ground targets. */
    readonly airborne: boolean;
}
