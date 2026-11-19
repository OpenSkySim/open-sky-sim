"""Brush strokes (lpa/brush.py): python3 -m unittest discover -s blender/lowpoly_aircraft/tests"""
import json
import os
import sys
import tempfile
import unittest

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from lpa import brush as B  # noqa: E402


def grid(n=21, w=4.0):
    """A flat sheet of points in x/z at y 0, symmetric about x = 0."""
    g = np.linspace(-w / 2, w / 2, n)
    X, Z = np.meshgrid(g, g)
    return np.stack([X.ravel(), np.zeros(X.size), Z.ravel()], axis=1)


def stroke(**k):
    s = {'id': 's1', 'path': [[1.0, 0.0, 0.0]], 'radius': 0.5, 'vec': [0.0, 0.1, 0.0], 'falloff': 'smooth', 'mirror': False, 'parts': None}
    s.update(k)
    return s


class Falloff(unittest.TestCase):
    def test_shapes(self):
        f = np.array([0.0, 0.5, 1.0, 1.5])
        np.testing.assert_allclose(B.weight(f, 'smooth'), [1, 0.5, 0, 0], atol=1e-12)
        np.testing.assert_allclose(B.weight(f, 'linear'), [1, 0.5, 0, 0])
        np.testing.assert_allclose(B.weight(f, 'constant'), [1, 1, 0, 0])

    def test_path_distance(self):
        P = np.array([[0.0, 1.0, 0.5], [0.0, 0.0, 3.0], [2.0, 0.0, 0.0]])
        d = B.path_dist(P, [[0, 0, 0], [0, 0, 1]])
        np.testing.assert_allclose(d, [1.0, 2.0, 2.0])
        np.testing.assert_allclose(B.path_dist(P[:1], [[0, 0, 0]]), [np.hypot(1, 0.5)])


class Strokes(unittest.TestCase):
    def test_centre_moves_by_the_vector_edge_stays(self):
        P = np.array([[1.0, 0, 0], [1.25, 0, 0], [1.6, 0, 0], [-1.0, 0, 0]])
        Q, moved = B.apply(P, stroke())
        self.assertTrue(moved)
        np.testing.assert_allclose(Q[:, 1], [0.1, 0.05, 0.0, 0.0], atol=1e-12)
        np.testing.assert_allclose(Q[:, [0, 2]], P[:, [0, 2]])

    def test_drag_does_not_add_up(self):
        # A path back and forth over the same spot moves it once.
        P = np.array([[1.0, 0, 0]])
        Q, _ = B.apply(P, stroke(path=[[1, 0, 0], [1, 0, 0.5], [1, 0, 0], [1, 0, 0.5]]))
        self.assertAlmostEqual(Q[0, 1], 0.1)

    def test_mirror_keeps_the_sheet_symmetric(self):
        P = grid()
        s = stroke(path=[[0.8, 0, -0.5], [0.3, 0, 0.4]], radius=0.9, vec=[0.2, 0.15, -0.05], mirror=True)
        Q, _ = B.apply(P, s)
        flip = np.array([-1.0, 1.0, 1.0])
        # The mirror image of every moved point is a moved point.
        order = {tuple(np.round(p, 6)): i for i, p in enumerate(P)}
        for i, p in enumerate(P):
            j = order[tuple(np.round(p * flip, 6))]
            np.testing.assert_allclose(Q[j], Q[i] * flip, atol=1e-12)
        centre = np.abs(P[:, 0]) < 1e-9
        np.testing.assert_allclose(Q[centre, 0], 0.0, atol=1e-12)
        self.assertGreater(np.abs(Q - P).max(), 0.1)

    def test_stroke_on_the_centreline_drops_sideways_move(self):
        P = grid()
        Q, _ = B.apply(P, stroke(path=[[0, 0, 0]], radius=0.6, vec=[0.3, 0.1, 0], mirror=True))
        np.testing.assert_allclose(Q[:, 0], P[:, 0], atol=1e-12)
        self.assertAlmostEqual(Q[:, 1].max(), 0.1)

    def test_parts(self):
        s = stroke(parts=['Wing_L'])
        self.assertTrue(B.applies_to(s, 'Wing_L'))
        self.assertTrue(B.applies_to(stroke(parts=['Flap_L001']), 'Flap_L.001'))
        self.assertFalse(B.applies_to(s, 'Fuselage'))
        self.assertTrue(B.applies_to(stroke(), 'Fuselage'))

    def test_strokes_follow_each_other(self):
        P = np.array([[1.0, 0, 0]])
        P1, _ = B.apply(P, stroke(vec=[0, 0.3, 0]))
        # The second stroke sits where the first left the point: still inside its radius.
        P2, moved = B.apply(P1, stroke(path=[[1.0, 0.3, 0.0]], radius=0.1, vec=[0, 0, 0.2]))
        self.assertTrue(moved)
        np.testing.assert_allclose(P2[0], [1.0, 0.3, 0.2])


class Files(unittest.TestCase):
    def test_from_docs_and_spec(self):
        docs = [
            {'id': 'b2', 'data': {'aircraft': 'lp_x', 't': '2026-11-19T10:02:00Z', 'path': [[0, 1, 2]], 'radius': 0.4, 'vec': [0, 0.05, 0], 'falloff': 'linear', 'mirror': True}},
            {'id': 'b1', 'data': {'aircraft': 'lp_x', 't': '2026-11-19T10:01:00Z', 'path': [[0, 1, 2], [0, 1, 3]], 'radius': 0.5, 'vec': [0, 0, 0.1], 'parts': ['Body']}},
            {'id': 'bad', 'data': {'radius': 0.5}},
            {'id': 'gone', 'data': {'removed': True, 'path': [[0, 0, 0]], 'radius': 1, 'vec': [0, 1, 0]}},
        ]
        out = B.from_docs(docs)
        self.assertEqual(out['aircraft'], 'lp_x')
        self.assertEqual([s['id'] for s in out['strokes']], ['b1', 'b2'])
        self.assertEqual(out['strokes'][0]['falloff'], 'smooth')
        self.assertEqual(out['strokes'][1]['falloff'], 'linear')
        with tempfile.TemporaryDirectory() as d:
            spec = os.path.join(d, 'spec.json')
            with open(spec, 'w') as f:
                json.dump({'id': 'lp_x'}, f)
            self.assertEqual(B.for_spec(spec), ([], None))
            with open(os.path.join(d, 'brush.json'), 'w') as f:
                json.dump(out, f)
            strokes, path = B.for_spec(spec)
            self.assertEqual(len(strokes), 2)
            self.assertTrue(path.endswith('brush.json'))
            self.assertEqual(B.for_spec(spec, {'brush': False}), ([], None))


if __name__ == '__main__':
    unittest.main()
