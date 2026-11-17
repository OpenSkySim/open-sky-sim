"""Write spec.json for the MiG-29KUB (9.47) as shaped parts (about 5,000-6,000 triangles).

Contours are measured off the owner's MiG-29KUB three-view (top, side and front views at
40 px/m; the drawing itself stays out of the repo). Ground is y -2.0 in the drawing frame,
d is metres aft of the radome tip and y metres above the fuselage datum; x is +left.
Published dimensions (span 11.99 m, track 3.09 m) and the Drive photos fill in the rest.

    python make_spec.py
"""
import json
import math
import os

LENGTH, SPAN = 17.3, 11.99
Z0 = 9.0                      # body z = 0 this far aft of the radome tip (moved to origin_d by the builder)
GROUND = -2.0                 # ground under the wheels (gear down) in the drawing frame
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


# Wing outboard of the LERX (top view): LE from the root junction x 1.75, d 7.58 to the tip
# x 6.0, d 11.58; straight unswept trailing edge at d 12.65.
WING_ROOT_X, WING_TIP_X = 1.75, 6.0


def wing_le(x):
    return 7.58 + (11.58 - 7.58) * (x - WING_ROOT_X) / (WING_TIP_X - WING_ROOT_X)


def wing_te(x):
    return 12.65


FOLD_X = 3.6                  # streamwise fold line (top view)


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

    Side view: windscreen d 2.93-3.6, frame bar, front pane to d 5.3, frame bar, rear pane to
    d 6.35 where the hump begins; the sill rises from y 0.66 to 0.95.
    """
    hi = 1.8
    return [
        {'name': 'Windscreen', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(2.93, 0.66), (3.6, 0.84), (3.6, hi), (2.93, hi)])},
        {'name': 'CanopyFront', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(3.68, 0.86), (5.3, 0.9), (5.3, hi), (3.68, hi)])},
        {'name': 'CanopyRear', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(5.38, 0.91), (6.35, 0.95), (6.35, hi), (5.38, hi)])},
        # Dark grey radome and the dark anti-glare panel ahead of the windscreen.
        {'name': 'Radome', 'view': 'side', 'material': '#4b5056',
         'polygon_m': side_m([(-0.1, -1.0), (-0.1, 1.0), (1.7, 1.0), (1.7, -1.0)])},
        # Dark dielectric fin-tip caps (pictures).
        {'name': 'FinCapLeft', 'view': 'side', 'material': '#2b2f33', 'depth_m': [1.7, 2.4],
         'polygon_m': side_m([(13.9, 2.3), (15.3, 2.3), (15.3, 2.9), (13.9, 2.9)])},
        {'name': 'FinCapRight', 'view': 'side', 'material': '#2b2f33', 'depth_m': [-2.4, -1.7],
         'polygon_m': side_m([(13.9, 2.3), (15.3, 2.3), (15.3, 2.9), (13.9, 2.9)])},
        {'name': 'AntiGlare', 'view': 'top', 'material': '#1d2024', 'depth_m': [0.3, 1.2],
         'polygon_m': top_m([(0.0, 1.7), (0.3, 2.0), (0.36, 2.93), (-0.36, 2.93), (-0.3, 2.0)])},
    ]


def main():
    # Fuselage centre body (d, half width, bottom, top, n, n_top): nose, cockpit, spine between
    # the engines and the tail cone with the hook stub.
    fuselage = [
        (0.0, 0.02, -0.40, -0.35, 2.0, 2.0),
        # Lower line measured off the drawing's side view (overlay at 40 px/m).
        (0.15, 0.065, -0.43, -0.27, 2.0, 2.0),
        (0.43, 0.13, -0.47, -0.125, 2.0, 2.0),
        (0.75, 0.2, -0.515, 0.02, 2.0, 2.0),
        (1.05, 0.26, -0.55, 0.15, 2.0, 2.0),
        (1.4, 0.35, -0.565, 0.26, 2.0, 2.0),
        (1.73, 0.43, -0.57, 0.35, 2.0, 2.0),
        (2.05, 0.47, -0.57, 0.43, 2.05, 2.0),
        (2.4, 0.5, -0.555, 0.5, 2.1, 2.0),
        (2.93, 0.54, -0.525, 0.6, 2.3, 2.1),
        (3.6, 0.58, -0.49, 0.68, 2.5, 2.2),
        (4.6, 0.6, -0.46, 0.72, 2.2, 2.3),
        (5.6, 0.6, -0.6, 0.74, 2.1, 2.4),
        (6.4, 0.58, -0.8, 0.76, 2.1, 2.5),
        (7.2, 0.55, -0.88, 0.72, 2.1, 2.6),
        (8.5, 0.5, -0.86, 0.55, 2.2, 2.6),
        # Aft of the nose-gear bay the underside rises into the tunnel between the engines
        # (9-12 sections 16-24).
        (9.5, 0.47, -0.55, 0.52, 2.4, 2.6),
        (10.2, 0.45, -0.47, 0.5, 2.6, 2.6),
        (11.7, 0.4, -0.42, 0.38, 2.6, 2.5),
        (12.9, 0.36, -0.4, 0.18, 2.6, 2.4),
        (13.9, 0.32, -0.4, 0.1, 2.4, 2.2),
        # Blunt brake-chute housing between the nozzles (Drive photo rXtwVyWPOdQ).
        (14.8, 0.27, -0.36, 0.06, 2.4, 2.2),
        (15.1, 0.24, -0.33, 0.03, 2.4, 2.2),
        (15.25, 0.12, -0.25, -0.05, 2.2, 2.0),
    ]
    # Tandem canopy (full bubble, owner's MiG-35 pictures) and the broad flat-topped spine hump
    # behind it running back between the fins; top follows the side-view upper line.
    canopy = [
        (2.93, 0.05, 0.5, 0.66, 2.0), (3.1, 0.2, 0.47, 0.8, 2.0), (3.3, 0.3, 0.45, 0.92, 2.1), (3.6, 0.4, 0.45, 1.1, 2.0),
        (4.18, 0.48, 0.45, 1.3, 2.3), (4.8, 0.5, 0.45, 1.43, 2.4), (5.43, 0.5, 0.45, 1.45, 2.4),
        (6.05, 0.49, 0.45, 1.4, 2.4), (6.35, 0.47, 0.45, 1.33, 2.4), (6.93, 0.46, 0.45, 1.25, 2.5),
        (7.93, 0.45, 0.4, 1.08, 2.7), (9.18, 0.43, 0.35, 0.85, 2.9), (10.18, 0.41, 0.3, 0.68, 2.9),
        (11.68, 0.3, 0.25, 0.42, 2.6), (12.6, 0.0, 0.2, 0.2, 2.0),
    ]
    # Intake and engine nacelle, one per side: square raked mouth tucked under the LERX (top lip at d 4.6,
    # lower lip sloping back to d 7.7), round towards the nozzle.
    nacelle = [
        (4.6, 0.9, 0.34, -0.46, -0.03, 6.0), (5.4, 0.93, 0.44, -0.62, 0.0, 5.5),
        (6.5, 0.92, 0.5, -0.9, 0.0, 4.2), (7.7, 0.85, 0.56, -1.12, 0.02, 3.6),
        (8.6, 0.85, 0.56, -1.12, 0.04, 3.3), (9.4, 0.85, 0.56, -1.1, 0.05, 3.0),
        (10.4, 0.85, 0.56, -1.02, 0.08, 2.6), (11.7, 0.85, 0.55, -0.96, 0.1, 2.3),
        (12.9, 0.85, 0.52, -0.91, 0.12, 2.1), (13.6, 0.85, 0.51, -0.87, 0.12, 2.0),
        (14.2, 0.85, 0.5, -0.82, 0.12, 2.0),
    ]
    # Bulge under the wing root outboard of each nacelle that takes the folded main wheel.
    gear_bulge = [(7.8, 0.03, -0.3, -0.05, 2.5), (8.05, 0.2, -0.85, 0.03, 2.8), (8.4, 0.27, -1.02, 0.05, 3.0),
                  (9.8, 0.27, -1.02, 0.05, 3.0), (10.35, 0.2, -0.88, 0.03, 2.8), (10.8, 0.06, -0.6, 0.0, 2.5)]
    # Duct behind a thin (3-4 cm) lip, running deep into the nacelle before it closes.
    intake_mouth = [(4.55, 0.9, 0.305, -0.425, -0.065, 5.0), (5.0, 0.915, 0.35, -0.5, -0.06, 4.8),
                    (5.6, 0.93, 0.39, -0.66, -0.07, 4.2), (6.4, 0.92, 0.38, -0.78, -0.12, 3.5),
                    (7.1, 0.9, 0.25, -0.72, -0.28, 2.6), (7.4, 0.88, 0.05, -0.55, -0.45, 2.0)]
    # Raked mouth (pictures): the lower lip and the side walls reach 0.45 m further forward at the
    # bottom than under the LERX.
    ilip = [(0.58, -0.445, 4.15, 0.5, 0.08), (1.22, -0.445, 4.15, 0.5, 0.08)]
    iwall_in = [(0.565, -0.44, 4.15, 0.5, 0.06), (0.565, -0.05, 4.57, 0.08, 0.3)]
    iwall_out = [(1.235, -0.44, 4.15, 0.5, 0.06), (1.235, -0.05, 4.57, 0.08, 0.3)]
    # Nozzles (pictures): short grey shroud, then long convergent dark petals.
    nozzle = [(14.15, 0.5, -0.85, 0.15, 2.0), (14.45, 0.49, -0.84, 0.14, 2.0)]
    petals = [(14.43, 0.47, -0.82, 0.12, 2.0), (14.75, 0.445, -0.795, 0.095, 2.0), (15.05, 0.4, -0.75, 0.05, 2.0)]
    # Black exit disc over the petal ends, leaving a 4 cm dark petal rim around it.
    nozzle_mouth = [(15.05, 0.36, -0.71, 0.01, 2.0), (15.07, 0.36, -0.71, 0.01, 2.0)]
    # Flat tail booms outboard of the engines (body edge x 1.56-1.88) carrying fin and stabilator.
    # Booms end in pointed tail stingers beside the nozzles (pictures).
    boom = [(7.6, 0.03, -0.1, 0.05, 2.0), (8.0, 0.12, -0.18, 0.11, 2.3), (8.4, 0.16, -0.22, 0.14, 2.5),
            (12.0, 0.17, -0.23, 0.15, 2.5), (14.7, 0.16, -0.22, 0.14, 2.5),
            (15.3, 0.07, -0.12, 0.06, 2.0), (15.65, 0.01, -0.04, -0.02, 2.0)]
    # LERX: sharp strake from beside the windscreen (x 0.5, d 2.63) to the wing root (x 1.75, d 7.58).
    lerx = [(0.45, 0.0, 2.6, 6.0, 0.025), (0.8, 0.01, 3.98, 4.65, 0.027), (1.1, 0.02, 5.0, 3.4, 0.03),
            (1.45, 0.035, 6.38, 2.2, 0.035), (1.8, 0.05, 7.75, 1.0, 0.04)]
    wing = [(0.8, 0.05, 7.4, 5.25, 0.05),
            (WING_ROOT_X, 0.05, wing_le(WING_ROOT_X), wing_te(WING_ROOT_X) - wing_le(WING_ROOT_X), 0.05),
            (FOLD_X, 0.05 - 0.25 * (FOLD_X - WING_ROOT_X) / (WING_TIP_X - WING_ROOT_X), wing_le(FOLD_X),
             wing_te(FOLD_X) - wing_le(FOLD_X), 0.048),
            (WING_TIP_X, -0.2, wing_le(WING_TIP_X), wing_te(WING_TIP_X) - wing_le(WING_TIP_X), 0.045)]
    wing_tip = [(WING_TIP_X - 0.02, -0.2, wing_le(WING_TIP_X) - 0.02, 1.12, 0.06),
                (WING_TIP_X + 0.05, -0.2, wing_le(WING_TIP_X) + 0.06, 0.98, 0.06)]
    # Fins canted 6 deg outward: root LE d 12.13 chord 2.92, tip LE d 14.3 at y 2.38, cap at 2.62.
    cant = math.radians(6.0)
    fin = [(1.8, 0.05, 12.13, 2.92, 0.045), (1.8 + 2.33 * math.tan(cant), 2.38, 14.3, 0.75, 0.04),
           (1.8 + 2.57 * math.tan(cant), 2.62, 14.42, 0.55, 0.035)]
    # Stabilators with the MiG-29K/M dogtooth: the outer leading edge steps 0.13 m forward at x 2.9.
    stab = [(1.85, -0.03, 13.08, 2.8, 0.045), (2.9, -0.077, 14.27, 1.88, 0.045),
            (2.92, -0.078, 14.14, 2.01, 0.045), (3.88, -0.12, 15.24, 1.16, 0.04)]
    # Pitot: long thin probe on a thicker tapered base (pictures).
    pitot = [(-1.08, 0.0, -0.39, -0.37, 2.0), (-1.0, 0.012, -0.392, -0.368, 2.0), (-0.42, 0.016, -0.396, -0.364, 2.0),
             (-0.36, 0.032, -0.412, -0.348, 2.0), (0.1, 0.05, -0.43, -0.33, 2.0)]
    # IRST ball ahead of the windscreen, right of the centre line (top-down picture).
    irst = [(2.5, 0.02, 0.5, 0.52, 2.0), (2.58, 0.1, 0.44, 0.66, 2.0), (2.76, 0.1, 0.44, 0.66, 2.0),
            (2.85, 0.02, 0.52, 0.6, 2.0)]
    # Fairing of the retractable refuelling probe along the left side of the nose (side pictures).
    ifr = [(1.85, 0.015, 0.33, 0.37, 2.0), (1.95, 0.06, 0.29, 0.41, 2.0), (2.1, 0.08, 0.27, 0.43, 2.0),
           (3.4, 0.08, 0.3, 0.46, 2.0), (3.7, 0.05, 0.35, 0.45, 2.0)]
    # Wingtip pods (navigation lights / RWR) and the RWR pods near each fin tip (pictures).
    tip_pod = [(10.95, 0.01, -0.205, -0.195, 2.0), (11.15, 0.05, -0.25, -0.15, 2.0), (11.45, 0.07, -0.27, -0.13, 2.0),
               (12.6, 0.07, -0.27, -0.13, 2.0), (12.85, 0.05, -0.25, -0.15, 2.0), (13.0, 0.015, -0.21, -0.19, 2.0)]
    fin_pod = [(13.7, 0.01, 2.19, 2.21, 2.0), (13.85, 0.04, 2.16, 2.24, 2.0), (14.0, 0.05, 2.15, 2.25, 2.0),
               (14.6, 0.05, 2.15, 2.25, 2.0), (14.75, 0.01, 2.19, 2.21, 2.0)]
    fin_pod_rear = [(14.9, 0.01, 1.99, 2.01, 2.0), (15.0, 0.045, 1.955, 2.045, 2.0), (15.35, 0.04, 1.96, 2.04, 2.0),
                    (15.5, 0.01, 1.99, 2.01, 2.0)]
    # Two pylons under each inner wing (outer ones would sit on the folding panel).
    def wing_y(x):
        return 0.05 - 0.25 * (x - WING_ROOT_X) / (WING_TIP_X - WING_ROOT_X)
    pylons = []
    for px, pd in ((2.35, 9.0), (3.15, 9.6)):
        pylons.append([(px, wing_y(px) + 0.02, pd, 1.7, 0.045), (px, wing_y(px) - 0.3, pd + 0.1, 1.55, 0.05),
                       (px, wing_y(px) - 0.42, pd + 0.2, 1.35, 0.055)])

    # Gear (all wheels touch y = GROUND): twin nose wheels at d 6.48 retract aft into the
    # fuselage, main wheels at d 9.95, x 1.6 (drawn track) retract forward into the wing-root
    # bulge. Wells: ahead of the strut, beside and 20 cm behind the stowed wheels.
    nose_d, nose_top, nose_r = 6.48, -0.55, 0.3
    main_d, main_x, main_top, main_r = 9.95, 1.6, -0.5, 0.4
    nose_stow = nose_d + (nose_top - GROUND - nose_r)          # wheel centre, folded aft 90 deg
    main_stow = main_d - (main_top - GROUND - main_r)          # wheel centre, folded forward 90 deg
    nose_well = [(nose_d - 0.08, 0.3, -1.3, -0.2, 5), (nose_stow, 0.3, -1.3, -0.2, 5),
                 (nose_stow + nose_r + 0.2, 0.3, -1.3, -0.2, 5)]
    main_well = [(main_stow - main_r - 0.2, 0.2, -1.1, -0.05, 5), (main_stow, 0.2, -1.1, -0.05, 5),
                 (main_d + 0.08, 0.2, -1.1, -0.05, 5)]
    # Hook bay under the tail cone between the nozzles.
    hook_hinge, hook_len = (13.2, -0.45), 1.9
    hook_well = [(13.1, 0.12, -0.8, -0.25, 4), (15.2, 0.1, -0.7, -0.22, 4)]

    spec = {
        'id': 'lp_mig29kub',
        'name': 'MiG-29KUB (Lowpoly)',
        'length_m': LENGTH,
        'span_m': SPAN,
        'material': 'VEHICLE_PLANE_GREY',
        'smooth_deg': 0,
        'parts': [
            {'name': 'Fuselage', 'type': 'loft', 'segments': 20, 'resample': 34, 'stations': loft_rows(fuselage)},
            {'name': 'Canopy', 'type': 'loft', 'segments': 20, 'resample': 18, 'stations': loft_rows(canopy)},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 16, 'resample': 14,
             'stations': loft_rows_cx(nacelle)},
            {'name': 'GearBulge', 'type': 'loft', 'mirror': True, 'segments': 12, 'resample': 8,
             'stations': loft_rows(gear_bulge, 1.6)},
            {'name': 'Boom', 'type': 'loft', 'mirror': True, 'segments': 10, 'stations': loft_rows(boom, 1.72)},
            {'name': 'Lerx', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(lerx)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(wing)},
            {'name': 'WingTip', 'type': 'panel', 'mirror': True, 'chord_points': 5, 'stations': panel_rows(wing_tip)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'chord_points': 6,
             'normal': [math.cos(cant), -math.sin(cant), 0.0], 'stations': panel_rows(fin)},
            {'name': 'Stabilator', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(stab),
             'surface': {'type': 'stabilator', 'view': 'top', 'hinge_m': top_m([(1.75, 14.4), (3.6, 14.4)])}},
            {'name': 'IntakeMouth', 'type': 'loft', 'join': 'cut', 'mirror': True, 'material': DARK, 'segments': 12,
             'stations': loft_rows_cx(intake_mouth)},
            {'name': 'Nozzle', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#6a6f74',
             'segments': 18, 'stations': loft_rows(nozzle, 0.85)},
            {'name': 'NozzleMouth', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#050505',
             'segments': 18, 'stations': loft_rows(nozzle_mouth, 0.85)},
            {'name': 'Pitot', 'type': 'loft', 'join': 'separate', 'segments': 8, 'stations': loft_rows(pitot)},
            {'name': 'IntakeLip', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 4,
             'stations': panel_rows(ilip)},
            {'name': 'IntakeWallInner', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 4,
             'normal': [1.0, 0.0, 0.0], 'stations': panel_rows(iwall_in)},
            {'name': 'IntakeWallOuter', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 4,
             'normal': [1.0, 0.0, 0.0], 'stations': panel_rows(iwall_out)},
            {'name': 'NozzlePetals', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#26282b',
             'segments': 18, 'stations': loft_rows(petals, 0.85)},
            {'name': 'Irst', 'type': 'loft', 'join': 'separate', 'material': '#1e2a33', 'segments': 8,
             'stations': loft_rows(irst, -0.22)},
            {'name': 'ProbeFairing', 'type': 'loft', 'segments': 10, 'stations': loft_rows(ifr, 0.42)},
            {'name': 'TipPod', 'type': 'loft', 'mirror': True, 'segments': 8, 'stations': loft_rows(tip_pod, WING_TIP_X)},
            {'name': 'FinPod', 'type': 'loft', 'mirror': True, 'segments': 6,
             'stations': loft_rows(fin_pod, 1.8 + 2.2 * math.tan(cant) + 0.04)},
            {'name': 'FinPodRear', 'type': 'loft', 'mirror': True, 'segments': 6,
             'stations': loft_rows(fin_pod_rear, 1.8 + 2.0 * math.tan(cant) + 0.035)},
            {'name': 'PylonInner', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 5, 'normal': [1.0, 0.0, 0.0],
             'stations': panel_rows(pylons[0])},
            {'name': 'PylonOuter', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 5, 'normal': [1.0, 0.0, 0.0],
             'stations': panel_rows(pylons[1])},
            {'name': 'NoseWell', 'type': 'loft', 'join': 'cut', 'segments': 8, 'stations': loft_rows(nose_well)},
            {'name': 'MainWell', 'type': 'loft', 'mirror': True, 'join': 'cut', 'segments': 8,
             'stations': loft_rows(main_well, main_x)},
            {'name': 'HookWell', 'type': 'loft', 'join': 'cut', 'segments': 6, 'stations': loft_rows(hook_well)},
            # Tandem cockpit seen through the glass: dark floor, an instrument panel with screens and a
            # glare shield in each cockpit (the rear one raised behind the front seat), side consoles
            # and a black bulkhead behind the rear seat. The game draws pilots and ejection seats.
            {'name': 'CockpitFloor', 'type': 'loft', 'join': 'separate', 'fill_hull': 'floor', 'material': '#2a2d31',
             'segments': 6, 'stations': loft_rows([(3.0, 1.2, -0.12, -0.08, 8), (6.45, 1.2, -0.12, -0.08, 8)])},
            {'name': 'PanelFront', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
             'segments': 6, 'stations': loft_rows([(3.75, 0.7, -0.1, 0.75, 6), (3.9, 0.7, -0.1, 0.75, 6)])},
            {'name': 'GlareFront', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
             'segments': 6, 'stations': loft_rows([(3.6, 0.7, 0.72, 0.8, 6), (3.95, 0.7, 0.72, 0.8, 6)])},
            {'name': 'PanelRear', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#1d2024',
             'segments': 6, 'stations': loft_rows([(5.2, 0.7, -0.1, 0.95, 6), (5.32, 0.7, -0.1, 0.95, 6)])},
            {'name': 'GlareRear', 'type': 'loft', 'join': 'separate', 'clip_hull': True, 'material': '#16181b',
             'segments': 6, 'stations': loft_rows([(5.15, 0.42, 0.93, 1.0, 6), (5.42, 0.42, 0.93, 1.0, 6)])},
            {'name': 'ScreenFront', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
             'segments': 6, 'stations': loft_rows([(3.9, 0.1, 0.3, 0.55, 8), (3.92, 0.1, 0.3, 0.55, 8)], 0.15)},
            {'name': 'ScreenRear', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#2f5263',
             'segments': 6, 'stations': loft_rows([(5.32, 0.1, 0.5, 0.75, 8), (5.34, 0.1, 0.5, 0.75, 8)], 0.15)},
            {'name': 'ConsoleFront', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(3.9, 0.1, -0.1, 0.42, 6), (5.1, 0.1, -0.1, 0.42, 6)], 0.45)},
            {'name': 'ConsoleRear', 'type': 'loft', 'join': 'separate', 'mirror': True, 'clip_hull': True,
             'material': '#2e3236', 'segments': 6,
             'stations': loft_rows([(5.32, 0.1, -0.1, 0.55, 6), (6.4, 0.1, -0.1, 0.55, 6)], 0.45)},
            {'name': 'Bulkhead', 'type': 'loft', 'join': 'separate', 'fill_hull': 'section', 'material': '#121314',
             'segments': 6, 'stations': loft_rows([(6.45, 1.5, -1.0, 1.7, 8), (6.5, 1.5, -1.0, 1.7, 8)])},
        ],
        'regions': canopy_glass(),
        'ground_y': -2.0,
        'open_cabin': {'lo': P(-0.62, -0.1, 6.45), 'hi': P(0.62, 1.7, 2.9)},
        'z0_m': Z0, 'origin_d': 9.3,
        'tailhook': {'hinge': P(0.0, hook_hinge[1], hook_hinge[0]),
                     'stowed_tip': P(0.0, hook_hinge[1] + 0.04, hook_hinge[0] + hook_len),
                     'tip': P(0.0, hook_hinge[1] - hook_len * math.sin(math.radians(50)),
                              hook_hinge[0] + hook_len * math.cos(math.radians(50)))},
        'surfaces': [
            # Leading-edge flaps (full span of the outer wing) and the outer one on the folding panel.
            {'type': 'slat', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': le_cut(FOLD_X + 0.08, WING_TIP_X - 0.15, 0.45, 0.4)},
            {'type': 'slat', 'role': 'slatInner', 'view': 'top', 'mirror': True,
             'polygon_m': le_cut(WING_ROOT_X + 0.15, FOLD_X - 0.03, 0.45, 0.4)},
            # Ailerons on the folding panel, flaps inboard (MiG-29K: wider-span flaps).
            {'type': 'aileron', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': te_cut(FOLD_X + 0.08, 5.4, 0.6)},
            {'type': 'flap', 'view': 'top', 'mirror': True, 'polygon_m': te_cut(WING_ROOT_X + 0.1, FOLD_X - 0.05, 0.9)},
            # Outer wings fold up about a streamwise hinge on the upper skin (top view: x 3.6).
            {'type': 'wingFold', 'role': 'wingFold', 'control': 'fold', 'view': 'top', 'mirror': True,
             'sign': 1.0, 'range_deg': 100.0, 'hinge_skin': 1.0,
             'polygon_m': top_m([(FOLD_X, 9.0), (FOLD_X, 13.5), (8.0, 13.5), (8.0, 9.0)])},
            # Rudders: hinge at d 14.3, y 0.2-1.73 (side view).
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.65, 2.35],
             'polygon_m': side_m([(14.3, 1.73), (14.3, 0.2), (15.3, 0.2), (15.3, 1.73)])},
            # Large dorsal airbrake on the spine behind the canopy hump (MiG-29K), hinged at its front.
            {'type': 'airbrake', 'view': 'top', 'mirror': False, 'depth_m': [0.0, 1.2],
             'polygon_m': top_m([(0.28, 11.9), (-0.28, 11.9), (-0.3, 13.2), (0.3, 13.2)])},
        ],
        'gear': {'wheel_sides': 16, 'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, GROUND, nose_d), 'retract': 'aft', 'retract_deg': 90,
             'strut_top_y_m': nose_top, 'wheel_radius_m': nose_r, 'twin': True},
            {'name': 'Main', 'pos_m': P(main_x, GROUND, main_d), 'mirror': True, 'retract': 'forward',
             'retract_deg': 90, 'strut_top_y_m': main_top, 'wheel_radius_m': main_r, 'wheel_width_m': 0.26,
             # Large door on the front of each main leg (Drive photos 28644252602, mig-29kub_01).
             'leg_door': {'offset_m': 0.48, 'width_m': 0.4, 'length_m': 1.2}},
        ],
            'doors': [
                {'name': 'Nose', 'well': 'NoseWell', 'open_deg': 88, 'thickness_m': 0.035},
                {'name': 'Main', 'well': 'MainWell', 'mirror': True, 'open_deg': 90, 'thickness_m': 0.035},
            ]},
        'cockpit_m': P(0.0, 1.2, 4.4),
        # Eye points of the two crew seats (front instructor/student, rear behind the frame at d 5.3).
        'pilot_seats_m': [P(0.0, 1.2, 4.4), P(0.0, 1.2, 5.95)],
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
