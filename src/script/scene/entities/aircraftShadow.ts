import * as THREE from 'three';
import { FORWARD, RIGHT, UP } from '../../utils/math';

/** Lift above solid ground so the silhouette clears coplanar deck/terrain depth. */
export const SHADOW_SURFACE_EPSILON_M = 0.08;
/** Ground-shadow opacity via screen-space stipple (higher = denser / more opaque). */
export const SHADOW_ALPHA_DITHER = 0.4;

/** Samples per axis over the footprint when fitting the ground plane (3 => 3x3 grid). */
const FOOTPRINT_SAMPLES = 3;
/**
 * Steepest ground the silhouette will follow, as a gradient (1 = 45 degrees).
 * Past this the plane stays flatter and the max-residual lift keeps it clear,
 * which reads better than a silhouette standing on edge against a cliff.
 */
const MAX_GROUND_SLOPE = 1;
/**
 * Extra lift as a fraction of the relief measured under the footprint. The
 * fitted plane only provably clears the sampled points; this buys margin for
 * the ground between them, and for the render mesh disagreeing slightly with
 * the height sampler (baked tile geometry vs DEM raster).
 */
const RELIEF_CLEARANCE = 0.05;

const _heading = new THREE.Vector3();
const _right = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _tilt = new THREE.Quaternion();
/** Footprint heights, reused so a frame of shadows allocates nothing. */
const _samples = new Float64Array(FOOTPRINT_SAMPLES * FOOTPRINT_SAMPLES);

/**
 * Places a planform shadow on solid ground under the aircraft, squashed by
 * attitude (bank/pitch project onto the ground plane) and tilted onto the
 * local ground slope.
 *
 * A single height sample under the aircraft leaves the silhouette horizontal,
 * so over sloped ground half of it sinks below the surface and the visible
 * half gets clipped along a terrain triangle edge — the shadow reads as
 * sitting on one triangle. Instead the ground is sampled on a grid over the
 * whole footprint, a plane is fitted through those samples, and the plane is
 * then lifted until it clears every one of them.
 *
 * `footprintRadius` is the half-extent of the unsquashed silhouette in metres
 * (model maxSize / 2). Zero keeps the old single-sample horizontal placement.
 */
export function setAircraftShadowPose(
    aircraftPosition: THREE.Vector3,
    aircraftQuaternion: THREE.Quaternion,
    groundHeightAt: (x: number, z: number) => number,
    footprintRadius: number,
    outPosition: THREE.Vector3,
    outQuaternion: THREE.Quaternion,
    outScale: THREE.Vector3,
    tmp: THREE.Vector3,
): void {
    outPosition.copy(aircraftPosition);

    tmp.copy(FORWARD).applyQuaternion(aircraftQuaternion).setY(0);
    const headingLen = tmp.length();
    if (headingLen > 1e-6) {
        _heading.copy(tmp).multiplyScalar(1 / headingLen);
    } else {
        _heading.copy(FORWARD);
    }
    outQuaternion.setFromUnitVectors(FORWARD, _heading);
    _right.crossVectors(UP, _heading).normalize();

    const shadowLength = Math.max(0.2, tmp.copy(FORWARD).applyQuaternion(aircraftQuaternion).setY(0).length());
    const shadowWidth = Math.max(0.2, tmp.copy(RIGHT).applyQuaternion(aircraftQuaternion).setY(0).length());
    outScale.set(shadowWidth, 1, shadowLength);

    // Half-extents of the silhouette as it actually lands on the ground: the
    // model's own reach, squashed by the same factors as outScale.
    const halfLength = footprintRadius * shadowLength;
    const halfWidth = footprintRadius * shadowWidth;

    if (halfLength < 1e-3 || halfWidth < 1e-3) {
        outPosition.y = groundHeightAt(outPosition.x, outPosition.z) + SHADOW_SURFACE_EPSILON_M;
        return;
    }

    fitGroundPlane(groundHeightAt, outPosition, outQuaternion, halfLength, halfWidth);
}

/**
 * Least-squares plane through a grid of ground samples over the footprint,
 * written into `outPosition.y` and `outQuaternion` via the module scratch.
 * Separated only to keep the pose function readable; it mutates `_normal`,
 * `_tilt` and the caller's position/orientation.
 */
function fitGroundPlane(
    groundHeightAt: (x: number, z: number) => number,
    outPosition: THREE.Vector3,
    outQuaternion: THREE.Quaternion,
    halfLength: number,
    halfWidth: number,
): void {
    // Sample on the shadow's own axes so the grid always covers the silhouette
    // rather than an axis-aligned box around it.
    const step = 2 / (FOOTPRINT_SAMPLES - 1);
    let sumY = 0;
    let sumUY = 0;
    let sumVY = 0;
    let sumUU = 0;
    let sumVV = 0;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < FOOTPRINT_SAMPLES; i++) {
        const u = (-1 + i * step) * halfLength;
        for (let j = 0; j < FOOTPRINT_SAMPLES; j++) {
            const v = (-1 + j * step) * halfWidth;
            const y = groundHeightAt(
                outPosition.x + _heading.x * u + _right.x * v,
                outPosition.z + _heading.z * u + _right.z * v,
            );
            _samples[i * FOOTPRINT_SAMPLES + j] = y;
            sumY += y;
            sumUY += u * y;
            sumVY += v * y;
            sumUU += u * u;
            sumVV += v * v;
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    // The grid is symmetric about the centre, so the u and v columns are
    // centred and mutually orthogonal: the normal equations decouple into two
    // independent slopes and no matrix solve is needed.
    let slopeU = sumUU > 1e-9 ? sumUY / sumUU : 0;
    let slopeV = sumVV > 1e-9 ? sumVY / sumVV : 0;
    const gradient = Math.hypot(slopeU, slopeV);
    if (gradient > MAX_GROUND_SLOPE) {
        const k = MAX_GROUND_SLOPE / gradient;
        slopeU *= k;
        slopeV *= k;
    }

    // Plane y = y0 + slopeU*u + slopeV*v; its normal is UP minus the gradient
    // laid back out along the horizontal sampling axes.
    _normal.copy(UP)
        .addScaledVector(_heading, -slopeU)
        .addScaledVector(_right, -slopeV)
        .normalize();
    _tilt.setFromUnitVectors(UP, _normal);
    // Tilt after heading so the silhouette's nose lies in the slope plane.
    outQuaternion.premultiply(_tilt);

    // Raise the fitted plane until no sample pokes through it. Walking the
    // cached grid against the mean-fit plane is what turns a best fit into an
    // upper bound, which is what the depth test actually needs.
    const meanY = sumY / (FOOTPRINT_SAMPLES * FOOTPRINT_SAMPLES);
    let lift = 0;
    for (let i = 0; i < FOOTPRINT_SAMPLES; i++) {
        const u = (-1 + i * step) * halfLength;
        for (let j = 0; j < FOOTPRINT_SAMPLES; j++) {
            const v = (-1 + j * step) * halfWidth;
            const residual = _samples[i * FOOTPRINT_SAMPLES + j] - (meanY + slopeU * u + slopeV * v);
            lift = Math.max(lift, residual);
        }
    }

    outPosition.y = meanY + lift
        + SHADOW_SURFACE_EPSILON_M
        + RELIEF_CLEARANCE * (maxY - minY);
}
