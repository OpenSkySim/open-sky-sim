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
 * different vertex layouts. Each carries one draw group per tone, so a tile is
 * at most five draws, matching what the old system did.
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
import { TerrainTone } from './tones';

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

    for (let slot = 0; slot < tile.landGroups.length; slot++) {
        const [start, count] = tile.landGroups[slot];
        if (count > 0) {
            g.addGroup(start, count, TerrainTone.Sand + slot);
        }
    }
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
): TileMeshes {
    const group = new THREE.Group();
    group.name = `tile:${tile.id.z}/${tile.id.x}/${tile.id.y}`;
    group.position.copy(tileOriginEnu(tile.id, tile.centerHeightM, basis));
    // Positions are quantised; the mesh transform is what turns them into
    // metres. The scale is deliberately non-uniform (horizontal and vertical
    // quantise independently) — updateUniforms builds normalModelMatrix from
    // matrixWorld with getNormalMatrix, so shading stays correct.
    group.scale.set(tile.quantScaleXZ, tile.quantScaleY, tile.quantScaleXZ);

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
        bytes += tile.landPositions.byteLength + tile.landNormals.byteLength;
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
