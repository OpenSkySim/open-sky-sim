import * as THREE from 'three';
import { HillCollider } from '../../scene/entities/hillCollider';
import { Obstacle, Runway, SceneWorldQuery } from '../../ai/worldQuery';

/**
 * Plain, structured-clone-safe views of the static world the AI pilots need
 * (terrain hills, static obstacles, the runway). These are posted once to the
 * combat sim worker so it can rebuild a {@link SceneWorldQuery} on its side.
 *
 * `isLand` is deliberately not serialized: the {@link import('../../ai/aiPilot').AiPilot}
 * never calls it (only groundHeightAt / obstacles / runway), so the worker-side
 * query stubs it to `true`.
 */
export interface SerializedHill {
    worldToLocal: number[];
    localToWorld: number[];
    baseRadius: number;
    height: number;
    worldX: number;
    worldZ: number;
    worldReach: number;
}

export interface SerializedObstacle {
    position: [number, number, number];
    radius: number;
    height: number;
}

export interface SerializedRunway {
    center: [number, number, number];
    heading: number;
    halfLength: number;
    halfWidth: number;
}

export interface SerializedWorld {
    hills: SerializedHill[];
    obstacles: SerializedObstacle[];
    runway: SerializedRunway;
}

export function serializeWorld(hills: HillCollider[], obstacles: Obstacle[], runway: Runway): SerializedWorld {
    return {
        hills: hills.map(h => ({
            worldToLocal: h.worldToLocal.toArray(),
            localToWorld: h.localToWorld.toArray(),
            baseRadius: h.baseRadius,
            height: h.height,
            worldX: h.worldX,
            worldZ: h.worldZ,
            worldReach: h.worldReach,
        })),
        obstacles: obstacles.map(o => ({
            position: [o.position.x, o.position.y, o.position.z],
            radius: o.radius,
            height: o.height,
        })),
        runway: {
            center: [runway.center.x, runway.center.y, runway.center.z],
            heading: runway.heading,
            halfLength: runway.halfLength,
            halfWidth: runway.halfWidth,
        },
    };
}

/** Rebuild a {@link SceneWorldQuery} in the worker from serialized world data. */
export function deserializeWorldQuery(world: SerializedWorld): SceneWorldQuery {
    const hills: HillCollider[] = world.hills.map(h => ({
        worldToLocal: new THREE.Matrix4().fromArray(h.worldToLocal),
        localToWorld: new THREE.Matrix4().fromArray(h.localToWorld),
        baseRadius: h.baseRadius,
        height: h.height,
        worldX: h.worldX,
        worldZ: h.worldZ,
        worldReach: h.worldReach,
    }));
    const obstacles: Obstacle[] = world.obstacles.map(o => ({
        position: new THREE.Vector3(o.position[0], o.position[1], o.position[2]),
        radius: o.radius,
        height: o.height,
    }));
    const runway: Runway = {
        center: new THREE.Vector3(world.runway.center[0], world.runway.center[1], world.runway.center[2]),
        heading: world.runway.heading,
        halfLength: world.runway.halfLength,
        halfWidth: world.runway.halfWidth,
    };
    // isLand is unused by the AI pilot; stub to land everywhere.
    return new SceneWorldQuery(hills, () => true, obstacles, runway);
}
