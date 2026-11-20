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
SEGMENTS = 28            # ring vertices; 19 on the +x half from top to bottom centre
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


def resample_at_height(half, h, n=HALF_N, pin=HALF_N // 2):
    """Like resample, but the outline's side point at relative height h lands on point index pin
    in every ring, so the loft runs one straight vertex row along a line of constant height."""
    P = np.asarray(half, dtype=float)
    w = int(np.argmax(P[:, 0]))
    h = min(max(h, P[:, 1].min() + 0.05), P[:, 1].max() - 0.05)
    # Search outward-side points (from the widest down, else from the top down to the widest).
    rng = range(w, len(P) - 1) if P[w, 1] >= h else range(0, w)
    for i in rng:
        a, b = P[i], P[i + 1]
        if (a[1] - h) * (b[1] - h) <= 0 and a[1] != b[1]:
            f = (a[1] - h) / (a[1] - b[1])
            q = a + (b - a) * f
            return np.vstack([resample(np.vstack([P[:i + 1], [q]]), pin),
                              resample(np.vstack([[q], P[i + 1:]]), n - pin)[1:]])
    return resample(P, n)


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
# pane spans x +-0.29 from A (y 1.28, d 0.23) to D (y 2.04, d 0.62); each side pane is the plane
# through A, B, D and C, swept back in plan (its bottom and top edges are parallel, so it is flat).
# Behind each side pane a quarter pane B-C-Q2-Q1 steps out to the cabin wall at the sloping door
# pillar Q1-Q2 (side view d 0.77 -> 1.07), so the nose rings there are built from these corners
# instead of the round outline.
PANE_A = (0.40, 1.24, 0.23)
PANE_B = (0.95, 1.24, 0.45)
# Owner (2026-11-20): the nose must match the sheet's sections А-Г. Section Б (d 0.636) cuts the
# windscreen at its top (centre 2.04-2.055, side pane edge ~(0.92, 1.82), sill 1.07 wide), so the
# centre pane reaches its top at Б and the side pane's rear corner C sits at d 0.71.
PANE_D = (0.40, 2.04, 0.636)
PANE_C = (0.90, 2.04, 0.71)
QUARTER_0 = (1.07, 1.24, 0.636)   # quarter pane sill at section Б (its width there)
QUARTER_1 = (1.10, 1.24, 0.85)
QUARTER_2 = (0.95, 2.03, 1.042)
ROOF_BLEND_END = 1.75
# Deck fairing roof profile (x, height) at the first roof ring behind the glazing (d ROOF_RING_D).
# Section В's top (sheet, on the side view's bottom 0.289): raised centre strip, rounded shoulders.
ROOF_PROFILE = ((0.0, 2.289), (0.281, 2.271), (0.333, 2.234), (0.361, 2.197), (0.379, 2.161),
                (0.783, 2.124), (0.865, 2.087), (0.914, 2.05), (0.969, 1.977), (1.028, 1.904))
ROOF_X = (0.0, 0.30, 0.42)        # roof points of the glazing rings behind the side panes
ROOF_RING_D = 1.141
PANE_STATIONS = (0.235, 0.45, 0.636, 0.71, 0.85, 1.042)   # pane corners (+ one between A and B)


def _lerp(p, q, d):
    f = (d - p[2]) / (q[2] - p[2])
    return (p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f)


def _pane_points(d, roof=0.0):
    """Frame points of the glazing at station d, top centre outwards: centre-line top, the centre /
    side pane frame, the side pane's outer edge and the quarter pane's foot on the cabin wall
    (None ahead of B, where the side pane sits straight on the nose box, and at the pillar top)."""
    A, B, D, C, Q0, Q1, Q2 = PANE_A, PANE_B, PANE_D, PANE_C, QUARTER_0, QUARTER_1, QUARTER_2
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
    if d <= B[2] + 1e-6:
        # Ahead of the side pane's foot: a point just outboard on the sill, so these rings have the
        # same point layout as the ones with a quarter pane foot (no crease where it starts).
        j3 = (j2[0] + 0.04, j2[1] - 0.02)
    elif d < Q2[2] - 1e-6:
        j3 = _lerp(B, Q0, d) if d <= Q0[2] else _lerp(Q0, Q1, d) if d <= Q1[2] else _lerp(Q1, Q2, d)
    return (0.0, top), j1, j2, j3


def windscreen(d, H, y0):
    """Replace the top of a nose station's half outline (relative heights) by the glazing's frame."""
    P = H + np.array([0.0, y0])
    if PANE_STATIONS[-1] + 1e-6 < d <= ROOF_BLEND_END:
        return H      # behind the glazing: the section itself (В and its blend to the deck front)
    if not (PANE_STATIONS[0] - 1e-6 <= d <= PANE_STATIONS[-1] + 1e-6):
        return H
    j0, j1, j2, j3 = _pane_points(d, P[0, 1])
    fixed = [j0, j1, j2] + ([j3] if j3 else [])
    # Every glazing ring has the same frame structure (top, roof points, frame points), so the
    # loft joins like points to like points and the roof behind the panes stays smooth.
    if d < PANE_C[2] - 1e-6:
        fixed = [j0, (0.5 * j1[0], j1[1]), j1, j2] + ([j3] if j3 else [])
    else:
        # Behind the side panes the roof follows the outline (no lower than the pane tops).
        k_ = max(2, int(np.argmax(P[:HALF_N // 2, 0])))
        xs, ys = P[:k_ + 1, 0], P[:k_ + 1, 1]
        # The roof eases from the flat pane tops (C) up into the deck fairing's profile (the first
        # roof ring behind the glazing), with the same point layout, so it stays smooth.
        t = min(1.0, max(0.0, (d - PANE_C[2]) / (ROOF_RING_D - PANE_C[2])))
        roof = lambda x: max(PANE_C[1] + t * (float(np.interp(x, *zip(*ROOF_PROFILE))) - PANE_C[1]), j2[1])
        fixed = [(x, roof(x)) for x in ROOF_X] + [j2] + ([j3] if j3 else [])
    foot = fixed[-1]
    # The outline continues below the last frame point on the outside: skip outline points that
    # lie inboard of it (the roof or nose top dipping under it), or the ring folds back. From the
    # side's middle point down the ring keeps its own points, so it still lines up with the plain
    # rings ahead of and behind the glazing (otherwise the loft twists into creases there).
    m = HALF_N // 2
    below = [i for i in range(1, m) if P[i, 1] <= foot[1] - 0.04]
    k = next((i for i in below if P[i, 0] >= foot[0] - 0.02), m)
    upper = resample(np.vstack([[foot], P[k:m + 1]]), m + 1 - len(fixed))
    if d <= QUARTER_1[2] + 1e-6:
        # Under the front and quarter pane sills (owner: 'close the holes' below the corner post):
        # keep the outline's own points by index (like to like from ring to ring). Points that lie
        # under the glazing collapse onto the sill foot (2 mm apart) instead of sliding down the side
        # wall, so the nose deck ahead of the side pane is not twisted into long slivers.
        n_after = len(upper) - 1
        idx = list(range(m - n_after + 1, m + 1))
        ok = [P[i, 1] <= foot[1] - 0.04 and P[i, 0] >= foot[0] - 0.02 for i in idx]
        if ok[-1]:
            first = next(j for j, o in enumerate(ok) if o)
            tgt = P[idx[first]]
            step = (tgt - np.array(foot)) / np.linalg.norm(tgt - np.array(foot))
            pts = [np.array(foot) + step * 0.002 * (j + 1) if j < first else P[i] for j, i in enumerate(idx)]
            upper = np.vstack([[foot], pts])
    out = np.vstack([fixed[:-1], upper, P[m + 1:]])
    return out - np.array([0.0, y0])
