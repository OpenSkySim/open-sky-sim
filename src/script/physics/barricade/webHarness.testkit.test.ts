/**
 * What the webbing gate files share: arrival masses, the cost clock, the
 * penetration count against the drawn skin and the net's own energy.
 * Node-only, so named as a test file (outside the app's typecheck); it holds
 * no tests itself.
 */
import * as THREE from 'three';
import {
    bvhClosest, bvhClosestPoint, bvhContainsPoint, bvhHit, bvhSegmentHit,
} from '../collision/triangleBvh';
import { BARRICADE_DECK_Y } from '../../scene/entities/barricadeSpec';
import { windingNumber } from './webCollider';
import { PAYOUT_MAX_M, SKIN_M, WebSolver } from './webSolver';
import { WebAirframe, WebFixture } from './webFixtures.testkit.test';

/** Arrival masses (kg): landing weights, kept inside the 15–30 t the gates were set for. */
export const MASS_KG: Record<WebFixture, number> = { twinTail: 26e3, singleTail: 15e3, crankedDelta: 16e3, wideWing: 24e3 };
/**
 * This thread's CPU time (ms). The cost gate reads this, not the wall clock:
 * the machine these run on is shared, and wall time doubled under load; the
 * process's CPU time counts the collector and compiler threads too. Windows
 * counts thread time in 15.6 ms ticks, which is fine summed over a run.
 */
export function cpuMs(): number {
    const u = process.threadCpuUsage();
    return (u.user + u.system) / 1000;
}

export interface Penetration {
    /** Particles more than the skin margin inside the drawn skin. */
    deep: number;
    /** Links crossing the drawn skin. */
    through: number;
    /** The links that cross it, as indices into the layout's links. */
    throughLinks: number[];
}

const _near = bvhClosest();
const _hit = bvhHit();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/**
 * Against the drawn skin without its gear (WebAirframe.skin): the wheels roll
 * over the webbing and it passes through them by design (withoutGear).
 */
export function penetration(s: WebSolver, af: WebAirframe, pos: THREE.Vector3, qInv: THREE.Quaternion): Penetration {
    const b = af.bounds;
    const inBox = (p: THREE.Vector3) => p.x >= b[0] && p.x <= b[3] && p.y >= b[1] && p.y <= b[4] && p.z >= b[2] && p.z <= b[5];
    let deep = 0;
    for (let i = 0; i < s.count; i++) {
        _a.set(s.x[3 * i], s.x[3 * i + 1], s.x[3 * i + 2]).sub(pos).applyQuaternion(qInv);
        if (!inBox(_a)) continue;
        // Within the skin of the surface it cannot be deeper than the skin.
        if (bvhClosestPoint(af.skinBvh, _a.x, _a.y, _a.z, SKIN_M, _near)) continue;
        // Parity over-reports on open soups but does not miss: confirm by winding.
        if (!bvhContainsPoint(af.skinBvh, _a.x, _a.y, _a.z)) continue;
        if (windingNumber(af.skin, _a.x, _a.y, _a.z) > 0.5) deep++;
    }
    let through = 0;
    const throughLinks: number[] = [];
    for (const l of s.layout.links) {
        _a.set(s.x[3 * l.i], s.x[3 * l.i + 1], s.x[3 * l.i + 2]).sub(pos).applyQuaternion(qInv);
        _b.set(s.x[3 * l.j], s.x[3 * l.j + 1], s.x[3 * l.j + 2]).sub(pos).applyQuaternion(qInv);
        if (bvhSegmentHit(af.skinBvh, _a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _hit)) { through++; throughLinks.push(s.layout.links.indexOf(l)); }
    }
    return { deep, through, throughLinks };
}

/** No part of the webbing more than this below the deck (m). */
export const DECK_TOLERANCE_M = 0.01;

/**
 * The two hard limits of a catch: nothing of the webbing below the deck
 * (its lowest point over the run), no purchase cable past its 90 m stop.
 */
export function deckAndPayoutFails(s: WebSolver): string[] {
    const fails: string[] = [];
    const below = BARRICADE_DECK_Y - s.stats.lowestY;
    if (below > DECK_TOLERANCE_M) fails.push(`webbing ${below.toFixed(3)} m below the deck`);
    const most = Math.max(...s.stats.payout);
    if (most > PAYOUT_MAX_M + 1e-6) fails.push(`payout ${most.toFixed(2)} m, past the ${PAYOUT_MAX_M} m stop`);
    return fails;
}

/** The net's kinetic, potential (above the deck) and elastic energy (J). */
export function netEnergy(s: WebSolver): number {
    const lay = s.layout;
    let e = 0;
    for (let i = 0; i < s.count; i++) {
        const m = lay.mass[i];
        e += 0.5 * m * (s.v[3 * i] ** 2 + s.v[3 * i + 1] ** 2 + s.v[3 * i + 2] ** 2) + m * 9.81 * (s.x[3 * i + 1] - BARRICADE_DECK_Y);
    }
    for (const l of lay.links) {
        const d = Math.hypot(s.x[3 * l.j] - s.x[3 * l.i], s.x[3 * l.j + 1] - s.x[3 * l.i + 1], s.x[3 * l.j + 2] - s.x[3 * l.i + 2]);
        const c = d - l.rest;
        if (c > 0) e += 0.5 * c * c / l.compliance;
    }
    return e;
}

/** Per layout: each strap's links as particle pairs and rest lengths, eye first. */
const strapLinks = new WeakMap<WebSolver['layout'], { a: number; b: number; rest: number }[][]>();

/**
 * The strain the worst strap carries: per strap, the median over its links
 * with neither end pressed on the airframe. A free span carries one tension
 * from end to end, which the median reads whatever a single link does, and
 * that tension is what the gate holds under the webbing's rating (two-ply
 * nylon, about 22 % at break). Single links read far higher in two places
 * the 0.4 m links cannot resolve: where the strap lies on the airframe, its
 * eye pulled over a leading edge or a wingtip by the upper belt (29-41 %, the
 * span below at 9-16 %), and the eye link itself, re-stretched when the sling
 * puts the eye back on the belt after the strap's solve (30 % beside 10 %).
 */
export function freeSpanStrapStrain(s: WebSolver): number {
    const lay = s.layout;
    let straps = strapLinks.get(lay);
    if (!straps) {
        const rest = new Map<number, number>();
        const n = lay.mass.length;
        for (const l of lay.links) rest.set(Math.min(l.i, l.j) * n + Math.max(l.i, l.j), l.rest);
        straps = lay.straps.map(st => st.slice(1).map((b, k) => {
            const a = st[k];
            return { a, b, rest: rest.get(Math.min(a, b) * n + Math.max(a, b))! };
        }));
        strapLinks.set(lay, straps);
    }
    const x = s.x, pressed = s.bodyPressed;
    let worst = 0;
    const free: number[] = [];
    for (const links of straps) {
        free.length = 0;
        for (const l of links) {
            if (pressed[l.a] || pressed[l.b]) continue;
            const a = 3 * l.a, b = 3 * l.b;
            free.push(Math.hypot(x[b] - x[a], x[b + 1] - x[a + 1], x[b + 2] - x[a + 2]) / l.rest - 1);
        }
        if (free.length === 0) continue;
        free.sort((p, q) => p - q);
        worst = Math.max(worst, free[free.length >> 1]);
    }
    return worst;
}

/**
 * The net's energy books over the hold: what it gained beyond what the
 * airframe put in less what the sinks took (J), from `fromF` to `toF` frames
 * into the hold, with `residual` the net's energy less the airframe's work
 * plus the sinks'. With the jet stopped nothing outside feeds the net, so a
 * gain is the solver's (a contact or edge solve pumping it, 4-6 kW when one
 * did). It replaces a 0.2 m/s speed limit three seconds in: a 6 m strap swings
 * like a pendulum with a 4-5 s period, so a speed then measured where in its
 * swing it was (median settle 5.75 s on the drawn meshes), not a fault.
 */
export class HoldBooks {
    private r0 = NaN;
    private r1 = NaN;
    constructor(private readonly residual: () => number, private readonly fromF: number, private readonly toF: number) {}

    /** Call every frame with the frames since the hold began. */
    sample(g: number): void {
        if (g === this.fromF) this.r0 = this.residual();
        if (g === this.toF) this.r1 = this.residual();
    }

    /** What the net gained over the window (J), NaN until it is over. */
    get gainJ(): number {
        return this.r1 - this.r0;
    }

    fails(maxJ: number): string | null {
        const g = this.gainJ;
        if (!Number.isFinite(g)) return 'the hold was not reached';
        return g > maxJ ? `the net gained ${g.toFixed(0)} J in the hold` : null;
    }
}
