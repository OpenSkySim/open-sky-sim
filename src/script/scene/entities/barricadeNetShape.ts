/**
 * Node builder for the barricade net: turns a rig placement — the taut
 * band, where the belt panel sits on it, how much wire is off each drum,
 * which stripes are hooked — into the flat carrier-local position array
 * the renderer draws, in {@link BarricadeLayout} order.
 *
 * No physics and no decisions of its own: the placement is what the
 * {@link ./barricadeRigModel} computed for its forces, so what is drawn is
 * exactly what is pulling on the aircraft. Deterministic in its inputs: a
 * parked aircraft gives a pixel-identical net every frame.
 */
import { TriangleBvh } from '../../physics/collision/triangleBvh';
import { BarricadeLayout, BarricadeWire } from './barricadeSpec';
import {
    BarricadeNetAircraft,
    XZ,
    hullTopY,
    isBareFuselageHit,
    pointAt,
    wireSag,
} from './barricadeNetGeometry';

/** How far behind the band a hooked stripe reaches to the edge it holds (m). */
const STRIPE_HOOK_REACH_M = 3.0;

/** Webbing sits this far off skin and deck (m). */
export const NET_SKIN_M = 0.08;

/** Token sag of an idle belt and bow of an idle stripe (m). */
const IDLE_BELT_SAG_M = 0.12;
const IDLE_STRIPE_BOW_M = 0.3;

/** Where the rig is, as the physics resolved it this step. */
export interface BarricadeRigPlacement {
    aircraft: BarricadeNetAircraft;
    bvh: TriangleBvh;
    /** Taut band from the left stanchion to the right, around the airframe. */
    path: XZ[];
    cum: number[];
    /** Arc position on `path` where the belt panel begins. */
    beltStart: number;
    /** Cable off each drum (m), {@link BarricadeWire} order. */
    wireLen: ArrayLike<number>;
    /**
     * The engines' own straight-line target length for each drum (m),
     * {@link BarricadeWire} order — what `wireLen` is stretched past when
     * there is tension. The physics tracks this against its own simplified
     * mast-to-shackle line, which drifts a little from the drawn chord (the
     * shackle rides the actual, sometimes bent, taut path); sagging the
     * wire against the physics's own reference instead of the redrawn
     * chord keeps slack and sag the same fact instead of two that disagree.
     */
    wireReqLen: ArrayLike<number>;
    /** Bit s: stripe s bears on the airframe. */
    hookedMask: number;
}

const _pt: XZ = { x: 0, z: 0 };

// TEMP DIAGNOSTIC: is the real mesh's hook probe actually finding hits, or
// silently falling back to the same generic default every time? Remove
// once the real-mesh hook pattern is understood.
let _dbgTopHit = 0;
let _dbgTopMiss = 0;
let _dbgLastLog = 0;

/**
 * Fill `out` with the whole net. `placement` null draws the rigged net at
 * rest.
 */
export function buildBarricadeNetNodes(
    layout: BarricadeLayout,
    deploy: number,
    out: Float32Array,
    placement: BarricadeRigPlacement | null,
): Float32Array {
    const spec = layout.spec;
    const d = Math.max(0, Math.min(1, deploy));
    const angle = d * Math.PI * 0.5;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const deckAt = (x: number) => (spec.deckYAt ? spec.deckYAt(x) : spec.deckY);
    const set = (i: number, x: number, y: number, z: number) => {
        out[i * 3] = x;
        out[i * 3 + 1] = y;
        out[i * 3 + 2] = z;
    };
    const anchor = (x: number, arm: number) => ({
        x,
        y: deckAt(x) + arm * sin,
        z: spec.planeZ + arm * cos,
    });
    const aUL = anchor(spec.leftX, spec.height);
    const aUR = anchor(spec.rightX, spec.height);
    const aLL = anchor(spec.leftX, spec.lowerLift);
    const aLR = anchor(spec.rightX, spec.lowerLift);
    set(BarricadeWire.UPPER_LEFT, aUL.x, aUL.y, aUL.z);
    set(BarricadeWire.UPPER_RIGHT, aUR.x, aUR.y, aUR.z);
    set(BarricadeWire.LOWER_LEFT, aLL.x, aLL.y, aLL.z);
    set(BarricadeWire.LOWER_RIGHT, aLR.x, aLR.y, aLR.z);

    const beltCut = 2 * spec.webHalfWidth;
    const n = layout.beltNodes;

    if (!placement) {
        // At rest: straight belts across the panel with a token sag.
        console.log('[BARRICADE-NETSHAPE] Building at-rest belt nodes');
        for (const upper of [true, false]) {
            const endL = upper ? aUL : aLL;
            const endR = upper ? aUR : aLR;

            // Upper belt: just 2 points directly below mast anchors (X = mast positions)
            // Lower belt: full width spanning the panel
            let lx, rx, lz, rz;
            if (upper) {
                // Upper belt: vertical cables from anchors
                lx = aUL.x;  // Mast position
                rx = aUR.x;  // Mast position
                lz = aUL.z;  // Mast position
                rz = aUR.z;  // Mast position
            } else {
                // Lower belt: spans panel width
                lx = layout.beltStationX(0);
                rx = layout.beltStationX(n - 1);
                lz = aLL.z;
                rz = aLR.z;
            }

            // Upper belt Y locked at 2.4m below anchors (vertical cables)
            const upperBeltYLeft = upper ? aUL.y - 2.4 : endL.y;
            const upperBeltYRight = upper ? aUR.y - 2.4 : endR.y;

            for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                const beltY = upper
                    ? upperBeltYLeft + (upperBeltYRight - upperBeltYLeft) * t
                    : endL.y + (endR.y - endL.y) * t - IDLE_BELT_SAG_M * Math.sin(Math.PI * t);

                const beltZ = upper
                    ? lz + (rz - lz) * t
                    : endL.z + (endR.z - endL.z) * t;

                set(
                    layout.beltNodeIndex(upper, i),
                    lx + (rx - lx) * t,
                    beltY,
                    beltZ,
                );
            }
        }
    }
    const hookGrip: Array<{ y: number; z: number } | null> = new Array(spec.stripes).fill(null);
    if (placement) {
        const { aircraft, bvh, path, cum, beltStart, hookedMask } = placement;
        // Engaged, the release straps have let go of the stanchion heads:
        // both belts of a side end in the U-shackle on the deck, pulled
        // there by the purchase cable's tension. Elsewhere the panel's
        // position AND form come from one thing only — the stripe that is
        // actually hooked and holding the wing there — not an independent
        // guess at the fuselage crest: the same grip point (height *and*
        // how far forward it reaches) that the stripe loops out to is what
        // bends the belt to meet it, computed once and shared by both, so
        // the belt can never show a shape the stripe holding it disagrees
        // with. Un-hooked stretches, front to back as much as up and down,
        // relax smoothly between whatever grips bracket them and the
        // deck-level shackles — no hook, no tension, no reason to deviate.
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            pointAt(path, cum, beltStart + beltCut * t, _pt);
            const deckHere = deckAt(_pt.x);
            const yLo = deckHere + NET_SKIN_M * 2;
            set(layout.beltNodeIndex(false, i), _pt.x, yLo, _pt.z);
            set(layout.beltNodeIndex(true, i), _pt.x, yLo, _pt.z);
        }
        const crestHi = new Float64Array(n).fill(NaN);
        const crestLo = new Float64Array(n).fill(NaN);
        const crestZ = new Float64Array(n).fill(NaN);
        crestHi[0] = out[layout.beltNodeIndex(true, 0) * 3 + 1];
        crestHi[n - 1] = out[layout.beltNodeIndex(true, n - 1) * 3 + 1];
        crestLo[0] = out[layout.beltNodeIndex(false, 0) * 3 + 1];
        crestLo[n - 1] = out[layout.beltNodeIndex(false, n - 1) * 3 + 1];
        crestZ[0] = out[layout.beltNodeIndex(true, 0) * 3 + 2];
        crestZ[n - 1] = out[layout.beltNodeIndex(true, n - 1) * 3 + 2];
        for (let s = 0; s < spec.stripes; s++) {
            if (!(hookedMask & (1 << s))) continue;
            const i = layout.stripeBeltNode(s);
            const x = out[layout.beltNodeIndex(true, i) * 3];
            const z0 = out[layout.beltNodeIndex(true, i) * 3 + 2];
            const deckHere = deckAt(x);
            // Same probe the hook detector itself uses to find this station
            // in the first place — walk toward the CG and look straight
            // down. A fixed-station scan for the edge missed on the real
            // airframe most of the time (a detailed mesh rarely has solid
            // material at the exact untouched lane X); jumping straight to
            // the full reach fixed that but overshot the wing itself on
            // stations already close to the CG, landing on the fuselage
            // spine beyond it instead. Stepping in and stopping at the
            // first hit finds the nearest surface — the wing — rather than
            // whatever is a fixed distance inboard.
            const dx = aircraft.position.x - x;
            const dz = aircraft.position.z - z0;
            const dl = Math.hypot(dx, dz) || 1;
            const steps = 6;
            const ceiling = deckHere + spec.height;
            let top = -Infinity;
            let px = x, pz = z0;
            for (let k = 1; k <= steps; k++) {
                const reach = (STRIPE_HOOK_REACH_M * k) / steps;
                px = x + (dx / dl) * reach;
                pz = z0 + (dz / dl) * reach;
                const t = hullTopY(bvh, aircraft, px, deckHere + spec.height + 6, pz);
                // The fuselage itself doesn't catch — step past it to find
                // whatever wing, intake, or fin lies beyond.
                if (t > -Infinity && !isBareFuselageHit(px, aircraft.position.x, t, ceiling)) { top = t; break; }
            }
            const hi = top > -Infinity ? Math.min(top + NET_SKIN_M, deckHere + spec.height) : deckHere + spec.height * 0.5;
            const z = top > -Infinity ? pz : z0;
            crestHi[i] = hi;
            crestLo[i] = Math.min(deckHere + spec.lowerLift, hi - 0.2);
            crestZ[i] = z;
            hookGrip[s] = { y: hi, z };
            // TEMP DIAGNOSTIC
            if (top > -Infinity) _dbgTopHit++; else _dbgTopMiss++;
        }
        for (const crest of [crestHi, crestLo, crestZ]) {
            let last = 0;
            for (let i = 1; i < n; i++) {
                if (Number.isNaN(crest[i])) continue;
                for (let j = last + 1; j < i; j++) {
                    crest[j] = crest[last] + ((crest[i] - crest[last]) * (j - last)) / (i - last);
                }
                last = i;
            }
        }
        for (let i = 0; i < n; i++) {
            const kHi = layout.beltNodeIndex(true, i) * 3;
            const kLo = layout.beltNodeIndex(false, i) * 3;
            out[kHi + 1] = Math.max(crestHi[i], out[kHi + 1]);
            out[kLo + 1] = Math.max(crestLo[i], out[kLo + 1]);
            out[kHi + 2] = crestZ[i];
            out[kLo + 2] = crestZ[i];
        }

        // One purchase cable per side: the tension pendant from the old
        // stanchion-head anchor is gone once rigged, so the upper wire's
        // mast end is drawn from the same deck-level anchor as the lower
        // cable — the two chains coincide and only one line is visible.
        set(
            BarricadeWire.UPPER_LEFT,
            out[BarricadeWire.LOWER_LEFT * 3], out[BarricadeWire.LOWER_LEFT * 3 + 1], out[BarricadeWire.LOWER_LEFT * 3 + 2],
        );
        set(
            BarricadeWire.UPPER_RIGHT,
            out[BarricadeWire.LOWER_RIGHT * 3], out[BarricadeWire.LOWER_RIGHT * 3 + 1], out[BarricadeWire.LOWER_RIGHT * 3 + 2],
        );
    }

    // Stripes: sewn to their stations on both belts. Hooked ones stand as
    // a taut wall pressed on the edge that caught them; free ones hang a
    // little of their surplus.
    const cut = (spec.height - spec.lowerLift) * (1 + spec.stripeSlack);
    const sn = spec.stripeNodes;
    for (let s = 0; s < spec.stripes; s++) {
        const station = layout.stripeBeltNode(s);
        const lo = layout.beltNodeIndex(false, station);
        const hi = layout.beltNodeIndex(true, station);
        const lox = out[lo * 3], loy = out[lo * 3 + 1], loz = out[lo * 3 + 2];
        const hix = out[hi * 3], hiy = out[hi * 3 + 1], hiz = out[hi * 3 + 2];
        const chord = Math.hypot(hix - lox, hiy - loy, hiz - loz);
        const surplus = Math.sqrt(Math.max(0, cut * cut - chord * chord));
        const hooked = placement !== null && (placement.hookedMask & (1 << s)) !== 0;
        // A hooked stripe is drawn holding the edge it caught: its middle
        // falls back from the band onto the wing/intake/nose front, so the
        // strap reads as looped over the leading edge — the catch of the
        // schematic — instead of hanging straight in front of it. The grip
        // point is the exact one that already bent the belt to meet it
        // (computed once, above) — never re-measured, so the two can't end
        // up disagreeing about where the wing actually is.
        const grip = hookGrip[s];
        // A strap is flexible: laid over a curved surface it hugs it the
        // whole way along, not just at one point with straight runs either
        // side. Sample the airframe at a few more spots along the strap
        // (same walk-toward-CG-and-look-down probe the belt itself uses)
        // and thread it through all of them, not only the middle.
        const samples: Array<{ t: number; y: number; z: number }> = [{ t: 0, y: loy, z: loz }];
        if (placement && hooked) {
            for (const t of [0.25, 0.5, 0.75]) {
                const x = lox + (hix - lox) * t;
                const zLine = loz + (hiz - loz) * t;
                const yLine = loy + (hiy - loy) * t;
                const dx = placement.aircraft.position.x - x;
                const dz = placement.aircraft.position.z - zLine;
                const dl = Math.hypot(dx, dz) || 1;
                const deckHere = deckAt(x);
                const ceiling = deckHere + spec.height;
                let top = -Infinity;
                let px = x, pz = zLine;
                const steps = 4;
                for (let k = 1; k <= steps; k++) {
                    const reach = (STRIPE_HOOK_REACH_M * k) / steps;
                    px = x + (dx / dl) * reach;
                    pz = zLine + (dz / dl) * reach;
                    const t2 = hullTopY(placement.bvh, placement.aircraft, px, deckHere + spec.height + 6, pz);
                    // Same rule: the bare fuselage doesn't catch anything.
                    if (t2 > -Infinity && !isBareFuselageHit(px, placement.aircraft.position.x, t2, ceiling)) { top = t2; break; }
                }
                if (top > -Infinity) {
                    samples.push({ t, y: Math.min(top + NET_SKIN_M, deckHere + spec.height), z: pz });
                } else if (grip) {
                    // Nothing directly under this spot: fall back to the
                    // stripe's one known grip point, weighted by how close
                    // this sample sits to the middle (where that grip was
                    // found) so the curve still bulges toward it smoothly.
                    const w = Math.sin(Math.PI * t);
                    samples.push({ t, y: yLine + (grip.y - yLine) * w * 0.8, z: zLine + (grip.z - zLine) * w });
                } else {
                    samples.push({ t, y: yLine, z: zLine });
                }
            }
        }
        samples.push({ t: 1, y: hiy, z: hiz });
        for (let j = 0; j < sn; j++) {
            const t = j / (sn - 1);
            if (j === 0 || j === sn - 1) {
                const b = j === 0 ? lo : hi;
                set(layout.stripeNodeIndex(s, j), out[b * 3], out[b * 3 + 1], out[b * 3 + 2]);
                continue;
            }
            const x = lox + (hix - lox) * t;
            let y = loy + (hiy - loy) * t;
            let z = loz + (hiz - loz) * t;
            if (!placement) {
                z += IDLE_STRIPE_BOW_M * Math.sin(Math.PI * t);
            } else if (hooked) {
                // Piecewise-linear through every sample along the strap —
                // a curve that follows the surface at each point it
                // touches, not a single bulge toward its middle.
                let a = samples[0], b2 = samples[samples.length - 1];
                for (let k = 0; k < samples.length - 1; k++) {
                    if (t >= samples[k].t && t <= samples[k + 1].t) { a = samples[k]; b2 = samples[k + 1]; break; }
                }
                const span = b2.t - a.t;
                const u = span > 1e-9 ? (t - a.t) / span : 0;
                y = a.y + (b2.y - a.y) * u;
                z = a.z + (b2.z - a.z) * u;
            } else if (!hooked) {
                // Same catenary approximation the wires sag by: how far a
                // chain of the stripe's own rest length droops below the
                // straight chord it is currently spanning. Ties the droop
                // to the actual slack instead of a flat cosmetic constant.
                const sag = wireSag(cut, chord);
                y -= sag * Math.sin(Math.PI * t);
                // Nothing pins the slack over the airframe: the purchase
                // cable is hauling this station's whole belt run toward
                // its mast, so loose material leans that way too, the same
                // load that sags it under gravity also laying it back —
                // not hanging in a plane perpendicular to the deck.
                const mastX = x < (spec.leftX + spec.rightX) * 0.5 ? spec.leftX : spec.rightX;
                const dx = mastX - x;
                const dz = spec.planeZ - z;
                const dl = Math.hypot(dx, dz) || 1;
                const lean = sag * 0.7 * Math.sin(Math.PI * t);
                z += (dz / dl) * lean;
            }
            y = Math.max(y, deckAt(x) + NET_SKIN_M);
            set(layout.stripeNodeIndex(s, j), x, y, z);
        }
    }

    // Wires: stanchion to belt end, drooping by however much cable is off
    // the drum beyond the straight run.
    for (let w = 0; w < 4; w++) {
        const a0 = layout.wireNodeIndex(w as BarricadeWire, 0);
        const a1 = layout.wireNodeIndex(w as BarricadeWire, spec.wireNodes + 1);
        const chord = Math.hypot(
            out[a1 * 3] - out[a0 * 3], out[a1 * 3 + 1] - out[a0 * 3 + 1], out[a1 * 3 + 2] - out[a0 * 3 + 2],
        );
        // One purchase cable per side: engaged, the upper slot's anchor and
        // belt end were made to coincide with the lower slot's above, and
        // the physics mirrors the same length into both — so the two
        // chains compute identically and draw as a single line.
        //
        // Slack comes from the physics's own bookkeeping (paid-out length
        // past its target), not from comparing wireLen to the redrawn
        // chord: the two are close but not identical (the drawn shackle
        // rides the actual taut path, the physics tracks a simplified
        // straight mast-to-shackle line), and that small, ever-present gap
        // alone was enough to make `wireLen <= chord` true almost always,
        // holding the cable dead straight regardless of how little tension
        // it actually had. The chord itself still comes from the real
        // drawn points — only how much of it is slack is physics-sourced.
        const slack = placement ? Math.max(0, placement.wireLen[w] - placement.wireReqLen[w]) : 0;
        const sag = wireSag(chord + slack, chord);
        for (let j = 1; j <= spec.wireNodes; j++) {
            const t = j / (spec.wireNodes + 1);
            const x = out[a0 * 3] + (out[a1 * 3] - out[a0 * 3]) * t;
            const y = out[a0 * 3 + 1] + (out[a1 * 3 + 1] - out[a0 * 3 + 1]) * t
                - sag * Math.sin(Math.PI * t);
            const z = out[a0 * 3 + 2] + (out[a1 * 3 + 2] - out[a0 * 3 + 2]) * t;
            set(layout.wireNodeIndex(w as BarricadeWire, j), x, Math.max(y, deckAt(x) + NET_SKIN_M), z);
        }
    }
    for (let td = 0; td < spec.tieDowns; td++) {
        const x = layout.beltStationX(layout.tieDownBeltNode(td));
        set(layout.tieDownIndex(td), x, deckAt(x) + spec.lowerLift * sin, spec.planeZ + spec.lowerLift * cos);
    }
    // TEMP DIAGNOSTIC
    const _now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (placement && _now - _dbgLastLog > 1000) {
        _dbgLastLog = _now;
        console.log(
            '[barricade-node-dbg] topHit=' + _dbgTopHit, 'topMiss=' + _dbgTopMiss,
        );
        _dbgTopHit = 0; _dbgTopMiss = 0;
        const mask = placement.hookedMask;
        const rows: string[] = [];
        for (let i = 0; i < n; i++) {
            const lo = layout.beltNodeIndex(false, i) * 3;
            const hi = layout.beltNodeIndex(true, i) * 3;
            rows.push(
                i + (mask & (1 << i) ? '*' : ' ')
                + ' x=' + out[hi].toFixed(1)
                + ' loY=' + out[lo + 1].toFixed(1) + ' loZ=' + out[lo + 2].toFixed(1)
                + ' hiY=' + out[hi + 1].toFixed(1) + ' hiZ=' + out[hi + 2].toFixed(1),
            );
        }
        console.log('[barricade-belt-dbg]\n' + rows.join('\n'));
    }
    return out;
}
