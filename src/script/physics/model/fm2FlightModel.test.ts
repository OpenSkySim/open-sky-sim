import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Fm2FlightModel } from './fm2FlightModel';
import { f16Fm2Config, fm2GroundRestHeight } from '../fm2/fm2AircraftConfig';
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

    it('holds the +9.5 g structural limit as a hard ceiling on a hard pull (limiters ON)', () => {
        const model = new Fm2FlightModel();
        airborne(model, 6000, 320, 1.0);
        model.setPitch(1.0);

        let maxG = 0;
        for (let i = 0; i < 5 * 120; i++) {
            model.update(1 / 120);
            maxG = Math.max(maxG, model.getLoadFactorG());
            assert.ok(!Number.isNaN(maxG), 'g went NaN');
        }
        // The g-deflection cap makes +9.5 g a hard ceiling: a hard pull loads up to
        // ~9.5 g and the rate-led cap arrests it there instead of the old ~10 g
        // transient overshoot.
        assert.ok(maxG > 9.2, `did not load up to the +9.5 g limit: ${maxG.toFixed(2)}g`);
        assert.ok(maxG < 9.8, `overshot the +9.5 g ceiling: ${maxG.toFixed(2)}g`);
    });

    it('holds the -3 g structural limit as a hard ceiling on a hard forward-stick push (limiters ON)', () => {
        // The g-deflection cap (with a longer −g prediction horizon) turns the −3 g
        // structural limit into a hard ceiling: a hard nose-over is held near −3 g
        // instead of the old ~−5 g windup. A dive adds energy so a small transient
        // overshoot remains, but it is bounded tight to the limit.
        const model = new Fm2FlightModel();
        airborne(model, 4000, 250, 1.0);

        let minG = 0;
        for (let i = 0; i < 5 * 120; i++) {
            model.setPitch(-1.0);
            model.update(1 / 120);
            minG = Math.min(minG, model.getLoadFactorG());
            assert.ok(!Number.isNaN(minG), 'g went NaN');
        }
        assert.ok(minG < -2.5, `forward stick did not push into negative g: ${minG.toFixed(2)}g`);
        assert.ok(minG > -3.4, `overshot the -3 g ceiling: ${minG.toFixed(2)}g`);
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

    it('A4E roll and yaw match the F-16 input convention', () => {
        const manifest = JSON.parse(fs.readFileSync('assets/a4e.aircraft.json', 'utf8'));
        const a4e = new Fm2FlightModel(manifest.flight);
        const f16 = new Fm2FlightModel();

        function rollAxisZ(model: Fm2FlightModel, stick: number): number {
            model.reset();
            model.position.set(0, 4000, 0);
            model.velocityVector.set(0, 0, 250);
            model.setLanded(false);
            model.setLandingGearDeployed(false);
            model.setFlapsExtended(false);
            model.setThrottle(0.6);
            model.syncEffectiveThrottle();
            model.setRoll(stick);
            const q0 = model.quaternion.clone();
            for (let i = 0; i < 30; i++) model.update(1 / 120);
            const dq = q0.clone().invert().multiply(model.quaternion);
            const angle = 2 * Math.acos(Math.min(1, Math.abs(dq.w)));
            const s = Math.sin(angle / 2);
            return s > 1e-6 ? dq.z / s : 0;
        }

        function yawHeadingDelta(model: Fm2FlightModel, pedal: number): number {
            model.reset();
            model.position.set(0, 4000, 0);
            model.velocityVector.set(0, 0, 250);
            model.setLanded(false);
            model.setLandingGearDeployed(false);
            model.setFlapsExtended(false);
            model.setThrottle(0.6);
            model.syncEffectiveThrottle();
            model.setYaw(pedal);
            const fwd0 = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);
            const h0 = Math.atan2(fwd0.x, fwd0.z);
            for (let i = 0; i < 120; i++) model.update(1 / 120);
            const fwd1 = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);
            const h1 = Math.atan2(fwd1.x, fwd1.z);
            let dh = h1 - h0;
            while (dh > Math.PI) dh -= 2 * Math.PI;
            while (dh < -Math.PI) dh += 2 * Math.PI;
            return dh;
        }

        const stick = 0.75;
        const a4eRoll = rollAxisZ(a4e, stick);
        const f16Roll = rollAxisZ(f16, stick);
        assert.ok(Math.sign(a4eRoll) === Math.sign(f16Roll) && Math.abs(a4eRoll) > 0.5,
            `roll axis mismatch: a4e z=${a4eRoll.toFixed(2)} f16 z=${f16Roll.toFixed(2)}`);

        const a4eYaw = yawHeadingDelta(a4e, stick);
        const f16Yaw = yawHeadingDelta(f16, stick);
        assert.ok(Math.sign(a4eYaw) === Math.sign(f16Yaw) && Math.abs(a4eYaw) > 0.05,
            `yaw sign mismatch: a4e=${(a4eYaw * DEG).toFixed(1)}° f16=${(f16Yaw * DEG).toFixed(1)}°`);
    });

    it('performs an emergent cobra with the FCS limiters OFF and recovers', () => {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 220, 0.15);
        // The pilot switches the fly-by-wire AoA/g limiters OFF (limiter override):
        // full aft stick then lets the always-active relaxed airframe cobra.
        model.setLimitersEnabled(false);

        let peakAoaDeg = 0;
        let maxAoaWithin2s = 0;
        let recovered = false;

        for (let i = 0; i < 8 * 120; i++) {
            const t = i / 120;
            model.setLimitersEnabled(false);
            model.setPitch(t < 1.5 ? 1.0 : 0.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');
            assert.ok(!model.isCrashed(), 'crashed during cobra');

            const aoaDeg = Math.abs(model.getAngleOfAttack()) * DEG;
            peakAoaDeg = Math.max(peakAoaDeg, aoaDeg);
            if (t <= 2) maxAoaWithin2s = Math.max(maxAoaWithin2s, aoaDeg);
            if (t > 2 && aoaDeg < 30) {
                recovered = true;
            }
        }

        assert.ok(maxAoaWithin2s > 80,
            `did not reach cobra AoA within 2s: ${maxAoaWithin2s.toFixed(0)}°`);
        assert.ok(peakAoaDeg < 135,
            `tumbled over the top instead of a cobra: peak ${peakAoaDeg.toFixed(0)}°`);
        assert.ok(model.velocityVector.length() < 150,
            `speed did not bleed enough: ${model.velocityVector.length().toFixed(0)} m/s`);
        assert.ok(recovered, 'did not recover to moderate AoA');
    });

    it('does NOT cobra with the FCS limiters ON (default) on identical stick input', () => {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 220, 0.15); // limiters default ON

        let peakAoaDeg = 0;
        for (let i = 0; i < 8 * 120; i++) {
            const t = i / 120;
            model.setPitch(t < 1.5 ? 1.0 : 0.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');
            assert.ok(!model.isCrashed(), 'crashed with limiters on');
            peakAoaDeg = Math.max(peakAoaDeg, Math.abs(model.getAngleOfAttack()) * DEG);
        }

        assert.ok(peakAoaDeg < 40,
            `airframe cobra'd with limiters ON (should be held): peak ${peakAoaDeg.toFixed(0)}°`);
    });

    it('holds AoA below the cobra regime at low speed (~300 km/h) with limiters ON', () => {
        // Regression for the low-dynamic-pressure AoA-limiter authority bug: at
        // ~83 m/s (300 km/h) a full aft-stick pull with the limiters ON used to
        // breach the FCS AoA limiter — the g-command law only caps COMMANDED g,
        // and at low q the airframe cannot even reach 1 g at the limit AoA, so the
        // loop kept commanding nose-up, the AoA ran past the always-active aft-CG
        // relaxation onset, and it diverged into a full "cobra" tumble (~180°).
        // With the direct AoA cap the limiter now holds AoA across the envelope.
        // The FBW AoA limit is 22°; the cap's rate lead settles the hold a few
        // degrees under it (~19°), comfortably below the 23° cobra CG-relaxation
        // onset, so it never departs.
        const model = new Fm2FlightModel();
        airborne(model, 3000, 83, 1.0); // ~300 km/h, full throttle, limiters ON

        let peakAoaDeg = 0;
        for (let i = 0; i < 8 * 120; i++) {
            model.setPitch(1.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');
            assert.ok(!model.isCrashed(), 'crashed at low speed with limiters on');
            peakAoaDeg = Math.max(peakAoaDeg, Math.abs(model.getAngleOfAttack()) * DEG);
        }

        assert.ok(peakAoaDeg < 28,
            `AoA limiter breached at ~300 km/h (cobra with limiters ON): peak ${peakAoaDeg.toFixed(0)}°`);
    });

    it('holds AoA at low speed for a mod-style config lacking the aoaLimiter fields (built-in defaults)', () => {
        // Runtime regression: aircraft flown in the sim get their Fm2AircraftConfig
        // from `.aircraft.json` manifests (mods) — NOT the hard-coded f16Fm2Config.
        // A manifest whose FBW pitch law predates the optional `aoaLimiter*` fields
        // leaves them `undefined`; the deflection cap must still engage from its
        // built-in defaults, otherwise full aft stick runs the AoA away into a
        // cobra even with the limiters ON (the live-sim bug). This config strips
        // those fields to reproduce exactly what such a manifest yields.
        const modConfig = JSON.parse(JSON.stringify(f16Fm2Config));
        delete modConfig.fcs.pitch.aoaLimiterGain;
        delete modConfig.fcs.pitch.aoaLimiterLeadS;
        assert.equal(modConfig.fcs.pitch.aoaLimiterGain, undefined, 'test setup: gain field must be absent');

        const model = new Fm2FlightModel(modConfig);
        airborne(model, 3000, 83, 1.0); // ~300 km/h, full throttle, limiters ON

        let peakAoaDeg = 0;
        for (let i = 0; i < 8 * 120; i++) {
            model.setPitch(1.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');
            assert.ok(!model.isCrashed(), 'crashed at low speed with limiters on');
            peakAoaDeg = Math.max(peakAoaDeg, Math.abs(model.getAngleOfAttack()) * DEG);
        }

        assert.ok(peakAoaDeg < 28,
            `AoA limiter (defaults) breached at ~300 km/h for a mod-style config: peak ${peakAoaDeg.toFixed(0)}°`);
    });

    it('a mod-style config lacking aoaLimiter fields still cobras with limiters OFF', () => {
        // The defaulted cap must not steal the limiters-OFF emergent cobra: turning
        // the FBW limiters off bypasses the cap, so the relaxed airframe still
        // departs on full aft stick and then recovers.
        const modConfig = JSON.parse(JSON.stringify(f16Fm2Config));
        delete modConfig.fcs.pitch.aoaLimiterGain;
        delete modConfig.fcs.pitch.aoaLimiterLeadS;

        const model = new Fm2FlightModel(modConfig);
        airborne(model, 3000, 220, 0.15);
        model.setLimitersEnabled(false);

        let maxAoaWithin2s = 0;
        let recovered = false;
        for (let i = 0; i < 8 * 120; i++) {
            const t = i / 120;
            model.setLimitersEnabled(false);
            model.setPitch(t < 1.5 ? 1.0 : 0.0);
            model.update(1 / 120);
            assert.ok(!model.isCrashed(), 'crashed during cobra');
            const aoaDeg = Math.abs(model.getAngleOfAttack()) * DEG;
            if (t <= 2) maxAoaWithin2s = Math.max(maxAoaWithin2s, aoaDeg);
            if (t > 2 && aoaDeg < 30) recovered = true;
        }
        assert.ok(maxAoaWithin2s > 80,
            `mod-style config did not cobra with limiters OFF: ${maxAoaWithin2s.toFixed(0)}°`);
        assert.ok(recovered, 'mod-style config did not recover from the cobra');
    });

    it('can enter a tail slide with backward body-frame velocity while nose stays high', () => {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 160, 0.05);
        // A tail slide is a post-stall departure: the airframe is deliberately
        // driven far past the FBW AoA limit. With the limiters ON the AoA limiter
        // holds the aircraft at its limit AoA across the whole speed envelope (so
        // aft stick just mushes — see the 300 km/h regression test), so a tail
        // slide, like the cobra, is only reachable with the limiters switched OFF.
        model.setLimitersEnabled(false);

        let sawBackwardBodyVel = false;
        let sawHighPitch = false;
        const inv = new THREE.Quaternion();
        const velBody = new THREE.Vector3();
        const fwd = new THREE.Vector3();

        for (let i = 0; i < 16 * 120; i++) {
            model.setLimitersEnabled(false);
            model.setPitch(1.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');

            inv.copy(model.quaternion).invert();
            velBody.copy(model.velocityVector).applyQuaternion(inv);
            fwd.set(0, 0, 1).applyQuaternion(model.quaternion);

            if (velBody.z < -5) sawBackwardBodyVel = true;
            if (fwd.y > 0.45) sawHighPitch = true;
            if (sawBackwardBodyVel && sawHighPitch) break;
        }

        assert.ok(sawHighPitch,
            `nose never stayed high during maneuver: forward.y=${fwd.y.toFixed(2)}`);
        assert.ok(sawBackwardBodyVel,
            `never developed backward body-frame velocity: velBody.z=${velBody.z.toFixed(1)} m/s`);
    });

    it('A4E rests on mesh-derived gear contacts', () => {
        const manifest = JSON.parse(fs.readFileSync('assets/a4e.aircraft.json', 'utf8'));
        const config = manifest.flight;
        const restY = fm2GroundRestHeight(config);
        assert.ok(restY > PLANE_DISTANCE_TO_GROUND,
            `expected deeper nose contact than F-16 rest height: ${restY.toFixed(3)} m`);

        const model = new Fm2FlightModel(config);
        model.reset();
        model.position.set(1500, restY, -800);
        model.setLanded(true);
        model.setThrottle(0);

        for (let i = 0; i < 4 * 120; i++) {
            model.update(1 / 120);
        }

        assert.ok(!model.isCrashed(), 'should not crash sitting on the ground');
        assert.ok(model.velocityVector.length() < 6,
            `drifted on the ground: ${model.velocityVector.length().toFixed(1)} m/s`);

        const contact = new THREE.Vector3();
        let minContactWorldY = Infinity;
        let maxContactWorldY = -Infinity;
        for (const p of config.gear.points as [number, number, number][]) {
            contact.set(p[0], p[1], p[2]).applyQuaternion(model.quaternion);
            const worldY = model.position.y + contact.y;
            minContactWorldY = Math.min(minContactWorldY, worldY);
            maxContactWorldY = Math.max(maxContactWorldY, worldY);
        }
        assert.ok(minContactWorldY <= 0.05,
            `deepest gear should touch ground: min world y=${minContactWorldY.toFixed(3)} m`);
        assert.ok(maxContactWorldY < 0.2,
            `no gear should float far above ground: max world y=${maxContactWorldY.toFixed(3)} m`);
    });
});

/**
 * Comprehensive behavioural coverage for the FM2 rigid-body model: control-axis
 * sign conventions, thrust/energy response, stall flagging, numerical robustness
 * under aggressive mixed inputs, the FCS-limiter toggle, and the no-aero
 * kinematic (DEBUG) mode.
 */
describe('FM2 flight model — comprehensive behavior', () => {
    /** Body RIGHT axis (+X) expressed in world space after the given roll hold. */
    function bankRightAxisY(stick: number): number {
        const model = new Fm2FlightModel();
        airborne(model, 4000, 260, 0.7);
        model.setRoll(stick);
        for (let i = 0; i < 60; i++) model.update(1 / 120);
        return new THREE.Vector3(1, 0, 0).applyQuaternion(model.quaternion).y;
    }

    it('banks in opposite, roughly symmetric directions for left vs right roll stick', () => {
        // Convention (regression guard): positive roll stick raises the right wing,
        // so the body +X (RIGHT) axis tilts up (world y > 0); negative stick mirrors it.
        const pos = bankRightAxisY(1.0);
        const neg = bankRightAxisY(-1.0);
        assert.ok(pos > 0.1, `positive roll did not bank: rightAxis.y=${pos.toFixed(2)}`);
        assert.ok(neg < -0.1, `negative roll did not bank the other way: rightAxis.y=${neg.toFixed(2)}`);
        assert.ok(Math.abs(pos + neg) < 0.15,
            `roll response is asymmetric: +stick=${pos.toFixed(2)} -stick=${neg.toFixed(2)}`);
    });

    it('yaws the heading in opposite, mirrored directions for opposite pedal', () => {
        function headingDelta(pedal: number): number {
            const model = new Fm2FlightModel();
            airborne(model, 4000, 240, 0.6);
            model.setYaw(pedal);
            const fwd0 = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);
            const h0 = Math.atan2(fwd0.x, fwd0.z);
            for (let i = 0; i < 150; i++) model.update(1 / 120);
            const fwd1 = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);
            let dh = Math.atan2(fwd1.x, fwd1.z) - h0;
            while (dh > Math.PI) dh -= 2 * Math.PI;
            while (dh < -Math.PI) dh += 2 * Math.PI;
            return dh;
        }
        const posPedal = headingDelta(1.0);
        const negPedal = headingDelta(-1.0);
        // Regression guard on the model's pedal convention: +yaw and -yaw swing the
        // heading opposite ways with comparable magnitude.
        assert.ok(posPedal < -0.02 && negPedal > 0.02,
            `pedal did not yaw in mirrored directions: +=${(posPedal * DEG).toFixed(1)}° -=${(negPedal * DEG).toFixed(1)}°`);
        assert.ok(Math.abs(posPedal + negPedal) < 0.2 * Math.max(Math.abs(posPedal), Math.abs(negPedal)) + 0.05,
            `yaw response is asymmetric: +=${(posPedal * DEG).toFixed(1)}° -=${(negPedal * DEG).toFixed(1)}°`);
    });

    it('accelerates under full thrust and decelerates at idle in level flight', () => {
        const fast = new Fm2FlightModel();
        airborne(fast, 4000, 180, 1.0);
        for (let i = 0; i < 6 * 120; i++) { fast.setPitch(0); fast.update(1 / 120); }
        assert.ok(fast.velocityVector.length() > 195,
            `full-AB level flight did not accelerate: ${fast.velocityVector.length().toFixed(0)} m/s`);

        const slow = new Fm2FlightModel();
        airborne(slow, 4000, 260, 0.0);
        for (let i = 0; i < 10 * 120; i++) { slow.setPitch(0); slow.update(1 / 120); }
        assert.ok(slow.velocityVector.length() < 250,
            `idle level flight did not decelerate: ${slow.velocityVector.length().toFixed(0)} m/s`);
        assert.ok(!fast.isCrashed() && !slow.isCrashed(), 'crashed during level acceleration test');
    });

    it('climbs when pulling with power applied', () => {
        const model = new Fm2FlightModel();
        airborne(model, 4000, 240, 1.0);
        for (let i = 0; i < 6 * 120; i++) { model.setPitch(0.5); model.update(1 / 120); }
        assert.ok(!model.isCrashed(), 'crashed during climb');
        assert.ok(model.position.y > 4050,
            `did not gain altitude in a powered climb: ${model.position.y.toFixed(0)} m`);
    });

    it('flags a stall when flown too slowly and clears it once flying again', () => {
        const model = new Fm2FlightModel();
        // Below the minimum flying speed. With the FBW AoA limiter ON the airframe
        // can no longer be pulled into an AoA stall (the limiter holds AoA and the
        // jet just mushes), so the physically meaningful stall here is the
        // low-airspeed one: flown this slowly the model must raise the stall flag.
        airborne(model, 6000, 62, 0.0);

        let sawStall = false;
        for (let i = 0; i < 3 * 120; i++) {
            model.setPitch(0.3);
            model.update(1 / 120);
            if (model.getStallStatus() > 0) sawStall = true;
            if (model.isCrashed()) break;
        }
        assert.ok(sawStall, 'never flagged a stall in slow flight');

        // Now fly it fast and level; the stall flag should clear.
        airborne(model, 6000, 260, 0.8);
        for (let i = 0; i < 2 * 120; i++) { model.setPitch(0); model.update(1 / 120); }
        assert.ok(model.getStallStatus() < 0,
            `stall flag did not clear in fast level flight: ${model.getStallStatus().toFixed(2)}`);
    });

    it('stays finite and within a sane envelope through an aggressive mixed-input sequence', () => {
        const model = new Fm2FlightModel();
        airborne(model, 5000, 230, 0.8);

        for (let i = 0; i < 25 * 120; i++) {
            const t = i / 120;
            // Deterministic but varied stick/pedal/throttle sweeps, incl. a limiter-off burst.
            model.setPitch(Math.sin(t * 1.7) * 0.9);
            model.setRoll(Math.sin(t * 0.9 + 1) * 1.0);
            model.setYaw(Math.sin(t * 0.5) * 0.6);
            model.setThrottle(0.5 + 0.5 * Math.sin(t * 0.3));
            model.setLimitersEnabled(t < 8 || t > 12);
            model.update(1 / 120);

            assert.ok(Number.isFinite(model.position.x) && Number.isFinite(model.position.y)
                && Number.isFinite(model.position.z), `position went non-finite at t=${t.toFixed(1)}s`);
            assert.ok(Number.isFinite(model.velocityVector.length()), `velocity went NaN at t=${t.toFixed(1)}s`);
            assert.ok(!Number.isNaN(model.getAngleOfAttack()), `AoA went NaN at t=${t.toFixed(1)}s`);
            assert.ok(model.velocityVector.length() < 500,
                `speed ran away to ${model.velocityVector.length().toFixed(0)} m/s at t=${t.toFixed(1)}s`);
        }
    });

    it('defaults to limiters ON and reflects the toggle', () => {
        const model = new Fm2FlightModel();
        assert.equal(model.isLimitersEnabled(), true, 'limiters should default ON');
        model.setLimitersEnabled(false);
        assert.equal(model.isLimitersEnabled(), false, 'toggle to OFF not reflected');
        model.setLimitersEnabled(true);
        assert.equal(model.isLimitersEnabled(), true, 'toggle back to ON not reflected');
        model.reset();
        assert.equal(model.isLimitersEnabled(), true, 'reset should restore limiters ON');
    });

    it('exposes FCS-commanded surface deflections that reflect the AoA limiter and preserve stick polarity', () => {
        // Low-AoA aft stick: the visible elevator command must deflect the SAME way
        // as the pilot stick (positive = nose-up / aft) so the aircraft defs' signs
        // still render correctly.
        const lowAoa = new Fm2FlightModel();
        airborne(lowAoa, 4000, 240, 0.8);
        for (let i = 0; i < 10; i++) { lowAoa.setPitch(1.0); lowAoa.update(1 / 120); }
        assert.ok(lowAoa.getCommandedElevator() > 0.2,
            `aft stick should deflect the elevator nose-up: ${lowAoa.getCommandedElevator().toFixed(2)}`);
        assert.ok(Math.abs(lowAoa.getAngleOfAttack()) * DEG < 6, 'setup: should still be at low AoA');

        // Limiters OFF: full aft stick holds (near-)full nose-up deflection — the
        // unlimited reference for the visible limiter effect.
        const off = new Fm2FlightModel();
        airborne(off, 3000, 83, 1.0);
        let offCmd = 0;
        // Peak over the pull: full aft stick drives the stabilator to (near-)full
        // nose-up before the high-AoA recovery fade bleeds it back for the cobra
        // to fall out of the top.
        for (let i = 0; i < 4 * 120; i++) { off.setLimitersEnabled(false); off.setPitch(1.0); off.update(1 / 120); offCmd = Math.max(offCmd, off.getCommandedElevator()); }
        assert.ok(offCmd > 0.9,
            `limiters OFF should hold full nose-up deflection: ${offCmd.toFixed(2)}`);

        // At the AoA limit with limiters ON the commanded elevator must back off
        // (the visible limiter effect) vs. the same full-stick pull with limiters
        // OFF — the cap is fading the nose-up deflection to hold the limit AoA.
        const limited = new Fm2FlightModel();
        airborne(limited, 3000, 83, 1.0);
        let atLimitCmd = 0;
        for (let i = 0; i < 8 * 120; i++) {
            limited.setPitch(1.0);
            limited.update(1 / 120);
            if (Math.abs(limited.getAngleOfAttack()) * DEG > 12) atLimitCmd = limited.getCommandedElevator();
        }
        assert.ok(atLimitCmd < offCmd,
            `limiter should reduce commanded elevator at the AoA limit vs limiters-off: ${atLimitCmd.toFixed(2)} vs ${offCmd.toFixed(2)}`);

        // Roll / yaw commands keep the pilot-stick polarity (right stick → positive).
        const roll = new Fm2FlightModel();
        airborne(roll, 4000, 260, 0.7);
        roll.setRoll(1.0); roll.update(1 / 120);
        assert.ok(roll.getCommandedAileron() > 0, `right roll stick should give positive aileron: ${roll.getCommandedAileron().toFixed(2)}`);

        const yaw = new Fm2FlightModel();
        airborne(yaw, 4000, 240, 0.6);
        yaw.setYaw(1.0); yaw.update(1 / 120);
        assert.ok(yaw.getCommandedRudder() > 0, `right pedal should give positive rudder: ${yaw.getCommandedRudder().toFixed(2)}`);
    });

    it('flies DIRECT LAW with limiters OFF: stick maps straight to the surfaces, uncapped', () => {
        // With the FBW limiters OFF the FCS stops governing the controls — pilot
        // stick/pedal map straight to the normalized surface command (only the
        // physical actuator lag remains). Verify each axis tracks its stick
        // proportionally, monotonically and with the correct polarity.
        const settle = (m: Fm2FlightModel, set: (v: number) => void, v: number, n = 30): void => {
            for (let i = 0; i < n; i++) { m.setLimitersEnabled(false); set(v); m.update(1 / 120); }
        };

        // Pitch: elevator ≈ pitch stick, proportional and increasing.
        let prevElev = -Infinity;
        for (const s of [0.25, 0.5, 0.75, 1.0]) {
            const m = new Fm2FlightModel();
            airborne(m, 4000, 260, 0.7);
            m.setLimitersEnabled(false);
            settle(m, (v) => m.setPitch(v), s);
            const e = m.getCommandedElevator();
            assert.ok(Math.abs(e - s) < 0.08, `direct elevator should track stick ${s}: got ${e.toFixed(2)}`);
            assert.ok(e > prevElev, `direct elevator should increase with stick: ${e.toFixed(2)} !> ${prevElev.toFixed(2)}`);
            prevElev = e;
        }

        // Roll: aileron keeps pilot polarity (right stick → positive) and scales.
        let prevAil = -Infinity;
        for (const s of [0.4, 0.7, 1.0]) {
            const m = new Fm2FlightModel();
            airborne(m, 4000, 260, 0.7);
            m.setLimitersEnabled(false);
            settle(m, (v) => m.setRoll(v), s, 10);
            const a = m.getCommandedAileron();
            assert.ok(a > 0, `direct right-roll aileron should be positive at ${s}: ${a.toFixed(2)}`);
            assert.ok(a > prevAil, `direct aileron should increase with stick: ${a.toFixed(2)} !> ${prevAil.toFixed(2)}`);
            prevAil = a;
        }

        // Yaw: rudder keeps pilot polarity (right pedal → positive) and scales.
        let prevRud = -Infinity;
        for (const s of [0.4, 0.7, 1.0]) {
            const m = new Fm2FlightModel();
            airborne(m, 4000, 240, 0.6);
            m.setLimitersEnabled(false);
            settle(m, (v) => m.setYaw(v), s, 10);
            const r = m.getCommandedRudder();
            assert.ok(r > 0, `direct right-pedal rudder should be positive at ${s}: ${r.toFixed(2)}`);
            assert.ok(r > prevRud, `direct rudder should increase with pedal: ${r.toFixed(2)} !> ${prevRud.toFixed(2)}`);
            prevRud = r;
        }

        // Uncapped: full aft stick with limiters OFF holds (near-)full nose-up
        // elevator even after AoA blows PAST the 22° FBW limit — no AoA/g cap. With
        // limiters ON the same pull is capped (elevator backs off at the limit).
        const off = new Fm2FlightModel();
        airborne(off, 4000, 260, 0.7);
        let offAoaExceeded = false;
        for (let i = 0; i < 60; i++) {
            off.setLimitersEnabled(false); off.setPitch(1.0); off.update(1 / 120);
            if (Math.abs(off.getAngleOfAttack()) * DEG > 25) offAoaExceeded = true;
        }
        assert.ok(offAoaExceeded, 'limiters OFF: direct pull should drive AoA past the FBW limit');
        assert.ok(off.getCommandedElevator() > 0.9,
            `limiters OFF: elevator should stay uncapped at full stick: ${off.getCommandedElevator().toFixed(2)}`);
    });

    it('kinematic (DEBUG) free-fly drives visible surfaces straight from raw stick', () => {
        const model = new Fm2FlightModel(f16Fm2Config, { kinematic: true });
        model.reset();
        model.position.set(0, 3000, 0);
        model.velocityVector = new THREE.Vector3(0, 0, 120);
        model.setLanded(false);
        model.setThrottle(0.5);
        model.syncEffectiveThrottle();
        model.snapPhysicsState();
        model.setPitch(0.7); model.setRoll(-0.4); model.setYaw(0.3);
        model.update(1 / 120);
        assert.ok(Math.abs(model.getCommandedElevator() - 0.7) < 1e-6, 'kinematic elevator should equal raw pitch');
        assert.ok(Math.abs(model.getCommandedAileron() - (-0.4)) < 1e-6, 'kinematic aileron should equal raw roll');
        assert.ok(Math.abs(model.getCommandedRudder() - 0.3) < 1e-6, 'kinematic rudder should equal raw yaw');
    });

    it('kinematic (DEBUG) free-fly rotates directly, tracks throttle speed, and stays above ground', () => {
        const model = new Fm2FlightModel(f16Fm2Config, { kinematic: true });
        model.reset();
        model.position.set(0, 3000, 0);
        model.velocityVector = new THREE.Vector3(0, 0, 120);
        model.setLanded(false);
        model.setThrottle(0.5);
        model.syncEffectiveThrottle();
        model.snapPhysicsState();

        const before = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion).clone();
        for (let i = 0; i < 1 * 120; i++) { model.setPitch(1.0); model.update(1 / 120); }
        const after = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);

        assert.ok(!Number.isNaN(model.position.y), 'kinematic mode went NaN');
        assert.ok(before.angleTo(after) > 0.2, 'stick did not directly rotate the airframe in kinematic mode');
        // No aerodynamics: speed follows the throttle lever (throttle * MAX_SPEED = 0.5 * 250).
        assert.ok(Math.abs(model.velocityVector.length() - 125) < 5,
            `kinematic speed should track throttle: ${model.velocityVector.length().toFixed(0)} m/s`);
        assert.ok(model.position.y >= PLANE_DISTANCE_TO_GROUND,
            `kinematic mode sank below ground: ${model.position.y.toFixed(0)} m`);
        assert.ok(!model.isCrashed(), 'kinematic mode should not crash in free flight');
    });
});
