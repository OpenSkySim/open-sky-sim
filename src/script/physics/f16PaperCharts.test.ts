import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    liftToDragFromAlphaDeg,
    liftToDragVspaero,
    minGlideAngleDeg,
    findMinDragVelocityFps,
    minimumLevelFlightDragLb,
    simMatchesPaperAnalyticalConstants,
    simTotalDragLb,
    thrustRequiredLb,
} from './f16AnalyticalModel';
import {
    computeF16LevelFlightDrag,
} from './levelFlightEquilibrium';
import {
    F16_PAPER_ANALYTICAL,
    F16_PAPER_CHART_CASES,
    F16_PAPER_VSPAERO_CASES,
    F16PaperChartCase,
} from './f16PaperData';
import { F16_PROFILE } from './f16Profile';

function evaluatePaperChart(caseRow: F16PaperChartCase): number {
    switch (caseRow.metric) {
        case 'liftToDrag':
            if (caseRow.id === 'fig20_ld_max_vspaero') {
                return liftToDragVspaero(caseRow.alphaDeg ?? 4);
            }
            return liftToDragFromAlphaDeg(caseRow.alphaDeg ?? F16_PAPER_ANALYTICAL.maxLiftToDragAlphaDeg);
        case 'minGlideAngleDeg':
            return minGlideAngleDeg();
        case 'thrustRequiredLb':
        case 'totalDragLb':
            return simTotalDragLb(caseRow.velocityFps, caseRow.altitudeFt, caseRow.weightLb);
        case 'minTotalDragLb': {
            const swept = findMinDragVelocityFps(caseRow.altitudeFt, caseRow.weightLb);
            return swept.dragLb;
        }
        case 'cruiseSpeedFps':
            return F16_PROFILE.cruiseSpeedMps / 0.3048;
        default:
            throw new Error(`Unhandled paper chart metric: ${(caseRow as F16PaperChartCase).metric}`);
    }
}

describe('F-16 paper chart data vs analytical flight model', () => {
    it('uses Rehman analytical aero constants in the sim profile', () => {
        assert.ok(simMatchesPaperAnalyticalConstants());
    });

    for (const caseRow of F16_PAPER_CHART_CASES) {
        it(`${caseRow.figure} ${caseRow.id}: ${caseRow.description}`, () => {
            const actual = evaluatePaperChart(caseRow);
            const delta = Math.abs(actual - caseRow.reference);

            assert.ok(
                delta <= caseRow.tolerance,
                [
                    caseRow.figure,
                    caseRow.id,
                    `reference=${caseRow.reference}`,
                    `actual=${actual.toFixed(3)}`,
                    `delta=${delta.toFixed(3)}`,
                    `tolerance=${caseRow.tolerance}`,
                ].join(' | '),
            );
        });
    }
});

describe('F-16 VSPAero chart checkpoints (paper Section IV.B)', () => {
    for (const caseRow of F16_PAPER_VSPAERO_CASES) {
        it(`${caseRow.figure} ${caseRow.id}: ${caseRow.description}`, () => {
            const actual = evaluatePaperChart(caseRow);
            const delta = Math.abs(actual - caseRow.reference);

            assert.ok(
                delta <= caseRow.tolerance,
                `VSPAero L/D reference=${caseRow.reference} actual=${actual.toFixed(3)}`,
            );
        });
    }
});

describe('F-16 paper chart comparison table', () => {
    it('prints chart reference vs model values', () => {
        const rows = [...F16_PAPER_CHART_CASES, ...F16_PAPER_VSPAERO_CASES].map((caseRow) => {
            const actual = evaluatePaperChart(caseRow);
            const pass = Math.abs(actual - caseRow.reference) <= caseRow.tolerance;
            return {
                figure: caseRow.figure,
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

describe('F-16 thrust-required matches drag at chart points', () => {
    for (const caseRow of F16_PAPER_CHART_CASES.filter((c) => c.metric === 'thrustRequiredLb')) {
        it(`${caseRow.id}: thrust required equals total drag`, () => {
            const drag = simTotalDragLb(caseRow.velocityFps, caseRow.altitudeFt, caseRow.weightLb);
            const thrust = thrustRequiredLb(caseRow.velocityFps, caseRow.altitudeFt, caseRow.weightLb);
            assert.ok(Math.abs(thrust - drag) < 1e-6);
        });
    }
});

describe('F-16 paper drag matches level-flight equilibrium module', () => {
    for (const caseRow of F16_PAPER_CHART_CASES.filter((c) => c.metric === 'totalDragLb' || c.metric === 'thrustRequiredLb')) {
        it(`${caseRow.id}: analytical drag equals equilibrium solver`, () => {
            const massKg = caseRow.weightLb * 0.45359237;
            const speedMps = caseRow.velocityFps * 0.3048;
            const altitudeM = caseRow.altitudeFt * 0.3048;
            const analyticalLb = simTotalDragLb(caseRow.velocityFps, caseRow.altitudeFt, caseRow.weightLb);
            const equilibriumN = computeF16LevelFlightDrag(speedMps, altitudeM, massKg, false);
            const equilibriumLb = equilibriumN / 4.4482216153;
            assert.ok(Math.abs(analyticalLb - equilibriumLb) < 1);
        });
    }
});

describe('F-16 minimum drag equals W/(L/D)max', () => {
    it('MTOW minimum drag matches Fig. 7 peak efficiency', () => {
        const expected = minimumLevelFlightDragLb(F16_PAPER_ANALYTICAL.mtowLb);
        const at30k = findMinDragVelocityFps(30000, F16_PAPER_ANALYTICAL.mtowLb).dragLb;
        assert.ok(Math.abs(at30k - expected) < 50);
    });
});
