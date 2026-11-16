"""Build a low-poly aircraft pack from a three-view drawing and a JSON spec.

Headless:
    blender -b -P blender/lowpoly_aircraft/build_aircraft.py -- path/to/spec.json [--out DIR] [--no-pack]
or with the `bpy` module from PyPI:
    python blender/lowpoly_aircraft/build_aircraft.py path/to/spec.json

In Blender's Text Editor: open this file, set SPEC below, press Run Script.
The scene stays open for editing; re-export with export_pack.py.
"""
import argparse
import os
import sys

SPEC = ''  # used when run from Blender's Text Editor without arguments

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from lpa.build import build  # noqa: E402
from lpa.export import export_pack  # noqa: E402

import bpy  # noqa: E402


def main() -> None:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if bpy.app.background is False and not argv and SPEC:
        argv = [SPEC]
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('spec')
    ap.add_argument('--out', help='output folder (default: build/<id> next to the spec)')
    ap.add_argument('--no-pack', action='store_true', help='skip the .aircraft.pack zip')
    ap.add_argument('--no-blend', action='store_true', help='skip saving the .blend')
    args = ap.parse_args(argv)

    build(args.spec)
    aid = bpy.context.scene['lpa_id']
    out = args.out or os.path.join(os.path.dirname(os.path.abspath(args.spec)), 'build', aid)
    manifest = export_pack(out, pack=not args.no_pack)
    if not args.no_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f'{aid}.blend'))
    print(f'[lpa] wrote {out}: {len(manifest["surfaces"])} surfaces, gear={"yes" if manifest["gear"] else "no"}')


if __name__ == '__main__':
    main()
