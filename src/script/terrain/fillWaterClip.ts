/**
 * Cutting a tile's water sheet down to the baked areas.
 *
 * A tile across an area's edge carries the bake's sea-level fill outside it,
 * and the runtime draws its own (lifted) ground there instead, so that water
 * has to go. Keeping or dropping whole triangles by their centroid is not
 * enough: a coarse tile's water is a handful of triangles fanned across
 * 150 km, and one whose centroid fell outside took a wedge of real sea inside
 * the area with it - open sky, or the lifted fill drawn in a lighter tone,
 * reaching in from the area's edge (south of Mallorca, 2026-11-08). So the
 * triangles that straddle an edge are clipped to it.
 */

export interface LonLatBox {
    west: number;
    east: number;
    south: number;
    north: number;
}

export interface ClippedWater {
    positions: Int16Array;
    tones: Uint8Array;
    index: Uint32Array;
}

/**
 * The water inside the boxes, or undefined if nothing was cut.
 *
 * `toLonLat` must be affine in the vertex position (a tangent-plane
 * approximation is): the clip interpolates positions along edges, and that is
 * only exact when longitude and latitude vary linearly along them. New
 * vertices take the tone of the nearer original vertex, since a vertex belongs
 * to one tone. Overlapping boxes would draw their shared part twice; areas do
 * not overlap.
 */
export function clipWaterToBoxes(
    positions: ArrayLike<number>,
    tones: ArrayLike<number>,
    index: ArrayLike<number>,
    toLonLat: (x: number, y: number, z: number) => [number, number],
    boxes: readonly LonLatBox[],
): ClippedWater | undefined {
    const vertexCount = positions.length / 3;
    const lon = new Float64Array(vertexCount);
    const lat = new Float64Array(vertexCount);
    for (let v = 0; v < vertexCount; v++) {
        const [a, b] = toLonLat(positions[3 * v], positions[3 * v + 1], positions[3 * v + 2]);
        lon[v] = a;
        lat[v] = b;
    }
    const outPos: number[] = Array.from(positions);
    const outTone: number[] = Array.from(tones);
    const outIndex: number[] = [];
    let changed = false;

    type P = { x: number; y: number; z: number; lon: number; lat: number; tone: number; v: number };
    const vertex = (v: number): P => ({
        x: positions[3 * v], y: positions[3 * v + 1], z: positions[3 * v + 2],
        lon: lon[v], lat: lat[v], tone: tones[v], v,
    });
    // One half-plane of a box: keep where side(p) >= 0.
    const clip = (poly: P[], side: (p: P) => number): P[] => {
        const out: P[] = [];
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];
            const sa = side(a);
            const sb = side(b);
            if (sa >= 0) {
                out.push(a);
            }
            if ((sa >= 0) !== (sb >= 0)) {
                const t = sa / (sa - sb);
                out.push({
                    x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t,
                    lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t,
                    tone: t < 0.5 ? a.tone : b.tone, v: -1,
                });
            }
        }
        return out;
    };
    const emit = (p: P): number => {
        if (p.v >= 0) {
            return p.v;
        }
        outPos.push(Math.round(p.x), Math.round(p.y), Math.round(p.z));
        outTone.push(p.tone);
        return p.v = outTone.length - 1;
    };

    for (let t = 0; t + 2 < index.length; t += 3) {
        const i0 = index[t], i1 = index[t + 1], i2 = index[t + 2];
        const w = Math.min(lon[i0], lon[i1], lon[i2]);
        const e = Math.max(lon[i0], lon[i1], lon[i2]);
        const s = Math.min(lat[i0], lat[i1], lat[i2]);
        const n = Math.max(lat[i0], lat[i1], lat[i2]);
        if (boxes.some(a => w >= a.west && e <= a.east && s >= a.south && n <= a.north)) {
            outIndex.push(i0, i1, i2);
            continue;
        }
        changed = true;
        for (const a of boxes) {
            if (e <= a.west || w >= a.east || n <= a.south || s >= a.north) {
                continue;
            }
            let poly = [vertex(i0), vertex(i1), vertex(i2)];
            poly = clip(poly, p => p.lon - a.west);
            poly = clip(poly, p => a.east - p.lon);
            poly = clip(poly, p => p.lat - a.south);
            poly = clip(poly, p => a.north - p.lat);
            if (poly.length < 3) {
                continue;
            }
            const first = emit(poly[0]);
            for (let k = 1; k + 1 < poly.length; k++) {
                outIndex.push(first, emit(poly[k]), emit(poly[k + 1]));
            }
        }
    }
    if (!changed) {
        return undefined;
    }
    return {
        positions: Int16Array.from(outPos),
        tones: Uint8Array.from(outTone),
        index: Uint32Array.from(outIndex),
    };
}
