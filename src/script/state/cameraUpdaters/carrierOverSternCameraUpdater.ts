import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";

export class CarrierOverSternCameraUpdater extends CameraUpdater {

    private tmpVector = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera) {
        super(actor, camera);
    }

    update(delta: number): void {
        // Carrier position and stern point
        const carrierPos = new THREE.Vector3(0, 0, 0); // Kuznetsov carrier origin
        const sternZ = 124.28; // Stern is forward along +Z in carrier local space
        const deckY = 14; // Carrier deck height

        // Camera positioned above and behind the carrier, looking toward stern
        const cameraHeight = deckY + 30; // 30m above deck
        const distanceBehindCarrier = -100; // 100m behind (negative Z)

        this.camera.position.set(
            carrierPos.x,
            cameraHeight,
            carrierPos.z + distanceBehindCarrier
        );

        // Look toward the stern (at +Z from carrier center)
        const lookAtPoint = new THREE.Vector3(
            carrierPos.x,
            deckY + 5,
            carrierPos.z + sternZ
        );

        this.camera.lookAt(lookAtPoint);
    }
}
