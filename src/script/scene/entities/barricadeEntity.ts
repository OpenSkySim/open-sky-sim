/**
 * Carrier emergency barricade, rendered the way a rigged one actually looks.
 *
 * Front elevation — two dark load-strap cables between the stanchion heads,
 * with the webbing panel of pale nylon engaging loops hung across the middle
 * and a bare run of cable out to each stanchion:
 *
 *   stanchion ┬━━━━━━━━━ upper load strap ━━━━━━━━━┬ stanchion
 *             ┃  ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )   ┃
 *             ┃   24 engaging loops over 100 ft    ┃   ~20 ft
 *             ┃  ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )   ┃
 *             ┴━━━━━━━━━ lower load strap ━━━━━━━━━┴
 *             │←5-10ft→│←──── 100 ft ────→│←5-10ft→│
 *
 * Seen from the side each loop is an arc, not a bar: the webbing hangs slack
 * and bellies aft toward the groove, which is why a rigged barricade reads as
 * a curtain of ribs. {@link barricadeLoopCurve} owns that drape.
 *
 * The stanchions are hinged into the deck and lie folded aft when stowed;
 * raising swings them through 90° and the webbing comes up with them, so the
 * deploy fraction drives one rotation and everything else follows from it.
 *
 * When an airframe is in the net the webbing is dragged downfield, coning back
 * to the stanchions and pulling the loops' drape flat.
 *
 * Draws in EntityFX with the same near-ribbon / far-line LOD split the arrestor
 * pendants use, so the webbing stays readable when it falls below a pixel.
 */
import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { SimProxyFlightModel } from '../../physics/model/simProxyFlightModel';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { attachToRenderList } from '../../render/renderList';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';
import { Entity } from '../entity';
import { Scene, SceneLayers } from '../scene';
import { PlayerEntity } from './player';
import { AircraftCollisionMesh } from './aircraftDef';
import { ARRESTOR_DECK_MID_X, ArrestorCarrierPose } from './arrestorCables';
import {
    BarricadeEngagement,
    BarricadeRig,
    BarricadeWebNode,
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_HEIGHT_M,
    BARRICADE_LOCAL_Z,
    BarricadeWrapProfile,
    BARRICADE_DECK_LOCAL_Y as DECK_Y,
    barricadeEngagementPullAt,
    barricadeLoopCurve,
    barricadeLoopStations,
    barricadeRig,
    barricadeSeatOnDeck,
    barricadeWireCurve,
    BARRICADE_WIRE_SAMPLES,
    computeBarricadeWeb,
    createBarricadeWrapProfile,
    foldCollisionHullIntoWrap,
    resetBarricadeWrapProfile,
} from './barricade';

/** Half-width of a load strap ribbon (m) — it is an arresting-gear cable, so thin. */
const LOAD_STRAP_HALF_W_M = 0.07;
/** Half-width of an engaging loop's webbing band (m) — a wide flat nylon strap. */
const LOOP_HALF_W_M = 0.16;
/** Points sampled along each loop's drape (ends included). */
const LOOP_SAMPLES = 9;
/** Stanchion cross-section (m). */
const STANCHION_THICKNESS_M = 0.34;
/** Camera distance (m) at which ribbons switch to 1px lines. */
const LOD_LINE_M = 350;
/** Hysteresis band (m) around the LOD switch. */
const LOD_HYSTERESIS_M = 25;
/** Below this deploy fraction nothing is drawn — the gear is flush in the deck. */
const VISIBLE_DEPLOY_EPS = 1e-3;
/**
 * Cap on collision-hull vertices folded into the wrap profile each frame.
 * A fighter's hull is well under this; the stride only bites on heavy meshes,
 * and the profile is a 0.75 m grid, so dropping a few vertices costs nothing.
 */
const WRAP_POINT_BUDGET = 3000;

export class BarricadeEntity implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly root = new THREE.Object3D();
    /** Stanchion hinge pivots (index 0 = −X side, 1 = +X side). */
    private readonly stanchions: THREE.Object3D[] = [];
    /** Load-strap ribbon segments, upper then lower, node i → i+1. */
    private readonly upperSegs: THREE.Mesh[] = [];
    private readonly lowerSegs: THREE.Mesh[] = [];
    /** One draped webbing band per engaging loop. */
    private readonly loopMeshes: THREE.Mesh[] = [];
    /** Far LOD: every strap as one 1px segment pair. */
    private readonly webLines: THREE.LineSegments;
    private readonly webLinePos: THREE.BufferAttribute;

    private nodes: BarricadeWebNode[] = [];

    private readonly sampleWorld = new THREE.Vector3();
    private readonly lodAnchorLocal = new THREE.Vector3();
    private readonly lodAnchorWorld = new THREE.Vector3();
    private readonly acLocal = new THREE.Vector3();
    private readonly loopScratch: { x: number; y: number; z: number }[] = [];
    private readonly beltTangent = { x: 1, z: 0 };
    private readonly strapPath: { x: number; y: number; z: number }[] = [];
    /** Airframe front hull in carrier-local space, rebuilt while engaged. */
    private readonly wrap: BarricadeWrapProfile = createBarricadeWrapProfile(DECK_Y);
    /** body → carrier-local, for folding collision vertices into {@link wrap}. */
    private readonly bodyToCarrier = new THREE.Matrix4();
    private readonly carrierToWorld = new THREE.Matrix4();
    private readonly wrapVert = new THREE.Vector3();
    private readonly unitScale = new THREE.Vector3(1, 1, 1);
    private readonly invQuat = new THREE.Quaternion();

    /** true = far LOD (lines), false = near LOD (mesh ribbons). */
    private useLineLod = false;
    /** Deploy fraction the geometry was last built for. */
    private builtDeploy = Number.NaN;
    /** Engagement stretch the geometry was last built for. */
    private builtStretch = Number.NaN;
    private builtAcLateral = Number.NaN;

    constructor(
        materials: SceneMaterialManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
        private readonly getPlayer: () => PlayerEntity,
        private readonly getDeploy: () => number,
        private readonly groundHeightAt: (x: number, z: number) => number = () => BARRICADE_DECK_LOCAL_Y,
        private readonly getCollisionMesh: () => AircraftCollisionMesh | undefined = () => undefined,
        /**
         * Rig fitted to the deck under the barricade. Everything — stanchions,
         * load straps, loops — is laid out from this, so a span pulled in to
         * clear the deck edge stays self-consistent.
         */
        private readonly getRig: () => BarricadeRig = () => barricadeRig(),
    ) {
        // Pale nylon webbing — the loops photograph off-white against the deck.
        const loopMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#e0dccb',
        }) as THREE.ShaderMaterial;
        // Load straps are arresting-gear cable: dark, and much thinner than the webbing.
        const strapMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#14171a',
        }) as THREE.ShaderMaterial;
        // A strap has no inside. These ribbons are built from a centreline out,
        // so which way they wind depends on which way the webbing runs — and
        // half of them wound away from the groove, leaving the net invisible to
        // a pilot flying into it.
        loopMat.side = THREE.DoubleSide;
        strapMat.side = THREE.DoubleSide;
        const stanchionMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#b9bdbd',
        });
        const lineMat = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            depthWrite: false,
            rawColor: '#cfcaba',
        });

        const rig = barricadeRig();
        this.nodes = rig.nodeX.map(x => ({ x, topY: 0, topZ: 0, botY: 0, botZ: 0 }));

        // Strap chain: a subdivided wire run out to each stanchion, plus one
        // segment between neighbouring loops. The wire runs need the extra
        // points so they can hang rather than being drawn dead straight.
        const strapSegs = 2 * (BARRICADE_WIRE_SAMPLES - 1) + (rig.loopX.length - 1);
        for (let i = 0; i < strapSegs; i++) {
            const upper = this.makeQuad(strapMat);
            const lower = this.makeQuad(strapMat);
            this.upperSegs.push(upper);
            this.lowerSegs.push(lower);
            this.root.add(upper);
            this.root.add(lower);
        }
        // Loops hang from the interior nodes only — the end spans are bare cable.
        for (let i = 1; i + 1 < this.nodes.length; i++) {
            const loop = this.makeStrip(loopMat, LOOP_SAMPLES);
            this.loopMeshes.push(loop);
            this.root.add(loop);
        }

        // Far LOD draws each loop as a single chord, so one segment apiece.
        const segCount = this.upperSegs.length + this.lowerSegs.length + this.loopMeshes.length;
        const lineGeom = new THREE.BufferGeometry();
        this.webLinePos = new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3);
        lineGeom.setAttribute('position', this.webLinePos);
        this.webLines = new THREE.LineSegments(lineGeom, lineMat);
        this.webLines.frustumCulled = false;
        this.webLines.onBeforeRender = updateUniforms;
        this.root.add(this.webLines);

        // Stanchions: a box authored along +Z from the hinge, so rotating −90°
        // about X stands it up. Stowed, it lies flat on the deck pointing aft.
        // Their stations are re-seated from the fitted rig every rebuild.
        for (const x of [rig.leftX, rig.rightX]) {
            const pivot = new THREE.Object3D();
            pivot.position.set(x, 0, BARRICADE_LOCAL_Z);
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(STANCHION_THICKNESS_M, STANCHION_THICKNESS_M, BARRICADE_HEIGHT_M),
                stanchionMat,
            );
            box.position.set(0, 0, BARRICADE_HEIGHT_M * 0.5);
            box.frustumCulled = false;
            box.onBeforeRender = updateUniforms;
            pivot.add(box);
            this.stanchions.push(pivot);
            this.root.add(pivot);
        }

        this.lodAnchorLocal.set(
            rig.midX, BARRICADE_DECK_LOCAL_Y + BARRICADE_HEIGHT_M * 0.5, BARRICADE_LOCAL_Z);
        this.setVisible(false);
    }

    /** Ribbon strip of `samples` cross-sections (2 verts each), for a draped loop. */
    private makeStrip(mat: THREE.Material, samples: number): THREE.Mesh {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(samples * 2 * 3), 3));
        const index: number[] = [];
        for (let i = 0; i + 1 < samples; i++) {
            const a = i * 2;
            index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
        }
        geom.setIndex(index);
        geom.computeBoundingSphere();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.frustumCulled = false;
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }

    private makeQuad(mat: THREE.Material): THREE.Mesh {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));
        geom.setIndex([0, 1, 2, 2, 1, 3]);
        geom.computeBoundingSphere();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.frustumCulled = false;
        mesh.onBeforeRender = updateUniforms;
        return mesh;
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        this.rebuild();
    }

    /** Sync root TRS from the live carrier pose. */
    private syncRootPose(): ArrestorCarrierPose {
        const pose = this.getCarrierPose();
        this.root.position.copy(pose.position as THREE.Vector3);
        if (pose.quaternion) {
            this.root.quaternion.copy(pose.quaternion);
        } else {
            this.root.quaternion.identity();
        }
        return pose;
    }

    /**
     * Deck surface in carrier-local Y under a local point, straight from the
     * ground sampler.
     *
     * No floor is applied. A stanchion is bolted to the deck, so its foot has
     * to follow whatever the deck actually does there — clamping the sample up
     * to the flat datum is what left a foot hanging in the air off the narrow
     * forward end of the angled deck.
     */
    private deckLocalY(localX: number, localZ: number): number {
        this.sampleWorld.set(localX, 0, localZ).applyQuaternion(this.root.quaternion);
        const sampled = this.groundHeightAt(
            this.root.position.x + this.sampleWorld.x,
            this.root.position.z + this.sampleWorld.z,
        );
        return sampled - this.root.position.y;
    }

    /**
     * Deck height to lay webbing on: the raw probe, seated onto the flight deck
     * the rig was fitted to. Stops a node whose probe lands on the island — or
     * off the edge in open water — from dragging the net with it.
     */
    private webDeckLocalY(localX: number, rig: BarricadeRig): number {
        return barricadeSeatOnDeck(rig, this.deckLocalY(localX, BARRICADE_LOCAL_Z));
    }

    private setVisible(v: boolean): void {
        this.root.visible = v;
    }

    /**
     * Downfield pull of an engaged airframe, in carrier-local metres past the
     * webbing plane, plus its lateral offset. Returns null when nothing is in the net.
     */
    private engagement(pose: ArrestorCarrierPose): BarricadeEngagement | null {
        const player = this.getPlayer();
        const fm = player.getFlightModel();
        if (!(fm instanceof SimProxyFlightModel) || !fm.getBarricadeEngaged()) {
            return null;
        }
        player.updateDisplayTransform();
        this.acLocal.copy(player.getDisplayPosition()).sub(pose.position as THREE.Vector3);
        if (pose.quaternion) {
            this.invQuat.copy(pose.quaternion).invert();
            this.acLocal.applyQuaternion(this.invQuat);
        }
        // Landing runs toward −Z, so past the plane means a smaller local Z.
        return {
            stretch: Math.max(0, BARRICADE_LOCAL_Z - this.acLocal.z),
            lateral: this.acLocal.x,
            profile: this.buildWrapProfile(pose, player),
        };
    }

    /**
     * Fold the airframe's collision hull into the wrap profile, in carrier-local
     * space. Returns null when the aircraft has no collision mesh, in which case
     * the webbing falls back to coning toward its centreline.
     */
    private buildWrapProfile(
        pose: ArrestorCarrierPose,
        player: PlayerEntity,
    ): BarricadeWrapProfile | null {
        const mesh = this.getCollisionMesh();
        if (!mesh || mesh.triangles.length < 9) return null;

        resetBarricadeWrapProfile(this.wrap, this.webDeckLocalY(ARRESTOR_DECK_MID_X, this.getRig()));

        // body → world → carrier-local, collapsed into one matrix.
        this.bodyToCarrier.compose(
            player.getDisplayPosition(),
            player.getDisplayQuaternion(),
            this.unitScale,
        );
        this.carrierToWorld.compose(
            pose.position as THREE.Vector3,
            pose.quaternion ?? this.invQuat.identity(),
            this.unitScale,
        );
        this.bodyToCarrier.premultiply(this.carrierToWorld.invert());

        foldCollisionHullIntoWrap(
            this.wrap, mesh.triangles, this.bodyToCarrier, WRAP_POINT_BUDGET, this.wrapVert,
        );
        return this.wrap.touched ? this.wrap : null;
    }

    /** Recompute every node and strap; cheap, and skipped when nothing moved. */
    private rebuild(): void {
        const pose = this.syncRootPose();
        const deploy = Math.max(0, Math.min(1, this.getDeploy()));
        if (deploy < VISIBLE_DEPLOY_EPS) {
            this.setVisible(false);
            this.builtDeploy = deploy;
            return;
        }
        this.setVisible(true);

        const eng = this.engagement(pose);
        const stretch = eng?.stretch ?? 0;
        const acLateral = eng?.lateral ?? 0;
        if (
            !eng &&
            deploy === this.builtDeploy &&
            stretch === this.builtStretch &&
            acLateral === this.builtAcLateral
        ) {
            return;
        }
        this.builtDeploy = deploy;
        this.builtStretch = stretch;
        this.builtAcLateral = acLateral;

        // Same hinge rotation the shared web math uses, applied to the visible
        // arms, with each foot re-seated on the deck the rig was fitted to.
        const rig = this.getRig();
        const feet = [rig.leftX, rig.rightX];
        for (let i = 0; i < this.stanchions.length; i++) {
            const pivot = this.stanchions[i];
            pivot.position.x = feet[i];
            pivot.position.y = this.webDeckLocalY(feet[i], rig);
            pivot.rotation.x = -deploy * Math.PI * 0.5;
        }
        this.lodAnchorLocal.x = rig.midX;
        this.nodes = computeBarricadeWeb(deploy, x => this.webDeckLocalY(x, rig), eng, rig);

        let line = 0;
        this.buildStrapPath(true);
        this.placeStrapChain(this.upperSegs, this.strapPath);
        line = this.pushPolyline(line, this.strapPath);
        this.buildStrapPath(false);
        this.placeStrapChain(this.lowerSegs, this.strapPath);
        line = this.pushPolyline(line, this.strapPath);
        // Loops ride the load straps, so a fuselage parting the net moves them
        // off their laced stations before anything is drawn.
        const stations = barricadeLoopStations(this.nodes, eng?.profile ?? null);
        for (let i = 0; i < this.loopMeshes.length; i++) {
            const n = stations[i].node;
            const pull = barricadeEngagementPullAt(n.x, eng, rig);
            this.beltTangentAt(n.x, this.beltTangent);
            this.placeLoop(
                this.loopMeshes[i], n, deploy, pull, eng?.profile ?? null,
                this.beltTangent.x, this.beltTangent.z,
            );
            // Far LOD: the drape is sub-pixel by then, so a straight chord will do.
            line = this.pushLine(line, n.x, n.botY, n.botZ, n.x, n.topY, n.topZ);
        }
        this.webLinePos.needsUpdate = true;
        this.webLines.geometry.computeBoundingSphere();
        this.applyLodVisibility();
    }

    /**
     * Flat ribbon a → b, widened perpendicular to the strap *and* to the deck
     * normal, so a vertical strap widens laterally and a horizontal one widens
     * across the deck. Both stay a readable band from the cockpit.
     */
    private placeRibbon(
        mesh: THREE.Mesh,
        ax: number, ay: number, az: number,
        bx: number, by: number, bz: number,
        halfW: number,
    ): void {
        const dx = bx - ax;
        const dy = by - ay;
        const dz = bz - az;
        const len = Math.hypot(dx, dy, dz);
        if (len < 1e-4) {
            mesh.visible = false;
            return;
        }
        // Widen about whichever axis keeps the ribbon facing the landing lane:
        // lateral straps get thickness in Z, vertical straps get it in X.
        const horizontal = Math.hypot(dx, dz) >= Math.abs(dy);
        const hx = horizontal ? (-dz / len) * halfW : halfW;
        const hz = horizontal ? (dx / len) * halfW : 0;

        const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        pos.setXYZ(0, ax - hx, ay, az - hz);
        pos.setXYZ(1, ax + hx, ay, az + hz);
        pos.setXYZ(2, bx - hx, by, bz - hz);
        pos.setXYZ(3, bx + hx, by, bz + hz);
        pos.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();
    }

    /**
     * Lay one engaging loop's webbing band along its drape. The band widens
     * laterally, so head-on it is a strap of constant width and from the side
     * the arc shows — which is how the loops read in the groove.
     */
    private placeLoop(
        mesh: THREE.Mesh,
        node: BarricadeWebNode,
        deploy: number,
        pull: number,
        profile: BarricadeWrapProfile | null,
        tangentX: number,
        tangentZ: number,
    ): void {
        const pts = barricadeLoopCurve(node, deploy, LOOP_SAMPLES, pull, this.loopScratch, profile);
        const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        // The band is sewn onto the load strap, so its width lies along the
        // strap. Once an airframe drags the middle of the net downfield the
        // straps no longer run straight across the deck, and a strip still
        // widened along X sits skewed across the webbing it belongs to.
        const hx = tangentX * LOOP_HALF_W_M;
        const hz = tangentZ * LOOP_HALF_W_M;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            pos.setXYZ(i * 2, p.x - hx, p.y, p.z - hz);
            pos.setXYZ(i * 2 + 1, p.x + hx, p.y, p.z + hz);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();
    }

    /**
     * Unit direction of the load straps at a lateral station, in the deck plane.
     *
     * Both straps share one downfield offset, so they run parallel and a single
     * tangent orients every strip hung between them.
     */
    private beltTangentAt(x: number, out: { x: number; z: number }): void {
        const n = this.nodes;
        let i = 1;
        while (i < n.length - 1 && n[i].x < x) i++;
        const a = n[i - 1];
        const b = n[i];
        const dx = b.x - a.x;
        const dz = b.botZ - a.botZ;
        const len = Math.hypot(dx, dz);
        if (len < 1e-6) {
            out.x = 1;
            out.z = 0;
            return;
        }
        out.x = dx / len;
        out.z = dz / len;
    }

    /**
     * Whole run of one load strap: sagging wire out from the stanchion, the
     * webbing panel through every loop, then the wire back out to the far
     * stanchion.
     */
    private buildStrapPath(upper: boolean): void {
        const n = this.nodes;
        const at = (i: number) => ({
            x: n[i].x,
            y: upper ? n[i].topY : n[i].botY,
            z: upper ? n[i].topZ : n[i].botZ,
        });
        const path = this.strapPath;
        path.length = 0;
        const left = barricadeWireCurve(at(0), at(1), BARRICADE_LOCAL_Z - n[1].botZ);
        for (const p of left) path.push(p);
        for (let i = 2; i < n.length - 1; i++) path.push(at(i));
        const right = barricadeWireCurve(
            at(n.length - 1), at(n.length - 2), BARRICADE_LOCAL_Z - n[n.length - 2].botZ,
        );
        // Authored stanchion-outwards, so it reverses onto the end of the run.
        for (let i = right.length - 2; i >= 0; i--) path.push(right[i]);
    }

    private placeStrapChain(
        segs: readonly THREE.Mesh[],
        path: readonly { x: number; y: number; z: number }[],
    ): void {
        for (let i = 0; i < segs.length; i++) {
            if (i + 1 >= path.length) {
                segs[i].visible = false;
                continue;
            }
            const a = path[i];
            const b = path[i + 1];
            this.placeRibbon(segs[i], a.x, a.y, a.z, b.x, b.y, b.z, LOAD_STRAP_HALF_W_M);
        }
    }

    private pushPolyline(i: number, path: readonly { x: number; y: number; z: number }[]): number {
        let at = i;
        for (let k = 1; k < path.length; k++) {
            at = this.pushLine(at, path[k - 1].x, path[k - 1].y, path[k - 1].z,
                path[k].x, path[k].y, path[k].z);
        }
        return at;
    }

    private pushLine(
        i: number,
        ax: number, ay: number, az: number,
        bx: number, by: number, bz: number,
    ): number {
        this.webLinePos.setXYZ(i, ax, ay, az);
        this.webLinePos.setXYZ(i + 1, bx, by, bz);
        return i + 2;
    }

    private updateLodFromCamera(camera: THREE.Camera): void {
        this.lodAnchorWorld.copy(this.lodAnchorLocal)
            .applyQuaternion(this.root.quaternion)
            .add(this.root.position);
        const dist = camera.position.distanceTo(this.lodAnchorWorld);
        if (this.useLineLod) {
            if (dist < LOD_LINE_M - LOD_HYSTERESIS_M) this.useLineLod = false;
        } else if (dist > LOD_LINE_M + LOD_HYSTERESIS_M) {
            this.useLineLod = true;
        }
        this.applyLodVisibility();
    }

    private applyLodVisibility(): void {
        const near = !this.useLineLod;
        for (const m of this.upperSegs) m.visible = near;
        for (const m of this.lowerSegs) m.visible = near;
        for (const m of this.loopMeshes) m.visible = near;
        this.webLines.visible = !near;
    }

    render3D(
        _targetWidth: number,
        _targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        // Rebuild after the combat-sim pump so the stretched net tracks the airframe.
        this.rebuild();
        if (!this.root.visible) {
            return;
        }
        this.updateLodFromCamera(camera);
        const list = lists.get(SceneLayers.EntityFX);
        if (list) {
            attachToRenderList(list, this.root);
        }
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        //
    }
}
