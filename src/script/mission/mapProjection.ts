/**
 * The plan view's projection and hit tests.
 *
 * Pure: no canvas, no DOM, no three.js. The map is a window onto scene XZ, and
 * everything about *where things are* on it lives here so it can be tested
 * without rendering anything. `missionMap.ts` owns the pixels.
 *
 * There is no sign flip between world and screen. Scene z runs SOUTH and screen
 * y runs DOWN, so the two already agree: north is up on the map for free. The
 * temptation to negate one of them is the single easiest way to produce a chart
 * that is a mirror image of the world, so it is called out here rather than
 * left to be rediscovered.
 */

/** A window onto scene XZ, centred on a world point. */
export interface MapView {
    /** Scene metres at the centre of the canvas. */
    centreX: number;
    centreZ: number;
    /** Scale: scene metres per CSS pixel. Larger means zoomed further out. */
    mPerPx: number;
    /** Canvas size in CSS pixels. */
    widthPx: number;
    heightPx: number;
}

export interface ScreenPoint { x: number; y: number }
export interface WorldPoint { x: number; z: number }

/** Anything with a scene XZ position: a leg, a spawn, an airfield. */
export interface Placed { x: number; z: number }

export function worldToScreen(
    view: MapView, worldX: number, worldZ: number, out: ScreenPoint = { x: 0, y: 0 },
): ScreenPoint {
    out.x = (worldX - view.centreX) / view.mPerPx + view.widthPx / 2;
    out.y = (worldZ - view.centreZ) / view.mPerPx + view.heightPx / 2;
    return out;
}

export function screenToWorld(
    view: MapView, screenX: number, screenY: number, out: WorldPoint = { x: 0, z: 0 },
): WorldPoint {
    out.x = (screenX - view.widthPx / 2) * view.mPerPx + view.centreX;
    out.z = (screenY - view.heightPx / 2) * view.mPerPx + view.centreZ;
    return out;
}

/** Drag the map by a screen delta. */
export function panBy(view: MapView, dxPx: number, dyPx: number): MapView {
    return {
        ...view,
        centreX: view.centreX - dxPx * view.mPerPx,
        centreZ: view.centreZ - dyPx * view.mPerPx,
    };
}

/**
 * Zoom about a screen point, keeping the world under it fixed.
 *
 * Anchoring on the cursor rather than the centre is what makes a wheel zoom
 * feel like a map instead of a slideshow: without it, zooming in on a waypoint
 * near the edge walks it off screen.
 */
export function zoomAbout(
    view: MapView, screenX: number, screenY: number, factor: number,
    minMPerPx = 5, maxMPerPx = 4000,
): MapView {
    const before = screenToWorld(view, screenX, screenY);
    const mPerPx = Math.min(maxMPerPx, Math.max(minMPerPx, view.mPerPx * factor));
    const zoomed: MapView = { ...view, mPerPx };
    const after = screenToWorld(zoomed, screenX, screenY);
    return {
        ...zoomed,
        centreX: zoomed.centreX + (before.x - after.x),
        centreZ: zoomed.centreZ + (before.z - after.z),
    };
}

/** Fit a view to a set of world points, with a margin in pixels. */
export function fitTo(
    view: MapView, points: readonly Placed[], marginPx = 40,
): MapView {
    if (points.length === 0) {
        return view;
    }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const usableW = Math.max(1, view.widthPx - marginPx * 2);
    const usableH = Math.max(1, view.heightPx - marginPx * 2);
    // A single point has no extent, so fall back to the current scale rather
    // than dividing by zero and zooming to infinity.
    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;
    const mPerPx = (spanX <= 0 && spanZ <= 0)
        ? view.mPerPx
        : Math.max(spanX / usableW, spanZ / usableH);
    return {
        ...view,
        centreX: (minX + maxX) / 2,
        centreZ: (minZ + maxZ) / 2,
        mPerPx: Math.max(1e-6, mPerPx),
    };
}

/**
 * Index of the placed item nearest a screen point, within `radiusPx`.
 *
 * In screen space rather than world space on purpose: the grab radius a person
 * expects is a fixed number of pixels whatever the zoom, and a world-space
 * radius would be unusably large zoomed out and unhittable zoomed in.
 */
export function nearestPlaced(
    view: MapView, items: readonly Placed[], screenX: number, screenY: number,
    radiusPx = 10,
): number | undefined {
    let best: number | undefined;
    let bestD = radiusPx;
    const p: ScreenPoint = { x: 0, y: 0 };
    for (let i = 0; i < items.length; i++) {
        worldToScreen(view, items[i].x, items[i].z, p);
        const d = Math.hypot(p.x - screenX, p.y - screenY);
        // `<=` so the later of two exactly-coincident handles wins, which is
        // the one drawn on top.
        if (d <= bestD) {
            bestD = d;
            best = i;
        }
    }
    return best;
}

/** Perpendicular screen distance from a point to the segment a→b. */
function segmentDistancePx(
    view: MapView, a: Placed, b: Placed, screenX: number, screenY: number,
): number {
    const pa = worldToScreen(view, a.x, a.z);
    const pb = worldToScreen(view, b.x, b.z);
    const vx = pb.x - pa.x;
    const vy = pb.y - pa.y;
    const lenSq = vx * vx + vy * vy;
    if (lenSq === 0) {
        return Math.hypot(screenX - pa.x, screenY - pa.y);
    }
    // Clamped, so a click level with the line but beyond its end does not hit.
    const t = Math.max(0, Math.min(1,
        ((screenX - pa.x) * vx + (screenY - pa.y) * vy) / lenSq));
    return Math.hypot(screenX - (pa.x + t * vx), screenY - (pa.y + t * vy));
}

/**
 * Index of the leg *after* which a new fix should be inserted, when the click
 * landed on the line between two legs. `undefined` when it did not.
 *
 * This is what makes a route editable rather than append-only: without it,
 * correcting a route past its third fix means deleting everything after the
 * mistake and re-placing it.
 */
export function nearestLegSegment(
    view: MapView, legs: readonly Placed[], screenX: number, screenY: number,
    radiusPx = 8, loop = false,
): number | undefined {
    if (legs.length < 2) {
        return undefined;
    }
    let best: number | undefined;
    let bestD = radiusPx;
    const last = loop ? legs.length : legs.length - 1;
    for (let i = 0; i < last; i++) {
        const d = segmentDistancePx(
            view, legs[i], legs[(i + 1) % legs.length], screenX, screenY);
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    }
    return best;
}
