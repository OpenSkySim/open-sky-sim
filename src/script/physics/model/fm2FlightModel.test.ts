import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Fm2FlightModel } from './fm2FlightModel';
import { defaultFm2Config, fm2GroundRestHeight } from '../fm2/fm2AircraftConfig';
import { AeroSurface, liftCoefficient, SurfaceInput } from '../fm2/aeroSurface';
import { SurfaceGeometry } from '../fm2/fm2Constants';
import { forebodyAsymmetryCy, Fm2ForebodyAsymmetryConfig } from '../fm2/forebodyAsymmetry';
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

    it('rolls at a healthy tail-dominant rate under the FBW cap', () => {
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

        // Roll is tail-dominant (~80% differential stabilator / ~20% aileron).
        // The horizontal tails sit close to the centreline (roll arm ≈ ±1.5 m vs
        // the ailerons' ±3.4 m), so a tail-driven roll is inherently slower than
        // an aileron-driven one — peak ~150°/s rather than ~185°/s — but still a
        // brisk fighter roll comfortably under the FBW rate cap.
        const peakDegS = peak * DEG;
        assert.ok(peakDegS > 130, `roll rate too low: ${peakDegS.toFixed(0)}°/s`);
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

    it('loads heavy positive g on a hard pull and stays under the +9.5 g ceiling (limiters ON)', () => {
        const model = new Fm2FlightModel();
        airborne(model, 6000, 320, 1.0);
        model.setPitch(1.0);

        let maxG = 0;
        for (let i = 0; i < 5 * 120; i++) {
            model.update(1 / 120);
            maxG = Math.max(maxG, model.getLoadFactorG());
            assert.ok(!Number.isNaN(maxG), 'g went NaN');
        }
        // With the realistic smooth lift curve the wing's achievable CLmax (a
        // rounded peak, not a hard clamp) caps the attainable instantaneous g at
        // this condition BELOW the 9.5 g structural cap: a hard pull loads up to
        // ~8.6 g and is lift/AoA-limited, never breaching the +9.5 g ceiling.
        assert.ok(maxG > 8.0, `did not load up under a hard pull: ${maxG.toFixed(2)}g`);
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

    it('does not oscillate on sustained high-speed turn pull (limiters ON)', () => {
        // Regression for PI ↔ g-cap limit-cycle hunting during coordinated turns
        // at high dynamic pressure: hard roll + aft stick should load up without
        // large-amplitude G or elevator chatter, and must stay under +9.5 g.
        const model = new Fm2FlightModel();
        airborne(model, 5000, 206, 1.0); // ~400 kt

        const gSamples: number[] = [];
        const elevSamples: number[] = [];
        let maxG = 0;

        for (let i = 0; i < 5 * 120; i++) {
            model.setRoll(1.0);
            model.setPitch(0.85);
            model.update(1 / 120);
            assert.ok(!model.isCrashed(), 'crashed during high-speed turn pull');
            assert.ok(!Number.isNaN(model.getLoadFactorG()), 'g went NaN');
            if (i >= 120) {
                gSamples.push(model.getLoadFactorG());
                elevSamples.push(model.getCommandedElevator());
                maxG = Math.max(maxG, model.getLoadFactorG());
            }
        }

        const stddev = (arr: number[]): number => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
        };

        const gStd = stddev(gSamples);
        const elevStd = stddev(elevSamples);

        assert.ok(maxG < 9.8, `overshot the +9.5 g ceiling in turn: ${maxG.toFixed(2)}g`);
        assert.ok(gStd < 1.5,
            `G oscillation too large during turn pull: stddev=${gStd.toFixed(2)}g`);
        assert.ok(elevStd < 0.25,
            `elevator chatter during turn pull: stddev=${elevStd.toFixed(3)}`);
    });

    it('stays well-damped in a transonic overspeed (no hands-off load-factor limit cycle)', () => {
        // Regression for the transonic short-period limit cycle: at ~Mach 0.98 the
        // fixed FCS actuator/sensor lag erodes the short-period phase margin faster
        // than the natural (geometric) damping grows, so WITHOUT the transonic
        // pitch-damping augmentation the load factor rings ~-4 g <-> +8 g even at
        // NEUTRAL stick. The added Cmq (ramped in above the maneuvering envelope)
        // must hold it near 1 g here while leaving the normal envelope untouched.
        const model = new Fm2FlightModel();
        airborne(model, 1200, 329, 0.95); // ~Mach 0.98 near sea level

        const gSamples: number[] = [];
        for (let i = 0; i < 4 * 120; i++) {
            model.setPitch(0);
            model.setRoll(0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.getLoadFactorG()), 'g went NaN');
            if (i >= 60) {
                gSamples.push(model.getLoadFactorG());
            }
        }
        const mean = gSamples.reduce((a, b) => a + b, 0) / gSamples.length;
        const gStd = Math.sqrt(gSamples.reduce((s, v) => s + (v - mean) ** 2, 0) / gSamples.length);
        assert.ok(gStd < 0.5,
            `transonic load-factor limit cycle not damped: stddev=${gStd.toFixed(2)}g`);
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

    it('imported mod roll and yaw match the default input convention', () => {
        const manifest = JSON.parse(fs.readFileSync('assets/mod.aircraft.json', 'utf8'));
        const mod = new Fm2FlightModel(manifest.flight);
        const base = new Fm2FlightModel();

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
        const modRoll = rollAxisZ(mod, stick);
        const baseRoll = rollAxisZ(base, stick);
        assert.ok(Math.sign(modRoll) === Math.sign(baseRoll) && Math.abs(modRoll) > 0.5,
            `roll axis mismatch: mod z=${modRoll.toFixed(2)} base z=${baseRoll.toFixed(2)}`);

        const modYaw = yawHeadingDelta(mod, stick);
        const baseYaw = yawHeadingDelta(base, stick);
        assert.ok(Math.sign(modYaw) === Math.sign(baseYaw) && Math.abs(modYaw) > 0.05,
            `yaw sign mismatch: mod=${(modYaw * DEG).toFixed(1)}° base=${(baseYaw * DEG).toFixed(1)}°`);
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
        // Substantial speed bleed from the ~220 m/s entry. With the smooth,
        // realistic lift curve post-stall CL (and its induced drag) is lower, so
        // the cobra bleeds a little less energy and exits around ~172 m/s — still
        // a ~22% energy bleed for a genuine departure-and-recover.
        assert.ok(model.velocityVector.length() < 185,
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
        // from `.aircraft.json` manifests (mods) — NOT the hard-coded defaultFm2Config.
        // A manifest whose FBW pitch law predates the optional `aoaLimiter*` fields
        // leaves them `undefined`; the deflection cap must still engage from its
        // built-in defaults, otherwise full aft stick runs the AoA away into a
        // cobra even with the limiters ON (the live-sim bug). This config strips
        // those fields to reproduce exactly what such a manifest yields.
        const modConfig = JSON.parse(JSON.stringify(defaultFm2Config));
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
        const modConfig = JSON.parse(JSON.stringify(defaultFm2Config));
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

    it('enters a deep vertical post-stall mush that nearly arrests forward speed while the nose stays high', () => {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 160, 0.05);
        // A deep post-stall departure: the airframe is deliberately driven far past
        // the FBW AoA limit. With the limiters ON the AoA limiter holds the aircraft
        // at its limit AoA across the whole speed envelope (so aft stick just
        // mushes — see the 300 km/h regression test), so this, like the cobra, is
        // only reachable with the limiters switched OFF. With the smooth realistic
        // lift curve the reduced post-stall lift no longer flings the jet into a
        // true rearward slide; instead the nose swings fully vertical and the
        // forward body-frame speed bleeds almost to zero (a near tail slide).
        model.setLimitersEnabled(false);

        let sawHighPitch = false;
        let minVelBodyZ = Infinity;
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

            minVelBodyZ = Math.min(minVelBodyZ, velBody.z);
            if (fwd.y > 0.45) sawHighPitch = true;
            if (sawHighPitch && minVelBodyZ < 15) break;
        }

        assert.ok(sawHighPitch,
            `nose never stayed high during maneuver: forward.y=${fwd.y.toFixed(2)}`);
        assert.ok(minVelBodyZ < 15,
            `forward speed never bled into a deep mush: min velBody.z=${minVelBodyZ.toFixed(1)} m/s`);
    });

    it('imported mod rests on mesh-derived gear contacts', () => {
        const manifest = JSON.parse(fs.readFileSync('assets/mod.aircraft.json', 'utf8'));
        const config = manifest.flight;
        const restY = fm2GroundRestHeight(config);
        assert.ok(restY > PLANE_DISTANCE_TO_GROUND,
            `expected deeper nose contact than default rest height: ${restY.toFixed(3)} m`);

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
        // nose-up and holds it there — there is no automatic fade. Whether the
        // airframe actually cobras and falls back out of the top is decided
        // entirely by the real airframe aerodynamics, not by this FCS command.
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
        const model = new Fm2FlightModel(defaultFm2Config, { kinematic: true });
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
        const model = new Fm2FlightModel(defaultFm2Config, { kinematic: true });
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

/**
 * Unsteady high-AoA aerodynamics after Ericsson, "Cobra Maneuver Considerations"
 * (ICAS-92-4.6R, 1992): dynamic pitching makes flow separation and forebody-
 * vortex breakdown lag the geometric AoA, so a rapid pitch-up keeps lift attached
 * past the static stall (dynamic-lift overshoot) and reattachment lags on the way
 * down (hysteresis) — the mechanism that lets the cobra depart and recover. The
 * attached (potential-flow) lift stays instantaneous; only the separation blend
 * and the vortex window are lagged by the per-surface `unsteadyTauS`.
 */
describe('FM2 unsteady high-AoA aerodynamics (Ericsson cobra hysteresis)', () => {
    const RAD = Math.PI / 180;

    it('liftCoefficient shows separation hysteresis: pitch-up holds more lift, pitch-down less', () => {
        const slope = 5.2, stall = 24 * RAD, alpha0 = -1.3 * RAD, clMax = 1.5;
        const aoa = 35 * RAD; // post-stall geometric AoA
        // Quasi-steady: the separated flow sees the geometric AoA (default arg).
        const clQuasi = liftCoefficient(aoa, slope, stall, 0, alpha0, clMax);
        // Rapid pitch-up: the separated flow still "sees" a pre-stall angle, so
        // lift stays attached and higher than the quasi-steady value.
        const clPitchUp = liftCoefficient(aoa, slope, stall, 0, alpha0, clMax, 17 * RAD);
        // Pitch-down: separation persists from a higher angle, so lift lags lower.
        const clPitchDown = liftCoefficient(aoa, slope, stall, 0, alpha0, clMax, 52 * RAD);
        assert.ok(clPitchUp > clQuasi + 0.1,
            `pitch-up should hold more lift: up=${clPitchUp.toFixed(3)} quasi=${clQuasi.toFixed(3)}`);
        assert.ok(clPitchDown < clQuasi - 0.03,
            `pitch-down should make less lift: down=${clPitchDown.toFixed(3)} quasi=${clQuasi.toFixed(3)}`);
    });

    it('AeroSurface lift relaxes over time after an AoA step; quasi-steady is instantaneous', () => {
        function makeGeom(tau?: number): SurfaceGeometry {
            return {
                name: 'test', position: [0, 0, 0], up: [0, 1, 0], forward: [0, 0, 1],
                areaM2: 1, liftSlopePerRad: 5.2, zeroLiftAoaRad: -1.3 * RAD, clMax: 1.5,
                stallAoaRad: 24 * RAD, cd0: 0.01, inducedK: 0.1, flatPlateCd: 1.9,
                controlEffectiveness: 0, unsteadyTauS: tau,
            };
        }
        const V = 100, dt = 1 / 120, q = 0.5 * 1.0 * V * V;
        function input(aoaRad: number): SurfaceInput {
            return {
                velocityBody: new THREE.Vector3(0, -Math.sin(aoaRad) * V, Math.cos(aoaRad) * V),
                angularVelocityBody: new THREE.Vector3(0, 0, 0),
                airDensity: 1.0, controlDeltaAoaRad: 0, camberBiasRad: 0,
                stallShiftRad: 0, extraCd: 0, dt,
            };
        }
        // CL (area = 1) after advancing `steps` at a fixed AoA.
        function clAfterStep(surf: AeroSurface, steps: number, aoaRad: number): number {
            const f = new THREE.Vector3(), m = new THREE.Vector3();
            for (let i = 0; i < steps; i++) { f.set(0, 0, 0); m.set(0, 0, 0); surf.accumulate(input(aoaRad), f, m); }
            return surf.liftForceBody.length() / q;
        }
        const hi = 40 * RAD;
        // Unsteady surface: settle at ~0° AoA, then step to 40°.
        const uns = new AeroSurface(makeGeom(0.3));
        clAfterStep(uns, 1, 0);
        const clFirst = clAfterStep(uns, 1, hi);
        const clSettled = clAfterStep(uns, 240, hi); // ~2 s → converged
        assert.ok(clFirst > clSettled + 0.15,
            `separated lift should overshoot right after the step: first=${clFirst.toFixed(3)} settled=${clSettled.toFixed(3)}`);
        // Quasi-steady surface (no tau): the high-AoA CL is reached immediately.
        const qs = new AeroSurface(makeGeom(undefined));
        clAfterStep(qs, 1, 0);
        const qsFirst = clAfterStep(qs, 1, hi);
        const qsSettled = clAfterStep(qs, 240, hi);
        assert.ok(Math.abs(qsFirst - qsSettled) < 0.02,
            `quasi-steady CL should not relax: first=${qsFirst.toFixed(3)} settled=${qsSettled.toFixed(3)}`);
        // The unsteady surface converges to the same steady CL as the quasi-steady one.
        assert.ok(Math.abs(clSettled - qsSettled) < 0.02,
            `unsteady should converge to the quasi-steady CL: ${clSettled.toFixed(3)} vs ${qsSettled.toFixed(3)}`);
    });

    it('cobra stays laterally symmetric (no roll/yaw departure) with limiters OFF', () => {
        // Ericsson: the cobra requires symmetric separation — no lateral departure.
        // Our airframe is modelled symmetric, so a pure aft-stick cobra must keep
        // the velocity in the plane of symmetry (negligible body-frame sideslip).
        const model = new Fm2FlightModel();
        airborne(model, 3000, 220, 0.15);
        model.setLimitersEnabled(false);
        const inv = new THREE.Quaternion();
        const velBody = new THREE.Vector3();
        let maxLateral = 0;
        for (let i = 0; i < 8 * 120; i++) {
            const t = i / 120;
            model.setLimitersEnabled(false);
            model.setPitch(t < 1.5 ? 1.0 : 0.0);
            model.update(1 / 120);
            inv.copy(model.quaternion).invert();
            velBody.copy(model.velocityVector).applyQuaternion(inv);
            maxLateral = Math.max(maxLateral, Math.abs(velBody.x));
        }
        assert.ok(maxLateral < 2,
            `cobra developed a lateral (yaw/roll) departure: max |velBody.x|=${maxLateral.toFixed(2)} m/s`);
    });
});

/**
 * Forebody vortex asymmetry — the high-alpha "nose slice" — after Ericsson,
 * "Cobra Maneuver Considerations" (ICAS-92-4.6R, 1992). The paper's central
 * finding is LATERAL: a slender forebody sheds an asymmetric vortex pair above a
 * critical AoA whose side force, on the long nose arm, makes a large yawing
 * moment the fins cannot counter (a nose slice). Which way it locks in is set by
 * the coupling between boundary-layer transition and the vehicle's own motion —
 * a coupling that only develops in LAMINAR / subscale flow. At full-scale
 * Reynolds numbers it is suppressed, which is why the real Su-27 / MiG-29 cobra
 * stays symmetric. The model exposes this as a Reynolds "regime" flag: full-scale
 * (default) is inert and symmetric; subscale/laminar departs into a nose slice.
 */
describe('FM2 forebody vortex asymmetry (Ericsson nose slice / Reynolds coupling)', () => {
    const RAD = Math.PI / 180;

    const cfg: Fm2ForebodyAsymmetryConfig = {
        armZ: 3.6, refAreaM2: 27.87, onsetAoaRad: 35 * RAD, fullAoaRad: 55 * RAD,
        maxSideForceCoeff: 0.42, lockInRateGain: 6.0, seedDrive: 0.06,
        driveScale: 0.5, pitchRateArmRatio: 1.0,
    };

    it('forebodyAsymmetryCy: inert below onset, develops above, and follows the seed then the motion', () => {
        // Below the onset AoA (the whole normal envelope) there is no asymmetry.
        assert.equal(forebodyAsymmetryCy(20 * RAD, 0, 0, 150, cfg), 0,
            'asymmetry should be zero below the onset AoA');
        // Above onset with no motion the micro-asymmetry seed sets a definite
        // (positive = nose-right) direction so the departure is deterministic.
        const cySeed = forebodyAsymmetryCy(50 * RAD, 0, 0, 150, cfg);
        assert.ok(cySeed > 0, `seed should bias the asymmetry positive: ${cySeed.toFixed(3)}`);
        // It grows with AoA across the onset→full band.
        const cyLow = forebodyAsymmetryCy(40 * RAD, 0, 0, 150, cfg);
        assert.ok(cySeed > cyLow, `asymmetry should grow with AoA: ${cyLow.toFixed(3)} → ${cySeed.toFixed(3)}`);
        // The moving-wall lock-in makes the side force follow the yaw (coning)
        // rate: opposite yaw rates flip its sign (self-reinforcing → departure).
        const cyYawPos = forebodyAsymmetryCy(50 * RAD, 1.0, 0, 150, cfg);
        const cyYawNeg = forebodyAsymmetryCy(50 * RAD, -1.0, 0, 150, cfg);
        assert.ok(cyYawPos > 0 && cyYawNeg < 0,
            `lock-in should follow yaw-rate sign: +=${cyYawPos.toFixed(3)} −=${cyYawNeg.toFixed(3)}`);
        // Pitch-rate nose-AoA shift (Ericsson α_n): a rapid nose-up rate lowers the
        // effective nose AoA, delaying onset — less asymmetry than quasi-steady.
        const cyPitchUp = forebodyAsymmetryCy(40 * RAD, 0, 2.0, 150, cfg);
        assert.ok(cyPitchUp < cyLow,
            `rapid pitch-up should delay onset: ${cyPitchUp.toFixed(3)} < ${cyLow.toFixed(3)}`);
    });

    /** Run an 8 s limiters-OFF cobra and report the peak lateral (nose-slice) speed. */
    function cobraLateral(laminar: boolean): { maxLateral: number; crashed: boolean } {
        const model = new Fm2FlightModel();
        airborne(model, 3000, 220, 0.15);
        model.setLimitersEnabled(false);
        model.setForebodyLaminar(laminar);
        const inv = new THREE.Quaternion();
        const velBody = new THREE.Vector3();
        let maxLateral = 0;
        for (let i = 0; i < 8 * 120; i++) {
            const t = i / 120;
            model.setLimitersEnabled(false);
            model.setForebodyLaminar(laminar);
            model.setPitch(t < 1.5 ? 1.0 : 0.0);
            model.update(1 / 120);
            assert.ok(!Number.isNaN(model.position.y), 'simulation diverged to NaN');
            inv.copy(model.quaternion).invert();
            velBody.copy(model.velocityVector).applyQuaternion(inv);
            maxLateral = Math.max(maxLateral, Math.abs(velBody.x));
        }
        return { maxLateral, crashed: model.isCrashed() };
    }

    it('defaults to the full-scale regime and reflects the toggle', () => {
        const model = new Fm2FlightModel();
        assert.equal(model.isForebodyLaminar(), false, 'should default to full-scale (symmetric)');
        model.setForebodyLaminar(true);
        assert.equal(model.isForebodyLaminar(), true, 'toggle to subscale not reflected');
        model.reset();
        assert.equal(model.isForebodyLaminar(), false, 'reset should restore full-scale');
    });

    it('subscale/laminar regime departs a cobra into a nose slice; full-scale stays symmetric', () => {
        // The identical limiters-OFF cobra: at full-scale (real flight) it stays in
        // the plane of symmetry; in subscale/laminar flow the forebody asymmetry
        // locks in and slices the nose off to the side (large body-frame lateral
        // velocity) — the exact Reynolds coupling the paper identifies.
        const full = cobraLateral(false);
        const sub = cobraLateral(true);
        assert.ok(full.maxLateral < 2,
            `full-scale cobra should stay symmetric: max |velBody.x|=${full.maxLateral.toFixed(2)} m/s`);
        assert.ok(sub.maxLateral > 20,
            `subscale cobra should nose-slice into a lateral departure: max |velBody.x|=${sub.maxLateral.toFixed(2)} m/s`);
    });

    it('the subscale regime is inert in the normal envelope (limiters ON hold AoA below onset)', () => {
        // The nose slice only lives above ~35° AoA. With the FBW limiters ON the
        // AoA is held ~19°, well below onset, so even in the subscale regime a hard
        // pull stays laterally symmetric — the normal envelope is untouched.
        const model = new Fm2FlightModel();
        airborne(model, 6000, 320, 1.0);
        model.setForebodyLaminar(true);
        const inv = new THREE.Quaternion();
        const velBody = new THREE.Vector3();
        let maxLateral = 0;
        for (let i = 0; i < 5 * 120; i++) {
            model.setForebodyLaminar(true);
            model.setPitch(1.0);
            model.update(1 / 120);
            inv.copy(model.quaternion).invert();
            velBody.copy(model.velocityVector).applyQuaternion(inv);
            maxLateral = Math.max(maxLateral, Math.abs(velBody.x));
        }
        assert.ok(maxLateral < 2,
            `subscale regime leaked into the normal envelope: max |velBody.x|=${maxLateral.toFixed(2)} m/s`);
    });
});
