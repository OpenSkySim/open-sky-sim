"""Refined cross-sections on lofts (lpa/sections.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import math
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from lpa import sections as S  # noqa: E402
import sections_tool as T  # noqa: E402

# A plain tube: nose point at z 10, round 1 m sections from z 8 to z 2, point at z 0.
TUBE = [[10, 0, 0, 0, 0, 0, 2], [8, 0, 0, 1, 1, 1, 2], [5, 0, 0, 1, 1, 1, 2], [2, 0, 0, 1, 1, 1, 2], [0, 0, 0, 0, 0, 0, 2]]


def box_section(z, segments=8, hw=1.2, top=0.8, bot=1.0):
    """A boxy outline with one point per even ring vertex (on the box, along the vertex's ray)."""
    pts = []
    for t in S.base_ts(segments):
        c, s = math.cos(t), math.sin(t)
        h = top if s >= 0 else bot
        k = min(hw / abs(c) if abs(c) > 1e-9 else 1e9, h / abs(s) if abs(s) > 1e-9 else 1e9)
        pts.append([k * c, k * s, t])
    return {'part': 'Tube', 'z': z, 'pts': pts}


class Rings(unittest.TestCase):
    def test_no_sections_is_the_plain_superellipse(self):
        rings, ts, used = S.loft_rings(TUBE, 8)
        self.assertEqual(len(rings), 5)
        self.assertEqual(len(ts), 8)
        self.assertEqual(used, [])
        self.assertEqual(rings[0][1].shape, (1, 2))
        np.testing.assert_allclose(rings[1][1][0], [1, 0], atol=1e-12)
        np.testing.assert_allclose(rings[1][1][2], [0, 1], atol=1e-12)

    def test_section_on_a_station_is_exact_and_fades_to_the_neighbours(self):
        sec = box_section(5)
        rings, ts, used = S.loft_rings(TUBE, 8, sections=[sec])
        self.assertEqual(len(used), 1)
        by_z = {round(z, 3): p for z, p in rings}
        np.testing.assert_allclose(by_z[5.0], np.array(sec['pts'])[:, :2], atol=1e-9)
        # The neighbouring stations of the spec keep their round shape.
        np.testing.assert_allclose(np.hypot(*by_z[8.0].T), 1, atol=1e-9)
        np.testing.assert_allclose(np.hypot(*by_z[2.0].T), 1, atol=1e-9)

    def test_section_between_stations_gets_its_own_ring(self):
        sec = box_section(6.5)
        rings, _, _ = S.loft_rings(TUBE, 8, sections=[sec])
        zs = [round(z, 3) for z, _ in rings]
        self.assertIn(6.5, zs)
        self.assertEqual(len(rings), 6)
        ring = dict((round(z, 3), p) for z, p in rings)[6.5]
        np.testing.assert_allclose(ring, np.array(sec['pts'])[:, :2], atol=1e-9)

    def test_inserted_points_add_ring_vertices_to_the_whole_loft(self):
        sec = box_section(5)
        t_new = (S.base_ts(8)[0] + S.base_ts(8)[1]) / 2
        sec['pts'].insert(1, [1.5, 0.5, t_new])
        rings, ts, _ = S.loft_rings(TUBE, 8, sections=[sec])
        self.assertEqual(len(ts), 9)
        self.assertTrue(all(len(p) in (1, 9) for _, p in rings))
        ring = dict((round(z, 3), p) for z, p in rings)[5.0]
        np.testing.assert_allclose(ring[1], [1.5, 0.5], atol=1e-9)
        # On a station without the section the extra vertex lies on the plain superellipse.
        r8 = dict((round(z, 3), p) for z, p in rings)[8.0]
        np.testing.assert_allclose(np.hypot(*r8.T), 1, atol=1e-9)

    def test_removed_point_straightens_the_outline(self):
        sec = box_section(5)
        del sec['pts'][2]                       # the top vertex
        ring = dict((round(z, 3), p) for z, p in S.loft_rings(TUBE, 8, sections=[sec])[0])[5.0]
        a, b = np.array(sec['pts'][1][:2]), np.array(sec['pts'][2][:2])
        # Vertex 2 (t = 90 deg) is now halfway along the edge between its neighbours.
        np.testing.assert_allclose(ring[2], (a + b) / 2, atol=1e-9)

    def test_mirrored_section(self):
        sec = {'part': 'P', 'z': 1, 'pts': [[2, 0, 0], [1, 1, math.pi / 2], [0, 0, math.pi], [1, -1, 1.5 * math.pi]]}
        m = S.mirror_section(sec)
        self.assertEqual([p[:2] for p in m['pts']], [[-2, 0], [-1, 1], [0, 0], [-1, -1]])
        self.assertAlmostEqual(m['pts'][0][2], math.pi)
        self.assertAlmostEqual(m['pts'][2][2], 0)

    def test_section_outside_or_at_a_tip_is_skipped(self):
        _, _, used = S.loft_rings(TUBE, 8, sections=[box_section(12), box_section(10)])
        self.assertEqual(used, [])


class Tool(unittest.TestCase):
    def test_from_docs(self):
        docs = [{'id': 'a', 'data': {'part': 'Fuselage', 'z': 3.14159, 'd': 6, 'pts': [[1, 0, 0], [0, 1, 1.5], [-1, 0, 3.1]]}},
                {'id': 'b', 'data': {'part': 'Fuselage', 'z': 5, 'removed': True, 'pts': []}},
                {'part': 'Canopy', 'z': 4, 'pts': [[1, 0, 0], [0, 1, 1.5], [-1, 0, 3.1]], 'extra': 1}]
        out = T.from_docs(docs, 'lp_x')
        self.assertEqual(out['aircraft'], 'lp_x')
        self.assertEqual([s['part'] for s in out['sections']], ['Canopy', 'Fuselage'])
        self.assertEqual(out['sections'][1]['z'], 3.1416)
        self.assertNotIn('extra', out['sections'][0])

    def test_attach(self):
        spec = {'sections': [box_section(5)], 'parts': [{'type': 'loft', 'name': 'Tube', 'stations': TUBE}]}
        self.assertEqual(S.attach(spec, HERE), 1)
        self.assertEqual(len(spec['parts'][0]['_sections']), 1)


if __name__ == '__main__':
    unittest.main()
