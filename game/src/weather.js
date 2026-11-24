// SUNSET KEYS v4 — weather: clear, rain, fog and storm cycles with particles.
// Weather changes every few game hours; rain wets the roads (slipperier driving),
// fog shortens sight lines, storms add lightning flashes.
import { G, rand, pick } from './state.js';

const WEATHERS = ['clear', 'clear', 'clear', 'rain', 'fog', 'rain', 'storm'];
export const drops = []; // rain streaks, screen-space, spawned by weather.js

/** Roll a new weather state when the timer runs out. */
export function tickWeather(dt) {
  G.weatherTimer -= dt;
  if (G.weatherTimer <= 0) {
    G.weather = pick(WEATHERS);
    G.weatherTimer = 180 + Math.random() * 240;
  }
  // Maintain rain streaks while it rains or storms.
  if (G.weather === 'rain' || G.weather === 'storm') {
    for (let i = 0; i < 3; i++) {
      drops.push({ x: rand(-20, 1300), y: -20, vx: -90 - rand(0, 60), vy: 700 + rand(0, 300), len: 12 + rand(0, 10) });
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.y > 850) drops.splice(i, 1);
  }
  if (drops.length > 260) drops.splice(0, drops.length - 260);
}

/** Lightning flash: 0..1 brightness, only during storms. */
export function lightningFlash() {
  if (G.weather !== 'storm') return 0;
  const t = G.frame * 0.016;
  const bolt = Math.sin(t * 0.7) > 0.985 ? 0.9 : Math.sin(t * 2.3) > 0.995 ? 0.5 : 0;
  return bolt;
}

/** Grip multiplier for car handling in the wet. */
export function gripFactor() {
  if (G.weather === 'rain') return 0.82;
  if (G.weather === 'storm') return 0.72;
  return 1;
}

/** Fog density 0..1 for the renderer's haze overlay. */
export function fogDensity() {
  if (G.weather === 'fog') return 0.55;
  if (G.weather === 'rain') return 0.18;
  if (G.weather === 'storm') return 0.3;
  return 0;
}

export function weatherLabel() {
  return { clear: 'Cerah', rain: 'Hujan', fog: 'Berkabut', storm: 'Badai' }[G.weather] || 'Cerah';
}
