"""Photo camera fit (lpa/camera.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import math
import os
import sys
import unittest

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lpa import camera as C  # noqa: E402

# Landmarks of a fighter-sized model, gear down (body frame: +X left wing, +Y up, +Z nose).
PTS = np.array([
    [0.0, 0.0, 8.7],      # nose
    [0.0, -0.2, -8.6],    # tail
    [6.0, 0.1, -3.5],     # left wing tip
    [-6.0, 0.1, -3.5],    # right wing tip
    [1.6, 3.4, -7.2],     # left fin top
    [-1.6, 3.4, -7.2],    # right fin top
    [0.0, -1.9, 5.0],     # nose wheel
    [1.6, -1.9, -0.8],    # left main wheel
    [-1.6, -1.9, -0.8],   # right main wheel
])


def make_cam(az, el, roll, dist, f, size=(1600, 1000)):
    a, e = math.radians(az), math.radians(el)
    pos = dist * np.array([math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)])
    R = C._look_at(pos, np.zeros(3))
    R = C.rodrigues(np.array([0, 0, math.radians(roll)])) @ R
    return C.Camera(R, -R @ pos, f, size)


class Fit(unittest.TestCase):
    def check(self, cam, idx, noise=0.0, seed=1):
        uv, z = cam.project(PTS[idx])
        self.assertTrue((z > 0).all())
        uv = uv + np.random.default_rng(seed).normal(0, noise, uv.shape)
        got = C.fit(PTS[idx], uv, cam.size)
        self.assertLess(got.rms, max(1e-3, 2 * noise))
        np.testing.assert_allclose(got.position, cam.position, rtol=0.05, atol=0.5)
        self.assertAlmostEqual(got.f / cam.f, 1, delta=0.05)
        # The outline drawn through the fitted camera lands where the true one puts it.
        allp, _ = cam.project(PTS)
        np.testing.assert_allclose(got.project(PTS)[0], allp, atol=max(0.01, 4 * noise))

    def test_three_quarter_front_from_below(self):
        self.check(make_cam(35, -12, 3, 40, 2400), range(9))

    def test_rear_from_above_with_noise(self):
        self.check(make_cam(200, 25, -5, 60, 4000), range(9), noise=0.7)

    def test_in_flight_six_points(self):
        # Gear up: nose, tail, wing tips and fin tops only.
        self.check(make_cam(-70, 8, 10, 35, 1800), range(6))

    def test_needs_five_points(self):
        with self.assertRaises(ValueError):
            C.fit(PTS[:4], np.zeros((4, 2)), (100, 100))

    def test_rotation_round_trip(self):
        for r in ([0.3, -1.2, 0.5], [0, 0, 3.1], [2.0, 1.0, -0.4]):
            np.testing.assert_allclose(C.rot_to_vec(C.rodrigues(np.array(r))), r, atol=1e-6)


if __name__ == '__main__':
    unittest.main()
