import * as THREE from 'three';
import { clamp, FORWARD, RIGHT, UP } from '../../utils/math';
import { PilotableAircraft } from '../aircraftControls';
import { WorldQuery } from '../worldQuery';
import { FlightCommand } from './shawTypes';

// FM2-friendly gains — mirrored from AiPilot (rate-commanded roll → P-only bank).
const ROLL_KP = 2.2;
const ROLL_YAW_COORD = 0.05;
const BANK_PER_HEADING = 2.5;
const HEADING_DEADBAND = 1.0 * Math.PI / 180;
const TURN_LATCH_ENTER = 150 * Math.PI / 180;
const TURN_LATCH_RELEASE = 110 * Math.PI / 180;
const MAX_BANK_COMBAT = 75 * Math.PI / 180;
const PITCH_KP = 1.0;
const PITCH_KD = 0.35;
const PITCH_CMD_SLEW = 2.5;
const PITCH_MIN = -0.7;
const PITCH_MAX = 0.85;
const MAX_ELEV_CMD = 50 * Math.PI / 180;
const THROTTLE_KP = 0.04;
const RATE_EMA = 0.35;
const HARD_TURN_ENTER = 35 * Math.PI / 180;
const HARD_TURN_EXIT = 12 * Math.PI / 180;
const HARD_TURN_BANK_GAIN = 2.8;
const HARD_TURN_MIN_PULL = 0.45;
const HARD_TURN_FULL_PULL_ANGLE = 60 * Math.PI / 180;
const REVERSAL_LATCH_ENTER = 150 * Math.PI / 180;
const REVERSAL_LATCH_RELEASE = 110 * Math.PI / 180;
const OVERSPEED_ELEV_GAIN = 0.01;
const OVERSPEED_ELEV_MAX = 0.35;
const OVERSPEED_IDLE_MARGIN = 15;
const TERRAIN_LOOKAHEAD_S = 4;

function wrapPi(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

/**
 * Maps {@link FlightCommand} setpoints into normalized stick/throttle for FM2.
 * Uses the same P/PD bank/pitch/speed loops as classic AiPilot — not a naive
 * independent PID that would fight the rate-commanded roll axis.
 */
export class FlightControlComputer {
    private readonly maxSpeed: number;
    private readonly hardDeck: number;
    private readonly pitchKp: number;
    private readonly pitchKd: number;
    private readonly pitchSlew: number;

    private throttleCmd = 0.5;
    private pitchCmdState = 0;
    private lastDelta = 1 / 60;
    private turnDir = 0;
    private reversalDir = 0;
    private hardTurnActive = false;
    private pullUpActive = false;
    private prevNosePitch = 0;
    private hasPrevAttitude = false;
    private pitchRateEst = 0;

    private readonly pos = new THREE.Vector3();
    private readonly vel = new THREE.Vector3();
    private readonly quat = new THREE.Quaternion();
    private readonly fwd = new THREE.Vector3();
    private readonly right = new THREE.Vector3();
    private readonly up = new THREE.Vector3();
    private readonly aimDir = new THREE.Vector3();
    private readonly probe = new THREE.Vector3();

    constructor(
        private readonly aircraft: PilotableAircraft,
        private readonly world: WorldQuery,
        options: {
            maxSpeed?: number;
            hardDeck?: number;
            pitchKp?: number;
            pitchKd?: number;
            pitchSlew?: number;
        } = {},
    ) {
        this.maxSpeed = options.maxSpeed ?? 240;
        this.hardDeck = options.hardDeck ?? 150;
        this.pitchKp = options.pitchKp ?? PITCH_KP;
        this.pitchKd = options.pitchKd ?? PITCH_KD;
        this.pitchSlew = options.pitchSlew ?? PITCH_CMD_SLEW;
    }

    /**
     * Apply a tactical command. Returns true if terrain pull-up pre-empted the
     * command this frame (caller should suppress firing).
     */
    applyCommand(command: FlightCommand, delta: number): boolean {
        this.readState(delta);
        this.aircraft.setLandingGearDeployed(false);
        this.aircraft.setFlapsExtended(false);
        this.aircraft.setWheelBrakes(false);

        if (this.updateTerrainAvoidance()) {
            return true;
        }

        this.aimDir.copy(command.targetDirection);
        if (this.aimDir.lengthSq() < 1e-9) {
            this.aimDir.copy(this.fwd);
        } else {
            this.aimDir.normalize();
        }

        let desiredSpeed = Math.min(command.targetSpeed, this.maxSpeed);
        if (command.useAirbrakes) {
            desiredSpeed = Math.min(desiredSpeed, this.aircraft.getAirspeed() * 0.85);
            this.throttleCmd = Math.min(this.throttleCmd, 0.15);
        }

        if (command.allowHardTurn && this.commandHardTurn(this.aimDir, desiredSpeed)) {
            return false;
        }

        const desiredHeading = Math.atan2(this.aimDir.x, this.aimDir.z);
        const desiredElev = Math.asin(clamp(this.aimDir.y, -1, 1));
        this.commandHeading(desiredHeading, MAX_BANK_COMBAT);
        this.commandElevation(desiredElev);
        this.commandSpeed(desiredSpeed, delta);
        return false;
    }

    private readState(delta: number): void {
        this.lastDelta = delta > 1e-4 ? delta : this.lastDelta;
        this.pos.copy(this.aircraft.getPosition());
        this.vel.copy(this.aircraft.getVelocity());
        this.quat.copy(this.aircraft.getQuaternion());
        this.fwd.copy(FORWARD).applyQuaternion(this.quat);
        this.right.copy(RIGHT).applyQuaternion(this.quat);
        this.up.copy(UP).applyQuaternion(this.quat);

        const nosePitch = Math.asin(clamp(this.fwd.y, -1, 1));
        if (this.hasPrevAttitude && delta > 1e-4) {
            const pitchRateRaw = (nosePitch - this.prevNosePitch) / delta;
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

    private get bank(): number {
        return Math.atan2(this.right.y, this.up.y);
    }

    private get nosePitch(): number {
        return Math.asin(clamp(this.fwd.y, -1, 1));
    }

    private commandBank(desiredBank: number): void {
        const rollCmd = clamp((desiredBank - this.bank) * ROLL_KP, -1, 1);
        this.aircraft.setRoll(rollCmd);
    }

    private commandHeading(desiredHeading: number, maxBank: number): void {
        let hErr = wrapPi(desiredHeading - this.heading);
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
        const desiredBank = clamp(-hErr * BANK_PER_HEADING, -maxBank, maxBank);
        this.commandBank(desiredBank);
        this.aircraft.setYaw(clamp(this.bank * ROLL_YAW_COORD, -0.3, 0.3));
    }

    private commandElevation(desiredElev: number): void {
        desiredElev = clamp(desiredElev, -MAX_ELEV_CMD, MAX_ELEV_CMD);
        const over = this.aircraft.getAirspeed() - this.maxSpeed;
        if (over > 0) {
            desiredElev = Math.max(desiredElev, clamp(over * OVERSPEED_ELEV_GAIN, 0, OVERSPEED_ELEV_MAX));
        }
        const pitchErr = desiredElev - this.nosePitch;
        const raw = pitchErr * this.pitchKp + this.bankPitchComp() - this.pitchRateEst * this.pitchKd;
        this.applyPitch(raw);
    }

    private applyPitch(raw: number): void {
        const target = this.limitPitchForAttitude(raw);
        const maxStep = this.pitchSlew * this.lastDelta;
        this.pitchCmdState += clamp(target - this.pitchCmdState, -maxStep, maxStep);
        this.aircraft.setPitch(this.pitchCmdState);
    }

    private applyPitchImmediate(raw: number): void {
        this.pitchCmdState = this.limitPitchForAttitude(raw);
        this.aircraft.setPitch(this.pitchCmdState);
    }

    private limitPitchForAttitude(pitch: number): number {
        if (this.up.y < 0) {
            return clamp(pitch, PITCH_MIN, 0.1);
        }
        return clamp(pitch, PITCH_MIN, PITCH_MAX);
    }

    private bankPitchComp(): number {
        if (this.up.y <= 0) return 0;
        const c = Math.cos(clamp(this.bank, -1.4, 1.4));
        if (c <= 0.05) return 0.35;
        return clamp((1 / c - 1) * 0.25, 0, 0.5);
    }

    private commandSpeed(desiredSpeed: number, delta: number): void {
        desiredSpeed = Math.min(desiredSpeed, this.maxSpeed);
        const airspeed = this.aircraft.getAirspeed();
        const speedErr = desiredSpeed - airspeed;
        this.throttleCmd = clamp(this.throttleCmd + speedErr * THROTTLE_KP * delta, 0, 1);
        if (airspeed > this.maxSpeed + OVERSPEED_IDLE_MARGIN) {
            this.throttleCmd = 0;
        }
        this.aircraft.setThrottle(this.throttleCmd);
    }

    private commandHardTurn(aimDirection: THREE.Vector3, desiredSpeed: number): boolean {
        this.aimDir.copy(aimDirection).normalize();
        const aimAngle = Math.acos(clamp(this.fwd.dot(this.aimDir), -1, 1));
        if (this.hardTurnActive) {
            if (aimAngle < HARD_TURN_EXIT) {
                this.hardTurnActive = false;
            }
        } else if (aimAngle > HARD_TURN_ENTER) {
            this.hardTurnActive = true;
        }
        if (!this.hardTurnActive) {
            return false;
        }

        let desiredHeading = Math.atan2(this.aimDir.x, this.aimDir.z);
        let hErr = wrapPi(desiredHeading - this.heading);
        if (this.reversalDir !== 0) {
            if (Math.abs(hErr) < REVERSAL_LATCH_RELEASE) {
                this.reversalDir = 0;
            } else {
                hErr = this.reversalDir * Math.abs(hErr);
            }
        } else if (Math.abs(hErr) > REVERSAL_LATCH_ENTER) {
            this.reversalDir = hErr >= 0 ? 1 : -1;
            hErr = this.reversalDir * Math.abs(hErr);
        }
        const desiredBank = clamp(-hErr * HARD_TURN_BANK_GAIN, -MAX_BANK_COMBAT, MAX_BANK_COMBAT);
        this.commandBank(desiredBank);
        this.aircraft.setYaw(clamp(this.bank * ROLL_YAW_COORD, -0.3, 0.3));

        const pullT = clamp(aimAngle / HARD_TURN_FULL_PULL_ANGLE, 0, 1);
        const pull = HARD_TURN_MIN_PULL + pullT * (PITCH_MAX - HARD_TURN_MIN_PULL);
        this.applyPitchImmediate(pull);

        const over = this.aircraft.getAirspeed() - this.maxSpeed;
        if (over > 0) {
            const floor = clamp(over * OVERSPEED_ELEV_GAIN, 0, OVERSPEED_ELEV_MAX);
            this.applyPitchImmediate(Math.max(pull, floor));
        }

        this.commandSpeed(desiredSpeed, this.lastDelta);
        return true;
    }

    private updateTerrainAvoidance(): boolean {
        let minClearance = Infinity;
        for (let t = 0.5; t <= TERRAIN_LOOKAHEAD_S; t += 0.5) {
            this.probe.copy(this.vel).multiplyScalar(t).add(this.pos);
            const g = this.world.groundHeightAt(this.probe.x, this.probe.z);
            minClearance = Math.min(minClearance, this.probe.y - g);
        }
        const nowClearance = this.pos.y - this.world.groundHeightAt(this.pos.x, this.pos.z);
        minClearance = Math.min(minClearance, nowClearance);

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

        this.commandBank(0);
        this.aircraft.setYaw(0);
        this.applyPitch(PITCH_MAX);
        this.throttleCmd = 1;
        this.aircraft.setThrottle(1);
        return true;
    }
}
