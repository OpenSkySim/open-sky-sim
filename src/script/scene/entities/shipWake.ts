/**
 * Ship wake + four bow-wave arms (Kelvin inner ±19.47°, outer ±38.94°).
 * Stern foam is left in world space; bow spray drifts along each arm.
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
import { ARRESTOR_DECK_MID_X, ArrestorCarrierPose } from './arrestorCables';

type FoamKind = 'stern' | 'bow';

type FoamEmitter = {
    local: readonly [number, number, number];
    kind: FoamKind;
    rate: number;
    /**
     * Bow only: signed angle from the aft track (deg).
     * Negative = port, positive = starboard.
     */
    armDeg?: number;
};

/**
 * Kelvin full apex 38.94°. Four bow arms:
 *   inner  ±19.47° (half of 38.94° each side)
 *   outer  ±38.94° (full Kelvin angle each side — wider V)
 */
const KELVIN_FULL_ANGLE_DEG = 38.94;
const KELVIN_HALF_ANGLE_DEG = KELVIN_FULL_ANGLE_DEG * 0.5;

/** Lateral centreline of the kuz hull / landing deck (not model X=0). */
const MID_X = ARRESTOR_DECK_MID_X;

/** One big stern wake on the hull centreline (carrier-local; stern ≈ +Z). */
const STERN_EMITTERS: FoamEmitter[] = [
    { local: [MID_X, 0.25, 122], kind: 'stern', rate: 22 },
];

/** Four bow-wave arms from the tip on the sailing centreline. */
const BOW_EMITTERS: FoamEmitter[] = [
    { local: [MID_X, 0.3, -176], kind: 'bow', rate: 12, armDeg: -KELVIN_FULL_ANGLE_DEG },
    { local: [MID_X, 0.3, -176], kind: 'bow', rate: 12, armDeg: -KELVIN_HALF_ANGLE_DEG },
    { local: [MID_X, 0.3, -176], kind: 'bow', rate: 12, armDeg: KELVIN_HALF_ANGLE_DEG },
    { local: [MID_X, 0.3, -176], kind: 'bow', rate: 12, armDeg: KELVIN_FULL_ANGLE_DEG },
];

const ALL_EMITTERS: FoamEmitter[] = [...STERN_EMITTERS, ...BOW_EMITTERS];

/**
 * Pool for a long single stern trail (~270–420 s = 3× prior) plus four bow arms.
 */
const FOAM_PARTICLE_COUNT = 2000;
const FOAM_SURFACE_Y = 0.18;

/** Matches game carrier cruise (45 km/h) so the seeded trail length is correct. */
const CARRIER_SPEED_MPS = 45 / 3.6;
/** How many stern puffs to plant along the full wake on first frame. */
const STERN_SEED_COUNT = 1200;
const STERN_LIFE_MIN = 270;
const STERN_LIFE_SPAN = 150;

/** Speed of foam along each Kelvin arm (m/s), world frame. */
const BOW_ARM_SPEED_MPS = 4.5;

const STERN_DITHER_START = 0.55;
/** Keep stern foam denser for longer — fade stays high until late life. */
const STERN_DITHER_END = 0.28;
const BOW_DITHER_START = 0.7;
const BOW_DITHER_END = 0.1;

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
    /** Local aft-out arm direction before quaternion. */
    private readonly armLocal = new THREE.Vector3();
    private readonly armWorld = new THREE.Vector3();
    private readonly aftWorld = new THREE.Vector3();
    private sternSeeded = false;

    constructor(
        materials: SceneMaterialManager,
        private readonly getCarrierPose: () => ArrestorCarrierPose,
    ) {
        this.system = new ParticleSystem(
            {
                systemMaxParticles: FOAM_PARTICLE_COUNT,
                systemReSpawn: true,
                emitterSpawnRatePerSecond: 0,
                particleLifeMin: STERN_LIFE_MIN,
                particleLifeMax: STERN_LIFE_MIN + STERN_LIFE_SPAN,
                particleSizeStartMin: 4,
                particleSizeStartMax: 7,
                particleSizeEndMin: 28,
                particleSizeEndMax: 48,
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

    /**
     * Plant the full stern trail behind the ship so it is complete on the first
     * frame (age ∝ distance aft at cruise speed).
     */
    private seedFullSternWake(pose: ArrestorCarrierPose): void {
        if (this.sternSeeded) {
            return;
        }
        this.sternSeeded = true;

        const q = pose.quaternion;
        const [lx, , lz] = STERN_EMITTERS[0].local;
        this.emitPos.set(lx, 0, lz);
        if (q) {
            this.emitPos.applyQuaternion(q);
        }
        this.emitPos.add(pose.position as THREE.Vector3);
        this.emitPos.y = FOAM_SURFACE_Y;

        // Aft along the wake = opposite bow (−Z local → world).
        this.aftWorld.set(0, 0, 1);
        if (q) {
            this.aftWorld.applyQuaternion(q);
        }

        this.system.position.copy(this.emitPos);
        const want = Math.min(STERN_SEED_COUNT, FOAM_PARTICLE_COUNT - 400);
        const spawned = this.system.burst(want, true);
        let n = 0;
        for (let i = 0; i < this.system.particles.length && n < spawned; i++) {
            const p = this.system.particles[i];
            if (!p.isActive || p.life > 1e-6) {
                continue;
            }
            this.extras[i].kind = 'stern';
            // t=0 at the stern (fresh), t=1 at the far end (oldest).
            const t = spawned <= 1 ? 0 : n / (spawned - 1);
            const lifespan = STERN_LIFE_MIN + Math.random() * STERN_LIFE_SPAN;
            const age = t * lifespan * 0.98;
            const dist = age * CARRIER_SPEED_MPS;
            p.lifespan = lifespan;
            p.life = age;
            p.sizeStart = 4 + Math.random() * 3;
            p.sizeEnd = 32 + Math.random() * 20;
            p.rotationStart = Math.random() * Math.PI * 2;
            p.rotationEnd = p.rotationStart + (Math.random() - 0.5) * Math.PI;
            p.position.copy(this.emitPos).addScaledVector(this.aftWorld, dist);
            p.position.x += (Math.random() - 0.5) * 3;
            p.position.z += (Math.random() - 0.5) * 3;
            p.position.y = FOAM_SURFACE_Y;
            p.velocity.set(
                (Math.random() - 0.5) * 0.2,
                0,
                (Math.random() - 0.5) * 0.2,
            );
            const colorU = (this.puffs[i].material as THREE.ShaderMaterial).uniforms as {
                color: { value: THREE.Color };
            };
            colorU.color.value.set('#e8f0f4');
            n++;
        }
    }

    update(delta: number): void {
        const pose = this.getCarrierPose();
        const q = pose.quaternion;
        this.seedFullSternWake(pose);

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
                const colorU = (this.puffs[i].material as THREE.ShaderMaterial).uniforms as {
                    color: { value: THREE.Color };
                };
                if (emitter.kind === 'bow') {
                    // ~4× prior bow life → long arms.
                    p.lifespan = 14 + Math.random() * 14;
                    p.sizeStart = 2.0 + Math.random() * 1.5;
                    p.sizeEnd = 8 + Math.random() * 6;
                    const armDeg = emitter.armDeg ?? KELVIN_HALF_ANGLE_DEG;
                    const armRad = armDeg * Math.PI / 180;
                    // Aft = +Z local; rotate about Y so |armDeg| is off the track.
                    this.armLocal.set(Math.sin(armRad), 0, Math.cos(armRad));
                    this.armWorld.copy(this.armLocal);
                    if (q) {
                        this.armWorld.applyQuaternion(q);
                    }
                    const speed = BOW_ARM_SPEED_MPS * (0.85 + Math.random() * 0.3);
                    p.velocity.copy(this.armWorld).multiplyScalar(speed);
                    colorU.color.value.set('#ffffff');
                } else {
                    // Continuous stern emit (trail already seeded to full length).
                    p.lifespan = STERN_LIFE_MIN + Math.random() * STERN_LIFE_SPAN;
                    p.sizeStart = 4 + Math.random() * 3;
                    p.sizeEnd = 32 + Math.random() * 20;
                    p.velocity.set(
                        (Math.random() - 0.5) * 0.25,
                        0,
                        (Math.random() - 0.5) * 0.25,
                    );
                    colorU.color.value.set('#e8f0f4');
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
            if (bow) {
                u.alphaDither.value = BOW_DITHER_START + (BOW_DITHER_END - BOW_DITHER_START) * t;
            } else {
                // Ease-in fade: stay opaque most of life, drop only near the end.
                const fadeT = t * t * t;
                u.alphaDither.value = STERN_DITHER_START + (STERN_DITHER_END - STERN_DITHER_START) * fadeT;
            }
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
