// SUNSET KEYS v4 — properties: safehouses (save + heal + garage) and businesses
// (workshop, taxi firm, arcade) that pay passive income every game hour.
import { G, fmtCash, toast } from './state.js';
import { spend } from './economy.js';

export const SAFEHOUSES = [
  { id: 'sh1', name: 'Apartemen Old Town', price: 1500, x: 700, y: 2100, heal: 100 },
  { id: 'sh2', name: 'Penthouse Downtown', price: 6000, x: 2200, y: 700, heal: 100 },
  { id: 'sh3', name: 'Vila Marina', price: 9000, x: 900, y: 500, heal: 100 },
];

export const BUSINESSES = [
  { id: 'biz1', name: 'Bengkel Turbo', price: 4000, income: 180, x: 2600, y: 3200, desc: 'Servis mobil, cuan tiap jam' },
  { id: 'biz2', name: 'Firma Taksi Alba', price: 6000, income: 260, x: 1300, y: 1500, desc: 'Armada taksi keliling kota' },
  { id: 'biz3', name: 'Arcade Neon', price: 8000, income: 340, x: 2000, y: 1000, desc: 'Mesin arcade + taruhan kecil' },
];

/** Buy a safehouse: heals, unlocks a save point and a garage slot. */
export function buySafehouse(id) {
  const s = SAFEHOUSES.find((x) => x.id === id);
  if (!s) return { ok: false, why: 'Tidak ada' };
  if (G.properties.safehouses.some((x) => x.id === id)) return { ok: false, why: 'Sudah dimiliki' };
  if (!spend(s.price)) return { ok: false, why: 'Uang kurang' };
  G.properties.safehouses.push({ ...s });
  toast('Safehouse dibeli — ' + s.name);
  return { ok: true };
}

/** Buy a business: passive income starts next game hour. */
export function buyBusiness(id) {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return { ok: false, why: 'Tidak ada' };
  if (G.properties.businesses.some((x) => x.id === id)) return { ok: false, why: 'Sudah dimiliki' };
  if (!spend(b.price)) return { ok: false, why: 'Uang kurang' };
  G.properties.businesses.push({ ...b });
  toast('Bisnis dibeli — ' + b.name + ' (+ ' + fmtCash(b.income) + '/jam)');
  return { ok: true };
}

/** Rest at a safehouse: full heal, save prompt, wanted slowly fades. */
export function restAtSafehouse(sh) {
  G.health = 100;
  G.armor = Math.max(G.armor, 50);
  if (G.wanted > 0) G.wanted = Math.max(0, G.wanted - 1);
  toast('Istirahat di ' + sh.name + ' — HP penuh');
}

/** Nearest owned safehouse within range (for the rest prompt). */
export function nearestSafehouse(x, y, range) {
  let best = null, bestD = range * range;
  for (const s of G.properties.safehouses) {
    const d = (s.x - x) ** 2 + (s.y - y) ** 2;
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

/** Nearest business for sale within range (for the buy prompt). */
export function nearestBusinessForSale(x, y, range) {
  let best = null, bestD = range * range;
  for (const b of BUSINESSES) {
    if (G.properties.businesses.some((x2) => x2.id === b.id)) continue;
    const d = (b.x - x) ** 2 + (b.y - y) ** 2;
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}
