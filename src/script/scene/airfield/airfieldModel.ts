/**
 * A real airfield, built as flat-shaded geometry.
 *
 * Not a `ModelLibBuilder`: those are keyed by a type string and take no
 * per-instance parameters, and every airfield here has its own length, width,
 * bearing and slope. So this builds a {@link Model} directly and hands it to a
 * plain `StaticSceneryEntity`, which is what gets the existing LOD, culling and
 * palette machinery for free.
 *
 * Every vertex goes geodetic → ECEF → ENU, exactly as `tools/bake/buildTile.ts`
 * places terrain vertices. Laying the pavement out on the tangent plane instead
 * would leave the ends of a 3.4 km runway floating a metre above the ground the
 * bake curved away underneath them.
 */

import * as THREE from 'three';
import { PaletteCategory } from '../../config/palettes/palette';
import { Airfield, AirfieldRunway, RunwaySurface, primaryRunway } from '../../terrain/airfields';
import { bearingAxisAt } from '../../terrain/flattenPad';
import {
    Ecef, Enu, EnuBasis, ecefToEnu, enuToGeodeticApprox, geodeticToEcef, sceneFromEnu,
} from '../../terrain/geodesy';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from '../materials/materials';
import { Model } from '../models/models';
import { updateUniforms } from '../utils';
import { MarkingKind, MarkingRect, runwayMarkings } from './runwayMarkings';

/**
 * How far the pavement floats over the flattened terrain.
 *
 * The ground under it was cut to the same plane, so in principle they coincide;
 * in practice the terrain is quantised into a 16-bit tile and this has to win
 * the depth test from every angle. Matches SCENERY_SURFACE_EPS_M.
 */
export const AIRFIELD_SURFACE_EPS_M = 1.5;

/** Paint sits this far over its own pavement. Coplanar flats would z-fight. */
const PAINT_LIFT_M = 0.05;

/** Taxiway centreline stripe width. */
const TAXIWAY_STRIPE_M = 0.5;

/**
 * Below this a segment is two nodes in the same place, and normalising it
 * would divide by zero.
 *
 * There used to be an 8 m floor here, on the theory that a short taxiway was a
 * stub not worth drawing. It is applied per *segment of a polyline*, not per
 * taxiway — so a continuous taxiway digitised with nodes a few metres apart,
 * which is what happens around a curve, lost exactly those segments and came
 * out with holes punched through the middle of it. At Belbek that was 119 of
 * 363 segments and 8.6% of the taxiway network. Merging into one buffer per
 * palette category means a short segment costs no draw call anyway.
 */
const DEGENERATE_SEGMENT_M = 0.01;

/**
 * A draped taxiway is cut into pieces this long before it is laid down.
 *
 * One quad per OSM segment would span a hundred metres and be flat across all
 * of it, so a leg crossing a rise cuts straight through. Twenty metres is
 * about the DEM's own cell, past which there is no more ground detail to
 * follow.
 */
const TAXIWAY_STEP_M = 20;

/**
 * What each surface is made of.
 *
 * Concrete is its own tone rather than sharing asphalt's. A military field
 * laid in slabs — every Soviet-era one in the Crimea area — is markedly paler
 * than an asphalt civil field, and from the air that is most of what tells
 * them apart. OSM records which it is, so there is no reason to guess.
 */
const SURFACE_CATEGORY: Record<RunwaySurface, PaletteCategory> = {
    asphalt: PaletteCategory.SCENERY_ROAD_SECONDARY,
    concrete: PaletteCategory.SCENERY_BASE_CONCRETE,
    // A mown strip reads lighter than the scrub around it, not grey.
    grass: PaletteCategory.SCENERY_FIELD_GREEN_LIGHT,
    gravel: PaletteCategory.TERRAIN_BARE,
};

/**
 * What the taxiways and aprons of an airfield are paved with.
 *
 * Taken from its longest runway, because OSM does not tag a surface on either
 * of them and an airfield is laid in one material: a concrete-plate military
 * field has concrete taxiways, and drawing them in asphalt puts a civil apron
 * in the middle of it.
 *
 * A grass or gravel *runway* still gets hard taxiways, since what little
 * pavement such a field has is where the aircraft turn and park.
 */
function groundSurfaceOf(airfield: Airfield): PaletteCategory {
    const primary = primaryRunway(airfield);
    return primary !== undefined && primary.surface === 'concrete'
        ? PaletteCategory.SCENERY_BASE_CONCRETE
        : PaletteCategory.SCENERY_ROAD_SECONDARY;
}

const MARKING_CATEGORY: Record<MarkingKind, PaletteCategory> = {
    pavement: PaletteCategory.SCENERY_ROAD_SECONDARY,
    threshold: PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD,
    designator: PaletteCategory.SCENERY_BASE_RUNWAY_THRESHOLD,
    aiming: PaletteCategory.SCENERY_BASE_RUNWAY_LINES,
    centreline: PaletteCategory.SCENERY_BASE_RUNWAY_LINES,
    edge: PaletteCategory.SCENERY_BASE_RUNWAY_LINES,
};

/**
 * What each level of detail draws.
 *
 * The markings are most of the triangles and the first thing to go: a runway
 * two miles out is a grey strip, and a runway ten miles out is a grey strip
 * with numbers nobody can read. Level 2 keeps the pavement alone, which is
 * still the shape that says "airfield" from the air.
 */
const LOD_KINDS: MarkingKind[][] = [
    ['pavement', 'threshold', 'designator', 'aiming', 'centreline', 'edge'],
    ['pavement', 'threshold', 'designator'],
    ['pavement'],
];
/** Coarsest level that still draws taxiways and aprons. */
const LOD_WITH_SURROUNDS = 1;

const _ecef: Ecef = { x: 0, y: 0, z: 0 };
const _enu: Enu = { e: 0, n: 0, u: 0 };

/** Accumulates triangles per palette category, so one category is one draw. */
class MeshParts {
    private readonly parts = new Map<PaletteCategory, number[]>();

    add(category: PaletteCategory, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
        let out = this.parts.get(category);
        if (out === undefined) {
            out = [];
            this.parts.set(category, out);
        }
        out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }

    /** Two triangles from four corners wound a, b, c, d. */
    addQuad(
        category: PaletteCategory,
        a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3,
    ): void {
        this.add(category, a, b, c);
        this.add(category, a, c, d);
    }

    build(materials: SceneMaterialManager): THREE.Object3D[] {
        const out: THREE.Object3D[] = [];
        for (const [category, positions] of this.parts) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                'position', new THREE.BufferAttribute(new Float32Array(positions), 3));
            geometry.computeBoundingSphere();
            const material = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category,
                depthWrite: false,
                shaded: false,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.onBeforeRender = updateUniforms;
            out.push(mesh);
        }
        return out;
    }
}

export interface AirfieldModel {
    model: Model;
    /** Scene position the geometry is built around. */
    origin: THREE.Vector3;
}

/**
 * Build one airfield.
 *
 * Returns undefined for an airfield with no runway, which the bake should not
 * produce but a hand-edited manifest can.
 */
/**
 * Elevation of the real ground at an ENU point, above the ellipsoid.
 *
 * Taxiways and aprons are draped on this rather than laid on the airfield's
 * plane. Only the runway strips are cut flat by the bake — the taxiway network
 * reaches a kilometre past them over ground nobody levelled, and on the plane
 * it floats or buries itself by up to twenty metres. Inside a runway's pad the
 * ground *is* the plane, so the two meet exactly where they have to.
 */
export type GroundElevation = (e: number, n: number) => number;

export function buildAirfieldModel(
    airfield: Airfield, basis: EnuBasis, materials: SceneMaterialManager,
    groundElevationAt?: GroundElevation,
): AirfieldModel | undefined {
    const primary = primaryRunway(airfield);
    if (primary === undefined) {
        return undefined;
    }

    const toEnu = (lat: number, lon: number) => {
        const enu = ecefToEnu(basis, geodeticToEcef(lat, lon, 0, _ecef), _enu);
        return { e: enu.e, n: enu.n };
    };

    // The plane every part of this airfield is cut to, as the pads carry it.
    const planeCentre = toEnu(primary.lat, primary.lon);
    const riseAxis = bearingAxisAt(
        primary.lat, primary.lon, airfield.plane.headingDeg, toEnu);
    const elevationAt = (e: number, n: number): number =>
        airfield.plane.heightMsl + airfield.plane.gradient
        * ((e - planeCentre.e) * riseAxis.e + (n - planeCentre.n) * riseAxis.n);

    // Geometry is built around the primary runway's centre so the numbers
    // stay small: a float32 vertex 200 km from the play origin has decimetre
    // steps in it, and a runway edge stripe is 0.9 m wide.
    const originScene = sceneAt(basis, planeCentre.e, planeCentre.n,
        elevationAt(planeCentre.e, planeCentre.n));

    const place = (e: number, n: number, lift: number): THREE.Vector3 =>
        sceneAt(basis, e, n, elevationAt(e, n) + lift).sub(originScene);
    // Draped, for everything the bake did not flatten. Without a ground
    // function this falls back to the plane, which is what the geometry tests
    // and any caller with no terrain loaded get.
    const drape = (e: number, n: number, lift: number): THREE.Vector3 =>
        sceneAt(basis, e, n, (groundElevationAt?.(e, n) ?? elevationAt(e, n)) + lift)
            .sub(originScene);

    const levels: Model['lod'] = [];
    let maxSize = 0;
    for (let level = 0; level < LOD_KINDS.length; level++) {
        const kinds = new Set(LOD_KINDS[level]);
        const parts = new MeshParts();

        if (level <= LOD_WITH_SURROUNDS) {
            // Drawn under the runways, so a taxiway crossing one loses.
            const pavement = groundSurfaceOf(airfield);
            addAprons(parts, airfield, toEnu, drape, pavement);
            addTaxiways(parts, airfield, toEnu, drape, kinds.has('centreline'), pavement);
        }
        for (const runway of airfield.runways) {
            maxSize = Math.max(maxSize, runway.lengthM);
            addRunway(parts, runway, kinds, toEnu, place);
        }
        levels.push({ flats: parts.build(materials), volumes: [] });
    }
    return {
        model: {
            lod: levels,
            animations: [],
            maxSize: Math.max(maxSize, 1),
            center: new THREE.Vector3(),
        },
        origin: originScene,
    };
}

/** Scene position of an ENU point at a given elevation. */
function sceneAt(basis: EnuBasis, e: number, n: number, elevation: number): THREE.Vector3 {
    const g = enuToGeodeticApprox(basis, e, n, 0);
    geodeticToEcef(g.lat, g.lon, elevation, _ecef);
    return sceneFromEnu(ecefToEnu(basis, _ecef, _enu));
}

/** Twice the signed area of a ring in east/north; positive is counter-clockwise. */
function signedArea(ring: readonly { e: number; n: number }[]): number {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        sum += a.e * b.n - b.e * a.n;
    }
    return sum;
}

type Place = (e: number, n: number, lift: number) => THREE.Vector3;
type ToEnu = (lat: number, lon: number) => { e: number; n: number };

function addRunway(
    parts: MeshParts, runway: AirfieldRunway, kinds: Set<MarkingKind>,
    toEnu: ToEnu, place: Place,
): void {
    const centre = toEnu(runway.lat, runway.lon);
    const axis = bearingAxisAt(runway.lat, runway.lon, runway.headingDeg, toEnu);
    // Right of the runway axis, which is what the marking layout calls +v.
    const right = { e: axis.n, n: -axis.e };
    const at = (u: number, v: number, lift: number) => place(
        centre.e + axis.e * u + right.e * v,
        centre.n + axis.n * u + right.n * v,
        lift,
    );

    for (const rect of runwayMarkings(
        runway.lengthM, runway.widthM, runway.ref, runway.surface)) {
        if (!kinds.has(rect.kind)) {
            continue;
        }
        const category = rect.kind === 'pavement'
            ? SURFACE_CATEGORY[runway.surface] ?? PaletteCategory.SCENERY_ROAD_SECONDARY
            : MARKING_CATEGORY[rect.kind];
        const lift = AIRFIELD_SURFACE_EPS_M + (rect.kind === 'pavement' ? 0 : PAINT_LIFT_M);
        parts.addQuad(category, ...quadCorners(rect, at, lift));
    }
}

function quadCorners(
    rect: MarkingRect, at: (u: number, v: number, lift: number) => THREE.Vector3, lift: number,
): [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const u0 = rect.u - rect.lengthM / 2;
    const u1 = rect.u + rect.lengthM / 2;
    const v0 = rect.v - rect.widthM / 2;
    const v1 = rect.v + rect.widthM / 2;
    // Wound so the face normal points up in scene axes (x east, y up, z south).
    return [at(u0, v0, lift), at(u0, v1, lift), at(u1, v1, lift), at(u1, v0, lift)];
}

function addTaxiways(
    parts: MeshParts, airfield: Airfield, toEnu: ToEnu, place: Place, withStripe: boolean,
    pavement: PaletteCategory,
): void {
    for (const taxiway of airfield.taxiways) {
        const points = taxiway.points.map(p => toEnu(p[0], p[1]));
        for (let i = 0; i + 1 < points.length; i++) {
            const a = points[i];
            const b = points[i + 1];
            const de = b.e - a.e;
            const dn = b.n - a.n;
            const len = Math.hypot(de, dn);
            if (len < DEGENERATE_SEGMENT_M) {
                continue;
            }
            // Perpendicular, per segment. Mitring the joints would buy a
            // sliver of pavement on a turn; the segments already overlap
            // there, and overlapping coplanar flats of one colour are
            // invisible.
            const px = -dn / len;
            const py = de / len;
            // Cut into steps so the strip follows the ground under it instead
            // of spanning a rise as one flat quad.
            const steps = Math.max(1, Math.ceil(len / TAXIWAY_STEP_M));
            const strip = (width: number, lift: number, category: PaletteCategory) => {
                const h = width / 2;
                for (let s = 0; s < steps; s++) {
                    const t0 = s / steps;
                    const t1 = (s + 1) / steps;
                    const e0 = a.e + de * t0;
                    const n0 = a.n + dn * t0;
                    const e1 = a.e + de * t1;
                    const n1 = a.n + dn * t1;
                    parts.addQuad(category,
                        place(e0 + px * h, n0 + py * h, lift),
                        place(e0 - px * h, n0 - py * h, lift),
                        place(e1 - px * h, n1 - py * h, lift),
                        place(e1 + px * h, n1 + py * h, lift));
                }
            };
            strip(taxiway.widthM, AIRFIELD_SURFACE_EPS_M, pavement);
            if (withStripe) {
                strip(TAXIWAY_STRIPE_M, AIRFIELD_SURFACE_EPS_M + PAINT_LIFT_M,
                    PaletteCategory.SCENERY_FIELD_YELLOW);
            }
        }
    }
}

function addAprons(
    parts: MeshParts, airfield: Airfield, toEnu: ToEnu, place: Place,
    pavement: PaletteCategory,
): void {
    for (const apron of airfield.aprons) {
        const ring = apron.ring.map(p => toEnu(p[0], p[1]));
        // OSM closes its rings by repeating the first node; the triangulator
        // wants an open contour and produces a degenerate ear from the repeat.
        if (ring.length > 1
            && Math.abs(ring[0].e - ring[ring.length - 1].e) < 1e-6
            && Math.abs(ring[0].n - ring[ring.length - 1].n) < 1e-6) {
            ring.pop();
        }
        if (ring.length < 3) {
            continue;
        }
        // Turned counter-clockwise in east/north, which is the winding that
        // comes out facing up once east/north becomes the scene's x and -z.
        //
        // OSM does not promise either winding on a closed way, and it really
        // does use both: across the baked airfields, 118 apron rings run one
        // way and 170 the other. Triangulated blind, half of every airfield's
        // ramp is emitted back-facing — and the mesh material culls back faces,
        // so half the aprons simply are not there. Saki draws seven of its
        // fourteen.
        if (signedArea(ring) < 0) {
            ring.reverse();
        }
        const contour = ring.map(p => new THREE.Vector2(p.e, p.n));
        let faces: number[][];
        try {
            faces = THREE.ShapeUtils.triangulateShape(contour, []);
        } catch {
            // A self-intersecting apron is a mapping error, not a reason to
            // drop the whole airfield.
            continue;
        }
        for (const face of faces) {
            parts.add(
                pavement,
                place(ring[face[0]].e, ring[face[0]].n, AIRFIELD_SURFACE_EPS_M),
                place(ring[face[1]].e, ring[face[1]].n, AIRFIELD_SURFACE_EPS_M),
                place(ring[face[2]].e, ring[face[2]].n, AIRFIELD_SURFACE_EPS_M),
            );
        }
    }
}
