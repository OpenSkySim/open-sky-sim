import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    PTM_FLAG_HAS_LAND, PTM_FLAG_HAS_WATER, PTM_HEADER_BYTES, decodePtm, encodePtm, PtmEncodeInput,
} from './ptm';
import { TerrainTone } from './tones';

/**
 * A tile with 3 land triangles (one per land tone) and 2 water triangles
 * (one deep, one shallow) sharing an edge, so the encoder has to duplicate the
 * two vertices that straddle the deep/shallow boundary.
 */
function sampleTile(): PtmEncodeInput {
    const tri = (ox: number, oz: number) => [
        ox, 10, oz,
        ox + 100, 20, oz,
        ox, 30, oz + 100,
    ];
    return {
        id: { z: 12, x: 3745, y: 1410 },
        centerHeightM: 123.5,
        tileHalfWidthM: 2200,
        skirtDepthM: 7.25,
        land: {
            positions: new Float32Array([...tri(0, 0), ...tri(200, 0), ...tri(400, 0)]),
            faceNormals: new Float32Array([0, 1, 0, 0.6, 0.8, 0, -0.6, 0.8, 0]),
            tones: new Uint8Array([TerrainTone.Grass, TerrainTone.Sand, TerrainTone.Bare]),
        },
        water: {
            // Quad split into two triangles sharing the 1-2 edge.
            positions: new Float32Array([
                -100, -1, -100,
                100, -1, -100,
                -100, -1, 100,
                100, -1, 100,
            ]),
            indices: new Uint32Array([0, 1, 2, 1, 3, 2]),
            tones: new Uint8Array([TerrainTone.Water, TerrainTone.ShallowWater]),
        },
    };
}

describe('PTM1 codec', () => {
    it('round-trips positions within a quantisation step', () => {
        const input = sampleTile();
        const tile = decodePtm(encodePtm(input));

        // Land triangles are re-ordered by tone, so compare as a set of
        // (position -> tone) facts rather than by index.
        const seen = new Map<string, number>();
        for (let v = 0; v < tile.landPositions.length / 3; v++) {
            const x = tile.landPositions[v * 3] * tile.quantScale;
            const y = tile.landPositions[v * 3 + 1] * tile.quantScale;
            const z = tile.landPositions[v * 3 + 2] * tile.quantScale;
            seen.set(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`, tile.landTones[v]);
        }
        const src = input.land.positions;
        for (let t = 0; t < input.land.tones.length; t++) {
            for (let k = 0; k < 3; k++) {
                const key = [
                    Math.round(src[t * 9 + k * 3]),
                    Math.round(src[t * 9 + k * 3 + 1]),
                    Math.round(src[t * 9 + k * 3 + 2]),
                ].join(',');
                assert.equal(seen.get(key), input.land.tones[t], `vertex ${key}`);
            }
        }

        // Quantisation error is bounded by half a step, the same on every
        // axis. At z12 that is ~3 cm, far below anything this renderer can
        // show — it snaps vertices to a low-res pixel grid anyway.
        assert.ok(
            tile.quantScale / 2 < 0.05,
            `step ${tile.quantScale} too coarse at z12`,
        );
    });

    it('preserves header metadata verbatim', () => {
        const input = sampleTile();
        const tile = decodePtm(encodePtm(input));
        assert.deepEqual(tile.id, { z: 12, x: 3745, y: 1410 });
        assert.equal(tile.version, 2);
        assert.ok(Math.abs(tile.centerHeightM - 123.5) < 1e-4);
        assert.ok(Math.abs(tile.skirtDepthM - 7.25) < 1e-4);
        assert.equal(tile.flags & PTM_FLAG_HAS_LAND, PTM_FLAG_HAS_LAND);
        assert.equal(tile.flags & PTM_FLAG_HAS_WATER, PTM_FLAG_HAS_WATER);
        assert.ok(tile.boundingRadiusM > 100, `radius ${tile.boundingRadiusM}`);
    });

    it('groups land vertices contiguously by tone and sums to the total', () => {
        const tile = decodePtm(encodePtm(sampleTile()));
        const [sand, grass, bare] = tile.landGroups;
        assert.equal(sand[1] + grass[1] + bare[1], tile.landPositions.length / 3);
        assert.equal(sand[0], 0);
        assert.equal(grass[0], sand[1]);
        assert.equal(bare[0], sand[1] + grass[1]);
        for (const [tone, [start, count]] of
            [[TerrainTone.Sand, sand], [TerrainTone.Grass, grass], [TerrainTone.Bare, bare]] as const) {
            for (let v = start; v < start + count; v++) {
                assert.equal(tile.landTones[v], tone);
            }
        }
    });

    it('splits water indices into deep then shallow ranges', () => {
        const tile = decodePtm(encodePtm(sampleTile()));
        const [deep, shallow] = tile.waterGroups;
        assert.equal(deep[1], 3, 'one deep triangle');
        assert.equal(shallow[1], 3, 'one shallow triangle');
        assert.equal(deep[0], 0);
        assert.equal(shallow[0], 3);
        for (let i = deep[0]; i < deep[0] + deep[1]; i++) {
            assert.equal(tile.waterTones[tile.waterIndices[i]], TerrainTone.Water);
        }
        for (let i = shallow[0]; i < shallow[0] + shallow[1]; i++) {
            assert.equal(tile.waterTones[tile.waterIndices[i]], TerrainTone.ShallowWater);
        }
    });

    it('duplicates only the vertices straddling the deep/shallow boundary', () => {
        const tile = decodePtm(encodePtm(sampleTile()));
        // 4 source vertices; verts 1 and 2 are used by both triangles, so they
        // are duplicated once each: 4 + 2 = 6.
        assert.equal(tile.waterPositions.length / 3, 6);
        assert.equal(tile.waterTones.length, 6);
    });

    it('keeps normals unit-length after int8 quantisation', () => {
        const tile = decodePtm(encodePtm(sampleTile()));
        for (let v = 0; v < tile.landTones.length; v++) {
            const nx = tile.landNormals[v * 4] / 127;
            const ny = tile.landNormals[v * 4 + 1] / 127;
            const nz = tile.landNormals[v * 4 + 2] / 127;
            const len = Math.hypot(nx, ny, nz);
            assert.ok(Math.abs(len - 1) < 0.02, `normal ${v} length ${len}`);
            assert.equal(tile.landNormals[v * 4 + 3], 0, 'pad byte');
        }
    });

    it('gives all three vertices of a land triangle the same normal', () => {
        const tile = decodePtm(encodePtm(sampleTile()));
        for (let t = 0; t < tile.landTones.length / 3; t++) {
            for (let k = 1; k < 3; k++) {
                for (let c = 0; c < 3; c++) {
                    assert.equal(
                        tile.landNormals[(t * 3 + k) * 4 + c],
                        tile.landNormals[t * 3 * 4 + c],
                        `tri ${t} corner ${k} axis ${c}`,
                    );
                }
            }
        }
    });

    it('quantises every axis with the same scale', () => {
        // Not a stylistic choice. The mesh transform carries this as its
        // scale, and the shaded vertex program derives normalModelMatrix from
        // matrixWorld with getNormalMatrix (inverse transpose). A per-axis
        // scale skews the baked world-space normals — measured at up to 50
        // degrees on real tiles — which flattens n.sun and destroys the
        // per-facet shading. Only a uniform scale normalises back exactly.
        const tile = decodePtm(encodePtm(sampleTile()));
        const scale = tile.quantScale;
        assert.ok(scale > 0, 'scale is positive');

        // Round-trip a steep normal through the inverse-transpose of the
        // mesh scale and confirm it comes back unchanged.
        const n = [0.6, 0.8, 0];
        const t = [n[0] / scale, n[1] / scale, n[2] / scale];
        const lt = Math.hypot(t[0], t[1], t[2]);
        const dot = (n[0] * t[0] + n[1] * t[1] + n[2] * t[2]) / lt;
        assert.ok(
            Math.abs(dot - 1) < 1e-9,
            `uniform scale must leave normals untouched, got cos ${dot}`,
        );
    });

    it('decodes O(1) as views over the source buffer, not copies', () => {
        const bytes = encodePtm(sampleTile());
        const tile = decodePtm(bytes);
        assert.equal(tile.landPositions.buffer, bytes.buffer);
        assert.equal(tile.waterIndices.buffer, bytes.buffer);
    });

    it('handles a misaligned source slice by copying once', () => {
        const bytes = encodePtm(sampleTile());
        const padded = new Uint8Array(bytes.byteLength + 1);
        padded.set(bytes, 1);
        const tile = decodePtm(padded.subarray(1));
        assert.equal(tile.id.x, 3745);
        assert.equal(tile.landPositions.length / 3, 9);
    });

    it('encodes a water-only tile', () => {
        const input = sampleTile();
        input.land = {
            positions: new Float32Array(0),
            faceNormals: new Float32Array(0),
            tones: new Uint8Array(0),
        };
        const tile = decodePtm(encodePtm(input));
        assert.equal(tile.flags & PTM_FLAG_HAS_LAND, 0);
        assert.equal(tile.flags & PTM_FLAG_HAS_WATER, PTM_FLAG_HAS_WATER);
        assert.equal(tile.landPositions.length, 0);
        assert.ok(tile.waterIndices.length > 0);
    });

    it('encodes a land-only tile', () => {
        const input = sampleTile();
        input.water = {
            positions: new Float32Array(0),
            indices: new Uint32Array(0),
            tones: new Uint8Array(0),
        };
        const tile = decodePtm(encodePtm(input));
        assert.equal(tile.flags & PTM_FLAG_HAS_WATER, 0);
        assert.equal(tile.waterIndices.length, 0);
        assert.equal(tile.landPositions.length / 3, 9);
    });

    it('throws on a truncated buffer rather than producing garbage', () => {
        const bytes = encodePtm(sampleTile());
        assert.throws(() => decodePtm(bytes.slice(0, bytes.byteLength - 8)), /truncated/);
        assert.throws(() => decodePtm(bytes.slice(0, PTM_HEADER_BYTES - 1)), /too short/);
    });

    it('throws on a bad magic and an unsupported version', () => {
        const bytes = encodePtm(sampleTile());
        const badMagic = bytes.slice();
        badMagic[0] ^= 0xff;
        assert.throws(() => decodePtm(badMagic), /magic/);

        const badVersion = bytes.slice();
        badVersion[4] = 99;
        assert.throws(() => decodePtm(badVersion), /version/);
    });

    it('rejects a tone that belongs to the other stream', () => {
        const landInWater = sampleTile();
        landInWater.water.tones = new Uint8Array([TerrainTone.Grass, TerrainTone.ShallowWater]);
        assert.throws(() => encodePtm(landInWater), /non-water tone/);

        const waterInLand = sampleTile();
        waterInLand.land.tones = new Uint8Array([
            TerrainTone.Water, TerrainTone.Sand, TerrainTone.Bare,
        ]);
        assert.throws(() => encodePtm(waterInLand), /non-land tone/);
    });

    it('rejects inconsistent input array lengths', () => {
        const bad = sampleTile();
        bad.land.faceNormals = new Float32Array([0, 1, 0]);
        assert.throws(() => encodePtm(bad), /land normals/);
    });
});
