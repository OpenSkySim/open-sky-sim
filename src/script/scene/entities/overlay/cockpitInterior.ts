import * as THREE from 'three';
import { Palette } from '../../../config/palettes/palette';
import { CanvasPainter } from '../../../render/screen/canvasPainter';
import { LODHelper } from '../../../render/helpers';
import { Entity } from '../../entity';
import { ModelManager } from '../../models/models';
import { Scene, SceneLayers } from '../../scene';
import { PlayerEntity } from '../player';

/** The cockpit interior model; its origin is the pilot's eye point, +Z forward, +Y up. */
export const COCKPIT_INTERIOR_MODEL = 'assets/cockpit.glb';

/**
 * The HUD combiner's node. Left out in the game: GLASS is drawn as an ordered
 * dither, which right in front of the eye screens the whole view through the
 * HUD, and the real combiner is all but clear anyway.
 */
const HUD_GLASS_NODE = '4_CockpitHudGlass';

/**
 * The 3D cockpit around the pilot in the cockpit view: front panel, side
 * consoles, HUD frame. It rides the aircraft with its origin on the eye point
 * (the aircraft's cockpit offset), and draws into its own layer, which the
 * game renders last through a camera whose near plane reaches the panel.
 */
export class CockpitInteriorEntity implements Entity {

    readonly tags: string[] = [];
    enabled: boolean = true;

    private readonly model: LODHelper;
    private readonly eye = new THREE.Vector3();
    private readonly offset = new THREE.Vector3();
    private readonly axis = new THREE.Vector3();
    private readonly scale = new THREE.Vector3(1, 1, 1);
    /** The combiner has been hidden (once the model has loaded). */
    private glassHidden = false;

    constructor(private readonly actor: PlayerEntity, models: ModelManager) {
        this.model = new LODHelper(models.getModel(COCKPIT_INTERIOR_MODEL));
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        //
    }

    render3D(targetWidth: number, _targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        if (!lists.has(SceneLayers.CockpitInterior)) {
            return;
        }
        if (!this.glassHidden) {
            this.hideHudGlass();
        }
        // The eye point exactly as the cockpit camera finds it: the cockpit
        // offset along the aircraft's forward, up and right.
        const offset = this.actor.getCockpitOffset(this.offset);
        this.eye.copy(this.actor.getDisplayPosition())
            .addScaledVector(this.actor.getDisplayWorldDirection(this.axis), offset.z)
            .addScaledVector(this.actor.getDisplayWorldUp(this.axis), offset.y)
            .addScaledVector(this.actor.getDisplayWorldRight(this.axis), offset.x);
        this.model.addToRenderList(
            this.eye, this.actor.getDisplayQuaternion(), this.scale,
            targetWidth, camera, palette,
            SceneLayers.CockpitInterior, SceneLayers.CockpitInterior, lists, 0);
    }

    private hideHudGlass(): void {
        for (const level of this.model.model.lod) {
            for (const obj of [...level.flats, ...level.volumes]) {
                obj.traverse(child => {
                    if (child.name === HUD_GLASS_NODE) {
                        child.visible = false;
                        this.glassHidden = true;
                    }
                });
            }
        }
    }

    render2D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, _lists: Set<string>, _painter: CanvasPainter, _palette: Palette): void {
        //
    }
}
