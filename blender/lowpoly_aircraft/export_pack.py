"""Re-export an edited .blend (made by build_aircraft.py) as an aircraft pack.

    blender -b my_plane.blend -P blender/lowpoly_aircraft/export_pack.py -- --out DIR

or open the .blend, load this file in the Text Editor and Run Script (writes
next to the .blend).
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import bpy  # noqa: E402

from lpa.export import export_pack  # noqa: E402


def main() -> None:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', help='output folder (default: the .blend\'s folder)')
    ap.add_argument('--no-pack', action='store_true')
    args = ap.parse_args(argv)
    out = args.out or os.path.dirname(bpy.data.filepath) or os.getcwd()
    manifest = export_pack(out, pack=not args.no_pack)
    print(f'[lpa] exported {manifest["id"]} to {out}')


if __name__ == '__main__':
    main()
