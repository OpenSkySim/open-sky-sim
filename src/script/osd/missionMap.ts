/**
 * The plan view: the baked terrain, drawn from directly above.
 *
 * A 2D canvas raster built from the DEM tiles that are already in memory —
 * never an orthographic camera over the terrain mesh. The camera version needs
 * a projection refactor of `lod.ts` / `quadtree.ts` / `terrainEntity.ts`, which
 * is the hottest path in the renderer, and it shares the mesh cache, so panning
 * the map would evict terrain from under the aircraft. This reads the same
 * bytes with none of that.
 *
 * Two rules hold the whole design together:
 *
 *  - **Never call `request()`.** Terrain is read through `coarseTiles()` and
 *    `peekFine()` only, so opening the map cannot disturb the renderer's LRU or
 *    pull tiles over the network. The map shows what is resident; a pass over
 *    somewhere shows it in detail afterwards.
 *  - **Colour from the tile's own heights, not `heightAtWorld`.** Scene Y is
 *    ENU up, so a constant elevation falls away with distance — 1.16 km down at
 *    122 km. Shading that would darken the chart toward its edges from
 *    curvature alone and read as a basin that is not there.
 */

import { HeightTier } from '../terrain/heightSampler';
import { DemTile } from '../terrain/demTile';
import { HeightField } from '../terrain/heightField';
import { TileKey, tileAtLonLat, tileKeyString } from '../terrain/tiling';
import { EnuBasis, geodeticToWorld, worldToGeodetic } from '../terrain/geodesy';
import { MapView, screenToWorld, worldToScreen } from '../mission/mapProjection';

/**
 * Hypsometric ramp, sea to summit, in the muted register of a printed chart
 * rather than the saturated one of a shaded relief poster: the overlays and the
 * route drawn on top are what the eye needs to find, and they have to win.
 *
 * Fixed colours rather than the live palette on purpose — the palette is
 * time-of-day blended, and a night mission would otherwise be authored on a
 * near-black map.
 */
const RAMP: ReadonlyArray<readonly [number, number, number, number]> = [
    [0, 122, 148, 168],       // shoreline
    [200, 138, 158, 130],     // lowland
    [600, 168, 172, 128],
    [1200, 186, 166, 122],
    [2000, 190, 176, 150],
    [3000, 206, 200, 190],
    [4000, 226, 226, 226],    // rock and snow
];

/**
 * Open water outside the mesh's reach.
 *
 * Overwritten from the palette's own water tone as soon as the panel knows it,
 * so the sea the height layer draws and the sea the mesh draws are the same
 * blue. Two blues meeting at the edge of the mesh reads as a bug in the chart.
 */
const SEA: [number, number, number] = [58, 92, 118];
/** Nodata gets its own grey. See the note in `colourFor`. */
const NODATA: readonly [number, number, number] = [92, 92, 96];

function colourFor(
    h: number, seaLevel: number, out: Uint8ClampedArray<ArrayBuffer>, at: number,
): void {
    // NaN marks nodata in a DemTile, and `isWaterHeight` returns true for any
    // non-finite input — so testing water first would paint large blue blocks
    // in the middle of a continent wherever the coarse tier has a hole.
    if (!Number.isFinite(h)) {
        out[at] = NODATA[0]; out[at + 1] = NODATA[1]; out[at + 2] = NODATA[2]; out[at + 3] = 255;
        return;
    }
    if (h <= seaLevel + 0.5) {
        out[at] = SEA[0]; out[at + 1] = SEA[1]; out[at + 2] = SEA[2]; out[at + 3] = 255;
        return;
    }
    let i = 0;
    while (i < RAMP.length - 1 && h > RAMP[i + 1][0]) {
        i++;
    }
    const a = RAMP[i];
    const b = RAMP[Math.min(i + 1, RAMP.length - 1)];
    const span = b[0] - a[0];
    const t = span <= 0 ? 0 : Math.min(1, Math.max(0, (h - a[0]) / span));
    out[at] = a[1] + (b[1] - a[1]) * t;
    out[at + 1] = a[2] + (b[2] - a[2]) * t;
    out[at + 2] = a[3] + (b[3] - a[3]) * t;
    out[at + 3] = 255;
}

/** Bilinear sample of a tile's heights at fractional row/col. */
function sampleTile(tile: DemTile, u: number, v: number): number {
    const n = tile.size - 1;
    const fx = Math.min(n, Math.max(0, u * n));
    const fy = Math.min(n, Math.max(0, v * n));
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(n, x0 + 1), y1 = Math.min(n, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const h = tile.heights;
    const h00 = h[y0 * tile.size + x0];
    const h10 = h[y0 * tile.size + x1];
    const h01 = h[y1 * tile.size + x0];
    const h11 = h[y1 * tile.size + x1];
    // Any nodata corner poisons the interpolation, so report nodata rather than
    // averaging a real height with a hole and drawing a slope into nothing.
    if (!Number.isFinite(h00) || !Number.isFinite(h10)
        || !Number.isFinite(h01) || !Number.isFinite(h11)) {
        return NaN;
    }
    const top = h00 + (h10 - h00) * tx;
    const bot = h01 + (h11 - h01) * tx;
    return top + (bot - top) * ty;
}

export interface MissionMapDeps {
    heights: HeightField;
    /**
     * ENU basis of the play area. Passed in rather than read off `heights`,
     * whose own basis is private — and the caller has it anyway, from the same
     * `resolvePlayArea` the terrain was built with.
     */
    basis: EnuBasis;
    seaLevel: number;
    /** Finest zoom to try before falling back to the coarse tier. */
    queryZoom: number;
    coarseZoom: number;
}

/**
 * Renders the terrain raster for a view into an ImageData-compatible buffer.
 *
 * Separated from the panel so it can be driven without a document: the panel
 * owns the canvas, the pointer and the overlays; this owns the pixels.
 */
export class MissionMapRaster {

    private readonly coarse = new Map<string, DemTile>();
    /**
     * Reused across draws; resized only when the canvas does.
     *
     * Pinned to `ArrayBuffer` rather than the default `ArrayBufferLike`, so it
     * can be handed straight to `new ImageData(...)`: that constructor refuses
     * a possibly-SharedArrayBuffer-backed view, and this page has COOP/COEP on.
     */
    private buffer_: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(0);
    private bufferW = 0;
    private bufferH = 0;

    constructor(private readonly deps: MissionMapDeps) {
        this.refresh();
    }

    /**
     * Re-read which coarse tiles are resident.
     *
     * Called on every open, not just at construction. The coarse tier is pinned
     * during startup rather than being there from the first frame, so a panel
     * built before it finished would cache an empty set and go on claiming
     * there is no baked terrain for the rest of the session — with the tiles
     * sitting in memory the whole time.
     */
    refresh(): void {
        this.coarse.clear();
        for (const { id, tile } of this.deps.heights.coarseTiles()) {
            this.coarse.set(tileKeyString(id), tile);
        }
    }

    /** Match the fallback sea to the palette's water tone. */
    setSeaColour(r: number, g: number, b: number): void {
        SEA[0] = r; SEA[1] = g; SEA[2] = b;
    }

    /** True when there is no baked terrain at all — a fresh clone. */
    get isEmpty(): boolean {
        return this.coarse.size === 0;
    }

    /**
     * Paint `view` into an RGBA buffer, one destination pixel at a time.
     *
     * Inverse projection per pixel rather than one affine per tile. A plate-
     * carrée tile is not a parallelogram in ENU: a z7 tile spans 1.40625 deg
     * and the east scale follows cos(lat), which varies about 1.3% across one
     * tile at the shipped origin. A single affine is roughly 1.8 km wrong at
     * the far corner — 3 px at 600 m/px, but 36 px at 50 m/px, so the seams
     * between neighbouring tiles get worse exactly as you zoom in to author.
     *
     * `step` renders every Nth pixel and blocks them up, which is what keeps a
     * zoom step from stalling: a full-resolution pass over a large canvas is
     * hundreds of thousands of inverse projections.
     */
    render(
        view: MapView, step = 1,
    ): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
        const h = Math.max(1, Math.floor(view.heightPx));
        return this.renderBand(view, step, 0, h);
    }

    /**
     * Paint rows `[y0, y1)` of the view, leaving the rest of the buffer alone.
     *
     * Banding is what lets the panel refine to full resolution without freezing:
     * a full-detail pass over a fullscreen canvas is the better part of a
     * million inverse projections, which is far too much for one frame, but a
     * band of a few dozen rows is not. The buffer persists between calls, so
     * bands accumulate into a complete image.
     */
    renderBand(
        view: MapView, step: number, y0: number, y1: number,
    ): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
        const w = Math.max(1, Math.floor(view.widthPx));
        const h = Math.max(1, Math.floor(view.heightPx));
        if (w !== this.bufferW || h !== this.bufferH) {
            this.buffer_ = new Uint8ClampedArray(w * h * 4);
            this.bufferW = w;
            this.bufferH = h;
        }
        const out = this.buffer_;
        const world = { x: 0, z: 0 };
        const s = Math.max(1, Math.floor(step));
        const from = Math.max(0, Math.floor(y0));
        const to = Math.min(h, Math.ceil(y1));

        for (let py = from; py < to; py += s) {
            for (let px = 0; px < w; px += s) {
                screenToWorld(view, px, py, world);
                const height = this.heightAt(world.x, world.z);
                colourFor(height, this.deps.seaLevel, out, (py * w + px) * 4);
                // Fill the block this sample stands for.
                if (s > 1) {
                    const base = (py * w + px) * 4;
                    for (let by = 0; by < s && py + by < h; by++) {
                        for (let bx = 0; bx < s && px + bx < w; bx++) {
                            if (bx === 0 && by === 0) continue;
                            const at = ((py + by) * w + (px + bx)) * 4;
                            out[at] = out[base];
                            out[at + 1] = out[base + 1];
                            out[at + 2] = out[base + 2];
                            out[at + 3] = 255;
                        }
                    }
                }
            }
        }
        return { data: out, width: w, height: h };
    }

    /**
     * The raster as it currently stands, without repainting any of it.
     *
     * Lets the panel put the same buffer on screen repeatedly while a
     * refinement pass fills it in band by band.
     */
    buffer(view: MapView): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
        const w = Math.max(1, Math.floor(view.widthPx));
        const h = Math.max(1, Math.floor(view.heightPx));
        if (w !== this.bufferW || h !== this.bufferH) {
            // Asked for before anything was rendered at this size; hand back a
            // correctly-sized blank rather than a mismatched buffer, which
            // ImageData would reject outright.
            this.buffer_ = new Uint8ClampedArray(w * h * 4);
            this.bufferW = w;
            this.bufferH = h;
        }
        return { data: this.buffer_, width: w, height: h };
    }

    /**
     * Ellipsoidal height at a scene point, from resident tiles only.
     *
     * Fine tier when it happens to be resident — the map is sharp wherever the
     * player has flown — and the coarse tier otherwise. Never fetches.
     */
    heightAt(x: number, z: number): number {
        const g = worldToGeodetic(this.deps.basis, x, 0, z);
        const fineId = tileAtLonLat(this.deps.queryZoom, g.lon, g.lat);
        const fine = this.deps.heights.peekFine(fineId);
        if (fine !== undefined) {
            return this.sampleIn(fine, fineId, g.lon, g.lat);
        }
        const coarseId = tileAtLonLat(this.deps.coarseZoom, g.lon, g.lat);
        const coarse = this.coarse.get(tileKeyString(coarseId));
        if (coarse === undefined) {
            return NaN;
        }
        return this.sampleIn(coarse, coarseId, g.lon, g.lat);
    }

    /** Which tier answered here, for the authoring readout. */
    tierAt(x: number, z: number): HeightTier {
        const g = worldToGeodetic(this.deps.basis, x, 0, z);
        if (this.deps.heights.peekFine(tileAtLonLat(this.deps.queryZoom, g.lon, g.lat))) {
            return 'fine';
        }
        const coarseId = tileAtLonLat(this.deps.coarseZoom, g.lon, g.lat);
        return this.coarse.has(tileKeyString(coarseId)) ? 'coarse' : 'none';
    }

    private sampleIn(tile: DemTile, id: TileKey, lon: number, lat: number): number {
        // Plate carrée: the tile grid is uniform in degrees, so the fractional
        // position inside it is a straight ratio of its bounds.
        const span = 180 / (1 << id.z);
        const west = -180 + id.x * span;
        const north = 90 - id.y * span;
        const u = (lon - west) / span;
        const v = (north - lat) / span;
        return sampleTile(tile, u, v);
    }

    /** World-space bounds of everything resident, for an initial fit. */
    coarseExtent(): Array<{ x: number; z: number }> {
        const out: Array<{ x: number; z: number }> = [];
        for (const { id } of this.deps.heights.coarseTiles()) {
            const span = 180 / (1 << id.z);
            const west = -180 + id.x * span;
            const north = 90 - id.y * span;
            for (const [lon, lat] of [
                [west, north], [west + span, north],
                [west, north - span], [west + span, north - span],
            ]) {
                const v = geodeticToWorld(this.deps.basis, lat, lon, 0);
                out.push({ x: v.x, z: v.z });
            }
        }
        return out;
    }
}

/** Re-exported so the panel can draw overlays in the same frame. */
export { worldToScreen };
