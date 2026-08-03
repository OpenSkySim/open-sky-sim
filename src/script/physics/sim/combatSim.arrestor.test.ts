import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Faction } from '../../weapons/combatant';
import { FcsPitchLimiter } from '../fm2/fcs';
import { defaultFm2Config } from '../fm2/fm2AircraftConfig';
import {
    ARRESTOR_CABLE_LOCAL_Z,
    ARRESTOR_CABLE_Y,
    ARRESTOR_CARRIER_ORIGIN,
    ARRESTOR_DECK_MID_X,
    DEFAULT_ARRESTOR_HOOK_BODY,
} from '../../scene/entities/arrestorCables';
import { CombatSim } from './combatSim';
import { defaultArrestorCableField, serializeWorld } from './serializedWorld';

describe('CombatSim arrestor trap', () => {
    it('snags a cable and stops along the deck', () => {
        const origin = ARRESTOR_CARRIER_ORIGIN;
        const field = defaultArrestorCableField(origin.x, origin.y, origin.z);
        const sim = new CombatSim();
        sim.setWorld(serializeWorld([], [], {
            center: new THREE.Vector3(0, 0, 0),
            heading: 0,
            halfLength: 100,
            halfWidth: 20,
        }, [], [], [field]));

        const cableZ = origin.z + ARRESTOR_CABLE_LOCAL_Z[0];
        const hookY = origin.y + ARRESTOR_CABLE_Y;
        const midX = origin.x + ARRESTOR_DECK_MID_X;
        const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        const vel = new THREE.Vector3(0, 0, -55);

        // heading π: body hook maps to world offset applied below.
        const hookBodyWorld = new THREE.Vector3(
            DEFAULT_ARRESTOR_HOOK_BODY[0],
            DEFAULT_ARRESTOR_HOOK_BODY[1],
            DEFAULT_ARRESTOR_HOOK_BODY[2],
        ).applyQuaternion(quat);
        const startHookZ = cableZ + 0.8;
        const cg = new THREE.Vector3(
            midX - hookBodyWorld.x,
            hookY - hookBodyWorld.y,
            startHookZ - hookBodyWorld.z,
        );

        sim.addAircraft({
            id: 'trap-test',
            faction: Faction.PLAYER,
            control: 'external',
            kinematic: false,
            aircraftConfig: defaultFm2Config,
            hitRadius: 5,
            maxHealth: 100,
            spawn: {
                position: [cg.x, cg.y, cg.z],
                quaternion: [quat.x, quat.y, quat.z, quat.w],
                velocity: [vel.x, vel.y, vel.z],
                throttle: 0,
                // airborne:false ⇒ gear starts deployed (player input mirrors that).
                landed: false,
                airborne: false,
            },
            enabled: true,
        });

        const dt = 1 / 60;
        let latched = false;
        let stopped = false;
        for (let i = 0; i < 600; i++) {
            // Player input overwrites this each step; keep gear down / throttle idle.
            sim.step(dt, {
                'trap-test': {
                    pitch: 0, roll: 0, yaw: 0, throttle: 0,
                    landingGearDeployed: true,
                    flapsExtended: true,
                    airbrakesExtended: false,
                    wheelBrakesApplied: false,
                    pitchLimiterMode: FcsPitchLimiter.SOFT,
                    limitersEnabled: true,
                    wantForceVectors: false,
                    firing: false,
                },
            });
            const snap = (sim as unknown as {
                aircraft: Map<string, {
                    arrestorLatch: number;
                    arrestorHeld: boolean;
                    model: { velocityVector: THREE.Vector3; isLanded: () => boolean };
                }>;
            }).aircraft.get('trap-test')!;
            if (snap.arrestorLatch >= 0) latched = true;
            const along = -snap.model.velocityVector.z;
            if (latched && along < 1 && snap.model.isLanded()) {
                stopped = true;
                assert.equal(snap.arrestorLatch >= 0, true, 'cable should stay latched while stopped');
                assert.equal(snap.arrestorHeld, true, 'expected held-after-stop state');
                break;
            }
        }
        assert.equal(latched, true, 'expected cable snag');
        assert.equal(stopped, true, 'expected stop after trap');

        // Stay parked a few frames — cable must remain bent/latched.
        for (let i = 0; i < 30; i++) {
            sim.step(dt, {
                'trap-test': {
                    pitch: 0, roll: 0, yaw: 0, throttle: 0,
                    landingGearDeployed: true,
                    flapsExtended: true,
                    airbrakesExtended: false,
                    wheelBrakesApplied: true,
                    pitchLimiterMode: FcsPitchLimiter.SOFT,
                    limitersEnabled: true,
                    wantForceVectors: false,
                    firing: false,
                },
            });
        }
        const parked = (sim as unknown as {
            aircraft: Map<string, { arrestorLatch: number; arrestorHeld: boolean }>;
        }).aircraft.get('trap-test')!;
        assert.ok(parked.arrestorLatch >= 0, 'cable should remain on hook while standing still');
        assert.equal(parked.arrestorHeld, true);
    });
});
