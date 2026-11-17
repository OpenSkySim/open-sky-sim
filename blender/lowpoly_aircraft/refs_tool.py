"""Check and use an aircraft's reference set (refs.json, see lpa/refs.py).

    python3 refs_tool.py check examples/mig29kub/refs.json --images DIR
        Lists views and their scale, and measures each calibrated view's ink extent
        against the set's length and span (a wrong scale or nose point shows up here).

    python3 refs_tool.py point examples/mig29kub/refs.json IMAGE_ID VIEW U V [U V ...]
        Image pixels -> (d, x, y) metres in the drawing frame.

    python3 refs_tool.py from-hangar DUMP.json --out examples/<id>/refs.json
        Turns the Hangar's database docs (a JSON list of image docs, as read from
        the artifact's 'aircraft/<id>/refs' collection) into refs.json. Images
        stored only in the Hangar are referenced by their asset id.

Images are found by their 'file' name under --images (default: the refs.json folder),
so third-party drawings can stay outside the repo.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from lpa import refs as R  # noqa: E402
from lpa import silhouette as sil  # noqa: E402

TOLERANCE = 0.03   # a view's extent may differ from the published size by 3 % before it is flagged

# Keys a Hangar doc carries that refs.json keeps (others, like timestamps, are dropped).
IMAGE_KEYS = ('id', 'file', 'asset', 'kind', 'title', 'source', 'repo_ok', 'priority', 'notes', 'views', 'size')


def _image_path(rs_path: str, images_dir: str | None, img: dict) -> str | None:
    if not img.get('file'):
        return None
    p = os.path.join(images_dir or os.path.dirname(os.path.abspath(rs_path)), img['file'])
    return p if os.path.exists(p) else None


def cmd_check(a) -> int:
    rs = R.load(a.refs)
    print(f'{rs.aircraft}: {len(rs.images)} images, length {rs.length_m} m, span {rs.span_m} m, ground y {rs.ground_y}')
    bad = 0
    for msg in rs.issues():
        print(f'  ! {msg}')
        bad += 1
    masks: dict[str, object] = {}
    for img in rs.images:
        print(f'- {img["id"]} ({img.get("kind")}, priority {img.get("priority", 9)}): {img.get("title") or img.get("file") or img.get("asset")}')
        path = _image_path(a.refs, a.images, img)
        for v in img.get('views', []):
            try:
                rv = R.view_from_json(img['id'], v, rs.ground_y)
            except R.RefError as e:
                print(f'    {v.get("view")}: not calibrated ({e})')
                continue
            line = f'    {rv.view}: {rv.px_per_m:.2f} px/m, nose at {rv.nose.round(1).tolist()}'
            if rv.view not in ('front', 'rear'):
                line += f', nose points {rv.nose_dir}'
            if rv.view in ('side', 'front', 'rear'):
                line += f', nose y {rv.nose_y_m:+.2f} m'
            print(line)
            if not path or not rv.crop:
                continue
            if path not in masks:
                masks[path] = sil.ink_mask(sil.load_rgba(path), float(v.get('threshold', 0.5)))
            try:
                lo, hi = R.extent_m(rv, masks[path])
            except R.RefError as e:
                print(f'      ! {e}')
                bad += 1
                continue
            for k, ax in enumerate(rv.axes):
                size = hi[k] - lo[k]
                line = f'      {ax}: {lo[k]:+.2f} .. {hi[k]:+.2f} m'
                # Along d the tail end counts (a pitot ahead of the nose is not in the length).
                got, ref = (hi[k], rs.length_m) if ax == 'd' else (size, rs.span_m if ax == 'x' else None)
                if ref:
                    err = got / ref - 1
                    line += f'  {"tail at" if ax == "d" else "span"} {got:.2f} m ({err:+.1%} vs {ref} m)'
                    if abs(err) > TOLERANCE:
                        line += '  <- check scale, nose or crop'
                        bad += 1
                print(line)
    return 1 if bad else 0


def cmd_point(a) -> int:
    rs = R.load(a.refs)
    views = [v for v in rs.views(a.view) if v.image_id == a.image]
    if not views:
        print(f'no calibrated {a.view} view on {a.image}', file=sys.stderr)
        return 1
    pts = list(zip(a.uv[0::2], a.uv[1::2]))
    for (u, v), dxy in zip(pts, views[0].to_dxy(pts)):
        cells = ['   -  ' if c != c else f'{c:+.3f}' for c in dxy]
        print(f'({u:g}, {v:g}) -> d {cells[0]}  x {cells[1]}  y {cells[2]}')
    return 0


def cmd_from_hangar(a) -> int:
    with open(a.dump) as f:
        docs = json.load(f)
    if isinstance(docs, dict):
        meta, docs = docs.get('meta', {}), docs.get('images', [])
    else:
        meta = {}
    out = {'aircraft': a.aircraft or meta.get('aircraft'), 'length_m': meta.get('length_m'),
           'span_m': meta.get('span_m'), 'ground_y': meta.get('ground_y'), 'images': []}
    if os.path.exists(a.out):
        with open(a.out) as f:
            old = json.load(f)
        for k in ('aircraft', 'length_m', 'span_m', 'ground_y'):
            out[k] = out[k] if out[k] is not None else old.get(k)
    for d in sorted(docs, key=lambda d: (d.get('priority', 9), d.get('id', ''))):
        out['images'].append({k: d[k] for k in IMAGE_KEYS if k in d})
    if not out['aircraft']:
        print('aircraft id unknown: pass --aircraft', file=sys.stderr)
        return 1
    with open(a.out, 'w') as f:
        json.dump(out, f, indent=1)
        f.write('\n')
    print(f'wrote {len(out["images"])} images to {a.out}')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('check')
    c.add_argument('refs')
    c.add_argument('--images', help='folder holding the image files (default: next to refs.json)')
    c.set_defaults(fn=cmd_check)
    p = sub.add_parser('point')
    p.add_argument('refs')
    p.add_argument('image')
    p.add_argument('view', choices=R.VIEW_TYPES)
    p.add_argument('uv', type=float, nargs='+')
    p.set_defaults(fn=cmd_point)
    h = sub.add_parser('from-hangar')
    h.add_argument('dump')
    h.add_argument('--out', required=True)
    h.add_argument('--aircraft')
    h.set_defaults(fn=cmd_from_hangar)
    a = ap.parse_args()
    if a.cmd == 'point' and len(a.uv) % 2:
        ap.error('pixels come in pairs: U V')
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main())
