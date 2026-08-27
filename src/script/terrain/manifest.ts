/** Terrain manifest v4, written by tools/bake_planet_mesh.ts. */

import { LonLatBounds } from './tiling';

export interface MeshStreamManifest {
    /** Path template, e.g. `{z}/{x}/{y}.ptm`. */
    path: string;
    indexPath: string;
    minZoom: number;
    maxZoom: number;
    encoding: string;
    /** `gzip` when tiles are stored pre-compressed and served with the header. */
    transport?: string;
    triangleBudget: number;
    levelGeometricErrorM: number[];
    levelSkirtDepthM: number[];
    /**
     * The colours the SWATCH terrain mode quantises to, `#rrggbb`, most-used
     * first. Derived by the bake from the imagery it actually sampled, so it
     * describes this pyramid and travels with it. Absent on a pyramid baked
     * without cover, which leaves that mode with nothing to quantise to.
     */
    swatches?: string[];
    /**
     * Where this pyramid's baked colours sit in brightness. The HYBRID terrain
     * mode bands a facet against it, so it has to describe the ground actually
     * baked rather than an assumed mid-grey.
     */
    luminance?: { mid: number; spread: number };
}

export interface HeightStreamManifest {
    path: string;
    indexPath: string;
    tileSize: number;
    minZoom: number;
    maxZoom: number;
    /**
     * The single zoom every fine CPU height query samples. Pinning it is what
     * makes ground height independent of what the renderer happens to have
     * cached — the bug that made the same (x, z) return different heights
     * depending on camera position.
     */
    queryZoom: number;
    /** Always-resident fallback level, so a query outside the fine set is a
     *  coarse answer with a stated bound rather than a silent lie. */
    coarseZoom: number;
}

export interface FlattenPadManifest {
    lat: number;
    lon: number;
    halfW: number;
    halfD: number;
    featherM: number;
    /** Baked max DEM height under the footprint. */
    heightMsl: number;
}

export interface TerrainManifest {
    version: number;
    scheme: 'retro-terrain/1';
    ellipsoid: 'WGS84';
    seaLevel: number;
    coverage: LonLatBounds;
    enuOrigin: { lat: number; lon: number; height: number };
    mesh: MeshStreamManifest;
    height: HeightStreamManifest;
    flattenPads: FlattenPadManifest[];
    bake?: { tool: string; version: string; utc: string };
}

export const DEFAULT_TERRAIN_URL = 'assets/terrain/manifest.json';

export async function loadTerrainManifest(
    url: string = DEFAULT_TERRAIN_URL,
): Promise<TerrainManifest> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Failed to load terrain manifest ${url}: ${res.status}. `
            + 'The terrain pyramid is a build product — run `npm run bake:mesh`.',
        );
    }
    const m = await res.json() as TerrainManifest;
    if (m.scheme !== 'retro-terrain/1') {
        throw new Error(`Unsupported terrain manifest scheme: ${m.scheme}`);
    }
    return m;
}

function expand(template: string, z: number, x: number, y: number): string {
    return template
        .replace('{z}', String(z))
        .replace('{x}', String(x))
        .replace('{y}', String(y));
}

export function meshTileUrl(
    manifest: TerrainManifest, z: number, x: number, y: number, base: string,
): string {
    return `${base}/${expand(manifest.mesh.path, z, x, y)}`;
}

export function heightTileUrl(
    manifest: TerrainManifest, z: number, x: number, y: number, base: string,
): string {
    return `${base}/${expand(manifest.height.path, z, x, y)}`;
}

export function meshIndexUrl(manifest: TerrainManifest, base: string): string {
    return `${base}/${manifest.mesh.indexPath}`;
}

export function heightIndexUrl(manifest: TerrainManifest, base: string): string {
    return `${base}/${manifest.height.indexPath}`;
}

/** Base directory the manifest was loaded from. */
export function baseUrlOf(manifestUrl: string): string {
    const i = manifestUrl.lastIndexOf('/');
    return i < 0 ? '.' : manifestUrl.slice(0, i);
}
