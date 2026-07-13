import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { LODHelper } from '../../render/helpers';
import { FORWARD } from '../../utils/math';
import { Combatant, Faction } from '../../weapons/combatant';
import { ProjectileSink } from '../../weapons/gun';
import { Entity } from '../entity';
import { ModelManager } from '../models/models';
import { Scene, SceneLayers } from '../scene';

/** Seconds a tracer lives before self-destructing. */
const PROJECTILE_LIFESPAN = 2.5;
/** Gentle gravity on rounds (m/s^2) so long shots drop a little. */
const PROJECTILE_GRAVITY = 9.80665;

interface ProjectileSlot {
    active: boolean;
    faction: Faction;
    damage: number;
    life: number;
    readonly pos: THREE.Vector3;
    readonly prevPos: THREE.Vector3;
    readonly vel: THREE.Vector3;
    readonly quat: THREE.Quaternion;
    readonly lod: LODHelper;
}

/**
 * A fixed pool of gun projectiles plus their hit detection. Added once to the
 * scene; guns push rounds into it via {@link spawnProjectile}. Each frame it
 * integrates active rounds, tests them against the current combatants (segment
 * vs hit-sphere) and renders the survivors as tracers. Using a pool avoids
 * mutating the scene's entity list per shot.
 */
export class WeaponsField implements Entity {

    readonly tags: string[] = [];
    enabled = true;

    private readonly slots: ProjectileSlot[] = [];
    private readonly scale = new THREE.Vector3(1, 1, 1);
    private readonly seg = new THREE.Vector3();
    private readonly toCenter = new THREE.Vector3();
    private readonly closest = new THREE.Vector3();
    private readonly cPos = new THREE.Vector3();

    constructor(models: ModelManager, private readonly getCombatants: () => Combatant[], poolSize = 240) {
        for (let i = 0; i < poolSize; i++) {
            this.slots.push({
                active: false,
                faction: Faction.PLAYER,
                damage: 0,
                life: 0,
                pos: new THREE.Vector3(),
                prevPos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                quat: new THREE.Quaternion(),
                lod: new LODHelper(models.getModel('lib:tracer'), 0),
            });
        }
    }

    spawnProjectile(origin: THREE.Vector3, velocity: THREE.Vector3, faction: Faction, damage: number): void {
        const slot = this.slots.find(s => !s.active);
        if (!slot) {
            return; // pool exhausted; drop the round
        }
        slot.active = true;
        slot.faction = faction;
        slot.damage = damage;
        slot.life = PROJECTILE_LIFESPAN;
        slot.pos.copy(origin);
        slot.prevPos.copy(origin);
        slot.vel.copy(velocity);
        this.orient(slot);
    }

    init(scene: Scene): void {
        // Nothing
    }

    update(delta: number): void {
        const combatants = this.getCombatants();
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (!slot.active) {
                continue;
            }
            slot.life -= delta;
            if (slot.life <= 0) {
                slot.active = false;
                continue;
            }
            slot.prevPos.copy(slot.pos);
            slot.vel.y -= PROJECTILE_GRAVITY * delta;
            slot.pos.addScaledVector(slot.vel, delta);
            this.orient(slot);

            if (this.checkHit(slot, combatants)) {
                slot.active = false;
            }
        }
    }

    private orient(slot: ProjectileSlot): void {
        if (slot.vel.lengthSq() > 1e-6) {
            this.seg.copy(slot.vel).normalize();
            slot.quat.setFromUnitVectors(FORWARD, this.seg);
        }
    }

    /** Segment (prevPos -> pos) vs each opposing combatant's hit-sphere. */
    private checkHit(slot: ProjectileSlot, combatants: Combatant[]): boolean {
        this.seg.copy(slot.pos).sub(slot.prevPos);
        const segLenSq = this.seg.lengthSq();
        for (let i = 0; i < combatants.length; i++) {
            const c = combatants[i];
            if (c.faction === slot.faction || !c.isAlive()) {
                continue;
            }
            c.readPosition(this.cPos);
            const radius = c.getHitRadius();
            this.toCenter.copy(this.cPos).sub(slot.prevPos);
            let t = segLenSq > 1e-6 ? this.toCenter.dot(this.seg) / segLenSq : 0;
            t = Math.max(0, Math.min(1, t));
            this.closest.copy(this.seg).multiplyScalar(t).add(slot.prevPos);
            if (this.closest.distanceToSquared(this.cPos) <= radius * radius) {
                c.applyDamage(slot.damage);
                return true;
            }
        }
        return false;
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        if (!lists.has(SceneLayers.EntityVolumes) && !lists.has(SceneLayers.EntityFlats)) {
            return;
        }
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (!slot.active) {
                continue;
            }
            slot.lod.addToRenderList(
                slot.pos, slot.quat, this.scale,
                targetWidth, camera, palette,
                SceneLayers.EntityFlats, SceneLayers.EntityVolumes, lists, 0);
        }
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        // Nothing
    }
}
