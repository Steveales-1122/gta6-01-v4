// planes.js — Alba International: three flyable planes, runway take-off and flight.
import { G, clamp } from './state.js';

export const PLANES = [
  { id: 'prop', name: 'Duster Prop', x: 1500, y: 1900, top: 420, price: 0 },
  { id: 'jet', name: 'Alba Jet 77', x: 1700, y: 1900, top: 640, price: 30000 },
  { id: 'cargo', name: 'Sky Hauler', x: 1900, y: 1900, top: 380, price: 20000 },
];

export function seedPlanes() {
  for (const p of PLANES) G.planes.push({ ...p, angle: -Math.PI / 2, speed: 0, altitude: 0, flying: false, owned: p.id === 'prop' });
}
export function nearestPlane(x, y, maxD = 90) {
  let best = null, bd = maxD;
  for (const p of G.planes) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  return best;
}
export function boardPlane(plane) {
  if (!plane.owned && G.cash < plane.price) return false;
  if (!plane.owned) { G.cash -= plane.price; plane.owned = true; }
  G.player.onPlane = plane; G.player.x = plane.x; G.player.y = plane.y;
  return true;
}
export function updatePlane(dt, input) {
  const p = G.player, pl = p.onPlane;
  if (!pl) return;
  pl.angle += input.x * 1.6 * dt;
  if (input.y < 0) pl.speed += 300 * dt; else if (input.y > 0) pl.speed -= 200 * dt; else pl.speed *= Math.pow(0.6, dt);
  pl.speed = clamp(pl.speed, 0, pl.top);
  if (pl.speed > 260) pl.altitude = clamp(pl.altitude + 90 * dt, 0, 300);
  else pl.altitude = Math.max(0, pl.altitude - 60 * dt);
  pl.flying = pl.altitude > 10;
  pl.x += Math.cos(pl.angle) * pl.speed * dt;
  pl.y += Math.sin(pl.angle) * pl.speed * dt;
  pl.x = clamp(pl.x, 40, 3560); pl.y = clamp(pl.y, 40, 2360);
  p.x = pl.x; p.y = pl.y; p.angle = pl.angle;
}
export function drawPlane(ctx, cam, pl) {
  const x = pl.x - cam.x, y = pl.y - cam.y;
  const s = 1 + pl.altitude / 300;
  ctx.save(); ctx.translate(x, y); ctx.rotate(pl.angle); ctx.scale(s, s);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-30, -8, 60, 16);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-30, -8, 60, 4);
  ctx.fillStyle = '#9fd8ff'; ctx.fillRect(14, -6, 10, 12);
  ctx.fillStyle = '#888'; ctx.fillRect(-4, -26, 8, 52);
  ctx.fillStyle = '#555'; ctx.fillRect(-28, -4, 8, 8);
  ctx.restore();
  if (pl.altitude > 0) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 14, 26, 8, 0, 0, Math.PI * 2); ctx.fill(); }
}
