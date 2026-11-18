"""Ka-29 fuselage as one loft whose every ring is a polygon from the drawing's cross-sections.

ka29_sections.json holds sections А-Л traced off the owner's second Ka-29 sheet (half outlines,
163.5 px/m, stations from the tick marks under its lower side view). Each station of the loft
gets an outline blended between the two sections around it (point by point along the outline's
length), set on the side view's bottom line. Ahead of А and behind Л the outlines come from the
side and top views (superellipse rows in make_spec.py). Sections А-В and К-Л are scaled in
height to the side view (А-В: up to the cockpit fairing; К-Л: the boom without the deck end);
Г-И keep their own height (they include the engine deck).
"""
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SEGMENTS = 36            # ring vertices; 19 on the +x half from top to bottom centre
HALF_N = SEGMENTS // 2   # intervals on one half


def load_sections():
    with open(os.path.join(HERE, 'ka29_sections.json')) as f:
        return json.load(f)['sections']


def resample(half, n=HALF_N):
    """Half outline [[x, h], ...] (top centre -> bottom centre) -> n+1 points evenly along its length."""
    P = np.asarray(half, dtype=float)
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    u = np.linspace(0, s[-1], n + 1)
    return np.stack([np.interp(u, s, P[:, 0]), np.interp(u, s, P[:, 1])], axis=1)


def superellipse_half(a, top, bot, n, n_top=None, m=60):
    """Half outline of a superellipse station (relative to its bottom)."""
    out = []
    for k in range(m + 1):
        t = math.pi / 2 - math.pi * k / m
        c, s = math.cos(t), math.sin(t)
        e = n_top if (n_top and s > 0) else n
        x = a * abs(c) ** (2.0 / e)
        y = (top if s >= 0 else bot) * math.copysign(abs(s) ** (2.0 / e), s)
        out.append([x, y + bot])
    out[0][0] = out[-1][0] = 0.0
    return out


def ring_points(H, y0):
    """Resampled half (n+1 points, relative heights) -> spec section pts [x, y, t] round the whole ring."""
    pts = []
    for j, (x, h) in enumerate(H):
        t = math.pi / 2 - math.pi * j / HALF_N
        pts.append([round(float(x), 4), round(float(h + y0), 4), round(t % (2 * math.pi), 6)])
        if 0 < j < HALF_N:
            pts.append([round(-float(x), 4), round(float(h + y0), 4), round((math.pi - t) % (2 * math.pi), 6)])
    return pts


def build(keys, stations, bottom):
    """keys: [(d, resampled half)] sorted by d; stations: d list; bottom(d) -> y of the outline's bottom.
    Returns [(d, H, y0)] with H the blended half outline (relative heights)."""
    kd = np.array([k[0] for k in keys])
    out = []
    for d in stations:
        j = int(np.searchsorted(kd, d))
        if j <= 0:
            H = keys[0][1]
        elif j >= len(kd):
            H = keys[-1][1]
        else:
            f = (d - kd[j - 1]) / (kd[j] - kd[j - 1])
            H = keys[j - 1][1] * (1 - f) + keys[j][1] * f
        out.append((d, H, bottom(d)))
    return out


# Flat windscreen (owner's photo, 2026-11-18): three flat front panes over the nose box. The centre
# pane spans x +-0.29 from A (y 1.28, d 0.23) to D (y 2.04, d 0.80); each side pane is the plane
# through A, B, D and C, swept back in plan (its bottom and top edges are parallel, so it is flat).
# Behind each side pane a quarter pane B-C-Q2-Q1 steps out to the cabin wall at the sloping door
# pillar Q1-Q2 (side view d 0.77 -> 1.07), so the nose rings there are built from these corners
# instead of the round outline.
PANE_A = (0.29, 1.28, 0.23)
PANE_B = (0.82, 1.28, 0.37)
PANE_D = (0.29, 2.04, 0.80)
PANE_C = (0.76, 2.04, 0.90)
QUARTER_1 = (1.10, 1.28, 0.77)
QUARTER_2 = (0.95, 1.97, 1.042)
PANE_STATIONS = (0.235, 0.30, 0.37, 0.57, 0.77, 0.80, 0.85, 0.90, 1.042)


def _lerp(p, q, d):
    f = (d - p[2]) / (q[2] - p[2])
    return (p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f)


def _pane_points(d, roof=0.0):
    """Frame points of the glazing at station d, top centre outwards: centre-line top, the centre /
    side pane frame, the side pane's outer edge and the quarter pane's foot on the cabin wall
    (None ahead of B, where the side pane sits straight on the nose box, and at the pillar top)."""
    A, B, D, C, Q1, Q2 = PANE_A, PANE_B, PANE_D, PANE_C, QUARTER_1, QUARTER_2
    top = A[1] + (min(d, D[2]) - A[2]) * (D[1] - A[1]) / (D[2] - A[2])
    if d > D[2]:
        top = max(top, roof)      # behind the panes the roof rises with the outline to the fairing
    j2 = _lerp(A, B, d) if d <= B[2] else _lerp(B, C, d) if d <= C[2] else _lerp(C, Q2, d)
    if d <= D[2]:
        j1 = (A[0], top)
    elif d < C[2] - 1e-6:
        j1 = _lerp(D, C, d)
    else:
        j1 = (0.5 * j2[0], top)
    j3 = None
    if B[2] + 1e-6 < d < Q2[2] - 1e-6:
        j3 = _lerp(B, Q1, d) if d <= Q1[2] else _lerp(Q1, Q2, d)
    return (0.0, top), j1, j2, j3


def windscreen(d, H, y0):
    """Replace the top of a nose station's half outline (relative heights) by the glazing's frame."""
    if not (PANE_STATIONS[0] - 1e-6 <= d <= PANE_STATIONS[-1] + 1e-6):
        return H
    P = H + np.array([0.0, y0])
    j0, j1, j2, j3 = _pane_points(d, P[0, 1])
    fixed = [j0, j1, j2] + ([j3] if j3 else [])
    foot = fixed[-1]
    # The outline continues below the last frame point on the outside: skip outline points that
    # lie inboard of it (the roof or nose top dipping under it), or the ring folds back. From the
    # side's middle point down the ring keeps its own points, so it still lines up with the plain
    # rings ahead of and behind the glazing (otherwise the loft twists into creases there).
    m = HALF_N // 2
    below = [i for i in range(1, m) if P[i, 1] <= foot[1] - 0.04]
    k = next((i for i in below if P[i, 0] >= foot[0] - 0.02), m)
    upper = resample(np.vstack([[foot], P[k:m + 1]]), m + 1 - len(fixed))
    out = np.vstack([fixed[:-1], upper, P[m + 1:]])
    return out - np.array([0.0, y0])
