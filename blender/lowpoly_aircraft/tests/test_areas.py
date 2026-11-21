"""Key areas and marks (lpa/areas.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lpa import areas as A  # noqa: E402
from lpa import refs as R  # noqa: E402


def refset(areas=None):
    return R.from_json({'aircraft': 'x', 'length_m': 20.0, 'areas': areas or {}, 'images': [
        {'id': 'sheet', 'kind': 'sheet', 'views': [
            {'view': 'side', 'crop': [0, 0, 300, 100], 'cal': {'nose': [50, 50], 'px_per_m': 10}},
            {'view': 'top', 'crop': [0, 100, 300, 300], 'cal': {'nose': [50, 200], 'px_per_m': 10}},
            {'view': 'front', 'crop': [300, 0, 500, 100], 'cal': {'nose': [400, 50], 'px_per_m': 10}}]}]})


class Catalog(unittest.TestCase):
    def test_fifty_unique_areas(self):
        cat = A.load_catalog()
        self.assertEqual(len(cat), 50)
        self.assertEqual(len({a['id'] for a in cat}), 50)
        for a in cat:
            self.assertIn(a['shape'], A.SHAPES)
            self.assertIn(a['need'], ('always', 'if present'))
            self.assertTrue(a['views'] and set(a['views']) <= set(R.VIEW_TYPES), a['id'])
            self.assertTrue(a['name'] and a['hint'], a['id'])


class Marks(unittest.TestCase):
    def test_status(self):
        self.assertEqual(A.status(None), 'missing')
        self.assertEqual(A.status({'marks': [{'pts': [[1, 2]]}]}), 'marked')
        self.assertEqual(A.status({'status': 'absent'}), 'absent')
        self.assertEqual(A.status({'status': 'bogus'}), 'missing')

    def test_mark_picks_the_view_holding_it(self):
        rs = refset()
        self.assertEqual(A.view_for_mark(rs, {'img': 'sheet', 'pts': [[100, 40]]}).view, 'side')
        self.assertEqual(A.view_for_mark(rs, {'img': 'sheet', 'pts': [[100, 180]]}).view, 'top')
        self.assertIsNone(A.view_for_mark(rs, {'img': 'sheet', 'pts': [[600, 40]]}))
        self.assertIsNone(A.view_for_mark(rs, {'img': 'other', 'pts': [[100, 40]]}))

    def test_measure_in_metres(self):
        rs = refset()
        m = A.measure(rs, 'canopy', {'marks': [{'img': 'sheet', 'pts': [[100, 40], [150, 30]]}]})
        self.assertEqual(m[0].view, 'side')
        np.testing.assert_allclose(m[0].dxy[:, [0, 2]], [[5, 1], [10, 2]])
        self.assertTrue(np.isnan(m[0].dxy[:, 1]).all())

    def test_station_sets_d_of_a_section(self):
        rs = refset()
        m = A.measure(rs, 'fuse_sections', {'marks': [{'img': 'sheet', 'pts': [[410, 40]], 'station_d': 4.2}]})
        np.testing.assert_allclose(m[0].dxy, [[4.2, 1.0, 1.0]])

    def test_coverage(self):
        rs = refset({'canopy': {'marks': [{'img': 'sheet', 'pts': [[100, 40]]}, {'img': 'sheet', 'pts': [[900, 900]]}]},
                     'canards': {'status': 'absent'}})
        rows = {r['id']: r for r in A.coverage(rs, rs.areas)}
        self.assertEqual(len(rows), 50)
        self.assertEqual((rows['canopy']['status'], rows['canopy']['marks'], rows['canopy']['measured']), ('marked', 2, 1))
        self.assertEqual(rows['canopy']['views'], ['side'])
        self.assertEqual(rows['canards']['status'], 'absent')
        self.assertEqual(rows['nose_tip']['status'], 'missing')


if __name__ == '__main__':
    unittest.main()
