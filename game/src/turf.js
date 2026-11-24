// turf.js — turf war: capture districts from the three rival crews, heat and income.
import { G, addMessage, addXp, setWanted } from './state.js';
import { spawnEnemy } from './combat.js';
import { captureTurf, turfCounts } from './districts.js';

export const CREW_COLORS = { Vipers: '#27ae60', Kings: '#8e44ad', 'Marina Boys': '#2980b9', Player: '#f1c40f' };
export function startTurfWar(districtId) {
  const d = G.turf[districtId];
  if (d === 'Player') { addMessage('You already hold this turf', '#ff6666'); return false; }
  const defs = { downtown: [1700, 1000], marina: [2800, 1700], beach: [700, 1800], hills: [600, 500], portside: [2800, 500], airport: [1700, 1800] };
  const [x, y] = defs[districtId] || [1800, 1100];
  for (let i = 0; i < 5; i++) spawnEnemy(x + (Math.random() - 0.5) * 260, y + (Math.random() - 0.5) * 260, d, 70);
  G.mission.active = true; G.mission.title = 'Turf War';
  G.mission.objective = 'Clear the ' + d + ' from this district';
  G.mission.target = { x, y }; G.mission.index = -2; G.mission.turfWar = districtId;
  G.objective = 'Turf War — clear the ' + d;
  setWanted(Math.max(G.wanted, 2));
  addMessage('Turf war started — defeat the ' + d, '#ff6666');
  return true;
}
export function updateTurfWar() {
  const m = G.mission;
  if (!m.active || m.index !== -2) return;
  if (G.enemies.length === 0) {
    const name = captureTurf(m.turfWar);
    addXp(300); addMessage('TURF CAPTURED: ' + name + ' — +$150/h income', '#ffd700');
    G.mission.active = false; G.mission.turfWar = null;
    G.heat = Math.min(100, G.heat + 20);
  }
}
export function turfSummary() {
  const c = turfCounts();
  return 'Turf — You ' + c.Player + ' · Vipers ' + c.Vipers + ' · Kings ' + c.Kings + ' · Marina Boys ' + c['Marina Boys'];
}
export function policeHeatLevel() { return G.heat >= 70 ? 'HOT' : G.heat >= 40 ? 'WARM' : 'COOL'; }
