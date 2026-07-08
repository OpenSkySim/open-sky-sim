import { KernelTask } from "../../core/kernel";
import {
    ARROWS_STICK_FULL_HOLD_S,
    ARROWS_STICK_LOG_K,
    ARROWS_STICK_TAP_INCREMENT,
    ARROWS_STICK_TAP_MAX_S,
    THROTTLE_RATE,
} from "../../defs";
import { PlayerEntity } from "../../scene/entities/player";
import { clamp } from "../../utils/math";


export enum KeyboardControlAction {
    PITCH_POS,
    PITCH_NEG,
    ROLL_POS,
    ROLL_NEG,
    YAW_POS,
    YAW_NEG,
    THROTTLE_POS,
    THROTTLE_NEG
}

export enum KeyboardControlLayoutId {
    QWERTY,
    QWERTZ,
    AZERTY,
    DVORAK,
    ARROWS,
}

export type KeyboardControlLayout = Record<KeyboardControlAction, string>;

const QwertyKeyboardControlLayout: KeyboardControlLayout = {
    [KeyboardControlAction.PITCH_POS]: 's',
    [KeyboardControlAction.PITCH_NEG]: 'w',
    [KeyboardControlAction.ROLL_POS]: 'd',
    [KeyboardControlAction.ROLL_NEG]: 'a',
    [KeyboardControlAction.YAW_POS]: 'e',
    [KeyboardControlAction.YAW_NEG]: 'q',
    [KeyboardControlAction.THROTTLE_POS]: 'z',
    [KeyboardControlAction.THROTTLE_NEG]: 'x',
}

const QwertzKeyboardControlLayout: KeyboardControlLayout = {
    [KeyboardControlAction.PITCH_POS]: 's',
    [KeyboardControlAction.PITCH_NEG]: 'w',
    [KeyboardControlAction.ROLL_POS]: 'd',
    [KeyboardControlAction.ROLL_NEG]: 'a',
    [KeyboardControlAction.YAW_POS]: 'e',
    [KeyboardControlAction.YAW_NEG]: 'q',
    [KeyboardControlAction.THROTTLE_POS]: 'y',
    [KeyboardControlAction.THROTTLE_NEG]: 'x',
}

const AzertyKeyboardControlLayout: KeyboardControlLayout = {
    [KeyboardControlAction.PITCH_POS]: 's',
    [KeyboardControlAction.PITCH_NEG]: 'z',
    [KeyboardControlAction.ROLL_POS]: 'd',
    [KeyboardControlAction.ROLL_NEG]: 'q',
    [KeyboardControlAction.YAW_POS]: 'e',
    [KeyboardControlAction.YAW_NEG]: 'a',
    [KeyboardControlAction.THROTTLE_POS]: 'w',
    [KeyboardControlAction.THROTTLE_NEG]: 'x',
}

const DvorakKeyboardControlLayout: KeyboardControlLayout = {
    [KeyboardControlAction.PITCH_POS]: 'o',
    [KeyboardControlAction.PITCH_NEG]: ',',
    [KeyboardControlAction.ROLL_POS]: 'e',
    [KeyboardControlAction.ROLL_NEG]: 'a',
    [KeyboardControlAction.YAW_POS]: '.',
    [KeyboardControlAction.YAW_NEG]: '\'',
    [KeyboardControlAction.THROTTLE_POS]: 'q',
    [KeyboardControlAction.THROTTLE_NEG]: 'j',
}

const ArrowsKeyboardControlLayout: KeyboardControlLayout = {
    [KeyboardControlAction.PITCH_POS]: 'arrowdown',
    [KeyboardControlAction.PITCH_NEG]: 'arrowup',
    [KeyboardControlAction.ROLL_POS]: 'arrowright',
    [KeyboardControlAction.ROLL_NEG]: 'arrowleft',
    [KeyboardControlAction.YAW_POS]: 'x',
    [KeyboardControlAction.YAW_NEG]: 'y',
    [KeyboardControlAction.THROTTLE_POS]: 'numpadadd',
    [KeyboardControlAction.THROTTLE_NEG]: 'numpadsubtract',
}

export const KeyboardControlLayouts = new Map<KeyboardControlLayoutId, KeyboardControlLayout>([
    [KeyboardControlLayoutId.QWERTY, QwertyKeyboardControlLayout],
    [KeyboardControlLayoutId.QWERTZ, QwertzKeyboardControlLayout],
    [KeyboardControlLayoutId.AZERTY, AzertyKeyboardControlLayout],
    [KeyboardControlLayoutId.DVORAK, DvorakKeyboardControlLayout],
    [KeyboardControlLayoutId.ARROWS, ArrowsKeyboardControlLayout],
]);

enum Stick {
    IDLE,
    POSITIVE_ENDED,
    NEGATIVE_ENDED,
    POSITIVE,
    NEGATIVE
};

export class KeyboardControlDevice implements KernelTask {
    private pitchState: Stick = Stick.IDLE;
    private rollState: Stick = Stick.IDLE;
    private yawState: Stick = Stick.IDLE;
    private throttleState: Stick = Stick.IDLE;
    private wheelBrakeHeld = false;
    private wKeyDown = false;

    private layout: KeyboardControlLayout = ArrowsKeyboardControlLayout;
    private layoutId: KeyboardControlLayoutId = KeyboardControlLayoutId.ARROWS;
    private pitchPressAt = 0;
    private pitchPressFrom = 0;
    private rollPressAt = 0;

    constructor(private player: PlayerEntity) {
        this.setupInput();
    }

    private usesCumulativeStick(): boolean {
        return this.layoutId === KeyboardControlLayoutId.ARROWS;
    }

    /** Log-shaped 0..1: fine control near centre, faster approach to full stick. */
    private arrowStickCurve(linear: number): number {
        const t = clamp(linear, 0, 1);
        const k = ARROWS_STICK_LOG_K;
        return (Math.exp(k * t) - 1) / (Math.exp(k) - 1);
    }

    private arrowStickCurveInverse(curved: number): number {
        const y = clamp(curved, 0, 1);
        const k = ARROWS_STICK_LOG_K;
        return Math.log(y * (Math.exp(k) - 1) + 1) / k;
    }

    private shapeStick(linear: number): number {
        const sign = Math.sign(linear) || 1;
        return sign * this.arrowStickCurve(Math.abs(linear));
    }

    private unshapeStick(shaped: number): number {
        const sign = Math.sign(shaped) || 1;
        return sign * this.arrowStickCurveInverse(Math.abs(shaped));
    }

    /** Tap: +INCREMENT; hold: ramp from press value to ±1.0 over FULL_HOLD_S (log-shaped). */
    private arrowPitchStick(from: number, pressAt: number, dir: 1 | -1, onRelease: boolean): number {
        const heldS = (performance.now() - pressAt) / 1000;
        const linearFrom = this.unshapeStick(from);
        if (onRelease && heldS < ARROWS_STICK_TAP_MAX_S) {
            return this.shapeStick(clamp(linearFrom + dir * ARROWS_STICK_TAP_INCREMENT, -1, 1));
        }
        if (!onRelease && heldS < ARROWS_STICK_TAP_MAX_S) {
            return from;
        }
        const t = Math.min(heldS / ARROWS_STICK_FULL_HOLD_S, 1);
        const linearTarget = dir > 0 ? 1 : -1;
        const linear = linearFrom + (linearTarget - linearFrom) * t;
        return this.shapeStick(linear);
    }

    /** Roll springs back on release; ramp from neutral immediately while held. */
    private arrowRollStick(pressAt: number, dir: 1 | -1): number {
        const heldS = (performance.now() - pressAt) / 1000;
        const t = Math.min(heldS / ARROWS_STICK_FULL_HOLD_S, 1);
        return this.shapeStick(dir * t);
    }

    private beginPitchPress(state: Stick.POSITIVE | Stick.NEGATIVE): void {
        if (this.pitchState !== state) {
            this.pitchPressAt = performance.now();
            this.pitchPressFrom = this.player.pitchInput;
        }
        this.pitchState = state;
    }

    private beginRollPress(state: Stick.POSITIVE | Stick.NEGATIVE): void {
        if (this.rollState !== state) {
            this.rollPressAt = performance.now();
        }
        this.rollState = state;
    }

    private finishPitchPress(state: Stick.POSITIVE | Stick.NEGATIVE): void {
        const dir: 1 | -1 = state === Stick.POSITIVE ? 1 : -1;
        this.player.setPitch(this.arrowPitchStick(this.pitchPressFrom, this.pitchPressAt, dir, true));
        this.pitchState = state === Stick.POSITIVE ? Stick.POSITIVE_ENDED : Stick.NEGATIVE_ENDED;
    }

    update(delta: number) {
        if (!this.player.controlsEnabled || this.player.isAutopilotEnabled) {
            return;
        }
        if (this.wKeyDown && this.canApplyWheelBrakes()) {
            if (!this.wheelBrakeHeld) {
                this.engageWheelBrakes();
            }
        } else if (this.wheelBrakeHeld && !(this.wKeyDown && this.canApplyWheelBrakes())) {
            this.releaseWheelBrakes();
            if (this.wKeyDown) {
                this.restoreLayoutActionForKey('w');
            }
        }

        if (this.pitchState !== Stick.IDLE) {
            if (this.usesCumulativeStick()) {
                if (this.pitchState === Stick.POSITIVE) {
                    this.player.setPitch(this.arrowPitchStick(this.pitchPressFrom, this.pitchPressAt, 1, false));
                } else if (this.pitchState === Stick.NEGATIVE) {
                    this.player.setPitch(this.arrowPitchStick(this.pitchPressFrom, this.pitchPressAt, -1, false));
                } else {
                    this.pitchState = Stick.IDLE;
                }
            } else {
                switch (this.pitchState) {
                    case Stick.POSITIVE_ENDED:
                    case Stick.NEGATIVE_ENDED: {
                        this.pitchState = Stick.IDLE;
                        this.player.setPitch(0.0);
                        break;
                    }
                    case Stick.NEGATIVE: {
                        this.player.setPitch(-0.75);
                        break;
                    }
                    case Stick.POSITIVE: {
                        this.player.setPitch(0.75);
                        break;
                    }
                }
            }
        }

        if (this.rollState !== Stick.IDLE) {
            if (this.usesCumulativeStick()) {
                if (this.rollState === Stick.POSITIVE) {
                    this.player.setRoll(this.arrowRollStick(this.rollPressAt, 1));
                } else if (this.rollState === Stick.NEGATIVE) {
                    this.player.setRoll(this.arrowRollStick(this.rollPressAt, -1));
                } else {
                    this.rollState = Stick.IDLE;
                    this.player.setRoll(0.0);
                }
            } else {
                switch (this.rollState) {
                    case Stick.POSITIVE_ENDED:
                    case Stick.NEGATIVE_ENDED: {
                        this.rollState = Stick.IDLE;
                        this.player.setRoll(0.0);
                        break;
                    }
                    case Stick.NEGATIVE: {
                        this.player.setRoll(-0.75);
                        break;
                    }
                    case Stick.POSITIVE: {
                        this.player.setRoll(0.75);
                        break;
                    }
                }
            }
        }

        if (this.yawState !== Stick.IDLE) {
            switch (this.yawState) {
                case Stick.POSITIVE_ENDED:
                case Stick.NEGATIVE_ENDED: {
                    this.yawState = Stick.IDLE;
                    this.player.setYaw(0.0);
                    break;
                }
                case Stick.NEGATIVE: {
                    this.player.setYaw(-0.75);
                    break;
                }
                case Stick.POSITIVE: {
                    this.player.setYaw(0.75);
                    break;
                }
            }
        }

        if (this.throttleState !== Stick.IDLE) {
            const isPositive = this.throttleState === Stick.POSITIVE || this.throttleState === Stick.POSITIVE_ENDED;
            const step = delta * 0.01 * (isPositive ? THROTTLE_RATE : -THROTTLE_RATE);
            const skipContinuousInAbBand = this.player.useF16ThrottleDetents() &&
                this.player.isInThrottleAbDetentBand() && isPositive;
            if (this.throttleState === Stick.POSITIVE_ENDED || this.throttleState === Stick.NEGATIVE_ENDED) {
                this.throttleState = Stick.IDLE;
            }
            if (!skipContinuousInAbBand) {
                this.player.adjustThrottle(step);
            }
        }
    }

    setKeyboardLayout(layoutId: KeyboardControlLayoutId) {
        if (this.usesCumulativeStick() && layoutId !== KeyboardControlLayoutId.ARROWS) {
            this.player.setPitch(0);
            this.player.setRoll(0);
        }
        this.layoutId = layoutId;
        this.layout = KeyboardControlLayouts.get(layoutId) || QwertyKeyboardControlLayout;
    }

    private setupInput() {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            const key = normalizeControlKey(event);
            if (this.isLayoutKey(key) && (key.startsWith('arrow') || key.startsWith('numpad'))) {
                event.preventDefault();
            }
            if (this.handleWheelBrakeKeyDown(key)) {
                return;
            }
            if (key === 'w') {
                this.wKeyDown = true;
            }
            switch (key) {
                case this.layout[KeyboardControlAction.PITCH_POS]: {
                    this.beginPitchPress(Stick.POSITIVE);
                    break;
                }
                case this.layout[KeyboardControlAction.PITCH_NEG]: {
                    this.beginPitchPress(Stick.NEGATIVE);
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_POS]: {
                    this.beginRollPress(Stick.POSITIVE);
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_NEG]: {
                    this.beginRollPress(Stick.NEGATIVE);
                    break;
                }
                case this.layout[KeyboardControlAction.YAW_POS]: {
                    this.yawState = Stick.POSITIVE;
                    break;
                }
                case this.layout[KeyboardControlAction.YAW_NEG]: {
                    this.yawState = Stick.NEGATIVE;
                    break;
                }
                case this.layout[KeyboardControlAction.THROTTLE_POS]: {
                    if (this.player.useF16ThrottleDetents() && this.player.isInThrottleAbDetentBand()) {
                        if (!event.repeat) {
                            this.player.stepThrottle(1);
                        }
                    } else {
                        this.throttleState = Stick.POSITIVE;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.THROTTLE_NEG]: {
                    if (this.player.useF16ThrottleDetents() && this.player.throttleUnit >= 0.99) {
                        if (!event.repeat) {
                            this.player.stepThrottle(-1);
                        }
                    } else {
                        this.throttleState = Stick.NEGATIVE;
                    }
                    break;
                }
            }
        });

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            const key = normalizeControlKey(event);
            if (this.handleWheelBrakeKeyUp(key)) {
                return;
            }
            if (key === 'w') {
                this.wKeyDown = false;
            }
            switch (key) {
                case this.layout[KeyboardControlAction.PITCH_POS]: {
                    if (this.pitchState === Stick.POSITIVE) {
                        this.finishPitchPress(Stick.POSITIVE);
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.PITCH_NEG]: {
                    if (this.pitchState === Stick.NEGATIVE) {
                        this.finishPitchPress(Stick.NEGATIVE);
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_POS]: {
                    if (this.rollState === Stick.POSITIVE) {
                        this.rollState = Stick.POSITIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_NEG]: {
                    if (this.rollState === Stick.NEGATIVE) {
                        this.rollState = Stick.NEGATIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.YAW_POS]: {
                    if (this.yawState === Stick.POSITIVE) {
                        this.yawState = Stick.POSITIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.YAW_NEG]: {
                    if (this.yawState === Stick.NEGATIVE) {
                        this.yawState = Stick.NEGATIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.THROTTLE_POS]: {
                    if (this.throttleState === Stick.POSITIVE) {
                        this.throttleState = Stick.POSITIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.THROTTLE_NEG]: {
                    if (this.throttleState === Stick.NEGATIVE) {
                        this.throttleState = Stick.NEGATIVE_ENDED;
                    }
                    break;
                }
            }
        });

        document.addEventListener('blur', () => {
            this.pitchState = Stick.IDLE;
            this.rollState = Stick.IDLE;
            this.yawState = Stick.IDLE;
            this.throttleState = Stick.IDLE;
            this.wKeyDown = false;
            this.releaseWheelBrakes();
        });
    }

    private canApplyWheelBrakes(): boolean {
        return this.player.isLanded || this.player.isOnGround;
    }

    private handleWheelBrakeKeyDown(key: string): boolean {
        if (key !== 'w' || !this.canApplyWheelBrakes()) {
            return false;
        }
        this.wKeyDown = true;
        this.engageWheelBrakes();
        return true;
    }

    private handleWheelBrakeKeyUp(key: string): boolean {
        if (key !== 'w') {
            return false;
        }
        this.wKeyDown = false;
        if (this.wheelBrakeHeld) {
            this.releaseWheelBrakes();
            return true;
        }
        return false;
    }

    private engageWheelBrakes() {
        this.wheelBrakeHeld = true;
        this.player.setWheelBrakes(true);
        if (this.pitchState === Stick.NEGATIVE) {
            this.pitchState = Stick.IDLE;
            this.player.setPitch(0);
        }
        if (this.throttleState === Stick.POSITIVE) {
            this.throttleState = Stick.IDLE;
        }
    }

    private releaseWheelBrakes() {
        this.wheelBrakeHeld = false;
        this.player.setWheelBrakes(false);
    }

    private restoreLayoutActionForKey(key: string) {
        if (key === this.layout[KeyboardControlAction.PITCH_NEG]) {
            this.beginPitchPress(Stick.NEGATIVE);
            if (!this.usesCumulativeStick()) {
                this.player.setPitch(-0.75);
            }
        } else if (key === this.layout[KeyboardControlAction.THROTTLE_POS]) {
            this.throttleState = Stick.POSITIVE;
        }
    }

    private isLayoutKey(key: string) {
        return Object.values(this.layout).includes(key);
    }
}

function normalizeControlKey(event: KeyboardEvent): string {
    switch (event.code) {
        case 'NumpadAdd': return 'numpadadd';
        case 'NumpadSubtract': return 'numpadsubtract';
        default: return event.key.toLowerCase();
    }
}
