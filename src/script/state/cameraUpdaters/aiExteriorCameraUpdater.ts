import * as THREE from 'three';
import { COCKPIT_FOV } from '../../defs';
import { PlayerEntity } from '../../scene/entities/player';
import { FORWARD, UP } from '../../utils/math';
import { CameraUpdater } from './cameraUpdater';


/** Anything that can be chased by an exterior camera. */
export interface ChaseTarget {
    getDisplayPosition(): THREE.Vector3;
    getDisplayQuaternion(): THREE.Quaternion;
}

/** Head-on merge range at opponent spawn (shared with {@link import('../game').Game.spawnOpponent}). */
export const AI_CHASE_MERGE_DISTANCE_M = 1000;
/** Fixed chase distance (m) behind the enemy — zoom stays constant as range closes. */
export const AI_CHASE_DISTANCE_M = 160;
/** Player must appear at least this large relative to the enemy on screen. */
export const AI_CHASE_MIN_PLAYER_SIZE_RATIO = 1 / 3;
/** Camera sits below the enemy so the sight line rises through it toward the player. */
const CHASE_HEIGHT_OFFSET_M = -8;

/**
 * F6 vertical FOV (degrees). At fixed chase distance, similar-sized aircraft
 * subtend in proportion to 1/distance. A tighter lens magnifies both aircraft
 * equally; the FOV is narrowed from the cockpit default so the merge pair
 * fills the frame at {@link AI_CHASE_MERGE_DISTANCE_M} while keeping the fixed
 * chase offset.
 */
export function computeAiChaseFovDeg(
    referenceFovDeg: number = COCKPIT_FOV,
    chaseDistanceM: number = AI_CHASE_DISTANCE_M,
    mergeDistanceM: number = AI_CHASE_MERGE_DISTANCE_M,
    minPlayerToEnemySizeRatio: number = AI_CHASE_MIN_PLAYER_SIZE_RATIO,
): number {
    const playerDistanceM = chaseDistanceM + mergeDistanceM;
    const depthSizeRatio = chaseDistanceM / playerDistanceM;
    const halfRefRad = THREE.MathUtils.degToRad(referenceFovDeg / 2);
    // Narrow the lens so the player subtends at least minRatio of the enemy at merge.
    const narrow = depthSizeRatio / minPlayerToEnemySizeRatio;
    return THREE.MathUtils.clamp(
        THREE.MathUtils.radToDeg(2 * Math.atan(narrow * Math.tan(halfRefRad))),
        22,
        referenceFovDeg,
    );
}

/**
 * Exterior chase camera locked behind the AI opponent (F6). The camera follows
 * the enemy's heading so it stays centred on screen; the player sits in the
 * upper-middle area ahead during a head-on merge.
 */
export class AiExteriorCameraUpdater extends CameraUpdater {

    private _v = new THREE.Vector3();

    constructor(actor: PlayerEntity, camera: THREE.PerspectiveCamera, private target: ChaseTarget) {
        super(actor, camera);
    }

    update(delta: number): void {
        const targetPos = this.target.getDisplayPosition();

        // Lock behind the enemy's tail, not toward the player — the view rotates
        // with the opponent instead of sliding as the merge geometry shifts.
        this._v
            .copy(FORWARD)
            .applyQuaternion(this.target.getDisplayQuaternion())
            .setY(0);
        if (this._v.lengthSq() < 1e-6) {
            this._v.set(0, 0, 1);
        }
        this._v.normalize();

        this.camera.position
            .copy(targetPos)
            .addScaledVector(UP, CHASE_HEIGHT_OFFSET_M)
            .addScaledVector(this._v, -AI_CHASE_DISTANCE_M);
        this.camera.lookAt(targetPos);
    }
}
