import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import {
    getF16AfterburnerConeDither,
    getF16AfterburnerConeLengthM,
    getF16EngineNozzleColor,
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

/**
 * A flat, double-sided disc filling the nozzle mouth. Stands in for a modelled
 * nozzle-interior cavity on imported aircraft that ship none, and is coloured by
 * throttle (dark at MIL, glowing in afterburner) so the exhaust reads correctly.
 */
function writeInteriorDisc(geometry: THREE.BufferGeometry, radius: number): void {
    const segments = 8;
    const z = -0.05; // just aft of the exit plane to avoid z-fighting the skin
    const verts: number[] = [];
    const center = [0, 0, z];
    const rim = (k: number): number[] => {
        const t = (k / segments) * Math.PI * 2;
        return [Math.cos(t) * radius, Math.sin(t) * radius, z];
    };
    const pushTri = (a: number[], b: number[], c: number[]) => {
        verts.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    };
    for (let i = 0; i < segments; i++) {
        const a = rim(i);
        const b = rim(i + 1);
        pushTri(center, a, b);  // front
        pushTri(center, b, a);  // back (reversed winding -> double-sided)
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.computeVertexNormals();
}

export class AfterburnerCones {
    private plumeRoots: THREE.Object3D[] = [];
    private plumeMeshes: THREE.Mesh[] = [];
    private interiorRoots: THREE.Object3D[] = [];
    private interiorMeshes: THREE.Mesh[] = [];
    private nozzles: THREE.Vector3[] = [];
    private radius = DEFAULT_RADIUS;
    private plumeMaterial: ShaderMaterial;
    private interiorMaterial: ShaderMaterial;
    private lastLength = -1;
    private primary = new THREE.Color();
    private secondary = new THREE.Color();
    private interiorColor = new THREE.Color();
    private _offset = new THREE.Vector3();

    constructor(private materials: SceneMaterialManager) {
        this.plumeMaterial = this.buildMaterial();
        this.interiorMaterial = this.buildMaterial();
        this.setNozzles(null, null);
    }

    private buildMaterial(): ShaderMaterial {
        const material = this.materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.FX_FIRE,
            shaded: false,
            depthWrite: true,
            alphaDither: 0.55,
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
        for (const mesh of this.interiorMeshes) {
            mesh.geometry.dispose();
        }
        const src = nozzles && nozzles.length > 0 ? nozzles : DEFAULT_NOZZLES;
        this.nozzles = src.map(n => n.clone());
        this.radius = radius && radius > 0 ? radius : DEFAULT_RADIUS;
        this.plumeRoots = [];
        this.plumeMeshes = [];
        this.interiorRoots = [];
        this.interiorMeshes = [];
        for (let i = 0; i < this.nozzles.length; i++) {
            const plumeRoot = new THREE.Object3D();
            const plumeMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.plumeMaterial);
            plumeMesh.onBeforeRender = updateUniforms;
            plumeRoot.add(plumeMesh);
            plumeRoot.visible = false;
            this.plumeRoots.push(plumeRoot);
            this.plumeMeshes.push(plumeMesh);

            const interiorGeom = new THREE.BufferGeometry();
            writeInteriorDisc(interiorGeom, this.radius);
            const interiorRoot = new THREE.Object3D();
            const interiorMesh = new THREE.Mesh(interiorGeom, this.interiorMaterial);
            interiorMesh.onBeforeRender = updateUniforms;
            interiorRoot.add(interiorMesh);
            interiorRoot.visible = false;
            this.interiorRoots.push(interiorRoot);
            this.interiorMeshes.push(interiorMesh);
        }
        this.lastLength = -1;
    }

    /**
     * @param throttleLever   Throttle [0, 1] driving nozzle colour and plume length.
     * @param plumeActive     Whether the aircraft's afterburner may spawn plumes.
     * @param interiorEnabled Whether to draw the synthetic glowing nozzle discs
     *                        (only when the model ships no nozzle-interior mesh).
     */
    update(
        throttleLever: number,
        plumeActive: boolean,
        interiorEnabled: boolean,
        displayPosition: THREE.Vector3,
        displayQuaternion: THREE.Quaternion,
    ): void {
        const length = getF16AfterburnerConeLengthM(throttleLever);
        const dither = getF16AfterburnerConeDither(throttleLever);
        const plumeOn = plumeActive && length > 0 && dither !== null;

        for (const root of this.plumeRoots) {
            root.visible = plumeOn;
        }
        for (const root of this.interiorRoots) {
            root.visible = interiorEnabled;
        }

        if (plumeOn && dither) {
            if (length !== this.lastLength) {
                for (const mesh of this.plumeMeshes) {
                    writeConeGeometry(mesh.geometry, length, this.radius);
                }
                this.lastLength = length;
            }
            this.primary.set(dither.primary);
            this.secondary.set(dither.secondary);
            const uniforms = this.plumeMaterial.uniforms as SceneMaterialUniforms;
            uniforms.color.value.copy(this.primary);
            uniforms.colorSecondary.value.copy(this.secondary);
        }

        if (interiorEnabled) {
            this.interiorColor.set(getF16EngineNozzleColor(throttleLever));
            const uniforms = this.interiorMaterial.uniforms as SceneMaterialUniforms;
            uniforms.color.value.copy(this.interiorColor);
            uniforms.colorSecondary.value.copy(this.interiorColor);
        }

        if (!plumeOn && !interiorEnabled) {
            return;
        }
        for (let i = 0; i < this.nozzles.length; i++) {
            this._offset.copy(this.nozzles[i]).applyQuaternion(displayQuaternion).add(displayPosition);
            if (plumeOn) {
                this.plumeRoots[i].position.copy(this._offset);
                this.plumeRoots[i].quaternion.copy(displayQuaternion);
            }
            if (interiorEnabled) {
                this.interiorRoots[i].position.copy(this._offset);
                this.interiorRoots[i].quaternion.copy(displayQuaternion);
            }
        }
    }

    addToRenderList(volumesId: string, lists: Map<string, THREE.Scene>): void {
        const list = lists.get(volumesId);
        if (!list) {
            return;
        }
        for (const root of this.interiorRoots) {
            if (root.visible) {
                list.add(root);
            }
        }
        for (const root of this.plumeRoots) {
            if (root.visible) {
                list.add(root);
            }
        }
    }
}
