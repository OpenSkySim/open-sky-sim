"""Draw a clean Su-33 three-view (su33_3view.png) and its spec.json.

The owner's Su-33 drawings are 1/48 magazine sheets spread over many A4 scans
with overlapping views, which the builder cannot read as one three-view. This
script redraws the outline, traced by eye from those sheets and fitted to the
published dimensions (length 21.19 m without probe, span 14.70 m, height
5.93 m), as the clean sheet the builder expects. Needs Pillow:
    python make_drawing.py

Canards and stabilators are all-moving, so they are built as mirrored
components (cut out of the main silhouettes) that pivot as a whole; the fins
are added back from the front view only over their own length.
"""
import json
import os

from PIL import Image, ImageDraw

S = 20.0                      # px per metre
TOP = (190, 50)               # top view: centreline u, nose v   (nose up)
SIDE = (420, 330)             # side view: nose u, fuselage bottom v (nose left)
FRONT = (1080, 330)           # front view: centreline u, fuselage bottom v (looking at the nose)

LENGTH, SPAN = 21.19, 14.70
TIP = SPAN / 2


def top(xr, d):               # xr: metres to image right (the right wing), d: metres aft of the nose
    return (TOP[0] + xr * S, TOP[1] + d * S)


def side(d, h):               # d: metres aft of the nose, h: metres above the fuselage bottom
    return (SIDE[0] + d * S, SIDE[1] - h * S)


def front(xr, h):             # xr: metres to image right (the left wing, seen from ahead;
    #                             the top view's xr > 0 is the right wing, so mirror() pairs them)
    return (FRONT[0] + xr * S, FRONT[1] - h * S)


def mirror(pts):
    return [(-x, y) for x, y in pts]


def r(p):
    return [round(p[0], 1), round(p[1], 1)]


# --- planform (right half, xr >= 0) -----------------------------------------
def lerx(d):                  # leading-edge root extension, nose of the LERX to the wing
    return 0.97 + (d - 5.0) * (2.3 - 0.97) / (8.6 - 5.0)


def wing_le(xr):              # wing leading edge, 42 deg sweep
    return 8.6 + (xr - 2.3) * 4.55 / (TIP - 2.3)


def wing_te(xr):
    return 16.0 - (xr - 2.4) * 1.4 / (TIP - 2.4)


NOSE = [(0.0, 0.0), (0.25, 0.5), (0.5, 1.3), (0.7, 2.3), (0.85, 3.3), (0.95, 4.5), (0.97, 5.0)]
WING = [(2.3, 8.6), (TIP, wing_le(TIP)), (TIP, 14.6), (2.4, 16.0)]
STAB = [(2.25, 17.0), (4.95, 19.4), (4.95, 20.3), (2.05, 20.55)]
TAIL = [(1.95, 20.6), (0.95, 20.6), (0.4, 20.45), (0.35, 21.0), (0.2, LENGTH), (0.0, LENGTH)]
CANARD = [(lerx(5.7), 5.7), (3.2, 7.05), (3.2, 7.55), (lerx(7.9), 7.9)]
FIN_TOP = [(2.0, 14.6), (2.2, 14.6), (2.2, 19.9), (2.0, 19.9)]


def planform_half():
    return NOSE + WING + [(2.3, 16.2)] + STAB + TAIL


# --- side profile ------------------------------------------------------------
SIDE_TOP = [(0, 1.55), (0.6, 1.85), (1.5, 2.1), (2.8, 2.3), (3.6, 2.4), (4.3, 2.85), (5.2, 3.05),
            (6.3, 3.0), (7.5, 2.75), (8.8, 2.5), (11.0, 2.45), (14.5, 2.3), (17.0, 2.05), (19.0, 1.8),
            (20.6, 1.6), (20.6, 1.45), (LENGTH, 1.35)]
SIDE_BOTTOM = [(LENGTH, 1.05), (20.6, 1.0), (20.6, 0.6), (18.5, 0.45), (15.0, 0.15), (12.0, 0.0),
               (6.5, 0.0), (5.9, 0.95), (4.5, 1.0), (2.5, 1.05), (1.0, 1.25)]
FIN_SIDE = [(14.6, 2.2), (17.3, 4.3), (18.45, 4.3), (19.6, 1.85)]
CANOPY = [(3.6, 2.4), (4.3, 2.85), (5.2, 3.05), (6.3, 3.0), (7.0, 2.85), (6.6, 2.45)]

# --- front view (right half: image right is the left wing) ------------------
FUS_FRONT = [(0.0, 3.0), (0.42, 2.9), (0.55, 2.45), (0.95, 2.25), (1.3, 2.0), (1.6, 1.75), (2.2, 1.62),
             (2.28, 1.45), (2.28, 0.9), (2.1, 0.0), (0.45, 0.0), (0.45, 0.9), (0.0, 0.95)]
WING_FRONT = [(2.2, 1.45), (TIP, 1.2), (TIP, 1.05), (2.2, 1.22)]
CANARD_FRONT = [(1.0, 1.97), (3.2, 1.92), (3.2, 1.8), (1.0, 1.84)]
STAB_FRONT = [(2.0, 0.92), (4.95, 0.80), (4.95, 0.68), (2.0, 0.78)]
FIN_FRONT = [(2.0, 1.6), (2.0, 4.3), (2.2, 4.3), (2.2, 1.6)]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    img = Image.new('RGB', (1300, 520), 'white')
    g = ImageDraw.Draw(img)

    def poly(fn, pts, width=2):
        q = [fn(*p) for p in pts]
        g.line(q + [q[0]], fill='black', width=width, joint='curve')

    def line(fn, a, b):
        g.line([fn(*a), fn(*b)], fill='black', width=1)

    # --- top view ---------------------------------------------------------
    half = planform_half()
    poly(top, half + mirror(half[::-1]))
    for shape in (CANARD, FIN_TOP):
        poly(top, shape, 1)
        poly(top, mirror(shape), 1)
    for s in (1, -1):         # hinge lines: slats, ailerons, flaps, stabilator pivots
        line(top, (s * 2.6, wing_le(2.6) + 0.6), (s * 7.2, wing_le(7.2) + 0.5))
        line(top, (s * 4.9, wing_te(4.9) - 0.8), (s * 7.2, wing_te(7.2) - 0.6))
        line(top, (s * 2.5, wing_te(2.5) - 0.9), (s * 4.8, wing_te(4.8) - 0.8))
        line(top, (s * 4.9, wing_te(4.9) - 0.8), (s * 4.9, wing_te(4.9)))

    # --- side view (nose left) -------------------------------------------
    poly(side, SIDE_TOP + SIDE_BOTTOM)
    poly(side, FIN_SIDE)
    poly(side, CANOPY, 1)
    line(side, (17.95, 4.3), (18.5, 1.95))                                 # rudder hinge
    poly(side, [(16.9, 0.92), (20.6, 0.8), (20.6, 0.68), (16.9, 0.75)], 1)  # stabilator
    poly(side, [(5.7, 1.95), (7.9, 1.9), (7.9, 1.8), (5.7, 1.83)], 1)        # canard
    line(side, (6.5, 0.0), (6.5, 0.95))                                     # intake lip

    # --- front view (looking at the nose) --------------------------------
    poly(front, FUS_FRONT + mirror(FUS_FRONT[::-1]))
    for shape in (WING_FRONT, CANARD_FRONT, STAB_FRONT, FIN_FRONT):
        poly(front, shape)
        poly(front, mirror(shape))
    for s in (1, -1):         # intake mouths
        poly(front, [(s * 0.6, 0.12), (s * 2.0, 0.12), (s * 2.0, 0.85), (s * 0.6, 0.85)], 1)
    poly(front, [(-0.4, 2.45), (-0.36, 2.85), (0.36, 2.85), (0.4, 2.45)], 1)  # canopy

    for txt, u in (('TOP', 170), ('SIDE (LEFT)', 600), ('FRONT', 1060)):
        g.text((u, 12), txt, fill='black')
    g.line([side(0, -2.4), side(LENGTH, -2.4)], fill='black', width=1)
    g.text(side(LENGTH / 2 - 1, -2.5), '21.19 m', fill='black')
    img.save(os.path.join(here, 'su33_3view.png'))

    px = {'top': lambda pts: [r(top(*p)) for p in pts],        # noqa: E731
          'side': lambda pts: [r(side(*p)) for p in pts],      # noqa: E731
          'front': lambda pts: [r(front(*p)) for p in pts]}    # noqa: E731
    # The canard and stabilator are cut out of the top and front silhouettes
    # and built as their own all-moving parts; the fins only exist over their
    # length, so the front view adds them back limited to it.
    stab_cut = [(2.35, 16.95), (5.1, 19.3), (5.1, 20.45), (2.35, 20.7)]
    fin_rects = []
    for s in (1, -1):
        (ua, va), (ub, vb) = front(s * 2.0, 4.3), front(s * 2.2, 1.72)
        fin_rects.append([min(ua, ub), va, max(ua, ub), vb])
    # Front-view cuts stop short of the fuselage and the wing they overlap.
    canard_cut = [(1.62, 1.97), (3.2, 1.92), (3.2, 1.8), (1.62, 1.81)]
    stab_front_cut = [(2.32, 0.91), (4.95, 0.80), (4.95, 0.68), (2.32, 0.77)]
    fin_v = [r(top(0, 14.4))[1], r(top(0, 20.0))[1]]
    spec = {
        'id': 'lp_su33',
        'name': 'Su-33 (Lowpoly)',
        'image': 'su33_3view.png',
        'length_m': LENGTH,
        'span_m': SPAN,
        'detail_px': 2,
        'material': 'VEHICLE_PLANE_GREY',
        'views': {
            'top': {'crop': [20, 30, 360, 490], 'nose': 'up',
                    'exclude': [{'polygon': px['top'](sh), 'grow_px': 3} for sh in
                                (CANARD, mirror(CANARD), stab_cut, mirror(stab_cut))]},
            'side': {'crop': [400, 230, 880, 345], 'nose': 'left'},
            'front': {'crop': [920, 230, 1240, 345], 'facing': 'front',
                      'exclude': [{'polygon': px['front'](sh), 'grow_px': 3} for sh in
                                  (canard_cut, mirror(canard_cut), stab_front_cut, mirror(stab_front_cut))]
                      + [{'rect': rc, 'grow_px': 3} for rc in fin_rects],
                      'include': [{'rect': rc, 'z_top_px': fin_v} for rc in fin_rects]},
        },
        'regions': [
            {'name': 'Canopy', 'view': 'side', 'material': 'GLASS',
             'polygon_px': px['side']([(3.55, 2.38), (4.3, 2.95), (5.2, 3.2), (6.3, 3.15), (7.1, 2.9), (6.6, 2.4)])},
        ],
        'surfaces': [
            {'type': 'slat', 'view': 'top', 'mirror': True,
             'polygon_px': px['top']([(2.6, wing_le(2.6) + 0.6), (7.2, wing_le(7.2) + 0.5),
                                      (7.2, wing_le(7.2) - 0.3), (2.6, wing_le(2.6) - 0.3)])},
            {'type': 'aileron', 'view': 'top', 'mirror': True,
             'polygon_px': px['top']([(4.9, wing_te(4.9) - 0.8), (7.2, wing_te(7.2) - 0.6),
                                      (7.2, wing_te(7.2) + 0.4), (4.9, wing_te(4.9) + 0.4)])},
            {'type': 'flap', 'view': 'top', 'mirror': True,
             'polygon_px': px['top']([(2.5, wing_te(2.5) - 0.9), (4.8, wing_te(4.8) - 0.8),
                                      (4.8, wing_te(4.8) + 0.4), (2.5, wing_te(2.5) + 0.4)])},
            {'type': 'rudder', 'view': 'side', 'mirror': True,
             'depth_top_px': [r(top(-1.9, 0))[0], r(top(-2.4, 0))[0]],
             'polygon_px': px['side']([(17.95, 4.4), (18.5, 1.95), (20.0, 1.95), (20.0, 4.4)])},
        ],
        'components': [
            {'name': 'Canard', 'mirror': True,
             'shapes': {'top': [{'polygon': px['top'](CANARD)}], 'front': [{'polygon': px['front'](mirror(CANARD_FRONT))}]},
             'surface': {'type': 'canard', 'view': 'top', 'hinge_px': px['top']([(1.6, 6.85), (3.2, 7.3)])}},
            {'name': 'Stabilator', 'mirror': True,
             'shapes': {'top': [{'polygon': px['top'](STAB)}], 'front': [{'polygon': px['front'](mirror(STAB_FRONT))}]},
             'surface': {'type': 'stabilator', 'view': 'top', 'hinge_px': px['top']([(2.2, 19.0), (4.95, 19.6)])}},
        ],
        'gear': {'legs': [
            {'name': 'Nose', 'side_px': r(side(5.4, -1.63)), 'retract': 'forward', 'wheel_radius_m': 0.33},
            {'name': 'Main', 'side_px': r(side(12.9, -1.63)), 'top_px': r(top(1.95, 12.9)),
             'mirror': True, 'retract': 'forward', 'wheel_radius_m': 0.52},
        ]},
        'cockpit_px': r(side(4.9, 2.55)),
    }
    with open(os.path.join(here, 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=2)


if __name__ == '__main__':
    main()
