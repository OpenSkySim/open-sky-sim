/** DEM-based coastline detection for LOD and shallow-water bands. */

import { DemStore } from './demStore';
import { TileKey, edgeNeighbors } from './tiling';

/** Match {@link meshBuilder.WATER_HEIGHT_EPS_M}. */
const WATER_HEIGHT_EPS_M = 0.5;

function isWaterHeight(h: number, seaLevel: number): boolean {
    return !Number.isFinite(h) || h <= seaLevel + WATER_HEIGHT_EPS_M;
}

/**
 * True when the height grid contains both dry land and open water.
 * Used to drive extra quadtree refinement near shorelines.
 */
export function demTileIsCoastal(heights: ArrayLike<number>, seaLevel: number): boolean {
    let land = false;
    let water = false;
    for (let i = 0; i < heights.length; i++) {
        if (isWaterHeight(heights[i], seaLevel)) {
            water = true;
        } else {
            land = true;
        }
        if (land && water) {
            return true;
        }
    }
    return false;
}

/**
 * Grid of shortest 4-neighbour steps to the nearest land/water boundary.
 * 0 = on the shoreline; 65535 = unreachable (should not happen on mixed tiles).
 */
export function buildCoastDistanceGrid(
    heights: ArrayLike<number>,
    size: number,
    seaLevel: number,
): Uint16Array {
    const n = size;
    const count = n * n;
    const dist = new Uint16Array(count);
    dist.fill(65535);
    const isWater = (i: number) => isWaterHeight(heights[i], seaLevel);

    const queue: number[] = [];
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const i = y * n + x;
            const w = isWater(i);
            let boundary = false;
            if (x > 0 && isWater(i - 1) !== w) {
                boundary = true;
            }
            if (x + 1 < n && isWater(i + 1) !== w) {
                boundary = true;
            }
            if (y > 0 && isWater(i - n) !== w) {
                boundary = true;
            }
            if (y + 1 < n && isWater(i + n) !== w) {
                boundary = true;
            }
            if (boundary) {
                dist[i] = 0;
                queue.push(i);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const i = queue[head++];
        const d = dist[i];
        if (d >= 65534) {
            continue;
        }
        const y = (i / n) | 0;
        const x = i - y * n;
        const tryPush = (ni: number) => {
            if (dist[ni] > d + 1) {
                dist[ni] = d + 1;
                queue.push(ni);
            }
        };
        if (x > 0) {
            tryPush(i - 1);
        }
        if (x + 1 < n) {
            tryPush(i + 1);
        }
        if (y > 0) {
            tryPush(i - n);
        }
        if (y + 1 < n) {
            tryPush(i + n);
        }
    }
    return dist;
}

function coastalFromCachedTile(
    store: DemStore,
    id: TileKey,
    seaLevel: number,
): boolean {
    const tile = store.getCached(id);
    return tile ? demTileIsCoastal(tile.heights, seaLevel) : false;
}

/**
 * Refresh {@link coastal}: mixed land/water in this tile, an ancestor tile,
 * or a same-zoom neighbour (open water beside an island).
 */
export function refreshNodeCoastal(
    node: { id: TileKey; coastal: boolean },
    store: DemStore,
    seaLevel: number,
): void {
    if (coastalFromCachedTile(store, node.id, seaLevel)) {
        node.coastal = true;
        return;
    }

    let id: TileKey | undefined = node.id;
    while (id && id.z > 0) {
        id = { z: id.z - 1, x: id.x >> 1, y: id.y >> 1 };
        if (coastalFromCachedTile(store, id, seaLevel)) {
            node.coastal = true;
            return;
        }
    }

    for (const nb of edgeNeighbors(node.id)) {
        if (store.mayExist(nb) && coastalFromCachedTile(store, nb, seaLevel)) {
            node.coastal = true;
            return;
        }
    }

    node.coastal = false;
}
