"""Spec (JSON) + three-view drawing -> Blender scene of a low-poly aircraft."""
from __future__ import annotations

import json
import math
import os

import bpy  # type: ignore
import numpy as np
from mathutils import Quaternion  # type: ignore

from . import geometry as geo
from .tailhook import build_tailhook
from .views import View, build_views

# Defaults per surface type: control axis, sign (left, right), max deflection (deg).
# Hinge axes are oriented to +X (wing/tail) or +Y (fin), so with sign +1 a
# positive control value raises the trailing edge (or swings a rudder's
# trailing edge to the right, -X), matching the F-22's surfaces.
SURFACE_TYPES = {
    'aileron':    ('roll', (-1.0, 1.0), 20.0),
    'flap':       ('flaps', (-1.0, -1.0), 35.0),
    'elevator':   ('pitch', (1.0, 1.0), 25.0),
    'stabilator': ('stabilator', (1.0, 1.0), 20.0),
    'rudder':     ('yaw', (1.0, 1.0), 25.0),
    'spoiler':    ('airbrake', (1.0, 1.0), 45.0),
    'airbrake':   ('airbrake', (1.0, 1.0), 45.0),
    'slat':       ('slats', (1.0, 1.0), 15.0),
    # An all-moving canard sits ahead of the wing: nose up wants its trailing edge down.
    'canard':     ('pitch', (-1.0, -1.0), 20.0),
}

GEAR_RETRACT_AXES = {
    # body axis, angle sign for a leg on the left (+X) side
    'forward': ((1.0, 0.0, 0.0), -1.0),
    'aft': ((1.0, 0.0, 0.0), 1.0),
    'inward': ((0.0, 0.0, 1.0), -1.0),
    'outward': ((0.0, 0.0, 1.0), 1.0),
}
GEAR_FRAMES = (1, 30)
# Retraction runs end -> start: the legs fold up over the first half, then the doors shut.
# Extension mirrors it: doors open over the first half, then the legs come down.
GEAR_MID = 0.5 * (GEAR_FRAMES[0] + GEAR_FRAMES[1])


def _poly_body2(views: dict[str, View], item: dict) -> np.ndarray:
    view = item.get('view', 'top')
    if 'polygon_m' in item:
        return np.asarray(item['polygon_m'], dtype=np.float64)
    return views[view].to_body2(item['polygon_px'])


def _hinge_body2(views: dict[str, View], item: dict, poly: np.ndarray) -> np.ndarray:
    view = item.get('view', 'top')
    if 'hinge_m' in item:
        return np.asarray(item['hinge_m'], dtype=np.float64)
    if 'hinge_px' in item:
        return views[view].to_body2(item['hinge_px'])
    return poly[:2].copy()


def _mirror_x(view: str, pts: np.ndarray) -> np.ndarray:
    """Mirror view coords across the symmetry plane (x -> -x)."""
    out = pts.copy()
    if view in ('top', 'front'):
        out[:, 0] *= -1
    return out


def _mid_through(tree, view: str, ab, fallback: float) -> tuple[float, float]:
    """(middle, thickness) of the part along the view's missing axis at a hinge point."""
    a, b = float(ab[0]), float(ab[1])
    if view != 'top':
        return fallback, 0.0
    lo = geo.underside_y(tree, a, b, -500.0)
    if lo is None:
        return fallback, float('inf')
    # Cast down from above for the top skin.
    hit = tree.ray_cast(geo.to_bl((a, 500.0, b)), geo.Vector((0, 0, -1)))
    hi = geo.from_bl(hit[0])[1] if hit[0] is not None else lo
    return 0.5 * (lo + hi), hi - lo


def _hinge_3d(part, view: str, hinge2: np.ndarray, skin: float = 0.0):
    """*skin* moves the hinge off the mid-thickness: +1 onto the upper (+axis) skin, -1 the lower."""
    mn, mx = geo.bounds_body(part)
    center = 0.5 * (mn + mx)
    third_axis = {'top': 1, 'side': 0, 'front': 2}[view]
    # Measure the thickness a little inside the part (the hinge is its edge),
    # but keep the hinge line itself where it was drawn.
    center2 = {'top': (center[0], center[2]), 'side': (center[2], center[1]), 'front': (center[0], center[1])}[view]
    # Sample the part's mid-thickness a quarter in from each hinge end (the
    # ends often run into the fuselage or a tip) and extrapolate to the ends.
    tree = geo.bvh_of(part)
    # Sample the part's mid-thickness along the hinge; samples much thicker
    # than the thinnest (where the cut runs into a fuselage, fin or pod) are
    # dropped, and a straight line through the rest gives the hinge height.
    ts = np.linspace(0.15, 0.85, 8)
    samples = []
    for t in ts:
        q = hinge2[0] + t * (hinge2[1] - hinge2[0])
        q = q + 0.15 * (np.asarray(center2) - q)
        samples.append(_mid_through(tree, view, q, center[third_axis]))
    mids = np.array([m for m, _ in samples])
    thick = np.array([th for _, th in samples])
    keep = thick <= 1.5 * thick.min() + 1e-6
    if keep.sum() >= 2:
        slope, icpt = np.polyfit(ts[keep], mids[keep] + 0.5 * skin * thick[keep], 1)
    else:
        slope, icpt = 0.0, float((mids + 0.5 * skin * thick)[keep].mean()) if keep.any() else center[third_axis]
    ends = [icpt, icpt + slope]
    p = [geo.view_point_3d(view, hinge2[i], ends[i]) for i in range(2)]
    p0, p1 = np.array(p[0]), np.array(p[1])
    # Pivot on the hinge line, at the projection of the part centre.
    d = p1 - p0
    if np.linalg.norm(d) < 1e-9:
        raise ValueError(f'{part.name}: hinge points coincide')
    axis = d / np.linalg.norm(d)
    pivot = p0 + axis * np.dot(center - p0, axis)
    if view == 'side':
        pivot[0] = 0.0 if abs(center[0]) < 0.25 else center[0]
    # Orient: wing/tail hinges toward +X, fin hinges toward +Y.
    key = {'top': 0, 'front': 0, 'side': 1}[view]
    if axis[key] < 0:
        axis = -axis
    return pivot, axis


def _depth(views, item) -> tuple[float, float]:
    """How far a cut reaches along the view's line of sight (default: through everything).

    A fin's rudder drawn in the side view would otherwise cut every fin at
    once; `depth_top_px` limits it to a span of the top view (its u range).
    """
    if 'depth_m' in item:
        a, b = item['depth_m']
    elif 'depth_top_px' in item:
        u0, u1 = item['depth_top_px']
        a = views['top'].to_body2([[u0, 0]])[0][0]
        b = views['top'].to_body2([[u1, 0]])[0][0]
    else:
        return (-geo.EXTRUDE, geo.EXTRUDE)
    return (min(a, b), max(a, b))


def _add_props(views, spec) -> None:
    """Propeller discs: hub from the front view (x, y) and top or side view (z)."""
    for i, pr in enumerate(spec.get('props', [])):
        x, y = views['front'].to_body2([pr['front_px']])[0]
        if 'top_px' in pr:
            z = views['top'].to_body2([pr['top_px']])[0][1]
        else:
            z = views['side'].to_body2([pr['side_px']])[0][0]
        r_px = float(pr['radius_px'])
        r = float(np.linalg.norm(views['front'].to_body2([[r_px, 0]])[0] - views['front'].to_body2([[0, 0]])[0]))
        xs = [x, -x] if pr.get('mirror', abs(x) > 0.05) else [x]
        for xi in xs:
            side = '' if len(xs) == 1 else ('Left' if xi > 0 else 'Right')
            geo.disc(f'2_Prop{side}{i or ""}', (xi, y, z), r, 'z', pr.get('material', 'VEHICLE_PLANE_ENGINE'), 'Body')
            print(f'[lpa] prop {side}: hub {np.round((xi, y, z), 2).tolist()} radius {r:.2f} m')


def _add_components(views, spec) -> None:
    """Extra solids built from their own shapes per view (a rotodome, a pod, a canard).

    Each is the intersection of the prisms of its shapes in the views it
    names; a view it leaves out does not limit it. It stays a separate object
    with its own material, untouched by the control-surface cuts. With
    "mirror" it is built on both sides; with "surface" ({"type", "hinge_px"
    or "hinge_m", "view"}) the whole part moves, like an all-moving canard
    or stabilator, about the given hinge line.
    """
    from .views import shape_outline
    for i, comp in enumerate(spec.get('components', [])):
        base = comp.get('name', f'Component{i}')
        surf = comp.get('surface')
        for mirrored in ([False, True] if comp.get('mirror') else [False]):
            solid = None
            for view, shapes in comp['shapes'].items():
                loops = [views[view].to_body2(shape_outline(sh, 24)) for sh in shapes]
                if mirrored:
                    loops = [_mirror_x(view, lp) for lp in loops]
                p = geo.prism(f'C_{base}_{view}', view, loops)
                if solid is None:
                    solid = p
                else:
                    geo.boolean(solid, p, 'INTERSECT')
                    bpy.data.objects.remove(p)
            mn, mx = geo.bounds_body(solid)
            side_name = '' if not comp.get('mirror') else ('Left' if mn[0] + mx[0] > 0 else 'Right')
            material = comp.get('material', spec.get('material', 'VEHICLE_PLANE_GREY'))
            solid.hide_render = False
            bpy.data.collections['Construction'].objects.unlink(solid)
            if not surf:
                solid.name = f'1_{base}{side_name}'
                geo._link(solid, 'Body')
                geo.tidy(solid, material)
                print(f'[lpa] component {solid.name}: {len(solid.data.polygons)} triangles')
                continue
            _all_moving(views, solid, surf, side_name, mirrored, material)


def _all_moving(views, solid, surf: dict, side_name: str, mirrored: bool, material: str,
                smooth_deg: float | None = None) -> None:
    """Make a whole part a control surface pivoting about its hinge line."""
    kind = surf.get('type', 'stabilator')
    control, signs, rng = SURFACE_TYPES.get(kind, (surf.get('control', 'pitch'), (1.0, 1.0), 20.0))
    hview = surf.get('view', 'top')
    hinge = _hinge_body2(views, {'view': hview, **surf}, np.zeros((2, 2)))
    if mirrored:
        hinge = _mirror_x(hview, hinge)
    role = surf.get('role', kind) + side_name
    solid.name = role
    geo._link(solid, 'Surfaces')
    geo.tidy(solid, material, smooth_deg)
    pivot, axis = _hinge_3d(solid, hview, hinge)
    geo.set_origin(solid, pivot)
    ctl = surf.get('control', control)
    if ctl == 'stabilator':
        ctl = 'stabilator' + (side_name or 'Left')
    side_ix = 1 if side_name == 'Right' else 0
    solid['lpa_role'] = role
    solid['lpa_control'] = ctl
    solid['lpa_sign'] = float(surf.get('sign', signs[side_ix]))
    solid['lpa_range_deg'] = float(surf.get('range_deg', rng))
    solid['lpa_axis'] = [float(c) for c in axis]
    print(f'[lpa] all-moving {role}: pivot {np.round(pivot, 3).tolist()} axis {np.round(axis, 3).tolist()} -> {ctl}')


def _spinning(obj, item: dict, side_name: str, mirrored: bool, material: str) -> None:
    """A propeller (or its painted tips) that spins about body +Z through its 'center'.

    Exported as a surface with control 'spin': its sign is the prop's hand (the turn
    direction, see parts.prop) and its range is the spin rate in deg/s.
    """
    role = item.get('name', 'prop') + side_name
    obj.name = role
    geo._link(obj, 'Surfaces')
    geo.tidy(obj, material)
    centre = [float(c) for c in item['center']]
    if mirrored:
        centre[0] = -centre[0]
    geo.set_origin(obj, centre)
    obj['lpa_role'] = role
    obj['lpa_control'] = 'spin'
    obj['lpa_sign'] = float(item.get('hand', 1.0))
    obj['lpa_range_deg'] = float(item.get('spin_deg_s', 700.0))
    obj['lpa_axis'] = [0.0, 0.0, 1.0]
    print(f'[lpa] spinning {role}: centre {np.round(centre, 3).tolist()} hand {obj["lpa_sign"]:+.0f}')


def _sliding(obj, item: dict, side_name: str, material: str, smooth_deg: float | None) -> None:
    """A part that moves in a straight line by 'slide_m' (body metres) with its control
    (default 'fold': a rotodome lowered for parking). Exported as a surface with 'slide'."""
    role = item.get('name', 'part') + side_name
    obj.name = role
    geo._link(obj, 'Surfaces')
    geo.tidy(obj, material, smooth_deg)
    mn, mx = geo.bounds_body(obj)
    geo.set_origin(obj, (0.5 * (mn + mx)).tolist())
    obj['lpa_role'] = role
    obj['lpa_control'] = item.get('control', 'fold')
    obj['lpa_sign'] = 1.0
    obj['lpa_range_deg'] = math.degrees(1.0)  # rangeRad 1: the deflection is the travel fraction
    obj['lpa_axis'] = [0.0, 1.0, 0.0]
    obj['lpa_slide'] = [float(c) for c in item['slide_m']]
    print(f'[lpa] sliding {role}: by {item["slide_m"]} with {obj["lpa_control"]}')


def _add_surfaces(views, hull, spec) -> None:
    for item in spec.get('surfaces', []):
        kind = item['type']
        control, signs, rng = SURFACE_TYPES.get(kind, (item.get('control', 'pitch'), (1.0, 1.0), 25.0))
        view = item.get('view', 'top')
        if 'polygons_m' in item:
            # One surface in several pieces (a rudder split by the tailplane): one mesh, one hinge.
            loops = [np.asarray(lp, dtype=np.float64) for lp in item['polygons_m']]
        else:
            loops = [_poly_body2(views, item)]
        poly = np.vstack(loops)
        hinge = _hinge_body2(views, item, loops[0])
        depth = _depth(views, item)
        sides = [(poly, loops, hinge, depth)]
        if item.get('mirror', view != 'side'):
            if view == 'side':
                sides.append((poly, loops, hinge, (-depth[1], -depth[0])))
            else:
                sides.append((_mirror_x(view, poly), [_mirror_x(view, lp) for lp in loops],
                              _mirror_x(view, hinge), depth))
        for p, lps, h, dep in sides:
            cx = float(np.mean(p[:, 0])) if view in ('top', 'front') else 0.5 * (dep[0] + dep[1])
            if len(sides) == 1:
                side_name, side_ix = '', 1
            else:
                side_name, side_ix = ('Left', 0) if cx > 0 else ('Right', 1)
            role = item.get('role', kind) + side_name
            part = geo.cut_part(hull, role, view, lps, item.get('material', spec.get('material', 'VEHICLE_PLANE_GREY')),
                                'Surfaces', depth=dep, smooth_deg=spec.get('smooth_deg'))
            if part is None:
                print(f'[lpa] surface {role}: polygon does not touch the hull, skipped')
                continue
            pivot, axis = _hinge_3d(part, view, h, item.get('hinge_skin', 0.0))
            if 'axis_yaw_deg' in item:
                # Turn the hinge axis about the vertical, away from the drawn cut line: more skew
                # (tips fold further forward) where the cut itself can't move (nacelle in the way).
                a = math.radians(item['axis_yaw_deg']) * (1.0 if axis[2] >= 0 else -1.0)
                c, s_ = math.cos(a), math.sin(a)
                axis = np.array([c * axis[0] + s_ * axis[2], axis[1], -s_ * axis[0] + c * axis[2]])
            geo.set_origin(part, pivot)
            ctl = item.get('control', control)
            if ctl == 'stabilator':
                ctl = 'stabilator' + (side_name or 'Left')
            part['lpa_role'] = role
            part['lpa_control'] = ctl
            part['lpa_sign'] = float(item.get('sign', signs[side_ix]))
            # range_deg_sides [left, right]: folding wings stop at different angles so they stack.
            sides_rng = item.get('range_deg_sides')
            part['lpa_range_deg'] = float(sides_rng[side_ix] if sides_rng and side_name else item.get('range_deg', rng))
            part['lpa_axis'] = [float(c) for c in axis]
            if 'sweep_parent' in item:
                # Mounted on a moving wing panel (sweep or fold): carried along with it.
                part['lpa_sweep_parent'] = item['sweep_parent'] + side_name
            print(f'[lpa] surface {role}: pivot {np.round(pivot, 3).tolist()} axis {np.round(axis, 3).tolist()} -> {ctl}')


def _add_regions(views, hull, spec) -> list:
    """Static cut-outs that stay on the body with their own material (canopy)."""
    out = []
    for i, item in enumerate(spec.get('regions', [])):
        name = f"{i + 1}_{item.get('name', 'Region')}"
        part = geo.cut_part(hull, name, item.get('view', 'side'), _poly_body2(views, item),
                            item.get('material', 'GLASS'), 'Body')
        if part is not None:
            part['lpa_region'] = item.get('name', 'Region')
            out.append(part)
    return out


def _add_gear(views, hull, spec) -> None:
    gear = spec.get('gear')
    if not gear:
        return
    tree = geo.bvh_of(hull)
    length = float(spec['length_m'])
    for leg in gear.get('legs', []):
        if 'pos_m' in leg:  # (x, y, z) of the wheel's ground contact
            x, y_ground, z = (float(c) for c in leg['pos_m'])
        else:
            side = views['side'].to_body2([leg['side_px']])[0]  # (z, y) of the wheel's ground contact
            z, y_ground = float(side[0]), float(side[1])
        if 'pos_m' in leg:
            pass                 # x already set
        elif 'top_px' in leg:
            x = float(views['top'].to_body2([leg['top_px']])[0][0])
        elif 'front_px' in leg:
            x = float(views['front'].to_body2([leg['front_px']])[0][0])
        else:
            x = float(leg.get('x_m', 0.0))
        radius = float(leg.get('wheel_radius_m', max(0.15, 0.03 * length)))
        width = float(leg.get('wheel_width_m', radius * 0.6))
        xs = [x, -x] if leg.get('mirror', abs(x) > 0.05) else [x]
        for xi in xs:
            side_name = '' if len(xs) == 1 else ('Left' if xi > 0 else 'Right')
            name = f"LG_{leg.get('name', 'Leg')}{side_name}"
            # A gear bay box below the skin would stop the cast short; 'strut_top_y_m' pins the pivot inside it.
            y_top = float(leg['strut_top_y_m']) if 'strut_top_y_m' in leg else geo.underside_y(tree, xi, z, y_ground)
            if y_top is None:
                y_top = y_ground + 2.5 * radius
                print(f'[lpa] gear {name}: nothing above the wheel, strut top guessed at y={y_top:.2f}')
            top = (xi, y_top, z)
            objs = geo.gear_leg(name, top, (xi, y_ground, z), radius, width, 'Gear',
                                wheel_sides=int(gear.get('wheel_sides', 16 if 'parts' in spec else 8)),
                                twin=bool(leg.get('twin', False)))
            if 'leg_door' in leg:
                # Door on the leg (e.g. MiG-29 mains): the side that faces down once retracted.
                ld = leg['leg_door']
                ahead = 1.0 if leg.get('retract', 'aft') == 'forward' else -1.0
                objs.append(geo.leg_door(name, top, ahead * float(ld.get('offset_m', radius + 0.05)),
                                         float(ld.get('width_m', 2 * width)), float(ld.get('length_m', 1.0)),
                                         'Gear', thickness=float(ld.get('thickness_m', 0.03))))
            axis_body, sgn = GEAR_RETRACT_AXES[leg.get('retract', 'aft')]
            if axis_body[2] != 0 and xi < 0:
                sgn = -sgn  # inward/outward mirror across the plane of symmetry
            angle = sgn * math.radians(float(leg.get('retract_deg', 90.0)))
            # 'stow_twist_deg' turns the wheel about its strut while the leg folds, so it stows flat
            # (MiG-29 mains). Keyed in steps so the combined turn stays on its path.
            twist = math.radians(float(leg.get('stow_twist_deg', 0.0)))
            steps = 4 if twist else 1
            for i, o in enumerate(objs):
                o.name = f'{i}_{o.name}'
                o.rotation_mode = 'QUATERNION'
                turns = twist if o.name.endswith(('_Wheel', '_Hub')) else 0.0
                for k in range(steps + 1):
                    t = k / steps                      # 0 = folded, 1 = down
                    o.rotation_quaternion = (Quaternion(geo.to_bl(axis_body), angle * (1.0 - t))
                                             @ Quaternion((0.0, 0.0, 1.0), turns * (1.0 - t)))
                    frames = (GEAR_FRAMES[0], GEAR_MID) if k == 0 else (GEAR_MID + t * (GEAR_FRAMES[1] - GEAR_MID),)
                    for frame in frames:
                        o.keyframe_insert('location', frame=frame)
                        o.keyframe_insert('rotation_quaternion', frame=frame)
                o.animation_data.action.name = f'{o.name}Action'
            print(f'[lpa] gear {name}: pivot {np.round(top, 2).tolist()} retracts {leg.get("retract", "aft")}')
    _add_gear_doors(gear)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = GEAR_FRAMES
    sc.frame_set(GEAR_FRAMES[1])


_WELL_SKINS: dict = {}  # well part name -> (removed skin patch, well centre x), set by build_parts


def _add_well_doors(door: dict) -> None:
    """Two doors cut from a well's own skin (split down the middle), hinged on its outer edges.

    They sit flush when closed (gear up) and swing open by 'open_deg' (gear down).
    """
    wells = [(door['well'], '')]
    if door.get('mirror'):
        wells = [(f"{door['well']}Left", 'Left'), (f"{door['well']}Right", 'Right')]
    for well, suffix in wells:
        if well not in _WELL_SKINS:
            print(f'[lpa] door {door.get("name")}: no well {well}')
            continue
        skin, centre_x = _WELL_SKINS[well]
        for side, part in ((1.0, 'A'), (-1.0, 'B')):
            obj = geo.skin_door(f"2_Door_{door.get('name', 'Bay')}{part}{suffix}", skin, centre_x, side, 'Gear',
                                thickness=float(door.get('thickness_m', 0.025)))
            if obj is None:
                continue
            axis = geo.to_bl((0.0, 0.0, 1.0))
            q_open = Quaternion(axis, side * math.radians(float(door.get('open_deg', 90.0))))
            obj.rotation_mode = 'QUATERNION'
            for frame, q in ((GEAR_FRAMES[0], Quaternion()), (GEAR_MID, q_open), (GEAR_FRAMES[1], q_open)):
                obj.rotation_quaternion = q
                obj.keyframe_insert('location', frame=frame)
                obj.keyframe_insert('rotation_quaternion', frame=frame)
            obj.animation_data.action.name = f'{obj.name}Action'


def _add_gear_doors(gear: dict) -> None:
    """Bay doors that hang open with the gear down and fold flat under the bay with it up.

    Each door is given by its hinge (x, y), its z range and its height; 'side' says which
    edge of the bay it sits on (+1: the +X edge, so it folds towards -X to close) and
    'closed_deg' is the swing to shut (90 = flat; less for a door that follows a
    rounded skin) and 'splay_deg' tilts the open door outwards. Doors animate with the gear (same frames,
    one '<name>Action' clip each), so the sim swings them with the legs. A door with
    'well' is cut from that well's skin instead (see _add_well_doors).
    """
    for door in gear.get('doors', []):
        if 'well' in door:
            _add_well_doors(door)
            continue
        x, y = (float(c) for c in door['hinge_m'])
        z0, z1 = (float(c) for c in door['z_m'])
        side = float(door.get('side', 1.0))
        variants = [(x, side, '')]
        if door.get('mirror'):
            variants = [(x, side, 'Left'), (-x, -side, 'Right')]
        for xi, si, suffix in variants:
            name = f"2_Door_{door.get('name', 'Bay')}{suffix}"
            obj = geo.gear_door(name, xi, y, z0, z1, float(door['height_m']), 'Gear',
                                thickness=float(door.get('thickness_m', 0.03)))
            axis = geo.to_bl((0.0, 0.0, 1.0))
            q_closed = Quaternion(axis, -si * math.radians(float(door.get('closed_deg', 90.0))))
            q_open = Quaternion(axis, si * math.radians(float(door.get('splay_deg', 0.0))))
            obj.rotation_mode = 'QUATERNION'
            for frame, q in ((GEAR_FRAMES[0], q_closed), (GEAR_MID, q_open), (GEAR_FRAMES[1], q_open)):
                obj.rotation_quaternion = q
                obj.keyframe_insert('location', frame=frame)
                obj.keyframe_insert('rotation_quaternion', frame=frame)
            obj.animation_data.action.name = f'{obj.name}Action'


def _wingtips(hull) -> list:
    pts = np.array([geo.from_bl(v.co) for v in hull.data.vertices])
    left = pts[int(np.argmax(pts[:, 0]))]
    right = pts[int(np.argmin(pts[:, 0]))]
    return [left.tolist(), right.tolist()]


def _cockpit(views, spec, regions) -> list:
    c = spec.get('cockpit_px')
    if c:
        z, y = views['side'].to_body2([c])[0]
        return [0.0, float(y), float(z)]
    for r in regions:
        if r.get('lpa_region', '').lower() == 'canopy':
            mn, mx = geo.bounds_body(r)
            return [0.0, float(mn[1] + 0.35 * (mx[1] - mn[1])), float(0.5 * (mn[2] + mx[2]))]
    return [0.0, 1.0, 0.25 * float(spec['length_m'])]


def _fcurves(action):
    """F-curves of an action, layered (Blender 4.4+) or legacy."""
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


def _fill_section(obj, hull, how='section') -> None:
    """Cut a slab part down to the hull section it spans, keeping only its two broad faces.

    *how* 'floor' keeps the top and bottom faces (a deck), anything else the fore and aft ones.

    The rim the cut leaves lies on the skin and would fight with it, so it goes; what stays is
    a flat wall that fills the fuselage there (a bulkhead seen through the glazing).
    """
    import bmesh  # type: ignore  # (needs bpy loaded first)
    from mathutils import Vector  # type: ignore
    geo.boolean(obj, hull, 'INTERSECT')
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    k = 2 if how == 'floor' else 1                        # Blender Z is up, Blender Y fore-aft
    rim = [f for f in bm.faces if abs(f.normal[k]) < 0.9]
    bmesh.ops.delete(bm, geom=rim, context='FACES')
    # Pull the edge 2 % in off the skin so it cannot show through it as a seam.
    centre = sum((v.co for v in bm.verts), Vector()) / max(len(bm.verts), 1)
    for v in bm.verts:
        for j in {0, 1, 2} - {k}:
            v.co[j] = centre[j] + 0.98 * (v.co[j] - centre[j])
    bm.to_mesh(obj.data)
    bm.free()


def _open_cabin(hull, box: dict, reach: float = 3.0) -> None:
    """Delete the hull faces inside a body-frame box that face into the airframe, not out of it.

    Seen through the glazing the cabin is one open space: a face there whose normal runs into
    the hull or another body part (glass, roof, panels) within *reach* is a cut wall or shelf
    left by some cut, not skin, and goes.
    """
    import bmesh  # type: ignore  # (needs bpy loaded first)
    from mathutils.bvhtree import BVHTree  # type: ignore
    lo = np.minimum(box['lo'], box['hi'])
    hi = np.maximum(box['lo'], box['hi'])
    bm_all = bmesh.new()
    for o in bpy.data.collections['Body'].objects:
        if o.type == 'MESH':
            me = o.data.copy()
            me.transform(o.matrix_world)
            bm_all.from_mesh(me)
            bpy.data.meshes.remove(me)
    me = hull.data.copy()
    me.transform(hull.matrix_world)
    bm_all.from_mesh(me)
    bpy.data.meshes.remove(me)
    tree = BVHTree.FromBMesh(bm_all)
    bm_all.free()
    bm = bmesh.new()
    bm.from_mesh(hull.data)
    bm.transform(hull.matrix_world)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    doomed = []
    for f in bm.faces:
        c = f.calc_center_median()
        p = np.asarray(geo.from_bl(c))
        if np.all(p >= lo) and np.all(p <= hi):
            if tree.ray_cast(c + f.normal * 0.005, f.normal, reach)[0] is not None:
                doomed.append(f)
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.transform(hull.matrix_world.inverted())
    bm.to_mesh(hull.data)
    bm.free()
    print(f'[lpa] open cabin: {len(doomed)} inner faces dropped')


def _clip_to_hull(obj, hull, tol: float = 0.01) -> None:
    """Trim a part to the inside of the hull, dropping the faces the cut leaves on the skin."""
    import bmesh  # type: ignore  # (needs bpy loaded first)
    skin = geo.bvh_of(hull)
    geo.boolean(obj, hull, 'INTERSECT')
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    on_skin = [f for f in bm.faces if skin.find_nearest(f.calc_center_median())[3] < tol]
    bmesh.ops.delete(bm, geom=on_skin, context='FACES')
    bm.transform(obj.matrix_world.inverted())
    bm.to_mesh(obj.data)
    bm.free()


def _stand_on_wheels(ground_y: float | None, dz: float = 0.0) -> None:
    """Raise or lower the whole aircraft so the wheels (gear down) touch body y = ground_y,
    and move it dz along body Z (to put the origin, the sim's centre of gravity, where it belongs).

    The sim rests every type with its body origin a fixed height above the ground
    (2 m: PLANE_DISTANCE_TO_GROUND), so a taller gear otherwise stands sunk in.
    Moves every exported object (and the gear's keyed locations) and the scene's
    recorded points.
    """
    scene = bpy.context.scene
    scene.frame_set(GEAR_FRAMES[1])
    deps = bpy.context.evaluated_depsgraph_get()
    low = math.inf
    for o in bpy.data.collections['Gear'].objects if 'Gear' in bpy.data.collections else []:
        if o.type != 'MESH':
            continue
        e = o.evaluated_get(deps)
        me = e.to_mesh()
        low = min([low] + [(e.matrix_world @ v.co).z for v in me.vertices])
        e.to_mesh_clear()
    scene.frame_set(GEAR_FRAMES[0])
    if ground_y is None or not math.isfinite(low):
        dy = 0.0
    else:
        dy = ground_y - low
    for coll in ('Body', 'Shadow', 'Gear', 'Surfaces'):
        if coll not in bpy.data.collections:
            continue
        for o in bpy.data.collections[coll].objects:
            if o.parent is not None:
                continue
            # Body (x, y, z) is Blender (x, -z, y).
            o.location.z += dy
            o.location.y -= dz
            ad = o.animation_data
            if ad and ad.action:
                for fc in _fcurves(ad.action):
                    if fc.data_path != 'location' or fc.array_index not in (1, 2):
                        continue
                    shift = dy if fc.array_index == 2 else -dz
                    for kp in fc.keyframe_points:
                        kp.co.y += shift
                        kp.handle_left.y += shift
                        kp.handle_right.y += shift
    scene['lpa_wingtips'] = [[w[0], w[1] + dy, w[2] + dz] for w in scene['lpa_wingtips']]
    c = list(scene['lpa_cockpit'])
    scene['lpa_cockpit'] = [c[0], c[1] + dy, c[2] + dz]
    if scene.get('lpa_pilot_seats'):
        seats = json.loads(scene['lpa_pilot_seats'])
        scene['lpa_pilot_seats'] = json.dumps([[s[0], s[1] + dy, s[2] + dz] for s in seats])
    if scene.get('lpa_tailhook'):
        hook = json.loads(scene['lpa_tailhook'])
        for k in ('hinge', 'tip'):
            hook[k][1] = round(hook[k][1] + dy, 4)
            hook[k][2] = round(hook[k][2] + dz, 4)
        scene['lpa_tailhook'] = json.dumps(hook)
    # Spec frame -> pack frame, for the Hangar's cross-section window (sections.py).
    scene['lpa_shift'] = [0.0, dy, dz]
    bpy.context.view_layer.update()
    print(f'[lpa] moved the aircraft by y {dy:+.3f} m (wheels at y {ground_y}), z {dz:+.3f} m')


def build_parts(spec: dict) -> None:
    """Realistic low-poly model from shaped parts (lofts and profiled panels).

    Parts with "join": "body" (the default) are merged into one body mesh,
    which the control surfaces are then cut from; "separate" parts (canopy,
    nozzles) stay their own body objects; parts with "surface" move as a
    whole (all-moving canards and tailplanes). Everything is in body metres.
    """
    from . import parts
    from . import sections
    sections.LOG.clear()
    bpy.context.scene['lpa_shift'] = [0.0, 0.0, 0.0]
    smooth = spec.get('smooth_deg', 35.0)
    spec.setdefault('smooth_deg', smooth)
    hull = None
    separate = []
    wells = []
    fills = []
    for item in spec['parts']:
        for mirrored in ([False, True] if item.get('mirror') else [False]):
            obj = parts.build_part(item, mirrored)
            side_name = '' if not item.get('mirror') else ('Right' if mirrored else 'Left')
            material = item.get('material', spec.get('material', 'VEHICLE_PLANE_GREY'))
            obj.name = f"{item.get('name', item['type'])}{side_name}"
            join = item.get('join', 'surface' if item.get('surface') else 'body')
            if join == 'cut':
                # Wells (wheel bays) are sunk into the finished body below.
                wells.append((obj, item.get('material', 'VEHICLE_PLANE_ENGINE')))
                continue
            if join == 'body':
                if hull is None:
                    hull = obj
                else:
                    geo.boolean(hull, obj, 'UNION')
                    bpy.data.objects.remove(obj)
                continue
            bpy.data.collections['Construction'].objects.unlink(obj)
            if join == 'spin':
                _spinning(obj, item, side_name, mirrored, material)
                continue
            if join == 'slide':
                _sliding(obj, item, side_name, material, smooth)
                continue
            if join == 'surface':
                _all_moving(None, obj, item['surface'], side_name, mirrored, material, smooth)
            else:
                obj.name = f'1_{obj.name}'
                geo._link(obj, 'Body')
                geo.tidy(obj, material, smooth)
                if item.get('fill_hull'):
                    # A bulkhead: the part is cut down to the fuselage section it spans (below).
                    fills.append((obj, item['fill_hull']))
                elif item.get('clip_hull'):
                    # Cockpit furniture: trimmed where it would poke through the skin (below).
                    fills.append((obj, 'clip'))
                if item.get('inside_out'):
                    # Seen from within (a cockpit tub behind the glazing): faces point inwards.
                    obj.data.flip_normals()
                separate.append(obj)
    if spec.get('planar_deg'):
        # Fewer polygons where the hull is near flat (wing and tail skins, boolean slivers),
        # keeping the round sections round.
        geo.decimate(hull, planar_deg=float(spec['planar_deg']))
    if float(spec.get('decimate', 1.0)) < 1.0:
        # Fewer polygons: collapse the joined hull before anything is cut from it, so the wells,
        # panes and control surfaces still match its faces exactly.
        geo.decimate(hull, float(spec['decimate']))
    _WELL_SKINS.clear()
    for obj, material in wells:
        well_name = obj.name
        centre_x = float(np.mean([geo.from_bl(v.co)[0] for v in obj.data.vertices]))
        _, skin = geo.recess(hull, obj, f'1_{well_name}', material, 'Body')
        if skin is not None:
            _WELL_SKINS[well_name] = (skin, centre_x)
    for obj, how in fills:
        _clip_to_hull(obj, hull) if how == 'clip' else _fill_section(obj, hull, how)
    wingtips = _wingtips(hull)
    see_through = []
    for i, item in enumerate(spec.get('regions', [])):
        view = item.get('view', 'side')
        depth = _depth(None, item)
        if 'polygons_m' in item:
            poly = [np.asarray(lp, dtype=np.float64) for lp in item['polygons_m']]
        else:
            poly = [_poly_body2(None, item)]
        sides = [('', poly, depth)]
        if item.get('mirror'):
            # Windows and doors on both sides: mirror the polygon (top/front) or the depth (side).
            other = ((poly, (-depth[1], -depth[0])) if view == 'side'
                     else ([_mirror_x(view, lp) for lp in poly], depth))
            sides = [('L', poly, depth), ('R', *other)]
        for suffix, p, dep in sides:
            # Regions are thin skins: with see-through glazing the cabin is open, and a cut-out
            # block's sides (a door, the hatch, a painted band) would show as walls inside.
            skin = geo.bvh_of(hull) if item.get('see_through', True) else None
            cutters = [] if skin is not None else None
            clip = None
            if 'clip' in item:
                # e.g. a windscreen drawn in the side view whose roof edge follows the top view.
                cl = [np.asarray(lp, dtype=np.float64) for lp in item['clip']['polygons_m']]
                if suffix == 'R' and item['clip'].get('view', 'top') != 'side':
                    cl = [_mirror_x(item['clip'].get('view', 'top'), lp) for lp in cl]
                clip = (item['clip'].get('view', 'top'), cl)
            part = geo.cut_part(hull, f"{i + 1}_{item.get('name', 'Region')}{suffix}", view, p,
                                item.get('material', 'GLASS'), 'Body', depth=dep, smooth_deg=smooth,
                                cutters=cutters, clip=clip)
            if part is not None:
                part['lpa_region'] = item.get('name', 'Region')
                if skin is not None:
                    geo.keep_skin(part, skin)
                    see_through.append((skin, cutters[-1]))
    _add_surfaces(None, hull, spec)
    _add_gear(None, hull, spec)
    for skin, cutter in see_through:
        # The walls the cut leaves in the hull go too: the cabin behind a pane is open.
        geo.drop_off_skin(hull, skin, cutter)
    if 'open_cabin' in spec:
        _open_cabin(hull, spec['open_cabin'])
    for skin, _ in _WELL_SKINS.values():
        bpy.data.objects.remove(skin)
    _WELL_SKINS.clear()

    geo.tidy(hull, spec.get('material', 'VEHICLE_PLANE_GREY'), smooth)
    hull.name = hull.data.name = '0_Body'
    bpy.data.collections['Construction'].objects.unlink(hull)
    geo._link(hull, 'Body')
    construction = bpy.data.collections['Construction']
    for o in list(construction.objects):
        bpy.data.objects.remove(o)
    bpy.data.collections.remove(construction)
    bpy.context.view_layer.update()  # drop removed objects from the view layer before export

    footprint = [o for o in bpy.data.objects if o.type == 'MESH' and o.users_collection[0].name in ('Body', 'Surfaces')]
    parts.shadow_from_mesh(footprint, '0_Shadow')

    scene = bpy.context.scene
    scene['lpa_id'] = spec['id']
    scene['lpa_name'] = spec.get('name', spec['id'])
    scene['lpa_wingtips'] = wingtips
    scene['lpa_cockpit'] = [float(c) for c in spec.get('cockpit_m', [0.0, 1.0, 0.25 * float(spec['length_m'])])]
    if spec.get('pilot_seats_m'):
        # Eye points of the seats the game puts its pilot figure in (manifest 'pilotSeats').
        scene['lpa_pilot_seats'] = json.dumps([[float(c) for c in s] for s in spec['pilot_seats_m']])
    hook = build_tailhook(spec, spec['id'])
    if hook:
        scene['lpa_tailhook'] = json.dumps(hook)
    if 'ground_y' in spec or 'origin_d' in spec:
        # origin_d: where the body origin (the sim's centre of gravity) sits, in metres from the nose.
        dz = float(spec['z0_m']) - float(spec['origin_d']) if 'origin_d' in spec else 0.0
        _stand_on_wheels(spec.get('ground_y'), -dz)
    tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and o.users_collection[0].name != 'Shadow')
    print(f'[lpa] built {spec["id"]}: {tris} triangles')


def build(spec_path: str) -> None:
    spec_dir = os.path.dirname(os.path.abspath(spec_path))
    with open(spec_path) as f:
        spec = json.load(f)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    if 'parts' in spec:
        from . import sections
        sections.attach(spec, spec_dir)
        build_parts(spec)
        return

    views = build_views(spec_dir, spec)
    for n, v in views.items():
        print(f'[lpa] {n} view: {len(v.loops_px)} outline(s), {sum(len(lp) for lp in v.loops_px)} points')

    hull = geo.visual_hull(views)
    wingtips = _wingtips(hull)
    regions = _add_regions(views, hull, spec)
    _add_surfaces(views, hull, spec)
    _add_gear(views, hull, spec)
    _add_props(views, spec)
    _add_components(views, spec)

    body_material = spec.get('material', 'VEHICLE_PLANE_GREY')
    geo.tidy(hull, body_material)
    hull.name = '0_Body'
    hull.data.name = '0_Body'
    construction = bpy.data.collections['Construction']
    construction.objects.unlink(hull)
    geo._link(hull, 'Body')
    for o in list(construction.objects):
        bpy.data.objects.remove(o)
    bpy.data.collections.remove(construction)

    geo.flat_shape('0_Shadow', views['top'].loops_body2(), 'SCENERY_TREE_SHADOW', 'Shadow')

    scene['lpa_id'] = spec['id']
    scene['lpa_name'] = spec.get('name', spec['id'])
    scene['lpa_wingtips'] = wingtips
    scene['lpa_cockpit'] = _cockpit(views, spec, regions)
    tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
    print(f'[lpa] built {spec["id"]}: {tris} triangles')
