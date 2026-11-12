/**
 * The boot bar as a weld seam: an arc glow at the bar's tip and sparks
 * thrown off it, on #boot-progress-sparks over the bottom strip. The bead
 * and its heat tint are plain CSS on #boot-progress-fill (see index.html).
 */

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
/** A frame gap longer than this (a stalled main thread) is not simulated in one step. */
const MAX_STEP_S = 0.05;

const sparks: Spark[] = [];
let frame: number | undefined;
let lastMs = 0;
let owed = 0;
let arcOn = false;

/** Start the glow and sparks; idempotent. */
export function startWeldSparks(): void {
    arcOn = true;
    if (frame === undefined) {
        lastMs = performance.now();
        frame = requestAnimationFrame(drawWeld);
    }
}

/** Stop at once and clear the canvas (the overlay is gone). */
export function stopWeldSparks(): void {
    arcOn = false;
    sparks.length = 0;
    if (frame !== undefined) {
        cancelAnimationFrame(frame);
        frame = undefined;
    }
    const canvas = document.getElementById('boot-progress-sparks') as HTMLCanvasElement | null;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

function drawWeld(now: number): void {
    frame = undefined;
    const canvas = document.getElementById('boot-progress-sparks') as HTMLCanvasElement | null;
    const fill = document.getElementById('boot-progress-fill');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !fill || !ctx) {
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    const box = canvas.getBoundingClientRect();
    const w = Math.round(box.width * dpr);
    const h = Math.round(box.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    const dt = Math.min(MAX_STEP_S, Math.max(0, (now - lastMs) / 1000));
    lastMs = now;

    // The arc sits on the bead's leading edge, in the track's middle.
    const tip = fill.getBoundingClientRect();
    const tipX = tip.right - box.left;
    const tipY = tip.top + tip.height / 2 - box.top;
    const floorY = tip.bottom - box.top + 1;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (arcOn && !reduced) {
        owed += SPARK_RATE_PER_S * dt * (0.4 + 1.2 * Math.random());
        while (owed >= 1 && sparks.length < SPARK_MAX) {
            owed -= 1;
            sparks.push(newSpark(tipX, tipY));
        }
    }
    for (const s of sparks) {
        s.age += dt;
        s.vy += SPARK_GRAVITY * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Skip off the plate below the seam rather than fall through it.
        if (s.y > floorY && s.vy > 0) {
            s.y = floorY;
            s.vy *= -0.35;
            s.vx *= 0.6;
        }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
        if (sparks[i].age >= sparks[i].life) {
            sparks.splice(i, 1);
        }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    ctx.globalCompositeOperation = 'lighter';
    if (arcOn) {
        drawArc(ctx, tipX, tipY, reduced);
    }
    ctx.lineCap = 'round';
    for (const s of sparks) {
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

    if (arcOn || sparks.length > 0) {
        frame = requestAnimationFrame(drawWeld);
    } else {
        ctx.clearRect(0, 0, box.width, box.height);
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

/** The weld pool's glare: white core, orange bloom, flickering. */
function drawArc(ctx: CanvasRenderingContext2D, x: number, y: number, steady: boolean): void {
    const flicker = steady ? 1 : 0.75 + 0.5 * Math.random();
    const r = 26 * flicker;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.12, 'rgba(255,246,214,0.95)');
    g.addColorStop(0.35, 'rgba(255,170,60,0.45)');
    g.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // The arc's own blue-white light, tighter than the pool.
    const c = ctx.createRadialGradient(x, y, 0, x, y, 9 * flicker);
    c.addColorStop(0, 'rgba(225,235,255,0.9)');
    c.addColorStop(1, 'rgba(160,190,255,0)');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, 9 * flicker, 0, Math.PI * 2);
    ctx.fill();
}
