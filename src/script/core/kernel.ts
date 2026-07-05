import { assertExpr } from "../utils/asserts";

export interface KernelUpdateTask {
    // delta - Time elapsed for the previous frame, measured in seconds.
    update(delta: number): void;
}

export interface KernelRenderTask {
    render(): void;
}

/** @deprecated Use KernelUpdateTask or KernelRenderTask. */
export type KernelTask = KernelUpdateTask;

// 60fps, measured in ms
const DEFAULT_FRAME_DURATION: number = 1000.0 / 60.0;

export class Kernel {
    private runTasksFn = () => { this.runTasks() };

    private updateTasks: KernelUpdateTask[] = [];
    private renderTasks: KernelRenderTask[] = [];

    private prevTime: number = performance.now();

    private targetFPSLength: number = 0.0;
    private targetFPSprogress: number = 0.0;

    constructor(private targetFPS?: number) {
        this.setTargetFPS(targetFPS);
    }

    addUpdateTask(task: KernelUpdateTask) {
        this.updateTasks.push(task);
    }

    addRenderTask(task: KernelRenderTask) {
        this.renderTasks.push(task);
    }

    /** @deprecated Use addUpdateTask. */
    addTask(task: KernelUpdateTask) {
        this.addUpdateTask(task);
    }

    setTargetFPS(targetFPS?: number) {
        if (targetFPS) {
            this.targetFPSLength = 1.0 / targetFPS * 1000.0;
        } else {
            this.targetFPSLength = 0.0;
        }
        this.targetFPS = targetFPS;
        this.targetFPSprogress = 0.0;
    }

    start() {
        assertExpr(this.updateTasks.length > 0, 'No KernelUpdateTasks registered!');
        assertExpr(this.renderTasks.length > 0, 'No KernelRenderTasks registered!');
        window.requestAnimationFrame(this.runTasksFn);
        this.prevTime = performance.now() - DEFAULT_FRAME_DURATION;
    }

    private runTasks() {
        const deltaMs = this.updateDeltas();
        window.requestAnimationFrame(this.runTasksFn);

        if (this.targetFPS) {
            this.targetFPSprogress += deltaMs;
            if (this.targetFPSprogress >= this.targetFPSLength) {
                // This might cause frame skips when deltaMs > targetFPSLength
                do {
                    this.targetFPSprogress -= this.targetFPSLength;
                } while (this.targetFPSprogress >= this.targetFPSLength);

                const delta = this.targetFPSLength / 1000.0;
                this.runUpdates(delta);
            }
            this.runRenders();
            return;
        }

        const delta = deltaMs / 1000.0;
        this.runUpdates(delta);
        this.runRenders();
    }

    private runUpdates(delta: number) {
        for (let i = 0; i < this.updateTasks.length; i++) {
            this.updateTasks[i].update(delta);
        }
    }

    private runRenders() {
        for (let i = 0; i < this.renderTasks.length; i++) {
            this.renderTasks[i].render();
        }
    }

    private updateDeltas(): number {
        const now = performance.now();
        const deltaMs = now - this.prevTime;
        this.prevTime = now;
        return deltaMs;
    }
}
