/**
 * The carrier barricade as an exact string model.
 *
 * A MK-7 barricade is three kinds of run and one rule each, and this is
 * that model taken literally instead of approximated with particles:
 *
 *  - The two **load belts** are inextensible and cut to length. Under
 *    tension a belt is a TAUT BAND: the shortest path from stanchion to
 *    stanchion around the front of the airframe's silhouette. That path is
 *    exact 2-D geometry (a taut string over a convex hull), so the belts
 *    are never solved — they are constructed.
 *  - The **stripes** are inextensible and sewn to fixed stations on both
 *    belts. Whichever stations lie on the band's contact arc bear on the
 *    airframe: the wing leading edges, the intake lips, the nose.
 *  - The **wires** from the stanchions to the belt ends are the only thing
 *    that changes length, and they are the whole physics: each pays out
 *    against its arresting engine's capped hold force, and cap × payout is
 *    the energy taken out of the aircraft.
 *
 * Forces follow from the geometry: the wrapped belt segment is massless
 * and in equilibrium, so the wrench it puts on the airframe equals its two
 * end tensions acting along the band's tangents at the two points where
 * it leaves the airframe. Applied at hook height that is the exact
 * resultant, and its power equals the rate of cable leaving the drums.
 *
 * Everything is a deterministic function of the aircraft pose and the four
 * paid-out lengths, so the same pose renders the same net every frame —
 * no flicker, no tangles, by construction. The drawn nodes are built from
 * the very placement the forces come from.
 */
import * as THREE from 'three';
import { TriangleBvh, triangleBvhFor } from '../../physics/collision/triangleBvh';
import { AircraftCollisionMesh } from './aircraftDef';
import {
    BarricadeAirframeBody,
    BarricadeLayout,
    BarricadeSolverSpec,
    BarricadeWire,
    defaultBarricadeSolverSpec,
} from './barricadeSpec';
import {
    BarricadeNetAircraft,
    XZ,
    barricadeCatchAnchorBody,
    cumulative,
    drapeOutlineBody,
    hullTopY,
    isBareFuselageHit,
    pointAt,
    projectOntoPath,
    silhouetteXZ,
    tautPath,
    frontEnvelope,
} from './barricadeNetGeometry';
import { BarricadeRigPlacement, NET_SKIN_M, buildBarricadeNetNodes } from './barricadeNetShape';

/** Ship-relative body speed below which the rig counts as resting (m/s). */
const REST_BODY_SPEED = 0.5;

/** The rig only wraps an airframe this far below its top edge (m above deck). */
const WRAP_HEIGHT_MARGIN_M = 3;

/**
 * How far behind the band a stripe can reach to hook an edge (m).
 *
 * The taut band is the convex hull; a swept wing's leading edge lies inside
 * it, behind the chord from wingtip to nose. The stripe hanging at that
 * station is 6.5 m of strap with only 5.6 m to span, and that surplus is
 * what lets it fall back onto the edge and hook it — so a station counts as
 * hooked when there is airframe within the stripe's reach, not only when
 * the band itself bears there.
 */
const HOOK_REACH_M = 3.0;

const _pt: XZ = { x: 0, z: 0 };
const _anchorCarrier = new THREE.Vector3();
const _tmp = new THREE.Vector3();

export class BarricadeRigModel {

    readonly spec: BarricadeSolverSpec;
    readonly layout: BarricadeLayout;
    /** Particle count of the drawn net. */
    readonly count: number;

    /** Cable off each drum (m), {@link BarricadeWire} order. */
    private readonly wireLen = new Float64Array(4);
    /** The engines' own straight-line target length this step (m), mirrored into the UPPER slots like `wireLen`. */
    private readonly wireReqLen = new Float64Array(4);
    /** Tension in each wire this step (N). */
    private readonly wireTensionN = new Float64Array(4);
    /** Bare wire as rigged — the drum's zero. */
    private readonly bare: number;

    private drape: AircraftCollisionMesh | null = null;
    private bvh: TriangleBvh | null = null;
    private hasBody = false;
    private readonly body: BarricadeNetAircraft & { drape: AircraftCollisionMesh } = {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        drape: null as unknown as AircraftCollisionMesh,
    };
    private readonly bodyVel = new THREE.Vector3();
    private deploy = 0;

    /** Where the net first caught, in the body frame, and which panel station that was. */
    private readonly anchorBody = new THREE.Vector3();
    private haveAnchor = false;
    private uAnchor = 0;

    private wrapping = false;
    private hookedMask = 0;
    private readonly force = new THREE.Vector3();
    private readonly torque = new THREE.Vector3();

    private readonly nodes: Float32Array;
    private nodesDirty = true;
    /** TEMP DIAGNOSTIC: throttles the console dump in {@link wrap} to ~1/s. Remove once the real-mesh hook pattern is understood. */
    private _dbgLogAccum = 999;
    private readonly placement: BarricadeRigPlacement;

    constructor(spec: BarricadeSolverSpec = defaultBarricadeSolverSpec()) {
        this.spec = spec;
        this.layout = new BarricadeLayout(spec);
        this.count = this.layout.count;
        this.bare = Math.max(0.25, (spec.rightX - spec.leftX) * 0.5 - spec.webHalfWidth);
        this.wireLen.fill(this.bare);
        this.nodes = new Float32Array(this.count * 3);
        this.placement = {
            aircraft: this.body,
            bvh: null as unknown as TriangleBvh,
            path: [],
            cum: [0],
            beltStart: 0,
            wireLen: this.wireLen,
            wireReqLen: this.wireReqLen,
            hookedMask: 0,
        };
    }

    /** A fresh assembly on the rig: drums wound to zero, nothing caught. */
    reset(deploy: number): void {
        this.deploy = Math.max(0, Math.min(1, deploy));
        this.wireLen.fill(this.bare);
        this.wireTensionN.fill(0);
        this.haveAnchor = false;
        this.wrapping = false;
        this.hookedMask = 0;
        this.force.set(0, 0, 0);
        this.torque.set(0, 0, 0);
        this.nodesDirty = true;
    }

    setDeploy(deploy: number): void {
        const clamped = Math.max(0, Math.min(1, deploy));
        if (Math.abs(clamped - this.deploy) > 1e-6) this.nodesDirty = true;
        this.deploy = clamped;
    }

    getDeploy(): number {
        return this.deploy;
    }

    /**
     * The aircraft in the net, or `null` when nothing is. Pose and velocity
     * are authoritative from the flight model every frame.
     */
    setAirframe(drape: AircraftCollisionMesh | null, body?: BarricadeAirframeBody): void {
        if (!drape || !body) {
            if (this.hasBody) this.nodesDirty = true;
            this.hasBody = false;
            this.drape = null;
            this.bvh = null;
            this.haveAnchor = false;
            this.wrapping = false;
            this.hookedMask = 0;
            return;
        }
        if (this.drape !== drape) {
            this.drape = drape;
            this.bvh = triangleBvhFor(drape);
            this.body.drape = drape;
            this.haveAnchor = false;
        }
        this.body.position.copy(body.position);
        this.body.quaternion.copy(body.quaternion);
        this.bodyVel.copy(body.velocity);
        this.hasBody = true;
    }

    /** Advance the rig by `dt` seconds. */
    step(dt: number): void {
        this.force.set(0, 0, 0);
        this.torque.set(0, 0, 0);
        this.wireTensionN.fill(0);
        if (!(dt > 0)) return;

        const spec = this.spec;
        const deckAt = (x: number) => (spec.deckYAt ? spec.deckYAt(x) : spec.deckY);
        const resting = !this.hasBody || this.bodyVel.length() < REST_BODY_SPEED;

        let wrapping = false;
        if (this.hasBody && this.drape && this.bvh && this.deploy > 0.5) {
            const outline = drapeOutlineBody(this.drape);
            const sil = silhouetteXZ(outline, this.body, {
                xMin: spec.leftX + 0.5,
                xMax: spec.rightX - 0.5,
                zMax: spec.planeZ - 0.05,
            });
            let minZ = Infinity;
            for (const p of sil) minZ = Math.min(minZ, p.z);
            const heightAboveDeck = this.body.position.y - deckAt(this.body.position.x);
            wrapping = sil.length >= 3
                && minZ < spec.planeZ - 0.5
                && heightAboveDeck < spec.height + WRAP_HEIGHT_MARGIN_M;
            if (wrapping) this.wrap(sil, outline, dt, resting);
        }
        if (!wrapping) {
            // Nothing in the net: slack cable winds back in.
            const haul = spec.engineRetractMps * dt;
            for (let w = 0; w < 4; w++) {
                if (this.wireLen[w] > this.bare) {
                    this.wireLen[w] = Math.max(this.bare, this.wireLen[w] - haul);
                    this.nodesDirty = true;
                }
            }
            if (this.wrapping) this.nodesDirty = true;
            this.wrapping = false;
            this.hookedMask = 0;
            if (this.nodesDirty) {
                buildBarricadeNetNodes(this.layout, this.deploy, this.nodes, null);
                this.nodesDirty = false;
            }
        }
    }

    /** The engaged step: band, panel, wires, forces, nodes. */
    private wrap(sil: XZ[], outline: Float64Array, dt: number, resting: boolean): void {
        const spec = this.spec;
        const deckAt = (x: number) => (spec.deckYAt ? spec.deckYAt(x) : spec.deckY);
        const angle = this.deploy * Math.PI * 0.5;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const beltCut = 2 * spec.webHalfWidth;

        // The taut band from stanchion to stanchion around the airframe.
        const sL: XZ = { x: spec.leftX, z: spec.planeZ + spec.lowerLift * cos };
        const sR: XZ = { x: spec.rightX, z: spec.planeZ + spec.lowerLift * cos };
        const path = frontEnvelope(tautPath(sL, sR, sil), sil);
        const cum = cumulative(path);
        const lPath = cum[cum.length - 1];

        // Where the net caught: remembered in the body frame, projected
        // onto the band every step. The panel stays hooked there however
        // the airframe yaws or slides afterwards.
        if (!this.haveAnchor) {
            barricadeCatchAnchorBody(outline, this.body, this.anchorBody);
            _anchorCarrier.copy(this.anchorBody).applyQuaternion(this.body.quaternion).add(this.body.position);
            const sA = projectOntoPath(path, cum, _anchorCarrier);
            this.uAnchor = Math.max(0, Math.min(beltCut, sA - this.bare));
            this.haveAnchor = true;
        }
        _anchorCarrier.copy(this.anchorBody).applyQuaternion(this.body.quaternion).add(this.body.position);
        const sA = projectOntoPath(path, cum, _anchorCarrier);
        const beltStart = Math.max(0, Math.min(Math.max(0, lPath - beltCut), sA - this.uAnchor));

        // Cable each side must supply. Both belts of a side end in one
        // U-shackle on the deck, and a single purchase cable runs from the
        // shackle to the deck sheave at the stanchion foot: the band outside
        // the panel, in 3-D from that shackle.
        const req2L = beltStart;
        const req2R = Math.max(0, lPath - beltCut - beltStart);
        const sheaveY = deckAt(spec.leftX) + spec.lowerLift * sin;
        const shackleY = deckAt(spec.leftX) + NET_SKIN_M * 2;
        const req = new Float64Array(2);
        req[0] = Math.hypot(req2L, sheaveY - shackleY);
        req[1] = Math.hypot(req2R, sheaveY - shackleY);

        // The engines: hold up to the (soft-started) cap, pay out past it.
        // The cable state lives in the LOWER slots; the UPPER slots mirror
        // it, each belt carrying half the shackle's pull.
        for (let side = 0; side < 2; side++) {
            const w = side === 0 ? BarricadeWire.LOWER_LEFT : BarricadeWire.LOWER_RIGHT;
            const u = side === 0 ? BarricadeWire.UPPER_LEFT : BarricadeWire.UPPER_RIGHT;
            this.wireReqLen[w] = req[side];
            this.wireReqLen[u] = req[side];
            const stretch = req[side] - this.wireLen[w];
            if (stretch <= 0) {
                this.wireTensionN[w] = 0;
                if (resting) {
                    this.wireLen[w] = Math.max(this.bare, req[side], this.wireLen[w] - spec.engineRetractMps * dt);
                }
            } else {
                const payout = this.wireLen[w] - this.bare;
                const ramp = spec.engineSoftStartM > 0
                    ? 0.2 + 0.8 * Math.min(1, payout / spec.engineSoftStartM)
                    : 1;
                const cap = spec.engineHoldN * ramp;
                const k = spec.wireAxialStiffnessN / Math.max(2, this.wireLen[w]);
                const over = stretch - cap / k;
                let left = stretch;
                if (over > 0) {
                    const let_out = Math.min(over, spec.enginePayoutMaxMps * dt);
                    this.wireLen[w] += let_out;
                    left -= let_out;
                }
                this.wireTensionN[w] = Math.min(cap, k * left);
            }
            this.wireLen[u] = this.wireLen[w];
            this.wireTensionN[w] *= 0.5;
            this.wireTensionN[u] = this.wireTensionN[w];
        }

        // Forces: each belt's share of its cable's tension acts along the
        // band's tangent where the belt leaves the airframe, at the height the load enters the
        // airframe — the upper belt over the spine, the lower under the
        // belly. Both sit close to the CG, so the couple is small and the
        // arrest ends on the nose gear rather than on the nose.
        this.force.set(0, 0, 0);
        this.torque.set(0, 0, 0);
        if (path.length > 2 && this.hasBody) {
            const A = path[1];
            const B = path[path.length - 2];
            const prevA = path[0];
            const nextB = path[path.length - 1];
            const cg = this.body.position;
            // The upper belt bears on the spine, the lower belt on the
            // belly/wing underside — the stripes carry the load into the
            // airframe there, not at the deck the belt happens to lie on.
            const yUpper = Math.min(cg.y + 0.8, deckAt(cg.x) + spec.height);
            const yLower = Math.max(cg.y - 0.6, deckAt(cg.x) + 0.2);
            const applyLeg = (from: XZ, to: XZ, tension: number, hookY: number) => {
                if (tension <= 0) return;
                const dx = to.x - from.x;
                const dz = to.z - from.z;
                const len = Math.hypot(dx, dz);
                if (len < 1e-6) return;
                const fx = (dx / len) * tension;
                const fz = (dz / len) * tension;
                this.force.x += fx;
                this.force.z += fz;
                _tmp.set(from.x - cg.x, hookY - cg.y, from.z - cg.z);
                // r × F with F horizontal.
                this.torque.x += _tmp.y * fz;
                this.torque.y += _tmp.z * fx - _tmp.x * fz;
                this.torque.z += -_tmp.y * fx;
            };
            applyLeg(A, prevA, this.wireTensionN[BarricadeWire.UPPER_LEFT], yUpper);
            applyLeg(B, nextB, this.wireTensionN[BarricadeWire.UPPER_RIGHT], yUpper);
            applyLeg(A, prevA, this.wireTensionN[BarricadeWire.LOWER_LEFT], yLower);
            applyLeg(B, nextB, this.wireTensionN[BarricadeWire.LOWER_RIGHT], yLower);
        }

        // Hooked stripes: stations on the contact arc with airframe just
        // inboard of the band. The band grazes the silhouette, so the probe
        // steps a little toward the airframe and asks what is under it —
        // wing, intake, nose or fin, at whatever height it sits.
        let mask = 0;
        if (path.length > 2 && this.bvh) {
            const sContactA = cum[1];
            const sContactB = cum[cum.length - 2];
            const cx = this.body.position.x;
            const cz = this.body.position.z;
            for (let s = 0; s < spec.stripes; s++) {
                const sS = beltStart + (beltCut * s) / (spec.stripes - 1);
                if (sS < sContactA - 0.3 || sS > sContactB + 0.3) continue;
                pointAt(path, cum, sS, _pt);
                const dx = cx - _pt.x;
                const dz = cz - _pt.z;
                const len = Math.hypot(dx, dz);
                if (len < 1e-6) continue;
                // Step toward the airframe rather than jump straight to the
                // full reach, and stop at the first real catch: a station
                // deep in the wing would otherwise overshoot clean past it
                // on one 3 m jump and land back on the bare fuselage, which
                // doesn't catch anything — only the wing, an intake, or the
                // fin do.
                const stepsToCg = 6;
                for (let k = 1; k <= stepsToCg; k++) {
                    const reach = (HOOK_REACH_M * k) / stepsToCg;
                    const px = _pt.x + (dx / len) * reach;
                    const pz = _pt.z + (dz / len) * reach;
                    const ceiling = deckAt(px) + spec.height;
                    const top = hullTopY(this.bvh, this.body, px, this.body.position.y + 8, pz);
                    if (top > -Infinity && !isBareFuselageHit(px, cx, top, ceiling)) {
                        mask |= 1 << s;
                        break;
                    }
                }
            }
        }

        // TEMP DIAGNOSTIC: real-mesh hook pattern doesn't match the fallback
        // hull's; dumping the numbers a real catch actually produces to find
        // where it diverges. Remove once explained.
        this._dbgLogAccum += dt;
        if (this._dbgLogAccum > 1) {
            this._dbgLogAccum = 0;
            let minX = Infinity, maxX = -Infinity;
            for (const p of sil) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); }
            console.log(
                '[barricade-dbg] mask=' + mask.toString(2).padStart(spec.stripes, '0'),
                'pathLen=' + path.length, 'beltStart=' + beltStart.toFixed(2), 'beltCut=' + beltCut.toFixed(2),
                'silSpan=[' + minX.toFixed(1) + ',' + maxX.toFixed(1) + ']', 'silPts=' + sil.length,
                'bodyPos=' + this.body.position.toArray().map(v => v.toFixed(1)).join(','),
            );
        }

        this.wrapping = true;
        this.hookedMask = mask;
        this.placement.bvh = this.bvh as TriangleBvh;
        this.placement.path = path;
        this.placement.cum = cum;
        this.placement.beltStart = beltStart;
        this.placement.hookedMask = mask;
        buildBarricadeNetNodes(this.layout, this.deploy, this.nodes, this.placement);
        this.nodesDirty = false;
    }

    // ---- read-out --------------------------------------------------------

    /** Force the webbing puts on the airframe this step (N, carrier-local). */
    airframeForce(out: THREE.Vector3): THREE.Vector3 {
        return out.copy(this.force);
    }

    /** Moment about the airframe's CG this step (N·m, carrier-local). */
    airframeTorque(out: THREE.Vector3): THREE.Vector3 {
        return out.copy(this.torque);
    }

    wirePaidOut(w: BarricadeWire): number {
        return Math.max(0, this.wireLen[w] - this.bare);
    }

    wireTension(w: BarricadeWire): number {
        return this.wireTensionN[w];
    }

    /** Bit s: stripe s bears on the airframe. */
    hookedStripeMask(): number {
        return this.hookedMask;
    }

    isWrapping(): boolean {
        return this.wrapping;
    }

    /** Copy the net's node positions into a snapshot block. */
    writeTo(out: Float32Array, offset = 0): number {
        if (this.nodesDirty) {
            buildBarricadeNetNodes(this.layout, this.deploy, this.nodes, null);
            this.nodesDirty = false;
        }
        out.set(this.nodes, offset);
        return this.nodes.length;
    }

    /**
     * Renderer read-out: four wire tensions (N), four payouts (m), a flags
     * word (bit 0 = airframe wrapped), and the hooked-stripe mask.
     */
    writeReadout(out: Float32Array, offset = 0): number {
        for (let w = 0; w < 4; w++) out[offset + w] = this.wireTensionN[w];
        for (let w = 0; w < 4; w++) out[offset + 4 + w] = this.wirePaidOut(w as BarricadeWire);
        out[offset + 8] = this.wrapping ? 1 : 0;
        out[offset + 9] = this.hookedMask;
        return 10;
    }
}
