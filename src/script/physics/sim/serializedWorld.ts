import * as THREE from 'three';
import { Obstacle, Runway, SceneWorldQuery } from '../../ai/worldQuery';
import { CarrierMeshCollider } from '../../scene/entities/carrierDeck';
import {
    ArrestorCableField,
    ArrestorCableLocal,
    arrestorCableLocals,
    buildArrestorCableField,
} from '../../scene/entities/arrestorCables';
import { HillCollider } from '../../scene/entities/hillCollider';
import { SurfacePadCollider } from '../../scene/entities/surfacePad';
import { SkiJumpCollider } from '../../scene/entities/skiJump';

/**
 * Plain, structured-clone-safe views of the static world the AI pilots need
 * (terrain hills, ski jumps, carrier meshes, static obstacles, the runway).
 * These are posted once to the combat sim worker so it can rebuild a
 * {@link SceneWorldQuery} on its side.
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

export interface SerializedSkiJump {
    originX: number;
    originY: number;
    originZ: number;
    heading: number;
    length: number;
    height: number;
    halfWidth: number;
}

export interface SerializedCarrierMesh {
    originX: number;
    originY: number;
    originZ: number;
    triangles: number[];
    aabb: { min: [number, number, number]; max: [number, number, number] };
}

/** Structured-clone-safe arrestor cable field (one carrier). */
export interface SerializedArrestorCables {
    originX: number;
    originY: number;
    originZ: number;
    /** Unit landing/roll-out direction. */
    deckAxis: [number, number, number];
    /** Local endpoints [ax, ay, az, bx, by, bz] per cable. */
    segmentsLocal: [number, number, number, number, number, number][];
}

export interface SerializedHeightGrid {
    /** Southwest corner of cell (0,0) in world XZ. */
    originX: number;
    originZ: number;
    cellSize: number;
    cols: number;
    rows: number;
    /** Row-major heights (row = +Z). */
    heights: number[];
}

export interface SerializedWorld {
    hills: SerializedHill[];
    obstacles: SerializedObstacle[];
    runway: SerializedRunway;
    skiJumps?: SerializedSkiJump[];
    carrierMeshes?: SerializedCarrierMesh[];
    arrestorCables?: SerializedArrestorCables[];
    heightGrid?: SerializedHeightGrid;
    /** Flat solid surfaces — runway strip, pavement pads (already structured-clone-safe). */
    surfacePads?: SurfacePadCollider[];
    /** Static scenery collision soups — hangars, towers, depots (same layout as carrier meshes). */
    sceneryMeshes?: SerializedCarrierMesh[];
}

export function serializeWorld(
    hills: HillCollider[],
    obstacles: Obstacle[],
    runway: Runway,
    skiJumps: readonly SkiJumpCollider[] = [],
    carrierMeshes: readonly CarrierMeshCollider[] = [],
    arrestorCables: readonly ArrestorCableField[] = [],
    heightGrid?: SerializedHeightGrid,
    surfacePads: readonly SurfacePadCollider[] = [],
    sceneryMeshes: readonly CarrierMeshCollider[] = [],
): SerializedWorld {
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
        skiJumps: skiJumps.map(r => ({
            originX: r.originX,
            originY: r.originY,
            originZ: r.originZ,
            heading: r.heading,
            length: r.length,
            height: r.height,
            halfWidth: r.halfWidth,
        })),
        carrierMeshes: carrierMeshes.map(c => ({
            originX: c.originX,
            originY: c.originY,
            originZ: c.originZ,
            triangles: c.triangles,
            aabb: c.aabb,
        })),
        arrestorCables: arrestorCables.map(f => ({
            originX: f.originX,
            originY: f.originY,
            originZ: f.originZ,
            deckAxis: [f.deckAxis.x, f.deckAxis.y, f.deckAxis.z],
            segmentsLocal: f.segments.map(s => [
                s.a.x - f.originX, s.a.y - f.originY, s.a.z - f.originZ,
                s.b.x - f.originX, s.b.y - f.originY, s.b.z - f.originZ,
            ] as [number, number, number, number, number, number]),
        })),
        heightGrid,
        surfacePads: surfacePads.map(p => ({ ...p })),
        sceneryMeshes: sceneryMeshes.map(c => ({
            originX: c.originX,
            originY: c.originY,
            originZ: c.originZ,
            triangles: c.triangles,
            aabb: c.aabb,
        })),
    };
}

/** Sample a coarse ENU height grid for the combat-sim worker. */
export function sampleHeightGrid(
    heightAt: (x: number, z: number) => number,
    centerX: number,
    centerZ: number,
    halfExtent: number = 40000,
    cellSize: number = 500,
): SerializedHeightGrid {
    const cols = Math.floor((halfExtent * 2) / cellSize) + 1;
    const rows = cols;
    const originX = centerX - halfExtent;
    const originZ = centerZ - halfExtent;
    const heights = new Array<number>(cols * rows);
    for (let row = 0; row < rows; row++) {
        const z = originZ + row * cellSize;
        for (let col = 0; col < cols; col++) {
            const x = originX + col * cellSize;
            heights[row * cols + col] = heightAt(x, z);
        }
    }
    return { originX, originZ, cellSize, cols, rows, heights };
}

function heightFromGrid(grid: SerializedHeightGrid, x: number, z: number): number {
    const u = (x - grid.originX) / grid.cellSize;
    const v = (z - grid.originZ) / grid.cellSize;
    if (u < 0 || v < 0 || u > grid.cols - 1 || v > grid.rows - 1) {
        return 0;
    }
    const x0 = Math.floor(u);
    const z0 = Math.floor(v);
    const x1 = Math.min(grid.cols - 1, x0 + 1);
    const z1 = Math.min(grid.rows - 1, z0 + 1);
    const tx = u - x0;
    const tz = v - z0;
    const h00 = grid.heights[z0 * grid.cols + x0];
    const h10 = grid.heights[z0 * grid.cols + x1];
    const h01 = grid.heights[z1 * grid.cols + x0];
    const h11 = grid.heights[z1 * grid.cols + x1];
    return h00 * (1 - tx) * (1 - tz) + h10 * tx * (1 - tz) + h01 * (1 - tx) * tz + h11 * tx * tz;
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
    const skiJumps: SkiJumpCollider[] = (world.skiJumps ?? []).map(r => ({
        originX: r.originX,
        originY: r.originY ?? 0,
        originZ: r.originZ,
        heading: r.heading,
        length: r.length,
        height: r.height,
        halfWidth: r.halfWidth,
    }));
    const carrierMeshes: CarrierMeshCollider[] = (world.carrierMeshes ?? []).map(c => ({
        originX: c.originX,
        originY: c.originY,
        originZ: c.originZ,
        triangles: c.triangles,
        aabb: c.aabb,
    }));
    // isLand is unused by the AI pilot; stub to land everywhere.
    const baseHeightAt = world.heightGrid
        ? (x: number, z: number) => heightFromGrid(world.heightGrid!, x, z)
        : () => 0;
    const sceneryMeshes: CarrierMeshCollider[] = (world.sceneryMeshes ?? []).map(c => ({
        originX: c.originX,
        originY: c.originY,
        originZ: c.originZ,
        triangles: c.triangles,
        aabb: c.aabb,
    }));
    return new SceneWorldQuery(
        hills, () => true, obstacles, runway, skiJumps, carrierMeshes, baseHeightAt,
        world.surfacePads ?? [], sceneryMeshes,
    );
}

/** Rebuild arrestor cable fields for combat-sim trap physics. */
export function deserializeArrestorCables(world: SerializedWorld): ArrestorCableField[] {
    const list = world.arrestorCables ?? [];
    return list.map(s => {
        const field = buildArrestorCableField(
            s.originX, s.originY, s.originZ,
            new THREE.Vector3(s.deckAxis[0], s.deckAxis[1], s.deckAxis[2]),
        );
        // Prefer serialized local endpoints when present (keeps worker in sync with author).
        if (s.segmentsLocal.length > 0) {
            field.segments.length = 0;
            for (const seg of s.segmentsLocal) {
                field.segments.push({
                    a: new THREE.Vector3(s.originX + seg[0], s.originY + seg[1], s.originZ + seg[2]),
                    b: new THREE.Vector3(s.originX + seg[3], s.originY + seg[4], s.originZ + seg[5]),
                });
            }
        }
        return field;
    });
}

/** Helper: default Kuznetsov cable field at an origin (for game-side serialize). */
export function defaultArrestorCableField(
    originX: number,
    originY: number,
    originZ: number,
    orientation?: THREE.Quaternion,
): ArrestorCableField {
    return buildArrestorCableField(originX, originY, originZ, undefined, orientation);
}

/** Expose locals for callers that need to inspect layout without THREE world build. */
export function defaultArrestorLocals(): ArrestorCableLocal[] {
    return arrestorCableLocals();
}
