"""The 50 key areas of an aircraft (areas.json) and the marks that locate them on references.

Every area has a fixed id, the views it is measured in and a shape: a point, a line
(polyline) or an area (closed outline). A mark is a list of image pixels on one
reference image; the calibrated view whose box holds the mark turns it into metres
(lpa/refs.py). Per aircraft, refs.json keeps the marks under "areas":

    "areas": {
      "canopy": {"marks": [{"img": "mig29m2-sheet", "view": "side", "pts": [[u, v], ...]}]},
      "canards": {"status": "absent"},           # the type has none
      "fuse_sections": {"marks": [{"img": "...", "view": "front", "pts": [...], "station_d": 4.2}]},
      "spine": {"status": "unseen"},              # in no reference: estimate it, and say so
      "fin": {"suggest": [{"img": "...", "view": "side", "pts": [...], "conf": "check", "by": "outline"}]}
    }

Status of an area: marked (has marks), absent (not on this type), unseen (in no
reference), suggested (found by lpa/detect.py or proposed by Claude, waiting to be
confirmed in the Hangar) or missing (still to do). "dismissed": true keeps a
rejected suggestion from coming back. Pure Python + numpy, no bpy.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass

import numpy as np

from . import refs as R

HERE = os.path.dirname(os.path.abspath(__file__))
AREAS_PATH = os.path.join(HERE, 'areas.json')
SHAPES = ('point', 'line', 'area')
STATUSES = ('marked', 'absent', 'unseen', 'suggested', 'missing')


def load_catalog(path: str = AREAS_PATH) -> list[dict]:
    with open(path) as f:
        return json.load(f)['areas']


def status(entry: dict | None) -> str:
    if not entry:
        return 'missing'
    if entry.get('marks'):
        return 'marked'
    if entry.get('status') in ('absent', 'unseen'):
        return entry['status']
    return 'suggested' if entry.get('suggest') else 'missing'


def view_for_mark(rs: R.RefSet, mark: dict) -> R.RefView | None:
    """The calibrated view on the mark's image whose box holds the mark (its type preferred)."""
    pts = np.asarray(mark.get('pts') or [], dtype=np.float64).reshape(-1, 2)
    if not len(pts):
        return None
    best = None
    for v in rs.views():
        if v.image_id != mark.get('img'):
            continue
        if v.crop:
            u0, v0, u1, v1 = v.crop
            inside = ((pts[:, 0] >= u0) & (pts[:, 0] <= u1) & (pts[:, 1] >= v0) & (pts[:, 1] <= v1)).mean()
        else:
            inside = 0.5
        score = inside + (0.5 if v.view == mark.get('view') else 0.0)
        if inside > 0.5 and (best is None or score > best[0]):
            best = (score, v)
    return best[1] if best else None


@dataclass
class Measured:
    area: str
    view: str
    image: str
    dxy: np.ndarray           # (n, 3) d, x, y in metres; NaN on the axis the view does not see
    station_d: float | None = None


def measure(rs: R.RefSet, area_id: str, entry: dict) -> list[Measured]:
    out = []
    for m in entry.get('marks', []):
        v = view_for_mark(rs, m)
        if v is None:
            continue
        dxy = v.to_dxy(m['pts'])
        if m.get('station_d') is not None:
            dxy[:, 0] = float(m['station_d'])
        out.append(Measured(area_id, v.view, v.image_id, dxy, m.get('station_d')))
    return out


def coverage(rs: R.RefSet, marks: dict, catalog: list[dict] | None = None) -> list[dict]:
    """One row per catalogue area: status, how many marks convert to metres, and in which views."""
    rows = []
    for a in catalog or load_catalog():
        e = marks.get(a['id'])
        st = status(e)
        meas = measure(rs, a['id'], e) if st == 'marked' else []
        rows.append({'id': a['id'], 'name': a['name'], 'group': a['group'], 'need': a['need'], 'status': st,
                     'marks': len(e.get('marks', [])) if e else 0, 'measured': len(meas),
                     'suggest': [x.get('conf', 'check') for x in e.get('suggest', [])] if e and st == 'suggested' else [],
                     'views': sorted({m.view for m in meas})})
    return rows
