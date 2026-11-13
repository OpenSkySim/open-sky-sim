/**
 * The airframes the webbing solver is tested against: generated stand-ins
 * (webDummyAirframes) for the drawn meshes, as triangle soups in the body
 * frame (+Z forward), gear down, wheels on the deck. Node-only, so it is
 * named as a test file (outside the app's typecheck); it holds no tests itself.
 */
import { buildTriangleBvh, TriangleBvh } from '../collision/triangleBvh';
import { buildWebCollider, WebCollider, withoutGear } from './webCollider';
import { decimateSoup } from './webDecimate';
import { buildDummyAirframe, DUMMY_AIRFRAMES } from './webDummyAirframes.testkit.test';

export type WebFixture = keyof typeof DUMMY_AIRFRAMES;

export const WEB_FIXTURES: readonly WebFixture[] = ['twinTail', 'singleTail', 'crankedDelta', 'wideWing'];

export interface WebAirframe {
    readonly name: WebFixture;
    readonly triangles: Float32Array;
    readonly bvh: TriangleBvh;
    /** The drawn soup without its landing gear (withoutGear): the skin the webbing meets, and its tree. */
    readonly skin: Float32Array;
    readonly skinBvh: TriangleBvh;
    /** Body-frame bounds [minX, minY, minZ, maxX, maxY, maxZ], gear and all (its lowest point is the tyres). */
    readonly bounds: Float32Array;
    /** What the webbing collides with. */
    readonly collider: WebCollider;
    /** The collision mesh it was built from: the skin decimated to {@link COLLIDER_TRIS} (or as is, when it has fewer). */
    readonly collisionTriangles: Float32Array;
}

/** Triangles in each collision mesh. */
export const COLLIDER_TRIS = 3000;

const cache = new Map<WebFixture, WebAirframe>();

export function loadWebAirframe(name: WebFixture): WebAirframe {
    const hit = cache.get(name);
    if (hit) return hit;
    const triangles = buildDummyAirframe(DUMMY_AIRFRAMES[name]);
    const bvh = buildTriangleBvh(triangles);
    const skin = withoutGear(triangles);
    const collisionTriangles = skin.length / 9 > COLLIDER_TRIS ? decimateSoup(skin, COLLIDER_TRIS) : skin;
    const out = { name, triangles, bvh, skin, skinBvh: buildTriangleBvh(skin), bounds: bvh.bounds, collider: buildWebCollider(collisionTriangles), collisionTriangles };
    cache.set(name, out);
    return out;
}
