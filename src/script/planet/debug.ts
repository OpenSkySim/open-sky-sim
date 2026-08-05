/** F8 wireframe toggle and live terrain diagnostics. */

import * as THREE from 'three';
import { SceneMaterialManager } from '../scene/materials/materials';

let wireframe = false;

export function isTerrainWireframe(): boolean {
    return wireframe;
}

/** Toggle wireframe on every material previously built for terrain. */
export function setTerrainWireframe(_materials: SceneMaterialManager, enabled: boolean): void {
    wireframe = enabled;
    for (const mat of materialSet) {
        mat.wireframe = enabled;
    }
}

const materialSet = new Set<THREE.Material & { wireframe: boolean }>();

export function trackTerrainMaterial(mat: THREE.Material): void {
    const m = mat as THREE.Material & { wireframe: boolean };
    if (typeof m.wireframe === 'boolean') {
        m.wireframe = wireframe;
        materialSet.add(m);
    }
}

export function clearTerrainMaterialTracking(): void {
    materialSet.clear();
}

export interface TerrainStats {
    drawn: number;
    triangles: number;
    cached: number;
    inflight: number;
    queued: number;
    pendingMeshes: number;
    altitudeM: number;
    detailScale: number;
    frameEmaMs: number;
}

export function publishTerrainStats(stats: TerrainStats): void {
    (globalThis as Record<string, unknown>).__terrainStats = stats;
}
