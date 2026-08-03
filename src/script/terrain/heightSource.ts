import { LonLatBounds, TileId, boundsOverlap, tileBounds, tileKey } from './tileId';
import { HeightTile, TerrainManifest, decodeR16, tileUrl } from './manifest';

/** Metres above ellipsoid (MSL ≈ ellipsoid for v1). NaN = unknown / use fallback. */
export interface HeightSource {
    /** Best available height at lon/lat degrees. Always returns a finite number. */
    heightAt(lon: number, lat: number): number;
    /** Max zoom this source can refine to near (lon,lat). */
    maxZoomAt(lon: number, lat: number): number;
    /** True if this source has (or may load) DEM data for the tile. */
    coversTile(id: TileId): boolean;
}

export class EllipsoidSeaSource implements HeightSource {
    constructor(private readonly seaLevel: number = 0) { }

    heightAt(_lon: number, _lat: number): number {
        return this.seaLevel;
    }

    maxZoomAt(_lon: number, _lat: number): number {
        return 0;
    }

    coversTile(_id: TileId): boolean {
        return false;
    }
}

export class DemTileSource implements HeightSource {
    private readonly cache = new Map<string, HeightTile | null>();
    private readonly inflight = new Map<string, Promise<HeightTile | null>>();
    private readonly lru: string[] = [];
    private readonly maxCache: number;
    private readonly baseUrl: string;

    constructor(
        readonly manifest: TerrainManifest,
        options: { baseUrl?: string; maxCache?: number } = {},
    ) {
        this.baseUrl = options.baseUrl ?? 'assets/terrain';
        this.maxCache = options.maxCache ?? 256;
    }

    get coverage(): LonLatBounds {
        return this.manifest.coverage;
    }

    coversTile(id: TileId): boolean {
        if (id.z < this.manifest.minZoom || id.z > this.manifest.maxZoom) {
            return false;
        }
        return boundsOverlap(tileBounds(id), this.manifest.coverage);
    }

    maxZoomAt(lon: number, lat: number): number {
        const c = this.manifest.coverage;
        if (lon < c.west || lon > c.east || lat < c.south || lat > c.north) {
            return -1;
        }
        return this.manifest.maxZoom;
    }

    /** Synchronous sample from resident tiles only (coarsest→finest walk). */
    heightAt(lon: number, lat: number): number {
        const c = this.manifest.coverage;
        if (lon < c.west || lon > c.east || lat < c.south || lat > c.north) {
            return Number.NaN;
        }
        for (let z = this.manifest.maxZoom; z >= this.manifest.minZoom; z--) {
            const xc = 1 << (z + 1);
            const yc = 1 << z;
            const lonSpan = 360 / xc;
            const latSpan = 180 / yc;
            const x = Math.max(0, Math.min(xc - 1, Math.floor((lon + 180) / lonSpan)));
            const y = Math.max(0, Math.min(yc - 1, Math.floor((90 - lat) / latSpan)));
            const tile = this.cache.get(tileKey({ z, x, y }));
            if (!tile) {
                continue;
            }
            const h = sampleTileBilinear(tile, lon, lat);
            if (Number.isFinite(h)) {
                return h;
            }
        }
        return Number.NaN;
    }

    getCached(id: TileId): HeightTile | null | undefined {
        return this.cache.get(tileKey(id));
    }

    requestTile(id: TileId): Promise<HeightTile | null> {
        const key = tileKey(id);
        if (this.cache.has(key)) {
            return Promise.resolve(this.cache.get(key)!);
        }
        const existing = this.inflight.get(key);
        if (existing) {
            return existing;
        }
        if (!this.coversTile(id)) {
            this.put(key, null);
            return Promise.resolve(null);
        }
        const p = this.fetchTile(id).then(tile => {
            this.inflight.delete(key);
            this.put(key, tile);
            return tile;
        }).catch(() => {
            this.inflight.delete(key);
            this.put(key, null);
            return null;
        });
        this.inflight.set(key, p);
        return p;
    }

    private async fetchTile(id: TileId): Promise<HeightTile | null> {
        const url = tileUrl(this.baseUrl, id.z, id.x, id.y, this.manifest.tilePath);
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const buf = await res.arrayBuffer();
        const { size, heights } = decodeR16(
            buf,
            this.manifest.heightMin,
            this.manifest.heightScale,
            this.manifest.nodata,
        );
        return { z: id.z, x: id.x, y: id.y, size, heights };
    }

    private put(key: string, tile: HeightTile | null): void {
        if (this.cache.has(key)) {
            const idx = this.lru.indexOf(key);
            if (idx >= 0) {
                this.lru.splice(idx, 1);
            }
        }
        this.cache.set(key, tile);
        this.lru.push(key);
        while (this.lru.length > this.maxCache) {
            const old = this.lru.shift()!;
            this.cache.delete(old);
        }
    }
}

export class CompositeHeightSource implements HeightSource {
    constructor(
        private readonly dem: DemTileSource,
        private readonly sea: EllipsoidSeaSource = new EllipsoidSeaSource(0),
    ) { }

    get demSource(): DemTileSource {
        return this.dem;
    }

    heightAt(lon: number, lat: number): number {
        const h = this.dem.heightAt(lon, lat);
        return Number.isFinite(h) ? h : this.sea.heightAt(lon, lat);
    }

    maxZoomAt(lon: number, lat: number): number {
        const z = this.dem.maxZoomAt(lon, lat);
        return z >= 0 ? z : this.sea.maxZoomAt(lon, lat);
    }

    coversTile(id: TileId): boolean {
        return this.dem.coversTile(id);
    }
}

export function sampleTileBilinear(tile: HeightTile, lon: number, lat: number): number {
    const b = tileBounds({ z: tile.z, x: tile.x, y: tile.y });
    const u = (lon - b.west) / (b.east - b.west);
    const v = (b.north - lat) / (b.north - b.south);
    const size = tile.size;
    const fx = u * (size - 1);
    const fy = v * (size - 1);
    const x0 = Math.max(0, Math.min(size - 2, Math.floor(fx)));
    const y0 = Math.max(0, Math.min(size - 2, Math.floor(fy)));
    const tx = fx - x0;
    const ty = fy - y0;
    const i00 = y0 * size + x0;
    const h00 = tile.heights[i00];
    const h10 = tile.heights[i00 + 1];
    const h01 = tile.heights[i00 + size];
    const h11 = tile.heights[i00 + size + 1];
    const samples = [h00, h10, h01, h11].filter(Number.isFinite);
    if (samples.length === 0) {
        return Number.NaN;
    }
    const a = Number.isFinite(h00) ? h00 : samples[0];
    const b10 = Number.isFinite(h10) ? h10 : a;
    const b01 = Number.isFinite(h01) ? h01 : a;
    const b11 = Number.isFinite(h11) ? h11 : a;
    const h0 = a + (b10 - a) * tx;
    const h1 = b01 + (b11 - b01) * tx;
    return h0 + (h1 - h0) * ty;
}
