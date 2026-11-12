/** Full-screen boot progress overlay (#boot-progress). */

import {
    KeyboardControlAction, KeyboardControlLayoutId, formatControlKey, getKeyboardLayout,
} from '../input/keyboardLayouts';
import { startWeldSparks, stopWeldSparks } from './weldBar';

const CHEAT_SHEET_ROWS: Record<string, [KeyboardControlAction, KeyboardControlAction]> = {
    pitch: [KeyboardControlAction.PITCH_NEG, KeyboardControlAction.PITCH_POS],
    roll: [KeyboardControlAction.ROLL_NEG, KeyboardControlAction.ROLL_POS],
    yaw: [KeyboardControlAction.YAW_NEG, KeyboardControlAction.YAW_POS],
    throttle: [KeyboardControlAction.THROTTLE_POS, KeyboardControlAction.THROTTLE_NEG],
};

/** Relabel the stick/throttle keys of the loading cheat sheet (#boot-keys) for a layout. */
export function setBootCheatSheetLayout(layoutId: KeyboardControlLayoutId): void {
    const layout = getKeyboardLayout(layoutId);
    for (const [action, keys] of Object.entries(CHEAT_SHEET_ROWS)) {
        const kbds = document.querySelectorAll(`#boot-keys [data-action="${action}"] kbd`);
        keys.forEach((key, i) => {
            const kbd = kbds[i];
            if (kbd) {
                kbd.textContent = formatControlKey(layout[key]);
            }
        });
    }
}

/**
 * Moves the bar at an even pace rather than in the jumps its steps report.
 *
 * Steps report progress in bursts - a tile download ticks per tile, an
 * airfield takes a second, the next step lands 20 % further on - so a bar
 * that follows them directly runs fast, stops, and leaps. This one aims for
 * where the load is heading instead: it extrapolates when the reported
 * target will reach 100 from how fast it has moved so far, and runs at the
 * speed that arrives there then, easing between speeds over a second or two.
 * A stall therefore slows the bar down instead of freezing it, and a jump
 * speeds it up instead of making it leap. It never goes backwards, and it
 * holds short of 100 until the target is there.
 */
export class BootBarPacer {
    private start: number | undefined;
    private last = 0;
    private speed = 0;
    private paced = false;
    private target = 0;
    shown = 0;

    /** Never lowers the target: steps may report out of order. */
    setTarget(percent: number): void {
        this.target = Math.max(this.target, Math.max(0, Math.min(100, percent)));
    }

    get targetPercent(): number {
        return this.target;
    }

    reset(now: number): void {
        this.start = now;
        this.last = now;
        this.speed = 0;
        this.paced = false;
        this.target = 0;
        this.shown = 0;
    }

    /** Advance to `now` (ms) and return the percent to draw. */
    tick(now: number): number {
        if (this.start === undefined) {
            this.reset(now);
        }
        const dtS = Math.max(0, now - this.last) / 1000;
        this.last = now;
        if (this.target >= 100) {
            // Done: finish the sweep quickly rather than at the old pace.
            this.shown += (100 - this.shown) * Math.min(1, dtS / BAR_FINISH_S);
            if (100 - this.shown < 0.05) {
                this.shown = 100;
            }
            return this.shown;
        }
        const elapsedS = Math.max(0, (now - (this.start ?? now)) / 1000);
        const frac = this.target / 100;
        // Projected total time: from the pace so far, weighed against an
        // expected load time that only matters for the first seconds, while
        // there is too little history to project from (2 % after 50 ms is
        // not a 2.5 s load).
        const projectedS = frac > 0 ? elapsedS / frac : BAR_EXPECTED_TOTAL_S;
        const totalS = (elapsedS * projectedS + BAR_PRIOR_WEIGHT_S * BAR_EXPECTED_TOTAL_S)
            / (elapsedS + BAR_PRIOR_WEIGHT_S);
        const etaS = Math.min(BAR_ETA_MAX_S, Math.max(BAR_ETA_MIN_S, totalS - elapsedS));
        const wanted = (BAR_HOLD_PERCENT - this.shown) / etaS;
        if (!this.paced) {
            this.paced = true;
            // The first estimate: start at it. Easing up from standstill
            // left the bar behind for its first seconds, so it then had to
            // catch up - a bar that visibly accelerated through the load.
            this.speed = wanted;
        }
        this.speed += (wanted - this.speed) * Math.min(1, dtS / BAR_SPEED_EASE_S);
        this.shown = Math.min(BAR_HOLD_PERCENT, this.shown + Math.max(0, this.speed) * dtS);
        return this.shown;
    }
}

/** Seconds over which the bar's speed eases to a new estimate. */
const BAR_SPEED_EASE_S = 1.5;
/** Bounds on the projected time left, so the first instants cannot fling it. */
const BAR_ETA_MIN_S = 0.75;
const BAR_ETA_MAX_S = 60;
/** What a first launch takes, boot plus streaming hold, on a Pages-like link. */
const BAR_EXPECTED_TOTAL_S = 30;
/** How many seconds of real progress outweigh that expectation. */
const BAR_PRIOR_WEIGHT_S = 2;
/** Where the bar waits until the load is really done. */
const BAR_HOLD_PERCENT = 99;
/** Time constant of the last sweep to 100 once the load is done. */
const BAR_FINISH_S = 0.12;
const BAR_FRAME_MS = 50;

/**
 * Share of the bar the boot steps fill (setBootProgress' 0..100 maps onto
 * 0..BOOT_SHARE); the streaming hold that follows a boot fills the rest, so
 * the two read as one load rather than a bar that fills and starts again.
 * From a throttled Pages-like boot: about 13 s of boot steps, then the hold
 * ran to its 20 s cap.
 */
const BOOT_SHARE = 40;

type BarMode = 'idle' | 'boot' | 'stream';
const pacer = new BootBarPacer();
let mode: BarMode = 'idle';
/** Where the streaming bar's 0 % sits: past the boot (or respawn preload) it continues. */
let streamBase = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function drawBar(): void {
    const fill = document.getElementById('boot-progress-fill');
    if (fill) {
        fill.style.width = `${pacer.tick(performance.now()).toFixed(2)}%`;
    }
}

function runBar(): void {
    timer ??= setInterval(drawBar, BAR_FRAME_MS);
    startWeldSparks();
    drawBar();
}

function stopBar(): void {
    if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
    }
    stopWeldSparks();
    mode = 'idle';
}

function showOverlay(label: string): boolean {
    const root = document.getElementById('boot-progress');
    const text = document.getElementById('boot-progress-label');
    if (!root || !text) {
        return false;
    }
    text.textContent = label;
    root.classList.remove('hidden');
    return true;
}

export function setBootProgress(percent: number, label: string): void {
    if (!showOverlay(label)) {
        return;
    }
    if (mode !== 'boot') {
        mode = 'boot';
        pacer.reset(performance.now());
    }
    pacer.setTarget(percent * BOOT_SHARE / 100);
    runBar();
}

export function hideBootProgress(): void {
    const root = document.getElementById('boot-progress');
    if (!root) {
        return;
    }
    root.classList.add('hidden');
    stopBar();
}

/**
 * Switch the overlay from the opaque boot screen to a blurred pane over the
 * live view, for the streaming hold after boot (see Game.holdUntilStreamed).
 * Straight after a boot it carries on the boot's bar; otherwise (a respawn)
 * it is a bar of its own from 0.
 */
export function setBootStreaming(percent: number, label: string): void {
    const root = document.getElementById('boot-progress');
    const fresh = mode === 'idle' || !!root?.classList.contains('fading') || !!root?.classList.contains('hidden');
    if (!showOverlay(label)) {
        return;
    }
    root?.classList.add('streaming');
    // A respawn can start before the previous fade finished.
    root?.classList.remove('fading');
    if (mode === 'boot' && !fresh) {
        mode = 'stream';
        streamBase = pacer.targetPercent;
    } else if (fresh || mode !== 'stream') {
        mode = 'stream';
        streamBase = 0;
        pacer.reset(performance.now());
    }
    const p = Math.max(0, Math.min(100, percent));
    pacer.setTarget(streamBase + (100 - streamBase) * p / 100);
    runBar();
}

/**
 * Start the streaming hold's part of the bar: setBootStreaming's 0..100
 * maps from here on onto what is left past the boot or respawn preload.
 */
export function startStreamHoldBar(label: string): void {
    setBootStreaming(0, label);
    streamBase = pacer.targetPercent;
}

/** Clear the blur and dim to nothing over a second (see index.html), then hide the overlay. */
export function fadeOutBootProgress(): void {
    const root = document.getElementById('boot-progress');
    if (!root) {
        return;
    }
    root.classList.add('fading');
    pacer.setTarget(100);
    const done = () => {
        // Shown again (a respawn) since the fade began: leave it up.
        if (!root.classList.contains('fading')) {
            return;
        }
        root.classList.add('hidden');
        root.classList.remove('fading', 'streaming');
        stopBar();
    };
    root.addEventListener('transitionend', done, { once: true });
    // transitionend never fires when the transition is skipped (reduced motion, hidden tab).
    setTimeout(done, 1100);
}

/** The big "get ready" number shown after the streaming blur lifts (#countdown). */
export function showCountdown(text: string): void {
    const el = document.getElementById('countdown');
    if (!el) {
        return;
    }
    el.textContent = text;
    el.classList.remove('hidden');
    // Restart the pop animation for each number.
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
}

export function hideCountdown(): void {
    document.getElementById('countdown')?.classList.add('hidden');
}
