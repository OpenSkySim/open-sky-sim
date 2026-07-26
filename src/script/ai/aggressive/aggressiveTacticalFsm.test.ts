import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { AggressiveTacticalFSM } from './aggressiveTacticalFsm';
import { computeTacticalGeometry } from '../shaw/shawGeometry';
import { AircraftSnapshot } from '../shaw/shawTypes';

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

describe('AggressiveTacticalFSM state classification', () => {
    it('classifies dead-six as ATTACK', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const target = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'ATTACK');
    });

    it('classifies bandit on our six as COUNTER, never a break/extend', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });
        const target = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'COUNTER');
        assert.equal(command.maneuverName, 'SCISSORS_COUNTER');
        // The core "never flees" trait: it never cuts throttle/airbrakes to
        // disengage, it always presses at (or above) combat speed.
        assert.equal(command.useAirbrakes, false);
    });

    it('classifies head-on as MERGE and presses a HEAD_ON_PRESS instead of retreating', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const target = snap({ pos: [0, 2000, 6000], vel: [0, 0, -200] });
        const geom = computeTacticalGeometry(self, target);
        assert.ok(geom.range > 5000, `range=${geom.range}`);
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'MERGE');
        assert.equal(command.maneuverName, 'HEAD_ON_PRESS');
    });
});

describe('AggressiveTacticalFSM maneuvers', () => {
    it('picks HIGH_YO_YO only under high closure at knife-fight range', () => {
        const fsm = new AggressiveTacticalFSM({ overshootVc: 50, gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 300] });
        const target = snap({ pos: [0, 2000, 500], vel: [0, 0, 150] });
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'ATTACK');
        assert.equal(command.maneuverName, 'HIGH_YO_YO');
    });

    it('stays in LEAD_PURSUIT (no lag-pursuit caution) at wide angle-off in range', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        // Target well off to the side but still roughly in front (AOT<75deg).
        const target = snap({ pos: [400, 2000, 600], vel: [200, 0, 0] });
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'ATTACK');
        assert.equal(command.maneuverName, 'LEAD_PURSUIT');
    });

    it('fires with a wider cone/longer range than a "clean" gun solution', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        // Just beyond the raw gun range, still inside the 1.2x snap-shoot range.
        const target = snap({ pos: [0, 2000, 1000], vel: [0, 0, 190] });
        const command = fsm.update(self, target, 1 / 60);
        assert.equal(command.stateName, 'ATTACK');
        assert.equal(command.fireGuns, true);
    });

    it('never produces an EXTEND-like disengage maneuver regardless of energy deficit', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        // Self is slow and low (large energy deficit vs. a fast, high target).
        const self = snap({ pos: [0, 500, 0], vel: [0, 0, 90], alt: 500 });
        const target = snap({ pos: [0, 4000, 800], vel: [0, 0, 260], alt: 4000 });
        const command = fsm.update(self, target, 1 / 60);
        const maneuvers: string[] = [
            'LEAD_PURSUIT', 'HIGH_YO_YO', 'HEAD_ON_PRESS', 'POST_MERGE_REVERSAL', 'SCISSORS_COUNTER',
        ];
        assert.ok(maneuvers.includes(command.maneuverName));
        assert.equal(command.useAirbrakes, false);
    });
});

/**
 * Regression tests for a "rolls stupid left/right" bug: SCISSORS_COUNTER and
 * POST_MERGE_REVERSAL pick a binary left/right cut side from the sign of a
 * dot product that sits near zero mid-fight. Without hysteresis that sign
 * (and therefore the commanded direction) flipped almost every frame.
 */
describe('AggressiveTacticalFSM side-selection stability (no left/right chatter)', () => {
    it('keeps SCISSORS_COUNTER committed to one side despite tiny geometry noise, but can still flip on a real cross-over', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 800], vel: [0, 0, 180] });

        const straight = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });
        const c1 = fsm.update(self, straight, 1 / 60);
        assert.equal(c1.stateName, 'COUNTER');
        const lateral1 = c1.targetDirection.dot(self.right);

        // Tiny lateral noise in the bandit's heading (dot product barely
        // crosses zero) must NOT flip the cut side.
        const wobbled = snap({ pos: [0, 2000, 0], vel: [-10, 0, 200] });
        const c2 = fsm.update(self, wobbled, 1 / 60);
        assert.equal(c2.stateName, 'COUNTER');
        const lateral2 = c2.targetDirection.dot(self.right);
        assert.equal(Math.sign(lateral1), Math.sign(lateral2), 'cut side flipped on tiny noise');

        // A clear, sustained cross-over should still be able to flip the side
        // (the latch must not get stuck forever).
        const clearlyOpposite = snap({ pos: [0, 2000, 0], vel: [-60, 0, 200] });
        const c3 = fsm.update(self, clearlyOpposite, 1 / 60);
        const lateral3 = c3.targetDirection.dot(self.right);
        assert.notEqual(Math.sign(lateral1), Math.sign(lateral3), 'cut side never adapted to a real geometry change');
    });

    it('keeps POST_MERGE_REVERSAL committed to one side despite tiny geometry noise', () => {
        const fsm = new AggressiveTacticalFSM({ gunRange: 900 });
        const self = snap({ pos: [0, 2000, 0], vel: [0, 0, 200] });

        const headOn = snap({ pos: [0, 2000, 1200], vel: [0, 0, -200] });
        const geom = computeTacticalGeometry(self, headOn);
        assert.ok(geom.range < 1500 && geom.closureRate > 0, `range=${geom.range} closure=${geom.closureRate}`);
        const c1 = fsm.update(self, headOn, 1 / 60);
        assert.equal(c1.maneuverName, 'POST_MERGE_REVERSAL');
        const lateral1 = c1.targetDirection.dot(self.right);

        const wobbled = snap({ pos: [0, 2000, 1200], vel: [10, 0, -200] });
        const c2 = fsm.update(self, wobbled, 1 / 60);
        assert.equal(c2.maneuverName, 'POST_MERGE_REVERSAL');
        const lateral2 = c2.targetDirection.dot(self.right);
        assert.equal(Math.sign(lateral1), Math.sign(lateral2), 'reversal side flipped on tiny noise');
    });
});
