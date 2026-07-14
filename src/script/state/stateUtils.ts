import * as THREE from 'three';
import { COCKPIT_FAR, COCKPIT_FOV, PLANE_DISTANCE_TO_GROUND } from "../defs";
import { computeAiChaseFovDeg } from './cameraUpdaters/aiExteriorCameraUpdater';

export function restoreMainCameraParameters(camera: THREE.PerspectiveCamera) {
    camera.fov = COCKPIT_FOV;
    camera.near = PLANE_DISTANCE_TO_GROUND;
    camera.far = COCKPIT_FAR;
    camera.updateProjectionMatrix();
}

export function applyAiChaseCameraParameters(camera: THREE.PerspectiveCamera) {
    camera.fov = computeAiChaseFovDeg();
    camera.near = PLANE_DISTANCE_TO_GROUND;
    camera.far = COCKPIT_FAR;
    camera.updateProjectionMatrix();
}
