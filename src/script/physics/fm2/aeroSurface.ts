/**
 * A single rigid aerodynamic surface for the FM2 parts model.
 *
 * Given the aircraft's body-frame linear velocity, body angular velocity and
 * the local air density, the surface computes the lift + drag force it produces
 * and the moment that force exerts about the CG. The key detail that makes the
 * whole model behave is that the airflow seen by the surface includes the
 * velocity contributed by rotation at its own location:
 *
 *     u_local = v_body + ω × r
 *
 * A pitch rate therefore raises the AoA of the tail, a roll rate raises the AoA
 * of the down-going wing, and a yaw rate loads the fin — i.e. pitch, roll and
 * yaw aerodynamic damping all appear automatically from the geometry.
 */
import * as THREE from 'three';
import { SurfaceGeometry } from './f16Fm2Config';

export interface SurfaceInput {
    /** Body-frame velocity of the CG through the air (m/s). */
    velocityBody: THREE.Vector3;
    /** Body-frame angular velocity (rad/s). */
    angularVelocityBody: THREE.Vector3;
    /** Air density (kg/m³). */
    airDensity: number;
    /** Effective incidence added by control deflection (rad). */
    controlDeltaAoaRad: number;
    /** Symmetric camber bias, e.g. flaps (rad). */
    camberBiasRad: number;
    /** Reduction of the stall AoA, e.g. from flaps (rad). */
    stallShiftRad: number;
    /** Additional profile drag coefficient (referenced to this surface's area). */
    extraCd: number;
}

export class AeroSurface {
    readonly name: string;
    private readonly geom: SurfaceGeometry;

    private readonly position = new THREE.Vector3();
    private readonly up = new THREE.Vector3();
    private readonly forward = new THREE.Vector3();
    private readonly span = new THREE.Vector3();

    private readonly _u = new THREE.Vector3();
    private readonly _rot = new THREE.Vector3();
    private readonly _dragDir = new THREE.Vector3();
    private readonly _liftDir = new THREE.Vector3();

    /** Last computed angle of attack for this surface (rad); useful telemetry. */
    lastAoaRad = 0;

    constructor(geom: SurfaceGeometry) {
        this.geom = geom;
        this.name = geom.name;
        this.position.fromArray(geom.position);
        this.up.fromArray(geom.up).normalize();
        this.forward.fromArray(geom.forward).normalize();
        // Spanwise axis (the direction we ignore when measuring AoA).
        this.span.copy(this.up).cross(this.forward).normalize();
    }

    get positionBody(): THREE.Vector3 {
        return this.position;
    }

    /**
     * Accumulate this surface's aerodynamic force and moment.
     * @param input      Flight condition and control state.
     * @param outForce   Body-frame force accumulator (N) — added to.
     * @param outMoment  Body-frame moment-about-CG accumulator (N·m) — added to.
     */
    accumulate(input: SurfaceInput, outForce: THREE.Vector3, outMoment: THREE.Vector3): void {
        // Local velocity through the air at the surface: v + ω × r.
        this._rot.crossVectors(input.angularVelocityBody, this.position);
        this._u.copy(input.velocityBody).add(this._rot);

        // Remove the spanwise component (that flow does not make lift here).
        const spanComp = this._u.dot(this.span);
        this._u.addScaledVector(this.span, -spanComp);

        const speedSq = this._u.lengthSq();
        if (speedSq < 1e-4) {
            this.lastAoaRad = 0;
            return;
        }
        const speed = Math.sqrt(speedSq);

        const uf = this._u.dot(this.forward);
        const uu = this._u.dot(this.up);
        const aoa = Math.atan2(-uu, uf);
        this.lastAoaRad = aoa;

        const effectiveAoa = aoa + input.controlDeltaAoaRad + input.camberBiasRad;
        const stall = this.geom.stallAoaRad - input.stallShiftRad;
        const cl = liftCoefficient(effectiveAoa, this.geom.liftSlopePerRad, stall);
        const separated = Math.sin(effectiveAoa);
        const cd = this.geom.cd0 + input.extraCd
            + this.geom.inducedK * cl * cl
            + 1.0 * separated * separated;

        // Drag acts downstream (direction the air is moving relative to surface).
        this._dragDir.copy(this._u).multiplyScalar(-1 / speed);
        // Lift is perpendicular to the relative wind, in the surface's lift plane.
        this._liftDir.crossVectors(this.span, this._dragDir).normalize();

        const q = 0.5 * input.airDensity * speedSq;
        const area = this.geom.areaM2;
        const lift = q * area * cl;
        const drag = q * area * cd;

        // Force contribution.
        const fx = this._liftDir.x * lift + this._dragDir.x * drag;
        const fy = this._liftDir.y * lift + this._dragDir.y * drag;
        const fz = this._liftDir.z * lift + this._dragDir.z * drag;
        outForce.x += fx;
        outForce.y += fy;
        outForce.z += fz;

        // Moment about CG: r × F.
        const rx = this.position.x, ry = this.position.y, rz = this.position.z;
        outMoment.x += ry * fz - rz * fy;
        outMoment.y += rz * fx - rx * fz;
        outMoment.z += rx * fy - ry * fx;
    }
}

/**
 * Lift coefficient with a linear range and a smooth post-stall collapse.
 * Beyond the stall AoA the coefficient decays like a cosine so lift falls off
 * (and, combined with the separated-flow drag term, produces a nose drop).
 */
export function liftCoefficient(aoaRad: number, slopePerRad: number, stallRad: number): number {
    const mag = Math.abs(aoaRad);
    const sign = Math.sign(aoaRad);
    if (mag <= stallRad) {
        return slopePerRad * aoaRad;
    }
    const peak = slopePerRad * stallRad;
    // Decay to ~0 over roughly the next 35°.
    const decay = Math.cos((mag - stallRad) * 2.2);
    return sign * peak * Math.max(0, decay);
}
