import * as THREE from 'three';
import { Ecef, Enu, EnuBasis, ecefToEnu, enuToEcef } from './geo';

/**
 * Maps ECEF metres into Three.js render space.
 * v1: fixed ENU — +X east, +Y up, +Z north (sim forward).
 */
export class RenderFrame {
    constructor(readonly basis: EnuBasis) { }

    ecefToWorld(ecef: Ecef, out: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
        const enu = ecefToEnu(this.basis, ecef);
        return out.set(enu.e, enu.u, enu.n);
    }

    worldToEcef(world: THREE.Vector3, out: Ecef = { x: 0, y: 0, z: 0 }): Ecef {
        return enuToEcef(this.basis, { e: world.x, n: world.z, u: world.y }, out);
    }

    worldToEnu(world: THREE.Vector3): Enu {
        return { e: world.x, n: world.z, u: world.y };
    }
}
