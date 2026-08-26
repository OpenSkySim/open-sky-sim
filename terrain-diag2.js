/* Paste into the console WHILE looking at the gap (level flight, horizon in view).
   Fires a ray into the empty band, finds the sea-level point it should hit, then
   walks the quadtree toward that point reporting which test rejected each node. */
(() => {
  const te = globalThis.__terrain;
  if (!te) return 'NO __terrain';
  const cam = te.lodCamera;
  const THREE_V = te.earthCenter.constructor;

  let root = te.group; while (root.parent) root = root.parent;
  root.position.set(0, 0, 0); root.updateMatrix(); root.updateMatrixWorld(true);
  cam.updateMatrixWorld(true);

  const R = 6378137, EPS = 1e-6;
  const earth = te.earthCenter;
  const vp = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
  const m = vp.elements;

  // --- coverage grid (full fidelity) -------------------------------------
  const GW = 64, GH = 24;
  const grid = new Uint8Array(GW * GH);
  const clipW = (p) => { const o = [];
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i+1)%p.length];
      const ai = a[3] > EPS, bi = b[3] > EPS; if (ai) o.push(a);
      if (ai !== bi) { const t = (EPS-a[3])/(b[3]-a[3]);
        o.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, EPS]); } }
    return o; };
  te.group.traverse(o => { if (!o.isMesh) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, e = o.matrixWorld.elements;
    const cnt = idx ? idx.count : pos.count;
    for (let t = 0; t + 2 < cnt; t += 3) { const poly = [];
      for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t+k) : (t+k);
        const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
        const wx = e[0]*lx+e[4]*ly+e[8]*lz+e[12], wy = e[1]*lx+e[5]*ly+e[9]*lz+e[13], wz = e[2]*lx+e[6]*ly+e[10]*lz+e[14];
        poly.push([m[0]*wx+m[4]*wy+m[8]*wz+m[12], m[1]*wx+m[5]*wy+m[9]*wz+m[13],
                   m[2]*wx+m[6]*wy+m[10]*wz+m[14], m[3]*wx+m[7]*wy+m[11]*wz+m[15]]); }
      const cp = clipW(poly); if (cp.length < 3) continue;
      const sx = cp.map(v=>v[0]/v[3]), sy = cp.map(v=>v[1]/v[3]);
      const mnx=Math.min(...sx),mxx=Math.max(...sx),mny=Math.min(...sy),mxy=Math.max(...sy);
      if (mxx<-1||mnx>1||mxy<-1||mny>1) continue;
      const x0=Math.max(0,Math.floor((mnx+1)/2*GW)),x1=Math.min(GW-1,Math.ceil((mxx+1)/2*GW));
      const y0=Math.max(0,Math.floor((mny+1)/2*GH)),y1=Math.min(GH-1,Math.ceil((mxy+1)/2*GH));
      for (let gy=y0;gy<=y1;gy++) for (let gx=x0;gx<=x1;gx++) { if (grid[gy*GW+gx]) continue;
        const cx=(gx+0.5)/GW*2-1, cy=(gy+0.5)/GH*2-1; let ins=true,sg=0;
        for (let i=0;i<sx.length;i++){ const j=(i+1)%sx.length;
          const d=(cx-sx[j])*(sy[i]-sy[j])-(sx[i]-sx[j])*(cy-sy[j]);
          if(d!==0){const s=d>0?1:-1; if(!sg)sg=s; else if(s!==sg){ins=false;break;}}}
        if (ins) grid[gy*GW+gx]=1; } }
  });

  // --- pick the widest empty run below the horizon ------------------------
  const invVP = vp.clone().invert();
  const unproject = (nx, ny) => {
    const a = new THREE_V(nx, ny, -1).applyMatrix4(invVP);
    const b = new THREE_V(nx, ny,  1).applyMatrix4(invVP);
    return { o: cam.position.clone(), d: b.sub(a).normalize() };
  };
  // ray vs sea-level sphere
  const hitSea = (o, d) => {
    const oc = o.clone().sub(earth);
    const b = 2*oc.dot(d), c = oc.lengthSq() - R*R;
    const disc = b*b - 4*c; if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc))/2;
    return t > 0 ? o.clone().add(d.clone().multiplyScalar(t)) : null;
  };

  let best = null;
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    if (grid[gy*GW+gx]) continue;
    const nx = (gx+0.5)/GW*2-1, ny = (gy+0.5)/GH*2-1;
    const { o, d } = unproject(nx, ny);
    const p = hitSea(o, d);
    if (!p) continue;                       // ray misses the globe => sky
    const dist = cam.position.distanceTo(p);
    if (!best || dist < best.dist) best = { gx, gy, p, dist };
  }

  const rows = []; for (let gy=GH-1; gy>=0; gy--) { let s='';
    for (let gx=0; gx<GW; gx++) s += grid[gy*GW+gx] ? '#' : '.'; rows.push(s); }
  let cov=0; for (let i=0;i<grid.length;i++) cov+=grid[i];

  if (!best) return JSON.stringify({ coveragePct:+(100*cov/(GW*GH)).toFixed(1),
    verdict: 'every empty cell is sky (ray misses the globe) -- no hole found' }, null, 1)
    + '\n' + rows.join('\n');

  // --- walk the quadtree toward that point --------------------------------
  const P = best.p;
  const qt = te.quadtree;
  const alt = cam.position.y;
  const range = Math.max(450000, Math.sqrt(Math.max(0, 2*R*alt + alt*alt)) * 1.15);
  const frustum = new (Object.getPrototypeOf(cam).constructor.prototype.constructor === cam.constructor ? cam.constructor : cam.constructor)();
  // rebuild frustum planes manually
  const planes = [];
  { const me = m;
    const pl = (a,b,c,d) => { const len = Math.hypot(a,b,c); return [a/len,b/len,c/len,d/len]; };
    planes.push(pl(me[3]-me[0], me[7]-me[4], me[11]-me[8], me[15]-me[12]));
    planes.push(pl(me[3]+me[0], me[7]+me[4], me[11]+me[8], me[15]+me[12]));
    planes.push(pl(me[3]+me[1], me[7]+me[5], me[11]+me[9], me[15]+me[13]));
    planes.push(pl(me[3]-me[1], me[7]-me[5], me[11]-me[9], me[15]-me[13]));
    planes.push(pl(me[3]-me[2], me[7]-me[6], me[11]-me[10], me[15]-me[14]));
    planes.push(pl(me[3]+me[2], me[7]+me[6], me[11]+me[10], me[15]+me[14]));
  }
  const inFrustum = (c, r) => planes.every(p => p[0]*c.x + p[1]*c.y + p[2]*c.z + p[3] >= -r);
  const behindHorizon = (c, r) => {
    const toCam = cam.position.clone().sub(earth); const camDist = toCam.length();
    if (camDist <= R) return false;
    const sinH = R/camDist, cosH = Math.sqrt(Math.max(0,1-sinH*sinH));
    const toP = c.clone().sub(earth); const pd = toP.length(); if (pd < 1) return false;
    return toCam.dot(toP)/(camDist*pd) < cosH - r/Math.max(pd,1);
  };

  const drawn = new Set(te.drawList.map(n=>n.key));
  const chain = [];
  let cur = qt.roots.slice().sort((a,b)=>a.center.distanceTo(P)-b.center.distanceTo(P))[0];
  for (let depth = 0; depth < 16 && cur; depth++) {
    const d = cam.position.distanceTo(cur.center) - cur.radius;
    chain.push({ key: cur.key, z: cur.id.z,
      distKm: +(cam.position.distanceTo(cur.center)/1000).toFixed(1),
      radiusKm: +(cur.radius/1000).toFixed(1),
      culled_range: d > range, culled_frustum: !inFrustum(cur.center, cur.radius),
      culled_horizon: behindHorizon(cur.center, cur.radius),
      isDrawn: drawn.has(cur.key),
      resident: te.streamer.has(cur.id), absent: te.meshStore.isAbsent(cur.id),
      hasChildren: !!cur.children,
      childrenReady: cur.children ? cur.children.every(c => te.streamer.has(c.id) || te.meshStore.isAbsent(c.id)) : null,
    });
    if (drawn.has(cur.key) || !cur.children) break;
    cur = cur.children.slice().sort((a,b)=>a.center.distanceTo(P)-b.center.distanceTo(P))[0];
  }

  return JSON.stringify({
    coveragePct: +(100*cov/(GW*GH)).toFixed(1),
    altitudeM: Math.round(alt), rangeKm: Math.round(range/1000),
    holeCell: [best.gx, best.gy],
    holePointDistKm: +(best.dist/1000).toFixed(1),
    holePointEnu: [Math.round(P.x), Math.round(P.y), Math.round(P.z)],
    walkTowardHole: chain,
  }, null, 1) + '\n' + rows.join('\n');
})()
