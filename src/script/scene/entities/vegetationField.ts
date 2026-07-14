import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { UP } from '../../utils/math';
import { Entity } from "../entity";
import { Scene, SceneLayers } from "../scene";
import { SceneMaterialManager } from '../materials/materials';
import { VegetationKind, buildVegetationParts } from '../models/lib/vegetationModelBuilder';
import { updateUniforms } from '../utils';
import { HillCollider, sampleHillSurfaceY } from './hillCollider';

export interface TerrainSampler {
    isLand(worldX: number, worldZ: number): boolean;
}

/** Per-species LOD view distances. All fall back to the field-wide defaults. */
export interface SpeciesLodSettings {
    /**
     * Radius (m) within which this species renders as a full-detail 3D volume
     * (LOD0). Beyond it the species switches to a billboard impostor.
     */
    fullDetailRangeM?: number;
    /**
     * Radius (m) out to which this species renders as a billboard impostor
     * (LOD1). Between this and lowDetailRangeM it renders as a single 1px point
     * (LOD2). Clamped to at least fullDetailRangeM. Defaults to lowDetailRangeM
     * (i.e. no pixel band unless configured).
     */
    impostorRangeM?: number;
    /**
     * Outer radius (m) beyond which this species is not drawn at all. Between
     * impostorRangeM and this it renders as a single 1px point (LOD2).
     */
    lowDetailRangeM?: number;
}

export interface VegetationFieldSettings {
    cellSize: number;
    fillRatio: number;
    tilesInView: number;
    treesPerCell: number;
    scaleMin: number;
    scaleMax: number;
    maxTreesPerFrame?: number;
    outerCellStep?: number;
    /**
     * Outer draw distance (m) of the lowest-detail LOD (distant billboard
     * impostors). The near full-detail zone and the mid density ramp are
     * unaffected; only how far the cheap impostors reach. Defaults to the
     * density span derived from tilesInView.
     */
    lowDetailRangeM?: number;
    /**
     * Radius (m) within which trees are drawn as full-detail 3D volumes (LOD0)
     * rather than billboard impostors. Independent of the density ramp, so
     * enlarging it stretches how far detailed trees reach without making the
     * near field denser. Defaults to the density inner radius (densitySpan / 5).
     */
    fullDetailRangeM?: number;
    /**
     * Per-species overrides for the LOD view distances. Any species not listed
     * (or any field left undefined) uses the field-wide fullDetailRangeM /
     * lowDetailRangeM above. Lets small plants (bushes, scrub) cull much sooner
     * than tall trees, which stay full-detail and visible far longer.
     */
    speciesLod?: Partial<Record<VegetationKind, SpeciesLodSettings>>;
    excludeAreas?: THREE.Box2[];
    hashSeed?: number;
}

function hash2D(x: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 43.13) * 43758.5453;
    return n - Math.floor(n);
}

function landCacheKey(col: number, row: number): number {
    return col * 73856093 ^ row * 19349663;
}

/** Grid resolution (m) for the per-tree land/water lookup cache. */
const TREE_LAND_SAMPLE = 12.5;

/**
 * Hard ceiling on the number of "working" cells (those that pass the coarse
 * outer-step filter and do a land lookup) processed per frame. Rings are walked
 * nearest-first, so hitting this only thins the most distant impostors. Without
 * it, a large draw range over water/off-map would scan millions of cells and
 * collapse the frame rate.
 */
const MAX_WORKING_CELLS_PER_FRAME = 60000;

/**
 * Coarse per-cell land cache size before a full reset. Terrain is static, so
 * this is really just a memory bound; it MUST stay well above
 * {@link MAX_WORKING_CELLS_PER_FRAME} so the cache can never clear mid-frame
 * (which would re-issue the same terrain raycasts thousands of times per frame).
 */
const LAND_CACHE_MAX = 400000;

function treesForCellDistance(dist: number, innerHalfSpan: number, maxPerCell: number): number {
    if (dist <= innerHalfSpan) {
        return maxPerCell;
    }
    if (dist <= innerHalfSpan * 2.5) {
        return 3;
    }
    return 1;
}

function effectiveFillForDistance(dist: number, innerHalfSpan: number, halfSpan: number): number {
    if (dist <= innerHalfSpan) {
        return 1;
    }
    const t = Math.min(1, (dist - innerHalfSpan) / (halfSpan - innerHalfSpan));
    return 1 - t * 0.88;
}

function anyHillNear(worldX: number, worldZ: number, hills: HillCollider[]): boolean {
    for (let i = 0; i < hills.length; i++) {
        const hill = hills[i];
        const dx = Math.abs(worldX - hill.worldX);
        const dz = Math.abs(worldZ - hill.worldZ);
        if (dx > hill.worldReach || dz > hill.worldReach) {
            continue;
        }
        if (dx + dz <= hill.worldReach) {
            return true;
        }
    }
    return false;
}

/** GPU-instanced render batches for a single tree species. */
interface SpeciesBatch {
    foliage: THREE.InstancedMesh;
    trunk?: THREE.InstancedMesh;
    impostor: THREE.InstancedMesh;
    /** Point cloud (LOD2): one 1px dot per distant plant. */
    pixel: THREE.Points;
    /** Backing xyz buffer for {@link pixel} (length capacity * 3). */
    pixelPositions: Float32Array;
    /** Instances written this frame that carry full volumes (near zone). */
    volumeCount: number;
    /** Instances written this frame that carry a billboard impostor (mid zone). */
    impostorCount: number;
    /** Points written this frame that render as a 1px dot (far zone). */
    pixelCount: number;
    capacity: number;
    /** Distance (m) within which this species is a full-detail volume. */
    fullDetailRange: number;
    /** Distance (m) out to which this species is a billboard impostor. */
    impostorRange: number;
    /** Distance (m) beyond which this species is not drawn. */
    lowDetailRange: number;
    /** Height offset (m) at which the pixel dot sits (approx canopy centre). */
    pixelY: number;
}

export class VegetationField implements Entity {

    private readonly batches: SpeciesBatch[];
    private readonly halfSpan: number;
    private readonly densityHalfSpan: number;
    /** Full-density radius that anchors the density ramp (independent of LOD). */
    private readonly densityInnerSpan: number;
    /** LOD boundary: trees within this radius render as full-detail volumes. */
    private readonly innerHalfSpan: number;
    private readonly maxTreesPerFrame: number;
    private readonly outerCellStep: number;
    /** Working cells processed in the current frame (bounded by MAX_WORKING_CELLS_PER_FRAME). */
    private cellsVisited = 0;
    private readonly persistentLandCache = new Map<number, boolean>();
    private readonly treeLandCache = new Map<number, boolean>();
    private readonly tmpVector2 = new THREE.Vector2();
    private readonly tmpMatrix = new THREE.Matrix4();
    private readonly tmpPos = new THREE.Vector3();
    private readonly tmpQuat = new THREE.Quaternion();
    private readonly tmpScale = new THREE.Vector3();

    readonly tags: string[] = [];

    enabled: boolean = true;

    constructor(
        private terrain: TerrainSampler,
        private hills: HillCollider[],
        private options: VegetationFieldSettings,
        materials: SceneMaterialManager,
        kinds: VegetationKind[],
    ) {
        this.maxTreesPerFrame = options.maxTreesPerFrame ?? 6000;
        this.outerCellStep = options.outerCellStep ?? 2;
        // densityHalfSpan drives the near/mid density ramp; it is independent of
        // the LOD view distances (which are per-species, see below).
        this.densityHalfSpan = (options.tilesInView * options.cellSize) / 2;
        this.densityInnerSpan = this.densityHalfSpan / 5;

        // Field-wide LOD defaults used for any species without an override.
        const defaultFullDetail = Math.max(this.densityInnerSpan, options.fullDetailRangeM ?? this.densityInnerSpan);
        const defaultLowDetail = Math.max(this.densityHalfSpan, options.lowDetailRangeM ?? this.densityHalfSpan);
        const resolveLod = (kind: VegetationKind) => {
            const s = options.speciesLod?.[kind];
            const fullDetailRange = Math.max(1, s?.fullDetailRangeM ?? defaultFullDetail);
            // An impostor range shorter than the full-detail range makes no sense;
            // clamp so a species is never culled while still "near".
            const lowDetailRange = Math.max(fullDetailRange, s?.lowDetailRangeM ?? defaultLowDetail);
            // Pixel (LOD2) band lives between impostorRange and lowDetailRange.
            // Default: no pixel band (impostor all the way out).
            const impostorRange = Math.min(
                lowDetailRange,
                Math.max(fullDetailRange, s?.impostorRangeM ?? lowDetailRange),
            );
            return { fullDetailRange, impostorRange, lowDetailRange };
        };

        // Trees are distributed roughly evenly across species, but allow generous
        // headroom so a locally dense species never overflows its instance buffer.
        const capacity = Math.min(
            this.maxTreesPerFrame,
            Math.ceil((this.maxTreesPerFrame / Math.max(1, kinds.length)) * 2.5) + 256,
        );

        this.batches = kinds.map(kind => {
            const parts = buildVegetationParts(materials, kind);
            const { fullDetailRange, impostorRange, lowDetailRange } = resolveLod(kind);

            const foliage = new THREE.InstancedMesh(parts.foliageGeometry, parts.foliageMaterial, capacity);
            foliage.frustumCulled = false;
            foliage.onBeforeRender = updateUniforms;
            foliage.count = 0;

            let trunk: THREE.InstancedMesh | undefined;
            if (parts.trunkGeometry && parts.trunkMaterial) {
                trunk = new THREE.InstancedMesh(parts.trunkGeometry, parts.trunkMaterial, capacity);
                trunk.frustumCulled = false;
                trunk.onBeforeRender = updateUniforms;
                trunk.count = 0;
            }

            const impostor = new THREE.InstancedMesh(parts.impostorGeometry, parts.impostorMaterial, capacity);
            impostor.frustumCulled = false;
            impostor.onBeforeRender = updateUniforms;
            impostor.count = 0;

            // LOD2: a dynamic point cloud. Positions hold absolute world coords,
            // so the object stays at the origin (like SpecklesEntity).
            const pixelPositions = new Float32Array(capacity * 3);
            const pixelGeometry = new THREE.BufferGeometry();
            pixelGeometry.setAttribute('position', new THREE.BufferAttribute(pixelPositions, 3));
            pixelGeometry.setDrawRange(0, 0);
            const pixel = new THREE.Points(pixelGeometry, parts.pixelMaterial);
            pixel.frustumCulled = false;
            pixel.onBeforeRender = updateUniforms;

            return {
                foliage, trunk, impostor, pixel, pixelPositions,
                volumeCount: 0, impostorCount: 0, pixelCount: 0, capacity,
                fullDetailRange, impostorRange, lowDetailRange,
                pixelY: parts.maxHeight * 0.6,
            };
        });

        // Global iteration bounds derived from the per-species ranges: iterate
        // out to the farthest species' outer (pixel) range, and treat cells beyond
        // the largest full-detail range as "far" (coarser sampling).
        this.innerHalfSpan = Math.max(this.densityInnerSpan, ...this.batches.map(b => b.fullDetailRange));
        this.halfSpan = Math.max(this.densityHalfSpan, ...this.batches.map(b => b.lowDetailRange));
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        //
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, palette: Palette): void {
        const volumesLayer = layers.get(SceneLayers.EntityVolumes);
        if (!volumesLayer) return;

        for (let i = 0; i < this.batches.length; i++) {
            this.batches[i].volumeCount = 0;
            this.batches[i].impostorCount = 0;
            this.batches[i].pixelCount = 0;
        }

        const cell = this.options.cellSize;
        const camX = camera.position.x;
        const camZ = camera.position.z;
        const hashSeed = this.options.hashSeed ?? 1;
        const treesPerCell = this.options.treesPerCell ?? 1;

        const camCol = Math.floor(camX / cell);
        const camRow = Math.floor(camZ / cell);
        const minCol = Math.floor((camX - this.halfSpan) / cell);
        const maxCol = Math.floor((camX + this.halfSpan) / cell);
        const minRow = Math.floor((camZ - this.halfSpan) / cell);
        const maxRow = Math.floor((camZ + this.halfSpan) / cell);
        const maxRing = Math.max(
            Math.abs(minCol - camCol),
            Math.abs(maxCol - camCol),
            Math.abs(minRow - camRow),
            Math.abs(maxRow - camRow),
        );

        this.treesRendered = 0;
        this.cellsVisited = 0;

        for (let ring = 0; ring <= maxRing && this.withinFrameBudget(); ring++) {
            for (let dc = -ring; dc <= ring && this.withinFrameBudget(); dc++) {
                this.processCell(camCol + dc, camRow - ring, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
                if (ring === 0) continue;
                this.processCell(camCol + dc, camRow + ring, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
            }
            if (ring === 0) continue;
            for (let dr = -ring + 1; dr < ring && this.withinFrameBudget(); dr++) {
                this.processCell(camCol - ring, camRow + dr, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
                this.processCell(camCol + ring, camRow + dr, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
            }
        }

        for (let i = 0; i < this.batches.length; i++) {
            const batch = this.batches[i];

            batch.foliage.count = batch.volumeCount;
            if (batch.volumeCount > 0) {
                batch.foliage.instanceMatrix.needsUpdate = true;
                volumesLayer?.add(batch.foliage);
                if (batch.trunk) {
                    batch.trunk.count = batch.volumeCount;
                    batch.trunk.instanceMatrix.needsUpdate = true;
                    volumesLayer?.add(batch.trunk);
                }
            }

            batch.impostor.count = batch.impostorCount;
            if (batch.impostorCount > 0) {
                batch.impostor.instanceMatrix.needsUpdate = true;
                volumesLayer?.add(batch.impostor);
            }

            batch.pixel.geometry.setDrawRange(0, batch.pixelCount);
            if (batch.pixelCount > 0) {
                (batch.pixel.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
                volumesLayer?.add(batch.pixel);
            }
        }
    }

    private treesRendered = 0;

    /** True while the frame still has room for more trees and more scanned cells. */
    private withinFrameBudget(): boolean {
        return this.treesRendered < this.maxTreesPerFrame
            && this.cellsVisited < MAX_WORKING_CELLS_PER_FRAME;
    }

    private processCell(
        col: number,
        row: number,
        minCol: number,
        maxCol: number,
        minRow: number,
        maxRow: number,
        cell: number,
        camX: number,
        camZ: number,
        hashSeed: number,
        treesPerCell: number,
    ): void {
        if (col < minCol || col > maxCol || row < minRow || row > maxRow) return;
        if (this.treesRendered >= this.maxTreesPerFrame) return;

        const cellSeed = col * 928371 + row * 689287;

        const centerX = (col + 0.5) * cell;
        const centerZ = (row + 0.5) * cell;
        const cellDist = Math.hypot(centerX - camX, centerZ - camZ);

        const isFar = cellDist > this.innerHalfSpan;
        if (isFar && (col % this.outerCellStep !== 0 || row % this.outerCellStep !== 0)) return;

        // Count only cells that reach the land lookup; this is the work the
        // per-frame ceiling is meant to bound.
        this.cellsVisited++;

        const cacheKey = landCacheKey(col, row);
        let isLand = this.persistentLandCache.get(cacheKey);
        if (isLand === undefined) {
            isLand = this.terrain.isLand(centerX, centerZ);
            if (this.persistentLandCache.size > LAND_CACHE_MAX) {
                this.persistentLandCache.clear();
            }
            this.persistentLandCache.set(cacheKey, isLand);
        }
        if (!isLand) return;

        const slotsForCell = treesForCellDistance(cellDist, this.densityInnerSpan, treesPerCell);
        // Per-tree spawn probability: the field's base density (fillRatio) thinned
        // out with distance. Applied per candidate so trees scatter individually
        // instead of whole cells switching on/off (which produced patches). Anchored
        // to the density inner radius so the full-detail LOD range can extend
        // independently without changing how dense the field is.
        const spawnChance = this.options.fillRatio * effectiveFillForDistance(cellDist, this.densityInnerSpan, this.densityHalfSpan);
        const sampleHills = anyHillNear(centerX, centerZ, this.hills);

        for (let slot = 0; slot < slotsForCell && this.treesRendered < this.maxTreesPerFrame; slot++) {
            const slotSeed = cellSeed + slot * 48271;
            // Uniform position anywhere in the cell so trees fill it edge-to-edge
            // rather than clustering around the centre.
            const wx = (col + hash2D(slotSeed, 0, hashSeed)) * cell;
            const wz = (row + hash2D(slotSeed, 1, hashSeed)) * cell;

            if (hash2D(wx, wz, hashSeed + slot) >= spawnChance) continue;
            if (this.isExcluded(wx, wz)) continue;
            if (!this.isLandAtTree(wx, wz)) continue;

            const batchIndex = Math.floor(hash2D(wx, wz, hashSeed + slot + 1) * this.batches.length);
            const batch = this.batches[batchIndex];
            // Per-species LOD, nearest-first: full-detail volume (LOD0), billboard
            // impostor (LOD1), single 1px point (LOD2), then cull.
            if (cellDist > batch.lowDetailRange) continue;

            const surfaceY = sampleHills ? sampleHillSurfaceY(wx, wz, this.hills) : 0;

            if (cellDist > batch.impostorRange) {
                // LOD2: a bare point. No scale/rotation/matrix needed.
                if (batch.pixelCount >= batch.capacity) continue;
                const base = batch.pixelCount * 3;
                batch.pixelPositions[base + 0] = wx;
                batch.pixelPositions[base + 1] = surfaceY + batch.pixelY;
                batch.pixelPositions[base + 2] = wz;
                batch.pixelCount++;
                this.treesRendered++;
                continue;
            }

            const withVolumes = cellDist <= batch.fullDetailRange;
            const targetCount = withVolumes ? batch.volumeCount : batch.impostorCount;
            if (targetCount >= batch.capacity) continue;

            const scale = this.options.scaleMin + hash2D(wx, wz, hashSeed + slot + 2) * (this.options.scaleMax - this.options.scaleMin);
            const rotation = hash2D(wx, wz, hashSeed + slot + 3) * Math.PI * 2;

            this.tmpPos.set(wx, surfaceY, wz);
            this.tmpQuat.setFromAxisAngle(UP, rotation);
            this.tmpScale.set(scale, scale, scale);
            this.tmpMatrix.compose(this.tmpPos, this.tmpQuat, this.tmpScale);

            if (withVolumes) {
                batch.foliage.setMatrixAt(batch.volumeCount, this.tmpMatrix);
                if (batch.trunk) {
                    batch.trunk.setMatrixAt(batch.volumeCount, this.tmpMatrix);
                }
                batch.volumeCount++;
            } else {
                batch.impostor.setMatrixAt(batch.impostorCount++, this.tmpMatrix);
            }

            this.treesRendered++;
        }
    }

    render2D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, _lists: Set<string>, _painter: CanvasPainter, _palette: Palette): void {
        //
    }

    /**
     * Per-tree land test so trees near a coastline aren't placed in water (the
     * coarse per-cell test only samples the cell centre). Sampled on a fine grid
     * and cached persistently since terrain is static.
     */
    private isLandAtTree(wx: number, wz: number): boolean {
        const qx = Math.round(wx / TREE_LAND_SAMPLE);
        const qz = Math.round(wz / TREE_LAND_SAMPLE);
        const key = qx * 73856093 ^ qz * 19349663;
        let isLand = this.treeLandCache.get(key);
        if (isLand === undefined) {
            isLand = this.terrain.isLand(qx * TREE_LAND_SAMPLE, qz * TREE_LAND_SAMPLE);
            if (this.treeLandCache.size > 200000) {
                this.treeLandCache.clear();
            }
            this.treeLandCache.set(key, isLand);
        }
        return isLand;
    }

    private isExcluded(wx: number, wz: number): boolean {
        const areas = this.options.excludeAreas;
        if (!areas) return false;
        this.tmpVector2.set(wx, wz);
        for (let i = 0; i < areas.length; i++) {
            if (areas[i].containsPoint(this.tmpVector2)) return true;
        }
        return false;
    }
}
