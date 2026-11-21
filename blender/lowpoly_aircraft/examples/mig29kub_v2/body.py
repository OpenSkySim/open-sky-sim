"""The MiG-29KUB's blended body (fuselage, canopy, LERX, intakes and nacelles) as one loft.

Every station's cross-section is a polygon: sections A-G traced off the MiG-29M2 sheet
(m2_sections.json, half outlines in metres from the top centre round the left side to the
bottom centre), plus round nose sections from the side and top views. All outlines get the
same vertex layout (top centre, the outermost point = LERX or deck edge, the lowest point =
nacelle bottom, bottom centre) so the loft blends between them; in between, the outlines are
interpolated and stretched to the side view's top line and the top view's LERX edge.
"""
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
NOSE_Y = -0.31            # radome tip in the drawing frame (ground -2.0, 1.69 m below the tip)
K1, K2, K3 = 14, 9, 5     # vertices T->L, L->N, N->B: ring of 2 * 28 = 56
KE = 5                    # of K1: vertices T->E (top centre to the top's shoulder)
SEGMENTS = 2 * (K1 + K2 + K3)


def interp(table, d):
    t = np.array(table, dtype=float)
    return float(np.interp(d, t[:, 0], t[:, 1]))


# Side view (M2 sheet, 41.5 px/m): top line, metres above the radome tip.
TOP = [(0, 0), (0.14, 0.13), (0.34, 0.23), (0.53, 0.33), (0.72, 0.42), (0.92, 0.48), (1.11, 0.54),
       (1.3, 0.59), (1.49, 0.64), (1.69, 0.69), (1.88, 0.73), (2.07, 0.78), (2.27, 0.83), (2.65, 0.89),
       # Windscreen: one straight line in side view (owner, 2026-11-18) from its foot (d 2.95,
       # 0.05 m below the glass edge first drawn) up to the frame at d 3.93.
       # The fuselage's top under the canopy is the owner's red line on the M2 side view
       # (2026-11-18): from the windscreen's foot along the canopy sill, peaking at d 7.08, then
       # straight down to the fin root. The canopy sits on it as its own part (CANOPY_TOP).
       (2.95, 0.92), (4.11, 1.10), (7.08, 1.34), (7.42, 1.33), (11.82, 0.90)]
SILL_FROM, SILL_TO = 2.95, 7.72          # where the canopy sits on the fuselage
# Canopy top: straight windscreen (owner) to the frame at d 3.93, the owner's blue line over the
# glass, then the green rear frame from the glass's end down onto the red line.
CANOPY_TOP = [(2.95, 0.92), (3.93, 1.54), (4.05, 1.56), (4.29, 1.65), (4.53, 1.70), (4.77, 1.74),
              (5.01, 1.79), (5.48, 1.80), (5.72, 1.78), (5.96, 1.76), (6.2, 1.72), (6.44, 1.67), (6.6, 1.64),
              (7.11, 1.49), (7.72, 1.31)]
# Canopy half width (M2 top view: glazing about 0.95 m wide).
CANOPY_HW = [(2.95, 0.3), (3.3, 0.38), (3.93, 0.45), (4.5, 0.48), (5.3, 0.49), (6.1, 0.48), (6.6, 0.45),
             (7.1, 0.38), (7.72, 0.25)]
BOT = [(0, 0), (0.14, -0.06), (0.34, -0.09), (0.53, -0.13), (0.72, -0.16), (0.92, -0.18), (1.11, -0.2),
       (2.92, -0.2)]
# Top view: half width of the nose, then of the LERX edge (to the wing root at d 7.83).
HW = [(0, 0), (0.17, 0.12), (0.31, 0.17), (0.46, 0.22), (0.6, 0.27), (0.75, 0.31), (0.89, 0.34),
      (1.04, 0.36), (1.47, 0.43), (1.9, 0.46), (2.3, 0.49), (2.6, 0.52), (2.92, 0.55), (3.2, 0.62),
      (3.64, 0.65), (3.93, 0.72), (4.36, 0.86), (4.8, 0.99), (5.23, 1.11), (5.66, 1.25), (6.1, 1.37),
      (6.53, 1.49), (6.96, 1.59), (7.4, 1.69), (7.83, 1.76)]
# Section stations (ticks on the side view) and how each traced outline sits: A is drawn about
# 10 % small; A-C hang from the side view's top line, D-G stand on its nacelle bottom line.
# (station d, x scale, y scale, how it sits, y). A-D are the owner's front sections (2026-11-18):
# the model's rings at these stations are the traced outlines themselves. A is drawn about 10 %
# narrow (top view); A-C hang from the side view's top line (A at the straight windscreen's foot),
# D-G stand on its nacelle bottom line.
SECTIONS = {'A': (2.92, 1.1, 1.0, 'top', 0.90), 'B': (4.12, 1.0, 1.0, 'top', 1.63), 'C': (5.28, 1.0, 1.0, 'top', 1.82),
            'D': (7.13, 1.0, 1.0, 'bot', -0.83), 'E': (9.64, 1.0, 1.0, 'bot', -0.77), 'F': (11.25, 1.0, 1.0, 'bot', -0.71),
            'G': (13.78, 1.0, 1.0, 'bot', -0.59)}


def _resample(poly, count):
    """count + 1 points along a polyline by arc length, snapped to its sharp corners."""
    P = np.asarray(poly, dtype=float)
    seg = np.hypot(*np.diff(P, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    if s[-1] < 1e-9:
        return np.repeat(P[:1], count + 1, axis=0)
    want = np.linspace(0, s[-1], count + 1)
    # corners: turning more than 35 deg
    corners = []
    for i in range(1, len(P) - 1):
        a, b = P[i] - P[i - 1], P[i + 1] - P[i]
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na > 1e-9 and nb > 1e-9 and np.dot(a, b) / (na * nb) < math.cos(math.radians(35)):
            corners.append(s[i])
    step = s[-1] / count
    for c in corners:
        j = int(np.argmin(np.abs(want - c)))
        if 0 < j < count and abs(want[j] - c) < 0.45 * step:
            want[j] = c
    want = np.maximum.accumulate(want)
    return np.column_stack([np.interp(want, s, P[:, 0]), np.interp(want, s, P[:, 1])])


def layout(half, n_x=None):
    """A half outline (top centre -> bottom centre) -> K1+K2+K3+1 points with the shared anchors."""
    H = np.asarray(half, dtype=float)
    iL = int(np.argmax(H[:, 0] - 1e-3 * np.arange(len(H))))
    rest = H[iL:]
    if n_x is None:
        lo = rest[:, 1].min()
        flat = np.where(rest[:, 1] < lo + 0.02)[0]
        iN = iL + int(flat[len(flat) // 2])
    else:
        # no nacelle: the bottom point closest to n_x
        low = [i for i in range(iL, len(H)) if H[i, 1] < H[iL, 1]]
        iN = min(low or [len(H) - 1], key=lambda i: abs(H[i, 0] - n_x))
        iN = min(max(iN, iL + 1), len(H) - 2)
    # The top's shoulder E (where the outline first turns down steeper than 45 deg, the deck's
    # edge under the canopy) is an anchor too, so the panels do not twist from section to section.
    up = H[:iL + 1]
    iE = next((i for i in range(1, len(up)) if (up[i - 1, 1] - up[i, 1]) > (up[i, 0] - up[i - 1, 0]) + 1e-9), 1)
    iE = min(max(iE - 1, 1), len(up) - 2) if len(up) > 2 else 1
    upper = np.vstack([_resample(up[:iE + 1], KE), _resample(up[iE:], K1 - KE)[1:]])
    return np.vstack([upper, _resample(H[iL:iN + 1], K2)[1:], _resample(H[iN:], K3)[1:]])


def nose_half(d):
    """Round nose section: superellipse from the side and top views."""
    hw, top, bot = interp(HW, d), interp(TOP, d) + NOSE_Y, interp(BOT, d) + NOSE_Y
    cy, up, dn = 0.5 * (top + bot), 0.5 * (top - bot), 0.5 * (top - bot)
    pts = []
    for k in range(121):
        t = math.pi / 2 - math.pi * k / 120
        c, s = math.cos(t), math.sin(t)
        pts.append((hw * abs(c) ** (2 / 2.2), cy + (up if s >= 0 else dn) * math.copysign(abs(s) ** (2 / 2.2), s)))
    return layout(pts, n_x=0.35 * hw)


def _cap(H, cap):
    """Cut a half outline flat at y = cap (the fuselage under the canopy stops at the red line)."""
    if H[0, 1] <= cap:
        return H
    for j in range(1, len(H)):
        if H[j, 1] <= cap:
            a, b = H[j - 1], H[j]
            f = (a[1] - cap) / (a[1] - b[1])
            p = a + (b - a) * f
            return np.vstack([[0.0, cap], p, H[j:]])
    return H


def section_halves():
    with open(os.path.join(HERE, 'm2_sections.json')) as f:
        raw = json.load(f)
    out = {}
    for k, (d, sx, sy, ref, y_ref) in SECTIONS.items():
        H = np.array(raw[k]) * [sx, sy]
        H[:, 1] += (y_ref + NOSE_Y) - (H[:, 1].max() if ref == 'top' else H[:, 1].min())
        if SILL_FROM <= d <= SILL_TO:
            H = _cap(H, interp(TOP, d) + NOSE_Y)
        out[k] = (d, layout(H, n_x=0.35 * H[:, 0].max() if k in 'ABC' else None))
    return out


def _lerp_keys(keys, d):
    ds = [k[0] for k in keys]
    if d <= ds[0]:
        return keys[0][1].copy()
    if d >= ds[-1]:
        return keys[-1][1].copy()
    j = int(np.searchsorted(ds, d))
    f = (d - ds[j - 1]) / (ds[j] - ds[j - 1])
    return keys[j - 1][1] * (1 - f) + keys[j][1] * f


def body_halves():
    """[(d, half outline)] nose first."""
    S = section_halves()
    keys = [(d, nose_half(d)) for d in (0.15, 0.43, 0.75, 1.1, 1.5, 1.9, 2.3, 2.6)]
    keys += [S[k] for k in 'ABC']
    # Intake: the nacelle box (section D's lower outline) starts at the top lip, d 5.62.
    dC, C = S['C']
    dD, D = S['D']
    f = (5.62 - dC) / (dD - dC)
    hyb = C * (1 - f) + D * f
    hyb[K1 + 1:] = D[K1 + 1:]
    # the LERX's underside must not stick out past the LERX edge this far forward
    hyb[K1 + 1:, 0] = np.minimum(hyb[K1 + 1:, 0], hyb[K1, 0])
    keys += [(5.5, _lerp_keys([S['C'], S['D']], 5.5)), (5.62, hyb)]
    keys[-2][1][K1 + 1:] = C[K1 + 1:]
    keys += [S[k] for k in 'DEFG']
    G = S['G'][1]
    keys += [(14.25, G.copy())]
    stations = [0.15, 0.43, 0.75, 1.1, 1.5, 1.9, 2.3, 2.6, 2.92, 3.32, 3.72, 4.12, 4.5, 4.89, 5.28,
                5.5, 5.62, 6.12, 6.62, 7.13, 7.5, 7.83, 8.3, 8.9, 9.64, 10.4, 11.25, 12.1, 12.9, 13.78, 14.25]
    exact = {v[0] for v in SECTIONS.values()}
    top_exact = {SECTIONS['A'][0]}   # B-F take the side view's top line (owner's lines)
    # Smooth hull (owner, 2026-11-18): every ring vertex runs along a monotone cubic through the
    # sections instead of straight lines, so there is no kink (step) where panels meet a section.
    from scipy.interpolate import PchipInterpolator
    kd = np.array([k[0] for k in keys])
    smooth = PchipInterpolator(kd, np.stack([k[1] for k in keys]), axis=0)
    out = []
    for d in stations:
        H = smooth(min(max(d, kd[0]), kd[-1]))
        if SILL_FROM <= d <= SILL_TO:
            # under the canopy: the fuselage's upper outline stops at the red line
            H[:K1 + 1, 1] = np.minimum(H[:K1 + 1, 1], interp(TOP, d) + NOSE_Y)
        elif 2.6 < d <= 11.82 and d not in top_exact:
            # top line: lift the upper outline (canopy, spine) onto the side view's top
            yT, yL = H[0, 1], H[K1, 1]
            dy = interp(TOP, d) + NOSE_Y - yT
            w = np.clip((H[:K1 + 1, 1] - yL) / max(yT - yL, 1e-6), 0, 1)
            H[:K1 + 1, 1] += dy * w
        # A-D (owner, 2026-11-18): between the traced sections the body is a straight blend of
        # them; only behind D does the outline get stretched to the top view's LERX edge.
        if 7.13 < d <= 7.83:
            # LERX edge: stretch the outer part out to the top view's edge
            xL, hw = H[K1, 0], interp(HW, d)
            lower_max = H[K1 + 1:, 0].max()
            x0_lo = 1.15 if lower_max > 1.2 else 0.5
            for i in range(len(H)):
                x0, span = (0.5, xL) if i <= K1 else (x0_lo, max(lower_max, xL) if x0_lo < 1 else lower_max)
                if H[i, 0] > x0 and span > x0 + 1e-6:
                    H[i, 0] = x0 + (H[i, 0] - x0) * (hw - x0) / (span - x0)
        out.append((d, H))
    return out


def canopy_rows():
    """The canopy on top of the fuselage: (d, half width, bottom, top, n) in the drawing frame."""
    ds = [2.95, 3.2, 3.5, 3.93, 4.29, 4.77, 5.01, 5.48, 5.96, 6.44, 6.6, 7.11, 7.45, 7.72]
    deck = _deck_edge()
    out = []
    for d in ds:
        sill = interp(TOP, d) + NOSE_Y
        top = max(interp(CANOPY_TOP, d) + NOSE_Y, sill + 0.01)
        # The canopy reaches 0.4 m into the fuselage and is at least as wide as the deck at the
        # sill, so no ledge of the deck shows beside it.
        bot = sill - 0.4
        cy, hh = 0.5 * (top + bot), 0.5 * (top - bot)
        s = min(abs(cy - sill) / hh, 0.999)
        frac = (1 - s ** 2.4) ** (1 / 2.4)
        hw = max(interp(CANOPY_HW, d), min((interp(deck, d) + 0.01) / frac, interp(deck, d) + 0.06))
        out.append((d, round(hw, 3), round(bot, 3), round(top, 3), 2.4))
    return out


# Canopy frame (M2 side and top views, owner 2026-11-18): a rail along the glass's lower edge,
# about 5 cm high at the windscreen, 8 cm over the front cockpit, 3 cm at the rear pane's end; a
# windscreen bow leaning forward (foot d 4.02, top d 3.88) 8 cm wide; a straight bow d 5.33-5.41
# between the cockpits.
RAIL = [(2.95, 0.05), (4.8, 0.08), (6.55, 0.03)]
BOW_FOOT, BOW_TOP, BOW_W = 4.02, 3.88, 0.08


def glass_edge(d0, d1):
    """Side-view lower edge of a glass pane: the red line plus the canopy rail, d0 -> d1."""
    ds = [d0] + [k for k, _ in TOP + RAIL if d0 < k < d1] + [d1]
    return [(d, round(interp(TOP, d) + NOSE_Y + interp(RAIL, d), 3)) for d in sorted(set(ds))]


def bow_line(y, offset=0.0):
    """d of the windscreen bow's rear edge (plus offset) at drawing-frame height y."""
    y0 = interp(TOP, BOW_FOOT) + NOSE_Y + interp(RAIL, BOW_FOOT)
    y1 = interp(CANOPY_TOP, BOW_TOP) + NOSE_Y
    return round(BOW_FOOT + offset + (BOW_TOP - BOW_FOOT) * (y - y0) / (y1 - y0), 3)


def _deck_edge():
    """[(d, x)] of the fuselage's deck edge (the top's shoulder) under the canopy."""
    return [(d, float(H[KE, 0])) for d, H in body_halves() if SILL_FROM - 0.1 <= d <= SILL_TO + 0.5]


def bulkhead_rows(d0, d1, inset=0.03):
    """A wall that fills the canopy's section (inset inwards) from d0 to d1."""
    out = []
    for d in (d0, d1):
        sill = interp(TOP, d) + NOSE_Y
        top = interp(CANOPY_TOP, d) + NOSE_Y
        out.append((d, round(interp(CANOPY_HW, d) - inset, 3), round(sill - 0.15 + inset, 3), round(top - inset, 3), 2.4))
    return out


def ring(half):
    """Half outline -> full ring [x, y, t] in the builder's ring parameters (t = pi/2 at the top)."""
    n = SEGMENTS
    pts = []
    for k in range(n):
        # ring vertex k sits at t = 2 pi k / n; the half runs from k = n/4 (top) down to k = -n/4
        j = n // 4 - k if k <= n // 4 else (n // 4 - (k - n) if k >= 3 * n // 4 else None)
        if j is not None:
            x, y = half[j]
        else:
            x, y = half[k - n // 4]
            x = -x
        pts.append([round(float(x), 4), round(float(y), 4), round(2 * math.pi * k / n, 7)])
    return pts
