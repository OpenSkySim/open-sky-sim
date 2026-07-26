import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";

export class CockpitFrontCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();
    private _offset = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        const offset = this.actor.getCockpitOffset(this._offset);

        const forward = this.actor.getDisplayWorldDirection(this._v);
        this.camera.position
            .copy(this.actor.getDisplayPosition())
            .addScaledVector(forward, offset.z);

        const up = this.actor.getDisplayWorldUp(this._v);
        this.camera.position
            .addScaledVector(up, offset.y);

        const right = this.actor.getDisplayWorldRight(this._v);
        this.camera.position
            .addScaledVector(right, offset.x);

        this.camera.quaternion.copy(this.actor.getDisplayQuaternion());
        // The three.js camera forward vector points towards -Z in opposition to
        // the Object3D pointing towards +Z
        this.camera.rotateOnAxis(UP, Math.PI);
    }
}
