"""Refined cross-sections: from the Hangar's cross-section window into the builder.

    python3 sections_tool.py from-hangar DOCS.json --out examples/<id>/sections.json [--aircraft <id>]
        DOCS.json: the Hangar's db collection aircraft/<id>/sections (a list of docs, as
        Claude reads it with ArtifactData list, either {"id", "data"} rows or plain docs).
        Writes sections.json next to the spec, which the build picks up (lpa/sections.py).
    python3 sections_tool.py list examples/<id>/spec.json
        The spec's lofted parts with their station range, and the refined sections on each.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from lpa import sections as S  # noqa: E402

KEYS = ('part', 'z', 'd', 'pts', 'note')


def from_docs(docs, aircraft: str | None = None) -> dict:
    """Hangar docs -> sections.json content (removed docs dropped, sorted by part and station)."""
    out = []
    for row in docs:
        d = row.get('data', row) if isinstance(row, dict) else row
        if not isinstance(d, dict) or d.get('removed') or not d.get('part') or len(d.get('pts') or []) < 3:
            continue
        s = {k: d[k] for k in KEYS if d.get(k) is not None}
        s['z'] = round(float(s['z']), 4)
        s['pts'] = [[round(float(p[0]), 4), round(float(p[1]), 4), round(float(p[2]), 7)] for p in s['pts']]
        out.append(s)
    out.sort(key=lambda s: (s['part'], -s['z']))
    return {'aircraft': aircraft or (docs and isinstance(docs[0], dict) and (docs[0].get('data') or docs[0]).get('aircraft')) or None,
            'sections': out}


def cmd_from_hangar(a) -> None:
    with open(a.docs) as f:
        docs = json.load(f)
    if isinstance(docs, dict):
        docs = docs.get('docs') or docs.get('items') or list(docs.values())
    data = from_docs(docs, a.aircraft)
    with open(a.out, 'w') as f:
        json.dump(data, f, indent=1)
        f.write('\n')
    print(f'wrote {len(data["sections"])} section(s) to {a.out}')
    for s in data['sections']:
        print(f'  {s["part"]:<14} z {s["z"]:7.3f}' + (f'  (d {s["d"]:.2f} m aft of the nose)' if 'd' in s else '') + f'  {len(s["pts"])} points')


def cmd_list(a) -> None:
    with open(a.spec) as f:
        spec = json.load(f)
    spec_dir = os.path.dirname(os.path.abspath(a.spec))
    S.attach(spec, spec_dir)
    for p in spec.get('parts', []):
        if p.get('type') != 'loft':
            continue
        zs = [r[0] for r in p.get('stations', [])]
        secs = p.get('_sections', [])
        print(f'{p.get("name", "loft"):<16} z {min(zs):7.3f} … {max(zs):7.3f}  {int(p.get("segments", 24))} segments'
              + (f'  mirrored' if p.get('mirror') else '') + (f'  join {p["join"]}' if p.get('join') else ''))
        for s in secs:
            print(f'    section z {float(s["z"]):.3f}: {len(s["pts"])} points')


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    h = sub.add_parser('from-hangar', help='Hangar db docs -> sections.json')
    h.add_argument('docs')
    h.add_argument('--out', required=True)
    h.add_argument('--aircraft')
    h.set_defaults(fn=cmd_from_hangar)
    li = sub.add_parser('list', help="a spec's lofts and their refined sections")
    li.add_argument('spec')
    li.set_defaults(fn=cmd_list)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
