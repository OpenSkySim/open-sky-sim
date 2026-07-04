import {
    computeAirDensity,
    computeDynamicPressure,
    computeDynamicPressureDragPenalty,
    computeThrustDensityFactor,
} from './aeroUtils';

// Match realisticFlightModel F-16 afterburner level-flight profile.
export const F16_DRY_MASS = 13000;
export const F16_WING_AREA = 27.87;
export const F16_CD0 = 0.020;
export const F16_AB_THRUST_ACCEL = 9.95;

export function computeF16AfterburnerThrust(altitudeMeters: number): number {
    const airDensity = computeAirDensity(altitudeMeters);
    return computeThrustDensityFactor(airDensity, altitudeMeters) * F16_AB_THRUST_ACCEL * F16_DRY_MASS;
}

export function computeF16ParasiticDrag(speedMps: number, altitudeMeters: number): number {
    const airDensity = computeAirDensity(altitudeMeters);
    const dynamicPressure = computeDynamicPressure(airDensity, speedMps);
    const waveDrag = computeDynamicPressureDragPenalty(speedMps, altitudeMeters);
    const cd = F16_CD0 * (1 + waveDrag);
    return dynamicPressure * F16_WING_AREA * cd;
}

export function computeF16LevelFlightMaxSpeed(altitudeMeters: number): number {
    const thrust = computeF16AfterburnerThrust(altitudeMeters);
    let lo = 10;
    let hi = 800;

    for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) * 0.5;
        if (computeF16ParasiticDrag(mid, altitudeMeters) > thrust) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return (lo + hi) * 0.5;
}

export function findF16PeakLevelFlightSpeed(
    maxAltitudeMeters = 16000,
    altitudeStepMeters = 250,
): { altitudeMeters: number; speedMps: number } {
    let bestAltitude = 0;
    let bestSpeed = 0;

    for (let altitude = 0; altitude <= maxAltitudeMeters; altitude += altitudeStepMeters) {
        const speed = computeF16LevelFlightMaxSpeed(altitude);
        if (speed > bestSpeed) {
            bestSpeed = speed;
            bestAltitude = altitude;
        }
    }

    return { altitudeMeters: bestAltitude, speedMps: bestSpeed };
}
