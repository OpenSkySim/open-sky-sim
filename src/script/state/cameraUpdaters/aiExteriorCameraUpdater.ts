import * as THREE from 'three';
import { PlayerEntity } from '../../scene/entities/player';
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from './cameraUpdater';


/** Anything that can be chased by an exterior camera. */
export interface ChaseTarget {
    getDisplayPosition(): THREE.Vector3;
    getDisplayQuaternion(): THREE.Quaternion;
}

/**
 * Exterior "behind" chase camera aimed at an arbitrary {@link ChaseTarget}
 * (e.g. the AI opponent), mirroring the player's F2 behind view.
 */
export class AiExteriorCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();
    private _p = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera, private target: ChaseTarget) {
        super(actor, camera);
    }

    update(delta: number): void {
        const pos = this.target.getDisplayPosition();
        this._v
            .copy(FORWARD)
            .applyQuaternion(this.target.getDisplayQuaternion())
            .setY(0)
            .normalize();
        this._p
            .copy(pos)
            .addScaledVector(this._v, 1);
        this.camera.position.copy(pos);
        this.camera.lookAt(this._p);
        this.camera.position
            .addScaledVector(UP, 5)
            .addScaledVector(this._v, -40.0);
    }
}
