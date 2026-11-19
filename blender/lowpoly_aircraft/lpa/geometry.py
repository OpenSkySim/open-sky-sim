"""Blender geometry: visual hull from three silhouettes, cut into parts.

All maths is done in the sim's body frame (+X left, +Y up, +Z forward); the
glTF exporter's +Y-up conversion maps Blender (x, y, z) to glTF (x, z, -y), so
a body point is placed in Blender at (x, -z, y). See :func:`to_bl`.
"""
from __future__ import annotations

import math

import bmesh  # type: ignore
import bpy  # type: ignore
import numpy as np
from mathutils import Matrix, Vector  # type: ignore
from mathutils.bvhtree import BVHTree  # type: ignore

from .views import View, view_point_3d

EXTRUDE = 200.0  # half-depth of a silhouette prism (m); longer than any aircraft


def to_bl(p) -> Vector:
    return Vector((p[0], -p[2], p[1]))


def from_bl(v) -> tuple[float, float, float]:
    return (v[0], v[2], -v[1])


def get_material(name: str) -> bpy.types.Material:
    """Material whose *name* the sim reads (a PaletteCategory or '#rrggbb')."""
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        preview = {
            'GLASS': (0.1, 0.12, 0.15, 1.0),
            'SCENERY_TREE_SHADOW': (0.0, 0.0, 0.0, 1.0),
            'VEHICLE_PLANE_ENGINE': (0.12, 0.12, 0.12, 1.0),
            'VEHICLE_PLANE_INTERIOR': (0.3, 0.3, 0.3, 1.0),
        }.get(name)
        if name.startswith('#') and len(name) == 7:
            preview = tuple(int(name[i:i + 2], 16) / 255 for i in (1, 3, 5)) + (1.0,)
        mat.diffuse_color = preview or (0.55, 0.57, 0.6, 1.0)
    return mat


def _link(obj: bpy.types.Object, collection: str) -> bpy.types.Object:
    coll = bpy.data.collections.get(collection)
    if coll is None:
        coll = bpy.data.collections.new(collection)
        bpy.context.scene.collection.children.link(coll)
    coll.objects.link(obj)
    return obj


def prism(name: str, view: str, loops_body2: list[np.ndarray], collection: str = 'Construction',
          depth: tuple[float, float] = (-EXTRUDE, EXTRUDE)) -> bpy.types.Object:
    """Silhouette loops extruded along the view's line of sight (through everything by default)."""
    bm = bmesh.new()
    for loop in loops_body2:
        lo, hi = [], []
        for ab in loop:
            lo.append(bm.verts.new(to_bl(view_point_3d(view, ab, depth[0]))))
            hi.append(bm.verts.new(to_bl(view_point_3d(view, ab, depth[1]))))
        n = len(loop)
        try:
            bm.faces.new(lo)
            bm.faces.new(list(reversed(hi)))
        except ValueError:
            continue
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    _link(obj, collection)
    obj.hide_render = True
    return obj


def boolean(target: bpy.types.Object, operand: bpy.types.Object, op: str, solver: str = 'EXACT') -> None:
    """Apply a boolean in place (INTERSECT / DIFFERENCE / UNION); exact by default."""
    mod = target.modifiers.new('bool', 'BOOLEAN')
    mod.operation = op
    mod.solver = solver
    mod.object = operand
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    evaluated = target.evaluated_get(deps)
    new_mesh = bpy.data.meshes.new_from_object(evaluated)
    target.modifiers.remove(mod)
    old = target.data
    target.data = new_mesh
    new_mesh.name = old.name
    bpy.data.meshes.remove(old)


def copy_object(src: bpy.types.Object, name: str, collection: str) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, src.data.copy())
    obj.data.name = name
    _link(obj, collection)
    return obj


def tidy(obj: bpy.types.Object, material: str, smooth_deg: float | None = None) -> None:
    """Merge slivers, flatten coplanar faces, triangulate, assign the sim material.

    Flat-shaded by default; with *smooth_deg* the faces are smooth-shaded and
    only edges sharper than that angle stay hard (wing edges, fin roots).
    """
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-4)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5 if smooth_deg else 1.0),
                             verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces, ngon_method='BEAUTY')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if smooth_deg:
        limit = math.radians(smooth_deg)
        for e in bm.edges:
            e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0.0) > limit)
        for f in bm.faces:
            f.smooth = True
    else:
        for f in bm.faces:
            f.smooth = False
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.materials.clear()
    obj.data.materials.append(get_material(material))


def is_empty(obj: bpy.types.Object) -> bool:
    return len(obj.data.polygons) == 0


def bounds_body(obj: bpy.types.Object) -> tuple[np.ndarray, np.ndarray]:
    """World-space bounds in body frame (min, max)."""
    pts = np.array([from_bl(obj.matrix_world @ v.co) for v in obj.data.vertices])
    return pts.min(axis=0), pts.max(axis=0)


def set_origin(obj: bpy.types.Object, pivot_body) -> None:
    """Move the object origin to a body-frame point, keeping the mesh in place."""
    pv = to_bl(pivot_body)
    offset = pv - obj.location
    obj.data.transform(Matrix.Translation(-offset))
    obj.location = pv


def visual_hull(views: dict[str, View]) -> bpy.types.Object:
    from .views import depth_range
    prisms = {}
    for name in ('top', 'side', 'front'):
        p = prism(f'Prism_{name}', name, views[name].loops_body2())
        for i, (outline_px, shape) in enumerate(views[name].extras):
            extra = prism(f'Prism_{name}_extra{i}', name, [views[name].to_body2(outline_px)],
                          depth=depth_range(views, shape))
            boolean(p, extra, 'UNION')
            bpy.data.objects.remove(extra)
        prisms[name] = p
    hull = prisms['top']
    hull.name = 'Hull'
    hull.hide_render = False
    for name in ('side', 'front'):
        boolean(hull, prisms[name], 'INTERSECT')
        bpy.data.objects.remove(prisms[name])
    return hull


def _off_skin_faces(bm, skin: BVHTree, tol: float):
    return [f for f in bm.faces if skin.find_nearest(f.calc_center_median())[3] > tol]


def keep_skin(part: bpy.types.Object, skin: BVHTree, tol: float = 0.015):
    """Reduce a cut-out part to its outer skin (a pane, not a block); returns its bounds (body frame)."""
    bm = bmesh.new()
    bm.from_mesh(part.data)
    bm.transform(part.matrix_world)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.delete(bm, geom=_off_skin_faces(bm, skin, tol), context='FACES')
    bm.transform(part.matrix_world.inverted())
    bm.to_mesh(part.data)
    bm.free()
    return bounds_body(part)


def drop_off_skin(obj: bpy.types.Object, skin: BVHTree, cutter: BVHTree, tol: float = 0.015) -> None:
    """Delete the faces of *obj* that lie on *cutter*'s surface but not on *skin* (cut walls)."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    doomed = [f for f in _off_skin_faces(bm, skin, tol)
              if all(cutter.find_nearest(p)[3] < tol
                     for p in [f.calc_center_median()] + [v.co for v in f.verts])]
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.transform(obj.matrix_world.inverted())
    bm.to_mesh(obj.data)
    bm.free()


def symmetrize(obj: bpy.types.Object) -> None:
    """Make a mesh exactly symmetric about the body's X: its left half (+X) mirrored onto the right."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.symmetrize(bm, input=bm.verts[:] + bm.edges[:] + bm.faces[:], direction='-X', dist=1e-4)
    bm.to_mesh(obj.data)
    bm.free()


def decimate(obj: bpy.types.Object, ratio: float = 1.0, planar_deg: float = 0.0) -> None:
    """Decimate a mesh in place: merge near-flat faces (within *planar_deg*), else collapse to
    *ratio* of its faces symmetric about the body's X."""
    if planar_deg <= 0:
        # The collapse only stays symmetric on a mesh whose two halves match vertex for vertex;
        # a boolean-joined hull does not, so mirror its left half (+X) onto the right first.
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.symmetrize(bm, input=bm.verts[:] + bm.edges[:] + bm.faces[:], direction='-X', dist=1e-4)
        bm.to_mesh(obj.data)
        bm.free()
    mod = obj.modifiers.new('decimate', 'DECIMATE')
    if planar_deg > 0:
        mod.decimate_type = 'DISSOLVE'
        mod.angle_limit = math.radians(planar_deg)
    else:
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = ratio
        mod.use_symmetry = True
        mod.symmetry_axis = 'X'
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    new_mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(deps))
    obj.modifiers.remove(mod)
    old = obj.data
    obj.data = new_mesh
    new_mesh.name = old.name
    bpy.data.meshes.remove(old)


def bvh_of(obj: bpy.types.Object) -> BVHTree:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    tree = BVHTree.FromBMesh(bm)
    bm.free()
    return tree


def underside_y(tree: BVHTree, x: float, z: float, y_from: float) -> float | None:
    """Body y of the first surface hit straight up from (x, y_from, z)."""
    hit = tree.ray_cast(to_bl((x, y_from, z)), Vector((0, 0, 1)))
    if hit[0] is None:
        return None
    return from_bl(hit[0])[1]


def cut_part(hull: bpy.types.Object, name: str, view: str, poly_body2: np.ndarray,
             material: str, collection: str, depth=(-EXTRUDE, EXTRUDE),
             smooth_deg: float | None = None, cutters: list | None = None,
             clip: tuple[str, list] | None = None) -> bpy.types.Object | None:
    """Split the region under a view polygon (or a list of polygons) off the hull; returns the part (or None).

    With *clip* (view, polygons) the region is also limited to those polygons seen in
    that view. With *cutters* (a list) the cutter's surface is appended to it as a BVH tree: the walls
    the cut leaves in the hull lie on it (see drop_off_skin).
    """
    loops = poly_body2 if isinstance(poly_body2, list) else [poly_body2]
    cutter = prism(f'Cut_{name}', view, loops, depth=depth)
    if clip is not None:
        # Shaped in a second view as well: the cutter is the overlap of both prisms.
        clip_view, clip_loops = clip
        other = prism(f'Clip_{name}', clip_view, clip_loops)
        boolean(cutter, other, 'INTERSECT')
        bpy.data.objects.remove(other)
    part = copy_object(hull, name, collection)
    solver = 'EXACT'
    boolean(part, cutter, 'INTERSECT')
    if is_empty(part):
        # The exact solver now and then returns nothing for a valid cut (seen on one flap after
        # unrelated parts changed); the manifold solver does it, the hull being closed.
        bpy.data.objects.remove(part)
        part = copy_object(hull, name, collection)
        solver = 'MANIFOLD'
        boolean(part, cutter, 'INTERSECT', solver=solver)
        if not is_empty(part):
            print(f'[lpa] {name}: exact boolean came back empty, used the manifold solver')
    if is_empty(part):
        bpy.data.objects.remove(cutter)
        bpy.data.objects.remove(part)
        return None
    if cutters is not None:
        cutters.append(bvh_of(cutter))
    boolean(hull, cutter, 'DIFFERENCE', solver=solver)
    bpy.data.objects.remove(cutter)
    tidy(part, material, smooth_deg)
    return part


def recess(hull: bpy.types.Object, cutter: bpy.types.Object, name: str, material: str,
           collection: str, inset: float = 0.012):
    """Sink a well (wheel bay) into the hull with *cutter*; returns (lining, skin) (either may be None).

    The hull keeps the cavity walls; the lining is the cutter's own skin inside the
    hull, pulled *inset* inwards and facing into the well, so the well reads dark
    while the body keeps one material. The skin is the patch of hull surface the
    well removes (hidden, in Construction): doors cut from it close flush. The
    cutter is consumed.
    """
    skin_patch = copy_object(hull, f'{name}_Skin', 'Construction')
    outer = bvh_of(hull)
    boolean(skin_patch, cutter, 'INTERSECT')
    bm = bmesh.new()
    bm.from_mesh(skin_patch.data)
    bmesh.ops.triangulate(bm, faces=bm.faces)  # loft quads are not planar: test triangle centres
    inner = [f for f in bm.faces if outer.find_nearest(f.calc_center_median())[3] > 0.015]
    bmesh.ops.delete(bm, geom=inner, context='FACES')
    bm.to_mesh(skin_patch.data)
    bm.free()
    skin_patch.hide_render = True
    if is_empty(skin_patch):
        bpy.data.objects.remove(skin_patch)
        skin_patch = None
    liner = copy_object(cutter, name, collection)
    bm = bmesh.new()
    bm.from_mesh(liner.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    for v in bm.verts:
        v.co -= v.normal * inset
    bm.to_mesh(liner.data)
    bm.free()
    skin = BVHTree.FromObject(liner, bpy.context.evaluated_depsgraph_get())
    boolean(liner, hull, 'INTERSECT')
    boolean(hull, cutter, 'DIFFERENCE')
    bpy.data.objects.remove(cutter)
    # Keep only the lining walls: drop the faces that lie on the hull's outer skin.
    bm = bmesh.new()
    bm.from_mesh(liner.data)
    off = [f for f in bm.faces if skin.find_nearest(f.calc_center_median())[3] > 1e-3]
    bmesh.ops.delete(bm, geom=off, context='FACES')
    bm.to_mesh(liner.data)
    bm.free()
    if is_empty(liner):
        bpy.data.objects.remove(liner)
        return None, skin_patch
    tidy(liner, material)
    # tidy cannot orient an open shell: point every face into the well.
    centre = sum((v.co for v in liner.data.vertices), Vector()) / len(liner.data.vertices)
    bm = bmesh.new()
    bm.from_mesh(liner.data)
    bm.normal_update()
    flip = [f for f in bm.faces if f.normal.dot(f.calc_center_median() - centre) > 0]
    bmesh.ops.reverse_faces(bm, faces=flip)
    bm.to_mesh(liner.data)
    bm.free()
    return liner, skin_patch


def skin_door(name: str, skin_patch: bpy.types.Object, split_x: float, side: float,
              collection: str, thickness: float = 0.025) -> bpy.types.Object | None:
    """One half of a well's skin patch (the +X half for side +1) as a door, closed and flush.

    The half is given *thickness* inwards; its origin sits on its outer edge (the hinge).
    """
    obj = copy_object(skin_patch, name, collection)
    obj.hide_render = False
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=to_bl((split_x, 0.0, 0.0)),
                           plane_no=to_bl((1.0, 0.0, 0.0)), clear_inner=side > 0, clear_outer=side < 0)
    bm.to_mesh(obj.data)
    bm.free()
    if is_empty(obj):
        bpy.data.objects.remove(obj)
        return None
    pts = np.array([from_bl(v.co) for v in obj.data.vertices])
    edge_x = pts[:, 0].max() if side > 0 else pts[:, 0].min()
    rim = pts[np.abs(pts[:, 0] - edge_x) < 0.03]
    mod = obj.modifiers.new('solid', 'SOLIDIFY')
    mod.thickness = thickness
    mod.offset = -1.0
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    new_mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(deps))
    obj.modifiers.remove(mod)
    old = obj.data
    obj.data = new_mesh
    new_mesh.name = name
    bpy.data.meshes.remove(old)
    tidy(obj, 'VEHICLE_PLANE_GREY')
    set_origin(obj, (float(edge_x), float(rim[:, 1].mean()), float(rim[:, 2].mean())))
    return obj


def flat_shape(name: str, loops_body2: list[np.ndarray], material: str, collection: str) -> bpy.types.Object:
    """Top-view outline as a flat polygon on y = 0 (the ground shadow)."""
    bm = bmesh.new()
    for loop in loops_body2:
        vs = [bm.verts.new(to_bl((a, 0.0, b))) for a, b in loop]
        try:
            bm.faces.new(vs)
        except ValueError:
            pass
    bmesh.ops.triangulate(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(get_material(material))
    return _link(obj, collection)


def cylinder_x(bm, center, radius: float, width: float, sides: int = 8):
    """Wheel: an n-gon prism with its axle along body X."""
    cx, cy, cz = center
    left, right = [], []
    for i in range(sides):
        t = 2 * math.pi * (i + 0.5) / sides
        y, z = cy + radius * math.cos(t), cz + radius * math.sin(t)
        left.append(bm.verts.new(to_bl((cx + width / 2, y, z))))
        right.append(bm.verts.new(to_bl((cx - width / 2, y, z))))
    faces = [bm.faces.new(left), bm.faces.new(list(reversed(right)))]
    for i in range(sides):
        j = (i + 1) % sides
        faces.append(bm.faces.new((left[i], right[i], right[j], left[j])))
    return faces


def box(bm, lo, hi):
    """Axis-aligned box between two body-frame corners."""
    xs, ys, zs = (lo[0], hi[0]), (lo[1], hi[1]), (lo[2], hi[2])
    v = {}
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            for k, z in enumerate(zs):
                v[i, j, k] = bm.verts.new(to_bl((x, y, z)))
    quads = [((0, 0, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1)), ((1, 0, 0), (1, 0, 1), (1, 1, 1), (1, 1, 0)),
             ((0, 0, 0), (0, 0, 1), (1, 0, 1), (1, 0, 0)), ((0, 1, 0), (1, 1, 0), (1, 1, 1), (0, 1, 1)),
             ((0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)), ((0, 0, 1), (0, 1, 1), (1, 1, 1), (1, 0, 1))]
    return [bm.faces.new([v[c] for c in q]) for q in quads]


TYRE = '#1e1e1e'


def gear_leg(name: str, top, wheel_bottom, wheel_radius: float, wheel_width: float,
             collection: str, wheel_sides: int = 8, twin: bool = False) -> list[bpy.types.Object]:
    """One leg as three objects (strut, tyre, hub), all with their origin at the strut's top.

    The sim animates a gear mesh by its own name, so every animated object
    must stay one mesh with one material; strut and wheel are kept apart.
    *twin* puts two wheels side by side on one axle (both in the wheel mesh).
    """
    x, y_top, z = top
    axle_y = wheel_bottom[1] + wheel_radius
    strut = max(0.04, wheel_radius * 0.35)
    offsets = (-0.6 * wheel_width - strut / 2, 0.6 * wheel_width + strut / 2) if twin else (0.0,)
    parts = []
    for suffix, material, build in (
        ('Strut', 'VEHICLE_PLANE_GREY',
         lambda bm: box(bm, (x - strut / 2, axle_y, z - strut / 2), (x + strut / 2, y_top, z + strut / 2))),
        # Black tyre with a grey hub standing slightly proud of it on both faces, so the tyre reads as a ring.
        ('Wheel', TYRE,
         lambda bm: [cylinder_x(bm, (x + dx, axle_y, z), wheel_radius, wheel_width, sides=wheel_sides)
                     for dx in offsets]),
        ('Hub', 'VEHICLE_PLANE_GREY',
         lambda bm: [cylinder_x(bm, (x + dx, axle_y, z), 0.6 * wheel_radius, wheel_width + 0.03,
                                sides=max(6, wheel_sides - 2)) for dx in offsets]),
    ):
        bm = bmesh.new()
        build(bm)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(f'{name}_{suffix}')
        bm.to_mesh(me)
        bm.free()
        me.materials.append(get_material(material))
        obj = bpy.data.objects.new(f'{name}_{suffix}', me)
        _link(obj, collection)
        set_origin(obj, top)
        parts.append(obj)
    return parts


def leg_door(name: str, top, offset: float, width: float, length: float, collection: str,
             thickness: float = 0.03) -> bpy.types.Object:
    """A door plate carried by a gear leg, standing *offset* ahead (+) or behind (-) the strut.

    It hangs from just below the pivot down *length* metres and is *width* wide, so when the
    leg swings 90 deg fore or aft the plate lies flat under the well and closes it. Its origin
    is the strut's top, like the leg's own parts, so it takes the leg's animation unchanged.
    """
    x, y_top, z = top
    zc = z + offset
    bm = bmesh.new()
    box(bm, (x - width / 2, y_top - length, zc - thickness / 2), (x + width / 2, y_top - 0.05, zc + thickness / 2))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(f'{name}_Door')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(get_material('VEHICLE_PLANE_GREY'))
    obj = bpy.data.objects.new(f'{name}_Door', me)
    _link(obj, collection)
    set_origin(obj, top)
    return obj


def gear_door(name: str, hinge_x: float, hinge_y: float, z0: float, z1: float, height: float,
              collection: str, thickness: float = 0.03, chamfer: float = 0.12) -> bpy.types.Object:
    """A thin gear door hanging straight down from a fore-and-aft hinge line (its open pose).

    The plate runs from z0 to z1 along the hinge and *height* downwards; its lower
    corners are cut back by *chamfer* so it reads as a door, not a slab. The origin
    sits on the hinge so the door can swing shut about body Z.
    """
    za, zb = min(z0, z1), max(z0, z1)
    c = min(chamfer, 0.4 * height, 0.25 * (zb - za))
    outline = [(za, 0.0), (zb, 0.0), (zb, -height + c), (zb - c, -height), (za + c, -height), (za, -height + c)]
    bm = bmesh.new()
    rings = []
    for dx in (-thickness / 2, thickness / 2):
        rings.append([bm.verts.new(to_bl((hinge_x + dx, hinge_y + dy, z))) for z, dy in outline])
    a, b = rings
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(get_material('VEHICLE_PLANE_GREY'))
    obj = bpy.data.objects.new(name, me)
    _link(obj, collection)
    set_origin(obj, (hinge_x, hinge_y, 0.5 * (za + zb)))
    return obj


def disc(name: str, center, radius: float, normal_axis: str, material: str, collection: str,
         sides: int = 12, thickness: float = 0.06) -> bpy.types.Object:
    """A thin n-gon disc (a propeller's blur) facing along a body axis."""
    bm = bmesh.new()
    cx, cy, cz = center
    a, b = [], []
    for i in range(sides):
        t = 2 * math.pi * (i + 0.5) / sides
        u, v = radius * math.cos(t), radius * math.sin(t)
        if normal_axis == 'z':
            p0, p1 = (cx + u, cy + v, cz - thickness / 2), (cx + u, cy + v, cz + thickness / 2)
        else:
            p0, p1 = (cx - thickness / 2, cy + u, cz + v), (cx + thickness / 2, cy + u, cz + v)
        a.append(bm.verts.new(to_bl(p0)))
        b.append(bm.verts.new(to_bl(p1)))
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(get_material(material))
    obj = bpy.data.objects.new(name, me)
    return _link(obj, collection)


def flatten_panes(obj: bpy.types.Object, angle_deg: float = 1.0) -> None:
    """Merge coplanar faces and drop vertices on straight edges, then triangulate (BEAUTY)."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-4)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(angle_deg), use_dissolve_boundaries=True,
                             verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
    bm.to_mesh(obj.data)
    bm.free()


def merge_flat_in_box(obj: bpy.types.Object, lo, hi, angle_deg: float = 10.0, relax: int = 0) -> None:
    """Dissolve near-flat edges whose both ends lie in the body-frame box [lo, hi], then
    triangulate the merged faces evenly (BEAUTY). With *relax*, the box's inner vertices are
    first smoothed that many times (Taubin, volume-keeping) to even out bumpy facets."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    lo, hi = np.asarray(lo, float), np.asarray(hi, float)
    inside = lambda v: bool(np.all(np.asarray(from_bl(v.co)) >= lo) and np.all(np.asarray(from_bl(v.co)) <= hi))
    if relax:
        inner = [v for v in bm.verts if not v.is_boundary and all(inside(w) for e in v.link_edges for w in e.verts)]
        # Taubin smoothing: a shrink step and an inflate step, so the surface does not cave in.
        for _ in range(int(relax)):
            for fac in (0.5, -0.53):
                bmesh.ops.smooth_vert(bm, verts=inner, factor=fac, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    verts = [v for v in bm.verts if inside(v) and not v.is_boundary]
    edges = [e for e in bm.edges if all(inside(v) for v in e.verts) and not e.is_boundary]
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(angle_deg), use_dissolve_boundaries=False,
                             verts=verts, edges=edges)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3],
                          quad_method='BEAUTY', ngon_method='BEAUTY')
    bm.to_mesh(obj.data)
    bm.free()
