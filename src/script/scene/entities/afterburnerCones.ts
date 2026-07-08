import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import {
    getF16AfterburnerConeDither,
    getF16AfterburnerConeLengthM,
} from '../../physics/f16Engine';
import { PaletteCategory } from '../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType, SceneMaterialUniforms } from '../materials/materials';
import { updateUniforms } from '../utils';

/**
 * Default twin nozzle origins in aircraft body space (+Z forward, exhaust −Z).
 * Used for the built-in F-22 and any aircraft whose def carries no `fx.nozzles`.
 */
const DEFAULT_NOZZLES: readonly THREE.Vector3[] = [
    new THREE.Vector3(-0.75, 0.05, -4.85),
    new THREE.Vector3(0.75, 0.05, -4.85),
];

/** Nozzle radius (m) assumed when a def provides none (reproduces the old cone size). */
const DEFAULT_RADIUS = 0.3;

/** Scales exhaust plume length and cross-section (relative to DEFAULT_RADIUS). */
const CONE_SIZE = 0.5;

function writeConeGeometry(geometry: THREE.BufferGeometry, length: number, radius: number): void {
    // Wide at the nozzle (engine), tapering to a narrow tip aft. Cross-section
    // scales with the aircraft's own nozzle radius so imported jets get plumes
    // proportional to their engines.
    const scale = (CONE_SIZE * radius) / DEFAULT_RADIUS;
    const nozzleHalfW = (0.28 + length * 0.03) * scale;
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
    private plumeRoots: THREE.Object3D[] = [];
    private plumeMeshes: THREE.Mesh[] = [];
    private nozzles: THREE.Vector3[] = [];
    private radius = DEFAULT_RADIUS;
    private plumeMaterial: ShaderMaterial;
    private lastLength = -1;
    private primary = new THREE.Color();
    private secondary = new THREE.Color();
    private _offset = new THREE.Vector3();

    constructor(private materials: SceneMaterialManager) {
        // Plume reads as a see-through exhaust via the alpha-dither stipple.
        this.plumeMaterial = this.buildMaterial(0.5);
        this.setNozzles(null, null);
    }

    private buildMaterial(alphaDither: number): ShaderMaterial {
        const material = this.materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.FX_FIRE,
            shaded: false,
            depthWrite: true,
            // alphaDither > 0 discards a screen-space stipple of pixels, making the
            // plume semi-transparent; the colour two-tone stays a steady dither.
            alphaDither,
        }) as ShaderMaterial;
        (material.userData as { afterburnerThrottleDriven?: boolean }).afterburnerThrottleDriven = true;
        const uniforms = material.uniforms as SceneMaterialUniforms;
        uniforms.color = { value: uniforms.color.value.clone() };
        uniforms.colorSecondary = { value: uniforms.colorSecondary.value.clone() };
        return material;
    }

    /**
     * Place one exhaust plume (and interior disc) at each nozzle origin in
     * aircraft body space. Pass the imported aircraft's `fx.nozzles` /
     * `fx.nozzleRadius`; `null`/empty falls back to the built-in twin layout so
     * the default F-22 is unchanged.
     */
    setNozzles(nozzles: readonly THREE.Vector3[] | null, radius: number | null): void {
        for (const mesh of this.plumeMeshes) {
            mesh.geometry.dispose();
        }
        const src = nozzles && nozzles.length > 0 ? nozzles : DEFAULT_NOZZLES;
        this.nozzles = src.map(n => n.clone());
        this.radius = radius && radius > 0 ? radius : DEFAULT_RADIUS;
        this.plumeRoots = [];
        this.plumeMeshes = [];
        for (let i = 0; i < this.nozzles.length; i++) {
            const plumeRoot = new THREE.Object3D();
            const plumeMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.plumeMaterial);
            plumeMesh.onBeforeRender = updateUniforms;
            plumeRoot.add(plumeMesh);
            plumeRoot.visible = false;
            this.plumeRoots.push(plumeRoot);
            this.plumeMeshes.push(plumeMesh);
        }
        this.lastLength = -1;
    }

    /**
     * @param throttleLever Throttle [0, 1] driving plume colour and length.
     * @param plumeActive   Whether the aircraft's afterburner may spawn plumes.
     */
    update(
        throttleLever: number,
        plumeActive: boolean,
        displayPosition: THREE.Vector3,
        displayQuaternion: THREE.Quaternion,
    ): void {
        const length = getF16AfterburnerConeLengthM(throttleLever);
        const dither = getF16AfterburnerConeDither(throttleLever);
        const plumeOn = plumeActive && length > 0 && dither !== null;

        for (const root of this.plumeRoots) {
            root.visible = plumeOn;
        }

        if (!plumeOn || !dither) {
            return;
        }

        if (length !== this.lastLength) {
            for (const mesh of this.plumeMeshes) {
                writeConeGeometry(mesh.geometry, length, this.radius);
            }
            this.lastLength = length;
        }
        // Two-tone ordered dither (orange/yellow) via the shader's colorDither;
        // a steady stipple, not a temporal colour flicker.
        this.primary.set(dither.primary);
        this.secondary.set(dither.secondary);
        const uniforms = this.plumeMaterial.uniforms as SceneMaterialUniforms;
        uniforms.color.value.copy(this.primary);
        uniforms.colorSecondary.value.copy(this.secondary);

        for (let i = 0; i < this.nozzles.length; i++) {
            this._offset.copy(this.nozzles[i]).applyQuaternion(displayQuaternion).add(displayPosition);
            this.plumeRoots[i].position.copy(this._offset);
            this.plumeRoots[i].quaternion.copy(displayQuaternion);
        }
    }

    addToRenderList(volumesId: string, lists: Map<string, THREE.Scene>): void {
        const list = lists.get(volumesId);
        if (!list) {
            return;
        }
        for (const root of this.plumeRoots) {
            if (root.visible) {
                list.add(root);
            }
        }
    }
}
