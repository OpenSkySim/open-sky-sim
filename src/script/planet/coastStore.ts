/** LRU coast tile cache (raster mask + optional vector polygons). */

import { CoastMaskTile, decodeLwm } from './coastMask';
import { CoastVectorTile, decodeLvr } from './coastVector';
import { coastMaskUrl, coastVectorUrl, indexUrl, PlanetManifest } from './manifest';
import { TileIndex } from './tileIndex';
import { parentOf, TileKey, tileKeyString } from './tiling';

export type CoastTile = CoastMaskTile & { vector?: CoastVectorTile };

const DEFAULT_CACHE = 512;
const DEFAULT_CONCURRENCY = 24;

interface CacheEntry {
    key: string;
    tile: CoastTile;
    lastUsed: number;
}

interface FetchJob {
    id: TileKey;
    priority: number;
    resolve: (tile: CoastTile | null) => void;
    reject: (err: unknown) => void;
}

export class CoastStore {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly inflight = new Map<string, Promise<CoastTile | null>>();
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

    get enabled(): boolean {
        return this.manifest.coastMask?.enabled === true;
    }

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

    mayExist(id: TileKey): boolean {
        if (!this.enabled) {
            return false;
        }
        if (!this.index) {
            return true;
        }
        return this.index.has(id);
    }

    getCached(id: TileKey): CoastTile | undefined {
        const key = tileKeyString(id);
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        entry.lastUsed = ++this.touchCounter;
        return entry.tile;
    }

    bestAvailable(id: TileKey): { id: TileKey; tile: CoastTile } | undefined {
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

    request(id: TileKey, priority: number = 0): Promise<CoastTile | null> {
        if (!this.enabled) {
            return Promise.resolve(null);
        }
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
        const promise = new Promise<CoastTile | null>((resolve, reject) => {
            this.queue.push({ id, priority, resolve, reject });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.pump();
        });
        this.inflight.set(key, promise);
        promise.finally(() => this.inflight.delete(key));
        return promise;
    }

    async prefetch(ids: TileKey[], priority: number = 0): Promise<void> {
        if (!this.enabled) {
            return;
        }
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
                .catch(err => {
                    console.warn(`Coast tile ${tileKeyString(job.id)} failed:`, err);
                    job.resolve(null);
                })
                .finally(() => {
                    this.active -= 1;
                    this.pump();
                });
        }
    }

    private async fetchOne(id: TileKey): Promise<CoastTile | null> {
        try {
            const lwmUrl = coastMaskUrl(this.manifest, id.z, id.x, id.y, this.baseUrl);
            const lwmRes = await fetch(lwmUrl);
            if (lwmRes.status === 404) {
                return null;
            }
            if (!lwmRes.ok) {
                console.warn(`Coast mask fetch ${lwmUrl}: ${lwmRes.status}`);
                return null;
            }
            const mask = decodeLwm(await lwmRes.arrayBuffer());
            let vector: CoastVectorTile | undefined;
            const lvrUrl = coastVectorUrl(this.manifest, id.z, id.x, id.y, this.baseUrl);
            try {
                const lvrRes = await fetch(lvrUrl);
                if (lvrRes.ok) {
                    vector = decodeLvr(await lvrRes.arrayBuffer());
                }
            } catch {
                // Vector tiles are optional until rebake completes.
            }
            return { ...mask, vector };
        } catch (err) {
            console.warn(`Coast tile ${tileKeyString(id)} fetch failed:`, err);
            return null;
        }
    }

    private put(id: TileKey, tile: CoastTile): void {
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
