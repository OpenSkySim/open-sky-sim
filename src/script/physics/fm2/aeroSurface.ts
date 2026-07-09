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
import { clamp } from '../../utils/math';
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
    /** Moment / rotation arm = position − CG offset (defaults to position). */
    private readonly arm = new THREE.Vector3();
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
        this.arm.copy(this.position);
        this.up.fromArray(geom.up).normalize();
        this.forward.fromArray(geom.forward).normalize();
        // Spanwise axis (the direction we ignore when measuring AoA).
        this.span.copy(this.up).cross(this.forward).normalize();
    }

    get positionBody(): THREE.Vector3 {
        return this.position;
    }

    /**
     * Set the effective CG the moment / rotation arm is measured from. Shifting
     * the CG aft (offset z < 0) reduces the tail arm and turns wing/forebody lift
     * into a nose-up moment — the static-margin lever behind the emergent cobra.
     * Called each step so the shift can be blended in with AoA.
     */
    setCgOffset(offset: THREE.Vector3): void {
        this.arm.copy(this.position).sub(offset);
    }

    /**
     * Accumulate this surface's aerodynamic force and moment.
     * @param input      Flight condition and control state.
     * @param outForce   Body-frame force accumulator (N) — added to.
     * @param outMoment  Body-frame moment-about-CG accumulator (N·m) — added to.
     */
    accumulate(input: SurfaceInput, outForce: THREE.Vector3, outMoment: THREE.Vector3): void {
        // Local velocity through the air at the surface: v + ω × r.
        this._rot.crossVectors(input.angularVelocityBody, this.arm);
        // Once this surface's flow is separated, cut its rate-damping contribution
        // (a stalled tail damps far less). Uses last step's AoA as the separation
        // gauge so a transient high-AoA pitch overshoot can survive (cobra).
        const dampScale = this.geom.highAoaDampingScale ?? 1;
        if (dampScale < 1 && Math.abs(this.lastAoaRad) > this.geom.stallAoaRad) {
            this._rot.multiplyScalar(dampScale);
        }
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
        const cl = liftCoefficient(
            effectiveAoa, this.geom.liftSlopePerRad, stall, this.geom.vortexLiftScale ?? 0,
        );
        const separated = Math.sin(effectiveAoa);
        const postStall = Math.max(0, Math.abs(effectiveAoa) - stall);
        // Separated drag peaks in the mid-stall band then eases at very high AoA so
        // a tail slide can bleed speed without locking the aircraft at 90°.
        const separatedScale = 0.75 * (1 - 0.35 * clamp(postStall / stall, 0, 1));
        const cd = this.geom.cd0 + input.extraCd
            + this.geom.inducedK * cl * cl
            + separatedScale * separated * separated;

        // Drag acts downstream (direction the air is moving relative to surface).
        this._dragDir.copy(this._u).multiplyScalar(-1 / speed);
        // Lift is perpendicular to the relative wind, in the surface's lift plane.
        this._liftDir.crossVectors(this.span, this._dragDir).normalize();

        const q = 0.5 * input.airDensity * speedSq;
        const area = this.geom.areaM2;
        // At low airspeed, control surfaces still bite enough to hold attitude in
        // deep stall / tail-slide manoeuvres (real jet wash & dynamic pressure
        // from rotation at the tail still provide some q).
        const hasControl = input.controlDeltaAoaRad !== 0;
        const minControlQ = 0.5 * input.airDensity * 18 * 18;
        const effectiveQ = hasControl && q < minControlQ ? minControlQ : q;
        const lift = effectiveQ * area * cl;
        const drag = q * area * cd;

        // Force contribution.
        const fx = this._liftDir.x * lift + this._dragDir.x * drag;
        const fy = this._liftDir.y * lift + this._dragDir.y * drag;
        const fz = this._liftDir.z * lift + this._dragDir.z * drag;
        outForce.x += fx;
        outForce.y += fy;
        outForce.z += fz;

        // Moment about CG: r × F (r measured from the effective CG).
        const rx = this.arm.x, ry = this.arm.y, rz = this.arm.z;
        outMoment.x += ry * fz - rz * fy;
        outMoment.y += rz * fx - rx * fz;
        outMoment.z += rx * fy - ry * fx;
    }
}

/**
 * Lift coefficient with a linear pre-stall range, a deep-stall plateau (vortex /
 * strake lift), and flat-plate behaviour at extreme AoA for tail-slide recovery.
 * Optional vortex lift (forebody strakes) boosts CL between ~30-80° for cobra entry.
 */
export function liftCoefficient(
    aoaRad: number, slopePerRad: number, stallRad: number, vortexScale = 0,
): number {
    const mag = Math.abs(aoaRad);
    const sign = Math.sign(aoaRad) || 1;
    let cl: number;
    if (mag <= stallRad) {
        cl = slopePerRad * aoaRad;
    } else {
        const clMax = slopePerRad * stallRad;
        const deepStallSpan = Math.PI / 3;
        if (mag <= stallRad + deepStallSpan) {
            const t = (mag - stallRad) / deepStallSpan;
            cl = sign * clMax * (1 - 0.25 * t);
        } else {
            const flat = Math.sin(2 * aoaRad);
            cl = sign * Math.abs(flat) * clMax * 0.5;
        }
    }
    if (vortexScale > 0) {
        const vortexHigh = 80 * (Math.PI / 180);
        if (mag >= stallRad && mag <= vortexHigh) {
            const clMax = slopePerRad * stallRad;
            const vortex = Math.sin(aoaRad) * Math.cos(aoaRad / 2);
            cl += sign * Math.abs(vortex) * clMax * vortexScale;
        }
    }
    return cl;
}
