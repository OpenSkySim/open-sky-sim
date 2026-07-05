import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from '../../../config/palettes/palette';
import { CanvasPainter } from '../../../render/screen/canvasPainter';
import { Font, TextAlignment } from '../../../render/screen/text';
import { Entity } from '../../entity';
import { Scene, SceneLayers } from '../../scene';
import { getOverlayLayout } from './overlayUtils';


export class SpawnMenuEntity implements Entity {

    afterCrash = false;

    readonly tags: string[] = [];

    enabled = false;

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        //
    }

    render3D(_targetWidth: number, _targetHeight: number, _camera: THREE.Camera, _lists: Map<string, THREE.Scene>, _palette: Palette): void {
        //
    }

    render2D(targetWidth: number, targetHeight: number, _camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!this.enabled || !lists.has(SceneLayers.Overlay)) {
            return;
        }

        const layoutScale = getOverlayLayout(targetWidth, targetHeight).layoutScale;
        const bodyFont = layoutScale > 1 ? Font.HUD_MEDIUM : Font.HUD_SMALL;
        const titleFont = layoutScale > 1 ? Font.HUD_LARGE : Font.HUD_MEDIUM;
        const lineGap = Math.round(bodyFont.charHeight * 0.6);
        const padding = bodyFont.charHeight * 2;

        const title = this.afterCrash ? 'The plane crashed.' : 'Retro Flight Sim';
        const lines = [
            '1 - Approach',
            '2 - Runway',
        ];

        const maxLineLength = Math.max(title.length, ...lines.map(line => line.length));
        const boxWidth = Math.ceil(maxLineLength * (bodyFont.charWidth + bodyFont.charSpacing) + padding * 2);
        const boxHeight = titleFont.charHeight + lineGap + lines.length * (bodyFont.charHeight + lineGap) + padding * 2;
        const boxX = Math.floor((targetWidth - boxWidth) / 2);
        const boxY = Math.floor((targetHeight - boxHeight) / 2);

        painter.setBackground('#3a3a3a');
        painter.rectangle(0, 0, targetWidth, targetHeight, true);

        const borderColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        painter.setColor(borderColor);
        painter.rectangle(boxX, boxY, boxWidth, boxHeight, false);

        const textColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        let textY = boxY + padding;
        painter.text(titleFont, targetWidth / 2, textY, title, textColor, TextAlignment.CENTER);
        textY += titleFont.charHeight + lineGap;

        for (let i = 0; i < lines.length; i++) {
            painter.text(bodyFont, targetWidth / 2, textY, lines[i], textColor, TextAlignment.CENTER);
            textY += bodyFont.charHeight + lineGap;
        }
    }
}
