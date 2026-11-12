/**
 * The boot bar as a weld seam, drawn whole on #boot-progress-sparks: the
 * track, a rippled bead with heat tint behind the tip, the arc's glare and
 * the sparks it throws. It is paced and drawn by a WeldBarLoop, normally in
 * a worker on an OffscreenCanvas (weldBarWorker.ts), so it keeps moving at
 * the display's rate while the main thread builds the scene or draws the
 * view under it; without OffscreenCanvas the same loop runs on the page.
 */

import { BootBarPacer } from './bootBarPacer';

/** Where the track sits in the canvas, in CSS px, and the canvas size. */
export interface WeldGeometry {
    width: number;
    height: number;
    dpr: number;
    track: { x: number; y: number; w: number; h: number };
}

/** Main thread to worker. */
export type WeldMessage =
    | { t: 'init'; canvas: OffscreenCanvas; reduced: boolean }
    | { t: 'geom'; geom: WeldGeometry }
    | { t: 'reset' }
    | { t: 'target'; percent: number }
    | { t: 'run'; on: boolean };

/** Worker to main thread: the drawn bar reached 100. */
export interface WeldReply {
    t: 'arrived';
}

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    age: number;
    life: number;
}

/** Sparks per second while the arc burns. */
const SPARK_RATE_PER_S = 140;
/** Pull on a spark, CSS px/s². */
const SPARK_GRAVITY = 700;
const SPARK_MAX = 400;
/** A frame gap longer than this is not simulated in one step. */
const MAX_STEP_S = 0.05;
/** Length of the heat tint behind the tip, CSS px. */
const HEAT_PX = 96;
/** Ripple period of the bead, CSS px. */
const RIPPLE_PX = 5;

/** Paces the bar and draws it, one frame per display frame, wherever it runs. */
export class WeldBarLoop {
    readonly pacer = new BootBarPacer();
    private geom: WeldGeometry | undefined;
    private readonly sparks: Spark[] = [];
    private owed = 0;
    private lastMs: number | undefined;
    private running = false;
    private frameId: number | undefined;
    private arrived = false;

    constructor(
        private readonly canvas: HTMLCanvasElement | OffscreenCanvas,
        private readonly ctx: Ctx2D,
        private readonly raf: (cb: (now: number) => void) => number,
        private readonly caf: (id: number) => void,
        private readonly onArrived: () => void,
        private readonly reduced: boolean,
    ) {}

    setGeometry(geom: WeldGeometry): void {
        this.geom = geom;
        const w = Math.max(1, Math.round(geom.width * geom.dpr));
        const h = Math.max(1, Math.round(geom.height * geom.dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    reset(): void {
        this.pacer.reset(performance.now());
        this.arrived = false;
    }

    setTarget(percent: number): void {
        this.pacer.setTarget(percent);
    }

    run(on: boolean): void {
        if (on === this.running) {
            return;
        }
        this.running = on;
        if (on) {
            this.lastMs = undefined;
            this.frameId = this.raf(this.frame);
            return;
        }
        if (this.frameId !== undefined) {
            this.caf(this.frameId);
            this.frameId = undefined;
        }
        this.sparks.length = 0;
        this.owed = 0;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private readonly frame = (now: number): void => {
        this.frameId = undefined;
        if (!this.running) {
            return;
        }
        const shown = this.pacer.tick(performance.now());
        if (shown >= 100 && !this.arrived) {
            this.arrived = true;
            this.onArrived();
        }
        this.draw(now, shown);
        this.frameId = this.raf(this.frame);
    };

    private draw(now: number, percent: number): void {
        const g = this.geom;
        if (!g) {
            return;
        }
        const ctx = this.ctx;
        const dt = Math.min(MAX_STEP_S, Math.max(0, (now - (this.lastMs ?? now)) / 1000));
        this.lastMs = now;
        const { x, y, w, h } = g.track;
        const tipX = x + w * percent / 100;
        const tipY = y + h / 2;
        const floorY = y + h + 1;

        ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
        ctx.clearRect(0, 0, g.width, g.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // The plate: a dark groove with a light rim.
        ctx.fillStyle = '#161718';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);

        // The bead: steel ripples, a highlight along the top, shadow beneath.
        const beadW = tipX - x;
        if (beadW > 0) {
            ctx.fillStyle = '#5f646d';
            ctx.fillRect(x, y, beadW, h);
            ctx.fillStyle = '#8d929b';
            for (let rx = x; rx < tipX; rx += RIPPLE_PX) {
                ctx.fillRect(rx, y, Math.min(2, tipX - rx), h);
            }
            ctx.fillStyle = '#c9ccd2';
            ctx.fillRect(x, y, beadW, 1);
            ctx.fillStyle = '#2a2c30';
            ctx.fillRect(x, y + h - 1, beadW, 1);
            // Heat tint: temper blue, straw, then glowing orange into the pool.
            const from = Math.max(x, tipX - HEAT_PX);
            const tint = ctx.createLinearGradient(tipX - HEAT_PX, 0, tipX, 0);
            tint.addColorStop(0, 'rgba(61,95,168,0)');
            tint.addColorStop(0.2, 'rgba(61,95,168,0.4)');
            tint.addColorStop(0.45, 'rgba(192,138,48,0.6)');
            tint.addColorStop(0.78, 'rgba(255,90,0,1)');
            tint.addColorStop(1, 'rgba(255,244,204,1)');
            ctx.fillStyle = tint;
            ctx.fillRect(from, y, tipX - from, h);
        }

        // Sparks: thrown off the pool, falling, skipping off the plate.
        if (!this.reduced) {
            this.owed += SPARK_RATE_PER_S * dt * (0.4 + 1.2 * Math.random());
            while (this.owed >= 1 && this.sparks.length < SPARK_MAX) {
                this.owed -= 1;
                this.sparks.push(newSpark(tipX, tipY));
            }
        }
        for (const s of this.sparks) {
            s.age += dt;
            s.vy += SPARK_GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.y > floorY && s.vy > 0) {
                s.y = floorY;
                s.vy *= -0.35;
                s.vx *= 0.6;
            }
        }
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            if (this.sparks[i].age >= this.sparks[i].life) {
                this.sparks.splice(i, 1);
            }
        }

        ctx.globalCompositeOperation = 'lighter';
        drawArc(ctx, tipX, tipY, this.reduced);
        ctx.lineCap = 'round';
        for (const s of this.sparks) {
            const t = s.age / s.life;
            ctx.strokeStyle = sparkColour(t);
            ctx.globalAlpha = 1 - t * t;
            ctx.lineWidth = 2.2 - 1.4 * t;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            // A streak along the path: the eye's persistence of a hot speck.
            ctx.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
}

function newSpark(x: number, y: number): Spark {
    // Mostly up and out of the pool, some back along the seam, a few far.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const speed = 80 + Math.random() * Math.random() * 380;
    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: 0.2 + Math.random() * 0.7,
    };
}

function sparkColour(t: number): string {
    if (t < 0.15) return '#fffbea';
    if (t < 0.45) return '#ffd66b';
    if (t < 0.75) return '#ff8c2a';
    return '#d2461c';
}

/**
 * The arc: a white-hot core in a blue-white glare that flickers hard frame
 * to frame, with now and then a flash; under it, a small orange glow from
 * the molten pool.
 */
function drawArc(ctx: Ctx2D, x: number, y: number, steady: boolean): void {
    const flash = !steady && Math.random() < 0.06;
    const flicker = steady ? 1 : flash ? 1.5 + 0.4 * Math.random() : 0.55 + 0.6 * Math.random();
    // The pool, steadier than the arc above it.
    const pr = 13;
    const pool = ctx.createRadialGradient(x, y, 0, x, y, pr);
    pool.addColorStop(0, 'rgba(255,190,90,0.55)');
    pool.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.fill();
    // Blue-white glare.
    const r = 34 * flicker;
    const glare = ctx.createRadialGradient(x, y, 0, x, y, r);
    glare.addColorStop(0, 'rgba(255,255,255,1)');
    glare.addColorStop(0.1, 'rgba(235,244,255,0.95)');
    glare.addColorStop(0.3, 'rgba(150,195,255,0.5)');
    glare.addColorStop(0.6, 'rgba(90,140,255,0.15)');
    glare.addColorStop(1, 'rgba(70,120,255,0)');
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // White-hot core.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + 1.5 * flicker, 0, Math.PI * 2);
    ctx.fill();
}
