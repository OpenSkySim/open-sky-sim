import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { LODHelper } from '../../render/helpers';
import { CombatSimClient } from '../../physics/sim/combatSimClient';
import { PROJ_STRIDE } from '../../physics/sim/simSnapshotCodec';
import { Entity } from '../entity';
import { ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';

/**
 * Renders the gun tracers produced by the combat sim worker. Projectile
 * integration and hit detection now live in the worker (see CombatSim); this
 * entity is a pure view over the per-snapshot projectile list, drawing one
 * tracer per live round from a fixed pool of {@link LODHelper}s.
 */
export class WeaponsField implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly tracers: LODHelper[] = [];
    private readonly scale = new THREE.Vector3(1, 1, 1);
    private readonly pos = new THREE.Vector3();
    private readonly quat = new THREE.Quaternion();

    constructor(models: ModelManager, private readonly combatSim: CombatSimClient, poolSize = 480) {
        for (let i = 0; i < poolSize; i++) {
            this.tracers.push(new LODHelper(models.getModel('lib:tracer'), 0));
        }
    }

    init(scene: Scene): void {
        // Nothing
    }

    update(delta: number): void {
        // Nothing: projectile state is owned by the combat sim worker.
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        if (!lists.has(SceneLayers.EntityVolumes) && !lists.has(SceneLayers.EntityFlats)) {
            return;
        }
        const buf = this.combatSim.getProjectileBuffer();
        const n = Math.min(this.combatSim.getProjectileCount(), this.tracers.length);
        for (let i = 0; i < n; i++) {
            const base = i * PROJ_STRIDE;
            this.pos.set(buf[base], buf[base + 1], buf[base + 2]);
            this.quat.set(buf[base + 3], buf[base + 4], buf[base + 5], buf[base + 6]);
            this.tracers[i].addToRenderList(
                this.pos, this.quat, this.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}
