import * as THREE from 'three';
import { ShadowQualities } from '../state/gameDefs';
import { SHADOW_ALPHA_DITHER } from '../scene/entities/aircraftShadow';
import { SUN_DIRECTION } from '../scene/materials/shaders/sun';

/**
 * Object3D layer carrying the shadow casters. Enabled on solid model meshes
 * (aircraft, hangars, towers, the carrier hull…) by the model manager; the sun
 * camera renders that layer only, so decals, FX, particles, impostors and the
 * terrain never enter the depth pass.
 */
export const SHADOW_CASTER_LAYER = 1;

export interface ShadowSettings {
    enabled: boolean;
    /** Near cascade resolution (square); see {@link SHADOW_MAP_SIZES}. */
    mapSize: number;
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
    /** Depth bias in metres, applied along the sun ray to kill self-shadow acne. */
    biasMeters: number;
}

export const SHADOW_SETTINGS: ShadowSettings = {
    enabled: true,
    mapSize: 2048,
    intensity: 1.0,
    stipple: SHADOW_ALPHA_DITHER,
    biasMeters: 0.75,
};

/**
 * Near cascade resolution per menu setting (OFF keeps whatever is allocated).
 *
 * These are large: each map is RGBA8 plus a depth buffer, so ULTRA asks the
 * driver for ~1 GB + ~1 GB for the near cascade alone.
 * {@link Renderer.setShadowQuality} clamps to the GPU's maximum texture size,
 * but there is no way to detect a VRAM refusal short of losing the context, so
 * the top tiers are a deliberate "if your card can take it" choice. The
 * cascades exist so you do not have to reach for them.
 */
export const SHADOW_MAP_SIZES: Record<ShadowQualities, number> = {
    [ShadowQualities.OFF]: 2048,
    [ShadowQualities.LOW]: 2048,
    [ShadowQualities.MEDIUM]: 4096,
    [ShadowQualities.HIGH]: 8192,
    [ShadowQualities.ULTRA]: 16384,
};

/**
 * The far cascade tracks the near one's resolution up to here. Past it the
 * extra texels land on ground kilometres away, where a shadow is a few pixels
 * wide, so they would be pure VRAM.
 */
export const FAR_CASCADE_MAX_SIZE = 8192;

// Dev aid: tweak or disable shadows live from the console. Every field is read
// per frame, so `__shadowSettings.enabled = false` restores the old planform
// silhouettes on the next one.
(globalThis as Record<string, unknown>).__shadowSettings = SHADOW_SETTINGS;

/**
 * Half-extent of the near cascade (metres). Sized to hold the aircraft, its own
 * shadow and the deck / runway around it while the ground is close; above
 * roughly 290 m the ground below leaves it and the far cascade takes over.
 */
const NEAR_RADIUS = 192;
/** Half-extent of the far cascade at sea level (metres). */
const FAR_RADIUS_MIN = 384;
/** Far half-extent cap, reached at high altitude. */
const FAR_RADIUS_MAX = 1536;
/**
 * Extra far half-extent per metre of camera altitude. The prism is centred on
 * the camera, so the ground below it sits `altitude · cos(sun elevation)` ≈
 * 0.65 · altitude off the prism axis; anything less than that and an aircraft
 * in the air would look down at unshadowed ground.
 */
const FAR_RADIUS_PER_ALTITUDE = 0.8;
/** Far half-extent quantum: keeps the prism (and so the texel grid) stable frame to frame. */
const FAR_RADIUS_STEP = 128;
/** Half depth of the prism along the sun ray (metres). */
const HALF_DEPTH = 8000;
/** Texel footprint {@link ShadowSettings.biasMeters} was tuned against (metres). */
const REFERENCE_TEXEL_M = 0.5;
/** Bias floor / ceiling in metres, whatever the texel footprint works out to. */
const MIN_BIAS_M = 0.08;
const MAX_BIAS_M = 1.5;

const CASTER_VERTEX_PROGRAM = `
  precision highp float;

  void main() {
  #ifdef USE_INSTANCING
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  #else
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #endif
  }
`;

const CASTER_FRAGMENT_PROGRAM = `
  precision highp float;
#include <packing>
  void main() {
    gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
  }
`;

/** What a receiving material needs to sample one cascade. */
export interface ShadowCascadeView {
    readonly texture: THREE.Texture;
    /** bias · projection · view, mapping camera-relative world space to [0,1]³. */
    readonly matrix: THREE.Matrix4;
    /** Texel size in map UV units, for the receiver's PCF taps. */
    readonly texelSize: number;
    /** Depth bias in normalised map units. */
    readonly depthBias: number;
}

const BIAS_MATRIX = new THREE.Matrix4().set(
    0.5, 0.0, 0.0, 0.5,
    0.0, 0.5, 0.0, 0.5,
    0.0, 0.0, 0.5, 0.5,
    0.0, 0.0, 0.0, 1.0);

/**
 * One sun-aligned orthographic depth prism. Two of these make the cascade pair:
 * a tight one around the aircraft and a wide one for everything else in view.
 */
class ShadowCascade implements ShadowCascadeView {

    private readonly target: THREE.WebGLRenderTarget;
    private readonly center = new THREE.Vector3();
    readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2 * HALF_DEPTH);
    readonly matrix = new THREE.Matrix4();
    /** Half-extent of the prism cross-section (metres), from the last placement. */
    radius = 0;
    private size: number;
    /** World size of one shadow texel (metres), from the last placement. */
    private texelWorld = REFERENCE_TEXEL_M;

    constructor(mapSize: number) {
        this.size = mapSize;
        this.target = new THREE.WebGLRenderTarget(mapSize, mapSize, {
            // Packed 24-bit depth in RGBA8: filtering would blend unrelated
            // bytes, so both filters must stay nearest.
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false,
        });
        this.target.texture.generateMipmaps = false;
        this.camera.matrixAutoUpdate = false;
        this.camera.layers.set(SHADOW_CASTER_LAYER);
    }

    get texture(): THREE.Texture {
        return this.target.texture;
    }

    get mapSize(): number {
        return this.size;
    }

    get texelSize(): number {
        return 1 / this.size;
    }

    /**
     * Depth bias in normalised map units, scaled to this cascade's texel
     * footprint: acne comes from depth varying across a texel, so the near
     * cascade (and any high-resolution tier) needs far less bias than a coarse
     * map — and holding the coarse value there would visibly detach shadows
     * from what casts them.
     */
    get depthBias(): number {
        const meters = THREE.MathUtils.clamp(
            SHADOW_SETTINGS.biasMeters * this.texelWorld / REFERENCE_TEXEL_M,
            MIN_BIAS_M, MAX_BIAS_M);
        return meters / (2 * HALF_DEPTH);
    }

    setMapSize(mapSize: number): void {
        if (mapSize === this.size) {
            return;
        }
        this.size = mapSize;
        this.target.setSize(mapSize, mapSize);
    }

    /**
     * Centres the prism on the camera at the given half-extent and refreshes
     * {@link matrix}. `cameraPosition` is absolute ENU (the scene is rebased
     * around it); the centre is snapped to a world-space texel grid so shadow
     * edges stay put instead of crawling as the aircraft moves.
     */
    place(cameraPosition: THREE.Vector3, radius: number, axisX: THREE.Vector3, axisY: THREE.Vector3): void {
        this.radius = radius;
        this.texelWorld = 2 * radius / this.size;

        // Snap the absolute centre to the light-space texel grid, then express
        // it camera-relative again (the centre *is* the camera, so the
        // camera-relative centre is just the snap correction).
        const snapX = Math.round(cameraPosition.dot(axisX) / this.texelWorld) * this.texelWorld
            - cameraPosition.dot(axisX);
        const snapY = Math.round(cameraPosition.dot(axisY) / this.texelWorld) * this.texelWorld
            - cameraPosition.dot(axisY);
        this.center.set(0, 0, 0)
            .addScaledVector(axisX, snapX)
            .addScaledVector(axisY, snapY);

        this.camera.left = -radius;
        this.camera.right = radius;
        this.camera.top = radius;
        this.camera.bottom = -radius;
        this.camera.updateProjectionMatrix();

        this.camera.matrix.makeBasis(axisX, axisY, SUN_DIRECTION);
        this.camera.matrix.setPosition(
            this.center.x + SUN_DIRECTION.x * HALF_DEPTH,
            this.center.y + SUN_DIRECTION.y * HALF_DEPTH,
            this.center.z + SUN_DIRECTION.z * HALF_DEPTH);
        this.camera.matrixWorld.copy(this.camera.matrix);
        this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();

        this.matrix.copy(BIAS_MATRIX)
            .multiply(this.camera.projectionMatrix)
            .multiply(this.camera.matrixWorldInverse);
    }

    /** Draws whatever of `scene` is on the caster layer into this cascade. */
    renderInto(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
        renderer.setRenderTarget(this.target);
        // White unpacks to the far plane: anything not drawn stays lit.
        renderer.setClearColor(0xffffff, 1);
        renderer.clear(true, true, false);
        renderer.render(scene, this.camera);
    }
}

/**
 * Renders the shadow casters into two sun-aligned orthographic depth prisms and
 * hands both lookups to the scene materials.
 *
 * Everything here works in the *camera-relative* space the main pass submits in
 * (world − camera position), so the matrices the receivers use are the ones
 * built from these cameras as-is. Both prisms are centred on the camera and
 * extend far along the sun ray in either direction: a caster and the ground its
 * shadow lands on are always on the same ray, so a shadow falling inside a
 * cascade always has its caster inside that same cascade, however high the
 * aircraft is flying.
 *
 * The split is what buys the resolution. One prism has to be wide enough to
 * reach the ground below at altitude, which spends almost all its texels on
 * ground nobody is looking at closely. The near cascade re-covers the ~400 m
 * around the aircraft at the same resolution, so contact shadows stay crisp
 * without a map four times the size.
 */
export class ShadowMapPass {

    private readonly casterMaterial: THREE.ShaderMaterial;
    /** Light-space basis: X/Y span the prism cross-section, Z is the sun direction. */
    private readonly axisX = new THREE.Vector3();
    private readonly axisY = new THREE.Vector3();

    /** Tight cascade around the aircraft; sampled first. */
    readonly near: ShadowCascade;
    /** Wide cascade, altitude-scaled; the fallback for everything else in view. */
    readonly far: ShadowCascade;

    constructor(mapSize: number = SHADOW_SETTINGS.mapSize) {
        this.near = new ShadowCascade(mapSize);
        this.far = new ShadowCascade(Math.min(mapSize, FAR_CASCADE_MAX_SIZE));

        this.casterMaterial = new THREE.ShaderMaterial({
            vertexShader: CASTER_VERTEX_PROGRAM,
            fragmentShader: CASTER_FRAGMENT_PROGRAM,
            // With depth testing the map keeps the surface nearest the sun
            // either way, so drawing both sides only adds the single-sided
            // sheets some imported models are built from.
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true,
            uniforms: {},
        });

        // Fixed sun ⇒ fixed light basis; only the translation moves per frame.
        const up = Math.abs(SUN_DIRECTION.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        this.axisX.crossVectors(up, SUN_DIRECTION).normalize();
        this.axisY.crossVectors(SUN_DIRECTION, this.axisX).normalize();
    }

    /** Applies a menu resolution: the near cascade takes it, the far one is capped. */
    setMapSize(mapSize: number): void {
        this.near.setMapSize(mapSize);
        this.far.setMapSize(Math.min(mapSize, FAR_CASCADE_MAX_SIZE));
    }

    /**
     * Places both cascades for a scene rebased around `cameraPosition` (the
     * absolute ENU camera position).
     *
     * Split out of {@link render} so the placement can be tested without a GL
     * context.
     */
    updateCamera(cameraPosition: THREE.Vector3): void {
        this.near.place(cameraPosition, NEAR_RADIUS, this.axisX, this.axisY);
        this.far.place(cameraPosition, this.farRadiusFor(cameraPosition.y), this.axisX, this.axisY);
    }

    /** Draws every caster in `scene` into both cascades. */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, cameraPosition: THREE.Vector3): void {
        this.updateCamera(cameraPosition);

        const previousTarget = renderer.getRenderTarget();
        const previousOverride = scene.overrideMaterial;
        scene.overrideMaterial = this.casterMaterial;

        this.near.renderInto(renderer, scene);
        const nearCalls = renderer.info.render.calls;
        const nearTriangles = renderer.info.render.triangles;
        this.far.renderInto(renderer, scene);

        // Dev aid, alongside globalThis.__drawStats: what the sun passes cost
        // and how wide each prism currently is.
        (globalThis as Record<string, unknown>).__shadowStats = {
            calls: nearCalls + renderer.info.render.calls,
            triangles: nearTriangles + renderer.info.render.triangles,
            nearCalls,
            farCalls: renderer.info.render.calls,
            nearRadius: this.near.radius,
            farRadius: this.far.radius,
            mapSize: `${this.near.mapSize}+${this.far.mapSize}`,
        };

        scene.overrideMaterial = previousOverride;
        renderer.setRenderTarget(previousTarget);
    }

    private farRadiusFor(altitude: number): number {
        const raw = FAR_RADIUS_MIN + FAR_RADIUS_PER_ALTITUDE * Math.max(0, altitude);
        const stepped = Math.round(raw / FAR_RADIUS_STEP) * FAR_RADIUS_STEP;
        return THREE.MathUtils.clamp(stepped, FAR_RADIUS_MIN, FAR_RADIUS_MAX);
    }
}
