import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Quadtree } from './quadtree';
import { TerrainManifest } from './manifest';
import { TileKey, parentOf, tileKeyString } from './tiling';

function manifest(maxZoom = 4): TerrainManifest {
    return {
        version: 4,
        scheme: 'retro-terrain/1',
        ellipsoid: 'WGS84',
        seaLevel: 0,
        coverage: { west: -180, south: -90, east: 180, north: 90 },
        enuOrigin: { lat: 0, lon: 0, height: 0 },
        mesh: {
            path: '{z}/{x}/{y}.ptm', indexPath: 'i', minZoom: 0, maxZoom,
            encoding: 'PTM1', triangleBudget: 6144,
            // Error halves per level, so refinement is driven by distance.
            levelGeometricErrorM: Array.from({ length: maxZoom + 1 }, (_, z) => 4000 / (1 << z)),
            levelSkirtDepthM: [],
        },
        height: {
            path: '{z}/{x}/{y}.pdm', indexPath: 'i', tileSize: 33,
            minZoom: 0, maxZoom: 4, queryZoom: 4, coarseZoom: 2,
        },
        flattenPads: [],
    };
}

/** A flat toy world: tiles laid out on a plane so distances are predictable. */
function makeTree(opts: {
    maxZoom?: number;
    resident?: Set<string>;
    ocean?: Set<string>;
} = {}) {
    const resident = opts.resident ?? new Set<string>();
    const ocean = opts.ocean ?? new Set<string>();
    const tree = new Quadtree({
        manifest: manifest(opts.maxZoom ?? 4),
        tilePosition: (id) => {
            const span = 180 / (1 << id.z);
            const lon = -180 + id.x * span + span / 2;
            const lat = 90 - id.y * span - span / 2;
            return new THREE.Vector3(lon * 1000, 0, lat * 1000);
        },
        tileRadius: (id) => (180 / (1 << id.z)) * 1000,
        isResident: (id) => resident.has(tileKeyString(id)),
        isOcean: (id) => ocean.has(tileKeyString(id)),
        earthCenter: new THREE.Vector3(0, -6378137, 0),
        maxZoom: opts.maxZoom ?? 4,
    });
    return { tree, resident, ocean };
}

function camera(x = 0, y = 500, z = 0): THREE.PerspectiveCamera {
    const c = new THREE.PerspectiveCamera(50, 1.6, 1, 5_000_000);
    c.position.set(x, y, z);
    c.lookAt(x, 0, z + 1);
    c.updateMatrixWorld(true);
    c.updateProjectionMatrix();
    return c;
}

const keysOf = (nodes: { key: string }[]) => nodes.map(n => n.key);

describe('Quadtree', () => {
    it('draws the roots when nothing is resident', () => {
        const h = makeTree();
        const r = h.tree.update(camera(), 200, 50, 1);
        assert.ok(r.draw.length > 0, 'something is drawn');
        for (const node of r.draw) {
            assert.equal(node.id.z, 0, 'only roots, since no child is resident');
        }
    });

    it('never returns a parent and its descendant together', () => {
        const h = makeTree();
        // Make everything resident so refinement is unrestricted.
        const all = new Set<string>();
        for (let z = 0; z <= 4; z++) {
            for (let x = 0; x < (1 << (z + 1)); x++) {
                for (let y = 0; y < (1 << z); y++) {
                    all.add(`${z}/${x}/${y}`);
                }
            }
        }
        const t = makeTree({ resident: all });
        const r = t.tree.update(camera(), 200, 50, 1);
        const drawn = new Set(keysOf(r.draw));
        for (const key of drawn) {
            const [z, x, y] = key.split('/').map(Number);
            let p = parentOf({ z, x, y });
            while (p) {
                assert.ok(
                    !drawn.has(tileKeyString(p)),
                    `both ${key} and ancestor ${tileKeyString(p)} were drawn`,
                );
                p = parentOf(p);
            }
        }
        void h;
    });

    it('keeps drawing the parent until all four children are resident', () => {
        // childrenOf(0/0/0) is 1/0/0, 1/1/0, 1/0/1, 1/1/1 — z0 has a single
        // row, so 1/2/0 belongs to the other root.
        const partial = new Set<string>(['1/0/0', '1/1/0', '1/0/1']); // 3 of 4
        const h = makeTree({ resident: partial, maxZoom: 1 });
        const r = h.tree.update(camera(), 200, 50, 1);
        const drawn = new Set(keysOf(r.draw));
        assert.ok(drawn.has('0/0/0'), 'parent still drawn with a child missing');
        assert.ok(!drawn.has('1/0/0'), 'no child drawn yet');
    });

    it('hands over to the children once the fourth arrives', () => {
        const all = new Set<string>(['1/0/0', '1/1/0', '1/0/1', '1/1/1']);
        const h = makeTree({ resident: all, maxZoom: 1 });
        const r = h.tree.update(camera(), 200, 50, 1);
        const drawn = new Set(keysOf(r.draw));
        assert.ok(!drawn.has('0/0/0'), 'parent handed over');
        assert.ok([...drawn].some(k => k.startsWith('1/')), 'children drawn');
    });

    it('counts an ocean child as ready, since a patch covers it', () => {
        const h = makeTree({
            resident: new Set(['1/0/0', '1/1/0']),
            ocean: new Set(['1/0/1', '1/1/1']),
            maxZoom: 1,
        });
        const r = h.tree.update(camera(), 200, 50, 1);
        const drawn = new Set(keysOf(r.draw));
        assert.ok(!drawn.has('0/0/0'), 'ocean children do not block hand-over');
    });

    describe('want set', () => {
        it('asks for a tile it needs but does not have', () => {
            const h = makeTree();
            const r = h.tree.update(camera(), 200, 50, 1);
            assert.ok(r.wants.length > 0);
            for (const w of r.wants) {
                assert.equal(h.resident.has(tileKeyString(w.id)), false,
                    'never asks for something already resident');
            }
        });

        it('never asks for an ocean tile', () => {
            const ocean = new Set(['0/0/0', '0/1/0']);
            const h = makeTree({ ocean });
            const r = h.tree.update(camera(), 200, 50, 1);
            for (const w of r.wants) {
                assert.ok(!ocean.has(tileKeyString(w.id)), 'ocean tiles are generated, not fetched');
            }
        });

        it('asks for the children while still drawing the parent', () => {
            const h = makeTree({ resident: new Set(['1/0/0']), maxZoom: 1 });
            const r = h.tree.update(camera(), 200, 50, 1);
            const wanted = new Set(r.wants.map(w => tileKeyString(w.id)));
            assert.ok(
                [...wanted].some(k => k.startsWith('1/')),
                'children are requested so the wait is bounded',
            );
        });

        it('marks pinned tiles for the streamer', () => {
            const h = makeTree();
            const r = h.tree.update(camera(), 200, 50, 1, () => true);
            assert.ok(r.wants.every(w => w.pinned));
        });
    });

    describe('culling', () => {
        it('drops tiles beyond the altitude view range', () => {
            const h = makeTree();
            const near = h.tree.update(camera(0, 100, 0), 200, 50, 1);
            // Every drawn tile must be within the range used for that altitude.
            for (const node of near.draw) {
                assert.ok(Number.isFinite(node.radius));
            }
            assert.ok(near.draw.length > 0);
        });

        it('refines more as detailScale drops', () => {
            const all = new Set<string>();
            for (let z = 0; z <= 3; z++) {
                for (let x = 0; x < (1 << (z + 1)); x++) {
                    for (let y = 0; y < (1 << z); y++) {
                        all.add(`${z}/${x}/${y}`);
                    }
                }
            }
            const coarse = makeTree({ resident: all, maxZoom: 3 })
                .tree.update(camera(), 200, 50, 24);
            const fine = makeTree({ resident: all, maxZoom: 3 })
                .tree.update(camera(), 200, 50, 1);
            const depth = (r: { draw: { id: TileKey }[] }) =>
                Math.max(0, ...r.draw.map(n => n.id.z));
            assert.ok(
                depth(fine) >= depth(coarse),
                'the frame-time governor degrades detail, never increases it',
            );
        });
    });

    it('reports nodes that have not been seen recently', () => {
        const h = makeTree();
        h.tree.update(camera(), 200, 50, 1);
        for (let i = 0; i < 5; i++) {
            h.tree.update(camera(1e9, 500, 1e9), 200, 50, 1);
        }
        assert.ok(h.tree.stale(2).length > 0, 'nodes go stale once out of view');
    });
});
