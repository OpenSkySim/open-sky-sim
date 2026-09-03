import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    MapView, fitTo, nearestLegSegment, nearestPlaced, panBy, screenToWorld,
    worldToScreen, zoomAbout,
} from './mapProjection';

function view(over: Partial<MapView> = {}): MapView {
    return { centreX: 0, centreZ: 0, mPerPx: 100, widthPx: 800, heightPx: 600, ...over };
}

describe('worldToScreen / screenToWorld', () => {
    it('puts the view centre at the centre of the canvas', () => {
        const v = view({ centreX: 1234, centreZ: -5678 });
        const p = worldToScreen(v, 1234, -5678);
        assert.equal(p.x, 400);
        assert.equal(p.y, 300);
    });

    it('draws north UP, which is the assertion a z-flip breaks', () => {
        // Scene z runs south, screen y runs down: they already agree, so a
        // point north of centre must land ABOVE it — a smaller y.
        const v = view();
        const north = worldToScreen(v, 0, -10000);
        assert.ok(north.y < 300, `north landed below centre (y = ${north.y})`);
        const east = worldToScreen(v, 10000, 0);
        assert.ok(east.x > 400, `east landed left of centre (x = ${east.x})`);
    });

    it('round-trips to under a hundredth of a pixel at every zoom', () => {
        for (const mPerPx of [5, 100, 4000]) {
            const v = view({ mPerPx, centreX: -3000, centreZ: 7000 });
            for (const [sx, sy] of [[0, 0], [400, 300], [799, 599], [123, 456]]) {
                const w = screenToWorld(v, sx, sy);
                const back = worldToScreen(v, w.x, w.z);
                assert.ok(Math.hypot(back.x - sx, back.y - sy) < 0.01,
                    `${mPerPx} m/px: (${sx},${sy}) -> (${back.x},${back.y})`);
            }
        }
    });
});

describe('panBy', () => {
    it('moves the world with the cursor, not against it', () => {
        // Dragging right must bring terrain to the right into view, which means
        // the centre moves LEFT in world space.
        const v = panBy(view(), 100, 0);
        assert.equal(v.centreX, -10000);
    });

    it('keeps a dragged world point under the cursor', () => {
        const v0 = view();
        const before = screenToWorld(v0, 400, 300);
        const v1 = panBy(v0, 50, -25);
        const after = screenToWorld(v1, 450, 275);
        assert.ok(Math.abs(after.x - before.x) < 1e-9);
        assert.ok(Math.abs(after.z - before.z) < 1e-9);
    });
});

describe('zoomAbout', () => {
    it('keeps the world point under the cursor fixed', () => {
        const v0 = view();
        const anchor = screenToWorld(v0, 620, 140);
        const v1 = zoomAbout(v0, 620, 140, 0.5);
        const after = screenToWorld(v1, 620, 140);
        assert.ok(Math.abs(after.x - anchor.x) < 1e-6, `x drifted to ${after.x}`);
        assert.ok(Math.abs(after.z - anchor.z) < 1e-6, `z drifted to ${after.z}`);
    });

    it('clamps the scale at both ends', () => {
        const tiny = zoomAbout(view({ mPerPx: 6 }), 400, 300, 0.1, 5, 4000);
        assert.equal(tiny.mPerPx, 5);
        const huge = zoomAbout(view({ mPerPx: 3000 }), 400, 300, 10, 5, 4000);
        assert.equal(huge.mPerPx, 4000);
    });

    it('holds the anchor even when the zoom is clamped', () => {
        const v0 = view({ mPerPx: 6 });
        const anchor = screenToWorld(v0, 100, 500);
        const v1 = zoomAbout(v0, 100, 500, 0.1, 5, 4000);
        const after = screenToWorld(v1, 100, 500);
        assert.ok(Math.hypot(after.x - anchor.x, after.z - anchor.z) < 1e-6);
    });
});

describe('fitTo', () => {
    it('frames a set of points with both extremes on screen', () => {
        const pts = [{ x: -5000, z: -5000 }, { x: 5000, z: 5000 }, { x: 0, z: 1000 }];
        const v = fitTo(view(), pts, 40);
        for (const p of pts) {
            const s = worldToScreen(v, p.x, p.z);
            assert.ok(s.x >= 0 && s.x <= v.widthPx, `x off screen: ${s.x}`);
            assert.ok(s.y >= 0 && s.y <= v.heightPx, `y off screen: ${s.y}`);
        }
    });

    it('centres a single point without zooming to infinity', () => {
        const v = fitTo(view(), [{ x: 700, z: -300 }]);
        assert.equal(v.centreX, 700);
        assert.equal(v.centreZ, -300);
        assert.equal(v.mPerPx, 100);
    });

    it('leaves the view alone when there is nothing to fit', () => {
        assert.deepEqual(fitTo(view(), []), view());
    });
});

describe('nearestPlaced', () => {
    const legs = [{ x: 0, z: 0 }, { x: 2000, z: 0 }, { x: 0, z: 2000 }];

    it('finds a handle under the cursor', () => {
        const v = view();
        const s = worldToScreen(v, 2000, 0);
        assert.equal(nearestPlaced(v, legs, s.x, s.y), 1);
    });

    it('returns undefined outside the grab radius', () => {
        const v = view();
        const s = worldToScreen(v, 2000, 0);
        assert.equal(nearestPlaced(v, legs, s.x + 40, s.y, 10), undefined);
    });

    it('picks the nearer of two overlapping handles', () => {
        const v = view({ mPerPx: 10 });
        const pair = [{ x: 0, z: 0 }, { x: 60, z: 0 }];
        const near = worldToScreen(v, 60, 0);
        assert.equal(nearestPlaced(v, pair, near.x, near.y, 20), 1);
        const far = worldToScreen(v, 0, 0);
        assert.equal(nearestPlaced(v, pair, far.x, far.y, 20), 0);
    });

    it('uses a screen radius, so the grab feels the same at any zoom', () => {
        const legsOne = [{ x: 0, z: 0 }];
        for (const mPerPx of [5, 100, 4000]) {
            const v = view({ mPerPx });
            // 9 px away in screen space, whatever that is in metres.
            assert.equal(nearestPlaced(v, legsOne, 409, 300, 10), 0, `${mPerPx} m/px`);
            assert.equal(nearestPlaced(v, legsOne, 412, 300, 10), undefined, `${mPerPx} m/px`);
        }
    });
});

describe('nearestLegSegment', () => {
    const legs = [{ x: 0, z: 0 }, { x: 10000, z: 0 }, { x: 10000, z: 10000 }];

    it('hits the line between two fixes and reports the leg before it', () => {
        const v = view();
        const mid = worldToScreen(v, 5000, 0);
        assert.equal(nearestLegSegment(v, legs, mid.x, mid.y), 0);
        const mid2 = worldToScreen(v, 10000, 5000);
        assert.equal(nearestLegSegment(v, legs, mid2.x, mid2.y), 1);
    });

    it('misses a point beside the line', () => {
        const v = view();
        const mid = worldToScreen(v, 5000, 0);
        assert.equal(nearestLegSegment(v, legs, mid.x, mid.y + 30, 8), undefined);
    });

    it('misses a point beyond the end of the line, not just off to one side', () => {
        // The projection has to be clamped to the segment: unclamped, a click
        // far past the last fix but exactly in line would insert a leg there.
        const v = view();
        const beyond = worldToScreen(v, -20000, 0);
        assert.equal(nearestLegSegment(v, legs, beyond.x, beyond.y, 8), undefined);
    });

    it('closes the loop only when the route loops', () => {
        const v = view();
        // Between the last fix and the first: only a looping route has that leg.
        const closing = worldToScreen(v, 5000, 5000);
        assert.equal(nearestLegSegment(v, legs, closing.x, closing.y, 8, false), undefined);
        assert.equal(nearestLegSegment(v, legs, closing.x, closing.y, 8, true), 2);
    });

    it('has nothing to hit with fewer than two fixes', () => {
        const v = view();
        assert.equal(nearestLegSegment(v, [], 400, 300), undefined);
        assert.equal(nearestLegSegment(v, [{ x: 0, z: 0 }], 400, 300), undefined);
    });
});
