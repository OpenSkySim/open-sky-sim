"""Arrestor hook (carrier aircraft): a striped arm with a hook shoe, drawn about its hinge.

The sim draws the hook itself and swings it from its stowed direction down to the
deployed tip (H key), so the model is authored in the sim's tailhook convention:
origin at the hinge, the arm running along body +Z to the tip. The spec gives

    'tailhook': {'hinge': [x, y, z], 'tip': [x, y, z], 'stowed_tip': [x, y, z],
                 'radius': 0.06, 'stripe': 0.25, 'fork': 0.6, 'fork_width': 0.36}

in body metres (+X left, +Y up, +Z nose); 'tip' is where the shoe sits with the
hook down (the arrest point), 'stowed_tip' where it sits folded up.
"""
from __future__ import annotations

import math

import bmesh
import bpy
import numpy as np

from . import geometry as geo

BLACK = '#1c1c1c'
WHITE = '#efefef'


def _tube(bm, mats, p0, p1, r, mat, sides=8):
    """Closed n-sided prism between two body points."""
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    ax = p1 - p0
    ax /= np.linalg.norm(ax)
    ref = np.array([0.0, 1.0, 0.0]) if abs(ax[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(ax, ref)
    u /= np.linalg.norm(u)
    v = np.cross(ax, u)
    rings = []
    for p in (p0, p1):
        ring = []
        for k in range(sides):
            a = 2 * math.pi * (k + 0.5) / sides
            ring.append(bm.verts.new(geo.to_bl(p + r * (math.cos(a) * u + math.sin(a) * v))))
        rings.append(ring)
    faces = [bm.faces.new((rings[0][k], rings[0][(k + 1) % sides], rings[1][(k + 1) % sides], rings[1][k]))
             for k in range(sides)]
    faces.append(bm.faces.new(list(reversed(rings[0]))))
    faces.append(bm.faces.new(rings[1]))
    for f in faces:
        f.material_index = mats.index(mat)


def _box(bm, mats, centre, half, mat):
    c, h = np.asarray(centre, float), np.asarray(half, float)
    vs = [bm.verts.new(geo.to_bl(c + h * np.array([sx, sy, sz])))
          for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([vs[i] for i in q]).material_index = mats.index(mat)


def build_tailhook(spec: dict, aid: str):
    """Add the hook model to the 'Hook' collection; returns the manifest entry (or None)."""
    th = spec.get('tailhook')
    if not th:
        return None
    hinge = np.array(th['hinge'], float)
    tip = np.array(th['tip'], float)
    stowed = np.array(th.get('stowed_tip', tip), float)
    length = float(np.linalg.norm(tip - hinge))
    r = float(th.get('radius', 0.06))
    stripe = float(th.get('stripe', 0.25))
    fork = float(th.get('fork', 0.6))
    fork_w = float(th.get('fork_width', 0.36))

    mats = [BLACK, WHITE]
    bm = bmesh.new()
    # Fork: two legs from the hinge lugs that meet in the arm (as on the E-2's hook).
    for s in (-1, 1):
        _tube(bm, mats, (s * fork_w / 2, 0, 0), (0, 0, fork), r * 0.8, BLACK)
    _box(bm, mats, (0, 0, 0), (fork_w / 2 + 0.04, 0.05, 0.06), BLACK)   # hinge cross tube
    # Arm: black and white bands from the fork to the shoe.
    z, k = fork, 0
    end = length - 0.12
    while z < end - 1e-4:
        z1 = min(z + stripe, end)
        _tube(bm, mats, (0, 0, z), (0, 0, z1), r, WHITE if k % 2 == 0 else BLACK)
        z, k = z1, k + 1
    # Shoe: a heavier block with the hook lip at the tip. The sim turns the arm's +Z onto the
    # aft-pointing hinge->tip line by the shortest arc, a turn of more than 90 deg about X that
    # flips the model's +Y downwards: so the lip is authored on +Y to hang below the arm.
    _box(bm, mats, (0, 0.02, length - 0.06), (0.07, 0.07, 0.12), BLACK)
    _box(bm, mats, (0, 0.1, length + 0.02), (0.07, 0.05, 0.05), BLACK)

    me = bpy.data.meshes.new('Tailhook')
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(geo.get_material(m))
    obj = bpy.data.objects.new('Tailhook', me)
    geo._link(obj, 'Hook')
    for p in me.polygons:
        p.use_smooth = False

    stowed_dir = stowed - hinge
    stowed_dir /= np.linalg.norm(stowed_dir)
    down = math.degrees(math.atan2(-(tip - hinge)[1], -(tip - hinge)[2]))
    print(f'[lpa] tailhook: arm {length:.2f} m, hinge {np.round(hinge, 3).tolist()}, '
          f'tip {np.round(tip, 3).tolist()} ({down:.1f} deg below aft)')
    return {
        'model': f'{aid}_tailhook.glb',
        'hinge': [round(float(c), 4) for c in hinge],
        'tip': [round(float(c), 4) for c in tip],
        'stowedDir': [round(float(c), 4) for c in stowed_dir],
    }
