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
import { PLANE_DISTANCE_TO_GROUND, TERRAIN_MODEL_SIZE, TERRAIN_SCALE } from '../../defs';
import { clamp, FORWARD, RIGHT, UP } from '../../utils/math';
import {
    computeAirDensity, computeDynamicPressure, computeIsaAirDensity,
    computeMachNumber,
} from '../aeroUtils';
import {
    adjustF16ThrottleInput, computeF16EngineThrustN, f16ThrottleAudioLevel,
    formatF16ThrottleHud, getF16EngineNozzleColor, getF16ThrottleZone,
    isF16AbDetentBand, stepF16ThrottleDetent,
} from '../f16Engine';
import { F16_PROFILE } from '../f16Profile';
import { AeroSurface } from '../fm2/aeroSurface';
import { F16Fcs } from '../fm2/f16Fcs';
import {
    FM2_AILERON, FM2_BODY_CD0, FM2_FCS, FM2_FLAPS, FM2_GEAR_CD, FM2_GEOMETRY,
    FM2_INERTIA, FM2_SURFACES, FM2_WAVE_DRAG,
} from '../fm2/f16Fm2Config';
import { RigidBody } from '../fm2/rigidBody';
import { FlightModel } from './flightModel';

const GRAVITY = 9.80665;
const DEG = Math.PI / 180;

const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;

const MAX_STABILATOR_AOA = FM2_FCS.maxStabilatorRad;
const MAX_AILERON_AOA = FM2_AILERON.maxDeflectionRad;
const MAX_RUDDER_AOA = 22 * DEG;

const Q_REF = 0.5 * computeIsaAirDensity(F16_PROFILE.cruiseAltitudeM) * F16_PROFILE.cruiseSpeedMps ** 2;
const STALL_AOA = F16_PROFILE.stallAoaDeg * DEG;
const MIN_FLYING_SPEED = F16_PROFILE.minFlyingSpeedMps;

// Landing-gear spring-damper contact points (body frame, m). Y ≈ -PLANE_DISTANCE_TO_GROUND.
const GEAR_POINTS: [number, number, number][] = [
    [0.0, -PLANE_DISTANCE_TO_GROUND, 2.6],   // nose
    [-1.2, -PLANE_DISTANCE_TO_GROUND, -0.6], // left main
    [1.2, -PLANE_DISTANCE_TO_GROUND, -0.6],  // right main
];
const GEAR_STIFFNESS = 4.0e6;   // N/m
const GEAR_DAMPING = 1.6e5;     // N·s/m
const GEAR_ROLL_FRICTION = 0.04;
const GEAR_BRAKE_FRICTION = 0.55;
const GEAR_SIDE_FRICTION = 0.8;

// Touchdown limits (crash otherwise), mirroring the F-16 profile.
const LANDING_MAX_SPEED = F16_PROFILE.landingMaxSpeedMps;
const LANDING_MAX_VSPEED = F16_PROFILE.landingMaxVerticalSpeedMps;
const LANDING_MIN_PITCH = F16_PROFILE.landingMinPitchDeg * DEG;
const LANDING_MAX_ROLL = F16_PROFILE.landingMaxRollDeg * DEG;

interface SurfaceControls {
    wingLeftAoa: number;
    wingRightAoa: number;
    htailLeftAoa: number;
    htailRightAoa: number;
    vtailAoa: number;
}

export class Fm2FlightModel extends FlightModel {

    private readonly rb = new RigidBody(FM2_GEOMETRY.massKg, {
        x: FM2_INERTIA.pitch,
        y: FM2_INERTIA.yaw,
        z: FM2_INERTIA.roll,
    });
    private readonly fcs = new F16Fcs();

    private readonly fuselage = new AeroSurface(FM2_SURFACES.fuselage);
    private readonly wingLeft = new AeroSurface(FM2_SURFACES.wingLeft);
    private readonly wingRight = new AeroSurface(FM2_SURFACES.wingRight);
    private readonly htailLeft = new AeroSurface(FM2_SURFACES.htailLeft);
    private readonly htailRight = new AeroSurface(FM2_SURFACES.htailRight);
    private readonly vtail = new AeroSurface(FM2_SURFACES.vtail);

    private stall = -1;

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

    constructor() {
        super();
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
        const aoa = speed > 1 ? Math.atan2(-this.velBody.y, this.velBody.z) : 0;
        this.angleOfAttackRad = aoa;

        const dynamicPressure = computeDynamicPressure(airDensity, speed);
        const mach = computeMachNumber(speed, altitude);

        // Fly-by-wire: stick/pedals + state → surface commands.
        const fcsOut = this.fcs.update({
            pitchStick: this.pitch,
            rollStick: this.roll,
            yawPedal: this.yaw,
            pitchRate: this.rb.angularVelocityBody.x,
            yawRate: this.rb.angularVelocityBody.y,
            rollRate: this.rb.angularVelocityBody.z,
            loadFactorG: this.loadFactorG,
            aoaRad: aoa,
            dynamicPressure,
            qRef: Q_REF,
            speed,
            altitudeM: altitude,
            flapsExtended: this.flapsExtended,
            landed: this.landed,
        }, delta);

        const controls = this.mapControls(fcsOut.elevator, fcsOut.aileron, fcsOut.rudder);

        // ---- Aerodynamic force & moment build-up from the rigid parts. ----
        this.forceBody.set(0, 0, 0);
        this.momentBody.set(0, 0, 0);

        const camber = this.flapsExtended ? FM2_FLAPS.aoaBiasRad : 0;
        const stallShift = this.flapsExtended ? FM2_FLAPS.stallReductionRad : 0;
        const wingExtraCd = this.flapsExtended ? FM2_FLAPS.extraCd : 0;

        // Blended lifting body at the CG (no flaps, no control incidence).
        this.accumulateSurface(this.fuselage, 0, 0, 0, 0, airDensity);
        this.accumulateSurface(this.wingLeft, controls.wingLeftAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.wingRight, controls.wingRightAoa, camber, stallShift, wingExtraCd, airDensity);
        this.accumulateSurface(this.htailLeft, controls.htailLeftAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.htailRight, controls.htailRightAoa, 0, 0, 0, airDensity);
        this.accumulateSurface(this.vtail, controls.vtailAoa, 0, 0, 0, airDensity);

        // Fuselage / parasite / gear / wave drag along the relative wind.
        this.addBodyDrag(dynamicPressure, speed, mach);

        // Thrust along the nose (+Z body).
        const thrustN = computeF16EngineThrustN(this.effectiveThrottle, altitude);
        this.engineThrustN = thrustN;
        this.forceBody.z += thrustN;

        // Landing-gear reactions (computed in world, moment folded into body frame).
        this.computeGearForces();

        // Load factor: specific normal (body-up) force / g, incl. gear reaction.
        const gearBodyUpY = this._v.copy(this.gearForceWorld).applyQuaternion(this.invOrient).y;
        this.loadFactorG = (this.forceBody.y + gearBodyUpY) / (FM2_GEOMETRY.massKg * GRAVITY);

        // ---- Integrate rotational dynamics (body frame). ----
        this.momentBody.add(this.gearMomentBody);
        this.rb.integrateAngular(this.momentBody, delta);

        // ---- Integrate translational dynamics (world frame). ----
        this.forceWorld.copy(this.forceBody).applyQuaternion(this.rb.orientation);
        this.forceWorld.add(this.gearForceWorld);
        this.forceWorld.y -= FM2_GEOMETRY.massKg * GRAVITY; // gravity
        this.rb.integrateLinear(this.forceWorld, delta, this.obj.position);

        // Publish rigid-body state back to the base model.
        this.obj.quaternion.copy(this.rb.orientation);
        this.velocity.copy(this.rb.velocityWorld);

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
        // Elevator: +cmd = nose up → negative stabilator incidence (tail lift down).
        const elevatorAoa = -elevator * MAX_STABILATOR_AOA;
        // Differential tail (taileron) assists roll.
        const taileronAoa = aileron * FM2_FCS.taileronRollFraction * MAX_STABILATOR_AOA;
        return {
            wingLeftAoa: aileron * MAX_AILERON_AOA,
            wingRightAoa: -aileron * MAX_AILERON_AOA,
            htailLeftAoa: elevatorAoa + taileronAoa,
            htailRightAoa: elevatorAoa - taileronAoa,
            vtailAoa: -rudder * MAX_RUDDER_AOA,
        };
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

    /** Parasite (fuselage + gear) and transonic wave drag along the relative wind. */
    private addBodyDrag(dynamicPressure: number, speed: number, mach: number): void {
        if (speed < 1e-3) return;
        let cd0 = FM2_BODY_CD0 + (this.landingGearDeployed ? FM2_GEAR_CD : 0);
        if (mach > FM2_WAVE_DRAG.machOnset) {
            const excess = (mach - FM2_WAVE_DRAG.machOnset) / FM2_WAVE_DRAG.machOnset;
            cd0 += FM2_WAVE_DRAG.scale * excess * excess;
        }
        const dragN = dynamicPressure * FM2_GEOMETRY.wingAreaM2 * cd0;
        // Opposes body velocity (acts through CG, no moment).
        this._v.copy(this.velBody).multiplyScalar(-dragN / speed);
        this.forceBody.add(this._v);
    }

    /** Spring-damper landing gear. Accumulates world force and body moment. */
    private computeGearForces(): void {
        this.gearForceWorld.set(0, 0, 0);
        this.gearMomentBody.set(0, 0, 0);

        this._omegaWorld.copy(this.rb.angularVelocityBody).applyQuaternion(this.rb.orientation);

        for (const gp of GEAR_POINTS) {
            this._v.set(gp[0], gp[1], gp[2]).applyQuaternion(this.rb.orientation);
            this._gearWorld.copy(this._v).add(this.obj.position);
            const penetration = -this._gearWorld.y; // ground plane at world y = 0
            if (penetration <= 0) continue;

            // Velocity of the contact point through the world.
            this._contactVel.crossVectors(this._omegaWorld, this._v).add(this.rb.velocityWorld);

            // Normal (vertical) spring-damper reaction.
            let normal = GEAR_STIFFNESS * penetration - GEAR_DAMPING * this._contactVel.y;
            if (normal < 0) normal = 0;

            // Horizontal friction opposing the contact ground velocity.
            const vhx = this._contactVel.x;
            const vhz = this._contactVel.z;
            const vh = Math.hypot(vhx, vhz);
            this._friction.set(0, normal, 0);
            if (vh > 1e-3) {
                const rolling = this.wheelBrakesApplied ? GEAR_BRAKE_FRICTION : GEAR_ROLL_FRICTION;
                const mu = Math.max(rolling, GEAR_SIDE_FRICTION * this.sideSlipFraction(vhx, vhz));
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

    /** Higher effective friction for sideways (non-rolling) contact motion. */
    private sideSlipFraction(vhx: number, vhz: number): number {
        this._fwd.copy(FORWARD).applyQuaternion(this.rb.orientation);
        const fwx = this._fwd.x, fwz = this._fwd.z;
        const fwLen = Math.hypot(fwx, fwz) || 1;
        const vh = Math.hypot(vhx, vhz) || 1;
        const along = Math.abs((vhx * fwx + vhz * fwz) / (fwLen * vh));
        return clamp(1 - along, 0, 1);
    }

    private updateStallState(speed: number, aoa: number, altitude: number): void {
        if (this.landed) { this.stall = -1; return; }
        const aoaStall = speed > 5 ? clamp((Math.abs(aoa) - STALL_AOA * 0.85) / (STALL_AOA * 0.3), 0, 1) : 0;
        const speedStall = altitude > PLANE_DISTANCE_TO_GROUND + 5
            ? clamp((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1) : 0;
        const level = Math.max(aoaStall, speedStall);
        this.stall = level > 0 ? level : -1;
    }

    private handleGroundState(): void {
        const onGround = this.obj.position.y <= PLANE_DISTANCE_TO_GROUND + 0.25;

        if (this.obj.position.y > PLANE_DISTANCE_TO_GROUND + 0.3) {
            this.landed = false;
        }

        // Hard floor so the gear spring can never let the body tunnel through.
        const minY = PLANE_DISTANCE_TO_GROUND - 0.6;
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

        const hardContact = this.velocity.y < -LANDING_MAX_VSPEED;
        const badAttitude = Math.abs(rollAngle) > LANDING_MAX_ROLL || pitchAngle < LANDING_MIN_PITCH;

        if (!this.landed && (hardContact || speed > LANDING_MAX_SPEED)) {
            if (!this.landingGearDeployed || hardContact || badAttitude) {
                this.crashed = true;
                return;
            }
        }
        if (!this.landingGearDeployed && this.velocity.y < -1.0) {
            this.crashed = true;
            return;
        }
        if (speed < LANDING_MAX_SPEED && Math.abs(rollAngle) < LANDING_MAX_ROLL) {
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

    // --- F-16 throttle quadrant behaviour (shared with the Realistic model). ---
    getThrottleHudText(): string { return formatF16ThrottleHud(this.throttle); }
    useF16ThrottleDetents(): boolean { return true; }
    stepThrottleDetent(current: number, direction: 1 | -1): number { return stepF16ThrottleDetent(current, direction); }
    isInThrottleAbDetentBand(lever: number): boolean { return isF16AbDetentBand(lever); }
    adjustThrottleInput(current: number, step: number): number { return adjustF16ThrottleInput(current, step); }
    getThrottleZone(): string { return getF16ThrottleZone(this.effectiveThrottle); }
    getThrottleAudioLevel(): number { return f16ThrottleAudioLevel(this.effectiveThrottle); }
    getEngineNozzleColor(): string { return getF16EngineNozzleColor(this.effectiveThrottle); }
}
