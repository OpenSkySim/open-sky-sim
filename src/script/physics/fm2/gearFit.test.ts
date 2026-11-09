import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultFm2Config } from './fm2AircraftConfig';
import { fitGearPoints } from './gearFit';

/** An axis-aligned box as a triangle soup (12 triangles). */
function box(cx: number, cy: number, cz: number, hx: number, hy: number, hz: number): number[] {
    const v = (sx: number, sy: number, sz: number) => [cx + sx * hx, cy + sy * hy, cz + sz * hz];
    const quads = [
        [v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1)],
        [v(-1, 1, -1), v(1, 1, -1), v(1, 1, 1), v(-1, 1, 1)],
        [v(-1, -1, -1), v(-1, 1, -1), v(-1, 1, 1), v(-1, -1, 1)],
        [v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1)],
        [v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1)],
        [v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)],
    ];
    return quads.flatMap(([a, b, c, d]) => [...a, ...b, ...c, ...a, ...c, ...d]);
}

/** A wheel (tyre box) with its strut rising into the bay above. */
const leg = (x: number, z: number, bottom = -2) => [
    ...box(x, bottom + 0.3, z, 0.12, 0.3, 0.3),
    ...box(x, bottom + 1.0, z, 0.05, 0.5, 0.05),
];

const gear = defaultFm2Config.gear;
const near = (a: number[], b: number[]) => a.every((c, i) => Math.abs(c - b[i]) < 0.05);

describe('landing gear fitted to the drawn wheels', () => {
    it('reads an Su-33-like layout: wide mains well aft, a nose leg standing a little higher', () => {
        const soup = [...leg(0, 2.0, -1.9), ...leg(-1.9, -3.4), ...leg(1.9, -3.4),
            // A gear door hanging beside the left main: not a wheel.
            ...box(-1.2, -1.2, -3.4, 0.02, 0.3, 0.6)];
        const points = fitGearPoints(soup, gear)!;
        assert.equal(points.length, 3);
        const y = gear.points[0][1];
        assert.ok(near(points[0], [0, y, 2.0]), JSON.stringify(points));
        assert.ok(near(points[1], [-1.9, y, -3.4]), JSON.stringify(points));
        assert.ok(near(points[2], [1.9, y, -3.4]), JSON.stringify(points));
    });

    it('takes twin nose wheels as one leg and averages lopsided mains', () => {
        const soup = [...leg(-0.25, 3.0), ...leg(0.25, 3.0), ...leg(-1.5, -2.3), ...leg(1.6, -2.4)];
        const points = fitGearPoints(soup, gear)!;
        assert.equal(points.length, 3, JSON.stringify(points));
        assert.ok(near(points[0], [0, -2, 3.0]), JSON.stringify(points));
        assert.ok(near(points[1], [-1.55, -2, -2.35]) && near(points[2], [1.55, -2, -2.35]), JSON.stringify(points));
    });

    it('keeps the default legs for a layout it cannot read', () => {
        // Bicycle: two centreline legs, no mains to either side.
        assert.equal(fitGearPoints([...leg(0, 4), ...leg(0, -1)], gear), undefined);
        // Mains only: no nose or tail wheel to stand on.
        assert.equal(fitGearPoints([...leg(-2, -2), ...leg(2, -2)], gear), undefined);
        assert.equal(fitGearPoints([], gear), undefined);
    });
});
