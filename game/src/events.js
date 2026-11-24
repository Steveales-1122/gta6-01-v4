// events.js — dynamic world events, stunt jumps and 24 hidden packages.
import { G, addCash, addXp, addMessage, setWanted, mulberry32 } from './state.js';
import { spawnEnemy } from './combat.js';
import { spawnParticles } from './effects.js';

export function seedPackages() {
  const rng = mulberry32(31337);
  G.packages = [];
  for (let i = 0; i < 24; i++) G.packages.push({ x: 250 + rng() * 3100, y: 250 + rng() * 1900, found: false });
  G.jumps = [
    { x: 900, y: 800, done: false }, { x: 2100, y: 500, done: false }, { x: 1500, y: 1600, done: false },
    { x: 2700, y: 1200, done: false }, { x: 600, y: 1400, done: false }, { x: 2400, y: 2000, done: false },
  ];
}
export function updateEvents(dt) {
  const p = G.player;
  // Hidden packages.
  for (const pk of G.packages) {
    if (!pk.found && Math.hypot(p.x - pk.x, p.y - pk.y) < 40) {
      pk.found = true; addCash(250); addXp(60); G.stats.packagesFound++;
      addMessage('Hidden package found! +$250 (' + G.stats.packagesFound + '/24)', '#ffd700');
      spawnParticles(pk.x, pk.y, '#ffd700', 14, 160, 0.7, 4);
    }
  }
  // Stunt jumps: fast driving through a jump marker.
  for (const j of G.jumps) {
    if (!j.done && p.inVehicle && Math.abs(p.inVehicle.speed) > 380 && Math.hypot(p.x - j.x, p.y - j.y) < 60) {
      j.done = true; addCash(500); addXp(120, 'driving'); G.stats.jumpsDone++;
      addMessage('STUNT JUMP! +$500 (' + G.stats.jumpsDone + '/6)', '#ffd700');
      spawnParticles(j.x, j.y, '#ff8800', 20, 220, 0.8, 5);
    }
  }
  // Random street robbery event.
  if (!G.eventActive && Math.random() < dt * 0.004) {
    G.eventActive = { type: 'robbery', x: p.x + (Math.random() - 0.5) * 500, y: p.y + (Math.random() - 0.5) * 500, t: 45 };
    spawnEnemy(G.eventActive.x, G.eventActive.y, 'Vipers', 55);
    addMessage('EVENT: street robbery nearby — stop the robber for $300', '#ff6666');
  }
  if (G.eventActive) {
    G.eventActive.t -= dt;
    if (G.enemies.length === 0 && G.eventActive.type === 'robbery') {
      addCash(300); addXp(100); addMessage('Robber stopped +$300', '#7fff9e');
      G.eventActive = null;
    } else if (G.eventActive.t <= 0) { addMessage('The robber got away', '#ff6666'); G.eventActive = null; }
  }
  // Police chase vs NPC: a traffic car gets chased past the player.
  if (Math.random() < dt * 0.002 && G.wanted === 0) {
    addMessage('APD chase in progress nearby — a runner is fleeing the cops', '#9fc4e8');
    setWanted(0);
  }
}
export function drawEventMarkers(ctx, cam) {
  for (const pk of G.packages) {
    if (pk.found) continue;
    const x = pk.x - cam.x, y = pk.y - cam.y;
    if (x < -20 || y < -20 || x > 1300 || y > 820) continue;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', x, y + 3);
  }
  for (const j of G.jumps) {
    if (j.done) continue;
    const x = j.x - cam.x, y = j.y - cam.y;
    ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 18, y + 10); ctx.lineTo(x + 18, y - 10); ctx.stroke();
    ctx.fillStyle = '#ff8800'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('JUMP', x, y - 16);
  }
}
