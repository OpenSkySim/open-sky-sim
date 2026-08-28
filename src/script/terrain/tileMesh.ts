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
 * Two meshes come out per tile — land and water — because the streams have
 * different vertex layouts. Water carries one draw group per tone; land is a
 * single group whose colour the shader resolves per vertex from the baked
 * cover attribute, so a tile is at most three draws.
 *
 * Tiles are placed by translation only, never rotation. The shaded vertex
 * program treats the normal attribute as world-space in the STATIC and DUOTONE
 * shading paths, so a rotated tile would shade wrong; the bake writes normals
 * in global ENU for exactly this reason.
 */

import * as THREE from 'three';
import { EnuBasis, ecefToEnu, geodeticToEcef } from './geodesy';
import { PtmTile } from './ptm';
import { TileKey, tileBounds } from './tiling';
import { LAND_TONE_BASE, TerrainTone } from './tones';

export interface TileMeshes {
    group: THREE.Group;
    land?: THREE.Mesh;
    water?: THREE.Mesh;
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

/** ENU position of a tile's local frame origin. */
export function tileOriginEnu(
    id: TileKey, centerHeightM: number, basis: EnuBasis,
): THREE.Vector3 {
    const b = tileBounds(id);
    const lon = (b.west + b.east) / 2;
    const lat = (b.south + b.north) / 2;
    const enu = ecefToEnu(basis, geodeticToEcef(lat, lon, centerHeightM));
    // Scene axes are x=east, y=up, z=north.
    return new THREE.Vector3(enu.e, enu.u, enu.n);
}

export function buildTileMeshes(
    tile: PtmTile,
    basis: EnuBasis,
    materials: ToneMaterials,
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
    group.position.copy(tileOriginEnu(tile.id, tile.centerHeightM, basis));
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

    meshes.bytes = bytes;
    return meshes;
}

export function disposeTileMeshes(m: TileMeshes): void {
    m.land?.geometry.dispose();
    m.water?.geometry.dispose();
    m.group.clear();
}
