import * as THREE from 'three';
import { PlayerEntity } from "../../scene/entities/player";
import { GroundTargetEntity } from "../../scene/entities/groundTarget";
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from "./cameraUpdater";

export class CarrierOverSternCameraUpdater extends CameraUpdater {

    private tmpVector = new THREE.Vector3();
    private tmpSternPos = new THREE.Vector3();
    private tmpCameraPos = new THREE.Vector3();

    constructor(
        actor: PlayerEntity,
        camera: THREE.PerspectiveCamera,
        private carrier: GroundTargetEntity | undefined = undefined
    ) {
        super(actor, camera);
    }

    setCarrier(carrier: GroundTargetEntity | undefined): void {
        this.carrier = carrier;
    }

    update(delta: number): void {
        if (!this.carrier) {
            return;
        }

        // Carrier position in world space
        const carrierPos = this.carrier.position;
        const carrierQuat = this.carrier.quaternion;

        // Stern offset in carrier local space (bow at -Z, stern at +Z)
        const sternLocalZ = 124.28;
        const deckY = 14;
        const cameraDistanceBehind = 100; // 100m behind stern
        const cameraHeightAboveDeck = 30;

        // Transform stern position to world space
        this.tmpSternPos.set(0, deckY + 5, sternLocalZ);
        this.tmpSternPos.applyQuaternion(carrierQuat);
        this.tmpSternPos.add(carrierPos);

        // Camera position: behind the carrier, looking toward stern
        // Start from carrier center
        this.tmpCameraPos.set(0, deckY + cameraHeightAboveDeck, -cameraDistanceBehind);
        this.tmpCameraPos.applyQuaternion(carrierQuat);
        this.tmpCameraPos.add(carrierPos);

        this.camera.position.copy(this.tmpCameraPos);
        this.camera.lookAt(this.tmpSternPos);
    }
}
