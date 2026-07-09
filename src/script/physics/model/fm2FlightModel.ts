/**
 * FM2 — F-16C rigid-body "parts" flight model.
 *
 * Unlike the kinematic Realistic model (which rotates the airframe directly from
 * stick authority), FM2 is a genuine 6-DOF rigid body. Every aerodynamic force
 * is produced by a discrete lifting surface at its real location, so all moments
 * — and the pitch/roll/yaw rate damping — emerge from the geometry. A fly-by-wire
 * layer closes rate/g loops around the airframe to give F-16 handling. Landing
 * gear is modelled as spring-damper contact points, so weight-on-wheels, takeoff
 * rotation and ground stability are also just rigid-body reactions.
 *
 * See physics/fm2/* for the building blocks.
 */
import * as THREE from 'three';
import {
    MAX_ALTITUDE, MAX_SPEED, PITCH_RATE, PLANE_DISTANCE_TO_GROUND, ROLL_RATE,
    TERRAIN_MODEL_SIZE, TERRAIN_SCALE, YAW_RATE,
} from '../../defs';
import { clamp, FORWARD, isZero, RIGHT, UP } from '../../utils/math';
import {
    computeAirDensity, computeDynamicPressure, computeIsaAirDensity,
    computeMachNumber, computeThrustDensityFactor,
} from '../aeroUtils';
import {
    adjustF16ThrottleInput, computeF16EngineThrustN, f16ThrottleAudioLevel,
    formatF16ThrottleHud, getF16EngineNozzleColor, getF16ThrottleZone,
    isF16AbDetentBand, stepF16ThrottleDetent,
} from '../f16Engine';
import { AeroSurface } from '../fm2/aeroSurface';
import { Fm2Fcs } from '../fm2/fcs';
import { Fm2AircraftConfig, f16Fm2Config, fm2GroundRestHeight } from '../fm2/fm2AircraftConfig';
import { RigidBody } from '../fm2/rigidBody';
import { FlightModel } from './flightModel';

const GRAVITY = 9.80665;

const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;

/** Optional per-model behaviour flags (orthogonal to the aircraft config). */
export interface Fm2ModelOptions {
    /**
     * No-aerodynamics "free-fly" mode: stick rotates the airframe directly and
     * speed follows the throttle. Handy for inspecting scenery/models without the
     * rigid-body aerodynamics fighting the camera (the old DEBUG flight model).
     */
    kinematic?: boolean;
}

interface SurfaceControls {
    wingLeftAoa: number;
    wingRightAoa: number;
    htailLeftAoa: number;
    htailRightAoa: number;
    vtailAoa: number;
}

export class Fm2FlightModel extends FlightModel {

    private readonly config: Fm2AircraftConfig;
    private readonly kinematic: boolean;

    private readonly rb: RigidBody;
    private readonly fcs: Fm2Fcs;

    private readonly fuselage: AeroSurface;
    private readonly wingLeft: AeroSurface;
    private readonly wingRight: AeroSurface;
    private readonly htailLeft: AeroSurface;
    private readonly htailRight: AeroSurface;
    private readonly vtail: AeroSurface;

    /** Reference dynamic pressure at the design cruise condition (Pa). */
    private readonly qRef: number;

    private stall = -1;

    /** Body Y when level on flat ground (deepest gear contact at world y=0). */
    private get groundRestY(): number {
        return fm2GroundRestHeight(this.config);
    }

    // Scratch vectors (avoid per-step allocation in the worker).
    private readonly velBody = new THREE.Vector3();
    private readonly forceBody = new THREE.Vector3();
    private readonly momentBody = new THREE.Vector3();
    private readonly forceWorld = new THREE.Vector3();
    private readonly gearForceWorld = new THREE.Vector3();
    private readonly gearMomentBody = new THREE.Vector3();
    private readonly invOrient = new THREE.Quaternion();
    private readonly _up = new THREE.Vector3();
    private readonly _fwd = new THREE.Vector3();
    private readonly _right = new THREE.Vector3();
    private readonly _v = new THREE.Vector3();
    private readonly _v2 = new THREE.Vector3();
    private readonly _gearWorld = new THREE.Vector3();
    private readonly _contactVel = new THREE.Vector3();
    private readonly _omegaWorld = new THREE.Vector3();
    private readonly _friction = new THREE.Vector3();
    private readonly _cgOffset = new THREE.Vector3();

    constructor(config: Fm2AircraftConfig = f16Fm2Config, options: Fm2ModelOptions = {}) {
        super();
        this.config = config;
        this.kinematic = options.kinematic ?? false;
        this.rb = new RigidBody(config.geometry.massKg, {
            x: config.inertia.pitch,
            y: config.inertia.yaw,
            z: config.inertia.roll,
        });
        this.fcs = new Fm2Fcs(config.fcs);
        this.fuselage = new AeroSurface(config.surfaces.fuselage);
        this.wingLeft = new AeroSurface(config.surfaces.wingLeft);
        this.wingRight = new AeroSurface(config.surfaces.wingRight);
        this.htailLeft = new AeroSurface(config.surfaces.htailLeft);
        this.htailRight = new AeroSurface(config.surfaces.htailRight);
        this.vtail = new AeroSurface(config.surfaces.vtail);
        this.qRef = 0.5 * computeIsaAirDensity(config.envelope.cruiseAltitudeM)
            * config.envelope.cruiseSpeedMps ** 2;
        this.obj.up.copy(UP);
    }

    reset(): void {
        super.reset();
        this.rb.reset();
        this.fcs.reset();
        this.stall = -1;
    }

    step(delta: number): void {
        if (this.crashed) return;

        if (this.kinematic) {
            this.stepKinematic(delta);
            return;
        }

        this.spoolThrottle(delta);

        // Adopt any externally set orientation / velocity as the rigid-body state.
        this.rb.orientation.copy(this.obj.quaternion);
        this.rb.velocityWorld.copy(this.velocity);

        const altitude = this.obj.position.y;
        const airDensity = computeAirDensity(altitude);

        // Body-frame velocity through the air.
        this.invOrient.copy(this.rb.orientation).invert();
        this.velBody.copy(this.rb.velocityWorld).applyQuaternion(this.invOrient);
        const speed = this.velBody.length();

        // Aircraft angle of attack (in the body X-plane) and sideslip.
        const aoa = this.computeBodyAoa(speed);
        this.angleOfAttackRad = aoa;

        const dynamicPressure = computeDynamicPressure(airDensity, speed);
        const mach = computeMachNumber(speed, altitude);

        // Fly-by-wire: stick/pedals + state → surface commands.
        const fcsOut = this.fcs.update({
            pitchStick: this.pitch,
            rollStick: this.roll,
            // Negated so positive pedal yaws the nose the same way as the other
            // flight models (right pedal -> nose right); only the pilot command
            // is flipped, the yaw-damper/ARI feedback keeps its stabilizing sign.
            yawPedal: -this.yaw,
            pitchRate: this.rb.angularVelocityBody.x,
            yawRate: this.rb.angularVelocityBody.y,
            rollRate: this.rb.angularVelocityBody.z,
            loadFactorG: this.loadFactorG,
            aoaRad: aoa,
            dynamicPressure,
            qRef: this.qRef,
            speed,
            altitudeM: altitude,
            limitersEnabled: this.limitersEnabled,
            flapsExtended: this.flapsExtended,
            landed: this.landed,
        }, delta);

        const controls = this.mapControls(fcsOut.elevator, fcsOut.aileron, fcsOut.rudder);

        // Publish the FCS-commanded deflections for the visible surfaces, in the
        // SAME polarity as the raw pilot stick they replace (so the aircraft defs'
        // existing per-surface sign/range still render correctly):
        //  - elevator: the g-command law already uses +cmd = nose-up = +aft stick,
        //    so it is exposed as-is.
        //  - aileron/rudder: the FCS commands the surface with the OPPOSITE internal
        //    sign to the stick (a +aileron cmd makes a −roll moment; the pilot yaw is
        //    negated on the way in via `yawPedal: -this.yaw`), so both are negated
        //    here to preserve the visual deflection direction.
        this.commandedElevator = fcsOut.elevator;
        this.commandedAileron = -fcsOut.aileron;
        this.commandedRudder = -fcsOut.rudder;
        // Elevator clamp bounds already share the +nose-up (aft-stick) polarity of
        // the exposed elevator command, so they pass through unchanged.
        this.elevatorCommandLimitHigh = fcsOut.elevatorLimitHi;
        this.elevatorCommandLimitLow = fcsOut.elevatorLimitLo;

        // Blend the AoA-gated CG shift (emergent-cobra static-margin relaxation)
        // into every surface's moment / rotation arm before the force build-up.
        this.updateCgOffset(aoa);

        // ---- Aerodynamic force & moment build-up from the rigid parts. ----
        this.forceBody.set(0, 0, 0);
        this.momentBody.set(0, 0, 0);

        const flaps = this.config.flaps;
        const camber = this.flapsExtended ? flaps.aoaBiasRad : 0;
        const stallShift = this.flapsExtended ? flaps.stallReductionRad : 0;
        const wingExtraCd = this.flapsExtended ? flaps.extraCd : 0;

        // Blended lifting body at the CG (no flaps, no control incidence).
        this.accumulateSurface(this.fuselage, 0, 0, 0, 0, airDensity);
        this.accumulateSurface(this.wingLeft, controls.wingLeftAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.wingRight, controls.wingRightAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.htailLeft, controls.htailLeftAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.htailRight, controls.htailRightAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.vtail, controls.vtailAoa, 0, 0, 0, airDensity);

        // Fuselage / parasite / gear / wave drag along the relative wind.
        this.addBodyDrag(dynamicPressure, speed, mach);

        // Help the pilot hold nose-up attitude through the low-energy apex so
        // velocity can overtake the body axis (tail-slide entry).
        this.applyDeepStallPitchAssist(speed, aoa);

        // Thrust along the nose (+Z body).
        const thrustN = this.computeThrustN(this.effectiveThrottle, altitude);
        this.engineThrustN = thrustN;
        this.forceBody.z += thrustN;

        // Landing-gear reactions (computed in world, moment folded into body frame).
        this.computeGearForces();

        // Load factor: specific normal (body-up) force / g, incl. gear reaction.
        const gearBodyUpY = this._v.copy(this.gearForceWorld).applyQuaternion(this.invOrient).y;
        this.loadFactorG = (this.forceBody.y + gearBodyUpY) / (this.config.geometry.massKg * GRAVITY);

        // ---- Integrate rotational dynamics (body frame). ----
        this.momentBody.add(this.gearMomentBody);
        this.rb.integrateAngular(this.momentBody, delta);

        // ---- Integrate translational dynamics (world frame). ----
        this.forceWorld.copy(this.forceBody).applyQuaternion(this.rb.orientation);
        this.forceWorld.add(this.gearForceWorld);
        this.forceWorld.y -= this.config.geometry.massKg * GRAVITY; // gravity
        this.accelWorld.copy(this.forceWorld).divideScalar(this.config.geometry.massKg);
        this.rb.integrateLinear(this.forceWorld, delta, this.obj.position);

        // Publish rigid-body state back to the base model.
        this.obj.quaternion.copy(this.rb.orientation);
        this.velocity.copy(this.rb.velocityWorld);
        this.clampParkedGroundSpeed();

        this.updateStallState(speed, aoa, altitude);
        this.handleGroundState();
        this.wrapPosition();
    }

    private spoolThrottle(delta: number): void {
        if (this.effectiveThrottle > this.throttle) {
            this.effectiveThrottle = Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        } else if (this.effectiveThrottle < this.throttle) {
            this.effectiveThrottle = Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta);
        }
    }

    private mapControls(elevator: number, aileron: number, rudder: number): SurfaceControls {
        const maxStabilator = this.config.fcs.maxStabilatorRad;
        const maxAileron = this.config.aileronMaxDeflectionRad;
        const maxRudder = this.config.fcs.maxRudderRad;
        const speed = this.velBody.length();
        const absAoa = Math.abs(this.angleOfAttackRad);
        // High-AoA stabilator boost. The low-q (<130 m/s) branch is always available.
        // The high-AoA branch only engages with the FBW limiters OFF: it exists to
        // give the limiters-OFF pilot the authority to punch past the airframe's
        // natural AoA ceiling into the emergent-cobra band. With the limiters ON the
        // AoA cap holds AoA at the limit anyway, so enabling the boost there would
        // only add g overshoot on a hard pull without raising the (capped) AoA.
        const aeroAoaOnset = (this.config.fcs.aerobaticStabilatorAoaOnsetDeg ?? 35) * (Math.PI / 180);
        const aerobatic = speed < 130 || (!this.limitersEnabled && absAoa > aeroAoaOnset);
        const stabGain = aerobatic ? (this.config.fcs.aerobaticStabilatorGain ?? 1) : 1;
        const effectiveStab = maxStabilator * stabGain;
        // Elevator: +cmd = nose up → negative stabilator incidence (tail lift down).
        const elevatorAoa = -elevator * effectiveStab;
        // Differential tail (taileron) assists roll.
        const taileronAoa = aileron * this.config.fcs.taileronRollFraction * maxStabilator;
        return {
            wingLeftAoa: aileron * maxAileron,
            wingRightAoa: -aileron * maxAileron,
            htailLeftAoa: elevatorAoa + taileronAoa,
            htailRightAoa: elevatorAoa - taileronAoa,
            vtailAoa: -rudder * maxRudder,
        };
    }

    /** Delivered thrust (N) at altitude for the configured engine. */
    private computeThrustN(lever: number, altitude: number): number {
        const e = this.config.engine;
        if (e.afterburner) {
            // F-16 F100 quadrant + lapse, unchanged for the default aircraft.
            return computeF16EngineThrustN(lever, altitude);
        }
        // Plain idle→military schedule with the same ISA density lapse.
        const slKn = e.idleThrustKn + (e.milThrustKn - e.idleThrustKn) * clamp(lever, 0, 1);
        const rho = computeAirDensity(altitude);
        return slKn * 1000 * computeThrustDensityFactor(rho, altitude);
    }

    private accumulateSurface(
        surface: AeroSurface, controlAoa: number, camber: number,
        stallShift: number, extraCd: number, airDensity: number,
    ): void {
        surface.accumulate({
            velocityBody: this.velBody,
            angularVelocityBody: this.rb.angularVelocityBody,
            airDensity,
            controlDeltaAoaRad: controlAoa,
            camberBiasRad: camber,
            stallShiftRad: stallShift,
            extraCd,
        }, this.forceBody, this.momentBody);
    }

    /**
     * Blend the emergent-cobra CG shift into every surface's effective arm.
     *
     * Below the onset AoA the offset is zero, so the normal envelope (cruise, hard
     * pulls, roll) keeps the stable design static margin. As AoA climbs into the
     * post-stall band the CG walks aft (config `highAoaAero.cgOffsetBody`), which
     * shortens the tail arm and turns the wing / forebody lift into a growing
     * nose-up moment — the airframe becomes statically unstable and the nose
     * diverges toward ~90°. This is the physics that makes the cobra emerge; there
     * is no injected moment. Aircraft without `highAoaAero` keep a fixed CG.
     */
    private updateCgOffset(aoa: number): void {
        const cfg = this.config.highAoaAero;
        if (!cfg) return;
        // Always-active, AoA-gated only: no speed/throttle/switch gate. With the
        // FBW limiters ON the g-command law holds AoA below the onset, so the
        // relaxation is only reached once the pilot switches the limiters off.
        const gate = this.cgOffsetGate(Math.abs(aoa), cfg);
        this._cgOffset.set(
            cfg.cgOffsetBody[0] * gate,
            cfg.cgOffsetBody[1] * gate,
            cfg.cgOffsetBody[2] * gate,
        );
        this.fuselage.setCgOffset(this._cgOffset);
        this.wingLeft.setCgOffset(this._cgOffset);
        this.wingRight.setCgOffset(this._cgOffset);
        this.htailLeft.setCgOffset(this._cgOffset);
        this.htailRight.setCgOffset(this._cgOffset);
        this.vtail.setCgOffset(this._cgOffset);
    }

    /**
     * Trapezoidal AoA schedule for the aft-CG blend: ramp 0→1 over the entry band
     * (onset→full) to break the airframe loose past stall, hold fully relaxed, then
     * (if a re-stabilization band is configured) ramp 1→0 so the airframe returns
     * to its stable design CG at very high AoA and arrests the nose near the apex.
     */
    private cgOffsetGate(absAoa: number, cfg: NonNullable<Fm2AircraftConfig['highAoaAero']>): number {
        const up = clamp((absAoa - cfg.onsetAoaRad) / Math.max(cfg.fullAoaRad - cfg.onsetAoaRad, 1e-3), 0, 1);
        if (cfg.restabOnsetAoaRad === undefined || cfg.restabFullAoaRad === undefined) return up;
        const down = clamp((absAoa - cfg.restabOnsetAoaRad)
            / Math.max(cfg.restabFullAoaRad - cfg.restabOnsetAoaRad, 1e-3), 0, 1);
        // overshoot > 1 drives the gate NEGATIVE at full re-stabilization — a
        // forward CG (nose-down pitch bucket) that actively arrests the cobra apex.
        const overshoot = cfg.restabOvershoot ?? 1;
        return clamp(up * (1 - down * overshoot), -1, 1);
    }

    /** Extra nose-up moment when holding aft stick in the deep-stall apex. */
    private applyDeepStallPitchAssist(speed: number, aoa: number): void {
        if (this.landed || this.pitch < 0.6) return;
        const absAoa = Math.abs(aoa);
        if (speed > 55 || absAoa < 0.45 || absAoa > 1.65) return;
        const stick = clamp((this.pitch - 0.6) / 0.4, 0, 1);
        const energy = clamp((55 - speed) / 40, 0, 1);
        const deepStall = clamp((absAoa - 0.45) / 0.7, 0, 1);
        const momentN = stick * energy * deepStall * 1.6e5;
        this.momentBody.x -= momentN;
    }

    /**
     * No-aerodynamics free-fly step (kinematic / DEBUG mode). Stick rotates the
     * airframe directly, speed follows the throttle, with simple ground and
     * altitude clamps. Ported from the old standalone DebugFlightModel so the
     * capability lives on the single model as a config-selected mode.
     */
    private stepKinematic(delta: number): void {
        this.effectiveThrottle = this.throttle;
        this.engineThrustN = 0;

        // No FCS in free-fly mode: drive the visible surfaces straight from the
        // raw stick (already in the exposed display polarity) so they still animate.
        this.commandedElevator = this.pitch;
        this.commandedAileron = this.roll;
        this.commandedRudder = this.yaw;
        // Kinematic free-fly bypasses the FCS clamp, so the pitch input is unbounded.
        this.elevatorCommandLimitHigh = 1;
        this.elevatorCommandLimitLow = -1;

        if (!isZero(this.roll)) this.obj.rotateZ(this.roll * ROLL_RATE * delta);
        if (!isZero(this.pitch)) this.obj.rotateX(-this.pitch * PITCH_RATE * delta);
        if (!isZero(this.yaw)) this.obj.rotateY(-this.yaw * YAW_RATE * delta);

        // Automatic yaw into the turn when rolling (coordinated look-around feel).
        const forward = this.obj.getWorldDirection(this._v);
        if (-0.99 < forward.y && forward.y < 0.99) {
            const prjForward = forward.setY(0);
            const up = this._v2.copy(UP).applyQuaternion(this.obj.quaternion);
            const prjUp = up.projectOnPlane(prjForward).setY(0);
            const sign = (prjForward.x * prjUp.z - prjForward.z * prjUp.x) > 0 ? -1 : 1;
            this.obj.rotateOnWorldAxis(UP,
                sign * prjUp.length() * prjUp.length() * prjForward.length() * 2.0 * YAW_RATE * delta);
        }

        const speed = this.effectiveThrottle * MAX_SPEED;
        this.obj.translateZ(speed * delta);

        if (this.obj.position.y < PLANE_DISTANCE_TO_GROUND) {
            this.obj.position.y = PLANE_DISTANCE_TO_GROUND;
            const d = this.obj.getWorldDirection(this._v);
            if (d.y < 0.0) {
                d.setY(0).add(this.obj.position);
                this.obj.lookAt(d);
            }
        }
        if (this.obj.position.y > MAX_ALTITUDE) this.obj.position.y = MAX_ALTITUDE;

        const prevVel = this._v2.copy(this.velocity);
        this.velocity.copy(FORWARD).applyQuaternion(this.obj.quaternion).multiplyScalar(speed);
        if (delta > 0) {
            this.accelWorld.copy(this.velocity).sub(prevVel).divideScalar(delta);
        } else {
            this.accelWorld.set(0, 0, 0);
        }

        this.landed = this.obj.position.y <= PLANE_DISTANCE_TO_GROUND;
        this.stall = -1;
    }

    /** Parasite (fuselage + gear) and transonic wave drag along the relative wind. */
    private addBodyDrag(dynamicPressure: number, speed: number, mach: number): void {
        if (speed < 1e-3) return;
        const waveDrag = this.config.waveDrag;
        let cd0 = this.config.bodyCd0 + (this.landingGearDeployed ? this.config.gearCd : 0);
        if (mach > waveDrag.machOnset) {
            const excess = (mach - waveDrag.machOnset) / waveDrag.machOnset;
            cd0 += waveDrag.scale * excess * excess;
        }
        const dragN = dynamicPressure * this.config.geometry.wingAreaM2 * cd0;
        // Opposes body velocity (acts through CG, no moment).
        this._v.copy(this.velBody).multiplyScalar(-dragN / speed);
        this.forceBody.add(this._v);
    }

    /** Spring-damper landing gear. Accumulates world force and body moment. */
    private computeGearForces(): void {
        this.gearForceWorld.set(0, 0, 0);
        this.gearMomentBody.set(0, 0, 0);

        this._omegaWorld.copy(this.rb.angularVelocityBody).applyQuaternion(this.rb.orientation);

        const gear = this.config.gear;
        for (const gp of gear.points) {
            this._v.set(gp[0], gp[1], gp[2]).applyQuaternion(this.rb.orientation);
            this._gearWorld.copy(this._v).add(this.obj.position);
            const penetration = -this._gearWorld.y; // ground plane at world y = 0
            if (penetration <= 0) continue;

            // Velocity of the contact point through the world.
            this._contactVel.crossVectors(this._omegaWorld, this._v).add(this.rb.velocityWorld);

            // Normal (vertical) spring-damper reaction.
            let normal = gear.stiffness * penetration - gear.damping * this._contactVel.y;
            if (normal < 0) normal = 0;

            // Horizontal friction opposing the contact ground velocity.
            const vhx = this._contactVel.x;
            const vhz = this._contactVel.z;
            const vh = Math.hypot(vhx, vhz);
            this._friction.set(0, normal, 0);
            if (vh > 1e-3) {
                const rolling = this.wheelBrakesApplied ? gear.brakeFriction : gear.rollFriction;
                const mu = Math.max(rolling, gear.sideFriction * this.sideSlipFraction(vhx, vhz));
                const fMag = mu * normal;
                this._friction.x = -fMag * vhx / vh;
                this._friction.z = -fMag * vhz / vh;
            }

            this.gearForceWorld.add(this._friction);

            // Moment about CG: r_world × F_world, expressed in the body frame.
            this._v2.crossVectors(this._v, this._friction).applyQuaternion(this.invOrient);
            this.gearMomentBody.add(this._v2);
        }
    }

    /** Stop residual ground creep once the aircraft has settled on the runway. */
    private clampParkedGroundSpeed(): void {
        if (!this.landed) return;
        if (this.obj.position.y > this.groundRestY + 0.25) return;
        // Leave the rollout alone once the pilot advances the throttle.
        if (this.throttle > 0.01 || this.effectiveThrottle > 0.05) return;

        const vh = Math.hypot(this.velocity.x, this.velocity.z);
        if (vh > 0.25) return;

        this.velocity.x = 0;
        this.velocity.z = 0;
        this.rb.velocityWorld.x = 0;
        this.rb.velocityWorld.z = 0;
    }

    /** Higher effective friction for sideways (non-rolling) contact motion. */
    private sideSlipFraction(vhx: number, vhz: number): number {
        this._fwd.copy(FORWARD).applyQuaternion(this.rb.orientation);
        const fwx = this._fwd.x, fwz = this._fwd.z;
        const fwLen = Math.hypot(fwx, fwz) || 1;
        const vh = Math.hypot(vhx, vhz) || 1;
        const along = Math.abs((vhx * fwx + vhz * fwz) / (fwLen * vh));
        return clamp(1 - along, 0, 1);
    }

    /**
     * Body-frame AoA. At very low airspeed (tail-slide apex) the velocity vector
     * is unreliable, so fall back to pitch attitude for FBW / stall telemetry.
     */
    private computeBodyAoa(speed: number): number {
        if (speed > 1) {
            return Math.atan2(-this.velBody.y, this.velBody.z);
        }
        if (speed > 0.15) {
            return Math.atan2(-this.velBody.y, this.velBody.z);
        }
        this._fwd.set(0, 0, 1).applyQuaternion(this.rb.orientation);
        return Math.asin(clamp(this._fwd.y, -1, 1));
    }

    private updateStallState(speed: number, aoa: number, altitude: number): void {
        if (this.landed) { this.stall = -1; return; }
        const stallAoa = this.config.envelope.stallAoaRad;
        const minFlyingSpeed = this.config.envelope.minFlyingSpeedMps;
        const aoaStall = speed > 5 ? clamp((Math.abs(aoa) - stallAoa * 0.85) / (stallAoa * 0.3), 0, 1) : 0;
        const speedStall = altitude > PLANE_DISTANCE_TO_GROUND + 5
            ? clamp((minFlyingSpeed - speed) / minFlyingSpeed, 0, 1) : 0;
        const level = Math.max(aoaStall, speedStall);
        this.stall = level > 0 ? level : -1;
    }

    private handleGroundState(): void {
        const restY = this.groundRestY;
        const onGround = this.obj.position.y <= restY + 0.25;

        if (this.obj.position.y > restY + 0.3) {
            this.landed = false;
        }

        // Hard floor so the gear spring can never let the body tunnel through.
        const minY = restY - 0.6;
        if (this.obj.position.y < minY) {
            this.obj.position.y = minY;
            if (this.velocity.y < 0) this.velocity.y = 0;
        }

        if (!onGround) return;

        this._fwd.copy(FORWARD).applyQuaternion(this.rb.orientation);
        this._right.copy(RIGHT).applyQuaternion(this.rb.orientation);
        const speed = this.velocity.length();
        const pitchAngle = Math.asin(clamp(this._fwd.y, -1, 1));
        const rollAngle = Math.asin(clamp(this._right.y, -1, 1));

        const env = this.config.envelope;
        const hardContact = this.velocity.y < -env.landingMaxVerticalSpeedMps;
        const badAttitude = Math.abs(rollAngle) > env.landingMaxRollRad || pitchAngle < env.landingMinPitchRad;

        if (!this.landed && (hardContact || speed > env.landingMaxSpeedMps)) {
            if (!this.landingGearDeployed || hardContact || badAttitude) {
                this.crashed = true;
                return;
            }
        }
        if (!this.landingGearDeployed && this.velocity.y < -1.0) {
            this.crashed = true;
            return;
        }
        if (speed < env.landingMaxSpeedMps && Math.abs(rollAngle) < env.landingMaxRollRad) {
            this.landed = true;
        }
    }

    private wrapPosition(): void {
        const h = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > h) this.obj.position.x = -h;
        if (this.obj.position.x < -h) this.obj.position.x = h;
        if (this.obj.position.z > h) this.obj.position.z = -h;
        if (this.obj.position.z < -h) this.obj.position.z = h;
    }

    getStallStatus(): number { return this.stall; }

    // --- Throttle quadrant behaviour. Afterburner aircraft (F-16) use the F100
    // quadrant with MIL/AB detents; others use a plain linear 0–100% lever. ---
    private get afterburner(): boolean { return this.config.engine.afterburner; }
    getThrottleHudText(): string { return this.afterburner ? formatF16ThrottleHud(this.throttle) : super.getThrottleHudText(); }
    useF16ThrottleDetents(): boolean { return this.afterburner; }
    stepThrottleDetent(current: number, direction: 1 | -1): number { return this.afterburner ? stepF16ThrottleDetent(current, direction) : super.stepThrottleDetent(current, direction); }
    isInThrottleAbDetentBand(lever: number): boolean { return this.afterburner ? isF16AbDetentBand(lever) : super.isInThrottleAbDetentBand(lever); }
    adjustThrottleInput(current: number, step: number): number { return this.afterburner ? adjustF16ThrottleInput(current, step) : super.adjustThrottleInput(current, step); }
    getThrottleZone(): string { return this.afterburner ? getF16ThrottleZone(this.effectiveThrottle) : 'mil'; }
    getThrottleAudioLevel(): number { return this.afterburner ? f16ThrottleAudioLevel(this.effectiveThrottle) : super.getThrottleAudioLevel(); }
    getEngineNozzleColor(): string { return this.afterburner ? getF16EngineNozzleColor(this.effectiveThrottle) : super.getEngineNozzleColor(); }
}
