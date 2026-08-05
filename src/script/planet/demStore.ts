/** LRU DEM tile cache with in-flight dedupe and a priority fetch queue. */

import { decodePdm, DemTile } from './demTile';
import { indexUrl, PlanetManifest, tileUrl } from './manifest';
import { TileIndex } from './tileIndex';
import { parentOf, TileKey, tileKeyString } from './tiling';

const DEFAULT_CACHE = 512;
const DEFAULT_CONCURRENCY = 24;

interface CacheEntry {
    key: string;
    tile: DemTile;
    lastUsed: number;
}

interface FetchJob {
    id: TileKey;
    priority: number;
    resolve: (tile: DemTile | null) => void;
    reject: (err: unknown) => void;
}

export class DemStore {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly inflight = new Map<string, Promise<DemTile | null>>();
    private readonly queue: FetchJob[] = [];
    private active = 0;
    private touchCounter = 0;
    private index: TileIndex | undefined;
    private indexPromise: Promise<TileIndex | undefined> | undefined;

    constructor(
        readonly manifest: PlanetManifest,
        private readonly baseUrl = 'assets/planet',
        private readonly maxCache = DEFAULT_CACHE,
        private readonly concurrency = DEFAULT_CONCURRENCY,
    ) { }

    /** Load the existence bitmask; safe to call multiple times. */
    async loadIndex(): Promise<void> {
        if (this.index) {
            return;
        }
        if (!this.indexPromise) {
            this.indexPromise = (async () => {
                try {
                    const res = await fetch(indexUrl(this.manifest, this.baseUrl));
                    if (!res.ok) {
                        return undefined;
                    }
                    return TileIndex.decode(await res.arrayBuffer());
                } catch {
                    return undefined;
                }
            })();
        }
        this.index = await this.indexPromise;
    }

    /** True when a land tile is known to exist (or index is unavailable). */
    mayExist(id: TileKey): boolean {
        if (!this.index) {
            return true;
        }
        return this.index.has(id);
    }

    getCached(id: TileKey): DemTile | undefined {
        const key = tileKeyString(id);
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        entry.lastUsed = ++this.touchCounter;
        return entry.tile;
    }

    /**
     * Walk up the ancestry for the finest cached tile that covers `id`.
     * Returns the tile and the key it was stored under.
     */
    bestAvailable(id: TileKey): { id: TileKey; tile: DemTile } | undefined {
        let cur: TileKey | undefined = id;
        while (cur) {
            const tile = this.getCached(cur);
            if (tile) {
                return { id: cur, tile };
            }
            cur = parentOf(cur);
        }
        return undefined;
    }

    /** Request a tile. Resolves to null when the tile is missing (ocean). */
    request(id: TileKey, priority: number = 0): Promise<DemTile | null> {
        const key = tileKeyString(id);
        const cached = this.cache.get(key);
        if (cached) {
            cached.lastUsed = ++this.touchCounter;
            return Promise.resolve(cached.tile);
        }
        const pending = this.inflight.get(key);
        if (pending) {
            return pending;
        }
        if (this.index && !this.index.has(id)) {
            return Promise.resolve(null);
        }
        const promise = new Promise<DemTile | null>((resolve, reject) => {
            this.queue.push({ id, priority, resolve, reject });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.pump();
        });
        this.inflight.set(key, promise);
        promise.finally(() => this.inflight.delete(key));
        return promise;
    }

    /** Prefetch many tiles; returns when all settle. */
    async prefetch(ids: TileKey[], priority: number = 0): Promise<void> {
        await Promise.all(ids.map(id => this.request(id, priority)));
    }

    get stats(): { cached: number; inflight: number; queued: number } {
        return {
            cached: this.cache.size,
            inflight: this.inflight.size,
            queued: this.queue.length,
        };
    }

    private pump(): void {
        while (this.active < this.concurrency && this.queue.length > 0) {
            const job = this.queue.shift()!;
            this.active += 1;
            this.fetchOne(job.id)
                .then(tile => {
                    if (tile) {
                        this.put(job.id, tile);
                    }
                    job.resolve(tile);
                })
                .catch(err => job.reject(err))
                .finally(() => {
                    this.active -= 1;
                    this.pump();
                });
        }
    }

    private async fetchOne(id: TileKey): Promise<DemTile | null> {
        const url = tileUrl(this.manifest, id.z, id.x, id.y, this.baseUrl);
        const res = await fetch(url);
        if (res.status === 404) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`DEM fetch ${url}: ${res.status}`);
        }
        return decodePdm(await res.arrayBuffer());
    }

    private put(id: TileKey, tile: DemTile): void {
        const key = tileKeyString(id);
        this.cache.set(key, { key, tile, lastUsed: ++this.touchCounter });
        if (this.cache.size <= this.maxCache) {
            return;
        }
        let oldestKey: string | undefined;
        let oldestTouch = Infinity;
        for (const [k, entry] of this.cache) {
            if (entry.lastUsed < oldestTouch) {
                oldestTouch = entry.lastUsed;
                oldestKey = k;
            }
        }
        if (oldestKey !== undefined) {
            this.cache.delete(oldestKey);
        }
    }
}
