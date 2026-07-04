import * as THREE from 'three';

const GRAVITY = 9.8;

export const GROUND_AIR_DENSITY = 1.225; // kg/m³ at sea level
const AIR_DENSITY_SCALE_HEIGHT = 8000; // m
const VNE_MS = 330; // ~Mach 0.95 at sea level, F-16 transonic drag rise

export function computeAirDensity(altitudeMeters: number): number {
    return GROUND_AIR_DENSITY * Math.exp(-altitudeMeters / AIR_DENSITY_SCALE_HEIGHT);
}

export function computeDynamicPressure(airDensity: number, speed: number): number {
    return 0.5 * airDensity * speed * speed;
}

export function computeThrustDensityFactor(airDensity: number): number {
    return airDensity / GROUND_AIR_DENSITY;
}

export function computeDynamicPressureDragPenalty(dynamicPressure: number, airDensity: number): number {
    const qMax = 0.5 * airDensity * VNE_MS * VNE_MS;
    if (dynamicPressure <= qMax) {
        return 0;
    }
    const excess = (dynamicPressure - qMax) / qMax;
    return 0.35 * excess * excess;
}

export function computeMaxEquilibriumSpeed(
    airDensity: number,
    thrustForce: number,
    wingArea: number,
    dragCoefficient: number,
): number {
    if (airDensity <= 0 || dragCoefficient <= 0 || thrustForce <= 0) {
        return 0;
    }
    return Math.sqrt(2 * thrustForce / (airDensity * wingArea * dragCoefficient));
}

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
