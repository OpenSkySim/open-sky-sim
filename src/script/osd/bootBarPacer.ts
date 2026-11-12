/** The boot bar's pacing, free of the DOM: it runs in the weld worker too (see weldBar.ts). */

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
    /** The last sweep to 100: from where, at what speed, when, for how long. */
    private finish: { from: number; speed: number; at: number; s: number } | undefined;
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
        this.finish = undefined;
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
            // Done: glide the rest of the way, picking up from the current
            // pace and slowing into 100, rather than jumping there.
            if (!this.finish) {
                const left = 100 - this.shown;
                this.finish = {
                    from: this.shown,
                    speed: Math.max(0, this.speed),
                    at: now,
                    s: Math.min(BAR_FINISH_MAX_S, Math.max(BAR_FINISH_MIN_S, left / BAR_FINISH_RATE)),
                };
            }
            const f = this.finish;
            const u = Math.min(1, (now - f.at) / 1000 / f.s);
            // Cubic Hermite: starts at the bar's speed, arrives at rest.
            const left = 100 - f.from;
            const startSlope = Math.min(f.speed * f.s, 2 * left);
            const eased = f.from + (-2 * u ** 3 + 3 * u ** 2) * left + (u ** 3 - 2 * u ** 2 + u) * startSlope;
            this.shown = u >= 1 ? 100 : Math.min(100, Math.max(this.shown, eased));
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
/** The last sweep to 100 once the load is done: percent per second, within bounds in seconds. */
const BAR_FINISH_RATE = 50;
const BAR_FINISH_MIN_S = 0.5;
const BAR_FINISH_MAX_S = 1.2;
