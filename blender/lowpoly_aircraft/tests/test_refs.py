"""Reference calibration (lpa/refs.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lpa import refs as R  # noqa: E402


def view(v, **cal):
    cal.setdefault('px_per_m', 10.0)
    cal.setdefault('nose', [100, 50])
    return R.view_from_json('img', {'view': v, 'cal': cal}, ground_y=-2.0)


class Directions(unittest.TestCase):
    def test_side_nose_left(self):
        rv = view('side', nose_dir='left')
        # 5 m aft (to the right) and 1 m up.
        np.testing.assert_allclose(rv.to_m([[150, 40]]), [[5.0, 1.0]])

    def test_side_nose_right(self):
        rv = view('side', nose_dir='right')
        np.testing.assert_allclose(rv.to_m([[50, 50]]), [[5.0, 0.0]])

    def test_top_nose_up_left_wing_on_the_left(self):
        rv = view('top', nose_dir='up')
        np.testing.assert_allclose(rv.to_m([[80, 150]]), [[10.0, 2.0]])     # d 10, x +2 (left)

    def test_top_nose_left(self):
        # Nose to the left: looking down, the left wing is at the bottom of the image.
        rv = view('top', nose_dir='left')
        np.testing.assert_allclose(rv.to_m([[200, 70]]), [[10.0, 2.0]])

    def test_bottom_is_mirrored(self):
        top = view('top', nose_dir='right')
        bottom = view('bottom', nose_dir='right')
        np.testing.assert_allclose(top.to_m([[50, 70]])[0, 1], -bottom.to_m([[50, 70]])[0, 1])

    def test_front_left_wing_on_the_right(self):
        np.testing.assert_allclose(view('front').to_m([[130, 50]]), [[3.0, 0.0]])
        np.testing.assert_allclose(view('rear').to_m([[130, 50]]), [[-3.0, 0.0]])

    def test_dxy(self):
        out = view('side').to_dxy([[150, 40]])[0]
        self.assertEqual(out[0], 5.0)
        self.assertTrue(np.isnan(out[1]))
        self.assertEqual(out[2], 1.0)


class Calibration(unittest.TestCase):
    def test_scale_from_two_points(self):
        rv = R.view_from_json('img', {'view': 'side', 'cal': {'nose': [0, 0], 'scale': {'a': [10, 0], 'b': [40, 40], 'm': 5}}})
        self.assertAlmostEqual(rv.px_per_m, 10.0)

    def test_ground_sets_nose_height(self):
        rv = view('side', ground=[300, 70])          # ground 2 m below the nose
        self.assertAlmostEqual(rv.nose_y_m, 0.0)     # ground_y -2 -> nose at y 0
        rv = view('side', ground=[300, 80])
        self.assertAlmostEqual(rv.nose_y_m, 1.0)
        self.assertAlmostEqual(rv.to_m([[300, 80]])[0, 1], -2.0)

    def test_rotation_levels_the_image(self):
        # A side view drawn 10 deg nose-down (tail up): turning it 10 deg clockwise levels it.
        a = np.radians(10)
        p = [100 + 50 * np.cos(a), 50 - 50 * np.sin(a)]
        rv = view('side', rot_deg=-10)
        np.testing.assert_allclose(rv.to_m([p]), [[5.0, 0.0]], atol=1e-9)

    def test_round_trip(self):
        for v, nd in (('top', 'left'), ('bottom', 'down'), ('side', 'right'), ('front', 'up'), ('rear', 'up')):
            rv = view(v, nose_dir=nd, rot_deg=3.5, ground=[120, 90])
            px = np.array([[13.0, 77.0], [240.0, 5.0]])
            np.testing.assert_allclose(rv.to_px(rv.to_m(px)), px, atol=1e-9)

    def test_scale_from_the_box(self):
        # Nose at u 100, nose pointing left, box reaching to u 300: 200 px = 20 m long -> 10 px/m.
        v = {'view': 'side', 'crop': [90, 0, 300, 100], 'cal': {'nose': [100, 50]}}
        self.assertAlmostEqual(R.view_from_json('img', v, length_m=20.0).px_per_m, 10.0)
        # Front view: the box width is the span.
        v = {'view': 'front', 'crop': [0, 0, 240, 100], 'cal': {'nose': [120, 50]}}
        self.assertAlmostEqual(R.view_from_json('img', v, span_m=12.0).px_per_m, 20.0)
        with self.assertRaises(R.RefError):
            R.view_from_json('img', {'view': 'side', 'cal': {'nose': [0, 0]}}, length_m=20.0)

    def test_missing_nose(self):
        with self.assertRaises(R.RefError):
            R.view_from_json('img', {'view': 'side', 'cal': {'px_per_m': 10}})


class Extent(unittest.TestCase):
    def test_extent_inside_crop(self):
        mask = np.zeros((100, 400), bool)
        mask[40:60, 100:300] = True                   # a 20 m long, 2 m tall bar
        mask[0:5, 0:5] = True                         # ink outside the crop is ignored
        rv = R.view_from_json('img', {'view': 'side', 'crop': [50, 20, 350, 90],
                                      'cal': {'nose': [100, 50], 'px_per_m': 10}})
        lo, hi = R.extent_m(rv, mask)
        np.testing.assert_allclose(lo, [0.0, -0.9])
        np.testing.assert_allclose(hi, [19.9, 1.0])

    def test_issues(self):
        rs = R.from_json({'aircraft': 'x', 'images': [
            {'id': 'a', 'kind': 'sheet', 'views': []},
            {'id': 'b', 'kind': 'photo'},
            {'id': 'c', 'kind': 'view', 'views': [{'view': 'top', 'cal': {}}]}]})
        msgs = rs.issues()
        self.assertEqual(len(msgs), 2)
        self.assertIn('no views', msgs[0])
        self.assertIn('nose tip', msgs[1])


if __name__ == '__main__':
    unittest.main()
