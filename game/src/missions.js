// missions.js — 14 story missions with objectives, markers, timers and payouts.
import { G, addCash, addXp, addMessage, setWanted } from './state.js';
import { spawnEnemy } from './combat.js';
import { captureTurf } from './districts.js';
import { endingFor, ENDINGS } from './story.js';
import { completePrep } from './heists.js';

export const MISSIONS = [
  { title: '1. First Wheels', objective: 'Steal a car and reach Mara at the Beach Shack', target: { x: 600, y: 1800 }, reward: 300 },
  { title: '2. The Delivery', objective: 'Drive the package to Downtown Alba', target: { x: 1700, y: 900 }, reward: 500 },
  { title: '3. Tax Collector', objective: 'Ambush the Vipers tax van in Portside', target: { x: 2800, y: 450 }, reward: 700, enemies: 3, gang: 'Vipers' },
  { title: '4. Wheels Up', objective: 'Reach Alba International and fly the Duster', target: { x: 1500, y: 1900 }, reward: 800 },
  { title: '5. Marina Nights', objective: 'Take the speedboat to the Marina Office', target: { x: 2550, y: 1650 }, reward: 900 },
  { title: '6. Turf: Alba Beach', objective: 'Clear the Kings from Alba Beach', target: { x: 700, y: 1800 }, reward: 1200, enemies: 4, gang: 'Kings', turf: 'beach' },
  { title: '7. The Getaway', objective: 'Lose a 3-star wanted level, then reach the Hills Villa', target: { x: 600, y: 400 }, reward: 1500, wanted: 3 },
  { title: '8. Turf: Downtown', objective: 'Defeat the Vipers holding Downtown', target: { x: 1700, y: 1000 }, reward: 2000, enemies: 5, gang: 'Vipers', turf: 'downtown' },
  { title: '9. Storm Runner', objective: 'Drive the storm shipment to Portside in the rain', target: { x: 2900, y: 350 }, reward: 2200 },
  { title: '10. Turf: Portside', objective: 'Take Portside from the Vipers', target: { x: 2800, y: 500 }, reward: 2500, enemies: 5, gang: 'Vipers', turf: 'portside' },
  { title: '11. Turf: North Hills', objective: 'Take North Hills from the Kings', target: { x: 600, y: 500 }, reward: 2800, enemies: 6, gang: 'Kings', turf: 'hills' },
  { title: '12. Turf: Marina Keys', objective: 'Take Marina Keys from the Marina Boys', target: { x: 2800, y: 1700 }, reward: 3000, enemies: 6, gang: 'Marina Boys', turf: 'marina' },
  { title: '13. The Board', objective: 'Open the heist board (H) and finish a heist prep', target: { x: 1700, y: 900 }, reward: 1000 },
  { title: '14. The Last Key', objective: 'Reach the Kasino Alba for the final job', target: { x: 2050, y: 850 }, reward: 5000 },
];

export function startMission(i) {
  const m = MISSIONS[i];
  if (!m) return;
  G.mission.index = i; G.mission.stage = 0; G.mission.active = true;
  G.mission.title = m.title; G.mission.objective = m.objective; G.mission.target = m.target;
  G.objective = m.title + ' — ' + m.objective;
  addMessage('Mission started: ' + m.title, '#ffd700');
  if (m.enemies) for (let k = 0; k < m.enemies; k++) spawnEnemy(m.target.x + (Math.random() - 0.5) * 200, m.target.y + (Math.random() - 0.5) * 200, m.gang);
  if (m.wanted) setWanted(m.wanted);
  if (m.title.includes('Storm')) G.weather = 'storm';
}
export function updateMissions(dt) {
  const m = G.mission;
  if (!m.active) return;
  if (m.index === -1) {
    const p = G.player;
    if (Math.hypot(p.x - m.target.x, p.y - m.target.y) < 80) {
      m.active = false;
      completePrep(m.heistId);
    }
    return;
  }
  const def = MISSIONS[m.index];
  if (!def) return;
  const p = G.player;
  const d = Math.hypot(p.x - def.target.x, p.y - def.target.y);
  if (d < 80) {
    if (def.enemies && G.enemies.length > 0) { G.objective = def.title + ' — clear the ' + def.gang + ' (' + G.enemies.length + ' left)'; return; }
    completeMission();
  }
}
export function completeMission() {
  const def = MISSIONS[G.mission.index];
  addCash(def.reward); addXp(250 + G.mission.index * 30);
  G.stats.missionsDone++;
  G.mission.done.push(def.title);
  addMessage('Mission complete: ' + def.title + ' +$' + def.reward, '#7fff9e');
  if (def.turf) { captureTurf(def.turf); addMessage('Turf captured! Income +$150/h', '#ffd700'); }
  G.mission.active = false;
  if (G.mission.index === 13) { finishStory(); return; }
  if (G.mission.index === 12 && !Object.values(G.heists).some((h) => h.done)) {
    addMessage('Finish a heist first — open the board with H', '#ffd700');
    G.mission.active = false; G.mission.index = 12; return;
  }
  startMission(G.mission.index + 1);
}
export function finishStory() {
  const owned = Object.values(G.turf).filter((o) => o === 'Player').length;
  const approach = G.heistBoard.approach;
  const key = endingFor(approach, owned);
  G.ending = ENDINGS[key];
  G.mode = 'win';
  addMessage('STORY COMPLETE — ' + G.ending.title, '#ffd700');
}
export function skipToMission(i) { startMission(i); }
