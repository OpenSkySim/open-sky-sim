/**
 * The string-model barricade: an exact arrest, end to end.
 *
 * The harness stands in for the flight model — it owns the aircraft state,
 * feeds it in every frame and integrates the wrench the model reports —
 * so what is asserted is the contract: the wires pay out at the engines'
 * capped hold force and that is what stops the aircraft; the belts keep
 * their cut length; the stripes sit on their stations; and the same
 * geometry that produces the forces is what gets drawn.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { BarricadeRigModel } from './barricadeRigModel';
import {
    BarricadeAirframeBody,
    BarricadeWire,
    barricadeFallbackHull,
    barricadeStoppingDistance,
    defaultBarricadeSolverSpec,
} from './barricadeSpec';

const DT = 1 / 60;

function rigged(): BarricadeRigModel {
    const m = new BarricadeRigModel(defaultBarricadeSolverSpec());
    m.reset(1);
    return m;
}

/** A deck-borne test aircraft the harness integrates, combat-sim style. */
class TestBody implements BarricadeAirframeBody {
    readonly position = new THREE.Vector3();
    readonly quaternion = new THREE.Quaternion();
    readonly velocity = new THREE.Vector3();
    readonly angularVelocityBody = new THREE.Vector3();
    massKg = 12000;
    readonly inertiaBody = new THREE.Vector3(80000, 80000, 30000);
    private readonly f = new THREE.Vector3();
    private readonly tq = new THREE.Vector3();
    private readonly inv = new THREE.Quaternion();

    constructor(x: number, y: number, z: number, speedAlongMinusZ: number, yawDeg = 0) {
        this.position.set(x, y, z);
        this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI + (yawDeg * Math.PI) / 180);
        this.velocity.set(0, 0, -speedAlongMinusZ);
    }

    /** One frame: hand the state over, step, take the wrench, integrate. */
    step(model: BarricadeRigModel, hull: ReturnType<typeof barricadeFallbackHull>): void {
        model.setAirframe(hull, this);
        model.step(DT);
        model.airframeForce(this.f);
        model.airframeTorque(this.tq);
        this.velocity.addScaledVector(this.f, DT / this.massKg);
        // Torque into body rates; gear on deck bleeds pitch/roll.
        this.inv.copy(this.quaternion).invert();
        this.tq.applyQuaternion(this.inv);
        this.angularVelocityBody.x += (this.tq.x * DT) / this.inertiaBody.x;
        this.angularVelocityBody.y += (this.tq.y * DT) / this.inertiaBody.y;
        this.angularVelocityBody.z += (this.tq.z * DT) / this.inertiaBody.z;
        const keep = Math.exp(-5 * DT);
        this.angularVelocityBody.x *= keep;
        this.angularVelocityBody.z *= keep;
        this.velocity.y = 0;
        const y = this.position.y;
        this.position.addScaledVector(this.velocity, DT);
        this.position.y = y;
    }

    speedAlong(): number {
        return -this.velocity.z;
    }
}

/** Cable off both drums (m): one purchase cable per side, in the LOWER slots. */
function totalPayout(m: BarricadeRigModel): number {
    return m.wirePaidOut(BarricadeWire.LOWER_LEFT) + m.wirePaidOut(BarricadeWire.LOWER_RIGHT);
}

interface Run {
    stopped: boolean;
    frames: number;
    runOut: number;
    peakTension: number;
    wiresMonotone: boolean;
    beltInside: boolean;
}

function arrest(m: BarricadeRigModel, body: TestBody, hull: ReturnType<typeof barricadeFallbackHull>, maxFrames = 900): Run {
    const startZ = body.position.z;
    let peakTension = 0;
    let wiresMonotone = true;
    let beltInside = true;
    const prevLen = [0, 0, 0, 0].map((_, w) => m.wirePaidOut(w as BarricadeWire));
    let frames = 0;
    for (; frames < maxFrames; frames++) {
        body.step(m, hull);
        assert.ok(Number.isFinite(body.position.lengthSq()) && Number.isFinite(body.velocity.lengthSq()), 'finite');
        for (let w = 0; w < 4; w++) {
            const t = m.wireTension(w as BarricadeWire);
            peakTension = Math.max(peakTension, t);
            assert.ok(t <= m.spec.engineHoldN + 1, `tension ${t.toFixed(0)} N over the cap`);
            const len = m.wirePaidOut(w as BarricadeWire);
            if (body.speedAlong() > 0.5 && len < prevLen[w] - 1e-6) wiresMonotone = false;
            prevLen[w] = len;
        }
        if (body.speedAlong() < 1) break;
    }
    void beltInside;
    return { stopped: body.speedAlong() < 1, frames, runOut: startZ - body.position.z, peakTension, wiresMonotone, beltInside };
}

describe('BarricadeRigModel', () => {

    it('arrests a 12 t aircraft at 55 m/s on the energy balance', () => {
        const m = rigged();
        const hull = barricadeFallbackHull(7);
        const v0 = 55;
        const body = new TestBody(0, m.spec.deckY + 2, m.spec.planeZ + 12, v0);
        const r = arrest(m, body, hull);
        assert.equal(r.stopped, true, 'expected the wires to stop the aircraft');
        assert.ok(r.wiresMonotone, 'wires may only pay out while the aircraft moves');

        const expected = barricadeStoppingDistance(body.massKg, v0, m.spec);
        assert.ok(
            r.runOut > 0.5 * expected && r.runOut < 2.5 * expected,
            `run-out ${r.runOut.toFixed(1)} m vs energy balance ${expected.toFixed(1)} m`,
        );
        // Energy: cable off the drums at the capped hold force accounts for
        // the kinetic energy, up to the soft-start.
        const absorbed = m.spec.engineHoldN * totalPayout(m);
        const kinetic = 0.5 * body.massKg * v0 * v0;
        assert.ok(
            absorbed > 0.6 * kinetic && absorbed < 1.4 * kinetic,
            `engines absorbed ${(absorbed / 1e6).toFixed(2)} MJ of ${(kinetic / 1e6).toFixed(2)} MJ`,
        );
        // Each belt reports half its cable's tension.
        assert.ok(r.peakTension > 0.45 * m.spec.engineHoldN, 'the engines must have reached their cap');
    });

    it('holds the belt panel on the band and hooks the wing stations', () => {
        const m = rigged();
        const hull = barricadeFallbackHull(7);
        const body = new TestBody(0, m.spec.deckY + 2, m.spec.planeZ + 12, 50);
        arrest(m, body, hull);
        assert.equal(m.isWrapping(), true);
        const mask = m.hookedStripeMask();
        assert.ok(mask !== 0, 'some stripes must be hooked on the airframe');
        // Stations across the wingspan (±7 m at 1.33 m pitch = ~10 stations) are hooked.
        let hooked = 0;
        for (let s = 0; s < m.spec.stripes; s++) if (mask & (1 << s)) hooked++;
        assert.ok(hooked >= 6, `expected the wing stations hooked, got ${hooked}`);

        // Drawn geometry follows the physics: both belts meet at the deck
        // shackles past the airframe's footprint, the lower belt lifts to
        // gear height and the upper to wing height over that footprint, and
        // the hooked stripes across the wingspan are drawn holding the
        // wing's leading edge (body z = +1.3 on the fallback hull, at wing
        // height) — the band itself runs wingtip to nose, as a taut band
        // must.
        const nodes = new Float32Array(m.count * 3);
        m.writeTo(nodes);
        const layout = m.layout;
        const inv = body.quaternion.clone().invert();
        const p = new THREE.Vector3();
        // Trapezoid: both belts meet at the shackles on the deck, and the
        // upper belt is up over the airframe.
        for (const end of [0, layout.beltNodes - 1]) {
            const hi = layout.beltNodeIndex(true, end);
            const lo = layout.beltNodeIndex(false, end);
            assert.ok(nodes[lo * 3 + 1] < m.spec.deckY + 0.3, 'shackle end rides the deck');
            for (let c = 0; c < 3; c++) assert.equal(nodes[hi * 3 + c], nodes[lo * 3 + c], 'belts join at the shackle');
        }
        let raised = 0;
        let trapped = 0;
        for (let i = 0; i < layout.beltNodes; i++) {
            if (nodes[layout.beltNodeIndex(true, i) * 3 + 1] > m.spec.deckY + 1.0) raised++;
            const loY = nodes[layout.beltNodeIndex(false, i) * 3 + 1];
            if (loY > m.spec.deckY + 0.2 && loY < m.spec.deckY + m.spec.lowerLift + 0.3) trapped++;
        }
        assert.ok(raised >= 4, `upper belt must be held up by the airframe, ${raised} stations raised`);
        assert.ok(trapped >= 4, `lower belt must lift to gear height over the footprint, ${trapped} stations there`);

        // One purchase cable per side: the upper wire chain must draw
        // exactly on top of the lower one, not as a second visible line.
        for (const [u, w] of [
            [BarricadeWire.UPPER_LEFT, BarricadeWire.LOWER_LEFT],
            [BarricadeWire.UPPER_RIGHT, BarricadeWire.LOWER_RIGHT],
        ] as const) {
            for (let j = 0; j <= m.spec.wireNodes + 1; j++) {
                const nu = layout.wireNodeIndex(u, j);
                const nw = layout.wireNodeIndex(w, j);
                for (let c = 0; c < 3; c++) {
                    assert.ok(
                        Math.abs(nodes[nu * 3 + c] - nodes[nw * 3 + c]) < 1e-6,
                        `wire ${u} node ${j} must coincide with wire ${w} (one cable per side)`,
                    );
                }
            }
        }
        let onEdge = 0;
        const mid = (m.spec.stripeNodes - 1) >> 1;
        for (let s = 0; s < m.spec.stripes; s++) {
            if (!(mask & (1 << s))) continue;
            const n = layout.stripeNodeIndex(s, mid);
            p.set(nodes[n * 3], nodes[n * 3 + 1], nodes[n * 3 + 2]).sub(body.position).applyQuaternion(inv);
            if (Math.abs(p.x) > 1.5 && Math.abs(p.x) < 7.5 && Math.abs(p.z - 1.3) < 0.8 && p.y > -0.8 && p.y < 0.6) {
                onEdge++;
            }
        }
        assert.ok(onEdge >= 4, `expected hooked stripes drawn on the wing leading edge, got ${onEdge}`);
        for (let s = 0; s < m.spec.stripes; s++) {
            const station = layout.stripeBeltNode(s);
            for (const upper of [false, true]) {
                const b = layout.beltNodeIndex(upper, station);
                const e = layout.stripeNodeIndex(s, upper ? m.spec.stripeNodes - 1 : 0);
                for (let c = 0; c < 3; c++) assert.equal(nodes[e * 3 + c], nodes[b * 3 + c]);
            }
        }
    });

    it('is deterministic and frozen when parked', () => {
        const run = () => {
            const m = rigged();
            const hull = barricadeFallbackHull(7);
            const body = new TestBody(2, m.spec.deckY + 2, m.spec.planeZ + 12, 40);
            arrest(m, body, hull, 400);
            body.velocity.set(0, 0, 0);
            const a = new Float32Array(m.count * 3);
            const b = new Float32Array(m.count * 3);
            m.setAirframe(hull, body);
            m.step(DT);
            m.writeTo(a);
            for (let f = 0; f < 60; f++) {
                m.setAirframe(hull, body);
                m.step(DT);
            }
            m.writeTo(b);
            for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i], `node float ${i} moved while parked`);
            return { z: body.position.z, payout: totalPayout(m) };
        };
        const r1 = run();
        const r2 = run();
        assert.equal(r1.z, r2.z);
        assert.equal(r1.payout, r2.payout);
    });

    it('survives a yawed, off-centre catch and behaves alike on either side', () => {
        const run = (x: number, yaw: number) => {
            const m = rigged();
            const hull = barricadeFallbackHull(7);
            const body = new TestBody(x, m.spec.deckY + 2, m.spec.planeZ + 12, 50, yaw);
            const r = arrest(m, body, hull);
            assert.equal(r.stopped, true, `catch at x=${x} yaw=${yaw} must stop`);
            return r.runOut;
        };
        const port = run(-5, -10);
        const stbd = run(5, 10);
        assert.ok(Math.abs(port - stbd) < 6, `run-outs ${port.toFixed(1)} vs ${stbd.toFixed(1)}`);
        run(3, 60);
    });

    it('does nothing to an aircraft behind the rig line or climbing clear', () => {
        const m = rigged();
        const hull = barricadeFallbackHull(7);
        const behind = new TestBody(0, m.spec.deckY + 2, m.spec.planeZ + 40, 30);
        behind.step(m, hull);
        assert.equal(m.isWrapping(), false);
        const f = new THREE.Vector3();
        assert.equal(m.airframeForce(f).length(), 0);
        const high = new TestBody(0, m.spec.deckY + 12, m.spec.planeZ - 10, 30);
        high.step(m, hull);
        assert.equal(m.isWrapping(), false);
    });

    it('winds slack back in once the aircraft has stopped', () => {
        const m = rigged();
        const hull = barricadeFallbackHull(7);
        const body = new TestBody(0, m.spec.deckY + 2, m.spec.planeZ + 12, 45);
        arrest(m, body, hull);
        const paid = totalPayout(m);
        body.velocity.set(0, 0, 0);
        // Roll the parked aircraft back a few metres: the wires are now slack
        // and the engines take the surplus up.
        body.position.z += 3;
        for (let f = 0; f < 120; f++) {
            m.setAirframe(hull, body);
            m.step(DT);
        }
        assert.ok(totalPayout(m) < paid - 1, `expected slack wound in: ${paid.toFixed(1)} -> ${totalPayout(m).toFixed(1)}`);
    });
});
