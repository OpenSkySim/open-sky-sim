"""Fit a camera to a photo of the aircraft from a few marked points (stage 4: photo check).

A photo is not measured from; it checks the model. The user marks points the
model knows (its landmarks: nose tip, tail end, wing tips, fin tops, wheels on the
ground) on the photo, a pinhole camera is fitted to them, and the model's edges are
drawn over the photo through that camera. Where the outline and the photo part
ways, the model (or a drawing it came from) is off.

Camera: rotation (axis-angle), position and focal length; the principal point is
the image centre, pixels are square. Image axes: u right, v down. Points are in the
body frame (+X left wing, +Y up, +Z nose). The fit is least squares
(Levenberg-Marquardt) from a ring of starting views, so it needs no first guess.
The Hangar runs the same algorithm in JavaScript (viewer/index.html, fitCamera).

Pure Python + numpy, no bpy.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

# Landmarks the Hangar takes from the model (gear down) and asks for on a photo.
LANDMARKS = {
    'nose': 'Nose tip (the radome, not a pitot probe)',
    'tail': 'Tail end (rearmost point of the fuselage on the centreline, below the fins)',
    'wingtip_l': 'Left wing tip (the pilot\'s left)',
    'wingtip_r': 'Right wing tip',
    'fin_top': 'Top of the fin (single fin)',
    'fin_top_l': 'Top of the left fin (twin fins)',
    'fin_top_r': 'Top of the right fin (twin fins)',
    'wheel_nose': 'Nose wheel, where it touches the ground',
    'wheel_l': 'Left main wheel, where it touches the ground',
    'wheel_r': 'Right main wheel, where it touches the ground',
}
MIN_POINTS = 5          # 7 unknowns; 6 or more points give a check on the fit


def rodrigues(r: np.ndarray) -> np.ndarray:
    th = float(np.linalg.norm(r))
    if th < 1e-12:
        return np.eye(3)
    k = r / th
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + math.sin(th) * K + (1 - math.cos(th)) * K @ K


def rot_to_vec(R: np.ndarray) -> np.ndarray:
    c = max(-1.0, min(1.0, (np.trace(R) - 1) / 2))
    th = math.acos(c)
    if th < 1e-9:
        return np.zeros(3)
    if math.pi - th < 1e-6:
        # 180 degrees: the axis is the column of R + I with the largest norm.
        M = (R + np.eye(3)) / 2
        k = M[:, int(np.argmax(np.diag(M)))]
        return k / np.linalg.norm(k) * th
    v = np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]]) / (2 * math.sin(th))
    return v * th


@dataclass
class Camera:
    R: np.ndarray            # world -> camera (camera x right, y down, z forward)
    t: np.ndarray
    f: float                 # px
    size: tuple              # image (w, h)
    rms: float = float('nan')
    residuals: np.ndarray | None = None

    @property
    def position(self) -> np.ndarray:
        return -self.R.T @ self.t

    def project(self, X) -> tuple[np.ndarray, np.ndarray]:
        """Body-frame points (n, 3) -> pixels (n, 2) and depth (n,); depth <= 0 is behind the camera."""
        Xc = np.asarray(X, dtype=np.float64).reshape(-1, 3) @ self.R.T + self.t
        z = Xc[:, 2]
        with np.errstate(divide='ignore', invalid='ignore'):
            uv = np.stack([self.size[0] / 2 + self.f * Xc[:, 0] / z, self.size[1] / 2 + self.f * Xc[:, 1] / z], axis=-1)
        return uv, z

    def focal_35mm(self) -> float:
        """Focal length as on a 35 mm camera (36 mm across the long side)."""
        return self.f / max(self.size) * 36.0


def _params_to_cam(p: np.ndarray, size) -> Camera:
    return Camera(rodrigues(p[:3]), p[3:6].copy(), float(math.exp(min(max(p[6], 2.0), 14.0))), tuple(size))


def _residual(p: np.ndarray, X: np.ndarray, uv: np.ndarray, size) -> np.ndarray:
    cam = _params_to_cam(p, size)
    got, z = cam.project(X)
    r = (got - uv).ravel()
    # Points behind the camera cost a lot, so the fit never settles there.
    behind = np.repeat(z <= 1e-3, 2)
    r[behind] = 1e4
    return r


def _lm(p: np.ndarray, X, uv, size, iters: int = 80) -> tuple[np.ndarray, float]:
    lam = 1e-3
    r = _residual(p, X, uv, size)
    cost = float(r @ r)
    for _ in range(iters):
        J = np.empty((len(r), len(p)))
        for k in range(len(p)):
            h = 1e-6 * max(1.0, abs(p[k]))
            q = p.copy()
            q[k] += h
            J[:, k] = (_residual(q, X, uv, size) - r) / h
        A = J.T @ J
        g = J.T @ r
        improved = False
        for _ in range(10):
            try:
                step = np.linalg.solve(A + lam * np.diag(np.diag(A) + 1e-9), -g)
            except np.linalg.LinAlgError:
                lam *= 10
                continue
            q = p + step
            rq = _residual(q, X, uv, size)
            cq = float(rq @ rq)
            if cq < cost:
                p, r, lam = q, rq, max(lam / 3, 1e-9)
                improved = cost - cq > 1e-10 * cost
                cost = cq
                break
            lam *= 4
        if not improved:
            break
    return p, cost


def _look_at(C: np.ndarray, target: np.ndarray, up=(0.0, 1.0, 0.0)) -> np.ndarray:
    fwd = target - C
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, np.asarray(up))      # u grows to the right of the image
    if np.linalg.norm(right) < 1e-6:
        right = np.cross(fwd, [0.0, 0.0, 1.0])
    right /= np.linalg.norm(right)
    down = np.cross(fwd, right)
    return np.stack([right, down, fwd])


def fit(X, uv, size) -> Camera:
    """Fit a camera to body-frame points X (n, 3) seen at pixels uv (n, 2) on an image of size (w, h)."""
    X = np.asarray(X, dtype=np.float64).reshape(-1, 3)
    uv = np.asarray(uv, dtype=np.float64).reshape(-1, 2)
    if len(X) < MIN_POINTS:
        raise ValueError(f'need at least {MIN_POINTS} points, got {len(X)}')
    w, h = size
    c = X.mean(axis=0)
    s = 2 * float(np.max(np.linalg.norm(X - c, axis=1)))
    sp = 2 * float(np.max(np.linalg.norm(uv - uv.mean(axis=0), axis=1))) or 1.0
    f0 = 1.2 * max(w, h)
    D = f0 * s / sp
    best = None
    for el in (-50, -20, 10, 40):
        for az in range(0, 360, 30):
            a, e = math.radians(az), math.radians(el)
            C = c + D * np.array([math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)])
            R = _look_at(C, c)
            p0 = np.concatenate([rot_to_vec(R), -R @ C, [math.log(f0)]])
            p, cost = _lm(p0, X, uv, size, 40)
            if best is None or cost < best[1]:
                best = (p, cost)
    p, cost = _lm(best[0], X, uv, size, 200)
    cam = _params_to_cam(p, size)
    got, _ = cam.project(X)
    cam.residuals = np.linalg.norm(got - uv, axis=1)
    cam.rms = float(np.sqrt(np.mean(cam.residuals ** 2)))
    return cam
