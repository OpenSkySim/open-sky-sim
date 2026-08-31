import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    DETAIL_DISTANCE_OFF, DETAIL_SCALE_MAX, DETAIL_SCALE_MIN,
    TARGET_FRAME_MS, TERRAIN_DETAIL_DISTANCE_DEFAULT_M, TERRAIN_DETAIL_DISTANCE_MAX_M,
    TERRAIN_DETAIL_DISTANCE_MIN_M, adjustDetailScale, clampDetailDistanceM, detailFalloff,
} from './lod';

/** Reconciles needed to get from `from` to `to` at a steady frame time. */
function settleSteps(from: number, frameMs: number, stop: (v: number) => boolean): number {
    let v = from;
    for (let i = 1; i <= 1000; i++) {
        v = adjustDetailScale(v, frameMs);
        if (stop(v)) {
            return i;
        }
    }
    return Infinity;
}

describe('detail governor', () => {
    it('backs off when frames run long', () => {
        const next = adjustDetailScale(1, TARGET_FRAME_MS * 1.5);
        assert.ok(next > 1, 'a slow frame must degrade detail');
    });

    it('recovers when frames run fast', () => {
        const next = adjustDetailScale(4, TARGET_FRAME_MS * 0.5);
        assert.ok(next < 4, 'a fast frame must restore detail');
    });

    it('holds steady inside the dead band, so it cannot hunt', () => {
        const v = adjustDetailScale(2, TARGET_FRAME_MS);
        assert.equal(v, 2, 'on-target frames must not move the governor');
    });

    it('clamps to the configured range', () => {
        assert.equal(adjustDetailScale(DETAIL_SCALE_MAX, TARGET_FRAME_MS * 10), DETAIL_SCALE_MAX);
        assert.equal(adjustDetailScale(DETAIL_SCALE_MIN, TARGET_FRAME_MS * 0.1), DETAIL_SCALE_MIN);
    });

    /**
     * The regression: the ceiling was 24 and recovery was -1.5% only below
     * 0.82x target, so a transient spike degraded terrain for over twenty
     * seconds of good frames. At ~10 reconciles/second that is the difference
     * between an unnoticed hitch and terrain visibly re-refining as you fly.
     */
    it('unwinds a worst-case backoff in a couple of seconds of good frames', () => {
        const steps = settleSteps(DETAIL_SCALE_MAX, TARGET_FRAME_MS * 0.5,
            v => v <= DETAIL_SCALE_MIN);
        // Reconciles run every RECONCILE_INTERVAL_MS (100 ms).
        assert.ok(steps <= 40, `worst-case recovery took ${steps} reconciles (~${steps / 10}s)`);
    });

    it('does not let the governor coarsen terrain without bound', () => {
        // 24 made the SSE target 48 px, which is LOD switched off rather than
        // degraded. Keep the ceiling somewhere a human would still call terrain.
        assert.ok(DETAIL_SCALE_MAX <= 8, `ceiling ${DETAIL_SCALE_MAX} is too permissive`);
    });

    it('still degrades faster than it recovers', () => {
        // Protecting frame rate is more urgent than restoring detail.
        const up = adjustDetailScale(2, TARGET_FRAME_MS * 2) / 2;
        const down = 2 / adjustDetailScale(2, TARGET_FRAME_MS * 0.1);
        assert.ok(up > down, 'climb must outpace decay');
    });
});

describe('far-field detail falloff', () => {
    it('is neutral inside the knee', () => {
        assert.equal(detailFalloff(0, 12_000), 1);
        assert.equal(detailFalloff(6_000, 12_000), 1);
        assert.equal(detailFalloff(12_000, 12_000), 1);
    });

    it('grows in proportion to distance outside it', () => {
        // The error budget grows with distance, so the allowed *error* goes as
        // d squared and every doubling past the knee drops one more level.
        assert.equal(detailFalloff(24_000, 12_000), 2);
        assert.equal(detailFalloff(48_000, 12_000), 4);
    });

    it('is off when the knee is off', () => {
        assert.equal(detailFalloff(500_000, DETAIL_DISTANCE_OFF), 1);
        // A nonsensical knee must not divide by zero into the LOD.
        assert.equal(detailFalloff(500_000, 0), 1);
        assert.equal(detailFalloff(500_000, -1), 1);
    });

    it('clamps a persisted value onto the slider', () => {
        assert.equal(clampDetailDistanceM(TERRAIN_DETAIL_DISTANCE_DEFAULT_M),
            TERRAIN_DETAIL_DISTANCE_DEFAULT_M);
        // Below the bottom of the slider, which would coarsen the near field.
        assert.equal(clampDetailDistanceM(10), TERRAIN_DETAIL_DISTANCE_MIN_M);
        // At and past the top, the setting is off rather than merely far, so
        // "off" compares equal however it was persisted.
        assert.equal(clampDetailDistanceM(TERRAIN_DETAIL_DISTANCE_MAX_M), DETAIL_DISTANCE_OFF);
        assert.equal(clampDetailDistanceM(1e9), DETAIL_DISTANCE_OFF);
        assert.equal(clampDetailDistanceM(NaN), DETAIL_DISTANCE_OFF);
    });
});
