import { H_RES, V_RES } from '../../../defs';
import { CanvasPainter } from '../../../render/screen/canvasPainter';
import { Font } from '../../../render/screen/text';
import { AircraftDeviceState, PlayerEntity } from '../player';

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

/** Horizontal gap between the map MFD edge and the GEAR/FLAPS/BRAKE labels. */
const AIRCRAFT_DEVICE_STATUS_OUTWARD_GAP = 10;

export function getAircraftDeviceStatusPosition(targetHeight: number, mfdSize: number, font: Font) {
    return {
        x: mfdSize + font.charSpacing + 2 + AIRCRAFT_DEVICE_STATUS_OUTWARD_GAP,
        y: targetHeight - font.charHeight - font.charSpacing,
    };
}

/** Bottom-left GEAR / FLAPS / BRAKE stack beside the map MFD. */
export function renderAircraftDeviceStatus(
    actor: PlayerEntity,
    x: number,
    bottomY: number,
    painter: CanvasPainter,
    hudColor: string,
    font: Font,
) {
    const lineStep = font.charHeight + font.charSpacing;
    const labels: string[] = [];

    if (actor.landingGear === AircraftDeviceState.EXTENDED || actor.landingGear === AircraftDeviceState.EXTENDING) {
        labels.push('GEAR');
    }
    if (actor.flaps === AircraftDeviceState.EXTENDED || actor.flaps === AircraftDeviceState.EXTENDING) {
        labels.push('FLAPS');
    }
    if (actor.wheelBrakesApplied) {
        labels.push('BRAKE');
    }

    for (let i = 0; i < labels.length; i++) {
        painter.text(font, x, bottomY - i * lineStep, labels[i], hudColor);
    }
}
