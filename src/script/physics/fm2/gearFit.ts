/**
 * Landing-gear contact points fitted to an aircraft's drawn wheels.
 *
 * Every type used to roll on the default F-16-like legs (mains ±1.2 m, nose
 * 2.6 m ahead), whatever its drawn gear: an Su-33's wheels are 3.8 m apart and
 * its mains 3.4 m back, so the drawn wheels sank into the deck at touchdown
 * while the physics rocked on legs half the width. This reads the legs off the
 * gear model instead: the lowest vertices of each wheel, grouped by where they
 * stand on the ground.
 */
import { Fm2GearConfig } from './fm2AircraftConfig';

/** A wheel is the vertices this far above its own lowest one (m). */
const TYRE_BAND_M = 0.1;
/** Wheels are searched among the vertices this far above the gear's lowest (m): a nose leg can stand 0.2 m shorter. */
const WHEEL_SEARCH_BAND_M = 0.6;
/** Bottom vertices closer than this on the ground are one wheel (twin nose wheels, bogies) (m). */
const WHEEL_LINK_M = 1.0;
/** A wheel this close to the centreline is a nose or tail wheel (m). */
const CENTRELINE_M = 0.5;
/** Lowest a wheel may stand above the gear's lowest point and still be a leg, not a strut or door (m). */
const WHEEL_MAX_RISE_M = 0.3;

/** One wheel: its ground point (x, z) and lowest y, in the body frame. */
interface Wheel { x: number; y: number; z: number }

/** Group the gear's low vertices into wheels by single-link distance on the ground plane. */
function findWheels(tri: ArrayLike<number>): Wheel[] {
    let minY = Infinity;
    for (let i = 1; i < tri.length; i += 3) minY = Math.min(minY, tri[i]);
    if (!Number.isFinite(minY)) return [];
    const low: number[] = [];
    for (let i = 0; i + 2 < tri.length; i += 3) {
        if (tri[i + 1] < minY + WHEEL_SEARCH_BAND_M) low.push(tri[i], tri[i + 1], tri[i + 2]);
    }
    const n = low.length / 3;
    const label = new Int32Array(n).fill(-1);
    const wheels: Wheel[] = [];
    const link2 = WHEEL_LINK_M * WHEEL_LINK_M;
    for (let seed = 0; seed < n; seed++) {
        if (label[seed] >= 0) continue;
        const id = wheels.length;
        label[seed] = id;
        const members = [seed];
        for (let k = 0; k < members.length; k++) {
            const a = members[k];
            for (let b = 0; b < n; b++) {
                if (label[b] >= 0) continue;
                const dx = low[3 * a] - low[3 * b];
                const dz = low[3 * a + 2] - low[3 * b + 2];
                if (dx * dx + dz * dz < link2) {
                    label[b] = id;
                    members.push(b);
                }
            }
        }
        let y = Infinity;
        for (const m of members) y = Math.min(y, low[3 * m + 1]);
        let sx = 0, sz = 0, c = 0;
        for (const m of members) {
            if (low[3 * m + 1] > y + TYRE_BAND_M) continue;
            sx += low[3 * m]; sz += low[3 * m + 2]; c++;
        }
        wheels.push({ x: sx / c, y, z: sz / c });
    }
    return wheels.filter(w => w.y < minY + WHEEL_MAX_RISE_M);
}

/**
 * Gear contact points for a drawn gear model (triangle soup, body frame, gear
 * down), in the order the default config has them: the centreline wheels
 * first, then left and right main. Each keeps the height of the leg it
 * replaces, so the type's rest height on the runway does not change. Returns
 * undefined when the model has no clear left and right main wheel and no
 * centreline wheel ahead of or behind them (a bicycle layout, a skid), and
 * the default legs stay.
 */
export function fitGearPoints(
    triangles: ArrayLike<number>,
    base: Fm2GearConfig,
): [number, number, number][] | undefined {
    const wheels = findWheels(triangles);
    const centre = wheels.filter(w => Math.abs(w.x) <= CENTRELINE_M);
    const left = wheels.filter(w => w.x < -CENTRELINE_M);
    const right = wheels.filter(w => w.x > CENTRELINE_M);
    if (centre.length === 0 || left.length === 0 || right.length === 0) return undefined;
    // The outermost wheel each side is the main; inner ones (a centre bogie) do not set the track.
    const l = left.reduce((a, b) => (b.x < a.x ? b : a));
    const r = right.reduce((a, b) => (b.x > a.x ? b : a));
    // The main legs are symmetric in the FM; average the two sides.
    const track = (r.x - l.x) / 2;
    const mainZ = (l.z + r.z) / 2;
    const y = Math.min(...base.points.map(p => p[1]));
    const points: [number, number, number][] = [];
    for (const c of centre) {
        if (Math.abs(c.z - mainZ) < 1) continue;
        points.push([0, y, c.z]);
    }
    if (points.length === 0) return undefined;
    points.push([-track, y, mainZ], [track, y, mainZ]);
    return points;
}

/** Fitted legs per aircraft type id; null when its drawn gear had no clear layout (the default legs stay). */
const fittedByType = new Map<string, [number, number, number][] | null>();

/**
 * Fit a type's legs from its drawn gear (soup as {@link fitGearPoints} takes
 * it), once per type id, so every copy of a def and every aircraft of the
 * type, player and AI, rolls on the same legs. Returns true when this
 * changed the legs the type flies on.
 */
export function fitTypeGear(id: string, drawnGear: () => ArrayLike<number> | undefined, base: Fm2GearConfig): boolean {
    if (fittedByType.has(id)) return false;
    const triangles = drawnGear();
    const points = triangles ? fitGearPoints(triangles, base) : undefined;
    console.info(`[gear] ${id}: ${points ? JSON.stringify(points.map(p => p.map(c => +c.toFixed(2)))) : 'no clear wheel layout, default legs'}`);
    fittedByType.set(id, points ?? null);
    return points !== undefined;
}

/** The type's fitted legs, once fitted and if its drawn gear had a clear layout. */
export function fittedGearPoints(id: string): [number, number, number][] | undefined {
    return fittedByType.get(id) ?? undefined;
}
