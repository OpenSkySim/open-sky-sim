import * as THREE from 'three';

export enum Faction {
    PLAYER,
    ENEMY,
}

/** Something a gun can hit and damage, and an AI pilot can pursue. */
export interface Combatant {
    readonly faction: Faction;
    /** Copy the current world position (m) into `target`. */
    readPosition(target: THREE.Vector3): THREE.Vector3;
    /** Copy the current world velocity (m/s) into `target`. */
    readVelocity(target: THREE.Vector3): THREE.Vector3;
    /** Hit-sphere radius (m). */
    getHitRadius(): number;
    /** Still a valid, targetable, damageable entity. */
    isAlive(): boolean;
    /** Apply `amount` points of damage (from a projectile hit). */
    applyDamage(amount: number): void;
}
