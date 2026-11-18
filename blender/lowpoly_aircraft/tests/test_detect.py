"""Area detection (lpa/detect.py) on the generated Su-33 three-view: python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from lpa import areas as A  # noqa: E402
from lpa import detect as D  # noqa: E402
from lpa import refs as R  # noqa: E402
from lpa import silhouette as sil  # noqa: E402

SU33 = os.path.join(HERE, 'examples', 'su33')

try:
    import PIL  # noqa: F401
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False


@unittest.skipUnless(HAVE_PIL, 'needs Pillow to read the drawing')
class Su33(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rs = R.load(os.path.join(SU33, 'refs.json'))
        ink = sil.ink_mask(sil.load_rgba(os.path.join(SU33, 'su33_3view.png')), 0.5)
        sugs, cls.notes = D.detect(cls.rs, {'su33-3view': ink})
        cls.s = {s['area']: s for s in sugs}
        cls.views = {v.view: v for v in cls.rs.views()}

    def m(self, area):
        s = self.s[area]
        return self.views[s['view']].to_m(s['pts'])

    def test_found(self):
        for a in ('nose_tip', 'fuse_top', 'fuse_bottom', 'canopy', 'fin', 'wing_le', 'wing_te', 'wing_tip', 'htail', 'fuse_plan'):
            self.assertIn(a, self.s)
        known = {a['id'] for a in A.load_catalog()}
        self.assertTrue(set(self.s) <= known)

    def test_wing_edges_match_the_drawing(self):
        # make_drawing.py: leading edge from (x 2.3, d 8.6) to the tip at x 7.35, d 13.15; trailing edge
        # d 16.0 - (x - 2.4) * 1.4 / (7.35 - 2.4). Outlines are ~2 px (0.1 m) thick.
        le, te = self.m('wing_le'), self.m('wing_te')
        for d, x in le:
            self.assertAlmostEqual(d, 8.6 + (x - 2.3) * 4.55 / (7.35 - 2.3), delta=0.15)
        for d, x in te:
            self.assertAlmostEqual(d, 16.0 - (x - 2.4) * 1.4 / (7.35 - 2.4), delta=0.15)
        self.assertAlmostEqual(le[:, 1].max(), 7.35, delta=0.1)
        self.assertLess(le[:, 1].min(), 3.0)
        self.assertEqual(self.s['wing_le']['conf'], 'sure')

    def test_fin_and_canopy(self):
        fin, can = self.m('fin'), self.m('canopy')
        # Fin tip 4.3 m above the fuselage bottom, nose at 1.55: y 2.75; leading edge root near d 14.6.
        self.assertAlmostEqual(fin[:, 1].max(), 2.75, delta=0.1)
        self.assertAlmostEqual(fin[:, 0].min(), 14.6, delta=0.6)
        # The hump of the side profile: SIDE_TOP rises from d 3.6 and settles by d 8.8.
        self.assertTrue(3.0 < can[:, 0].min() < 4.5 and 6.0 < can[:, 0].max() < 9.5, can[:, 0])
        top = self.m('fuse_top')
        self.assertLess(top[:, 1].max(), 1.6)       # canopy and fin left out

    def test_tail_length_checked(self):
        self.assertTrue(any('tail at' in n for n in self.notes))


class Helpers(unittest.TestCase):
    def test_snap(self):
        ink = np.zeros((50, 50), bool)
        ink[20, :] = True
        self.assertEqual(D.snap([[10, 17], [30, 40]], ink, 5), [[10.0, 20.0], [30.0, 40.0]])

    def test_merge_keeps_decisions(self):
        areas = {'fin': {'marks': [{'img': 'a', 'pts': [[1, 1]]}]}, 'rudder': {'dismissed': True}}
        s = [{'area': a, 'img': 'a', 'view': 'side', 'pts': [[0, 0]], 'conf': 'check', 'by': 'outline', 'why': ''}
             for a in ('fin', 'rudder', 'canopy')]
        self.assertEqual(D.merge_into(areas, s), ['canopy'])
        self.assertEqual(A.status(areas['canopy']), 'suggested')
        self.assertEqual(A.status(areas['fin']), 'marked')
        self.assertEqual(A.status(areas['rudder']), 'missing')
        # Detecting again replaces the earlier outline suggestion instead of stacking it.
        D.merge_into(areas, s)
        self.assertEqual(len(areas['canopy']['suggest']), 1)


if __name__ == '__main__':
    unittest.main()
