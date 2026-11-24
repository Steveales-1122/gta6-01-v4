// SUNSET KEYS v4 — water rendering: the bay, the marina basin, animated waves,
// sun glitter at sunset and reflections under boats.
import { G } from './state.js';

/** Draw the bay and marina basin with animated wave lines and sunset glitter. */
export function drawWater(ctx, cam, sunset) {
  const c = G.city;
  if (!c) return;
  const t = G.frame * 0.016;
  // Deep bay.
  ctx.fillStyle = '#1d4e6b';
  ctx.fillRect(-cam.x, -cam.y, c.water.w, c.water.h);
  ctx.fillStyle = '#235a78';
  ctx.fillRect(c.water.basin.x - cam.x, c.water.basin.y - cam.y, c.water.basin.w, c.water.basin.h);
  // Wave lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = 60; y < c.water.h; y += 90) {
    for (let x = 20; x < c.water.w - 20; x += 70) {
      const wob = Math.sin(t * 1.6 + x * 0.05 + y * 0.03) * 6;
      ctx.moveTo(x - cam.x + wob, y - cam.y);
      ctx.lineTo(x + 34 - cam.x + wob, y - cam.y);
    }
  }
  ctx.stroke();
  // Sunset glitter on the water.
  if (sunset > 0.15) {
    ctx.fillStyle = `rgba(255,170,80,${0.10 * sunset})`;
    for (let i = 0; i < 26; i++) {
      const gx = 30 + ((i * 97) % 240);
      const gy = ((i * 211 + Math.floor(t * 30)) % 3600);
      ctx.fillRect(gx - cam.x, gy - cam.y, 26, 3);
    }
  }
  // Shoreline foam.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.water.w - cam.x, -cam.y);
  ctx.lineTo(c.water.w - cam.x, c.water.h - cam.y);
  ctx.stroke();
}

/** Draw a boat wake behind a moving boat. */
export function drawWake(ctx, cam, boat) {
  const sp = Math.hypot(boat.vx || 0, boat.vy || 0);
  if (sp < 30) return;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  const bx = boat.x - cam.x, by = boat.y - cam.y;
  ctx.beginPath();
  ctx.ellipse(bx - Math.cos(boat.angle) * 30, by - Math.sin(boat.angle) * 30, 26, 12, boat.angle, 0, Math.PI * 2);
  ctx.fill();
}
