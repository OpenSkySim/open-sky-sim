"""Blender scene -> sim aircraft pack.

Reads the collections the builder creates (and that you may have edited by
hand in Blender) and writes what the sim loads:

    <id>.glb            body (collection "Body")
    <id>_shadow.glb     flat ground silhouette (collection "Shadow")
    <id>_gear.glb       animated landing gear (collection "Gear")
    <id>_<role>.glb     one hinge-pivoted model per control surface ("Surfaces")
    manifest.json       what aircraftRegistry.ts reads
    <id>.aircraft.pack  zip of all the above (pack files are stored by basename)

Control surfaces carry their hinge as custom properties (lpa_role,
lpa_control, lpa_sign, lpa_range_deg, lpa_axis); the object origin is the
hinge pivot. Gear objects carry one action each, named "<object>Action",
running from gear up (first frame) to gear down (last frame).
"""
from __future__ import annotations

import json
import math
import os
import zipfile

import bpy  # type: ignore

from .geometry import from_bl


def _objects(collection: str) -> list[bpy.types.Object]:
    coll = bpy.data.collections.get(collection)
    if coll is None:
        return []
    return sorted((o for o in coll.objects if o.type == 'MESH'), key=lambda o: o.name)


def _export_glb(path: str, objects: list[bpy.types.Object], animations: bool) -> None:
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objects:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    kwargs = dict(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
        export_normals=True,
        export_texcoords=False,
        export_animations=animations,
        export_extras=False,
        export_cameras=False,
        export_lights=False,
    )
    if animations:
        kwargs.update(export_animation_mode='ACTIONS', export_force_sampling=True,
                      export_frame_range=False, export_anim_single_armature=False)
    bpy.ops.export_scene.gltf(**kwargs)


def _vec(v) -> list[float]:
    return [round(float(c), 4) for c in v]


def export_pack(out_dir: str, pack: bool = True) -> dict:
    scene = bpy.context.scene
    aid = scene.get('lpa_id') or 'lowpoly_aircraft'
    name = scene.get('lpa_name') or aid
    os.makedirs(out_dir, exist_ok=True)
    # The sim treats each glTF scene as one LOD level, ordered by the name's first digit.
    scene.name = '0'

    files: list[str] = []
    body = _objects('Body')
    if not body:
        raise RuntimeError('nothing in the "Body" collection to export')
    _export_glb(os.path.join(out_dir, f'{aid}.glb'), body, False)
    files.append(f'{aid}.glb')

    shadow = _objects('Shadow')
    if shadow:
        _export_glb(os.path.join(out_dir, f'{aid}_shadow.glb'), shadow, False)
        files.append(f'{aid}_shadow.glb')

    gear = _objects('Gear')
    if gear:
        _export_glb(os.path.join(out_dir, f'{aid}_gear.glb'), gear, True)
        files.append(f'{aid}_gear.glb')

    surfaces = []
    for obj in _objects('Surfaces'):
        role = obj.get('lpa_role') or obj.name
        fname = f'{aid}_{role}.glb'
        # A surface model is drawn about its pivot: export it at the origin.
        loc = obj.location.copy()
        obj.location = (0, 0, 0)
        bpy.context.view_layer.update()
        try:
            _export_glb(os.path.join(out_dir, fname), [obj], False)
        finally:
            obj.location = loc
            bpy.context.view_layer.update()
        files.append(fname)
        surfaces.append({
            'role': role,
            'path': fname,
            'pivot': _vec(from_bl(obj.location)),
            'axis': _vec(obj.get('lpa_axis', (1.0, 0.0, 0.0))),
            'control': obj.get('lpa_control', 'pitch'),
            'sign': float(obj.get('lpa_sign', 1.0)),
            'rangeRad': round(math.radians(float(obj.get('lpa_range_deg', 25.0))), 4),
        })

    manifest = {
        'id': aid,
        'name': name,
        'displayName': name,
        'canonicalName': scene.get('lpa_canonical') or name,
        'category': 'lowpoly-builder',
        'description': scene.get('lpa_description') or 'Built from a three-view drawing by blender/lowpoly_aircraft.',
        'body': f'{aid}.glb',
        'shadow': f'{aid}_shadow.glb' if shadow else f'{aid}.glb',
        'gear': f'{aid}_gear.glb' if gear else None,
        'gearAnimated': bool(gear),
        'surfaces': surfaces,
        'cockpitOffset': _vec(scene.get('lpa_cockpit', (0.0, 1.0, 3.0))),
        'fx': {'wingtips': [_vec(w) for w in scene['lpa_wingtips']] if 'lpa_wingtips' in scene else None,
               'nozzles': None},
    }
    with open(os.path.join(out_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    files.append('manifest.json')

    if pack:
        pack_path = os.path.join(out_dir, f'{aid}.aircraft.pack')
        with zipfile.ZipFile(pack_path, 'w', zipfile.ZIP_DEFLATED) as z:
            for fn in files:
                z.write(os.path.join(out_dir, fn), fn)
    return manifest
