"""Spec (JSON) + three-view drawing -> Blender scene of a low-poly aircraft."""
from __future__ import annotations

import json
import math
import os

import bpy  # type: ignore
import numpy as np
from mathutils import Quaternion  # type: ignore

from . import geometry as geo
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


def _hinge_3d(part, view: str, hinge2: np.ndarray):
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
        slope, icpt = np.polyfit(ts[keep], mids[keep], 1)
    else:
        slope, icpt = 0.0, float(mids[keep].mean()) if keep.any() else center[third_axis]
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


def _add_surfaces(views, hull, spec) -> None:
    for item in spec.get('surfaces', []):
        kind = item['type']
        control, signs, rng = SURFACE_TYPES.get(kind, (item.get('control', 'pitch'), (1.0, 1.0), 25.0))
        view = item.get('view', 'top')
        poly = _poly_body2(views, item)
        hinge = _hinge_body2(views, item, poly)
        depth = _depth(views, item)
        sides = [(poly, hinge, depth)]
        if item.get('mirror', view != 'side'):
            if view == 'side':
                sides.append((poly, hinge, (-depth[1], -depth[0])))
            else:
                sides.append((_mirror_x(view, poly), _mirror_x(view, hinge), depth))
        for p, h, dep in sides:
            cx = float(np.mean(p[:, 0])) if view in ('top', 'front') else 0.5 * (dep[0] + dep[1])
            if len(sides) == 1:
                side_name, side_ix = '', 1
            else:
                side_name, side_ix = ('Left', 0) if cx > 0 else ('Right', 1)
            role = item.get('role', kind) + side_name
            part = geo.cut_part(hull, role, view, p, item.get('material', spec.get('material', 'VEHICLE_PLANE_GREY')),
                                'Surfaces', depth=dep, smooth_deg=spec.get('smooth_deg'))
            if part is None:
                print(f'[lpa] surface {role}: polygon does not touch the hull, skipped')
                continue
            pivot, axis = _hinge_3d(part, view, h)
            geo.set_origin(part, pivot)
            ctl = item.get('control', control)
            if ctl == 'stabilator':
                ctl = 'stabilator' + (side_name or 'Left')
            part['lpa_role'] = role
            part['lpa_control'] = ctl
            part['lpa_sign'] = float(item.get('sign', signs[side_ix]))
            part['lpa_range_deg'] = float(item.get('range_deg', rng))
            part['lpa_axis'] = [float(c) for c in axis]
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
            y_top = geo.underside_y(tree, xi, z, y_ground)
            if y_top is None:
                y_top = y_ground + 2.5 * radius
                print(f'[lpa] gear {name}: nothing above the wheel, strut top guessed at y={y_top:.2f}')
            top = (xi, y_top, z)
            objs = geo.gear_leg(name, top, (xi, y_ground, z), radius, width, 'Gear',
                                wheel_sides=int(gear.get('wheel_sides', 16 if 'parts' in spec else 8)))
            axis_body, sgn = GEAR_RETRACT_AXES[leg.get('retract', 'aft')]
            if axis_body[2] != 0 and xi < 0:
                sgn = -sgn  # inward/outward mirror across the plane of symmetry
            angle = sgn * math.radians(float(leg.get('retract_deg', 90.0)))
            q_up = Quaternion(geo.to_bl(axis_body), angle)
            for i, o in enumerate(objs):
                o.name = f'{i}_{o.name}'
                o.rotation_mode = 'QUATERNION'
                o.rotation_quaternion = q_up
                o.keyframe_insert('location', frame=GEAR_FRAMES[0])
                o.keyframe_insert('rotation_quaternion', frame=GEAR_FRAMES[0])
                o.rotation_quaternion = Quaternion()
                o.keyframe_insert('location', frame=GEAR_FRAMES[1])
                o.keyframe_insert('rotation_quaternion', frame=GEAR_FRAMES[1])
                o.animation_data.action.name = f'{o.name}Action'
            print(f'[lpa] gear {name}: pivot {np.round(top, 2).tolist()} retracts {leg.get("retract", "aft")}')
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = GEAR_FRAMES
    sc.frame_set(GEAR_FRAMES[1])


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


def build_parts(spec: dict) -> None:
    """Realistic low-poly model from shaped parts (lofts and profiled panels).

    Parts with "join": "body" (the default) are merged into one body mesh,
    which the control surfaces are then cut from; "separate" parts (canopy,
    nozzles) stay their own body objects; parts with "surface" move as a
    whole (all-moving canards and tailplanes). Everything is in body metres.
    """
    from . import parts
    smooth = spec.get('smooth_deg', 35.0)
    spec.setdefault('smooth_deg', smooth)
    hull = None
    separate = []
    for item in spec['parts']:
        for mirrored in ([False, True] if item.get('mirror') else [False]):
            obj = parts.build_part(item, mirrored)
            side_name = '' if not item.get('mirror') else ('Right' if mirrored else 'Left')
            material = item.get('material', spec.get('material', 'VEHICLE_PLANE_GREY'))
            obj.name = f"{item.get('name', item['type'])}{side_name}"
            join = item.get('join', 'surface' if item.get('surface') else 'body')
            if join == 'body':
                if hull is None:
                    hull = obj
                else:
                    geo.boolean(hull, obj, 'UNION')
                    bpy.data.objects.remove(obj)
                continue
            bpy.data.collections['Construction'].objects.unlink(obj)
            if join == 'surface':
                _all_moving(None, obj, item['surface'], side_name, mirrored, material, smooth)
            else:
                obj.name = f'1_{obj.name}'
                geo._link(obj, 'Body')
                geo.tidy(obj, material, smooth)
                separate.append(obj)
    wingtips = _wingtips(hull)
    for i, item in enumerate(spec.get('regions', [])):
        view = item.get('view', 'side')
        poly, depth = _poly_body2(None, item), _depth(None, item)
        sides = [('', poly, depth)]
        if item.get('mirror'):
            # Windows and doors on both sides: mirror the polygon (top/front) or the depth (side).
            other = (poly, (-depth[1], -depth[0])) if view == 'side' else (_mirror_x(view, poly), depth)
            sides = [('L', poly, depth), ('R', *other)]
        for suffix, p, dep in sides:
            part = geo.cut_part(hull, f"{i + 1}_{item.get('name', 'Region')}{suffix}", view, p,
                                item.get('material', 'GLASS'), 'Body', depth=dep, smooth_deg=smooth)
            if part is not None:
                part['lpa_region'] = item.get('name', 'Region')
    _add_surfaces(None, hull, spec)
    _add_gear(None, hull, spec)

    geo.tidy(hull, spec.get('material', 'VEHICLE_PLANE_GREY'), smooth)
    hull.name = hull.data.name = '0_Body'
    bpy.data.collections['Construction'].objects.unlink(hull)
    geo._link(hull, 'Body')
    construction = bpy.data.collections['Construction']
    for o in list(construction.objects):
        bpy.data.objects.remove(o)
    bpy.data.collections.remove(construction)

    footprint = [o for o in bpy.data.objects if o.type == 'MESH' and o.users_collection[0].name in ('Body', 'Surfaces')]
    parts.shadow_from_mesh(footprint, '0_Shadow')

    scene = bpy.context.scene
    scene['lpa_id'] = spec['id']
    scene['lpa_name'] = spec.get('name', spec['id'])
    scene['lpa_wingtips'] = wingtips
    scene['lpa_cockpit'] = [float(c) for c in spec.get('cockpit_m', [0.0, 1.0, 0.25 * float(spec['length_m'])])]
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
