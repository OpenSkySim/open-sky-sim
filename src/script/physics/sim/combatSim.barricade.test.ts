import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Faction } from '../../weapons/combatant';
import { FcsPitchLimiter } from '../fm2/fcs';
import { defaultFm2Config } from '../fm2/fm2AircraftConfig';
import {
    ARRESTOR_CARRIER_ORIGIN,
    ARRESTOR_DECK_MID_X,
} from '../../scene/entities/arrestorCables';
import {
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_LOCAL_Z,
    BARRICADE_PULL_OUT_M,
    buildBarricadeField,
} from '../../scene/entities/barricade';
import { CombatSim } from './combatSim';
import {
    defaultArrestorCableField,
    serializeBarricade,
    serializeWorld,
} from './serializedWorld';

const ORIGIN = ARRESTOR_CARRIER_ORIGIN;

/** Player input with the hook UP — the whole point of the barricade. */
const HOOK_UP_INPUT = {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    landingGearDeployed: true,
    flapsExtended: true,
    airbrakesExtended: false,
    hookDeployed: false,
    wheelBrakesApplied: false,
    pitchLimiterMode: FcsPitchLimiter.SOFT,
    limitersEnabled: true,
    wantForceVectors: false,
    firing: false,
} as const;

function barricadeWorld(deploy: number, withCables: boolean) {
    const cables = withCables
        ? [defaultArrestorCableField(ORIGIN.x, ORIGIN.y, ORIGIN.z)]
        : [];
    return serializeWorld(
        [], [],
        [{
            center: new THREE.Vector3(0, 0, 0),
            heading: 0,
            halfLength: 100,
            halfWidth: 20,
        }],
        [], [], cables, [], [],
        [buildBarricadeField({ position: { ...ORIGIN } }, BARRICADE_DECK_LOCAL_Y, deploy)],
    );
}

/**
 * Aircraft rolling down the deck toward the bow (−Z), CG on the deck,
 * `asternM` metres short of the webbing.
 */
function spawnRollingIn(sim: CombatSim, id: string, asternM: number, speed = 60) {
    const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    sim.addAircraft({
        id,
        faction: Faction.PLAYER,
        control: 'external',
        kinematic: false,
        aircraftConfig: defaultFm2Config,
        hitRadius: 5,
        maxHealth: 100,
        spawn: {
            position: [
                ORIGIN.x + ARRESTOR_DECK_MID_X,
                ORIGIN.y + BARRICADE_DECK_LOCAL_Y + 2.0,
                ORIGIN.z + BARRICADE_LOCAL_Z + asternM,
            ],
            quaternion: [quat.x, quat.y, quat.z, quat.w],
            velocity: [0, 0, -speed],
            throttle: 0,
            landed: false,
            airborne: false,
        },
        enabled: true,
    });
}

function readState(sim: CombatSim, id: string) {
    return (sim as unknown as {
        aircraft: Map<string, {
            barricadeEngaged: boolean;
            barricadeHeld: boolean;
            arrestorLatch: number;
            model: { position: THREE.Vector3; velocityVector: THREE.Vector3; isLanded: () => boolean };
        }>;
    }).aircraft.get(id)!;
}

describe('CombatSim barricade', () => {

    const dt = 1 / 60;

    it('stops a hook-up aircraft in the raised webbing', () => {
        const sim = new CombatSim();
        sim.setWorld(barricadeWorld(1, false));
        spawnRollingIn(sim, 'barr-test', 20);

        let engaged = false;
        let stopped = false;
        let engagedZ = 0;
        for (let i = 0; i < 900; i++) {
            sim.step(dt, { 'barr-test': { ...HOOK_UP_INPUT } });
            const s = readState(sim, 'barr-test');
            if (s.barricadeEngaged && !engaged) {
                engaged = true;
                engagedZ = s.model.position.z;
            }
            if (engaged && -s.model.velocityVector.z < 1 && s.model.isLanded()) {
                stopped = true;
                assert.equal(s.barricadeEngaged, true, 'webbing stays on the airframe while stopped');
                assert.equal(s.barricadeHeld, true, 'expected held-after-stop state');
                assert.equal(s.arrestorLatch, -1, 'no hook, so no pendant latch');
                // Run-out must respect the arresting engine's pull-out setting.
                const runOut = engagedZ - s.model.position.z;
                assert.ok(
                    runOut > 0 && runOut <= BARRICADE_PULL_OUT_M + 5,
                    `run-out ${runOut.toFixed(1)} m should be within the pull-out limit`,
                );
                break;
            }
        }
        assert.equal(engaged, true, 'expected the webbing to engage');
        assert.equal(stopped, true, 'expected a stop in the barricade');
    });

    it('lets a hook-up aircraft roll straight through a stowed barricade', () => {
        const sim = new CombatSim();
        sim.setWorld(barricadeWorld(0, false));
        spawnRollingIn(sim, 'stowed-test', 20);

        for (let i = 0; i < 300; i++) {
            sim.step(dt, { 'stowed-test': { ...HOOK_UP_INPUT } });
            assert.equal(readState(sim, 'stowed-test').barricadeEngaged, false);
        }
        const s = readState(sim, 'stowed-test');
        assert.ok(
            s.model.position.z < ORIGIN.z + BARRICADE_LOCAL_Z,
            'aircraft should have passed the stowed barricade',
        );
    });

    it('raising the barricade mid-roll arms it in time to catch', () => {
        const sim = new CombatSim();
        sim.setWorld(barricadeWorld(0, false));
        // Close enough that the airframe is still in the webbing's vertical
        // window when it arrives — this is testing the arming edge, not ballistics.
        spawnRollingIn(sim, 'raise-test', 40, 60);

        sim.step(dt, { 'raise-test': { ...HOOK_UP_INPUT } });
        assert.equal(readState(sim, 'raise-test').barricadeEngaged, false);

        sim.setBarricades([serializeBarricade(
            buildBarricadeField({ position: { ...ORIGIN } }, BARRICADE_DECK_LOCAL_Y, 1),
        )]);

        let engaged = false;
        for (let i = 0; i < 900 && !engaged; i++) {
            sim.step(dt, { 'raise-test': { ...HOOK_UP_INPUT } });
            engaged = readState(sim, 'raise-test').barricadeEngaged;
        }
        assert.equal(engaged, true, 'expected the freshly raised webbing to catch');
    });

    it('a pendant trap takes the load instead of the webbing', () => {
        const sim = new CombatSim();
        sim.setWorld(barricadeWorld(1, true));
        // Start aft of the wires, hook down: the wire should stop it well short
        // of the barricade, which then never gets loaded.
        spawnRollingIn(sim, 'wire-test', 80, 55);
        sim.keyDown('wire-test', 'h', false);

        let latched = false;
        for (let i = 0; i < 900; i++) {
            sim.step(dt, {
                'wire-test': { ...HOOK_UP_INPUT, hookDeployed: true },
            });
            const s = readState(sim, 'wire-test');
            if (s.arrestorLatch >= 0) latched = true;
            assert.equal(s.barricadeEngaged, false, 'wire arrestment must not load the webbing');
            if (latched && -s.model.velocityVector.z < 1 && s.model.isLanded()) break;
        }
        assert.equal(latched, true, 'expected a pendant snag');
    });
});
