import * as THREE from 'three';
import { PLANE_DISTANCE_TO_GROUND } from '../defs';
import { DEFAULT_LOD_BIAS } from '../render/helpers';
import { AIRBASE_LOCAL, AIRBASE_RUNWAY } from './worldLayout';

const RAMP_HEADING = -Math.PI / 2;

export interface StaticAircraftType {
    name: string;
    body: string;
    shadow: string;
    lodBias: number;
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
    },
];

function buildStaticModelViews(): StaticModelView[] {
    const views: StaticModelView[] = [];
    const rampX = AIRBASE_RUNWAY.x + AIRBASE_LOCAL.rampX;
    for (const type of STATIC_AIRCRAFT_TYPES) {
        for (let slotIndex = 0; slotIndex < AIRBASE_LOCAL.rampZ.length; slotIndex++) {
            const z = AIRBASE_RUNWAY.z + AIRBASE_LOCAL.rampZ[slotIndex];
            views.push({
                name: `${type.name} ${slotIndex + 1}`,
                position: new THREE.Vector3(rampX, PLANE_DISTANCE_TO_GROUND, z),
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
        for (const _z of AIRBASE_LOCAL.rampZ) {
            const view = STATIC_MODEL_VIEWS[viewIndex++];
            fn(type, view.position, view.heading);
        }
    }
}
