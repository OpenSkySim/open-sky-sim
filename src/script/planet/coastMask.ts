/** LWM1 land/water mask tile decode + sampling. */

import { unzlibSync } from 'fflate';

export const LWM_MAGIC = 0x314D574C; // 'LWM1' little-endian
export const LWM_HEADER_BYTES = 8;
export const LWM_NODATA = 255;
export const LWM_LAND = 1;
export const LWM_WATER = 0;

export interface CoastMaskTile {
    size: number;
    /** Row-major uint8: 0=water, 1=land, 255=nodata. */
    cells: Uint8Array;
}

/**
 * Decode a zlib-compressed LWM1 blob into a CoastMaskTile.
 * Accepts either the raw compressed bytes or an already-inflated payload.
 */
export function decodeLwm(bytes: ArrayBuffer | Uint8Array): CoastMaskTile {
    const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let payload: Uint8Array;
    if (raw.byteLength >= 4
        && raw[0] === 0x4c && raw[1] === 0x57 && raw[2] === 0x4d && raw[3] === 0x31) {
        payload = raw;
    } else {
        payload = unzlibSync(raw);
    }
    if (payload.byteLength < LWM_HEADER_BYTES) {
        throw new Error(`LWM1 too short: ${payload.byteLength}`);
    }
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    const magic = view.getUint32(0, true);
    if (magic !== LWM_MAGIC) {
        throw new Error(`Bad LWM1 magic: 0x${magic.toString(16)}`);
    }
    const size = view.getUint16(4, true);
    const expected = LWM_HEADER_BYTES + size * size;
    if (payload.byteLength < expected) {
        throw new Error(`LWM1 truncated: ${payload.byteLength} < ${expected}`);
    }
    const cells = new Uint8Array(size * size);
    cells.set(payload.subarray(LWM_HEADER_BYTES, expected));
    return { size, cells };
}

/** Encode an uncompressed LWM1 payload (used by tests). */
export function encodeLwmUncompressed(cells: Uint8Array, size: number): Uint8Array {
    const out = new Uint8Array(LWM_HEADER_BYTES + size * size);
    const view = new DataView(out.buffer);
    view.setUint32(0, LWM_MAGIC, true);
    view.setUint16(4, size, true);
    view.setUint8(6, 0);
    view.setUint8(7, 0);
    out.set(cells, LWM_HEADER_BYTES);
    return out;
}

/** Nearest-neighbour sample; returns LWM_NODATA when out of range. */
export function sampleLandMaskNearest(tile: CoastMaskTile, u: number, v: number): number {
    const n = tile.size;
    const ix = Math.round(u * (n - 1));
    const iy = Math.round(v * (n - 1));
    if (ix < 0 || iy < 0 || ix >= n || iy >= n) {
        return LWM_NODATA;
    }
    return tile.cells[iy * n + ix];
}

/** True when the sample is land (not water, not nodata). */
export function isLandCell(value: number): boolean {
    return value === LWM_LAND;
}

/** True when the sample is water. */
export function isWaterCell(value: number): boolean {
    return value === LWM_WATER;
}

/** True when the sample is nodata (outside OSM coverage). */
export function isNodataCell(value: number): boolean {
    return value === LWM_NODATA;
}

/**
 * Bilinear sample in normalised tile UV ([0,1]×[0,1], v=0 at north edge).
 * Fractional land/water mix returns LWM_NODATA so callers fall back to height.
 */
export function sampleLandMaskBilinear(tile: CoastMaskTile, u: number, v: number): number {
    const n = tile.size;
    const fx = u * (n - 1);
    const fy = v * (n - 1);
    if (fx < 0 || fy < 0 || fx > n - 1 || fy > n - 1) {
        return LWM_NODATA;
    }
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(n - 1, x0 + 1);
    const y1 = Math.min(n - 1, y0 + 1);
    const c00 = tile.cells[y0 * n + x0];
    const c10 = tile.cells[y0 * n + x1];
    const c01 = tile.cells[y1 * n + x0];
    const c11 = tile.cells[y1 * n + x1];
    if (c00 === c10 && c00 === c01 && c00 === c11) {
        return c00;
    }
    // Mixed land/water in the filter footprint — treat as coast (land side wins
    // for height, callers snap to water only on unambiguous water).
    if (c00 === LWM_LAND || c10 === LWM_LAND || c01 === LWM_LAND || c11 === LWM_LAND) {
        return LWM_LAND;
    }
    return LWM_WATER;
}
