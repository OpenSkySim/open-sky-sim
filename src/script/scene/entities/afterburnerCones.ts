import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { F16AfterburnerConeDither, getF16AfterburnerConeLengthM } from '../../physics/f16Engine';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType, SceneMaterialUniforms } from '../materials/materials';
import { updateUniforms } from '../utils';

/** Twin nozzle origins in aircraft body space (+Z forward, exhaust −Z). */
const LEFT_NOZZLE = new THREE.Vector3(-0.75, 0.05, -4.85);
const RIGHT_NOZZLE = new THREE.Vector3(0.75, 0.05, -4.85);

/** Scales exhaust plume length and cross-section. */
const CONE_SIZE = 0.5;

function writeConeGeometry(geometry: THREE.BufferGeometry, length: number): void {
    // Wide at the nozzle (engine), tapering to a narrow tip aft.
    const nozzleHalfW = (0.28 + length * 0.03) * CONE_SIZE;
    const nozzleHalfH = nozzleHalfW * 0.85;
    const tipHalfW = Math.max(0.03, nozzleHalfW * 0.1);
    const tipHalfH = tipHalfW * 0.85;
    const z = -length;

    const nozzle = [
        [-nozzleHalfW, -nozzleHalfH, 0], [nozzleHalfW, -nozzleHalfH, 0],
        [nozzleHalfW, nozzleHalfH, 0], [-nozzleHalfW, nozzleHalfH, 0],
    ];
    const tip = [
        [-tipHalfW, -tipHalfH, z], [tipHalfW, -tipHalfH, z],
        [tipHalfW, tipHalfH, z], [-tipHalfW, tipHalfH, z],
    ];

    const verts: number[] = [];
    const pushTri = (a: number[], b: number[], c: number[]) => {
        verts.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    };

    for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        pushTri(nozzle[i], nozzle[j], tip[j]);
        pushTri(nozzle[i], tip[j], tip[i]);
    }
    pushTri(tip[0], tip[2], tip[1]);
    pushTri(tip[0], tip[3], tip[2]);

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.computeVertexNormals();
}

export class AfterburnerCones {
    private leftRoot = new THREE.Object3D();
    private rightRoot = new THREE.Object3D();
    private leftMesh: THREE.Mesh;
    private rightMesh: THREE.Mesh;
    private material: ShaderMaterial;
    private lastLength = -1;
    private primary = new THREE.Color();
    private secondary = new THREE.Color();
    private _offset = new THREE.Vector3();

    constructor(materials: SceneMaterialManager) {
        this.material = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.FX_FIRE,
            shaded: false,
            depthWrite: true,
            alphaDither: 0.55,
        }) as ShaderMaterial;
        (this.material.userData as { afterburnerThrottleDriven?: boolean }).afterburnerThrottleDriven = true;

        const uniforms = this.material.uniforms as SceneMaterialUniforms;
        uniforms.color = { value: uniforms.color.value.clone() };
        uniforms.colorSecondary = { value: uniforms.colorSecondary.value.clone() };

        this.leftMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
        this.rightMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
        this.leftMesh.onBeforeRender = updateUniforms;
        this.rightMesh.onBeforeRender = updateUniforms;
        this.leftRoot.add(this.leftMesh);
        this.rightRoot.add(this.rightMesh);
        this.leftRoot.visible = false;
        this.rightRoot.visible = false;
    }

    update(
        throttleLever: number,
        dither: F16AfterburnerConeDither | null,
        displayPosition: THREE.Vector3,
        displayQuaternion: THREE.Quaternion,
    ): void {
        const length = getF16AfterburnerConeLengthM(throttleLever);
        const active = length > 0 && dither !== null;

        this.leftRoot.visible = active;
        this.rightRoot.visible = active;
        if (!active || !dither) {
            return;
        }

        if (length !== this.lastLength) {
            writeConeGeometry(this.leftMesh.geometry, length);
            writeConeGeometry(this.rightMesh.geometry, length);
            this.lastLength = length;
        }

        this.primary.set(dither.primary);
        this.secondary.set(dither.secondary);
        const uniforms = this.material.uniforms as SceneMaterialUniforms;
        uniforms.color.value.copy(this.primary);
        uniforms.colorSecondary.value.copy(this.secondary);

        this.leftRoot.position.copy(displayPosition).add(
            this._offset.copy(LEFT_NOZZLE).applyQuaternion(displayQuaternion),
        );
        this.leftRoot.quaternion.copy(displayQuaternion);

        this.rightRoot.position.copy(displayPosition).add(
            this._offset.copy(RIGHT_NOZZLE).applyQuaternion(displayQuaternion),
        );
        this.rightRoot.quaternion.copy(displayQuaternion);
    }

    addToRenderList(volumesId: string, lists: Map<string, THREE.Scene>): void {
        if (!this.leftRoot.visible) {
            return;
        }
        const list = lists.get(volumesId);
        if (!list) {
            return;
        }
        list.add(this.leftRoot);
        list.add(this.rightRoot);
    }
}
