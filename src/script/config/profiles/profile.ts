import { TextEffect } from "../../render/screen/text";
import { Palette } from "../palettes/palette";
import { HI_H_RES, HI_V_RES, LO_H_RES, LO_V_RES } from "../../defs";

export enum DisplayResolution {
    LO_RES, // 320x200
    HI_RES, // 640x400
    HD_RES, // native viewport resolution
}

export enum DisplayShading {
    DUOTONE,
    STATIC,
    DYNAMIC,
    FULL,
}

export enum FogQuality {
    NONE, // Disabled
    LOW, // Plane
    HIGH // Sphere
}

export interface TechProfile {
    fpsCap: boolean;
    textEffect: TextEffect;
    shading: DisplayShading;
    resolution: DisplayResolution;
    fogQuality: FogQuality;
    noonPalette: Palette;
    midnightPalette: Palette;
    nightVisionPalette?: Palette;
}

export function getDisplayResolutionSize(resolution: DisplayResolution): [number, number] {
    switch (resolution) {
        case DisplayResolution.LO_RES:
            return [LO_H_RES, LO_V_RES];
        case DisplayResolution.HI_RES:
            return [HI_H_RES, HI_V_RES];
        case DisplayResolution.HD_RES:
            throw new Error('HD resolution is viewport-dependent');
    }
}
