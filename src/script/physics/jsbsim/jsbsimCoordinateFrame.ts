/**
 * Coordinate-frame conversion between JSBSim's aerospace convention and the
 * sim's THREE.js body/world convention (see utils/math.ts):
 *   +X = RIGHT, +Y = UP, +Z = FORWARD (right-handed: RIGHT × UP = FORWARD).
 *
 * JSBSim uses the standard aerospace body frame (X = forward/nose, Y = right,
 * Z = down; right-handed: FORWARD × RIGHT = DOWN) and reports attitude as
 * Euler angles (phi = roll, theta = pitch, psi = yaw/heading) relative to a
 * local NED (North, East, Down) level frame, using the standard 3-2-1
 * (yaw-pitch-roll) sequence. Body rates p/q/r and body velocity u/v/w share
 * that same axis shape (x = forward-like, y = right-like, z = down-like), so
 * one fixed change of basis, {@link AXIS_REMAP}, is used to convert all of
 * them.
 *
 * It is a mathematical fact (provable by requiring the remap to be a proper,
 * orientation-preserving rotation) that no axis correspondence can keep ALL
 * THREE of "forward maps to forward", "right maps to right" and "down maps
 * to -up" at once — exactly one of the first two must flip. This module
 * keeps RIGHT unmirrored (so lateral/roll behaviour and aileron feel are not
 * mirrored) and instead mirrors FORWARD. The forward axis is therefore
 * negated wherever a quantity is fundamentally "forward-relative": pitch
 * angle (theta), pitch rate (q) and forward body velocity (u).
 * Roll/yaw-related quantities (phi, p, r, v, w) need no such correction.
 * This combination was derived from, and is checked against, concrete
 * physical requirements (roll right -> right wing down, pitch nose-up ->
 * nose up, forward airspeed -> velocity along the nose, climbing -> positive
 * world Y) in jsbsimCoordinateFrame.test.ts.
 */
import * as THREE from 'three';

export const FT_TO_M = 0.3048;
export const M_TO_FT = 1 / FT_TO_M;

const _mBasis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, -1), // image of aero +X (forward)
    new THREE.Vector3(1, 0, 0),  // image of aero +Y (right)
    new THREE.Vector3(0, -1, 0), // image of aero +Z (down)
);
/** Fixed change-of-basis rotation from JSBSim's abstract aero axes to the sim's (Right, Up, Forward) axes. */
const AXIS_REMAP: THREE.Quaternion = new THREE.Quaternion().setFromRotationMatrix(_mBasis);
const AXIS_REMAP_INV: THREE.Quaternion = AXIS_REMAP.clone().invert();

const AERO_X = new THREE.Vector3(1, 0, 0);
const AERO_Y = new THREE.Vector3(0, 1, 0);
const AERO_Z = new THREE.Vector3(0, 0, 1);

const _qx = new THREE.Quaternion();
const _qy = new THREE.Quaternion();
const _qz = new THREE.Quaternion();
const _qBody = new THREE.Quaternion();

/**
 * Body-to-NED attitude quaternion (in the abstract aero axes) from Euler
 * angles, using the standard aerospace 3-2-1 (yaw-pitch-roll) sequence:
 * intrinsically roll about body X first, then pitch about the new Y, then
 * yaw about the newest Z. `theta` is negated here to compose correctly with
 * {@link AXIS_REMAP} (see module doc comment).
 */
function bodyToNedQuaternion(phiRad: number, thetaRad: number, psiRad: number, target: THREE.Quaternion): THREE.Quaternion {
    _qx.setFromAxisAngle(AERO_X, phiRad);
    _qy.setFromAxisAngle(AERO_Y, -thetaRad);
    _qz.setFromAxisAngle(AERO_Z, psiRad);
    return target.copy(_qz).multiply(_qy).multiply(_qx);
}

/** Converts JSBSim Euler attitude (radians) into the equivalent sim orientation quaternion. */
export function jsbsimAttitudeToQuaternion(
    phiRad: number, thetaRad: number, psiRad: number, target: THREE.Quaternion = new THREE.Quaternion(),
): THREE.Quaternion {
    bodyToNedQuaternion(phiRad, thetaRad, psiRad, _qBody);
    // q_sim = AXIS_REMAP * q_body * AXIS_REMAP^-1
    target.copy(AXIS_REMAP).multiply(_qBody).multiply(AXIS_REMAP_INV);
    return target;
}

const _mRot = new THREE.Matrix4();

/**
 * Inverse of {@link jsbsimAttitudeToQuaternion}: given a sim orientation
 * quaternion, returns the equivalent JSBSim phi/theta/psi (radians). Used to
 * translate an externally requested spawn/teleport orientation into JSBSim
 * initial-condition properties.
 */
export function worldQuaternionToJsbsimAttitude(q: THREE.Quaternion): { phiRad: number; thetaRad: number; psiRad: number } {
    // q_body = AXIS_REMAP^-1 * q_sim * AXIS_REMAP
    _qBody.copy(AXIS_REMAP_INV).multiply(q).multiply(AXIS_REMAP);
    _mRot.makeRotationFromQuaternion(_qBody);
    const e = _mRot.elements; // column-major: e[col*4+row]
    const r00 = e[0], r10 = e[1], r20 = e[2];
    const r21 = e[6], r22 = e[10];
    const thetaRad = -Math.asin(THREE.MathUtils.clamp(-r20, -1, 1));
    const phiRad = Math.atan2(r21, r22);
    const psiRad = Math.atan2(r10, r00);
    return { phiRad, thetaRad, psiRad };
}

const _vBody = new THREE.Vector3();

/**
 * Converts JSBSim's body-frame velocity (u, v, w — all m/s, aero body axes)
 * into a world-frame velocity (m/s), given the aircraft's current sim
 * orientation quaternion (as produced by {@link jsbsimAttitudeToQuaternion}).
 * `u` is negated for the same reason `theta`/`q` are (see module doc
 * comment). Going through the body frame and the actual orientation
 * quaternion (rather than an independent NED-velocity formula) guarantees
 * the result is self-consistent with attitude by construction: straight,
 * unaccelerated flight (v_body = (airspeed, 0, 0)) always yields a world
 * velocity pointing exactly along the current nose direction.
 */
export function jsbsimBodyVelocityToWorld(
    uMps: number, vMps: number, wMps: number, qSim: THREE.Quaternion, target: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
    _vBody.set(-uMps, vMps, wMps).applyQuaternion(AXIS_REMAP);
    return target.copy(_vBody).applyQuaternion(qSim);
}

/** Inverse of {@link jsbsimBodyVelocityToWorld}: world velocity -> JSBSim body-frame (u, v, w) in m/s. */
export function worldVelocityToJsbsimBody(
    worldVelocity: THREE.Vector3, qSim: THREE.Quaternion,
): { uMps: number; vMps: number; wMps: number } {
    const simBody = worldVelocity.clone().applyQuaternion(qSim.clone().invert());
    const aero = simBody.applyQuaternion(AXIS_REMAP_INV);
    return { uMps: -aero.x, vMps: aero.y, wMps: aero.z };
}

/**
 * Converts JSBSim body angular rates p (roll, about body +X), q (pitch,
 * about body +Y) and r (yaw, about body +Z), all rad/s, into the sim's body
 * angular velocity convention (x = pitch about RIGHT, y = yaw about UP,
 * z = roll about FORWARD — matching Fm2FlightModel's rigid body). `q` is
 * negated for the same reason `theta` is (see module doc comment).
 */
export function jsbsimRatesToWorld(
    pRadS: number, qRadS: number, rRadS: number, target: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
    target.set(pRadS, -qRadS, rRadS).applyQuaternion(AXIS_REMAP);
    return target;
}
