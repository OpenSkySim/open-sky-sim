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
 * Exterior "behind" chase camera positioned off the {@link ChaseTarget}'s tail
 * (e.g. the AI opponent), mirroring the player's F2 behind view, but aimed at
 * the player rather than the target's own flight path — so the F6 view shows
 * the dogfight from behind the AI while keeping the player in frame. Numpad
 * orbit (see {@link import('../game').Game.orbitCameraAroundAircraft}) can
 * move the camera off this pose; pressing Numpad `*` refocuses back onto it.
 */
export class AiExteriorCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();

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
        this.camera.position
            .copy(pos)
            .addScaledVector(UP, 5)
            .addScaledVector(this._v, -40.0);
        this.camera.lookAt(this.actor.getDisplayPosition());
    }
}
