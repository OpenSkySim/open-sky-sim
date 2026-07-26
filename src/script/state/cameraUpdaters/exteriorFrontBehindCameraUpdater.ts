import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from '../../utils/math';
import { ChaseTarget } from './aiExteriorCameraUpdater';
import { CameraUpdater } from "./cameraUpdater";


export enum ExteriorViewHeading {
    FRONT,
    BACK
}

export class ExteriorFrontBehindCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();
    private _p = new THREE.Vector3();
    private lookAtTarget: ChaseTarget | undefined;

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera, private heading: ExteriorViewHeading) {
        super(actor, camera);
    }

    setLookAtTarget(target: ChaseTarget | undefined): void {
        this.lookAtTarget = target;
    }

    update(delta: number): void {
        const playerPos = this.actor.getDisplayPosition();

        if (this.lookAtTarget) {
            const enemyPos = this.lookAtTarget.getDisplayPosition();
            // Orbit around the player on the horizontal plane, staying on the far
            // side from the enemy so both aircraft stay in frame.
            this._v.copy(enemyPos).sub(playerPos).setY(0);
            if (this._v.lengthSq() < 1e-6) {
                this._v.set(0, 0, 1);
            } else {
                this._v.normalize();
            }
            this.camera.position
                .copy(playerPos)
                .addScaledVector(this._v, -40)
                .addScaledVector(UP, 5);
            this.camera.lookAt(enemyPos);
            return;
        }

        this._v
            .copy(FORWARD)
            .applyQuaternion(this.actor.getDisplayQuaternion())
            .setY(0)
            .normalize();
        this._p
            .copy(playerPos)
            .addScaledVector(this._v, this.heading === ExteriorViewHeading.FRONT ? 1 : -1);
        this.camera.position
            .copy(playerPos);
        this.camera.lookAt(this._p);
        this.camera.position
            .addScaledVector(UP, 5)
            .addScaledVector(this._v, 40.0 * (this.heading === ExteriorViewHeading.BACK ? 1 : -1));
    }
}
