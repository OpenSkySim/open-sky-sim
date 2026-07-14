import * as THREE from 'three';
import { CombatSim } from '../sim/combatSim';
import { Faction } from '../../weapons/combatant';
import { SimToWorkerMessage } from '../sim/simTypes';

/**
 * Worker entry hosting the authoritative {@link CombatSim}. Receives control
 * inputs and discrete events from the main thread and returns one snapshot per
 * physics pump.
 */
const sim = new CombatSim();

const v = new THREE.Vector3();
const q = new THREE.Quaternion();
const v2 = new THREE.Vector3();

self.onmessage = (event: MessageEvent<SimToWorkerMessage>) => {
    try {
        handleMessage(event.data);
    } catch (err) {
        const e = err as Error;
        self.postMessage({ type: 'error', message: `${e?.name}: ${e?.message}`, stack: e?.stack });
    }
};

function handleMessage(data: SimToWorkerMessage): void {
    switch (data.type) {
        case 'init':
            break;
        case 'setWorld':
            sim.setWorld(data.world);
            break;
        case 'addAircraft':
            sim.addAircraft(data.desc);
            break;
        case 'removeAircraft':
            sim.removeAircraft(data.id);
            break;
        case 'setEnabled':
            sim.setEnabled(data.id, data.enabled);
            break;
        case 'setControlMode':
            sim.setControlMode(data.id, data.control);
            break;
        case 'setTarget':
            sim.setTarget(data.id, data.targetId);
            break;
        case 'setPhase':
            sim.setPhase(data.id, data.phase);
            break;
        case 'respawn':
            sim.respawn(data.id, data.spawn);
            break;
        case 'reset':
            sim.resetAircraft(
                data.id,
                v.fromArray(data.position),
                q.fromArray(data.quaternion),
                v2.fromArray(data.velocity),
                data.landed, data.throttle, data.kinematic);
            break;
        case 'setAircraftConfig':
            sim.setAircraftConfig(data.id, data.aircraftConfig, data.kinematic);
            break;
        case 'setPosition':
            sim.setPosition(data.id, v.fromArray(data.position));
            break;
        case 'setQuaternion':
            sim.setQuaternion(data.id, q.fromArray(data.quaternion));
            break;
        case 'setVelocity':
            sim.setVelocity(data.id, v.fromArray(data.velocity));
            break;
        case 'syncEffectiveThrottle':
            sim.syncEffectiveThrottle(data.id, data.throttle);
            break;
        case 'snapPhysicsState':
            sim.snapPhysicsState(data.id);
            break;
        case 'setExternalState':
            sim.setExternalState(
                data.id, data.enabled, data.faction as Faction,
                v.fromArray(data.position), v2.fromArray(data.velocity), data.alive);
            break;
        case 'clearExternalState':
            sim.clearExternalState(data.id);
            break;
        case 'step': {
            sim.step(data.delta, data.inputs);
            const snapshot = sim.encodeSnapshot();
            self.postMessage(
                { type: 'state', ...snapshot },
                { transfer: [snapshot.aircraft.buffer, snapshot.projectiles.buffer] as Transferable[] });
            break;
        }
    }
}
