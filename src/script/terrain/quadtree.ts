/**
 * Geographic quadtree over the ellipsoid.
 *
 * Its whole job is now to decide *what to draw* and *what to want*. It builds
 * nothing: refinement produces a scored want set that the streamer acts on,
 * and drawing reads whatever the streamer has uploaded. That split is what
 * removes the old build-dispatch, worker-pool coupling and fallback branches.
 *
 * The one invariant worth stating: a parent keeps being drawn until all four
 * of its children are resident. That is what prevents a hole appearing
 * mid-refinement, and it pairs with the streamer's parent-first priority term,
 * which keeps such moments short.
 */

import * as THREE from 'three';
import { behindHorizon, sphereInFrustum } from './culling';
import { WGS84_A } from './geodesy';
import {
    ellipsoidSagittaM, shouldRefine, terrainMaxZoomForAltitudeM, terrainViewRangeM,
} from './lod';
import { TerrainManifest } from './manifest';
import {
    TileKey, childrenOf, rootTiles, tileKeyString,
} from './tiling';
import { TileWant } from './tileStreamer';

export interface QuadNode {
    id: TileKey;
    key: string;
    children?: QuadNode[];
    /** Tile-centre in scene space, and a radius that bounds its geometry. */
    center: THREE.Vector3;
    radius: number;
    geometricErrorM: number;
    /** Set once the streamer has this tile uploaded. */
    resident: boolean;
    /** True when the index says there is no baked tile here. */
    ocean: boolean;
    lastSeen: number;
}

export interface QuadtreeOptions {
    manifest: TerrainManifest;
    /** Scene-space position of a tile's origin, for culling. */
    tilePosition: (id: TileKey) => THREE.Vector3;
    /** Bounding radius (m) to use before the real mesh is known. */
    tileRadius: (id: TileKey) => number;
    /** True when the streamer has this tile drawable. */
    isResident: (id: TileKey) => boolean;
    /** True when no baked tile exists (so an ocean patch is used instead). */
    isOcean: (id: TileKey) => boolean;
    maxZoom?: number;
    /** Scene-space position of the ellipsoid centre, for horizon culling. */
    earthCenter: THREE.Vector3;
}

export interface QuadtreeUpdate {
    /** Tiles to draw this pass. */
    draw: QuadNode[];
    /** Tiles worth fetching, scored by the streamer. */
    wants: TileWant[];
}

const _sphereCenter = new THREE.Vector3();

export class Quadtree {
    private readonly roots: QuadNode[];
    private readonly nodes = new Map<string, QuadNode>();
    private readonly maxZoom: number;
    private generation = 0;

    constructor(private readonly opts: QuadtreeOptions) {
        this.maxZoom = opts.maxZoom ?? opts.manifest.mesh.maxZoom;
        this.roots = rootTiles().map(id => this.makeNode(id));
    }

    private makeNode(id: TileKey): QuadNode {
        const key = tileKeyString(id);
        const existing = this.nodes.get(key);
        if (existing) {
            return existing;
        }
        const levelErr = this.opts.manifest.mesh.levelGeometricErrorM[id.z];
        const node: QuadNode = {
            id,
            key,
            center: this.opts.tilePosition(id),
            radius: this.opts.tileRadius(id),
            geometricErrorM: levelErr !== undefined && levelErr > 0
                ? levelErr
                : ellipsoidSagittaM(id),
            resident: false,
            ocean: false,
            lastSeen: 0,
        };
        this.nodes.set(key, node);
        return node;
    }

    get nodeCount(): number {
        return this.nodes.size;
    }

    /**
     * Walk the tree for one camera and produce the draw list plus the want set.
     * Pure: it mutates only bookkeeping, never geometry.
     */
    update(
        camera: THREE.PerspectiveCamera,
        screenHeightPx: number,
        fovYDeg: number,
        detailScale: number,
        pinned?: (id: TileKey) => boolean,
    ): QuadtreeUpdate {
        this.generation++;
        const draw: QuadNode[] = [];
        const wants: TileWant[] = [];

        const frustum = new THREE.Frustum().setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix, camera.matrixWorldInverse,
            ),
        );
        const camPos = camera.position;
        const altitude = camPos.y;
        const range = terrainViewRangeM(altitude);
        const zoomCap = Math.min(
            this.maxZoom,
            terrainMaxZoomForAltitudeM(altitude, this.maxZoom, true),
        );

        const visit = (node: QuadNode): void => {
            node.lastSeen = this.generation;
            node.resident = this.opts.isResident(node.id);
            node.ocean = this.opts.isOcean(node.id);

            _sphereCenter.copy(node.center);
            const distance = camPos.distanceTo(_sphereCenter) - node.radius;
            if (distance > range) {
                return;
            }
            if (!sphereInFrustum(_sphereCenter, node.radius, frustum)) {
                return;
            }
            if (behindHorizon(
                _sphereCenter, node.radius, camPos, this.opts.earthCenter, WGS84_A,
            )) {
                return;
            }

            const wantThis = () => {
                if (!node.ocean && !node.resident) {
                    wants.push({
                        id: node.id,
                        ssePx: node.geometricErrorM,
                        distanceM: Math.max(1, distance),
                        inFrustum: true,
                        pinned: pinned ? pinned(node.id) : false,
                    });
                }
            };

            const canRefine = node.id.z < zoomCap && shouldRefine(
                node.geometricErrorM, Math.max(1, distance),
                screenHeightPx, fovYDeg, detailScale,
            );

            if (!canRefine) {
                wantThis();
                draw.push(node);
                return;
            }

            if (!node.children) {
                node.children = childrenOf(node.id).map(id => this.makeNode(id));
            }

            // A parent stays drawn until every child can take over. Without
            // this the terrain shows a hole for as long as a child is loading.
            const ready = node.children.every(
                c => this.opts.isResident(c.id) || this.opts.isOcean(c.id),
            );
            if (!ready) {
                wantThis();
                draw.push(node);
                // Still ask for the children, so the wait is bounded.
                for (const c of node.children) {
                    c.lastSeen = this.generation;
                    if (!this.opts.isOcean(c.id) && !this.opts.isResident(c.id)) {
                        wants.push({
                            id: c.id,
                            ssePx: c.geometricErrorM,
                            distanceM: Math.max(1, camPos.distanceTo(c.center) - c.radius),
                            inFrustum: true,
                            pinned: pinned ? pinned(c.id) : false,
                        });
                    }
                }
                return;
            }

            for (const c of node.children) {
                visit(c);
            }
        };

        for (const root of this.roots) {
            visit(root);
        }
        return { draw, wants };
    }

    /** Nodes not seen for `maxAge` passes, so their tiles can be released. */
    stale(maxAge: number): QuadNode[] {
        const out: QuadNode[] = [];
        for (const node of this.nodes.values()) {
            if (this.generation - node.lastSeen > maxAge) {
                out.push(node);
            }
        }
        return out;
    }

    forget(key: string): void {
        this.nodes.delete(key);
    }
}
