import { HeightSource } from './heightSource';
import { isWaterHeight } from './terrainMesh';
import { TileId, tileBounds } from './tileId';
import { TerrainLodClass } from './viewRange';

export interface TileLodInfo {
    lod: TerrainLodClass;
    /** Max−min finite sample height (m). 0 for ocean / unknown. */
    deltaH: number;
}

/**
 * Interior sample grid edge count by zoom. Coarse tiles need dense grids so a
 * shoreline cannot slip between samples and freeze the subtree as inland/ocean.
 */
function sampleGridN(z: number): number {
    if (z >= 10) {
        return 5;
    }
    if (z >= 8) {
        return 9;
    }
    if (z >= 6) {
        return 13;
    }
    return 17;
}

/** Extra samples along each tile edge (shorelines often sit on boundaries). */
function edgeSampleN(z: number): number {
    if (z >= 10) {
        return 9;
    }
    if (z >= 8) {
        return 13;
    }
    return 17;
}

type SampleAcc = {
    water: number;
    land: number;
    unknown: number;
    hMin: number;
    hMax: number;
};

function samplePoint(
    source: HeightSource,
    seaLevel: number,
    lon: number,
    lat: number,
    acc: SampleAcc,
): boolean {
    if (source.maxZoomAt(lon, lat) <= 0) {
        acc.water += 1;
    } else {
        const h = source.rawHeightAt(lon, lat);
        if (!Number.isFinite(h)) {
            acc.unknown += 1;
        } else {
            if (isWaterHeight(h, seaLevel)) {
                acc.water += 1;
            } else {
                acc.land += 1;
            }
            acc.hMin = Math.min(acc.hMin, h);
            acc.hMax = Math.max(acc.hMax, h);
        }
    }
    return acc.water > 0 && acc.land > 0;
}

/**
 * Single-pass LOD class + height range for a tile.
 * Mixed water/land → coast (early exit); all land → inland; else ocean.
 * Unloaded DEM (raw NaN inside coverage) is not treated as water — otherwise
 * cache misses coarsen land to ocean leaves and bake teal holes.
 */
export function analyzeTileLod(
    source: HeightSource,
    seaLevel: number,
    id: TileId,
): TileLodInfo {
    const b = tileBounds(id);
    const acc: SampleAcc = {
        water: 0,
        land: 0,
        unknown: 0,
        hMin: Infinity,
        hMax: -Infinity,
    };

    const n = sampleGridN(id.z);
    for (let iy = 0; iy < n; iy++) {
        const lat = b.south + (b.north - b.south) * (iy / (n - 1));
        for (let ix = 0; ix < n; ix++) {
            const lon = b.west + (b.east - b.west) * (ix / (n - 1));
            if (samplePoint(source, seaLevel, lon, lat, acc)) {
                return { lod: 'coast', deltaH: acc.hMax - acc.hMin };
            }
        }
    }

    // Perimeter pass: thin shorelines along tile borders miss the interior grid
    // (classic "straight coast next to jagged coast" freeze).
    const eN = edgeSampleN(id.z);
    const dLon = (b.east - b.west) * 0.02;
    const dLat = (b.north - b.south) * 0.02;
    for (let i = 0; i < eN; i++) {
        const t = i / (eN - 1);
        const lon = b.west + (b.east - b.west) * t;
        const lat = b.south + (b.north - b.south) * t;
        // On-border + just outside: DEM shoreline often sits in the neighbour,
        // so a pure-land tile meets pure-ocean across a QT edge and the visible
        // "coast" is that coarse tile boundary (blocky SE corners from space).
        if (samplePoint(source, seaLevel, lon, b.south, acc)
            || samplePoint(source, seaLevel, lon, b.south - dLat, acc)
            || samplePoint(source, seaLevel, lon, b.north, acc)
            || samplePoint(source, seaLevel, lon, b.north + dLat, acc)
            || samplePoint(source, seaLevel, b.west, lat, acc)
            || samplePoint(source, seaLevel, b.west - dLon, lat, acc)
            || samplePoint(source, seaLevel, b.east, lat, acc)
            || samplePoint(source, seaLevel, b.east + dLon, lat, acc)) {
            return { lod: 'coast', deltaH: acc.hMax - acc.hMin };
        }
    }

    const deltaH = Number.isFinite(acc.hMin) && Number.isFinite(acc.hMax)
        ? acc.hMax - acc.hMin
        : 0;
    if (acc.land > 0) {
        return { lod: 'inland', deltaH };
    }
    // Pending DEM inside coverage: refine as inland, not ocean (z≤5).
    if (acc.unknown > 0) {
        return { lod: 'inland', deltaH: Math.max(deltaH, 200) };
    }
    return { lod: 'ocean', deltaH: 0 };
}

/** Max−min finite height among tile samples (m). */
export function tileHeightRangeM(
    source: HeightSource,
    seaLevel: number,
    id: TileId,
): number {
    return analyzeTileLod(source, seaLevel, id).deltaH;
}

/**
 * Classify a DEM tile for LOD: mixed water/land samples → coast; all land →
 * inland; all water / outside DEM → ocean.
 */
export function classifyTileLod(
    source: HeightSource,
    seaLevel: number,
    id: TileId,
): TerrainLodClass {
    return analyzeTileLod(source, seaLevel, id).lod;
}
