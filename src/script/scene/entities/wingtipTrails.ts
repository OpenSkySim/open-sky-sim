import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { F16_PROFILE } from '../../physics/f16Profile';
import { UP } from '../../utils/math';
import { PaletteCategory } from '../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType, SceneMaterialUniforms } from '../materials/materials';
import { updateUniforms } from '../utils';

const WINGTIP_OUTWARD = F16_PROFILE.wingSpanM * 0.5 + 2.05;

/** Body space: +Z forward, −Z aft. */
const WINGTIP_AFT = -2.7;
const WINGTIP_HEIGHT = -0.28;

/** Wingtip vortex origins — beyond the physical wingtip, aft of the leading edge. */
const LEFT_WINGTIP = new THREE.Vector3(WINGTIP_OUTWARD, WINGTIP_HEIGHT, WINGTIP_AFT);
const RIGHT_WINGTIP = new THREE.Vector3(-WINGTIP_OUTWARD, WINGTIP_HEIGHT, WINGTIP_AFT);

const TRAIL_WHITE = '#ffffff';

const POSITION_COUNT = 101;
const SEGMENT_COUNT = 100;
const DITHER_MIN = 0.05;
const DITHER_MAX = 0.9;
const SEGMENT_WIDTH = 0.0784;
const MIN_TRAIL_SPEED_MPS = 0;
const SAMPLE_SPACING_SPEED_FACTOR = 0.028;
const MIN_SAMPLE_SPACING_M = 0.45;
const MAX_SAMPLE_SPACING_M = 3.5;
const _basis = new THREE.Matrix4();

function segmentDither(index: number): number {
    return DITHER_MIN + (DITHER_MAX - DITHER_MIN) * (index / (SEGMENT_COUNT - 1));
}

function sampleSpacingM(speedMps: number): number {
    return Math.min(
        MAX_SAMPLE_SPACING_M,
        Math.max(MIN_SAMPLE_SPACING_M, speedMps * SAMPLE_SPACING_SPEED_FACTOR),
    );
}

class WingTrailSide {
    private readonly history: THREE.Vector3[] = Array.from(
        { length: POSITION_COUNT },
        () => new THREE.Vector3(),
    );
    private head = 0;
    private count = 0;
    private readonly meshes: THREE.Mesh[];
    private readonly root = new THREE.Object3D();
    private readonly lastSample = new THREE.Vector3();
    private hasLastSample = false;
    private readonly _from = new THREE.Vector3();
    private readonly _to = new THREE.Vector3();
    private readonly _dir = new THREE.Vector3();
    private readonly _mid = new THREE.Vector3();
    private readonly _cameraPos = new THREE.Vector3();
    private readonly _viewDir = new THREE.Vector3();
    private readonly _right = new THREE.Vector3();
    private readonly _up = new THREE.Vector3();

    private static sharedGeometry: THREE.PlaneGeometry | undefined;

    constructor(materials: ShaderMaterial[]) {
        if (!WingTrailSide.sharedGeometry) {
            WingTrailSide.sharedGeometry = new THREE.PlaneGeometry(1, 1);
        }
        this.meshes = materials.map((material) => {
            const mesh = new THREE.Mesh(WingTrailSide.sharedGeometry!, material);
            mesh.onBeforeRender = updateUniforms;
            mesh.frustumCulled = false;
            mesh.visible = false;
            this.root.add(mesh);
            return mesh;
        });
    }

    reset(): void {
        this.head = 0;
        this.count = 0;
        this.hasLastSample = false;
        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].visible = false;
        }
        this.root.visible = false;
    }

    tryPush(tipWorld: THREE.Vector3, spacingM: number): void {
        if (!this.hasLastSample || this.lastSample.distanceToSquared(tipWorld) >= spacingM * spacingM) {
            this.history[this.head].copy(tipWorld);
            this.head = (this.head + 1) % POSITION_COUNT;
            this.count = Math.min(this.count + 1, POSITION_COUNT);
            this.lastSample.copy(tipWorld);
            this.hasLastSample = true;
        }
    }

    private historyAt(ageFromNewest: number): THREE.Vector3 {
        const index = (this.head - 1 - ageFromNewest + POSITION_COUNT * 2) % POSITION_COUNT;
        return this.history[index];
    }

    layoutSegments(camera: THREE.Camera, currentTip: THREE.Vector3): void {
        if (this.count === 0) {
            this.root.visible = false;
            return;
        }

        const segmentLimit = Math.min(SEGMENT_COUNT, this.count);
        this.root.visible = segmentLimit > 0;
        camera.getWorldPosition(this._cameraPos);

        for (let i = 0; i < SEGMENT_COUNT; i++) {
            const mesh = this.meshes[i];
            const age = SEGMENT_COUNT - 1 - i;

            if (age >= segmentLimit) {
                mesh.visible = false;
                continue;
            }

            if (age === 0) {
                this._from.copy(this.historyAt(0));
                this._to.copy(currentTip);
            } else {
                this._from.copy(this.historyAt(age));
                this._to.copy(this.historyAt(age - 1));
            }

            this._dir.subVectors(this._to, this._from);
            const length = this._dir.length();
            if (length < 0.01) {
                mesh.visible = false;
                continue;
            }

            this._dir.multiplyScalar(1 / length);
            this._mid.addVectors(this._from, this._to).multiplyScalar(0.5);

            this._viewDir.subVectors(this._cameraPos, this._mid);
            if (this._viewDir.lengthSq() < 1e-8) {
                this._viewDir.set(0, 0, 1);
            } else {
                this._viewDir.normalize();
            }

            this._right.crossVectors(this._dir, this._viewDir);
            if (this._right.lengthSq() < 1e-6) {
                this._right.crossVectors(this._dir, UP);
            }
            this._right.normalize();
            this._up.crossVectors(this._right, this._dir).normalize();

            _basis.makeBasis(this._right, this._dir, this._up);
            mesh.position.copy(this._mid);
            mesh.quaternion.setFromRotationMatrix(_basis);
            mesh.scale.set(SEGMENT_WIDTH * 2, length, 1);
            mesh.visible = true;
        }
    }

    addToRenderList(volumesId: string, lists: Map<string, THREE.Scene>): void {
        if (!this.root.visible) {
            return;
        }
        const list = lists.get(volumesId);
        if (!list) {
            return;
        }
        list.add(this.root);
    }
}

export class WingtipTrails {
    private readonly segmentMaterials: ShaderMaterial[];
    private readonly trailWhite = new THREE.Color(TRAIL_WHITE);
    private readonly left: WingTrailSide;
    private readonly right: WingTrailSide;
    private readonly _leftTip = new THREE.Vector3();
    private readonly _rightTip = new THREE.Vector3();

    constructor(materials: SceneMaterialManager) {
        this.segmentMaterials = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
            const material = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: PaletteCategory.FX_SMOKE,
                shaded: false,
                depthWrite: false,
                alphaDither: segmentDither(index),
            }) as ShaderMaterial;
            material.side = THREE.DoubleSide;
            (material.userData as { wingtipTrailDriven?: boolean }).wingtipTrailDriven = true;
            const uniforms = material.uniforms as SceneMaterialUniforms;
            uniforms.color = { value: uniforms.color.value.clone() };
            uniforms.colorSecondary = { value: uniforms.colorSecondary.value.clone() };
            uniforms.color.value.copy(this.trailWhite);
            uniforms.colorSecondary.value.copy(this.trailWhite);
            return material;
        });
        this.left = new WingTrailSide(this.segmentMaterials);
        this.right = new WingTrailSide(this.segmentMaterials);
    }

    reset(): void {
        this.left.reset();
        this.right.reset();
    }

    private applyWhiteColors(): void {
        for (let i = 0; i < this.segmentMaterials.length; i++) {
            const uniforms = this.segmentMaterials[i].uniforms as SceneMaterialUniforms;
            uniforms.color.value.copy(this.trailWhite);
            uniforms.colorSecondary.value.copy(this.trailWhite);
        }
    }

    update(
        displayPosition: THREE.Vector3,
        displayQuaternion: THREE.Quaternion,
        displayVelocity: THREE.Vector3,
        airborne: boolean,
    ): void {
        const speed = displayVelocity.length();
        
        this.applyWhiteColors();

        if (airborne && speed >= MIN_TRAIL_SPEED_MPS) {
            const spacing = sampleSpacingM(speed);
            this._leftTip.copy(LEFT_WINGTIP).applyQuaternion(displayQuaternion).add(displayPosition);
            this._rightTip.copy(RIGHT_WINGTIP).applyQuaternion(displayQuaternion).add(displayPosition);
            this.left.tryPush(this._leftTip, spacing);
            this.right.tryPush(this._rightTip, spacing);
        }
    }

    addToRenderList(fxId: string, lists: Map<string, THREE.Scene>, camera: THREE.Camera): void {
        if (!lists.has(fxId)) {
            return;
        }
        this.left.layoutSegments(camera, this._leftTip);
        this.right.layoutSegments(camera, this._rightTip);
        this.left.addToRenderList(fxId, lists);
        this.right.addToRenderList(fxId, lists);
    }
}
