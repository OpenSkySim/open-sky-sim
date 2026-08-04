import * as THREE from 'three';
import { Ecef, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';
import { analyzeTileLod, TileLodInfo } from './terrainLod';
import {
    TileId, approxTileEdgeMetres, childrenOf, edgeNeighbors, rootTiles, tileBounds, tileKey,
} from './tileId';
import { RenderFrame } from './renderFrame';
import {
    COARSE_SHELL_MAX_ZOOM,
    COAST_DETAIL_EXTRA_LEVELS,
    INLAND_VERTICAL_ERROR_SPLIT_PX,
    INLAND_LOD_DROP,
    coastFloorRangeM,
    coastMinZoom,
    reliefViewFactor,
    effectiveMaxZoomFrac,
    inlandMaxZoomForFlatness,
    terrainViewRangeM,
    verticalErrorPx,
} from './viewRange';
import type { TerrainLodClass } from './viewRange';

export interface QuadNode {
    id: TileId;
    leaf: boolean;
    children?: QuadNode[];
}

export interface QuadtreeOptions {
    sseThreshold: number;
    maxZoom: number;
    maxLoads: number;
    /** MSL used for coast water/land classification. */
    seaLevel: number;
    /**
     * When true, refine this tile to {@link maxZoom} regardless of SSE / ocean
     * coarsening — used so airbase flatten pads are never crossed by huge tris.
     */
    forceRefine?: (id: TileId) => boolean;
}

const DEFAULT_OPTS: QuadtreeOptions = {
    // Higher = fewer splits (FPS). Skirts hide most cracks.
    sseThreshold: 28,
    maxZoom: 12,
    maxLoads: 48,
    seaLevel: 0,
};

const _ecef: Ecef = { x: 0, y: 0, z: 0 };

/**
 * Refine a global geographic QT around the camera using screen-space error,
 * then soft-balance DEM leaves only (never cascade across ocean).
 */
export class TerrainQuadtree {
    private roots: QuadNode[];
    private opts: QuadtreeOptions;
    private pendingLoads = 0;
    private detailScale = 1;
    private readonly nodeByKey = new Map<string, QuadNode>();
    private readonly lodCache = new Map<string, TileLodInfo>();
    private readonly demMaxCache = new Map<string, number>();

    constructor(
        private readonly source: HeightSource,
        private readonly frame: RenderFrame,
        private readonly requestTile: (id: TileId) => Promise<unknown>,
        opts: Partial<QuadtreeOptions> = {},
    ) {
        this.opts = { ...DEFAULT_OPTS, ...opts };
        this.roots = rootTiles().map(id => ({ id, leaf: true }));
        this.reindex();
    }

    getLeaves(): TileId[] {
        const out: TileId[] = [];
        const walk = (n: QuadNode) => {
            if (n.leaf || !n.children) {
                out.push(n.id);
                return;
            }
            for (const c of n.children) {
                walk(c);
            }
        };
        for (const r of this.roots) {
            walk(r);
        }
        return out;
    }

    update(camera: THREE.Camera, targetWidth: number, fovDeg: number): void {
        const cam = camera.position;
        const camEcef = this.frame.worldToEcef(cam);
        const geometricErrorFactor = this.sseFactor(targetWidth, fovDeg);
        this.lodCache.clear();
        this.demMaxCache.clear();

        for (let i = 0; i < this.roots.length; i++) {
            this.refineNode(this.roots[i], cam, camEcef, geometricErrorFactor);
        }
        this.reindex();
        // DEM-only balance — never cascade splits across open ocean (FPS killer).
        // Skip under heavy load: balance walks every leaf×neighbor and re-splits,
        // which dominated approach reconciles once the governor was already maxed.
        if (this.detailScale < 8) {
            this.balanceDemLod();
            this.reindex();
        }
        // Balance only splits one level per iter, so it can leave coast leaves
        // below the space-view floor next to finer shoreline tiles. Re-enforce.
        this.enforceCoastFloor(cam);
        this.reindex();
    }

    /**
     * Split coast leaves that sit below {@link coastMinZoom} (e.g. after LOD
     * balance created one-level children). Without this, space view keeps a
     * permanent mix of z6–z9 and z10 shoreline tiles.
     */
    private enforceCoastFloor(camWorld: THREE.Vector3): void {
        const alt = camWorld.y;
        // Approach/cruise: no hard coast floor — distance falloff + SSE +
        // governor own leaf count. Floor is a space-view evenness tool only.
        if (alt < 50_000) {
            return;
        }
        const floorRange = coastFloorRangeM(alt);
        for (let iter = 0; iter < 12; iter++) {
            let changed = false;
            const leaves = this.getLeaves();
            for (let i = 0; i < leaves.length; i++) {
                const id = leaves[i];
                if (this.lodInfoFor(id).lod !== 'coast') {
                    continue;
                }
                const demMax = this.demMaxZoomNear(id);
                if (demMax <= 0) {
                    continue;
                }
                const floor = this.effectiveCoastFloor(demMax, alt);
                if (id.z >= floor) {
                    continue;
                }
                const dist = this.tileCentreWorld(id).distanceTo(camWorld);
                if (dist > floorRange) {
                    continue;
                }
                if (this.splitLeafId(id)) {
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
            this.reindex();
        }
    }

    /** Cached LOD class / relief for a tile (filled during the last update). */
    tileLodInfo(id: TileId): TileLodInfo {
        return this.lodInfoFor(id);
    }

    private lodInfoFor(id: TileId): TileLodInfo {
        const key = tileKey(id);
        let info = this.lodCache.get(key);
        if (!info) {
            info = analyzeTileLod(this.source, this.opts.seaLevel, id);
            this.lodCache.set(key, info);
        }
        return info;
    }

    /**
     * Coast floor after governor shedding. detailScale may drop the floor up
     * to 2 levels so approach FPS can recover — space (alt≥50 km) stays fixed.
     */
    private effectiveCoastFloor(demMax: number, altitudeM: number): number {
        const floor = coastMinZoom(demMax, this.opts.maxZoom, altitudeM);
        if (altitudeM >= 50_000) {
            return floor;
        }
        const drop = this.detailScale >= 16 ? 2 : this.detailScale >= 6 ? 1 : 0;
        return Math.max(0, floor - drop);
    }

    private reindex(): void {
        this.nodeByKey.clear();
        const walk = (n: QuadNode) => {
            this.nodeByKey.set(tileKey(n.id), n);
            if (!n.leaf && n.children) {
                for (const c of n.children) {
                    walk(c);
                }
            }
        };
        for (const r of this.roots) {
            walk(r);
        }
    }

    private sseFactor(targetWidth: number, fovDeg: number): number {
        const fov = fovDeg * Math.PI / 180;
        return (targetWidth * 0.5) / Math.tan(fov * 0.5);
    }

    private refineNode(
        node: QuadNode,
        camWorld: THREE.Vector3,
        camEcef: Ecef,
        sseFactor: number,
    ): void {
        const id = node.id;
        const force = !!this.opts.forceRefine?.(id);
        const { lod, deltaH } = this.lodInfoFor(id);
        const demMax = this.demMaxZoomNear(id);
        // Coast: DEM max + SSE-gated close-range detail. Inland: demMax ∩
        // flatness cap. Ocean: z≤5.
        let sourceMax: number;
        if (force) {
            // Pad force-refine stops at DEM native zoom — same as pad pins.
            // Going past demMax stacked z12+ QT leaves on top of z11 pins.
            sourceMax = demMax > 0 ? Math.min(this.opts.maxZoom, demMax) : this.opts.maxZoom;
        } else if (lod === 'coast' && demMax > 0) {
            // Approach: stay at DEM native zoom. z12–14 extras were for close
            // silhouettes but multiplied leaf count / flicker on approach.
            // Space still allows SSE extras past demMax.
            const extras = camWorld.y >= 50_000 ? COAST_DETAIL_EXTRA_LEVELS : 0;
            sourceMax = Math.min(this.opts.maxZoom, demMax + extras);
        } else if (lod === 'ocean') {
            sourceMax = Math.min(5, this.opts.maxZoom);
        } else if (demMax > 0) {
            // Inland stays well under the DEM's finest — coast owns that budget,
            // and close-range inland meshes are sparse by design.
            const flatCap = inlandMaxZoomForFlatness(camWorld.y, this.opts.maxZoom, deltaH);
            sourceMax = Math.min(this.opts.maxZoom, demMax - INLAND_LOD_DROP, flatCap);
        } else {
            sourceMax = Math.min(5, this.opts.maxZoom);
        }
        if (!this.isFacingCamera(id, camEcef, camWorld)) {
            node.leaf = true;
            node.children = undefined;
            return;
        }

        const edge = approxTileEdgeMetres(id);
        const centre = this.tileCentreWorld(id);
        const dist = Math.max(1, centre.distanceTo(camWorld));
        const alt = camWorld.y;
        let maxZ = force
            ? Math.min(this.opts.maxZoom, sourceMax)
            : Math.max(
                0,
                Math.min(
                    this.opts.maxZoom,
                    Math.floor(
                        effectiveMaxZoomFrac(alt, this.opts.maxZoom, sourceMax, lod, dist, deltaH) + 1e-6,
                    ),
                ),
            );
        // High-altitude distance falloff must not cap coast below the DEM floor —
        // far-horizon shorelines from space were freezing at z9–10 (~600 m steps).
        // From space, also cap *above* the floor: SSE extras (z11+) under the
        // nadir flicker against floor neighbours as creates/evicts catch up.
        const floorRange = coastFloorRangeM(alt);
        if (lod === 'coast' && demMax > 0 && alt >= 50_000) {
            const floor = this.effectiveCoastFloor(demMax, alt);
            if (dist <= floorRange) {
                maxZ = Math.min(
                    this.opts.maxZoom,
                    Math.max(maxZ, floor),
                );
            }
            maxZ = Math.min(maxZ, floor);
        }
        const sse = (edge / dist) * sseFactor;
        // Inland relief that projects below a few pixels is invisible — don't
        // split for it. The view factor foreshortens relief seen from above:
        // a top-down camera barely sees height, so inland stays coarse there.
        // Only gate past the coarse shell so the 9-sample deltaH of huge tiles
        // can't freeze a whole subtree.
        const reliefVisible = lod !== 'inland'
            || id.z <= COARSE_SHELL_MAX_ZOOM
            || verticalErrorPx(deltaH, dist, sseFactor) * reliefViewFactor(dist, alt)
                > INLAND_VERTICAL_ERROR_SPLIT_PX;
        // Space-only shoreline floor (approach uses falloff + SSE).
        const coastFloorSplit = alt >= 50_000
            && lod === 'coast'
            && demMax > 0
            && id.z < this.effectiveCoastFloor(demMax, alt)
            && dist <= floorRange;
        const sseThresh = this.sseThresholdFor(lod);
        const wantSplit = coastFloorSplit || (id.z < maxZ && (
            force
            || (sse > sseThresh && reliefVisible)
        ));

        if (wantSplit) {
            this.maybeRequest(id);
            if (!node.children) {
                node.children = childrenOf(id).map(cid => ({ id: cid, leaf: true }));
            }
            node.leaf = false;
            for (const c of node.children) {
                this.refineNode(c, camWorld, camEcef, sseFactor);
                this.maybeRequest(c.id);
            }
        } else if (
            // Hysteresis: don't collapse a refined node until SSE is clearly
            // under threshold — kills approach LOD flicker at the split edge.
            node.children
            && !force
            && id.z < maxZ
            && reliefVisible
            && sse > sseThresh * 0.55
        ) {
            node.leaf = false;
            for (const c of node.children) {
                this.refineNode(c, camWorld, camEcef, sseFactor);
                this.maybeRequest(c.id);
            }
        } else {
            node.leaf = true;
            node.children = undefined;
            this.maybeRequest(id);
        }
    }

    /**
     * Soft LOD balance inside DEM only (few iters). Never splits ocean to match
     * land — that used to refine half the planet and tank FPS. Class-aware gap:
     * fine coast next to coarse inland tolerates Δz ≤ 3 so shorelines do not
     * drag rings of inland splits (skirts hide the seam).
     */
    private balanceDemLod(): void {
        for (let iter = 0; iter < 3; iter++) {
            let changed = false;
            const leaves = this.getLeaves();
            for (let i = 0; i < leaves.length; i++) {
                const leaf = leaves[i];
                if (this.demMaxZoomNear(leaf) <= 0) {
                    continue;
                }
                const neighbors = edgeNeighbors(leaf);
                for (let n = 0; n < neighbors.length; n++) {
                    const nb = neighbors[n];
                    if (this.demMaxZoomNear(nb) <= 0) {
                        continue;
                    }
                    const coverZ = this.coveringLeafZoom(nb);
                    if (leaf.z > coverZ + this.balanceMaxDelta(leaf, nb)) {
                        if (this.splitCovering(nb)) {
                            changed = true;
                        }
                    } else if (coverZ > leaf.z + this.balanceMaxDelta(nb, leaf)) {
                        if (this.splitLeafId(leaf)) {
                            changed = true;
                        }
                    }
                }
            }
            if (!changed) {
                break;
            }
            this.reindex();
        }
    }

    /** Allowed leaf-zoom gap between a finer and a coarser neighbouring tile. */
    private balanceMaxDelta(finer: TileId, coarser: TileId): number {
        const f = this.lodInfoFor(finer).lod;
        const c = this.lodInfoFor(coarser).lod;
        if (f === 'coast' && c !== 'coast') {
            // Coast floor puts shorelines well above space-view inland/ocean.
            // Skirts hide the seam — do not drag a ring of inland splits.
            const extra = Math.max(0, finer.z - this.demMaxZoomNear(finer));
            return 8 + extra;
        }
        return 2;
    }

    /** Zoom of the leaf that currently covers this tile's area. */
    private coveringLeafZoom(id: TileId): number {
        let z = id.z;
        let x = id.x;
        let y = id.y;
        while (z >= 0) {
            const node = this.nodeByKey.get(tileKey({ z, x, y }));
            if (node) {
                if (node.leaf || !node.children) {
                    return node.id.z;
                }
                // Exact node exists and is subdivided — descend toward original id.
                break;
            }
            z -= 1;
            x >>= 1;
            y >>= 1;
        }
        // Walk from nearest ancestor down to the leaf covering id.
        const ancestor = this.findAncestorNode(id);
        if (!ancestor) {
            return 0;
        }
        let node: QuadNode = ancestor;
        while (!node.leaf && node.children) {
            const child: QuadNode | undefined = node.children.find(
                c => this.idContains(c.id, id),
            );
            if (!child) {
                break;
            }
            node = child;
        }
        return node.id.z;
    }

    private findAncestorNode(id: TileId): QuadNode | undefined {
        let z = id.z;
        let x = id.x;
        let y = id.y;
        while (z >= 0) {
            const node = this.nodeByKey.get(tileKey({ z, x, y }));
            if (node) {
                return node;
            }
            z -= 1;
            x >>= 1;
            y >>= 1;
        }
        return undefined;
    }

    private idContains(ancestor: TileId, id: TileId): boolean {
        if (id.z < ancestor.z) {
            return false;
        }
        const dz = id.z - ancestor.z;
        return (id.x >> dz) === ancestor.x && (id.y >> dz) === ancestor.y;
    }

    private splitLeafId(id: TileId): boolean {
        const node = this.nodeByKey.get(tileKey(id));
        if (!node || !node.leaf || node.id.z >= this.opts.maxZoom) {
            return false;
        }
        node.children = childrenOf(node.id).map(cid => ({ id: cid, leaf: true }));
        node.leaf = false;
        for (const c of node.children) {
            this.maybeRequest(c.id);
        }
        return true;
    }

    /** Split the leaf that currently covers `id`'s area (one level). */
    private splitCovering(id: TileId): boolean {
        const ancestor = this.findAncestorNode(id);
        if (!ancestor) {
            return false;
        }
        let node: QuadNode = ancestor;
        while (!node.leaf && node.children) {
            const child: QuadNode | undefined = node.children.find(
                c => this.idContains(c.id, id),
            );
            if (!child) {
                break;
            }
            node = child;
        }
        if (!node.leaf || node.id.z >= this.opts.maxZoom) {
            return false;
        }
        node.children = childrenOf(node.id).map(cid => ({ id: cid, leaf: true }));
        node.leaf = false;
        for (const c of node.children) {
            this.maybeRequest(c.id);
        }
        return true;
    }

    private maybeRequest(id: TileId): void {
        if (!this.source.coversTile(id) || this.pendingLoads >= this.opts.maxLoads) {
            return;
        }
        this.pendingLoads += 1;
        this.requestTile(id).finally(() => {
            this.pendingLoads = Math.max(0, this.pendingLoads - 1);
        });
    }

    /** Frame-time governor input: 1 = full detail, higher = coarser splits. */
    setDetailScale(scale: number): void {
        this.detailScale = Math.max(1, scale);
    }

    private sseThresholdFor(lod: TerrainLodClass): number {
        // Coast prefers finer splits; governor scale applies fully so approach
        // load-shedding can actually coarsen the shoreline leaf set.
        if (lod === 'coast') {
            return this.opts.sseThreshold * 0.25 * this.detailScale;
        }
        const base = this.opts.sseThreshold * this.detailScale;
        if (lod === 'inland') {
            return base * 3.6;
        }
        return base;
    }

    /**
     * Finest DEM zoom available for this tile; 0 if outside DEM footprint.
     * Samples centre + corners — coast tiles often have centres in open ocean
     * just outside the coverage AABB while the shoreline still overlaps DEM.
     */
    private demMaxZoomNear(id: TileId): number {
        const key = tileKey(id);
        const cached = this.demMaxCache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const b = tileBounds(id);
        const midLon = 0.5 * (b.west + b.east);
        const midLat = 0.5 * (b.south + b.north);
        const samples: Array<[number, number]> = [
            [midLon, midLat],
            [b.west, b.south],
            [b.east, b.south],
            [b.west, b.north],
            [b.east, b.north],
            [midLon, b.south],
            [midLon, b.north],
            [b.west, midLat],
            [b.east, midLat],
        ];
        let best = 0;
        for (let i = 0; i < samples.length; i++) {
            const z = this.source.maxZoomAt(samples[i][0], samples[i][1]);
            if (z > best) {
                best = z;
            }
        }
        this.demMaxCache.set(key, best);
        return best;
    }

    private tileCentreWorld(id: TileId): THREE.Vector3 {
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const lat = 0.5 * (b.south + b.north);
        const h = this.source.heightAt(lon, lat);
        // Non-finite DEM (not yet resident) must not poison ECEF → world dist.
        // NaN centres made dist > viewRange, so coastFloorSplit never fired and
        // shoreline leaves froze below the space-view floor (uneven coast).
        const hSafe = Number.isFinite(h) ? h : this.opts.seaLevel;
        geodeticToEcef(lat, lon, hSafe, _ecef);
        return this.frame.ecefToWorld(_ecef);
    }

    private isFacingCamera(id: TileId, camEcef: Ecef, camWorld: THREE.Vector3): boolean {
        const b = tileBounds(id);
        const midLon = 0.5 * (b.west + b.east);
        const midLat = 0.5 * (b.south + b.north);
        geodeticToEcef(midLat, midLon, 0, _ecef);
        const world = this.frame.ecefToWorld(_ecef);
        const range = terrainViewRangeM(camWorld.y);
        if (world.distanceTo(camWorld) < range) {
            return true;
        }

        const samples: Array<[number, number]> = [
            [midLat, midLon],
            [b.south, b.west],
            [b.south, b.east],
            [b.north, b.west],
            [b.north, b.east],
        ];
        for (let i = 0; i < samples.length; i++) {
            if (this.facingDot(samples[i][0], samples[i][1], camEcef) > -0.15) {
                return true;
            }
        }
        return false;
    }

    private facingDot(lat: number, lon: number, camEcef: Ecef): number {
        geodeticToEcef(lat, lon, 0, _ecef);
        const tx = _ecef.x, ty = _ecef.y, tz = _ecef.z;
        const cx = camEcef.x, cy = camEcef.y, cz = camEcef.z;
        const tLen = Math.hypot(tx, ty, tz) || 1;
        const cLen = Math.hypot(cx, cy, cz) || 1;
        return (tx * cx + ty * cy + tz * cz) / (tLen * cLen);
    }
}

export function leafKeySet(leaves: TileId[]): Set<string> {
    return new Set(leaves.map(tileKey));
}
