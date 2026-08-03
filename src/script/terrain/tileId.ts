/** Cesium-style geographic tiling over the whole WGS84 ellipsoid. */

export interface TileId {
    z: number;
    x: number;
    y: number;
}

export interface LonLatBounds {
    west: number;
    south: number;
    east: number;
    north: number;
}

export function xCount(z: number): number {
    return 1 << (z + 1);
}

export function yCount(z: number): number {
    return 1 << z;
}

export function tileKey(id: TileId): string {
    return `${id.z}/${id.x}/${id.y}`;
}

export function parseTileKey(key: string): TileId {
    const [zs, xs, ys] = key.split('/');
    return { z: Number(zs), x: Number(xs), y: Number(ys) };
}

/** Lon/lat AABB for a tile (degrees). */
export function tileBounds(id: TileId): LonLatBounds {
    const xc = xCount(id.z);
    const yc = yCount(id.z);
    const lonSpan = 360 / xc;
    const latSpan = 180 / yc;
    const west = -180 + id.x * lonSpan;
    const east = west + lonSpan;
    const north = 90 - id.y * latSpan;
    const south = north - latSpan;
    return { west, south, east, north };
}

export function childrenOf(id: TileId): TileId[] {
    const z = id.z + 1;
    const x = id.x * 2;
    const y = id.y * 2;
    return [
        { z, x, y },
        { z, x: x + 1, y },
        { z, x, y: y + 1 },
        { z, x: x + 1, y: y + 1 },
    ];
}

export function parentOf(id: TileId): TileId | undefined {
    if (id.z <= 0) {
        return undefined;
    }
    return { z: id.z - 1, x: id.x >> 1, y: id.y >> 1 };
}

/** Root tiles covering the whole Earth (z0: 2×1). */
export function rootTiles(): TileId[] {
    return [
        { z: 0, x: 0, y: 0 },
        { z: 0, x: 1, y: 0 },
    ];
}

export function tileContainsLonLat(bounds: LonLatBounds, lon: number, lat: number): boolean {
    return lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;
}

/** Tile containing a lon/lat at zoom z. */
export function tileAtLonLat(z: number, lon: number, lat: number): TileId {
    const xc = xCount(z);
    const yc = yCount(z);
    const lonSpan = 360 / xc;
    const latSpan = 180 / yc;
    let x = Math.floor((lon + 180) / lonSpan);
    let y = Math.floor((90 - lat) / latSpan);
    x = Math.max(0, Math.min(xc - 1, x));
    y = Math.max(0, Math.min(yc - 1, y));
    return { z, x, y };
}

export function boundsOverlap(a: LonLatBounds, b: LonLatBounds): boolean {
    return a.west < b.east && a.east > b.west && a.south < b.north && a.north > b.south;
}

/** Approximate tile edge length in metres at the tile centre latitude. */
export function approxTileEdgeMetres(id: TileId): number {
    const b = tileBounds(id);
    const midLat = 0.5 * (b.south + b.north);
    const lonM = (b.east - b.west) * 111320 * Math.cos(midLat * Math.PI / 180);
    const latM = (b.north - b.south) * 110540;
    return Math.max(lonM, latM);
}
