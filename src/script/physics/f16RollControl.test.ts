import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    computeF16CommandedRollRate,
    computeF16RollDynamicPressureGain,
    computeF16RollYawCoupling,
    F16_ROLL_CAT1,
    maxRollRateRad,
    stepF16BodyRollRate,
} from './f16RollControl';

describe('F-16 RCAH roll control', () => {
    it('maps full stick to capped roll rate at cruise q', () => {
        const pCmd = computeF16CommandedRollRate({
            stick: 1,
            dynamicPressure: 8000,
            qRef: 8000,
            mach: 0.8,
            altitudeM: 3000,
            aoaRad: 0.05,
            flapsExtended: false,
            landed: false,
            config: F16_ROLL_CAT1,
        });
        assert.ok(pCmd > 0);
        assert.ok(pCmd <= maxRollRateRad(F16_ROLL_CAT1) + 1e-6);
    });

    it('reduces gain as dynamic pressure increases', () => {
        const lowQ = computeF16RollDynamicPressureGain(2000, 8000);
        const highQ = computeF16RollDynamicPressureGain(25000, 8000);
        assert.ok(highQ < lowQ);
    });

    it('applies Mach, altitude, and AoA limiters', () => {
        const baseline = computeF16CommandedRollRate({
            stick: 1,
            dynamicPressure: 8000,
            qRef: 8000,
            mach: 0.7,
            altitudeM: 5000,
            aoaRad: 0.05,
            flapsExtended: false,
            landed: false,
            config: F16_ROLL_CAT1,
        });
        const limited = computeF16CommandedRollRate({
            stick: 1,
            dynamicPressure: 8000,
            qRef: 8000,
            mach: 1.2,
            altitudeM: 15000,
            aoaRad: 0.5,
            flapsExtended: true,
            landed: false,
            config: F16_ROLL_CAT1,
        });
        assert.ok(limited < baseline);
    });

    it('lags toward commanded rate with actuator time constant', () => {
        const pCmd = maxRollRateRad(F16_ROLL_CAT1);
        let p = 0;
        for (let i = 0; i < 120; i++) {
            p = stepF16BodyRollRate(p, pCmd, 1 / 120, F16_ROLL_CAT1);
        }
        assert.ok(p > pCmd * 0.5);
        assert.ok(p < pCmd);
    });

    it('feeds yaw coupling at high AoA when rolling', () => {
        const coupling = computeF16RollYawCoupling(maxRollRateRad(F16_ROLL_CAT1), 0.35, maxRollRateRad(F16_ROLL_CAT1));
        assert.ok(Math.abs(coupling) > 0.1);
    });
});
