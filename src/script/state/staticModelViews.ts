import * as THREE from 'three';
import { PLANE_DISTANCE_TO_GROUND } from '../defs';
import { DEFAULT_LOD_BIAS } from '../render/helpers';

const RAMP_HEADING = -Math.PI / 2;
const RAMP_Z = [-840, -870, -900, -930];

export interface StaticAircraftType {
    name: string;
    body: string;
    shadow: string;
    lodBias: number;
    rampX: number;
}

export interface StaticModelView {
    name: string;
    position: THREE.Vector3;
    heading: number;
}

export const STATIC_AIRCRAFT_TYPES: StaticAircraftType[] = [
    {
        name: 'F-22',
        body: 'assets/f22_scenery.glb',
        shadow: 'assets/f22_shadow.glb',
        lodBias: DEFAULT_LOD_BIAS,
        rampX: 1580,
    },
    {
        name: 'A-4E',
        body: 'pack:a4e/a4e_static.gltf',
        shadow: 'pack:a4e/a4e_shadow.gltf',
        lodBias: 100,
        rampX: 1620,
    },
    {
        name: 'F-16A',
        body: 'pack:f16/f16_static.gltf',
        shadow: 'pack:f16/f16_shadow.gltf',
        lodBias: 100,
        rampX: 1660,
    },
];

function buildStaticModelViews(): StaticModelView[] {
    const views: StaticModelView[] = [];
    for (const type of STATIC_AIRCRAFT_TYPES) {
        for (let slotIndex = 0; slotIndex < RAMP_Z.length; slotIndex++) {
            views.push({
                name: `${type.name} ${slotIndex + 1}`,
                position: new THREE.Vector3(type.rampX, PLANE_DISTANCE_TO_GROUND, RAMP_Z[slotIndex]),
                heading: RAMP_HEADING,
            });
        }
    }
    return views;
}

export const STATIC_MODEL_VIEWS = buildStaticModelViews();

export function forEachStaticAircraftSlot(fn: (type: StaticAircraftType, position: THREE.Vector3, heading: number) => void) {
    let viewIndex = 0;
    for (const type of STATIC_AIRCRAFT_TYPES) {
        for (const _z of RAMP_Z) {
            const view = STATIC_MODEL_VIEWS[viewIndex++];
            fn(type, view.position, view.heading);
        }
    }
}
