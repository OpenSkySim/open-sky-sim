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

/** Fully-separated flat-plate lift amplitude: CL ≈ FLAT_PLATE_CL·sin(2α). A thin
 *  plate makes CL = sin(2α); ~1.1 accounts for real separated-flow suction. */
const FLAT_PLATE_CL = 1.1;
/** Logistic steepness (per rad) of the attached→separated LIFT blend across
 *  stall. Gentler than the drag knee so post-stall lift falls off smoothly. */
const LIFT_SEPARATION_STEEPNESS = 8;
/** Soft-clip knee exponent for the attached lift. Higher = stays linear longer
 *  before rounding over at ±CLmax (4 keeps cruise faithful, peak smooth). */
const CL_SOFTCLIP_EXPONENT = 4;

/**
 * Lift coefficient over the whole AoA range as a single smooth (C1-continuous)
 * curve — no piecewise plateaus or jumps. Shaped like a real airfoil (see
 * aerospaceweb.org "Lift & drag coefficients for the whole range of AoA"):
 * a linear region that rounds over at CLmax near stall, a gentle post-stall
 * decline, and an antisymmetric flat-plate sinusoid through ±90° / ±180°.
 *
 * Construction:
 *   - Attached lift: `linear = slope·(α − α0)` (α0 = zero-lift/camber angle, so a
 *     cambered surface makes lift at α=0), softly saturated toward ±CLmax with a
 *     p-norm knee — essentially linear through cruise, rounding over smoothly at
 *     the peak instead of hitting a corner.
 *   - Separated (flat-plate) lift: `FLAT_PLATE_CL·sin(2α)`.
 *   - The two are blended with a logistic window `sep` centred on stall, so the
 *     curve peaks near stall and smoothly hands over to the flat-plate behaviour.
 *
 * Profile inputs:
 *   - `alpha0` (rad): camber / zero-lift angle.
 *   - `clMaxOverride`: the attached-lift saturation asymptote (the surface's peak
 *     CL). Omitted ⇒ slope·stall. The achieved peak is slightly below this since
 *     the post-stall blend rounds it over — as on a real lift curve.
 */
export function liftCoefficient(
    aoaRad: number, slopePerRad: number, stallRad: number, vortexScale = 0,
    alpha0 = 0, clMaxOverride?: number,
): number {
    const mag = Math.abs(aoaRad);
    const sign = Math.sign(aoaRad) || 1;
    const clMax = clMaxOverride ?? (slopePerRad * stallRad);

    // Attached (pre-stall) lift: linear in (α − α0), softly saturated toward
    // ±CLmax with a p-norm knee so it is ~linear through cruise and rounds over
    // smoothly at the peak (no corner). Asymptotes to ±CLmax as |α| grows.
    const linear = slopePerRad * (aoaRad - alpha0);
    const norm = Math.abs(linear) / clMax;
    const attached = linear / Math.pow(1 + Math.pow(norm, CL_SOFTCLIP_EXPONENT), 1 / CL_SOFTCLIP_EXPONENT);

    // Fully-separated flat-plate lift (odd in α, so lift reverses past ±90°).
    const flat = FLAT_PLATE_CL * Math.sin(2 * aoaRad);

    // Smoothly blend attached → separated across stall (logistic in |α|).
    const sep = 1 / (1 + Math.exp(-LIFT_SEPARATION_STEEPNESS * (mag - stallRad)));
    let cl = (1 - sep) * attached + sep * flat;

    // Optional vortex / strake lift (forebody LERX): a smooth raised-cosine bump
    // spanning stall → ~90°, peaking ~50°, so it adds post-stall CL without any
    // kink (window value AND slope are 0 at both edges and at the peak).
    if (vortexScale > 0) {
        const vortexPeak = 50 * (Math.PI / 180);
        const vortexEnd = 90 * (Math.PI / 180);
        if (mag > stallRad && mag < vortexEnd) {
            const half = mag <= vortexPeak
                ? (mag - stallRad) / (vortexPeak - stallRad)
                : (vortexEnd - mag) / (vortexEnd - vortexPeak);
            const window = 0.5 * (1 - Math.cos(Math.PI * clamp(half, 0, 1)));
            cl += sign * window * clMax * vortexScale;
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
