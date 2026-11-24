// heists.js — heist planning board: crew cuts, approach, two prep missions each.
import { G, addCash, addXp, addMessage } from './state.js';

export const CREWS = [
  { id: 'solo', name: 'Solo (no cut)', cut: 0 },
  { id: 'ivy', name: 'Ivy Chen — hacker (15%)', cut: 0.15 },
  { id: 'dario', name: 'Dario Kell — driver (15%)', cut: 0.15 },
  { id: 'both', name: 'Ivy + Dario (25%)', cut: 0.25 },
];
export const APPROACHES = ['LOUD', 'QUIET', 'SNEAK'];
export const HEIST_PAYOUTS = { cargo: 8000, vault: 15000, casino: 30000 };

export function heistInfo(id) {
  const h = G.heists[id];
  return { ...h, payout: HEIST_PAYOUTS[id], prepsNeeded: 2 };
}
export function selectHeist(id) { if (G.heists[id]) G.heistBoard.selected = id; }
export function setApproach(a) { if (APPROACHES.includes(a)) G.heistBoard.approach = a; }
export function setCrew(id) { if (CREWS.some((c) => c.id === id)) G.heistBoard.crew = id; }
export function startPrep(id) {
  const h = G.heists[id];
  if (!h || !h.unlocked) { addMessage('Heist not unlocked yet — gain levels', '#ff6666'); return false; }
  if (h.done) { addMessage('Heist already done', '#ff6666'); return false; }
  if (h.preps >= 2) { addMessage('Preps done — launch the heist!', '#ffd700'); return false; }
  const spots = { cargo: { x: 1500, y: 1900 }, vault: { x: 2900, y: 350 }, casino: { x: 2050, y: 850 } };
  G.mission.active = true; G.mission.title = 'Prep: ' + h.name + ' (' + (h.preps + 1) + '/2)';
  G.mission.objective = 'Reach the prep point and hold it';
  G.mission.target = spots[id]; G.mission.index = -1; G.mission.heistId = id;
  G.objective = G.mission.title + ' — reach the marker';
  addMessage('Prep mission started: ' + h.name, '#ffd700');
  return true;
}
export function completePrep(id) {
  const h = G.heists[id];
  h.preps++;
  addXp(200);
  addMessage('Prep ' + h.preps + '/2 done for ' + h.name, '#7fff9e');
  if (h.preps >= 2) addMessage('Heist ready — launch from the board (H)', '#ffd700');
}
export function launchHeist(id) {
  const h = G.heists[id];
  if (!h || !h.unlocked || h.done || h.preps < 2) return false;
  const crew = CREWS.find((c) => c.id === G.heistBoard.crew) || CREWS[0];
  const gross = HEIST_PAYOUTS[id];
  const take = Math.round(gross * (1 - crew.cut));
  const bonus = G.heistBoard.approach === 'SNEAK' ? 1.25 : G.heistBoard.approach === 'QUIET' ? 1.1 : 1;
  const finalTake = Math.round(take * bonus);
  addCash(finalTake); addXp(600);
  h.done = true;
  addMessage('HEIST DONE: ' + h.name + ' — ' + G.heistBoard.approach + ' approach, +$' + finalTake, '#ffd700');
  return true;
}
export function heistsDone() { return Object.values(G.heists).filter((h) => h.done).length; }
