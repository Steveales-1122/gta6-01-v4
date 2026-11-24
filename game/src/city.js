// city.js — procedural city layout: roads, building blocks, parks, beach, airport runway.
import { G, WORLD_W, WORLD_H, mulberry32, pick } from './state.js';

export function buildCity() {
  const rng = mulberry32(20261124);
  G.roads = [];
  // Road grid every 300px, with a diagonal avenue through downtown.
  for (let x = 200; x <= WORLD_W - 200; x += 300) G.roads.push({ x1: x, y1: 100, x2: x, y2: WORLD_H - 100, w: 26, vertical: true });
  for (let y = 200; y <= WORLD_H - 200; y += 300) G.roads.push({ x1: 100, y1: y, x2: WORLD_W - 100, y2: y, w: 26, vertical: false });
  G.roads.push({ x1: 300, y1: 300, x2: 3300, y2: 2100, w: 30, vertical: false, diagonal: true });

  const palette = ['#5d6d8c', '#6b5d8c', '#8c6b5d', '#4f7a6a', '#7a6a4f', '#546a7a', '#8c5d6b', '#5d8c6b'];
  G.buildings = [];
  for (let bx = 260; bx < WORLD_W - 260; bx += 300) {
    for (let by = 260; by < WORLD_H - 260; by += 300) {
      // Skip airport runway strip and beach water edge.
      if (bx > 1250 && bx < 2350 && by > 1650 && by < 1950) continue;
      if (bx < 500 && by > 1900) continue;
      if (rng() < 0.18) { // park block
        for (let i = 0; i < 5; i++) G.trees.push({ x: bx + 30 + rng() * 180, y: by + 30 + rng() * 180, r: 10 + rng() * 8 });
        continue;
      }
      const n = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < n; i++) {
        const w = 70 + rng() * 110, h = 70 + rng() * 110;
        G.buildings.push({
          x: bx + 20 + rng() * (220 - w), y: by + 20 + rng() * (220 - h),
          w, h, color: pick(rng, palette), floors: 1 + Math.floor(rng() * 14),
          roof: pick(rng, ['#333a45', '#3a3335', '#2e3a33']),
        });
      }
    }
  }
  // Landmarks: casino, port cranes, airport terminal, marina pier.
  G.buildings.push({ x: 2050, y: 850, w: 220, h: 140, color: '#b8860b', floors: 18, roof: '#222', landmark: 'Kasino Alba' });
  G.buildings.push({ x: 2900, y: 350, w: 260, h: 120, color: '#7a3a3a', floors: 6, roof: '#333', landmark: 'Portside Terminal' });
  G.buildings.push({ x: 1500, y: 1750, w: 300, h: 90, color: '#4a5a7a', floors: 4, roof: '#222', landmark: 'Alba International' });
  G.buildings.push({ x: 600, y: 1800, w: 120, h: 80, color: '#c98a4b', floors: 2, roof: '#8a5a2b', landmark: 'Beach Shack' });
  G.buildings.push({ x: 1650, y: 850, w: 150, h: 100, color: '#3a6b4f', floors: 8, roof: '#222', landmark: 'Sunset Auto Works' });
  G.buildings.push({ x: 2550, y: 1650, w: 130, h: 90, color: '#2e6f7a', floors: 3, roof: '#123', landmark: 'Marina Office' });
}

export function collideBuildings(x, y, r) {
  for (const b of G.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) {
      const dxl = x + r - b.x, dxr = b.x + b.w - (x - r);
      const dyt = y + r - b.y, dyb = b.y + b.h - (y - r);
      const m = Math.min(dxl, dxr, dyt, dyb);
      if (m === dxl) return { x: b.x - r, y };
      if (m === dxr) return { x: b.x + b.w + r, y };
      if (m === dyt) return { x, y: b.y - r };
      return { x, y: b.y + b.h + r };
    }
  }
  return null;
}

export function onRoad(x, y) {
  for (const r of G.roads) {
    if (r.vertical) { if (Math.abs(x - r.x1) < r.w) return true; }
    else if (r.diagonal) { const t = (x - r.x1) / (r.x2 - r.x1); const ry = r.y1 + t * (r.y2 - r.y1); if (Math.abs(y - ry) < r.w) return true; }
    else if (Math.abs(y - r.y1) < r.w) return true;
  }
  return false;
}

export function nearestRoadPoint(x, y) {
  let best = null, bd = 1e9;
  for (const r of G.roads) {
    let px, py;
    if (r.vertical) { px = r.x1; py = Math.max(r.y1, Math.min(r.y2, y)); }
    else if (r.diagonal) { const t = Math.max(0, Math.min(1, (x - r.x1) / (r.x2 - r.x1))); px = r.x1 + t * (r.x2 - r.x1); py = r.y1 + t * (r.y2 - r.y1); }
    else { px = Math.max(r.x1, Math.min(r.x2, x)); py = r.y1; }
    const d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = { x: px, y: py }; }
  }
  return best;
}
