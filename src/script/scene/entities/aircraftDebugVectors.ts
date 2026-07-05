import * as THREE from 'three';
import { PaletteCategory } from '../../config/palettes/palette';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';
import { modelMatchesPaletteTime } from '../models/models';
import { Palette } from '../../config/palettes/palette';

const BODY_AXIS_LENGTH = 25;
const MAX_VELOCITY_LENGTH = 100;

export class AircraftDebugVectors {
    private bodyAxisLine: THREE.Line;
    private velocityLine: THREE.Line;
    private bodyAxisRoot = new THREE.Object3D();
    private velocityRoot = new THREE.Object3D();
    private velocityEnd = new THREE.Vector3();

    constructor(materials: SceneMaterialManager) {
        const bodyGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, BODY_AXIS_LENGTH),
        ]);
        const bodyMaterial = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: PaletteCategory.LIGHT_GREEN,
            depthWrite: false,
        });
        this.bodyAxisLine = new THREE.Line(bodyGeometry, bodyMaterial);
        this.bodyAxisLine.onBeforeRender = updateUniforms;
        this.bodyAxisRoot.add(this.bodyAxisLine);

        const velocityGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 1),
        ]);
        const velocityMaterial = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: PaletteCategory.LIGHT_YELLOW,
            depthWrite: false,
        });
        this.velocityLine = new THREE.Line(velocityGeometry, velocityMaterial);
        this.velocityLine.onBeforeRender = updateUniforms;
        this.velocityRoot.add(this.velocityLine);
    }

    update(
        position: THREE.Vector3,
        quaternion: THREE.Quaternion,
        velocity: THREE.Vector3,
    ): void {
        this.bodyAxisRoot.position.copy(position);
        this.bodyAxisRoot.quaternion.copy(quaternion);

        this.velocityEnd.copy(velocity);
        const speed = this.velocityEnd.length();
        if (speed > MAX_VELOCITY_LENGTH) {
            this.velocityEnd.multiplyScalar(MAX_VELOCITY_LENGTH / speed);
        }

        const velocityPositions = this.velocityLine.geometry.getAttribute('position') as THREE.BufferAttribute;
        velocityPositions.setXYZ(0, 0, 0, 0);
        velocityPositions.setXYZ(1, this.velocityEnd.x, this.velocityEnd.y, this.velocityEnd.z);
        velocityPositions.needsUpdate = true;

        this.velocityRoot.position.copy(position);
        this.velocityRoot.quaternion.identity();
    }

    addToRenderList(listId: string, lists: Map<string, THREE.Scene>, palette: Palette): void {
        const list = lists.get(listId);
        if (!list) {
            return;
        }

        if (modelMatchesPaletteTime(this.bodyAxisLine, palette.time)) {
            list.add(this.bodyAxisRoot);
        }
        if (modelMatchesPaletteTime(this.velocityLine, palette.time) && this.velocityEnd.lengthSq() > 1e-4) {
            list.add(this.velocityRoot);
        }
    }
}
