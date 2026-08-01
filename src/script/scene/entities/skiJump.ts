/**
 * Carrier-style ski-jump ramp: curved incline along the runway takeoff axis.
 * Surface height is sampled for gear springs via {@link sampleSkiJumpSurfaceY}.
 */

/** Ramp length along takeoff (+Z when heading=0), metres. */
export const SKI_JUMP_LENGTH_M = 90;
/** Tip height above flat deck, metres. */
export const SKI_JUMP_HEIGHT_M = 12;
/** Ramp width across the runway, metres. */
export const SKI_JUMP_WIDTH_M = 48;

/** Analytic ski-jump collider matching the lib:skiJump mesh. */
export interface SkiJumpCollider {
    /** World XZ of the ramp origin (south/base end at y=0). */
    originX: number;
    originZ: number;
    /** Runway heading (rad); 0 = takeoff along +Z. */
    heading: number;
    length: number;
    height: number;
    halfWidth: number;
}

export function createSkiJumpCollider(
    originX: number,
    originZ: number,
    heading: number,
    length = SKI_JUMP_LENGTH_M,
    height = SKI_JUMP_HEIGHT_M,
    width = SKI_JUMP_WIDTH_M,
): SkiJumpCollider {
    return {
        originX,
        originZ,
        heading,
        length,
        height,
        halfWidth: width * 0.5,
    };
}

/**
 * Deck height along the ramp for progress t in [0,1] (0 = base, 1 = tip).
 * Cosine arc: flat derivative at the base, steepest at the tip (~12° for defaults).
 */
export function skiJumpDeckHeight(t: number, height: number): number {
    const u = Math.max(0, Math.min(1, t));
    return height * (1 - Math.cos((Math.PI * 0.5) * u));
}

/**
 * Surface Y of a ski jump at (worldX, worldZ), or 0 if outside the ramp footprint.
 * Local frame: origin at base, +localZ toward tip (takeoff).
 */
export function sampleSkiJumpSurfaceY(worldX: number, worldZ: number, ramp: SkiJumpCollider): number {
    const cos = Math.cos(ramp.heading);
    const sin = Math.sin(ramp.heading);
    const dx = worldX - ramp.originX;
    const dz = worldZ - ramp.originZ;
    // Rotate world delta into ramp local XZ (heading 0 → identity).
    const localX = dx * cos + dz * sin;
    const localZ = -dx * sin + dz * cos;
    if (localZ < 0 || localZ > ramp.length) {
        return 0;
    }
    if (Math.abs(localX) > ramp.halfWidth) {
        return 0;
    }
    return skiJumpDeckHeight(localZ / ramp.length, ramp.height);
}

/** Highest ski-jump surface among ramps, or 0. */
export function sampleSkiJumpSurfaceYMax(
    worldX: number,
    worldZ: number,
    ramps: readonly SkiJumpCollider[],
): number {
    let maxY = 0;
    for (let i = 0; i < ramps.length; i++) {
        const y = sampleSkiJumpSurfaceY(worldX, worldZ, ramps[i]);
        if (y > maxY) maxY = y;
    }
    return maxY;
}
