"""Silhouettes from drawings: image -> filled mask -> simplified outline polygons.

Pure numpy, so it runs inside Blender's bundled Python (no scipy, no OpenCV)
and in a plain Python for the tests. Images load through bpy when it is
available, else through Pillow.
"""
from __future__ import annotations

import numpy as np


def load_rgba(path: str) -> np.ndarray:
    """Image as float32 RGBA (h, w, 4) in 0..1, row 0 at the top."""
    try:
        import bpy  # type: ignore
    except ImportError:
        bpy = None
    if bpy is not None:
        img = bpy.data.images.load(path, check_existing=True)
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        # Blender stores rows bottom-up.
        return px.reshape(h, w, 4)[::-1].copy()
    from PIL import Image  # type: ignore
    with Image.open(path) as im:
        return np.asarray(im.convert('RGBA'), dtype=np.float32) / 255.0


def ink_mask(rgba: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    """Pixels that are drawing (lines or fills).

    A cut-out on a transparent background is taken by its alpha; a drawing on
    paper by its darkness.
    """
    alpha = rgba[..., 3]
    if float(alpha.min()) < 0.99:
        return alpha > 0.5
    lum = 0.2126 * rgba[..., 0] + 0.7152 * rgba[..., 1] + 0.0722 * rgba[..., 2]
    return lum < threshold


def _shift(m: np.ndarray, dy: int, dx: int) -> np.ndarray:
    out = np.zeros_like(m)
    h, w = m.shape
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = m[ys, xs]
    return out


def dilate(m: np.ndarray, px: int) -> np.ndarray:
    for _ in range(px):
        m = m | _shift(m, 1, 0) | _shift(m, -1, 0) | _shift(m, 0, 1) | _shift(m, 0, -1)
    return m


def erode(m: np.ndarray, px: int) -> np.ndarray:
    return ~dilate(~m, px)


def _propagate_rows(filled: np.ndarray, free: np.ndarray) -> np.ndarray:
    """Fill every run of free pixels in a row that already holds a filled pixel."""
    h, w = free.shape
    seg = np.cumsum(~free, axis=1) + np.arange(h)[:, None] * (w + 1)
    hit = np.zeros(h * (w + 1) + 1, dtype=bool)
    hit[seg[filled & free]] = True
    out = filled.copy()
    out[free] = hit[seg[free]]
    return out


def flood_from_border(free: np.ndarray) -> np.ndarray:
    """Pixels of `free` reachable from the image border (4-connected)."""
    filled = np.zeros_like(free)
    filled[0, :] = free[0, :]
    filled[-1, :] = free[-1, :]
    filled[:, 0] = free[:, 0]
    filled[:, -1] = free[:, -1]
    while True:
        nxt = _propagate_rows(filled, free)
        nxt = _propagate_rows(nxt.T, free.T).T
        if np.array_equal(nxt, filled):
            return filled
        filled = nxt


def filled_silhouette(ink: np.ndarray, close_px: int = 2) -> np.ndarray:
    """Solid silhouette of an outline drawing: everything the background can't reach.

    `close_px` closes small gaps in the outline before the fill (and is eroded
    off again afterwards), so a line that does not quite meet still seals.
    """
    pad = close_px + 2
    m = np.pad(ink, pad)
    m = dilate(m, close_px)
    background = flood_from_border(~m)
    solid = erode(~background, close_px)
    return solid[pad:-pad, pad:-pad]


def open_mask(mask: np.ndarray, px: int) -> np.ndarray:
    """Remove strokes thinner than about 2*px (dashed ghost lines, ground lines, labels)."""
    if px <= 0:
        return mask
    kept = erode(mask, px)
    for _ in range(px):
        kept = dilate(kept, 1) & mask
    return kept


def trace_loops(mask: np.ndarray) -> list[np.ndarray]:
    """Closed outlines of a mask along pixel edges, as (n, 2) arrays of (u, v).

    Coordinates are pixel corners (u right, v down). Outer outlines run
    clockwise on screen (positive :func:`signed_area`), holes the other way.
    """
    m = np.pad(mask.astype(bool), 1)
    h, w = m.shape
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def add(sel: np.ndarray, a: tuple[int, int], b: tuple[int, int]) -> None:
        rr, cc = np.nonzero(sel)
        for r, c in zip(rr.tolist(), cc.tolist()):
            p = (c + a[0], r + a[1])
            q = (c + b[0], r + b[1])
            edges.setdefault(p, []).append(q)

    inner = m[1:-1, 1:-1]
    add(inner & ~m[:-2, 1:-1], (0, 0), (1, 0))   # top side, heading right
    add(inner & ~m[1:-1, 2:], (1, 0), (1, 1))    # right side, heading down
    add(inner & ~m[2:, 1:-1], (1, 1), (0, 1))    # bottom side, heading left
    add(inner & ~m[1:-1, :-2], (0, 1), (0, 0))   # left side, heading up

    loops: list[np.ndarray] = []
    while edges:
        start = next(iter(edges))
        pts = [start]
        prev = start
        cur = edges[start].pop()
        if not edges[start]:
            del edges[start]
        while cur != start:
            pts.append(cur)
            outs = edges[cur]
            if len(outs) == 1:
                nxt = outs.pop()
            else:
                # Saddle: two diagonal pixels touch here. Turn right (on screen)
                # so diagonal neighbours stay separate outlines.
                din = (cur[0] - prev[0], cur[1] - prev[1])
                def turn(q: tuple[int, int]) -> int:
                    d = (q[0] - cur[0], q[1] - cur[1])
                    return din[0] * d[1] - din[1] * d[0]
                outs.sort(key=turn)
                nxt = outs.pop()
            if not outs:
                del edges[cur]
            prev, cur = cur, nxt
        # Back to the unpadded image's pixel corners.
        loops.append(np.asarray(pts, dtype=np.float64) - 1.0)
    return loops


def signed_area(loop: np.ndarray) -> float:
    """Shoelace area in (u, v) screen coordinates; clockwise on screen is positive."""
    x, y = loop[:, 0], loop[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))


def _dp_open(pts: np.ndarray, eps: float) -> list[int]:
    """Douglas-Peucker on an open polyline; returns kept indices (iterative)."""
    keep = {0, len(pts) - 1}
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        a, b = pts[i], pts[j]
        ab = b - a
        n = float(np.hypot(*ab))
        seg = pts[i + 1:j] - a
        if n < 1e-12:
            d = np.hypot(seg[:, 0], seg[:, 1])
        else:
            d = np.abs(seg[:, 0] * ab[1] - seg[:, 1] * ab[0]) / n
        k = int(np.argmax(d))
        if d[k] > eps:
            m = i + 1 + k
            keep.add(m)
            stack.append((i, m))
            stack.append((m, j))
    return sorted(keep)


def simplify_loop(loop: np.ndarray, eps: float) -> np.ndarray:
    """Douglas-Peucker for a closed outline (split at its two farthest points)."""
    if len(loop) <= 4:
        return loop
    d0 = np.hypot(*(loop - loop[0]).T)
    far = int(np.argmax(d0))
    a = loop[:far + 1]
    b = np.vstack([loop[far:], loop[:1]])
    ia = _dp_open(a, eps)
    ib = _dp_open(b, eps)
    out = [a[i] for i in ia[:-1]] + [b[i] for i in ib[:-1]]
    return np.asarray(out)


def outline_polygons(mask: np.ndarray, eps_px: float, min_area_frac: float = 0.002) -> list[np.ndarray]:
    """Simplified outer outlines of the mask's parts, biggest first.

    Specks smaller than `min_area_frac` of the biggest part are dropped, and
    holes are ignored (a visual hull only needs the outer silhouette).
    """
    loops = [lp for lp in trace_loops(mask) if signed_area(lp) > 0]
    if not loops:
        return []
    loops.sort(key=signed_area, reverse=True)
    biggest = signed_area(loops[0])
    loops = [lp for lp in loops if signed_area(lp) >= biggest * min_area_frac]
    out = []
    for lp in loops:
        s = simplify_loop(lp, eps_px)
        if len(s) >= 3:
            out.append(s)
    return out


def shape_mask(shape: dict, h: int, w: int) -> np.ndarray:
    """Rasterise {"rect": [u0,v0,u1,v1]}, {"circle": [u,v,r]}, {"ellipse": [u,v,ru,rv]} or {"polygon": [[u,v],...]}."""
    vv, uu = np.mgrid[0:h, 0:w]
    uu = uu + 0.5
    vv = vv + 0.5
    if 'rect' in shape:
        u0, v0, u1, v1 = shape['rect']
        return (uu >= u0) & (uu < u1) & (vv >= v0) & (vv < v1)
    if 'circle' in shape:
        cu, cv, r = shape['circle']
        return (uu - cu) ** 2 + (vv - cv) ** 2 <= r * r
    if 'ellipse' in shape:
        cu, cv, ru, rv = shape['ellipse']
        return ((uu - cu) / ru) ** 2 + ((vv - cv) / rv) ** 2 <= 1.0
    poly = np.asarray(shape['polygon'], dtype=np.float64)
    inside = np.zeros((h, w), dtype=bool)
    n = len(poly)
    for i in range(n):  # even-odd rule, one edge at a time
        (x0, y0), (x1, y1) = poly[i], poly[(i + 1) % n]
        if y0 == y1:
            continue
        crosses = (vv >= min(y0, y1)) & (vv < max(y0, y1))
        xi = x0 + (vv - y0) * (x1 - x0) / (y1 - y0)
        inside ^= crosses & (uu < xi)
    return inside


def bbox(mask: np.ndarray) -> tuple[int, int, int, int]:
    """(u0, v0, u1, v1) pixel-corner bounds of the mask (u1, v1 exclusive)."""
    rows = np.nonzero(mask.any(axis=1))[0]
    cols = np.nonzero(mask.any(axis=0))[0]
    if len(rows) == 0:
        raise ValueError('empty silhouette: nothing drawn in this view (check crop and threshold)')
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1
