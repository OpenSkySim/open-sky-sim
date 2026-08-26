import * as THREE from 'three';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { SceneMaterialManager, SceneMaterialPrimitiveType } from './materials';
import { HDNoonPalette } from '../../config/palettes/hd-noon';
import { PaletteCategory } from '../../config/palettes/palette';
import { DisplayShading, FogQuality } from '../../config/profiles/profile';

function manager(): SceneMaterialManager {
    return new SceneMaterialManager(HDNoonPalette, FogQuality.HIGH, DisplayShading.FULL);
}

function receivesShadow(material: THREE.Material): boolean {
    return (material as THREE.ShaderMaterial).defines?.RECEIVE_SHADOW !== undefined;
}

describe('shadow receivers', () => {

    it('projects the shadow map onto terrain, water and scenery', () => {
        const materials = manager();
        const land = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.TERRAIN_GRASS,
            shaded: true,
            depthWrite: true,
        });
        const water = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.TERRAIN_WATER,
            shaded: false,
            highp: true,
            depthWrite: true,
        });
        const building = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.SCENERY_BUILDING_METAL,
            shaded: true,
            depthWrite: true,
        });

        assert.ok(receivesShadow(land));
        assert.ok(receivesShadow(water));
        assert.ok(receivesShadow(building));
    });

    it('leaves airframes out: an aircraft casts but never shadows itself', () => {
        const materials = manager();
        for (const category of [
            PaletteCategory.VEHICLE_PLANE_GREY,
            PaletteCategory.VEHICLE_PLANE_NAVY,
            PaletteCategory.VEHICLE_PLANE_ENGINE,
            PaletteCategory.GLASS,
        ]) {
            const skin = materials.build({
                type: SceneMaterialPrimitiveType.MESH,
                category,
                shaded: true,
                depthWrite: true,
            });
            assert.ok(!receivesShadow(skin), `${category} should not sample the shadow map`);
        }
    });

    it('skips primitives with no surface to shade', () => {
        const materials = manager();
        const line = materials.build({
            type: SceneMaterialPrimitiveType.LINE,
            category: PaletteCategory.SCENERY_BUILDING_METAL,
            depthWrite: true,
        });
        const fire = materials.build({
            type: SceneMaterialPrimitiveType.MESH,
            category: PaletteCategory.FX_FIRE,
            shaded: false,
            depthWrite: false,
        });
        const impostor = materials.build({
            type: SceneMaterialPrimitiveType.IMPOSTOR,
            category: PaletteCategory.SCENERY_TREE_FOLIAGE,
            depthWrite: true,
        });

        assert.ok(!receivesShadow(line));
        assert.ok(!receivesShadow(fire));
        assert.ok(!receivesShadow(impostor));
    });
});
