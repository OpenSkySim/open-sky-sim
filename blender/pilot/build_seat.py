"""Build the ejection seat under the pilot in pilot.blend (object "EjectionSeat").

Run from the repository root, then re-export with export_pilot.py:

    blender -b blender/pilot/pilot.blend -P blender/pilot/build_seat.py
    blender -b blender/pilot/pilot.blend -P blender/pilot/export_pilot.py

Re-running replaces the seat. Once it exists it can be edited by hand in the
.blend like the rest of the figure; this script is only how it was first made.

Same frame as the pilot: origin = eye point, -Y forward, +Z up, metres.
A slim, very low-poly seat in the Martin-Baker mould (about 50 triangles):
survival pack with yellow sides, one olive cushion folded from pan to back,
a grey back that tapers up to a plain box headrest, side walls as single sheets
sweeping up to the back, and a yellow firing loop between the legs. Faces
that sit against another part are left out. The materials are double-sided,
so a sheet is one face and shows from both sides.

The headbox stays below the helmet crown so the canopy fit in pilotFit.ts
(which only clears the helmet) still holds.
"""
import bmesh
import bpy

NAME = 'EjectionSeat'

# name -> viewport colour (the game draws the palette colour of the name).
MATERIALS = {
    'VEHICLE_PILOT_SEAT': (0.33, 0.35, 0.37, 1.0),
    'VEHICLE_PILOT_SEAT_CUSHION': (0.1, 0.12, 0.06, 1.0),
    'VEHICLE_PILOT_SEAT_HANDLE': (0.7, 0.45, 0.02, 1.0),
}
FRAME, CUSHION, YELLOW = 0, 1, 2

# Solids: material, side profile of (y, z, half width) points going round it,
# extruded across x about x = 0, and the indices of the side faces to leave
# out (side i runs from point i to point i + 1).
SOLIDS = [
    # Survival pack: only its front shows past the cushion and the back.
    (YELLOW, [(-0.33, -0.95, 0.2), (0.25, -0.95, 0.2), (0.25, -0.84, 0.2), (-0.35, -0.78, 0.2)], {0, 1, 2}),
    # One cushion, folded from the pan up the reclined back.
    (CUSHION, [(-0.335, -0.785, 0.18), (0.265, -0.85, 0.18), (0.318, -0.22, 0.16),
               (0.268, -0.22, 0.16), (0.218, -0.80, 0.18), (-0.345, -0.725, 0.18)], {0, 1}),
    # Back frame tapering into the headbox, top under the helmet crown.
    (FRAME, [(0.262, -1.0, 0.2), (0.33, -1.0, 0.2), (0.39, -0.2, 0.12), (0.30, -0.2, 0.12)], {0}),
    # Headrest: a plain box on top of the back, narrower than the helmet
    # (half width 0.117), top under the crown.
    (FRAME, [(0.30, -0.2, 0.085), (0.39, -0.2, 0.085), (0.39, 0.068, 0.085), (0.30, 0.068, 0.085)], {0}),
]

# Sheets: material, x, and a (y, z) outline in that plane.
WALL = [(-0.20, -0.985), (0.30, -1.0), (0.335, -0.60), (-0.05, -0.76), (-0.215, -0.80)]
SHEETS = [
    (FRAME, 0.21, WALL),
    (FRAME, -0.21, WALL),
]
# Firing loop: a sheet across the front of the pack.
LOOP = (YELLOW, [(-0.05, -0.37, -0.85), (0.05, -0.37, -0.85), (0.05, -0.37, -0.78), (-0.05, -0.37, -0.78)])


def material(name, colour):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = colour
    mat.use_backface_culling = False  # exported double-sided
    return mat


def build():
    old = bpy.data.objects.get(NAME)
    if old:
        mesh = old.data
        bpy.data.objects.remove(old)
        bpy.data.meshes.remove(mesh)

    bm = bmesh.new()

    def face(verts, mat_index):
        bm.faces.new(verts).material_index = mat_index

    for mat_index, profile, skip in SOLIDS:
        left = [bm.verts.new((-w, y, z)) for y, z, w in profile]
        right = [bm.verts.new((w, y, z)) for y, z, w in profile]
        face(left[::-1], mat_index)
        face(right, mat_index)
        n = len(profile)
        for i in range(n):
            if i not in skip:
                j = (i + 1) % n
                face([left[i], left[j], right[j], right[i]], mat_index)
    for mat_index, x, outline in SHEETS:
        face([bm.verts.new((x, y, z)) for y, z in outline], mat_index)
    mat_index, corners = LOOP
    face([bm.verts.new(c) for c in corners], mat_index)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    mesh = bpy.data.meshes.new(NAME)
    bm.to_mesh(mesh)
    bm.free()
    for name, colour in MATERIALS.items():
        mesh.materials.append(material(name, colour))
    obj = bpy.data.objects.new(NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


obj = build()
bpy.ops.wm.save_mainfile()
print('built', obj.name, len(obj.data.polygons), 'faces',
      sum(len(p.vertices) - 2 for p in obj.data.polygons), 'triangles')
