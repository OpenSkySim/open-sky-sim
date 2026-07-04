
import { H_RES, V_RES } from '../../../defs';

export interface OverlayLayout {
    /** Controls tick/marker density (1 = VGA, 2 = SVGA/HD). */
    detailScale: number;
    /** Uniform visual zoom for HUD elements. */
    layoutScale: number;
}

export function getOverlayLayout(targetWidth: number, targetHeight: number): OverlayLayout {
    const detailScale = Math.min(2, Math.max(1, Math.round(targetWidth / H_RES)));
    const layoutScale = Math.max(
        detailScale,
        Math.min(targetWidth / H_RES, targetHeight / V_RES)
    );
    return { detailScale, layoutScale };
}

export function getOverlayTickStep(layout: OverlayLayout): number {
    return 2 * layout.layoutScale / layout.detailScale;
}

export function getOverlayLogicalHeight(layout: OverlayLayout): number {
    return V_RES * layout.layoutScale;
}

export function getOverlayStrokeWidth(layout: OverlayLayout): number {
    const geomScale = layout.layoutScale / layout.detailScale;
    return Math.max(1, Math.ceil(geomScale / 2));
}

export function formatHeading(n: number): string {
    return `00${(((n % 360) + 360) % 360).toFixed(0)}`.slice(-3);
}

export function toFeet(meters: number): number {
    return meters * 3.28084;
}

export function toKnots(metersPerSecond: number): number {
    return metersPerSecond * 1.94384;
}
