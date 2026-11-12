/** Full-screen boot progress overlay (#boot-progress). */

import {
    KeyboardControlAction, KeyboardControlLayoutId, formatControlKey, getKeyboardLayout,
} from '../input/keyboardLayouts';
import { BootBarPacer } from './bootBarPacer';
import { WeldBarLoop, WeldGeometry, WeldMessage, WeldReply } from './weldBar';

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

/** How often the fade checks whether the bar has arrived. */
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
/**
 * The targets the load reported, kept here to map steps onto the bar; the
 * bar that is drawn paces its own copy (weldBar.ts), told every change.
 */
const pacer = new BootBarPacer();
let mode: BarMode = 'idle';
/** Where the streaming bar's 0 % sits: past the boot (or respawn preload) it continues. */
let streamBase = 0;
/** Whether the bar is drawing (between runBar and stopBar). */
let running = false;
/** Whether the drawn bar reached 100 since the last reset. */
let arrived = false;
/** Whether the overlay covers the view (not fading or hidden); see bootOverlayCovering. */
let covering = false;

/**
 * Whether the loading overlay covers the view right now. The kernel then
 * draws the paused, blurred view under it at a low rate, so the main
 * thread has time for the load (see index.ts).
 */
export function bootOverlayCovering(): boolean {
    return covering;
}

type WeldPost = (m: Exclude<WeldMessage, { t: 'init' }>) => void;
let weldPost: WeldPost | undefined | null;

/**
 * The weld bar's drawing loop: in a worker on the canvas handed over to it
 * where the browser can, so the bar runs at the display's rate whatever the
 * main thread is doing; on the page otherwise. Null without the canvas.
 */
function weld(): WeldPost | null {
    if (weldPost !== undefined) {
        return weldPost;
    }
    const canvas = document.getElementById('boot-progress-sparks') as HTMLCanvasElement | null;
    if (!canvas) {
        return (weldPost = null);
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onArrived = () => {
        arrived = true;
    };
    if (typeof canvas.transferControlToOffscreen === 'function' && typeof Worker !== 'undefined') {
        try {
            const worker = new Worker(new URL('./weldBarWorker.ts', import.meta.url));
            const offscreen = canvas.transferControlToOffscreen();
            const init: WeldMessage = { t: 'init', canvas: offscreen, reduced };
            worker.postMessage(init, [offscreen]);
            worker.onmessage = (e: MessageEvent<WeldReply>) => {
                if (e.data.t === 'arrived') {
                    onArrived();
                }
            };
            weldPost = m => worker.postMessage(m);
        } catch {
            weldPost = undefined;
        }
    }
    if (weldPost === undefined) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return (weldPost = null);
        }
        const loop = new WeldBarLoop(canvas, ctx, cb => requestAnimationFrame(cb),
            id => cancelAnimationFrame(id), onArrived, reduced);
        weldPost = m => {
            switch (m.t) {
                case 'geom': loop.setGeometry(m.geom); break;
                case 'reset': loop.reset(); break;
                case 'target': loop.setTarget(m.percent); break;
                case 'run': loop.run(m.on); break;
            }
        };
    }
    new ResizeObserver(sendWeldGeometry).observe(canvas);
    return weldPost;
}

/** Where the track sits on the canvas, for the weld loop to draw it there. */
function sendWeldGeometry(): void {
    const canvas = document.getElementById('boot-progress-sparks');
    const track = document.getElementById('boot-progress-track');
    if (!canvas || !track || !weldPost) {
        return;
    }
    const c = canvas.getBoundingClientRect();
    const t = track.getBoundingClientRect();
    if (c.width === 0 || c.height === 0) {
        return;
    }
    const geom: WeldGeometry = {
        width: c.width,
        height: c.height,
        dpr: window.devicePixelRatio || 1,
        track: { x: t.left - c.left, y: t.top - c.top, w: t.width, h: t.height },
    };
    weldPost({ t: 'geom', geom });
}

function resetBar(): void {
    pacer.reset(performance.now());
    arrived = false;
    weld()?.({ t: 'reset' });
}

function setBarTarget(percent: number): void {
    pacer.setTarget(percent);
    weld()?.({ t: 'target', percent: pacer.targetPercent });
}

function runBar(): void {
    covering = true;
    if (!running) {
        running = true;
        weld();
        sendWeldGeometry();
        weld()?.({ t: 'run', on: true });
    }
}

function stopBar(): void {
    if (running) {
        running = false;
        weld()?.({ t: 'run', on: false });
    }
    covering = false;
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
        resetBar();
    }
    setBarTarget(percent * BOOT_SHARE / 100);
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
        resetBar();
    }
    const p = Math.max(0, Math.min(100, percent));
    setBarTarget(streamBase + (100 - streamBase) * p / 100);
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

/**
 * Let the bar glide to 100, then clear the blur and dim to nothing over a
 * second (see index.html) and hide the overlay. Resolves when the fade
 * begins; a respawn's new bar before then cancels it.
 */
export function fadeOutBootProgress(): Promise<void> {
    const root = document.getElementById('boot-progress');
    if (!root) {
        return Promise.resolve();
    }
    setBarTarget(100);
    return new Promise<void>(resolve => {
        const started = performance.now();
        const wait = setInterval(() => {
            // A new bar (a respawn) took over: leave the overlay up.
            if (pacer.targetPercent < 100) {
                clearInterval(wait);
                resolve();
                return;
            }
            if (!arrived && running && performance.now() - started < BAR_FINISH_WAIT_MS) {
                return;
            }
            clearInterval(wait);
            beginFade(root);
            resolve();
        }, BAR_FRAME_MS);
    });
}

/** Longest the fade waits for the bar to arrive (it stops in a hidden tab). */
const BAR_FINISH_WAIT_MS = 2000;

function beginFade(root: HTMLElement): void {
    root.classList.add('fading');
    covering = false;
    const done = () => {
        // Shown again (a respawn) since the fade began: leave it up.
        if (!root.classList.contains('fading')) {
            return;
        }
        root.classList.add('hidden');
        root.classList.remove('fading', 'streaming');
        stopBar();
    };
    // Only the overlay's own fade: transitionend bubbles, and the bar's width
    // ends a transition every frame or two, which hid the overlay 0.2 s into
    // the fade.
    const onEnd = (e: TransitionEvent) => {
        if (e.target === root) {
            root.removeEventListener('transitionend', onEnd);
            done();
        }
    };
    root.addEventListener('transitionend', onEnd);
    // transitionend never fires when the transition is skipped (reduced motion, hidden tab).
    setTimeout(done, 1100);
}
