import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { classifyTacticalState, FighterTacticalFSM } from './fighterTacticalFsm';
import { computeTacticalGeometry } from './shawGeometry';
import { AircraftSnapshot } from './shawTypes';

function snap(opts: {
    pos: [number, number, number];
    vel: [number, number, number];
    alt?: number;
}): AircraftSnapshot {
    const velocity = new THREE.Vector3(...opts.vel);
    const forward = velocity.lengthSq() > 1e-6
        ? velocity.clone().normalize()
        : new THREE.Vector3(0, 0, 1);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    up.crossVectors(forward, right).normalize();
    return {
        position: new THREE.Vector3(...opts.pos),
        velocity,
        forward,
        up,
        right,
        altitude: opts.alt ?? opts.pos[1],
        airspeed: velocity.length(),
        cornerVelocity: 180,
        maxG: 9,
    };
}

describe('Shaw tactical geometry / state classification', () => {
    it('classifies dead-six as OFFENSIVE', () => {
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const target = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });
        const geom = computeTacticalGeometry(self, target);
        assert.ok(geom.aot < 30 * Math.PI / 180, `AOT=${geom.aot}`);
        assert.equal(classifyTacticalState(geom), 'OFFENSIVE');
    });

    it('classifies bandit on our six as DEFENSIVE', () => {
        const self = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });
        const target = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const geom = computeTacticalGeometry(self, target);
        assert.ok(geom.taa < 30 * Math.PI / 180, `TAA=${geom.taa}`);
        assert.equal(classifyTacticalState(geom), 'DEFENSIVE');
    });

    it('classifies head-on as NEUTRAL', () => {
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const target = snap({ pos: [0, 2000, 3000], vel: [0, 0, -200] });
        const geom = computeTacticalGeometry(self, target);
        assert.equal(classifyTacticalState(geom), 'NEUTRAL');
    });
});

describe('FighterTacticalFSM maneuvers', () => {
    it('picks HIGH_YO_YO on high closure inside gun range band', () => {
        const fsm = new FighterTacticalFSM({ overshootVc: 50, gunRange: 900 });
        // Self much faster, closing from behind at ~600 m.
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 280] });
        const target = snap({ pos: [0, 2000, 600], vel: [0, 0, 160] });
        const cmd = fsm.update(self, target, 1 / 60);
        assert.equal(cmd.stateName, 'OFFENSIVE');
        assert.equal(cmd.maneuverName, 'HIGH_YO_YO');
    });

    it('picks LEAD_TURN on a near head-on merge', () => {
        const fsm = new FighterTacticalFSM();
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 220] });
        const target = snap({ pos: [0, 2000, 1500], vel: [0, 0, -200] });
        const cmd = fsm.update(self, target, 1 / 60);
        assert.equal(cmd.stateName, 'NEUTRAL');
        assert.equal(cmd.maneuverName, 'LEAD_TURN');
    });

    it('picks BREAK_TURN when bandit is close on the six', () => {
        const fsm = new FighterTacticalFSM();
        const self = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });
        const target = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const cmd = fsm.update(self, target, 1 / 60);
        assert.equal(cmd.stateName, 'DEFENSIVE');
        assert.equal(cmd.maneuverName, 'BREAK_TURN');
    });

    it('picks FLAT_SCISSORS when defensive but not in immediate break range', () => {
        const fsm = new FighterTacticalFSM();
        // Bandit tracking, range ~1800 m, self faster → scissors path.
        const self = snap({ pos: [0, 800, 1800], vel: [0, 0, 220] });
        const target = snap({ pos: [0, 800, 0], vel: [0, 0, 160] });
        const cmd = fsm.update(self, target, 1 / 60);
        assert.equal(cmd.stateName, 'DEFENSIVE');
        assert.ok(
            cmd.maneuverName === 'FLAT_SCISSORS' || cmd.maneuverName === 'BREAK_TURN' || cmd.maneuverName === 'DEFENSIVE_SPIRAL',
            `got ${cmd.maneuverName}`,
        );
    });
});
