import * as THREE from 'three';
import { Ecef, EnuBasis, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';
import {
    TileId, approxTileEdgeMetres, childrenOf, rootTiles, tileBounds, tileKey,
} from './tileId';
import { RenderFrame } from './renderFrame';
import { effectiveMaxZoom, terrainViewRangeM } from './viewRange';

export interface QuadNode {
    id: TileId;
    leaf: boolean;
    children?: QuadNode[];
}

export interface QuadtreeOptions {
    sseThreshold: number;
    maxZoom: number;
    maxLoads: number;
    /**
     * When true, refine this tile to {@link maxZoom} regardless of SSE / ocean
     * coarsening — used so airbase flatten pads are never crossed by huge tris.
     */
    forceRefine?: (id: TileId) => boolean;
}

const DEFAULT_OPTS: QuadtreeOptions = {
    // Lower = refine sooner / farther (3× vs prior 48 → split ~3× farther out).
    sseThreshold: 16,
    maxZoom: 12,
    maxLoads: 16,
};

const _ecef: Ecef = { x: 0, y: 0, z: 0 };

/**
 * Refine a global geographic QT around the camera using screen-space error.
 * Horizon-culls far-side tiles using a radial facing test.
 */
export class TerrainQuadtree {
    private roots: QuadNode[];
    private opts: QuadtreeOptions;
    private pendingLoads = 0;

    constructor(
        private readonly source: HeightSource,
        private readonly frame: RenderFrame,
        private readonly requestTile: (id: TileId) => Promise<unknown>,
        opts: Partial<QuadtreeOptions> = {},
    ) {
        this.opts = { ...DEFAULT_OPTS, ...opts };
        this.roots = rootTiles().map(id => ({ id, leaf: true }));
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
        const basis = this.frame.basis;
        const cam = camera.position;
        const camEcef = this.frame.worldToEcef(cam);
        const geometricErrorFactor = this.sseFactor(targetWidth, fovDeg);

        for (let i = 0; i < this.roots.length; i++) {
            this.refineNode(this.roots[i], cam, camEcef, geometricErrorFactor, basis);
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
        basis: EnuBasis,
    ): void {
        const id = node.id;
        const force = !!this.opts.forceRefine?.(id);
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const lat = 0.5 * (b.south + b.north);
        const demZ = this.source.maxZoomAt(lon, lat);
        const inDem = demZ >= 0;
        const sourceMax = force
            ? this.opts.maxZoom
            : Math.min(this.opts.maxZoom, this.maxZoomNear(id));
        // DEM ignores altitude cap (island form from LEO); ocean stays capped.
        const maxZ = effectiveMaxZoom(camWorld.y, this.opts.maxZoom, sourceMax, inDem);
        if (!this.isFacingCamera(id, camEcef, camWorld)) {
            node.leaf = true;
            node.children = undefined;
            return;
        }

        const edge = approxTileEdgeMetres(id);
        const centre = this.tileCentreWorld(id);
        const dist = Math.max(1, centre.distanceTo(camWorld));
        const sse = (edge / dist) * sseFactor;
        const wantSplit = id.z < maxZ && (force || sse > this.opts.sseThreshold);

        if (wantSplit) {
            this.maybeRequest(id);
            if (!node.children) {
                node.children = childrenOf(id).map(cid => ({ id: cid, leaf: true }));
            }
            node.leaf = false;
            for (const c of node.children) {
                this.refineNode(c, camWorld, camEcef, sseFactor, basis);
                this.maybeRequest(c.id);
            }
        } else {
            node.leaf = true;
            node.children = undefined;
            this.maybeRequest(id);
        }
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

    private maxZoomNear(id: TileId): number {
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const lat = 0.5 * (b.south + b.north);
        const z = this.source.maxZoomAt(lon, lat);
        // Pure ocean: keep coarse so DEM land gets the mesh budget.
        return z >= 0 ? z : Math.min(4, this.opts.maxZoom);
    }

    private tileCentreWorld(id: TileId): THREE.Vector3 {
        const b = tileBounds(id);
        const lon = 0.5 * (b.west + b.east);
        const lat = 0.5 * (b.south + b.north);
        const h = this.source.heightAt(lon, lat);
        geodeticToEcef(lat, lon, h, _ecef);
        return this.frame.ecefToWorld(_ecef);
    }

    /**
     * True if the tile may be visible: near-camera, or any corner/centre of the
     * ellipsoid patch faces the camera (centre-only tests hole the limb).
     */
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
