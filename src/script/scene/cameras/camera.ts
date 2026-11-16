import * as THREE from 'three';
import { COCKPIT_FOV, H_RES, V_RES } from '../../defs';


export class SceneCamera {
    private backgroundSky: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, 5, 50000);
    private backgroundGround: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, 100, 900000);
    /** The main camera with its near plane pulled in to the cockpit's panel. */
    private cockpitInterior: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(COCKPIT_FOV, H_RES / V_RES, 0.03, 20);

    constructor(private camera: THREE.PerspectiveCamera) {
        this.update();
    }

    get main(): THREE.PerspectiveCamera {
        return this.camera;
    }

    get bgSky(): THREE.PerspectiveCamera {
        return this.backgroundSky;
    }

    get bgGround(): THREE.PerspectiveCamera {
        return this.backgroundGround;
    }

    get interior(): THREE.PerspectiveCamera {
        return this.cockpitInterior;
    }

    update() {
        this.backgroundSky.aspect = this.camera.aspect;
        this.backgroundSky.fov = this.camera.fov;
        this.backgroundSky.updateProjectionMatrix();
        this.backgroundSky.quaternion.copy(this.camera.quaternion);

        this.backgroundGround.aspect = this.camera.aspect;
        this.backgroundGround.fov = this.camera.fov;
        this.backgroundGround.updateProjectionMatrix();
        this.backgroundGround.quaternion.copy(this.camera.quaternion);
        this.backgroundGround.position.y = this.camera.position.y;

        this.cockpitInterior.aspect = this.camera.aspect;
        this.cockpitInterior.fov = this.camera.fov;
        this.cockpitInterior.zoom = this.camera.zoom;
        this.cockpitInterior.updateProjectionMatrix();
        this.cockpitInterior.position.copy(this.camera.position);
        this.cockpitInterior.quaternion.copy(this.camera.quaternion);
        this.cockpitInterior.updateMatrixWorld();
    }
}
