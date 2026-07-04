import * as THREE from 'three';

const GRAVITY = 9.8;

export const GROUND_AIR_DENSITY = 1.225; // kg/m³ at sea level
const AIR_DENSITY_SCALE_HEIGHT = 8000; // m
const VNE_MACH = 0.95; // transonic drag rise onset

export function computeAirDensity(altitudeMeters: number): number {
    return GROUND_AIR_DENSITY * Math.exp(-altitudeMeters / AIR_DENSITY_SCALE_HEIGHT);
}

export function computeDynamicPressure(airDensity: number, speed: number): number {
    return 0.5 * airDensity * speed * speed;
}

export function computeThrustDensityFactor(airDensity: number, altitudeMeters = 0): number {
    const sigma = airDensity / GROUND_AIR_DENSITY;
    const lapse = Math.pow(sigma, 0.7);
    const optimumAltitude = 11000; // m, ~FL360 thrust-limited optimum
    const altPenalty = altitudeMeters <= optimumAltitude
        ? 1
        : Math.max(0.35, 1 - (altitudeMeters - optimumAltitude) / 9000);
    return lapse * altPenalty;
}

const ISA_SEA_LEVEL_TEMP = 288.15; // K
const ISA_LAPSE_RATE = 0.0065; // K/m
const ISA_TROPOPAUSE_TEMP = 216.65; // K
const GAMMA = 1.4;
const GAS_CONSTANT = 287.05; // J/(kg·K)

export function computeSpeedOfSound(altitudeMeters: number): number {
    const temperature = Math.max(ISA_TROPOPAUSE_TEMP, ISA_SEA_LEVEL_TEMP - ISA_LAPSE_RATE * altitudeMeters);
    return Math.sqrt(GAMMA * GAS_CONSTANT * temperature);
}

export function computeMachNumber(speedMps: number, altitudeMeters: number): number {
    const speedOfSound = computeSpeedOfSound(altitudeMeters);
    if (speedOfSound <= 0) {
        return 0;
    }
    return speedMps / speedOfSound;
}

export function computeDynamicPressureDragPenalty(speedMps: number, altitudeMeters: number): number {
    const speedOfSound = computeSpeedOfSound(altitudeMeters);
    if (speedOfSound <= 0 || speedMps <= 0) {
        return 0;
    }
    const mach = speedMps / speedOfSound;
    if (mach <= VNE_MACH) {
        return 0;
    }
    const excess = (mach - VNE_MACH) / VNE_MACH;
    return 0.55 * excess * excess;
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
