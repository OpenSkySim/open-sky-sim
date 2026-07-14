import * as THREE from 'three';
import { PlayerEntity } from '../../scene/entities/player';
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from './cameraUpdater';
import { ExteriorViewHeading } from './exteriorFrontBehindCameraUpdater';


/** Anything that can be chased by an exterior camera. */
export interface ChaseTarget {
    getDisplayPosition(): THREE.Vector3;
    getDisplayQuaternion(): THREE.Quaternion;
}

/** Head-on merge range at opponent spawn (shared with {@link import('../game').Game.spawnOpponent}). */
export const AI_CHASE_MERGE_DISTANCE_M = 1000;

/** Match the F2 exterior back/front offset (m). */
const EXTERIOR_CHASE_DISTANCE_M = 40;
const EXTERIOR_CHASE_HEIGHT_M = 5;

/**
 * F6 exterior view — mirror of F2, but orbiting the AI opponent and looking at
 * the player. Press F6 again to toggle behind/front of the enemy.
 */
export class AiExteriorCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();

    constructor(
        actor: PlayerEntity,
        camera: THREE.PerspectiveCamera,
        private orbitSubject: ChaseTarget,
        private heading: ExteriorViewHeading = ExteriorViewHeading.BACK,
    ) {
        super(actor, camera);
    }

    setHeading(heading: ExteriorViewHeading): void {
        this.heading = heading;
    }

    update(delta: number): void {
        const subjectPos = this.orbitSubject.getDisplayPosition();
        const playerPos = this.actor.getDisplayPosition();

        this._v
            .copy(FORWARD)
            .applyQuaternion(this.orbitSubject.getDisplayQuaternion())
            .setY(0);
        if (this._v.lengthSq() < 1e-6) {
            this._v.set(0, 0, 1);
        } else {
            this._v.normalize();
        }

        this.camera.position.copy(subjectPos);
        this.camera.lookAt(playerPos);
        this.camera.position
            .addScaledVector(UP, EXTERIOR_CHASE_HEIGHT_M)
            .addScaledVector(this._v, EXTERIOR_CHASE_DISTANCE_M
                * (this.heading === ExteriorViewHeading.BACK ? 1 : -1));
        this.camera.lookAt(playerPos);
    }
}
