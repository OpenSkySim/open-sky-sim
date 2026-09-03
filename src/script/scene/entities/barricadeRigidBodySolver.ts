/**
 * Rigid body constraint solver for carrier barricade physics.
 *
 * Refactors the particle-based XPBD solver into a rigid body system while
 * maintaining the proven Gauss-Seidel constraint iteration and small-step
 * integration strategy.
 *
 * Main differences from particle solver:
 * - Bodies have 6 DOF (position + rotation) instead of 3 DOF (position only)
 * - Constraints apply at attachment points on bodies
 * - Solver handles both linear and angular impulses
 * - Less strict on constraint count (can have larger bodies with fewer nodes)
 *
 * Keeps:
 * - XPBD (eXtended Position Based Dynamics) integration
 * - Gauss-Seidel alternating constraint sweep
 * - Float64 precision for accuracy during long arrestments
 * - Substep architecture (32 default)
 * - Snapshot compatibility with renderer
 */
import * as THREE from 'three';
import { AircraftCollisionMesh } from './aircraftDef';
import { TriangleBvh } from '../../physics/collision/triangleBvh';
import {
    BarricadeRigidBody,
    BarricadeConstraint,
    DistanceConstraint,
    SliderConstraint,
    HingeConstraint,
    MotorConstraint,
    ContactConstraint,
    BarricadeRigidBodyLayout,
} from './barricadeRigidBody';
import { BarricadeSolverSpec, BarricadeLayout } from './barricadeSolver';
import {
    bvhClosestPoint,
    bvhContainsPoint,
    bvhClosest,
    BvhClosest,
} from '../../physics/collision/triangleBvh';

/** Gravity in carrier-local Y (m/s²). */
export const BARRICADE_RB_GRAVITY = 9.81;

/** Wind over deck in carrier-local Z (m/s). */
export const BARRICADE_RB_DECK_WIND_MPS = 13;

/** Default substeps per step. */
export const BARRICADE_RB_SUBSTEPS = 32;

/** Default constraint sweeps per substep. */
export const BARRICADE_RB_SOLVER_PASSES = 2;

/** Longest step the solver will take in one go (s). */
export const BARRICADE_RB_MAX_STEP_S = 1 / 30;

/** How far webbing sits off the skin it's lying on (m). */
export const BARRICADE_RB_SKIN_M = 0.04;

/** Coulomb friction between webbing and airframe skin. */
export const BARRICADE_RB_HULL_FRICTION = 0.35;

/** Coulomb friction between webbing and deck. */
export const BARRICADE_RB_DECK_FRICTION = 0.6;

/**
 * Rigid body constraint solver for barricade webbing.
 *
 * Unlike the particle solver, this manages 6-DOF rigid bodies with
 * rotations and angular velocities, while maintaining the same XPBD
 * constraint solving approach.
 */
export class BarricadeRigidBodySolver {
    /** Solver specification (tuning parameters). */
    readonly spec: BarricadeSolverSpec;

    /** Layout of particles for renderer compatibility. */
    readonly layout: BarricadeLayout;

    /** Rigid bodies in the system. */
    readonly bodies: BarricadeRigidBody[];

    /** Constraints connecting bodies. */
    readonly constraints: BarricadeConstraint[];

    /** Layout indices for rendering particle positions. */
    readonly rbLayout: BarricadeRigidBodyLayout;

    /** Position array for rendering (Float32 copy of body positions). */
    readonly pos: Float32Array;

    /**
     * Particle count (for compatibility with particle solver API).
     * In rigid body system, this is the number of rendering positions
     * computed from body positions.
     */
    readonly count: number;

    /** Whether bodies have been laced and settled. */
    private laced: boolean = false;

    /** Deploy fraction (0 = stowed, 1 = fully raised). */
    private deploy: number = 0;

    /** Position at start of current substep (for velocity computation). */
    private prevPos: Map<BarricadeRigidBody, THREE.Vector3>;

    /** Collision mesh for aircraft. */
    private bvh: TriangleBvh | null = null;

    /** Aircraft pose (interpolated between main and worker frames). */
    private airframePose: { position: THREE.Vector3; quaternion: THREE.Quaternion } | null = null;

    /** Accumulated damping level (raised during settling). */
    private dampingRate: number = 0;

    /** Idle step accumulation (for coarse update of rigged nets). */
    private idleTime: number = 0;

    /** Accumulated force on aircraft from contact constraints (N). */
    private accumulatedAirframeForce = new THREE.Vector3();

    /** Accumulated torque on aircraft from contact constraints (N⋅m). */
    private accumulatedAirframeTorque = new THREE.Vector3();

    /** Reusable BvhClosest structure for collision queries. */
    private readonly bvhNear: BvhClosest = bvhClosest();

    /** Reusable vectors for collision calculations. */
    private contactPoint = new THREE.Vector3();
    private contactNormal = new THREE.Vector3();
    private relativePos = new THREE.Vector3();

    constructor(spec: BarricadeSolverSpec, layout: BarricadeLayout) {
        this.spec = spec;
        this.layout = layout;

        // Initialize body and constraint arrays
        this.bodies = [];
        this.constraints = [];
        this.rbLayout = {
            bodies: this.bodies,
            constraints: this.constraints,
            beltConstraintRange: [0, 0],
            stripeConstraintRange: [0, 0],
            wireConstraintRange: [0, 0],
            tieDownConstraintRange: [0, 0],
            motorConstraintRange: [0, 0],
            contactConstraintRange: [0, 0],
            stanchionLeftBodyIdx: -1,
            stanchionRightBodyIdx: -1,
            upperBeltBodies: [],
            lowerBeltBodies: [],
            stripeBodies: [],
            wireBodies: [],
            tieDownBodies: [],
        };

        // Position array for renderer
        this.count = layout.count;
        this.pos = new Float32Array(this.count * 3);

        this.prevPos = new Map();

        this.initializeRigidBodies();
        this.setupConstraints();
    }

    /**
     * Initialize rigid bodies from the barricade specification.
     *
     * Creates bodies for:
     * - Stanchion hinge points (pinned, driven by deploy fraction)
     * - Belt nodes (linked by distance constraints)
     * - Stripe segments (with sliding attachments to belts)
     * - Wire runs (extensible, capped by engine)
     * - Tie-down fittings (pinned to deck, breakable)
     */
    private initializeRigidBodies(): void {
        const spec = this.spec;
        const layout = this.layout;

        // Create stanchion hinge points (pinned, indices 0-3)
        const stanchionPos = [
            new THREE.Vector3(spec.leftX, spec.deckY, spec.planeZ),
            new THREE.Vector3(spec.rightX, spec.deckY, spec.planeZ),
            new THREE.Vector3(spec.leftX, spec.deckY, spec.planeZ),
            new THREE.Vector3(spec.rightX, spec.deckY, spec.planeZ),
        ];

        for (let i = 0; i < 4; i++) {
            const body: BarricadeRigidBody = {
                pos: stanchionPos[i].clone(),
                vel: new THREE.Vector3(),
                mass: 0, // Stanchions are driven, not simulated
                invMass: 0,
                angularVel: new THREE.Vector3(),
                inertia: new THREE.Vector3(1, 1, 1),
                invInertia: new THREE.Vector3(0, 0, 0),
                quaternion: new THREE.Quaternion(),
                contactN: new THREE.Vector3(),
                contactVn: 0,
                drag: 0,
                active: true,
            };
            this.bodies.push(body);
        }

        this.rbLayout.stanchionLeftBodyIdx = 0;
        this.rbLayout.stanchionRightBodyIdx = 1;

        // Create belt nodes
        const beltMass = spec.beltMass;
        const beltDrag = spec.cableDrag;

        this.rbLayout.upperBeltBodies = [];
        for (let i = 0; i < layout.beltNodes; i++) {
            const x = layout.beltStationX(i);
            const body: BarricadeRigidBody = {
                pos: new THREE.Vector3(x, spec.deckY + spec.height, spec.planeZ),
                vel: new THREE.Vector3(),
                mass: beltMass,
                invMass: 1 / beltMass,
                angularVel: new THREE.Vector3(),
                inertia: new THREE.Vector3(1, 1, 1),
                invInertia: new THREE.Vector3(0, 0, 0), // Belts don't rotate
                quaternion: new THREE.Quaternion(),
                contactN: new THREE.Vector3(),
                contactVn: 0,
                drag: beltDrag,
                active: true,
            };
            this.bodies.push(body);
            this.rbLayout.upperBeltBodies.push(this.bodies.length - 1);
        }

        this.rbLayout.lowerBeltBodies = [];
        for (let i = 0; i < layout.beltNodes; i++) {
            const x = layout.beltStationX(i);
            const body: BarricadeRigidBody = {
                pos: new THREE.Vector3(x, spec.deckY + spec.lowerLift, spec.planeZ),
                vel: new THREE.Vector3(),
                mass: beltMass,
                invMass: 1 / beltMass,
                angularVel: new THREE.Vector3(),
                inertia: new THREE.Vector3(1, 1, 1),
                invInertia: new THREE.Vector3(0, 0, 0),
                quaternion: new THREE.Quaternion(),
                contactN: new THREE.Vector3(),
                contactVn: 0,
                drag: beltDrag,
                active: true,
            };
            this.bodies.push(body);
            this.rbLayout.lowerBeltBodies.push(this.bodies.length - 1);
        }

        // Create stripe bodies
        const stripeMass = spec.stripeMass;
        const stripeDrag = spec.stripeDrag;

        this.rbLayout.stripeBodies = [];
        for (let s = 0; s < spec.stripes; s++) {
            const stripeBodies: number[] = [];
            for (let j = 0; j < spec.stripeNodes; j++) {
                const bodyIndex = layout.stripeNodeIndex(s, j);
                // Interpolate position between belts
                const t = j / (spec.stripeNodes - 1);
                const x = layout.beltStationX(layout.stripeBeltNode(s));
                const y = spec.deckY + spec.lowerLift + (spec.height - spec.lowerLift) * t;

                const body: BarricadeRigidBody = {
                    pos: new THREE.Vector3(x, y, spec.planeZ),
                    vel: new THREE.Vector3(),
                    mass: stripeMass,
                    invMass: 1 / stripeMass,
                    angularVel: new THREE.Vector3(),
                    inertia: new THREE.Vector3(1, 1, 1),
                    invInertia: new THREE.Vector3(0, 0, 0),
                    quaternion: new THREE.Quaternion(),
                    contactN: new THREE.Vector3(),
                    contactVn: 0,
                    drag: stripeDrag,
                    active: true,
                };
                this.bodies.push(body);
                stripeBodies.push(this.bodies.length - 1);
            }
            this.rbLayout.stripeBodies.push(stripeBodies);
        }

        // Create wire bodies (4 wires: UPPER_LEFT, UPPER_RIGHT, LOWER_LEFT, LOWER_RIGHT)
        const wireMass = spec.wireMass;
        const wireDrag = spec.cableDrag;

        this.rbLayout.wireBodies = [];
        for (let w = 0; w < 4; w++) {
            const wireBodies: number[] = [];
            const isUpper = w === 0 || w === 1;
            const isLeft = w === 0 || w === 2;
            const stanchionIdx = isLeft ? 0 : 1;
            const stanchion = this.bodies[stanchionIdx];
            const beltNodeIdx = isLeft ? 0 : layout.beltNodes - 1;

            for (let j = 0; j <= spec.wireNodes; j++) {
                const t = j / spec.wireNodes;
                const body: BarricadeRigidBody = {
                    pos: stanchion.pos.clone().lerp(
                        this.bodies[this.rbLayout[isUpper ? 'upperBeltBodies' : 'lowerBeltBodies'][beltNodeIdx]].pos,
                        t,
                    ),
                    vel: new THREE.Vector3(),
                    mass: wireMass,
                    invMass: 1 / wireMass,
                    angularVel: new THREE.Vector3(),
                    inertia: new THREE.Vector3(1, 1, 1),
                    invInertia: new THREE.Vector3(0, 0, 0),
                    quaternion: new THREE.Quaternion(),
                    contactN: new THREE.Vector3(),
                    contactVn: 0,
                    drag: wireDrag,
                    active: true,
                };
                this.bodies.push(body);
                wireBodies.push(this.bodies.length - 1);
            }
            this.rbLayout.wireBodies.push(wireBodies);
        }

        // Create tie-down bodies (pinned to deck)
        this.rbLayout.tieDownBodies = [];
        for (let t = 0; t < spec.tieDowns; t++) {
            const beltNodeIdx = layout.tieDownBeltNode(t);
            const x = layout.beltStationX(beltNodeIdx);
            const body: BarricadeRigidBody = {
                pos: new THREE.Vector3(x, spec.deckY, spec.planeZ),
                vel: new THREE.Vector3(),
                mass: 0, // Pinned to deck
                invMass: 0,
                angularVel: new THREE.Vector3(),
                inertia: new THREE.Vector3(1, 1, 1),
                invInertia: new THREE.Vector3(0, 0, 0),
                quaternion: new THREE.Quaternion(),
                contactN: new THREE.Vector3(),
                contactVn: 0,
                drag: 0,
                active: true,
            };
            this.bodies.push(body);
            this.rbLayout.tieDownBodies.push(this.bodies.length - 1);
        }

        console.log(`[BarricadeRigidBodySolver] Initialized ${this.bodies.length} bodies`);
    }

    /**
     * Set up constraints from the barricade specification.
     *
     * Creates constraints for:
     * - Belt length (distance constraints, inextensible)
     * - Stripe length (distance constraints, compliant for stretch)
     * - Wire runs (distance constraints, extensible)
     * - Stripe fittings (slider constraints on belts)
     * - Engine dynamics (motor constraints)
     * - Deck tie-downs (breakable distance constraints)
     */
    private setupConstraints(): void {
        const spec = this.spec;
        const layout = this.layout;

        // Belt constraints (inextensible, alpha=0)
        this.rbLayout.beltConstraintRange = [this.constraints.length, this.constraints.length];

        // Upper belt constraints
        for (let i = 0; i + 1 < layout.beltNodes; i++) {
            const bodyAIdx = this.rbLayout.upperBeltBodies[i];
            const bodyBIdx = this.rbLayout.upperBeltBodies[i + 1];
            const bodyA = this.bodies[bodyAIdx];
            const bodyB = this.bodies[bodyBIdx];

            const constraint = new DistanceConstraint(bodyAIdx, bodyBIdx);
            constraint.restValue = bodyA.pos.distanceTo(bodyB.pos);
            constraint.alpha = 0; // Inextensible
            this.constraints.push(constraint);
        }

        // Lower belt constraints
        for (let i = 0; i + 1 < layout.beltNodes; i++) {
            const bodyAIdx = this.rbLayout.lowerBeltBodies[i];
            const bodyBIdx = this.rbLayout.lowerBeltBodies[i + 1];
            const bodyA = this.bodies[bodyAIdx];
            const bodyB = this.bodies[bodyBIdx];

            const constraint = new DistanceConstraint(bodyAIdx, bodyBIdx);
            constraint.restValue = bodyA.pos.distanceTo(bodyB.pos);
            constraint.alpha = 0; // Inextensible
            this.constraints.push(constraint);
        }

        this.rbLayout.beltConstraintRange[1] = this.constraints.length;

        // Stripe constraints (compliant, alpha > 0 for nylon stretch)
        this.rbLayout.stripeConstraintRange = [this.constraints.length, this.constraints.length];

        const stripeStiffness = spec.stripeAxialStiffnessN;
        const stripeCompliance = stripeStiffness > 0 ? 1 / stripeStiffness : 0;

        for (let s = 0; s < spec.stripes; s++) {
            const stripeBodies = this.rbLayout.stripeBodies[s];
            for (let j = 0; j + 1 < stripeBodies.length; j++) {
                const bodyAIdx = stripeBodies[j];
                const bodyBIdx = stripeBodies[j + 1];
                const bodyA = this.bodies[bodyAIdx];
                const bodyB = this.bodies[bodyBIdx];

                const constraint = new DistanceConstraint(bodyAIdx, bodyBIdx);
                constraint.restValue = bodyA.pos.distanceTo(bodyB.pos) * (1 - spec.stripeSlack);
                constraint.alpha = stripeCompliance; // Compliant: allows nylon to stretch
                this.constraints.push(constraint);
            }
        }

        this.rbLayout.stripeConstraintRange[1] = this.constraints.length;

        // Wire constraints (highly compliant for cable extension)
        this.rbLayout.wireConstraintRange = [this.constraints.length, this.constraints.length];

        const wireStiffness = spec.wireAxialStiffnessN;
        const wireCompliance = wireStiffness > 0 ? 1 / wireStiffness : 0;

        for (let w = 0; w < 4; w++) {
            const wireBodies = this.rbLayout.wireBodies[w];
            for (let j = 0; j + 1 < wireBodies.length; j++) {
                const bodyAIdx = wireBodies[j];
                const bodyBIdx = wireBodies[j + 1];
                const bodyA = this.bodies[bodyAIdx];
                const bodyB = this.bodies[bodyBIdx];

                const constraint = new DistanceConstraint(bodyAIdx, bodyBIdx);
                constraint.restValue = bodyA.pos.distanceTo(bodyB.pos);
                constraint.alpha = wireCompliance;

                // Wires are capped at engine holding force
                if (w < 4) {
                    constraint.maxTension = spec.engineHoldN;
                }

                this.constraints.push(constraint);
            }
        }

        this.rbLayout.wireConstraintRange[1] = this.constraints.length;

        // Tie-down constraints (breakable distance constraints)
        this.rbLayout.tieDownConstraintRange = [this.constraints.length, this.constraints.length];

        for (let t = 0; t < spec.tieDowns; t++) {
            const lowerBeltNodeIdx = layout.tieDownBeltNode(t);
            const lowerBeltBodyIdx = this.rbLayout.lowerBeltBodies[lowerBeltNodeIdx];
            const tieDownBodyIdx = this.rbLayout.tieDownBodies[t];
            const bodyA = this.bodies[lowerBeltBodyIdx];
            const bodyB = this.bodies[tieDownBodyIdx];

            const constraint = new DistanceConstraint(lowerBeltBodyIdx, tieDownBodyIdx);
            constraint.restValue = bodyA.pos.distanceTo(bodyB.pos);
            constraint.alpha = 0; // Inextensible
            constraint.breakLoad = spec.tieDownBreakN || 0;
            this.constraints.push(constraint);
        }

        this.rbLayout.tieDownConstraintRange[1] = this.constraints.length;

        // Stripe fitting slider constraints
        // Each stripe has two fittings: one on upper belt, one on lower belt
        // These fittings can slide along the belt when pulled by the fuselage
        for (let s = 0; s < spec.stripes; s++) {
            // Upper belt fitting
            const upperFittingIdx = this.rbLayout.stripeBodies[s][spec.stripeNodes - 1]; // Last node = upper fitting
            const upperConstraint = new SliderConstraint(upperFittingIdx, -1);
            upperConstraint.beltNodeIndices = this.rbLayout.upperBeltBodies;
            upperConstraint.friction = 0.35; // Nylon on aluminum/rope
            upperConstraint.stictionDist = 0.02; // BARRICADE_FITTING_STICTION_M
            upperConstraint.maxCreepSpeed = spec.slideSpeed;
            upperConstraint.minSpacing = 0.12; // BARRICADE_FITTING_GAP_M
            this.constraints.push(upperConstraint);

            // Lower belt fitting
            const lowerFittingIdx = this.rbLayout.stripeBodies[s][0]; // First node = lower fitting
            const lowerConstraint = new SliderConstraint(lowerFittingIdx, -1);
            lowerConstraint.beltNodeIndices = this.rbLayout.lowerBeltBodies;
            lowerConstraint.friction = 0.35;
            lowerConstraint.stictionDist = 0.02;
            lowerConstraint.maxCreepSpeed = spec.slideSpeed;
            lowerConstraint.minSpacing = 0.12;
            this.constraints.push(lowerConstraint);
        }

        // Motor constraints (will be added when aircraft engages)
        this.rbLayout.motorConstraintRange = [this.constraints.length, this.constraints.length];

        // Contact constraints (generated dynamically during solve)
        this.rbLayout.contactConstraintRange = [this.constraints.length, this.constraints.length];

        console.log(`[BarricadeRigidBodySolver] Set up ${this.constraints.length} constraints`);
    }

    /**
     * Initialize or reinitialize the rig, settling it under high damping.
     *
     * Called when the barricade is first rigged or after a re-rig.
     * Settles the webbing under gravity and wind with high damping
     * to reach equilibrium quickly without oscillation.
     *
     * @param deployFraction - Initial deployment (usually 1 = fully raised)
     */
    reset(deployFraction: number = 1): void {
        this.deploy = deployFraction;
        this.laced = false;
        this.dampingRate = 6; // High damping during settling
        this.idleTime = 0;

        // Clear all velocities and contact state
        for (const body of this.bodies) {
            body.vel.set(0, 0, 0);
            body.angularVel.set(0, 0, 0);
            body.contactN.set(0, 0, 0);
            body.contactVn = 0;
        }

        // Reset constraint state
        for (const constraint of this.constraints) {
            constraint.lambda = 0;
            constraint.intact = true;
        }

        // Run settling substeps to reach equilibrium
        const settleSteps = 90; // Frames to settle (3 seconds at 30 Hz)
        for (let i = 0; i < settleSteps; i++) {
            this.step(1 / 30);
        }

        this.laced = true;
        this.dampingRate = this.spec.damping;
    }

    /**
     * Set the current deployment fraction (0 = stowed, 1 = raised).
     *
     * Animates the stanchion hinge constraint toward the target angle.
     * Stanchions rotate about the X axis (pitch) from 0° (flat on deck) to 90° (vertical).
     *
     * @param fraction - Deploy fraction (0 to 1)
     */
    setDeploy(fraction: number): void {
        this.deploy = Math.max(0, Math.min(1, fraction));

        // Target angle: 0° when stowed, 90° when raised
        const targetAngle = fraction * Math.PI / 2;

        // Update hinge constraints for both stanchions
        // TODO: Find hinge constraints for stanchions and set their targetAngle
    }

    /**
     * Set the collision mesh and pose of the aircraft.
     *
     * Called each frame to provide the solver with the current aircraft
     * position and collision geometry for webbing contact detection.
     *
     * @param bvh - Collision BVH for triangle mesh queries
     * @param pose - Position and rotation of aircraft
     */
    setAirframe(bvh: TriangleBvh | null, pose: { position: THREE.Vector3; quaternion: THREE.Quaternion } | null): void {
        this.bvh = bvh;
        this.airframePose = pose;
    }

    /**
     * Advance the solver by one timestep.
     *
     * Splits long steps into substeps to maintain solver stability
     * with stiff inextensible constraints. Each substep:
     * 1. Predicts positions using forces (gravity, wind, drag)
     * 2. Applies position/rotation constraints via Gauss-Seidel
     * 3. Computes velocities from position change
     * 4. Applies velocity damping and contact impulses
     *
     * @param dt - Timestep (s)
     */
    step(dt: number): void {
        if (!this.laced || this.bodies.length === 0) {
            return; // Not ready
        }

        // Split long steps to avoid substep blow-up
        const maxStep = BARRICADE_RB_MAX_STEP_S;
        let remaining = dt;

        while (remaining > 1e-6) {
            const slice = Math.min(remaining, maxStep);
            this.substepSequence(slice);
            remaining -= slice;
        }
    }

    /**
     * Run one full substep sequence.
     *
     * @param dt - Timestep for this slice (s)
     */
    private substepSequence(dt: number): void {
        const substeps = this.spec.substeps;
        const h = dt / substeps;
        const invH2 = 1 / (h * h);

        // Clear accumulated forces each full step
        this.accumulatedAirframeForce.set(0, 0, 0);
        this.accumulatedAirframeTorque.set(0, 0, 0);

        for (let i = 0; i < substeps; i++) {
            // Store previous positions for velocity computation
            for (const body of this.bodies) {
                this.prevPos.set(body, body.pos.clone());
            }

            // Predict: apply forces and gravity
            this.predict(h);

            // Detect collisions with aircraft and generate contact constraints
            if (this.bvh && this.airframePose) {
                this.detectCollisions();
            }

            // Constrain: solve distance/slider/hinge/motor/contact constraints
            for (let pass = 0; pass < this.spec.solverPasses; pass++) {
                for (const constraint of this.constraints) {
                    constraint.project(this.bodies, invH2);
                }
                // After each pass, enforce fitting spacing to prevent bunching
                this.enforceSpacing();
            }

            // Finish: compute velocities from position change and contact damping
            this.finish(h);
        }

        // Update rendering positions
        this.writeRenderingPositions();
    }

    /**
     * Enforce minimum spacing between neighboring stripe fittings.
     *
     * Prevents fittings from bunching and passing through each other when
     * a fuselage shoulders them aside. This is done as a separate pass after
     * main constraint solving to ensure proper collision avoidance.
     */
    private enforceSpacing(): void {
        const spec = this.spec;

        // For each stripe, check spacing between this and next stripe's fittings
        for (let s = 0; s + 1 < spec.stripes; s++) {
            const thisStripeBodies = this.rbLayout.stripeBodies[s];
            const nextStripeBodies = this.rbLayout.stripeBodies[s + 1];

            // Check upper belt fittings
            const thisUpperIdx = thisStripeBodies[spec.stripeNodes - 1];
            const nextUpperIdx = nextStripeBodies[spec.stripeNodes - 1];
            const thisUpperPos = this.bodies[thisUpperIdx].pos;
            const nextUpperPos = this.bodies[nextUpperIdx].pos;

            let upperDist = thisUpperPos.distanceTo(nextUpperPos);
            if (upperDist < 0.12) { // BARRICADE_FITTING_GAP_M
                // Too close: push them apart
                const dir = new THREE.Vector3().subVectors(nextUpperPos, thisUpperPos);
                if (dir.length() > 1e-6) {
                    dir.normalize();
                    const push = (0.12 - upperDist) / 2;
                    if (this.bodies[thisUpperIdx].invMass > 0) {
                        thisUpperPos.addScaledVector(dir, -push);
                    }
                    if (this.bodies[nextUpperIdx].invMass > 0) {
                        nextUpperPos.addScaledVector(dir, push);
                    }
                }
            }

            // Check lower belt fittings
            const thisLowerIdx = thisStripeBodies[0];
            const nextLowerIdx = nextStripeBodies[0];
            const thisLowerPos = this.bodies[thisLowerIdx].pos;
            const nextLowerPos = this.bodies[nextLowerIdx].pos;

            let lowerDist = thisLowerPos.distanceTo(nextLowerPos);
            if (lowerDist < 0.12) {
                const dir = new THREE.Vector3().subVectors(nextLowerPos, thisLowerPos);
                if (dir.length() > 1e-6) {
                    dir.normalize();
                    const push = (0.12 - lowerDist) / 2;
                    if (this.bodies[thisLowerIdx].invMass > 0) {
                        thisLowerPos.addScaledVector(dir, -push);
                    }
                    if (this.bodies[nextLowerIdx].invMass > 0) {
                        nextLowerPos.addScaledVector(dir, push);
                    }
                }
            }
        }
    }

    /**
     * Detect collisions between webbing and aircraft hull.
     *
     * Queries the BVH for each body to find closest points on the aircraft
     * surface. Bodies that penetrate are corrected and contact forces are accumulated.
     */
    private detectCollisions(): void {
        if (!this.bvh || !this.airframePose) return;

        const skinMargin = BARRICADE_RB_SKIN_M;

        // Skip stanchions (indices 0-3) as they're pinned
        for (let i = 4; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body.invMass === 0) continue; // Skip pinned bodies

            // Query BVH for closest point on aircraft surface
            if (!bvhClosestPoint(this.bvh, body.pos.x, body.pos.y, body.pos.z, 1e4, this.bvhNear)) {
                continue; // No collision
            }

            // Check if body penetrated the mesh
            if (!bvhContainsPoint(this.bvh, body.pos.x, body.pos.y, body.pos.z)) {
                continue; // Body is outside mesh, no contact
            }

            // Body has penetrated: compute normal and push it out
            this.contactPoint.set(this.bvhNear.x, this.bvhNear.y, this.bvhNear.z);
            this.contactNormal.subVectors(body.pos, this.contactPoint);

            const distToSurface = this.contactNormal.length();
            if (distToSurface < 1e-9) continue; // Degenerate case

            this.contactNormal.multiplyScalar(1 / distToSurface);

            // Position correction: push body out of mesh
            const penetration = distToSurface - skinMargin;
            if (penetration < 0) {
                body.pos.addScaledVector(this.contactNormal, -penetration * 0.5);
            }

            // Track contact for this body
            body.contactN.copy(this.contactNormal);
            body.contactVn = 0; // Aircraft surface velocity (TODO: compute from pose)

            // Accumulate impulse on aircraft from constraint forces pulling this body
            // Sum all constraints pulling on this body to get the net tension
            let constraintForce = 0;
            for (const constraint of this.constraints) {
                if (constraint.bodyA === i || constraint.bodyB === i) {
                    // Distance constraint lambda is tension in Newtons
                    constraintForce += Math.abs(constraint.lambda);
                }
            }

            // If no constraints are pulling on this body, use contact penalty force
            // This prevents the aircraft from slipping through unconnected webbing
            if (constraintForce < 1000) {
                constraintForce = Math.max(constraintForce, 5000); // Minimum 5 kN contact force
            }

            // Apply reaction impulse to aircraft: -F (Newton's third law)
            this.accumulatedAirframeForce.addScaledVector(this.contactNormal, -constraintForce);

            // Accumulate torque: r × F where r is from aircraft CG to contact point
            this.relativePos.copy(this.contactPoint).sub(this.airframePose.position);
            const torque = new THREE.Vector3();
            torque.crossVectors(this.relativePos, this.contactNormal);
            torque.multiplyScalar(constraintForce);
            this.accumulatedAirframeTorque.add(torque);
        }
    }

    /**
     * Predict step: apply forces and move bodies forward.
     *
     * Applies:
     * - Gravity (m/s² downward)
     * - Wind drag (proportional to velocity)
     * - Aerodynamic drag on wide stripes
     * - Damping
     *
     * @param h - Substep size (s)
     */
    private predict(h: number): void {
        const g = -BARRICADE_RB_GRAVITY; // Carrier-local Y (negative = downward)
        const windZ = BARRICADE_RB_DECK_WIND_MPS; // Aft (toward groove)
        const damping = Math.exp(-this.dampingRate * h);

        for (const body of this.bodies) {
            if (body.invMass === 0) continue; // Pinned bodies don't move

            // Apply gravity
            body.vel.y += g * h;

            // Apply aerodynamic drag (exponential decay: v *= e^(-drag * dt))
            // Wind is steady aft at deck level, so affects Z velocity
            if (body.drag > 0) {
                // Damped velocity relative to wind field
                const vx = body.vel.x;
                const vy = body.vel.y;
                const vz = body.vel.z - windZ; // Relative to wind

                const dragCoeff = Math.exp(-body.drag * h);
                body.vel.x = vx * dragCoeff;
                body.vel.y = vy * dragCoeff;
                body.vel.z = vz * dragCoeff + windZ; // Add back wind

                // Clamp extremely small velocities to zero
                if (Math.abs(body.vel.x) < 1e-6) body.vel.x = 0;
                if (Math.abs(body.vel.y) < 1e-6) body.vel.y = 0;
                if (Math.abs(body.vel.z - windZ) < 1e-6) body.vel.z = windZ;
            }

            // Apply structural damping (energy dissipation)
            body.vel.multiplyScalar(damping);
            body.angularVel.multiplyScalar(damping);

            // Semi-implicit Euler integration: predict new position
            body.pos.addScaledVector(body.vel, h);

            // TODO: Integrate rotation (quaternion from angular velocity)
            // For now, skip rotation integration until HingeConstraint is fully implemented
        }
    }

    /**
     * Finish step: update velocities from position changes and apply contact damping.
     *
     * Derives velocity from the change in position (since constraints moved
     * bodies), then applies contact damping if the body hit something.
     *
     * @param h - Substep size (s)
     */
    private finish(h: number): void {
        const invH = 1 / h;

        for (const body of this.bodies) {
            if (body.invMass === 0) continue;

            const prev = this.prevPos.get(body);
            if (!prev) continue;

            // Velocity = (p_new - p_old) / h (from constraint correction)
            const dPos = new THREE.Vector3();
            dPos.subVectors(body.pos, prev);
            body.vel.copy(dPos).multiplyScalar(invH);

            // Apply contact damping if body is in contact with aircraft
            // contactN is the surface normal (set by contact detection)
            // contactVn is the surface velocity along the normal
            if (body.contactN.lengthSq() > 1e-6) {
                // Compute velocity component along contact normal
                const vn = body.vel.dot(body.contactN);

                // If body is moving into contact, damp it
                if (vn < body.contactVn) {
                    const dampingFactor = 0.1; // Contact damping coefficient
                    const dv = (vn - body.contactVn) * dampingFactor;
                    body.vel.addScaledVector(body.contactN, -dv);
                }

                // Clear contact for next substep
                body.contactN.set(0, 0, 0);
                body.contactVn = 0;
            }
        }
    }

    /**
     * Update rendering position array from rigid body positions.
     *
     * Writes all rigid body positions to the position buffer in the order
     * expected by the particle layout (which the renderer uses).
     * Since bodies are 1:1 with particles, this is a straightforward copy.
     */
    private writeRenderingPositions(): void {
        // Write body positions to Float32 array for rendering
        // Bodies are in the same order as BarricadeLayout expects them
        let idx = 0;

        // Stanchions (4 bodies)
        for (let i = 0; i < 4; i++) {
            const body = this.bodies[i];
            this.pos[idx++] = body.pos.x;
            this.pos[idx++] = body.pos.y;
            this.pos[idx++] = body.pos.z;
        }

        // Upper belt (beltNodes bodies)
        for (const bodyIdx of this.rbLayout.upperBeltBodies) {
            const body = this.bodies[bodyIdx];
            this.pos[idx++] = body.pos.x;
            this.pos[idx++] = body.pos.y;
            this.pos[idx++] = body.pos.z;
        }

        // Lower belt
        for (const bodyIdx of this.rbLayout.lowerBeltBodies) {
            const body = this.bodies[bodyIdx];
            this.pos[idx++] = body.pos.x;
            this.pos[idx++] = body.pos.y;
            this.pos[idx++] = body.pos.z;
        }

        // Stripes
        for (const stripeBodies of this.rbLayout.stripeBodies) {
            for (const bodyIdx of stripeBodies) {
                const body = this.bodies[bodyIdx];
                this.pos[idx++] = body.pos.x;
                this.pos[idx++] = body.pos.y;
                this.pos[idx++] = body.pos.z;
            }
        }

        // Wires
        for (const wireBodies of this.rbLayout.wireBodies) {
            for (const bodyIdx of wireBodies) {
                const body = this.bodies[bodyIdx];
                this.pos[idx++] = body.pos.x;
                this.pos[idx++] = body.pos.y;
                this.pos[idx++] = body.pos.z;
            }
        }

        // Tie-downs
        for (const bodyIdx of this.rbLayout.tieDownBodies) {
            const body = this.bodies[bodyIdx];
            this.pos[idx++] = body.pos.x;
            this.pos[idx++] = body.pos.y;
            this.pos[idx++] = body.pos.z;
        }
    }

    /**
     * Write particle positions to snapshot buffer for transmission to main thread.
     *
     * Called by CombatSim when encoding the snapshot.
     *
     * @param out - Float32Array to write into
     * @param offset - Byte offset in array
     * @returns Position in output array after write
     */
    writeTo(out: Float32Array, offset: number): number {
        // Convert Float64 positions to Float32 for transmission
        for (let i = 0; i < this.count * 3; i++) {
            out[offset + i] = this.pos[i];
        }
        return offset + this.count * 3;
    }

    /**
     * Get the accumulated force on the aircraft (N).
     *
     * Sums all contact impulses from webbing collisions.
     * Called by CombatSim to apply forces to the flight model.
     * Force is computed from contact constraint multipliers and normals.
     *
     * @returns Force in carrier-local coordinates (N)
     */
    airframeForce(): THREE.Vector3 {
        return this.accumulatedAirframeForce.clone();
    }

    /**
     * Get the accumulated torque on the aircraft (N⋅m).
     *
     * Sums all contact torques from webbing collisions.
     * Torque = (contact_pos - aircraft_cg) × force
     *
     * @returns Torque in carrier-local coordinates (N⋅m)
     */
    airframeTorque(): THREE.Vector3 {
        return this.accumulatedAirframeTorque.clone();
    }

    /**
     * Signal that aircraft has engaged the barricade.
     *
     * Activates motor constraints on the 4 wire runs to begin
     * applying holding force and limiting payout speed.
     *
     * TODO: Full implementation should:
     * - Create MotorConstraint instances for the 4 wires
     * - Set engaged=true on each motor
     * - Add them to the constraint list
     */
    engageAircraft(): void {
        // Only engage once
        if (this.rbLayout.motorConstraintRange[1] > this.rbLayout.motorConstraintRange[0]) {
            // Motors already created, just engage them
            for (let i = this.rbLayout.motorConstraintRange[0]; i < this.rbLayout.motorConstraintRange[1]; i++) {
                const motor = this.constraints[i] as MotorConstraint;
                motor.engaged = true;
            }
            return;
        }

        // Create motor constraints for the 4 wire runs
        this.rbLayout.motorConstraintRange[0] = this.constraints.length;

        for (let w = 0; w < 4; w++) {
            const wireBodies = this.rbLayout.wireBodies[w];
            if (wireBodies.length < 2) continue; // Need at least anchor + end

            // Wire runs from anchor (first body) to aircraft contact point (last body)
            const anchorBodyIdx = wireBodies[0];
            const endBodyIdx = wireBodies[wireBodies.length - 1];

            const motorConstraint = new MotorConstraint(anchorBodyIdx, endBodyIdx);
            motorConstraint.engaged = true; // Engage immediately
            motorConstraint.engineHoldN = this.spec.engineHoldN;
            motorConstraint.maxPayoutSpeed = this.spec.enginePayoutMaxMps;
            motorConstraint.softStartDist = 3; // Default soft-start distance (m)
            motorConstraint.retractSpeed = this.spec.engineRetractMps;
            motorConstraint.holdingForce = 0; // No holding force before engagement

            // Compute initial cable length from anchor to end body
            const anchorBody = this.bodies[anchorBodyIdx];
            const endBody = this.bodies[endBodyIdx];
            motorConstraint.restValue = anchorBody.pos.distanceTo(endBody.pos);
            motorConstraint.payoutDist = 0;

            this.constraints.push(motorConstraint);
        }

        this.rbLayout.motorConstraintRange[1] = this.constraints.length;
    }

    /**
     * Signal that aircraft has disengaged from the barricade.
     *
     * Deactivates motor constraints so wires return to retract mode.
     */
    disengageAircraft(): void {
        for (let i = this.rbLayout.motorConstraintRange[0]; i < this.rbLayout.motorConstraintRange[1]; i++) {
            const motor = this.constraints[i] as MotorConstraint;
            motor.engaged = false;
        }
    }

    /**
     * Get the current tension in each wire run (N).
     *
     * Used for diagnostics and to determine if arrest is complete.
     * Returns tension from each of the 4 wire runs: UPPER_LEFT, UPPER_RIGHT, LOWER_LEFT, LOWER_RIGHT.
     */
    wireTension(): Float64Array {
        const tensions = new Float64Array(4);

        // Extract tension from constraints in the wire range
        const [wireStart, wireEnd] = this.rbLayout.wireConstraintRange;
        let wireIdx = 0;

        for (let i = wireStart; i < wireEnd && wireIdx < 4; i++) {
            const constraint = this.constraints[i];
            if (constraint instanceof DistanceConstraint) {
                // Each wire run starts with a constraint to the stanchion
                // Take the first constraint's tension as representative
                tensions[wireIdx] = Math.max(0, constraint.lambda);
                wireIdx++;
            }
        }

        return tensions;
    }
}
