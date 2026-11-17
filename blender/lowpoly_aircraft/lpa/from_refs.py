"""Spec numbers from marked areas (refs.json "areas"), and the model checked against them.

The marks replace hand-typed numbers in a spec: a helper turns the areas it reads into
the rows a part takes, and says which areas they came from. Only marks count (an area
the user confirmed); suggestions wait for confirmation in the Hangar.

    from lpa import refs, from_refs as F
    rs = refs.load('examples/mig29kub/refs.json')
    fr = F.Frame(nose_z=8.7, nose_y=0.0)               # where the nose tip sits in the body frame
    F.fuselage_stations(rs, fr)                         # loft rows, from fuse_top / fuse_bottom / fuse_plan
    F.wing_stations(rs, fr)                             # panel rows, from wing_le / wing_te
    F.outline_stations(rs, fr, 'fin', x=1.6)            # panel rows from an outline (fin, tailplane)
    F.surface_polygon(rs, fr, 'ailerons')               # 'polygon_m' of a control surface
    F.gear_contacts(rs, fr)                             # wheel ground contacts (y, z)

The deviation check (`deviations`) compares the model's silhouette in each view with the
marks of the outline areas; build_aircraft.py prints it when the spec names its refs.json.

Drawing frame -> body frame: d (aft of the nose tip) -> z = nose_z - d, x -> x, y (up from
the nose tip) -> nose_y + y. Pure Python + numpy, no bpy.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from . import areas as A
from . import refs as R

# Areas whose marks follow the silhouette in their view, so the model's outline must meet them.
OUTLINE_AREAS = {'nose_tip': ('side', 'top'), 'fuse_top': ('side',), 'fuse_bottom': ('side',), 'fuse_plan': ('top',),
                 'canopy': ('side',), 'fin': ('side',), 'wing_le': ('top',), 'wing_te': ('top',), 'wing_tip': ('top',),
                 'htail': ('top',), 'tail_cone': ('side', 'top'), 'radome': ('side', 'top')}
TOLERANCE_M = 0.10


@dataclass
class Frame:
    nose_z: float
    nose_y: float = 0.0

    def body(self, dxy) -> np.ndarray:
        """(n, 3) d, x, y -> (n, 3) body x, y, z (NaN stays NaN)."""
        p = np.asarray(dxy, dtype=np.float64).reshape(-1, 3)
        return np.stack([p[:, 1], self.nose_y + p[:, 2], self.nose_z - p[:, 0]], axis=-1)


def frame_from_spec(spec: dict) -> Frame:
    """The nose tip from the spec: 'nose_m' [y, z] if given, else the first station of the 'Fuselage' loft."""
    if spec.get('nose_m'):
        y, z = spec['nose_m']
        return Frame(float(z), float(y))
    for p in spec.get('parts', []):
        if p.get('type') == 'loft' and p.get('name', '').lower().startswith('fuselage'):
            st = max(p['stations'], key=lambda s: s[0])
            return Frame(float(st[0]), float(st[2]))
    raise ValueError('spec has no nose_m and no Fuselage loft to find the nose tip from')


def measured(rs: R.RefSet, area: str, view: str | None = None) -> list[A.Measured]:
    e = (rs.areas or {}).get(area) or {}
    return [m for m in A.measure(rs, area, e) if view is None or m.view == view]


def _ab(m: A.Measured) -> np.ndarray:
    """A mark's points on its view's two axes (d/x/y columns picked by the view)."""
    ax = R.VIEW_AXES[m.view]
    return np.stack([m.dxy[:, 'dxy'.index(ax[0])], m.dxy[:, 'dxy'.index(ax[1])]], axis=-1)


def _line(rs, area, view, absolute=False):
    """A marked line as b(a), joined over all its marks in that view and sorted along a."""
    ms = measured(rs, area, view)
    if not ms:
        return None
    pts = np.vstack([_ab(m) for m in ms])
    if absolute:
        pts[:, 1] = np.abs(pts[:, 1])
    pts = pts[np.argsort(pts[:, 0])]
    return pts


def _interp(line: np.ndarray, a):
    return np.interp(a, line[:, 0], line[:, 1])


def fuselage_stations(rs: R.RefSet, fr: Frame, count: int = 18, squareness: float = 2.4) -> dict:
    """Loft rows (z, cx, cy, half_width, above, below, n) from the marked fuselage lines.

    fuse_top and fuse_bottom (side) give the height, fuse_plan (top, one side) the half
    width; without fuse_plan the section is taken as round. Stations crowd towards the nose.
    """
    top, bot = _line(rs, 'fuse_top', 'side'), _line(rs, 'fuse_bottom', 'side')
    if top is None or bot is None:
        raise ValueError('fuse_top and fuse_bottom must be marked on a side view')
    plan = _line(rs, 'fuse_plan', 'top', absolute=True)
    end = min(top[-1, 0], bot[-1, 0])
    rows = []
    for k in range(count):
        d = end * (k / (count - 1)) ** 1.4
        yt, yb = float(_interp(top, d)), float(_interp(bot, d))
        h = max(yt - yb, 0.0) / 2
        hw = float(_interp(plan, d)) if plan is not None else h
        if k == 0:
            h = hw = 0.0
        rows.append([round(float(fr.nose_z - d), 3), 0.0, round(fr.nose_y + (yt + yb) / 2, 3), round(hw, 3), round(h, 3), round(h, 3), squareness])
    return {'stations': rows, 'from': ['fuse_top', 'fuse_bottom'] + (['fuse_plan'] if plan is not None else [])}


def wing_stations(rs: R.RefSet, fr: Frame, le: str = 'wing_le', te: str = 'wing_te', y: float = 0.0,
                  tc=(0.045, 0.04)) -> dict:
    """Panel rows (le_x, le_y, le_z, chord, t/c), root and tip, from a marked leading and trailing edge (top view)."""
    L, T = _line_x(rs, le), _line_x(rs, te)
    if L is None or T is None:
        raise ValueError(f'{le} and {te} must be marked on a top view')
    x0, x1 = max(L[0, 0], T[0, 0]), min(L[-1, 0], T[-1, 0])
    rows = []
    for x, t in ((x0, tc[0]), (x1, tc[1])):
        dl, dt = float(_interp(L, x)), float(_interp(T, x))
        rows.append([round(float(x), 3), y, round(fr.nose_z - dl, 3), round(dt - dl, 3), t])
    return {'stations': rows, 'from': [le, te]}


def _line_x(rs, area):
    """A top-view line as d(x) on the left half (|x|), sorted along x."""
    ms = measured(rs, area, 'top')
    if not ms:
        return None
    pts = np.vstack([np.stack([np.abs(m.dxy[:, 1]), m.dxy[:, 0]], -1) for m in ms])
    return pts[np.argsort(pts[:, 0])]


def _cut(poly: np.ndarray, level: float) -> np.ndarray:
    """Where the closed polygon (a, b) crosses b = level: the a values."""
    out = []
    for p, q in zip(poly, np.roll(poly, -1, axis=0)):
        if (p[1] - level) * (q[1] - level) <= 0 and p[1] != q[1]:
            out.append(p[0] + (level - p[1]) * (q[0] - p[0]) / (q[1] - p[1]))
    return np.array(out)


def outline_stations(rs: R.RefSet, fr: Frame, area: str, x: float | None = None, y: float | None = None,
                     tc=(0.045, 0.04)) -> dict:
    """Panel rows (root, tip) from a marked outline: a fin on a side view, a tailplane on a top view.

    The outline is cut near its root and its tip; the cut's front is the leading edge and its
    length the chord. A side view does not see x (pass the fin's x), a top view not y.
    """
    ms = [m for m in measured(rs, area) if m.view in ('side', 'top', 'bottom')]
    if not ms:
        raise ValueError(f'{area} is not marked on a side or top view')
    m = ms[0]
    poly = _ab(m)
    if m.view != 'side':
        poly[:, 1] = np.abs(poly[:, 1])
    lo, hi = poly[:, 1].min(), poly[:, 1].max()
    eps = 0.02 * (hi - lo)
    # The root: where the outline is widest in its lower third (a fin's base may slope).
    levels = np.linspace(lo + eps, lo + 0.33 * (hi - lo), 12)
    widths = [np.ptp(c) if len(c := _cut(poly, lv)) >= 2 else 0.0 for lv in levels]
    root = float(levels[int(np.argmax(widths))])
    rows = []
    for level, t in ((root, tc[0]), (hi - eps, tc[1])):
        a = _cut(poly, level)
        if len(a) < 2:
            raise ValueError(f'{area}: outline is not closed around {level:.2f} m')
        if m.view == 'side':
            p = [x if x is not None else 0.0, fr.nose_y + level, fr.nose_z - a.min()]
        else:
            p = [level, y if y is not None else 0.0, fr.nose_z - a.min()]
        rows.append([round(float(p[0]), 3), round(float(p[1]), 3), round(float(p[2]), 3), round(float(a.max() - a.min()), 3), t])
    return {'stations': rows, 'from': [area], 'view': m.view}


def surface_polygon(rs: R.RefSet, fr: Frame, area: str) -> dict:
    """A control surface outline as a spec surface's polygon_m: [x, z] on a top view, [z, y] on a side view."""
    ms = [m for m in measured(rs, area) if m.view in ('top', 'side')]
    if not ms:
        raise ValueError(f'{area} is not marked on a top or side view')
    m = ms[0]
    b = fr.body(m.dxy)
    poly = b[:, [0, 2]] if m.view == 'top' else b[:, [2, 1]]
    if m.view == 'top':
        poly[:, 0] = np.abs(poly[:, 0])
    return {'view': m.view, 'polygon_m': np.round(poly, 3).tolist(), 'from': [area]}


def gear_contacts(rs: R.RefSet, fr: Frame) -> dict:
    """Ground contact (y, z) of the nose and main wheels from the marked gear legs (side view): their lowest point."""
    out = {}
    for area in ('gear_nose', 'gear_main'):
        ms = measured(rs, area, 'side')
        if not ms:
            continue
        p = np.vstack([m.dxy for m in ms])
        k = int(np.nanargmin(p[:, 2]))
        b = fr.body(p[k:k + 1])[0]
        out[area] = {'y': round(float(b[1]), 3), 'z': round(float(b[2]), 3)}
    return out


# ---- deviation check ------------------------------------------------------------------------
def _plane(view: str, P: np.ndarray) -> np.ndarray:
    """Body points -> the view's plane, in the drawing's (a, b) axes before the nose shift: side (z, y), top (z, x)."""
    return P[..., [2, 1]] if view == 'side' else P[..., [2, 0]] if view in ('top', 'bottom') else P[..., [0, 1]]


def silhouette(tris: np.ndarray, view: str, res: float = 0.02):
    """Rasterise body-frame triangles (n, 3, 3) seen in a view: (mask, origin, res)."""
    T = _plane(view, np.asarray(tris, dtype=np.float64))
    lo = T.reshape(-1, 2).min(axis=0) - 2 * res
    hi = T.reshape(-1, 2).max(axis=0) + 2 * res
    w, h = (np.ceil((hi - lo) / res).astype(int) + 1)
    mask = np.zeros((h, w), bool)
    G = (T - lo) / res
    for t in G:
        (x0, y0), (x1, y1), (x2, y2) = t
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-12:
            continue
        i0, i1 = int(math.floor(min(x0, x1, x2))), int(math.ceil(max(x0, x1, x2)))
        j0, j1 = int(math.floor(min(y0, y1, y2))), int(math.ceil(max(y0, y1, y2)))
        xs, ys = np.meshgrid(np.arange(i0, i1 + 1), np.arange(j0, j1 + 1))
        l0 = ((y1 - y2) * (xs - x2) + (x2 - x1) * (ys - y2)) / den
        l1 = ((y2 - y0) * (xs - x2) + (x0 - x2) * (ys - y2)) / den
        inside = (l0 >= -0.02) & (l1 >= -0.02) & (l0 + l1 <= 1.02)
        mask[ys[inside], xs[inside]] = True
    return mask, lo, res


def _boundary(mask: np.ndarray) -> np.ndarray:
    m = np.pad(mask, 1)
    inner = m[1:-1, 1:-1] & m[:-2, 1:-1] & m[2:, 1:-1] & m[1:-1, :-2] & m[1:-1, 2:]
    return mask & ~inner


def _densify(pts: np.ndarray, closed: bool, step: float = 0.1) -> np.ndarray:
    if len(pts) < 2:
        return pts
    seq = np.vstack([pts, pts[:1]]) if closed else pts
    out = [seq[0]]
    for p, q in zip(seq[:-1], seq[1:]):
        n = max(1, int(np.ceil(np.linalg.norm(q - p) / step)))
        out.extend(p + (q - p) * (k / n) for k in range(1, n + 1))
    return np.asarray(out)


def drawing_outlines(rs: R.RefSet, masks: dict) -> dict:
    """The drawing's own outline per calibrated side/top view: {(image, view): (n, 2) metres on the view's axes}."""
    from . import detect as D
    out = {}
    for v in rs.views():
        if v.view not in ('side', 'top', 'bottom') or v.image_id not in masks or not v.crop or (v.image_id, v.view) in out:
            continue
        try:
            sil = D.view_silhouette(v, masks[v.image_id])
        except R.RefError:
            continue
        vs, us = np.nonzero(_boundary(sil))
        out[(v.image_id, v.view)] = v.to_m(np.stack([us, vs], -1))
    return out


def deviations(tris: np.ndarray, rs: R.RefSet, fr: Frame, tol: float = TOLERANCE_M, res: float = 0.02,
               outlines: dict | None = None, on_outline: float = 0.08) -> list[dict]:
    """How far each outline area's marks lie from the model's silhouette edge, per view.

    Parts of a mark that do not follow the drawing's outline (the fuselage line under the fin,
    the root of a fin or tailplane outline) cannot be compared with the model's outline. With
    the drawing's outlines (`drawing_outlines`) only mark points within `on_outline` metres of
    the drawing's outline are checked; without them every point is, and the result says so.

    Returns rows {area, view, points, mean_m, max_m, worst (d, x|y), ok, filtered}. Marks on the
    left half of a plan view are checked as they are; the model is mirrored, so either half works.
    """
    catalog = {a['id']: a for a in A.load_catalog()}
    sils, rows = {}, []
    for area, views in OUTLINE_AREAS.items():
        for m in measured(rs, area):
            if m.view not in views:
                continue
            if m.view not in sils:
                mask, lo, r = silhouette(tris, m.view, res)
                b = _boundary(mask)
                js, is_ = np.nonzero(b)
                sils[m.view] = np.stack([lo[0] + is_ * r, lo[1] + js * r], -1)
            edge = sils[m.view]
            shape = catalog.get(area, {}).get('shape')
            ab = _ab(m)
            ab = _densify(ab, closed=shape == 'area') if shape != 'point' else ab
            draw = (outlines or {}).get((m.image, m.view))
            if draw is not None:
                near = np.empty(len(ab))
                for s in range(0, len(ab), 256):
                    near[s:s + 256] = np.linalg.norm(ab[s:s + 256, None, :] - draw[None, :, :], axis=-1).min(axis=1)
                ab = ab[near <= on_outline]
                if not len(ab):
                    continue
            # Drawing (d, x|y) -> the model's plane (z, x|y).
            pts = np.stack([fr.nose_z - ab[:, 0], ab[:, 1] + (fr.nose_y if m.view == 'side' else 0.0)], -1)
            # Nearest silhouette edge point for each mark point (chunked to bound memory).
            dist = np.empty(len(pts))
            for s in range(0, len(pts), 256):
                dd = np.linalg.norm(pts[s:s + 256, None, :] - edge[None, :, :], axis=-1)
                dist[s:s + 256] = dd.min(axis=1)
            k = int(np.argmax(dist))
            wz, wb = pts[k]
            rows.append({'area': area, 'view': m.view, 'image': m.image, 'points': len(pts),
                         'mean_m': round(float(dist.mean()), 3), 'max_m': round(float(dist.max()), 3),
                         'worst': [round(fr.nose_z - wz, 2), round(float(wb if m.view != 'side' else wb - fr.nose_y), 2)],
                         'ok': bool(dist.max() <= tol), 'filtered': draw is not None})
    return rows


def report(rs: R.RefSet, devs: list[dict] | None = None) -> str:
    """Coverage of the 50 areas (and the deviation check, if given) as text for the build log."""
    rows = A.coverage(rs, rs.areas or {})
    by = {}
    for r in rows:
        by.setdefault(r['status'], []).append(r)
    need = [r['id'] for r in rows if r['need'] == 'always' and r['status'] not in ('marked', 'absent')]
    est = [r['id'] for r in rows if r['status'] == 'unseen']
    lines = [f'[lpa] areas: {len(by.get("marked", []))} measured, {len(est)} estimated (in no reference), '
             f'{len(by.get("absent", []))} not on this type, {len(by.get("suggested", []))} suggested (to confirm), '
             f'{len(by.get("missing", []))} missing']
    if need:
        lines.append(f'[lpa] not finished: needed areas not measured yet: {", ".join(need)}')
    else:
        lines.append('[lpa] every needed area is measured')
    if est:
        lines.append(f'[lpa] estimated, say so in the spec: {", ".join(est)}')
    for d in devs or []:
        flag = 'ok ' if d['ok'] else 'OFF'
        lines.append(f'[lpa] {flag} {d["area"]:<12} {d["view"]:<5} mean {d["mean_m"]:.2f} m, max {d["max_m"]:.2f} m'
                     + ('' if d['ok'] else f' at d {d["worst"][0]:.2f} m'))
    return '\n'.join(lines)
