/**
 * Analytic collider for flat scenery surfaces (runway strip, pavement pads).
 * These meshes are placed a small epsilon above the terrain so they win the
 * depth test; the pad collider makes gear physics rest on the visible surface
 * instead of the terrain below it.
 */

/** Solid flat surface: an oriented rectangle at a fixed world height. */
export interface SurfacePadCollider {
    /** World XZ of the pad centre. */
    centerX: number;
    centerZ: number;
    /** Pad heading (rad); 0 = long axis aligned with +Z. */
    heading: number;
    /** Half extent along the pad axis (m). */
    halfLength: number;
    /** Half extent across the pad axis (m). */
    halfWidth: number;
    /** World Y of the surface top. */
    surfaceY: number;
    /** World Y of the surrounding ground the edge skirt blends down to. */
    baseY: number;
    /** Horizontal skirt width beyond the pad edge (m); avoids a hard vertical lip. */
    feather: number;
}

/**
 * Pad surface Y at (worldX, worldZ), or -Infinity when the point is outside
 * the pad footprint (plus its feather skirt). Inside the rectangle this is
 * `surfaceY`; across the skirt it ramps down to `baseY`.
 */
export function sampleSurfacePadY(
    worldX: number,
    worldZ: number,
    pad: SurfacePadCollider,
): number {
    const cos = Math.cos(pad.heading);
    const sin = Math.sin(pad.heading);
    const dx = worldX - pad.centerX;
    const dz = worldZ - pad.centerZ;
    // Rotate world delta into pad local XZ (heading 0 → identity).
    const localX = dx * cos + dz * sin;
    const localZ = -dx * sin + dz * cos;
    const outX = Math.abs(localX) - pad.halfWidth;
    const outZ = Math.abs(localZ) - pad.halfLength;
    const out = Math.max(outX, outZ);
    if (out <= 0) return pad.surfaceY;
    if (out >= pad.feather) return -Infinity;
    return pad.baseY + (pad.surfaceY - pad.baseY) * (1 - out / pad.feather);
}

/** Highest pad surface among colliders, or -Infinity when over none. */
export function sampleSurfacePadYMax(
    worldX: number,
    worldZ: number,
    pads: readonly SurfacePadCollider[],
): number {
    let maxY = -Infinity;
    for (let i = 0; i < pads.length; i++) {
        const y = sampleSurfacePadY(worldX, worldZ, pads[i]);
        if (y > maxY) maxY = y;
    }
    return maxY;
}
