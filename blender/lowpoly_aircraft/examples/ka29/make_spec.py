"""Write spec.json for the Kamov Ka-29 (Helix-B) as shaped parts.

Contours were read off the owner's drawing sheet (Drive folder "Ka-29": "0 (1).jpg",
Aviatsiya i Vremya 2012, side and top view plus sections 1-11, 3 m scale bar; not kept in
this repository) at 46.2 px/m, both views. Coordinates below are in sheet pixels of the
upper side view (nose cap at x 337, cabin floor line y 243) and the top view (nose at
x 88, centre line y 350), converted to metres here. Checked against the published data:
fuselage 11.3 m, rotor diameter 15.9 m, height 5.44 m, main wheel track 3.5 m.
Details follow the two deck photos in the same folder (round engine intakes on the front
of the engine deck, twin end-plate fins, rocket pods on the outriggers).
The owner's second sheet (side, top, bottom and front view with sections А-Л, 163.5 px/m;
not kept here either) sets the fuselage cross-sections (body.py, ka29_sections.json), the nose
wheel track (1.4 m), and the intake positions (front view).
    python make_spec.py
"""
import json
import math
import os

import numpy as np

import body

S = 46.2                 # px per metre, both views
SX0, SY0 = 337.0, 243.0  # side view: nose cap x, cabin floor line y
TX0 = 88.0               # top view: nose x (top x = side x - 249)
D_CG = 4.22              # origin (the sim's centre of gravity) under the rotor mast
Z0 = D_CG


def d_(px):
    return (px - SX0) / S


def y_(py):
    return (SY0 - py) / S


def z_(d):
    return round(Z0 - d, 3)


def P(x, y, d):
    return [round(x, 3), round(y, 3), z_(d)]


def side_m(pts):
    """Side-view pixels (x, y) -> body (z, y)."""
    return [[z_(d_(x)), round(y_(y), 3)] for x, y in pts]


def top_m(pts):
    """Top-view pixels given as side x and half-width px -> body (x, z)."""
    return [[round(hw / S, 3), z_(d_(x))] for x, hw in pts]


def loft_px(rows, cx=0.0, n_top=None):
    """(side x, half-width px, bottom py, top py, n[, n_top]) -> loft stations."""
    out = []
    for r in rows:
        x, hw, yb, yt, n = r[:5]
        nt = r[5] if len(r) > 5 else n_top
        ybm, ytm = y_(yb), y_(yt)
        cy = 0.5 * (ybm + ytm)
        row = [z_(d_(x)), cx, round(cy, 3), round(hw / S, 3), round(ytm - cy, 3), round(cy - ybm, 3), n]
        if nt is not None:
            row.append(nt)
        out.append(row)
    return out


def loft_m(rows, cx=0.0):
    """(d, half_width, y_bottom, y_top, n) in metres -> loft stations."""
    out = []
    for d, a, yb, yt, n in rows:
        cy = 0.5 * (yb + yt)
        out.append([z_(d), cx, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n])
    return out


def panel_rows(rows):
    return [P(x, y, d) + [c, tc] for x, y, d, c, tc in rows]


def rounded_rect(x0, x1, y0, y1, r=4.0, k=3):
    """Side-view rounded rectangle in pixels (y down), corner radius r with k segments per corner."""
    pts = []
    for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        for j in range(k + 1):
            t = math.radians(a0 + 90 * j / k)
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def circle_px(x, y, r, n=10):
    return [(x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n)) for k in range(n)]


DARK = 'VEHICLE_PLANE_ENGINE'
DOOR = '#7b828a'


def fuselage():
    # Cabin and tail boom in one loft. Side x, top-view half-width, bottom and top (side y), n, n_top.
    # The nose is a blunt, wide box (top view: flat front 1.86 m wide) under a sloping windscreen;
    # the cockpit doors bulge out to 1.06 m half-width, the cabin is 1.75 m wide, the boom tapers
    # from the zig-zag joint (x 702) to the fin.
    rows = [
        (336, 34, 208, 195, 2.6, 2.6),
        (339, 41, 213, 191, 3.0, 3.0),
        (345, 45, 217, 188, 3.2, 3.0),
        (352, 47, 220, 183, 3.4, 3.0),
        (362, 48, 224, 167, 3.4, 3.0),
        (373, 49, 227, 150, 3.4, 3.2),
        (392, 49, 230, 149, 3.4, 3.4),
        (415, 49, 233, 149, 3.4, 3.4),
        (436, 47, 237, 149, 3.4, 3.4),
        (452, 43, 240, 149, 3.4, 3.4),
        (472, 41, 242.5, 149, 3.4, 3.4),
        (520, 40.5, 243, 149, 3.4, 3.4),
        (600, 40.5, 243, 149, 3.4, 3.4),
        (640, 38.5, 243, 149, 3.3, 3.3),
        (662, 35, 241.5, 149, 3.1, 3.2),
        (680, 31, 236, 149, 2.8, 3.0),
        (692, 28, 229, 150, 2.6, 2.8),
        (702, 26, 220, 151, 2.4, 2.6),
        (730, 22, 210, 151, 2.2, 2.4),
        (760, 18, 201, 151, 2.2, 2.3),
        (790, 14, 193, 153, 2.2, 2.2),
        (825, 10, 186, 158, 2.2, 2.2),
        (848, 6, 181, 164, 2.2, 2.2),
        (856, 0, 174, 174, 2.0, 2.0),
    ]
    # Engine and gearbox deck on top of the cabin (narrower: sections 7 and 8), with its flat front
    # face at x 424 above a low fairing over the cockpit roof, rounding down to the boom at x 705.
    deck = [
        (375, 0, 160, 147, 2.4),
        (386, 26, 160, 140, 2.4),
        (400, 31, 160, 135, 2.5),
        (422, 33, 160, 133, 2.6),
        (427, 33, 160, 116, 2.6),
        (432, 34, 160, 110, 2.6),
        (455, 34, 160, 109, 2.6),
        (575, 34, 160, 108, 2.6),
        (600, 33.5, 160, 112, 2.6),
        (630, 31, 160, 117, 2.5),
        (660, 26, 160, 124, 2.4),
        (680, 20, 160, 131, 2.3),
        (694, 14, 160, 139, 2.2),
        (703, 7, 160, 147, 2.2),
        (706, 0, 156, 156, 2.0),
    ]
    return rows, deck


def windows_and_doors():
    side_skin = [0.6, 1.3]       # depth reaching only the left cabin wall
    return [
        # Three flat front panes (owner's photo): the hull itself is cut flat there (body.windscreen),
        # and the glass is the side-view band clipped to three top-view strips, so the frames between
        # them (x +-0.29, 6 cm) and the corner frames stay hull skin.
        {'name': 'Windscreen', 'view': 'side', 'see_through': True, 'depth_m': [-1.3, 1.3],
         'polygon_m': [[z_(0.2), 1.3], [z_(0.8), 2.1], [z_(1.05), 2.1], [z_(1.05), 1.3]],
         'clip': {'view': 'top', 'polygons_m': [
             [[-0.26, z_(0.2)], [0.26, z_(0.2)], [0.26, z_(0.78)], [-0.26, z_(0.78)]],
             [[0.32, z_(0.25)], [0.79, z_(0.385)], [0.735, z_(0.875)], [0.32, z_(0.78)]],
             [[-0.32, z_(0.25)], [-0.32, z_(0.78)], [-0.735, z_(0.875)], [-0.79, z_(0.385)]]]}},
        # Side quarter panes (photo): the flat plane from each side pane's rear edge out to the
        # cabin wall at the sloping door pillar (body.QUARTER_1/2); frames stay hull skin.
        {'name': 'QuarterPane', 'view': 'side', 'mirror': True, 'see_through': True, 'depth_m': [0.8, 1.3],
         'polygon_m': [[z_(0.435), 1.32], [z_(0.875), 2.0], [z_(0.975), 1.86], [z_(0.75), 1.32]]},
        # Cockpit door windows, both sides: front edge parallel to the door pillar (second sheet).
        {'name': 'DoorWindow', 'view': 'side', 'mirror': True, 'see_through': True, 'depth_m': [0.6, 1.3],
         'polygon_m': [[z_(0.86), 1.26], [z_(1.11), 1.86], [z_(1.17), 1.9], [z_(1.66), 1.9], [z_(1.72), 1.84],
                       [z_(1.73), 1.31], [z_(1.69), 1.26]]},
        {'name': 'CabinWindowFront', 'view': 'side', 'mirror': True, 'depth_m': side_skin,
         'polygon_m': side_m(rounded_rect(456, 472, 160, 181, 3))},
        {'name': 'CabinWindowRear', 'view': 'side', 'mirror': True, 'depth_m': side_skin,
         'polygon_m': side_m(rounded_rect(626, 642, 160, 178, 3))},
        # Sliding cabin door on the left (its window cut first, so the door panel keeps the hole).
        {'name': 'CabinDoor', 'view': 'side', 'depth_m': side_skin, 'material': DOOR,
         'polygon_m': side_m(rounded_rect(606, 662, 155, 213, 4))},
        # Engine exhausts: two dark outlets on each side of the engine deck (x 581..606).
        {'name': 'Exhaust', 'view': 'side', 'mirror': True, 'depth_m': [0.45, 1.0], 'material': DARK,
         'polygons_m': [side_m(rounded_rect(581, 592, 127, 150, 2)), side_m(rounded_rect(595, 606, 127, 150, 2))]},
        # Round hatch on the engine deck side (x 483).
        {'name': 'DeckHatch', 'view': 'side', 'mirror': True, 'depth_m': [0.5, 1.0], 'material': DOOR,
         'polygon_m': side_m(circle_px(483, 129, 15, 12))},
    ]


def fuselage_sections(cabin, deck):
    """Fuselage loft rows plus one polygon section per row (body.py, sections А-Л of the second sheet)."""
    cd = [d_(r[0]) for r in cabin]
    dd = [d_(r[0]) for r in deck]

    def bottom(d):
        return float(np.interp(d, cd, [y_(r[2]) for r in cabin]))

    def cab_top(d):
        return float(np.interp(d, cd, [y_(r[3]) for r in cabin]))

    def env_top(d):
        t = cab_top(d)
        if dd[0] <= d <= dd[-1]:
            t = max(t, float(np.interp(d, dd, [y_(r[3]) for r in deck])))
        return t

    def se_key(r):
        x, hw, yb, yt, n = r[:5]
        nt = r[5] if len(r) > 5 else None
        h = y_(yt) - y_(yb)
        return d_(x), body.resample(body.superellipse_half(hw / S, h / 2, h / 2, n, nt))

    secs = body.load_sections()
    keys = [se_key(r) for r in cabin[:3]]
    for k, sec in secs.items():
        H = body.resample(sec['half'])
        d = sec['d']
        target = None
        if k in ('A', 'B', 'V'):
            target = env_top(d) - bottom(d)          # up to the cockpit fairing
        elif k in ('K', 'L'):
            target = cab_top(d) - bottom(d)          # the boom, without the deck's tail end
        if target:
            H[:, 1] *= target / H[:, 1].max()
        keys.append((d, H))
        if k == 'V':
            # Just ahead of the deck's front face the fuselage still ends at the cockpit fairing,
            # so the rise to section Г stays behind the face (EngineDeck).
            H2 = H.copy()
            H2[:, 1] *= (env_top(1.80) - bottom(1.86)) / H2[:, 1].max()
            keys.append((1.86, H2))
    keys += [se_key(r) for r in cabin if d_(r[0]) > 9.5 and r[1] > 0]
    keys.sort(key=lambda k: k[0])
    stations = {round(k[0], 3) for k in keys} | {1.45, 1.7, 2.5, 3.6, 4.7, 5.9, 7.05, 8.4}
    # Nose: the flat front panes need rings exactly at their corners (body.PANE_STATIONS).
    stations = sorted({d for d in stations if not 0.2 < d < 1.1} | set(body.PANE_STATIONS))
    rows, sections = [], []
    for d, H, y0 in body.build(keys, stations, bottom):
        H = body.windscreen(d, H, y0)
        top = y0 + H[:, 1].max()
        cy = 0.5 * (top + y0)
        rows.append([z_(d), 0.0, round(cy, 3), round(float(H[:, 0].max()), 3), round(top - cy, 3), round(cy - y0, 3), 2.0])
        sections.append({'part': 'Fuselage', 'z': z_(d), 'd': round(d, 3), 'pts': body.ring_points(H, y0)})
    tail = cabin[-1]
    rows.append([z_(d_(tail[0])), 0.0, round(y_(tail[2]), 3), 0.0, 0.0, 0.0, 2.0])
    return rows, sections


def main():
    cabin, deck = fuselage()
    fuse_rows, fuse_secs = fuselage_sections(cabin, deck)
    # The engine deck loft keeps only its front (cockpit fairing and the face with the intakes);
    # from section Г back the deck is part of the fuselage's sections.
    deck_front = [r for r in deck if r[0] <= 432] + [(437, 0, 136, 136, 2.0)]
    mast_d = d_(532)
    y_low, y_up = y_(90), y_(22)
    wheel_ground = y_(263) - 0.11   # second sheet: the fuselage stands 0.11 m higher than on the first
    main_x, main_d = (350 - 270) / S, d_(575)
    nose_d = d_(436)
    main_knee = 0.17
    pod_x, pod_y = 2.28, 0.68
    parts = [
        {'name': 'Fuselage', 'type': 'loft', 'segments': body.SEGMENTS, 'stations': fuse_rows},
        {'name': 'EngineDeck', 'type': 'loft', 'segments': 16, 'resample': 4, 'stations': loft_px(deck_front)},
        # Sensor fairing under the nose (side x 375..410).
        {'name': 'ChinPod', 'type': 'loft', 'segments': 10, 'stations': loft_px(
            [(374, 0, 233, 233, 2), (380, 7, 246, 222, 2.2), (402, 8, 247, 222, 2.2), (411, 0, 232, 232, 2)])},
        # Round dome on top of the deck, aft of the rotor (top view circle at x 400).
        {'name': 'TopDome', 'type': 'loft', 'segments': 10, 'stations': loft_px(
            [(640, 0, 111, 104, 2), (641, 7, 112, 102, 2), (657, 7, 112, 102, 2), (658, 0, 111, 104, 2)])},
        # Engine intakes: round lips standing proud of the deck's front face, dark mouths inside.
        {'name': 'IntakeLip', 'type': 'loft', 'mirror': True, 'segments': 10, 'stations': loft_m(
            [(1.88, 0.25, 2.37, 2.87, 2), (2.0, 0.27, 2.35, 2.89, 2), (2.2, 0.27, 2.35, 2.89, 2)], 0.49)},
        {'name': 'IntakeMouth', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': DARK,
         'segments': 10, 'stations': loft_m([(1.86, 0.2, 2.42, 2.82, 2), (1.9, 0.2, 2.42, 2.82, 2)], 0.49)},
        # Rotor mast and the swashplate drums between deck and hubs.
        {'name': 'Mast', 'type': 'strut', 'a': P(0, 2.8, mast_d), 'b': P(0, y_up + 0.25, mast_d),
         'radius': 0.13, 'sides': 10, 'join': 'separate'},
        {'name': 'SwashLower', 'type': 'strut', 'a': P(0, 2.9, mast_d), 'b': P(0, 3.12, mast_d),
         'radius': 0.3, 'sides': 10, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpper', 'type': 'strut', 'a': P(0, 3.6, mast_d), 'b': P(0, 3.95, mast_d),
         'radius': 0.24, 'radius_b': 0.2, 'sides': 10, 'join': 'separate', 'material': DARK},
        # Coaxial rotors, 3 blades each, 15.9 m across, 1.47 m apart (drawing: hubs at y 90 and 22).
        # Contra-rotating: lower anticlockwise seen from above (hand +1), upper clockwise (hand -1).
        {'name': 'RotorLower', 'type': 'rotor', 'join': 'spin', 'spin_axis': [0, 1, 0], 'material': DARK,
         'center': P(0, y_low, mast_d), 'radius': 7.95, 'blades': 3, 'root_r': 0.75, 'chord': 0.52,
         'tc': 0.1, 'pitch_deg': 6, 'droop_deg': 3, 'hand': 1, 'hub_r': 0.32, 'hub_h': 0.3,
         'spin_deg_s': 1600},
        {'name': 'RotorUpper', 'type': 'rotor', 'join': 'spin', 'spin_axis': [0, 1, 0], 'material': DARK,
         'center': P(0, y_up, mast_d), 'radius': 7.95, 'blades': 3, 'root_r': 0.75, 'chord': 0.52,
         'tc': 0.1, 'pitch_deg': 6, 'droop_deg': 2.5, 'hand': -1, 'phase_deg': 60, 'hub_r': 0.3,
         'hub_h': 0.3, 'spin_deg_s': 1600},
        # Weapon outriggers: a stub beam out to a rocket pod each side, braced by a V of struts
        # from the cabin roof line (side view x 500 and 560 meeting at x 539, y 206).
        {'name': 'OutriggerBeam', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'join': 'separate',
         'stations': panel_rows([(0.75, 0.96, d_(505), 0.85, 0.14), (pod_x, pod_y + 0.25, d_(507), 0.8, 0.14)])},
        {'name': 'RocketPod', 'type': 'loft', 'mirror': True, 'segments': 10, 'join': 'separate', 'stations':
         loft_m([(d_(478), 0.0, pod_y, pod_y, 2), (d_(482), 0.17, pod_y - 0.17, pod_y + 0.17, 2),
                 (d_(490), 0.23, pod_y - 0.23, pod_y + 0.23, 2), (d_(558), 0.23, pod_y - 0.23, pod_y + 0.23, 2),
                 (d_(562), 0.2, pod_y - 0.2, pod_y + 0.2, 2)], pod_x)},
        {'name': 'PodNose', 'type': 'loft', 'mirror': True, 'segments': 10, 'join': 'separate', 'material': DARK,
         'stations': loft_m([(d_(481), 0.15, pod_y - 0.15, pod_y + 0.15, 2), (d_(482.5), 0.15, pod_y - 0.15, pod_y + 0.15, 2)], pod_x)},
        {'name': 'OutriggerStrutFront', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.82, y_(156), d_(500)), 'b': P(pod_x - 0.15, pod_y + 0.3, d_(530)), 'radius': 0.05},
        {'name': 'OutriggerStrutRear', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.82, y_(156), d_(561)), 'b': P(pod_x - 0.15, pod_y + 0.3, d_(536)), 'radius': 0.05},
        # Main gear (fixed): oleo leg from the knee up to the cabin roof line, and an A-frame of two
        # radius rods at the fuselage bottom (second sheet: d 4.83 and 5.74 to the knee at y 0.17);
        # the gear leg runs from the knee down to the axle (top view: half-track 1.73 m).
        {'name': 'MainOleo', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(main_x - 0.1, main_knee, main_d), 'b': P(0.9, y_(157), d_(563)), 'radius': 0.08,
         'radius_b': 0.06},
        {'name': 'MainRodFront', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.82, 0.12, 4.83), 'b': P(main_x - 0.1, main_knee, main_d), 'radius': 0.045},
        {'name': 'MainRodRear', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.82, 0.12, 5.74), 'b': P(main_x - 0.1, main_knee, main_d), 'radius': 0.045},
        # Tail: stabiliser through the boom, toed-in end-plate fins, and a brace each side from
        # the boom to the top of each fin's leading edge (top view x 450 -> 520, side 702 -> 790).
        {'name': 'Stabiliser', 'type': 'panel', 'mirror': True, 'chord_points': 6,
         'stations': panel_rows([(0.0, 1.62, d_(780), 1.27, 0.11), (1.52, 1.62, d_(780), 1.27, 0.11)])},
        {'name': 'Fin', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'resample': 6,
         'normal': [0.99, 0, 0.14], 'chord_dir': [0.14, 0, -0.99],
         # second sheet: rounded bottom at 0.66 m, top 2.65 m, LE d 9.47-9.7, TE d 11.17
         'stations': panel_rows([(1.52, 0.66, 9.85, 0.95, 0.09), (1.52, 0.8, 9.56, 1.5, 0.09),
                                 (1.52, 1.45, 9.47, 1.7, 0.09), (1.52, 2.2, 9.53, 1.62, 0.09),
                                 (1.52, 2.52, 9.6, 1.42, 0.09), (1.52, 2.65, 9.72, 0.95, 0.09)])},
        {'name': 'TailBrace', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.3, y_(156), d_(704)), 'b': P(1.5, 2.45, 9.62), 'radius': 0.045},
        # Ventral strake under the boom (second sheet: from d 8.26 back to a near-vertical
        # trailing edge at d 9.1, 0.3 m deep).
        {'name': 'TailBumper', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 4,
         'stations': panel_rows([(0.0, 1.0, 8.2, 0.92, 0.1), (0.0, 0.78, 8.8, 0.3, 0.1)])},
        # Cockpit behind the glazing: one open space, two seats side by side, instrument panel,
        # dark floor, black bulkhead behind the seats.
        {'name': 'InstrumentPanel', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
         'segments': 6, 'stations': loft_m([(0.78, 0.95, 0.55, 1.12, 6), (0.9, 0.95, 0.55, 1.12, 6)])},
        {'name': 'GlareShield', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
         'segments': 6, 'stations': loft_m([(0.7, 0.95, 1.1, 1.16, 6), (0.98, 0.95, 1.1, 1.16, 6)])},
        {'name': 'Screens', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
         'segments': 6, 'stations': loft_m([(0.9, 0.16, 0.75, 1.0, 8), (0.92, 0.16, 0.75, 1.0, 8)], 0.42)},
        {'name': 'Pedestal', 'type': 'loft', 'join': 'separate', 'material': '#2e3236', 'segments': 6,
         'stations': loft_m([(0.9, 0.12, 0.35, 0.95, 6), (1.6, 0.12, 0.35, 0.75, 6)])},
        {'name': 'CockpitFloor', 'type': 'loft', 'join': 'separate', 'fill_hull': 'floor', 'material': '#2a2d31',
         'segments': 6, 'stations': loft_m([(0.3, 2.0, 0.33, 0.37, 8), (2.45, 2.0, 0.33, 0.37, 8)])},
        {'name': 'Seat', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#3a3e44', 'segments': 6,
         'stations': loft_m([(1.45, 0.24, 0.52, 0.9, 6), (1.85, 0.24, 0.52, 0.9, 6)], 0.42)},
        {'name': 'SeatBack', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#3a3e44', 'segments': 6,
         'stations': loft_m([(1.85, 0.24, 0.52, 1.6, 6), (2.0, 0.24, 0.52, 1.6, 6)], 0.42)},
        {'name': 'Bulkhead', 'type': 'loft', 'join': 'separate', 'fill_hull': 'section', 'material': '#121314',
         'segments': 6, 'stations': loft_m([(2.42, 2.5, -1.0, 2.6, 8), (2.48, 2.5, -1.0, 2.6, 8)])},
    ]
    spec = {
        'id': 'lp_ka29',
        'name': 'Ka-29 (Lowpoly)',
        'length_m': 11.3,
        'span_m': 15.9,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 0,
        'sections': fuse_secs,
        'parts': parts,
        'regions': windows_and_doors(),
        'surfaces': [
            # Rudders on the end-plate fins, hinged at d 10.35 (second sheet), above and below the
            # stabiliser (y 1.62) so they don't take its tips with them.
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.3, 1.9],
             'polygons_m': [[[z_(10.35), 2.7], [z_(10.35), 1.67], [z_(11.4), 1.67], [z_(11.4), 2.7]],
                            [[z_(10.35), 1.57], [z_(10.35), 0.6], [z_(11.4), 0.6], [z_(11.4), 1.57]]]},
        ],
        'gear': {'wheel_sides': 14, 'legs': [
            # Fixed gear (retract_deg 0). The drawing's nose wheels stand 0.24 m lower than the mains
            # (the Ka-29 sits nose-up on deck); the sim stands every wheel on one ground plane, so the
            # nose legs are shortened and the fuselage stays level, as the second sheet draws it.
            # Nose wheel track 1.4 m (second sheet, front view).
            {'name': 'Nose', 'pos_m': P(0.7, wheel_ground, nose_d), 'mirror': True, 'retract_deg': 0,
             'strut_top_y_m': y_(238), 'wheel_radius_m': 0.25, 'wheel_width_m': 0.16},
            {'name': 'Main', 'pos_m': P(main_x, wheel_ground, main_d), 'mirror': True, 'retract_deg': 0,
             'strut_top_y_m': main_knee, 'wheel_radius_m': 0.3, 'wheel_width_m': 0.2},
        ]},
        'open_cabin': {'lo': P(-1.2, 0.3, 2.42), 'hi': P(1.2, 2.05, 0.0)},
        'ground_y': -2.0,
        'cockpit_m': P(0.42, 1.35, 1.7),
        # Pilot (left) and navigator side by side: eye points over the seats.
        'pilot_seats_m': [P(0.42, 1.45, 1.55), P(-0.42, 1.45, 1.55)],
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
