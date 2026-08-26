/* Paste into the browser console WHILE an island that should be visible is not.
   For each Canary island it reports what the terrain is currently drawing over
   it: real baked mesh, sea-because-the-index-says-so, FAKE SEA (a land tile the
   renderer replaced with a flat patch because its mesh had not arrived), or
   nothing at all -- and, when nothing, which culling test rejected it. */
(() => {
  const te = globalThis.__terrain;
  if (!te) return 'NO __terrain -- terrain entity not booted';
  const cam = te.lodCamera;
  if (!cam) return 'NO lodCamera';

  // Recompute world matrices from the top: the renderer leaves them offset by
  // -cameraPosition from its camera-relative submit, which would skew this.
  let root = te.group; while (root.parent) root = root.parent;
  root.position.set(0, 0, 0); root.updateMatrix(); root.updateMatrixWorld(true);
  cam.updateMatrixWorld(true);

  const ISLANDS = {
    GranCanaria: [28.02, -15.58], Tenerife: [28.27, -16.64], LaGomera: [28.11, -17.23],
    LaPalma: [28.68, -17.85], ElHierro: [27.74, -18.02],
    Fuerteventura: [28.40, -14.02], Lanzarote: [29.03, -13.62],
  };

  const R = 6378137, earth = te.earthCenter, alt = cam.position.y;
  const h = Math.max(0, alt);
  const range = Math.min(3e6, Math.max(450000, Math.sqrt(2 * R * h + h * h) * 1.15));
  const MARGIN_TAN = Math.tan(Math.PI * (100 / 1000) * 1.2);   // FRUSTUM_CULL_MARGIN

  const planes = [];
  { const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse).elements;
    const pl = (a,b,c,d) => { const l = Math.hypot(a,b,c); return [a/l,b/l,c/l,d/l]; };
    planes.push(pl(m[3]-m[0], m[7]-m[4], m[11]-m[8],  m[15]-m[12]));
    planes.push(pl(m[3]+m[0], m[7]+m[4], m[11]+m[8],  m[15]+m[12]));
    planes.push(pl(m[3]+m[1], m[7]+m[5], m[11]+m[9],  m[15]+m[13]));
    planes.push(pl(m[3]-m[1], m[7]-m[5], m[11]-m[9],  m[15]-m[13]));
    planes.push(pl(m[3]-m[2], m[7]-m[6], m[11]-m[10], m[15]-m[14]));
    planes.push(pl(m[3]+m[2], m[7]+m[6], m[11]+m[10], m[15]+m[14])); }
  const inFrustum = (c, r) => planes.every(p => p[0]*c.x + p[1]*c.y + p[2]*c.z + p[3] >= -r);
  const behindHorizon = (c, r) => {
    const toCam = cam.position.clone().sub(earth), camDist = toCam.length();
    if (camDist <= R) return false;
    const sinH = R / camDist, cosH = Math.sqrt(Math.max(0, 1 - sinH * sinH));
    const toP = c.clone().sub(earth), pd = toP.length();
    if (pd < 1) return false;
    return toCam.dot(toP) / (camDist * pd) < cosH - r / Math.max(pd, 1);
  };

  const drawn = new Map(te.drawList.map(n => [n.key, n]));
  const kindOf = (n) => te.streamer.get(n.id) ? 'MESH'
    : (te.meshStore.isAbsent(n.id) ? 'sea(index)' : 'FAKE-SEA');

  // Whole draw list, so a latched fake-sea tile shows up even off-island.
  const summary = { MESH: 0, 'sea(index)': 0, 'FAKE-SEA': 0 };
  const fakeSea = [];
  for (const n of te.drawList) {
    const k = kindOf(n); summary[k]++;
    if (k === 'FAKE-SEA') fakeSea.push(n.key);
  }

  const report = {};
  for (const [name, [lat, lon]] of Object.entries(ISLANDS)) {
    let hit = null;
    for (let z = 0; z <= te.maxZoom; z++) {
      const span = 180 / (1 << z);
      const key = `${z}/${Math.floor((lon + 180) / span)}/${Math.floor((90 - lat) / span)}`;
      const n = drawn.get(key);
      if (n) { hit = { key, kind: kindOf(n), z, distKm: +(cam.position.distanceTo(n.center) / 1000).toFixed(1) }; }
    }
    if (hit) { report[name] = hit; continue; }
    // Not drawn at any level: walk down and report the first node that dropped out.
    const chain = [];
    for (let z = 0; z <= te.maxZoom; z++) {
      const span = 180 / (1 << z);
      const key = `${z}/${Math.floor((lon + 180) / span)}/${Math.floor((90 - lat) / span)}`;
      const n = te.quadtree.nodes.get(key);
      if (!n) { chain.push(`${key}: node never created`); break; }
      const centreDist = cam.position.distanceTo(n.center);
      const why = [];
      if (centreDist - n.radius > range) why.push('range');
      if (!inFrustum(n.center, n.radius + centreDist * MARGIN_TAN)) why.push('frustum');
      if (behindHorizon(n.center, n.radius)) why.push('horizon');
      chain.push(`${key} d=${(centreDist/1000).toFixed(1)}km r=${(n.radius/1000).toFixed(1)}km`
        + ` res=${te.streamer.has(n.id)} absent=${te.meshStore.isAbsent(n.id)}`
        + (why.length ? ` CULLED[${why.join(',')}]` : ''));
      if (why.length) break;
    }
    report[name] = { NOT_DRAWN: chain };
  }

  const s = te.meshStore.stats;
  return JSON.stringify({
    altitudeM: Math.round(alt), rangeKm: Math.round(range / 1000),
    detailScale: +te.detailScale.toFixed(2), frameEmaMs: +te.frameEmaMs.toFixed(1),
    drawList: summary, fakeSeaTiles: fakeSea.slice(0, 20),
    deadTiles: te.meshStore.dead.size, failed: s.failed, aborted: s.aborted,
    inflight: s.inflight, queued: s.queued, uploadedTiles: te.streamer.gpu.size,
    islands: report,
  }, null, 1);
})()
