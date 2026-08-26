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

describe('culling follows the camera, not the aircraft (regression)', () => {
    /**
     * The quadtree builds its frustum from `camera.matrixWorld`, but THREE only
     * recomputes that when the renderer *submits* -- which happens after the
     * render lists are built. So culling ran against the previous pose, and in
     * any view whose orientation is set after the camera updater runs (an
     * orbited exterior view, or looking around the cockpit) it never caught up:
     * measured in the running game, the frustum sat a steady 105 degrees off
     * the view direction and stayed there, pinning terrain to a cone around the
     * aircraft axis while the player looked elsewhere.
     *
     * The check has to spy on what `Quadtree.update` was handed. Asserting on
     * the camera afterwards proves nothing: `speculativeWants` calls
     * `getWorldDirection`, which commits the world matrix as a side effect --
     * but it runs *after* the frustum has already been built from the stale one.
     */
    function forwardOf(m: THREE.Matrix4): THREE.Vector3 {
        return new THREE.Vector3(0, 0, -1)
            .applyMatrix4(new THREE.Matrix4().extractRotation(m));
    }

    /** Records the camera pose the quadtree actually culled against. */
    function spyOnCulling(entity: TerrainEntity): () => THREE.Vector3 | null {
        const qt = (entity as unknown as {
            quadtree: { update: (...a: unknown[]) => unknown };
        }).quadtree;
        const original = qt.update.bind(qt);
        let seen: THREE.Vector3 | null = null;
        qt.update = (...args: unknown[]) => {
            seen = forwardOf((args[0] as THREE.PerspectiveCamera).matrixWorld);
            return original(...args);
        };
        return () => seen;
    }

    it('culls against the view direction, not the last committed pose', () => {
        const entity = makeEntity();
        const cam = camera();
        cam.lookAt(0, cam.position.y, 1);        // facing north, committed
        cam.updateMatrixWorld(true);
        entity.setLodCamera(cam);
        const culledAgainst = spyOnCulling(entity);

        // Swing a quarter turn east and stop, exactly as a camera updater
        // does. Nothing recomputes matrixWorld until the renderer submits.
        cam.lookAt(1, cam.position.y, 0);
        const live = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        assert.ok(
            forwardOf(cam.matrixWorld).dot(live) < 0.9,
            'precondition: the world matrix must still be stale here',
        );

        const lists = new Map([[SceneLayers.Terrain, new THREE.Scene()]]);
        beginRenderListPass(lists.get(SceneLayers.Terrain)!, 1);
        entity.render3D(320, 200, cam, lists, {} as never);

        const seen = culledAgainst();
        assert.ok(seen, 'the quadtree was never asked to update');
        const angleDeg = Math.acos(
            Math.max(-1, Math.min(1, seen.dot(live))),
        ) * 180 / Math.PI;
        assert.ok(
            angleDeg < 0.01,
            `culled ${angleDeg.toFixed(1)} degrees away from the view direction`,
        );
    });
});

describe('a sea stand-in must not count as a loaded tile (regression)', () => {
    /**
     * A tile the index lists but the streamer has not uploaded yet is still
     * drawn -- as a flat sea patch, the least-bad placeholder. That patch used
     * to be counted as residency, which told the quadtree the tile was done:
     * it stopped appearing in the want set, `setWants` cancelled the fetch as
     * no-longer-wanted, and nothing ever asked for it again. The island stayed
     * flat water for the rest of the session.
     */
    function spyOnWants(entity: TerrainEntity): () => Set<string> {
        const streamer = (entity as unknown as {
            streamer: { setWants: (...a: unknown[]) => void };
        }).streamer;
        const original = streamer.setWants.bind(streamer);
        let seen = new Set<string>();
        streamer.setWants = (...args: unknown[]) => {
            const wants = args[0] as { id: { z: number; x: number; y: number } }[];
            seen = new Set(wants.map(w => `${w.id.z}/${w.id.x}/${w.id.y}`));
            return original(...args);
        };
        return () => seen;
    }

    function reconcilePass(entity: TerrainEntity, cam: THREE.PerspectiveCamera, gen: number): void {
        (entity as unknown as { lastReconcile: number }).lastReconcile = 0;
        const list = new THREE.Scene();
        beginRenderListPass(list, gen);
        entity.render3D(1280, 720, cam, new Map([[SceneLayers.Terrain, list]]), null as never);
    }

    it('keeps wanting a land tile it is drawing as sea', () => {
        const entity = makeEntity();
        const cam = camera();
        entity.setLodCamera(cam);
        const wanted = spyOnWants(entity);
        const oceans = (entity as unknown as { oceans: Map<string, unknown> }).oceans;

        reconcilePass(entity, cam, 1);
        assert.ok(wanted().has('0/0/0'), 'precondition: the tile is wanted at first');
        assert.ok(oceans.has('0/0/0'), 'precondition: it is drawn as a sea stand-in');

        reconcilePass(entity, cam, 2);
        assert.ok(
            wanted().has('0/0/0'),
            'the sea stand-in made the tile look resident, so its fetch is cancelled '
            + 'and the land never loads',
        );
    });
});
