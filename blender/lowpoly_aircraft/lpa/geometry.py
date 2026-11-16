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


def boolean(target: bpy.types.Object, operand: bpy.types.Object, op: str) -> None:
    """Apply an exact boolean in place (INTERSECT / DIFFERENCE / UNION)."""
    mod = target.modifiers.new('bool', 'BOOLEAN')
    mod.operation = op
    mod.solver = 'EXACT'
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


def tidy(obj: bpy.types.Object, material: str) -> None:
    """Merge slivers, flatten coplanar faces, flat-shade, assign the sim material."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-4)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    for p in obj.data.polygons:
        p.use_smooth = False
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
             material: str, collection: str, depth=(-EXTRUDE, EXTRUDE)) -> bpy.types.Object | None:
    """Split the region under a view polygon off the hull; returns the part (or None)."""
    cutter = prism(f'Cut_{name}', view, [poly_body2], depth=depth)
    part = copy_object(hull, name, collection)
    boolean(part, cutter, 'INTERSECT')
    if is_empty(part):
        bpy.data.objects.remove(cutter)
        bpy.data.objects.remove(part)
        return None
    boolean(hull, cutter, 'DIFFERENCE')
    bpy.data.objects.remove(cutter)
    tidy(part, material)
    return part


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


def gear_leg(name: str, top, wheel_bottom, wheel_radius: float, wheel_width: float,
             collection: str) -> list[bpy.types.Object]:
    """One leg as two objects (strut, wheel), both with their origin at the strut's top.

    The sim animates a gear mesh by its own name, so every animated object
    must stay one mesh with one material; strut and wheel are kept apart.
    """
    x, y_top, z = top
    axle_y = wheel_bottom[1] + wheel_radius
    strut = max(0.04, wheel_radius * 0.35)
    parts = []
    for suffix, material, build in (
        ('Strut', 'VEHICLE_PLANE_GREY',
         lambda bm: box(bm, (x - strut / 2, axle_y, z - strut / 2), (x + strut / 2, y_top, z + strut / 2))),
        ('Wheel', 'VEHICLE_PLANE_ENGINE',
         lambda bm: cylinder_x(bm, (x, axle_y, z), wheel_radius, wheel_width)),
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
