import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { CameraUpdater } from "./cameraUpdater";

const MIN_HEIGHT = 5;
const MAX_MARGIN = 300;

export class TargetFromCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        const target = this.actor.weaponsTarget;
        if (!target) return;

        const actorPosition = this.actor.getDisplayPosition();
        this.camera.position
            .copy(target.position)
            .add(target.localCenter);
        this._v
            .subVectors(this.camera.position, actorPosition)
            .normalize();
        this.camera.position
            .copy(target.position)
            .addScaledVector(this._v, Math.min(target.maxSize, MAX_MARGIN))
            .setY(Math.max(this.camera.position.y, MIN_HEIGHT));
        this.camera.lookAt(actorPosition);
    }
}
