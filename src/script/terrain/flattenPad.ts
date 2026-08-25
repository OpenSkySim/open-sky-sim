/**
 * Airbase flatten pad.
 *
 * The pad is now baked into the mesh, so this exists only for CPU height
 * queries — and both read the same numbers out of the manifest, which is what
 * guarantees the collision surface and the drawn surface agree by
 * construction rather than by two code paths happening to match.
 */

/** ENU-axis-aligned footprint, metres. */
export interface FlattenPad {
    centerX: number;
    centerZ: number;
    halfW: number;
    halfD: number;
    featherM: number;
    /** Baked max DEM height under the footprint. */
    heightMsl: number;
}

/**
 * Blend weight in [0,1]: 1 inside the core rectangle, 0 outside the pad,
 * smoothstep across the feather.
 */
export function padBlendWeight(e: number, n: number, pad: FlattenPad): number {
    const feather = Math.max(1, pad.featherM);
    const coreW = Math.max(0, pad.halfW - feather);
    const coreD = Math.max(0, pad.halfD - feather);
    const dx = Math.abs(e - pad.centerX);
    const dz = Math.abs(n - pad.centerZ);
    if (dx >= pad.halfW || dz >= pad.halfD) {
        return 0;
    }
    if (dx <= coreW && dz <= coreD) {
        return 1;
    }
    const tx = dx <= coreW ? 1 : 1 - (dx - coreW) / feather;
    const tz = dz <= coreD ? 1 : 1 - (dz - coreD) / feather;
    const t = Math.max(0, Math.min(1, Math.min(tx, tz)));
    return t * t * (3 - 2 * t);
}

export function applyFlattenPad(height: number, e: number, n: number, pad: FlattenPad): number {
    if (!Number.isFinite(pad.heightMsl)) {
        return height;
    }
    const w = padBlendWeight(e, n, pad);
    if (w <= 0) {
        return height;
    }
    const base = Number.isFinite(height) ? height : pad.heightMsl;
    return base + (pad.heightMsl - base) * w;
}
