import { KernelTask } from "../../core/kernel";
import { STICK_RATE, THROTTLE_RATE } from "../../defs";
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

    private layout: KeyboardControlLayout = ArrowsKeyboardControlLayout;
    private layoutId: KeyboardControlLayoutId = KeyboardControlLayoutId.ARROWS;

    constructor(private player: PlayerEntity) {
        this.setupInput();
    }

    private usesCumulativeStick(): boolean {
        return this.layoutId === KeyboardControlLayoutId.ARROWS;
    }

    update(delta: number) {
        if (this.pitchState !== Stick.IDLE) {
            if (this.usesCumulativeStick()) {
                if (this.pitchState === Stick.POSITIVE_ENDED || this.pitchState === Stick.NEGATIVE_ENDED) {
                    this.pitchState = Stick.IDLE;
                } else {
                    const pitch = clamp(this.player.pitchInput + delta * STICK_RATE *
                        (this.pitchState === Stick.POSITIVE ? 1 : -1), -1, 1);
                    this.player.setPitch(pitch);
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
                if (this.rollState === Stick.POSITIVE_ENDED || this.rollState === Stick.NEGATIVE_ENDED) {
                    this.rollState = Stick.IDLE;
                    this.player.setRoll(0.0);
                } else {
                    const roll = clamp(this.player.rollInput + delta * STICK_RATE *
                        (this.rollState === Stick.POSITIVE ? 1 : -1), -1, 1);
                    this.player.setRoll(roll);
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
            switch (key) {
                case this.layout[KeyboardControlAction.PITCH_POS]: {
                    this.pitchState = Stick.POSITIVE;
                    break;
                }
                case this.layout[KeyboardControlAction.PITCH_NEG]: {
                    this.pitchState = Stick.NEGATIVE;
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_POS]: {
                    this.rollState = Stick.POSITIVE;
                    break;
                }
                case this.layout[KeyboardControlAction.ROLL_NEG]: {
                    this.rollState = Stick.NEGATIVE;
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
            switch (key) {
                case this.layout[KeyboardControlAction.PITCH_POS]: {
                    if (this.pitchState === Stick.POSITIVE) {
                        this.pitchState = Stick.POSITIVE_ENDED;
                    }
                    break;
                }
                case this.layout[KeyboardControlAction.PITCH_NEG]: {
                    if (this.pitchState === Stick.NEGATIVE) {
                        this.pitchState = Stick.NEGATIVE_ENDED;
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
        });
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
