import * as THREE from 'three';
import { clamp } from '../utils/math';

/**
 * Pure geometry/energy helpers shared by the AI dogfight logic (see
 * {@link import('./aiPilot').AiPilot}). Every function here takes plain
 * vectors/numbers and has no engine or class-state dependency, so it can be
 * unit tested directly against hand-computed BFM geometries.
 */

const G = 9.80665;

const _los = new THREE.Vector3();
const _rel = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _tail = new THREE.Vector3();

/**
 * "Energy height" (m): altitude plus the altitude-equivalent of kinetic
 * energy, `h + v^2 / (2g)`. Two aircraft at the same energy height can trade
 * altitude for speed (or vice versa) to reach the same total energy state,
 * which is the standard basis for energy-management (extend/climb) decisions.
 */
export function specificEnergyHeight(altitude: number, speed: number): number {
    return altitude + (speed * speed) / (2 * G);
}

/**
 * Signed closure rate (m/s) along the line of sight between two aircraft.
 * Positive means the range is decreasing (closing) — a fast positive value
 * warns of an imminent overshoot; negative means the range is opening.
 */
export function closureRate(myPos: THREE.Vector3, myVel: THREE.Vector3, targetPos: THREE.Vector3, targetVel: THREE.Vector3): number {
    _los.copy(targetPos).sub(myPos);
    const range = _los.length();
    if (range < 1e-6) {
        return 0;
    }
    _los.divideScalar(range);
    _rel.copy(myVel).sub(targetVel);
    return _rel.dot(_los);
}

/**
 * Antenna train angle (rad, [0, pi]): the angle between a shooter's nose
 * (`shooterForward`) and the line from the shooter to `targetPos`. Zero means
 * the target is dead ahead of the shooter's nose. Used both for the AI's own
 * gun-tracking check and, with the *target's* velocity as a nose proxy, to
 * detect whether the target is tracking the AI (a `Combatant` only exposes
 * position/velocity, so velocity direction stands in for heading).
 */
export function trackingAngle(shooterPos: THREE.Vector3, shooterForward: THREE.Vector3, targetPos: THREE.Vector3): number {
    _los.copy(targetPos).sub(shooterPos);
    if (_los.lengthSq() < 1e-9 || shooterForward.lengthSq() < 1e-9) {
        return 0;
    }
    _los.normalize();
    _fwd.copy(shooterForward).normalize();
    return Math.acos(clamp(_fwd.dot(_los), -1, 1));
}

/**
 * Aspect angle (rad, [0, pi]): measured at the target, between the target's
 * tail and the line from the target to `observerPos`. Zero means the
 * observer is dead astern of the target (best offensive position); pi means
 * the observer is out in front of the target's nose (head-on).
 */
export function aspectAngle(observerPos: THREE.Vector3, targetPos: THREE.Vector3, targetVel: THREE.Vector3): number {
    if (targetVel.lengthSq() < 1e-9) {
        return 0;
    }
    _tail.copy(targetVel).normalize().multiplyScalar(-1);
    return trackingAngle(targetPos, _tail, observerPos);
}

/**
 * Angle-off (rad, [0, pi]) between two velocity vectors. Zero means both
 * aircraft are flying the same direction (in-trail — a lead-pursuit aimpoint
 * is flyable); pi means opposite directions (head-on). Large angle-off means
 * the flight paths are crossing, so a pure lead-pursuit turn may require a
 * turn radius the airframe cannot sustain.
 */
export function angleOff(myVel: THREE.Vector3, targetVel: THREE.Vector3): number {
    if (myVel.lengthSq() < 1e-9 || targetVel.lengthSq() < 1e-9) {
        return 0;
    }
    const dot = myVel.dot(targetVel) / (myVel.length() * targetVel.length());
    return Math.acos(clamp(dot, -1, 1));
}
