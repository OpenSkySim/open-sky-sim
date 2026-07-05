import * as THREE from 'three';
import { RealisticFlightModel } from '../model/realisticFlightModel';
import { ArcadeFlightModel } from '../model/arcadeFlightModel';
import { DebugFlightModel } from '../model/debugFlightModel';
import { FlightModel } from '../model/flightModel';

let flightModel: FlightModel;

self.onmessage = (event: MessageEvent) => {
    const data = event.data;

    switch (data.type) {
        case 'init':
            if (data.modelType === 'realistic') {
                flightModel = new RealisticFlightModel();
            } else if (data.modelType === 'arcade') {
                flightModel = new ArcadeFlightModel();
            } else if (data.modelType === 'debug') {
                flightModel = new DebugFlightModel();
            }
            break;

        case 'update':
            if (!flightModel) return;
            flightModel.setPitch(data.inputs.pitch);
            flightModel.setRoll(data.inputs.roll);
            flightModel.setYaw(data.inputs.yaw);
            flightModel.setThrottle(data.inputs.throttle);
            flightModel.setLandingGearDeployed(data.inputs.landingGearDeployed);
            flightModel.setFlapsExtended(data.inputs.flapsExtended);
            flightModel.setWheelBrakes(data.inputs.wheelBrakesApplied);
            
            flightModel.update(data.delta);
            
            sendState();
            break;

        case 'reset':
            if (!flightModel) return;
            flightModel.reset();
            flightModel.position.set(data.position[0], data.position[1], data.position[2]);
            flightModel.quaternion.set(data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3]);
            flightModel.velocityVector.set(data.velocity[0], data.velocity[1], data.velocity[2]);
            flightModel.setLanded(data.landed);
            flightModel.setThrottle(data.throttle);
            sendState();
            break;

        case 'syncEffectiveThrottle':
            if (!flightModel) return;
            flightModel.setThrottle(data.throttle);
            flightModel.syncEffectiveThrottle();
            sendState();
            break;

        case 'setPosition':
            if (!flightModel) return;
            flightModel.position.set(data.position[0], data.position[1], data.position[2]);
            sendState();
            break;

        case 'setQuaternion':
            if (!flightModel) return;
            flightModel.quaternion.set(data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3]);
            sendState();
            break;

        case 'setVelocity':
            if (!flightModel) return;
            flightModel.velocityVector.set(data.velocity[0], data.velocity[1], data.velocity[2]);
            sendState();
            break;

        case 'snapPhysicsState':
            if (!flightModel) return;
            flightModel.snapPhysicsState();
            sendState();
            break;
    }
};

function sendState() {
    if (!flightModel) return;
    const state = {
        position: flightModel.position.toArray(),
        quaternion: flightModel.quaternion.toArray(),
        velocity: flightModel.velocityVector.toArray(),
        // @ts-ignore - accessing protected members for transfer
        prevPosition: flightModel.prevPosition.toArray(),
        // @ts-ignore
        prevQuaternion: flightModel.prevQuaternion.toArray(),
        // @ts-ignore
        prevVelocity: flightModel.prevVelocity.toArray(),
        crashed: flightModel.isCrashed(),
        landed: flightModel.isLanded(),
        angleOfAttackRad: flightModel.getAngleOfAttack(),
        loadFactorG: flightModel.getLoadFactorG(),
        engineThrustN: flightModel.getEngineThrustKn() * 1000,
        effectiveThrottle: flightModel.getEffectiveThrottle(),
        // @ts-ignore
        deltaRemainder: flightModel.deltaRemainder,
        stall: flightModel.getStallStatus()
    };

    self.postMessage({ type: 'state', state });
}
