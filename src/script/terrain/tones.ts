/**
 * Palette tones a terrain triangle can carry.
 *
 * The numbering is load-bearing: it is the order tone groups appear in a
 * `.ptm` payload and the order materials are built in, so water tones must
 * stay below land tones and neither block may be reordered without a re-bake.
 */
export const enum TerrainTone {
    Water = 0,
    ShallowWater = 1,
    Sand = 2,
    Grass = 3,
    Bare = 4,
}

export const TONE_COUNT = 5;

/** Water is drawn unshaded with shared vertices; land is flat-shaded per facet. */
export function isWaterTone(tone: number): boolean {
    return tone === TerrainTone.Water || tone === TerrainTone.ShallowWater;
}
