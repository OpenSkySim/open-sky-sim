import * as THREE from 'three';

const GRAVITY = 9.8;

export function computeAngleOfAttack(
    forward: THREE.Vector3,
    right: THREE.Vector3,
    velocity: THREE.Vector3,
    scratch: THREE.Vector3,
): number {
    const speed = velocity.length();
    if (speed <= 1.0) {
        return 0;
    }

    scratch.copy(velocity).multiplyScalar(1 / speed).projectOnPlane(right);
    if (scratch.lengthSq() <= 1e-6) {
        return 0;
    }

    scratch.normalize();
    const aoaAngle = scratch.angleTo(forward);
    const aoaSign = scratch.cross(forward).dot(right) > 0 ? -1 : 1;
    return aoaSign * aoaAngle;
}

export function computeLoadFactorG(accel: THREE.Vector3, up: THREE.Vector3, gravity = GRAVITY): number {
    return (accel.x * up.x + (accel.y + gravity) * up.y + accel.z * up.z) / gravity;
}
