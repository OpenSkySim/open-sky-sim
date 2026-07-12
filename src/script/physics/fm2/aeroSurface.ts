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
import { SurfaceGeometry } from './fm2Constants';

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

    /** Last lift force this surface produced (body frame, N); for debug overlays. */
    readonly liftForceBody = new THREE.Vector3();
    /** Last drag force this surface produced (body frame, N); for debug overlays. */
    readonly dragForceBody = new THREE.Vector3();

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
            this.liftForceBody.set(0, 0, 0);
            this.dragForceBody.set(0, 0, 0);
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
            this.geom.zeroLiftAoaRad ?? 0, this.geom.clMax,
        );
        const cd = dragCoefficient(
            effectiveAoa, cl, this.geom.cd0 + input.extraCd, this.geom.inducedK,
            stall, this.geom.flatPlateCd,
        );

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

        // Store the separated lift / drag contributions for debug overlays.
        this.liftForceBody.copy(this._liftDir).multiplyScalar(lift);
        this.dragForceBody.copy(this._dragDir).multiplyScalar(drag);

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
 *
 * Two optional profile inputs give each surface a realistic lift curve:
 *   - `alpha0` (zero-lift angle, rad): camber. The linear lift is `slope·(α−α0)`
 *     so a cambered surface makes lift at α=0 (cl0 = −slope·α0). Applied to the
 *     LINEAR term only — stall / deep-stall / vortex stay keyed on geometric α so
 *     the tuned high-AoA (cobra) behaviour is unchanged.
 *   - `clMaxOverride`: the surface's peak CL. The linear (pre-stall) lift is
 *     capped at ±CLmax to round the normal curve over to a realistic peak. The
 *     deep-stall plateau / vortex lift stay referenced to the legacy slope·stall
 *     peak (never reduced), so a realistic lower CLmax does not weaken the tuned
 *     post-stall / cobra regime. Omitted ⇒ CLmax = slope·stall, which with the
 *     (unclamped, in-range) linear term reproduces the legacy curve exactly.
 */
export function liftCoefficient(
    aoaRad: number, slopePerRad: number, stallRad: number, vortexScale = 0,
    alpha0 = 0, clMaxOverride?: number,
): number {
    const mag = Math.abs(aoaRad);
    const sign = Math.sign(aoaRad) || 1;
    // Pre-stall cap (rounds the linear curve over at the surface's CLmax).
    const clMaxLinear = clMaxOverride ?? (slopePerRad * stallRad);
    // High-AoA reference for the deep-stall plateau / vortex lift. It is NEVER
    // reduced below the legacy slope·stall value, so setting a realistic (lower)
    // pre-stall CLmax rounds the normal lift curve WITHOUT weakening the tuned
    // post-stall / vortex regime the emergent cobra depends on.
    const clRefHigh = Math.max(clMaxLinear, slopePerRad * stallRad);
    let cl: number;
    if (mag <= stallRad) {
        // Camber shifts the linear lift; the cap rounds it over at CLmax. For the
        // legacy path (α0=0, CLmax=slope·stall) |linear| ≤ CLmax here, so the
        // clamp is a no-op and cl = slope·α exactly as before.
        const linear = slopePerRad * (aoaRad - alpha0);
        cl = clamp(linear, -clMaxLinear, clMaxLinear);
    } else {
        const deepStallSpan = Math.PI / 3;
        if (mag <= stallRad + deepStallSpan) {
            const t = (mag - stallRad) / deepStallSpan;
            cl = sign * clRefHigh * (1 - 0.25 * t);
        } else {
            const flat = Math.sin(2 * aoaRad);
            cl = sign * Math.abs(flat) * clRefHigh * 0.5;
        }
    }
    if (vortexScale > 0) {
        const vortexHigh = 80 * (Math.PI / 180);
        if (mag >= stallRad && mag <= vortexHigh) {
            const vortex = Math.sin(aoaRad) * Math.cos(aoaRad / 2);
            cl += sign * Math.abs(vortex) * clRefHigh * vortexScale;
        }
    }
    return cl;
}

/** Logistic steepness of the attached→separated drag transition (per rad). A
 *  higher value narrows the blend band around stall; ~15 gives a ~±4° window.
 *  (Walter Bislin's whole-range model uses q = 25.) */
const DRAG_SEPARATION_STEEPNESS = 15;
const DEFAULT_FLAT_PLATE_CD = 2.0;

/**
 * Drag coefficient over the whole AoA range, after Walter Bislin's model
 * (walter.bislins.ch — "Airplane Lift and Drag Coefficients for the whole Range
 * of AoA"). Two regimes are blended with a logistic window centred on stall:
 *
 *   - Attached flow: the classic parabolic drag polar
 *         CD = CD0 + K·CL²                         (Bislin CD = cd1 + cd2·CL²)
 *     where CD0 is the surface's profile/parasite drag (plus any flap/gear
 *     increment folded in) and K·CL² is induced drag.
 *   - Fully separated flow: a flat-plate / bluff-body term
 *         CDP = flatPlateCd · ½·(1 − cos 2α)       (Bislin CDP = 1 − cos 2α)
 *     which is ~0 at α = 0, peaks at α = 90°, and eases back to ~0 by 180° so a
 *     tail slide / tumble bleeds energy without locking the nose at 90°.
 *
 * `sep` ramps 0→1 through ±stall, so below stall the realistic low-drag polar
 * dominates (preserving cruise L/D) and past stall the high separated drag takes
 * over. Symmetric in α (camber is handled entirely in the lift curve).
 */
export function dragCoefficient(
    aoaRad: number, cl: number, parasiticCd: number, inducedK: number,
    stallRad: number, flatPlateCd = DEFAULT_FLAT_PLATE_CD,
): number {
    const attached = parasiticCd + inducedK * cl * cl;
    const flatPlate = flatPlateCd * 0.5 * (1 - Math.cos(2 * aoaRad));
    const sep = 1 / (1 + Math.exp(-DRAG_SEPARATION_STEEPNESS * (Math.abs(aoaRad) - stallRad)));
    return (1 - sep) * attached + sep * flatPlate;
}
