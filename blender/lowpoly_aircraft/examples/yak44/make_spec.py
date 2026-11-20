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
FIN_AFT = 0.4          # fins with rudders moved aft of the drawing (user)
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


def wing_le(x):
    """Leading edge d at span x: one straight line from root to tip (x 5.2 -> 8.41, 12.3 -> 10.14)."""
    return 8.41 + 0.2437 * (x - 5.2)


def slat_m(x0, x1, depth0, depth1, ahead=0.4):
    """Top-view cut for a leading-edge slat; the aft edge comes first (it is the hinge)."""
    return top_m([(x0, wing_le(x0) + depth0), (x1, wing_le(x1) + depth1),
                  (x1, wing_le(x1) - ahead), (x0, wing_le(x0) - ahead)])


def fus_rows(rows, n_of=lambda d: 2.8, n_top_of=lambda d: 2.8):
    """(d, half_width, y_bottom, y_top): widest at 60 % of the height, as in the front view."""
    out = []
    for d, a, yb, yt in rows:
        cy = yb + 0.6 * (yt - yb)
        out.append([round(Z0 - d, 3), 0.0, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n_of(d),
                    n_top_of(d)])
    return out



DOOR = 'VEHICLE_PLANE_GREY'   # door and hatch panels take the skin's paint (owner, 2026-11-20) ...
DOOR_LINE = '#4a5057'         # ... and show as a thin dark line round their edge
# Propfan colours from the owner's photo of the real contra-rotating propfan (D-27 type):
# blue blades, yellow tips, brown leading-edge strips, white spinner and hub.
BLADE_BLUE = '#2f6db3'
BLADE_TIP = '#f2c21b'
BLADE_EDGE = '#6e4425'
HUB_WHITE = '#e6e8ea'
INLET_METAL = '#8b939b'

# Propfan blade planform (owner's photo): wide scimitar blades with a narrow neck at the hub,
# widest just inside mid-span, the leading edge curving back so the tip trails almost along
# the arc. Rows of [span fraction, chord fraction, pivot-line trail in metres].
PROPFAN_PLANFORM = [[0.0, 0.5, 0.0], [0.1, 0.78, 0.0], [0.3, 1.0, 0.04], [0.5, 1.0, 0.16],
                    [0.7, 0.88, 0.4], [0.86, 0.62, 0.68], [1.0, 0.18, 1.0]]
TIP_S = 0.84          # yellow tips from 84 % of the blade span outwards


def propfan_rows(name, d, radius, blades, hand, phase=0.0):
    """One propfan row as three spinning objects: blue blade, brown leading-edge strip, yellow tip."""
    base = {'type': 'prop', 'join': 'spin', 'mirror': True, 'center': P(4.05, 0.2, d), 'radius': radius,
            'blades': blades, 'root_r': 0.44, 'chord': 0.92, 'hand': hand, 'phase_deg': phase}
    blade = {'planform': PROPFAN_PLANFORM, 'pitch_deg': [45.0, 26.0], 'tc': 0.06, 'camber': 0.04}
    return [
        dict(base, name=name, material=BLADE_BLUE, span_range=[0.0, TIP_S],
             blade=dict(blade, stations=5, chord_u=[0.09, 1.0])),
        dict(base, name=name + 'Edge', material=BLADE_EDGE, span_range=[0.0, TIP_S],
             blade=dict(blade, stations=5, chord_u=[0.0, 0.09])),
        dict(base, name=name + 'Tips', material=BLADE_TIP, span_range=[TIP_S, 1.0],
             blade=dict(blade, stations=3, chord_u=[0.0, 0.45, 1.0])),
    ]


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
    # Top view of the glazing, left half: everything outboard of / ahead of the roof's front arch.
    glazing_top = top_m([(0.0, 0.5), (2.0, 0.5), (2.0, 3.3), (0.92, 3.3), (0.91, 2.97), (0.86, 2.41),
                         (0.69, 2.18), (0.45, 2.07), (0.2, 2.02), (0.0, 1.99)])
    return [
        # Side view as drawn (user): sills at y -0.2, tops at 0.38, the slanted post d 2.05..2.27; the
        # roof edge also follows the top view's arch from the centre post (d 1.99) round to the
        # corner posts (x 0.69, d 2.18) and back along the side windows (x 0.86..0.91).
        {'name': 'Windscreen', 'view': 'side', 'mirror': True, 'see_through': True, 'depth_m': [0.035, 1.6],
         'polygon_m': side_m([(1.2, -0.2), (1.2, 0.38), (2.2, 0.38), (2.05, -0.2)]),
         'clip': {'view': 'top', 'polygons_m': [glazing_top]}},
        {'name': 'SideWindow', 'view': 'side', 'mirror': True, 'see_through': True, 'depth_m': [0.5, 1.6],
         'polygon_m': side_m([(2.12, -0.2), (2.27, 0.37), (2.98, 0.37), (3.03, 0.3), (3.03, -0.15), (2.98, -0.2)]),
         'clip': {'view': 'top', 'polygons_m': [glazing_top]}},
        {'name': 'DoorPorthole', 'view': 'side', 'depth_m': side_skin, 'polygon_m': side_m(circle(3.97, -0.02, 0.15))},
        {'name': 'CrewDoor', 'view': 'side', 'depth_m': side_skin, 'material': DOOR, 'outline': DOOR_LINE,
         'polygon_m': side_m(rounded_rect(3.55, 4.4, -1.35, 0.4))},
        {'name': 'RearPorthole', 'view': 'side', 'depth_m': side_skin, 'polygon_m': side_m(circle(13.61, -0.05, 0.15))},
        {'name': 'RearDoor', 'view': 'side', 'depth_m': side_skin, 'material': DOOR, 'outline': DOOR_LINE,
         'polygon_m': side_m(rounded_rect(13.17, 14.05, -1.35, 0.36))},
        # Black radome cap on the nose tip and a dark band under the windscreen (reference renders).
        {'name': 'NoseCap', 'view': 'side', 'material': '#1d2024',
         'polygon_m': side_m([(-0.2, -2.5), (-0.2, 0.5), (0.3, 0.5), (0.3, -2.5)])},
        # One dark grey panel across the nose under the windscreen (not glass; user).
        {'name': 'LowerWindscreen', 'view': 'side', 'material': '#3a3e44',
         'polygon_m': side_m([(1.0, -0.44), (1.0, -0.24), (2.03, -0.24), (2.03, -0.36)])},
        {'name': 'BellyPorts', 'view': 'side', 'mirror': True, 'depth_m': side_skin,
         'polygons_m': [side_m(circle(8.38, -1.21, 0.09, 6)), side_m(circle(8.75, -1.2, 0.15)),
                        side_m(circle(9.16, -1.2, 0.15))]},
        {'name': 'RoofHatch', 'view': 'top', 'depth_m': [0.3, 1.6], 'material': DOOR, 'outline': DOOR_LINE,
         'polygon_m': top_m([(-0.4, 2.62), (0.4, 2.62), (0.4, 3.2), (-0.4, 3.2)])},
    ]

def main():
    # Read off the drawing station by station (top-view half-width, side-view bottom and top).
    # The top line runs straight aft at y 0.7 to the tail (user: the tail must not rise).
    fuselage = [(0.0, 0.05, -1.32, -1.26), (0.05, 0.21, -1.45, -1.14), (0.2, 0.39, -1.59, -0.97),
                (0.4, 0.58, -1.68, -0.8), (0.7, 0.73, -1.75, -0.58), (1.0, 0.9, -1.77, -0.41),
                (1.4, 1.07, -1.79, -0.21), (1.8, 1.18, -1.81, 0.16), (2.3, 1.28, -1.83, 0.62),
                (2.8, 1.32, -1.86, 0.79), (3.5, 1.33, -1.87, 0.8), (5.0, 1.335, -1.88, 0.8), (8.0, 1.34, -1.9, 0.8),
                (13.0, 1.33, -1.94, 0.68), (14.3, 1.25, -1.9, 0.66), (15.5, 1.08, -1.75, 0.7),
                (16.5, 0.92, -1.52, 0.7), (17.5, 0.72, -1.29, 0.7), (18.5, 0.56, -1.05, 0.7),
                (19.3, 0.46, -0.87, 0.69), (19.8, 0.38, -0.68, 0.66), (20.1, 0.22, -0.56, 0.6),
                (20.2, 0.0, 0.2, 0.2)]
    # Cockpit (user: window sides bend further inward): a rounder upper half over the glazing,
    # back to the boxier section by d 5.
    def cabin_n_top(d):
        return 2.0 if d <= 3.5 else 2.8
    # Air intake and wing-root fairing are one shape (top view: a flat mouth at d 5.43, x +-0.57, widening
    # smoothly to the fuselage width by d 7.8; side view: mouth y 0.9..1.3, top line y 1.36 running aft).
    fairing = [(5.4, 0.57, 0.75, 1.3, 2.6), (5.6, 0.66, 0.7, 1.34, 2.8), (6.0, 0.81, 0.6, 1.36, 3.0),
               (6.6, 0.97, 0.5, 1.36, 3.3), (7.2, 1.15, 0.5, 1.36, 3.6), (7.8, 1.3, 0.5, 1.36, 4),
               (9.0, 1.33, 0.5, 1.36, 4),
               (11.0, 1.3, 0.5, 1.3, 4), (12.0, 1.1, 0.5, 1.0, 3), (12.8, 0.6, 0.5, 0.75, 2.5),
               (13.0, 0.0, 0.6, 0.6, 2.5)]
    # The mouth: a dark-lined duct sunk 0.7 m into the fairing, narrowing inside.
    intake_mouth = [(5.2, 0.5, 0.86, 1.24, 2.6), (5.6, 0.5, 0.86, 1.24, 2.6), (5.95, 0.42, 0.9, 1.2, 2.4),
                    (6.15, 0.22, 0.98, 1.12, 2)]
    # Turbine exhaust: a round pipe ending aft-facing where the nacelle's upper half stops (drawing step at
    # d 13.1, y -0.12..0.57); the lower nacelle continues as the tail cone (reference renders).
    # Fairing that tapers the nacelle's upper half smoothly into the round nozzle.
    exhaust = [(11.3, 0.66, -0.2, 1.02, 2.2), (11.9, 0.62, -0.16, 0.92, 2.15), (12.4, 0.53, -0.14, 0.78, 2.1),
               (12.8, 0.42, -0.12, 0.64, 2.05), (13.12, 0.35, -0.12, 0.57, 2)]
    exhaust_mouth = [(13.08, 0.27, -0.05, 0.49, 2), (13.16, 0.27, -0.05, 0.49, 2)]
    # Teardrop blisters on the nacelle's outer side (reference renders; the 'D' marks on the drawing).
    blister_hi = [(7.3, 0.0, 0.62, 0.62, 2), (7.5, 0.1, 0.54, 0.7, 2), (8.0, 0.1, 0.54, 0.7, 2), (8.3, 0.0, 0.62, 0.62, 2)]
    blister_lo = [(8.3, 0.0, -0.12, -0.12, 2), (8.55, 0.1, -0.2, -0.04, 2), (9.2, 0.1, -0.2, -0.04, 2),
                  (9.5, 0.0, -0.12, -0.12, 2)]
    # Engine inlet behind the rear propfan row (owner's photo): a bright metal lip ring round the
    # nacelle face and a dark annular entry between the lip and the white hub that runs through it.
    # The lip uses the nacelle's 8-sided ring, 1.2 cm proud at the face, and runs back into the
    # nacelle skin (aft ring just inside it) so the two meshes meet without a step (user).
    inlet_lip = [(6.46, 0.6, -0.4, 0.8, 2), (6.5, 0.632, -0.432, 0.832, 2), (6.6, 0.655, -0.49, 0.89, 2)]
    inlet_gap = [(6.445, 0.57, -0.37, 0.77, 2), (6.46, 0.57, -0.37, 0.77, 2)]
    # Dark seam between the two counter-rotating hub barrels.
    hub_seam = [(5.74, 0.5, -0.3, 0.7, 2), (5.78, 0.5, -0.3, 0.7, 2)]
    # Flap-track fairings under the outer wing (two per side).
    def track(x, d0, d1):
        # Flap-track fairings, kept slim (user: smaller): 0.13 m wide, hanging 0.2 m below the wing.
        return [(d0, 0.0, 0.74, 0.74, 2), (d0 + 0.35, 0.065, 0.6, 0.85, 2.5), (d1 - 0.25, 0.065, 0.62, 0.85, 2.5),
                (d1, 0.0, 0.74, 0.74, 2)]
    # White spinner (long pointed cone) running into a cylindrical hub barrel that carries both
    # blade rows and passes through the inlet into the nacelle (owner's photo).
    # Rounded nose (user: not so pointed).
    spinner = [(4.18, 0.0, 0.2, 0.2, 2), (4.24, 0.13, 0.07, 0.33, 2), (4.42, 0.26, -0.06, 0.46, 2),
               (4.8, 0.37, -0.17, 0.57, 2), (5.4, 0.47, -0.27, 0.67, 2), (6.75, 0.48, -0.28, 0.68, 2)]
    nacelle = [(6.5, 0.62, -0.42, 0.82, 2), (6.64, 0.68, -0.53, 0.93, 2), (7.0, 0.72, -0.61, 1.0, 2.1),
               (7.5, 0.77, -0.75, 1.15, 2.2), (8.5, 0.78, -0.91, 1.25, 2.3), (9.5, 0.78, -0.95, 1.25, 2.3),
               (10.5, 0.75, -0.95, 1.15, 2.3), (11.5, 0.68, -0.95, 1.0, 2.2),
               # From here the upper half hands over to the exhaust fairing (below) and the nacelle itself
               # sinks into the lower tail cone that runs on past the exhaust (drawing step at d 13.1).
               (12.2, 0.6, -0.95, 0.62, 2.1), (12.7, 0.52, -0.93, 0.25, 2), (13.15, 0.44, -0.9, -0.1, 2),
               (13.7, 0.33, -0.82, -0.25, 2), (14.1, 0.2, -0.7, -0.4, 2), (14.3, 0.0, -0.56, -0.56, 2)]
    d_dome, r_dome, y_dome, t_dome = 13.4, 3.65, 4.06, 0.39
    dome = []
    for k in range(13):
        t = math.sin(math.pi / 2 * (-1 + 2 * k / 12))   # denser towards the rim, so it reads round in side view
        a = r_dome * math.sqrt(max(0.0, 1 - t * t))
        h = t_dome * math.sqrt(max(0.0, 1 - t * t)) + (0.03 if abs(t) < 1 else 0.0)
        dome.append((d_dome + t * r_dome, a, y_dome - h, y_dome + h, 1.7))
    wing = [(1.0, 0.95, 7.386, 5.214, 0.14),  # LE straight on from the outer wing, TE kept at d 12.6
            (5.2, 0.9, 8.41, 3.92, 0.15), (12.3, 0.92, 10.14, 1.74, 0.12),
            (12.6, 0.95, 10.38, 1.55, 0.11)]
    winglet = [(12.55, 0.95, 10.4, 1.5, 0.1), (12.78, 1.9, 11.3, 0.75, 0.08), (12.85, 2.3, 11.6, 0.4, 0.08)]
    # Slight dihedral (about 5.5 deg): the root sits on the fuselage side (side view: root LE d 16.6, y 0.55).
    # Runs through to the fuselage centre line (user), on the same straight edges and dihedral.
    tail = [(0.0, 0.472, 16.41, 3.5, 0.1), (5.55, 1.0, 18.0, 1.85, 0.1)]
    # Fins lean inward (front view: x 5.6 at the root, 5.3 at the tip).
    # Side view (user: match the drawing): leading edge kinked forward at y 1.09 (d 17.31), straight
    # trailing edge at d 20.31, the bottom edge rising aft from d 18.33/y -0.96 to y -0.5 at the TE.
    # User (2026-11-19): fins and rudders 0.4 m further aft than drawn (FIN_AFT).
    fin = [(x, y, d + FIN_AFT, c, tc) for x, y, d, c, tc in
           [(5.62, -0.96, 18.33, 1.2, 0.08), (5.59, -0.6, 18.15, 2.16, 0.08),
            (5.46, 1.09, 17.31, 3.0, 0.08), (5.32, 2.95, 18.33, 1.98, 0.08)]]
    # Telescopic rotodome mast: the upper part slides down into the lower one when parked (drawing:
    # rotodome lowered 1.5 m, dash-dot).
    pylon = [(0.0, 0.6, 12.6, 2.3, 0.32), (0.0, 2.4, 12.656, 2.26, 0.32)]
    pylon_upper = [(0.0, 2.25, 12.7, 2.1, 0.27), (0.0, 3.8, 12.75, 2.05, 0.27)]
    dark = 'VEHICLE_PLANE_ENGINE'
    # Wheel wells sunk into the nacelle bellies and the nose (all gear folds aft into the airframe);
    # cut as boxy lofts, lined dark, and closed by the doors under 'gear'.
    # Clearance around the folded gear: 5 cm ahead of the strut, 10 cm beside the wheels, 20 cm behind
    # them. Main gear up (strut lengthened so the wheels reach the ground level of the nose wheel):
    # strut from d 10.77, twin wheels |x| <= 0.384, d 11.72..12.64, y -0.54..0.38.
    # The wells stay inside the round nacelle section so they open only on the belly.
    main_well = [(10.72, 0.484, -1.35, 0.3, 4), (11.3, 0.484, -1.35, 0.45, 4), (12.2, 0.484, -1.35, 0.5, 4),
                 (12.84, 0.484, -1.35, 0.1, 3)]
    # Nose gear up: strut from d 1.16, wheels |x| <= 0.26, d 1.65..2.27, y -1.53..-0.9.
    # Kept under the cockpit floor (y -0.8): the leg folds 90 deg aft, stowed wheel -1.82..-1.24.
    nose_well = [(1.11, 0.36, -2.3, -1.24, 5), (1.7, 0.36, -2.3, -1.24, 5), (2.6, 0.36, -2.3, -1.24, 5)]
    # Teardrop hub under the rotodome where the pylon meets it (mock-up photo).
    dome_hub = [(12.3, 0.0, 3.62, 3.62, 2), (12.6, 0.35, 3.45, 3.74, 2.5), (13.6, 0.42, 3.42, 3.76, 2.5),
                (14.5, 0.3, 3.5, 3.72, 2.5), (14.9, 0.0, 3.62, 3.62, 2)]
    spec = {
        'id': 'lp_yak44',
        'name': 'Yak-44E (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 0,  # flat shaded; the game adds smooth normals itself when the player picks smooth shading
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 20, 'resample': 10, 'stations': fus_rows(fuselage, n_top_of=cabin_n_top)},
            {'name': 'Fairing', 'type': 'loft', 'segments': 8, 'resample': 6, 'stations': loft_rows(fairing)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 8, 'resample': 7,
             'stations': loft_rows(nacelle, 4.05)},
            {'name': 'Spinner', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': HUB_WHITE,
             'segments': 8, 'stations': loft_rows(spinner, 4.05)},
            {'name': 'HubSeam', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': dark,
             'segments': 8, 'stations': loft_rows(hub_seam, 4.05)},
            {'name': 'InletLip', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': INLET_METAL,
             'segments': 8, 'stations': loft_rows(inlet_lip, 4.05)},
            {'name': 'InletGap', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': dark,
             'segments': 8, 'stations': loft_rows(inlet_gap, 4.05)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(wing)},
            {'name': 'Winglet', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'stations': panel_rows(winglet)},
            {'name': 'Tailplane', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'stations': panel_rows(tail)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'normal': [1, 0, 0], 'chord_points': 5,
             'resample': 7, 'stations': panel_rows(fin)},
            {'name': 'Pylon', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 5, 'stations': panel_rows(pylon)},
            {'name': 'PylonUpper', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 5, 'join': 'slide',
             'slide_m': [0.0, -1.5, 0.0], 'stations': panel_rows(pylon_upper)},
            {'name': 'Rotodome', 'type': 'loft', 'join': 'slide', 'slide_m': [0.0, -1.5, 0.0], 'segments': 10,
             'stations': loft_rows(dome)},
            {'name': 'IntakeMouth', 'type': 'loft', 'join': 'cut', 'material': dark, 'segments': 8,
             'stations': loft_rows(intake_mouth)},
            {'name': 'Exhaust', 'type': 'loft', 'mirror': True, 'segments': 8, 'resample': 5, 'stations': loft_rows(exhaust, 4.05)},
            {'name': 'ExhaustMouth', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': dark,
             'segments': 6, 'stations': loft_rows(exhaust_mouth, 4.05)},
            {'name': 'BlisterUpper', 'type': 'loft', 'mirror': True, 'segments': 6, 'stations': loft_rows(blister_hi, 4.79)},
            {'name': 'BlisterLower', 'type': 'loft', 'mirror': True, 'segments': 6, 'stations': loft_rows(blister_lo, 4.8)},
            {'name': 'TrackInner', 'type': 'loft', 'mirror': True, 'segments': 6, 'stations': loft_rows(track(6.6, 9.8, 12.6), 6.6)},
            {'name': 'TrackOuter', 'type': 'loft', 'mirror': True, 'segments': 6, 'stations': loft_rows(track(8.05, 10.2, 12.5), 8.05)},
            {'name': 'AntennaTop', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 3,
             'stations': panel_rows([(0.0, 0.72, 3.62, 0.34, 0.14), (0.0, 1.1, 3.56, 0.24, 0.14)])},
            {'name': 'MainWell', 'type': 'loft', 'mirror': True, 'join': 'cut', 'segments': 8,
             'stations': loft_rows(main_well, 4.05)},
            {'name': 'NoseWell', 'type': 'loft', 'join': 'cut', 'segments': 8, 'stations': loft_rows(nose_well)},
            # Cockpit behind the (see-through) glazing: one open space with two empty seats (user).
            # Cockpit panels (user): instrument panel with screens, glare shield, centre pedestal,
            # side consoles and an overhead panel, all trimmed to the inside of the skin.
            {'name': 'InstrumentPanel', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
             'segments': 6, 'stations': loft_rows([(1.7, 0.9, -0.86, -0.08, 6), (1.88, 0.9, -0.86, -0.08, 6)])},
            {'name': 'GlareShield', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
             'segments': 6, 'stations': loft_rows([(1.66, 0.9, -0.09, -0.03, 6), (1.98, 0.9, -0.09, -0.03, 6)])},
            {'name': 'ScreenInner', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
             'segments': 6, 'stations': loft_rows([(1.88, 0.1, -0.38, -0.15, 8), (1.9, 0.1, -0.38, -0.15, 8)], 0.3)},
            {'name': 'ScreenOuter', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2f5263', 'segments': 6,
             'stations': loft_rows([(1.88, 0.1, -0.38, -0.15, 8), (1.9, 0.1, -0.38, -0.15, 8)], 0.56)},
            {'name': 'ScreenCentre', 'type': 'loft', 'join': 'separate', 'material': '#3d5f4a', 'segments': 6,
             'stations': loft_rows([(1.88, 0.08, -0.45, -0.2, 8), (1.9, 0.08, -0.45, -0.2, 8)])},
            {'name': 'Pedestal', 'type': 'loft', 'join': 'separate', 'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(1.88, 0.12, -0.86, -0.2, 6), (2.65, 0.12, -0.86, -0.24, 6)])},
            {'name': 'SideConsole', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(1.95, 0.16, -0.86, -0.2, 6), (3.15, 0.16, -0.86, -0.2, 6)], 0.85)},
            {'name': 'Overhead', 'type': 'loft', 'join': 'separate', 'material': '#2e3236',
             'segments': 6, 'stations': loft_rows([(2.35, 0.26, 0.34, 0.42, 6), (2.95, 0.26, 0.34, 0.42, 6)])},
            {'name': 'CockpitFloor', 'type': 'loft', 'join': 'separate', 'fill_hull': 'floor', 'material': '#2a2d31',
             'segments': 6, 'stations': loft_rows([(1.2, 2.0, -0.84, -0.8, 8), (3.26, 2.0, -0.84, -0.8, 8)])},
            {'name': 'Seat', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#3a3e44', 'segments': 6,
             'stations': loft_rows([(2.55, 0.22, -0.86, -0.5, 6), (2.95, 0.22, -0.86, -0.5, 6)], 0.45)},
            {'name': 'SeatBack', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#3a3e44', 'segments': 6,
             'stations': loft_rows([(2.95, 0.22, -0.86, 0.1, 6), (3.12, 0.22, -0.86, 0.1, 6)], 0.45)},
            # Black bulkhead behind the seats: closes the open cabin off from the empty fuselage (user).
            {'name': 'Bulkhead', 'type': 'loft', 'join': 'separate', 'fill_hull': 'section', 'material': '#121314',
             'segments': 6, 'stations': loft_rows([(3.22, 2.5, -2.0, 2.0, 8), (3.28, 2.5, -2.0, 2.0, 8)])},
            # Recess under the tail cone that takes the stowed arrestor hook (E-2 Hawkeye style).
            {'name': 'HookWell', 'type': 'loft', 'join': 'cut', 'segments': 6,
             'stations': loft_rows([(15.8, 0.26, -1.74, -1.46, 4), (16.6, 0.24, -1.62, -1.33, 4),
                                    (17.4, 0.15, -1.5, -1.2, 4), (18.5, 0.12, -1.32, -1.02, 4)])},
            {'name': 'DomeHub', 'type': 'loft', 'join': 'slide', 'slide_m': [0.0, -1.5, 0.0], 'segments': 8,
             'stations': loft_rows(dome_hub)},
            {'name': 'AntennaFront', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 3,
             'stations': panel_rows([(0.0, -1.8, 3.52, 0.3, 0.14), (0.0, -2.14, 3.62, 0.2, 0.14)])},
            {'name': 'AntennaRear', 'type': 'panel', 'normal': [1, 0, 0], 'chord_points': 3,
             'stations': panel_rows([(0.0, -1.85, 12.4, 0.3, 0.14), (0.0, -2.15, 12.5, 0.2, 0.14)])},
            # Contra-rotating propfan, the same on both engines: the front row (8 blades) turns left
            # (anticlockwise seen from behind, hand -1), the rear row (6 blades, slightly smaller) right.
            # Blade shape and colours from the owner's photo. They spin in the sim ('spin').
            *propfan_rows('PropFront', 5.4, 2.25, 8, -1),
            *propfan_rows('PropRear', 6.05, 2.18, 6, 1, phase=30.0),
        ],
        'regions': windows_and_doors(),
        # Arrestor hook like the E-2 Hawkeye's: a forked, striped arm hinged under the tail cone that
        # lies in the HookWell recess and swings down 25 deg, its shoe 0.27 m above the deck.
        # The sim rests aircraft with the origin 2 m above the ground: stand the wheels there.
        'ground_y': -2.0,
        # User: about half the polygons of the first detailed build (~11,600 triangles), with a round
        # fuselage: a 20-sided fuselage loft, then the joined hull collapsed to half its faces.
        'decimate': 0.5,
        # The cockpit seen through the glazing: hull faces inside it that face into the airframe go.
        'open_cabin': {'lo': P(-1.4, -0.84, 3.24), 'hi': P(1.4, 1.4, 1.0)},
        # Origin (the sim's centre of gravity) about the wing's quarter chord, ahead of the main wheels
        # (d 10.85); the drawing's frame had it at d Z0, behind them, so the aircraft rocked on its mains.
        'z0_m': Z0, 'origin_d': 10.0,
        'tailhook': {'hinge': P(0.0, -1.55, 16.0), 'stowed_tip': P(0.0, -1.18, 18.3), 'tip': P(0.0, -2.55, 18.104)},
        'surfaces': [
            # Trailing edge as on the drawing's top view: aileron x 9.5..12.2 (front at d 11.3), double flaps
            # x 4.85..6.9 and 6.9..9.5 (front at d 11.5), and the inner flap between fuselage and nacelle.
            {'type': 'aileron', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': top_m([(9.5, 11.27), (12.2, 11.3), (12.2, wing_te(12.2) + 0.4), (9.5, wing_te(9.5) + 0.4)])},
            {'type': 'flap', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': top_m([(6.9, 11.49), (9.45, 11.49), (9.45, wing_te(9.45) + 0.4), (6.9, wing_te(6.9) + 0.4)])},
            # Starts just outboard of the wing-fold line, so it folds with the outer wing.
            {'type': 'flap', 'role': 'flapMid', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': top_m([(5.3, 11.49), (6.85, 11.49), (6.85, wing_te(6.85) + 0.4), (5.3, wing_te(5.3) + 0.4)])},
            {'type': 'flap', 'role': 'flapInner', 'view': 'top', 'mirror': True,
             'polygon_m': top_m([(1.45, wing_te(1.45) - 0.95), (3.25, wing_te(3.25) - 0.9),
                                 (3.25, wing_te(3.25) + 0.4), (1.45, wing_te(1.45) + 0.4)])},
            # Leading-edge slats (drawing: x 5..9.35 and 9.45..12.2, 0.6 m deep tapering to 0.25 m outboard;
            # an inner one between fuselage and nacelle). They droop with the flaps.
            {'type': 'slat', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': slat_m(9.45, 12.2, 0.4, 0.25)},
            {'type': 'slat', 'role': 'slatMid', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': slat_m(6.0, 9.35, 0.55, 0.4)},
            {'type': 'slat', 'role': 'slatInner', 'view': 'top', 'mirror': True, 'polygon_m': slat_m(1.5, 3.2, 0.6, 0.6)},
            # Parking: the outer wings fold up and over the fuselage about a skewed hinge just outboard of
            # the nacelles (drawing: hinge x 5.94 at the LE to 5.18 at the TE; user: rear end against the nacelle and exhaust, front end 0.3 m further inboard (~16 deg);
            # folded, the panels cross above the fuselage). Cut after the surfaces that ride on it.
            {'type': 'wingFold', 'role': 'wingFold', 'control': 'fold', 'view': 'top', 'mirror': True,
             # Hinged on the upper skin; the left panel folds a little further than the right so the
             # two lie one above the other where they cross.
             'sign': 1.0, 'range_deg_sides': [179.0, 167.0], 'hinge_skin': 1.0,
             # The axis turns 5 deg further than the cut (user: fold more forward).
             'axis_yaw_deg': 5.0,
             'polygon_m': top_m([(5.95, 8.2), (4.60, 13.0), (13.6, 13.0), (13.6, 8.2)])},
            # Kept clear of the inward-leaning fins: stops short of them and only cuts the tailplane's height.
            {'type': 'elevator', 'view': 'top', 'mirror': True, 'depth_m': [0.3, 1.3],
             'polygon_m': top_m([(0.6, 19.1), (5.2, 19.1), (5.2, 20.1), (0.6, 20.1)])},
            # Upper and lower rudder as drawn: hinged at d 19.31, full height of the fin, split at y 1.09
            # where the tailplane's trailing edge passes through (y 0.92..1.1).
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [5.0, 6.0],
             'polygons_m': [side_m([(19.31 + FIN_AFT, 3.2), (19.31 + FIN_AFT, 1.1), (20.5 + FIN_AFT, 1.1),
                                    (20.5 + FIN_AFT, 3.2)]),
                            side_m([(19.31 + FIN_AFT, 0.92), (19.31 + FIN_AFT, -1.1), (20.5 + FIN_AFT, -1.1),
                                    (20.5 + FIN_AFT, 0.92)])]},
        ],
        'gear': {'wheel_sides': 10, 'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, -2.85, 1.17), 'retract': 'aft', 'retract_deg': 90, 'strut_top_y_m': -1.53, 'wheel_radius_m': 0.29, 'twin': True},
            {'name': 'Main', 'pos_m': P(4.05, -2.85, 10.85), 'mirror': True, 'retract': 'aft', 'retract_deg': 120, 'strut_top_y_m': -0.85, 'wheel_radius_m': 0.46, 'twin': True},
        ],
            # Thin bay doors (drawing: nose doors d 0.9..2.4 splayed in the front view; main doors d 9.7..11.45
            # under each nacelle). Cut from each well's own skin, so they close flush with the gear up.
            'doors': [
                {'name': 'Nose', 'well': 'NoseWell', 'open_deg': 100},
                {'name': 'Main', 'well': 'MainWell', 'mirror': True, 'open_deg': 95},
            ]},
        'cockpit_m': P(0.0, 0.1, 2.4),
        # The game's pilot figure in both seats (eye points: back against the seat back at d 2.95,
        # thighs on the cushion at y -0.2).
        'pilot_seats_m': [P(0.45, 0.22, 2.70), P(-0.45, 0.22, 2.70)],  # seats and pilots 30 cm lower than original (user)
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
