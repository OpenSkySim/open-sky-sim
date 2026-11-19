"""Paint schemes: a camouflage pattern on the grey skin and flat decals (stars, numbers).

Spec keys (all optional):

    "camo": {"colors": ["#a9adb0", "#7d868d", "#c3c6c8"], "scale_m": 2.5, "seed": 3,
             "base": "VEHICLE_PLANE_GREY"}
        Every face of every mesh painted in *base* gets one of *colors*, picked from 3-D noise
        at the face centre (blotches about *scale_m* across). Mirrored left/right.

    "decals": [{"shape": "star" | "text", "side": "left" | "right" | "both",
                "at": [y, z] (body frame, metres), "size": m, "color": "#rrggbb",
                "border": "#rrggbb", "border_m": 0.04, "text": "21"}]
        Flat shapes laid on the body skin seen from the side: every vertex is projected along
        x onto the body and lifted 1 cm off it. A star is a red five-point star with an
        optional border; text uses block (seven-segment) digits, *size* = digit height.
"""
from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Vector, noise
from mathutils.bvhtree import BVHTree

from . import geometry as geo

# build_aircraft.py --number / --number-color: replaces 'text' / 'color' of every text decal.
TEXT_OVERRIDE: dict = {}

# Seven-segment layout on a unit digit 0.56 wide and 1 high: (x0, y0, x1, y1) per segment.
_W, _S = 0.56, 0.14
_SEG = {
    'a': (0, 1 - _S, _W, 1), 'g': (0, 0.5 - _S / 2, _W, 0.5 + _S / 2), 'd': (0, 0, _W, _S),
    'f': (0, 0.5, _S, 1), 'b': (_W - _S, 0.5, _W, 1), 'e': (0, 0, _S, 0.5), 'c': (_W - _S, 0, _W, 0.5),
}
_DIGITS = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd',
           '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}


def _star(r_out: float, r_in_ratio: float = 0.382):
    pts = []
    for k in range(10):
        r = r_out if k % 2 == 0 else r_out * r_in_ratio
        a = math.pi / 2 + k * math.pi / 5
        pts.append((r * math.cos(a), r * math.sin(a)))
    return pts


def _text_polys(text: str, h: float):
    """Rectangles (u, v) for block digits, centred on (0, 0); u runs along the reading direction."""
    adv = (_W + 0.22) * h
    total = adv * len(text) - 0.22 * h
    polys = []
    for i, ch in enumerate(text):
        x0 = -total / 2 + i * adv
        for s in _DIGITS.get(ch, ''):
            a, b, c, d = _SEG[s]
            polys.append([(x0 + a * h, b * h - h / 2), (x0 + c * h, b * h - h / 2),
                          (x0 + c * h, d * h - h / 2), (x0 + a * h, d * h - h / 2)])
    return polys


def apply_camo(objects, cfg: dict) -> None:
    colors = cfg['colors']
    base = cfg.get('base', 'VEHICLE_PLANE_GREY')
    scale = float(cfg.get('scale_m', 2.5))
    seed = Vector((float(cfg.get('seed', 3)) * 17.3, 5.1, 2.7))
    for obj in objects:
        mats = [m.name for m in obj.data.materials]
        if base not in mats:
            continue
        bi = mats.index(base)
        slots = []
        for c in colors:
            if c not in mats:
                obj.data.materials.append(geo.get_material(c))
                mats.append(c)
            slots.append(mats.index(c))
        mw = obj.matrix_world
        for p in obj.data.polygons:
            if p.material_index != bi:
                continue
            x, y, z = geo.from_bl(mw @ p.center)
            n = noise.noise(Vector((abs(x), y, z)) / scale + seed)  # |x|: same pattern both sides
            k = 0 if n < -0.12 else (1 if n < 0.18 else 2)
            p.material_index = slots[min(k, len(slots) - 1)]


def _project(bvh, y: float, z: float, sx: float):
    o = geo.to_bl((sx * 6.0, y, z))
    d = geo.to_bl((-sx, 0.0, 0.0)) - geo.to_bl((0.0, 0.0, 0.0))
    hit, nrm, _, _ = bvh.ray_cast(o, d)
    if hit is None:
        return None
    if nrm.dot(d) > 0:
        nrm = -nrm
    return hit + nrm * 0.01


def add_decals(hull: bpy.types.Object, decals: list) -> None:
    bvh = BVHTree.FromObject(hull, bpy.context.evaluated_depsgraph_get())
    me = hull.data
    bm = bmesh.new()
    bm.from_mesh(me)
    mats = [m.name for m in me.materials]

    def slot(color):
        if color not in mats:
            me.materials.append(geo.get_material(color))
            mats.append(color)
        return mats.index(color)

    for dec in decals:
        if dec['shape'] == 'text':
            dec = {**dec, **TEXT_OVERRIDE}
        y0, z0 = dec['at']
        size = float(dec['size'])
        sides = {'left': [1.0], 'right': [-1.0], 'both': [1.0, -1.0]}[dec.get('side', 'both')]
        layers = []
        if dec['shape'] == 'star':
            if dec.get('border'):
                layers.append((dec['border'], [_star(size / 2 + float(dec.get('border_m', 0.04)))], 0.0))
            layers.append((dec['color'], [_star(size / 2)], 0.004))
        else:
            layers.append((dec['color'], _text_polys(str(dec['text']), size), 0.0))
        for sx in sides:
            # Seen from outside on the +x side, screen right is aft (-z); on the -x side it is +z.
            ur = -sx
            for color, polys, lift in layers:
                mi = slot(color)
                for poly in polys:
                    vs = []
                    for u, v in poly:
                        p = _project(bvh, y0 + v, z0 + ur * u, sx)
                        if p is None:
                            break
                        n_out = geo.to_bl((sx, 0, 0)) - geo.to_bl((0, 0, 0))
                        vs.append(bm.verts.new(p + n_out * lift))
                    else:
                        f = bm.faces.new(vs)
                        f.material_index = mi
                        f.normal_update()
                        if Vector(f.normal).dot(geo.to_bl((sx, 0, 0)) - geo.to_bl((0, 0, 0))) < 0:
                            f.normal_flip()
                        continue
                    for v in vs:
                        bm.verts.remove(v)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(me)
    bm.free()
