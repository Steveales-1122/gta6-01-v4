// SUNSET KEYS v4 — pedestrians: sidewalk walkers, shoppers, joggers and panickers.
// Peds wander the sidewalks, flee gunfire, hail taxis, and some become taxi fares
// or vigilante targets; a few are gang members who fight back.
import { G, rand, pick, clamp, angleTo, dist2 } from './state.js';

const PED_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#ecf0f1', '#fd79a8', '#00cec9'];
const PED_NAMES = ['Mara', 'Dino', 'Lena', 'Rico', 'Sofia', 'Bruno', 'Nadia', 'Tomas', 'Iris', 'Felix', 'Cleo', 'Hugo'];

/** Spawn peds around the camera so the streets always feel alive. */
export function spawnPeds(count) {
  for (let i = 0; i < count; i++) {
    const x = clamp(G.camera.x + rand(-700, 700), 40, 5160);
    const y = clamp(G.camera.y + rand(-500, 500), 40, 3760);
    G.peds.push(makePed(x, y));
  }
}

export function makePed(x, y, opts) {
  const o = opts || {};
  return {
    x, y, angle: rand(0, Math.PI * 2), speed: rand(28, 55),
    color: pick(PED_COLORS), name: pick(PED_NAMES),
    hp: 100, state: o.state || 'walk', // walk | flee | fare | gang | down
    gang: o.gang || null, target: null, t: rand(0, 4),
    size: 9, dead: false,
  };
}

/** Ped AI: walk, panic-flee from gunfire, gang members hold turf and shoot back. */
export function updatePeds(dt) {
  const p = G.player;
  for (let i = G.peds.length - 1; i >= 0; i--) {
    const ped = G.peds[i];
    if (ped.dead) { ped.t -= dt; if (ped.t <= 0) G.peds.splice(i, 1); continue; }
    ped.t -= dt;
    const dPlayer = dist2(ped.x, ped.y, p.x, p.y);
    const gunfireNear = G.bullets.length > 0 && dPlayer < 500 * 500;
    if (ped.state === 'walk') {
      if (gunfireNear && dPlayer < 420 * 420) { ped.state = 'flee'; ped.t = 3; }
      else if (ped.t <= 0) { ped.angle = rand(0, Math.PI * 2); ped.t = rand(2, 6); }
      ped.x += Math.cos(ped.angle) * ped.speed * dt;
      ped.y += Math.sin(ped.angle) * ped.speed * dt;
    } else if (ped.state === 'flee') {
      const away = angleTo(p.x, p.y, ped.x, ped.y);
      ped.x += Math.cos(away) * 120 * dt;
      ped.y += Math.sin(away) * 120 * dt;
      if (ped.t <= 0) ped.state = 'walk';
    } else if (ped.state === 'gang') {
      // Gang member: stand ground, shoot the player when close and wanted.
      if (dPlayer < 380 * 380 && G.wanted > 0) {
        ped.angle = angleTo(ped.x, ped.y, p.x, p.y);
        if (Math.random() < dt * 0.7) {
          G.bullets.push({ x: ped.x, y: ped.y, angle: ped.angle + rand(-0.12, 0.12), speed: 520, dmg: 6, from: 'gang', t: 1.2 });
        }
      } else if (ped.t <= 0) {
        ped.angle = rand(0, Math.PI * 2); ped.t = rand(3, 7);
        ped.x += Math.cos(ped.angle) * ped.speed * 0.5 * dt;
        ped.y += Math.sin(ped.angle) * ped.speed * 0.5 * dt;
      }
    } else if (ped.state === 'fare') {
      // Waiting for a taxi: wave when the player's taxi is near.
      ped.angle = Math.sin(G.frame * 0.004) * 0.6;
    }
    ped.x = clamp(ped.x, 30, 5170);
    ped.y = clamp(ped.y, 30, 3770);
    // Keep peds off the water and out of buildings.
    if (ped.x < 300 && ped.y > 0) ped.x = 300;
  }
  // Top up the crowd near the camera.
  if (G.peds.length < 26 && Math.random() < dt * 2) spawnPeds(1);
}

/** Draw peds as small top-down figures with a shadow and a coloured shirt. */
export function drawPeds(ctx, cam) {
  for (const ped of G.peds) {
    const x = ped.x - cam.x, y = ped.y - cam.y;
    if (x < -30 || x > 1330 || y < -30 || y > 830) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (ped.dead) {
      ctx.fillStyle = '#5a3a3a';
      ctx.beginPath(); ctx.ellipse(x, y, 10, 5, ped.angle, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ped.angle);
    ctx.fillStyle = ped.color;
    ctx.beginPath(); ctx.arc(0, 0, ped.size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c27d';
    ctx.beginPath(); ctx.arc(3, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.fillRect(-ped.size - 2, -3, 4, 6);
    ctx.fillRect(-ped.size - 2, -3, 4, 6);
    ctx.restore();
    if (ped.gang) {
      ctx.fillStyle = ped.gang === 'vipers' ? '#e5484d' : ped.gang === 'kings' ? '#f5a623' : '#2ea8d8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('◆', x - 4, y - 14);
    }
    if (ped.state === 'fare') {
      ctx.fillStyle = '#ffd34d';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('!', x - 3, y - 14);
    }
  }
}
