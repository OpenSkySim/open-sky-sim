import * as THREE from 'three';
import { ShadowQualities } from '../state/gameDefs';
import { SHADOW_ALPHA_DITHER } from '../scene/entities/aircraftShadow';
import { SHADOW_MIN_SUN_Y, SUN_DIRECTION } from '../scene/materials/shaders/sun';
import { DITHER_PARS_FRAGMENT } from '../scene/materials/shaders/dither';
import {
    LOG_DEPTH_FRAGMENT, LOG_DEPTH_PARS_FRAGMENT, LOG_DEPTH_PARS_VERTEX, LOG_DEPTH_VERTEX
} from '../scene/materials/shaders/logDepth';

/**
 * Object3D layer carrying the shadow casters. Enabled on solid model meshes
 * (aircraft, hangars, towers, the carrier hull…) by the model manager; only
 * that layer is walked for shadow volumes, so decals, FX, particles, impostors
 * and the terrain never extrude one.
 */
export const SHADOW_CASTER_LAYER = 1;

/**
 * Object3D layer marking a caster whose *lit* surfaces keep their stencil
 * count, so shadows from other casters land on them: the carrier deck, a
 * hangar roof, a warehouse wall. Enabled by the model manager on every caster
 * that is not a flyable airframe.
 *
 * Airframes are left off it on purpose. An aircraft model is not a solid but a
 * shell full of interior geometry — cockpit tub, gear bays, intake ducts — and
 * every bit of it sweeps a volume that lands back on the skin; geometrically
 * right, and it reads as dirt on the model. A hull or a building has no such
 * interior, so it can take the count and gain the shadow a parked aircraft
 * drops on it. See {@link ShadowSettings.selfShadow} for the global override.
 */
export const SHADOW_RECEIVER_LAYER = 2;

export interface ShadowSettings {
    enabled: boolean;
    /**
     * How far a stippled-in pixel blends towards the shadow palette colour
     * (0..1). 1 is what the flat planform silhouettes do: the palette colour,
     * flat.
     */
    intensity: number;
    /**
     * Fraction of pixels the shadow stipples in (0..1) — its apparent opacity.
     * Shared with the planform silhouettes so a cast shadow and the fallback
     * under a parked aircraft are the same dither.
     */
    stipple: number;
    /**
     * A caster further than this from the camera (metres) is skipped. Set from
     * the menu quality; see {@link SHADOW_CASTER_RANGES}.
     */
    casterRange: number;
    /**
     * Forces *every* caster to be treated as a receiver, airframes included.
     *
     * Off by default, which leaves the choice to {@link SHADOW_RECEIVER_LAYER}:
     * hulls and buildings keep their lit surfaces' count and take shadows,
     * airframes have their visible surface cleared wholesale and do not. On,
     * the layer is ignored and everything keeps it, which is geometrically
     * honest and shows every seam an imported airframe was exported with. A dev
     * switch, mostly — `__shadowSettings.selfShadow = true`.
     */
    selfShadow: boolean;
    /**
     * How far past sea level a sweep reaches (metres). The sweep itself is
     * worked out per vertex — far enough to put the far cap under whatever the
     * shadow could land on, and not one metre further.
     *
     * Length is not free, and not for the reason it looks. An imported airframe
     * is not a clean solid: it has interior geometry, coincident faces and
     * parts that interpenetrate, and the volumes those sweep overlap in ways
     * that should cancel exactly but disagree on the odd pixel. Sweep 30 km and
     * every one of those disagreements is drawn as a streak clear across the
     * scene; sweep just past the ground and the same disagreement is a few
     * pixels wide, under the aircraft, where nothing can see it.
     */
    sweepMargin: number;
    /** Shortest sweep (metres), for a caster sitting on the ground. */
    sweepMin: number;
    /**
     * Longest sweep (metres). A caster higher than this above the ground stops
     * casting rather than smearing: its shadow is a pixel or two at that range,
     * and the streaks would be longer than the shadow.
     */
    sweepMax: number;
    /**
     * Volume geometry is built once per source geometry and is 8× its size
     * (24 vertices per source triangle); a caster past this triangle count is
     * skipped rather than paid for.
     */
    maxCasterTriangles: number;
}

export const SHADOW_SETTINGS: ShadowSettings = {
    enabled: true,
    intensity: 1.0,
    stipple: SHADOW_ALPHA_DITHER,
    casterRange: 2000,
    selfShadow: false,
    sweepMargin: 40,
    sweepMin: 40,
    sweepMax: 4000,
    maxCasterTriangles: 8000,
};

/**
 * Caster range per menu setting (OFF keeps whatever is set; the pass is
 * skipped entirely).
 *
 * Stencil volumes are resolution-independent — there is no map to size — so
 * quality buys *reach* instead: how far out an object still casts. The cost is
 * a pair of stencil draws and the fill its prism covers, both of which fall off
 * quickly with distance, which is why the top tier can afford 20 km.
 */
export const SHADOW_CASTER_RANGES: Record<ShadowQualities, number> = {
    [ShadowQualities.OFF]: 0,
    [ShadowQualities.LOW]: 800,
    [ShadowQualities.MEDIUM]: 2000,
    [ShadowQualities.HIGH]: 6000,
    [ShadowQualities.ULTRA]: 20000,
};

// Dev aid: tweak or disable shadows live from the console. Every field is read
// per frame, so `__shadowSettings.enabled = false` restores the old planform
// silhouettes on the next one.
(globalThis as Record<string, unknown>).__shadowSettings = SHADOW_SETTINGS;

/** Positions this close together (metres) are the same vertex for adjacency. */
const WELD_QUANTUM = 1e-3;

/**
 * Insurance, in normalised depth, against a cap landing a hair behind the
 * surface it was built from — welding moves a corner by up to half a
 * millimetre, and the main pass reached it through its own matrix product.
 * Applied towards the camera, so a coincident cap reliably tests as "in front"
 * and is not counted. 24-bit depth quantises at ~6e-8, so this is ~170 quanta.
 */
const SURFACE_DEPTH_BIAS = 1.0e-5;

/**
 * A caster's shadow volume: the silhouette prism, as geometry that is only
 * *potentially* extruded. Each vertex carries the normal of the face it came
 * from and the vertex program pushes it down-sun when that face is turned away
 * from the sun, so one buffer serves every sun angle.
 *
 * Layout is three consecutive ranges, which is what lets {@link caps} address
 * the first one on its own:
 *
 *  - `[0, 3·triangles)` front caps: every source triangle, original winding.
 *  - `[3·triangles, 6·triangles)` back caps: the same triangles reversed, with
 *    the normal negated, so exactly one of the pair extrudes and the other
 *    stays on the surface.
 *  - `[6·triangles, …)` walls: one quad per triangle *edge*, degenerate unless
 *    that edge's two faces disagree about the sun — which is precisely the
 *    silhouette, found per frame on the GPU instead of walked on the CPU.
 *
 * A shared edge therefore gets two walls, one from each side, and they land on
 * top of each other when the edge is a silhouette. Both are needed: the surface
 * carries two copies of that edge — the lit face's cap and the unlit face's
 * reversed cap — and a single wall would close only one of them, leaving the
 * prism open along the silhouette and the stencil count leaking through it. The
 * doubled wall is also what makes the count 2 rather than 1 under a solid,
 * which is why the receiving test is "not zero" rather than "odd".
 *
 * The price of all this is size: 24 vertices per source triangle, against 3.
 */
/** One face's use of one edge: which face, and which way round it walks it. */
interface EdgeUse {
    readonly face: number;
    readonly forward: boolean;
}

export interface ShadowVolumeGeometry {
    /** Caps and sides: the closed prism the stencil pass counts. */
    readonly full: THREE.BufferGeometry;
    /** Front caps only, sharing `full`'s buffers. See the unlit mask pass. */
    readonly caps: THREE.BufferGeometry;
    /** Source triangles that survived degeneracy checks. */
    readonly triangles: number;
    /** Vertices in {@link full} — 8× the source, hence the caster budget. */
    readonly vertices: number;
}

/**
 * Builds the shadow volume for `source`, or null if there is nothing to cast.
 *
 * Adjacency is resolved by welding positions onto a {@link WELD_QUANTUM} grid,
 * so a model split into separate draw ranges or exported with duplicated corner
 * vertices still yields closed silhouettes. An edge no two faces share — a
 * boundary, which the open shells aircraft models are built from are full of,
 * or a seam where three or more faces meet, which imported models are also full
 * of — is treated as having a back face with the opposite normal, which makes
 * that face cast as if it were an infinitely thin solid on its own.
 */
export function buildShadowVolumeGeometry(source: THREE.BufferGeometry): ShadowVolumeGeometry | null {
    const position = source.getAttribute('position');
    if (position === undefined) {
        return null;
    }
    const index = source.getIndex();
    const cornerCount = index !== null ? index.count : position.count;
    const sourceTriangles = Math.floor(cornerCount / 3);
    if (sourceTriangles === 0) {
        return null;
    }

    // Weld: quantised position -> id, plus the representative coordinates. Every
    // emitted vertex uses a representative, so faces that meet in the source
    // meet exactly here too and the prism cannot leak through a seam.
    const weld = new Map<string, number>();
    const coords: number[] = [];
    const corners = new Int32Array(sourceTriangles * 3);
    for (let c = 0; c < sourceTriangles * 3; c++) {
        const v = index !== null ? index.getX(c) : c;
        const x = position.getX(v);
        const y = position.getY(v);
        const z = position.getZ(v);
        const key = `${Math.round(x / WELD_QUANTUM)},${Math.round(y / WELD_QUANTUM)},${Math.round(z / WELD_QUANTUM)}`;
        let id = weld.get(key);
        if (id === undefined) {
            id = coords.length / 3;
            weld.set(key, id);
            coords.push(x, y, z);
        }
        corners[c] = id;
    }

    // Face normals, and the triangle list minus anything with no area: a
    // degenerate face has no normal to test against the sun and no silhouette.
    const faces: number[] = [];
    const normals: number[] = [];
    for (let t = 0; t < sourceTriangles; t++) {
        const a = corners[t * 3];
        const b = corners[t * 3 + 1];
        const c = corners[t * 3 + 2];
        if (a === b || b === c || a === c) {
            continue;
        }
        const abx = coords[b * 3] - coords[a * 3];
        const aby = coords[b * 3 + 1] - coords[a * 3 + 1];
        const abz = coords[b * 3 + 2] - coords[a * 3 + 2];
        const acx = coords[c * 3] - coords[a * 3];
        const acy = coords[c * 3 + 1] - coords[a * 3 + 1];
        const acz = coords[c * 3 + 2] - coords[a * 3 + 2];
        const nx = aby * acz - abz * acy;
        const ny = abz * acx - abx * acz;
        const nz = abx * acy - aby * acx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len < 1e-12) {
            continue;
        }
        faces.push(a, b, c);
        normals.push(nx / len, ny / len, nz / len);
    }

    const triangles = faces.length / 3;
    if (triangles === 0) {
        return null;
    }

    // Edge -> the faces using it and which way each walks it, so a face can
    // find the one it hinges against. See the wall loop for why the direction
    // is what decides whether hinging is sound.
    const edges = new Map<string, EdgeUse[]>();
    for (let t = 0; t < triangles; t++) {
        for (let e = 0; e < 3; e++) {
            const from = faces[t * 3 + e];
            const to = faces[t * 3 + (e + 1) % 3];
            const key = from < to ? `${from}:${to}` : `${to}:${from}`;
            const use: EdgeUse = { face: t, forward: from < to };
            const uses = edges.get(key);
            if (uses === undefined) {
                edges.set(key, [use]);
            } else {
                uses.push(use);
            }
        }
    }

    const outPositions: number[] = [];
    const outNormals: number[] = [];

    // `flip` marks the reversed copy of a face. It negates the normal, and w
    // carries it through to the vertex program, which needs to break the tie
    // when a face is exactly edge-on to the sun: without it both copies of that
    // face would take the same branch, one end of the prism would go missing,
    // and the count would leak out of the hole. See the sweep in VOLUME_SWEEP.
    const emit = (vertex: number, face: number, flip: boolean): void => {
        outPositions.push(coords[vertex * 3], coords[vertex * 3 + 1], coords[vertex * 3 + 2]);
        const s = flip ? -1 : 1;
        outNormals.push(
            s * normals[face * 3], s * normals[face * 3 + 1], s * normals[face * 3 + 2],
            flip ? 1 : 0);
    };

    // Front caps: original winding, face normal as-is. Light-facing triangles
    // stay put here and close the prism against the sun; the rest extrude and
    // close it at the far end (with their winding still pointing outwards,
    // because their normal already pointed down-sun).
    for (let t = 0; t < triangles; t++) {
        emit(faces[t * 3], t, false);
        emit(faces[t * 3 + 1], t, false);
        emit(faces[t * 3 + 2], t, false);
    }
    // Back caps: the same triangles reversed and with the normal negated, so
    // whichever of the pair the first loop extruded, this one does not.
    for (let t = 0; t < triangles; t++) {
        emit(faces[t * 3], t, true);
        emit(faces[t * 3 + 2], t, true);
        emit(faces[t * 3 + 1], t, true);
    }

    // Walls: a quad per triangle edge, ordered along that triangle's own
    // winding so the outward direction agrees with its cap. The two corners
    // carrying this face's normal move with its cap and the two carrying the
    // neighbour's move with the neighbour's — so an interior edge, whose faces
    // agree about the sun, collapses all four onto two positions and draws
    // nothing, while a silhouette edge opens the quad into the prism wall.
    let quads = 0;
    for (let t = 0; t < triangles; t++) {
        for (let e = 0; e < 3; e++) {
            const from = faces[t * 3 + e];
            const to = faces[t * 3 + (e + 1) % 3];
            const forward = from < to;
            const key = forward ? `${from}:${to}` : `${to}:${from}`;
            const uses = edges.get(key) as EdgeUse[];
            //
            // Hinge only where it is sound, which is narrower than "there is a
            // neighbour": exactly two faces on the edge, and walking it in
            // opposite directions. That is what a consistently wound manifold
            // edge looks like, and it is exactly the condition under which the
            // pair's caps cancel each other when they agree about the sun and
            // their two walls cancel them when they do not. Anywhere else —
            // a boundary, a seam where three or more faces meet, or a face
            // duplicated with the same winding, all of which imported models
            // are full of — this face walls itself against its own back side
            // instead. That side always disagrees about the sun, so the wall
            // always opens, and the face plus its three walls is a closed thin
            // volume whatever the neighbours do.
            //
            // Hinging where the condition does not hold is what leaves the
            // swept prism open along that edge, and the count leaks out of the
            // crack into a wedge of the scene that is nowhere near a shadow.
            let hinge = -1;
            if (uses.length === 2) {
                const mine = uses[0].face === t && uses[0].forward === forward ? uses[0] : uses[1];
                const neighbour = mine === uses[0] ? uses[1] : uses[0];
                if (neighbour.face !== t && neighbour.forward !== forward) {
                    hinge = neighbour.face;
                }
            }
            const other = hinge >= 0 ? hinge : t;
            const flip = hinge < 0;
            emit(from, t, false);
            emit(from, other, flip);
            emit(to, other, flip);
            emit(from, t, false);
            emit(to, other, flip);
            emit(to, t, false);
            quads++;
        }
    }

    const positions = new THREE.BufferAttribute(new Float32Array(outPositions), 3);
    const faceNormals = new THREE.BufferAttribute(new Float32Array(outNormals), 4);

    const full = new THREE.BufferGeometry();
    full.setAttribute('position', positions);
    full.setAttribute('aFaceNormal', faceNormals);

    // Shares the buffers: only the draw range differs, so the unlit mask costs
    // no extra memory and cannot drift from the volume it masks.
    const caps = new THREE.BufferGeometry();
    caps.setAttribute('position', positions);
    caps.setAttribute('aFaceNormal', faceNormals);
    caps.setDrawRange(0, triangles * 3);

    return { full, caps, triangles, vertices: 6 * triangles + 6 * quads };
}

const VOLUME_PARS = `
  precision highp float;

  uniform highp vec3 uSunDir;
  // x = the camera's altitude, which turns a camera-relative height into one
  // above sea level; y = margin past it; zw = the sweep clamp.
  uniform highp vec4 uSweep;
  // xy = half the viewport in pixels, z = 1 while the main pass is snapping.
  uniform highp vec3 uSnap;
  // xyz = the normal of the face this vertex came from, negated on the
  // reversed copy; w = 1 on that copy, 0 on the original.
  attribute highp vec4 aFaceNormal;

#ifdef USE_INSTANCING
  #define VOLUME_MODEL (modelMatrix * instanceMatrix)
  #define VOLUME_MODEL_VIEW (modelViewMatrix * instanceMatrix)
#else
  #define VOLUME_MODEL modelMatrix
  #define VOLUME_MODEL_VIEW modelViewMatrix
#endif

  /** How far this vertex's face is turned towards the sun. */
  highp float faceFacing() {
    return dot(normalize(mat3(VOLUME_MODEL) * aFaceNormal.xyz), uSunDir);
  }

  /**
   * How far this vertex sweeps down-sun: enough to reach past sea level, and
   * clamped. Worked out from the vertex's own position, so two faces sharing a
   * corner sweep it to exactly the same place and the prism stays watertight.
   */
  highp float sweepLength(highp vec3 world) {
    highp float drop = world.y + uSweep.x + uSweep.y;
    // The sun on the horizon would ask for an infinite sweep. The floor is the
    // sine of the elevation shadows switch off at, so a sweep keeps lengthening
    // for as long as one is drawn at all: a floor any higher than that would
    // freeze every shadow at one length while the sun carried on dropping,
    // which is what a hard-coded 0.2 (11.5 degrees) used to do.
    return clamp(drop / max(uSunDir.y, ${SHADOW_MIN_SUN_Y.toFixed(6)}), uSweep.z, uSweep.w);
  }

  /**
   * The main pass quantises x/y to the low-resolution raster grid (see
   * shaders/shadedVP.ts). A cap that skipped that would rasterise a fraction of
   * a pixel off the surface it sits on, its interpolated depth would disagree,
   * and the caster would stipple itself wherever the disagreement went the
   * wrong way. So the volume snaps with it.
   */
  highp vec4 snapped(highp vec4 pos) {
    if (uSnap.z > 0.5) {
      pos.x = floor(pos.x / pos.w * uSnap.x + 0.5) / uSnap.x * pos.w;
      pos.y = floor(pos.y / pos.w * uSnap.y + 0.5) / uSnap.y * pos.w;
    }
    return pos;
  }
`;

const VOLUME_VERTEX_PROGRAM = `
${VOLUME_PARS}
${LOG_DEPTH_PARS_VERTEX}
  varying highp float vSurface;
  void main() {
    highp float facing = faceFacing();
    // Exactly one of a face's two copies must sweep, whatever the angle. The
    // reversed copy sees the negated normal, so testing it strictly is what
    // splits the tie when the face is edge-on and both see zero.
    bool swept = aFaceNormal.w > 0.5 ? facing < 0.0 : facing <= 0.0;
    vSurface = swept ? 0.0 : 1.0;

    highp vec4 view;
    if (swept) {
      highp vec4 world = VOLUME_MODEL * vec4(position, 1.0);
      world.xyz -= uSunDir * sweepLength(world.xyz);
      view = viewMatrix * world;
    } else {
      // Same chain the main pass used for this corner, so the cap lands on the
      // surface it came from rather than racing it for the depth test.
      view = VOLUME_MODEL_VIEW * vec4(position, 1.0);
    }
    gl_Position = snapped(projectionMatrix * view);
${LOG_DEPTH_VERTEX}
  }
`;

/**
 * Colour is masked off — the pass exists for its stencil side effects — but the
 * depth *test* is what counts the fragment, so this has to land on exactly the
 * same depth scale the main pass wrote.
 */
const VOLUME_FRAGMENT_PROGRAM = `
  precision highp float;
  varying highp float vSurface;
${LOG_DEPTH_PARS_FRAGMENT}
  void main() {
    gl_FragColor = vec4(0.0);
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    // Biased only at the end of the prism that sits on the caster, tapering to
    // nothing along the walls: that is the only end anything is coincident with.
    gl_FragDepth = (vIsPerspective == 0.0
      ? gl_FragCoord.z
      : log2(vFragDepth) * logDepthBufFC * 0.5) - float(${SURFACE_DEPTH_BIAS}) * vSurface;
#endif
  }
`;

const MASK_VERTEX_PROGRAM = `
${VOLUME_PARS}
${LOG_DEPTH_PARS_VERTEX}
  varying highp float vFacing;
  void main() {
    // Front caps only, and never swept: this draws the caster's own surface.
    vFacing = faceFacing();
    gl_Position = snapped(projectionMatrix * VOLUME_MODEL_VIEW * vec4(position, 1.0));
${LOG_DEPTH_VERTEX}
  }
`;

/**
 * Clears the stencil on a caster's own visible surface.
 *
 * Two builds, and which one a caster gets is the whole of the receiver split.
 * `unlitOnly` spares the facets turned towards the sun: their count stands, so
 * a parked aircraft's prism still darkens the deck under it. Without it the
 * surface is cleared wholesale and nothing — the caster's own volume or anyone
 * else's — can mark it.
 *
 * Facets turned *away* from the sun are cleared either way: they are already at
 * the ambient floor and stippling them again only adds noise.
 */
const maskFragmentProgram = (unlitOnly: boolean): string => `
  precision highp float;
  varying highp float vFacing;
${LOG_DEPTH_PARS_FRAGMENT}
  void main() {` + (unlitOnly ? `
    if (vFacing > 0.0) {
      discard;
    }` : '') + `
    gl_FragColor = vec4(0.0);
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = (vIsPerspective == 0.0
      ? gl_FragCoord.z
      : log2(vFragDepth) * logDepthBufFC * 0.5) - float(${SURFACE_DEPTH_BIAS});
#endif
  }
`;

const OVERLAY_VERTEX_PROGRAM = `
  precision highp float;
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Fills the stencilled pixels exactly like the flat planform silhouettes this
 * replaced: the same 4x4 ordered-dither threshold at the same density, in the
 * same SCENERY_TREE_SHADOW palette colour. A cast shadow and the fallback
 * silhouette under a parked aircraft are then the same mark on screen, one just
 * projected properly.
 */
const OVERLAY_FRAGMENT_PROGRAM = `
  precision highp float;
  uniform vec3 uShadowColor;
  // x = intensity, y = stipple density.
  uniform vec2 uShadowTone;
${DITHER_PARS_FRAGMENT}
  void main() {
    if (uShadowTone.y + bayerThreshold(gl_FragCoord.xy) < 0.5) {
      discard;
    }
    gl_FragColor = vec4(uShadowColor, uShadowTone.x);
  }
`;

/**
 * Which mask a caster gets: whether its lit surfaces keep their stencil count
 * and can therefore be shadowed by anything, itself included.
 *
 * The layer is the per-model answer, set by the model manager;
 * {@link ShadowSettings.selfShadow} overrides it for everything at once.
 */
export function receivesShadow(caster: THREE.Object3D): boolean {
    return SHADOW_SETTINGS.selfShadow || caster.layers.isEnabled(SHADOW_RECEIVER_LAYER);
}

/** Scratch for the caster distance test. */
const CASTER_POSITION = new THREE.Vector3();
/** Scratch for the caster sweep test. */
const CASTER_BOX = new THREE.Box3();

/**
 * Altitude above sea level of the highest corner of `caster`'s bounds, or
 * undefined when its geometry has none to read.
 *
 * `caster.matrixWorld` is camera-relative like everything else in the pass, so
 * the camera's own altitude puts the answer back on the sea-level scale the
 * shader's sweep works in.
 */
export function casterTopAltitude(caster: THREE.Mesh, cameraAltitude: number): number | undefined {
    // An instanced caster's geometry bounds describe one instance sitting at
    // the group origin, which says nothing about where the instances are.
    // three keeps a box spanning all of them; that is the one to judge by.
    const instanced = caster as THREE.InstancedMesh;
    let bounds: THREE.Box3 | null;
    if (instanced.isInstancedMesh) {
        if (instanced.boundingBox === null) {
            instanced.computeBoundingBox();
        }
        bounds = instanced.boundingBox;
    } else {
        if (caster.geometry.boundingBox === null) {
            caster.geometry.computeBoundingBox();
        }
        bounds = caster.geometry.boundingBox;
    }
    // Geometry with no positions (or an instanced mesh with no instances) comes
    // back as an inside-out box rather than null, and its max is -Infinity.
    if (bounds === null || bounds.isEmpty()) {
        return undefined;
    }
    CASTER_BOX.copy(bounds).applyMatrix4(caster.matrixWorld);
    return CASTER_BOX.max.y + cameraAltitude;
}

/**
 * Whether a caster whose highest point is `topAltitude` metres above sea level
 * still sweeps a prism that fits inside {@link ShadowSettings.sweepMax}, with
 * the sun at `sunY` (= sin of its elevation).
 *
 * Sweep length goes as 1/sin(elevation), so a low sun is only a problem for
 * casters that are *high*: at 1 degree a hangar roof 10 m up sweeps under a
 * kilometre, while an aircraft 3 km up would ask for 170. Bounding it per
 * caster is what lets shadows survive the golden hour at all - the elevation
 * cutoff used to do this job for everything at once, and switched the hangar
 * off along with the aircraft.
 */
export function shadowSweepFits(topAltitude: number, sunY: number): boolean {
    return topAltitude + SHADOW_SETTINGS.sweepMargin <= SHADOW_SETTINGS.sweepMax * sunY;
}

/**
 * Stencil shadow volumes: every caster's silhouette is swept down-sun into a
 * closed prism, the prisms are counted into the stencil buffer with Carmack's
 * reverse (z-fail), and one screen-space pass stipples the shadow palette
 * colour wherever the count says a surface is inside one.
 *
 * Where a shadow map answers "is this fragment further from the sun than
 * whatever I recorded in this texel", which is only ever as exact as the texel
 * and the depth bias, the count here is geometric: a pixel is in shadow iff the
 * ray to it enters more shadow volumes than it leaves. That removes the entire
 * failure surface the cascades were built to manage — acne, peter-panning,
 * crawling edges, the resolution cliff at the cascade split, and shadows simply
 * ending where the far prism does. What it costs instead is CPU-side volume
 * geometry (built once per source geometry, 8× its size), two stencil draws
 * per caster, and the fill their prisms cover.
 *
 * Everything runs in the *camera-relative* space the main pass submits in
 * (world − camera position), reusing the caster objects' matrices as they were
 * drawn, so the volumes cannot disagree with the geometry that cast them.
 *
 * Order per frame, into the same target the scene was just drawn into:
 *  1. clear the stencil,
 *  2. count back faces that fail depth up, front faces that fail depth down,
 *  3. clear the count again on the casters' own surface, once per receiver
 *     class (see {@link SHADOW_RECEIVER_LAYER}),
 *  4. stipple every pixel left with a non-zero count.
 */
export class ShadowVolumePass {

    private readonly uniforms = {
        // Shared by reference with the sun: moving the time of day rewrites
        // SUN_DIRECTION in place and the volumes follow on the next frame.
        uSunDir: { value: SUN_DIRECTION },
        uSweep: { value: new THREE.Vector4() },
        uSnap: { value: new THREE.Vector3() },
    };
    private readonly overlayUniforms = {
        uShadowColor: { value: new THREE.Color() },
        uShadowTone: { value: new THREE.Vector2(0, 0) },
    };

    /** Back faces failing the depth test: the ray entered a volume. */
    private readonly countUp: THREE.ShaderMaterial;
    /** Front faces failing the depth test: it left one again. */
    private readonly countDown: THREE.ShaderMaterial;
    /** Clears a receiver's unlit facets, leaving its lit ones countable. */
    private readonly receiverMask: THREE.ShaderMaterial;
    /** Clears an airframe's visible surface outright. */
    private readonly wholesaleMask: THREE.ShaderMaterial;
    private readonly overlayMaterial: THREE.ShaderMaterial;

    private readonly volumeScene = new THREE.Scene();
    private readonly overlayScene = new THREE.Scene();
    private readonly overlayCamera = new THREE.Camera();
    /** Pooled stand-ins: one per caster drawn, matrices copied from the caster. */
    private readonly pool: THREE.Mesh[] = [];
    private used = 0;
    /** How many of the staged casters take shadows; the rest are masked out. */
    private receivers = 0;

    /** This frame's camera altitude and sun elevation, for the sweep test. */
    private cameraAltitude = 0;
    private sunY = 1;

    private readonly cache = new WeakMap<THREE.BufferGeometry, ShadowVolumeGeometry | null>();
    private readonly oversized = new WeakSet<THREE.BufferGeometry>();
    private builtVertices = 0;

    constructor() {
        const stencil: THREE.ShaderMaterialParameters = {
            vertexShader: VOLUME_VERTEX_PROGRAM,
            fragmentShader: VOLUME_FRAGMENT_PROGRAM,
            uniforms: this.uniforms,
            colorWrite: false,
            depthWrite: false,
            depthTest: true,
            // Coincident with the caster's own surface, the front cap must not
            // count: LessEqual lets it through as lit.
            depthFunc: THREE.LessEqualDepth,
            stencilWrite: true,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilRef: 0,
            stencilFail: THREE.KeepStencilOp,
            stencilZPass: THREE.KeepStencilOp,
        };
        this.countUp = new THREE.ShaderMaterial({
            ...stencil,
            side: THREE.BackSide,
            stencilZFail: THREE.IncrementWrapStencilOp,
        });
        this.countDown = new THREE.ShaderMaterial({
            ...stencil,
            side: THREE.FrontSide,
            stencilZFail: THREE.DecrementWrapStencilOp,
        });
        const mask: THREE.ShaderMaterialParameters = {
            vertexShader: MASK_VERTEX_PROGRAM,
            uniforms: this.uniforms,
            // Imported models are not reliably wound outwards, and an unlit
            // facet is worth masking whichever way it faces the camera.
            side: THREE.DoubleSide,
            colorWrite: false,
            depthWrite: false,
            depthTest: true,
            depthFunc: THREE.LessEqualDepth,
            // Backstop for a context without the logarithmic depth buffer,
            // where the fragment program cannot bias its own depth.
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -4,
            stencilWrite: true,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilRef: 0,
            stencilFail: THREE.KeepStencilOp,
            stencilZFail: THREE.KeepStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,
        };
        this.receiverMask = new THREE.ShaderMaterial({
            ...mask,
            fragmentShader: maskFragmentProgram(true),
        });
        this.wholesaleMask = new THREE.ShaderMaterial({
            ...mask,
            fragmentShader: maskFragmentProgram(false),
        });
        this.overlayMaterial = new THREE.ShaderMaterial({
            vertexShader: OVERLAY_VERTEX_PROGRAM,
            fragmentShader: OVERLAY_FRAGMENT_PROGRAM,
            uniforms: this.overlayUniforms,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            stencilWrite: true,
            stencilFunc: THREE.NotEqualStencilFunc,
            stencilRef: 0,
            stencilFail: THREE.KeepStencilOp,
            stencilZFail: THREE.KeepStencilOp,
            stencilZPass: THREE.KeepStencilOp,
        });

        this.volumeScene.matrixWorldAutoUpdate = false;

        // One oversized triangle in clip space; the vertex program ignores the
        // camera, so the scene needs no transform of any kind.
        const quad = new THREE.BufferGeometry();
        quad.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
        const overlay = new THREE.Mesh(quad, this.overlayMaterial);
        overlay.frustumCulled = false;
        this.overlayScene.add(overlay);
        this.overlayScene.matrixWorldAutoUpdate = false;
    }

    /** Applies the menu setting; OFF skips the pass entirely. */
    setQuality(quality: ShadowQualities): void {
        SHADOW_SETTINGS.enabled = quality !== ShadowQualities.OFF;
        if (SHADOW_SETTINGS.enabled) {
            SHADOW_SETTINGS.casterRange = SHADOW_CASTER_RANGES[quality];
        }
    }

    /**
     * Draws the shadows of everything on the caster layer under `roots` into the
     * currently bound target, which must already hold the depth buffer of the
     * pass being shadowed. `shadowColor` is the palette's shadow tone,
     * `sunStrength` the elevation fade (see SUN_STATE.shadowStrength), and
     * `snapping` whether the main pass quantised its vertices to the raster
     * grid, which the volumes have to match to land on the surfaces they came
     * from, and `cameraAltitude` the camera's own height above sea level, which
     * is what turns the camera-relative geometry back into altitudes for
     * {@link ShadowSettings.sweepMargin}.
     *
     * `roots` are expected to be the render lists as parented for the main
     * submit — i.e. offset by −camera position, with the camera at the origin.
     */
    render(renderer: THREE.WebGLRenderer, roots: THREE.Object3D[], camera: THREE.Camera,
        shadowColor: THREE.Color, sunStrength: number, snapping: boolean,
        cameraAltitude: number): void {

        this.used = 0;
        this.receivers = 0;
        this.builtVertices = 0;
        this.cameraAltitude = cameraAltitude;
        // The same floor the shader puts under the sun's elevation, so the two
        // agree about which prisms the clamp would have truncated. The caller
        // has already skipped the pass below the cutoff, so it only guards the
        // arithmetic here.
        this.sunY = Math.max(SUN_DIRECTION.y, SHADOW_MIN_SUN_Y);
        const range = SHADOW_SETTINGS.casterRange;
        for (const root of roots) {
            this.collect(root, range * range);
        }
        for (let i = this.used; i < this.pool.length; i++) {
            this.pool[i].visible = false;
        }
        if (this.used === 0) {
            this.publishStats(0, 0);
            return;
        }

        this.uniforms.uSweep.value.set(cameraAltitude, SHADOW_SETTINGS.sweepMargin,
            SHADOW_SETTINGS.sweepMin, SHADOW_SETTINGS.sweepMax);
        // Same half-viewport the main pass snapped against; see scene/utils.ts.
        const target = renderer.getRenderTarget();
        this.uniforms.uSnap.value.set(
            Math.floor((target?.width ?? renderer.domElement.width) * 0.5),
            Math.floor((target?.height ?? renderer.domElement.height) * 0.5),
            snapping ? 1 : 0);
        this.overlayUniforms.uShadowColor.value.copy(shadowColor);
        this.overlayUniforms.uShadowTone.value.set(
            SHADOW_SETTINGS.intensity, SHADOW_SETTINGS.stipple * sunStrength);

        // Nothing else in the frame uses the stencil, but the target's clear
        // happens on whichever layer got there first; start from a known zero.
        renderer.clear(false, false, true);

        // three resets renderer.info on every render() call, so the passes are
        // totalled as they go rather than differenced at the end.
        let calls = 0;
        let triangles = 0;
        const submit = (scene: THREE.Scene, view: THREE.Camera): void => {
            renderer.render(scene, view);
            calls += renderer.info.render.calls;
            triangles += renderer.info.render.triangles;
        };

        this.volumeScene.overrideMaterial = this.countUp;
        submit(this.volumeScene, camera);
        this.volumeScene.overrideMaterial = this.countDown;
        submit(this.volumeScene, camera);

        // The mask draws the casters' own surfaces, so the stand-ins swap to
        // the front caps for it, and it runs once per class: receivers keep
        // their lit facets' count, airframes lose the lot. Splitting it is what
        // lets a parked aircraft's shadow survive on the deck it sits on, since
        // a single pass over every caster would clear that deck along with the
        // aircraft. A class with nothing in it costs no submit.
        for (let i = 0; i < this.used; i++) {
            const mesh = this.pool[i];
            mesh.geometry = (mesh.userData.volume as ShadowVolumeGeometry).caps;
        }
        if (this.receivers > 0) {
            this.showOnly(true);
            this.volumeScene.overrideMaterial = this.receiverMask;
            submit(this.volumeScene, camera);
        }
        if (this.receivers < this.used) {
            this.showOnly(false);
            this.volumeScene.overrideMaterial = this.wholesaleMask;
            submit(this.volumeScene, camera);
        }
        this.volumeScene.overrideMaterial = null;
        for (let i = 0; i < this.used; i++) {
            this.pool[i].visible = true;
        }

        submit(this.overlayScene, this.overlayCamera);

        this.publishStats(calls, triangles);
    }

    /**
     * Leaves only the staged casters of one class visible, for a mask sub-pass.
     * Restored by the caller — the counting passes need them all back.
     */
    private showOnly(receivers: boolean): void {
        for (let i = 0; i < this.used; i++) {
            const stand = this.pool[i];
            stand.visible = (stand.userData.receives as boolean) === receivers;
        }
    }

    /** Walks a render list for caster meshes within range and stages them. */
    private collect(object: THREE.Object3D, rangeSquared: number): void {
        if (!object.visible) {
            return;
        }
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh && mesh.layers.isEnabled(SHADOW_CASTER_LAYER)) {
            CASTER_POSITION.setFromMatrixPosition(mesh.matrixWorld);
            // The lists are already camera-relative, so this is the distance
            // from the camera. Beyond it a shadow is a pixel or two, if that.
            if (CASTER_POSITION.lengthSq() <= rangeSquared && this.sweepFits(mesh)) {
                this.stage(mesh);
            }
        }
        for (const child of object.children) {
            this.collect(child, rangeSquared);
        }
    }

    /**
     * See {@link shadowSweepFits}. Skipping beats letting the shader's clamp
     * truncate the prism: a clamped one ends in mid-air, and its shadow stops
     * dead partway along the ground.
     */
    private sweepFits(caster: THREE.Mesh): boolean {
        const top = casterTopAltitude(caster, this.cameraAltitude);
        // No bounds to judge by; keep casting, as it always has.
        return top === undefined || shadowSweepFits(top, this.sunY);
    }

    private stage(caster: THREE.Mesh): void {
        const volume = this.volumeFor(caster.geometry);
        if (volume === null) {
            return;
        }
        let stand = this.pool[this.used];
        if (stand === undefined) {
            stand = new THREE.Mesh(volume.full, this.countUp);
            stand.matrixAutoUpdate = false;
            stand.matrixWorldAutoUpdate = false;
            // A prism reaches tens of kilometres past its bounding sphere, and
            // the caster's own culling has already had its say.
            stand.frustumCulled = false;
            this.pool.push(stand);
            this.volumeScene.add(stand);
        }
        const receives = receivesShadow(caster);
        stand.visible = true;
        stand.geometry = volume.full;
        stand.userData.volume = volume;
        stand.userData.receives = receives;
        stand.matrixWorld.copy(caster.matrixWorld);
        this.builtVertices += volume.vertices;
        this.used++;
        if (receives) {
            this.receivers++;
        }
    }

    private volumeFor(geometry: THREE.BufferGeometry): ShadowVolumeGeometry | null {
        const cached = this.cache.get(geometry);
        if (cached !== undefined) {
            return cached;
        }
        const position = geometry.getAttribute('position');
        const index = geometry.getIndex();
        const triangles = Math.floor((index !== null ? index.count : position?.count ?? 0) / 3);
        if (triangles > SHADOW_SETTINGS.maxCasterTriangles) {
            if (!this.oversized.has(geometry)) {
                this.oversized.add(geometry);
                console.warn(`Shadow volumes: skipping a ${triangles} triangle caster; `
                    + `the budget is ${SHADOW_SETTINGS.maxCasterTriangles} (__shadowSettings.maxCasterTriangles).`);
            }
            this.cache.set(geometry, null);
            return null;
        }
        const volume = buildShadowVolumeGeometry(geometry);
        this.cache.set(geometry, volume);
        return volume;
    }

    /** Dev aid, alongside globalThis.__drawStats: what the shadows cost. */
    private publishStats(calls: number, triangles: number): void {
        (globalThis as Record<string, unknown>).__shadowStats = {
            calls,
            triangles,
            casters: this.used,
            receivers: this.receivers,
            volumeVertices: this.builtVertices,
            range: SHADOW_SETTINGS.casterRange,
            sweep: [SHADOW_SETTINGS.sweepMin, SHADOW_SETTINGS.sweepMax],
        };
    }
}
