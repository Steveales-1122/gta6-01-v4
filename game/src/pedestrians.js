// pedestrians.js — city walkers with simple sidewalk wandering and panic.
import { G, mulberry32, pick, clamp } from './state.js';
import { nearestRoadPoint } from './city.js';

const SHIRTS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#ecf0f1', '#e67e22'];
export function seedPeds() {
  const rng = mulberry32(4242);
  for (let i = 0; i < 46; i++) {
    const x = 300 + rng() * 3000, y = 300 + rng() * 1800;
    const rp = nearestRoadPoint(x, y) || { x, y };
    G.peds.push({ x: rp.x + (rng() - 0.5) * 30, y: rp.y + (rng() - 0.5) * 30, angle: rng() * Math.PI * 2, speed: 28 + rng() * 26, shirt: pick(rng, SHIRTS), panic: 0, tx: rp.x, ty: rp.y, wait: 0 });
  }
}
export function updatePeds(dt) {
  const p = G.player;
  for (const ped of G.peds) {
    const d = Math.hypot(ped.x - p.x, ped.y - p.y);
    if (d < 160 && (G.wanted > 0 || G.bullets.length > 0)) ped.panic = 3;
    if (ped.panic > 0) { ped.panic -= dt; ped.speed = 130; } else ped.speed = 34;
    if (ped.wait > 0) { ped.wait -= dt; continue; }
    const dx = ped.tx - ped.x, dy = ped.ty - ped.y, dd = Math.hypot(dx, dy);
    if (dd < 12) {
      const rp = nearestRoadPoint(ped.x + (Math.random() - 0.5) * 500, ped.y + (Math.random() - 0.5) * 500);
      if (rp) { ped.tx = rp.x; ped.ty = rp.y; }
      ped.wait = 0.5 + Math.random() * 2;
      continue;
    }
    ped.angle = Math.atan2(dy, dx);
    ped.x += Math.cos(ped.angle) * ped.speed * dt;
    ped.y += Math.sin(ped.angle) * ped.speed * dt;
    ped.x = clamp(ped.x, 100, 3500); ped.y = clamp(ped.y, 100, 2300);
  }
}
export function drawPed(ctx, cam, ped) {
  const x = ped.x - cam.x, y = ped.y - cam.y;
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x, y - 6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ped.shirt; ctx.fillRect(x - 5, y - 5, 10, 12);
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(x - 4, y + 7, 3, 8); ctx.fillRect(x + 1, y + 7, 3, 8);
}
