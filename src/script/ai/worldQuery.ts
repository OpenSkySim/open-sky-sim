import * as THREE from 'three';
import { CarrierMeshCollider, sampleCarrierMeshSurfaceYMax } from '../scene/entities/carrierDeck';
import { HillCollider, sampleHillSurfaceY } from '../scene/entities/hillCollider';
import { SkiJumpCollider, sampleSkiJumpSurfaceYMax } from '../scene/entities/skiJump';

/** A static world obstacle approximated as an upright cylinder for avoidance. */
export interface Obstacle {
    /** Base position (ground level) in world space. */
    position: THREE.Vector3;
    /** Horizontal safety radius (m). */
    radius: number;
    /** Top height above ground (m). */
    height: number;
}

/** The single airfield the AI takes off from and lands on. */
export interface Runway {
    /** Runway centre (threshold-to-threshold midpoint), world space. */
    center: THREE.Vector3;
    /** Runway heading (rad), 0 = aligned with +Z (approach from -Z). */
    heading: number;
    /** Half the paved length along the runway axis (m). */
    halfLength: number;
    /** Half the paved width across the runway axis (m). */
    halfWidth: number;
}

/**
 * Read-only view of the world an AI pilot uses for terrain/obstacle clearance
 * and navigation. Extracted from the otherwise-private {@link import('../state/game').Game}
 * state so pilots do not depend on the game object.
 */
export interface WorldQuery {
    /** Highest solid ground Y at (x, z): flat datum, hills, ski jumps, carrier meshes. */
    groundHeightAt(x: number, z: number): number;
    /** True if (x, z) is over land rather than water. */
    isLand(x: number, z: number): boolean;
    /** All static building/scenery obstacles. */
    obstacles(): readonly Obstacle[];
    /** The airfield used for takeoff and landing. */
    runway(): Runway;
}

const TMP = new THREE.Vector3();

/**
 * Concrete {@link WorldQuery} backed by the game's hill colliders, ski jumps,
 * carrier meshes, terrain land/water sampler, static obstacle list and runway.
 */
export class SceneWorldQuery implements WorldQuery {

    constructor(
        private readonly hills: HillCollider[],
        private readonly isLandFn: (x: number, z: number) => boolean,
        private readonly obstacleList: Obstacle[],
        private readonly runwayDef: Runway,
        private readonly skiJumps: readonly SkiJumpCollider[] = [],
        private readonly carrierMeshes: readonly CarrierMeshCollider[] = [],
        /** Optional DEM / base terrain height under hills and decks. */
        private readonly baseHeightAt: (x: number, z: number) => number = () => 0,
    ) { }

    groundHeightAt(x: number, z: number): number {
        return Math.max(
            this.baseHeightAt(x, z),
            sampleHillSurfaceY(x, z, this.hills),
            sampleSkiJumpSurfaceYMax(x, z, this.skiJumps),
            this.carrierHeightAt(x, z),
        );
    }

    /**
     * Carrier-deck surface Y at (x, z), or 0 if no carrier triangle covers that point.
     * Used to detect gear-on-deck for riding a steaming ship.
     */
    carrierHeightAt(x: number, z: number): number {
        return sampleCarrierMeshSurfaceYMax(x, z, this.carrierMeshes);
    }

    /** First carrier mesh origin, or false if none. */
    carrierOrigin(out: { x: number; y: number; z: number }): boolean {
        if (this.carrierMeshes.length === 0) return false;
        const c = this.carrierMeshes[0];
        out.x = c.originX;
        out.y = c.originY;
        out.z = c.originZ;
        return true;
    }

    isLand(x: number, z: number): boolean {
        return this.isLandFn(x, z);
    }

    obstacles(): readonly Obstacle[] {
        return this.obstacleList;
    }

    runway(): Runway {
        return this.runwayDef;
    }

    /** Move carrier collision soups when the ship translates (local mesh frame unchanged). */
    setCarrierMeshOrigins(origins: readonly { originX: number; originY: number; originZ: number }[]): void {
        for (let i = 0; i < this.carrierMeshes.length && i < origins.length; i++) {
            const c = this.carrierMeshes[i];
            const o = origins[i];
            c.originX = o.originX;
            c.originY = o.originY;
            c.originZ = o.originZ;
        }
    }

    /**
     * Nearest obstacle whose safety cylinder the point is within `horizon`
     * metres of (horizontally). Returns undefined when clear. Used by the
     * pilot's steering avoidance.
     */
    nearestObstacleWithin(x: number, z: number, horizon: number): Obstacle | undefined {
        let best: Obstacle | undefined;
        let bestDist = Infinity;
        for (let i = 0; i < this.obstacleList.length; i++) {
            const o = this.obstacleList[i];
            TMP.set(x - o.position.x, 0, z - o.position.z);
            const d = TMP.length() - o.radius;
            if (d < horizon && d < bestDist) {
                bestDist = d;
                best = o;
            }
        }
        return best;
    }
}
