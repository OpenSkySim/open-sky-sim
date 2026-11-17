"""Write spec.json for the MiG-29KUB (9.47) as shaped parts (about 5,000-6,000 triangles).

No three-view of the KUB is in the owner's Drive, so the contours follow published
dimensions (length 17.3 m with the pitot probe, span 11.99 m, folded span 7.8 m,
height 4.73 m, track 3.09 m, wheelbase 3.645 m) and the photos in the Drive folder
"MiG-29 / MiG-29KUB (9.47)" (side view on the runway, head-on approach with the
hook down, the deck shot of 941, two overhead factory shots for the planform and
the wing-fold line). Measurements are given as d (metres aft of the radome tip)
and y (metres above the fuselage datum); x is +left.

    python make_spec.py
"""
import json
import math
import os

LENGTH, SPAN = 17.3, 11.99
Z0 = 9.0                      # body z = 0 this far aft of the radome tip (moved to origin_d by the builder)
GROUND = -2.3                 # ground under the wheels (gear down) in the drawing frame
DARK = 'VEHICLE_PLANE_ENGINE'
DOOR = '#7b828a'


def P(x, y, d):
    return [round(x, 3), round(y, 3), round(Z0 - d, 3)]


def loft_rows(rows, cx=0.0):
    """(d, half_width, y_bottom, y_top, n[, n_top]) -> loft stations about a mid line."""
    out = []
    for r in rows:
        d, a, yb, yt, n = r[:5]
        cy = 0.5 * (yb + yt)
        row = [round(Z0 - d, 3), cx, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n]
        if len(r) > 5:
            row.append(r[5])
        out.append(row)
    return out


def loft_rows_cx(rows):
    """(d, cx, half_width, y_bottom, y_top, n): a loft whose centre line moves sideways."""
    out = []
    for d, cx, a, yb, yt, n in rows:
        cy = 0.5 * (yb + yt)
        out.append([round(Z0 - d, 3), cx, round(cy, 3), a, round(yt - cy, 3), round(cy - yb, 3), n])
    return out


def panel_rows(rows):
    return [P(x, y, d) + [c, tc] for x, y, d, c, tc in rows]


def top_m(pts):
    return [[round(x, 3), round(Z0 - d, 3)] for x, d in pts]


def side_m(pts):
    return [[round(Z0 - d, 3), round(y, 3)] for d, y in pts]


# Wing (outboard of the LERX): leading edge 42 deg, root x 1.9 at d 8.45, tip x 5.95 at d 12.1.
WING_ROOT_X, WING_TIP_X = 1.9, 5.95


def wing_le(x):
    return 8.45 + (12.1 - 8.45) * (x - WING_ROOT_X) / (WING_TIP_X - WING_ROOT_X)


def wing_te(x):
    return 12.65 + (13.33 - 12.65) * (x - WING_ROOT_X) / (WING_TIP_X - WING_ROOT_X)


FOLD_X = 3.8                  # fold line (photos: just outboard of the outer pylon; folded span 7.8 m)


def te_cut(x0, x1, depth, behind=0.4):
    """Top-view cut along the trailing edge; the hinge (front edge) comes first."""
    return top_m([(x0, wing_te(x0) - depth), (x1, wing_te(x1) - depth),
                  (x1, wing_te(x1) + behind), (x0, wing_te(x0) + behind)])


def le_cut(x0, x1, depth, ahead=0.4):
    """Top-view cut along the leading edge; the hinge (aft edge) comes first."""
    return top_m([(x0, wing_le(x0) + depth), (x1, wing_le(x1) + depth),
                  (x1, wing_le(x1) - ahead), (x0, wing_le(x0) - ahead)])


def canopy_glass():
    """Windscreen and the two canopy panes (front and rear cockpit), split by their frames.

    Side view: the sill runs at y 0.5 (windscreen) to 0.56 (rear), the frames are 8 cm bars at
    the windscreen arch (d 3.78) and between the cockpits (d 5.05); the glass ends at d 6.75 where
    the hump behind the rear cockpit begins (photos 191773, kub_01).
    """
    hi = 1.6
    return [
        {'name': 'Windscreen', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(2.85, 0.47), (3.78, 0.5), (3.78, hi), (2.85, hi)])},
        {'name': 'CanopyFront', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(3.86, 0.52), (5.05, 0.54), (5.05, hi), (3.86, hi)])},
        {'name': 'CanopyRear', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(5.13, 0.55), (6.75, 0.57), (6.75, hi), (5.13, hi)])},
        # Dark grey radome (photos) and the dark anti-glare panel ahead of the windscreen.
        {'name': 'Radome', 'view': 'side', 'material': '#4b5056',
         'polygon_m': side_m([(-0.1, -1.0), (-0.1, 1.0), (2.15, 1.0), (2.15, -1.0)])},
        {'name': 'AntiGlare', 'view': 'top', 'material': '#1d2024', 'depth_m': [0.3, 1.2],
         'polygon_m': top_m([(0.0, 2.15), (0.32, 2.3), (0.38, 2.87), (-0.38, 2.87), (-0.32, 2.3)])},
    ]


def main():
    # Forward fuselage and the spine between the engines: (d, half width, bottom, top, n, n_top).
    fuselage = [
        (0.0, 0.03, -0.14, -0.08, 2.0, 2.0),
        (0.3, 0.17, -0.3, 0.06, 2.0, 2.0),
        (0.8, 0.3, -0.44, 0.19, 2.0, 2.0),
        (1.5, 0.42, -0.57, 0.3, 2.0, 2.0),
        (2.2, 0.5, -0.66, 0.39, 2.1, 2.0),
        (2.9, 0.56, -0.73, 0.48, 2.3, 2.1),
        (3.6, 0.6, -0.84, 0.55, 2.5, 2.2),
        (4.6, 0.62, -0.92, 0.58, 2.6, 2.3),
        (5.6, 0.63, -0.96, 0.6, 2.8, 2.4),
        (6.6, 0.62, -0.97, 0.6, 3.0, 2.5),
        (7.8, 0.6, -0.95, 0.58, 3.2, 2.6),
        (9.2, 0.58, -0.86, 0.54, 3.2, 2.6),
        (11.0, 0.56, -0.76, 0.48, 3.0, 2.6),
        (13.0, 0.52, -0.68, 0.42, 2.8, 2.5),
        (15.0, 0.42, -0.6, 0.3, 2.6, 2.4),
        (16.1, 0.28, -0.46, 0.14, 2.4, 2.2),
        (16.7, 0.12, -0.3, 0.0, 2.2, 2.0),
        (16.85, 0.0, -0.15, -0.15, 2.0, 2.0),
    ]
    # Tandem canopy and the long hump behind it (KUB): its lower half sinks into the fuselage.
    canopy = [
        (2.85, 0.03, 0.2, 0.5, 2.0), (3.2, 0.3, 0.1, 0.72, 2.0), (3.78, 0.45, 0.05, 1.0, 2.0),
        (4.5, 0.48, 0.05, 1.09, 2.0), (5.3, 0.49, 0.05, 1.16, 2.0), (6.1, 0.48, 0.05, 1.14, 2.0),
        (6.9, 0.44, 0.05, 1.02, 2.0), (8.0, 0.37, 0.05, 0.84, 2.2), (9.6, 0.3, 0.05, 0.7, 2.4),
        (11.2, 0.2, 0.1, 0.57, 2.4), (12.2, 0.0, 0.45, 0.45, 2.0),
    ]
    # Intake and engine nacelle, one per side (photos: square mouths under the LERX, round aft).
    nacelle = [
        (5.55, 1.1, 0.45, -1.12, -0.16, 5.0), (6.4, 1.1, 0.48, -1.13, -0.14, 4.6),
        (7.8, 1.1, 0.53, -1.1, -0.11, 4.0), (9.2, 1.1, 0.56, -1.05, -0.1, 3.4),
        (10.6, 1.06, 0.56, -0.98, -0.08, 2.8), (12.4, 1.0, 0.53, -0.92, 0.0, 2.3),
        (14.4, 0.96, 0.49, -0.84, 0.08, 2.05), (16.15, 0.95, 0.47, -0.79, 0.14, 2.0),
    ]
    # Bulge under the wing root outboard of each nacelle that takes the folded main wheel.
    gear_bulge = [(7.7, 0.04, -0.4, -0.1, 2.5), (8.3, 0.27, -1.08, -0.06, 3.0), (9.9, 0.27, -1.08, -0.06, 3.0),
                  (10.9, 0.1, -0.7, -0.06, 2.5)]
    intake_mouth = [(5.4, 1.1, 0.38, -1.05, -0.23, 5.0), (5.8, 1.1, 0.38, -1.05, -0.23, 5.0),
                    (6.5, 1.1, 0.28, -0.98, -0.32, 3.0), (6.9, 1.1, 0.05, -0.7, -0.6, 2.0)]
    nozzle = [(16.05, 0.47, -0.79, 0.15, 2.0), (16.6, 0.45, -0.77, 0.13, 2.0), (17.0, 0.42, -0.74, 0.1, 2.0)]
    nozzle_mouth = [(16.96, 0.37, -0.69, 0.05, 2.0), (17.02, 0.37, -0.69, 0.05, 2.0)]
    # Tail booms outboard of the engines carrying fin and stabilator.
    boom = [(11.4, 0.03, -0.12, 0.0, 2.0), (12.3, 0.16, -0.3, 0.25, 2.5), (15.5, 0.17, -0.3, 0.28, 2.5),
            (16.3, 0.06, -0.12, 0.14, 2.0)]
    # LERX: sharp strake from beside the windscreen to the wing root (about 74 deg).
    lerx = [(0.5, -0.05, 3.3, 5.2, 0.03), (1.3, -0.06, 5.7, 3.0, 0.035), (2.12, -0.07, 8.15, 1.0, 0.04)]
    wing = [(0.7, -0.05, 7.9, 4.85, 0.05), (WING_ROOT_X, -0.06, wing_le(WING_ROOT_X), wing_te(WING_ROOT_X) - wing_le(WING_ROOT_X), 0.055),
            (WING_TIP_X, -0.3, wing_le(WING_TIP_X), wing_te(WING_TIP_X) - wing_le(WING_TIP_X), 0.045)]
    wing_tip = [(WING_TIP_X - 0.02, -0.3, wing_le(WING_TIP_X) - 0.02, 1.25, 0.06),
                (WING_TIP_X + 0.05, -0.3, wing_le(WING_TIP_X) + 0.05, 1.1, 0.06)]
    # Fins canted 6 deg outward, LE swept 47 deg.
    cant = math.radians(6.0)
    fin = [(1.5, 0.2, 12.2, 3.6, 0.045), (1.5 + 2.25 * math.tan(cant), 2.45, 14.65, 1.15, 0.04)]
    stab = [(1.7, -0.03, 13.75, 2.65, 0.045), (3.89, -0.16, 16.0, 0.72, 0.04)]
    pitot = [(-0.55, 0.0, -0.13, -0.09, 2.0), (-0.5, 0.018, -0.13, -0.09, 2.0), (0.15, 0.03, -0.14, -0.08, 2.0)]

    # Gear (all wheels touch y = GROUND): nose twin wheels at d 6.4 retract aft into the fuselage,
    # main wheels at d 10.05 (wheelbase 3.645), x 1.545 (track 3.09) retract forward into the
    # nacelle/wing-root bulge. Wells: 5 cm ahead of the strut, 10 cm beside, 20 cm behind the wheels.
    nose_d, nose_top, nose_r = 6.4, -0.5, 0.3
    main_d, main_x, main_top, main_r = 10.05, 1.545, -0.62, 0.42
    nose_stow = nose_d + (nose_top - GROUND - nose_r)          # wheel centre, folded aft 90 deg
    main_stow = main_d - (main_top - GROUND - main_r)          # wheel centre, folded forward 90 deg
    nose_well = [(nose_d - 0.08, 0.3, -1.3, -0.12, 5), (nose_stow, 0.3, -1.3, -0.12, 5),
                 (nose_stow + nose_r + 0.2, 0.3, -1.3, -0.12, 5)]
    main_well = [(main_stow - main_r - 0.2, 0.22, -1.4, -0.14, 5), (main_stow, 0.22, -1.4, -0.14, 5),
                 (main_d + 0.08, 0.22, -1.4, -0.14, 5)]
    # Hook bay under the tail cone between the nozzles.
    hook_hinge, hook_len = (13.6, -0.62), 2.0
    hook_well = [(13.45, 0.13, -0.9, -0.5, 4), (15.9, 0.11, -0.9, -0.52, 4)]

    spec = {
        'id': 'lp_mig29kub',
        'name': 'MiG-29KUB (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 0,
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 20, 'resample': 26, 'stations': loft_rows(fuselage)},
            {'name': 'Canopy', 'type': 'loft', 'segments': 16, 'resample': 14, 'stations': loft_rows(canopy)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 12, 'resample': 12,
             'stations': loft_rows_cx(nacelle)},
            {'name': 'GearBulge', 'type': 'loft', 'mirror': True, 'segments': 10, 'resample': 6,
             'stations': loft_rows(gear_bulge, 1.55)},
            {'name': 'Boom', 'type': 'loft', 'mirror': True, 'segments': 8, 'stations': loft_rows(boom, 1.62)},
            {'name': 'Lerx', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'stations': panel_rows(lerx)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 7, 'stations': panel_rows(wing)},
            {'name': 'WingTip', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'stations': panel_rows(wing_tip)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'chord_points': 6,
             'normal': [math.cos(cant), -math.sin(cant), 0.0], 'stations': panel_rows(fin)},
            {'name': 'Stabilator', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(stab),
             'surface': {'type': 'stabilator', 'view': 'top', 'hinge_m': top_m([(1.75, 15.0), (3.6, 15.4)])}},
            {'name': 'IntakeMouth', 'type': 'loft', 'join': 'cut', 'mirror': True, 'material': DARK, 'segments': 8,
             'stations': loft_rows_cx(intake_mouth)},
            {'name': 'Nozzle', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#5d6268',
             'segments': 12, 'stations': loft_rows(nozzle, 0.95)},
            {'name': 'NozzleMouth', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#141516',
             'segments': 12, 'stations': loft_rows(nozzle_mouth, 0.95)},
            {'name': 'Pitot', 'type': 'loft', 'join': 'separate', 'segments': 6, 'stations': loft_rows(pitot)},
            {'name': 'NoseWell', 'type': 'loft', 'join': 'cut', 'segments': 8, 'stations': loft_rows(nose_well)},
            {'name': 'MainWell', 'type': 'loft', 'mirror': True, 'join': 'cut', 'segments': 8,
             'stations': loft_rows(main_well, main_x)},
            {'name': 'HookWell', 'type': 'loft', 'join': 'cut', 'segments': 6, 'stations': loft_rows(hook_well)},
            # Tandem cockpit seen through the glass: dark floor, an instrument panel with screens and a
            # glare shield in each cockpit (the rear one raised behind the front seat), side consoles
            # and a black bulkhead behind the rear seat. The game draws pilots and ejection seats.
            {'name': 'CockpitFloor', 'type': 'loft', 'join': 'separate', 'fill_hull': 'floor', 'material': '#2a2d31',
             'segments': 6, 'stations': loft_rows([(3.0, 1.2, -0.42, -0.38, 8), (6.9, 1.2, -0.42, -0.38, 8)])},
            {'name': 'PanelFront', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
             'segments': 6, 'stations': loft_rows([(3.45, 0.7, -0.4, 0.46, 6), (3.62, 0.7, -0.4, 0.46, 6)])},
            {'name': 'GlareFront', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
             'segments': 6, 'stations': loft_rows([(3.4, 0.7, 0.45, 0.52, 6), (3.75, 0.7, 0.45, 0.52, 6)])},
            {'name': 'PanelRear', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
             'segments': 6, 'stations': loft_rows([(4.95, 0.7, -0.4, 0.58, 6), (5.1, 0.7, -0.4, 0.58, 6)])},
            {'name': 'GlareRear', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
             'segments': 6, 'stations': loft_rows([(4.92, 0.42, 0.57, 0.64, 6), (5.2, 0.42, 0.57, 0.64, 6)])},
            {'name': 'ScreenFront', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
             'segments': 6, 'stations': loft_rows([(3.62, 0.1, 0.1, 0.32, 8), (3.64, 0.1, 0.1, 0.32, 8)], 0.15)},
            {'name': 'ScreenRear', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
             'segments': 6, 'stations': loft_rows([(5.1, 0.1, 0.22, 0.44, 8), (5.12, 0.1, 0.22, 0.44, 8)], 0.15)},
            {'name': 'ConsoleFront', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(3.62, 0.1, -0.4, 0.12, 6), (4.7, 0.1, -0.4, 0.12, 6)], 0.45)},
            {'name': 'ConsoleRear', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(5.1, 0.1, -0.4, 0.2, 6), (6.3, 0.1, -0.4, 0.2, 6)], 0.45)},
            {'name': 'Bulkhead', 'type': 'loft', 'join': 'separate', 'fill_hull': 'section', 'material': '#121314',
             'segments': 6, 'stations': loft_rows([(6.85, 1.5, -1.0, 1.6, 8), (6.9, 1.5, -1.0, 1.6, 8)])},
        ],
        'regions': canopy_glass(),
        'ground_y': -2.0,
        'open_cabin': {'lo': P(-0.62, -0.4, 6.86), 'hi': P(0.62, 1.4, 2.9)},
        'z0_m': Z0, 'origin_d': 9.4,
        'tailhook': {'hinge': P(0.0, hook_hinge[1], hook_hinge[0]),
                     'stowed_tip': P(0.0, hook_hinge[1] + 0.04, hook_hinge[0] + hook_len),
                     'tip': P(0.0, hook_hinge[1] - hook_len * math.sin(math.radians(42)),
                              hook_hinge[0] + hook_len * math.cos(math.radians(42)))},
        'surfaces': [
            # Leading-edge flaps (full span of the outer wing) and the outer one on the folding panel.
            {'type': 'slat', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': le_cut(FOLD_X + 0.08, WING_TIP_X - 0.15, 0.55, 0.4)},
            {'type': 'slat', 'role': 'slatInner', 'view': 'top', 'mirror': True,
             'polygon_m': le_cut(WING_ROOT_X + 0.15, FOLD_X - 0.03, 0.6, 0.4)},
            # Ailerons on the folding panel, flaps inboard (MiG-29K: wider-span flaps).
            {'type': 'aileron', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': te_cut(FOLD_X + 0.08, WING_TIP_X - 0.25, 0.7)},
            {'type': 'flap', 'view': 'top', 'mirror': True, 'polygon_m': te_cut(WING_ROOT_X + 0.05, FOLD_X - 0.03, 0.95)},
            # Outer wings fold up about a streamwise hinge on the upper skin (photos: folded span 7.8 m).
            {'type': 'wingFold', 'role': 'wingFold', 'control': 'fold', 'view': 'top', 'mirror': True,
             'sign': 1.0, 'range_deg': 100.0, 'hinge_skin': 1.0,
             'polygon_m': top_m([(FOLD_X, 9.3), (FOLD_X, 14.0), (8.0, 14.0), (8.0, 9.3)])},
            # Rudders: hinge 0.6 m ahead of the fin trailing edge, between the boom and the fin tip.
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.35, 1.95],
             'polygon_m': side_m([(15.25, 2.2), (15.2, 0.45), (16.3, 0.45), (16.3, 2.2)])},
            # Large dorsal airbrake on the spine behind the canopy hump (MiG-29K), hinged at its front.
            {'type': 'airbrake', 'view': 'top', 'mirror': False, 'depth_m': [0.3, 1.5],
             'polygon_m': top_m([(0.3, 11.3), (-0.3, 11.3), (-0.34, 12.6), (0.34, 12.6)])},
        ],
        'gear': {'wheel_sides': 12, 'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, GROUND, nose_d), 'retract': 'aft', 'retract_deg': 90,
             'strut_top_y_m': nose_top, 'wheel_radius_m': nose_r, 'twin': True},
            {'name': 'Main', 'pos_m': P(main_x, GROUND, main_d), 'mirror': True, 'retract': 'forward',
             'retract_deg': 90, 'strut_top_y_m': main_top, 'wheel_radius_m': main_r, 'wheel_width_m': 0.26},
        ],
            'doors': [
                {'name': 'Nose', 'well': 'NoseWell', 'open_deg': 95},
                {'name': 'Main', 'well': 'MainWell', 'mirror': True, 'open_deg': 95},
            ]},
        'cockpit_m': P(0.0, 0.84, 4.3),
        # Eye points of the two crew seats (front instructor/student, rear raised 0.1 m).
        'pilot_seats_m': [P(0.0, 0.84, 4.3), P(0.0, 0.94, 5.75)],
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
