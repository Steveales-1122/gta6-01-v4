// sidejobs.js — taxi fares, vigilante bounties and paramedic runs.
import { G, addCash, addXp, addMessage, setWanted } from './state.js';
import { nearestRoadPoint } from './city.js';
import { spawnEnemy } from './combat.js';

export function startTaxi() {
  const rp = nearestRoadPoint(G.player.x + 400 + Math.random() * 800, G.player.y + 300 + Math.random() * 600);
  if (!rp) return false;
  G.sidejob = { type: 'taxi', fare: 120 + Math.floor(Math.random() * 180), target: rp, timer: 90, done: 0, pickup: true };
  G.objective = 'Taxi — pick up the passenger, then drop them off';
  addMessage('Taxi job: pick up the passenger (yellow marker)', '#ffd700');
  return true;
}
export function startVigilante() {
  const x = G.player.x + (Math.random() - 0.5) * 600, y = G.player.y + (Math.random() - 0.5) * 600;
  for (let i = 0; i < 3; i++) spawnEnemy(x + Math.random() * 120, y + Math.random() * 120, 'Vipers', 55);
  G.sidejob = { type: 'vigilante', fare: 400, target: { x, y }, timer: 120, done: 0 };
  G.objective = 'Vigilante — take down the gang members';
  addMessage('Vigilante bounty: $400 — clear the gang', '#ffd700');
  return true;
}
export function startParamedic() {
  const rp = nearestRoadPoint(G.player.x + 500, G.player.y - 400);
  if (!rp) return false;
  G.sidejob = { type: 'paramedic', fare: 250, target: rp, timer: 75, done: 0 };
  G.objective = 'Paramedic — reach the injured pedestrian fast';
  addMessage('Paramedic call: reach the patient before the timer runs out', '#ffd700');
  return true;
}
export function updateSidejob(dt) {
  const j = G.sidejob;
  if (!j.type) return;
  j.timer -= dt;
  if (j.timer <= 0) { addMessage('Side job failed — time ran out', '#ff6666'); G.sidejob = { type: null, fare: 0, target: null, timer: 0, done: 0 }; return; }
  const p = G.player;
  if (j.type === 'taxi' && j.target) {
    const d = Math.hypot(p.x - j.target.x, p.y - j.target.y);
    if (d < 70) {
      if (j.pickup) {
        j.pickup = false;
        const rp = nearestRoadPoint(p.x + 500 + Math.random() * 600, p.y + 400 + Math.random() * 500);
        j.target = rp; j.timer = 90;
        addMessage('Passenger aboard — drive to the destination', '#7fff9e');
      } else {
        addCash(j.fare); addXp(80, 'driving'); j.done++;
        addMessage('Taxi fare +$' + j.fare, '#7fff9e');
        G.sidejob = { type: null, fare: 0, target: null, timer: 0, done: 0 };
      }
    }
  }
  if (j.type === 'vigilante' && G.enemies.length === 0) {
    addCash(j.fare); addXp(150, 'shooting'); j.done++;
    addMessage('Bounty collected +$' + j.fare, '#7fff9e');
    G.sidejob = { type: null, fare: 0, target: null, timer: 0, done: 0 };
  }
  if (j.type === 'paramedic' && j.target) {
    const d = Math.hypot(p.x - j.target.x, p.y - j.target.y);
    if (d < 70) {
      addCash(j.fare); addXp(120); j.done++;
      addMessage('Patient saved +$' + j.fare, '#7fff9e');
      G.sidejob = { type: null, fare: 0, target: null, timer: 0, done: 0 };
    }
  }
}
export function cancelSidejob() { G.sidejob = { type: null, fare: 0, target: null, timer: 0, done: 0 }; }
