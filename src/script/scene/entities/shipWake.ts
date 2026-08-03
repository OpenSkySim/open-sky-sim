/**
 * Ship wake + bow wave: foam at the stern streams aft; brighter spray at the
 * bow fans outward into a V as the carrier advances on the flat ocean.
 */
import * as THREE from 'three';
import { Palette, PaletteCategory } from '../../config/palettes/palette';
import { PointEmitter } from '../../physics/particles/emitters/pointEmitter';
import { ParticleSystem } from '../../physics/particles/particleSystem';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { attachToRenderList } from '../../render/renderList';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { updateUniforms } from '../utils';
import { Entity } from '../entity';
import { Scene, SceneLayers } from '../scene';
import { ArrestorCarrierPose } from './arrestorCables';

type FoamKind = 'stern' | 'bow';

type FoamEmitter = {
    local: readonly [number, number, number];
    kind: FoamKind;
    rate: number;
};

/** Stern wake emitters (carrier-local; stern ≈ +Z). */
const STERN_EMITTERS: FoamEmitter[] = [
    { local: [0, 0.2, 120], kind: 'stern', rate: 6 },
    { local: [-18, 0.2, 118], kind: 'stern', rate: 5 },
    { local: [18, 0.2, 118], kind: 'stern', rate: 5 },
    { local: [-10, 0.15, 122], kind: 'stern', rate: 4 },
    { local: [10, 0.15, 122], kind: 'stern', rate: 4 },
];

/** Bow wave emitters near the ski-jump tip (carrier-local; bow ≈ −Z). */
const BOW_EMITTERS: FoamEmitter[] = [
    { local: [0, 0.3, -176], kind: 'bow', rate: 10 },
    { local: [-8, 0.25, -172], kind: 'bow', rate: 8 },
    { local: [8, 0.25, -172], kind: 'bow', rate: 8 },
    { local: [-16, 0.22, -165], kind: 'bow', rate: 7 },
    { local: [16, 0.22, -165], kind: 'bow', rate: 7 },
    { local: [-24, 0.2, -155], kind: 'bow', rate: 5 },
    { local: [24, 0.2, -155], kind: 'bow', rate: 5 },
];

const ALL_EMITTERS: FoamEmitter[] = [...STERN_EMITTERS, ...BOW_EMITTERS];

/** Combined foam pool for stern trail + bow V. */
const FOAM_PARTICLE_COUNT = 200;
/** Slight surface lift so foam clears the water flat. */
const FOAM_SURFACE_Y = 0.18;

const STERN_DITHER_START = 0.55;
const STERN_DITHER_END = 0.06;
const BOW_DITHER_START = 0.7;
const BOW_DITHER_END = 0.1;

/** Per-particle kind (parallel to ParticleSystem.particles). */
type FoamParticleExtra = {
    kind: FoamKind;
};

export class ShipWakeEntity implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly system: ParticleSystem;
    private readonly extras: FoamParticleExtra[];
    private readonly puffs: THREE.Mesh[] = [];
    private readonly root = new THREE.Object3D();
    private readonly emitPos = new THREE.Vector3();
    private readonly emitAccum = new Float32Array(ALL_EMITTERS.length);
    private readonly lateral = new THREE.Vector3();

    constructor(
        materials: SceneMaterialManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
    ) {
        this.system = new ParticleSystem(
            {
                systemMaxParticles: FOAM_PARTICLE_COUNT,
                systemReSpawn: true,
                emitterSpawnRatePerSecond: 0,
                // Defaults used only as fallback; spawn overrides life/size per kind.
                particleLifeMin: 8,
                particleLifeMax: 14,
                particleSizeStartMin: 1.5,
                particleSizeStartMax: 3.0,
                particleSizeEndMin: 10,
                particleSizeEndMax: 18,
                particleRotationStartMin: 0,
                particleRotationStartMax: Math.PI * 2,
                particleRotationEndMin: -Math.PI,
                particleRotationEndMax: Math.PI,
            },
            new PointEmitter(0, 0),
        );
        this.extras = Array.from({ length: FOAM_PARTICLE_COUNT }, () => ({ kind: 'stern' as FoamKind }));

        const geo = new THREE.CircleGeometry(1, 6);
        for (let i = 0; i < FOAM_PARTICLE_COUNT; i++) {
            const mat = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category: PaletteCategory.TERRAIN_SHALLOW_WATER,
                depthWrite: false,
                shaded: false,
                alphaDither: STERN_DITHER_START,
                colorDither: false,
                rawColor: '#e8f0f4',
            });
            mat.side = THREE.DoubleSide;
            const mesh = new THREE.Mesh(geo, mat);
            mesh.frustumCulled = false;
            mesh.visible = false;
            mesh.onBeforeRender = updateUniforms;
            this.puffs.push(mesh);
            this.root.add(mesh);
        }
    }

    init(_scene: Scene): void {
        //
    }

    update(delta: number): void {
        const pose = this.getCarrierPose();
        const q = pose.quaternion;

        for (let e = 0; e < ALL_EMITTERS.length; e++) {
            const emitter = ALL_EMITTERS[e];
            this.emitAccum[e] += emitter.rate * delta;
            const n = Math.floor(this.emitAccum[e]);
            if (n <= 0) {
                continue;
            }
            this.emitAccum[e] -= n;
            const [lx, ly, lz] = emitter.local;
            this.emitPos.set(lx, ly, lz);
            if (q) {
                this.emitPos.applyQuaternion(q);
            }
            this.emitPos.add(pose.position as THREE.Vector3);
            this.emitPos.y = FOAM_SURFACE_Y;
            this.system.position.copy(this.emitPos);
            const spawned = this.system.burst(n, true);
            let left = spawned;
            for (let i = 0; i < this.system.particles.length && left > 0; i++) {
                const p = this.system.particles[i];
                if (!p.isActive || p.life > 1e-6) {
                    continue;
                }
                if (p.position.distanceToSquared(this.emitPos) > 0.05) {
                    continue;
                }
                this.extras[i].kind = emitter.kind;
                p.position.y = FOAM_SURFACE_Y;
                if (emitter.kind === 'bow') {
                    // Shorter, denser spray; fan outward into a V.
                    p.lifespan = 3.5 + Math.random() * 3.5;
                    p.sizeStart = 2.0 + Math.random() * 1.5;
                    p.sizeEnd = 6 + Math.random() * 5;
                    const side = lx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(lx);
                    this.lateral.set(side, 0, 0);
                    if (q) {
                        this.lateral.applyQuaternion(q);
                    }
                    const out = 2.0 + Math.random() * 3.5;
                    const drift = (Math.random() - 0.5) * 1.2;
                    p.velocity.set(
                        this.lateral.x * out + this.lateral.z * drift * 0.2,
                        0,
                        this.lateral.z * out + this.lateral.x * drift * 0.2,
                    );
                    // Brighter bow foam.
                    const u = (this.puffs[i].material as THREE.ShaderMaterial).uniforms as {
                        color: { value: THREE.Color };
                    };
                    u.color.value.set('#ffffff');
                } else {
                    p.lifespan = 10 + Math.random() * 6;
                    p.sizeStart = 1.5 + Math.random() * 1.5;
                    p.sizeEnd = 10 + Math.random() * 8;
                    p.velocity.set(
                        (Math.random() - 0.5) * 0.4,
                        0,
                        (Math.random() - 0.5) * 0.4,
                    );
                    const u = (this.puffs[i].material as THREE.ShaderMaterial).uniforms as {
                        color: { value: THREE.Color };
                    };
                    u.color.value.set('#e8f0f4');
                }
                left--;
            }
        }

        this.system.update(delta);

        for (let i = 0; i < this.puffs.length; i++) {
            const mesh = this.puffs[i];
            const p = this.system.particles[i];
            if (!p.isActive) {
                mesh.visible = false;
                continue;
            }
            mesh.visible = true;
            p.position.y = FOAM_SURFACE_Y;
            p.velocity.y = 0;
            mesh.position.copy(p.position);
            const t = p.lifespan > 1e-6 ? p.life / p.lifespan : 1;
            const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * t;
            mesh.scale.set(size, size, size);
            mesh.rotation.set(-Math.PI / 2, 0, p.rotationStart + (p.rotationEnd - p.rotationStart) * t);
            const u = (mesh.material as THREE.ShaderMaterial).uniforms as { alphaDither: { value: number } };
            const bow = this.extras[i].kind === 'bow';
            const d0 = bow ? BOW_DITHER_START : STERN_DITHER_START;
            const d1 = bow ? BOW_DITHER_END : STERN_DITHER_END;
            u.alphaDither.value = d0 + (d1 - d0) * t;
        }
    }

    render3D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        const list = lists.get(SceneLayers.EntityFX);
        if (list) {
            attachToRenderList(list, this.root);
        }
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        //
    }
}
