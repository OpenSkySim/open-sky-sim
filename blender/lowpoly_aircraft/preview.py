"""Render preview images of a built aircraft (.blend from build_aircraft.py).

    blender -b out/<id>.blend -P blender/lowpoly_aircraft/preview.py -- --out DIR
    python blender/lowpoly_aircraft/preview.py out/<id>.blend --out DIR   (bpy module)

Writes <id>_persp.png (three-quarter view, gear down) and <id>_top/side/front.png
(orthographic, same framing as a three-view drawing) so the model can be laid
over the drawing it came from.
"""
import argparse
import math
import os
import sys

import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

VIEWS = {
    # name: (camera direction in Blender coords, rotation euler)
    'persp': (None, None),
    'top': (Vector((0, 0, 1)), Euler((0, 0, 0))),
    'side': (Vector((-1, 0, 0)), Euler((math.pi / 2, 0, -math.pi / 2))),
    'front': (Vector((0, -1, 0)), Euler((math.pi / 2, 0, 0))),
}


def scene_bounds():
    pts = [o.matrix_world @ Vector(c) for o in bpy.context.scene.objects
           if o.type == 'MESH' and not o.hide_render for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def setup(size: int) -> None:
    """Cycles on the CPU (works headless without a GPU), flat colours, ink outlines."""
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 16
    sc.cycles.use_denoising = False
    sc.render.resolution_x = size
    sc.render.resolution_y = int(size * 0.66)
    sc.render.film_transparent = False
    sc.render.use_freestyle = True
    sc.render.line_thickness = 1.0
    sc.view_settings.view_transform = 'Standard'
    world = sc.world or bpy.data.worlds.new('World')
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.9, 0.92, 0.95, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sun = bpy.data.objects.new('PreviewSun', bpy.data.lights.new('PreviewSun', 'SUN'))
    sun.data.energy = 3.0
    sun.rotation_euler = Euler((math.radians(40), math.radians(15), math.radians(30)))
    sc.collection.objects.link(sun)
    for mat in bpy.data.materials:
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = mat.diffuse_color
            bsdf.inputs['Roughness'].default_value = 0.8
    c = bpy.data.collections.get('Shadow')
    if c:
        for o in c.objects:
            o.hide_render = True


def render(out_dir: str, aid: str, size: int) -> list[str]:
    sc = bpy.context.scene
    cam_data = bpy.data.cameras.new('PreviewCam')
    cam = bpy.data.objects.new('PreviewCam', cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    lo, hi = scene_bounds()
    center = (lo + hi) / 2
    extent = max((hi - lo).x, (hi - lo).y, (hi - lo).z)
    files = []
    for name, (direction, rot) in VIEWS.items():
        if direction is None:
            cam_data.type = 'PERSP'
            cam_data.lens = 50
            d = Vector((1.0, -1.25, 0.65)).normalized()
            cam.location = center + d * extent * 2.1
            cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
        else:
            cam_data.type = 'ORTHO'
            cam_data.ortho_scale = extent * 1.08
            cam.location = center + direction * extent * 3
            cam.rotation_euler = rot
        cam_data.clip_end = extent * 10
        path = os.path.join(out_dir, f'{aid}_{name}.png')
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        files.append(path)
    return files


def main() -> None:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument('blend', nargs='?')
    ap.add_argument('--out')
    ap.add_argument('--size', type=int, default=1200)
    args = ap.parse_args(argv)
    if args.blend:
        bpy.ops.wm.open_mainfile(filepath=args.blend)
    out = args.out or os.path.dirname(bpy.data.filepath)
    os.makedirs(out, exist_ok=True)
    aid = bpy.context.scene.get('lpa_id', 'aircraft')
    setup(args.size)
    for f in render(out, aid, args.size):
        print(f'[lpa] preview {f}')


if __name__ == '__main__':
    main()
