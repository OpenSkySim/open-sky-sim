/**
 * Carrier emergency barricade, drawn from the webbing the sim actually solved.
 *
 * Front elevation — two dark load belts between the stanchion heads, with the
 * panel of pale nylon stripes hung across the middle and a bare run of cable out
 * to each stanchion:
 *
 *   stanchion ┬━━━━━━━━━━ upper load belt ━━━━━━━━━━┬ stanchion
 *             ┃  ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )   ┃
 *             ┃    24 stripes over 100 ft          ┃   ~20 ft
 *             ┃  ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )   ┃
 *             ┴━━━━━━━━━━ lower load belt ━━━━━━━━━┴
 *             │←5-10ft→│←──── 100 ft ────→│←5-10ft→│
 *
 * This entity owns no geometry of its own beyond the stanchions. Every belt,
 * stripe and wire is a polyline through particles solved in the sim worker by
 * {@link ./barricadeSolver} and carried across in the snapshot, so the net that
 * is drawn is the net that is simulated — not a second model of it fitted to an
 * aircraft pose that would already be a frame stale. What is left here is the
 * ribbon work: turning those polylines into bands wide enough to read from the
 * cockpit, and the near-ribbon / far-line LOD split the arrestor pendants use.
 *
 * The stanchions are hinged into the deck and lie folded aft when stowed, so the
 * deploy fraction drives one rotation and the webbing follows because it is
 * laced to fittings that moved.
 */
import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { Font, TextAlignment } from '../../render/screen/text';
import { attachToRenderList } from '../../render/renderList';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';
import { Entity } from '../entity';
import { Scene, SceneLayers } from '../scene';
import { ArrestorCarrierPose } from './arrestorCables';
import {
    BarricadeRig,
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_HEIGHT_M,
    BARRICADE_LOCAL_Z,
    barricadeRig,
} from './barricade';
import {
    BarricadeLayout,
    BarricadeWire,
    barricadeSolverSpecForRig,
} from './barricadeSolver';

/** Half-width of a load belt ribbon (m) — it is arresting-gear cable, so thin. */
const LOAD_BELT_HALF_W_M = 0.07;
/** Half-width of a stripe's webbing band (m) — a wide flat nylon strap. */
const STRIPE_HALF_W_M = 0.16;
/** Stanchion cross-section (m). */
const STANCHION_THICKNESS_M = 0.34;
/** Camera distance (m) at which ribbons switch to 1px lines. */
const LOD_LINE_M = 350;
/** Hysteresis band (m) around the LOD switch. */
const LOD_HYSTERESIS_M = 25;
/** Below this deploy fraction nothing is drawn — the gear is flush in the deck. */
const VISIBLE_DEPLOY_EPS = 1e-3;

export class BarricadeEntity implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly root = new THREE.Object3D();
    /** Stanchion hinge pivots (index 0 = −X side, 1 = +X side). */
    private readonly stanchions: THREE.Object3D[] = [];
    /** Belt ribbon segments, upper then lower. */
    private readonly upperSegs: THREE.Mesh[] = [];
    private readonly lowerSegs: THREE.Mesh[] = [];
    /** Bare wire ribbon segments, four runs' worth end to end. */
    private readonly wireSegs: THREE.Mesh[] = [];
    /** One draped webbing band per stripe. */
    private readonly stripeMeshes: THREE.Mesh[] = [];
    /** Far LOD: every run as 1px segments. */
    private readonly webLines: THREE.LineSegments;
    private readonly webLinePos: THREE.BufferAttribute;
    /** Debug visualization: black circles at every node. */
    private readonly debugNodes: THREE.Points;
    private readonly debugNodePos: THREE.BufferAttribute;

    /**
     * Where each particle sits in the snapshot block.
     *
     * Rebuilt whenever the deck probe refits the span, from the same spec the
     * sim laces its rig with — neither side is told the layout, both work it
     * out, so they cannot disagree about which float is which.
     */
    private layout: BarricadeLayout;
    private layoutRig: BarricadeRig;

    private readonly sampleWorld = new THREE.Vector3();
    private readonly lodAnchorLocal = new THREE.Vector3();
    private readonly lodAnchorWorld = new THREE.Vector3();
    private readonly tangent = { x: 1, z: 0 };

    /**
     * Far-LOD state, per camera.
     *
     * Not one flag for the entity: the scene is walked once per render layer,
     * each with its own camera, so a single flag is decided by whichever layer
     * happens to be built last. One distant secondary camera then pins the
     * webbing to 1-pixel lines no matter how close the view you are actually
     * looking through — which is what it did, and why the net drew as a few
     * threads instead of a curtain of straps.
     */
    private readonly lineLodByCamera = new WeakMap<THREE.Camera, boolean>();
    private useLineLod = false;

    constructor(
        materials: SceneMaterialManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
        private readonly getDeploy: () => number,
        /**
         * Carrier-local particle positions of the rigged net, three floats
         * each, or null before the sim has published one.
         */
        private readonly getNodes: () => Float32Array | null,
        private readonly groundHeightAt: (x: number, z: number) => number = () => BARRICADE_DECK_LOCAL_Y,
        /**
         * Rig fitted to the deck under the barricade. Everything — stanchions,
         * belts, stripes — is laid out from this, so a span pulled in to clear
         * the deck edge stays self-consistent.
         */
        private readonly getRig: () => BarricadeRig = () => barricadeRig(),
    ) {
        // Pale nylon webbing — the stripes photograph off-white against the deck.
        const stripeMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#e0dccb',
        }) as THREE.ShaderMaterial;
        // Upper belt: green solid (no alternating color)
        const upperBeltMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#00cc00',
        }) as THREE.ShaderMaterial;
        // Lower belt: light blue solid (no alternating color)
        const lowerBeltMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#6699ff',
        }) as THREE.ShaderMaterial;
        // Auxiliary cables (upper wires): brown
        const auxCableMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#8b6f47',
        }) as THREE.ShaderMaterial;
        // Arresting wire: red solid (no alternating color)
        const arrestingWireMat = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_TREE_SHADOW,
            shaded: false,
            depthWrite: false,
            colorDither: false,
            rawColor: '#ff3333',
        }) as THREE.ShaderMaterial;
        // A strap has no inside. These ribbons are built from a centreline out,
        // so which way they wind depends on which way the webbing runs — and
        // half of them wound away from the groove, leaving the net invisible to
        // a pilot flying into it.
        stripeMat.side = THREE.DoubleSide;
        upperBeltMat.side = THREE.DoubleSide;
        lowerBeltMat.side = THREE.DoubleSide;
        auxCableMat.side = THREE.DoubleSide;
        arrestingWireMat.side = THREE.DoubleSide;
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
        this.layoutRig = rig;
        this.layout = this.layoutFor(rig);
        const { stripes, stripeNodes, wireNodes } = this.layout.spec;

        // The mesh budget is fixed: refitting the span moves the stations, it
        // never changes how many of anything there are.
        for (let i = 0; i + 1 < this.layout.beltNodes; i++) {
            const upper = this.makeQuad(upperBeltMat);
            const lower = this.makeQuad(lowerBeltMat);
            this.upperSegs.push(upper);
            this.lowerSegs.push(lower);
            this.root.add(upper);
            this.root.add(lower);
        }
        for (let i = 0; i < 4 * (wireNodes + 1); i++) {
            // Upper wires (0-1) are auxiliary cables (brown), lower wires (2-3) are arresting wires
            const wireIndex = Math.floor(i / (wireNodes + 1));
            const mat = wireIndex >= 2 ? arrestingWireMat : auxCableMat;
            const seg = this.makeQuad(mat);
            this.wireSegs.push(seg);
            this.root.add(seg);
        }
        for (let i = 0; i < stripes; i++) {
            const strip = this.makeStrip(stripeMat, stripeNodes);
            this.stripeMeshes.push(strip);
            this.root.add(strip);
        }

        // Far LOD: the belts and wires keep their shape, and each stripe
        // collapses to the chord between its fittings — the drape is well under
        // a pixel by the time this cuts in.
        const segCount = this.upperSegs.length + this.lowerSegs.length
            + this.wireSegs.length + this.stripeMeshes.length;
        const lineGeom = new THREE.BufferGeometry();
        this.webLinePos = new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3);
        lineGeom.setAttribute('position', this.webLinePos);
        this.webLines = new THREE.LineSegments(lineGeom, lineMat);
        this.webLines.frustumCulled = false;
        this.webLines.onBeforeRender = updateUniforms;
        this.root.add(this.webLines);

        // Debug nodes: black circles at every particle
        const debugGeom = new THREE.BufferGeometry();
        this.debugNodePos = new THREE.BufferAttribute(new Float32Array(this.layout.count * 3), 3);
        debugGeom.setAttribute('position', this.debugNodePos);
        const debugMat = new THREE.PointsMaterial({
            color: 0x000000,
            size: 0.15,
            sizeAttenuation: true,
        });
        this.debugNodes = new THREE.Points(debugGeom, debugMat);
        this.debugNodes.frustumCulled = false;
        this.debugNodes.onBeforeRender = updateUniforms;
        this.root.add(this.debugNodes);

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

    private layoutFor(rig: BarricadeRig): BarricadeLayout {
        return new BarricadeLayout(
            barricadeSolverSpecForRig(rig.leftX, rig.rightX, rig.deckY),
        );
    }

    /** Ribbon strip of `samples` cross-sections (2 verts each), for a draped stripe. */
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
    private syncRootPose(): void {
        const pose = this.getCarrierPose();
        this.root.position.copy(pose.position as THREE.Vector3);
        if (pose.quaternion) {
            this.root.quaternion.copy(pose.quaternion);
        } else {
            this.root.quaternion.identity();
        }
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

    private setVisible(visible: boolean): void {
        this.root.visible = visible;
    }

    /** Re-place every ribbon from the particles the sim last published. */
    private rebuild(): void {
        this.syncRootPose();
        const deploy = Math.max(0, Math.min(1, this.getDeploy()));
        const nodes = this.getNodes();
        if (deploy < VISIBLE_DEPLOY_EPS || !nodes) {
            this.setVisible(false);
            return;
        }
        this.setVisible(true);

        const rig = this.getRig();
        if (rig !== this.layoutRig) {
            this.layoutRig = rig;
            this.layout = this.layoutFor(rig);
        }
        if (nodes.length < this.layout.count * 3) {
            // The sim is rigging a net this entity is not laid out for; drawing
            // it would read the wrong floats as positions.
            this.setVisible(false);
            return;
        }

        // The stanchions are the one thing not solved: they are structure, and
        // the hydraulics put them exactly where the deploy fraction says.
        const feet = [rig.leftX, rig.rightX];
        for (let i = 0; i < this.stanchions.length; i++) {
            const pivot = this.stanchions[i];
            pivot.position.x = feet[i];
            pivot.position.y = this.deckLocalY(feet[i], BARRICADE_LOCAL_Z);
            pivot.rotation.x = -deploy * Math.PI * 0.5;
        }
        this.lodAnchorLocal.x = rig.midX;

        let line = 0;
        line = this.placeBelt(nodes, true, this.upperSegs, line);
        line = this.placeBelt(nodes, false, this.lowerSegs, line);
        line = this.placeWires(nodes, line);
        line = this.placeStripes(nodes, line);
        this.webLinePos.needsUpdate = true;
        this.webLines.geometry.computeBoundingSphere();

        // Update debug nodes at every particle position
        for (let i = 0; i < this.layout.count; i++) {
            this.debugNodePos.setXYZ(i, nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]);
        }
        this.debugNodePos.needsUpdate = true;
        this.debugNodes.geometry.computeBoundingSphere();

        this.applyLodVisibility();
    }

    private nodeX(nodes: Float32Array, i: number): number {
        return nodes[i * 3];
    }

    private nodeY(nodes: Float32Array, i: number): number {
        return nodes[i * 3 + 1];
    }

    private nodeZ(nodes: Float32Array, i: number): number {
        return nodes[i * 3 + 2];
    }

    private placeBelt(
        nodes: Float32Array,
        upper: boolean,
        segs: readonly THREE.Mesh[],
        lineAt: number,
    ): number {
        let line = lineAt;
        for (let i = 0; i + 1 < this.layout.beltNodes; i++) {
            const a = this.layout.beltNodeIndex(upper, i);
            const b = this.layout.beltNodeIndex(upper, i + 1);
            this.placeRibbon(
                segs[i],
                this.nodeX(nodes, a), this.nodeY(nodes, a), this.nodeZ(nodes, a),
                this.nodeX(nodes, b), this.nodeY(nodes, b), this.nodeZ(nodes, b),
                LOAD_BELT_HALF_W_M,
            );
            line = this.pushLine(
                line,
                this.nodeX(nodes, a), this.nodeY(nodes, a), this.nodeZ(nodes, a),
                this.nodeX(nodes, b), this.nodeY(nodes, b), this.nodeZ(nodes, b),
            );
        }
        return line;
    }

    private placeWires(nodes: Float32Array, lineAt: number): number {
        let line = lineAt;
        let seg = 0;
        const per = this.layout.spec.wireNodes + 1;
        for (let w = 0; w < 4; w++) {
            for (let j = 0; j < per; j++) {
                const a = this.layout.wireNodeIndex(w as BarricadeWire, j);
                const b = this.layout.wireNodeIndex(w as BarricadeWire, j + 1);
                this.placeRibbon(
                    this.wireSegs[seg++],
                    this.nodeX(nodes, a), this.nodeY(nodes, a), this.nodeZ(nodes, a),
                    this.nodeX(nodes, b), this.nodeY(nodes, b), this.nodeZ(nodes, b),
                    LOAD_BELT_HALF_W_M,
                );
                line = this.pushLine(
                    line,
                    this.nodeX(nodes, a), this.nodeY(nodes, a), this.nodeZ(nodes, a),
                    this.nodeX(nodes, b), this.nodeY(nodes, b), this.nodeZ(nodes, b),
                );
            }
        }
        return line;
    }

    /**
     * Lay each stripe's webbing band along the drape the solver gave it.
     *
     * The band is sewn onto the belt, so its width lies *along* the belt rather
     * than across the deck: once an airframe has driven the middle of the net
     * downfield the belts no longer run straight, and a band still widened along
     * X sits skewed across the webbing it belongs to.
     */
    private placeStripes(nodes: Float32Array, lineAt: number): number {
        let line = lineAt;
        const samples = this.layout.spec.stripeNodes;
        for (let s = 0; s < this.stripeMeshes.length; s++) {
            this.beltTangentAt(nodes, s, this.tangent);
            // Perpendicular to belt tangent: rotate 90° in the deck plane
            const hx = -this.tangent.z * STRIPE_HALF_W_M;
            const hz = this.tangent.x * STRIPE_HALF_W_M;
            const mesh = this.stripeMeshes[s];
            const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
            for (let j = 0; j < samples; j++) {
                const p = this.layout.stripeNodeIndex(s, j);
                const x = this.nodeX(nodes, p);
                const y = this.nodeY(nodes, p);
                const z = this.nodeZ(nodes, p);
                pos.setXYZ(j * 2, x - hx, y, z - hz);
                pos.setXYZ(j * 2 + 1, x + hx, y, z + hz);
            }
            pos.needsUpdate = true;
            mesh.geometry.computeBoundingSphere();

            const lo = this.layout.stripeNodeIndex(s, 0);
            const hi = this.layout.stripeNodeIndex(s, samples - 1);
            line = this.pushLine(
                line,
                this.nodeX(nodes, lo), this.nodeY(nodes, lo), this.nodeZ(nodes, lo),
                this.nodeX(nodes, hi), this.nodeY(nodes, hi), this.nodeZ(nodes, hi),
            );
        }
        return line;
    }

    /** Unit direction of the upper belt at a stripe's fitting, in the deck plane. */
    private beltTangentAt(nodes: Float32Array, stripe: number, out: { x: number; z: number }): void {
        const station = this.layout.stripeBeltNode(stripe);
        const i = Math.max(1, Math.min(this.layout.beltNodes - 2, station));
        const a = this.layout.beltNodeIndex(true, i - 1);
        const b = this.layout.beltNodeIndex(true, i + 1);
        const dx = this.nodeX(nodes, b) - this.nodeX(nodes, a);
        const dz = this.nodeZ(nodes, b) - this.nodeZ(nodes, a);
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
     * Flat ribbon a → b, widened perpendicular to the run *and* to the deck
     * normal, so a vertical run widens laterally and a horizontal one widens
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
        // lateral runs get thickness in Z, vertical runs get it in X.
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
        let far = this.lineLodByCamera.get(camera) ?? false;
        if (far) {
            if (dist < LOD_LINE_M - LOD_HYSTERESIS_M) far = false;
        } else if (dist > LOD_LINE_M + LOD_HYSTERESIS_M) {
            far = true;
        }
        this.lineLodByCamera.set(camera, far);
        this.useLineLod = far;
        this.applyLodVisibility();
    }

    private applyLodVisibility(): void {
        const near = !this.useLineLod;
        for (const m of this.upperSegs) m.visible = near;
        for (const m of this.lowerSegs) m.visible = near;
        for (const m of this.wireSegs) m.visible = near;
        for (const m of this.stripeMeshes) m.visible = near;
        this.webLines.visible = !near;
    }

    render3D(
        _targetWidth: number,
        _targetHeight: number,
        camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        // Rebuild after the combat-sim pump so the net tracks the airframe.
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
        targetWidth: number,
        targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        painter: CanvasPainter,
        _palette: Palette,
    ): void {
        if (!this.root.visible) return;
        const nodes = this.getNodes();
        if (!nodes) return;

        // Draw debug wire length box in upper right corner
        const font = Font.HUD_SMALL;
        const boxW = 160;
        const boxH = 110;
        const margin = 10;
        const x = targetWidth - boxW - margin;
        const y = margin;

        // Background
        painter.setBackground('#00000080');
        painter.fillRect(x, y, boxW, boxH);

        // Border
        painter.setColor('#ffffff');
        painter.setLineWidth(1);
        painter.rectangle(x, y, boxW, boxH, false);

        // Title
        painter.text(font, x + 5, y + 8, 'Wire Lengths', '#ffffff', TextAlignment.LEFT);

        // Wire information
        const wireColors = ['#8b6f47', '#8b6f47', '#ff3333', '#ff3333'];
        const wireNames = ['Upper-L', 'Upper-R', 'Lower-L', 'Lower-R'];
        const layout = this.layout;

        for (let w = 0; w < 4; w++) {
            const a = layout.wireNodeIndex(w as BarricadeWire, 0);
            const b = layout.wireNodeIndex(w as BarricadeWire, layout.spec.wireNodes + 1);
            const ax = nodes[a * 3], ay = nodes[a * 3 + 1], az = nodes[a * 3 + 2];
            const bx = nodes[b * 3], by = nodes[b * 3 + 1], bz = nodes[b * 3 + 2];
            const len = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2 + (bz - az) ** 2);

            const lineY = y + 25 + w * 20;

            // Draw colored dot
            painter.setBackground(wireColors[w]);
            painter.fillRect(x + 8, lineY - 4, 6, 6);

            // Draw text
            painter.text(font, x + 20, lineY, `${wireNames[w]}: ${len.toFixed(2)}m`, '#ffffff', TextAlignment.LEFT);
        }
    }
}
