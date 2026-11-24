// SUNSET KEYS v4 — turf war: 3 rival crews hold the districts, turf missions flip
// ownership, and owned turf pays hourly income but draws police heat.
import { G, toast, banner } from './state.js';
import { DISTRICTS, CREWS } from './city.js';
import { makePed } from './pedestrians.js';

/** Start a turf takeover: spawn the defending gang in that district. */
export function startTurfWar(districtId) {
  const d = DISTRICTS.find((x) => x.id === districtId);
  if (!d) return false;
  const owner = G.turf[districtId];
  if (owner === 'player') { toast('Wilayah ini sudah milikmu'); return false; }
  const crew = CREWS[owner] || CREWS.none;
  const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
  G.mission.active = true;
  G.mission.title = 'Perang Turf — ' + d.name;
  G.mission.objective = 'Kalahkan ' + crew.name + ' di ' + d.name + ' (8 orang)';
  G.mission.target = { x: cx, y: cy };
  G.mission.data = { kills: 0, need: 8, turf: districtId };
  for (let i = 0; i < 8; i++) {
    const ped = makePed(cx + (Math.random() - 0.5) * 600, cy + (Math.random() - 0.5) * 500, { state: 'gang', gang: owner });
    ped.hp = 80;
    G.peds.push(ped);
  }
  banner('PERANG TURF', d.name + ' — milik ' + crew.name);
  return true;
}

/** Check a turf mission's kill count; flip the district when done. */
export function updateTurfWar() {
  const ms = G.mission;
  if (!ms.active || !ms.data || !ms.data.turf) return false;
  if (ms.data.kills >= ms.data.need) {
    const prev = G.turf[ms.data.turf];
    G.turf[ms.data.turf] = 'player';
    G.heat = Math.min(100, G.heat + 15);
    G.stats.turfTaken++;
    banner('WILAYAH DIREBUT', DISTRICTS.find((d) => d.id === ms.data.turf).name + ' kini milikmu — +' + fmtIncome(ms.data.turf) + '/jam');
    return true;
  }
  return false;
}

function fmtIncome(districtId) {
  const d = DISTRICTS.find((x) => x.id === districtId);
  return d ? '$' + d.income : '$0';
}

/** Spawn a few gang defenders around the player in enemy turf (ambient threat). */
export function ambientGangSpawn(dt) {
  if (G.wanted > 0) return;
  const d = DISTRICTS.find((x) => G.player.x >= x.x && G.player.x < x.x + x.w && G.player.y >= x.y && G.player.y < x.y + x.h);
  if (!d) return;
  const owner = G.turf[d.id];
  if (owner === 'player' || owner === 'none') return;
  const gangCount = G.peds.filter((p) => p.gang === owner && p.state === 'gang').length;
  if (gangCount < 3 && Math.random() < dt * 0.5) {
    const ped = makePed(G.player.x + (Math.random() - 0.5) * 600, G.player.y + (Math.random() - 0.5) * 500, { state: 'gang', gang: owner });
    G.peds.push(ped);
  }
}
