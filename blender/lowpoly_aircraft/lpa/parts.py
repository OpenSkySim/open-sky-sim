"""Shaped parts in the body frame: lofted fuselages and nacelles, profiled panels.

The silhouette builder (visual hull) gives boxy bodies. A realistic low-poly
model (a few thousand triangles) is built from parts instead:

* ``loft``  a fuselage, nacelle, canopy or nozzle: superellipse cross-sections
  along the length, each station giving its centre, half-width, height above
  and below the centre and squareness (2 = ellipse, higher = boxier).
* ``panel`` a wing, tailplane, canard or fin: an airfoil (symmetric NACA
  thickness) swept between spanwise stations, each giving its leading-edge
  point, chord and thickness ratio.
* ``strut`` a round tube between two points in any direction (gear legs,
  braces, a rotor mast), with an optional radius at each end.
* ``rotor`` a helicopter rotor: blades about the vertical (+Y) axis through
  its centre plus the hub, one object (spins with 'join': 'spin').

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
from . import sections


catmull_rom = sections.catmull_rom   # kept here for older imports


def loft(name: str, stations, segments: int = 24, resample: int = 0, material: str = 'VEHICLE_PLANE_GREY',
         collection: str = 'Construction', refined=(), log: dict | None = None) -> bpy.types.Object:
    """Closed tube through superellipse sections.

    stations: rows of (z, cx, cy, half_width, above, below, n[, n_top]), nose first. The optional n_top
    gives the upper half its own squareness (lower = sides leaning in more towards the top).
    A station with half_width or height ~0 closes the tube to a point. ``refined``: cross-sections
    drawn in the Hangar (see sections.py) that replace the ring at their station.
    """
    rings, ts, _ = sections.loft_rings(stations, segments, resample, refined, name)
    if log is not None:
        sections.log_loft(log['part'], log['instance'], log['mirrored'], rings, ts)
    bm = bmesh.new()
    verts = []
    for z, pts in rings:
        verts.append([bm.verts.new(geo.to_bl((x, y, z))) for x, y in pts])
    _skin(bm, verts)
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


def _tube_into(bm, a, b, r0: float, r1: float, sides: int) -> None:
    """Closed n-sided tube from a to b (body frame), radius r0 at a and r1 at b."""
    a, b = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    ax = b - a
    length = np.linalg.norm(ax)
    if length < 1e-6:
        return
    ax /= length
    ref = np.array([0.0, 1.0, 0.0]) if abs(ax[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(ax, ref)
    u /= np.linalg.norm(u)
    v = np.cross(ax, u)
    rings = []
    for c, r in ((a, r0), (b, r1)):
        ring = []
        for k in range(sides):
            t = 2 * math.pi * (k + 0.5) / sides
            ring.append(bm.verts.new(geo.to_bl(c + r * (math.cos(t) * u + math.sin(t) * v))))
        rings.append(ring)
    m = sides
    for k in range(m):
        bm.faces.new((rings[0][k], rings[0][(k + 1) % m], rings[1][(k + 1) % m], rings[1][k]))
    bm.faces.new(rings[0])
    bm.faces.new(rings[1])


def _ring_into(bm, a, b, ro0: float, ro1: float, ri0: float, ri1: float, sides: int) -> None:
    """Hollow round duct from a to b: outer wall ro0 -> ro1, inner wall ri0 -> ri1, annular ends."""
    a, b = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    ax = b - a
    length = np.linalg.norm(ax)
    if length < 1e-6:
        return
    ax /= length
    ref = np.array([0.0, 1.0, 0.0]) if abs(ax[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(ax, ref)
    u /= np.linalg.norm(u)
    v = np.cross(ax, u)
    def ring(c, r):
        return [bm.verts.new(geo.to_bl(c + r * (math.cos(t) * u + math.sin(t) * v)))
                for t in (2 * math.pi * (k + 0.5) / sides for k in range(sides))]
    oa, ob, ia, ib = ring(a, ro0), ring(b, ro1), ring(a, ri0), ring(b, ri1)
    m = sides
    for k in range(m):
        n = (k + 1) % m
        bm.faces.new((oa[k], oa[n], ob[n], ob[k]))
        bm.faces.new((ia[n], ia[k], ib[k], ib[n]))
        bm.faces.new((oa[n], oa[k], ia[k], ia[n]))
        bm.faces.new((ob[k], ob[n], ib[n], ib[k]))


def duct(name: str, a, b, radius: float, radius_b: float, inner: float, inner_b: float, sides: int = 12,
         material: str = 'VEHICLE_PLANE_GREY', collection: str = 'Construction') -> bpy.types.Object:
    """A hollow round duct (intake or exhaust) from *a* to *b*: open at both ends."""
    bm = bmesh.new()
    _ring_into(bm, a, b, radius, radius_b, inner, inner_b, sides)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _object(bm, name, material, collection)


def strut(name: str, a, b, radius: float, radius_b: float | None = None, sides: int = 6,
          material: str = 'VEHICLE_PLANE_GREY', collection: str = 'Construction') -> bpy.types.Object:
    """A round tube from point *a* to point *b* (body metres): gear legs, braces, a mast."""
    bm = bmesh.new()
    _tube_into(bm, a, b, radius, radius if radius_b is None else radius_b, sides)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _object(bm, name, material, collection)


def rotor(name: str, center, radius: float, blades: int = 3, root_r: float = 0.5, chord: float = 0.52,
          tc: float = 0.1, pitch_deg: float = 6.0, droop_deg: float = 0.0, phase_deg: float = 0.0,
          hand: float = 1.0, hub_r: float = 0.3, hub_h: float = 0.3, hub_sides: int = 8,
          tip_chord: float | None = None, chord_points: int = 5, material: str = 'VEHICLE_PLANE_ENGINE',
          collection: str = 'Construction', head: dict | None = None, blade_set=None,
          hub: bool = True) -> bpy.types.Object:
    """Helicopter rotor about the body +Y axis through *center*: straight blades and a hub, one object.

    *hand* is the turn about +Y: +1 is anticlockwise seen from above (the nose swings towards the
    left wing, +X), -1 clockwise. Leading edges lead that turn. *droop_deg* bends the blades down
    from the hub (a rotor at rest), *pitch_deg* is the blade angle. A blade has a root cuff
    (spar tube) from the hub to *root_r*, then the airfoil out to the tip.

    *head* adds the rotating head mechanics (all turn with the rotor): per blade a grip sleeve with
    a hinge knuckle, a pitch horn and a pitch link down to a rotating swashplate ring
    ('link' m below the hub, ring radius 'ring_r'); optional 'tie_rods' [dy0, dy1, r] (rods
    parallel to the axis between the blades, e.g. up to the other rotor's swashplate) and 'cap'
    (a dome on top of the hub).

    *blade_set* limits the airfoil panels to those blade indices (None: all) and *hub* False
    leaves out everything else, so folding blades can be built as their own objects.
    """
    c = np.asarray(center, dtype=np.float64)
    bm = bmesh.new()
    pitch, droop = math.radians(pitch_deg), math.radians(droop_deg)
    tip_c = chord if tip_chord is None else tip_chord
    up = np.array([0.0, 1.0, 0.0])
    for k in range(blades):
        th = math.radians(phase_deg) + 2 * math.pi * k / blades
        radial = np.array([math.sin(th), 0.0, math.cos(th)])
        # Direction of travel of this blade for a turn of +1 about +Y (y up): +Z -> +X.
        travel = hand * np.cross(up, radial)
        span = radial * math.cos(droop) - up * math.sin(droop)
        # Chord runs from the leading edge back against the travel; pitched nose up.
        cd = -travel * math.cos(pitch) - up * math.sin(pitch)
        nrm = np.cross(span, cd)
        if nrm[1] < 0:
            nrm = -nrm
        rows = []
        for r, ch in ((root_r, chord), (0.5 * (root_r + radius), chord), (radius, tip_c)):
            mid = c + span * r
            le = mid - cd * ch * 0.25
            rows.append([*le, ch, tc])
        if blade_set is None or k in blade_set:
            _panel_into(bm, np.array(rows), chord_points, normal=nrm, chord_dir=cd)
        if not hub:
            continue
        # Spar tube from the hub out to the blade root.
        _tube_into(bm, c + span * (0.6 * hub_r), c + span * (root_r + 0.05), 0.05, 0.045, 4)
        if head:
            lead = travel / max(np.linalg.norm(travel), 1e-9)
            # Grip sleeve over the spar, a vertical hinge knuckle at the hub and a damper beside it.
            _tube_into(bm, c + span * (hub_r + 0.12), c + span * (root_r - 0.05), 0.065, 0.055, 4)
            k0 = c + span * (hub_r + 0.05)
            _tube_into(bm, k0 - up * 0.1, k0 + up * 0.1, 0.045, 0.045, 4)
            _tube_into(bm, c + span * (hub_r * 0.5) - lead * 0.16 + up * 0.08,
                       c + span * (hub_r + 0.3) - lead * 0.12 + up * 0.08, 0.02, 0.02, 4)
            # Pitch horn to the leading side, pitch link down to the rotating swashplate ring.
            g = c + span * (hub_r + 0.22)
            horn = g + lead * 0.26 - up * 0.04
            _tube_into(bm, g, horn, 0.028, 0.022, 4)
            foot = c - up * head.get('link', 0.3)
            ring_r = head.get('ring_r', 0.34)
            rh = horn - up * float(np.dot(horn - c, up))
            rdir = (rh - c) / max(np.linalg.norm(rh - c), 1e-9)
            link_foot = foot + rdir * ring_r
            _tube_into(bm, horn, link_foot, 0.015, 0.015, 4)
            if head.get('tie_rods'):
                dy0, dy1, tr = head['tie_rods']
                th2 = th + math.pi / blades
                rd = np.array([math.sin(th2), 0.0, math.cos(th2)])
                _tube_into(bm, c + rd * tr + up * dy0, c + rd * tr + up * dy1, 0.018, 0.018, 4)
    # Hub: a short drum on the axis.
    if hub:
        _tube_into(bm, c - up * 0.5 * hub_h, c + up * 0.5 * hub_h, hub_r, hub_r, hub_sides)
    if head and hub:
        foot = c - up * head.get('link', 0.3)
        ring_r = head.get('ring_r', 0.34)
        # Rotating swashplate ring and its hub on the mast.
        _tube_into(bm, foot - up * 0.018, foot + up * 0.018, ring_r + 0.025, ring_r + 0.025, 12)
        _tube_into(bm, foot, c - up * 0.5 * hub_h, 0.075, 0.09, 10)
        if head.get('cap'):
            _tube_into(bm, c + up * 0.5 * hub_h, c + up * (0.5 * hub_h + 0.12), hub_r * 0.8, hub_r * 0.35, hub_sides)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _object(bm, name, material, collection)


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
        refined = spec_part.get('_sections', [])
        if mirrored:
            refined = [sections.mirror_section(s) for s in refined]
        side = '' if not spec_part.get('mirror') else ('Right' if mirrored else 'Left')
        return loft(name, rows, int(spec_part.get('segments', 24)), int(spec_part.get('resample', 0)), material,
                    refined=refined, log={'part': spec_part, 'instance': name + side, 'mirrored': mirrored})
    if kind == 'panel':
        normal = spec_part.get('normal')
        if normal is not None and mirrored:
            normal = [-normal[0], normal[1], normal[2]]
        chord_dir = spec_part.get('chord_dir')
        if chord_dir is not None and mirrored:
            chord_dir = [-chord_dir[0], chord_dir[1], chord_dir[2]]
        return panel(name, rows, int(spec_part.get('chord_points', 9)), int(spec_part.get('resample', 0)),
                     material, normal=normal, chord_dir=chord_dir)
    if kind == 'quad':
        # One flat four-cornered face (2 triangles), e.g. a window frame post on a flat pane.
        pts = [list(q) for q in spec_part['points']]
        if mirrored:
            pts = [[-q[0], q[1], q[2]] for q in reversed(pts)]
        bm = bmesh.new()
        bm.faces.new([bm.verts.new(geo.to_bl(q)) for q in pts])
        return _object(bm, name, material, 'Construction')
    if kind == 'duct':
        a, b = list(spec_part['a']), list(spec_part['b'])
        if mirrored:
            a[0], b[0] = -a[0], -b[0]
        r = float(spec_part['radius'])
        ri = float(spec_part['inner'])
        return duct(name, a, b, r, float(spec_part.get('radius_b', r)), ri, float(spec_part.get('inner_b', ri)),
                    int(spec_part.get('sides', 12)), material)
    if kind == 'strut':
        a, b = list(spec_part['a']), list(spec_part['b'])
        if mirrored:
            a[0], b[0] = -a[0], -b[0]
        return strut(name, a, b, float(spec_part.get('radius', 0.05)),
                     spec_part.get('radius_b'), int(spec_part.get('sides', 6)), material)
    if kind == 'rotor':
        c = list(spec_part['center'])
        if mirrored:
            c[0] = -c[0]
        return rotor(name, c, float(spec_part['radius']), int(spec_part.get('blades', 3)),
                     float(spec_part.get('root_r', 0.5)), float(spec_part.get('chord', 0.52)),
                     float(spec_part.get('tc', 0.1)), float(spec_part.get('pitch_deg', 6.0)),
                     float(spec_part.get('droop_deg', 0.0)), float(spec_part.get('phase_deg', 0.0)),
                     float(spec_part.get('hand', 1.0)), float(spec_part.get('hub_r', 0.3)),
                     float(spec_part.get('hub_h', 0.3)), int(spec_part.get('hub_sides', 8)),
                     spec_part.get('tip_chord'), int(spec_part.get('chord_points', 5)), material,
                     head=spec_part.get('head'), blade_set=spec_part.get('_blade_set'),
                     hub=spec_part.get('_hub', True))
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
