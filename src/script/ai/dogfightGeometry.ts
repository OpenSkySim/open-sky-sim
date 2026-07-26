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
const _relPos = new THREE.Vector3();
const _relVel = new THREE.Vector3();
const _iter = new THREE.Vector3();
const _bullet = new THREE.Vector3();
const _tgt = new THREE.Vector3();

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

/**
 * Bullet time-of-flight (s) to intercept a target moving at `relVel`
 * relative to the shooter, starting `relPos` away, with the round leaving at
 * `muzzleSpeed` relative to the shooter (rounds inherit the shooter's own
 * velocity, so all shooter motion cancels out of the relative problem).
 * Solved by fixed-point iteration of `tof = |relPos + relVel * tof| /
 * muzzleSpeed`, which contracts as long as |relVel| < muzzleSpeed (always
 * true here: aircraft fly at a fraction of the ~1000 m/s muzzle velocity).
 */
export function solveInterceptTime(relPos: THREE.Vector3, relVel: THREE.Vector3, muzzleSpeed: number, maxTof = 5): number {
    const speed = Math.max(1, muzzleSpeed);
    let tof = relPos.length() / speed;
    for (let i = 0; i < 3; i++) {
        _iter.copy(relVel).multiplyScalar(tof).add(relPos);
        tof = _iter.length() / speed;
    }
    return clamp(tof, 0, maxTof);
}

/**
 * Gun-lead aim point (world frame) for a shooter whose rounds inherit its own
 * velocity: `targetPos + (targetVel - myVel) * tof + 0.5 * targetAcc * tof^2
 * + 0.5 * g * tof^2 * up`. Pointing the gun at this world point makes the
 * round — which flies at `muzzleSpeed` along the nose *plus* the shooter's
 * velocity, dropping under gravity — meet the (constant-acceleration
 * extrapolated) target. Note the `- myVel * tof` term: a naive world-frame
 * lead (`targetPos + targetVel * tof`) is wrong by the shooter's own motion,
 * which on a crossing shot is a many-degree aim error. Writes the aim point
 * into `out` and returns the time of flight (s).
 */
export function ballisticAimPoint(
    out: THREE.Vector3,
    myPos: THREE.Vector3, myVel: THREE.Vector3,
    targetPos: THREE.Vector3, targetVel: THREE.Vector3, targetAcc: THREE.Vector3,
    muzzleSpeed: number,
): number {
    _relPos.copy(targetPos).sub(myPos);
    _relVel.copy(targetVel).sub(myVel);
    const tof = solveInterceptTime(_relPos, _relVel, muzzleSpeed);
    out.copy(targetPos)
        .addScaledVector(_relVel, tof)
        .addScaledVector(targetAcc, 0.5 * tof * tof);
    out.y += 0.5 * G * tof * tof; // hold-over for the round's gravity drop
    return tof;
}

/**
 * Predicted miss distance (m): minimum separation between a round leaving
 * `shooterPos` with world velocity `bulletVel` (dropping under gravity) and a
 * target extrapolated from `targetPos`/`targetVel`/`targetAcc`, sampled in a
 * window around the nominal time of flight `tof`. This is the actual "will
 * this trigger pull connect?" question, unlike a fixed angular cone which is
 * blind to range and to the shooter's velocity contribution to the round.
 */
export function predictedMissDistance(
    shooterPos: THREE.Vector3, bulletVel: THREE.Vector3,
    targetPos: THREE.Vector3, targetVel: THREE.Vector3, targetAcc: THREE.Vector3,
    tof: number,
): number {
    let best = Infinity;
    for (let f = 0.8; f <= 1.2001; f += 0.05) {
        const t = tof * f;
        _bullet.copy(shooterPos).addScaledVector(bulletVel, t);
        _bullet.y -= 0.5 * G * t * t;
        _tgt.copy(targetPos)
            .addScaledVector(targetVel, t)
            .addScaledVector(targetAcc, 0.5 * t * t);
        const d = _bullet.distanceTo(_tgt);
        if (d < best) {
            best = d;
        }
    }
    return best;
}
