"""Draw the example three-view sheet (trainer_3view.png) and its spec.json.

A made-up two-seat trainer, drawn as black outlines with interior panel lines
the way a scanned three-view looks, so the builder has something to chew on
that is free of copyright. Needs Pillow:  python make_drawing.py
"""
import json
import math
import os

from PIL import Image, ImageDraw

S = 40.0                      # px per metre
TOP = (300, 80)               # top view: centreline u, nose v   (nose up)
SIDE = (640, 420)             # side view: nose u, fuselage bottom v (nose left)
FRONT = (1300, 420)           # front view: centreline u, bottom v (looking at the nose)


def top(xr, d):               # xr: metres to image right (the right wing), d: metres aft of the nose
    return (TOP[0] + xr * S, TOP[1] + d * S)


def side(d, h):               # d: metres aft of the nose, h: metres above the fuselage bottom
    return (SIDE[0] + d * S, SIDE[1] - h * S)


def front(xr, h):             # xr: metres to image right (the left wing, seen from ahead)
    return (FRONT[0] + xr * S, FRONT[1] - h * S)


def mirror(pts):
    return [(-x, y) for x, y in pts]


def r(p):
    return [round(p[0], 1), round(p[1], 1)]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    img = Image.new('RGB', (1560, 520), 'white')
    g = ImageDraw.Draw(img)

    def poly(fn, pts, width=2):
        q = [fn(*p) for p in pts]
        g.line(q + [q[0]], fill='black', width=width, joint='curve')

    def line(fn, a, b):
        g.line([fn(*a), fn(*b)], fill='black', width=1)

    # --- top view ---------------------------------------------------------
    half = [(0.0, 0.12), (0.5, 0.42), (1.5, 0.55), (3.5, 0.55), (6.0, 0.3), (8.6, 0.15), (9.0, 0.08)]
    fus = [(w, d) for d, w in half] + [(-w, d) for d, w in reversed(half)]
    poly(top, fus)
    wing_r = [(0.3, 2.8), (5.0, 3.0), (5.0, 4.1), (0.3, 4.4)]
    tail_r = [(0.1, 7.6), (1.8, 7.9), (1.8, 8.7), (0.1, 8.8)]
    for shape in (wing_r, tail_r):
        poly(top, shape)
        poly(top, mirror(shape))
    for s in (1, -1):         # panel lines: aileron, flap and elevator hinges
        line(top, (s * 3.0, 3.85), (s * 4.8, 3.78))
        line(top, (s * 0.7, 3.95), (s * 2.9, 3.9))
        line(top, (s * 0.2, 8.35), (s * 1.8, 8.35))

    # --- side view (nose left) -------------------------------------------
    prof = [(0, 0.55, 0.85), (0.4, 0.25, 1.05), (1.2, 0.05, 1.3), (2.6, 0.0, 1.4),
            (5.0, 0.1, 1.35), (7.0, 0.6, 1.25), (9.0, 0.95, 1.25)]
    outline = [(d, t) for d, b, t in prof] + [(d, b) for d, b, t in reversed(prof)]
    poly(side, outline)
    poly(side, [(2.5, 1.4), (3.2, 2.0), (4.6, 2.0), (5.3, 1.35)])          # canopy
    poly(side, [(6.9, 1.27), (8.3, 2.9), (8.9, 2.9), (9.0, 1.25)])         # fin
    poly(side, [(2.8, 0.35), (3.1, 0.45), (4.4, 0.32), (4.3, 0.22)], 1)    # wing root
    line(side, (8.4, 1.32), (8.6, 2.9))                                    # rudder hinge

    # --- front view (looking at the nose) --------------------------------
    ell = [(0.55 * math.cos(t), 0.7 + 0.7 * math.sin(t)) for t in (2 * math.pi * i / 24 for i in range(24))]
    poly(front, ell)
    poly(front, [(-0.35, 1.3), (-0.28, 1.95), (0.28, 1.95), (0.35, 1.3)])  # canopy
    poly(front, [(-0.07, 1.2), (-0.04, 2.9), (0.04, 2.9), (0.07, 1.2)])    # fin
    wing_f = [(0.4, 0.2), (5.0, 0.65), (5.0, 0.78), (0.4, 0.45)]
    tail_f = [(0.1, 1.08), (1.8, 1.15), (1.8, 1.24), (0.1, 1.2)]
    for shape in (wing_f, tail_f):
        poly(front, shape)
        poly(front, mirror(shape))

    # Labels and a dimension line outside the crops, as on a real sheet.
    for txt, u in (('TOP', 280), ('SIDE (LEFT)', 780), ('FRONT', 1280)):
        g.text((u, 12), txt, fill='black')
    g.line([(640, 470), (1000, 470)], fill='black', width=1)
    g.text((790, 478), '9.0 m', fill='black')
    img.save(os.path.join(here, 'trainer_3view.png'))

    px_top = lambda pts: [r(top(*p)) for p in pts]           # noqa: E731
    px_side = lambda pts: [r(side(*p)) for p in pts]         # noqa: E731
    spec = {
        'id': 'lp_trainer',
        'name': 'Lowpoly Trainer',
        'image': 'trainer_3view.png',
        'length_m': 9.0,
        'span_m': 10.0,
        'detail_px': 4,
        'material': 'VEHICLE_PLANE_GREY',
        'views': {
            'top': {'crop': [60, 40, 540, 465], 'nose': 'up'},
            'side': {'crop': [600, 250, 1040, 462], 'nose': 'left'},
            'front': {'crop': [1080, 250, 1520, 462], 'facing': 'front'},
        },
        'regions': [
            {'name': 'Canopy', 'view': 'side', 'material': 'GLASS',
             'polygon_px': px_side([(2.45, 1.39), (3.2, 2.1), (4.65, 2.1), (5.4, 1.34)])},
        ],
        'surfaces': [
            {'type': 'aileron', 'view': 'top', 'mirror': True,
             'polygon_px': px_top([(3.0, 3.85), (4.8, 3.78), (4.8, 4.5), (3.0, 4.6)])},
            {'type': 'flap', 'view': 'top', 'mirror': True,
             'polygon_px': px_top([(0.7, 3.95), (2.9, 3.9), (2.9, 4.6), (0.7, 4.7)])},
            {'type': 'elevator', 'view': 'top', 'mirror': True,
             'polygon_px': px_top([(0.2, 8.35), (1.8, 8.35), (1.8, 9.1), (0.2, 9.1)])},
            {'type': 'rudder', 'view': 'side',
             'polygon_px': px_side([(8.4, 1.32), (8.6, 2.95), (9.3, 2.95), (9.3, 1.32)])},
        ],
        'gear': {'legs': [
            {'name': 'Nose', 'side_px': r(side(1.3, -0.75)), 'retract': 'aft', 'wheel_radius_m': 0.2},
            {'name': 'Main', 'side_px': r(side(3.4, -0.8)), 'top_px': r(top(1.6, 3.4)),
             'mirror': True, 'retract': 'inward', 'wheel_radius_m': 0.28},
        ]},
    }
    with open(os.path.join(here, 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=2)


if __name__ == '__main__':
    main()
