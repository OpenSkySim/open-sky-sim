import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FcsInput, FcsPitchLimiter, Fm2Fcs } from './fcs';
import { defaultFm2Config } from './fm2AircraftConfig';

const DEG = Math.PI / 180;

describe('Fm2Fcs pitch limiter strategies', () => {
    const dt = 1 / 120;

    const baseInput = (pitchStick: number, mode: FcsPitchLimiter): FcsInput => ({
        pitchStick,
        rollStick: 0,
        yawPedal: 0,
        pitchRate: 0,
        yawRate: 0,
        rollRate: 0,
        loadFactorG: 1,
        aoaRad: 5 * DEG,
        dynamicPressure: 8000,
        qRef: 11000,
        speed: 200,
        altitudeM: 3000,
        flapsExtended: false,
        landed: false,
        pitchLimiterMode: mode,
    });

    for (const mode of [FcsPitchLimiter.SOFT, FcsPitchLimiter.PREDICTIVE, FcsPitchLimiter.SMOOTH]) {
        it(`mode ${mode}: passes light stick through below the limit`, () => {
            const fcs = new Fm2Fcs(defaultFm2Config.fcs);
            for (let i = 0; i < 60; i++) {
                fcs.update(baseInput(0.4, mode), dt);
            }
            const out = fcs.getState();
            assert.ok(out.elevator > 0.2, `mode ${mode}: expected nose-up elevator, got ${out.elevator.toFixed(2)}`);
        });

        it(`mode ${mode}: withdraws pull authority at the AoA hard limit`, () => {
            const fcs = new Fm2Fcs(defaultFm2Config.fcs);
            const aoa = (defaultFm2Config.fcs.pitch.aoaLimitDeg + 4) * DEG;
            let out = fcs.getState();
            for (let i = 0; i < 120; i++) {
                out = fcs.update({ ...baseInput(1.0, mode), aoaRad: aoa }, dt);
            }
            assert.ok(out.elevator < 0.5,
                `mode ${mode}: elevator should back off past the AoA limit, got ${out.elevator.toFixed(2)}`);
        });
    }
});
