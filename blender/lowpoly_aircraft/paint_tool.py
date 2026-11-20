#!/usr/bin/env python3
"""Turn the Hangar's Paint card into paint.json for the build (no Blender needed).

    python3 paint_tool.py from-hangar DOCS.json --base examples/<id>/paint.json --out examples/<id>/paint.json

DOCS.json is the Hangar db collection aircraft/<id>/paint as a list of {"id", "data"} (or
{id: data}). Shapes with ids r0, r1 … edit the built-in shapes of --base by position; a doc
{"removed": true} drops one; other ids are new shapes. A doc "base" sets the base colour.

Skins (liveries, see lpa/skins.py): DOCS.json may instead be an object keyed by collection name,
{"paint": [...], "skins": [...], "paint_<skin id>": [...]}. "skins" holds one doc per skin
({name, base, number, number_color, removed}); "paint" the default skin's shapes and
"paint_<skin id>" each other skin's, merged the same way into that skin of --base.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from lpa import skins as skinlib


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
        reg = {'view': r['view'], 'color': r['color'], 'mirror': r.get('mirror', True) is not False,
               'pts': [[round(float(a), 3), round(float(b), 3)] for a, b in r['pts']]}
        if r.get('x_side'):
            reg['x_side'] = int(r['x_side'])
        out['regions'].append(reg)
    return out


def _docs(raw) -> dict:
    return {d['id']: d.get('data', d) for d in raw} if isinstance(raw, list) else dict(raw)


def merge_skins(base: dict, cols: dict) -> dict:
    """paint.json from --base and the Hangar's collections (paint, skins, paint_<skin id>)."""
    built = skinlib.normalize(base) or [{'id': skinlib.DEFAULT_ID, 'name': 'Default', 'regions': []}]
    skins = {s['id']: dict(s) for s in built}
    meta = cols.get('skins', {})
    for sid, d in sorted(meta.items(), key=lambda kv: str(kv[1].get('t', ''))):
        if sid not in skins:
            skins[sid] = {'id': sid, 'regions': []}
        skins[sid].update({k: v for k, v in d.items() if k in ('name', 'base', 'number', 'number_color', 'removed')})
    out = []
    for sid, skin in skins.items():
        if skin.get('removed') and sid != skinlib.DEFAULT_ID:
            continue
        shapes = cols.get('paint' if sid == skinlib.DEFAULT_ID else f'paint_{sid}', {})
        merged = merge({k: v for k, v in skin.items() if k not in ('id', 'name', 'removed')}, shapes)
        clean = {'id': sid, 'name': skin.get('name') or sid}
        clean.update({k: v for k, v in merged.items() if v not in (None, '')})
        out.append(clean)
    if len(out) == 1 and 'skins' not in base:
        # One skin, old file: keep the single-scheme format.
        single = {k: v for k, v in out[0].items() if k not in ('id', 'name')}
        if out[0]['name'] != 'Default':
            single['name'] = out[0]['name']
        return single
    # Keys every skin shares stay at the top level.
    shared = {k: v for k, v in base.items() if k in ('about', 'material')}
    for s in out:
        for k in shared:
            if s.get(k) == shared[k]:
                s.pop(k)
    return skinlib.to_file(out, shared)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    fh = sub.add_parser('from-hangar')
    fh.add_argument('docs', type=Path)
    fh.add_argument('--base', type=Path)
    fh.add_argument('--out', type=Path, required=True)
    a = ap.parse_args()
    raw = json.loads(a.docs.read_text())
    base = json.loads(a.base.read_text()) if a.base and a.base.exists() else {}
    if isinstance(raw, dict) and ('paint' in raw or 'skins' in raw):
        out = merge_skins(base, {k: _docs(v) for k, v in raw.items()})
    else:
        out = merge_skins(base, {'paint': _docs(raw)})
    a.out.write_text(json.dumps(out, indent=1) + '\n')
    for s in skinlib.normalize(out):
        print(f'{a.out}: skin {s["id"]} "{s["name"]}": {len(s.get("regions", []))} shapes')


if __name__ == '__main__':
    main()
