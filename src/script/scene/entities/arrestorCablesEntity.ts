/**
 * Carrier arrestor cables: straight when idle, V-bent to the hook while trapped.
 * Renders in EntityFX so the thin lines stay visible over the carrier volume mesh.
 *
 * While latched, the V mid-point is the shared visual tip on the hinge→sheave
 * ray (same point the tailhook mesh uses) so arm and cable leg stay colinear.
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
import {
    arrestorCableLocals,
    arrestorCableStartWorld,
    ArrestorCableLocal,
    ARRESTOR_CARRIER_ORIGIN,
    latchedHookTipWorld,
} from './arrestorCables';

type CableLine = {
    local: ArrestorCableLocal;
    line: THREE.Line;
    positions: THREE.BufferAttribute;
};

export class ArrestorCablesEntity implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly root = new THREE.Object3D();
    private readonly cables: CableLine[] = [];
    private readonly hingeBody = new THREE.Vector3();
    private readonly hingeWorld = new THREE.Vector3();
    private readonly sheaveWorld = new THREE.Vector3();
    private readonly tipWorld = new THREE.Vector3();
    private readonly tipLocal = new THREE.Vector3();
    private readonly fallbackDir = new THREE.Vector3();
    private readonly invRoot = new THREE.Matrix4();

    constructor(
        materials: SceneMaterialManager,
        origin: THREE.Vector3,
        private readonly getPlayer: () => PlayerEntity,
    ) {
        this.root.position.copy(origin);

        const mat = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: PaletteCategory.SCENERY_ROAD_MAIN,
            depthWrite: false,
        });

        for (const local of arrestorCableLocals()) {
            const midX = (local.ax + local.bx) * 0.5;
            const midY = (local.ay + local.by) * 0.5;
            const midZ = (local.az + local.bz) * 0.5;
            const geom = new THREE.BufferGeometry();
            const positions = new THREE.BufferAttribute(new Float32Array([
                local.ax, local.ay, local.az,
                midX, midY, midZ,
                local.bx, local.by, local.bz,
            ]), 3);
            geom.setAttribute('position', positions);
            const line = new THREE.Line(geom, mat);
            line.onBeforeRender = updateUniforms;
            this.root.add(line);
            this.cables.push({ local, line, positions });
        }
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        const player = this.getPlayer();
        const fm = player.getFlightModel();
        let latch = -1;
        if (fm instanceof SimProxyFlightModel) {
            latch = fm.getArrestorLatch();
            if (latch >= 0) {
                player.getArrestorHookHingeBody(this.hingeBody);
                this.hingeWorld.copy(this.hingeBody)
                    .applyQuaternion(player.getDisplayQuaternion())
                    .add(player.getDisplayPosition());
                arrestorCableStartWorld(latch, ARRESTOR_CARRIER_ORIGIN, this.sheaveWorld);
                // Idle aft direction as degenerate fallback (body hinge→tip ≈ −Z/−Y).
                this.fallbackDir.set(0, -1, -1);
                latchedHookTipWorld(
                    this.hingeWorld, this.sheaveWorld, this.tipWorld, undefined, this.fallbackDir,
                );
                this.root.updateMatrixWorld(true);
                this.invRoot.copy(this.root.matrixWorld).invert();
                this.tipLocal.copy(this.tipWorld).applyMatrix4(this.invRoot);
            }
        }

        for (let i = 0; i < this.cables.length; i++) {
            const c = this.cables[i];
            const L = c.local;
            if (i === latch) {
                c.positions.setXYZ(0, L.ax, L.ay, L.az);
                c.positions.setXYZ(1, this.tipLocal.x, this.tipLocal.y, this.tipLocal.z);
                c.positions.setXYZ(2, L.bx, L.by, L.bz);
            } else {
                const midX = (L.ax + L.bx) * 0.5;
                const midY = (L.ay + L.by) * 0.5;
                const midZ = (L.az + L.bz) * 0.5;
                c.positions.setXYZ(0, L.ax, L.ay, L.az);
                c.positions.setXYZ(1, midX, midY, midZ);
                c.positions.setXYZ(2, L.bx, L.by, L.bz);
            }
            c.positions.needsUpdate = true;
            c.line.geometry.computeBoundingSphere();
        }
    }

    render3D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        // EntityFX draws after the carrier volume so thin lines stay visible.
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
