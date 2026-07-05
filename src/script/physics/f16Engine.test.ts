import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    adjustF16ThrottleInput,
    computeF16EngineThrustKn,
    computeF16SlThrustKn,
    formatF16ThrottleHud,
    getF16EngineNozzleColor,
    getF16ThrottleZone,
    stepF16ThrottleDetent,
    F16_ENGINE,
    F16_ENGINE_NOZZLE_COLORS,
} from './f16Engine';
import { F16_PROFILE } from './f16Profile';

describe('F-16 F100-PW-229 throttle quadrant', () => {
    it('lever 0 is flight idle (MIL 20%)', () => {
        assert.ok(Math.abs(computeF16SlThrustKn(0) - F16_ENGINE.idleThrustKn) < 0.01);
        assert.equal(formatF16ThrottleHud(0), 'MIL 20');
    });

    it('MIL ramps from lever 0 to 98% quadrant (MIL 100%)', () => {
        assert.ok(Math.abs(computeF16SlThrustKn(0.98) - F16_ENGINE.milThrustKn) < 0.01);
        assert.equal(formatF16ThrottleHud(0.98), 'MIL 100');
    });

    it('AB1 detent at 99% quadrant', () => {
        assert.ok(Math.abs(computeF16SlThrustKn(0.99) - F16_ENGINE.abMinThrustKn) < 0.01);
        assert.equal(formatF16ThrottleHud(0.99), 'AB1');
    });

    it('full lever gives max AB thrust at sea level', () => {
        assert.ok(Math.abs(computeF16EngineThrustKn(1.0, 0) - F16_ENGINE.abMaxThrustKn) < 0.1);
        assert.equal(formatF16ThrottleHud(1.0), 'AB2');
    });

    it('has no intermediate AB thrust between detents', () => {
        assert.ok(Math.abs(computeF16SlThrustKn(0.995) - F16_ENGINE.abMinThrustKn) < 0.01);
        assert.equal(formatF16ThrottleHud(0.995), 'AB1');
    });

    it('labels MIL, AB1, and AB2 zones on 0–100 quadrant', () => {
        assert.equal(formatF16ThrottleHud(0.5), 'MIL 61');
        assert.equal(formatF16ThrottleHud(F16_PROFILE.milLeverEnd), 'MIL 100');
        assert.equal(formatF16ThrottleHud(F16_PROFILE.abMinLeverEnd), 'AB1');
        assert.equal(formatF16ThrottleHud(1.0), 'AB2');
        assert.equal(getF16ThrottleZone(0.1), 'mil');
        assert.equal(getF16ThrottleZone(0.5), 'mil');
        assert.equal(getF16ThrottleZone(0.99), 'ab-min');
        assert.equal(getF16ThrottleZone(1.0), 'ab-max');
    });

    it('steps down from AB2 to AB1 then MIL 100', () => {
        assert.equal(stepF16ThrottleDetent(1.0, -1), F16_PROFILE.abMinLeverEnd);
        assert.equal(formatF16ThrottleHud(stepF16ThrottleDetent(1.0, -1)), 'AB1');
        assert.equal(stepF16ThrottleDetent(F16_PROFILE.abMinLeverEnd, -1), F16_PROFILE.milLeverEnd);
        assert.equal(formatF16ThrottleHud(stepF16ThrottleDetent(F16_PROFILE.abMinLeverEnd, -1)), 'MIL 100');
    });

    it('steps up from MIL 100 to AB1 then AB2 with no intermediate values', () => {
        assert.equal(adjustF16ThrottleInput(0.97, 0.02), F16_PROFILE.milLeverEnd);
        assert.equal(stepF16ThrottleDetent(F16_PROFILE.milLeverEnd, 1), F16_PROFILE.abMinLeverEnd);
        assert.equal(formatF16ThrottleHud(stepF16ThrottleDetent(F16_PROFILE.milLeverEnd, 1)), 'AB1');
        assert.equal(stepF16ThrottleDetent(F16_PROFILE.abMinLeverEnd, 1), 1);
        assert.equal(formatF16ThrottleHud(stepF16ThrottleDetent(F16_PROFILE.abMinLeverEnd, 1)), 'AB2');
    });

    it('maps throttle zones to solid nozzle colors', () => {
        assert.equal(getF16EngineNozzleColor(0.5), F16_ENGINE_NOZZLE_COLORS.mil);
        assert.equal(getF16EngineNozzleColor(0.98), F16_ENGINE_NOZZLE_COLORS.mil);
        assert.equal(getF16EngineNozzleColor(0.99), F16_ENGINE_NOZZLE_COLORS.abMin);
        assert.equal(getF16EngineNozzleColor(1.0), F16_ENGINE_NOZZLE_COLORS.abMax);
    });

    it('continuous ramp stops at MIL 100 without entering AB', () => {
        assert.equal(adjustF16ThrottleInput(0.97, 0.05), F16_PROFILE.milLeverEnd);
        assert.equal(adjustF16ThrottleInput(F16_PROFILE.milLeverEnd, 0.05), F16_PROFILE.milLeverEnd);
    });
});
