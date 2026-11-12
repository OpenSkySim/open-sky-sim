/**
 * Runs the boot weld bar off the main thread (see weldBar.ts), so it moves
 * at the display's rate while the page builds the scene or draws the view.
 */

import { WeldBarLoop, WeldMessage, WeldReply } from './weldBar';

/** The bits of a worker's global this uses (the project builds against the DOM lib). */
interface WorkerScope {
    onmessage: ((e: MessageEvent<WeldMessage>) => void) | null;
    postMessage(message: WeldReply): void;
    requestAnimationFrame?: (cb: (now: number) => void) => number;
    cancelAnimationFrame?: (id: number) => void;
    setTimeout(cb: () => void, ms: number): number;
    clearTimeout(id: number): void;
}

const scope = self as unknown as WorkerScope;
let loop: WeldBarLoop | undefined;

// Workers draw with their own requestAnimationFrame where the browser has
// one (tied to the page's frames); a 60 Hz timer elsewhere.
const workerRaf = scope.requestAnimationFrame?.bind(scope);
const workerCaf = scope.cancelAnimationFrame?.bind(scope);
const raf: (cb: (now: number) => void) => number = workerRaf && workerCaf
    ? cb => workerRaf(cb)
    : cb => scope.setTimeout(() => cb(performance.now()), 1000 / 60);
const caf: (id: number) => void = workerRaf && workerCaf
    ? id => workerCaf(id)
    : id => scope.clearTimeout(id);

scope.onmessage = (e: MessageEvent<WeldMessage>) => {
    const m = e.data;
    if (m.t === 'init') {
        const ctx = m.canvas.getContext('2d');
        if (ctx) {
            loop = new WeldBarLoop(m.canvas, ctx, raf, caf,
                () => scope.postMessage({ t: 'arrived' }), m.reduced);
        }
        return;
    }
    if (!loop) {
        return;
    }
    switch (m.t) {
        case 'geom':
            loop.setGeometry(m.geom);
            break;
        case 'reset':
            loop.reset();
            break;
        case 'target':
            loop.setTarget(m.percent);
            break;
        case 'run':
            loop.run(m.on);
            break;
    }
};
