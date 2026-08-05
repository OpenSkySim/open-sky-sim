/**
 * Airbase flatten pad — shared by heightQuery and the mesh worker so the
 * runway mesh and the collision surface agree.
 */

import { EnuBasis, enuToGeodeticApprox } from './geodesy';
import { LonLatBounds } from './tiling';

/** ENU-axis-aligned flatten pad footprint (metres). */
export interface FlattenPadSpec {
    centerX: number;
    centerZ: number;
    halfW: number;
    halfD: number;
    featherM: number;
}

/**
 * Blend weight in [0,1]: 1 inside the core rectangle, 0 outside the pad,
 * smoothstep ramp across the feather. Matches the previous terrain pad so
 * runway/apron placement does not shift.
 */
export function padBlendWeight(e: number, n: number, spec: FlattenPadSpec): number {
    const feather = Math.max(1, spec.featherM);
    const coreW = Math.max(0, spec.halfW - feather);
    const coreD = Math.max(0, spec.halfD - feather);
    const dx = Math.abs(e - spec.centerX);
    const dz = Math.abs(n - spec.centerZ);
    if (dx >= spec.halfW || dz >= spec.halfD) {
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

export function applyFlattenPad(
    height: number,
    e: number,
    n: number,
    pad: FlattenPadSpec | undefined,
    padHeightMsl: number | undefined,
): number {
    if (!pad || padHeightMsl === undefined || !Number.isFinite(padHeightMsl)) {
        return height;
    }
    const w = padBlendWeight(e, n, pad);
    if (w <= 0) {
        return height;
    }
    const base = Number.isFinite(height) ? height : padHeightMsl;
    return base + (padHeightMsl - base) * w;
}

function padLonLatBoundsAtExtents(
    spec: FlattenPadSpec,
    basis: EnuBasis,
    halfW: number,
    halfD: number,
): LonLatBounds {
    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    for (const dx of [-halfW, halfW]) {
        for (const dz of [-halfD, halfD]) {
            const g = enuToGeodeticApprox(basis, spec.centerX + dx, spec.centerZ + dz, 0);
            west = Math.min(west, g.lon);
            east = Math.max(east, g.lon);
            south = Math.min(south, g.lat);
            north = Math.max(north, g.lat);
        }
    }
    return { west, south, east, north };
}

/** Pad core + feather skirt (tile overlap / forceRefine). */
export function padLonLatBounds(spec: FlattenPadSpec, basis: EnuBasis): LonLatBounds {
    const feather = Math.max(1, spec.featherM);
    return padLonLatBoundsAtExtents(spec, basis, spec.halfW + feather, spec.halfD + feather);
}
