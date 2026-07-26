/**
 * FlightModel backed by the official JSBSim flight dynamics model, run via the
 * `@0x62/jsbsim-wasm` WebAssembly build, flying JSBSim's own stock F-16A model
 * (`aircraft/f16/f16.xml` — see assets/jsbsim/). Unlike FM2, the aerodynamics,
 * engine, FCS and ground reactions are ALL computed by JSBSim itself; this
 * class is a thin adapter that feeds pilot inputs in, steps the FDM, and
 * converts its aerospace-convention state out into the sim's world frame (see
 * physics/jsbsim/jsbsimCoordinateFrame.ts for the axis/units conversion).
 *
 * World position: X/Z (horizontal) are integrated here from the converted
 * world-frame velocity, since JSBSim's own lat/long are geodetic and the game
 * world is a flat, non-geodetic plane. Y (altitude) is instead read directly
 * from JSBSim's own `position/h-sl-ft`, since every IC application below sets
 * `ic/h-sl-ft` to match the current world Y with `ic/terrain-elevation-ft` = 0
 * — so JSBSim's own altitude state (and everything that depends on it:
 * atmosphere, gear compression, ground contact) stays authoritative and
 * self-consistent, and our world Y always agrees with it exactly.
 *
 * Always flies the bundled F-16 regardless of the in-game aircraft selection
 * (`setAircraft` is inherited as a no-op) — the same simplification the DEBUG
 * model already makes.
 */
import * as THREE from 'three';
import { JSBSimSdk } from '@0x62/jsbsim-wasm';
import { wasmBinaryUrl, wasmModuleUrl } from '@0x62/jsbsim-wasm/wasm';
import { PLANE_DISTANCE_TO_GROUND } from '../../defs';
import { clamp } from '../../utils/math';
import { F16_PROFILE } from '../f16Profile';
import {
    FT_TO_M, M_TO_FT,
    jsbsimAttitudeToQuaternion, jsbsimBodyVelocityToWorld,
    worldQuaternionToJsbsimAttitude, worldVelocityToJsbsimBody,
} from '../jsbsim/jsbsimCoordinateFrame';
import { FlightModel } from './flightModel';

const DEG = Math.PI / 180;
const LBF_TO_N = 4.4482216153;

/**
 * Runtime-relative MEMFS paths this integration fetches and writes before
 * loading the model. Deliberately excludes the stock aircraft/f16/Systems/
 * {hook,pushback}.xml systems — see the comment on f16.xml's now-removed
 * <system file="pushback"/hook"> references for why.
 */
const JSBSIM_DATA_FILES: ReadonlyArray<readonly [string, string]> = [
    ['aircraft/f16/f16.xml', '/assets/jsbsim/aircraft/f16/f16.xml'],
    ['engine/F100-PW-229.xml', '/assets/jsbsim/engine/F100-PW-229.xml'],
    ['engine/direct.xml', '/assets/jsbsim/engine/direct.xml'],
];

// f16.xml's own aerosurface_scale ranges for fcs/{elevator,aileron,rudder}-control (see
// assets/jsbsim/aircraft/f16/f16.xml), used to normalize the actual post actuator-lag/FBW
// surface positions back into [-1, 1] for the visible control-surface animation.
const MAX_ELEVATOR_RAD = 0.436;
const MAX_AILERON_RAD = 0.375;
const MAX_RUDDER_RAD = 0.524;

export class JsbsimFlightModel extends FlightModel {
    private stall = -1;
    private airspeedMps = 0;
    private readonly lastVelocityForAccel = new THREE.Vector3();
    private readonly scratchQuat = new THREE.Quaternion();

    private constructor(private readonly sdk: JSBSimSdk) {
        super();
    }

    /** Creates the WASM runtime, fetches/writes the bundled F-16 data and loads it. */
    static async create(): Promise<JsbsimFlightModel> {
        const sdk = await JSBSimSdk.create({ moduleUrl: wasmModuleUrl, wasmUrl: wasmBinaryUrl });

        for (const [runtimePath, url] of JSBSIM_DATA_FILES) {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch JSBSim data file ${url}: HTTP ${res.status}`);
            }
            sdk.writeDataFile(runtimePath, await res.text());
        }

        if (!sdk.loadModel('f16')) {
            throw new Error('JSBSim failed to load the aircraft/f16/f16.xml model');
        }

        // Engines start OFF by default (propulsion/engine[0]/set-running == 0) —
        // JSBSim never spins them up on its own just because fcs/throttle-cmd-norm
        // is nonzero, so without this the aircraft would sit there producing zero
        // thrust no matter how far forward the throttle is pushed.
        sdk.setPropertyValue('propulsion/engine[0]/set-running', 1);

        const model = new JsbsimFlightModel(sdk);
        model.applyInitialConditions(
            new THREE.Vector3(0, PLANE_DISTANCE_TO_GROUND, 0), new THREE.Quaternion(), new THREE.Vector3(),
        );
        return model;
    }

    /**
     * Writes JSBSim `ic/*` properties from a desired world position/orientation/
     * velocity and re-runs the model at that state (dt = 0). Used at construction,
     * on {@link reset}, and whenever the game externally teleports the aircraft
     * (spawn, model swap, debug teleport — see the position/quaternion/velocityVector
     * setters below).
     */
    private applyInitialConditions(position: THREE.Vector3, quaternion: THREE.Quaternion, velocity: THREE.Vector3): void {
        const { phiRad, thetaRad, psiRad } = worldQuaternionToJsbsimAttitude(quaternion);
        const { uMps, vMps, wMps } = worldVelocityToJsbsimBody(velocity, quaternion);

        this.sdk.setPropertyValue('ic/terrain-elevation-ft', 0);
        this.sdk.setPropertyValue('ic/h-sl-ft', position.y * M_TO_FT);
        this.sdk.setPropertyValue('ic/phi-rad', phiRad);
        this.sdk.setPropertyValue('ic/theta-rad', thetaRad);
        this.sdk.setPropertyValue('ic/psi-true-rad', psiRad);
        this.sdk.setPropertyValue('ic/u-fps', uMps * M_TO_FT);
        this.sdk.setPropertyValue('ic/v-fps', vMps * M_TO_FT);
        this.sdk.setPropertyValue('ic/w-fps', wMps * M_TO_FT);
        this.sdk.setPropertyValue('ic/p-rad_sec', 0);
        this.sdk.setPropertyValue('ic/q-rad_sec', 0);
        this.sdk.setPropertyValue('ic/r-rad_sec', 0);
        this.sdk.runIc();

        this.obj.position.copy(position);
        this.obj.quaternion.copy(quaternion);
        this.velocity.copy(velocity);
        this.lastVelocityForAccel.copy(velocity);
    }

    reset(): void {
        super.reset();
        this.applyInitialConditions(this.obj.position, this.obj.quaternion, this.velocity);
    }

    step(delta: number): void {
        // Game stick: +pitch = aft/nose-up, +roll = right (see FM2 fcs.ts).
        // Elevator cmd polarity is inverted vs the game; aileron is too.
        this.sdk.setPropertyValue('fcs/elevator-cmd-norm', -this.pitch);
        this.sdk.setPropertyValue('fcs/aileron-cmd-norm', -this.roll);
        this.sdk.setPropertyValue('fcs/rudder-cmd-norm', -this.yaw);
        this.sdk.setPropertyValue('fcs/steer-cmd-norm', -this.yaw);
        this.sdk.setPropertyValue('fcs/throttle-cmd-norm', this.throttle);
        this.sdk.setPropertyValue('gear/gear-cmd-norm', this.landingGearDeployed ? 1 : 0);
        const brake = this.wheelBrakesApplied ? 1 : 0;
        this.sdk.setPropertyValue('fcs/left-brake-cmd-norm', brake);
        this.sdk.setPropertyValue('fcs/right-brake-cmd-norm', brake);
        this.sdk.setPropertyValue('fcs/center-brake-cmd-norm', brake);
        this.effectiveThrottle = this.throttle;

        this.sdk.setDt(delta);
        this.sdk.run();

        const phi = this.sdk.getPropertyValue('attitude/phi-rad');
        const theta = this.sdk.getPropertyValue('attitude/theta-rad');
        let psi = this.sdk.getPropertyValue('attitude/psi-rad');

        const u = this.sdk.getPropertyValue('velocities/u-fps') * FT_TO_M;
        const v = this.sdk.getPropertyValue('velocities/v-fps') * FT_TO_M;
        const w = this.sdk.getPropertyValue('velocities/w-fps') * FT_TO_M;
        jsbsimAttitudeToQuaternion(phi, theta, psi, this.scratchQuat);
        jsbsimBodyVelocityToWorld(u, v, w, this.scratchQuat, this.velocity);

        // JSBSim integrates its own lat/long internally, but this adapter integrates
        // flat-world X/Z from converted velocity instead. attitude/psi-rad can then
        // drift away from the actual horizontal velocity (body yaws on the HUD while
        // ground track stays put). Reconcile yaw with horizontal motion when fast
        // enough; vectorHeading uses atan2(vx, -vz) and hdg ≈ psi + 180°.
        const horizSpd = Math.hypot(this.velocity.x, this.velocity.z);
        if (horizSpd > 8) {
            psi = Math.atan2(this.velocity.x, -this.velocity.z) - Math.PI;
        }
        jsbsimAttitudeToQuaternion(phi, theta, psi, this.obj.quaternion);

        this.obj.position.x += this.velocity.x * delta;
        this.obj.position.z += this.velocity.z * delta;
        this.obj.position.y = this.sdk.getPropertyValue('position/h-sl-ft') * FT_TO_M;

        if (delta > 0) {
            this.accelWorld.copy(this.velocity).sub(this.lastVelocityForAccel).divideScalar(delta);
        } else {
            this.accelWorld.set(0, 0, 0);
        }
        this.lastVelocityForAccel.copy(this.velocity);

        this.airspeedMps = this.sdk.getPropertyValue('velocities/vt-fps') * FT_TO_M;
        this.angleOfAttackRad = this.sdk.getPropertyValue('aero/alpha-rad');
        // JSBSim's own convention reads -1 in level 1g flight; flip so the HUD
        // reads the usual pilot's-eye +1g convention (see accelerations/n-pilot-z-norm).
        this.loadFactorG = -this.sdk.getPropertyValue('accelerations/n-pilot-z-norm');
        this.engineThrustN = this.sdk.getPropertyValue('propulsion/engine[0]/thrust-lbs') * LBF_TO_N;

        const elevatorPosRad = this.sdk.getPropertyValue('fcs/elevator-pos-rad');
        const aileronPosRad = this.sdk.getPropertyValue('fcs/aileron-pos-rad');
        const rudderPosRad = this.sdk.getPropertyValue('fcs/rudder-pos-rad');
        // Surface positions are inverted vs game stick for elevator; aileron too.
        this.commandedElevator = clamp(-elevatorPosRad / MAX_ELEVATOR_RAD, -1, 1);
        this.commandedAileron = clamp(-aileronPosRad / MAX_AILERON_RAD, -1, 1);
        this.commandedRudder = clamp(-rudderPosRad / MAX_RUDDER_RAD, -1, 1);

        this.handleGroundState(phi, theta);
        this.updateStallState();
    }

    /**
     * Ground contact bookkeeping mirroring Fm2FlightModel.handleGroundState,
     * reusing JSBSim's own bank (phi) and pitch (theta) angles directly — both
     * already share this model's nose-up-positive / bank-magnitude convention,
     * so no further conversion is needed for the envelope checks below. JSBSim's
     * own gear model already handles the actual contact forces; this layer only
     * derives the game's landed/crashed bookkeeping on top, same as FM2.
     */
    private handleGroundState(phiRad: number, thetaRad: number): void {
        const restY = PLANE_DISTANCE_TO_GROUND;
        const onGround = this.obj.position.y <= restY + 0.25;

        if (this.obj.position.y > restY + 0.3) {
            this.landed = false;
        }

        // Hard floor so a bad IC/teleport can never tunnel the body through the ground.
        const minY = restY - 0.6;
        if (this.obj.position.y < minY) {
            this.obj.position.y = minY;
            if (this.velocity.y < 0) this.velocity.y = 0;
        }

        if (!onGround) return;

        const speed = this.velocity.length();
        const landingMaxRollRad = F16_PROFILE.landingMaxRollDeg * DEG;
        const landingMinPitchRad = F16_PROFILE.landingMinPitchDeg * DEG;
        const hardContact = this.velocity.y < -F16_PROFILE.landingMaxVerticalSpeedMps;
        const badAttitude = Math.abs(phiRad) > landingMaxRollRad || thetaRad < landingMinPitchRad;

        if (!this.landed && (hardContact || speed > F16_PROFILE.landingMaxSpeedMps)) {
            if (!this.landingGearDeployed || hardContact || badAttitude) {
                this.crashed = true;
                return;
            }
        }
        if (!this.landingGearDeployed && this.velocity.y < -1.0) {
            this.crashed = true;
            return;
        }
        if (speed < F16_PROFILE.landingMaxSpeedMps && Math.abs(phiRad) < landingMaxRollRad) {
            this.landed = true;
        }
    }

    private updateStallState(): void {
        if (this.landed) { this.stall = -1; return; }
        const stallAoaRad = F16_PROFILE.stallAoaDeg * DEG;
        const aoa = Math.abs(this.angleOfAttackRad);
        const aoaStall = this.airspeedMps > 5 ? clamp((aoa - stallAoaRad * 0.85) / (stallAoaRad * 0.3), 0, 1) : 0;
        const speedStall = this.obj.position.y > PLANE_DISTANCE_TO_GROUND + 5
            ? clamp((F16_PROFILE.minFlyingSpeedMps - this.airspeedMps) / F16_PROFILE.minFlyingSpeedMps, 0, 1) : 0;
        const level = Math.max(aoaStall, speedStall);
        this.stall = level > 0 ? level : -1;
    }

    getStallStatus(): number {
        return this.stall;
    }

    set position(p: THREE.Vector3) {
        this.applyInitialConditions(p, this.obj.quaternion, this.velocity);
    }

    get position() {
        return this.obj.position;
    }

    set quaternion(q: THREE.Quaternion) {
        this.applyInitialConditions(this.obj.position, q, this.velocity);
    }

    get quaternion() {
        return this.obj.quaternion;
    }

    set velocityVector(v: THREE.Vector3) {
        this.applyInitialConditions(this.obj.position, this.obj.quaternion, v);
    }

    get velocityVector() {
        return this.velocity;
    }
}
