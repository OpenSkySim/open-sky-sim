import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { liftToDragFromAlphaDeg } from './f16AnalyticalModel';
import { computeMachNumber } from './aeroUtils';
import {
    F16_PROFILE,
    F16_REFERENCE_CASES,
    F16ReferenceCase,
    MPS_TO_KTS,
} from './f16Profile';
import {
    computeF16AfterburnerThrust,
    computeF16LevelFlightMaxSpeed,
    findF16PeakLevelFlightSpeed,
} from './levelFlightEquilibrium';

function evaluateFlightModel(caseRow: F16ReferenceCase): number {
    switch (caseRow.metric) {
        case 'massKg':
            return F16_PROFILE.combatMassKg;
        case 'wingAreaM2':
            return F16_PROFILE.wingAreaM2;
        case 'wingSpanM':
            return F16_PROFILE.wingSpanM;
        case 'cd0':
            return F16_PROFILE.cd0;
        case 'inducedDragK':
            return F16_PROFILE.inducedDragK;
        case 'clAlphaPerRad':
            return F16_PROFILE.clAlphaPerRad;
        case 'maxLiftToDrag':
            return liftToDragFromAlphaDeg(caseRow.alphaDeg ?? 2);
        case 'cruiseSpeedMps':
            return F16_PROFILE.cruiseSpeedMps;
        case 'abThrustKn':
            return computeF16AfterburnerThrust(caseRow.altitudeMeters) / 1000;
        case 'maxMach': {
            const speedMps = computeF16LevelFlightMaxSpeed(caseRow.altitudeMeters);
            return computeMachNumber(speedMps, caseRow.altitudeMeters);
        }
        case 'maxSpeedKmh': {
            const speedMps = computeF16LevelFlightMaxSpeed(caseRow.altitudeMeters);
            return speedMps * 3.6;
        }
        case 'minFlyingSpeedKts':
            return F16_PROFILE.minFlyingSpeedMps * MPS_TO_KTS;
        case 'peakMaxSpeedAltitudeM':
            return findF16PeakLevelFlightSpeed().altitudeMeters;
        default:
            throw new Error(`Unhandled metric: ${(caseRow as F16ReferenceCase).metric}`);
    }
}

describe('F-16 reference data vs flight model', () => {
    for (const caseRow of F16_REFERENCE_CASES) {
        it(`${caseRow.id}: ${caseRow.description}`, () => {
            const actual = evaluateFlightModel(caseRow);
            const delta = Math.abs(actual - caseRow.reference);

            assert.ok(
                delta <= caseRow.tolerance,
                [
                    caseRow.id,
                    `reference=${caseRow.reference}`,
                    `actual=${actual.toFixed(3)}`,
                    `delta=${delta.toFixed(3)}`,
                    `tolerance=${caseRow.tolerance}`,
                    `source=${caseRow.source}`,
                ].join(' | '),
            );
        });
    }
});

describe('F-16 reference table summary', () => {
    it('prints reference vs model comparison table', () => {
        const rows = F16_REFERENCE_CASES.map((caseRow) => {
            const actual = evaluateFlightModel(caseRow);
            const pass = Math.abs(actual - caseRow.reference) <= caseRow.tolerance;
            return {
                id: caseRow.id,
                reference: caseRow.reference,
                actual: Number(actual.toFixed(3)),
                tolerance: caseRow.tolerance,
                pass,
            };
        });

        console.table(rows);
        assert.ok(rows.every((row) => row.pass));
    });
});
