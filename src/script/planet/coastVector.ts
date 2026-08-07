/** LVR1 OSM land polygon tile decode + point-in-polygon queries. */

import { unzlibSync } from 'fflate';

export const LVR_MAGIC = 0x3152564c; // 'LVR1' little-endian

export interface LonLat {
    lon: number;
    lat: number;
}

export interface CoastPolygon {
    /** Outer ring (lon, lat), closed or open — treated as closed. */
    exterior: LonLat[];
    /** Interior rings (holes), same winding as baked by tools/bake_osm_coast.py. */
    holes: LonLat[][];
}

export interface CoastVectorTile {
    polygons: CoastPolygon[];
}

/**
 * Decode a zlib-compressed LVR1 blob into a CoastVectorTile.
 * Accepts either the raw compressed bytes or an already-inflated payload.
 */
export function decodeLvr(bytes: ArrayBuffer | Uint8Array): CoastVectorTile {
    const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let payload: Uint8Array;
    if (raw.byteLength >= 4
        && raw[0] === 0x4c && raw[1] === 0x56 && raw[2] === 0x52 && raw[3] === 0x31) {
        payload = raw;
    } else {
        payload = unzlibSync(raw);
    }
    if (payload.byteLength < 6) {
        throw new Error(`LVR1 too short: ${payload.byteLength}`);
    }
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const magic = view.getUint32(0, true);
    if (magic !== LVR_MAGIC) {
        throw new Error(`Bad LVR1 magic: 0x${magic.toString(16)}`);
    }
    const polyCount = view.getUint16(4, true);
    let offset = 6;
    const polygons: CoastPolygon[] = [];
    for (let p = 0; p < polyCount; p++) {
        if (offset + 2 > payload.byteLength) {
            throw new Error(`LVR1 truncated at polygon ${p}`);
        }
        const ringCount = view.getUint16(offset, true);
        offset += 2;
        const rings: LonLat[][] = [];
        for (let r = 0; r < ringCount; r++) {
            if (offset + 2 > payload.byteLength) {
                throw new Error(`LVR1 truncated at ring ${r} of polygon ${p}`);
            }
            const vertCount = view.getUint16(offset, true);
            offset += 2;
            const ring: LonLat[] = [];
            for (let v = 0; v < vertCount; v++) {
                if (offset + 8 > payload.byteLength) {
                    throw new Error(`LVR1 truncated at vertex ${v} of ring ${r}`);
                }
                ring.push({
                    lon: view.getFloat32(offset, true),
                    lat: view.getFloat32(offset + 4, true),
                });
                offset += 8;
            }
            rings.push(ring);
        }
        if (rings.length === 0) {
            continue;
        }
        polygons.push({ exterior: rings[0], holes: rings.slice(1) });
    }
    return { polygons };
}

/** Encode an uncompressed LVR1 payload (used by tests). */
export function encodeLvrUncompressed(polygons: CoastPolygon[]): Uint8Array {
    let byteLen = 6;
    for (const poly of polygons) {
        byteLen += 2;
        byteLen += (1 + poly.holes.length) * 2;
        for (const ring of [poly.exterior, ...poly.holes]) {
            byteLen += 2 + ring.length * 8;
        }
    }
    const out = new Uint8Array(byteLen);
    const view = new DataView(out.buffer);
    view.setUint32(0, LVR_MAGIC, true);
    view.setUint16(4, polygons.length, true);
    let offset = 6;
    for (const poly of polygons) {
        view.setUint16(offset, 1 + poly.holes.length, true);
        offset += 2;
        for (const ring of [poly.exterior, ...poly.holes]) {
            view.setUint16(offset, ring.length, true);
            offset += 2;
            for (const pt of ring) {
                view.setFloat32(offset, pt.lon, true);
                view.setFloat32(offset + 4, pt.lat, true);
                offset += 8;
            }
        }
    }
    return out;
}

/** True when (lon, lat) lies inside any land polygon (holes subtract). */
export function isLandLonLat(lon: number, lat: number, tile: CoastVectorTile): boolean {
    for (const poly of tile.polygons) {
        if (pointInRing(lon, lat, poly.exterior)) {
            let inHole = false;
            for (const hole of poly.holes) {
                if (pointInRing(lon, lat, hole)) {
                    inHole = true;
                    break;
                }
            }
            if (!inHole) {
                return true;
            }
        }
    }
    return false;
}

/** Ray-casting point-in-polygon on a lon/lat ring. */
function pointInRing(lon: number, lat: number, ring: LonLat[]): boolean {
    const n = ring.length;
    if (n < 3) {
        return false;
    }
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = ring[i].lon;
        const yi = ring[i].lat;
        const xj = ring[j].lon;
        const yj = ring[j].lat;
        const intersect = ((yi > lat) !== (yj > lat))
            && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}
