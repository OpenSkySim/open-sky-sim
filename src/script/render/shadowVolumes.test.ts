import * as THREE from 'three';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
    buildShadowVolumeGeometry, casterTopAltitude, ShadowVolumeGeometry, SHADOW_CASTER_LAYER,
    SHADOW_CASTER_RANGES, SHADOW_RECEIVER_LAYER, SHADOW_SETTINGS, shadowSweepFits,
    ShadowVolumePass, receivesShadow
} from './shadowVolumes';
import { SHADOW_MIN_SUN_Y } from '../scene/materials/shaders/sun';
import { ShadowQualities } from '../state/gameDefs';

function geometryFrom(positions: number[], index?: number[]): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    if (index !== undefined) {
        geometry.setIndex(index);
    }
    return geometry;
}

/**
 * Unit tetrahedron: closed and 2-manifold, wound outwards or (as plenty of
 * imported models are) inside out. Two of its faces sit exactly edge-on to a
 * sun straight overhead, which is the case that splits ties.
 */
function tetrahedron(inward: boolean = false): THREE.BufferGeometry {
    const faces = [
        0, 1, 2,
        0, 3, 1,
        1, 3, 2,
        0, 2, 3,
    ];
    if (inward) {
        for (let t = 0; t < 4; t++) {
            [faces[t * 3 + 1], faces[t * 3 + 2]] = [faces[t * 3 + 2], faces[t * 3 + 1]];
        }
    }
    return geometryFrom([
        0, 0, 0,
        1, 0, 0,
        0, 0, 1,
        0, 1, 0,
    ], faces);
}

/** Single triangle in the XZ plane, normal +Y: an open shell with three boundary edges. */
function sheet(): THREE.BufferGeometry {
    return geometryFrom([
        0, 0, 0,
        1, 0, 0,
        0, 0, -1,
    ]);
}

/**
 * Runs the vertex program's sweep on the CPU: every vertex whose face normal is
 * turned away from `sun` moves down-sun, exactly as the GPU does it.
 */
function sweep(volume: ShadowVolumeGeometry, sun: THREE.Vector3, extrude: number): number[] {
    const position = volume.full.getAttribute('position');
    const normal = volume.full.getAttribute('aFaceNormal');
    const out: number[] = [];
    for (let i = 0; i < position.count; i++) {
        const facing = normal.getX(i) * sun.x + normal.getY(i) * sun.y + normal.getZ(i) * sun.z;
        // Mirrors the vertex program, tie-break included.
        const d = (normal.getW(i) > 0.5 ? facing < 0 : facing <= 0) ? extrude : 0;
        out.push(
            position.getX(i) - sun.x * d,
            position.getY(i) - sun.y * d,
            position.getZ(i) - sun.z * d);
    }
    return out;
}

const QUANTUM = 1e-4;

function key(p: number[], v: number): string {
    return `${Math.round(p[v * 3] / QUANTUM)},${Math.round(p[v * 3 + 1] / QUANTUM)},${Math.round(p[v * 3 + 2] / QUANTUM)}`;
}

interface Closure {
    /** Every edge of the swept prism is walked as often one way as the other. */
    closed: boolean;
    /** Signed volume; positive means the faces are wound outwards. */
    signedVolume: number;
    faces: number;
}

/**
 * The property the stencil count depends on: once swept, the prism must be a
 * closed, outward-wound surface. Anything else — a missing side quad, an
 * inverted cap — leaks the count into pixels that are not in shadow.
 */
function inspect(swept: number[]): Closure {
    const directed = new Map<string, number>();
    let signedVolume = 0;
    let faces = 0;

    for (let t = 0; t * 9 < swept.length; t++) {
        const v = [t * 3, t * 3 + 1, t * 3 + 2];
        const a = new THREE.Vector3(swept[v[0] * 3], swept[v[0] * 3 + 1], swept[v[0] * 3 + 2]);
        const b = new THREE.Vector3(swept[v[1] * 3], swept[v[1] * 3 + 1], swept[v[1] * 3 + 2]);
        const c = new THREE.Vector3(swept[v[2] * 3], swept[v[2] * 3 + 1], swept[v[2] * 3 + 2]);
        const cross = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
        // Degenerate: a side quad whose two faces agree about the sun. It draws
        // nothing, so it is not part of the surface.
        if (cross.length() < 1e-9) {
            continue;
        }
        faces++;
        signedVolume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
        for (let e = 0; e < 3; e++) {
            const from = key(swept, v[e]);
            const to = key(swept, v[(e + 1) % 3]);
            directed.set(`${from}>${to}`, (directed.get(`${from}>${to}`) ?? 0) + 1);
        }
    }

    // Not "exactly twice": a silhouette edge is walled from both sides, so its
    // edges are walked twice each way. What has to hold is the balance.
    let closed = true;
    for (const [edge, count] of directed) {
        const [from, to] = edge.split('>');
        if ((directed.get(`${to}>${from}`) ?? 0) !== count) {
            closed = false;
            break;
        }
    }
    return { closed, signedVolume, faces };
}

const SUNS: [string, THREE.Vector3][] = [
    ['overhead', new THREE.Vector3(0, 1, 0)],
    ['low east', new THREE.Vector3(0.94, 0.34, 0)],
    ['behind and below the shell', new THREE.Vector3(-0.3, -0.8, 0.52).normalize()],
    ['oblique', new THREE.Vector3(0.4, 0.6, -0.69).normalize()],
];

describe('shadow volume geometry', () => {

    it('lays out front caps, back caps and one quad per edge', () => {
        const volume = buildShadowVolumeGeometry(tetrahedron());
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 4);
        // 4 faces × 2 caps × 3, plus a wall per face edge: 12 × 2 × 3.
        assert.strictEqual(volume.vertices, 24 + 72);
        assert.strictEqual(volume.full.getAttribute('position').count, 96);
        // The unlit mask draws the front caps alone, so they must come first.
        assert.deepStrictEqual(volume.caps.drawRange, { start: 0, count: 12 });
        assert.strictEqual(
            volume.caps.getAttribute('position'), volume.full.getAttribute('position'),
            'the mask shares the volume buffers rather than copying them');
    });

    it('sweeps a closed, outward-wound prism from a solid, at any sun angle', () => {
        // Which cap ends up on the surface swaps with the source winding, but
        // the prism is the same region either way — worth pinning, because
        // imported models are not reliably wound.
        for (const inward of [false, true]) {
            const volume = buildShadowVolumeGeometry(tetrahedron(inward));
            assert.ok(volume !== null);
            const wound = inward ? 'inside out' : 'outward';
            for (const [name, sun] of SUNS) {
                const state = inspect(sweep(volume, sun, 100));
                assert.ok(state.closed, `${name}, ${wound}: the swept prism leaks`);
                assert.ok(state.signedVolume > 0,
                    `${name}, ${wound}: prism wound inwards (${state.signedVolume})`);
                // A 100 m sweep of a tetrahedron whose silhouette is ~0.5 m².
                assert.ok(state.signedVolume > 10,
                    `${name}, ${wound}: nothing swept (${state.signedVolume})`);
            }
        }
    });

    it('closes the prism of an open shell too', () => {
        // Aircraft models are shells, not solids: an edge with no neighbour has
        // to behave as if the surface doubled back on itself.
        const volume = buildShadowVolumeGeometry(sheet());
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 1);
        assert.strictEqual(volume.vertices, 6 + 18);
        for (const [name, sun] of SUNS) {
            const state = inspect(sweep(volume, sun, 50));
            assert.ok(state.closed, `${name}: the swept shell leaks`);
            assert.ok(state.signedVolume > 0, `${name}: wound inwards (${state.signedVolume})`);
        }
    });

    it('collapses the quads that are not on the silhouette', () => {
        const volume = buildShadowVolumeGeometry(tetrahedron());
        assert.ok(volume !== null);
        // Every cap draws — half on the surface, half at the far end — but of
        // the twelve walls only the six along the silhouette (three edges, one
        // wall from each side) have any area.
        const state = inspect(sweep(volume, new THREE.Vector3(0, 1, 0), 100));
        assert.strictEqual(state.faces, 8 + 6 * 2);
    });

    it('welds split corners so a shared edge stops being a silhouette', () => {
        // Same two coplanar triangles, exported with duplicated corner vertices
        // — the usual glTF shape. Welded, the seam between them hinges and
        // collapses; unwelded it would read as two boundaries and sweep a wall
        // straight down the middle of a flat surface.
        const split = geometryFrom([
            0, 0, 0, 1, 0, 0, 0, 0, -1,
            1, 0, 0, 1, 0, -1, 0, 0, -1,
        ]);
        const volume = buildShadowVolumeGeometry(split);
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 2);

        const state = inspect(sweep(volume, new THREE.Vector3(0, 1, 0), 100));
        assert.ok(state.closed);
        // 4 caps, and walls on the 4 outer edges only.
        assert.strictEqual(state.faces, 4 + 4 * 2);
    });

    it('closes a prism over a seam three faces share', () => {
        // Imported airframes are full of these: two surfaces meeting a third
        // along one edge. Hinging any one of the three against another leaves
        // the odd one out with nothing to cancel against, and the prism opens
        // along the seam.
        const fan = geometryFrom([
            0, 0, 0, 4, 0, 0, 0, 0, -4,
            0, 0, 0, 4, 0, 0, 0, 3, 2,
            0, 0, 0, 4, 0, 0, 0, -3, 2,
        ]);
        const volume = buildShadowVolumeGeometry(fan);
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 3);
        for (const [name, sun] of SUNS) {
            const state = inspect(sweep(volume, sun, 80));
            assert.ok(state.closed, `${name}: the seam leaks`);
            assert.ok(state.signedVolume > 0, `${name}: wound inwards`);
        }
    });

    it('closes a prism over a face that was exported twice', () => {
        // The same triangle, same winding, twice over. Two faces share every
        // edge, so it looks manifold, but they walk each edge the same way
        // round and their caps cannot cancel each other.
        const doubled = geometryFrom([
            0, 0, 0, 3, 0, 0, 0, 0, -3,
            0, 0, 0, 3, 0, 0, 0, 0, -3,
        ]);
        const volume = buildShadowVolumeGeometry(doubled);
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 2);
        for (const [name, sun] of SUNS) {
            const state = inspect(sweep(volume, sun, 80));
            assert.ok(state.closed, `${name}: the duplicate leaks`);
            assert.ok(state.signedVolume > 0, `${name}: wound inwards`);
        }
    });

    it('drops faces with no area, and geometry with nothing left', () => {
        const withSliver = geometryFrom([
            0, 0, 0, 1, 0, 0, 0, 0, -1,
            // Zero-area: two corners on top of each other.
            5, 0, 0, 6, 0, 0, 6, 0, 0,
        ]);
        const volume = buildShadowVolumeGeometry(withSliver);
        assert.ok(volume !== null);
        assert.strictEqual(volume.triangles, 1);

        assert.strictEqual(buildShadowVolumeGeometry(geometryFrom([])), null);
        assert.strictEqual(buildShadowVolumeGeometry(new THREE.BufferGeometry()), null);
    });

    it('reads an index buffer and a raw triangle soup the same way', () => {
        const indexed = buildShadowVolumeGeometry(tetrahedron());
        const soup = geometryFrom([
            0, 0, 0, 0, 0, 1, 1, 0, 0,
            0, 0, 0, 1, 0, 0, 0, 1, 0,
            1, 0, 0, 0, 0, 1, 0, 1, 0,
            0, 0, 0, 0, 1, 0, 0, 0, 1,
        ]);
        const unindexed = buildShadowVolumeGeometry(soup);
        assert.ok(indexed !== null && unindexed !== null);
        assert.strictEqual(unindexed.triangles, indexed.triangles);
        assert.strictEqual(unindexed.vertices, indexed.vertices);
    });
});

describe('shadow quality', () => {

    it('buys reach, monotonically', () => {
        assert.strictEqual(SHADOW_CASTER_RANGES[ShadowQualities.OFF], 0);
        assert.ok(SHADOW_CASTER_RANGES[ShadowQualities.LOW] < SHADOW_CASTER_RANGES[ShadowQualities.MEDIUM]);
        assert.ok(SHADOW_CASTER_RANGES[ShadowQualities.MEDIUM] < SHADOW_CASTER_RANGES[ShadowQualities.HIGH]);
        assert.ok(SHADOW_CASTER_RANGES[ShadowQualities.HIGH] < SHADOW_CASTER_RANGES[ShadowQualities.ULTRA]);
    });

    it('keeps the last range when switched off, so switching back is free', () => {
        const pass = new ShadowVolumePass();
        try {
            pass.setQuality(ShadowQualities.HIGH);
            assert.strictEqual(SHADOW_SETTINGS.enabled, true);
            assert.strictEqual(SHADOW_SETTINGS.casterRange, SHADOW_CASTER_RANGES[ShadowQualities.HIGH]);

            pass.setQuality(ShadowQualities.OFF);
            assert.strictEqual(SHADOW_SETTINGS.enabled, false);
            assert.strictEqual(SHADOW_SETTINGS.casterRange, SHADOW_CASTER_RANGES[ShadowQualities.HIGH]);
        } finally {
            pass.setQuality(ShadowQualities.MEDIUM);
        }
    });
});

describe('receiver split', () => {

    it('shadows a hull and spares an airframe', () => {
        const deck = new THREE.Mesh();
        deck.layers.enable(SHADOW_RECEIVER_LAYER);
        const airframe = new THREE.Mesh();

        assert.strictEqual(receivesShadow(deck), true);
        // Without this the parked aircraft's shadow would be cleared off the
        // deck along with the aircraft's own surface: one mask, every caster.
        assert.strictEqual(receivesShadow(airframe), false);
    });

    it('takes the caster layer alone as no answer either way', () => {
        const caster = new THREE.Mesh();
        caster.layers.enable(SHADOW_CASTER_LAYER);
        assert.strictEqual(receivesShadow(caster), false);
    });

    it('lets selfShadow override the layer for everything at once', () => {
        const airframe = new THREE.Mesh();
        SHADOW_SETTINGS.selfShadow = true;
        try {
            assert.strictEqual(receivesShadow(airframe), true);
        } finally {
            SHADOW_SETTINGS.selfShadow = false;
        }
    });
});

describe('caster sweep bound', () => {

    /** sin() of an elevation in degrees, i.e. the sun's Y in ENU. */
    const sunY = (deg: number) => Math.sin(deg * Math.PI / 180);

    it('keeps a low caster casting right down to the cutoff', () => {
        // The whole point of item 7: a hangar roof does not stop casting just
        // because the sun got low. Its shadow is at its longest there.
        assert.ok(shadowSweepFits(10, SHADOW_MIN_SUN_Y), 'a 10 m roof at the cutoff');
        assert.ok(shadowSweepFits(10, sunY(3)));
        assert.ok(shadowSweepFits(10, sunY(30)));
    });

    it('drops a caster whose prism would outrun the sweep clamp', () => {
        // A clamped prism ends in mid-air and its shadow stops dead partway
        // along the ground, so the caster is skipped instead.
        const high = SHADOW_SETTINGS.sweepMax;
        assert.ok(!shadowSweepFits(high, sunY(3)), 'far too high for a 3 degree sun');
        // ...and the same caster is fine with the sun up.
        assert.ok(shadowSweepFits(high * 0.5, sunY(60)));
    });

    it('bounds per caster, not per time of day', () => {
        // Same sun, opposite answers: which is what the elevation cutoff could
        // not express, and why it had to switch everything off at once.
        const low = sunY(2);
        assert.ok(shadowSweepFits(20, low), 'a roof still casts');
        assert.ok(!shadowSweepFits(3000, low), 'an aircraft at altitude does not');
    });

    it('scales the ceiling with the sun, sweep for sweep', () => {
        // The bound is a sweep length, so halving sin(elevation) has to halve
        // the altitude a caster can cast from.
        const ceiling = (deg: number) => {
            let top = 0;
            while (shadowSweepFits(top + 1, sunY(deg))) top++;
            return top;
        };
        const high = ceiling(30);
        const half = ceiling(14.478); // sin() half that of 30 degrees
        assert.ok(Math.abs(half / high - 0.5) < 0.02, `${half} vs ${high}`);
    });
});

describe('casterTopAltitude', () => {

    const meshAt = (y: number, halfHeight: number) => {
        const geometry = new THREE.BoxGeometry(2, 2 * halfHeight, 2);
        const mesh = new THREE.Mesh(geometry);
        mesh.position.set(0, y, 0);
        mesh.updateMatrixWorld(true);
        return mesh;
    };

    it('measures the top corner, not the origin', () => {
        // A caster is judged by how high it reaches, so a tall one sitting on
        // the ground has to read as tall.
        assert.strictEqual(casterTopAltitude(meshAt(0, 15), 0), 15);
    });

    it('puts the camera-relative lists back on the sea-level scale', () => {
        // The pass works in camera-relative space; the sweep works in altitude.
        assert.strictEqual(casterTopAltitude(meshAt(-100, 5), 2000), 1905);
    });

    it('spans every instance of an instanced caster', () => {
        // Geometry bounds describe one instance at the group origin, which says
        // nothing about where the instances actually sit.
        const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2, 2), undefined, 2);
        mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0, 0));
        mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0, 500, 0));
        mesh.updateMatrixWorld(true);
        assert.strictEqual(casterTopAltitude(mesh, 0), 501);
    });

    it('keeps casting when there are no bounds to judge by', () => {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry());
        mesh.updateMatrixWorld(true);
        assert.strictEqual(casterTopAltitude(mesh, 0), undefined);
    });
});
