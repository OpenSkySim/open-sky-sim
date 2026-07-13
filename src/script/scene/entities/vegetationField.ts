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
    shadow: THREE.InstancedMesh;
    /** Instances written this frame that carry full volumes (near zone). */
    volumeCount: number;
    /** Instances written this frame that carry a billboard impostor (far zone). */
    impostorCount: number;
    /** Instances written this frame that carry a shadow (near + far). */
    shadowCount: number;
    capacity: number;
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
        // densityHalfSpan drives the near/mid density ramp; halfSpan is how far
        // the lowest-detail impostors are actually drawn (extended independently).
        this.densityHalfSpan = (options.tilesInView * options.cellSize) / 2;
        this.halfSpan = Math.max(this.densityHalfSpan, options.lowDetailRangeM ?? this.densityHalfSpan);
        this.densityInnerSpan = this.densityHalfSpan / 5;
        this.innerHalfSpan = Math.max(this.densityInnerSpan, options.fullDetailRangeM ?? this.densityInnerSpan);

        // Trees are distributed roughly evenly across species, but allow generous
        // headroom so a locally dense species never overflows its instance buffer.
        const capacity = Math.min(
            this.maxTreesPerFrame,
            Math.ceil((this.maxTreesPerFrame / Math.max(1, kinds.length)) * 2.5) + 256,
        );

        this.batches = kinds.map(kind => {
            const parts = buildVegetationParts(materials, kind);

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

            const shadow = new THREE.InstancedMesh(parts.shadowGeometry, parts.shadowMaterial, capacity);
            shadow.frustumCulled = false;
            shadow.onBeforeRender = updateUniforms;
            shadow.count = 0;

            return { foliage, trunk, impostor, shadow, volumeCount: 0, impostorCount: 0, shadowCount: 0, capacity };
        });
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        //
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, layers: Map<string, THREE.Scene>, palette: Palette): void {
        const flatsLayer = layers.get(SceneLayers.EntityFlats);
        const volumesLayer = layers.get(SceneLayers.EntityVolumes);
        if (!flatsLayer && !volumesLayer) return;

        for (let i = 0; i < this.batches.length; i++) {
            this.batches[i].volumeCount = 0;
            this.batches[i].impostorCount = 0;
            this.batches[i].shadowCount = 0;
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

        for (let ring = 0; ring <= maxRing && this.treesRendered < this.maxTreesPerFrame; ring++) {
            for (let dc = -ring; dc <= ring && this.treesRendered < this.maxTreesPerFrame; dc++) {
                this.processCell(camCol + dc, camRow - ring, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
                if (ring === 0) continue;
                this.processCell(camCol + dc, camRow + ring, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
            }
            if (ring === 0) continue;
            for (let dr = -ring + 1; dr < ring && this.treesRendered < this.maxTreesPerFrame; dr++) {
                this.processCell(camCol - ring, camRow + dr, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
                this.processCell(camCol + ring, camRow + dr, minCol, maxCol, minRow, maxRow, cell, camX, camZ, hashSeed, treesPerCell);
            }
        }

        for (let i = 0; i < this.batches.length; i++) {
            const batch = this.batches[i];

            batch.shadow.count = batch.shadowCount;
            if (batch.shadowCount > 0) {
                batch.shadow.instanceMatrix.needsUpdate = true;
                flatsLayer?.add(batch.shadow);
            }

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
        }
    }

    private treesRendered = 0;

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

        const cacheKey = landCacheKey(col, row);
        let isLand = this.persistentLandCache.get(cacheKey);
        if (isLand === undefined) {
            isLand = this.terrain.isLand(centerX, centerZ);
            if (this.persistentLandCache.size > 50000) {
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
        const withVolumes = !isFar;

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
            if (batch.shadowCount >= batch.capacity) continue;

            const surfaceY = sampleHills ? sampleHillSurfaceY(wx, wz, this.hills) : 0;
            const scale = this.options.scaleMin + hash2D(wx, wz, hashSeed + slot + 2) * (this.options.scaleMax - this.options.scaleMin);
            const rotation = hash2D(wx, wz, hashSeed + slot + 3) * Math.PI * 2;

            this.tmpPos.set(wx, surfaceY, wz);
            this.tmpQuat.setFromAxisAngle(UP, rotation);
            this.tmpScale.set(scale, scale, scale);
            this.tmpMatrix.compose(this.tmpPos, this.tmpQuat, this.tmpScale);

            batch.shadow.setMatrixAt(batch.shadowCount++, this.tmpMatrix);
            if (withVolumes) {
                if (batch.volumeCount < batch.capacity) {
                    batch.foliage.setMatrixAt(batch.volumeCount, this.tmpMatrix);
                    if (batch.trunk) {
                        batch.trunk.setMatrixAt(batch.volumeCount, this.tmpMatrix);
                    }
                    batch.volumeCount++;
                }
            } else if (batch.impostorCount < batch.capacity) {
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
