/**
 * Binds a decoded PTM1 tile to GPU buffers.
 *
 * This is the payoff for the format's layout: nothing here copies or
 * transforms vertex data. Quantised int16 positions are bound directly and
 * turned into metres by the mesh's scale; int8 normals are bound normalized
 * through an interleaved view that skips their pad byte. A tile goes from
 * bytes to drawable without touching a single vertex on the CPU, which is why
 * the runtime needs no mesh workers at all.
 *
 * Up to three meshes come out per tile — land, water and watercourse strokes —
 * because the streams have different vertex layouts. Water carries one draw
 * group per tone; land is a single group whose colour the shader resolves per
 * vertex from the baked cover attribute. The strokes are a centreline the
 * vertex program widens, so they need their own material as well as their own
 * attributes, and they are the one stream drawn after the surface rather than
 * as part of it.
 *
 * Tiles are placed by translation only, never rotation. The shaded vertex
 * program treats the normal attribute as world-space in the STATIC and DUOTONE
 * shading paths, so a rotated tile would shade wrong; the bake writes both
 * positions and normals in scene axes (x=east, y=up, z=south) for exactly this
 * reason. See `sceneFromEnu` for why z runs south.
 */

import * as THREE from 'three';
import { EnuBasis, ecefToEnu, geodeticToEcef, sceneFromEnu } from './geodesy';
import { PtmTile } from './ptm';
import { TileKey, tileBounds } from './tiling';
import { LAND_TONE_BASE, TerrainTone } from './tones';

export interface TileMeshes {
    group: THREE.Group;
    land?: THREE.Mesh;
    water?: THREE.Mesh;
    rivers?: THREE.Mesh;
    /** Bytes of GPU buffer, for the cache budget. */
    bytes: number;
}

/** Materials indexed by {@link TerrainTone}. */
export type ToneMaterials = readonly THREE.Material[];

function landGeometry(tile: PtmTile): THREE.BufferGeometry | undefined {
    const vertexCount = tile.landPositions.length / 3;
    if (vertexCount === 0) {
        return undefined;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tile.landPositions, 3));

    // Normals are stored xyz + one pad byte so each vertex stays 4-byte
    // aligned. Interleaving reads the three we want without repacking.
    const normalBuffer = new THREE.InterleavedBuffer(tile.landNormals as unknown as Int8Array, 4);
    g.setAttribute(
        'normal',
        new THREE.InterleavedBufferAttribute(normalBuffer, 3, 0, true),
    );

    // One buffer, two views: the colour wants normalising to 0..1, the class
    // index does not. Splitting them into separate attributes would mean two
    // uploads of data that is already interleaved on the wire.
    const attrBuffer = new THREE.InterleavedBuffer(tile.landAttrs, 4);
    g.setAttribute('coverColor', new THREE.InterleavedBufferAttribute(attrBuffer, 3, 0, true));
    g.setAttribute('coverClass', new THREE.InterleavedBufferAttribute(attrBuffer, 1, 3, false));

    // Land is one draw: the shader resolves colour per vertex from coverColor
    // and coverClass, so there is nothing left to bucket into tone groups.
    g.addGroup(0, vertexCount, LAND_TONE_BASE);
    return g;
}

function waterGeometry(tile: PtmTile): THREE.BufferGeometry | undefined {
    if (tile.waterIndices.length === 0) {
        return undefined;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tile.waterPositions, 3));
    g.setIndex(new THREE.BufferAttribute(tile.waterIndices, 1));
    for (let tone = 0; tone < tile.waterGroups.length; tone++) {
        const [start, count] = tile.waterGroups[tone];
        if (count > 0) {
            g.addGroup(start, count, tone);
        }
    }
    return g;
}

/**
 * The watercourse strokes: a centreline, doubled, plus what the vertex program
 * needs to widen it.
 *
 * Both vertices of a pair sit at the same position and differ only in
 * `riverDir`, so nothing here says how wide the ribbon is on screen — that is
 * settled per frame, in pixels, by RiverVertProgram.
 */
function riverGeometry(tile: PtmTile): THREE.BufferGeometry | undefined {
    if (tile.riverIndices.length === 0) {
        return undefined;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tile.riverPositions, 3));
    // Directions are stored xyz + one pad byte, like land normals, so each
    // vertex stays 4-byte aligned.
    const dirBuffer = new THREE.InterleavedBuffer(tile.riverDirections as unknown as Int8Array, 4);
    g.setAttribute('riverDir', new THREE.InterleavedBufferAttribute(dirBuffer, 3, 0, true));
    // Raw, not normalised: the shader wants decimetres, not a 0..1 fraction.
    g.setAttribute('riverHalf', new THREE.BufferAttribute(tile.riverHalfWidths, 1, false));
    g.setIndex(new THREE.BufferAttribute(tile.riverIndices, 1));
    return g;
}

/** Scene position of a tile's local frame origin. */
export function tileOriginWorld(
    id: TileKey, centerHeightM: number, basis: EnuBasis,
): THREE.Vector3 {
    const b = tileBounds(id);
    const lon = (b.west + b.east) / 2;
    const lat = (b.south + b.north) / 2;
    // Scene axes are x=east, y=up, z=south; see sceneFromEnu.
    return sceneFromEnu(ecefToEnu(basis, geodeticToEcef(lat, lon, centerHeightM)));
}

export function buildTileMeshes(
    tile: PtmTile,
    basis: EnuBasis,
    materials: ToneMaterials,
    riverMaterial?: THREE.Material,
    onBeforeRender?: THREE.Mesh['onBeforeRender'],
    /**
     * Rotation from the frame the tile was baked in into the one being drawn.
     * Identity whenever they are the same, which is every session flying in
     * the area the bake was centred on. See `enuFrameRotation`.
     */
    frameFix?: THREE.Quaternion,
): TileMeshes {
    const group = new THREE.Group();
    group.name = `tile:${tile.id.z}/${tile.id.x}/${tile.id.y}`;
    group.position.copy(tileOriginWorld(tile.id, tile.centerHeightM, basis));
    if (frameFix) {
        // Vertices are offsets from the tile centre in the bake's axes; the
        // position above is already in the drawing frame, so only the offsets
        // need turning. Normals ride along via the object's world matrix.
        group.quaternion.copy(frameFix);
    }
    // Positions are quantised; the mesh transform turns them into metres.
    // The scale must stay uniform: updateUniforms builds normalModelMatrix
    // from matrixWorld with getNormalMatrix (inverse transpose), so a
    // non-uniform scale would skew the baked world-space normals and wash out
    // the per-facet shading. See PtmTile.quantScale.
    group.scale.setScalar(tile.quantScale);

    let bytes = 0;
    const meshes: TileMeshes = { group, bytes: 0 };

    const lg = landGeometry(tile);
    if (lg) {
        const mesh = new THREE.Mesh(lg, materials as THREE.Material[]);
        mesh.frustumCulled = false;   // the quadtree already culled this tile
        if (onBeforeRender) {
            mesh.onBeforeRender = onBeforeRender;
        }
        group.add(mesh);
        meshes.land = mesh;
        bytes += tile.landPositions.byteLength + tile.landNormals.byteLength
            + tile.landAttrs.byteLength;
    }

    const wg = waterGeometry(tile);
    if (wg) {
        const mesh = new THREE.Mesh(wg, materials as THREE.Material[]);
        mesh.frustumCulled = false;
        if (onBeforeRender) {
            mesh.onBeforeRender = onBeforeRender;
        }
        group.add(mesh);
        meshes.water = mesh;
        bytes += tile.waterPositions.byteLength + tile.waterIndices.byteLength;
    }

    const rg = riverMaterial ? riverGeometry(tile) : undefined;
    if (rg) {
        const mesh = new THREE.Mesh(rg, riverMaterial);
        mesh.frustumCulled = false;
        // After the surface it lies on, always. The stroke is lifted off the
        // ground by the pixel floor rather than sunk into it, so it has to win
        // ties against the terrain it covers rather than lose them.
        mesh.renderOrder = 1;
        if (onBeforeRender) {
            mesh.onBeforeRender = onBeforeRender;
        }
        group.add(mesh);
        meshes.rivers = mesh;
        bytes += tile.riverPositions.byteLength + tile.riverDirections.byteLength
            + tile.riverHalfWidths.byteLength + tile.riverIndices.byteLength;
    }

    meshes.bytes = bytes;
    return meshes;
}

export function disposeTileMeshes(m: TileMeshes): void {
    m.land?.geometry.dispose();
    m.water?.geometry.dispose();
    m.rivers?.geometry.dispose();
    m.group.clear();
}
