"""Spec numbers from marks and the deviation check (lpa/from_refs.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import json
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from lpa import from_refs as F  # noqa: E402
from lpa import refs as R  # noqa: E402

SU33 = os.path.join(HERE, 'examples', 'su33')


def side_top_set(areas):
    """A sheet with a side view (nose left) and a top view (nose up), 10 px/m, noses at (100, 100) and (100, 300)."""
    return R.from_json({'aircraft': 'x', 'areas': areas, 'images': [{'id': 's', 'kind': 'sheet', 'views': [
        {'view': 'side', 'crop': [0, 0, 400, 200], 'cal': {'nose': [100, 100], 'px_per_m': 10}},
        {'view': 'top', 'crop': [0, 200, 400, 600], 'cal': {'nose': [100, 300], 'px_per_m': 10, 'nose_dir': 'up'}}]}]})


def box_tris(x0, x1, y0, y1, z0, z1):
    """Triangles of an axis-aligned box in the body frame."""
    c = np.array([[x, y, z] for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)], float)
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    tri = []
    for a, b, e, d in faces:
        tri += [[c[a], c[b], c[e]], [c[a], c[e], c[d]]]
    return np.array(tri)


class Su33Spec(unittest.TestCase):
    """The Su-33's marks (detected from its drawing, then confirmed) against its hand-made spec."""

    @classmethod
    def setUpClass(cls):
        cls.rs = R.load(os.path.join(SU33, 'refs.json'))
        with open(os.path.join(SU33, 'spec.json')) as f:
            cls.spec = json.load(f)
        cls.fr = F.frame_from_spec(cls.spec)

    def test_frame(self):
        self.assertAlmostEqual(self.fr.nose_z, 12.714)

    def test_wing_tip_station(self):
        got = F.wing_stations(self.rs, self.fr)['stations'][-1]
        want = next(p for p in self.spec['parts'] if p['name'] == 'Wing')['stations'][-1]
        self.assertAlmostEqual(got[0], want[0], delta=0.1)      # span
        self.assertAlmostEqual(got[2], want[2], delta=0.08)     # leading edge z
        self.assertAlmostEqual(got[3], want[3], delta=0.08)     # chord

    def test_tailplane_from_its_outline(self):
        st = F.outline_stations(self.rs, self.fr, 'htail')['stations']
        self.assertAlmostEqual(st[-1][0], 4.95, delta=0.1)
        self.assertAlmostEqual(st[-1][3], 0.9, delta=0.15)

    def test_fuselage_rows(self):
        rows = F.fuselage_stations(self.rs, self.fr, count=10)['stations']
        self.assertEqual(len(rows), 10)
        self.assertAlmostEqual(rows[0][0], 12.714)
        self.assertEqual(rows[0][3], 0.0)
        self.assertTrue(all(r[4] >= 0 for r in rows))


class Helpers(unittest.TestCase):
    def test_gear_and_surface(self):
        rs = side_top_set({
            'gear_main': {'marks': [{'img': 's', 'pts': [[180, 110], [181, 130]]}]},
            'ailerons': {'marks': [{'img': 's', 'pts': [[50, 380], [40, 390], [40, 395], [50, 385]]}]}})
        fr = F.Frame(nose_z=10.0, nose_y=1.0)
        g = F.gear_contacts(rs, fr)['gear_main']
        self.assertAlmostEqual(g['y'], -2.0)                    # 3 m below the nose (y 1.0)
        self.assertAlmostEqual(g['z'], 1.9)                     # 8.1 m aft
        poly = F.surface_polygon(rs, fr, 'ailerons')
        self.assertEqual(poly['view'], 'top')
        np.testing.assert_allclose(poly['polygon_m'][0], [5.0, 2.0])   # x 5 (left), d 8

    def test_deviation_finds_a_shifted_line(self):
        # A box 10 m long (nose at z 10), 2 m tall above y -1: the side view's top edge is y = 1.
        tris = box_tris(-1, 1, -1, 1, 0, 10)
        fr = F.Frame(nose_z=10.0, nose_y=0.0)
        on = [[110, 90], [150, 90], [190, 90]]                 # y +1 m, d 1..9
        off = [[110, 87], [150, 87], [190, 87]]                # y +1.3 m
        for pts, ok in ((on, True), (off, False)):
            rs = side_top_set({'fuse_top': {'marks': [{'img': 's', 'pts': pts}]}})
            d = F.deviations(tris, rs, fr)
            self.assertEqual(len(d), 1)
            self.assertEqual(d[0]['ok'], ok, d)
        self.assertAlmostEqual(d[0]['max_m'], 0.3, delta=0.03)

    def test_report(self):
        rs = side_top_set({'canards': {'status': 'absent'}})
        text = F.report(rs, [{'area': 'fin', 'view': 'side', 'mean_m': 0.2, 'max_m': 0.4, 'worst': [15.0, 2.0], 'ok': False}])
        self.assertIn('not finished', text)
        self.assertIn('OFF fin', text)


if __name__ == '__main__':
    unittest.main()
