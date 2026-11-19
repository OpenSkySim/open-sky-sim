"""Shaped parts in the body frame: lofted fuselages and nacelles, profiled panels.

The silhouette builder (visual hull) gives boxy bodies. A realistic low-poly
model (a few thousand triangles) is built from parts instead:

* ``loft``  a fuselage, nacelle, canopy or nozzle: superellipse cross-sections
  along the length, each station giving its centre, half-width, height above
  and below the centre and squareness (2 = ellipse, higher = boxier).
* ``panel`` a wing, tailplane, canard or fin: an airfoil (symmetric NACA
  thickness) swept between spanwise stations, each giving its leading-edge
  point, chord and thickness ratio.

Coordinates are body metres (+X left wing, +Y up, +Z nose). Stations are
smoothed with a Catmull-Rom spline and resampled, so a handful of hand-picked
stations gives an even, rounded mesh.
"""
from __future__ import annotations

import math

import bmesh  # type: ignore
import bpy  # type: ignore
import numpy as np

from . import geometry as geo


def catmull_rom(rows: np.ndarray, count: int) -> np.ndarray:
    """Resample a table of stations (rows) along a centripetal-free uniform Catmull-Rom spline."""
    rows = np.asarray(rows, dtype=np.float64)
    if len(rows) < 3 or count <= len(rows):
        return rows
    p = np.vstack([2 * rows[0] - rows[1], rows, 2 * rows[-1] - rows[-2]])
    seg = len(rows) - 1
    out = []
    for k in range(count):
        t = k / (count - 1) * seg
        i = min(int(t), seg - 1)
        u = t - i
        p0, p1, p2, p3 = p[i], p[i + 1], p[i + 2], p[i + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
                          + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
    return np.array(out)


def _superellipse_ring(cx, cy, a, top, bot, n, segments, n_top=None):
    pts = []
    for k in range(segments):
        t = 2 * math.pi * k / segments
        c, s = math.cos(t), math.sin(t)
        if n_top is not None and s > 0:
            n_k = n_top
        else:
            n_k = n
        x = cx + a * math.copysign(abs(c) ** (2.0 / n_k), c)
        h = top if s >= 0 else bot
        y = cy + h * math.copysign(abs(s) ** (2.0 / n_k), s)
        pts.append((x, y))
    return pts


def loft(name: str, stations, segments: int = 24, resample: int = 0, material: str = 'VEHICLE_PLANE_GREY',
         collection: str = 'Construction') -> bpy.types.Object:
    """Closed tube through superellipse sections.

    stations: rows of (z, cx, cy, half_width, above, below, n[, n_top]), nose first. The optional n_top
    gives the upper half its own squareness (lower = sides leaning in more towards the top).
    A station with half_width or height ~0 closes the tube to a point.
    """
    rows = np.asarray(stations, dtype=np.float64)
    if resample:
        rows = catmull_rom(rows, resample)
    rows[:, 3:6] = np.maximum(rows[:, 3:6], 0.0)
    rows[:, 6:] = np.maximum(rows[:, 6:], 1.2)
    bm = bmesh.new()
    rings = []
    for row in rows:
        z, cx, cy, a, top, bot, n = row[:7]
        n_top = row[7] if len(row) > 7 else None
        if a < 1e-3 or top + bot < 1e-3:
            rings.append([bm.verts.new(geo.to_bl((cx, cy, z)))])
        else:
            rings.append([bm.verts.new(geo.to_bl((x, y, z))) for x, y in
                          _superellipse_ring(cx, cy, a, top, bot, n, segments, n_top)])
    _skin(bm, rings)
    return _object(bm, name, material, collection)


def _skin(bm, rings) -> None:
    """Quads between consecutive rings, fans to single-vertex ends, caps on open ends."""
    for r0, r1 in zip(rings, rings[1:]):
        if len(r0) == 1 and len(r1) == 1:
            continue
        if len(r0) == 1:
            m = len(r1)
            for k in range(m):
                bm.faces.new((r0[0], r1[(k + 1) % m], r1[k]))
        elif len(r1) == 1:
            m = len(r0)
            for k in range(m):
                bm.faces.new((r0[k], r0[(k + 1) % m], r1[0]))
        else:
            m = len(r0)
            for k in range(m):
                bm.faces.new((r0[k], r0[(k + 1) % m], r1[(k + 1) % m], r1[k]))
    for ring in (rings[0], rings[-1]):
        if len(ring) > 2:
            bm.faces.new(ring)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def _object(bm, name, material, collection) -> bpy.types.Object:
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(geo.get_material(material))
    return geo._link(obj, collection)


def naca_half_thickness(x: np.ndarray, tc: float) -> np.ndarray:
    """Symmetric NACA 4-digit half thickness (closed trailing edge), chord = 1."""
    return 5 * tc * (0.2969 * np.sqrt(x) - 0.1260 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1036 * x ** 4)


def panel(name: str, stations, chord_points: int = 9, resample: int = 0, material: str = 'VEHICLE_PLANE_GREY',
          collection: str = 'Construction', normal=None, chord_dir=None) -> bpy.types.Object:
    """Airfoil-section panel (wing, tail, fin).

    stations: rows of (le_x, le_y, le_z, chord, tc), root first; the chord
    runs aft (-Z) unless *chord_dir* is given. The thickness direction is
    perpendicular to the span and the chord unless *normal* is given (e.g.
    (1, 0, 0) for a fin).
    """
    rows = np.asarray(stations, dtype=np.float64)
    if resample:
        rows = catmull_rom(rows, resample)
    bm = bmesh.new()
    _panel_into(bm, rows, chord_points, normal, chord_dir)
    return _object(bm, name, material, collection)


def _panel_into(bm, rows, chord_points, normal=None, chord_dir=None) -> None:
    xs = 0.5 * (1 - np.cos(np.linspace(0, math.pi, chord_points)))   # cosine spacing, LE..TE
    half = naca_half_thickness(xs, 1.0)
    cd = np.array([0.0, 0.0, -1.0]) if chord_dir is None else np.asarray(chord_dir, dtype=np.float64)
    cd = cd / np.linalg.norm(cd)
    rings = []
    for i, (lx, ly, lz, chord, tc) in enumerate(rows):
        le = np.array([lx, ly, lz])
        if normal is not None:
            nrm = np.asarray(normal, dtype=np.float64)
        else:
            j0, j1 = max(i - 1, 0), min(i + 1, len(rows) - 1)
            span = rows[j1, :3] - rows[j0, :3]
            nrm = np.cross(cd, span)
            if np.linalg.norm(nrm) < 1e-9:
                nrm = np.array([0.0, 1.0, 0.0])
        nrm = nrm / np.linalg.norm(nrm)
        upper = [le + cd * chord * x + nrm * chord * tc * h for x, h in zip(xs, half)]
        lower = [le + cd * chord * x - nrm * chord * tc * h for x, h in zip(xs, half)]
        # Ring: upper LE..TE, then lower back from TE to LE (skipping shared ends).
        ring = upper + lower[-2:0:-1]
        rings.append([bm.verts.new(geo.to_bl(p)) for p in ring])
    _skin(bm, rings)


def prop(name: str, center, radius: float, blades: int = 6, root_r: float = 0.4, chord: float = 0.4,
         pitch_deg: float = 30.0, phase_deg: float = 0.0, hand: float = 1.0, material: str = 'VEHICLE_PLANE_ENGINE',
         collection: str = 'Construction', sweep: float = 0.0, span_range=(0.0, 1.0),
         chord_points: int = 5, blade=None) -> bpy.types.Object:
    """Propeller blades about the +Z axis through *center*, one object.

    *hand* is the turn about +Z (body): +1 turns the top of the disc towards -X, which is
    clockwise seen from behind (a right-hand prop); -1 the other way. The leading edges lead
    that turn. *sweep* bends each blade back against its rotation (a scimitar blade): the
    tip trails the straight line by sweep * radius, growing with the square of
    the span; chord peaks at about two thirds of the span and rounds off at the tip.
    *span_range* (fractions of root..tip) builds only part of each blade, e.g. (0.85, 1)
    for painted tips as their own object.
    """
    c = np.asarray(center, dtype=np.float64)
    bm = bmesh.new()
    if blade is not None:
        for k in range(blades):
            th = math.radians(phase_deg) + 2 * math.pi * k / blades
            _shaped_blade(bm, c, th, radius, root_r, chord, hand, blade, span_range)
        return _object(bm, name, material, collection)
    pitch = math.radians(pitch_deg)
    span = [(root_r, 0.65), (root_r + 0.45 * (radius - root_r), 1.0), (root_r + 0.86 * (radius - root_r), 0.85),
            (radius, 0.3)]
    if not sweep:
        span = [(root_r, 0.75), (0.55 * radius, 1.0), (radius, 0.35)]
    s0, s1 = span_range
    if (s0, s1) != (0.0, 1.0):
        rs, fs = [r for r, _ in span], [f for _, f in span]
        r0, r1 = root_r + s0 * (radius - root_r), root_r + s1 * (radius - root_r)
        span = [(r, float(np.interp(r, rs, fs))) for r in [r0] + [r for r in rs if r0 < r < r1] + [r1]]
    for k in range(blades):
        th = math.radians(phase_deg) + 2 * math.pi * k / blades
        rows = []
        for r, f in span:
            s = (r - root_r) / max(radius - root_r, 1e-6)
            # Swept blades: the station moves back along the arc, so its own radial line turns too.
            phi = th - hand * sweep * s * s * radius / max(r, 1e-6)
            radial = np.array([math.cos(phi), math.sin(phi), 0.0])
            # Chord runs from the leading edge back against the turn and aft (tractor pitch).
            tangent = -hand * np.array([-math.sin(phi), math.cos(phi), 0.0])
            cd = tangent * math.cos(pitch) + np.array([0.0, 0.0, -1.0]) * math.sin(pitch)
            ch = f * chord
            le = c + radial * r - cd * ch * 0.35
            rows.append([*le, ch, 0.08])
        # One chord direction per blade (the mid station's) keeps the sections parallel.
        _panel_into(bm, np.array(rows), chord_points, chord_dir=_prop_chord_dir(th, hand, pitch))
    return _object(bm, name, material, collection)


def _shaped_blade(bm, c, th, radius, root_r, chord, hand, blade: dict, span_range) -> None:
    """One blade drawn from a planform table (a propfan's wide scimitar blade).

    blade = {'planform': [[s, chord_frac, aft_m], ...]  s 0 (root) .. 1 (tip); chord as a
             fraction of *chord*; aft_m how far the blade's pivot line (30 % chord) trails the
             straight radial line, in metres along the arc against the turn,
             'pitch_deg': [root, tip] blade angle from the disc plane (twist in between),
             'tc': thickness ratio, 'camber': camber ratio (bulging forward, the thrust side),
             'stations': spanwise rows, 'chord_u': chordwise fractions (0 = LE, 1 = TE) of this object,
             'chord_range' is implied by chord_u, so a leading-edge strip and the rest of the blade
             can be separate objects (painted differently) that meet flush.}
    """
    pf = np.asarray(blade['planform'], dtype=np.float64)
    p0, p1 = blade.get('pitch_deg', [45.0, 28.0])
    tc = float(blade.get('tc', 0.05))
    camber = float(blade.get('camber', 0.03))
    us = np.asarray(blade.get('chord_u', [0.0, 0.4, 1.0]), dtype=np.float64)
    n = int(blade.get('stations', 7))
    s0, s1 = span_range
    ss = np.linspace(s0, s1, max(n, 2))
    # Rounded tip: the last stations bunch up towards the tip.
    if s1 >= 1.0:
        ss = s0 + (s1 - s0) * np.sin(0.5 * math.pi * np.linspace(0, 1, max(n, 2))) ** 0.8
    half = naca_half_thickness(np.clip(us, 0, 1), 1.0)
    halfc = np.maximum(half, 0.004)                      # a hair of thickness at the TE: no zero-area faces
    camb = 4 * camber * us * (1 - us)
    rings = []
    for s in ss:
        r = root_r + s * (radius - root_r)
        f = float(np.interp(s, pf[:, 0], pf[:, 1]))
        aft = float(np.interp(s, pf[:, 0], pf[:, 2]))
        ch = f * chord
        phi = th - hand * aft / max(r, 1e-6)
        radial = np.array([math.cos(phi), math.sin(phi), 0.0])
        tangent = -hand * np.array([-math.sin(phi), math.cos(phi), 0.0])
        pitch = math.radians(p0 + (p1 - p0) * s)
        cd = tangent * math.cos(pitch) + np.array([0.0, 0.0, -1.0]) * math.sin(pitch)
        nrm = np.cross(radial, cd)
        if nrm[2] < 0:
            nrm = -nrm
        nrm /= np.linalg.norm(nrm)
        le = c + radial * r - cd * ch * 0.3
        upper = [le + cd * ch * u + nrm * ch * (cb + tc * h) for u, h, cb in zip(us, halfc, camb)]
        lower = [le + cd * ch * u + nrm * ch * (cb - tc * h) for u, h, cb in zip(us, halfc, camb)]
        ring = list(upper)
        if us[-1] >= 1.0:
            ring[-1] = le + cd * ch                       # sharp trailing edge: one point
            tail = lower[-2::-1]
        else:
            tail = lower[::-1]
        if us[0] <= 0.0:
            ring[0] = le
            tail = tail[:-1]                              # sharp leading edge: one point
        ring += tail
        rings.append([bm.verts.new(geo.to_bl(p)) for p in ring])
    _skin(bm, rings)


def _prop_chord_dir(th: float, hand: float, pitch: float) -> np.ndarray:
    tangent = -hand * np.array([-math.sin(th), math.cos(th), 0.0])
    return tangent * math.cos(pitch) + np.array([0.0, 0.0, -1.0]) * math.sin(pitch)


def mirror_rows(kind: str, rows) -> list:
    """Stations of the same part on the other side (x -> -x)."""
    out = []
    for r in rows:
        r = list(r)
        r[1 if kind == 'loft' else 0] = -r[1 if kind == 'loft' else 0]
        out.append(r)
    return out


def build_part(spec_part: dict, mirrored: bool = False) -> bpy.types.Object:
    kind = spec_part['type']
    rows = spec_part.get('stations', [])
    if mirrored:
        rows = mirror_rows(kind, rows)
    name = spec_part.get('name', kind)
    material = spec_part.get('material', 'VEHICLE_PLANE_GREY')
    if kind == 'loft':
        return loft(name, rows, int(spec_part.get('segments', 24)), int(spec_part.get('resample', 0)), material)
    if kind == 'panel':
        normal = spec_part.get('normal')
        if normal is not None and mirrored:
            normal = [-normal[0], normal[1], normal[2]]
        return panel(name, rows, int(spec_part.get('chord_points', 9)), int(spec_part.get('resample', 0)),
                     material, normal=normal)
    if kind == 'prop':
        c = list(spec_part['center'])
        if mirrored:
            c[0] = -c[0]
        return prop(name, c, float(spec_part['radius']), int(spec_part.get('blades', 6)),
                    float(spec_part.get('root_r', 0.4)), float(spec_part.get('chord', 0.4)),
                    float(spec_part.get('pitch_deg', 30)), float(spec_part.get('phase_deg', 0)),
                    # Both engines turn the same way unless the spec says otherwise per side.
                    float(spec_part.get('hand', 1.0)) * (-1.0 if mirrored and spec_part.get('mirror_hand') else 1.0),
                    material,
                    sweep=float(spec_part.get('sweep', 0.0)), span_range=tuple(spec_part.get('span_range', (0.0, 1.0))),
                    chord_points=int(spec_part.get('chord_points', 5)), blade=spec_part.get('blade'))
    raise ValueError(f'unknown part type {kind!r}')


def shadow_from_mesh(objs, name: str, cell: float = 0.08) -> bpy.types.Object:
    """Ground shadow: the meshes' top-view footprint, rasterised and traced."""
    from . import silhouette as sil
    tris = []
    for o in objs:
        me = o.data
        me.calc_loop_triangles()
        mw = o.matrix_world
        co = np.array([geo.from_bl(mw @ v.co) for v in me.vertices])
        idx = np.array([t.vertices[:] for t in me.loop_triangles])
        if len(idx):
            tris.append(co[idx][:, :, [0, 2]])
    tris = np.concatenate(tris)
    lo = tris.reshape(-1, 2).min(0) - 2 * cell
    hi = tris.reshape(-1, 2).max(0) + 2 * cell
    w, h = (np.ceil((hi - lo) / cell).astype(int) + 1)
    mask = np.zeros((h, w), dtype=bool)
    for t in tris:
        p = (t - lo) / cell
        u0, v0 = np.floor(p.min(0)).astype(int)
        u1, v1 = np.ceil(p.max(0)).astype(int)
        uu, vv = np.meshgrid(np.arange(u0, u1 + 1), np.arange(v0, v1 + 1))
        q = np.stack([uu.ravel() + 0.5, vv.ravel() + 0.5], 1)
        a, b, c = p
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-12:
            continue
        l1 = ((b[1] - c[1]) * (q[:, 0] - c[0]) + (c[0] - b[0]) * (q[:, 1] - c[1])) / d
        l2 = ((c[1] - a[1]) * (q[:, 0] - c[0]) + (a[0] - c[0]) * (q[:, 1] - c[1])) / d
        inside = (l1 >= -1e-6) & (l2 >= -1e-6) & (1 - l1 - l2 >= -1e-6)
        mask[vv.ravel()[inside], uu.ravel()[inside]] = True
    loops = sil.outline_polygons(mask, 1.5, min_area_frac=0.0005)
    loops_body = [lp * cell + lo for lp in loops]
    return geo.flat_shape(name, loops_body, 'SCENERY_TREE_SHADOW', 'Shadow')
