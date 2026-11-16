"""Write spec.json for the Yak-44E as shaped parts (about 5,000 triangles).

Contours were measured off the owner's three-view (Drive: 26-4906609-yak-44-f.gif,
not kept in this repository) station by station, scaled to length 20.39 m and
span 25.7 m; details (wing-top intake scoop, wrap-around windows, rotodome
lens, scimitar props) follow the mock-up photos in the same Drive folder.
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
    return 12.27 - 0.0619 * (x - 6.0)


def fus_rows(rows, n_of=lambda d: 2.8):
    """(d, half_width, y_bottom, y_top): widest at 60 % of the height, as in the front view."""
    out = []
    for d, a, yb, yt in rows:
        cy = yb + 0.6 * (yt - yb)
        out.append([round(Z0 - d, 3), 0.0, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n_of(d)])
    return out



DOOR = '#7b828a'      # door and hatch panels: a shade darker than the skin so their outlines read


def side_m(pts):
    return [[round(Z0 - d, 3), round(y, 3)] for d, y in pts]


def rounded_rect(d0, d1, y0, y1, r=0.14, k=3):
    """Side-view rounded rectangle (d, y), corner radius r with k segments per corner."""
    pts = []
    for cd, cy, a0 in ((d1 - r, y1 - r, 0), (d0 + r, y1 - r, 90), (d0 + r, y0 + r, 180), (d1 - r, y0 + r, 270)):
        for j in range(k + 1):
            t = math.radians(a0 + 90 * j / k)
            pts.append((cd + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def circle(d, y, r, n=8):
    return [(d + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n)) for k in range(n)]


def windows_and_doors():
    """Cockpit glazing and doors, measured off the nose zooms of the three-view and the mock-up photos.

    Four panes (top view): a windscreen half either side of the centre post, each
    wrapping round to a slanted post, then one side window per side (d 2.13..3.05). Left side: crew door behind the cockpit and the rear
    door aft of the wing fairing, each with a round porthole; a roof hatch above the
    cockpit. Portholes are cut before their doors so the door panel keeps the hole.
    """
    side_skin = [0.76, 1.6]          # depth (x) reaching only the left fuselage skin
    return [
        {'name': 'Windscreen', 'view': 'side', 'mirror': True, 'depth_m': [0.04, 1.6],
         'polygon_m': side_m([(1.2, -0.17), (1.2, 0.4), (2.17, 0.4), (2.06, -0.17)])},
        {'name': 'SideWindow', 'view': 'side', 'mirror': True, 'depth_m': [0.5, 1.6],
         'polygon_m': side_m([(2.13, -0.2), (2.25, 0.4), (2.95, 0.4), (3.05, 0.3), (3.05, -0.2)])},
        {'name': 'DoorPorthole', 'view': 'side', 'depth_m': side_skin, 'polygon_m': side_m(circle(3.97, -0.02, 0.15))},
        {'name': 'CrewDoor', 'view': 'side', 'depth_m': side_skin, 'material': DOOR,
         'polygon_m': side_m(rounded_rect(3.55, 4.4, -1.35, 0.4))},
        {'name': 'RearPorthole', 'view': 'side', 'depth_m': side_skin, 'polygon_m': side_m(circle(13.61, -0.05, 0.15))},
        {'name': 'RearDoor', 'view': 'side', 'depth_m': side_skin, 'material': DOOR,
         'polygon_m': side_m(rounded_rect(13.17, 14.05, -1.35, 0.36))},
        {'name': 'RoofHatch', 'view': 'top', 'depth_m': [0.3, 1.6], 'material': DOOR,
         'polygon_m': top_m([(-0.4, 2.62), (0.4, 2.62), (0.4, 3.2), (-0.4, 3.2)])},
    ]

def main():
    # Read off the drawing station by station (top-view half-width, side-view bottom and top).
    fuselage = [(0.0, 0.05, -1.32, -1.26), (0.05, 0.21, -1.45, -1.14), (0.2, 0.39, -1.59, -0.97),
                (0.4, 0.58, -1.68, -0.8), (0.7, 0.73, -1.75, -0.58), (1.0, 0.9, -1.77, -0.41),
                (1.4, 1.07, -1.79, -0.21), (1.8, 1.18, -1.81, 0.16), (2.3, 1.28, -1.83, 0.62),
                (2.8, 1.32, -1.86, 0.79), (3.5, 1.33, -1.87, 0.8), (8.0, 1.34, -1.9, 0.8),
                (13.0, 1.33, -1.94, 0.68), (14.3, 1.25, -1.9, 0.66), (15.5, 1.08, -1.75, 0.7),
                (16.5, 0.92, -1.52, 0.72), (17.5, 0.72, -1.29, 0.88), (18.5, 0.56, -1.05, 0.98),
                (19.3, 0.46, -0.87, 1.05), (19.8, 0.38, -0.68, 1.08), (20.1, 0.22, -0.56, 1.0),
                (20.2, 0.0, 0.2, 0.2)]
    fairing = [(6.3, 1.25, 0.6, 1.3, 4), (6.6, 1.3, 0.5, 1.36, 4), (9.0, 1.33, 0.5, 1.36, 4),
               (11.0, 1.3, 0.5, 1.3, 4), (12.0, 1.1, 0.5, 1.0, 3), (12.8, 0.6, 0.5, 0.75, 2.5),
               (13.0, 0.0, 0.6, 0.6, 2.5)]
    scoop = [(6.24, 0.95, 0.95, 1.24, 6), (6.36, 0.95, 0.95, 1.24, 6)]
    spinner = [(4.15, 0.0, 0.2, 0.2, 2), (4.6, 0.31, -0.11, 0.51, 2), (5.0, 0.39, -0.19, 0.59, 2),
               (5.6, 0.47, -0.27, 0.67, 2), (6.4, 0.55, -0.35, 0.75, 2)]
    nacelle = [(6.4, 0.55, -0.35, 0.75, 2), (6.6, 0.63, -0.45, 0.84, 2), (7.0, 0.7, -0.61, 1.0, 2.1),
               (7.5, 0.77, -0.75, 1.15, 2.2), (8.5, 0.78, -0.91, 1.25, 2.3), (9.5, 0.78, -0.95, 1.25, 2.3),
               (10.5, 0.75, -0.95, 1.15, 2.3), (11.5, 0.68, -0.95, 1.0, 2.2), (12.5, 0.57, -0.95, 0.81, 2.1),
               (13.5, 0.43, -0.87, 0.56, 2), (14.0, 0.3, -0.78, 0.3, 2), (14.35, 0.0, -0.55, -0.55, 2)]
    d_dome, r_dome, y_dome, t_dome = 13.4, 3.65, 4.06, 0.39
    dome = []
    for k in range(11):
        t = -1 + 2 * k / 10
        a = r_dome * math.sqrt(max(0.0, 1 - t * t))
        h = t_dome * math.sqrt(max(0.0, 1 - t * t)) + (0.03 if abs(t) < 1 else 0.0)
        dome.append((d_dome + t * r_dome, a, y_dome - h, y_dome + h, 1.7))
    wing = [(1.0, 0.95, 6.5, 6.1, 0.14), (5.2, 0.9, 8.41, 3.92, 0.15), (12.3, 0.92, 10.14, 1.74, 0.12),
            (12.6, 0.95, 10.38, 1.55, 0.11)]
    winglet = [(12.55, 0.95, 10.4, 1.5, 0.1), (12.78, 1.9, 11.3, 0.75, 0.08), (12.85, 2.3, 11.6, 0.4, 0.08)]
    tail = [(0.4, 0.95, 16.5, 3.38, 0.1), (5.8, 1.15, 18.0, 1.85, 0.1)]
    fin = [(5.8, -0.95, 18.45, 1.55, 0.08), (5.8, 1.0, 17.25, 2.85, 0.08), (5.8, 2.95, 18.2, 1.9, 0.08)]
    pylon = [(0.0, 0.6, 12.6, 2.3, 0.32), (0.0, 3.8, 12.7, 2.2, 0.32)]
    dark = 'VEHICLE_PLANE_ENGINE'
    spec = {
        'id': 'lp_yak44',
        'name': 'Yak-44E (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 35,
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 18, 'resample': 24, 'stations': fus_rows(fuselage)},
            {'name': 'Fairing', 'type': 'loft', 'segments': 16, 'resample': 10, 'stations': loft_rows(fairing)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 14, 'resample': 12,
             'stations': loft_rows(nacelle, 4.05)},
            {'name': 'Spinner', 'type': 'loft', 'mirror': True, 'segments': 14, 'resample': 7,
             'stations': loft_rows(spinner, 4.05)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(wing)},
            {'name': 'Winglet', 'type': 'panel', 'mirror': True, 'chord_points': 7, 'stations': panel_rows(winglet)},
            {'name': 'Tailplane', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(tail)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'normal': [1, 0, 0], 'chord_points': 9,
             'resample': 7, 'stations': panel_rows(fin)},
            {'name': 'Pylon', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 9, 'stations': panel_rows(pylon)},
            {'name': 'Rotodome', 'type': 'loft', 'join': 'separate', 'segments': 18, 'stations': loft_rows(dome)},
            {'name': 'Scoop', 'type': 'loft', 'join': 'separate', 'material': dark, 'segments': 12,
             'stations': loft_rows(scoop)},
            {'name': 'PropFront', 'type': 'prop', 'join': 'separate', 'mirror': True, 'material': dark,
             'center': P(4.05, 0.2, 5.55), 'radius': 2.25, 'blades': 8, 'root_r': 0.42, 'chord': 0.55},
            {'name': 'PropRear', 'type': 'prop', 'join': 'separate', 'mirror': True, 'material': dark,
             'center': P(4.05, 0.2, 6.15), 'radius': 2.2, 'blades': 6, 'root_r': 0.5, 'chord': 0.55,
             'phase_deg': 30, 'hand': -1},
        ],
        'regions': windows_and_doors(),
        'surfaces': [
            {'type': 'aileron', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(8.6, wing_te(8.6) - 0.45), (12.3, wing_te(12.3) - 0.35),
                                 (12.3, wing_te(12.3) + 0.4), (8.6, wing_te(8.6) + 0.4)])},
            {'type': 'flap', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(5.6, wing_te(5.6) - 0.9), (8.5, wing_te(8.5) - 0.85),
                                 (8.5, wing_te(8.5) + 0.4), (5.6, wing_te(5.6) + 0.4)])},
            {'type': 'flap', 'role': 'flapInner', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(1.45, wing_te(1.45) - 0.95), (3.25, wing_te(3.25) - 0.9),
                                 (3.25, wing_te(3.25) + 0.4), (1.45, wing_te(1.45) + 0.4)])},
            {'type': 'elevator', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(0.6, 19.1), (5.45, 19.1), (5.45, 20.1), (0.6, 20.1)])},
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [5.4, 6.2],
             'polygon_m': [[round(Z0 - d, 3), y] for d, y in ((19.3, 3.2), (19.3, -1.1), (20.4, -1.1), (20.4, 3.2))]},
        ],
        'gear': {'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, -2.83, 1.21), 'retract': 'aft', 'wheel_radius_m': 0.31},
            {'name': 'Main', 'pos_m': P(4.05, -2.58, 10.85), 'mirror': True, 'retract': 'aft', 'wheel_radius_m': 0.46},
        ]},
        'cockpit_m': P(0.0, 0.1, 2.4),
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
