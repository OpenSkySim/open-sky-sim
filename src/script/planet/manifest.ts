/** Planet DEM pyramid manifest (written by tools/bake_planet_dem.py). */

import { LonLatBounds } from './tiling';

export interface CoastMaskManifest {
    enabled: boolean;
    /** Relative path template, e.g. `{z}/{x}/{y}.lwm`. */
    path: string;
    /** Optional OSM vector land polygons, e.g. `{z}/{x}/{y}.lvr`. */
    vectorPath?: string;
    /** Optional signed-distance coast mask (not yet implemented). */
    sdfPath?: string;
    source?: string;
    coverage: LonLatBounds;
}

export interface PlanetManifest {
    version: number;
    scheme: 'geographic-quadtree';
    ellipsoid: 'WGS84';
    tileSize: number;
    encoding: 'uint16';
    compression: 'zlib';
    nodata: number;
    minZoom: number;
    maxZoom: number;
    heightMin: number;
    heightMax: number;
    seaLevel: number;
    coverage: LonLatBounds;
    enuOrigin: { lat: number; lon: number; height: number };
    tilePath: string;
    indexPath: string;
    /** Max geometric error (m) introduced by drawing a tile at each zoom. */
    levelGeometricErrorM: number[];
    /** OSM land/water coast mask (added by tools/bake_osm_coast.py, manifest v3). */
    coastMask?: CoastMaskManifest;
}

export const DEFAULT_MANIFEST_URL = 'assets/planet/manifest.json';

export async function loadManifest(url: string = DEFAULT_MANIFEST_URL): Promise<PlanetManifest> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load planet manifest ${url}: ${res.status}`);
    }
    const m = await res.json() as PlanetManifest;
    if ((m.version !== 2 && m.version !== 3) || m.scheme !== 'geographic-quadtree') {
        throw new Error(`Unsupported planet manifest: version=${m.version} scheme=${m.scheme}`);
    }
    return m;
}

export function tileUrl(manifest: PlanetManifest, z: number, x: number, y: number, base = 'assets/planet'): string {
    const rel = manifest.tilePath
        .replace('{z}', String(z))
        .replace('{x}', String(x))
        .replace('{y}', String(y));
    return `${base}/${rel}`;
}

export function indexUrl(manifest: PlanetManifest, base = 'assets/planet'): string {
    return `${base}/${manifest.indexPath}`;
}

function expandTilePath(template: string, z: number, x: number, y: number): string {
    return template
        .replace('{z}', String(z))
        .replace('{x}', String(x))
        .replace('{y}', String(y));
}

export function coastMaskUrl(
    manifest: PlanetManifest,
    z: number,
    x: number,
    y: number,
    base = 'assets/planet',
): string {
    const rel = expandTilePath(manifest.coastMask?.path ?? '{z}/{x}/{y}.lwm', z, x, y);
    return `${base}/${rel}`;
}

export function coastVectorUrl(
    manifest: PlanetManifest,
    z: number,
    x: number,
    y: number,
    base = 'assets/planet',
): string {
    const rel = expandTilePath(manifest.coastMask?.vectorPath ?? '{z}/{x}/{y}.lvr', z, x, y);
    return `${base}/${rel}`;
}
