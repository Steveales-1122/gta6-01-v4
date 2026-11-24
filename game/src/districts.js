// districts.js — the six districts of Port Alba and their turf owners.
import { G, DISTRICTS } from './state.js';

export function districtNameAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  return 'Port Alba';
}
export function turfOwner(districtId) { return G.turf[districtId] || 'Neutral'; }
export function turfCounts() {
  const c = { Player: 0, Vipers: 0, Kings: 0, 'Marina Boys': 0 };
  for (const d of DISTRICTS) c[G.turf[d.id]] = (c[G.turf[d.id]] || 0) + 1;
  return c;
}
export function captureTurf(districtId) {
  G.turf[districtId] = 'Player';
  const d = DISTRICTS.find((x) => x.id === districtId);
  return d ? d.name : districtId;
}
export function districtColor(districtId) {
  const d = DISTRICTS.find((x) => x.id === districtId);
  return d ? d.color : '#444';
}
export function listDistricts() { return DISTRICTS.map((d) => ({ id: d.id, name: d.name, owner: G.turf[d.id] })); }
