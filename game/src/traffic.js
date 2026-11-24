// traffic.js — ambient traffic cars cruising the road grid.
import { G, mulberry32, pick, clamp } from './state.js';

const COLORS = ['#95a5a6', '#34495e', '#c0392b', '#27ae60', '#d35400', '#8e44ad', '#16a085'];
export function seedTraffic() {
  const rng = mulberry32(99);
  for (let i = 0; i < 22; i++) {
    const vertical = rng() < 0.5;
    const road = vertical ? 200 + Math.floor(rng() * 12) * 300 : 200 + Math.floor(rng() * 8) * 300;
    G.traffic.push({
      x: vertical ? road : 200 + rng() * 3200,
      y: vertical ? 200 + rng() * 2000 : road,
      angle: vertical ? (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (rng() < 0.5 ? 0 : Math.PI),
      speed: 90 + rng() * 60, color: pick(rng, COLORS), vertical,
    });
  }
}
export function updateTraffic(dt) {
  const p = G.player;
  for (const t of G.traffic) {
    t.x += Math.cos(t.angle) * t.speed * dt;
    t.y += Math.sin(t.angle) * t.speed * dt;
    if (t.x < 120 || t.x > 3480 || t.y < 120 || t.y > 2280) {
      t.x = 200 + Math.random() * 3200; t.y = 200 + Math.random() * 2000;
      t.angle = t.vertical ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (Math.random() < 0.5 ? 0 : Math.PI);
    }
    // Bump the player if it runs into them on foot.
    if (!p.inVehicle && Math.hypot(t.x - p.x, t.y - p.y) < 26) { p.hp -= 12 * dt * 10; }
  }
}
export function drawTrafficCar(ctx, cam, t) {
  const x = t.x - cam.x, y = t.y - cam.y;
  ctx.save(); ctx.translate(x, y); ctx.rotate(t.angle);
  ctx.fillStyle = '#111'; ctx.fillRect(-22, -12, 44, 24);
  ctx.fillStyle = t.color; ctx.fillRect(-20, -10, 40, 20);
  ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-5, -8, 11, 16);
  ctx.restore();
}
