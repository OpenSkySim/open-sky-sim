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
    computeMachNumber, computeThrustDensityFactor,
} from '../aeroUtils';
import {
    adjustF16ThrottleInput, computeF16EngineThrustN, f16ThrottleAudioLevel,
    formatF16ThrottleHud, getF16EngineNozzleColor, getF16ThrottleZone,
    isF16AbDetentBand, stepF16ThrottleDetent,
} from '../f16Engine';
import { AeroSurface } from '../fm2/aeroSurface';
import { DirectFcs } from '../fm2/directFcs';
import { Fcs } from '../fm2/fcs';
import { F16Fcs } from '../fm2/f16Fcs';
import { Fm2AircraftConfig, Fm2DirectFcsConfig, f16Fm2Config, fm2GroundRestHeight } from '../fm2/fm2AircraftConfig';
import { RigidBody } from '../fm2/rigidBody';
import { FlightModel } from './flightModel';

const GRAVITY = 9.80665;

const THROTTLE_UP_RATE = 0.10;
const THROTTLE_DOWN_RATE = 0.07;

// Fallback mechanical FCS tuning for a direct-mode aircraft that omits its own.
const DEFAULT_DIRECT_FCS: Fm2DirectFcsConfig = {
    pitchRateDamp: 0.9,
    rollRateDamp: 0.12,
    yawDamperGain: 1.4,
    yawDamperWashoutTauS: 1.0,
    ariGain: 0.08,
    actuatorTauS: 0.06,
};

interface SurfaceControls {
    wingLeftAoa: number;
    wingRightAoa: number;
    htailLeftAoa: number;
    htailRightAoa: number;
    vtailAoa: number;
}

export class Fm2FlightModel extends FlightModel {

    private readonly config: Fm2AircraftConfig;

    private readonly rb: RigidBody;
    private readonly fcs: Fcs;

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

    constructor(config: Fm2AircraftConfig = f16Fm2Config) {
        super();
        this.config = config;
        this.rb = new RigidBody(config.geometry.massKg, {
            x: config.inertia.pitch,
            y: config.inertia.yaw,
            z: config.inertia.roll,
        });
        this.fcs = config.fcs.mode === 'direct'
            ? new DirectFcs(config.fcs.direct ?? DEFAULT_DIRECT_FCS)
            : new F16Fcs();
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
            flapsExtended: this.flapsExtended,
            landed: this.landed,
        }, delta);

        const controls = this.mapControls(fcsOut.elevator, fcsOut.aileron, fcsOut.rudder);

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
        // Elevator: +cmd = nose up → negative stabilator incidence (tail lift down).
        const elevatorAoa = -elevator * maxStabilator;
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
