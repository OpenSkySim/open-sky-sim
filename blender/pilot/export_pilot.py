"""Export the pilot figure from pilot.blend to assets/pilot.glb for the game.

Run from the repository root after editing blender/pilot/pilot.blend:

    blender -b blender/pilot/pilot.blend -P blender/pilot/export_pilot.py

Conventions the game relies on (see src/script/scene/entities/pilotFit.ts):
- Origin = the cockpit eye point; Blender -Y is forward, +Z up (the glTF
  exporter turns that into the game's +Z forward, +Y up).
- Each material is named after the palette category it is drawn in
  (VEHICLE_PILOT_SUIT, VEHICLE_PILOT_HELMET, VEHICLE_PILOT_SKIN,
  VEHICLE_PILOT_GEAR, VEHICLE_PILOT_SEAT, VEHICLE_PILOT_SEAT_CUSHION,
  VEHICLE_PILOT_SEAT_HANDLE,
  VEHICLE_PLANE_INTERIOR); the colour set here is only
  for the viewport.
- Backface culling off on a material exports it double-sided.
- The game flat-shades every face, so smoothing settings do not matter.
- If the helmet moves, update PILOT_HELMET_CENTER / PILOT_HELMET_RADIUS_M in
  pilotFit.ts: they size the canopy clearance.
"""
import os

import bpy

out = os.path.join(os.getcwd(), 'assets', 'pilot.glb')
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_texcoords=False,
    export_normals=False,
    export_materials='EXPORT',
)
print('exported', out)
