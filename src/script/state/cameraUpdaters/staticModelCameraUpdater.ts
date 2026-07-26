import * as THREE from 'three';
import { PlayerEntity } from '../../scene/entities/player';
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from './cameraUpdater';

export class StaticModelCameraUpdater extends CameraUpdater {

    private target = new THREE.Vector3();
    private heading = 0;
    private orientation = new THREE.Quaternion();
    private forward = new THREE.Vector3();
    private side = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    setTarget(position: THREE.Vector3, heading: number): void {
        this.target.copy(position);
        this.heading = heading;
    }

    update(_delta: number): void {
        this.orientation.setFromAxisAngle(UP, this.heading);
        this.forward
            .copy(FORWARD)
            .applyQuaternion(this.orientation)
            .setY(0)
            .normalize();
        this.side.set(this.forward.z, 0, -this.forward.x);
        this.camera.position
            .copy(this.target)
            .addScaledVector(this.side, 35)
            .addScaledVector(UP, 5);
        this.camera.up.copy(UP);
        this.camera.lookAt(this.target);
    }
}
