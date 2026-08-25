import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeEnuBasis } from './geodesy';
import { buildTileMesh, decodeTmb, encodeTmb, encodeTmbUncompressed, MeshBuildResult } from './meshBuilder';

const SIZE = 17;
const basis = makeEnuBasis(28, -15, 0);

function buildSampleMesh(): MeshBuildResult {
    const heights = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            heights[y * SIZE + x] = (y < SIZE / 2 ? 50 : -10) + x;
        }
    }
    return buildTileMesh({
        id: { z: 10, x: 512, y: 256 },
        heights,
        size: SIZE,
        geometricErrorM: 1,
        maxErrorM: 1,
        seaLevel: 0,
        basis,
    });
}

function assertMeshEqual(a: Omit<MeshBuildResult, 'key'>, b: Omit<MeshBuildResult, 'key'>): void {
    assert.deepEqual(Array.from(a.positions), Array.from(b.positions));
    assert.deepEqual(Array.from(a.normals), Array.from(b.normals));
    assert.deepEqual(Array.from(a.indices), Array.from(b.indices));
    assert.deepEqual(Array.from(a.tones), Array.from(b.tones));
    assert.deepEqual(Array.from(a.groups), Array.from(b.groups));
    assert.equal(a.centerE, b.centerE);
    assert.equal(a.centerN, b.centerN);
    assert.equal(a.centerU, b.centerU);
    assert.equal(a.boundingRadius, b.boundingRadius);
    assert.equal(a.triangleCount, b.triangleCount);
    assert.equal(a.vertexCount, b.vertexCount);
}

describe('TMB1 encode/decode', () => {
    it('round-trips through the uncompressed encoding, matching the live build exactly', () => {
        const mesh = buildSampleMesh();
        const decoded = decodeTmb(encodeTmbUncompressed(mesh));
        assertMeshEqual(decoded, mesh);
    });

    it('round-trips through the zlib-compressed encoding', () => {
        const mesh = buildSampleMesh();
        const decoded = decodeTmb(encodeTmb(mesh));
        assertMeshEqual(decoded, mesh);
    });
});
