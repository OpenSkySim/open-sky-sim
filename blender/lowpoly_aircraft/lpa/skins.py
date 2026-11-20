"""Skins (liveries): several named paint schemes for one aircraft, in paint.json (no Blender needed).

paint.json holds either one scheme (the old format, read as a single skin "Default"):

    {"base": "#aeb2b4", "regions": [...]}

or a list of skins; the first is the default (the pack's own body), every other one is built
into its own body model and listed in the manifest's "liveries":

    {"material": "VEHICLE_PLANE_GREY",
     "skins": [{"id": "default", "name": "Navy grey", "base": "#aeb2b4", "regions": [...]},
               {"id": "arctic", "name": "Arctic", "base": "#e8ecee", "regions": [...],
                "number": "35", "number_color": "#c02020"}]}

Keys at the top level (other than "skins") are shared by every skin unless a skin sets its own.
A skin's "number" / "number_color" replace the text decals' digits / colour for that skin.
"""
from __future__ import annotations

import re

DEFAULT_ID = 'default'
_SHARED_SKIP = {'skins', 'about', 'aircraft', 'decals'}


def slug(text: str) -> str:
    """A file-name-safe skin id: lower case letters, digits and '-'."""
    s = re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')
    return s[:40] or 'skin'


def normalize(pattern: dict | None) -> list[dict]:
    """The skins of a paint.json, old or new format; ids unique, the first one is the default."""
    if not pattern:
        return []
    if 'skins' not in pattern:
        skin = {k: v for k, v in pattern.items() if k not in _SHARED_SKIP}
        skin.setdefault('name', 'Default')
        return [{'id': DEFAULT_ID, **skin}]
    shared = {k: v for k, v in pattern.items() if k not in _SHARED_SKIP}
    out, seen = [], set()
    for i, raw in enumerate(pattern['skins']):
        if raw.get('removed'):
            continue
        sid = DEFAULT_ID if not out else slug(raw.get('id') or raw.get('name') or f'skin-{i}')
        base_id, n = sid, 2
        while sid in seen:
            sid, n = f'{base_id}-{n}', n + 1
        seen.add(sid)
        skin = {**shared, **{k: v for k, v in raw.items() if k != 'id'}, 'id': sid}
        skin.setdefault('name', 'Default' if sid == DEFAULT_ID else sid)
        skin.setdefault('regions', [])
        out.append(skin)
    return out


def text_override(skin: dict) -> dict:
    """The text-decal override a skin asks for (build_aircraft.py --number works the same way)."""
    return {k: skin[s] for k, s in (('text', 'number'), ('color', 'number_color')) if skin.get(s)}


def to_file(skins: list[dict], extra: dict | None = None) -> dict:
    """paint.json for a list of skins (always the multi-skin format)."""
    out = dict(extra or {})
    out['skins'] = [dict(s) for s in skins]
    return out
