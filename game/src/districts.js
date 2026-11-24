// SUNSET KEYS v4 — districts, turf ownership and the city map data the HUD reads.
// District list lives in city.js; this file owns turf income, crew standing and the
// minimap's district tint.
import { G } from './state.js';
import { DISTRICTS, CREWS } from './city.js';

/** All six districts with live owner, income and heat for the HUD and turf war. */
export function districtStates() {
  return DISTRICTS.map((d) => ({
    ...d,
    owner: G.turf[d.id] || 'none',
    crewName: (CREWS[G.turf[d.id] || 'none'] || CREWS.none).name,
    crewColor: (CREWS[G.turf[d.id] || 'none'] || CREWS.none).color,
  }));
}

/** Passive turf income per in-game hour from districts the player owns. */
export function turfIncomePerHour() {
  let n = 0;
  for (const d of DISTRICTS) if (G.turf[d.id] === 'player') n += d.income;
  return n;
}

/** How many districts the player controls (0-6). */
export function turfControlled() {
  return DISTRICTS.filter((d) => G.turf[d.id] === 'player').length;
}

/** Flip a district to the player after a turf mission; raises police heat. */
export function takeTurf(districtId) {
  const prev = G.turf[districtId];
  G.turf[districtId] = 'player';
  G.heat = Math.min(100, G.heat + 15);
  G.stats.turfTaken++;
  return prev;
}

/** Crew standing shifts after the player helps or hurts a crew (-100..100). */
export function shiftStanding(crew, delta) {
  if (G.story.crewStanding[crew] === undefined) return;
  G.story.crewStanding[crew] = Math.max(-100, Math.min(100, G.story.crewStanding[crew] + delta));
}

/** Rival crew that currently owns the most districts (the turf war's main threat). */
export function dominantRival() {
  const counts = { vipers: 0, kings: 0, marina: 0 };
  for (const d of DISTRICTS) if (counts[G.turf[d.id]] !== undefined) counts[G.turf[d.id]]++;
  let best = 'vipers', bestN = -1;
  for (const k of Object.keys(counts)) if (counts[k] > bestN) { bestN = counts[k]; best = k; }
  return best;
}
