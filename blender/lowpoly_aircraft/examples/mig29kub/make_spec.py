"""Write spec.json for the MiG-29KUB (9.47) as shaped parts (about 5,000-6,000 triangles).

Base drawing: the MiG-29M2 sheet (side, top, front and sections A-G); earlier contours came off the owner's MiG-29KUB three-view (top, side and front views at
40 px/m; the drawing itself stays out of the repo). Ground is y -2.0 in the drawing frame,
d is metres aft of the radome tip and y metres above the fuselage datum; x is +left.
Intakes and nacelles follow the MiG-29M2 sheet (side, front and sections D-G). Published
dimensions (span 11.99 m, track 3.09 m) and the Drive photos fill in the rest.

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


# Wing outboard of the LERX, from the owner's pasted MiG-29 top view (Hangar image
# pasted-2026-11-17-19-59-21, 46.8 px/m, and the areas marked on it): LE from the root junction
# x 1.75, d 7.58, sweeping back (0.94 m per m) to x 5.28, then a rounded tip out to x 5.63.
# Trailing edge: flaps end at d 12.25-12.31 inboard of the fold line (x 3.36); the aileron's
# trailing edge starts 0.19 m further forward and sweeps back to d 12.45 at x 5.0.
WING_ROOT_X, WING_TIP_X = 1.75, 5.63
FOLD_X = 3.36                 # streamwise fold line (top view)


def wing_le(x):
    return 7.58 + 4.0 * (x - WING_ROOT_X) / 4.25


def wing_te(x):
    if x <= FOLD_X:
        return 12.25 + 0.06 * (x - 1.55) / (FOLD_X - 1.55)
    return 12.12 + 0.33 * (x - 3.39) / (5.01 - 3.39)


def wing_y(x):
    # Anhedral: the upper skin drops 0.25 m per 4.25 m of span.
    return 0.05 - 0.25 * (x - WING_ROOT_X) / 4.25


def flap_hinge(x):
    return 11.0 + 0.54 * (x - 1.55) / 1.75


def aileron_hinge(x):
    return 11.45 + 0.58 * (x - 3.36) / 1.66


def slat_hinge(x):
    return 7.95 + 3.25 * (x - 1.55) / 3.64


def te_cut(x0, x1, hinge, behind=0.4):
    """Top-view cut along the trailing edge; the hinge (front edge) comes first."""
    return top_m([(x0, hinge(x0)), (x1, hinge(x1)), (x1, wing_te(x1) + behind), (x0, wing_te(x0) + behind)])


def le_cut(x0, x1, ahead=0.4):
    """Top-view cut along the leading edge; the hinge (aft edge) comes first."""
    return top_m([(x0, slat_hinge(x0)), (x1, slat_hinge(x1)),
                  (x1, wing_le(x1) - ahead), (x0, wing_le(x0) - ahead)])


def canopy_glass():
    """Windscreen and the two canopy panes (front and rear cockpit), split by their frames.

    Windscreen d 2.9-3.88 (M2 sheet), frame bar, front pane to d 4.97, frame bow, rear pane to
    d 6.05 where the canopy meets its rear fairing (owner's KUB photo, 2026-11-18).
    """
    hi = 1.8
    return [
        # Three panes (a flat centre one and two side ones) inside 4 cm frame bars, as in the
        # M2 top view and the KUB photo.
        {'name': 'Windscreen', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(2.92, 0.64), (3.88, 0.84), (3.88, hi), (2.92, hi)]),
         'clip': {'view': 'top', 'polygons_m': [
             top_m([(-0.15, 2.97), (0.15, 2.97), (0.15, 3.88), (-0.15, 3.88)]),
             top_m([(0.19, 2.99), (0.7, 3.05), (0.7, 3.88), (0.19, 3.88)]),
             top_m([(-0.19, 2.99), (-0.19, 3.88), (-0.7, 3.88), (-0.7, 3.05)])]}},
        # One canopy with a single frame bow between the cockpits (owner's photo, 2026-11-18).
        {'name': 'CanopyFront', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(3.98, 0.86), (4.97, 0.87), (4.99, hi), (3.98, hi)])},
        {'name': 'CanopyRear', 'view': 'side', 'see_through': True,
         'polygon_m': side_m([(5.05, 0.87), (6.05, 0.88), (6.05, hi), (5.07, hi)])},
        # Dark grey radome and the dark anti-glare panel ahead of the windscreen.
        {'name': 'Radome', 'view': 'side', 'material': '#4b5056',
         'polygon_m': side_m([(-0.1, -1.0), (-0.1, 1.0), (1.7, 1.0), (1.7, -1.0)])},
        # Dark dielectric fin-tip caps (pictures).
        {'name': 'FinCapLeft', 'view': 'side', 'material': '#2b2f33', 'depth_m': [1.7, 2.4],
         'polygon_m': side_m([(13.9, 2.3), (15.3, 2.52), (15.3, 3.1), (13.9, 3.1)])},
        {'name': 'FinCapRight', 'view': 'side', 'material': '#2b2f33', 'depth_m': [-2.4, -1.7],
         'polygon_m': side_m([(13.9, 2.3), (15.3, 2.52), (15.3, 3.1), (13.9, 3.1)])},
        {'name': 'AntiGlare', 'view': 'top', 'material': '#1d2024', 'depth_m': [0.3, 1.2],
         'polygon_m': top_m([(0.0, 1.7), (0.3, 2.0), (0.34, 2.86), (-0.34, 2.86), (-0.3, 2.0)])},
    ]


def main():
    # Fuselage centre body (d, half width, bottom, top, n, n_top): nose, cockpit, spine between
    # the engines and the tail cone with the hook stub.
    fuselage = [
        (0.0, 0.02, -0.40, -0.35, 2.0, 2.0),
        # Lower line measured off the drawing's side view (overlay at 40 px/m).
        (0.15, 0.065, -0.43, -0.27, 2.0, 2.0),
        (0.43, 0.13, -0.47, -0.125, 2.0, 2.0),
        (0.75, 0.2, -0.53, 0.02, 2.0, 2.0),
        (1.05, 0.26, -0.575, 0.15, 2.0, 2.0),
        (1.4, 0.35, -0.59, 0.26, 2.0, 2.0),
        (1.73, 0.43, -0.595, 0.35, 2.0, 2.0),
        (2.05, 0.47, -0.59, 0.43, 2.05, 2.0),
        (2.4, 0.5, -0.57, 0.5, 2.1, 2.0),
        (2.93, 0.54, -0.525, 0.6, 2.3, 2.1),
        (3.6, 0.58, -0.49, 0.68, 2.5, 2.2),
        (4.6, 0.6, -0.46, 0.72, 2.2, 2.3),
        (5.6, 0.6, -0.55, 0.74, 2.1, 2.4),
        (6.4, 0.58, -0.68, 0.76, 2.1, 2.5),
        (7.2, 0.55, -0.68, 0.72, 2.1, 2.6),
        (8.5, 0.5, -0.64, 0.55, 2.2, 2.6),
        # Aft of the nose-gear bay the underside rises into the tunnel between the engines
        # (9-12 sections 16-24).
        (9.5, 0.47, -0.55, 0.52, 2.4, 2.6),
        (10.2, 0.45, -0.47, 0.5, 2.6, 2.6),
        (11.7, 0.4, -0.42, 0.34, 2.6, 2.5),
        (12.9, 0.36, -0.4, 0.12, 2.6, 2.4),
        (13.9, 0.35, -0.4, 0.04, 2.4, 2.2),
        # Brake-chute housing between the nozzles: as wide as the gap between them and rounded to
        # a point at d 15.46 in plan (M2 top view, tail-cone area marked on it); flat, not a cone:
        # the top slopes smoothly down onto the underside and ends in a thin edge, 0.4 m above the
        # underside of the fuselage (owner, 2026-11-18).
        # Lowered 0.15 m with the spine end (owner, 2026-11-18).
        (14.3, 0.37, -0.3, 0.05, 2.5, 2.2),
        (14.6, 0.38, -0.15, 0.02, 2.6, 2.0),
        (14.9, 0.33, -0.12, -0.01, 2.6, 2.0),
        (15.18, 0.24, -0.11, -0.03, 2.4, 2.0),
        (15.38, 0.13, -0.1, -0.05, 2.2, 2.0),
        (15.46, 0.03, -0.09, -0.06, 2.0, 2.0),
    ]
    # Tandem canopy (full bubble, owner's MiG-35 pictures) and the broad flat-topped spine hump
    # behind it running back between the fins; top follows the side-view upper line.
    def spine_top(d):
        return 0.96 + (0.04 - 0.96) * (d - 7.93) / (14.6 - 7.93)

    def spine_hw(d):
        return 0.45 + (0.34 - 0.45) * (d - 7.93) / (14.6 - 7.93)

    canopy = [
        # Windscreen (M2 top and side views, KUB photo 191773): blunt, with a wide rounded front arch
        # (half width 0.3 m at its foot) and a flat centre pane between two side panes back to the
        # frame at d 3.9; not a pointed bubble.
        (2.9, 0.26, 0.5, 0.64, 2.6), (3.05, 0.34, 0.47, 0.84, 2.7), (3.3, 0.4, 0.45, 1.08, 2.6),
        (3.6, 0.45, 0.45, 1.27, 2.5), (3.9, 0.47, 0.45, 1.4, 2.4),
        # Owner's side photo of an Indian Navy KUB (2026-11-18, levelled by the ~4 deg the jet sat
        # nose-up): one tall, full canopy peaking at y 1.52 over the front seat, its top falling in a
        # smooth curve to the glass's rear end at d 6.05; behind it a short fairing onto the spine.
        (4.18, 0.48, 0.45, 1.47, 2.3), (4.6, 0.5, 0.45, 1.52, 2.3), (5.0, 0.5, 0.45, 1.51, 2.3),
        (5.43, 0.49, 0.45, 1.45, 2.4), (5.75, 0.48, 0.45, 1.36, 2.4), (6.05, 0.47, 0.45, 1.22, 2.5),
        (6.4, 0.46, 0.45, 1.06, 2.6), (6.93, 0.46, 0.45, 0.99, 2.6),
        (7.93, 0.45, 0.4, 0.96, 2.7),
        # From the canopy hump to the tail the spine is one straight line, in height and in width
        # (owner, 2026-11-18), sinking onto the flat tail between the nozzles with no pointed end;
        # its end sits 0.15 m lower than first built, below the nacelle tops (owner, 2026-11-18).
    ] + [(d, round(spine_hw(d), 3), round(min(yb, spine_top(d) - 0.12), 3), round(spine_top(d), 3), 2.7)
         for d, yb in ((9.18, 0.35), (10.18, 0.3), (11.68, 0.22), (12.6, 0.12), (13.3, 0.05), (13.9, 0.0),
                       (14.3, 0.03), (14.6, 0.06))] + [
        (14.9, 0.27, -0.09, -0.01, 2.6),
    ]
    # Intake and engine nacelle, one per side, from the MiG-29M2 sheet (side, front and sections D-G,
    # 41.5 px/m): a box 0.84 m wide (x 0.37-1.21) hanging under the LERX with a flat shelf between the
    # two (section D), becoming U-shaped over the gear bay (E) and round over the engine (F, G). The
    # mouth (x 0.43-1.14, y -0.3 to -1.1) is raked from the top lip at d 5.65 back to d 7.02.
    nacelle = [
        (5.6, 0.79, 0.42, -1.17, -0.03, 5.0), (7.05, 0.78, 0.41, -1.19, -0.02, 5.0),
        (8.4, 0.79, 0.42, -1.19, 0.01, 4.0), (9.5, 0.8, 0.44, -1.13, 0.02, 3.0),
        (10.4, 0.81, 0.45, -1.07, 0.04, 2.6), (11.2, 0.82, 0.47, -1.03, 0.06, 2.3),
        (12.4, 0.84, 0.49, -0.97, 0.08, 2.1), (13.2, 0.85, 0.5, -0.91, 0.09, 2.0),
        (13.6, 0.85, 0.51, -0.87, 0.09, 2.0), (14.2, 0.85, 0.5, -0.82, 0.09, 2.0),
    ]
    # Everything ahead of the raked lip line comes off the nacelle front.
    def lip_y(d):
        return -0.28 - (d - 5.65) * 0.8 / 1.37
    intake_rake = [(d, 0.79, 0.47, -1.4, lip_y(d), 8.0) for d in (5.4, 6.0, 6.6, 7.2, 7.5)]
    # Duct inside a 5-7 cm lip, running back into the nacelle.
    intake_mouth = [(5.4, 0.785, 0.355, -1.1, -0.3, 5.0), (7.3, 0.785, 0.355, -1.1, -0.3, 5.0),
                    (8.2, 0.79, 0.32, -1.03, -0.35, 4.0), (8.9, 0.79, 0.12, -0.8, -0.55, 2.5)]
    # Flat fairing under the wing root outboard of each nacelle: the main wheel turns flat as the leg
    # folds forward, so it only needs a shallow bay (wheel y -0.42 to -0.18).
    gear_bulge = [(7.7, 0.1, -0.12, -0.02, 2.5), (8.1, 0.45, -0.46, 0.0, 3.0), (8.5, 0.5, -0.5, 0.0, 3.5),
                  (9.75, 0.5, -0.5, 0.0, 3.5), (10.35, 0.4, -0.46, 0.0, 3.0), (10.85, 0.12, -0.2, -0.02, 2.5)]
    # Nozzles (pictures): short grey shroud, then long convergent dark petals.
    nozzle = [(14.15, 0.5, -0.85, 0.15, 2.0), (14.45, 0.49, -0.84, 0.14, 2.0)]
    petals = [(14.43, 0.47, -0.82, 0.12, 2.0), (14.75, 0.445, -0.795, 0.095, 2.0), (15.05, 0.4, -0.75, 0.05, 2.0)]
    # Black exit disc over the petal ends, leaving a 4 cm dark petal rim around it.
    nozzle_mouth = [(15.05, 0.36, -0.71, 0.01, 2.0), (15.07, 0.36, -0.71, 0.01, 2.0)]
    # Flat tail booms outboard of the engines (body edge x 1.56-1.88) carrying fin and stabilator.
    # Booms end in pointed tail stingers beside the nozzles (pictures).
    # The M2 top view fills the gap to the nacelles: the booms widen inboard to x 1.39 aft of d 8.4.
    boom = [(7.6, 1.72, 0.03, -0.1, 0.05, 2.0), (8.0, 1.7, 0.12, -0.18, 0.11, 2.3), (8.4, 1.66, 0.22, -0.22, 0.14, 2.5),
            (12.0, 1.64, 0.25, -0.23, 0.15, 2.5), (14.55, 1.65, 0.24, -0.22, 0.14, 2.5),
            (14.95, 1.71, 0.07, -0.12, 0.06, 2.0), (15.1, 1.72, 0.01, -0.04, -0.02, 2.0)]
    # LERX shoulders (front view and sections C-E): the upper skin rises from the sharp LERX edge
    # to the fuselage side (meeting it at y 0.4 in the front view), about 17 deg at D, almost flat by E.
    # A diamond loft under the LERX edge; its lower half is hidden in the fuselage and nacelles.
    # Kept separate: the exact union drops its right half.
    # (d, half width, edge y, rise to the centre line, drop to the centre line)
    # Flatter (owner, 2026-11-18, wireframe picture): the LERX top falls only about 20-25 deg from the
    # fuselage side to the sharp edge instead of 40-55 deg.
    shoulder = [(3.0, 0.5, 0.0, 0.3, 0.4), (4.0, 0.77, 0.0, 0.45, 0.45), (5.1, 1.08, 0.01, 0.4, 0.5),
                (6.2, 1.34, 0.02, 0.36, 0.45), (7.05, 1.62, 0.04, 0.34, 0.3), (8.0, 1.72, 0.05, 0.3, 0.25),
                (9.5, 1.72, 0.05, 0.25, 0.2), (11.0, 1.66, 0.05, 0.15, 0.15), (12.4, 1.55, 0.05, 0.08, 0.1),
                # Aft of the wing the deck carries on to the nozzles (owner's wireframe, 2026-11-18): one
                # flat surface from boom to boom, set low so the round nacelle tops stand clearly out of
                # it, with no grooves beside the spine or the nacelles; it thins out at the nozzle shrouds.
                (13.2, 1.5, -0.04, 0.06, 0.08), (13.9, 1.45, -0.07, 0.05, 0.08), (14.15, 1.42, -0.07, 0.03, 0.05),
                (14.3, 1.4, -0.07, 0.005, 0.01)]
    # LERX: sharp strake from beside the windscreen (x 0.5, d 2.63) to the wing root (x 1.75, d 7.58).
    lerx = [(0.45, 0.0, 2.6, 6.0, 0.025), (0.8, 0.01, 3.98, 4.65, 0.027), (1.1, 0.02, 5.0, 3.4, 0.03),
            (1.45, 0.035, 6.38, 2.2, 0.035), (1.8, 0.05, 7.75, 1.0, 0.04)]
    # Stations: root, the fold line (where the trailing edge steps forward), the aileron's outer end
    # and the rounded tip (pasted top view: LE d 10.89 at x 5.28, widest x 5.63 at d 11.88).
    wing = [(0.8, 0.05, 7.4, 12.25 - 7.4, 0.05)]
    for x in (WING_ROOT_X, FOLD_X - 0.02, FOLD_X + 0.02, 5.0):
        wing.append((x, wing_y(x), wing_le(x), wing_te(x) - wing_le(x), 0.05 - 0.002 * (x - WING_ROOT_X)))
    for x, le, te in ((5.28, 10.89, 12.52), (5.5, 11.18, 12.51), (5.6, 11.41, 12.36), (5.63, 11.72, 12.02)):
        wing.append((x, wing_y(x), le, te - le, 0.042))
    # Fins canted 6 deg outward (M2 sheet): root LE d 12.0 chord 3.08, tip LE d 14.37 at y 2.6,
    # cap at 2.84; a narrow fillet runs forward along the boom from the fin leading edge.
    cant = math.radians(6.0)
    # Redone from the fin area the owner marked on the M2 side view (2026-11-18): straight leading
    # edge from the fillet kink (d 12.25, y 0.69) to d 14.52 at y 2.77, near-vertical trailing edge
    # at d 15.09-15.16, and a tip whose top edge slopes down aft from y 2.84 (d 14.64) to the
    # trailing corner at y 2.61 (d 15.16). The low dorsal fillet runs from d 10.46 up to the kink.
    def fin_x(y):
        return 1.8 + (y - 0.05) * math.tan(cant)
    fin = [(1.8, 0.05, 11.55, 15.09 - 11.55, 0.045), (fin_x(2.61), 2.61, 14.345, 15.16 - 14.345, 0.04),
           (fin_x(2.77), 2.77, 14.52, 14.79 - 14.52, 0.035), (fin_x(2.84), 2.84, 14.62, 0.06, 0.03)]
    fin_fillet = [(1.8, 0.12, 10.45, 1.65, 0.03), (fin_x(0.69), 0.69, 12.2, 0.12, 0.03)]
    # Stabilators with the MiG-29K/M dogtooth: the outer leading edge steps 0.13 m forward at x 2.9.
    # M2 top view (stabilator area marked on it): trailing edge from d 15.7 at the root to the
    # outer corner at x 3.65, d 16.5; the tip is rounded, widest at x 3.93.
    stab = [(1.85, -0.03, 13.08, 15.7 - 13.08, 0.045), (2.9, -0.077, 14.27, 16.17 - 14.27, 0.045),
            (2.92, -0.078, 14.14, 16.18 - 14.14, 0.045), (3.65, -0.11, 15.07, 16.5 - 15.07, 0.04),
            (3.86, -0.12, 15.34, 16.05 - 15.34, 0.04), (3.93, -0.12, 15.6, 0.28, 0.04)]
    # Pitot: long thin probe on a thicker tapered base (pictures).
    pitot = [(-1.08, 0.0, -0.39, -0.37, 2.0), (-1.0, 0.012, -0.392, -0.368, 2.0), (-0.42, 0.016, -0.396, -0.364, 2.0),
             (-0.36, 0.032, -0.412, -0.348, 2.0), (0.1, 0.05, -0.43, -0.33, 2.0)]
    # IRST ball ahead of the windscreen, right of the centre line (top-down picture).
    irst = [(2.5, 0.02, 0.5, 0.52, 2.0), (2.58, 0.1, 0.44, 0.66, 2.0), (2.76, 0.1, 0.44, 0.66, 2.0),
            (2.85, 0.02, 0.52, 0.6, 2.0)]
    # Fairing of the retractable refuelling probe along the left side of the nose (side pictures).
    ifr = [(1.85, 0.015, 0.33, 0.37, 2.0), (1.95, 0.06, 0.29, 0.41, 2.0), (2.1, 0.08, 0.27, 0.43, 2.0),
           (3.4, 0.08, 0.3, 0.46, 2.0), (3.7, 0.05, 0.35, 0.45, 2.0)]
    # RWR pods near each fin tip (pictures). The rounded wing tip carries no pod (pasted top view).
    fin_pod = [(13.7, 0.01, 2.410, 2.430, 2.0), (13.85, 0.04, 2.380, 2.460, 2.0), (14.0, 0.05, 2.370, 2.470, 2.0),
               (14.6, 0.05, 2.370, 2.470, 2.0), (14.75, 0.01, 2.410, 2.430, 2.0)]
    fin_pod_rear = [(14.9, 0.01, 2.210, 2.230, 2.0), (15.0, 0.045, 2.175, 2.265, 2.0), (15.15, 0.04, 2.180, 2.260, 2.0),
                    (15.25, 0.01, 2.210, 2.230, 2.0)]
    # Two pylons under each inner wing (outer ones would sit on the folding panel).
    pylons = []
    for px, pd in ((2.35, 9.0), (3.15, 9.6)):
        pylons.append([(px, wing_y(px) + 0.02, pd, 1.7, 0.045), (px, wing_y(px) - 0.3, pd + 0.1, 1.55, 0.05),
                       (px, wing_y(px) - 0.42, pd + 0.2, 1.35, 0.055)])

    # Gear (all wheels touch y = GROUND): twin nose wheels at d 6.0 retract aft into the
    # fuselage, main wheels at d 10.1, x 1.6 (drawn track) retract forward and turn flat
    # into the shallow wing-root fairing. Wells: around the stowed wheels and the folded struts.
    # Wheelbase 4.1 m: the KUB photo 191773 and the photo points marked in the Hangar put the nose
    # wheel about 0.5 m further forward and the mains 0.15 m further aft than the drawings.
    nose_d, nose_top, nose_r = 6.0, -0.4, 0.3
    main_d, main_x, main_top, main_r = 10.1, 1.6, -0.3, 0.4
    nose_stow = nose_d + (nose_top - GROUND - nose_r)          # wheel centre, folded aft 90 deg
    main_stow = main_d - (main_top - GROUND - main_r)          # wheel centre, folded forward 90 deg
    nose_well = [(nose_d - 0.08, 0.3, -1.3, -0.2, 5), (nose_stow, 0.3, -1.3, -0.2, 5),
                 (nose_stow + nose_r + 0.2, 0.3, -1.3, -0.2, 5)]
    main_well = [(main_stow - main_r - 0.08, 0.44, -0.6, -0.12, 6), (main_d + 0.12, 0.44, -0.6, -0.12, 6)]
    # Hook bay under the tail cone between the nozzles.
    hook_hinge, hook_len = (13.2, -0.45), 1.9
    hook_well = [(13.1, 0.12, -0.8, -0.25, 4), (15.0, 0.1, -0.7, -0.31, 4)]

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
            # The canopy's rounded lower half tucked in under its widest line and left a groove along the
            # fuselage from the windscreen to the spine (owner, 2026-11-18): a box-section sill fills it,
            # so the side runs straight down from the canopy's widest line into the fuselage side.
            {'name': 'CanopySill', 'type': 'loft', 'segments': 16, 'resample': 18,
             'stations': loft_rows([(d, round(a + 0.01, 3), round(yb - 0.05, 3),
                                     round(min(0.5 * (yb + yt) + 0.1, 0.95), 3), 4.0)
                                    for d, a, yb, yt, *_ in canopy if 3.6 <= d <= 11.7])},
            {'name': 'Nacelle', 'type': 'loft', 'mirror': True, 'segments': 16, 'resample': 14,
             'stations': loft_rows_cx(nacelle)},
            {'name': 'GearBulge', 'type': 'loft', 'mirror': True, 'segments': 12, 'resample': 8,
             'stations': loft_rows(gear_bulge, 1.5)},
            {'name': 'Shoulder', 'type': 'loft', 'join': 'separate', 'segments': 16,
             'stations': [[round(Z0 - d, 3), 0.0, yc, hw, up, dn, 1.15] for d, hw, yc, up, dn in shoulder]},
            {'name': 'Boom', 'type': 'loft', 'mirror': True, 'segments': 10, 'stations': loft_rows_cx(boom)},
            {'name': 'Lerx', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(lerx)},
            {'name': 'Wing', 'type': 'panel', 'mirror': True, 'chord_points': 9, 'stations': panel_rows(wing)},
            {'name': 'Fin', 'type': 'panel', 'mirror': True, 'chord_points': 6,
             'normal': [math.cos(cant), -math.sin(cant), 0.0], 'stations': panel_rows(fin)},
            {'name': 'FinFillet', 'type': 'panel', 'join': 'separate', 'mirror': True, 'chord_points': 4,
             'normal': [math.cos(cant), -math.sin(cant), 0.0], 'stations': panel_rows(fin_fillet)},
            {'name': 'Stabilator', 'type': 'panel', 'mirror': True, 'chord_points': 6, 'stations': panel_rows(stab),
             'surface': {'type': 'stabilator', 'view': 'top', 'hinge_m': top_m([(1.75, 14.4), (3.6, 14.4)])}},
            {'name': 'IntakeRake', 'type': 'loft', 'join': 'cut', 'mirror': True, 'material': 'VEHICLE_PLANE_GREY', 'segments': 12,
             'stations': loft_rows_cx([(r[0], r[1], r[2], r[3], r[4], r[5]) for r in intake_rake])},
            {'name': 'IntakeMouth', 'type': 'loft', 'join': 'cut', 'mirror': True, 'material': DARK, 'segments': 12,
             'stations': loft_rows_cx(intake_mouth)},
            {'name': 'Nozzle', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#6a6f74',
             'segments': 18, 'stations': loft_rows(nozzle, 0.85)},
            {'name': 'NozzleMouth', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#050505',
             'segments': 18, 'stations': loft_rows(nozzle_mouth, 0.85)},
            {'name': 'Pitot', 'type': 'loft', 'join': 'separate', 'segments': 8, 'stations': loft_rows(pitot)},
            {'name': 'NozzlePetals', 'type': 'loft', 'join': 'separate', 'mirror': True, 'material': '#26282b',
             'segments': 18, 'stations': loft_rows(petals, 0.85)},
            {'name': 'Irst', 'type': 'loft', 'join': 'separate', 'material': '#1e2a33', 'segments': 8,
             'stations': loft_rows(irst, -0.22)},
            {'name': 'ProbeFairing', 'type': 'loft', 'segments': 10, 'stations': loft_rows(ifr, 0.42)},
            # No pod ahead of the fin leading edge: it read as a spike (owner, 2026-11-18).
            {'name': 'FinPodRear', 'type': 'loft', 'mirror': True, 'segments': 6,
             'stations': loft_rows(fin_pod_rear, 1.8 + 2.22 * math.tan(cant) + 0.035)},
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
             # Only as wide and deep as the cabin: a full hull section reached into the intake ducts
             # as a black wall (owner, 2026-11-18).
             'segments': 6, 'stations': loft_rows([(6.45, 0.52, -0.12, 1.7, 8), (6.5, 0.52, -0.12, 1.7, 8)])},
        ],
        'regions': canopy_glass(),
        'ground_y': -2.0,
        'open_cabin': {'lo': P(-0.62, -0.1, 6.45), 'hi': P(0.62, 1.7, 2.9)},
        'z0_m': Z0, 'origin_d': 9.3,
        'tailhook': {'hinge': P(0.0, hook_hinge[1], hook_hinge[0]),
                     'stowed_tip': P(0.0, hook_hinge[1] + 0.35, hook_hinge[0] + hook_len),
                     'tip': P(0.0, hook_hinge[1] - hook_len * math.sin(math.radians(50)),
                              hook_hinge[0] + hook_len * math.cos(math.radians(50)))},
        'surfaces': [
            # Leading-edge flaps along the whole leading edge (0.56 m chord at the root, 0.38 m
            # outboard), split at the fold line (pasted top view).
            {'type': 'slat', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': le_cut(FOLD_X + 0.06, 5.15)},
            {'type': 'slat', 'role': 'slatInner', 'view': 'top', 'mirror': True,
             'polygon_m': le_cut(WING_ROOT_X + 0.15, FOLD_X - 0.03)},
            # Aileron on the folding panel out to x 5.0 (0.67 m chord inboard, 0.42 m outboard),
            # flap inboard (1.25 m chord at the root, 0.77 m at the fold).
            {'type': 'aileron', 'view': 'top', 'mirror': True, 'sweep_parent': 'wingFold',
             'polygon_m': te_cut(FOLD_X + 0.06, 5.0, aileron_hinge)},
            {'type': 'flap', 'view': 'top', 'mirror': True, 'polygon_m': te_cut(WING_ROOT_X + 0.1, FOLD_X - 0.05, flap_hinge)},
            # Outer wings fold up about a streamwise hinge on the upper skin (top view: x 3.36).
            {'type': 'wingFold', 'role': 'wingFold', 'control': 'fold', 'view': 'top', 'mirror': True,
             'sign': 1.0, 'range_deg': 100.0, 'hinge_skin': 1.0,
             'polygon_m': top_m([(FOLD_X, 9.0), (FOLD_X, 13.5), (8.0, 13.5), (8.0, 9.0)])},
            # Rudders (M2 side view, rudder area marked on it): raked hinge from d 14.37 at y 0.51
            # to d 14.66 at y 1.88.
            {'type': 'rudder', 'view': 'side', 'mirror': True, 'depth_m': [1.65, 2.35],
             'polygon_m': side_m([(14.66, 1.88), (14.37, 0.51), (15.3, 0.51), (15.3, 1.88)])},
            # Large dorsal airbrake on the spine behind the canopy hump (MiG-29K), hinged at its front.
            {'type': 'airbrake', 'view': 'top', 'mirror': False, 'depth_m': [0.0, 1.2],
             'polygon_m': top_m([(0.28, 11.9), (-0.28, 11.9), (-0.3, 13.2), (0.3, 13.2)])},
        ],
        'gear': {'wheel_sides': 16, 'legs': [
            {'name': 'Nose', 'pos_m': P(0.0, GROUND, nose_d), 'retract': 'aft', 'retract_deg': 90,
             'strut_top_y_m': nose_top, 'wheel_radius_m': nose_r, 'twin': True},
            {'name': 'Main', 'pos_m': P(main_x, GROUND, main_d), 'mirror': True, 'retract': 'forward',
             'retract_deg': 90, 'strut_top_y_m': main_top, 'wheel_radius_m': main_r, 'wheel_width_m': 0.26,
             'stow_twist_deg': 90,
             # Large door on the front of each main leg (Drive photos 28644252602, mig-29kub_01).
             'leg_door': {'offset_m': 0.48, 'width_m': 0.4, 'length_m': 1.2}},
        ],
            'doors': [
                {'name': 'Nose', 'well': 'NoseWell', 'open_deg': 88, 'thickness_m': 0.035},
                {'name': 'Main', 'well': 'MainWell', 'mirror': True, 'open_deg': 90, 'thickness_m': 0.035},
            ]},
        'cockpit_m': P(0.0, 1.2, 4.3),
        # Eye points of the two crew seats (heads in the owner's KUB photo, either side of the frame bow).
        'pilot_seats_m': [P(0.0, 1.2, 4.3), P(0.0, 1.17, 5.65)],
    }
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec.json'), 'w') as f:
        json.dump(spec, f, indent=1)


if __name__ == '__main__':
    main()
