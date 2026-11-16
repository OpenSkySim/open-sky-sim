"""Write spec.json for the Yak-44E as shaped parts (about 5,000 triangles).

Measurements were read off the owner's three-view (Drive: 26-4906609-yak-44-f.gif,
not kept in this repository) on a one-metre grid: length 20.39 m, span 25.7 m.
Owner's answers: the dash-dot lines (folded wing, lowered rotodome) are
ignored, all gear retracts aft, two end-plate fins with rudders, grey with
glass windows.   python make_spec.py
"""
import json
import math
import os

LENGTH, SPAN = 20.39, 25.7
Z0 = 0.6 * LENGTH             # body z = 0 this far aft of the nose; body y as measured on the drawing


def P(x, y, d):
    return [round(x, 3), round(y, 3), round(Z0 - d, 3)]


def loft_rows(rows, cx=0.0):
    """(d, half_width, y_bottom, y_top, n) -> loft stations about a mid line."""
    out = []
    for d, a, yb, yt, n in rows:
        cy = 0.5 * (yb + yt)
        out.append([round(Z0 - d, 3), cx, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n])
    return out


def panel_rows(rows):
    return [P(x, y, d) + [c, tc] for x, y, d, c, tc in rows]


def top_m(pts):
    return [[round(x, 3), round(Z0 - d, 3)] for x, d in pts]


def wing_te(x):
    return 11.4 - (x - 0.8) * 0.6 / 11.8


def main():
    fuselage = [(0.0, 0.0, -1.38, -1.32, 2), (0.25, 0.45, -1.7, -0.95, 2), (0.7, 0.8, -1.85, -0.55, 2),
                (1.4, 1.1, -1.9, 0.0, 2.2), (2.3, 1.28, -1.92, 0.75, 2.4), (3.2, 1.33, -1.92, 0.86, 2.5),
                (6.0, 1.33, -1.92, 0.86, 2.5), (9.0, 1.33, -1.92, 0.86, 2.5), (12.5, 1.30, -1.92, 0.82, 2.5),
                (14.3, 1.2, -1.85, 0.8, 2.4), (16.0, 0.95, -1.5, 0.78, 2.3), (17.5, 0.7, -1.2, 0.7, 2.2),
                (18.8, 0.45, -0.95, 0.5, 2), (19.6, 0.25, -0.6, 0.25, 2), (20.0, 0.0, -0.2, -0.2, 2)]
    fairing = [(6.4, 0.0, 0.8, 0.8, 2.5), (7.4, 0.9, 0.7, 1.3, 2.5), (9.5, 1.0, 0.7, 1.48, 2.5),
               (11.8, 0.9, 0.7, 1.35, 2.5), (12.8, 0.0, 0.8, 0.8, 2.5)]
    nacelle = [(6.0, 0.6, -0.55, 0.8, 2), (6.5, 0.72, -0.8, 1.05, 2), (7.5, 0.78, -1.1, 1.35, 2.2),
               (9.5, 0.8, -1.2, 1.45, 2.3), (11.5, 0.72, -1.15, 1.35, 2.2), (13.0, 0.45, -0.95, 0.9, 2),
               (14.0, 0.0, -0.6, -0.6, 2)]
    spinner = [(4.2, 0.0, 0.12, 0.12, 2), (4.5, 0.28, -0.16, 0.4, 2), (5.0, 0.45, -0.33, 0.57, 2),
               (5.6, 0.54, -0.42, 0.66, 2), (6.05, 0.58, -0.46, 0.7, 2)]
    r_dome, d_dome, y_dome, t_dome = 3.65, 12.85, 3.5, 0.42
    dome = []
    for k in range(11):
        t = -1 + 2 * k / 10
        a = r_dome * math.sqrt(max(0.0, 1 - t * t))
        h = t_dome * math.sqrt(max(0.0, 1 - t * t)) + (0.04 if abs(t) < 1 else 0.0)
        dome.append((d_dome + t * r_dome, a, y_dome - h, y_dome + h, 1.7))
    wing = [(0.8, 1.15, 7.6, 3.8, 0.14), (12.6, 1.2, 9.75, 1.05, 0.12)]
    winglet = [(12.55, 1.2, 9.8, 0.95, 0.1), (12.9, 2.3, 10.25, 0.45, 0.08)]
    tail = [(0.3, 0.6, 17.0, 2.75, 0.1), (5.75, 0.85, 17.6, 2.0, 0.1)]
    fin = [(5.75, -0.95, 18.3, 1.8, 0.1), (5.75, 0.8, 16.9, 3.2, 0.1), (5.75, 3.85, 18.1, 1.95, 0.08)]
    pylon = [(0.0, 0.7, 11.0, 3.0, 0.12), (0.0, 3.3, 11.3, 2.7, 0.12)]
    dark = 'VEHICLE_PLANE_ENGINE'
    spec = {
        'id': 'lp_yak44',
        'name': 'Yak-44E (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 35,
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 20, 'resample': 22, 'stations': loft_rows(fuselage)},
            {'name': 'Fairing', 'type': 'loft', 'segments': 16, 'resample': 10, 'stations': loft_rows(fairing)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 14, 'resample': 10,
             'stations': loft_rows(nacelle, 4.65)},
            {'name': 'Spinner', 'type': 'loft', 'mirror': True, 'segments': 16, 'resample': 8,
             'stations': loft_rows(spinner, 4.65)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(wing)},
            {'name': 'Winglet', 'type': 'panel', 'mirror': True, 'chord_points': 7, 'stations': panel_rows(winglet)},
            {'name': 'Tailplane', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(tail)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'normal': [1, 0, 0], 'chord_points': 9,
             'resample': 7, 'stations': panel_rows(fin)},
            {'name': 'Pylon', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 9, 'stations': panel_rows(pylon)},
            {'name': 'Rotodome', 'type': 'loft', 'join': 'separate', 'segments': 18, 'stations': loft_rows(dome)},
            {'name': 'PropFront', 'type': 'prop', 'join': 'separate', 'mirror': True, 'material': dark,
             'center': P(4.65, 0.12, 5.35), 'radius': 2.23, 'blades': 6, 'root_r': 0.45, 'chord': 0.42},
            {'name': 'PropRear', 'type': 'prop', 'join': 'separate', 'mirror': True, 'material': dark,
             'center': P(4.65, 0.12, 5.8), 'radius': 2.15, 'blades': 6, 'root_r': 0.5, 'chord': 0.4,
             'phase_deg': 30, 'hand': -1},
        ],
        'regions': [
            {'name': 'Windows', 'view': 'side', 'material': 'GLASS',
             'polygon_m': [[round(Z0 - d, 3), y] for d, y in ((1.45, 0.02), (2.25, 0.8), (3.1, 0.8), (3.1, 0.02))]},
        ],
        'surfaces': [
            {'type': 'aileron', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(8.6, wing_te(8.6) - 0.45), (12.3, wing_te(12.3) - 0.35),
                                 (12.3, wing_te(12.3) + 0.4), (8.6, wing_te(8.6) + 0.4)])},
            {'type': 'flap', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(5.6, wing_te(5.6) - 0.9), (8.5, wing_te(8.5) - 0.85),
                                 (8.5, wing_te(8.5) + 0.4), (5.6, wing_te(5.6) + 0.4)])},
            {'type': 'flap', 'role': 'flapInner', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(1.45, wing_te(1.45) - 0.95), (3.8, wing_te(3.8) - 0.9),
                                 (3.8, wing_te(3.8) + 0.4), (1.45, wing_te(1.45) + 0.4)])},
            {'type': 'elevator', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(0.5, 19.05), (5.4, 19.05), (5.4, 20.0), (0.5, 20.0)])},
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [5.3, 6.2],
             'polygon_m': [[round(Z0 - d, 3), y] for d, y in ((19.2, 4.0), (19.2, -1.1), (20.4, -1.1), (20.4, 4.0))]},
        ],
        'gear': {'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, -2.6, 1.25), 'retract': 'aft', 'wheel_radius_m': 0.3},
            {'name': 'Main', 'pos_m': P(4.65, -2.6, 10.9), 'mirror': True, 'retract': 'aft', 'wheel_radius_m': 0.45},
        ]},
        'cockpit_m': P(0.0, 0.4, 2.0),
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
