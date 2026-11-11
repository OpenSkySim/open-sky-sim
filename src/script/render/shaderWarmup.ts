import * as THREE from 'three';

/**
 * A mesh waits at most this long for its program before it is drawn anyway
 * (three then blocks on the link, as it would have without the warm-up).
 */
const MAX_HOLD_MS = 3000;

interface ReadyCheck {
    isReady(): boolean;
}

interface Held {
    readonly object: THREE.Object3D;
    readonly programs: ReadyCheck[];
    readonly since: number;
}

type Drawable = THREE.Mesh | THREE.Points | THREE.Line | THREE.Sprite;

function isDrawable(o: THREE.Object3D): o is Drawable {
    const d = o as Partial<Record<'isMesh' | 'isPoints' | 'isLine' | 'isSprite', boolean>>;
    return d.isMesh === true || d.isPoints === true || d.isLine === true || d.isSprite === true;
}

/**
 * Keeps first-time shader links off the frame.
 *
 * three links a new program the first time something draws with it, and the
 * first draw waits for the link: 100-800 ms under ANGLE, one hitch per new
 * variant (a tile kind, a batch, an effect) mid-flight. Before each scene
 * pass this looks at the drawables it has not seen yet and has three start
 * their programs (`renderer.compile`; with KHR_parallel_shader_compile the
 * driver links them on its own threads). A drawable whose program is still
 * linking is left out of the passes until `isReady()`, a few frames later,
 * instead of stalling the whole frame on it.
 *
 * Hiding is per pass (`visible` saved and put back around the draw), so it
 * never fights culling or the tile batcher's layers. Nothing in this game
 * uses three's lights or clipping planes, so a compile against an empty scene
 * builds the same program the draw will ask for.
 */
export class ShaderWarmup {
    /** The material (and its version) each drawable was last checked with. */
    private readonly checked = new WeakMap<THREE.Object3D, THREE.Material>();
    private readonly checkedVersion = new WeakMap<THREE.Object3D, number>();
    private readonly held = new Map<THREE.Object3D, Held>();
    private readonly hidden: THREE.Object3D[] = [];
    private readonly lightless = new THREE.Scene();
    private readonly parallel: boolean;
    private camera: THREE.Camera | undefined;

    /** Dev counters: drawables held back, and those released by the timeout. */
    heldTotal = 0;
    timedOut = 0;

    constructor(private readonly renderer: THREE.WebGLRenderer) {
        this.parallel = renderer.extensions.has('KHR_parallel_shader_compile');
    }

    /** Call right before `renderer.render(root, camera)`, with the target bound. */
    begin(root: THREE.Object3D, camera: THREE.Camera): void {
        if (!this.parallel || (globalThis as Record<string, unknown>).__debugNoShaderWarmup) {
            return;
        }
        this.release(performance.now());
        this.camera = camera;
        this.visit(root);
        for (const h of this.held.values()) {
            if (h.object.visible) {
                h.object.visible = false;
                this.hidden.push(h.object);
            }
        }
    }

    /** Call right after the render that `begin` prepared. */
    end(): void {
        for (const o of this.hidden) {
            o.visible = true;
        }
        this.hidden.length = 0;
    }

    private visit(o: THREE.Object3D): void {
        if (!o.visible) {
            return;
        }
        if (isDrawable(o) && o.layers.mask !== 0 && !this.held.has(o)) {
            const m = Array.isArray(o.material) ? o.material[0] : o.material;
            if (m && (this.checked.get(o) !== m || this.checkedVersion.get(o) !== m.version)) {
                this.check(o, m);
            }
        }
        const children = o.children;
        for (let i = 0; i < children.length; i++) {
            this.visit(children[i]);
        }
    }

    private check(o: Drawable, m: THREE.Material): void {
        const camera = this.camera;
        if (!camera) {
            return;
        }
        const materials = this.renderer.compile(o, camera, this.lightless);
        const programs: ReadyCheck[] = [];
        for (const mat of materials) {
            const program = (this.renderer.properties.get(mat) as { currentProgram?: ReadyCheck }).currentProgram;
            if (program && !program.isReady()) {
                programs.push(program);
            }
        }
        if (programs.length === 0) {
            this.markChecked(o, m);
            return;
        }
        this.held.set(o, { object: o, programs, since: performance.now() });
        this.heldTotal++;
    }

    private release(now: number): void {
        for (const [o, h] of this.held) {
            const late = now - h.since > MAX_HOLD_MS;
            if (late || h.programs.every(p => p.isReady())) {
                this.held.delete(o);
                if (late) {
                    this.timedOut++;
                }
                const d = o as Drawable;
                const m = Array.isArray(d.material) ? d.material[0] : d.material;
                if (m) {
                    this.markChecked(o, m);
                }
            }
        }
    }

    private markChecked(o: THREE.Object3D, m: THREE.Material): void {
        this.checked.set(o, m);
        this.checkedVersion.set(o, m.version);
    }
}
