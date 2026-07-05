import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Fm2FlightModel } from './fm2FlightModel';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';

const DEG = 180 / Math.PI;

function airborne(model: Fm2FlightModel, altitude: number, speed: number, throttle: number): void {
    model.reset();
    model.position.set(0, altitude, 0);
    model.velocityVector = new THREE.Vector3(0, 0, speed);
    model.setLanded(false);
    model.setLandingGearDeployed(false);
    model.setFlapsExtended(false);
    model.setThrottle(throttle);
    model.syncEffectiveThrottle();
    model.snapPhysicsState();
}

/** Total angular speed magnitude (rad/s) between two orientations. */
function angularSpeed(a: THREE.Quaternion, b: THREE.Quaternion, dt: number): number {
    const dot = Math.min(1, Math.abs(a.dot(b)));
    return (2 * Math.acos(dot)) / dt;
}

describe('FM2 rigid-body flight model', () => {
    it('holds roughly level flight from a trimmed cruise', () => {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 250, 0.6);

        for (let i = 0; i < 8 * 120; i++) {
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'altitude went NaN');
        }

        assert.ok(!model.isCrashed(), 'should not crash in cruise');
        assert.ok(model.position.y > 2400 && model.position.y < 3700,
            `altitude drifted out of band: ${model.position.y.toFixed(0)} m`);
        assert.ok(model.velocityVector.length() > 150,
            `lost too much speed: ${model.velocityVector.length().toFixed(0)} m/s`);
        assert.ok(Math.abs(model.getAngleOfAttack()) * DEG < 15,
            `unreasonable trim AoA: ${(model.getAngleOfAttack() * DEG).toFixed(1)}°`);
    });

    it('rolls fast but the FBW caps the rate near ~300°/s', () => {
        const model = new Fm2FlightModel();
        airborne(model, 4000, 260, 0.7);
        model.setRoll(1.0);

        let peak = 0;
        let prev = model.quaternion.clone();
        for (let i = 0; i < 3 * 120; i++) {
            model.update(1 / 120);
            const now = model.quaternion;
            peak = Math.max(peak, angularSpeed(prev, now, 1 / 120));
            prev = now.clone();
        }

        const peakDegS = peak * DEG;
        assert.ok(peakDegS > 180, `roll rate too low: ${peakDegS.toFixed(0)}°/s`);
        assert.ok(peakDegS < 380, `roll rate exceeds FBW cap: ${peakDegS.toFixed(0)}°/s`);
    });

    it('pitches the nose up on aft stick', () => {
        const model = new Fm2FlightModel();
        airborne(model, 5000, 240, 0.7);
        model.setPitch(0.5);

        const fwd = new THREE.Vector3();
        for (let i = 0; i < 2 * 120; i++) {
            model.update(1 / 120);
        }
        fwd.set(0, 0, 1).applyQuaternion(model.quaternion);
        assert.ok(fwd.y > 0.1, `nose did not pitch up: forward.y=${fwd.y.toFixed(2)}`);
        assert.ok(model.getLoadFactorG() > 1.2, `no g build-up on pull: ${model.getLoadFactorG().toFixed(2)}g`);
    });

    it('does not exceed the structural g limit on a hard pull', () => {
        const model = new Fm2FlightModel();
        airborne(model, 6000, 320, 1.0);
        model.setPitch(1.0);

        let maxG = 0;
        for (let i = 0; i < 5 * 120; i++) {
            model.update(1 / 120);
            maxG = Math.max(maxG, model.getLoadFactorG());
            assert.ok(!Number.isNaN(maxG), 'g went NaN');
        }
        assert.ok(maxG < 11, `exceeded g envelope: ${maxG.toFixed(1)}g`);
    });

    it('sits stably on the runway with the engine at idle', () => {
        const model = new Fm2FlightModel();
        model.reset();
        model.position.set(1500, PLANE_DISTANCE_TO_GROUND, -800);
        model.setLanded(true);
        model.setThrottle(0);

        for (let i = 0; i < 4 * 120; i++) {
            model.update(1 / 120);
        }

        assert.ok(!model.isCrashed(), 'should not crash sitting on the ground');
        assert.ok(model.position.y > 1.0 && model.position.y < 2.6,
            `did not rest at ground height: ${model.position.y.toFixed(2)} m`);
        assert.ok(model.velocityVector.length() < 6,
            `drifted on the ground: ${model.velocityVector.length().toFixed(1)} m/s`);
    });

    it('accelerates down the runway and takes off', () => {
        const model = new Fm2FlightModel();
        model.reset();
        model.position.set(1500, PLANE_DISTANCE_TO_GROUND, -800);
        model.setLanded(true);
        model.setLandingGearDeployed(true);
        model.setFlapsExtended(true);
        model.setThrottle(1.0);
        model.syncEffectiveThrottle();

        let airborneNow = false;
        for (let i = 0; i < 60 * 120; i++) {
            const speed = model.velocityVector.length();
            model.setPitch(speed > 70 ? 0.4 : 0); // rotate past ~70 m/s
            model.update(1 / 120);
            if (model.isCrashed()) assert.fail(`crashed during takeoff at ${speed.toFixed(0)} m/s`);
            if (model.position.y > 15) { airborneNow = true; break; }
        }
        assert.ok(airborneNow, 'did not get airborne within time limit');
    });
});
