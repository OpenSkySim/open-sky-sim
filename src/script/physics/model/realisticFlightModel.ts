import * as THREE from 'three';
import { PITCH_RATE, PLANE_DISTANCE_TO_GROUND, ROLL_RATE, TERRAIN_MODEL_SIZE, TERRAIN_SCALE, YAW_RATE } from '../../defs';
import { FORWARD, PI_OVER_180, RIGHT, UP, calculatePitchRoll, clamp, isZero, roundToZero } from '../../utils/math';
import { computeAngleOfAttack, computeAirDensity, computeDynamicPressure, computeDynamicPressureDragPenalty, computeLoadFactorG, computeThrustDensityFactor } from '../aeroUtils';
import { F16_PROFILE } from '../f16Profile';
import { FlightModel } from './flightModel';

const THROTTLE_UP_RATE = 0.02;
const THROTTLE_DOWN_RATE = 0.07;
const YAW_RATE_LANDED = YAW_RATE * 2.0;

const DRY_MASS = F16_PROFILE.combatMassKg;
const WING_AREA = F16_PROFILE.wingAreaM2;
const WING_SPAN = F16_PROFILE.wingSpanM;
const GRAVITY = 9.80665; // m/s², ISA
const MIL_THRUST = 3.99; // m/s², F100-PW-229 military power (76 kN / MTOW)
const AB_THRUST = F16_PROFILE.abThrustAccel;
const AB_THROTTLE = 0.85; // throttle above this engages afterburner
const CD0 = F16_PROFILE.cd0;
const INDUCED_DRAG_K = F16_PROFILE.inducedDragK;
const CL0 = F16_PROFILE.cl0;
const CL_ALPHA = F16_PROFILE.clAlphaPerRad;
const STALL_AOA = F16_PROFILE.stallAoaDeg * Math.PI / 180;
const MAX_CL = 1.48; // vortex lift / strakes
const Q_REF = F16_PROFILE.cruiseSpeedMps > 0
    ? 0.5 * 1.225 * Math.exp(-F16_PROFILE.cruiseAltitudeM / 8000) * F16_PROFILE.cruiseSpeedMps * F16_PROFILE.cruiseSpeedMps
    : 37300;
const MIN_CONTROL_Q = 0.12;
const MAX_CONTROL_Q = 2.2;
const MIN_FLYING_SPEED = F16_PROFILE.minFlyingSpeedMps;
const SIDE_SLIP_DAMP_RATE = 4.5; // 1/s, lateral velocity damping (FBW-like beta cleanup)
const CY_BETA = -0.6; // side force per rad sideslip, q * S * CY_BETA * beta
const YAW_CONTROL_Q_SCALE = 0.45; // yaw authority fraction vs pitch/roll at high q

const CD_LANDING_GEAR_FACTOR = 0.75;
const CD_FLAPS_FACTOR = 0.4;
const CL_FLAPS_FACTOR = 1.25;
const ROLL_FLAPS_FACTOR = 0.65;

const GROUND_FRICTION_KINETIC = 0.15;
const GROUND_FRICTION_STATIC = 0.2;

const LANDED_MAX_SPEED = 85; // m/s, ~165 kt (landing speed ~150 kt)
const LANDING_MAX_VSPEED = 5; // m/s
const LANDING_MIN_PITCH = -5 * PI_OVER_180;
const LANDING_MAX_ROLL = 5 * PI_OVER_180;

function computeCl(aoa: number, flapsExtended: boolean): number {
    const flapBoost = flapsExtended ? CL_FLAPS_FACTOR : 1.0;
    const stallAoa = flapsExtended ? STALL_AOA * 1.1 : STALL_AOA;
    const maxCl = MAX_CL * flapBoost;

    if (Math.abs(aoa) <= stallAoa) {
        return clamp(CL0 + CL_ALPHA * aoa * flapBoost, -maxCl * 0.35, maxCl);
    }

    const peakCl = (CL0 + CL_ALPHA * stallAoa * Math.sign(aoa)) * flapBoost;
    const postStall = Math.cos((Math.abs(aoa) - stallAoa) * 4.0);
    return peakCl * Math.max(0, postStall);
}

function computeInducedDrag(cl: number): number {
    return INDUCED_DRAG_K * cl * cl;
}

function computeThrustAccel(throttle: number): number {
    if (throttle <= AB_THROTTLE) {
        return MIL_THRUST * (throttle / AB_THROTTLE);
    }
    const abFraction = (throttle - AB_THROTTLE) / (1 - AB_THROTTLE);
    return MIL_THRUST + (AB_THRUST - MIL_THRUST) * abFraction;
}

export class RealisticFlightModel extends FlightModel {

    private stall = -1;

    private forward = new THREE.Vector3();
    private up = new THREE.Vector3();
    private right = new THREE.Vector3();
    private velocityUnit = new THREE.Vector3();
    private thrust = new THREE.Vector3();
    private drag = new THREE.Vector3();
    private lift = new THREE.Vector3();
    private weight = new THREE.Vector3();
    private friction = new THREE.Vector3();
    private forces = new THREE.Vector3();
    private sideForce = new THREE.Vector3();
    private liftDirection = new THREE.Vector3();
    private _v = new THREE.Vector3();

    constructor() {
        super();
        this.obj.up.copy(UP);
    }

    step(delta: number): void {
        if (this.crashed) return;

        if (this.effectiveThrottle > this.throttle) {
            this.effectiveThrottle = Math.max(this.throttle, this.effectiveThrottle - THROTTLE_DOWN_RATE * delta);
        } else if (this.effectiveThrottle < this.throttle) {
            this.effectiveThrottle = Math.min(this.throttle, this.effectiveThrottle + THROTTLE_UP_RATE * delta);
        }

        this.forward.copy(FORWARD).applyQuaternion(this.obj.quaternion);
        this.up.copy(UP).applyQuaternion(this.obj.quaternion);
        this.right.copy(RIGHT).applyQuaternion(this.obj.quaternion);

        const altitude = this.obj.position.y;
        const airDensity = computeAirDensity(altitude);
        const thrustFactor = computeThrustDensityFactor(airDensity, altitude);
        const speed = this.velocity.length();
        const dynamicPressure = computeDynamicPressure(airDensity, speed);
        const controlScale = clamp(dynamicPressure / Q_REF, MIN_CONTROL_Q, MAX_CONTROL_Q);

        let aoa = 0;
        if (speed > 1.0) {
            aoa = computeAngleOfAttack(this.forward, this.right, this.velocity, this._v);
        }
        this.angleOfAttackRad = aoa;

        const cl = computeCl(aoa, this.flapsExtended);
        const waveDrag = computeDynamicPressureDragPenalty(speed, altitude);
        const cd = CD0 * (1 + waveDrag)
            + computeInducedDrag(cl)
            + (this.landingGearDeployed ? CD_LANDING_GEAR_FACTOR : 0)
            + (this.flapsExtended ? CD_FLAPS_FACTOR : 0);

        this.updateStallState(speed, aoa, altitude);

        const pitchAuthority = this.stall >= 0 ? 0.35 : 1.0;
        const rollFlapFactor = this.flapsExtended ? ROLL_FLAPS_FACTOR : 1.0;
        const yawControlScale = MIN_CONTROL_Q + (controlScale - MIN_CONTROL_Q) * YAW_CONTROL_Q_SCALE;

        if (!isZero(this.roll) && !this.landed) {
            this.obj.rotateZ(this.roll * ROLL_RATE * controlScale * rollFlapFactor * delta);
        }

        if (!isZero(this.pitch)
            && !(this.landed && this.pitch < 0)
            && (this.stall < 0 || (this.pitch < 0 && this.up.y > 0) || (this.pitch > 0 && this.up.y < 0))
        ) {
            this.obj.rotateX(-this.pitch * PITCH_RATE * controlScale * pitchAuthority * delta);
        }

        if (!isZero(this.yaw) && !isZero(speed)) {
            this.obj.rotateY(-this.yaw * (this.landed ? YAW_RATE_LANDED : YAW_RATE) * yawControlScale * delta);
        }

        roundToZero(this.thrust.copy(this.forward).multiplyScalar(
            thrustFactor * computeThrustAccel(this.effectiveThrottle) * DRY_MASS
        ));

        if (speed > 1e-3) {
            this.velocityUnit.copy(this.velocity).multiplyScalar(1 / speed);
            roundToZero(this.drag.copy(this.velocityUnit).negate().multiplyScalar(dynamicPressure * WING_AREA * cd));

            if (speed > 0.5) {
                this.liftDirection.crossVectors(this.right, this.velocityUnit);
                if (this.liftDirection.lengthSq() < 1e-6) {
                    this.liftDirection.copy(this.up);
                } else {
                    this.liftDirection.normalize();
                    if (this.liftDirection.dot(this.up) < 0) {
                        this.liftDirection.negate();
                    }
                }
                roundToZero(this.lift.copy(this.liftDirection).multiplyScalar(dynamicPressure * WING_AREA * cl));
            } else {
                this.lift.set(0, 0, 0);
            }
        } else {
            this.drag.set(0, 0, 0);
            this.lift.set(0, 0, 0);
        }

        roundToZero(this.weight.set(0, -DRY_MASS * GRAVITY, 0));

        if (!this.landed && speed > 5) {
            const lateralSpeed = this.velocity.dot(this.right);
            const forwardSpeed = this.velocity.dot(this.forward);
            const beta = Math.atan2(lateralSpeed, Math.max(Math.abs(forwardSpeed), 5));
            const dampForce = -lateralSpeed * SIDE_SLIP_DAMP_RATE * DRY_MASS;
            const betaForce = CY_BETA * beta * dynamicPressure * WING_AREA;
            roundToZero(this.sideForce.copy(this.right).multiplyScalar(dampForce + betaForce));
        } else {
            this.sideForce.set(0, 0, 0);
        }

        this.forces.set(0, 0, 0).add(this.thrust).add(this.drag).add(this.lift).add(this.sideForce).add(this.weight);

        if (this.landed) {
            const weightMagnitude = DRY_MASS * GRAVITY;
            const prjForces = this._v.copy(this.forces).setY(0);
            const prjForcesMagnitude = prjForces.length();
            const maxStaticFriction = GROUND_FRICTION_STATIC * weightMagnitude;
            const kineticFriction = GROUND_FRICTION_KINETIC * weightMagnitude;

            if (isZero(speed) && prjForcesMagnitude < maxStaticFriction) {
                this.friction.copy(prjForces).negate();
            } else if (speed > 0.5) {
                this.friction.copy(this.velocityUnit).setY(0).negate().normalize().multiplyScalar(kineticFriction);
            } else {
                this.friction.set(0, 0, 0);
            }
            roundToZero(this.friction);
        } else {
            this.friction.set(0, 0, 0);
        }

        this.forces.add(this.friction);
        if (this.landed && this.forces.y < 0) {
            this.forces.setY(0);
        }

        const accel = roundToZero(this.forces.divideScalar(DRY_MASS));
        this.up.copy(UP).applyQuaternion(this.obj.quaternion);
        this.loadFactorG = computeLoadFactorG(accel, this.up);
        this.velocity.addScaledVector(accel, delta);

        if (this.landed && this.velocity.y < 0) {
            this.velocity.setY(0);
        }

        this.obj.position.addScaledVector(
            this.landed ? roundToZero(this.velocity, 0.01) : this.velocity,
            delta
        );

        if (this.obj.position.y > PLANE_DISTANCE_TO_GROUND) {
            this.landed = false;
        }

        this.handleGroundContact(speed);

        this.wrapPosition();
    }

    getStallStatus(): number {
        return this.stall;
    }

    private updateStallState(speed: number, aoa: number, altitude: number) {
        if (this.landed || speed < 5) {
            this.stall = -1;
            return;
        }

        const aoaStall = clamp((Math.abs(aoa) - STALL_AOA * 0.75) / (STALL_AOA * 0.35), 0, 1);
        const speedStall = clamp((MIN_FLYING_SPEED - speed) / MIN_FLYING_SPEED, 0, 1);
        const stallLevel = Math.max(aoaStall, altitude > PLANE_DISTANCE_TO_GROUND + 2 ? speedStall : 0);
        this.stall = stallLevel > 0 ? stallLevel : -1;
    }

    private handleGroundContact(speed: number) {
        if (this.obj.position.y >= PLANE_DISTANCE_TO_GROUND) {
            return;
        }

        this.obj.position.y = PLANE_DISTANCE_TO_GROUND;
        const [pitchAngle, rollAngle] = calculatePitchRoll(this.obj);

        if (this.landingGearDeployed === false
            || speed > LANDED_MAX_SPEED
            || this.velocity.y < -LANDING_MAX_VSPEED
            || Math.abs(rollAngle) > LANDING_MAX_ROLL
            || LANDING_MIN_PITCH > pitchAngle) {
            this.crashed = true;
            return;
        }

        const heading = this.obj.getWorldDirection(this._v);
        if (heading.y < 0) {
            heading.setY(0).add(this.obj.position);
            this.obj.lookAt(heading);
        }
        this.velocity.setY(0);
        this.stall = -1;
        this.landed = true;
    }

    private wrapPosition() {
        const terrainHalfSize = 2.5 * TERRAIN_SCALE * TERRAIN_MODEL_SIZE;
        if (this.obj.position.x > terrainHalfSize) this.obj.position.x = -terrainHalfSize;
        if (this.obj.position.x < -terrainHalfSize) this.obj.position.x = terrainHalfSize;
        if (this.obj.position.z > terrainHalfSize) this.obj.position.z = -terrainHalfSize;
        if (this.obj.position.z < -terrainHalfSize) this.obj.position.z = terrainHalfSize;
    }
}
