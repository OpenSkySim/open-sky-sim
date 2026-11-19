"""Write spec.json for the Kamov Ka-29 (Helix-B) as shaped parts.

Contours were read off the owner's drawing sheet (Drive folder "Ka-29": "0 (1).jpg",
Aviatsiya i Vremya 2012, side and top view plus sections 1-11, 3 m scale bar; not kept in
this repository) at 46.2 px/m, both views. Coordinates below are in sheet pixels of the
upper side view (nose cap at x 337, cabin floor line y 243) and the top view (nose at
x 88, centre line y 350), converted to metres here. Checked against the published data:
fuselage 11.3 m, rotor diameter 15.9 m, height 5.44 m, main wheel track 3.5 m.
Details follow the two deck photos in the same folder (round engine intakes on the front
of the engine deck, twin end-plate fins, stub wings held by struts).
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
        (375, 0, 160, 145, 4),
        (386, 11, 160, 138, 4),
        (400, 11, 160, 137, 4),
        (422, 11, 160, 137, 4),
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
        {'name': 'Windscreen', 'view': 'side', 'see_through': True, 'flat_panes': True, 'flat_deg': 8, 'depth_m': [-1.3, 1.3],
         'polygon_m': [[z_(0.2), 1.28], [z_(0.71), 2.055], [z_(1.05), 2.055], [z_(1.05), 1.28]],
         'clip': {'view': 'top', 'polygons_m': [
             [[-0.38, z_(0.2)], [0.38, z_(0.2)], [0.38, z_(0.66)], [-0.38, z_(0.66)]],
             [[0.42, z_(0.25)], [0.92, z_(0.465)], [0.875, z_(0.76)], [0.42, z_(0.66)]],
             [[-0.42, z_(0.25)], [-0.42, z_(0.66)], [-0.875, z_(0.76)], [-0.92, z_(0.465)]]]}},
        # Side quarter panes (photo): the flat plane from each side pane's rear edge out to the
        # cabin wall at the sloping door pillar (body.QUARTER_1/2); frames stay hull skin.
        {'name': 'QuarterPane', 'view': 'side', 'mirror': True, 'see_through': True, 'flat_panes': True, 'flat_deg': 8, 'depth_m': [0.8, 1.3],
         'polygon_m': [[z_(0.5), 1.29], [z_(0.81), 2.0], [z_(1.03), 2.0], [z_(0.84), 1.29]]},
        # Cockpit door windows, both sides: front edge parallel to the door pillar (second sheet).
        {'name': 'DoorWindow', 'view': 'side', 'mirror': True, 'see_through': True, 'depth_m': [0.6, 1.3],
         # Owner's marked form: front edge parallel to the quarter pane's rear edge (4 cm post),
         # sharp top corners, rear edge straight down then slanting forward to the sill.
         'polygon_m': [[z_(0.88), 1.36], [z_(1.07), 2.0], [z_(1.72), 2.0], [z_(1.72), 1.66],
                       [z_(1.62), 1.36]]},
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
    ]


def fuselage_sections(cabin, deck):
    """Fuselage loft rows plus one polygon section per row (body.py, sections А-Л of the second sheet)."""
    cd = [d_(r[0]) for r in cabin]
    dd = [d_(r[0]) for r in deck]

    def bottom(d):
        b = float(np.interp(d, cd, [y_(r[2]) for r in cabin]))
        return b

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
    # The side's bend runs along one straight line (side view): fitted through the bends of the
    # cabin sections, and every ring puts a vertex on it.
    fit = [(sec['d'], bottom(sec['d']) + float(np.asarray(sec['half'])[int(np.argmax(np.asarray(sec['half'])[:, 0] >= 0.98 * np.asarray(sec['half'])[:, 0].max())), 1]))
           for k, sec in secs.items() if k in ('G', 'D', 'Zh', 'Z', 'I')]
    line_k, line_c = np.polyfit([f[0] for f in fit], [f[1] for f in fit], 1)
    crease = lambda d, scale=1.0: (line_k * d + line_c - bottom(d)) / scale
    for k, sec in secs.items():
        d = sec['d']
        H0 = np.asarray(sec['half'], dtype=float)
        sc = 1.0
        if k == 'A':
            sc = (body.PANE_A[1] - bottom(d)) / H0[:, 1].max()
        elif k in ('K', 'L'):
            sc = (cab_top(d) - bottom(d)) / H0[:, 1].max()
        H = body.resample_at_height(H0, crease(d, sc))
        d = sec['d']
        target = None
        if k == 'A':
            target = body.PANE_A[1] - bottom(d)      # the nose top meets the windscreen sill
        elif k in ('K', 'L'):
            target = cab_top(d) - bottom(d)          # the boom, without the deck's tail end
        if target:
            H[:, 1] *= target / H[:, 1].max()
        if k == 'B':
            # Below the glazing only: the outline above the sill is replaced by the panes anyway,
            # and blending its tall top into the nose rings creases the skin under the side panes.
            cap = body.PANE_A[1] - bottom(d)
            keys.append((body.PANE_C[2], H.copy()))   # the full outline from the side panes' top back
            H = body.resample_at_height(np.stack([H[:, 0], np.minimum(H[:, 1], cap)], axis=1), crease(d))
        keys.append((d, H))
        if k == 'V':
            # Just ahead of the deck's front face the fuselage still ends at the cockpit fairing,
            # so the rise to section Г stays behind the face (EngineDeck).
            H2 = H0.copy()
            H2[:, 1] *= (env_top(1.80) - bottom(1.86)) / H2[:, 1].max()
            H2 = body.resample_at_height(H2, crease(1.86))   # the side line runs on to the intakes
            keys.append((1.86, H2))
    keys += [se_key(r) for r in cabin if d_(r[0]) > 9.5 and r[1] > 0]
    keys.sort(key=lambda k: k[0])
    stations = {round(k[0], 3) for k in keys} | {1.45, 1.7, 2.5, 7.05}   # fewer in-between rings (owner: simplify)
    # Nose: the flat front panes need rings exactly at their corners (body.PANE_STATIONS).
    stations = sorted({d for d in stations if not 0.0 < d < 1.1} | set(body.PANE_STATIONS))   # nose tip: cap + pane rings only
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
    parts = [
        {'name': 'Fuselage', 'type': 'loft', 'segments': body.SEGMENTS, 'stations': fuse_rows},
        {'name': 'EngineDeck', 'type': 'loft', 'segments': 16, 'resample': 4, 'stations': loft_px(deck_front)},
        # Sensor fairing under the nose (side x 375..410).
        {'name': 'ChinPod', 'type': 'loft', 'segments': 10, 'stations': loft_px(
            [(374, 0, 233, 233, 2), (380, 7, 246, 222, 2.2), (402, 8, 247, 222, 2.2), (411, 0, 232, 232, 2)])},
        # Round dome on top of the deck, aft of the rotor (top view circle at x 400).
        {'name': 'TopDome', 'type': 'loft', 'segments': 10, 'stations': loft_px(
            [(640, 0, 111, 104, 2), (641, 7, 112, 102, 2), (657, 7, 112, 102, 2), (658, 0, 111, 104, 2)])},
        # Engine intakes (second sheet front view, owner's photos): black hollow rings standing
        # 0.15 m proud of the deck's front face (d 1.95; centres x +-0.43, y 2.52): a thick lip, an
        # open duct, the engine face at its back and a centre bullet.
        {'name': 'IntakeLip', 'type': 'duct', 'mirror': True, 'join': 'separate', 'sides': 6, 'material': DARK,
         'a': P(0.43, 2.52, 1.8), 'b': P(0.43, 2.52, 1.85), 'radius': 0.29, 'radius_b': 0.305,
         'inner': 0.215, 'inner_b': 0.23},
        {'name': 'IntakeDuct', 'type': 'duct', 'mirror': True, 'join': 'separate', 'sides': 6, 'material': DARK,
         'a': P(0.43, 2.52, 1.85), 'b': P(0.43, 2.52, 2.15), 'radius': 0.305, 'radius_b': 0.3,
         'inner': 0.23, 'inner_b': 0.23},
        {'name': 'IntakeFace', 'type': 'strut', 'mirror': True, 'join': 'separate', 'material': DARK,
         'a': P(0.43, 2.52, 1.86), 'b': P(0.43, 2.52, 2.1), 'radius': 0.235, 'sides': 6},
        {'name': 'IntakeCone', 'type': 'strut', 'mirror': True, 'join': 'separate', 'material': DARK,
         'a': P(0.43, 2.52, 1.8), 'b': P(0.43, 2.52, 1.86), 'radius': 0.02, 'radius_b': 0.09, 'sides': 8},
        # Engine exhausts (second sheet side view d 3.54-4.15, owner's photos): a hollow round pipe
        # standing out of the deck side, angled a little aft and down, with a thick lip; dark inside.
        {'name': 'ExhaustPipe', 'type': 'duct', 'mirror': True, 'join': 'separate', 'sides': 6,
         'a': P(0.45, 2.56, 3.76), 'b': P(0.99, 2.5, 3.93), 'radius': 0.26, 'radius_b': 0.27,
         'inner': 0.2, 'inner_b': 0.215},
        {'name': 'ExhaustLip', 'type': 'duct', 'mirror': True, 'join': 'separate', 'sides': 6,
         'a': P(0.98, 2.501, 3.927), 'b': P(1.04, 2.494, 3.946), 'radius': 0.285, 'radius_b': 0.29,
         'inner': 0.215, 'inner_b': 0.225},
        {'name': 'ExhaustLiner', 'type': 'duct', 'mirror': True, 'join': 'separate', 'sides': 6, 'material': DARK,
         'a': P(0.6, 2.543, 3.807), 'b': P(1.02, 2.496, 3.94), 'radius': 0.197, 'radius_b': 0.21,
         'inner': 0.185, 'inner_b': 0.198},
        {'name': 'ExhaustInside', 'type': 'strut', 'mirror': True, 'join': 'separate', 'material': DARK,
         'a': P(0.45, 2.56, 3.76), 'b': P(0.7, 2.532, 3.839), 'radius': 0.205, 'sides': 6},
        # Rotor mast, rebuilt after the owner's photo (bottom to top): a conical fairing on the deck,
        # the fixed lower swashplate (ring on three arms, three control rods from the deck), the
        # stepped lower mast into the lower hub, the gearbox drum and collar between the rotors, the
        # fixed upper swashplate (ring on three arms) under the upper head, and a slim upper mast
        # with a nut through the upper hub. The rotating parts are in the rotors' 'head'.
        {'name': 'MastFairing', 'type': 'strut', 'a': P(0.0, 2.7, mast_d - (0.0)), 'b': P(0.0, 2.86, mast_d - (0.0)), 'radius': 0.42, 'radius_b': 0.24, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'MastLower', 'type': 'strut', 'a': P(0.0, 2.86, mast_d - (0.0)), 'b': P(0.0, y_low - 0.1, mast_d - (0.0)), 'radius': 0.1, 'radius_b': 0.09, 'sides': 6, 'join': 'separate', 'material': '#8a8f94'},
        {'name': 'SwashLowerRing', 'type': 'strut', 'a': P(0.0, 2.935, mast_d - (0.0)), 'b': P(0.0, 2.97, mast_d - (0.0)), 'radius': 0.38, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashLowerHub', 'type': 'strut', 'a': P(0.0, 2.86, mast_d - (0.0)), 'b': P(0.0, 3.0, mast_d - (0.0)), 'radius': 0.14, 'radius_b': 0.12, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashLowerArm1', 'type': 'strut', 'a': P(0.11, 2.945, mast_d - (0.191)), 'b': P(0.18, 2.945, mast_d - (0.312)), 'radius': 0.022, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'ControlRod1', 'type': 'strut', 'a': P(0.18, 2.62, mast_d - (0.312)), 'b': P(0.18, 2.93, mast_d - (0.312)), 'radius': 0.016, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashLowerArm2', 'type': 'strut', 'a': P(0.11, 2.945, mast_d - (-0.191)), 'b': P(0.18, 2.945, mast_d - (-0.312)), 'radius': 0.022, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'ControlRod2', 'type': 'strut', 'a': P(0.18, 2.62, mast_d - (-0.312)), 'b': P(0.18, 2.93, mast_d - (-0.312)), 'radius': 0.016, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashLowerArm3', 'type': 'strut', 'a': P(-0.22, 2.945, mast_d - (-0.0)), 'b': P(-0.36, 2.945, mast_d - (-0.0)), 'radius': 0.022, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'ControlRod3', 'type': 'strut', 'a': P(-0.36, 2.62, mast_d - (-0.0)), 'b': P(-0.36, 2.93, mast_d - (-0.0)), 'radius': 0.016, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'MastMid', 'type': 'strut', 'a': P(0.0, y_low + 0.15, mast_d - (0.0)), 'b': P(0.0, y_up - 0.4, mast_d - (0.0)), 'radius': 0.08, 'radius_b': 0.075, 'sides': 8, 'join': 'separate', 'material': '#8a8f94'},
        {'name': 'MastGearbox', 'type': 'strut', 'a': P(0.0, y_low + 0.3, mast_d - (0.0)), 'b': P(0.0, y_low + 0.62, mast_d - (0.0)), 'radius': 0.13, 'radius_b': 0.12, 'sides': 8, 'join': 'separate', 'material': DARK},
        {'name': 'MastCollar', 'type': 'strut', 'a': P(0.0, y_low + 0.62, mast_d - (0.0)), 'b': P(0.0, y_low + 0.7, mast_d - (0.0)), 'radius': 0.15, 'sides': 10, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpperRing', 'type': 'strut', 'a': P(0.0, y_up - 0.455, mast_d - (0.0)), 'b': P(0.0, y_up - 0.42, mast_d - (0.0)), 'radius': 0.32, 'sides': 10, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpperHub', 'type': 'strut', 'a': P(0.0, y_up - 0.52, mast_d - (0.0)), 'b': P(0.0, y_up - 0.38, mast_d - (0.0)), 'radius': 0.11, 'radius_b': 0.095, 'sides': 8, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpperArm1', 'type': 'strut', 'a': P(0.18, y_up - 0.445, mast_d - (0.0)), 'b': P(0.3, y_up - 0.445, mast_d - (0.0)), 'radius': 0.02, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpperArm2', 'type': 'strut', 'a': P(-0.09, y_up - 0.445, mast_d - (-0.156)), 'b': P(-0.15, y_up - 0.445, mast_d - (-0.26)), 'radius': 0.02, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'SwashUpperArm3', 'type': 'strut', 'a': P(-0.09, y_up - 0.445, mast_d - (0.156)), 'b': P(-0.15, y_up - 0.445, mast_d - (0.26)), 'radius': 0.02, 'sides': 6, 'join': 'separate', 'material': DARK},
        {'name': 'MastUpper', 'type': 'strut', 'a': P(0.0, y_up - 0.38, mast_d - (0.0)), 'b': P(0.0, y_up + 0.3, mast_d - (0.0)), 'radius': 0.065, 'radius_b': 0.06, 'sides': 8, 'join': 'separate', 'material': '#8a8f94'},
        {'name': 'MastNut', 'type': 'strut', 'a': P(0.0, y_up + 0.3, mast_d - (0.0)), 'b': P(0.0, y_up + 0.38, mast_d - (0.0)), 'radius': 0.05, 'radius_b': 0.035, 'sides': 6, 'join': 'separate', 'material': DARK},
        # Coaxial rotors, 3 blades each, 15.9 m across, 1.47 m apart (drawing: hubs at y 90 and 22).
        # Contra-rotating: lower anticlockwise seen from above (hand +1), upper clockwise (hand -1).
        {'name': 'RotorLower', 'type': 'rotor', 'join': 'spin', 'spin_axis': [0, 1, 0], 'material': DARK,
         'center': P(0, y_low, mast_d), 'radius': 7.95, 'blades': 3, 'root_r': 0.75, 'chord': 0.52,
         'tc': 0.1, 'pitch_deg': 6, 'droop_deg': 3, 'hand': 1, 'phase_deg': 180, 'hub_r': 0.22, 'hub_h': 0.22,
         'spin_deg_s': 1600, 'hub_sides': 6, 'head': {'link': 0.32, 'ring_r': 0.34, 'tie_rods': [0.15, 1.0, 0.24]},
         'fold_blades': {'aft_deg': 180, 'spread_deg': 7}},
        {'name': 'RotorUpper', 'type': 'rotor', 'join': 'spin', 'spin_axis': [0, 1, 0], 'material': DARK,
         'center': P(0, y_up, mast_d), 'radius': 7.95, 'blades': 3, 'root_r': 0.75, 'chord': 0.52,
         'tc': 0.1, 'pitch_deg': 6, 'droop_deg': 2.5, 'hand': -1, 'phase_deg': 60, 'hub_r': 0.2,
         'hub_h': 0.22, 'spin_deg_s': 1600, 'hub_sides': 6,
         'head': {'link': 0.3, 'ring_r': 0.3, 'cap': True},
         'fold_blades': {'aft_deg': 180, 'spread_deg': 5}},
        # Stub wings (second sheet top/side views, owner's photos): a flat wing only between the
        # weapon beams (x 1.95-2.6), pipes inboard of it, with two weapon beams below, held by pipes from the cabin roof
        # line: a single strut at d 3.49 and a V (d 3.55 and 4.84) meeting at the wing at d 4.30.
        {'name': 'StubWing', 'type': 'panel', 'mirror': True, 'chord_points': 5,
         'stations': panel_rows([(1.95, 0.8, 3.34, 1.1, 0.1), (2.6, 0.8, 3.52, 0.9, 0.1)])},
        # Inboard of the inner beam there is no wing, only two horizontal pipes to the cabin side.
        {'name': 'WingPipeFront', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.85, 0.8, 3.45), 'b': P(1.97, 0.8, 3.45), 'radius': 0.05},
        {'name': 'WingPipeRear', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.85, 0.8, 4.35), 'b': P(1.97, 0.8, 4.35), 'radius': 0.05},
        {'name': 'WeaponBeamInner', 'type': 'loft', 'mirror': True, 'segments': 6, 'join': 'separate', 'stations':
         loft_m([(3.07, 0.05, 0.6, 0.68, 2), (3.21, 0.09, 0.5, 0.8, 2.5), (3.46, 0.09, 0.47, 0.8, 3),
                 (4.60, 0.09, 0.47, 0.8, 3), (4.67, 0.07, 0.5, 0.78, 3)], 1.97)},
        {'name': 'WeaponBeamOuter', 'type': 'loft', 'mirror': True, 'segments': 8, 'stations':
         loft_m([(3.27, 0.05, 0.6, 0.68, 2), (3.41, 0.09, 0.5, 0.8, 2.5), (3.66, 0.09, 0.47, 0.8, 3),
                 (4.83, 0.09, 0.47, 0.8, 3), (4.9, 0.07, 0.5, 0.78, 3)], 2.6)},
        # Cross pipe between the two horizontal pipes (owner's sketch): from the outer end of the
        # front pipe to the cabin end of the rear pipe.
        {'name': 'WingPipeCross', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(1.95, 0.8, 3.45), 'b': P(0.87, 0.8, 4.35), 'radius': 0.045},
        {'name': 'WingStrutFront', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.91, 1.81, 3.49), 'b': P(1.83, 0.86, 3.49), 'radius': 0.045},
        {'name': 'WingStrutVFront', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.91, 1.81, 3.55), 'b': P(1.8, 0.86, 4.3), 'radius': 0.045},
        {'name': 'WingStrutVRear', 'type': 'strut', 'mirror': True, 'join': 'separate',
         'a': P(0.88, 1.81, 4.84), 'b': P(1.8, 0.86, 4.3), 'radius': 0.045},
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
        {'name': 'Stabiliser', 'type': 'panel', 'mirror': True, 'chord_points': 5,
         'stations': panel_rows([(0.0, 1.62, d_(780), 1.27, 0.11), (1.52, 1.62, d_(780), 1.27, 0.11)])},
        {'name': 'Fin', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'resample': 6,
         'normal': [0.99, 0, 0.14], 'chord_dir': [0.14, 0, -0.99],
         # second sheet: rounded bottom at 0.66 m, top 2.65 m, LE d 9.47-9.7, TE d 11.17
         'stations': panel_rows([(1.52, 0.66, 9.85, 0.95, 0.09), (1.52, 0.8, 9.56, 1.5, 0.09),
                                 (1.52, 1.45, 9.47, 1.7, 0.09), (1.52, 2.2, 9.53, 1.62, 0.09),
                                 (1.52, 2.52, 9.6, 1.42, 0.09), (1.52, 2.65, 9.72, 0.95, 0.09)])},
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
         'stations': loft_m([(1.2, 0.24, 0.77, 1.15, 6), (1.6, 0.24, 0.77, 1.15, 6)], 0.52)},
        {'name': 'SeatBack', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#3a3e44', 'segments': 6,
         'stations': loft_m([(1.6, 0.24, 0.77, 1.85, 6), (1.75, 0.24, 0.77, 1.85, 6)], 0.52)},
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
        'symmetrize': True,
        # Nose front under the windscreen: fewer, larger faces (owner: halve the triangles there).
        'planar_zones': [{'min': [-1.3, -5, z_(0.95)], 'max': [1.3, 1.22, z_(-0.1)], 'deg': 25}],
        'sections': fuse_secs,
        'parts': parts,
        'regions': windows_and_doors(),
        'surfaces': [
            # Parking: the outer wings (outboard of the inner weapon beam, with the outer beam) fold
            # up 130 deg about a hinge along the wing's upper skin at x 2.08 (owner).
            # One item per side: the hinge axis comes out the same on both, so the signs differ.
            {'type': 'wingFold', 'role': 'wingFoldLeft', 'control': 'fold', 'view': 'top', 'mirror': False,
             'sign': -1.0, 'range_deg': 130.0, 'hinge_skin': 1.0,
             'polygon_m': [[2.08, z_(3.0)], [2.08, z_(5.0)], [2.9, z_(5.0)], [2.9, z_(3.0)]]},
            {'type': 'wingFold', 'role': 'wingFoldRight', 'control': 'fold', 'view': 'top', 'mirror': False,
             'sign': 1.0, 'range_deg': 130.0, 'hinge_skin': 1.0,
             'polygon_m': [[-2.08, z_(3.0)], [-2.08, z_(5.0)], [-2.9, z_(5.0)], [-2.9, z_(3.0)]]},
            # Rudders on the end-plate fins, hinged at d 10.35 (second sheet), above and below the
            # stabiliser (y 1.62) so they don't take its tips with them.
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.3, 1.9],
             'polygons_m': [[[z_(10.35), 2.7], [z_(10.35), 1.67], [z_(11.4), 1.67], [z_(11.4), 2.7]],
                            [[z_(10.35), 1.57], [z_(10.35), 0.6], [z_(11.4), 0.6], [z_(11.4), 1.57]]]},
        ],
        'gear': {'wheel_sides': 10, 'legs': [
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
        'pilot_seats_m': [P(0.52, 1.7, 1.3), P(-0.52, 1.7, 1.3)],
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
