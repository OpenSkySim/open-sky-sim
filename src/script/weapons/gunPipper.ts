import * as THREE from 'three';
import { clamp } from '../utils/math';

/** Matches combat-sim projectile gravity. */
export const GUN_PROJECTILE_GRAVITY = 9.80665;

/** When no weapons target is locked, aim cue uses this reference range (m). */
export const GUN_AIM_DEFAULT_RANGE_M = 500;

const _relPos = new THREE.Vector3();
const _relVel = new THREE.Vector3();
const _bulletVel = new THREE.Vector3();
const _bulletAtTof = new THREE.Vector3();
const _targetAtTof = new THREE.Vector3();
const _iter = new THREE.Vector3();

/**
 * Bullet time-of-flight (s) to intercept a target moving at `relVel` relative
 * to the shooter. Same fixed-point iteration as the AI gun-lead solver.
 */
export function solveGunInterceptTime(
    relPos: THREE.Vector3, relVel: THREE.Vector3, muzzleSpeed: number, maxTof = 5,
): number {
    const speed = Math.max(1, muzzleSpeed);
    let tof = relPos.length() / speed;
    for (let i = 0; i < 3; i++) {
        _iter.copy(relVel).multiplyScalar(tof).add(relPos);
        tof = _iter.length() / speed;
    }
    return clamp(tof, 0, maxTof);
}

/**
 * World-space LCOS gun pipper point for the HUD.
 *
 * With a locked target the pipper is offset from the target by the predicted
 * miss (`targetAtTof - bulletAtTof`), so putting the diamond on the target box
 * means the round and target meet. Without a lock, returns the bullet impact
 * point at {@link defaultRangeM} along the gun line (with drop).
 *
 * Rounds inherit shooter velocity and drop under gravity — same model as the
 * combat sim / AI ballistic aim.
 */
export function computeGunPipperWorldPoint(
    out: THREE.Vector3,
    gunPos: THREE.Vector3,
    gunForward: THREE.Vector3,
    gunVel: THREE.Vector3,
    muzzleSpeed: number,
    targetPos: THREE.Vector3 | undefined,
    targetVel: THREE.Vector3 | undefined,
    defaultRangeM: number = GUN_AIM_DEFAULT_RANGE_M,
    gravity: number = GUN_PROJECTILE_GRAVITY,
): THREE.Vector3 {
    _bulletVel.copy(gunForward).multiplyScalar(muzzleSpeed).add(gunVel);

    if (targetPos) {
        _relPos.copy(targetPos).sub(gunPos);
        if (targetVel) {
            _relVel.copy(targetVel).sub(gunVel);
        } else {
            _relVel.copy(gunVel).multiplyScalar(-1);
        }
        const tof = solveGunInterceptTime(_relPos, _relVel, muzzleSpeed);

        _targetAtTof.copy(targetPos);
        if (targetVel) {
            _targetAtTof.addScaledVector(targetVel, tof);
        }

        _bulletAtTof.copy(gunPos).addScaledVector(_bulletVel, tof);
        _bulletAtTof.y -= 0.5 * gravity * tof * tof;

        // pipper = target + (targetAtTof - bulletAtTof): collapses onto the
        // target when the gun solution is correct.
        return out.copy(targetPos).add(_targetAtTof).sub(_bulletAtTof);
    }

    const speedAlongGun = Math.max(1, _bulletVel.dot(gunForward));
    const tof = defaultRangeM / speedAlongGun;
    out.copy(gunPos).addScaledVector(_bulletVel, tof);
    out.y -= 0.5 * gravity * tof * tof;
    return out;
}
