"""Build a low-poly aircraft pack from a three-view drawing and a JSON spec.

Headless:
    blender -b -P blender/lowpoly_aircraft/build_aircraft.py -- path/to/spec.json [--out DIR] [--no-pack]
or with the `bpy` module from PyPI:
    python blender/lowpoly_aircraft/build_aircraft.py path/to/spec.json

In Blender's Text Editor: open this file, set SPEC below, press Run Script.
The scene stays open for editing; re-export with export_pack.py.

When the spec names its reference set ("refs": "refs.json", relative to the spec), the
build ends with the coverage of the 50 key areas and the deviation check: how far the
model's outline lies from each marked outline area, per view (over 10 cm is flagged).
The check is also written to <id>_refs_check.json next to the pack, which
viewer/add_model.py hands to the Hangar.

Refined cross-sections drawn in the Hangar's cross-section window go into sections.json
next to the spec (lpa/sections.py; sections_tool.py from-hangar writes it). The build
also writes <id>_lofts.json: every lofted part's rings, so the Hangar can show and edit them.
"""
import argparse
import json
import os
import sys

SPEC = ''  # used when run from Blender's Text Editor without arguments

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from lpa.build import build  # noqa: E402
from lpa.export import export_pack  # noqa: E402

import bpy  # noqa: E402
import numpy as np  # noqa: E402

from lpa import from_refs as F  # noqa: E402
from lpa import refs as R  # noqa: E402
from lpa import sections  # noqa: E402
from lpa.geometry import from_bl  # noqa: E402


def model_triangles() -> tuple[np.ndarray, list[str]]:
    """Triangles (n, 3, 3) of body, control surfaces and gear in the body frame, gear down; with each one's object name."""
    ends = [o.animation_data.action.frame_range[1] for o in bpy.data.objects
            if o.animation_data and o.animation_data.action]
    if ends:
        bpy.context.scene.frame_set(int(max(ends)))
    dg = bpy.context.evaluated_depsgraph_get()
    tris, names = [], []
    for coll in ('Body', 'Surfaces', 'Gear'):
        c = bpy.data.collections.get(coll)
        for o in (c.objects if c else []):
            if o.type != 'MESH':
                continue
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()
            me.calc_loop_triangles()
            mw = ev.matrix_world
            vs = np.array([from_bl(mw @ v.co) for v in me.vertices])
            idx = np.array([t.vertices[:] for t in me.loop_triangles], dtype=int).reshape(-1, 3)
            if len(idx):
                tris.append(vs[idx])
                names += [o.name] * len(idx)
            ev.to_mesh_clear()
    return (np.concatenate(tris) if tris else np.zeros((0, 3, 3))), names


def refs_check(spec_path: str, out: str, aid: str) -> None:
    with open(spec_path) as f:
        spec = json.load(f)
    if not spec.get('refs'):
        return
    rs = R.load(os.path.join(os.path.dirname(os.path.abspath(spec_path)), spec['refs']))
    tris, names = model_triangles()
    # The drawing's nose tip sits on the model's (the radome, not a pitot probe), as in the Hangar.
    keep = np.array([not any(k in n.lower() for k in ('pitot', 'probe', 'boom')) for n in names], bool)
    v = tris[keep].reshape(-1, 3)
    tip = v[int(np.argmax(v[:, 2]))]
    fr = F.Frame(nose_z=float(tip[2]), nose_y=float(tip[1]))
    # The drawings' own outlines tell which parts of a mark follow the outline (images are
    # looked up next to refs.json or in the spec's "refs_images" folder).
    from lpa import silhouette as sil
    folder = os.path.join(os.path.dirname(os.path.abspath(spec_path)), spec.get('refs_images', os.path.dirname(spec['refs'])))
    masks = {}
    for img in rs.images:
        path = os.path.join(folder, img.get('file') or '')
        if img.get('file') and os.path.exists(path):
            masks[img['id']] = sil.ink_mask(sil.load_rgba(path), 0.5)
    devs = F.deviations(tris, rs, fr, outlines=F.drawing_outlines(rs, masks))
    if not masks:
        print('[lpa] reference images not found: every mark point is checked, also those off the outline')
    print(F.report(rs, devs))
    with open(os.path.join(out, f'{aid}_refs_check.json'), 'w') as f:
        json.dump({'aircraft': aid, 'tolerance_m': F.TOLERANCE_M, 'nose_m': [fr.nose_y, fr.nose_z], 'deviations': devs}, f, indent=1)


def main() -> None:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if bpy.app.background is False and not argv and SPEC:
        argv = [SPEC]
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('spec')
    ap.add_argument('--out', help='output folder (default: build/<id> next to the spec)')
    ap.add_argument('--no-pack', action='store_true', help='skip the .aircraft.pack zip')
    ap.add_argument('--no-blend', action='store_true', help='skip saving the .blend')
    ap.add_argument('--number', help='side number for the spec\'s text decals (digits), e.g. 21')
    ap.add_argument('--number-color', help='colour of the side number, #rrggbb')
    args = ap.parse_args(argv)
    from lpa import paint
    paint.TEXT_OVERRIDE.update({k: v for k, v in (('text', args.number), ('color', args.number_color)) if v})

    build(args.spec)
    aid = bpy.context.scene['lpa_id']
    out = args.out or os.path.join(os.path.dirname(os.path.abspath(args.spec)), 'build', aid)
    manifest = export_pack(out, pack=not args.no_pack)
    if not args.no_blend:
        blend = os.path.join(out, f'{aid}.blend')
        if os.path.exists(blend):
            os.remove(blend)  # no .blend1 backups next to the pack
        bpy.ops.wm.save_as_mainfile(filepath=blend)
    print(f'[lpa] wrote {out}: {len(manifest["surfaces"])} surfaces, gear={"yes" if manifest["gear"] else "no"}')
    if sections.LOG:
        sections.write_log(os.path.join(out, f'{aid}_lofts.json'), aid, bpy.context.scene.get('lpa_shift', [0.0, 0.0, 0.0]))
    refs_check(args.spec, out, aid)


if __name__ == '__main__':
    main()
