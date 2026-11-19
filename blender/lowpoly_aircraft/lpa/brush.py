"""Brush strokes from the Hangar: move the mesh under a brush by a set vector.

In the Hangar's Brush card the user drags over the model; every vertex within the
brush radius of the stroke's path moves by the stroke's vector, scaled by the falloff
at its distance from the path. A drag is one stroke: a vertex moves once per stroke,
by its largest weight along the path (dragging back and forth does not add up).

    brush.json (next to spec.json, or the file the spec names under "brush"):
    {"aircraft": "<id>", "strokes": [
        {"id": "s...", "path": [[x, y, z], ...], "radius": 0.5, "vec": [x, y, z],
         "falloff": "smooth", "mirror": true, "parts": null}]}

Coordinates are the pack's body frame (+X left wing, +Y up, +Z nose; metres), the
model as exported, with every control surface at rest. Strokes apply in order, each
to the shape the ones before it left.

``mirror``: the stroke also acts mirrored (x -> -x, the vector's x flipped). Each
vertex takes the side whose path is nearer, so the result stays symmetric; where both
sides weigh the same (on the centreline) the vector's x drops out.
``parts``: object names (as the Hangar's glTF loader names them) the stroke may move,
or null for every part of the body and the control surfaces. Gear is never moved.

The Hangar (viewer/index.html, strokeApply) runs the same maths. This module needs no
Blender; build_aircraft.py applies the strokes to the scene before export.
"""
from __future__ import annotations

import json
import os
import re

import numpy as np

FALLOFFS = ('smooth', 'linear', 'constant')
TIE = 1e-7       # weights closer than this count as equal (mirror)


def weight(f: np.ndarray, falloff: str) -> np.ndarray:
    """Falloff at f = distance / radius (0 at the path, 1 at the brush's edge); 0 beyond."""
    f = np.asarray(f, dtype=np.float64)
    if falloff == 'linear':
        w = 1.0 - f
    elif falloff == 'constant':
        w = np.ones_like(f)
    else:
        w = 0.5 * (1.0 + np.cos(np.pi * np.clip(f, 0.0, 1.0)))
    return np.where(f < 1.0, w, 0.0)


def path_dist(P: np.ndarray, path) -> np.ndarray:
    """Distance of each point (n, 3) to the polyline ``path`` (m, 3); a single point when m == 1."""
    P = np.asarray(P, dtype=np.float64).reshape(-1, 3)
    Q = np.asarray(path, dtype=np.float64).reshape(-1, 3)
    if len(Q) == 1:
        return np.linalg.norm(P - Q[0], axis=1)
    best = np.full(len(P), np.inf)
    for a, b in zip(Q[:-1], Q[1:]):
        ab = b - a
        L2 = float(ab @ ab)
        t = np.zeros(len(P)) if L2 < 1e-18 else np.clip((P - a) @ ab / L2, 0.0, 1.0)
        d = np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
        best = np.minimum(best, d)
    return best


def stroke_delta(P, s: dict) -> np.ndarray:
    """How far each point (n, 3) moves under stroke ``s``: (n, 3)."""
    P = np.asarray(P, dtype=np.float64).reshape(-1, 3)
    r = float(s['radius'])
    vec = np.asarray(s['vec'], dtype=np.float64)
    path = np.asarray(s['path'], dtype=np.float64).reshape(-1, 3)
    out = np.zeros_like(P)
    if r <= 0 or not len(path) or not np.any(vec):
        return out
    fall = s.get('falloff', 'smooth')
    wa = weight(path_dist(P, path) / r, fall)
    if not s.get('mirror'):
        return wa[:, None] * vec
    flip = np.array([-1.0, 1.0, 1.0])
    wb = weight(path_dist(P, path * flip) / r, fall)
    tie = np.abs(wa - wb) < TIE
    w = np.maximum(wa, wb)
    v = np.where((wa >= wb)[:, None], vec, vec * flip)
    v = np.where(tie[:, None], vec * np.array([0.0, 1.0, 1.0]), v)
    return w[:, None] * v


def apply(P, s: dict) -> tuple[np.ndarray, bool]:
    """Points moved by stroke ``s``, and whether any moved."""
    P = np.asarray(P, dtype=np.float64).reshape(-1, 3)
    d = stroke_delta(P, s)
    moved = bool(np.any(np.abs(d) > 0))
    return (P + d if moved else P), moved


def sanitize(name: str) -> str:
    """An object's name as three.js's glTF loader gives it (whitespace -> _, []./: dropped)."""
    return re.sub(r'[\[\]\.:/]', '', re.sub(r'\s', '_', name))


def applies_to(s: dict, name: str) -> bool:
    parts = s.get('parts')
    return not parts or sanitize(name) in parts or name in parts


def clean(d: dict) -> dict | None:
    """A Hangar doc (or brush.json entry) as a stroke, or None when it is not one."""
    if not isinstance(d, dict) or d.get('removed'):
        return None
    try:
        path = [[round(float(c), 4) for c in p[:3]] for p in d.get('path') or []]
        vec = [round(float(c), 4) for c in d['vec'][:3]]
        r = round(float(d['radius']), 4)
    except (KeyError, TypeError, ValueError, IndexError):
        return None
    if not path or r <= 0 or len(vec) != 3:
        return None
    s = {'id': str(d.get('id') or ''), 'path': path, 'radius': r, 'vec': vec,
         'falloff': d.get('falloff') if d.get('falloff') in FALLOFFS else 'smooth',
         'mirror': bool(d.get('mirror')), 'parts': list(d['parts']) if d.get('parts') else None}
    if d.get('t') is not None:
        s['t'] = d['t']
    return s


def from_docs(docs, aircraft: str | None = None) -> dict:
    """Hangar docs (aircraft/<id>/brush, {"id", "data"} rows or plain docs) -> brush.json content, in stroke order."""
    out = []
    for row in docs or []:
        d = row.get('data', row) if isinstance(row, dict) else row
        if isinstance(d, dict) and isinstance(row, dict) and 'data' in row and not d.get('id'):
            d = {**d, 'id': row.get('id')}
        s = clean(d)
        if s:
            out.append(s)
    out.sort(key=lambda s: (str(s.get('t', '')), s['id']))
    first = docs[0] if docs else None
    if not aircraft and isinstance(first, dict):
        aircraft = (first.get('data') or first).get('aircraft')
    return {'aircraft': aircraft, 'strokes': out}


def load(path: str) -> list[dict]:
    with open(path) as f:
        data = json.load(f)
    rows = data.get('strokes', []) if isinstance(data, dict) else data
    return [s for s in (clean(r) for r in rows) if s]


def for_spec(spec_path: str, spec: dict | None = None) -> tuple[list[dict], str | None]:
    """The strokes a spec gets: the file it names under "brush", else brush.json next to it."""
    if spec is None:
        with open(spec_path) as f:
            spec = json.load(f)
    folder = os.path.dirname(os.path.abspath(spec_path))
    name = spec.get('brush')
    if name is False:
        return [], None
    path = os.path.join(folder, name or 'brush.json')
    if not os.path.exists(path):
        if name:
            raise FileNotFoundError(f'brush file named in the spec not found: {path}')
        return [], None
    return load(path), path
