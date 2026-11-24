// SUNSET KEYS v4 — effects: particles, muzzle flashes, explosions, dynamic
// shadows, neon glow and the day/night lighting overlay.
import { G, clamp, rand } from './state.js';
import { daylight, sunsetFactor, skyTint, isNight } from './daynight.js';
import { fogDensity, lightningFlash } from './weather.js';

/** Spawn a burst of particles (sparks, smoke, blood, spray). */
export function burst(x, y, kind, n, color) {
  for (let i = 0; i < n; i++) {
    G.particles.push({
      kind, x, y, vx: rand(-160, 160), vy: rand(-160, 160),
      t: rand(0.3, 0.9), max: 0.9, color: color || '#ffd34d', size: rand(2, 6),
    });
  }
}

/** Update all particles: move, fade, remove. */
export function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.t -= dt;
    if (p.t <= 0) { G.particles.splice(i, 1); continue; }
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.kind === 'smoke' || p.kind === 'cloud') { p.vy -= 20 * dt; p.size += 6 * dt; }
    if (p.kind === 'debris') { p.vx *= (1 - 2 * dt); p.vy *= (1 - 2 * dt); }
  }
  if (G.particles.length > 400) G.particles.splice(0, G.particles.length - 400);
}

/** Draw particles in world space. */
export function drawParticles(ctx, cam) {
  for (const p of G.particles) {
    const a = clamp(p.t / p.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === 'boom' || p.kind === 'fire') {
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, p.size * (1.6 - a), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'smoke' || p.kind === 'cloud') {
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - cam.x - p.size / 2, p.y - cam.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

/** Draw the day/night lighting overlay: darkness, sunset wash, fog and lightning. */
export function drawLighting(ctx, w, h) {
  const dl = daylight();
  const ss = sunsetFactor();
  const tint = skyTint();
  // Night darkness.
  const dark = clamp(1 - dl, 0, 1);
  if (dark > 0.05) {
    ctx.fillStyle = `rgba(8,12,34,${dark * 0.55})`;
    ctx.fillRect(0, 0, w, h);
  }
  // Sunset orange wash.
  if (ss > 0.1) {
    ctx.fillStyle = `rgba(255,120,40,${ss * 0.10})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `rgba(255,80,120,${ss * 0.05})`;
    ctx.fillRect(0, 0, w, h);
  }
  // Fog haze.
  const fog = fogDensity();
  if (fog > 0.02) {
    ctx.fillStyle = `rgba(200,205,215,${fog * 0.5})`;
    ctx.fillRect(0, 0, w, h);
  }
  // Lightning flash.
  const flash = lightningFlash();
  if (flash > 0) {
    ctx.fillStyle = `rgba(220,230,255,${flash * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  }
  void tint;
}

/** Draw neon signs and lit windows at night (called from the city renderer). */
export function drawNeonSigns(ctx, cam) {
  if (!isNight()) return;
  const signs = [
    { x: 2200, y: 640, text: 'KASINO ALBA', color: '#ff2e88' },
    { x: 1300, y: 1500, text: 'ARCADE NEON', color: '#2ee6ff' },
    { x: 2600, y: 3200, text: 'BENGKEL TURBO', color: '#ffd34d' },
    { x: 900, y: 500, text: 'MARINA', color: '#2ea8d8' },
  ];
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  for (const s of signs) {
    const x = s.x - cam.x, y = s.y - cam.y;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = s.color;
    ctx.fillText(s.text, x, y);
  }
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}
