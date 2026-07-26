import * as THREE from 'three';
import { JsbsimFlightModel } from '../model/jsbsimFlightModel';

let flightModel: JsbsimFlightModel | undefined;
let initStarted = false;
const pendingMessages: any[] = [];

self.onmessage = (event: MessageEvent) => {
    try {
        handleMessage(event.data);
    } catch (err) {
        const e = err as Error;
        self.postMessage({ type: 'error', message: `${e?.name}: ${e?.message}`, stack: e?.stack });
    }
};

function handleMessage(data: any) {
    if (data.type === 'init') {
        // JSBSimSdk.create() and the F-16 data fetch are async, so the model
        // isn't available synchronously like Fm2FlightModel's. Any messages
        // that arrive while it's loading are queued and replayed in order
        // once it's ready (see the flush below).
        if (initStarted) return;
        initStarted = true;
        JsbsimFlightModel.create().then(model => {
            flightModel = model;
            sendState();
            const queued = pendingMessages.splice(0);
            for (const queuedMessage of queued) handleMessage(queuedMessage);
        }).catch(err => {
            self.postMessage({ type: 'error', message: `${err?.name}: ${err?.message}`, stack: err?.stack });
        });
        return;
    }

    if (!flightModel) {
        pendingMessages.push(data);
        return;
    }

    switch (data.type) {
        case 'update':
            flightModel.setPitch(data.inputs.pitch);
            flightModel.setRoll(data.inputs.roll);
            flightModel.setYaw(data.inputs.yaw);
            flightModel.setThrottle(data.inputs.throttle);
            flightModel.setLandingGearDeployed(data.inputs.landingGearDeployed);
            flightModel.setFlapsExtended(data.inputs.flapsExtended);
            flightModel.setWheelBrakes(data.inputs.wheelBrakesApplied);
            flightModel.setForceVectorsRequested(!!data.inputs.wantForceVectors);

            flightModel.update(data.delta);

            sendState();
            break;

        case 'reset':
            flightModel.reset();
            // Assignment (not `.set()` on the getter) so the JSBSim IC sync in
            // JsbsimFlightModel's position/quaternion/velocityVector setters runs.
            flightModel.position = new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
            flightModel.quaternion = new THREE.Quaternion(
                data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3],
            );
            flightModel.velocityVector = new THREE.Vector3(data.velocity[0], data.velocity[1], data.velocity[2]);
            flightModel.setLanded(data.landed);
            flightModel.setThrottle(data.throttle);
            sendState();
            break;

        case 'syncEffectiveThrottle':
            flightModel.setThrottle(data.throttle);
            flightModel.syncEffectiveThrottle();
            sendState();
            break;

        case 'setPosition':
            flightModel.position = new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
            sendState();
            break;

        case 'setQuaternion':
            flightModel.quaternion = new THREE.Quaternion(
                data.quaternion[0], data.quaternion[1], data.quaternion[2], data.quaternion[3],
            );
            sendState();
            break;

        case 'setVelocity':
            flightModel.velocityVector = new THREE.Vector3(data.velocity[0], data.velocity[1], data.velocity[2]);
            sendState();
            break;

        case 'snapPhysicsState':
            flightModel.snapPhysicsState();
            sendState();
            break;
    }
}

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
        commandedElevator: flightModel.getCommandedElevator(),
        commandedAileron: flightModel.getCommandedAileron(),
        commandedRudder: flightModel.getCommandedRudder(),
        accelWorld: flightModel.getAccelerationWorld().toArray(),
        engineThrustN: flightModel.getEngineThrustKn() * 1000,
        effectiveThrottle: flightModel.getEffectiveThrottle(),
        // @ts-ignore
        deltaRemainder: flightModel.deltaRemainder,
        stall: flightModel.getStallStatus(),
        forceVectors: flightModel.getForceVectorSnapshot(),
    };

    self.postMessage({ type: 'state', state });
}
