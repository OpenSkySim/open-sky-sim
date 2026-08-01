import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { DEBRIS_PARTICLE_COUNT } from '../../defs';
import { SphereEmitter } from '../../physics/particles/emitters/sphereEmitter';
import { ConstantForce } from '../../physics/particles/forces/constantForce';
import { LinearDragForce } from '../../physics/particles/forces/linearDragForce';
import { ParticleSystem } from '../../physics/particles/particleSystem';
import { SimHitEvent } from '../../physics/sim/simTypes';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';
import { Entity } from '../entity';
import { Scene, SceneLayers } from '../scene';
import { attachToRenderList } from '../../render/renderList';

const DEBRIS_PER_HIT = 6;
const DEBRIS_MAX_HITS_PER_FRAME = 6;
/** Inherit only a fraction of target velocity so chips visibly peel off. */
const DEBRIS_VELOCITY_INHERIT = 0.2;

/** Gray / brown palette picks for metal and dirt chips. */
const DEBRIS_COLORS: PaletteCategory[] = [
    PaletteCategory.VEHICLE_PLANE_GREY,
    PaletteCategory.SCENERY_BUILDING_CONCRETE,
    PaletteCategory.SCENERY_BUILDING_METAL,
    PaletteCategory.SCENERY_FIELD_OCHRE,
    PaletteCategory.SCENERY_TREE_TRUNK,
    PaletteCategory.SCENERY_ROAD_SECONDARY,
];

/** Hot sparks for airframe scrapes against terrain/buildings. */
const SPARK_COLORS: PaletteCategory[] = [
    PaletteCategory.FX_FIRE,
    PaletteCategory.FX_FIRE__B,
    PaletteCategory.LIGHT_YELLOW,
    PaletteCategory.SCENERY_FIELD_YELLOW,
];

/**
 * Hit debris: small flat gray/brown plates that tumble as they fly.
 * Uses the same mesh material path as scenery (not the fire particle shader).
 */
export class DebrisField implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly system: ParticleSystem;
    private readonly emitter: SphereEmitter;
    private readonly chips: THREE.Mesh[] = [];
    /** Per-chip tumble axis (unit vectors). */
    private readonly spinAxes: THREE.Vector3[] = [];
    private readonly root = new THREE.Object3D();
    private readonly hitPos = new THREE.Vector3();
    private readonly hitVel = new THREE.Vector3();
    private readonly tmpQuat = new THREE.Quaternion();

    constructor(materials: SceneMaterialManager) {
        // Tight shell + low kick so chips peel off the hull instead of exploding out.
        this.emitter = new SphereEmitter(1.5, 3.5, 2, 10);
        this.system = new ParticleSystem(
            {
                systemMaxParticles: DEBRIS_PARTICLE_COUNT,
                systemReSpawn: true,
                emitterSpawnRatePerSecond: 0,
                particleLifeMin: 2.5,
                particleLifeMax: 4.5,
                // Metres — small shards, still readable at dogfight range.
                particleSizeStartMin: 0.6,
                particleSizeStartMax: 1.4,
                particleSizeEndMin: 0.3,
                particleSizeEndMax: 0.8,
                particleRotationStartMin: 0,
                particleRotationStartMax: Math.PI * 2,
                // Several full tumbles over the chip's life.
                particleRotationEndMin: Math.PI * 4,
                particleRotationEndMax: Math.PI * 10,
            },
            this.emitter,
        );
        this.system.addForce(new ConstantForce(new THREE.Vector3(0, -9.80665, 0)));
        // ~0.55 /s → terminal freefall ≈ 18 m/s; sheds inherited aircraft speed in ~2–3 s.
        this.system.addForce(new LinearDragForce(0.55));

        const chipColors = [...DEBRIS_COLORS, ...SPARK_COLORS];
        const geo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < DEBRIS_PARTICLE_COUNT; i++) {
            const mat = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: chipColors[i % chipColors.length],
                depthWrite: false,
                shaded: false,
            });
            mat.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(geo, mat);
            mesh.frustumCulled = false;
            mesh.visible = false;
            mesh.onBeforeRender = updateUniforms;
            this.chips.push(mesh);
            this.root.add(mesh);
            // Random tumble axis so chips don't all spin the same way.
            this.spinAxes.push(new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
            ).normalize());
        }
    }

    /** Spawn a short burst at each hit. Caps work per frame under heavy fire. */
    spawnFromHits(hits: SimHitEvent[]): void {
        const n = Math.min(hits.length, DEBRIS_MAX_HITS_PER_FRAME);
        for (let i = 0; i < n; i++) {
            const hit = hits[i];
            this.hitPos.set(hit.position[0], hit.position[1], hit.position[2]);
            // Scrapes (low damage) kick sparks upward; gun hits peel sideways.
            const scrape = hit.damage > 0 && hit.damage < 20;
            const inherit = scrape ? 0.12 : DEBRIS_VELOCITY_INHERIT;
            this.hitVel.set(
                hit.velocity[0] * inherit,
                hit.velocity[1] * inherit + (scrape ? 8 : 0),
                hit.velocity[2] * inherit,
            );
            this.burstAt(this.hitPos, this.hitVel, scrape ? DEBRIS_PER_HIT + 4 : DEBRIS_PER_HIT);
        }
        this.syncMeshes();
    }

    /** Debug helper: emit one burst at a world position (e.g. Tab key). */
    spawnDebugBurst(position: THREE.Vector3, velocity?: THREE.Vector3): void {
        if (velocity) {
            this.hitVel.copy(velocity).multiplyScalar(DEBRIS_VELOCITY_INHERIT);
        } else {
            this.hitVel.set(0, 0, 0);
        }
        this.burstAt(position, this.hitVel);
        this.syncMeshes();
    }

    private burstAt(position: THREE.Vector3, velocityBias: THREE.Vector3, count = DEBRIS_PER_HIT): void {
        this.emitter.setVelocityBias(velocityBias);
        this.system.position = position;
        this.system.burst(count, true);
    }

    private syncMeshes(): void {
        for (let i = 0; i < this.chips.length; i++) {
            const p = this.system.particles[i];
            const mesh = this.chips[i];
            if (!p.isActive) {
                mesh.visible = false;
                continue;
            }
            const progress = p.life / p.lifespan;
            const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * progress;
            const angle = p.rotationStart + (p.rotationEnd - p.rotationStart) * progress;
            mesh.visible = true;
            mesh.position.copy(p.position);
            // Flat plate: thin in Z so it reads as a shard when tumbling.
            mesh.scale.set(size, size * (0.55 + (i % 3) * 0.15), 1);
            this.tmpQuat.setFromAxisAngle(this.spinAxes[i], angle);
            mesh.quaternion.copy(this.tmpQuat);
        }
    }

    init(_scene: Scene): void {
        //
    }

    update(delta: number): void {
        this.system.update(delta);
        this.syncMeshes();
    }

    render3D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, lists: Map<string, THREE.Scene>, _palette: Palette): void {
        const list = lists.get(SceneLayers.EntityFlats) || lists.get(SceneLayers.EntityFX);
        if (!list) {
            return;
        }
        attachToRenderList(list, this.root);
    }

    render2D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, _lists: Set<string>, _painter: CanvasPainter, _palette: Palette): void {
        //
    }
}
