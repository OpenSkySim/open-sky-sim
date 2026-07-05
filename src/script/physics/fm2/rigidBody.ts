/**
 * Generic 6-DOF rigid body integrator (Newton–Euler).
 *
 * Translational dynamics are integrated in the WORLD frame (so the result maps
 * directly onto the sim's world-space velocity/position). Rotational dynamics
 * are integrated in the BODY frame, which is the natural frame for the inertia
 * tensor and for Euler's equation:
 *
 *     I · ω̇ = M − ω × (I · ω)
 *
 * with a diagonal inertia tensor I = diag(Ix, Iy, Iz). The ω × (I·ω)
 * gyroscopic term couples the axes and reproduces effects such as inertial
 * pitch-up in a rolling pull. Orientation is advanced by composing the body
 * quaternion with the incremental rotation exp(½ ω dt).
 */
import * as THREE from 'three';

export interface InertiaDiagonal {
    /** Moment of inertia about body +X (RIGHT / pitch axis). */
    x: number;
    /** Moment of inertia about body +Y (UP / yaw axis). */
    y: number;
    /** Moment of inertia about body +Z (FORWARD / roll axis). */
    z: number;
}

export class RigidBody {
    readonly mass: number;
    readonly inertia: InertiaDiagonal;

    /** Orientation: body → world. */
    readonly orientation = new THREE.Quaternion();
    /** Linear velocity, world frame (m/s). */
    readonly velocityWorld = new THREE.Vector3();
    /** Angular velocity, body frame (rad/s): (pitch, yaw, roll) about (X, Y, Z). */
    readonly angularVelocityBody = new THREE.Vector3();

    private readonly _iw = new THREE.Vector3();
    private readonly _gyro = new THREE.Vector3();
    private readonly _angAccel = new THREE.Vector3();
    private readonly _dq = new THREE.Quaternion();
    private readonly _axis = new THREE.Vector3();

    constructor(mass: number, inertia: InertiaDiagonal) {
        this.mass = mass;
        this.inertia = inertia;
    }

    reset(): void {
        this.orientation.identity();
        this.velocityWorld.set(0, 0, 0);
        this.angularVelocityBody.set(0, 0, 0);
    }

    /**
     * Advance the rotational state.
     * @param momentBody Net moment about the CG, body frame (N·m).
     * @param dt         Timestep (s).
     */
    integrateAngular(momentBody: THREE.Vector3, dt: number): void {
        const w = this.angularVelocityBody;
        const I = this.inertia;

        // Iω and the gyroscopic term ω × (Iω).
        this._iw.set(I.x * w.x, I.y * w.y, I.z * w.z);
        this._gyro.crossVectors(w, this._iw);

        // ω̇ = I⁻¹ (M − ω × Iω)
        this._angAccel.set(
            (momentBody.x - this._gyro.x) / I.x,
            (momentBody.y - this._gyro.y) / I.y,
            (momentBody.z - this._gyro.z) / I.z,
        );

        w.addScaledVector(this._angAccel, dt);

        // Advance orientation by the incremental body-frame rotation.
        const omega = w.length();
        if (omega > 1e-9) {
            this._axis.copy(w).multiplyScalar(1 / omega);
            this._dq.setFromAxisAngle(this._axis, omega * dt);
            this.orientation.multiply(this._dq); // body-frame delta applied on the right
            this.orientation.normalize();
        }
    }

    /**
     * Advance the translational state.
     * @param forceWorld Net force in the world frame (N), gravity included.
     * @param dt         Timestep (s).
     * @param outPosition Position accumulator to advance (world, m).
     */
    integrateLinear(forceWorld: THREE.Vector3, dt: number, outPosition: THREE.Vector3): void {
        // a = F / m ; semi-implicit Euler (update velocity, then position).
        this.velocityWorld.addScaledVector(forceWorld, dt / this.mass);
        outPosition.addScaledVector(this.velocityWorld, dt);
    }
}
