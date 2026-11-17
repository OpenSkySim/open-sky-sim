"""Add a built aircraft pack to the Lowpoly Hangar viewer.

    python3 viewer/add_model.py OUT_DIR_OR_PACK --name "Yak-44E" --dims "20.39 m long · 25.7 m span" \
        [--status "..."] [--source "..."] [--drawing reference.png]

Writes viewer/models/<id>/ (each GLB as a self-contained .gltf.json, plus manifest.json), the shared pilot
model, and an entry in viewer/models/index.json. Then serve the folder and open it:

    python3 -m http.server -d viewer 8000   ->   http://localhost:8000/
"""
from __future__ import annotations

import argparse
import base64
import json
import shutil
import struct
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def glb_to_gltf_json(data: bytes) -> str:
    """One GLB as glTF JSON with its binary chunk embedded (the page builds the GLB back in memory)."""
    jl = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + jl])
    off = 20 + jl
    if off < len(data):
        bl = struct.unpack_from('<I', data, off)[0]
        gltf['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(
            data[off + 8:off + 8 + bl]).decode()
    return json.dumps(gltf, separators=(',', ':'))


def read_files(src: Path) -> dict[str, bytes]:
    if src.is_dir():
        return {p.name: p.read_bytes() for p in src.iterdir() if p.suffix in ('.glb', '.json')}
    with zipfile.ZipFile(src) as z:
        return {Path(n).name: z.read(n) for n in z.namelist() if n.endswith(('.glb', '.json'))}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', type=Path, help='builder output folder or .aircraft.pack')
    ap.add_argument('--name', required=True)
    ap.add_argument('--dims', default='')
    ap.add_argument('--status', default='')
    ap.add_argument('--source', default='')
    ap.add_argument('--drawing', type=Path, help='reference drawing shown under the 3D view (kept local)')
    a = ap.parse_args()
    files = read_files(a.src)
    manifest = json.loads(files['manifest.json'])
    mid = manifest['id']
    out = HERE / 'models' / mid
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for name, data in files.items():
        if name.endswith('.glb'):
            (out / (name[:-4] + '.gltf.json')).write_text(glb_to_gltf_json(data))
    (out / 'manifest.json').write_bytes(files['manifest.json'])
    if a.drawing:
        shutil.copy(a.drawing, out / 'drawing.png')
    pilot = REPO / 'assets' / 'pilot.glb'
    if pilot.exists():
        (HERE / 'models' / 'pilot.gltf.json').write_text(glb_to_gltf_json(pilot.read_bytes()))
    index_path = HERE / 'models' / 'index.json'
    index = json.loads(index_path.read_text()) if index_path.exists() else []
    index = [e for e in index if e['id'] != mid]
    index.insert(0, {'id': mid, 'name': a.name, 'status': a.status, 'source': a.source, 'dims': a.dims})
    index_path.write_text(json.dumps(index, indent=1, ensure_ascii=False))
    print(f'added {mid} ({len(files) - 1} models) -> {out}')


if __name__ == '__main__':
    main()
