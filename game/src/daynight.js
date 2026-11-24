// daynight.js — full day/night cycle: sky tint, sun/moon, streetlights at night.
import { G } from './state.js';

export function advanceClock(dt) {
  G.time += dt * 2.2; // 1 real second ≈ 2.2 game minutes
  if (G.time >= 1440) { G.time -= 1440; G.day++; }
}
export function hourOf() { return Math.floor(G.time / 60); }
export function minuteOf() { return Math.floor(G.time % 60); }
export function clockText() {
  const h = hourOf(), m = minuteOf();
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
export function isNight() { const h = hourOf(); return h < 6 || h >= 19; }
export function isSunset() { const h = hourOf(); return h >= 17 && h < 19; }
export function skyColor() {
  const h = hourOf() + minuteOf() / 60;
  if (h >= 6 && h < 10) return '#f7c873'; // morning gold
  if (h >= 10 && h < 16) return '#87b5d6'; // midday blue
  if (h >= 16 && h < 19) return '#ff8c42'; // sunset orange
  if (h >= 19 && h < 21) return '#6b4a7a'; // dusk purple
  return '#0d1526'; // night
}
export function ambientLight() {
  const h = hourOf();
  if (h >= 8 && h < 17) return 1;
  if (h >= 6 && h < 8) return 0.85;
  if (h >= 17 && h < 19) return 0.8;
  if (h >= 19 && h < 21) return 0.55;
  return 0.42;
}
export function drawSkyOverlay(ctx, w, h) {
  const light = ambientLight();
  if (light >= 1) return;
  ctx.fillStyle = 'rgba(8,12,30,' + (1 - light) * 0.55 + ')';
  ctx.fillRect(0, 0, w, h);
  // Sun or moon disc.
  const sx = w - 430, sy = 70;
  ctx.fillStyle = isNight() ? '#e8e8d8' : '#ffdf6b';
  ctx.beginPath(); ctx.arc(sx, sy, isNight() ? 22 : 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.arc(sx, sy, isNight() ? 30 : 40, 0, Math.PI * 2); ctx.fill();
}
