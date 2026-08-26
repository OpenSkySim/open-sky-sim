/* Paste into the browser console WHILE the missing-terrain area is on screen.
   Copy the whole output back. Reports: which build is loaded, LOD state, and
   whether the gap is missing geometry or a rendering problem. */
(() => {
  const te = globalThis.__terrain;
  if (!te) return 'NO __terrain -- terrain entity not booted';
  const cam = te.lodCamera;
  const canvas = document.querySelector('canvas');

  // Recompute world matrices from the top: the renderer leaves them offset by
  // -cameraPosition from its camera-relative submit, which would skew this.
  let root = te.group; while (root.parent) root = root.parent;
  root.position.set(0, 0, 0); root.updateMatrix(); root.updateMatrixWorld(true);
  cam.updateMatrixWorld(true);

  const GW = 64, GH = 24, EPS = 1e-6;
  const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse).elements;
  const grid = new Uint8Array(GW * GH);
  const clipW = (p) => { const o = [];
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length];
      const ai = a[3] > EPS, bi = b[3] > EPS; if (ai) o.push(a);
      if (ai !== bi) { const t = (EPS - a[3]) / (b[3] - a[3]);
        o.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, EPS]); } }
    return o; };
  te.group.traverse(o => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, e = o.matrixWorld.elements;
    const cnt = idx ? idx.count : pos.count;
    for (let t = 0; t + 2 < cnt; t += 3) { const poly = [];
      for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t + k) : (t + k);
        const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
        const wx = e[0]*lx+e[4]*ly+e[8]*lz+e[12], wy = e[1]*lx+e[5]*ly+e[9]*lz+e[13], wz = e[2]*lx+e[6]*ly+e[10]*lz+e[14];
        poly.push([m[0]*wx+m[4]*wy+m[8]*wz+m[12], m[1]*wx+m[5]*wy+m[9]*wz+m[13],
                   m[2]*wx+m[6]*wy+m[10]*wz+m[14], m[3]*wx+m[7]*wy+m[11]*wz+m[15]]); }
      const cp = clipW(poly); if (cp.length < 3) continue;
      const sx = cp.map(v => v[0]/v[3]), sy = cp.map(v => v[1]/v[3]);
      const mnx = Math.min(...sx), mxx = Math.max(...sx), mny = Math.min(...sy), mxy = Math.max(...sy);
      if (mxx < -1 || mnx > 1 || mxy < -1 || mny > 1) continue;
      const x0 = Math.max(0, Math.floor((mnx+1)/2*GW)), x1 = Math.min(GW-1, Math.ceil((mxx+1)/2*GW));
      const y0 = Math.max(0, Math.floor((mny+1)/2*GH)), y1 = Math.min(GH-1, Math.ceil((mxy+1)/2*GH));
      for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
        if (grid[gy*GW+gx]) continue;
        const cx = (gx+0.5)/GW*2-1, cy = (gy+0.5)/GH*2-1; let ins = true, sg = 0;
        for (let i = 0; i < sx.length; i++) { const j = (i+1)%sx.length;
          const d = (cx-sx[j])*(sy[i]-sy[j])-(sx[i]-sx[j])*(cy-sy[j]);
          if (d !== 0) { const s = d > 0 ? 1 : -1; if (!sg) sg = s; else if (s !== sg) { ins = false; break; } } }
        if (ins) grid[gy*GW+gx] = 1; } }
  });
  let cov = 0; for (let i = 0; i < grid.length; i++) cov += grid[i];
  const rows = []; for (let gy = GH-1; gy >= 0; gy--) { let s = '';
    for (let gx = 0; gx < GW; gx++) s += grid[gy*GW+gx] ? '#' : '.'; rows.push(s); }

  const zs = {}; let real = 0, ocean = 0, coarsestOcean = 99, pendingLand = 0;
  for (const n of te.drawList) { zs[n.id.z] = (zs[n.id.z]||0)+1;
    if (te.streamer.get(n.id)) real++;
    else { ocean++; if (te.meshStore.isAbsent(n.id)) coarsestOcean = Math.min(coarsestOcean, n.id.z); else pendingLand++; } }
  const s = te.meshStore.stats, ts = globalThis.__terrainStats || {};
  const fwd = new cam.constructor().position.constructor ? null : null;

  return JSON.stringify({
    BUILD_HAS_GOVERNOR_FIX: (ts.detailScale ?? 99) <= 4.0001,
    BUILD_HAS_OCEAN_FIX: coarsestOcean === 99 ? 'no ocean drawn' : (coarsestOcean >= 7),
    detailScale: ts.detailScale, frameEmaMs: ts.frameEmaMs, altitudeM: ts.altitudeM,
    drawn: te.drawList.length, real, oceanPatches: ocean, pendingLand,
    coarsestOceanZ: coarsestOcean === 99 ? null : coarsestOcean,
    zoomHistogram: zs,
    canvas: [canvas.width, canvas.height], cameraAspect: cam.aspect,
    fov: cam.fov, near: cam.near, far: cam.far, viewportHeightPx: te.viewportHeightPx,
    store: { cached: s.cached, cacheMB: +(s.cacheBytes/1048576).toFixed(1), inflight: s.inflight,
             queued: s.queued, aborted: s.aborted, failed: s.failed, evicted: s.evicted },
    GEOMETRY_COVERAGE_PCT: +(100*cov/(GW*GH)).toFixed(1),
  }, null, 1) + '\n' + rows.join('\n');
})()
