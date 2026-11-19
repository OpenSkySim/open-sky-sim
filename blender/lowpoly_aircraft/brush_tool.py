"""Brush strokes: from the Hangar's Brush card into the builder.

    python3 brush_tool.py from-hangar DOCS.json --out examples/<id>/brush.json [--aircraft <id>]
        DOCS.json: the Hangar's db collection aircraft/<id>/brush (a list of docs, as Claude
        reads it with ArtifactData list, either {"id", "data"} rows or plain docs).
        Writes brush.json next to the spec, which the build applies (lpa/brush.py).
    python3 brush_tool.py list examples/<id>/brush.json
        The strokes in order: where, how far, which way.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from lpa import brush as B  # noqa: E402


def describe(s: dict) -> str:
    p = s['path']
    lo = [min(q[k] for q in p) for k in range(3)]
    hi = [max(q[k] for q in p) for k in range(3)]
    at = ' '.join(f'{"xyz"[k]} {lo[k]:.2f}' + (f'…{hi[k]:.2f}' if hi[k] - lo[k] > 0.005 else '') for k in range(3))
    v = s['vec']
    return (f'{s["id"] or "?":<14} r {s["radius"]:.2f}  move ({v[0]:+.3f}, {v[1]:+.3f}, {v[2]:+.3f}) m  {s["falloff"]}'
            + ('  mirrored' if s['mirror'] else '') + (f'  parts {", ".join(s["parts"])}' if s['parts'] else '')
            + f'  at {at} ({len(p)} pt)')


def cmd_from_hangar(a) -> None:
    with open(a.docs) as f:
        docs = json.load(f)
    if isinstance(docs, dict):
        docs = docs.get('docs') or docs.get('items') or list(docs.values())
    data = B.from_docs(docs, a.aircraft)
    with open(a.out, 'w') as f:
        json.dump(data, f, indent=1)
        f.write('\n')
    print(f'wrote {len(data["strokes"])} stroke(s) to {a.out}')
    for s in data['strokes']:
        print('  ' + describe(s))


def cmd_list(a) -> None:
    for s in B.load(a.file):
        print(describe(s))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    h = sub.add_parser('from-hangar', help='Hangar db docs -> brush.json')
    h.add_argument('docs')
    h.add_argument('--out', required=True)
    h.add_argument('--aircraft')
    h.set_defaults(fn=cmd_from_hangar)
    li = sub.add_parser('list', help='the strokes in a brush.json')
    li.add_argument('file')
    li.set_defaults(fn=cmd_list)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
