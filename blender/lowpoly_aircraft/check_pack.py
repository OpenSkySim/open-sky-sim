"""Check an .aircraft.pack against what the sim's loader expects. Plain Python.

    python blender/lowpoly_aircraft/check_pack.py path/to/<id>.aircraft.pack

Mirrors the rules in src/script/scene/models/models.ts, render/helpers.ts and
state/aircraftRegistry.ts: every file the manifest names is in the zip; glTF
scenes are named by LOD digit; materials are a PaletteCategory or '#rrggbb';
a gear clip is named '<node>Action' and its node is a top-level, single-
primitive mesh; surface models sit about their pivot. Exits 1 on a problem.
"""
import json
import re
import struct
import sys
import zipfile

PALETTE_HINT = re.compile(r'^(#[0-9a-fA-F]{6}|[A-Z][A-Z0-9_]+)$')
CONTROLS = {'pitch', 'roll', 'yaw', 'flaps', 'slats', 'airbrake', 'sweep', 'fold',
            'flaperonLeft', 'flaperonRight', 'stabilatorLeft', 'stabilatorRight', 'spin'}


def read_glb(data: bytes) -> dict:
    magic, version, _ = struct.unpack_from('<4sII', data, 0)
    if magic != b'glTF' or version != 2:
        raise ValueError('not a glTF 2 binary')
    length, kind = struct.unpack_from('<I4s', data, 12)
    if kind != b'JSON':
        raise ValueError('first chunk is not JSON')
    return json.loads(data[20:20 + length])


def position_bounds(gltf: dict) -> tuple[list, list]:
    lo, hi = [1e9] * 3, [-1e9] * 3
    for mesh in gltf.get('meshes', []):
        for prim in mesh['primitives']:
            acc = gltf['accessors'][prim['attributes']['POSITION']]
            lo = [min(a, b) for a, b in zip(lo, acc['min'])]
            hi = [max(a, b) for a, b in zip(hi, acc['max'])]
    return lo, hi


def check(path: str) -> list[str]:
    errors: list[str] = []
    z = zipfile.ZipFile(path)
    names = set(z.namelist())
    if 'manifest.json' not in names:
        return ['manifest.json missing']
    m = json.loads(z.read('manifest.json'))

    def glb(name: str, role: str):
        if name not in names:
            errors.append(f'{role}: {name} not in pack')
            return None
        g = read_glb(z.read(name))
        for s in g.get('scenes', []):
            if not s.get('name', '')[:1].isdigit():
                errors.append(f'{name}: scene "{s.get("name")}" should be named by its LOD digit')
        for mat in g.get('materials', []):
            if not PALETTE_HINT.match(mat.get('name', '')):
                errors.append(f'{name}: material "{mat.get("name")}" is neither a palette name nor #rrggbb')
        return g

    body = glb(m['body'], 'body')
    if body is not None:
        # A failed boolean leaves the cutting prism (hundreds of metres tall) in the mesh.
        lo, hi = position_bounds(body)
        size = [h - l for l, h in zip(lo, hi)]
        if max(size) > 3 * max(size[0], size[2]) or max(size) > 200:
            errors.append(f'body: bounding box {[round(v, 1) for v in size]} m looks wrong (leftover cutter?)')
    glb(m['shadow'], 'shadow')
    if not m['shadow'].endswith('_shadow.glb'):
        errors.append('shadow file name must end in _shadow.glb')

    if m.get('gear'):
        g = glb(m['gear'], 'gear')
        if g is not None:
            nodes = g['nodes']
            children = {c for n in nodes for c in n.get('children', [])}
            anims = g.get('animations', [])
            if m.get('gearAnimated') and not anims:
                errors.append('gearAnimated but the gear has no animation')
            for a in anims:
                targets = {c['target']['node'] for c in a['channels']}
                for t in targets:
                    node = nodes[t]
                    if a['name'] != node.get('name', '') + 'Action':
                        errors.append(f'gear clip "{a["name"]}" must be named "{node.get("name")}Action"')
                    if t in children:
                        errors.append(f'gear node "{node.get("name")}" is parented; animated nodes must be top-level')
                    if 'mesh' not in node or len(g['meshes'][node['mesh']]['primitives']) != 1:
                        errors.append(f'gear node "{node.get("name")}" must be one mesh with one material')

    for s in m['surfaces']:
        if s['control'] not in CONTROLS:
            errors.append(f'{s["role"]}: unknown control "{s["control"]}"')
        ax = s['axis']
        n = sum(c * c for c in ax) ** 0.5
        if abs(n - 1) > 1e-3:
            errors.append(f'{s["role"]}: axis is not a unit vector ({n:.3f})')
        g = glb(s['path'], s['role'])
        if g is not None:
            lo, hi = position_bounds(g)
            size = max(h - l for l, h in zip(lo, hi))
            off = max(max(abs(l), abs(h)) for l, h in zip(lo, hi))
            if size > 100:
                errors.append(f'{s["role"]}: model is {size:.0f} m across (leftover cutter from a failed boolean?)')
            if off > 3 * size + 0.5:
                errors.append(f'{s["role"]}: model is {off:.1f} m from its pivot; it should sit about the hinge')
    return errors


def main() -> None:
    errs = check(sys.argv[1])
    for e in errs:
        print('ERROR', e)
    print('ok' if not errs else f'{len(errs)} problem(s)')
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
