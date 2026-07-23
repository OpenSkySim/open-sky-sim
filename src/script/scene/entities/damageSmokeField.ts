import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor, PaletteColorShade } from '../../config/palettes/palette';
import { DAMAGE_SMOKE_PARTICLE_COUNT } from '../../defs';
import { PointEmitter } from '../../physics/particles/emitters/pointEmitter';
import { ConstantForce } from '../../physics/particles/forces/constantForce';
import { LinearDragForce } from '../../physics/particles/forces/linearDragForce';
import { ParticleSystem } from '../../physics/particles/particleSystem';
import { SimHitEvent } from '../../physics/sim/simTypes';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { SceneMaterialManager, SceneMaterialPrimitiveType, SceneMaterialUniforms } from '../materials/materials';
import { updateUniforms } from '../utils';
import { Entity } from '../entity';
import { Scene, SceneLayers } from '../scene';
import { clamp, lerp } from '../../utils/math';

/** alphaDither while still flame-coloured. */
const FLAME_DITHER = 0.72;
/** alphaDither once the puff has cooled to smoke. */
const SMOKE_DITHER_START = 0.78;
const SMOKE_DITHER_END = 0.28;

const MAX_LEAKS = 8;
const MAX_HITS_PER_FRAME = 6;
const LEAK_EMIT_DURATION_SEC = 18;
/** Steady rate — one leak per aircraft, so hits don't stack intensity. */
const LEAK_EMIT_RATE = 16;
const SMOKE_VELOCITY_INHERIT = 0.65;
const HULL_HALF_EXTENT = new THREE.Vector3(4, 1.5, 7);
const FIRE_RADIUS_M = 1.6;
/** Origin blaze yellow→red→smoke, then out (short flash). */
const ORIGIN_FIRE_LIFETIME_SEC = 1.4;
/**
 * Fraction of each puff's life that is still flame-coloured.
 * After this, the puff is smoke — so the fire ribbon stays short and is
 * always followed by a longer gray trail.
 */
const FIRE_PHASE_END = 0.22;

export type DamageSmokePose = {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    velocity: THREE.Vector3;
};

type Leak = {
    active: boolean;
    targetId: string;
    localOffset: THREE.Vector3;
    emitRemaining: number;
    emitAccum: number;
    /** Seconds since this leak opened. */
    age: number;
};

/**
 * Hit damage FX: yellow→red→smoke at the leak, with a trail that cools the
 * same way (mesh discs + ordered dither).
 */
export class DamageSmokeField implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly system: ParticleSystem;
    private readonly puffs: THREE.Mesh[] = [];
    private readonly fires: THREE.Mesh[] = [];
    private readonly root = new THREE.Object3D();
    private readonly leaks: Leak[] = [];
    private poseProvider: ((targetId: string) => DamageSmokePose | undefined) | undefined;

    private readonly worldPos = new THREE.Vector3();
    private readonly worldVel = new THREE.Vector3();
    private readonly localOffset = new THREE.Vector3();
    private readonly tmpColor = new THREE.Color();
    private readonly tmpColorB = new THREE.Color();
    private readonly yellow = new THREE.Color();
    private readonly red = new THREE.Color();
    private readonly smoke = new THREE.Color();
    private readonly smokeB = new THREE.Color();

    constructor(materials: SceneMaterialManager) {
        this.system = new ParticleSystem(
            {
                systemMaxParticles: DAMAGE_SMOKE_PARTICLE_COUNT,
                systemReSpawn: true,
                emitterSpawnRatePerSecond: 0,
                particleLifeMin: 2.8,
                particleLifeMax: 4.5,
                particleSizeStartMin: 0.9,
                particleSizeStartMax: 1.4,
                particleSizeEndMin: 1.6,
                particleSizeEndMax: 2.4,
                particleRotationStartMin: -Math.PI,
                particleRotationStartMax: Math.PI,
                particleRotationEndMin: -Math.PI * 1.5,
                particleRotationEndMax: Math.PI * 1.5,
            },
            new PointEmitter(0.1, 0.45),
        );
        this.system.addForce(new ConstantForce(new THREE.Vector3(0, 0.8, 0)));
        this.system.addForce(new LinearDragForce(0.4));

        const smokeGeo = new THREE.CircleGeometry(1, 6);
        for (let i = 0; i < DAMAGE_SMOKE_PARTICLE_COUNT; i++) {
            const mat = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: PaletteCategory.FX_FIRE,
                depthWrite: false,
                shaded: false,
                alphaDither: FLAME_DITHER,
                colorDither: true,
            });
            mat.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(smokeGeo, mat);
            mesh.frustumCulled = false;
            mesh.visible = false;
            mesh.onBeforeRender = updateUniforms;
            this.puffs.push(mesh);
            this.root.add(mesh);
        }

        const fireGeo = new THREE.CircleGeometry(FIRE_RADIUS_M, 5);
        for (let i = 0; i < MAX_LEAKS; i++) {
            const mat = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: PaletteCategory.FX_FIRE,
                depthWrite: false,
                shaded: false,
                colorDither: true,
            });
            mat.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(fireGeo, mat);
            mesh.frustumCulled = false;
            mesh.visible = false;
            mesh.onBeforeRender = updateUniforms;
            this.fires.push(mesh);
            this.root.add(mesh);

            this.leaks.push({
                active: false,
                targetId: '',
                localOffset: new THREE.Vector3(),
                emitRemaining: 0,
                emitAccum: 0,
                age: 0,
            });
        }
    }

    setPoseProvider(provider: (targetId: string) => DamageSmokePose | undefined): void {
        this.poseProvider = provider;
    }

    spawnFromHits(hits: SimHitEvent[]): void {
        if (!this.poseProvider) {
            return;
        }
        const n = Math.min(hits.length, MAX_HITS_PER_FRAME);
        for (let i = 0; i < n; i++) {
            if (!this.poseProvider(hits[i].targetId)) {
                continue;
            }
            this.openLeak(hits[i].targetId);
        }
    }

    spawnDebugLeak(targetId: string): void {
        if (!this.poseProvider?.(targetId)) {
            return;
        }
        this.openLeak(targetId);
    }

    private openLeak(targetId: string): void {
        // One leak per aircraft — extra hits refresh the same stream (new fire
        // flash + position) instead of stacking more fire trails.
        let slot = this.findLeak(targetId);
        if (!slot) {
            slot = this.allocLeak();
        }
        slot.active = true;
        slot.targetId = targetId;
        slot.emitRemaining = LEAK_EMIT_DURATION_SEC;
        slot.emitAccum = Math.max(slot.emitAccum, 0.5);
        slot.age = 0;
        slot.localOffset.set(
            (Math.random() * 2 - 1) * HULL_HALF_EXTENT.x,
            (Math.random() * 2 - 1) * HULL_HALF_EXTENT.y,
            (Math.random() * 2 - 1) * HULL_HALF_EXTENT.z,
        );
        slot.localOffset.y = Math.abs(slot.localOffset.y) * 0.5 + 0.4;
    }

    private findLeak(targetId: string): Leak | undefined {
        for (let i = 0; i < this.leaks.length; i++) {
            if (this.leaks[i].active && this.leaks[i].targetId === targetId) {
                return this.leaks[i];
            }
        }
        return undefined;
    }

    private allocLeak(): Leak {
        for (let i = 0; i < this.leaks.length; i++) {
            if (!this.leaks[i].active) {
                return this.leaks[i];
            }
        }
        let best = 0;
        for (let i = 1; i < this.leaks.length; i++) {
            if (this.leaks[i].emitRemaining < this.leaks[best].emitRemaining) {
                best = i;
            }
        }
        return this.leaks[best];
    }

    reset(): void {
        this.system.reset();
        for (let i = 0; i < this.leaks.length; i++) {
            this.leaks[i].active = false;
            this.leaks[i].emitRemaining = 0;
            this.leaks[i].emitAccum = 0;
            this.leaks[i].age = 0;
            this.fires[i].visible = false;
        }
        for (let i = 0; i < this.puffs.length; i++) {
            this.puffs[i].visible = false;
        }
    }

    init(_scene: Scene): void {
        //
    }

    private cachePaletteColors(palette: Palette): void {
        this.yellow.set(PaletteColor(palette, PaletteCategory.FX_FIRE__B));
        this.red.set(PaletteColor(palette, PaletteCategory.FX_FIRE));
        this.smoke.set(PaletteColor(palette, PaletteCategory.FX_SMOKE));
        this.smokeB.set(PaletteColorShade(palette, PaletteCategory.FX_SMOKE));
    }

    /**
     * Normalized heat 0 = yellow, ~0.4 = red, 1 = smoke.
     * Writes primary + secondary into tmpColor / tmpColorB.
     */
    private applyHeatColors(heat01: number): void {
        const heat = clamp(heat01, 0, 1);
        if (heat < 0.4) {
            const t = heat / 0.4;
            this.tmpColor.copy(this.yellow).lerp(this.red, t);
            this.tmpColorB.copy(this.yellow);
        } else if (heat < 0.75) {
            const t = (heat - 0.4) / 0.35;
            this.tmpColor.copy(this.red).lerp(this.smoke, t);
            this.tmpColorB.copy(this.red).lerp(this.smokeB, t);
        } else {
            this.tmpColor.copy(this.smoke);
            this.tmpColorB.copy(this.smokeB);
        }
    }

    update(delta: number): void {
        if (this.poseProvider) {
            for (let i = 0; i < this.leaks.length; i++) {
                const leak = this.leaks[i];
                const fire = this.fires[i];
                if (!leak.active) {
                    fire.visible = false;
                    continue;
                }
                leak.age += delta;
                leak.emitRemaining -= delta;
                if (leak.emitRemaining <= 0) {
                    leak.active = false;
                    fire.visible = false;
                    continue;
                }
                const pose = this.poseProvider(leak.targetId);
                if (!pose) {
                    leak.active = false;
                    fire.visible = false;
                    continue;
                }
                this.localOffset.copy(leak.localOffset).applyQuaternion(pose.quaternion);
                this.worldPos.copy(pose.position).add(this.localOffset);
                this.worldVel.copy(pose.velocity).multiplyScalar(SMOKE_VELOCITY_INHERIT);
                this.worldVel.y += 0.6;

                // Origin blaze lives through yellow→red→smoke then goes out.
                if (leak.age < ORIGIN_FIRE_LIFETIME_SEC) {
                    fire.visible = true;
                    fire.position.copy(this.worldPos);
                } else {
                    fire.visible = false;
                }

                this.system.position = this.worldPos;
                leak.emitAccum += LEAK_EMIT_RATE * delta;
                const toSpawn = Math.floor(leak.emitAccum);
                if (toSpawn > 0) {
                    leak.emitAccum -= toSpawn;
                    this.emitWithVelocity(toSpawn, this.worldVel);
                }
            }
        }

        this.system.update(delta);
    }

    private emitWithVelocity(count: number, velocityBias: THREE.Vector3): void {
        const before: boolean[] = [];
        for (let i = 0; i < this.system.particles.length; i++) {
            before.push(this.system.particles[i].isActive);
        }
        this.system.burst(count, true);
        for (let i = 0; i < this.system.particles.length; i++) {
            const p = this.system.particles[i];
            if (p.isActive && !before[i]) {
                p.velocity.add(velocityBias);
            }
        }
    }

    private syncPuffs(camera: THREE.Camera, palette: Palette): void {
        this.cachePaletteColors(palette);
        for (let i = 0; i < this.puffs.length; i++) {
            const p = this.system.particles[i];
            const mesh = this.puffs[i];
            if (!p.isActive) {
                mesh.visible = false;
                continue;
            }
            const progress = p.life / p.lifespan;
            const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * progress;
            mesh.visible = true;
            mesh.position.copy(p.position);
            mesh.scale.setScalar(size);

            // Brief flame (yellow→red), then smoke for the rest of the puff life.
            const heat = progress >= FIRE_PHASE_END ? 1 : progress / FIRE_PHASE_END;
            this.applyHeatColors(heat);
            const u = (mesh.material as THREE.ShaderMaterial).uniforms as SceneMaterialUniforms;
            u.color.value.copy(this.tmpColor);
            u.colorSecondary.value.copy(this.tmpColorB);
            u.alphaDither.value = progress < FIRE_PHASE_END
                ? FLAME_DITHER
                : lerp((progress - FIRE_PHASE_END) / (1 - FIRE_PHASE_END), SMOKE_DITHER_START, SMOKE_DITHER_END);

            mesh.lookAt(camera.position);
            mesh.rotateZ(p.rotationStart + (p.rotationEnd - p.rotationStart) * progress);
        }
    }

    private syncFires(camera: THREE.Camera, palette: Palette): void {
        this.cachePaletteColors(palette);
        for (let i = 0; i < this.fires.length; i++) {
            const fire = this.fires[i];
            const leak = this.leaks[i];
            if (!fire.visible || !leak.active) {
                continue;
            }
            const heat = clamp(leak.age / ORIGIN_FIRE_LIFETIME_SEC, 0, 1);
            this.applyHeatColors(heat);
            const u = (fire.material as THREE.ShaderMaterial).uniforms as SceneMaterialUniforms;
            u.color.value.copy(this.tmpColor);
            u.colorSecondary.value.copy(this.tmpColorB);

            fire.lookAt(camera.position);
            // Shrink as it cools toward smoke.
            const pulse = (0.95 + 0.12 * Math.sin(performance.now() * 0.025 + i * 1.7))
                * lerp(heat, 1.15, 0.55);
            fire.scale.setScalar(pulse);
        }
    }

    render3D(_targetWidth: number, _targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        this.syncPuffs(camera, palette);
        this.syncFires(camera, palette);
        const list = lists.get(SceneLayers.EntityFlats) || lists.get(SceneLayers.EntityFX);
        if (!list) {
            return;
        }
        list.add(this.root);
    }

    render2D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, _lists: Set<string>, _painter: CanvasPainter, _palette: Palette): void {
        //
    }
}
