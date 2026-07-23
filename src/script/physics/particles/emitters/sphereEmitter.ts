import * as THREE from 'three';
import { Particle, ParticleEmitter } from '../particleSystem';
import { lerp } from '../../../utils/math';

/**
 * Spawns particles on/near a sphere around the source, with outward velocity
 * (plus optional bias, e.g. parent aircraft velocity).
 */
export class SphereEmitter implements ParticleEmitter {

    private readonly scratch = new THREE.Vector3();

    constructor(
        /** Inner radius (m). Use equal to {@link radius} for a surface shell. */
        private readonly minRadius: number,
        private readonly radius: number,
        private readonly minSpeed: number,
        private readonly maxSpeed: number,
        private readonly velocityBias: THREE.Vector3 = new THREE.Vector3(),
    ) { }

    setVelocityBias(v: THREE.Vector3): void {
        this.velocityBias.copy(v);
    }

    emit(source: THREE.Object3D, particle: Particle): Particle {
        do {
            this.scratch.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
            );
        } while (this.scratch.lengthSq() > 1 || this.scratch.lengthSq() < 1e-6);

        this.scratch.normalize();
        const r = lerp(Math.random(), this.minRadius, this.radius);
        particle.position.copy(source.position).addScaledVector(this.scratch, r);

        this.scratch.multiplyScalar(lerp(Math.random(), this.minSpeed, this.maxSpeed));
        particle.velocity.copy(this.scratch).add(this.velocityBias);
        return particle;
    }
}
