import * as THREE from 'three';
import { clamp, FORWARD, RIGHT, UP } from '../utils/math';
import { PilotableAircraft } from './aircraftControls';
import { SceneWorldQuery, WorldQuery } from './worldQuery';
import { Combatant } from '../weapons/combatant';

/**
 * Hierarchical flight phases. Mission logic sets high-level setpoints (heading,
 * altitude, speed); a shared inner controller layer turns those into normalized
 * stick/throttle. A terrain/obstacle safety layer can pre-empt any airborne
 * phase (see {@link AiPilot.update}).
 */
export enum AiFlightPhase {
    GROUND_IDLE,
    TAKEOFF_ROLL,
    CLIMB_OUT,
    NAVIGATE,
    ENGAGE,
    RTB,
    APPROACH,
    FLARE,
    ROLLOUT,
}

export interface AiPilotOptions {
    /** Cruise/patrol altitude (m). */
    cruiseAltitude?: number;
    /** Cruise/patrol speed (m/s). */
    cruiseSpeed?: number;
    /** Combat speed target (m/s). */
    combatSpeed?: number;
    /** Hard speed ceiling (m/s) the AI keeps below to avoid the transonic ring. */
    maxSpeed?: number;
    /** Muzzle velocity used for the gun lead solution (m/s). */
    bulletSpeed?: number;
    /** Max slant range at which the AI opens fire (m). */
    gunRange?: number;
    /** Minimum altitude above local terrain the AI will let itself get to (m). */
    hardDeck?: number;
    /** Optional pitch-loop tuning overrides (see the PITCH_* constants). */
    pitchKp?: number;
    pitchKd?: number;
    pitchSlew?: number;
}

// --- Controller gains / limits -------------------------------------------------
// The FM2 roll axis is rate-commanded (stick position sets roll RATE), so the
// bank-hold loop is proportional only: rollCmd = K * bankError drives the bank
// error to zero as a stable first-order response. (A derivative term here fights
// the plant's own integrator and produces a bang-bang limit cycle.)
const ROLL_KP = 1.5;                 // bank error (rad) -> roll command
const ROLL_YAW_COORD = 0.05;         // coordinating rudder as a fraction of bank
const BANK_PER_HEADING = 1.2;        // heading error (rad) -> desired bank (rad)
const HEADING_DEADBAND = 1.0 * Math.PI / 180;  // ignore sub-degree heading error
// Near +/-180 deg the shortest-turn sign chatters frame-to-frame, which makes
// the bank command flip and the aircraft rock instead of committing to the
// reversal. Latch a turn direction on entry and release once well clear.
const TURN_LATCH_ENTER = 150 * Math.PI / 180;
const TURN_LATCH_RELEASE = 110 * Math.PI / 180;
const RATE_EMA = 0.35;               // low-pass factor for finite-difference attitude rates
// Keep the nose out of the near-vertical regime where heading/bank (derived from
// the body axes' vertical components) go singular and the roll loop thrashes.
const MAX_ELEV_CMD = 55 * Math.PI / 180;
const MAX_BANK_NAV = 45 * Math.PI / 180;
const MAX_BANK_COMBAT = 72 * Math.PI / 180;
const MAX_BANK_APPROACH = 25 * Math.PI / 180;

const PITCH_KP = 1.0;                // pitch-angle error (rad) -> pitch command
// No AI pitch-RATE damping by default: the FM2 FCS already damps the short period
// internally, and feeding back a laggy finite-difference attitude rate here only
// adds phase lag that turns into a pilot-induced pitch oscillation. Left tunable
// for airframes/configs that need a little extra.
const PITCH_KD = 0;                  // pitch rate (rad/s) -> pitch command (damping)
// Slew-rate limit the pitch command (per second) so the AI cannot inject inputs
// near the airframe's short-period frequency (a PIO guard).
const PITCH_CMD_SLEW = 3.0;          // max change in pitch command per second
const VS_TO_PITCH = 0.02;            // vertical-speed error (m/s) -> pitch command
const VS_PER_ALT = 0.06;             // altitude error (m) -> desired vertical speed (m/s)
const MAX_VS = 120;                  // clamp on commanded vertical speed (m/s)
const PITCH_MIN = -0.6;
const PITCH_MAX = 0.9;

const THROTTLE_KP = 0.02;            // speed error (m/s) -> throttle rate (1/s)
// Overspeed protection. The FM2 airframe develops a lightly-damped transonic
// short-period that goes into a violent load-factor limit cycle (it rings even
// hands-off) above ~Mach 0.8, so the AI actively keeps its energy below that
// regime: it caps commanded speed, snaps the throttle to idle when fast, and —
// crucially, since throttle alone cannot arrest a dive — refuses to hold the nose
// down while overspeeding so the climb bleeds the excess speed back off. This is
// a mitigation for an airframe/aero characteristic, not a flight-model fix.
const MAX_SPEED = 240;               // speed ceiling (m/s); ring onset is ~250+ m/s
const OVERSPEED_IDLE_MARGIN = 8;     // hard-idle the throttle this far over the cap
const OVERSPEED_ELEV_GAIN = 0.02;    // overspeed (m/s) -> min nose-up angle (rad)
const OVERSPEED_ELEV_MAX = 0.4;      // cap on the overspeed nose-up floor (rad)

const ROTATE_SPEED = 90;             // takeoff rotation speed (m/s)
const GEAR_UP_ALT = 40;              // retract gear above this AGL (m)
const FLAPS_UP_SPEED = 150;          // retract flaps above this speed (m/s)

const GUN_CONE_RAD = 3.0 * Math.PI / 180;   // fire when aim within this cone
const TERRAIN_LOOKAHEAD_S = 8;               // predictive GPWS horizon (s)

export class AiPilot {

    private phase: AiFlightPhase = AiFlightPhase.NAVIGATE;
    private target: Combatant | undefined;

    private readonly cruiseAltitude: number;
    private readonly cruiseSpeed: number;
    private readonly combatSpeed: number;
    private readonly maxSpeed: number;
    private readonly bulletSpeed: number;
    private readonly gunRange: number;
    private readonly hardDeck: number;
    private readonly pitchKp: number;
    private readonly pitchKd: number;
    private readonly pitchSlew: number;

    /** Latest throttle command (integrated by the speed controller). */
    private throttleCmd = 0.5;
    /** Set true by the engage phase when a valid gun solution exists this frame. */
    private firing = false;
    /** Pull-up override latch to add hysteresis to the GPWS. */
    private pullUpActive = false;
    /** Latched turn direction (+1/-1/0) to resolve the +/-180 deg heading ambiguity. */
    private turnDir = 0;

    // Pitch-rate estimate (finite-differenced, low-passed) for pitch-loop damping.
    private prevNosePitch = 0;
    private hasPrevAttitude = false;
    private pitchRateEst = 0;
    // Slew-limited pitch command state (see PITCH_CMD_SLEW).
    private pitchCmdState = 0;
    private lastDelta = 1 / 60;

    // Scratch vectors (avoid per-frame allocation).
    private readonly pos = new THREE.Vector3();
    private readonly vel = new THREE.Vector3();
    private readonly quat = new THREE.Quaternion();
    private readonly fwd = new THREE.Vector3();
    private readonly right = new THREE.Vector3();
    private readonly up = new THREE.Vector3();
    private readonly tpos = new THREE.Vector3();
    private readonly tvel = new THREE.Vector3();
    private readonly aim = new THREE.Vector3();
    private readonly probe = new THREE.Vector3();
    private readonly toPoint = new THREE.Vector3();

    constructor(
        private readonly aircraft: PilotableAircraft,
        private readonly world: WorldQuery,
        options: AiPilotOptions = {},
    ) {
        this.cruiseAltitude = options.cruiseAltitude ?? 3000;
        this.cruiseSpeed = options.cruiseSpeed ?? 220;
        this.combatSpeed = options.combatSpeed ?? 300;
        this.maxSpeed = options.maxSpeed ?? MAX_SPEED;
        this.bulletSpeed = options.bulletSpeed ?? 1000;
        this.gunRange = options.gunRange ?? 900;
        this.hardDeck = options.hardDeck ?? 150;
        this.pitchKp = options.pitchKp ?? PITCH_KP;
        this.pitchKd = options.pitchKd ?? PITCH_KD;
        this.pitchSlew = options.pitchSlew ?? PITCH_CMD_SLEW;
    }

    getPhase(): AiFlightPhase {
        return this.phase;
    }

    setPhase(phase: AiFlightPhase): void {
        this.phase = phase;
    }

    setTarget(target: Combatant | undefined): void {
        this.target = target;
    }

    /** True while a firing solution exists this frame (read after update). */
    get isFiring(): boolean {
        return this.firing;
    }

    /** Begin an autonomous takeoff from the current runway. */
    startTakeoff(): void {
        this.phase = AiFlightPhase.TAKEOFF_ROLL;
    }

    // -------------------------------------------------------------------------

    update(delta: number): void {
        this.firing = false;
        const ac = this.aircraft;
        if (ac.isCrashed()) {
            ac.setThrottle(0);
            ac.setWheelBrakes(true);
            return;
        }

        this.readState(delta);

        // Safety layer: predictive terrain/ground pull-up pre-empts any airborne
        // mission phase (but not deliberate ground contact near the runway).
        const groundPhase = this.phase === AiFlightPhase.GROUND_IDLE
            || this.phase === AiFlightPhase.TAKEOFF_ROLL
            || this.phase === AiFlightPhase.FLARE
            || this.phase === AiFlightPhase.ROLLOUT;
        if (!groundPhase && this.updateTerrainAvoidance(delta)) {
            return;
        }

        switch (this.phase) {
            case AiFlightPhase.GROUND_IDLE: this.doGroundIdle(); break;
            case AiFlightPhase.TAKEOFF_ROLL: this.doTakeoff(delta); break;
            case AiFlightPhase.CLIMB_OUT: this.doClimbOut(delta); break;
            case AiFlightPhase.NAVIGATE: this.doNavigate(delta); break;
            case AiFlightPhase.ENGAGE: this.doEngage(delta); break;
            case AiFlightPhase.RTB: this.doRtb(delta); break;
            case AiFlightPhase.APPROACH: this.doApproach(delta); break;
            case AiFlightPhase.FLARE: this.doFlare(delta); break;
            case AiFlightPhase.ROLLOUT: this.doRollout(); break;
        }
    }

    // --- State ---------------------------------------------------------------

    private readState(delta: number): void {
        this.lastDelta = delta > 1e-4 ? delta : this.lastDelta;
        this.pos.copy(this.aircraft.getPosition());
        this.vel.copy(this.aircraft.getVelocity());
        this.quat.copy(this.aircraft.getQuaternion());
        this.fwd.copy(FORWARD).applyQuaternion(this.quat);
        this.right.copy(RIGHT).applyQuaternion(this.quat);
        this.up.copy(UP).applyQuaternion(this.quat);

        // Finite-difference attitude rates for loop damping (guard first frame /
        // tiny dt, and wrap the bank difference across the +/-pi seam).
        const nosePitch = this.nosePitch;
        if (this.hasPrevAttitude && delta > 1e-4) {
            const pitchRateRaw = (nosePitch - this.prevNosePitch) / delta;
            // Low-pass the finite-difference rate so the pitch damping term does
            // not chatter on the discrete-time signal.
            this.pitchRateEst += (pitchRateRaw - this.pitchRateEst) * RATE_EMA;
        } else {
            this.pitchRateEst = 0;
        }
        this.prevNosePitch = nosePitch;
        this.hasPrevAttitude = true;
    }

    private get heading(): number {
        return Math.atan2(this.fwd.x, this.fwd.z);
    }

    /**
     * Bank angle, +right (rad), full +/-pi range. Using atan2 (rather than asin)
     * of the body-right and body-up vertical components resolves the upright vs
     * inverted ambiguity, so the roll controller recovers instead of diverging.
     */
    private get bank(): number {
        return Math.atan2(this.right.y, this.up.y);
    }

    /** Nose pitch angle above horizon (rad). */
    private get nosePitch(): number {
        return Math.asin(clamp(this.fwd.y, -1, 1));
    }

    // --- Inner controllers ---------------------------------------------------

    /** Roll toward a desired bank. Proportional on the rate-commanded roll axis. */
    private commandBank(desiredBank: number): number {
        const rollCmd = clamp((desiredBank - this.bank) * ROLL_KP, -1, 1);
        this.aircraft.setRoll(rollCmd);
        return rollCmd;
    }

    /** Bank-to-turn toward a heading, with mild coordinating yaw. */
    private commandHeading(desiredHeading: number, maxBank: number): void {
        let hErr = wrapPi(desiredHeading - this.heading);
        // Commit to a single turn direction through the +/-180 ambiguity so the
        // bank command does not chatter and the reversal actually completes. The
        // latch engages past ENTER and stays applied until the error shrinks
        // below RELEASE (hysteresis), covering the whole ambiguous band.
        if (this.turnDir !== 0) {
            if (Math.abs(hErr) < TURN_LATCH_RELEASE) {
                this.turnDir = 0;
            } else {
                hErr = this.turnDir * Math.abs(hErr);
            }
        } else if (Math.abs(hErr) > TURN_LATCH_ENTER) {
            this.turnDir = hErr >= 0 ? 1 : -1;
            hErr = this.turnDir * Math.abs(hErr);
        }
        if (Math.abs(hErr) < HEADING_DEADBAND) {
            hErr = 0;
        }
        // Positive bank yields a negative heading rate in this frame convention,
        // so a positive heading error needs a negative (opposite) bank.
        const desiredBank = clamp(-hErr * BANK_PER_HEADING, -maxBank, maxBank);
        this.commandBank(desiredBank);
        // A touch of into-turn rudder, proportional to bank (not the raw roll
        // command) so a hard rollout does not slam the rudder and induce PIO.
        this.aircraft.setYaw(clamp(this.bank * ROLL_YAW_COORD, -0.3, 0.3));
    }

    /** Hold/seek an altitude via a vertical-speed inner loop. */
    private commandAltitude(desiredAlt: number): void {
        const altErr = desiredAlt - this.pos.y;
        const desiredVs = clamp(altErr * VS_PER_ALT, -MAX_VS, MAX_VS);
        this.commandVerticalSpeed(desiredVs);
    }

    private commandVerticalSpeed(desiredVs: number): void {
        // Cascade the climb request through the pitch-ATTITUDE loop instead of
        // mapping vertical-speed error straight to a stick/g command. A single
        // high-gain P term from vs-error to g has no phase margin at high dynamic
        // pressure and drives a ~2 s phugoid PIO (nose + load factor ringing while
        // altitude barely tracks). Converting the target climb rate into a target
        // flight-path/nose angle and holding that with commandElevation (P on
        // pitch error + pitch-rate damping) gives a well-damped inner loop.
        const speed = Math.max(30, this.aircraft.getAirspeed());
        const gamma = Math.asin(clamp(desiredVs / speed, -0.4, 0.4));
        // Small proportional trim on the residual vs-error keeps the achieved
        // climb honest despite the (unmodelled) angle-of-attack offset, but with a
        // gentle gain so it cannot dominate the attitude loop.
        const desiredNose = gamma + clamp((desiredVs - this.vel.y) * VS_TO_PITCH, -0.1, 0.1);
        this.commandElevation(desiredNose);
    }

    /** Point the nose at a target elevation angle (used to aim at a 3D point). */
    private commandElevation(desiredElev: number): void {
        desiredElev = clamp(desiredElev, -MAX_ELEV_CMD, MAX_ELEV_CMD);
        // Overspeed guard (common funnel for every airborne pitch command): while
        // faster than the ceiling, raise the floor on the commanded nose angle so
        // the AI cannot hold a dive that drives deeper into the transonic
        // limit-cycle regime — the shallower/climbing nose bleeds the speed off.
        const over = this.aircraft.getAirspeed() - this.maxSpeed;
        if (over > 0) {
            desiredElev = Math.max(desiredElev, clamp(over * OVERSPEED_ELEV_GAIN, 0, OVERSPEED_ELEV_MAX));
        }
        const pitchErr = desiredElev - this.nosePitch;
        const raw = pitchErr * this.pitchKp + this.bankPitchComp() - this.pitchRateEst * this.pitchKd;
        this.applyPitch(raw);
    }

    /**
     * Clamp, then slew-rate limit the pitch command before it reaches the model.
     * The rate limit is the key PIO suppressor: it stops the controller from
     * injecting inputs near the airframe's lightly-damped short-period frequency.
     */
    private applyPitch(raw: number): void {
        const target = this.limitPitchForAttitude(raw);
        const maxStep = this.pitchSlew * this.lastDelta;
        this.pitchCmdState += clamp(target - this.pitchCmdState, -maxStep, maxStep);
        this.aircraft.setPitch(this.pitchCmdState);
    }

    /**
     * Clamp a raw pitch command. While inverted (body up points down) a nose-up
     * elevator command pulls the nose toward the ground, so we suppress aft stick
     * and let the roll loop bring the aircraft upright first.
     */
    private limitPitchForAttitude(pitch: number): number {
        if (this.up.y < 0) {
            return clamp(pitch, PITCH_MIN, 0.1);
        }
        return clamp(pitch, PITCH_MIN, PITCH_MAX);
    }

    /** Extra back-pressure to hold the nose up while banked (upright only). */
    private bankPitchComp(): number {
        // No benefit past knife-edge: adding aft stick there deepens a dive.
        if (this.up.y <= 0) return 0;
        const c = Math.cos(clamp(this.bank, -1.4, 1.4));
        if (c <= 0.05) return 0.35;
        return clamp((1 / c - 1) * 0.25, 0, 0.5);
    }

    private commandSpeed(desiredSpeed: number, delta: number): void {
        // Never target a speed inside the transonic ring, and snap to idle when
        // clearly overspeeding so the slow throttle integrator stops feeding energy
        // into a dive (throttle alone cannot arrest it — see the elevation guard).
        desiredSpeed = Math.min(desiredSpeed, this.maxSpeed);
        const airspeed = this.aircraft.getAirspeed();
        const speedErr = desiredSpeed - airspeed;
        this.throttleCmd = clamp(this.throttleCmd + speedErr * THROTTLE_KP * delta, 0, 1);
        if (airspeed > this.maxSpeed + OVERSPEED_IDLE_MARGIN) {
            this.throttleCmd = 0;
        }
        this.aircraft.setThrottle(this.throttleCmd);
    }

    private wingsLevel(): void {
        this.commandBank(0);
        this.aircraft.setYaw(0);
    }

    // --- Safety layer --------------------------------------------------------

    /**
     * Predictive ground-proximity warning: sample terrain along the projected
     * flight path and pull up if the aircraft would bust its hard deck. Returns
     * true when the pull-up override is engaged this frame.
     */
    private updateTerrainAvoidance(delta: number): boolean {
        const speed = Math.max(1, this.aircraft.getAirspeed());
        let minClearance = Infinity;
        // Probe points from now to the look-ahead horizon.
        for (let t = 0.5; t <= TERRAIN_LOOKAHEAD_S; t += 0.5) {
            this.probe.copy(this.vel).multiplyScalar(t).add(this.pos);
            const g = this.world.groundHeightAt(this.probe.x, this.probe.z);
            const clearance = this.probe.y - g;
            if (clearance < minClearance) {
                minClearance = clearance;
            }
        }
        // Also consider the current instantaneous clearance.
        const nowClearance = this.pos.y - this.world.groundHeightAt(this.pos.x, this.pos.z);
        minClearance = Math.min(minClearance, nowClearance);

        // Hysteresis: engage below the deck, release once comfortably above it.
        if (this.pullUpActive) {
            if (minClearance > this.hardDeck * 2.0 && nowClearance > this.hardDeck) {
                this.pullUpActive = false;
            }
        } else if (minClearance < this.hardDeck) {
            this.pullUpActive = true;
        }

        if (!this.pullUpActive) {
            return false;
        }

        // Wings level + hard nose-up + full power until clear.
        this.wingsLevel();
        this.applyPitch(PITCH_MAX);
        this.throttleCmd = 1;
        this.aircraft.setThrottle(1);
        this.aircraft.setLandingGearDeployed(false);
        return true;
    }

    /** Adjust a desired heading to steer around a nearby static obstacle. */
    private avoidObstacles(desiredHeading: number): number {
        const world = this.world;
        if (!(world instanceof SceneWorldQuery)) {
            return desiredHeading;
        }
        const horizon = Math.max(400, this.aircraft.getAirspeed() * 4);
        const o = world.nearestObstacleWithin(this.pos.x, this.pos.z, horizon);
        if (!o) {
            return desiredHeading;
        }
        // Only worry about obstacles roughly ahead and tall enough to matter.
        if (this.pos.y > o.position.y + o.height + this.hardDeck) {
            return desiredHeading;
        }
        this.toPoint.set(o.position.x - this.pos.x, 0, o.position.z - this.pos.z);
        const bearing = Math.atan2(this.toPoint.x, this.toPoint.z);
        const off = wrapPi(bearing - this.heading);
        if (Math.abs(off) > Math.PI / 3) {
            return desiredHeading; // obstacle not in our path
        }
        // Steer away from the side the obstacle is on.
        const avoid = this.heading - Math.sign(off || 1) * (Math.PI / 4);
        return avoid;
    }

    // --- Phases --------------------------------------------------------------

    private doGroundIdle(): void {
        this.aircraft.setThrottle(0);
        this.throttleCmd = 0;
        this.aircraft.setWheelBrakes(true);
        this.applyPitch(0);
        this.wingsLevel();
        this.aircraft.setLandingGearDeployed(true);
    }

    private doTakeoff(delta: number): void {
        const rwy = this.world.runway();
        this.aircraft.setLandingGearDeployed(true);
        this.aircraft.setFlapsExtended(true);
        this.aircraft.setWheelBrakes(false);
        this.throttleCmd = 1;
        this.aircraft.setThrottle(1);

        // Ground steering: hold heading and centreline with the nosewheel (yaw).
        const rightX = Math.cos(rwy.heading);
        const rightZ = -Math.sin(rwy.heading);
        const lateral = (this.pos.x - rwy.center.x) * rightX + (this.pos.z - rwy.center.z) * rightZ;
        const headingErr = wrapPi(rwy.heading - this.heading);
        this.aircraft.setYaw(clamp(headingErr * 1.5 - lateral * 0.01, -1, 1));
        this.wingsLevel();

        const airspeed = this.aircraft.getAirspeed();
        if (airspeed >= ROTATE_SPEED) {
            this.applyPitch(0.5); // rotate
        } else {
            this.applyPitch(0);
        }

        const agl = this.pos.y - this.world.groundHeightAt(this.pos.x, this.pos.z);
        if (agl > 15 && this.vel.y > 2) {
            this.phase = AiFlightPhase.CLIMB_OUT;
        }
    }

    private doClimbOut(delta: number): void {
        const rwy = this.world.runway();
        const agl = this.pos.y - this.world.groundHeightAt(this.pos.x, this.pos.z);
        const airspeed = this.aircraft.getAirspeed();
        this.aircraft.setLandingGearDeployed(agl < GEAR_UP_ALT);
        this.aircraft.setFlapsExtended(airspeed < FLAPS_UP_SPEED);
        this.aircraft.setWheelBrakes(false);

        this.commandHeading(rwy.heading, MAX_BANK_NAV);
        this.commandVerticalSpeed(80);
        this.commandSpeed(this.cruiseSpeed, delta);

        if (this.pos.y >= this.cruiseAltitude * 0.7) {
            this.phase = AiFlightPhase.NAVIGATE;
        }
    }

    private doNavigate(delta: number): void {
        if (this.target && this.target.isAlive()) {
            this.phase = AiFlightPhase.ENGAGE;
            return;
        }
        this.aircraft.setLandingGearDeployed(false);
        this.aircraft.setFlapsExtended(false);
        // Gentle loitering turn holding cruise altitude/speed.
        const desiredHeading = this.avoidObstacles(this.heading + 0.4);
        this.commandHeading(desiredHeading, MAX_BANK_NAV);
        this.commandAltitudeClamped(this.cruiseAltitude);
        this.commandSpeed(this.cruiseSpeed, delta);
    }

    private doEngage(delta: number): void {
        if (!this.target || !this.target.isAlive()) {
            this.phase = AiFlightPhase.NAVIGATE;
            return;
        }
        this.aircraft.setLandingGearDeployed(false);
        this.aircraft.setFlapsExtended(false);

        this.target.readPosition(this.tpos);
        this.target.readVelocity(this.tvel);
        this.toPoint.copy(this.tpos).sub(this.pos);
        const range = this.toPoint.length();

        // Gun lead solution: where the target will be when a bullet arrives.
        const tof = range / this.bulletSpeed;
        this.aim.copy(this.tvel).multiplyScalar(tof).add(this.tpos);

        // Hard deck: never aim (and dive) below the terrain safety floor.
        const deck = this.world.groundHeightAt(this.aim.x, this.aim.z) + this.hardDeck;
        if (this.aim.y < deck) {
            this.aim.y = deck;
        }

        this.toPoint.copy(this.aim).sub(this.pos);
        const horiz = Math.hypot(this.toPoint.x, this.toPoint.z);
        let desiredHeading = Math.atan2(this.toPoint.x, this.toPoint.z);
        desiredHeading = this.avoidObstacles(desiredHeading);
        const desiredElev = Math.atan2(this.toPoint.y, horiz);

        this.commandHeading(desiredHeading, MAX_BANK_COMBAT);
        this.commandElevation(desiredElev);

        // Energy management: ease off when very close to avoid overshoot.
        const desiredSpeed = range < 250 ? this.combatSpeed * 0.7 : this.combatSpeed;
        this.commandSpeed(desiredSpeed, delta);

        // Fire when the nose is on the lead point and within gun range.
        this.toPoint.normalize();
        const aimDot = clamp(this.fwd.dot(this.toPoint), -1, 1);
        const aimAngle = Math.acos(aimDot);
        this.firing = range <= this.gunRange && aimAngle <= GUN_CONE_RAD;
    }

    private doRtb(delta: number): void {
        const rwy = this.world.runway();
        // Fly to an initial approach fix on the extended centreline, then hand
        // off to the approach controller.
        const fwdX = Math.sin(rwy.heading);
        const fwdZ = Math.cos(rwy.heading);
        const iafDist = rwy.halfLength + 8000;
        this.aim.set(
            rwy.center.x - fwdX * iafDist,
            this.cruiseAltitude * 0.4,
            rwy.center.z - fwdZ * iafDist,
        );
        this.toPoint.copy(this.aim).sub(this.pos);
        const desiredHeading = this.avoidObstacles(Math.atan2(this.toPoint.x, this.toPoint.z));
        this.commandHeading(desiredHeading, MAX_BANK_NAV);
        this.commandAltitudeClamped(this.aim.y);
        this.commandSpeed(this.cruiseSpeed, delta);

        if (Math.hypot(this.toPoint.x, this.toPoint.z) < 2500) {
            this.phase = AiFlightPhase.APPROACH;
        }
    }

    private doApproach(delta: number): void {
        const rwy = this.world.runway();
        const fwdX = Math.sin(rwy.heading);
        const fwdZ = Math.cos(rwy.heading);
        const rightX = Math.cos(rwy.heading);
        const rightZ = -Math.sin(rwy.heading);

        if (this.aircraft.isLanded()) {
            this.phase = AiFlightPhase.ROLLOUT;
            return;
        }

        // Touchdown ~300 m past the approach threshold.
        const touchdownDist = rwy.halfLength - 300;
        const tdX = rwy.center.x - fwdX * touchdownDist;
        const tdZ = rwy.center.z - fwdZ * touchdownDist;
        const along = (this.pos.x - tdX) * fwdX + (this.pos.z - tdZ) * fwdZ;
        const distToTouchdown = -along; // positive on approach

        const lateral = (this.pos.x - rwy.center.x) * rightX + (this.pos.z - rwy.center.z) * rightZ;
        // Roll to null the lateral offset, blended with a heading hold.
        const headingErr = wrapPi(rwy.heading - this.heading);
        // Same convention as commandHeading: a positive heading/​offset error needs
        // the opposite bank to correct it.
        const desiredBank = clamp(lateral * 0.01 - headingErr * 1.0, -MAX_BANK_APPROACH, MAX_BANK_APPROACH);
        this.commandBank(desiredBank);
        this.aircraft.setYaw(clamp(-lateral * 0.002, -0.3, 0.3));

        // 3-degree glideslope.
        const groundY = this.world.groundHeightAt(this.pos.x, this.pos.z);
        const targetAlt = groundY + Math.max(2, distToTouchdown * 0.052);
        this.commandAltitude(targetAlt);
        this.commandSpeed(150, delta);

        // Configure for landing on final.
        const agl = this.pos.y - groundY;
        this.aircraft.setLandingGearDeployed(agl < 500);
        this.aircraft.setFlapsExtended(agl < 500);

        if (agl < 15 && distToTouchdown < 400) {
            this.phase = AiFlightPhase.FLARE;
        }
    }

    private doFlare(delta: number): void {
        if (this.aircraft.isLanded()) {
            this.phase = AiFlightPhase.ROLLOUT;
            return;
        }
        this.aircraft.setThrottle(0);
        this.throttleCmd = 0;
        this.applyPitch(0.15);
        this.wingsLevel();
        this.aircraft.setLandingGearDeployed(true);
        this.aircraft.setFlapsExtended(true);
    }

    private doRollout(): void {
        const rwy = this.world.runway();
        this.aircraft.setThrottle(0);
        this.throttleCmd = 0;
        this.aircraft.setWheelBrakes(true);
        this.applyPitch(0);
        // Keep straight on the centreline.
        const headingErr = wrapPi(rwy.heading - this.heading);
        this.aircraft.setYaw(clamp(headingErr * 1.5, -1, 1));
        this.wingsLevel();
        if (this.aircraft.getAirspeed() < 2) {
            this.phase = AiFlightPhase.GROUND_IDLE;
        }
    }

    /** Altitude hold that never commands below the local terrain hard deck. */
    private commandAltitudeClamped(desiredAlt: number): void {
        const floor = this.world.groundHeightAt(this.pos.x, this.pos.z) + this.hardDeck;
        this.commandAltitude(Math.max(desiredAlt, floor));
    }
}

/** Wrap an angle to [-pi, pi]. */
function wrapPi(a: number): number {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}
