import { TextEffect } from "../../render/screen/text";
import { HDMidnightPalette } from "../palettes/hd-midnight";
import { HDNightVisionPalette } from "../palettes/hd-nightvision";
import { HDNoonPalette } from "../palettes/hd-noon";
import { DisplayShading, DisplayResolution, FogQuality, TechProfile } from "./profile";

export const HDProfile: TechProfile = {
    fpsCap: false,
    textEffect: TextEffect.BOLD,
    shading: DisplayShading.FULL,
    resolution: DisplayResolution.HD_RES,
    fogQuality: FogQuality.HIGH,
    noonPalette: HDNoonPalette,
    midnightPalette: HDMidnightPalette,
    nightVisionPalette: HDNightVisionPalette
}
