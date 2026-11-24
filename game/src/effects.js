// effects.js — particles, muzzle flashes, explosions, blood, screen shake.
import { G } from './state.js';

export function spawnParticles(x, y, color, n, speed = 160, life = 0.6, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: life * (0.5 + Math.random()), max: life, size: size * (0.6 + Math.random() * 0.8) });
  }
}
export function spawnExplosion(x, y) {
  spawnParticles(x, y, '#ff8800', 26, 320, 0.9, 7);
  spawnParticles(x, y, '#ffcc00', 18, 220, 0.7, 6);
  spawnParticles(x, y, '#555555', 14, 90, 1.4, 9);
  G.shake = Math.max(G.shake, 12);
  G.flash = 0.25;
}
export function spawnBlood(x, y) { spawnParticles(x, y, '#c0392b', 10, 120, 0.5, 3); }
export function spawnMuzzle(x, y, angle) {
  spawnParticles(x + Math.cos(angle) * 22, y + Math.sin(angle) * 22, '#ffdd55', 4, 200, 0.12, 3);
}
export function spawnRainSplash(x, y) { spawnParticles(x, y, '#9fc4e8', 2, 40, 0.3, 2); }
export function updateParticles(dt) {
  for (const p of G.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
  G.particles = G.particles.filter((p) => p.life > 0);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.5);
}
export function drawParticles(ctx, cam) {
  for (const p of G.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cam.x - p.size / 2, p.y - cam.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
