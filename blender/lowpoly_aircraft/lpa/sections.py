"""Refined cross-sections on lofted parts (fuselage, nacelles, canopy).

A loft's stations are superellipses. Where those cannot follow a drawing (a flat
floor with chines, a bulged spine, a cockpit sill), a refined section replaces
the ring at one station by a polygon drawn in the Hangar's cross-section window:

    sections.json (next to spec.json, or the file the spec names under "sections"):
    {"aircraft": "<id>", "sections": [
        {"part": "Fuselage", "z": 4.12, "pts": [[x, y, t], ...], "d": 4.88, "note": "..."}]}

``z`` is the station in the spec's body frame (the frame the loft stations are
in, before the build moves the model onto its wheels); ``pts`` is the closed
outline as body metres (+X left wing, +Y up) and each point's ring parameter
``t`` (radians, the superellipse angle the point stands for; points the Hangar
inserts get the mid value of their neighbours). Points are matched to the
loft's ring vertices by ``t``, so the outline may have more points than the
loft has segments: the whole loft then gets those extra ring vertices.

At the station the ring is exactly the polygon; towards the neighbouring
stations of the spec (or the next refined section) the change fades out
linearly, so the rest of the part keeps its shape.

This module needs no Blender (unit tests: tests/test_sections.py). The build
logs every loft's final rings here (``LOG``); build_aircraft.py writes them
with the build's shift to <id>_lofts.json, which viewer/add_model.py hands to
the Hangar as models/<id>/lofts.json.
"""
from __future__ import annotations

import json
import math
import os

import numpy as np

TWO_PI = 2.0 * math.pi
T_EPS = 1e-6     # ring parameters closer than this are the same vertex
Z_EPS = 1e-3     # stations closer than this (metres) are the same station

LOG: list[dict] = []   # every loft built in this run, with its final rings (spec frame)


def catmull_rom(rows: np.ndarray, count: int) -> np.ndarray:
    """Resample a table of stations (rows) along a centripetal-free uniform Catmull-Rom spline."""
    rows = np.asarray(rows, dtype=np.float64)
    if len(rows) < 3 or count <= len(rows):
        return rows
    p = np.vstack([2 * rows[0] - rows[1], rows, 2 * rows[-1] - rows[-2]])
    seg = len(rows) - 1
    out = []
    for k in range(count):
        t = k / (count - 1) * seg
        i = min(int(t), seg - 1)
        u = t - i
        p0, p1, p2, p3 = p[i], p[i + 1], p[i + 2], p[i + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
                          + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
    return np.array(out)


def norm_t(t: float) -> float:
    t = math.fmod(float(t), TWO_PI)
    return t + TWO_PI if t < 0 else t


def mirror_t(t: float) -> float:
    """The ring parameter of the mirror image (x -> -x) of the vertex at t."""
    return norm_t(math.pi - t)


def base_ts(segments: int) -> list[float]:
    return [TWO_PI * k / segments for k in range(segments)]


def superellipse_at(row, ts) -> np.ndarray:
    """Ring points of one station row (z, cx, cy, a, top, bot, n[, n_top]) at the ring parameters ts."""
    _, cx, cy, a, top, bot, n = (float(v) for v in row[:7])
    n_top = float(row[7]) if len(row) > 7 else None
    out = np.empty((len(ts), 2))
    for k, t in enumerate(ts):
        c, s = math.cos(t), math.sin(t)
        n_k = n_top if (n_top is not None and s > 0) else n
        out[k, 0] = cx + a * math.copysign(abs(c) ** (2.0 / n_k), c)
        h = top if s >= 0 else bot
        out[k, 1] = cy + h * math.copysign(abs(s) ** (2.0 / n_k), s)
    return out


def ring_ts(segments: int, sections=()) -> list[float]:
    """The loft's ring parameters: the even ones, plus every point the refined sections added."""
    ts = sorted(set(base_ts(segments)) | {norm_t(p[2]) for s in sections for p in s['pts']})
    out: list[float] = []
    for t in ts:
        if not out or t - out[-1] > T_EPS:
            out.append(t)
    if len(out) > 1 and out[0] + TWO_PI - out[-1] <= T_EPS:
        out.pop()
    return out


def polygon_at(pts, ts) -> np.ndarray:
    """A refined outline (points [x, y, t]) at the ring parameters ts: its own points where t matches, else on its edges."""
    P = sorted(([float(p[0]), float(p[1]), norm_t(p[2])] for p in pts), key=lambda p: p[2])
    T = np.array([p[2] for p in P])
    XY = np.array([p[:2] for p in P])
    m = len(P)
    out = np.empty((len(ts), 2))
    for k, t in enumerate(ts):
        j = int(np.searchsorted(T, t + T_EPS, side='right'))   # first vertex after t
        i0 = j - 1
        t0 = T[i0] if i0 >= 0 else T[-1] - TWO_PI
        t1 = T[j] if j < m else T[0] + TWO_PI
        if abs(t - t0) <= T_EPS:
            out[k] = XY[i0 % m]
            continue
        f = (t - t0) / (t1 - t0) if t1 > t0 else 0.0
        out[k] = XY[i0 % m] * (1 - f) + XY[j % m] * f
    return out


def mirror_section(sec: dict) -> dict:
    """The same refined section on the mirrored part (x -> -x)."""
    out = dict(sec)
    out['pts'] = [[-float(p[0]), float(p[1]), mirror_t(p[2])] for p in sec['pts']]
    return out


def _row_at(rows: np.ndarray, z: float) -> np.ndarray | None:
    """The station row at z, interpolated between the rows around it (None outside the part)."""
    for i in range(len(rows) - 1):
        z0, z1 = rows[i, 0], rows[i + 1, 0]
        if min(z0, z1) - Z_EPS <= z <= max(z0, z1) + Z_EPS:
            f = 0.0 if abs(z1 - z0) < 1e-12 else (z - z0) / (z1 - z0)
            f = min(max(f, 0.0), 1.0)
            r = rows[i] * (1 - f) + rows[i + 1] * f
            r[0] = z
            return r
    return None


def _is_point(row) -> bool:
    return row[3] < 1e-3 or row[4] + row[5] < 1e-3


def loft_rings(stations, segments: int = 24, resample: int = 0, sections=(), name: str = 'loft'):
    """The loft's rings, nose first: [(z, points (m, 2))], with a single point where the tube closes.

    Without refined sections this is exactly the superellipse ring of every (resampled) station.
    Returns (rings, ts, used sections).
    """
    raw = np.asarray(stations, dtype=np.float64)
    rows = catmull_rom(raw, resample) if resample else raw.copy()
    rows[:, 3:6] = np.maximum(rows[:, 3:6], 0.0)
    rows[:, 6:] = np.maximum(rows[:, 6:], 1.2)
    used = []
    for sec in sorted(sections or [], key=lambda s: -float(s['z'])):
        z = float(sec['z'])
        r = _row_at(rows, z)
        if r is None:
            print(f'[lpa] section {name} at z {z:.3f}: outside the part (z {rows[:, 0].min():.2f} … {rows[:, 0].max():.2f}), skipped')
            continue
        if _is_point(r):
            print(f'[lpa] section {name} at z {z:.3f}: the part closes to a point there, skipped')
            continue
        if len(sec['pts']) < 3:
            print(f'[lpa] section {name} at z {z:.3f}: fewer than 3 points, skipped')
            continue
        used.append((z, r, sec))
    ts = ring_ts(segments, [s for _, _, s in used])
    # A ring exactly at every refined station.
    for z, r, _ in used:
        if not np.any(np.abs(rows[:, 0] - z) < Z_EPS):
            i = next(i for i in range(len(rows) - 1) if min(rows[i, 0], rows[i + 1, 0]) <= z <= max(rows[i, 0], rows[i + 1, 0]))
            rows = np.insert(rows, i + 1, r, axis=0)
    # Knots of the change: zero at the spec's own stations, the refined outline at its station.
    knots = [(z, polygon_at(sec['pts'], ts) - superellipse_at(r, ts)) for z, r, sec in used]
    zero = np.zeros((len(ts), 2))
    knots += [(float(z), zero) for z in raw[:, 0] if all(abs(z - k[0]) >= Z_EPS for k in knots)]
    knots.sort(key=lambda k: k[0])
    kz = np.array([k[0] for k in knots])

    def delta(z):
        if not used or z < kz[0] - Z_EPS or z > kz[-1] + Z_EPS:
            return zero
        j = int(np.searchsorted(kz, z))
        if j < len(kz) and abs(kz[j] - z) < Z_EPS:
            return knots[j][1]
        if j > 0 and abs(kz[j - 1] - z) < Z_EPS:
            return knots[j - 1][1]
        if j == 0 or j >= len(kz):
            return zero
        f = (z - kz[j - 1]) / (kz[j] - kz[j - 1])
        return knots[j - 1][1] * (1 - f) + knots[j][1] * f

    rings = []
    for row in rows:
        z = float(row[0])
        if _is_point(row):
            rings.append((z, np.array([[row[1], row[2]]])))
        else:
            rings.append((z, superellipse_at(row, ts) + delta(z)))
    return rings, ts, [s for _, _, s in used]


# ---- Loading and logging ----

def load(path: str) -> list[dict]:
    with open(path) as f:
        data = json.load(f)
    secs = data.get('sections', data) if isinstance(data, dict) else data
    return [s for s in secs if not s.get('removed')]


def attach(spec: dict, spec_dir: str) -> int:
    """Hand each loft part its refined sections (spec "sections": file name; default sections.json next to the spec)."""
    name = spec.get('sections', 'sections.json')
    if not isinstance(name, str):
        secs = list(name)
    else:
        path = os.path.join(spec_dir, name)
        if not os.path.exists(path):
            if 'sections' in spec:
                print(f'[lpa] sections file {path} not found')
            return 0
        secs = load(path)
    lofts = {p.get('name'): p for p in spec.get('parts', []) if p.get('type') == 'loft'}
    n = 0
    for s in secs:
        part = lofts.get(s.get('part'))
        if part is None:
            print(f'[lpa] section for unknown loft part {s.get("part")!r} skipped (lofts: {", ".join(map(str, lofts))})')
            continue
        part.setdefault('_sections', []).append(s)
        n += 1
    if n:
        print(f'[lpa] {n} refined cross-section{"s" if n != 1 else ""} on {len({s["part"] for s in secs if s.get("part") in lofts})} part(s)')
    return n


def log_loft(spec_part: dict, instance: str, mirrored: bool, rings, ts) -> None:
    rows = np.asarray(spec_part.get('stations', []), dtype=np.float64)
    sym = bool(not spec_part.get('mirror') and len(rows) and np.all(np.abs(rows[:, 1]) < 1e-6))
    LOG.append({
        'part': spec_part.get('name', 'loft'), 'instance': instance, 'mirrored': mirrored, 'sym': sym,
        'join': spec_part.get('join', 'surface' if spec_part.get('surface') else 'body'),
        'segments': int(spec_part.get('segments', 24)),
        'ts': [round(t, 7) for t in ts],
        'rings': [[round(z, 4), [[round(float(x), 4), round(float(y), 4)] for x, y in pts]] for z, pts in rings],
    })


def write_log(path: str, aid: str, shift) -> None:
    """<id>_lofts.json: every loft's rings (spec frame) and the shift from the spec frame to the pack's frame."""
    with open(path, 'w') as f:
        json.dump({'aircraft': aid, 'shift': [round(float(c), 4) for c in shift], 'lofts': LOG}, f, separators=(',', ':'))
