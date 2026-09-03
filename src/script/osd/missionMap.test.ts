import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DemTile } from '../terrain/demTile';
import { HeightField } from '../terrain/heightField';
import { geodeticToWorld, makeEnuBasis } from '../terrain/geodesy';
import { TileKey, tileAtLonLat, tileKeyString } from '../terrain/tiling';
import { MapView } from '../mission/mapProjection';
import { MissionMapRaster } from './missionMap';

/**
 * The raster, driven against synthetic tiles. What is worth pinning is that it
 * reads the right *bytes* — the tier fallback, the plate-carrée indexing inside
 * a tile, and the three colour cases — not that it produces pretty pixels.
 */

const ORIGIN = { lat: 28.0015, lon: -15.3937 };
const BASIS = makeEnuBasis(ORIGIN.lat, ORIGIN.lon, 0);
const QUERY_ZOOM = 11;
const COARSE_ZOOM = 7;
const SIZE = 33;

function tile(fill: (col: number, row: number) => number): DemTile {
    const heights = new Float32Array(SIZE * SIZE);
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            heights[row * SIZE + col] = fill(col, row);
        }
    }
    return {
        size: SIZE, flags: 0, minH: 0, maxH: 0, quantScale: 1,
        geometricErrorM: 0, heights,
    };
}

/**
 * A HeightField stand-in exposing only what the raster uses. The real class
 * keeps its basis private, which is exactly why the raster takes one.
 */
function fakeHeights(coarse: Map<string, DemTile>, fine = new Map<string, DemTile>()) {
    return {
        coarseTiles: () => [...coarse.entries()].map(([key, t]) => {
            const [z, x, y] = key.split('/').map(Number);
            return { id: { z, x, y } as TileKey, tile: t };
        }),
        peekFine: (id: TileKey) => fine.get(tileKeyString(id)),
    } as unknown as HeightField;
}

function rasterAt(
    coarseHeight: number | ((c: number, r: number) => number),
    fine?: Map<string, DemTile>,
): MissionMapRaster {
    const coarseId = tileAtLonLat(COARSE_ZOOM, ORIGIN.lon, ORIGIN.lat);
    const coarse = new Map<string, DemTile>([[
        tileKeyString(coarseId),
        tile(typeof coarseHeight === 'function' ? coarseHeight : () => coarseHeight),
    ]]);
    return new MissionMapRaster({
        heights: fakeHeights(coarse, fine),
        basis: BASIS,
        seaLevel: 0,
        queryZoom: QUERY_ZOOM,
        coarseZoom: COARSE_ZOOM,
    });
}

function view(over: Partial<MapView> = {}): MapView {
    return { centreX: 0, centreZ: 0, mPerPx: 200, widthPx: 32, heightPx: 24, ...over };
}

/** RGBA at a pixel of a render result. */
function px(r: { data: Uint8ClampedArray<ArrayBuffer>; width: number }, x: number, y: number) {
    const at = (y * r.width + x) * 4;
    return [r.data[at], r.data[at + 1], r.data[at + 2], r.data[at + 3]];
}

describe('MissionMapRaster', () => {
    it('reads the coarse tier when no fine tile is resident', () => {
        const r = rasterAt(750);
        assert.equal(Math.round(r.heightAt(0, 0)), 750);
        assert.equal(r.tierAt(0, 0), 'coarse');
    });

    it('prefers a resident fine tile over the coarse tier', () => {
        const fineId = tileAtLonLat(QUERY_ZOOM, ORIGIN.lon, ORIGIN.lat);
        const fine = new Map([[tileKeyString(fineId), tile(() => 1500)]]);
        const r = rasterAt(750, fine);
        assert.equal(Math.round(r.heightAt(0, 0)), 1500);
        assert.equal(r.tierAt(0, 0), 'fine');
    });

    it('reports nodata where nothing is resident, rather than sea level', () => {
        const r = rasterAt(750);
        // Far outside the one coarse tile that exists.
        const far = geodeticToWorld(BASIS, ORIGIN.lat + 40, ORIGIN.lon + 40);
        assert.ok(Number.isNaN(r.heightAt(far.x, far.z)));
        assert.equal(r.tierAt(far.x, far.z), 'none');
    });

    it('knows when there is no baked terrain at all', () => {
        const empty = new MissionMapRaster({
            heights: fakeHeights(new Map()),
            basis: BASIS, seaLevel: 0, queryZoom: QUERY_ZOOM, coarseZoom: COARSE_ZOOM,
        });
        assert.equal(empty.isEmpty, true);
        assert.equal(rasterAt(750).isEmpty, false);
    });

    // Offsets stay well inside the single z7 tile (1.40625 deg across, its
    // northern edge only 0.12 deg above the origin), so these read real
    // samples rather than falling off the tile into nodata.
    it('indexes north-up inside a tile: row 0 is the northern edge', () => {
        // A tile whose height is its row index. A point further north must read
        // a LOWER row, which is the plate-carrée v = (north - lat) / span.
        const r = rasterAt((_c, row) => row * 100);
        const here = geodeticToWorld(BASIS, ORIGIN.lat, ORIGIN.lon);
        const north = geodeticToWorld(BASIS, ORIGIN.lat + 0.05, ORIGIN.lon);
        const hHere = r.heightAt(here.x, here.z);
        const hNorth = r.heightAt(north.x, north.z);
        assert.ok(Number.isFinite(hHere) && Number.isFinite(hNorth),
            'the probe fell off the tile; the test proves nothing');
        assert.ok(hNorth < hHere,
            'sampling further north read a higher row — the tile is upside down');
    });

    it('indexes east-right inside a tile: column 0 is the western edge', () => {
        const r = rasterAt((col) => col * 100);
        const here = geodeticToWorld(BASIS, ORIGIN.lat, ORIGIN.lon);
        const east = geodeticToWorld(BASIS, ORIGIN.lat, ORIGIN.lon + 0.05);
        const hHere = r.heightAt(here.x, here.z);
        const hEast = r.heightAt(east.x, east.z);
        assert.ok(Number.isFinite(hHere) && Number.isFinite(hEast),
            'the probe fell off the tile; the test proves nothing');
        assert.ok(hEast > hHere,
            'sampling further east read a lower column — the tile is mirrored');
    });

    it('paints sea, land and nodata as three distinct colours', () => {
        const sea = px(rasterAt(0).render(view()), 16, 12);
        const land = px(rasterAt(1500).render(view()), 16, 12);
        const nodata = px(
            rasterAt(1500).render(view({ centreX: 4e6, centreZ: 4e6 })), 16, 12);
        assert.notDeepEqual(sea, land);
        assert.notDeepEqual(land, nodata);
        assert.notDeepEqual(sea, nodata, 'nodata was painted as sea');
        for (const c of [sea, land, nodata]) {
            assert.equal(c[3], 255, 'a pixel was left transparent');
        }
    });

    it('fills every pixel when stepping, leaving no gaps', () => {
        const r = rasterAt(1500).render(view({ widthPx: 30, heightPx: 20 }), 4);
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                assert.equal(px(r, x, y)[3], 255, `hole at ${x},${y}`);
            }
        }
    });

    it('resolves more detail at step 1 than at step 4', () => {
        // The whole point of the refinement pass. A blocked raster can only
        // change colour every Nth column; a full-resolution one changes
        // wherever the terrain does.
        //
        // The scale matters: a 4x4 block only loses information when it spans
        // more than one height post. Zoomed far enough in that the whole view
        // sits between two posts, bilinear interpolation is near-linear and
        // every step looks the same — which is also true in the real editor.
        // These posts are ~4 km apart, so 3 km/px puts several under each block.
        const varied = rasterAt((col, row) => (col * 37 + row * 91) % 900);
        const v = view({ widthPx: 64, heightPx: 48, mPerPx: 3000 });

        function edges(step: number): number {
            const r = varied.render(v, step);
            let n = 0;
            for (let y = 0; y < 48; y++) {
                for (let x = 1; x < 64; x++) {
                    const a = (y * 64 + x) * 4;
                    if (r.data[a] !== r.data[a - 4] || r.data[a + 1] !== r.data[a - 3]) n++;
                }
            }
            return n;
        }
        const coarse = edges(4);
        const fine = edges(1);
        assert.ok(fine > coarse * 1.5,
            `step 1 resolved ${fine} edges against ${coarse} at step 4 — no real gain`);
    });

    it('renderBand paints only its own rows', () => {
        const raster = rasterAt(1500);
        const v = view({ widthPx: 20, heightPx: 40 });
        raster.render(v, 1);
        // Blank the buffer, then refill one band; everything else must stay blank.
        const buf = raster.buffer(v).data;
        buf.fill(0);
        raster.renderBand(v, 1, 10, 20);
        const rowAlpha = (y: number) => buf[(y * 20 + 5) * 4 + 3];
        assert.equal(rowAlpha(5), 0, 'painted above its band');
        assert.equal(rowAlpha(15), 255, 'left its own band blank');
        assert.equal(rowAlpha(25), 0, 'painted below its band');
    });

    it('bands accumulate into the same image a single pass would give', () => {
        const varied = rasterAt((col, row) => (col * 53 + row * 17) % 1200);
        const v = view({ widthPx: 24, heightPx: 36 });

        const whole = Uint8ClampedArray.from(varied.render(v, 1).data);
        const banded = rasterAt((col, row) => (col * 53 + row * 17) % 1200);
        for (let y = 0; y < 36; y += 7) {
            banded.renderBand(v, 1, y, Math.min(36, y + 7));
        }
        assert.deepEqual([...banded.buffer(v).data], [...whole],
            'a banded refinement diverged from a single full pass');
    });

    it('hands back a correctly sized buffer before anything is rendered', () => {
        // The panel blits between refinement slices, and may blit right after a
        // resize; a mismatched buffer would make ImageData throw.
        const raster = rasterAt(1500);
        const v = view({ widthPx: 17, heightPx: 11 });
        const b = raster.buffer(v);
        assert.equal(b.width, 17);
        assert.equal(b.height, 11);
        assert.equal(b.data.length, 17 * 11 * 4);
    });

    it('reuses its buffer across draws of the same size', () => {
        const raster = rasterAt(1500);
        const a = raster.render(view());
        const b = raster.render(view({ centreX: 1000 }));
        assert.equal(a.data, b.data, 'allocated a fresh buffer for an identical canvas');
    });

    it('gives a coarse extent that covers the resident tiles', () => {
        const extent = rasterAt(750).coarseExtent();
        assert.equal(extent.length, 4, 'one tile should give four corners');
        const xs = extent.map(p => p.x);
        const zs = extent.map(p => p.z);
        assert.ok(Math.max(...xs) > Math.min(...xs));
        assert.ok(Math.max(...zs) > Math.min(...zs));
    });
});
