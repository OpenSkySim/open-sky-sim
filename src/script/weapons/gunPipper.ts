import * as THREE from 'three';

/** Matches combat-sim projectile gravity. */
export const GUN_PROJECTILE_GRAVITY = 9.80665;

/** When no weapons target is locked, pipper uses this reference range (m). */
export const GUN_AIM_DEFAULT_RANGE_M = 500;

/** Max samples for the HUD gun-line polyline. */
export const GUN_LINE_SAMPLES = 12;

const _bulletVel = new THREE.Vector3();

/**
 * Bullet world position after flying for `tof` seconds under gravity.
 * Rounds inherit shooter velocity + muzzle along the nose.
 */
export function bulletPositionAtTime(
    out: THREE.Vector3,
    gunPos: THREE.Vector3,
    bulletVel: THREE.Vector3,
    tof: number,
    gravity: number = GUN_PROJECTILE_GRAVITY,
): THREE.Vector3 {
    out.copy(gunPos).addScaledVector(bulletVel, tof);
    out.y -= 0.5 * gravity * tof * tof;
    return out;
}

/**
 * Time of flight (s) for a round to travel `rangeM` along the gun axis.
 * Uses the component of bullet velocity along `gunForward`.
 */
export function tofForRange(
    gunForward: THREE.Vector3,
    gunVel: THREE.Vector3,
    muzzleSpeed: number,
    rangeM: number,
): number {
    _bulletVel.copy(gunForward).multiplyScalar(muzzleSpeed).add(gunVel);
    const speedAlongGun = Math.max(1, _bulletVel.dot(gunForward));
    return Math.max(0, rangeM) / speedAlongGun;
}

/**
 * World-space gun pipper: where the bullets are after flying the current
 * target range (or {@link defaultRangeM} with no lock), including gravity drop.
 *
 * Put this circle on the target to score hits. Target motion is not lead-
 * compensated — the pilot leads by placing the pipper ahead of a mover.
 */
export function computeGunPipperWorldPoint(
    out: THREE.Vector3,
    gunPos: THREE.Vector3,
    gunForward: THREE.Vector3,
    gunVel: THREE.Vector3,
    muzzleSpeed: number,
    targetPos: THREE.Vector3 | undefined,
    defaultRangeM: number = GUN_AIM_DEFAULT_RANGE_M,
    gravity: number = GUN_PROJECTILE_GRAVITY,
): THREE.Vector3 {
    _bulletVel.copy(gunForward).multiplyScalar(muzzleSpeed).add(gunVel);
    const rangeM = targetPos
        ? Math.max(1, targetPos.distanceTo(gunPos))
        : defaultRangeM;
    const tof = tofForRange(gunForward, gunVel, muzzleSpeed, rangeM);
    return bulletPositionAtTime(out, gunPos, _bulletVel, tof, gravity);
}

/**
 * Sample world points along the ballistic gun line from the muzzle out to
 * `rangeM` (inclusive). Writes up to `out.length` points; returns how many
 * were filled. Used to draw the HUD trajectory line under the pipper.
 */
export function sampleGunLineWorldPoints(
    out: THREE.Vector3[],
    gunPos: THREE.Vector3,
    gunForward: THREE.Vector3,
    gunVel: THREE.Vector3,
    muzzleSpeed: number,
    rangeM: number,
    gravity: number = GUN_PROJECTILE_GRAVITY,
): number {
    if (out.length === 0) {
        return 0;
    }
    _bulletVel.copy(gunForward).multiplyScalar(muzzleSpeed).add(gunVel);
    const tofEnd = tofForRange(gunForward, gunVel, muzzleSpeed, rangeM);
    const n = out.length;
    for (let i = 0; i < n; i++) {
        const t = tofEnd * (i / (n - 1));
        bulletPositionAtTime(out[i], gunPos, _bulletVel, t, gravity);
    }
    return n;
}
