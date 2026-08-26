import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DemTile, decodePdm, encodePdmUncompressed } from './demTile';
import { makeEnuBasis } from './geodesy';
import { HeightField } from './heightField';
import { TerrainManifest } from './manifest';
import { TileKey, tileAtLonLat, tileBounds, tileKeyString } from './tiling';
import { TileStore } from './tileStore';

const ORIGIN = { lat: 28.0015, lon: -15.3937, height: 0 };
const BASIS = makeEnuBasis(ORIGIN.lat, ORIGIN.lon, ORIGIN.height);
const QUERY_ZOOM = 11;
const COARSE_ZOOM = 7;
const TILE_SIZE = 33;

function manifest(over: Partial<TerrainManifest> = {}): TerrainManifest {
    return {
        version: 4,
        scheme: 'retro-terrain/1',
        ellipsoid: 'WGS84',
        seaLevel: 0,
        coverage: { west: -16, south: 27.5, east: -15, north: 28.5 },
        enuOrigin: ORIGIN,
        mesh: {
            path: '{z}/{x}/{y}.ptm', indexPath: 'i', minZoom: 0, maxZoom: 12,
            encoding: 'PTM1', triangleBudget: 6144,
            levelGeometricErrorM: [], levelSkirtDepthM: [],
        },
        height: {
            path: '{z}/{x}/{y}.pdm', indexPath: 'i', tileSize: TILE_SIZE,
            minZoom: 0, maxZoom: QUERY_ZOOM,
            queryZoom: QUERY_ZOOM, coarseZoom: COARSE_ZOOM,
        },
        flattenPads: [],
        ...over,
    };
}

/**
 * A store backed by a scripted set of tiles. `served` records what was asked
 * for so a test can assert the query never reached for anything else.
 */
function makeStore(heights: (id: TileKey) => number | undefined) {
    const served: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        const key = String(input).replace('b/', '').replace('.pdm', '');
        served.push(key);
        const [z, x, y] = key.split('/').map(Number);
        const h = heights({ z, x, y });
        if (h === undefined) {
            return { ok: false, status: 404 } as Response;
        }
        const grid = new Float32Array(TILE_SIZE * TILE_SIZE).fill(h);
        const bytes = encodePdmUncompressed(grid, TILE_SIZE, 0);
        return {
            ok: true,
            status: 200,
            arrayBuffer: async () => bytes.buffer.slice(
                bytes.byteOffset, bytes.byteOffset + bytes.byteLength,
            ),
        } as Response;
    }) as typeof fetch;

    const store = new TileStore<DemTile>({
        baseUrl: 'b',
        url: (id) => `b/${tileKeyString(id)}.pdm`,
        decode: (buf) => decodePdm(buf),
        sizeOf: (t) => t.heights.byteLength,
        maxBytes: 50_000_000,
        retryBackoffMs: 1,
    });
    return { store, served, restore: () => { globalThis.fetch = originalFetch; } };
}

/** A lon/lat inside the coverage, and the ENU point matching it. */
const TEST_LON = -15.40;
const TEST_LAT = 28.00;

describe('HeightField', () => {
    it('samples the fine tier when it is resident', async () => {
        const fineId = tileAtLonLat(QUERY_ZOOM, TEST_LON, TEST_LAT);
        const h = makeStore(id => (id.z === QUERY_ZOOM && id.x === fineId.x && id.y === fineId.y
            ? 123 : undefined));
        try {
            const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
            await hf.ensureLoaded({
                west: TEST_LON, east: TEST_LON, south: TEST_LAT, north: TEST_LAT,
            });
            assert.equal(hf.heightAtLonLat(TEST_LON, TEST_LAT), 123);
        } finally {
            h.restore();
        }
    });

    it('falls back to the coarse tier with a reported resolution', async () => {
        const coarseId = tileAtLonLat(COARSE_ZOOM, TEST_LON, TEST_LAT);
        const h = makeStore(id => (id.z === COARSE_ZOOM && id.x === coarseId.x
            && id.y === coarseId.y ? 40 : undefined));
        try {
            const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
            await hf.loadCoarse();
            assert.equal(hf.heightAtLonLat(TEST_LON, TEST_LAT), 40);
        } finally {
            h.restore();
        }
    });

    it('returns sea level when nothing covers the point', async () => {
        const h = makeStore(() => undefined);
        try {
            const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
            assert.equal(hf.heightAtLonLat(TEST_LON, TEST_LAT), 0);
        } finally {
            h.restore();
        }
    });

    describe('independence from renderer state (regression)', () => {
        it('returns the identical height no matter what else is cached', async () => {
            // The old bug: finestCached() walked maxZoom downwards through the
            // renderer's LRU, so loading a finer tile silently changed the
            // answer. Here the fine tier is pinned to queryZoom, so filling the
            // store with other zooms must change nothing.
            const fineId = tileAtLonLat(QUERY_ZOOM, TEST_LON, TEST_LAT);
            const h = makeStore(id => {
                if (id.z === QUERY_ZOOM && id.x === fineId.x && id.y === fineId.y) return 100;
                // Every other zoom reports a wildly different height.
                return 999;
            });
            try {
                const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
                await hf.ensureLoaded({
                    west: TEST_LON, east: TEST_LON, south: TEST_LAT, north: TEST_LAT,
                });
                const before = hf.heightAtLonLat(TEST_LON, TEST_LAT);
                assert.equal(before, 100);

                // Now load every other zoom over the same point, as a renderer
                // climbing and descending would.
                for (let z = 0; z <= 12; z++) {
                    if (z === QUERY_ZOOM) continue;
                    await h.store.request(tileAtLonLat(z, TEST_LON, TEST_LAT), 1);
                }
                assert.equal(
                    hf.heightAtLonLat(TEST_LON, TEST_LAT), before,
                    'render cache state leaked into a height query',
                );
            } finally {
                h.restore();
            }
        });

        it('only ever requests the query zoom for a fine lookup', async () => {
            const fineId = tileAtLonLat(QUERY_ZOOM, TEST_LON, TEST_LAT);
            const h = makeStore(() => 10);
            try {
                const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
                await hf.ensureLoaded({
                    west: TEST_LON, east: TEST_LON, south: TEST_LAT, north: TEST_LAT,
                });
                for (const key of h.served) {
                    assert.ok(
                        key.startsWith(`${QUERY_ZOOM}/`),
                        `fine lookup fetched ${key}, not zoom ${QUERY_ZOOM}`,
                    );
                }
                assert.ok(h.served.includes(tileKeyString(fineId)));
            } finally {
                h.restore();
            }
        });

        it('does not disturb cache recency, so queries cannot cause eviction', async () => {
            const h = makeStore(() => 5);
            try {
                const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
                await hf.ensureLoaded({
                    west: TEST_LON, east: TEST_LON, south: TEST_LAT, north: TEST_LAT,
                });
                const gen = h.store.nextGeneration();
                hf.heightAtLonLat(TEST_LON, TEST_LAT);
                assert.equal(h.store.nextGeneration(), gen + 1,
                    'a query should not advance or touch the draw generation');
            } finally {
                h.restore();
            }
        });
    });

    describe('resolution reporting', () => {
        it('reports fine, coarse and none correctly', async () => {
            const fineId = tileAtLonLat(QUERY_ZOOM, TEST_LON, TEST_LAT);
            const coarseId = tileAtLonLat(COARSE_ZOOM, TEST_LON, TEST_LAT);
            const h = makeStore(id => {
                if (id.z === QUERY_ZOOM && id.x === fineId.x && id.y === fineId.y) return 100;
                if (id.z === COARSE_ZOOM && id.x === coarseId.x && id.y === coarseId.y) return 20;
                return undefined;
            });
            try {
                const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
                assert.equal(hf.heightResolutionAt(0, 0), 'none');
                await hf.loadCoarse();
                assert.equal(hf.heightResolutionAt(0, 0), 'coarse');
                await hf.ensureLoadedAroundEnu(0, 0, 100);
                assert.equal(hf.heightResolutionAt(0, 0), 'fine');
            } finally {
                h.restore();
            }
        });
    });

    describe('flatten pad', () => {
        const pad = {
            centerX: 0, centerZ: 0, halfW: 500, halfD: 2000,
            featherM: 80, heightMsl: 93.92,
        };

        it('flattens land inside the pad core to the baked height', async () => {
            const h = makeStore(() => 30);
            try {
                const hf = new HeightField({
                    manifest: manifest(), store: h.store, basis: BASIS, pads: [pad],
                });
                await hf.loadCoarse();
                await hf.ensureLoadedAroundEnu(0, 0, 3000);
                assert.ok(Math.abs(hf.heightAtEnu(0, 0) - 93.92) < 1e-6);
            } finally {
                h.restore();
            }
        });

        it('leaves ground outside the pad alone', async () => {
            const h = makeStore(() => 30);
            try {
                const hf = new HeightField({
                    manifest: manifest(), store: h.store, basis: BASIS, pads: [pad],
                });
                await hf.ensureLoadedAroundEnu(9000, 0, 2000);
                assert.equal(hf.geodeticHeightAtEnu(9000, 0), 30);
                // Scene Y is that elevation on the curved surface, ~6.3 m below
                // the tangent plane at 9 km out. See HeightSampler.heightAtEnu.
                const drop = 9000 ** 2 / (2 * 6378137);
                assert.ok(Math.abs(hf.heightAtEnu(9000, 0) - (30 - drop)) < 0.2);
            } finally {
                h.restore();
            }
        });

        it('never flattens water', async () => {
            const h = makeStore(() => 0);
            try {
                const hf = new HeightField({
                    manifest: manifest(), store: h.store, basis: BASIS, pads: [pad],
                });
                await hf.ensureLoadedAroundEnu(0, 0, 1000);
                // Scene Y goes through a geodetic round trip, so compare with
                // a tolerance rather than for exact zero.
                assert.ok(Math.abs(hf.heightAtEnu(0, 0)) < 1e-6, 'sea stays at sea level');
                assert.equal(hf.isLandEnu(0, 0), false);
            } finally {
                h.restore();
            }
        });
    });

    it('classifies land and water by the sea-level epsilon', async () => {
        const h = makeStore(() => 40);
        try {
            const hf = new HeightField({ manifest: manifest(), store: h.store, basis: BASIS });
            await hf.ensureLoadedAroundEnu(0, 0, 500);
            assert.equal(hf.isLandEnu(0, 0), true);
        } finally {
            h.restore();
        }
    });

    it('sits on tile bounds consistently', () => {
        const id = tileAtLonLat(QUERY_ZOOM, TEST_LON, TEST_LAT);
        const b = tileBounds(id);
        assert.ok(TEST_LON >= b.west && TEST_LON <= b.east);
        assert.ok(TEST_LAT >= b.south && TEST_LAT <= b.north);
    });
});
