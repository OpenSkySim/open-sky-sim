"""Reference images of an aircraft and their calibration (refs.json).

A reference set lists the drawings and photos an aircraft is built from. Each
image holds one or more *views* (a three-view sheet holds several), and each
calibrated view maps image pixels to metres in the aircraft's drawing frame:

    d  metres aft of the nose tip (the radome tip, not a pitot probe)
    x  metres towards the left wing tip (+X, as in the body frame)
    y  metres up; 0 is the nose tip unless a ground point and ground_y fix it

A view's calibration is a few things anyone can click on the image:

    nose      [u, v]  the nose tip (front/rear views: the nose on the centreline)
    scale     {"a": [u, v], "b": [u, v], "m": metres}  two points a known distance apart
              (or "px_per_m" directly). Optional: without it the crop box sets the scale,
              its far edge from the nose being the length (side/top/bottom views) or its
              width the span (front/rear), so the box should hug the drawing.
    nose_dir  where the nose points in the image: up/down/left/right (plan and side views)
    ground    [u, v]  any point on the ground line (wheels down), side/front/rear views
    rot_deg   turn the image by this much (counter-clockwise) to level it

The same JSON lives in the Lowpoly Hangar (its database, one doc per image) and
in examples/<id>/refs.json in the repo, where images that may not be shared
(third-party blueprints) are listed but not stored.

Pure Python + numpy: no bpy, so it runs in tests and tools.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass

import numpy as np

VIEW_TYPES = ('top', 'bottom', 'side', 'front', 'rear')
IMAGE_KINDS = ('sheet', 'view', 'section', 'photo', 'detail', 'model-shot')
NOSE_DIRS = {'up': (0.0, -1.0), 'down': (0.0, 1.0), 'left': (-1.0, 0.0), 'right': (1.0, 0.0)}
# Metre axes each view type measures (the third axis is along the line of sight).
VIEW_AXES = {'top': ('d', 'x'), 'bottom': ('d', 'x'), 'side': ('d', 'y'), 'front': ('x', 'y'), 'rear': ('x', 'y')}


class RefError(ValueError):
    pass


def _rot(v: np.ndarray, deg: float) -> np.ndarray:
    """Turn image vectors (u right, v down) counter-clockwise on screen by deg."""
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    # On screen (v down) a counter-clockwise turn is u' = c u + s v, v' = -s u + c v.
    return np.stack([c * v[..., 0] + s * v[..., 1], -s * v[..., 0] + c * v[..., 1]], axis=-1)


@dataclass
class RefView:
    """One calibrated view on a reference image."""
    image_id: str
    view: str
    nose: np.ndarray            # px
    px_per_m: float
    nose_dir: str = 'left'
    rot_deg: float = 0.0
    nose_y_m: float = 0.0       # y of the nose tip (overridden by ground + ground_y)
    crop: tuple | None = None   # [u0, v0, u1, v1] of this view on the image

    @property
    def axes(self) -> tuple[str, str]:
        return VIEW_AXES[self.view]

    def _frame(self) -> tuple[np.ndarray, np.ndarray]:
        """Unit image vectors (after levelling) for 'forward' (towards the nose) and the second axis."""
        if self.view in ('front', 'rear'):
            left = np.array([1.0, 0.0]) if self.view == 'front' else np.array([-1.0, 0.0])
            return left, np.array([0.0, -1.0])        # (x, up)
        f = np.array(NOSE_DIRS[self.nose_dir])
        if self.view == 'side':
            return f, np.array([0.0, -1.0])           # (forward, up)
        # Plan views: looking down with the nose up, the left wing is on the left of the image.
        left = np.array([f[1], -f[0]]) if self.view == 'top' else np.array([-f[1], f[0]])
        return f, left

    def to_m(self, px) -> np.ndarray:
        """Image px (n, 2) -> metres in the view's two axes (see `axes`)."""
        p = _rot(np.asarray(px, dtype=np.float64).reshape(-1, 2) - self.nose, self.rot_deg) / self.px_per_m
        e1, e2 = self._frame()
        a, b = p @ e1, p @ e2
        if self.view in ('top', 'bottom', 'side'):
            a = -a                                    # d grows aft: away from the nose
        if self.view in ('side', 'front', 'rear'):
            b = b + self.nose_y_m
        return np.stack([a, b], axis=-1)

    def to_px(self, m) -> np.ndarray:
        m = np.asarray(m, dtype=np.float64).reshape(-1, 2).copy()
        e1, e2 = self._frame()
        a, b = m[:, 0], m[:, 1]
        if self.view in ('top', 'bottom', 'side'):
            a = -a
        if self.view in ('side', 'front', 'rear'):
            b = b - self.nose_y_m
        p = (np.outer(a, e1) + np.outer(b, e2)) * self.px_per_m
        return _rot(p, -self.rot_deg) + self.nose

    def to_dxy(self, px) -> np.ndarray:
        """Image px -> (d, x, y) with NaN on the axis this view does not see."""
        ab = self.to_m(px)
        out = np.full((len(ab), 3), np.nan)
        for k, ax in enumerate(self.axes):
            out[:, 'dxy'.index(ax)] = ab[:, k]
        return out


def _scale(cal: dict) -> float | None:
    if 'px_per_m' in cal:
        return float(cal['px_per_m'])
    s = cal.get('scale')
    if not s:
        return None
    dist = math.dist(s['a'], s['b'])
    if float(s['m']) <= 0 or dist <= 0:
        raise RefError('scale points or distance are zero')
    return dist / float(s['m'])


def view_from_json(image_id: str, v: dict, ground_y: float | None = None,
                   length_m: float | None = None, span_m: float | None = None) -> RefView:
    view = v.get('view')
    if view not in VIEW_TYPES:
        raise RefError(f'{image_id}: unknown view type {view!r}')
    cal = v.get('cal') or {}
    if 'nose' not in cal:
        raise RefError(f'{image_id}/{view}: nose tip not marked')
    s = _scale(cal)
    rv = RefView(image_id=image_id, view=view, nose=np.asarray(cal['nose'], dtype=np.float64),
                 px_per_m=s or 1.0, nose_dir=cal.get('nose_dir', 'up' if view in ('top', 'bottom') else 'left'),
                 rot_deg=float(cal.get('rot_deg', 0.0)), crop=tuple(v['crop']) if v.get('crop') else None)
    if s is None:
        rv.px_per_m = _scale_from_box(rv, length_m, span_m)
    if view in ('side', 'front', 'rear'):
        if 'ground' in cal and ground_y is not None:
            # The ground point's height above the nose, in metres, fixes the nose's y.
            g = rv.to_m([cal['ground']])[0, 1]
            rv.nose_y_m = float(ground_y) - g
        else:
            rv.nose_y_m = float(cal.get('nose_y_m', 0.0))
    return rv


def _scale_from_box(rv: RefView, length_m: float | None, span_m: float | None) -> float:
    """px/m from the crop box: nose to the box's far edge is the length, or its width the span."""
    if not rv.crop:
        raise RefError(f'{rv.image_id}/{rv.view}: no scale and no box to take it from')
    u0, v0, u1, v1 = rv.crop
    a = rv.to_m([[u0, v0], [u1, v0], [u1, v1], [u0, v1]])[:, 0]   # px, since px_per_m is 1 here
    if rv.view in ('front', 'rear'):
        if not span_m:
            raise RefError(f'{rv.image_id}/{rv.view}: no scale, and the span is unknown')
        return float(a.max() - a.min()) / float(span_m)
    if not length_m:
        raise RefError(f'{rv.image_id}/{rv.view}: no scale, and the length is unknown')
    if a.max() <= 0:
        raise RefError(f'{rv.image_id}/{rv.view}: the box does not reach aft of the nose')
    return float(a.max()) / float(length_m)


@dataclass
class RefSet:
    aircraft: str
    images: list[dict]
    length_m: float | None = None
    span_m: float | None = None
    ground_y: float | None = None
    areas: dict | None = None

    def views(self, view: str | None = None) -> list[RefView]:
        """Calibrated views, best first (lower 'priority' wins), optionally of one type."""
        out = []
        for img in sorted(self.images, key=lambda i: i.get('priority', 9)):
            for v in img.get('views', []):
                if view and v.get('view') != view:
                    continue
                try:
                    out.append(view_from_json(img['id'], v, self.ground_y, self.length_m, self.span_m))
                except RefError:
                    continue
        return out

    def issues(self) -> list[str]:
        """What keeps the set from being usable: uncalibrated views, unknown kinds."""
        out = []
        for img in self.images:
            if img.get('kind') not in IMAGE_KINDS:
                out.append(f'{img.get("id")}: kind {img.get("kind")!r} is not one of {", ".join(IMAGE_KINDS)}')
            if img.get('kind') in ('sheet', 'view', 'section') and not img.get('views'):
                out.append(f'{img["id"]}: no views marked on the drawing')
            for v in img.get('views', []):
                try:
                    view_from_json(img['id'], v, self.ground_y, self.length_m, self.span_m)
                except RefError as e:
                    out.append(str(e))
        return out


def load(path: str) -> RefSet:
    with open(path) as f:
        return from_json(json.load(f))


def from_json(data: dict) -> RefSet:
    return RefSet(aircraft=data['aircraft'], images=list(data.get('images', [])),
                  length_m=data.get('length_m'), span_m=data.get('span_m'), ground_y=data.get('ground_y'),
                  areas=dict(data.get('areas') or {}))


def _flood(seed: np.ndarray, free: np.ndarray) -> np.ndarray:
    """Pixels of `free` 4-connected to `seed` (row and column runs at a time)."""
    from .silhouette import _propagate_rows
    filled = seed & free
    while True:
        nxt = _propagate_rows(filled, free)
        nxt = _propagate_rows(nxt.T, free.T).T
        if np.array_equal(nxt, filled):
            return filled
        filled = nxt


def extent_m(view: RefView, mask: np.ndarray, bridge_px: int = 2) -> tuple[np.ndarray, np.ndarray]:
    """Min and max metres (both view axes) of the drawing inside the view's crop.

    Only ink connected to the nose tip counts (gaps up to `bridge_px` bridged), so
    labels, section cuts and neighbouring views that reach into the crop are left out.
    """
    from .silhouette import dilate
    h, w = mask.shape
    u0, v0, u1, v1 = (int(round(c)) for c in (view.crop or (0, 0, w, h)))
    u0, v0, u1, v1 = max(u0, 0), max(v0, 0), min(u1, w), min(v1, h)
    ink = mask[v0:v1, u0:u1]
    free = dilate(ink, bridge_px)
    seed = np.zeros_like(free)
    nu, nv = int(round(view.nose[0])) - u0, int(round(view.nose[1])) - v0
    r = bridge_px + 3
    seed[max(nv - r, 0):nv + r + 1, max(nu - r, 0):nu + r + 1] = True
    if not (seed & free).any():
        # The nose may sit inside an outline (a radome seen head-on): start at the nearest ink.
        vs, us = np.nonzero(free)
        if len(us) == 0:
            raise RefError(f'{view.image_id}/{view.view}: no ink inside the crop')
        k = int(np.argmin((us - nu) ** 2 + (vs - nv) ** 2))
        seed[vs[k], us[k]] = True
    part = _flood(seed, free) & ink
    vs, us = np.nonzero(part)
    if len(us) == 0:
        raise RefError(f'{view.image_id}/{view.view}: no ink at the nose tip inside the crop')
    m = view.to_m(np.stack([us + u0, vs + v0], axis=-1))
    return m.min(axis=0), m.max(axis=0)
