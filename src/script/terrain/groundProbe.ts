/**
 * The height of whatever is asking for the ground, for the colliders that
 * are not solid all the way down.
 *
 * Every ground query is "the highest surface at (x, z)", which treats the
 * whole column under a surface as solid. A floating island is not: below its
 * underside there is open air to fly through. So a collider can carry a floor
 * (see `floorDepth` on SurfacePadCollider and CarrierMeshCollider, and
 * SkyIsleField), and it only counts for a query asked from at or above that
 * floor.
 *
 * Rather than thread a y through every one of the hundred ground queries,
 * the asker sets it here: the sim sets it to each aircraft's height around
 * that aircraft's pilot and flight model, the game to the player's height
 * each frame. Infinity, the default, counts every collider - the old answer.
 * One per thread: the worker and the page each have their own module.
 */
export const GROUND_PROBE = { y: Infinity };

/** Run `fn` with the probe at `y`, putting the old value back after. */
export function withGroundProbe<T>(y: number, fn: () => T): T {
    const before = GROUND_PROBE.y;
    GROUND_PROBE.y = y;
    try {
        return fn();
    } finally {
        GROUND_PROBE.y = before;
    }
}
