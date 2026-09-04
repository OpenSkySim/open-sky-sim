import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Faction } from './src/script/weapons/combatant.js';
import { FcsPitchLimiter } from './src/script/physics/fm2/fcs.js';
import { defaultFm2Config } from './src/script/physics/fm2/fm2AircraftConfig.js';
import {
    ARRESTOR_CARRIER_ORIGIN,
    ARRESTOR_DECK_MID_X,
} from './src/script/scene/entities/arrestorCables.js';
import {
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_LOCAL_Z,
    BARRICADE_PULL_OUT_M,
    buildBarricadeField,
} from './src/script/scene/entities/barricade.js';
import { CombatSim } from './src/script/physics/sim/combatSim.js';
import {
    defaultArrestorCableField,
    serializeBarricade,
    serializeWorld,
} from './src/script/physics/sim/serializedWorld.js';

const ORIGIN = ARRESTOR_CARRIER_ORIGIN;

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
};

function barricadeWorld(deploy, withCables) {
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

function spawnRollingIn(sim, id, asternM, speed = 60) {
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

function readState(sim, id) {
    return sim.aircraft.get(id);
}

console.log('=== BARRICADE RELEASE TEST ===\n');
console.log('Starting barricade engagement scenario...\n');

const sim = new CombatSim();
sim.setWorld(barricadeWorld(1, false));
spawnRollingIn(sim, 'barr-test', 20);

const dt = 1 / 60;
let engaged = false;
let released = false;

for (let i = 0; i < 200; i++) {
    sim.step(dt, { 'barr-test': { ...HOOK_UP_INPUT } });
    const s = readState(sim, 'barr-test');

    if (s.barricadeEngaged && !engaged) {
        engaged = true;
        console.log(`\n=== BARRICADE ENGAGED at iteration ${i} ===`);
    }

    if (i % 20 === 0) {
        console.log(`Iteration ${i}: barricadeEngaged=${s.barricadeEngaged}, Z=${s.model.position.z.toFixed(2)}, Vel=${s.model.velocityVector.z.toFixed(2)}`);
    }
}

console.log('\n=== TEST COMPLETE ===');
