import * as THREE from 'three';
import { Palette, PaletteCategory, PaletteColor } from "../../../config/palettes/palette";
import { CanvasPainter } from "../../../render/screen/canvasPainter";
import { Font, TextAlignment } from "../../../render/screen/text";
import { Entity } from "../../entity";
import { Scene, SceneLayers } from "../../scene";
import { getOverlayLayout } from './overlayUtils';

interface DrawStatsEntry {
    calls: number;
    triangles: number;
}

interface TerrainStatsShape {
    drawn: number;
    triangles: number;
    detailScale: number;
    frameEmaMs: number;
    /** Which tier answered the last CPU height query: fine | coarse | none. */
    heightTier?: string;
    queued?: number;
    inflight?: number;
    cacheBytes?: number;
    aborted?: number;
    failed?: number;
    uploadMs?: number;
    pendingUploads?: number;
}

/** Frame-time EMA smoothing factor — same order as the terrain LOD governor's own. */
const FRAME_EMA_ALPHA = 0.1;

/**
 * F9-toggled on-screen readout of the live perf diagnostics already wired up
 * via globalThis.__drawStats (renderer.ts) and __terrainStats (planet/debug.ts)
 * but previously only inspectable through devtools — surfaces them in-game so
 * LOD/culling changes can be sanity-checked without a debugger attached.
 */
export class PerfHudEntity implements Entity {

    private frameEmaMs: number = 1000 / 60;

    readonly tags: string[] = [];

    enabled: boolean = false;

    init(scene: Scene): void {
        //
    }

    update(delta: number): void {
        const ms = delta * 1000;
        this.frameEmaMs += (ms - this.frameEmaMs) * FRAME_EMA_ALPHA;
    }

    render3D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Map<string, THREE.Scene>, palette: Palette): void {
        // Nothing
    }

    render2D(targetWidth: number, targetHeight: number, camera: THREE.Camera, lists: Set<string>, painter: CanvasPainter, palette: Palette): void {
        if (!lists.has(SceneLayers.Overlay)) return;

        const layoutScale = getOverlayLayout(targetWidth, targetHeight).layoutScale;
        const font = layoutScale > 1 ? Font.HUD_MEDIUM : Font.HUD_SMALL;
        const hudColor = PaletteColor(palette, PaletteCategory.HUD_TEXT);
        const lineHeight = font.charHeight + 2;

        const lines: string[] = [];
        const fps = this.frameEmaMs > 0 ? 1000 / this.frameEmaMs : 0;
        lines.push(`${fps.toFixed(0)} FPS (${this.frameEmaMs.toFixed(1)}ms)`);

        const kernelStats = (globalThis as Record<string, unknown>).__kernelStats as { updateMs: number; renderMs: number } | undefined;
        if (kernelStats) {
            lines.push(`  logic ${kernelStats.updateMs.toFixed(1)}ms / render ${kernelStats.renderMs.toFixed(1)}ms`);
        }

        const gpuStats = (globalThis as Record<string, unknown>).__gpuStats as Record<string, number> | undefined;
        const cpuStats = (globalThis as Record<string, unknown>).__cpuStats as Record<string, number> | undefined;
        const drawStats = (globalThis as Record<string, unknown>).__drawStats as Record<string, DrawStatsEntry> | undefined;
        if (drawStats) {
            for (const [key, entry] of Object.entries(drawStats)) {
                const gpuMs = gpuStats?.[key];
                const cpuMs = cpuStats?.[key];
                const gpuSuffix = gpuMs !== undefined ? `, ${gpuMs.toFixed(2)}ms GPU` : '';
                const cpuSuffix = cpuMs !== undefined ? `, ${cpuMs.toFixed(2)}ms CPU` : '';
                lines.push(`${key}: ${entry.calls} draws, ${(entry.triangles / 1000).toFixed(1)}k tri${gpuSuffix}${cpuSuffix}`);
            }
        }
        if (gpuStats?.compose !== undefined || cpuStats?.compose !== undefined) {
            const gpuSuffix = gpuStats?.compose !== undefined ? `, ${gpuStats.compose.toFixed(2)}ms GPU` : '';
            const cpuSuffix = cpuStats?.compose !== undefined ? `, ${cpuStats.compose.toFixed(2)}ms CPU` : '';
            lines.push(`compose${gpuSuffix}${cpuSuffix}`);
        }

        const terrainStats = (globalThis as Record<string, unknown>).__terrainStats as TerrainStatsShape | undefined;
        if (terrainStats) {
            lines.push(`Terrain: ${terrainStats.drawn} tiles, ${(terrainStats.triangles / 1000).toFixed(1)}k tri, `
                + `detail ${terrainStats.detailScale.toFixed(2)}, ema ${terrainStats.frameEmaMs.toFixed(1)}ms`);
            // Streaming health. `queued` should drain toward zero in level
            // flight and `cache` should plateau; a climbing cache means
            // eviction is not reclaiming. `tier` must not change as you climb.
            const mb = (terrainStats.cacheBytes ?? 0) / 1048576;
            lines.push(`  stream: q${terrainStats.queued ?? 0} f${terrainStats.inflight ?? 0}`
                + ` up${terrainStats.pendingUploads ?? 0}/${(terrainStats.uploadMs ?? 0).toFixed(1)}ms`
                + ` cache ${mb.toFixed(0)}MB abort ${terrainStats.aborted ?? 0}`
                + ` fail ${terrainStats.failed ?? 0} tier ${terrainStats.heightTier ?? '?'}`);
        }

        let y = font.charHeight;
        for (const line of lines) {
            painter.text(font, 2, y, line, hudColor, TextAlignment.LEFT);
            y += lineHeight;
        }
    }
}
