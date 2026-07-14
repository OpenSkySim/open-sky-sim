import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultFm2Config } from './fm2AircraftConfig';
import { FcsInput, Fm2Fcs, governPredictivePitchEnvelope } from './fcs';

const DEG = Math.PI / 180;
const pitch = defaultFm2Config.fcs.pitch;

describe('FM2 predictive pitch envelope governor', () => {
    it('leaves a manoeuvre fully available below the predicted envelope', () => {
        const result = governPredictivePitchEnvelope(
            { pitchStick: 1, aoaRad: 10 * DEG, loadFactorG: 4, dynamicPressure: 1, qRef: 1 },
            9.5, 0, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );

        assert.equal(result.commandedG, 9.5);
        assert.equal(result.pitchStick, 1);
        assert.equal(result.pitchLimitHi, 1);
        assert.equal(result.active, false);
    });

    it('removes pull demand and requests recovery before predicted AoA exceeds 28°', () => {
        const result = governPredictivePitchEnvelope(
            { pitchStick: 1, aoaRad: 27 * DEG, loadFactorG: 2, dynamicPressure: 0.1, qRef: 1 },
            9.5, 10 * DEG, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );

        assert.ok(result.commandedG < 1, `expected recovery G target, got ${result.commandedG.toFixed(2)}g`);
        assert.ok(result.pitchStick < 0, `expected recovery stick, got ${result.pitchStick.toFixed(2)}`);
        assert.ok(result.pitchLimitHi < 1, `expected reduced pull stop, got ${result.pitchLimitHi.toFixed(2)}`);
        assert.equal(result.active, true);
    });

    it('moves the effective pull stop smoothly as AoA approaches the limit', () => {
        const makeInput = (aoaDeg: number) => ({
            pitchStick: 1, aoaRad: aoaDeg * DEG, loadFactorG: 2, dynamicPressure: 1, qRef: 1,
        });
        const soft = governPredictivePitchEnvelope(
            makeInput(27), 9.5, 0, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );
        const middle = governPredictivePitchEnvelope(
            makeInput(27.5), 9.5, 0, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );
        const hard = governPredictivePitchEnvelope(
            makeInput(28), 9.5, 0, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );

        assert.ok(soft.pitchLimitHi > middle.pitchLimitHi);
        assert.ok(middle.pitchLimitHi > hard.pitchLimitHi);
        assert.equal(hard.pitchStick, hard.pitchLimitHi,
            'aft stick beyond the stop must not request more turn rate');
    });

    it('predicts positive-G overshoot and removes pull authority before 9.5g', () => {
        const result = governPredictivePitchEnvelope(
            { pitchStick: 1, aoaRad: 12 * DEG, loadFactorG: 9.4, dynamicPressure: 1, qRef: 1 },
            9.5, 0, 5, defaultFm2Config.fcs.actuatorTauS, pitch,
        );

        assert.ok(result.commandedG < 1, `expected recovery G target, got ${result.commandedG.toFixed(2)}g`);
        assert.ok(result.pitchLimitHi < 1);
        assert.equal(result.active, true);
    });
});

describe('FM2 Fcs authority filtering (high-AoA chatter suppression)', () => {
    const dt = 1 / 120;

    function baseInput(aoaDeg: number, pitchStick = 1): FcsInput {
        return {
            pitchStick, rollStick: 0, yawPedal: 0,
            pitchRate: 0, yawRate: 0, rollRate: 0,
            loadFactorG: 2, aoaRad: aoaDeg * DEG,
            dynamicPressure: 1, qRef: 1,
            speed: 200, altitudeM: 3000,
            limitersEnabled: true, flapsExtended: false, landed: false,
        };
    }

    it('does not snap the pull stop between frames when predicted AoA oscillates across the soft band', () => {
        // Regression for the "aggressive up/down" elevator chatter: a fast (~15+ Hz)
        // wobble in AoA right at the soft-band edge used to swing the governor's
        // raw authority (and therefore the elevator command) from full pull to
        // near-zero every single frame. The low-pass filter in Fm2Fcs.update
        // must keep the EXPOSED pull stop (and thus the G reference feeding the
        // PI loop) changing smoothly frame-to-frame even while the raw, noisy
        // prediction itself swings across the whole band.
        const fcs = new Fm2Fcs(defaultFm2Config.fcs);
        let prevLimitHi = 1;
        let maxStepDelta = 0;

        for (let i = 0; i < 240; i++) {
            // Oscillates AoA across ~23°-29°, straddling the 24°-28° soft band,
            // at a rate no real short-period bobble should exceed.
            const aoaDeg = 26 + 3 * Math.sin(i * 0.9);
            const out = fcs.update(baseInput(aoaDeg), dt);
            const delta = Math.abs(out.elevatorLimitHi - prevLimitHi);
            maxStepDelta = Math.max(maxStepDelta, delta);
            prevLimitHi = out.elevatorLimitHi;
        }

        assert.ok(maxStepDelta < 0.05,
            `pull stop snapped between frames: max per-step delta=${maxStepDelta.toFixed(3)}`);
    });

    it('converges to the same pull stop as the unfiltered governor once AoA settles', () => {
        // The filter must not prevent the governor from doing its job — it only
        // has to remove frame-to-frame chatter, not the underlying protection.
        // After settling at a steady AoA the filtered (stateful) result should
        // match the instantaneous (unfiltered) governor's output.
        const fcs = new Fm2Fcs(defaultFm2Config.fcs);
        let limitHi = 1;
        for (let i = 0; i < 240; i++) {
            limitHi = fcs.update(baseInput(29), dt).elevatorLimitHi;
        }
        const raw = governPredictivePitchEnvelope(
            { pitchStick: 1, aoaRad: 29 * DEG, loadFactorG: 2, dynamicPressure: 1, qRef: 1 },
            9.5, 0, 0, defaultFm2Config.fcs.actuatorTauS, pitch,
        );
        assert.ok(limitHi < 0.9, `pull stop failed to close at sustained 29° AoA: ${limitHi.toFixed(2)}`);
        assert.ok(Math.abs(limitHi - raw.pitchLimitHi) < 0.05,
            `filtered pull stop should settle near the unfiltered value: filtered=${limitHi.toFixed(2)} raw=${raw.pitchLimitHi.toFixed(2)}`);
    });
});

describe('FM2 Fcs governed pitch stick export', () => {
    const dt = 1 / 120;

    function baseInput(aoaDeg: number, pitchStick = 1): FcsInput {
        return {
            pitchStick, rollStick: 0, yawPedal: 0,
            pitchRate: 0, yawRate: 0, rollRate: 0,
            loadFactorG: 2, aoaRad: aoaDeg * DEG,
            dynamicPressure: 1, qRef: 1,
            speed: 200, altitudeM: 3000,
            limitersEnabled: true, flapsExtended: false, landed: false,
        };
    }

    it('exports governedPitchStick equal to the pull stop at hard AoA', () => {
        const fcs = new Fm2Fcs(defaultFm2Config.fcs);
        const out = fcs.update(baseInput(28), dt);

        assert.ok(out.elevatorLimitHi < 1, `expected reduced pull stop, got ${out.elevatorLimitHi.toFixed(2)}`);
        assert.equal(out.governedPitchStick, out.elevatorLimitHi,
            'aft stick beyond the stop must export the governed stick at the stop');
    });

    it('exports recovery stick when the envelope is exceeded', () => {
        const fcs = new Fm2Fcs(defaultFm2Config.fcs);
        let governed = 1;
        for (let i = 0; i < 120; i++) {
            governed = fcs.update({
                ...baseInput(24 + i * 0.05),
                dynamicPressure: 0.1,
            }, dt).governedPitchStick;
        }

        assert.ok(governed < 0,
            `expected recovery governed stick, got ${governed.toFixed(2)}`);
    });

    it('passes raw stick through with limiters OFF', () => {
        const fcs = new Fm2Fcs(defaultFm2Config.fcs);
        const out = fcs.update({ ...baseInput(27), limitersEnabled: false, pitchStick: 0.75 }, dt);

        assert.equal(out.governedPitchStick, 0.75);
    });
});
