/**
 * Rigid body types and constraint definitions for barricade physics.
 *
 * Refactors the particle-based XPBD solver into a rigid body constraint system
 * while maintaining the existing Gauss-Seidel solver architecture and XPBD
 * integration method.
 */
import * as THREE from 'three';

/** Rigid body in the barricade rig system. */
export interface BarricadeRigidBody {
    /** Position in carrier-local coordinates (m). */
    pos: THREE.Vector3;
    /** Velocity in carrier-local coordinates (m/s). */
    vel: THREE.Vector3;
    /** Mass of the body (kg). */
    mass: number;
    /** Inverse mass (0 for pinned bodies). */
    invMass: number;
    /** Angular velocity in body-local frame (rad/s). */
    angularVel: THREE.Vector3;
    /**
     * Inertia tensor diagonal (Ixx, Iyy, Izz) in body frame.
     * For simple geometries: sphere I=2/5*m*r², cylinder I=1/2*m*r².
     */
    inertia: THREE.Vector3;
    /** Inverse inertia (0 for components that don't rotate). */
    invInertia: THREE.Vector3;
    /** Orientation quaternion. */
    quaternion: THREE.Quaternion;
    /** Accumulated contact normal for this substep (3D). */
    contactN: THREE.Vector3;
    /** Velocity of contact surface along normal (m/s). */
    contactVn: number;
    /** Aerodynamic drag coupling (1/s). */
    drag: number;
    /** Whether this body is currently active in the solve. */
    active: boolean;
}

/** Base class for constraints connecting rigid bodies. */
export abstract class BarricadeConstraint {
    /**
     * Accumulated Lagrange multiplier (tracks constraint force magnitude).
     * For distance constraints, this is the tension in Newtons.
     */
    lambda: number = 0;

    /**
     * Inverse compliance (stiffness); higher = stiffer.
     * Compliance is how much the constraint stretches per unit force.
     * For inextensible constraints, compliance = 0 (infinite stiffness).
     */
    alpha: number = 0;

    /** Whether this constraint is currently intact (not broken). */
    intact: boolean = true;

    /** Rest length or reference value (depends on constraint type). */
    restValue: number = 0;

    constructor(
        /** Index of first body (-1 if fixed world point). */
        public bodyA: number,
        /** Index of second body (-1 if fixed world point). */
        public bodyB: number,
    ) {}

    /**
     * Apply constraint projection (Gauss-Seidel iteration step).
     * Updates body positions/rotations to satisfy the constraint.
     *
     * @param bodies - Array of rigid bodies
     * @param invDt2 - Inverse timestep squared for compliance scaling
     * @returns Lambda delta (change in accumulated multiplier)
     */
    abstract project(bodies: BarricadeRigidBody[], invDt2: number): number;

    /**
     * Get the current constraint violation.
     * Positive = constraint violated (needs correction).
     * Negative or zero = constraint satisfied.
     */
    abstract getViolation(bodies: BarricadeRigidBody[]): number;
}

/**
 * Distance constraint: maintains fixed or compliant distance between two points.
 *
 * Used for:
 * - Belt segments (inextensible, alpha=0)
 * - Stripe webbing (compliant, alpha > 0 for nylon stretch)
 * - Purchase wires (highly compliant for cable extension)
 */
export class DistanceConstraint extends BarricadeConstraint {
    /**
     * Maximum tension this constraint can hold (N).
     * For engines: engineHoldN. For belts: 0 (unlimited).
     * Clamping the Lagrange multiplier at this value limits tension.
     */
    maxTension: number = 0;

    /**
     * Load at which this constraint parts (N).
     * Only used for tie-downs. 0 = never parts.
     * When exceeded and `intact = false`, constraint is not solved.
     */
    breakLoad: number = 0;

    /**
     * Position on body A where constraint is attached (local to body A).
     * For point bodies, this is typically (0, 0, 0).
     */
    attachA: THREE.Vector3 = new THREE.Vector3();

    /**
     * Position on body B where constraint is attached (local to body B).
     */
    attachB: THREE.Vector3 = new THREE.Vector3();

    /**
     * Cached direction vector from A to B (updated each solve).
     * Used for computing positional corrections.
     */
    private dir = new THREE.Vector3();

    /**
     * Cached distance between attachment points.
     */
    private dist = 0;

    project(bodies: BarricadeRigidBody[], invDt2: number): number {
        if (!this.intact) return 0;

        const a = bodies[this.bodyA];
        const b = bodies[this.bodyB];

        // Compute world-space attachment points
        // For now, assume bodies are point masses (attach = 0,0,0)
        // TODO: Apply body rotation to attachA/attachB for rigid bodies with geometry
        this.dir.subVectors(b.pos, a.pos);
        this.dist = this.dir.length();

        if (this.dist < 1e-6) return 0; // Degenerate: coincident points

        // Normalize direction
        this.dir.multiplyScalar(1 / this.dist);

        // Compute violation (positive = constraint stretched beyond rest length)
        const violation = this.dist - this.restValue;
        if (violation < -1e-6) return 0; // Slack: constraint satisfied (rope is loose)

        // Compute constraint force using XPBD (eXtended Position Based Dynamics)
        // See Müller et al. "Small Steps in Physics Simulation" (2019)
        const wa = a.invMass;
        const wb = b.invMass;
        const w = wa + wb;

        if (w < 1e-6) return 0; // Both bodies pinned

        // Compliance (inverse stiffness) scaled by timestep squared
        const alpha = this.alpha * invDt2;

        // XPBD constraint force calculation
        // dLambda = -(C + alpha*lambda_old) / (w + alpha)
        // where C = violation, w = sum of inverse masses
        const dLambda = -(violation + alpha * this.lambda) / (w + alpha);

        // Clamp if tension-limited (e.g., engine constraint holding at max force)
        let clampedDLambda = dLambda;
        if (this.maxTension > 0) {
            // Cap the accumulated multiplier at the maximum force
            const maxLambda = this.maxTension / invDt2;
            const newLambda = Math.max(0, Math.min(maxLambda, this.lambda + dLambda));
            clampedDLambda = newLambda - this.lambda;
        }

        // Apply positional correction
        // Split the correction according to mass ratios
        if (Math.abs(clampedDLambda) > 1e-9) {
            const dPos = clampedDLambda / w;
            a.pos.addScaledVector(this.dir, wa * dPos);
            b.pos.addScaledVector(this.dir, -wb * dPos);
        }

        // Accumulate multiplier (tracks constraint tension in Newtons)
        this.lambda += clampedDLambda;

        // Check for break (if applicable, e.g., tie-downs)
        if (this.breakLoad > 0 && Math.abs(this.lambda) > this.breakLoad) {
            this.intact = false;
        }

        return clampedDLambda;
    }

    getViolation(bodies: BarricadeRigidBody[]): number {
        const a = bodies[this.bodyA];
        const b = bodies[this.bodyB];
        const dist = a.pos.distanceTo(b.pos);
        return Math.max(0, dist - this.restValue);
    }
}

/**
 * Slider constraint: keeps a body moving along a 1D path (like a fitting on a belt).
 *
 * Models stripe fittings sliding along belts with:
 * - Coulomb friction preventing free motion
 * - Stiction threshold (static friction)
 * - Maximum creep speed under load
 * - Bunching limits (minimum spacing from neighbors)
 */
export class SliderConstraint extends BarricadeConstraint {
    /**
     * Current position along the slider path (arc length, m).
     * Updated by the constraint solver as the fitting moves.
     */
    sliderPos: number = 0;

    /**
     * Velocity along the slider (m/s).
     */
    sliderVel: number = 0;

    /**
     * Friction coefficient (Coulomb). Prevents motion below this load.
     */
    friction: number = 0.3;

    /**
     * Distance (m) the body must be pulled before it moves (stiction).
     * Represents static friction in the fitting hardware.
     */
    stictionDist: number = 0.02;

    /**
     * Maximum creep speed when under load (m/s).
     * Real fittings bind under tension, limiting how fast they slide.
     */
    maxCreepSpeed: number = 6;

    /**
     * Minimum distance from neighboring fittings (m).
     * Prevents fittings from passing through each other.
     */
    minSpacing: number = 0.12;

    project(bodies: BarricadeRigidBody[], invDt2: number): number {
        if (!this.intact) return 0;

        const body = bodies[this.bodyA];

        // TODO: Implement full slider constraint
        // This requires:
        // 1. Tracking the fitting's current arc-length position along the belt curve
        // 2. Projecting the fitting back onto the curve
        // 3. Applying friction forces based on tension
        // 4. Limiting creep speed under load
        // 5. Enforcing minimum spacing between fittings

        // For now, pin the fitting to its current belt position (no sliding)
        return 0;
    }

    getViolation(bodies: BarricadeRigidBody[]): number {
        // Slider violation is how far the body has strayed from the belt curve
        // TODO: Implement projection distance computation
        return 0;
    }
}

/**
 * Hinge constraint: allows rotation about a single axis.
 *
 * Used for:
 * - Stanchion deployment (rotates about X axis from 0° to 90°)
 * - Potentially cable sheaves (though not modeled currently)
 */
export class HingeConstraint extends BarricadeConstraint {
    /**
     * Hinge axis in world space.
     */
    axis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);

    /**
     * Hinge position in world space (rotation point).
     */
    hingePos: THREE.Vector3 = new THREE.Vector3();

    /**
     * Current angle (radians).
     */
    angle: number = 0;

    /**
     * Target angle for this substep (radians).
     * Used to animate stanchion deployment over time.
     */
    targetAngle: number = 0;

    /**
     * Angular stiffness: how quickly the constraint drives toward target.
     * Higher values make the constraint stiffer.
     */
    angularStiffness: number = 1000;

    project(bodies: BarricadeRigidBody[], invDt2: number): number {
        // Hinge constraints control stanchion deployment
        // The angle is driven toward targetAngle over time

        const body = bodies[this.bodyA];
        if (body.invMass === 0) return 0; // Pinned bodies don't rotate

        // TODO: Full implementation requires quaternion integration
        // For now, we just track the angle without applying rotation

        // Compute error from target angle
        const angleError = this.targetAngle - this.angle;

        // Apply angular "force" proportional to error and stiffness
        const dLambda = -angleError * this.angularStiffness * invDt2;

        // TODO: Convert dLambda to angular impulse on body
        // This requires adding angular momentum and integrating via quaternion

        return dLambda;
    }

    getViolation(bodies: BarricadeRigidBody[]): number {
        // Violation is angular error from target
        return Math.abs(this.targetAngle - this.angle);
    }
}

/**
 * Motor constraint: applies a limited force to control payout (arresting engines).
 *
 * Models the arresting engine behavior:
 * - Holds at fixed tension below engagement threshold
 * - Pays out at limited speed when aircraft engages
 * - Applies soft-start ramp to avoid jerk
 * - Retracts cable when not in use
 */
export class MotorConstraint extends BarricadeConstraint {
    /**
     * Holding force when idle (N).
     * Usually 0 to avoid rigging instability.
     */
    holdingForce: number = 0;

    /**
     * Maximum force the engine can hold during arrestment (N).
     */
    engineHoldN: number = 220000;

    /**
     * Maximum payout speed (m/s). Limits how fast cable pays out.
     */
    maxPayoutSpeed: number = 90;

    /**
     * Soft-start ramp distance (m).
     * Engine gradually ramps up to full holding force over this distance.
     */
    softStartDist: number = 3;

    /**
     * Current soft-start progress (0 to 1).
     * Interpolates from 0 to engineHoldN over softStartDist.
     */
    softStartFraction: number = 0;

    /**
     * Retraction speed when cable is slack (m/s).
     */
    retractSpeed: number = 2;

    /**
     * Current cable payout from rigged position (m).
     * Positive = paying out, negative would mean retracting.
     */
    payoutDist: number = 0;

    /**
     * Whether the aircraft is currently engaged (snagged in webbing).
     */
    engaged: boolean = false;

    /**
     * Tension being applied by this motor (N).
     */
    appliedTension: number = 0;

    project(bodies: BarricadeRigidBody[], invDt2: number): number {
        // Motor constraints apply force directly, not through position correction
        // They control cable payout by limiting how fast the constraint can stretch

        if (!this.engaged) {
            // Not engaged: retract cable slowly to keep rig taut
            this.payoutDist = Math.max(0, this.payoutDist - this.retractSpeed * (1 / Math.sqrt(invDt2)));
            return 0;
        }

        // Aircraft is engaged: manage payout under load
        const a = bodies[this.bodyA];
        const b = bodies[this.bodyB];
        const dist = a.pos.distanceTo(b.pos);

        // Compute soft-start ramp: gradually ramp up to full holding force
        if (this.payoutDist < this.softStartDist) {
            this.softStartFraction = this.payoutDist / this.softStartDist;
            this.appliedTension = this.engineHoldN * this.softStartFraction;
        } else {
            this.softStartFraction = 1.0;
            this.appliedTension = this.engineHoldN;
        }

        // Current rigged length is restValue + payoutDist
        const riggedLength = this.restValue + this.payoutDist;

        // If cable is being pulled, it can pay out up to maxPayoutSpeed
        const violation = dist - riggedLength;
        if (violation > 1e-6) {
            // Cable is stretched: payout is limited by speed
            const maxPayoutThisFrame = this.maxPayoutSpeed * (1 / Math.sqrt(invDt2));
            this.payoutDist = Math.min(this.payoutDist + maxPayoutThisFrame, this.payoutDist + violation);
        }

        // Apply tension as a constraint multiplier
        this.lambda = this.appliedTension / invDt2;

        return 0;
    }

    getViolation(bodies: BarricadeRigidBody[]): number {
        // Motors don't have violations; they apply forces directly
        return 0;
    }
}

/**
 * Contact constraint: handles collision between webbing and aircraft hull.
 *
 * Stores contact information for a single contact point between
 * a constraint body and an aircraft collision triangle.
 */
export class ContactConstraint extends BarricadeConstraint {
    /**
     * World-space position of contact point (m).
     */
    contactPos: THREE.Vector3 = new THREE.Vector3();

    /**
     * Surface normal (points away from aircraft hull).
     */
    normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

    /**
     * Penetration depth (positive = overlapping, m).
     */
    penetration: number = 0;

    /**
     * Friction coefficient between webbing and aircraft.
     */
    friction: number = 0.35; // Nylon on aluminum

    /**
     * Restitution (bounce); 0 = perfectly inelastic.
     */
    restitution: number = 0;

    project(bodies: BarricadeRigidBody[], invDt2: number): number {
        // TODO: Implement contact constraint projection
        // Apply normal and tangent impulses to resolve penetration
        return 0;
    }

    getViolation(bodies: BarricadeRigidBody[]): number {
        return Math.max(0, this.penetration);
    }
}

/**
 * Configuration describing how to initialize rigid bodies and constraints
 * from a barricade specification.
 *
 * This mirrors BarricadeSolverSpec but adapted for rigid bodies.
 */
export interface BarricadeRigidBodyLayout {
    /** Rigid bodies in the system. */
    bodies: BarricadeRigidBody[];

    /** Constraints connecting bodies. */
    constraints: BarricadeConstraint[];

    /**
     * Indices into constraints array for each system type.
     * Allows iterating constraints by type during solve.
     */
    beltConstraintRange: [number, number]; // start, end
    stripeConstraintRange: [number, number];
    wireConstraintRange: [number, number];
    tieDownConstraintRange: [number, number];
    motorConstraintRange: [number, number];
    contactConstraintRange: [number, number];

    /**
     * Body index of each component type (for force tracking).
     */
    stanchionLeftBodyIdx: number;
    stanchionRightBodyIdx: number;
    upperBeltBodies: number[]; // Indices of upper belt segment bodies
    lowerBeltBodies: number[];
    stripeBodies: number[][]; // [stripeIdx][nodeIdx]
    wireBodies: number[][]; // [wireIdx][nodeIdx]
    tieDownBodies: number[];
}
