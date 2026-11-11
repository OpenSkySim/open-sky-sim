import * as THREE from 'three';

/** GL types of the float arrays this cache handles (uniform{1,2,3,4}fv). */
const FLOAT_ARRAY_TYPES = new Set([0x1406, 0x8b50, 0x8b51, 0x8b52]);

interface UniformLike {
    size?: number;
    type?: number;
    cache?: unknown;
    seq?: UniformLike[];
    setValue: (gl: WebGL2RenderingContext, v: unknown, textures?: unknown) => void;
}

interface ProgramLike {
    isReady(): boolean;
    getUniforms(): { seq: UniformLike[] };
}

function sameFloats(a: Float32Array, b: Float32Array): boolean {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Skips re-sending unchanged float-array uniforms.
 *
 * three caches a single uniform's last value per program, but sends an array
 * uniform on every upload, and every shaded material asks for a full upload
 * per draw (uniformsNeedUpdate, see scene/utils.ts). The shared colour tables
 * (haze, vertex tones, terrain tones and swatches) change only with the
 * palette or the sun, yet went to GL six-plus times per draw: ~2 ms of a
 * 1080p frame. A uniform's value lives in its program, so remembering what
 * was last sent to that one location is exact.
 */
export class ArrayUniformCache {
    private readonly patched = new WeakSet<object>();
    private seen = -1;

    constructor(private readonly renderer: THREE.WebGLRenderer) {}

    /** Patches programs linked since the last call; cheap when there are none. */
    sync(): void {
        const programs = this.renderer.info.programs as unknown as ProgramLike[] | null;
        if (!programs || (globalThis as Record<string, unknown>).__debugNoArrayUniformCache) {
            return;
        }
        // Programs come and go, but almost never between two frames.
        let pending = false;
        for (let i = 0; i < programs.length; i++) {
            if (!this.patched.has(programs[i])) {
                pending = true;
                break;
            }
        }
        if (!pending && this.seen === programs.length) {
            return;
        }
        this.seen = programs.length;
        for (const program of programs) {
            // Never force a link that is still running: getUniforms would wait on it.
            if (this.patched.has(program) || !program.isReady()) {
                continue;
            }
            this.patched.add(program);
            this.patchList(program.getUniforms().seq);
        }
    }

    private patchList(seq: UniformLike[]): void {
        for (const u of seq) {
            if (u.seq) {
                this.patchList(u.seq);
            } else if (u.size !== undefined && u.size > 1 && u.type !== undefined && FLOAT_ARRAY_TYPES.has(u.type)
                && Array.isArray(u.cache)) {
                ArrayUniformCache.patch(u);
            }
        }
    }

    private static patch(u: UniformLike): void {
        const send = u.setValue;
        let last: Float32Array | undefined;
        u.setValue = function (this: UniformLike, gl, v, textures) {
            if (v instanceof Float32Array) {
                if (last !== undefined && last.length === v.length && sameFloats(last, v)) {
                    return;
                }
                if (last === undefined || last.length !== v.length) {
                    last = new Float32Array(v.length);
                }
                last.set(v);
            } else {
                // Vector3[] and friends: three flattens them on its own; no cache.
                last = undefined;
            }
            send.call(this, gl, v, textures);
        };
    }
}
