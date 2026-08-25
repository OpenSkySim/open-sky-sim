import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { SceneMaterialManager } from '../scene/materials/materials';
import { SceneLayers } from '../scene/scene';
import { beginRenderListPass, pruneRenderList } from '../render/renderList';
import { TerrainManifest } from './manifest';
import { TerrainEntity } from './terrainEntity';

/** Enough of the material manager to construct the entity. */
const materials = {
    build: () => new THREE.ShaderMaterial(),
} as unknown as SceneMaterialManager;

function manifest(): TerrainManifest {
    return {
        version: 4,
        scheme: 'retro-terrain/1',
        ellipsoid: 'WGS84',
        seaLevel: 0,
        coverage: { west: -16, south: 27.5, east: -15, north: 28.5 },
        enuOrigin: { lat: 28.0015, lon: -15.3937, height: 0 },
        mesh: {
            path: '{z}/{x}/{y}.ptm', indexPath: 'index_mesh.bin',
            minZoom: 0, maxZoom: 12, encoding: 'PTM1', transport: 'gzip',
            triangleBudget: 6144,
            levelGeometricErrorM: [2149, 2149, 1742, 1153, 1001, 534],
            levelSkirtDepthM: [],
        },
        height: {
            path: '{z}/{x}/{y}.pdm', indexPath: 'index.bin', tileSize: 257,
            minZoom: 0, maxZoom: 11, queryZoom: 11, coarseZoom: 7,
        },
        flattenPads: [],
    };
}

function makeEntity(): TerrainEntity {
    return new TerrainEntity({
        manifest: manifest(),
        manifestUrl: 'assets/terrain/manifest.json',
        materials,
    });
}

function camera(): THREE.PerspectiveCamera {
    const c = new THREE.PerspectiveCamera(50, 1.6, 1, 550_000);
    c.position.set(0, 1000, 0);
    c.updateMatrixWorld(true);
    c.updateProjectionMatrix();
    return c;
}

describe('TerrainEntity render list attachment', () => {
    /**
     * The renderer stamps a generation on each build pass and prunes every
     * child that is not stamped for it. Attaching with a plain `list.add`
     * leaves the stamp undefined, so the terrain group is added and removed
     * again before anything is drawn — the whole scene renders, the draw list
     * and triangle counts look healthy, and the terrain is simply invisible.
     */
    it('stamps the terrain group so it survives pruning', () => {
        const entity = makeEntity();
        const list = new THREE.Scene();
        const lists = new Map<string, THREE.Scene>([[SceneLayers.Terrain, list]]);

        beginRenderListPass(list, 7);
        entity.render3D(1280, 720, camera(), lists, null as never);

        assert.equal(list.children.length, 1, 'group attached');
        pruneRenderList(list);
        assert.equal(
            list.children.length, 1,
            'terrain group was pruned — it must attach via attachToRenderList',
        );
    });

    it('re-stamps on every pass, not just the first', () => {
        const entity = makeEntity();
        const list = new THREE.Scene();
        const lists = new Map<string, THREE.Scene>([[SceneLayers.Terrain, list]]);

        for (const gen of [1, 2, 3]) {
            beginRenderListPass(list, gen);
            entity.render3D(1280, 720, camera(), lists, null as never);
            pruneRenderList(list);
            assert.equal(list.children.length, 1, `survived generation ${gen}`);
        }
    });

    it('does not attach to a pass that has no terrain layer', () => {
        const entity = makeEntity();
        const other = new THREE.Scene();
        beginRenderListPass(other, 1);
        entity.render3D(1280, 720, camera(), new Map([['Overlay', other]]), null as never);
        assert.equal(other.children.length, 0);
    });

    describe('LOD camera gating', () => {
        /**
         * SceneLayers.Terrain appears in six render-layer definitions, so
         * render3D runs several times per frame with different cameras. Only
         * the nominated one may drive LOD, or the MFD and target passes corrupt
         * the frame-time EMA and the traversal.
         */
        it('only reconciles for the nominated camera', () => {
            const entity = makeEntity();
            const main = camera();
            const mfd = camera();
            entity.setLodCamera(main);

            const list = new THREE.Scene();
            const lists = new Map<string, THREE.Scene>([[SceneLayers.Terrain, list]]);

            beginRenderListPass(list, 1);
            entity.render3D(1280, 720, mfd, lists, null as never);
            const afterOther = entity.stats.frameEmaMs;

            beginRenderListPass(list, 2);
            entity.render3D(1280, 720, mfd, lists, null as never);
            assert.equal(
                entity.stats.frameEmaMs, afterOther,
                'a non-LOD camera must not touch the frame-time EMA',
            );
        });

        it('still attaches the group for passes it does not reconcile', () => {
            const entity = makeEntity();
            entity.setLodCamera(camera());

            const list = new THREE.Scene();
            const lists = new Map<string, THREE.Scene>([[SceneLayers.Terrain, list]]);
            beginRenderListPass(list, 1);
            entity.render3D(1280, 720, camera(), lists, null as never);
            pruneRenderList(list);
            assert.equal(
                list.children.length, 1,
                'the MFD pass must still draw whatever the main pass produced',
            );
        });
    });
});
