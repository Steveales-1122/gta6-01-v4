// boats.js — Marina boats: speedboat, yacht and fishing boat, drivable on the water.
import { G, clamp } from './state.js';

export function seedBoats() {
  G.boats = [
    { id: 'speed', name: 'Wave Runner', x: 2900, y: 2050, angle: 0, speed: 0, top: 480, owned: true, color: '#e74c3c' },
    { id: 'yacht', name: 'Sunset Yacht', x: 3100, y: 2100, angle: 0, speed: 0, top: 260, owned: false, color: '#ecf0f1', price: 40000 },
    { id: 'fish', name: 'Old Trawler', x: 2700, y: 2150, angle: 0, speed: 0, top: 200, owned: false, color: '#7f8c8d', price: 5000 },
  ];
}
export function nearestBoat(x, y, maxD = 80) {
  let best = null, bd = maxD;
  for (const b of G.boats) { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
  return best;
}
export function boardBoat(boat) {
  if (!boat.owned && G.cash < boat.price) return false;
  if (!boat.owned) { G.cash -= boat.price; boat.owned = true; }
  G.player.onBoat = boat; G.player.x = boat.x; G.player.y = boat.y;
  return true;
}
export function updateBoat(dt, input) {
  const p = G.player, b = p.onBoat;
  if (!b) return;
  b.angle += input.x * 1.8 * dt;
  if (input.y < 0) b.speed += 260 * dt; else if (input.y > 0) b.speed -= 180 * dt; else b.speed *= Math.pow(0.5, dt);
  b.speed = clamp(b.speed, -80, b.top);
  b.x += Math.cos(b.angle) * b.speed * dt;
  b.y += Math.sin(b.angle) * b.speed * dt;
  b.x = clamp(b.x, 2400, 3560); b.y = clamp(b.y, 1400, 2360);
  p.x = b.x; p.y = b.y; p.angle = b.angle;
}
export function drawBoat(ctx, cam, b) {
  const x = b.x - cam.x, y = b.y - cam.y;
  ctx.save(); ctx.translate(x, y); ctx.rotate(b.angle);
  ctx.fillStyle = b.color; ctx.fillRect(-26, -10, 52, 20);
  ctx.fillStyle = '#fff'; ctx.fillRect(-8, -7, 16, 14);
  ctx.fillStyle = '#9fd8ff'; ctx.fillRect(2, -6, 8, 12);
  ctx.restore();
}
export function inWater(x, y) { return x > 2400 && y > 2050; }
