import { EnuBasis, makeEnuBasis } from './geo';
import { LonLatBounds } from './tileId';

/** Manifest written by tools/build_dem_tiles.py */
export interface TerrainManifest {
    version: number;
    scheme: string;
    ellipsoid: string;
    tileSize: number;
    nodata: number;
    encoding: string;
    heightMin: number;
    heightScale: number;
    heightMax: number;
    minZoom: number;
    maxZoom: number;
    coverage: LonLatBounds;
    enuOrigin: { lat: number; lon: number; height: number };
    seaLevel: number;
    tilePath: string;
}

export const R16_MAGIC = 'R16H';
export const R16_NODATA = 65535;

export interface HeightTile {
    z: number;
    x: number;
    y: number;
    size: number;
    /** Row-major, north → south, west → east. Length size*size. */
    heights: Float32Array;
}

export function decodeR16(buffer: ArrayBuffer, heightMin: number, heightScale: number, nodata: number = R16_NODATA): {
    size: number;
    heights: Float32Array;
} {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (magic !== R16_MAGIC) {
        throw new Error(`Bad R16 magic: ${magic}`);
    }
    const fileMin = view.getFloat32(4, true);
    const fileScale = view.getFloat32(8, true);
    const size = view.getUint32(12, true);
    const hMin = Number.isFinite(fileMin) ? fileMin : heightMin;
    const hScale = fileScale > 0 ? fileScale : heightScale;
    const heights = new Float32Array(size * size);
    let off = 16;
    for (let i = 0; i < heights.length; i++, off += 2) {
        const q = view.getUint16(off, true);
        heights[i] = q === nodata ? Number.NaN : hMin + q * hScale;
    }
    return { size, heights };
}

export async function loadManifest(url: string = 'assets/terrain/manifest.json'): Promise<TerrainManifest | undefined> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return undefined;
        }
        return await res.json() as TerrainManifest;
    } catch {
        return undefined;
    }
}

export function basisFromManifest(m: TerrainManifest): EnuBasis {
    return makeEnuBasis(m.enuOrigin.lat, m.enuOrigin.lon, m.enuOrigin.height);
}

export function tileUrl(base: string, z: number, x: number, y: number, pattern: string = '{z}/{x}/{y}.r16'): string {
    const rel = pattern.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
    return `${base.replace(/\/$/, '')}/${rel}`;
}
