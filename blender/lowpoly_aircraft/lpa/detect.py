"""Suggest key areas (lpa/areas.json) from calibrated reference drawings.

Outline areas come from the drawing's silhouette in each calibrated view:

    side   nose tip, fuselage top and bottom lines, canopy and fin (bumps above the
           fuselage's trend line), nose and main gear legs and the ground line
           (when the view has a ground point)
    top    nose tip, wing leading and trailing edges (straight lines fitted to the
           silhouette's edge), wing tip, tailplane, fuselage width

Each suggestion carries a confidence: 'sure' when cross-checks agree (left and
right halves mirror each other, the span and length match the published sizes),
else 'check'. Inner lines (control surfaces, windows, intakes) are drawn inside
the silhouette and are not found here: Claude proposes them by looking at the
image, and `snap` pulls each point onto the nearest ink line.

Suggestions go under the area's "suggest" in refs.json (marks stay untouched):

    "fin": {"suggest": [{"img": "...", "view": "side", "pts": [[u, v], ...],
                         "conf": "check", "by": "outline", "why": "..."}]}

Pure Python + numpy, no bpy.
"""
from __future__ import annotations

import numpy as np

from . import refs as R
from . import silhouette as sil

SPAN_TOL = 0.03       # semi-span within 3 % of span_m / 2 counts as matching
SYM_TOL = 0.02        # left and right semi-spans within 2 %


def _sug(view: R.RefView, area: str, m, conf: str, why: str) -> dict:
    px = view.to_px(np.asarray(m, dtype=np.float64).reshape(-1, 2))
    return {'area': area, 'img': view.image_id, 'view': view.view,
            'pts': [[round(float(u), 1), round(float(v), 1)] for u, v in px],
            'conf': conf, 'by': 'outline', 'why': why}


def _simplify(pts: np.ndarray, eps: float) -> np.ndarray:
    pts = np.asarray(pts, dtype=np.float64)
    if len(pts) < 3:
        return pts
    return pts[sil._dp_open(pts, eps)]


def view_silhouette(view: R.RefView, ink: np.ndarray) -> np.ndarray:
    """Filled silhouette (image-sized) of the drawing connected to the view's nose tip."""
    part = R.view_part(view, ink)
    return sil.filled_silhouette(part, 2)


def metre_grid(view: R.RefView, mask: np.ndarray):
    """Rasterise a mask on the view's metre axes at 1 px per cell.

    Returns (grid[b, a], a0, b0, step): cell (i, j) covers a = a0 + j*step, b = b0 + i*step.
    """
    vs, us = np.nonzero(mask)
    if not len(us):
        return None
    m = view.to_m(np.stack([us, vs], axis=-1))
    step = 1.0 / view.px_per_m
    ia = np.round(m[:, 0] / step).astype(int)
    ib = np.round(m[:, 1] / step).astype(int)
    a_lo, b_lo = ia.min(), ib.min()
    g = np.zeros((ib.max() - b_lo + 1, ia.max() - a_lo + 1), bool)
    g[ib - b_lo, ia - a_lo] = True
    if view.rot_deg:
        g = sil.erode(sil.dilate(g, 1), 1) | g      # a turned image leaves pinholes
    return g, a_lo * step, b_lo * step, step


def _runs(row: np.ndarray) -> list[tuple[int, int]]:
    """(start, end) index pairs of True runs, end inclusive."""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0] - 1))


def _fill_nan(y: np.ndarray) -> np.ndarray:
    ok = ~np.isnan(y)
    if ok.sum() < 2:
        return y
    idx = np.arange(len(y))
    return np.interp(idx, idx[ok], y[ok])


def _running(y: np.ndarray, k: int, fn) -> np.ndarray:
    pad = np.concatenate([np.full(k, np.nan), y, np.full(k, np.nan)])
    win = np.lib.stride_tricks.sliding_window_view(pad, 2 * k + 1)
    with np.errstate(all='ignore'):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            return fn(win, axis=1)


def robust_fit(x: np.ndarray, y: np.ndarray, deg: int, tol: float, side: int = 0, iters: int = 10):
    """Polynomial fit that drops points off the fit by more than tol (side +1: only those above)."""
    keep = np.ones(len(x), bool)
    c = np.polyfit(x, y, deg)
    for _ in range(iters):
        if keep.sum() <= deg + 1:
            break
        c = np.polyfit(x[keep], y[keep], deg)
        r = y - np.polyval(c, x)
        r = r if side > 0 else -r if side < 0 else np.abs(r)
        new = r < tol
        if np.array_equal(new, keep):
            break
        keep = new
    return c, keep


def _bumps(r: np.ndarray, thr: float, edge: float) -> list[tuple[int, int, float]]:
    """Index ranges where r rises above thr, widened to where it falls below edge; with their area."""
    out = []
    for s, e in _runs(r > thr):
        while s > 0 and r[s - 1] > edge:
            s -= 1
        while e < len(r) - 1 and r[e + 1] > edge:
            e += 1
        out.append((s, e, float(np.clip(r[s:e + 1], 0, None).sum())))
    return out


# ---- side view -------------------------------------------------------------------------------
def side_areas(view: R.RefView, ink: np.ndarray, length_m: float | None, ground_px=None) -> tuple[list[dict], dict]:
    out, info = [], {}
    out.append(_sug(view, 'nose_tip', [[0.0, view.nose_y_m]], 'sure', 'the calibrated nose tip'))
    # The side profile is the ink's upper and lower edge (no fill: a drawn ground line touching
    # the wheels would close the space under the aircraft). The ground line itself is left out.
    yg = None
    if ground_px is not None:
        yg = float(view.to_m([ground_px])[0, 1])
        u0, v0, u1, v1 = (int(round(c)) for c in view.crop)
        sub = ink[max(v0, 0):v1, max(u0, 0):u1]
        vs, us = np.nonzero(sub)
        low = view.to_m(np.stack([us + max(u0, 0), vs + max(v0, 0)], axis=-1))[:, 1] < yg + 0.08
        ink = ink.copy()
        ink[vs[low] + max(v0, 0), us[low] + max(u0, 0)] = False
    part = R.view_part(view, ink)
    g = metre_grid(view, part)
    if g is None:
        return out, info
    grid, d0, y0, step = g
    cols = grid.any(axis=0)
    d = d0 + np.arange(grid.shape[1]) * step
    top = np.where(cols, y0 + (grid.shape[0] - 1 - np.argmax(grid[::-1], axis=0)) * step, np.nan)
    bot = np.where(cols, y0 + np.argmax(grid, axis=0) * step, np.nan)
    # Thin outlines break up in scans: a column that misses its outline pixel shows an inner
    # line instead, so take the extreme over a few neighbouring columns.
    top, bot = _running(top, 4, np.nanmax), _running(bot, 4, np.nanmin)
    aft = d >= 0
    d, top, bot = d[aft], _fill_nan(top[aft]), _fill_nan(bot[aft])
    if len(d) < 20:
        return out, info
    L = float(d[-1])
    info['tail_d'] = L
    eps = 0.03

    # The fuselage's top trend ignores the canopy and the fin (points well above it).
    span = d >= 0.12 * L
    ct, _ = robust_fit(d[span], top[span], 3, 0.08, side=+1)
    trend_t = np.polyval(ct, d)
    trend_t[~span] = top[~span]
    r = top - trend_t
    bumps = _bumps(r, 0.15, 0.03)
    fuse_top = top.copy()
    fin = [b for b in bumps if d[b[0]] > 0.45 * L and np.max(r[b[0]:b[1] + 1]) > 0.5]
    can = [b for b in bumps if d[b[1]] < 0.55 * L and np.max(r[b[0]:b[1] + 1]) < 1.5]
    for name, cand, why in (('fin', fin, 'the tallest bump above the aft fuselage'),
                            ('canopy', can, 'the bump above the forward fuselage')):
        if not cand:
            continue
        s, e, _ = max(cand, key=lambda b: b[2])
        fuse_top[s:e + 1] = trend_t[s:e + 1]
        poly = np.stack([d[s:e + 1], top[s:e + 1]], axis=-1)
        poly = np.vstack([[d[s], trend_t[s]], poly, [d[e], trend_t[e]]])
        out.append(_sug(view, name, _simplify(poly, eps), 'check', why))
        info[name] = (float(d[s]), float(d[e]), float(np.max(r[s:e + 1])))

    # Gear: the silhouette's low columns near the ground line.
    gear_cols = np.zeros(len(d), bool)
    if yg is not None:
        info['ground_y'] = yg
        near = bot < yg + 0.4
        clusters = []
        for s, e in _runs(near):
            if (e - s) * step < 3.0:
                clusters.append((s, e))
        # Neighbouring columns of one leg (wheel, door) belong together.
        merged = []
        for c in clusters:
            if merged and (c[0] - merged[-1][1]) * step < 0.6:
                merged[-1] = (merged[-1][0], c[1])
            else:
                merged.append(c)
        for s, e in merged:
            gear_cols[max(s - 2, 0):e + 3] = True
        ok = ~gear_cols & (d > 0.05 * L) & (d < 0.97 * L)
        if ok.sum() > 10:
            cb, _ = robust_fit(d[ok], bot[ok], 3, 0.1, side=-1)
        else:
            cb = np.polyfit(d, bot, 1)
        legs = []
        for s, e in merged:
            dc = float((d[s] + d[e]) / 2)
            legs.append((dc, [[dc, yg], [dc, float(np.polyval(cb, dc))]]))
        if legs:
            sure = len(legs) == 2 and legs[0][0] < 0.4 * L and 0.35 * L < legs[1][0] < 0.8 * L
            conf = 'sure' if sure else 'check'
            out.append(_sug(view, 'gear_nose', legs[0][1], conf, 'the foremost wheel on the ground line'))
            if len(legs) > 1:
                main = min(legs[1:], key=lambda l: abs(l[0] - 0.55 * L))
                out.append(_sug(view, 'gear_main', main[1], conf, 'the wheel on the ground line behind the nose gear'))
            info['gear_d'] = [l[0] for l in legs]
        out.append(_sug(view, 'ground_stance', [[-0.5, yg], [L + 0.5, yg]], 'sure', 'the calibrated ground point'))

    fb = bot.copy()
    if gear_cols.any():
        fb[gear_cols] = np.nan
        fb = _fill_nan(fb)
    out.append(_sug(view, 'fuse_top', _simplify(np.stack([d, fuse_top], -1), eps), 'check',
                    'upper edge of the side view, canopy and fin left out'))
    out.append(_sug(view, 'fuse_bottom', _simplify(np.stack([d, fb], -1), eps), 'check',
                    'lower edge of the side view' + (', gear left out' if gear_cols.any() else '')))
    return out, info


# ---- top view --------------------------------------------------------------------------------
def _half(grid: np.ndarray, d0: float, step: float, xs: np.ndarray, sign: int) -> dict | None:
    """Planform of one wing half: rows by |x|, with the wing's edge lines fitted."""
    rows = np.nonzero((np.sign(xs) == sign) & grid.any(axis=1))[0]
    if len(rows) < 20:
        return None
    rows = rows[np.argsort(np.abs(xs[rows]))]
    ax = np.abs(xs[rows])
    xmax = float(ax.max())
    runs = [_runs(grid[i]) for i in rows]
    le = np.array([d0 + r[0][0] * step for r in runs])
    te = np.array([d0 + r[0][1] * step for r in runs])
    band = (ax > 0.4 * xmax) & (ax < 0.95 * xmax)
    if band.sum() < 8:
        return None
    cl, kl = robust_fit(ax[band], le[band], 1, 0.15)
    # The trailing edge: the end of the run that holds the leading edge.
    te2 = np.array([d0 + next((e for s, e in r if d0 + s * step <= np.polyval(cl, a) + 0.3 <= d0 + e * step + 0.3),
                              r[0][1]) * step for r, a in zip(runs, ax)])
    ctt, kt = robust_fit(ax[band], te2[band], 1, 0.15)

    def root(fit, vals):
        x_root = 0.4 * xmax
        for a, v in sorted(zip(ax, vals), reverse=True):
            if a > 0.4 * xmax:
                continue
            if abs(v - np.polyval(fit, a)) > 0.15:
                break
            x_root = a
        return float(x_root)

    out = {'xmax': xmax, 'le': cl, 'te': ctt, 'le_root': root(cl, le), 'te_root': root(ctt, te2),
           'le_ok': float(kl.mean()), 'te_ok': float(kt.mean())}
    # Tip chord, from the outermost rows.
    tip = ax > xmax - 0.3
    out['tip'] = (float(le[tip].min()), float(te2[tip].max()))
    # Tailplane: runs that start behind the wing's trailing edge line.
    ht = []
    for r, a in zip(runs, ax):
        tline = np.polyval(ctt, a)
        later = [(d0 + s * step, d0 + e * step) for s, e in r if d0 + s * step > tline + 0.2]
        if later and a > 0.15 * xmax:
            ht.append((a, later[0][0], later[0][1]))
    out['htail'] = ht
    return out


def top_areas(view: R.RefView, ink: np.ndarray, span_m: float | None) -> tuple[list[dict], dict]:
    out, info = [], {}
    out.append(_sug(view, 'nose_tip', [[0.0, 0.0]], 'sure', 'the calibrated nose tip'))
    g = metre_grid(view, view_silhouette(view, ink))
    if g is None:
        return out, info
    grid, d0, x0, step = g
    xs = x0 + np.arange(grid.shape[0]) * step
    left, right = _half(grid, d0, step, xs, +1), _half(grid, d0, step, xs, -1)
    if not left:
        return out, info
    info['tail_d'] = float(d0 + (np.nonzero(grid.any(axis=0))[0].max()) * step)
    info['semi_span'] = (left['xmax'], right['xmax'] if right else None)
    checks = []
    span_ok = sym_ok = None
    if span_m:
        span_ok = abs(left['xmax'] / (span_m / 2) - 1) < SPAN_TOL
        checks.append(f'semi-span {left["xmax"]:.2f} m vs {span_m / 2:.2f} m')
    if right:
        sym_ok = (abs(left['xmax'] / right['xmax'] - 1) < SYM_TOL
                  and abs(left['le'][0] - right['le'][0]) < 0.05 and abs(np.polyval(left['le'], 2) - np.polyval(right['le'], 2)) < 0.15
                  and abs(left['te'][0] - right['te'][0]) < 0.05 and abs(np.polyval(left['te'], 2) - np.polyval(right['te'], 2)) < 0.15)
        checks.append('left and right ' + ('mirror each other' if sym_ok else 'differ'))
    sure = 'sure' if span_ok is not False and sym_ok else 'check'
    why = '; '.join(checks)
    xm, a = left['xmax'], left
    le = lambda x: float(np.polyval(a['le'], x))
    te = lambda x: float(np.polyval(a['te'], x))
    out.append(_sug(view, 'wing_le', [[le(a['le_root']), a['le_root']], [le(xm), xm]],
                    sure if a['le_ok'] > 0.8 else 'check', 'straight line fitted to the front edge of the wing; ' + why))
    out.append(_sug(view, 'wing_te', [[te(a['te_root']), a['te_root']], [te(xm), xm]],
                    sure if a['te_ok'] > 0.8 else 'check', 'straight line fitted to the rear edge of the wing; ' + why))
    t0, t1 = a['tip']
    w = min(0.3, 0.1 * xm)
    out.append(_sug(view, 'wing_tip', [[le(xm - w), xm - w], [t0, xm], [t1, xm], [te(xm - w), xm - w]],
                    sure, 'outermost chord of the wing; ' + why))
    ht = a['htail']
    if len(ht) >= 5:
        ht.sort()
        poly = [[s, x] for x, s, e in ht] + [[e, x] for x, s, e in reversed(ht)]
        out.append(_sug(view, 'htail', _simplify(np.asarray(poly), 0.04), 'check', 'the surface behind the wing'))
        info['htail_span'] = float(ht[-1][0])
    # Fuselage width: the run across the centreline, wing and tailplane roots bridged.
    cols = np.nonzero(grid.any(axis=0))[0]
    i0 = int(np.argmin(np.abs(xs)))
    half = np.full(grid.shape[1], np.nan)
    for j in cols:
        c = grid[:, j]
        if not c[i0]:
            continue
        k = i0
        while k + 1 < len(c) and c[k + 1]:
            k += 1
        half[j] = xs[k]
    dd = d0 + np.arange(grid.shape[1]) * step
    # Under the wing and tailplane the body's edge is where their edge lines leave it: bridge
    # between those root points.
    anchors = [(le(a['le_root']), a['le_root']), (te(a['te_root']), a['te_root'])]
    gaps = [(anchors[0][0] - 0.2, anchors[1][0] + 0.2)]
    if len(ht) >= 5:
        x_in, s_in, e_in = ht[0]
        anchors += [(s_in, x_in), (e_in, x_in)]
        gaps.append((s_in - 0.2, e_in + 0.2))
    for s, e in gaps:
        half[(dd > s) & (dd < e)] = np.nan
    for dv, xv in anchors:
        half[int(np.clip(round((dv - d0) / step), 0, len(half) - 1))] = xv
    ok = ~np.isnan(half)
    if ok.sum() > 10:
        lo, hi = np.nonzero(ok)[0][[0, -1]]
        pts = np.stack([dd[lo:hi + 1], _fill_nan(half[lo:hi + 1])], -1)
        out.append(_sug(view, 'fuse_plan', _simplify(pts, 0.03), 'check',
                        'half width across the centreline, wing and tailplane roots bridged'))
    return out, info


def detect(rs: R.RefSet, masks: dict[str, np.ndarray]) -> tuple[list[dict], list[str]]:
    """Suggestions for every calibrated view whose image mask is given; the first view per area wins.

    Returns (suggestions, notes) where notes are the cross-checks between views.
    """
    by_area: dict[str, dict] = {}
    notes, tails = [], []
    for img in sorted(rs.images, key=lambda i: i.get('priority', 9)):
        ink = masks.get(img['id'])
        if ink is None:
            continue
        for v in img.get('views', []):
            try:
                rv = R.view_from_json(img['id'], v, rs.ground_y, rs.length_m, rs.span_m)
            except R.RefError:
                continue
            if not rv.crop:
                continue
            try:
                if rv.view == 'side':
                    found, info = side_areas(rv, ink, rs.length_m, (v.get('cal') or {}).get('ground'))
                elif rv.view == 'top':
                    found, info = top_areas(rv, ink, rs.span_m)
                else:
                    continue
            except R.RefError as e:
                notes.append(str(e))
                continue
            if 'tail_d' in info:
                tails.append((f'{img["id"]}/{rv.view}', info['tail_d']))
            for s in found:
                by_area.setdefault(s['area'], s)
    if rs.length_m:
        for name, t in tails:
            err = t / rs.length_m - 1
            notes.append(f'{name}: tail at {t:.2f} m ({err:+.1%} vs {rs.length_m} m)')
            if abs(err) > 0.03:
                # A view drawn short or long: what it measures needs a look.
                for s in by_area.values():
                    if f'{s["img"]}/{s["view"]}' == name and s['conf'] == 'sure' and s['area'] not in ('nose_tip', 'ground_stance'):
                        s['conf'] = 'check'
                        s['why'] += f'; this view is {err:+.1%} off the length'
    return list(by_area.values()), notes


def snap(pts, ink: np.ndarray, radius_px: float = 6.0) -> list[list[float]]:
    """Move each point onto the nearest ink pixel within radius_px (points with none stay)."""
    h, w = ink.shape
    out = []
    r = int(np.ceil(radius_px))
    for u, v in pts:
        iu, iv = int(round(u)), int(round(v))
        u0, v0 = max(iu - r, 0), max(iv - r, 0)
        win = ink[v0:min(iv + r + 1, h), u0:min(iu + r + 1, w)]
        vs, us = np.nonzero(win)
        if len(us):
            dist = (us + u0 - u) ** 2 + (vs + v0 - v) ** 2
            k = int(np.argmin(dist))
            if dist[k] <= radius_px ** 2:
                out.append([float(us[k] + u0), float(vs[k] + v0)])
                continue
        out.append([float(u), float(v)])
    return out


def merge_into(areas: dict, suggestions: list[dict], force: bool = False) -> list[str]:
    """Put suggestions under refs.json "areas"; areas that are marked, absent, unseen or dismissed keep theirs."""
    done = []
    for s in suggestions:
        e = areas.setdefault(s['area'], {})
        if not force and (e.get('marks') or e.get('status') or e.get('dismissed')):
            continue
        keep = [x for x in e.get('suggest', []) if x.get('by') != s['by'] or (x['img'], x['view']) != (s['img'], s['view'])]
        e['suggest'] = keep + [{k: s[k] for k in ('img', 'view', 'pts', 'conf', 'by', 'why')}]
        done.append(s['area'])
    return done
