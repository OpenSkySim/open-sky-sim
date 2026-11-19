#!/usr/bin/env python3
"""Turn the Hangar's Paint card into paint.json for the build (no Blender needed).

    python3 paint_tool.py from-hangar DOCS.json --base examples/<id>/paint.json --out examples/<id>/paint.json

DOCS.json is the Hangar db collection aircraft/<id>/paint as a list of {"id", "data"} (or
{id: data}). Shapes with ids r0, r1 … edit the built-in shapes of --base by position; a doc
{"removed": true} drops one; other ids are new shapes. A doc "base" sets the base colour.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def merge(base: dict, docs: dict) -> dict:
    regions = {}
    for i, r in enumerate(base.get('regions', [])):
        regions[r.get('id', f'r{i}')] = dict(r)
    for did, d in sorted(docs.items(), key=lambda kv: str(kv[1].get('t', ''))):
        if did == 'base':
            continue
        regions[did] = {**regions.get(did, {}), **d}
    out = {k: v for k, v in base.items() if k != 'regions'}
    if 'base' in docs and docs['base'].get('base'):
        out['base'] = docs['base']['base']
    out['regions'] = []
    for r in regions.values():
        if r.get('removed') or len(r.get('pts') or []) < 3:
            continue
        out['regions'].append({'view': r['view'], 'color': r['color'], 'mirror': r.get('mirror', True) is not False,
                               'pts': [[round(float(a), 3), round(float(b), 3)] for a, b in r['pts']]})
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    fh = sub.add_parser('from-hangar')
    fh.add_argument('docs', type=Path)
    fh.add_argument('--base', type=Path)
    fh.add_argument('--out', type=Path, required=True)
    a = ap.parse_args()
    raw = json.loads(a.docs.read_text())
    docs = {d['id']: d.get('data', d) for d in raw} if isinstance(raw, list) else raw
    base = json.loads(a.base.read_text()) if a.base and a.base.exists() else {}
    out = merge(base, docs)
    a.out.write_text(json.dumps(out, indent=1) + '\n')
    print(f'{a.out}: {len(out["regions"])} shapes')


if __name__ == '__main__':
    main()
