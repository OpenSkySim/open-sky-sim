import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BootBarPacer } from './bootProgress';

/** Run a pacer over a schedule of [ms, target] steps, sampling every 50 ms. */
function run(steps: Array<[number, number]>, endMs: number): number[] {
    const pacer = new BootBarPacer();
    pacer.reset(0);
    const shown: number[] = [];
    let next = 0;
    for (let t = 0; t <= endMs; t += 50) {
        while (next < steps.length && steps[next][0] <= t) {
            pacer.setTarget(steps[next][1]);
            next++;
        }
        shown.push(pacer.tick(t));
    }
    return shown;
}

/** Percent per second over each one-second window. */
function ratesPerSecond(shown: number[]): number[] {
    const out: number[] = [];
    for (let i = 20; i < shown.length; i += 20) {
        out.push(shown[i] - shown[i - 20]);
    }
    return out;
}

describe('BootBarPacer', () => {
    // A first launch as measured on a Pages-like link: boot steps that tick
    // in bursts, stall on the airfields and then jump, filling 0..40 % over
    // 13 s; then the streaming hold, which runs on time to its 20 s cap.
    const boot: Array<[number, number]> = [
        [0, 1], [500, 3], [800, 4],
        [2400, 10], [2600, 12], [5100, 18], [5300, 20], [7700, 25],
        // airfields: nothing for 1.3 s
        [9000, 28], [9400, 30],
        [10400, 34], [12800, 39], [13000, 39.6],
    ];
    const stream: Array<[number, number]> = [];
    for (let t = 13100; t <= 33000; t += 100) {
        stream.push([t, 39.6 + 60.4 * (t - 13000) / 20000 * 0.999]);
    }
    const launch = [...boot, ...stream];

    it('never goes backwards and waits short of 100 until done', () => {
        const shown = run(launch, 33000);
        for (let i = 1; i < shown.length; i++) {
            assert.ok(shown[i] >= shown[i - 1], `went back at ${i * 50} ms`);
        }
        assert.ok(shown[shown.length - 1] < 100);
    });

    it('moves every second, and evenly, through bursts, stalls and the hold', () => {
        const rates = ratesPerSecond(run(launch, 32000)).slice(1);
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        assert.ok(min > 1.5, `a second with only ${min.toFixed(1)} % of progress`);
        // Following the raw targets, the boot's fastest second is 3 % and
        // the stall's 0 %: the pacer keeps every second within 2x.
        assert.ok(max / min < 2, `uneven: ${rates.map(r => r.toFixed(1)).join(' ')}`);
    });

    it('finishes quickly once the target reaches 100', () => {
        const pacer = new BootBarPacer();
        pacer.reset(0);
        pacer.setTarget(60);
        for (let t = 0; t <= 3000; t += 50) {
            pacer.tick(t);
        }
        pacer.setTarget(100);
        let t = 3000;
        while (pacer.shown < 100 && t < 4000) {
            t += 50;
            pacer.tick(t);
        }
        assert.equal(pacer.shown, 100);
        assert.ok(t - 3000 <= 800, `took ${t - 3000} ms`);
    });

    it('ignores a lower target reported late', () => {
        const pacer = new BootBarPacer();
        pacer.setTarget(50);
        pacer.setTarget(20);
        assert.equal(pacer.targetPercent, 50);
    });
});
