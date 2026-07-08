import * as THREE from 'three';
import { F16_PROFILE } from '../../physics/f16Profile';
import { Model } from '../models/models';
import { FlyableAircraftDef } from './aircraftDef';

export type WingtipOriginPair = [[number, number, number], [number, number, number]];

const DEFAULT_WINGTIP_Y = -0.28;
const DEFAULT_WINGTIP_Z = -2.7;

const WING_SURFACE_ROLES = new Set([
    'aileronLeft', 'aileronRight', 'flaperonLeft', 'flaperonRight',
]);

function defaultHalfSpan(def: Pick<FlyableAircraftDef, 'flight'>): number {
    return (def.flight?.geometry.wingSpanM ?? F16_PROFILE.wingSpanM) * 0.5;
}

/** Resolve wingtip trail origins from def data (sync; used before the body mesh loads). */
export function resolveWingtipOrigins(
    def: Pick<FlyableAircraftDef, 'fx' | 'surfaces' | 'flight'>,
): WingtipOriginPair {
    const explicit = def.fx?.wingtips;
    if (explicit) {
        return explicit;
    }

    const wingSurfaces = def.surfaces.filter(s => WING_SURFACE_ROLES.has(s.role));
    if (wingSurfaces.length > 0) {
        let outward = 0;
        let ySum = 0;
        let zSum = 0;
        for (const s of wingSurfaces) {
            outward = Math.max(outward, Math.abs(s.pivot[0]));
            ySum += s.pivot[1];
            zSum += s.pivot[2];
        }
        const n = wingSurfaces.length;
        const y = ySum / n;
        const z = zSum / n;
        return [
            [outward, y, z],
            [-outward, y, z],
        ];
    }

    const halfSpan = defaultHalfSpan(def);
    return [
        [halfSpan, DEFAULT_WINGTIP_Y, DEFAULT_WINGTIP_Z],
        [-halfSpan, DEFAULT_WINGTIP_Y, DEFAULT_WINGTIP_Z],
    ];
}

const _vertex = new THREE.Vector3();

function collectBodyVertices(model: Model, out: THREE.Vector3[]): void {
    for (const level of model.lod) {
        for (const obj of level.volumes) {
            if (!('isMesh' in obj)) {
                continue;
            }
            const mesh = obj as THREE.Mesh;
            mesh.updateWorldMatrix(true, false);
            const pos = mesh.geometry.getAttribute('position');
            if (!pos) {
                continue;
            }
            for (let i = 0; i < pos.count; i++) {
                _vertex.fromBufferAttribute(pos, i);
                _vertex.applyMatrix4(mesh.matrixWorld);
                out.push(_vertex.clone());
            }
        }
    }
}

function filterWingBand(vertices: THREE.Vector3[]): THREE.Vector3[] {
    let zMin = Infinity;
    let zMax = -Infinity;
    for (const p of vertices) {
        zMin = Math.min(zMin, p.z);
        zMax = Math.max(zMax, p.z);
    }
    const zRange = zMax - zMin;
    if (zRange < 0.5) {
        return vertices;
    }
    const zLo = zMin + 0.25 * zRange;
    const zHi = zMin + 0.65 * zRange;
    const band = vertices.filter(p => p.z >= zLo && p.z <= zHi);
    return band.length >= 8 ? band : vertices;
}

function dropUpperFin(vertices: THREE.Vector3[]): THREE.Vector3[] {
    const ys = vertices.map(p => p.y).sort((a, b) => a - b);
    const yCut = ys[Math.floor(0.8 * (ys.length - 1))];
    const low = vertices.filter(p => p.y <= yCut);
    return low.length >= 4 ? low : vertices;
}

function symmetricTipsFromOutermost(leftTip: THREE.Vector3, rightTip: THREE.Vector3): {
    left: THREE.Vector3;
    right: THREE.Vector3;
} {
    const outward = Math.max(leftTip.x, -rightTip.x);
    const ref = leftTip.x >= -rightTip.x ? leftTip : rightTip;
    return {
        left: new THREE.Vector3(outward, ref.y, ref.z),
        right: new THREE.Vector3(-outward, ref.y, ref.z),
    };
}

/** True when mesh-derived tips are sane relative to the def-based baseline span. */
export function isPlausibleWingtipDerivation(
    derived: { left: THREE.Vector3; right: THREE.Vector3 },
    baselineOutward: number,
): boolean {
    const outward = Math.abs(derived.left.x);
    if (outward < 0.3) {
        return false;
    }
    if (Math.abs(derived.left.x + derived.right.x) > 0.05) {
        return false;
    }
    if (baselineOutward > 0.1) {
        const ratio = outward / baselineOutward;
        if (ratio < 0.5 || ratio > 2.5) {
            return false;
        }
    }
    return true;
}

/**
 * Derive wingtip origins from the loaded body mesh (outermost lateral vertices).
 * Returns null when the mesh has too few vertices or insufficient span.
 */
export function deriveWingtipOriginsFromModel(
    model: Model,
): { left: THREE.Vector3; right: THREE.Vector3 } | null {
    const vertices: THREE.Vector3[] = [];
    collectBodyVertices(model, vertices);
    if (vertices.length < 8) {
        return null;
    }

    let wingBand = filterWingBand(vertices);
    wingBand = dropUpperFin(wingBand);
    if (wingBand.length < 4) {
        return null;
    }

    let leftTip = wingBand[0];
    let rightTip = wingBand[0];
    for (const p of wingBand) {
        if (p.x > leftTip.x) {
            leftTip = p;
        }
        if (p.x < rightTip.x) {
            rightTip = p;
        }
    }

    if (Math.max(leftTip.x, -rightTip.x) < 0.3) {
        return null;
    }

    return symmetricTipsFromOutermost(leftTip, rightTip);
}
