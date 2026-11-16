"""Three-view drawing -> aircraft body frame.

Body frame (the sim's glTF frame): +X left wing, +Y up, +Z forward (nose),
metres. Each view maps its image pixels (u right, v down, in the source image)
to two body axes:

    top   -> (x, z)    looking down
    side  -> (z, y)    looking from either side
    front -> (x, y)    looking at the nose (or the tail, facing="rear")

The mapping is an affine 2x3 matrix fitted from the view's silhouette bounds
and the aircraft's known length / span (and height when given).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

import numpy as np

from . import silhouette as sil

VIEW_AXES = {'top': ('x', 'z'), 'side': ('z', 'y'), 'front': ('x', 'y')}


@dataclass
class View:
    name: str
    mask: np.ndarray           # filled silhouette, full source-image size
    affine: np.ndarray         # 2x3: [a, b] = affine @ [u, v, 1]
    loops_px: list[np.ndarray] = field(default_factory=list)
    # Includes limited in depth: (outline in px, depth spec) pairs, built as
    # their own prisms (a nacelle seen from the front only exists over the
    # nacelle's length, not all the way to the tail).
    extras: list[tuple[np.ndarray, dict]] = field(default_factory=list)

    def to_body2(self, pts_px) -> np.ndarray:
        p = np.asarray(pts_px, dtype=np.float64).reshape(-1, 2)
        return p @ self.affine[:, :2].T + self.affine[:, 2]

    def to_px(self, pts_body2) -> np.ndarray:
        p = np.asarray(pts_body2, dtype=np.float64).reshape(-1, 2)
        inv = np.linalg.inv(self.affine[:, :2])
        return (p - self.affine[:, 2]) @ inv.T

    def loops_body2(self) -> list[np.ndarray]:
        return [self.to_body2(lp) for lp in self.loops_px]


def _affine(rows: list[tuple[float, float, float]]) -> np.ndarray:
    return np.asarray(rows, dtype=np.float64)


def load_view_mask(spec_dir: str, spec: dict, name: str) -> np.ndarray:
    vs = spec['views'][name]
    path = os.path.join(spec_dir, vs.get('image', spec.get('image', '')))
    rgba = sil.load_rgba(path)
    ink = sil.ink_mask(rgba, float(vs.get('threshold', spec.get('threshold', 0.5))))
    h, w = ink.shape
    crop = vs.get('crop', [0, 0, w, h])
    u0, v0, u1, v1 = (int(round(c)) for c in crop)
    region = np.zeros_like(ink)
    region[v0:v1, u0:u1] = True
    solid = sil.filled_silhouette(ink[v0:v1, u0:u1], int(vs.get('close_px', 2)))
    solid = sil.open_mask(solid, int(vs.get('open_px', spec.get('open_px', 0))))
    mask = np.zeros_like(ink)
    mask[v0:v1, u0:u1] = solid
    mask &= region
    # Corrections: drop ghost lines, labels, drawn-down gear or prop discs
    # (exclude), then put back what they covered by mistake (include).
    for shape in vs.get('exclude', []):
        cut = sil.shape_mask(shape, h, w)
        if shape.get('grow_px'):   # also take the shape's own ink outline
            cut = sil.dilate(cut, int(shape['grow_px']))
        mask &= ~cut
    for shape in vs.get('include', []):
        if not _is_deep_limited(shape):
            mask |= sil.shape_mask(shape, h, w)
    return mask


def _is_deep_limited(shape: dict) -> bool:
    return 'z_top_px' in shape or 'x_top_px' in shape or 'depth_m' in shape


def shape_outline(shape: dict, sides: int = 16) -> np.ndarray:
    if 'rect' in shape:
        u0, v0, u1, v1 = shape['rect']
        return np.array([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], dtype=np.float64)
    if 'circle' in shape or 'ellipse' in shape:
        cu, cv, ru, rv = shape['ellipse'] if 'ellipse' in shape else (*shape['circle'], shape['circle'][2])
        t = 2 * np.pi * (np.arange(sides) + 0.5) / sides
        return np.stack([cu + ru * np.cos(t), cv + rv * np.sin(t)], axis=1)
    return np.asarray(shape['polygon'], dtype=np.float64)


def depth_range(views: dict, shape: dict) -> tuple[float, float]:
    """Body-frame extent along a view's line of sight, read off the top view."""
    if 'depth_m' in shape:
        a, b = shape['depth_m']
    elif 'z_top_px' in shape:   # front-view item: z from the top view's v range
        v0, v1 = shape['z_top_px']
        a, b = views['top'].to_body2([[0, v0], [0, v1]])[:, 1]
    else:                       # side-view item: x from the top view's u range
        u0, u1 = shape['x_top_px']
        a, b = views['top'].to_body2([[u0, 0], [u1, 0]])[:, 0]
    return (float(min(a, b)), float(max(a, b)))


def build_views(spec_dir: str, spec: dict) -> dict[str, View]:
    length = float(spec['length_m'])
    span = float(spec['span_m'])
    height = spec.get('height_m')
    z_nose = float(spec.get('origin_from_nose_m') or 0.6 * length)

    masks = {n: load_view_mask(spec_dir, spec, n) for n in ('top', 'side', 'front')}
    views: dict[str, View] = {}

    # Top: (x, z). Orientation names where the nose points in the image.
    u0, v0, u1, v1 = sil.bbox(masks['top'])
    uc, vc = (u0 + u1) / 2, (v0 + v1) / 2
    nose = spec['views']['top'].get('nose', 'up')
    if nose == 'up':
        sx, sz = span / (u1 - u0), length / (v1 - v0)
        a = _affine([(-sx, 0, sx * uc), (0, -sz, z_nose + sz * v0)])
    elif nose == 'down':
        sx, sz = span / (u1 - u0), length / (v1 - v0)
        a = _affine([(sx, 0, -sx * uc), (0, sz, z_nose - sz * v1)])
    elif nose == 'left':
        sx, sz = span / (v1 - v0), length / (u1 - u0)
        a = _affine([(0, sx, -sx * vc), (-sz, 0, z_nose + sz * u0)])
    elif nose == 'right':
        sx, sz = span / (v1 - v0), length / (u1 - u0)
        a = _affine([(0, -sx, sx * vc), (sz, 0, z_nose - sz * u1)])
    else:
        raise ValueError(f'top.nose must be up/down/left/right, not {nose!r}')
    views['top'] = View('top', masks['top'], a)

    # Side: (z, y); y measured up from the silhouette's bottom for now.
    u0, v0, u1, v1 = sil.bbox(masks['side'])
    sz = length / (u1 - u0)
    sy = float(height) / (v1 - v0) if height else sz
    nose = spec['views']['side'].get('nose', 'left')
    if nose == 'left':
        a = _affine([(-sz, 0, z_nose + sz * u0), (0, -sy, sy * v1)])
    elif nose == 'right':
        a = _affine([(sz, 0, z_nose - sz * u1), (0, -sy, sy * v1)])
    else:
        raise ValueError(f'side.nose must be left/right, not {nose!r}')
    views['side'] = View('side', masks['side'], a)

    # Front: (x, y). Looking at the nose the left wing (+X) is on image right.
    u0, v0, u1, v1 = sil.bbox(masks['front'])
    uc = (u0 + u1) / 2
    sx = span / (u1 - u0)
    sy = float(height) / (v1 - v0) if height else sx
    facing = spec['views']['front'].get('facing', 'front')
    flip = 1.0 if facing == 'front' else -1.0
    a = _affine([(flip * sx, 0, -flip * sx * uc), (0, -sy, sy * v1)])
    views['front'] = View('front', masks['front'], a)

    for name, dy in (('side', 'y_offset_m'), ('front', 'y_offset_m')):
        off = float(spec['views'][name].get(dy, 0.0))
        views[name].affine[1, 2] += off

    # Put y = 0 on the fuselage's mid-height at the origin station (z = 0).
    yc = fuselage_mid_height(views['side'], 0.0)
    if spec.get('origin_above_bottom_m') is not None:
        yc = float(spec['origin_above_bottom_m'])
    for name in ('side', 'front'):
        views[name].affine[1, 2] -= yc

    eps = float(spec.get('detail_px', 4.0))
    for v in views.values():
        v.loops_px = sil.outline_polygons(v.mask, eps)
        v.extras = [(shape_outline(sh), sh) for sh in spec['views'][v.name].get('include', []) if _is_deep_limited(sh)]
    return views


def fuselage_mid_height(side: View, z: float) -> float:
    """Middle of the side silhouette's lowest solid run at station z (body y)."""
    u = side.to_px([[z, 0.0]])[0, 0]
    col = side.mask[:, int(np.clip(round(u), 0, side.mask.shape[1] - 1))]
    rows = np.nonzero(col)[0]
    if len(rows) == 0:
        return 0.0
    # Lowest contiguous run (fuselage, not a fin or canopy above a gap).
    bottom = rows[-1]
    top = bottom
    while top - 1 >= 0 and col[top - 1]:
        top -= 1
    y_top = side.to_body2([[u, top]])[0, 1]
    y_bot = side.to_body2([[u, bottom + 1]])[0, 1]
    return 0.5 * (y_top + y_bot)


def view_point_3d(view: str, ab, third: float) -> tuple[float, float, float]:
    """Body (x, y, z) from a view's 2D body coords plus the missing axis."""
    a, b = float(ab[0]), float(ab[1])
    if view == 'top':
        return (a, third, b)
    if view == 'side':
        return (third, b, a)
    if view == 'front':
        return (a, b, third)
    raise ValueError(view)
