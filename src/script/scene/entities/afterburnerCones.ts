import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { F16ThrottleZone, getF16ThrottleZone } from '../../physics/f16Engine';
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

/** Nozzle radius (m) assumed when a def provides none. */
const DEFAULT_RADIUS = 0.3;

/** Shifts the cone forward into the nozzle interior (+Z body space). */
const CONE_FORWARD_OFFSET_M = 0.5;

/**
 * Both cones share the nozzle radius at the base (z=0) and taper to a point.
 * The outer halo is longer than the inner core, and both grow from AB1 to AB2.
 */
const CONE_LENGTHS_M = {
    'ab-min': { inner: 3, outer: 4.5 },
    'ab-max': { inner: 4, outer: 6 },
} as const;

/** Both afterburner stages render the plume yellow. */
const CONE_COLOR = '#ffff00';

/** alphaDither: higher = more opaque. The core is denser than the outer halo. */
const INNER_CONE_ALPHA_DITHER = 0.35;
const OUTER_CONE_ALPHA_DITHER = 0.15;

const PLUME_SEGMENTS = 24;

/** Cone from `baseRadius` at z=0 tapering to a single point at z=-length. */
function writeConeGeometry(geometry: THREE.BufferGeometry, length: number, baseRadius: number): void {
    const verts: number[] = [];
    for (let i = 0; i < PLUME_SEGMENTS; i++) {
        const a0 = (i / PLUME_SEGMENTS) * Math.PI * 2;
        const a1 = ((i + 1) / PLUME_SEGMENTS) * Math.PI * 2;
        const x0 = Math.cos(a0) * baseRadius;
        const y0 = Math.sin(a0) * baseRadius;
        const x1 = Math.cos(a1) * baseRadius;
        const y1 = Math.sin(a1) * baseRadius;
        verts.push(x0, y0, 0, x1, y1, 0, 0, 0, -length);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.computeVertexNormals();
}

/** Round base cap at z=0 with the nozzle radius, facing aft (−Z). */
function writeDishGeometry(geometry: THREE.BufferGeometry, radius: number): void {
    const verts: number[] = [];
    for (let i = 0; i < PLUME_SEGMENTS; i++) {
        const a0 = (i / PLUME_SEGMENTS) * Math.PI * 2;
        const a1 = ((i + 1) / PLUME_SEGMENTS) * Math.PI * 2;
        // Normal −Z so the cap is visible when looking at the exhaust from aft.
        verts.push(
            0, 0, 0,
            Math.cos(a1) * radius, Math.sin(a1) * radius, 0,
            Math.cos(a0) * radius, Math.sin(a0) * radius, 0,
        );
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.computeVertexNormals();
}

export class AfterburnerCones {
    private plumeRoots: THREE.Object3D[] = [];
    private plumeMeshes: THREE.Mesh[] = [];
    private outerPlumeMeshes: THREE.Mesh[] = [];
    private dishMeshes: THREE.Mesh[] = [];
    private nozzles: THREE.Vector3[] = [];
    private radius = DEFAULT_RADIUS;
    private plumeMaterial: ShaderMaterial;
    private outerPlumeMaterial: ShaderMaterial;
    private lastZone: F16ThrottleZone | null = null;
    private primary = new THREE.Color();
    private _offset = new THREE.Vector3();

    constructor(private materials: SceneMaterialManager) {
        // Plume reads as a see-through exhaust via the alpha-dither stipple.
        this.plumeMaterial = this.buildMaterial(INNER_CONE_ALPHA_DITHER);
        this.outerPlumeMaterial = this.buildMaterial(OUTER_CONE_ALPHA_DITHER);
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
        for (const mesh of this.outerPlumeMeshes) {
            mesh.geometry.dispose();
        }
        for (const mesh of this.dishMeshes) {
            mesh.geometry.dispose();
        }
        const src = nozzles && nozzles.length > 0 ? nozzles : DEFAULT_NOZZLES;
        this.nozzles = src.map(n => n.clone());
        this.radius = radius && radius > 0 ? radius : DEFAULT_RADIUS;
        this.symmetrizeNozzles();
        this.plumeRoots = [];
        this.plumeMeshes = [];
        this.outerPlumeMeshes = [];
        this.dishMeshes = [];
        for (let i = 0; i < this.nozzles.length; i++) {
            const plumeRoot = new THREE.Object3D();
            const plumeGroup = new THREE.Object3D();
            plumeGroup.position.z = CONE_FORWARD_OFFSET_M;
            // Both cones start at the nozzle radius and taper to a point; the
            // outer halo is longer than the inner core. Lengths are set per AB
            // stage in update(); seed with the AB1 profile here.
            const seed = CONE_LENGTHS_M['ab-min'];
            const outerPlumeMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.outerPlumeMaterial);
            writeConeGeometry(outerPlumeMesh.geometry, seed.outer, this.radius);
            outerPlumeMesh.onBeforeRender = updateUniforms;
            const plumeMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.plumeMaterial);
            writeConeGeometry(plumeMesh.geometry, seed.inner, this.radius);
            plumeMesh.onBeforeRender = updateUniforms;
            const dishMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.plumeMaterial);
            writeDishGeometry(dishMesh.geometry, this.radius);
            dishMesh.onBeforeRender = updateUniforms;
            dishMesh.renderOrder = 1;
            plumeGroup.add(outerPlumeMesh);
            plumeGroup.add(plumeMesh);
            plumeGroup.add(dishMesh);
            plumeRoot.add(plumeGroup);
            plumeRoot.visible = false;
            this.plumeRoots.push(plumeRoot);
            this.outerPlumeMeshes.push(outerPlumeMesh);
            this.plumeMeshes.push(plumeMesh);
            this.dishMeshes.push(dishMesh);
        }
        this.lastZone = null;
    }

    /**
     * Force every plume to share the same start position and size. All cones
     * already use one shared radius, so the only source of visible mismatch is
     * asymmetric nozzle exits from the importer: line every nozzle up at the
     * same height (Y) and depth (Z), and for the common twin layout mirror the
     * lateral (X) offset so the pair is perfectly symmetric.
     */
    private symmetrizeNozzles(): void {
        if (this.nozzles.length < 2) {
            return;
        }
        let sumY = 0;
        let sumZ = 0;
        for (const n of this.nozzles) {
            sumY += n.y;
            sumZ += n.z;
        }
        const y = sumY / this.nozzles.length;
        const z = sumZ / this.nozzles.length;
        if (this.nozzles.length === 2) {
            const x = (Math.abs(this.nozzles[0].x) + Math.abs(this.nozzles[1].x)) / 2;
            const leftFirst = this.nozzles[0].x <= this.nozzles[1].x;
            this.nozzles[0].set(leftFirst ? -x : x, y, z);
            this.nozzles[1].set(leftFirst ? x : -x, y, z);
        } else {
            for (const n of this.nozzles) {
                n.y = y;
                n.z = z;
            }
        }
    }

    /**
     * @param throttleLever Throttle [0, 1] selecting the AB stage (AB1/AB2).
     * @param plumeActive   Whether the aircraft's afterburner may spawn plumes.
     */
    update(
        throttleLever: number,
        plumeActive: boolean,
        displayPosition: THREE.Vector3,
        displayQuaternion: THREE.Quaternion,
    ): void {
        const zone = getF16ThrottleZone(throttleLever);
        const plumeOn = plumeActive && zone !== 'mil';

        for (const root of this.plumeRoots) {
            root.visible = plumeOn;
        }

        if (!plumeOn) {
            return;
        }

        // AB1 and AB2 use different cone lengths; only rebuild when the stage
        // changes (AB1 <-> AB2), not every frame.
        if (zone !== this.lastZone) {
            const { inner, outer } = CONE_LENGTHS_M[zone];
            for (const mesh of this.plumeMeshes) {
                writeConeGeometry(mesh.geometry, inner, this.radius);
            }
            for (const mesh of this.outerPlumeMeshes) {
                writeConeGeometry(mesh.geometry, outer, this.radius);
            }
            this.lastZone = zone;
        }

        // Both AB stages render yellow; the alpha stipple keeps the plume
        // semi-transparent.
        this.primary.set(CONE_COLOR);
        const uniforms = this.plumeMaterial.uniforms as SceneMaterialUniforms;
        uniforms.color.value.copy(this.primary);
        uniforms.colorSecondary.value.copy(this.primary);
        const outerUniforms = this.outerPlumeMaterial.uniforms as SceneMaterialUniforms;
        outerUniforms.color.value.copy(this.primary);
        outerUniforms.colorSecondary.value.copy(this.primary);

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
