// SUNSET KEYS v4 — city generation: roads, blocks, buildings, props, marina and airport.
// Port Alba is a 5200x3800 hand-laid grid city with six districts, generated once per
// load from a fixed seed so every run (and every screenshot) sees the same streets.
import { G, WORLD_W, WORLD_H, mulberry32, randInt, pick } from './state.js';

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown', x: 1560, y: 0, w: 1560, h: 1400, color: '#3b4a6b', crew: 'none', income: 0 },
  { id: 'heights', name: 'Alba Heights', x: 3120, y: 0, w: 1040, h: 1400, color: '#5d6b4a', crew: 'kings', income: 120 },
  { id: 'airport', name: 'Alba International', x: 4160, y: 0, w: 1040, h: 1400, color: '#4a5568', crew: 'none', income: 0 },
  { id: 'marina', name: 'Marina Bay', x: 0, y: 0, w: 1560, h: 1400, color: '#2e5a74', crew: 'marina', income: 90 },
  { id: 'oldtown', name: 'Old Town', x: 0, y: 1400, w: 2080, h: 2400, color: '#6b5a3b', crew: 'vipers', income: 150 },
  { id: 'industrial', name: 'South Industrial', x: 2080, y: 1400, w: 3120, h: 2400, color: '#54423a', crew: 'kings', income: 110 },
];

export const CREWS = {
  vipers: { name: 'Vipers', color: '#e5484d', home: 'oldtown' },
  kings: { name: 'Kings', color: '#f5a623', home: 'industrial' },
  marina: { name: 'Marina Boys', color: '#2ea8d8', home: 'marina' },
  none: { name: 'Neutral', color: '#9aa0a6', home: null },
};

/** Road centrelines: verticals every 520px, horizontals every 460px. */
export function buildRoads() {
  const verticals = [];
  for (let x = 260; x < WORLD_W; x += 520) verticals.push(x);
  const horizontals = [];
  for (let y = 230; y < WORLD_H; y += 460) horizontals.push(y);
  return { verticals, horizontals, width: 64 };
}

/** A building rect with a roof colour, height (for shadow length) and kind. */
function makeBuilding(rng, x, y, w, h, district) {
  const kinds = district === 'downtown' ? ['tower', 'tower', 'office'] : district === 'industrial' ? ['warehouse', 'factory'] : district === 'heights' ? ['house', 'villa'] : ['shop', 'house', 'apartment'];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const roofs = {
    tower: ['#4a5a78', '#5b6b8c', '#3d4c66'], office: ['#6b7a99', '#55627f'],
    house: ['#a8603c', '#7a5a3a', '#8c4a3a'], villa: ['#b07848', '#96683f'],
    shop: ['#8c6a4a', '#75543a', '#9c7a55'], apartment: ['#6b5a72', '#7a6a80'],
    warehouse: ['#7a6a55', '#6b5f4a'], factory: ['#5f5a55', '#6b655f'],
  };
  const palette = roofs[kind] || ['#666666'];
  return {
    x, y, w, h, kind, district: district.id,
    roof: palette[Math.floor(rng() * palette.length)],
    height: kind === 'tower' ? randInt(26, 60) : kind === 'office' ? randInt(14, 26) : randInt(6, 14),
    windows: Math.floor(rng() * 3),
  };
}

/** Build the whole city once and stash it on G.city. */
export function buildCity() {
  const rng = mulberry32(20261124);
  const roads = buildRoads();
  const buildings = [];
  const trees = [];
  const lamps = [];
  const props = [];
  // Water: a bay along the whole west edge plus a marina basin.
  const water = { x: 0, y: 0, w: 300, h: WORLD_H, basin: { x: 180, y: 1500, w: 620, h: 900 } };
  // Airport: runways on the east edge, inside the airport district.
  const airport = {
    x: 4240, y: 120, w: 880, h: 1180,
    runway: { x: 4380, y: 300, w: 90, h: 900 },
    runway2: { x: 4700, y: 300, w: 90, h: 900 },
    terminal: { x: 4240, y: 620, w: 120, h: 260 },
    tower: { x: 4300, y: 220, w: 60, h: 60 },
  };
  // Buildings: fill each block between roads, skipping water, airport and parks.
  for (let bx = 0; bx < 10; bx++) {
    for (let by = 0; by < 8; by++) {
      const x0 = 300 + bx * 520, y0 = 260 + by * 460;
      const x1 = x0 + 440, y1 = y0 + 380;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (cx < 340 || cy < 40) continue; // in the bay
      if (cx > 4200 && cy < 1420) continue; // airport grounds
      if ((bx === 4 && by === 3) || (bx === 7 && by === 6)) { // two parks
        for (let i = 0; i < 9; i++) trees.push({ x: x0 + rng() * 440, y: y0 + rng() * 380, r: 10 + rng() * 8 });
        props.push({ kind: 'fountain', x: cx, y: cy, r: 26 });
        continue;
      }
      const d = DISTRICTS.find((dd) => cx >= dd.x && cx < dd.x + dd.w && cy >= dd.y && cy < dd.y + dd.h) || DISTRICTS[0];
      const n = d.id === 'downtown' ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const bw = 90 + rng() * 120, bh = 80 + rng() * 110;
        const bx2 = x0 + 20 + rng() * Math.max(1, 400 - bw);
        const by2 = y0 + 20 + rng() * Math.max(1, 340 - bh);
        buildings.push(makeBuilding(rng, bx2, by2, bw, bh, d));
      }
      if (rng() < 0.7) trees.push({ x: x0 + rng() * 440, y: y0 + rng() * 380, r: 9 + rng() * 7 });
    }
  }
  // Street lamps along every road intersection.
  for (const x of roads.verticals) for (const y of roads.horizontals) lamps.push({ x: x + 40, y: y + 40 });
  // Docks + piers in the marina basin.
  const docks = [
    { x: 300, y: 1560, w: 220, h: 26 }, { x: 300, y: 1780, w: 220, h: 26 },
    { x: 300, y: 2000, w: 220, h: 26 }, { x: 300, y: 2220, w: 220, h: 26 },
  ];
  // Stunt jump ramps scattered around the city.
  const stunts = [
    { x: 1820, y: 920, angle: 0 }, { x: 3640, y: 2380, angle: Math.PI / 2 },
    { x: 1300, y: 3220, angle: Math.PI }, { x: 4420, y: 1840, angle: -Math.PI / 2 },
  ];
  // Hidden packages (collectibles) tucked in alleys and rooftops.
  const collectibles = [];
  for (let i = 0; i < 24; i++) {
    collectibles.push({ x: 400 + rng() * (WORLD_W - 800), y: 300 + rng() * (WORLD_H - 600), found: false, id: i });
  }
  G.city = { roads, buildings, trees, lamps, props, water, airport, docks, stunts, collectibles };
  // Turf ownership starts from district crews.
  for (const d of DISTRICTS) G.turf[d.id] = d.crew;
  return G.city;
}

/** Which district contains a world point (null outside). */
export function districtAt(x, y) {
  return DISTRICTS.find((d) => x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) || null;
}

/** True when a point is on a road (drivable asphalt). */
export function onRoad(x, y) {
  const c = G.city;
  if (!c) return false;
  const w = c.roads.width / 2 + 6;
  if (c.roads.verticals.some((rx) => Math.abs(x - rx) < w)) return true;
  if (c.roads.horizontals.some((ry) => Math.abs(y - ry) < w)) return true;
  if (x > c.airport.runway.x - 50 && x < c.airport.runway.x + 140 && y > 260 && y < 1240) return true;
  if (x > c.airport.runway2.x - 50 && x < c.airport.runway2.x + 140 && y > 260 && y < 1240) return true;
  return false;
}

/** True when a point is in the bay or the marina basin (boats only). */
export function inWater(x, y) {
  const c = G.city;
  if (!c) return false;
  if (x < c.water.w && y > 0) return true;
  const b = c.water.basin;
  return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
}

/** True when a point overlaps any building rect (with a small margin). */
export function hitsBuilding(x, y, margin) {
  const m = margin || 0;
  for (const b of G.city.buildings) {
    if (x > b.x - m && x < b.x + b.w + m && y > b.y - m && y < b.y + b.h + m) return b;
  }
  return null;
}

/** Nearest road centreline point to (x, y) — used to snap traffic spawns. */
export function nearestRoadPoint(x, y) {
  const c = G.city;
  let best = null, bestD = Infinity;
  for (const rx of c.roads.verticals) {
    const d = Math.abs(x - rx);
    if (d < bestD) { bestD = d; best = { x: rx, y, angle: y > 0 ? Math.PI / 2 : -Math.PI / 2 }; }
  }
  for (const ry of c.roads.horizontals) {
    const d = Math.abs(y - ry);
    if (d < bestD) { bestD = d; best = { x, y: ry, angle: 0 }; }
  }
  return best;
}
