import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clipWaterToBoxes } from './fillWaterClip';

/** x is longitude, z is minus latitude, both in hundredths of a degree. */
const toLonLat = (x: number, _y: number, z: number): [number, number] => [x / 100, -z / 100];

function area(c: ReturnType<typeof clipWaterToBoxes>, positions: ArrayLike<number>, index: ArrayLike<number>): number {
    const p = c?.positions ?? positions;
    const ix = c?.index ?? index;
    let sum = 0;
    for (let t = 0; t < ix.length; t += 3) {
        const [a, b, d] = [ix[t], ix[t + 1], ix[t + 2]];
        sum += ((p[3 * b] - p[3 * a]) * (p[3 * d + 2] - p[3 * a + 2])
            - (p[3 * d] - p[3 * a]) * (p[3 * b + 2] - p[3 * a + 2])) / 2;
    }
    return sum;
}

describe('clipWaterToBoxes', () => {
    it('leaves water wholly inside alone', () => {
        const pos = [0, 0, 0, 100, 0, 0, 0, 0, -100];
        assert.equal(clipWaterToBoxes(pos, [1, 1, 1], [0, 1, 2], toLonLat,
            [{ west: -1, east: 2, south: -1, north: 2 }]), undefined);
    });

    it('keeps the part inside of a big triangle whose centroid is outside', () => {
        // The Mallorca case: a sliver of the triangle is outside, but its
        // centroid with it; dropping it whole took the sea inside along.
        const pos = [0, 0, 0, 1000, 0, 0, 0, 0, -1000];
        const c = clipWaterToBoxes(pos, [3, 3, 3], [0, 1, 2], toLonLat,
            [{ west: 0, east: 2, south: 0, north: 2 }]);
        assert.ok(c);
        // Inside: the triangle cut at lon 2 and lat 2 -> the 2x2 box's
        // part of the triangle x + y <= 10, which is the whole box (in
        // hundredths: 200 x 200).
        assert.equal(Math.round(Math.abs(area(c, pos, [0, 1, 2]))), 40000);
        assert.ok([...c.tones].every(t => t === 3));
        for (let v = 0; v < c.positions.length / 3; v++) {
            const [lon, lat] = toLonLat(c.positions[3 * v], 0, c.positions[3 * v + 2]);
            if (c.index.includes(v)) {
                assert.ok(lon >= 0 && lon <= 2 && lat >= 0 && lat <= 2, `vertex ${v} at ${lon},${lat}`);
            }
        }
    });

    it('drops water wholly outside, and keeps the winding', () => {
        const pos = [0, 0, 0, 400, 0, 0, 0, 0, -400, 1000, 0, -1000, 1100, 0, -1000, 1000, 0, -1100];
        const index = [0, 1, 2, 3, 4, 5];
        const c = clipWaterToBoxes(pos, [1, 1, 1, 1, 1, 1], index, toLonLat,
            [{ west: 1, east: 3, south: 1, north: 3 }]);
        assert.ok(c);
        const whole = area(undefined, pos, [0, 1, 2]);
        const cut = area(c, pos, index);
        assert.equal(Math.sign(cut), Math.sign(whole));
        // x + y <= 4 inside [1,3]^2: the box minus the corner triangle past
        // x + y = 4, in hundredths.
        assert.equal(Math.round(Math.abs(cut)), 40000 - 20000);
    });
});
