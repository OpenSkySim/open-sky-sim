import * as THREE from 'three';
import { Model, ModelLodLevel } from '../models/models';

const _vertex = new THREE.Vector3();

function isBodyMesh(obj: THREE.Object3D): obj is THREE.Mesh {
    return (obj as THREE.Mesh).isMesh === true;
}

function collectLodVertices(level: ModelLodLevel, out: THREE.Vector3[]): void {
    for (const obj of [...level.volumes, ...level.flats]) {
        if (!isBodyMesh(obj)) {
            continue;
        }
        const pos = obj.geometry.getAttribute('position');
        if (!pos) {
            continue;
        }
        for (let i = 0; i < pos.count; i++) {
            _vertex.fromBufferAttribute(pos, i);
            out.push(_vertex.clone());
        }
    }
}

export function countBodyMeshVertices(model: Model): number {
    if (model.lod.length === 0) {
        return 0;
    }
    let count = 0;
    for (const obj of [...model.lod[0].volumes, ...model.lod[0].flats]) {
        if (!isBodyMesh(obj)) {
            continue;
        }
        const pos = obj.geometry.getAttribute('position');
        if (pos) {
            count += pos.count;
        }
    }
    return count;
}

/**
 * Wingtip trail origins from the outermost body-mesh vertices on each wing.
 * Uses LOD0 geometry positions in aircraft body space (no fallbacks).
 */
export function deriveWingtipOriginsFromModel(
    model: Model,
): { left: THREE.Vector3; right: THREE.Vector3 } | null {
    if (model.lod.length === 0) {
        return null;
    }

    const level = model.lod[0];
    const vertices: THREE.Vector3[] = [];
    collectLodVertices(level, vertices);

    if (vertices.length < 8) {
        return null;
    }

    const leftVerts: THREE.Vector3[] = [];
    const rightVerts: THREE.Vector3[] = [];
    for (const v of vertices) {
        if (v.x > 0.05) {
            leftVerts.push(v);
        } else if (v.x < -0.05) {
            rightVerts.push(v);
        }
    }
    if (leftVerts.length === 0 || rightVerts.length === 0) {
        return null;
    }

    let leftTip = leftVerts[0];
    let rightTip = rightVerts[0];
    for (const v of leftVerts) {
        if (v.x > leftTip.x) {
            leftTip = v;
        }
    }
    for (const v of rightVerts) {
        if (v.x < rightTip.x) {
            rightTip = v;
        }
    }

    if (leftTip.x < 0.3 || rightTip.x > -0.3 || leftTip.x - rightTip.x < 0.6) {
        return null;
    }

    return { left: leftTip.clone(), right: rightTip.clone() };
}
