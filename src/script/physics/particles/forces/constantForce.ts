import * as THREE from 'three';
import { Particle, ParticleForce } from '../particleSystem';

/** Applies a constant world-space acceleration (e.g. gravity) each update. */
export class ConstantForce implements ParticleForce {

    constructor(private readonly acceleration: THREE.Vector3) { }

    apply(delta: number, particle: Particle): Particle {
        particle.velocity.addScaledVector(this.acceleration, delta);
        return particle;
    }
}
