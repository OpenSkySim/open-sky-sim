"""Draw a clean Su-33 three-view (su33_3view.png) and its spec.json.

The owner's Su-33 drawings are 1/48 magazine sheets spread over many A4 scans
with overlapping views, which the builder cannot read as one three-view. This
script redraws the outline, traced by eye from those sheets and fitted to the
published dimensions (length 21.19 m without probe, span 14.70 m, height
5.93 m), as the clean sheet the builder expects. Needs Pillow:
    python make_drawing.py

The spec builds the model from shaped parts (a rounded fuselage loft,
nacelles, profiled wing, canards, tailplanes and fins, about 5,000 triangles)
measured off the same outline, rather than from the silhouettes.
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

# --- shaped parts (body metres: +X left wing, +Y up, +Z nose) ----------------
H0 = 1.4                      # body y = 0 this high above the fuselage bottom
Z0 = 0.6 * LENGTH             # body z = 0 this far aft of the nose


def B(xl, h, d):              # xl: metres toward the left wing, h above the bottom, d aft of the nose
    return [round(xl, 3), round(h - H0, 3), round(Z0 - d, 3)]


def loft_rows(rows, cx=0.0):
    """(d, half_width, bottom_h, top_h, n[, cx]) -> loft stations about a mid line."""
    out = []
    for row in rows:
        d, a, hb, ht, n = row[:5]
        c = row[5] if len(row) > 5 else cx
        cy = 0.5 * (hb + ht)
        out.append([round(Z0 - d, 3), c, round(cy - H0, 3), a, round(ht - cy, 3), round(cy - hb, 3), n])
    return out


def panel_rows(rows):
    """(x_left, h, le_d, chord, tc) -> panel stations."""
    return [B(x, h, d) + [c, tc] for x, h, d, c, tc in rows]


def top_m(pts):               # (x_left, d) -> top-view body (x, z)
    return [[round(x, 3), round(Z0 - d, 3)] for x, d in pts]


def parts_spec():
    fuselage = [(0.0, 0.0, 1.55, 1.55, 2), (0.15, 0.12, 1.47, 1.63, 2), (0.6, 0.30, 1.33, 1.83, 2),
                (1.5, 0.50, 1.18, 2.02, 2), (2.8, 0.68, 1.08, 2.22, 2.2), (3.6, 0.78, 1.03, 2.32, 2.4),
                (5.0, 0.92, 0.98, 2.42, 2.6), (6.5, 1.02, 0.95, 2.48, 3), (8.5, 1.12, 0.95, 2.48, 3.2),
                (11.0, 1.15, 0.95, 2.42, 3.2), (14.0, 1.10, 0.97, 2.30, 3), (16.5, 0.95, 1.0, 2.08, 2.8),
                (18.5, 0.62, 1.08, 1.88, 2.4), (20.2, 0.40, 1.12, 1.62, 2.2), (21.0, 0.28, 1.15, 1.45, 2),
                (LENGTH, 0.0, 1.3, 1.3, 2)]
    spine = [(6.3, 0.0, 2.4, 2.4, 2.5), (7.0, 0.38, 2.3, 2.84, 2.5), (9.0, 0.45, 2.3, 2.76, 2.5),
             (11.5, 0.36, 2.25, 2.6, 2.5), (13.5, 0.0, 2.3, 2.3, 2.5)]
    canopy = [(3.5, 0.0, 2.2, 2.33, 2), (3.9, 0.30, 2.2, 2.62, 2), (4.6, 0.42, 2.2, 2.92, 2),
              (5.4, 0.45, 2.2, 3.05, 2), (6.3, 0.42, 2.2, 3.0, 2), (7.1, 0.30, 2.25, 2.84, 2), (7.6, 0.0, 2.4, 2.4, 2)]
    nacelle = [(6.3, 0.66, 0.02, 1.00, 6, 1.32), (7.0, 0.70, 0.0, 1.05, 5, 1.35), (9.0, 0.74, 0.0, 1.15, 4, 1.40),
               (12.0, 0.74, 0.03, 1.35, 3.5, 1.44), (14.5, 0.72, 0.12, 1.50, 3, 1.46),
               (16.5, 0.68, 0.25, 1.55, 2.6, 1.46), (18.5, 0.62, 0.38, 1.58, 2.3, 1.46),
               (20.1, 0.56, 0.47, 1.57, 2.1, 1.46)]
    intake = [(6.24, 0.58, 0.1, 0.92, 6, 1.32), (6.4, 0.58, 0.1, 0.92, 6, 1.32)]
    nozzle = [(19.9, 0.53, 0.48, 1.54, 2, 1.46), (20.4, 0.51, 0.50, 1.52, 2, 1.46), (20.75, 0.47, 0.54, 1.48, 2, 1.46)]
    rail = [(12.6, 0.0, 1.13, 1.13, 2), (12.9, 0.06, 1.08, 1.2, 2), (15.0, 0.06, 1.08, 1.2, 2), (15.2, 0.0, 1.14, 1.14, 2)]
    wing = [(0.9, 1.42, 5.2, 10.8, 0.035), (2.3, 1.38, 8.6, 7.43, 0.045), (TIP, 1.18, 13.15, 1.45, 0.04)]
    canard = [(1.0, 1.9, 6.0, 1.9, 0.04), (3.1, 1.86, 7.15, 0.45, 0.04)]
    stab = [(2.0, 0.88, 17.0, 3.55, 0.04), (4.95, 0.76, 19.4, 0.9, 0.04)]
    fin = [(2.15, 1.5, 14.3, 5.4, 0.045), (2.15, 4.3, 17.3, 1.15, 0.04)]
    ventral = [(1.75, 0.35, 15.0, 2.2, 0.05), (1.75, -0.45, 15.8, 1.1, 0.05)]
    grey, dark = 'VEHICLE_PLANE_GREY', 'VEHICLE_PLANE_ENGINE'
    return {
        'id': 'lp_su33',
        'name': 'Su-33 (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': grey,
        'smooth_deg': 35,
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 28, 'resample': 34, 'stations': loft_rows(fuselage)},
            {'name': 'Spine', 'type': 'loft', 'segments': 16, 'resample': 10, 'stations': loft_rows(spine)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 20, 'resample': 18,
             'stations': loft_rows(nacelle)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 11, 'stations': panel_rows(wing)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'normal': [1, 0, 0], 'chord_points': 9,
             'stations': panel_rows(fin)},
            {'name': 'Ventral', 'type': 'panel', 'mirror': True, 'normal': [1, 0, 0], 'chord_points': 5,
             'stations': panel_rows(ventral)},
            {'name': 'Rail', 'type': 'loft', 'mirror': True, 'segments': 8, 'stations': loft_rows(rail, TIP + 0.03)},
            {'name': 'Canopy', 'type': 'loft', 'join': 'separate', 'material': 'GLASS', 'segments': 20,
             'resample': 12, 'stations': loft_rows(canopy)},
            {'name': 'Intake', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': dark,
             'segments': 16, 'stations': loft_rows(intake)},
            {'name': 'Nozzle', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': dark,
             'segments': 16, 'stations': loft_rows(nozzle)},
            {'name': 'Canard', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(canard),
             'surface': {'type': 'canard', 'view': 'top', 'hinge_m': top_m([(1.3, 7.0), (3.1, 7.3)])}},
            {'name': 'Stabilator', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(stab),
             'surface': {'type': 'stabilator', 'view': 'top', 'hinge_m': top_m([(2.2, 19.0), (4.95, 19.6)])}},
        ],
        'surfaces': [
            {'type': 'slat', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(2.6, wing_le(2.6) + 0.6), (7.2, wing_le(7.2) + 0.5),
                                 (7.2, wing_le(7.2) - 0.3), (2.6, wing_le(2.6) - 0.3)])},
            {'type': 'aileron', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(4.9, wing_te(4.9) - 0.8), (7.2, wing_te(7.2) - 0.6),
                                 (7.2, wing_te(7.2) + 0.4), (4.9, wing_te(4.9) + 0.4)])},
            {'type': 'flap', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(2.5, wing_te(2.5) - 0.9), (4.8, wing_te(4.8) - 0.8),
                                 (4.8, wing_te(4.8) + 0.4), (2.5, wing_te(2.5) + 0.4)])},
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.9, 2.4],
             'polygon_m': [[round(Z0 - d, 3), round(h - H0, 3)] for d, h in
                           ((17.95, 4.4), (18.5, 1.95), (20.2, 1.95), (20.2, 4.4))]},
        ],
        'gear': {'legs': [
            {'name': 'Nose', 'pos_m': B(0.0, -1.63, 5.4), 'retract': 'forward', 'wheel_radius_m': 0.33},
            {'name': 'Main', 'pos_m': B(1.95, -1.63, 12.9), 'mirror': True, 'retract': 'forward',
             'wheel_radius_m': 0.52},
        ]},
        'cockpit_m': B(0.0, 2.55, 4.9),
    }


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

    with open(os.path.join(here, 'spec.json'), 'w') as f:
        json.dump(parts_spec(), f, indent=1)


if __name__ == '__main__':
    main()
