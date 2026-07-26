import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeMachNumber, computeSpeedOfSound } from './aeroUtils';
import {
    computeF16LevelFlightMaxSpeed,
    findF16PeakLevelFlightSpeed,
} from './levelFlightEquilibrium';

describe('F-16 level-flight max speed vs altitude', () => {
    it('is faster at 12,200 m than at sea level', () => {
        const seaLevelMax = computeF16LevelFlightMaxSpeed(0);
        const highAltitudeMax = computeF16LevelFlightMaxSpeed(12200);

        assert.ok(highAltitudeMax > seaLevelMax);
    });

    it('peaks in the high-altitude band around FL300–FL400, not on the deck', () => {
        const peak = findF16PeakLevelFlightSpeed();
        const seaLevelMax = computeF16LevelFlightMaxSpeed(0);

        assert.ok(peak.altitudeMeters >= 7000, `expected peak above 7 km, got ${peak.altitudeMeters} m`);
        assert.ok(peak.altitudeMeters <= 12000, `expected peak below 12 km, got ${peak.altitudeMeters} m`);
        assert.ok(peak.speedMps > seaLevelMax * 1.02);
    });

    it('is faster near 12,200 m than at the service-ceiling edge', () => {
        const at12200 = computeF16LevelFlightMaxSpeed(12200);
        const at15000 = computeF16LevelFlightMaxSpeed(15000);

        assert.ok(at12200 > at15000);
    });

    it('reaches high-subsonic/low-supersonic Mach near the peak-altitude envelope', () => {
        const peak = findF16PeakLevelFlightSpeed();
        const mach = computeMachNumber(peak.speedMps, peak.altitudeMeters);

        assert.ok(mach > 1.5, `expected Mach > 1.5, got ${mach.toFixed(2)}`);
        assert.ok(mach < 2.2, `expected Mach < 2.2, got ${mach.toFixed(2)}`);
        assert.ok(computeSpeedOfSound(peak.altitudeMeters) > 0);
    });
});
