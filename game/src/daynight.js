// SUNSET KEYS v4 — day/night cycle: sun position, sky tint, streetlights and neon.
// One game hour lasts ~50 real seconds; the cycle drives lighting, traffic density
// and which side jobs and events can appear.
import { G, clamp, lerp } from './state.js';

export const HOUR_SECONDS = 50;

/** Advance the clock; returns true when a new game hour begins. */
export function tickClock(dt) {
  const before = Math.floor(G.time);
  G.time += dt / HOUR_SECONDS;
  if (G.time >= 24) { G.time -= 24; G.day++; }
  return Math.floor(G.time) !== before;
}

/** 0 = deep night, 1 = full day. Smooth around dawn (6h) and dusk (19h). */
export function daylight() {
  const t = G.time;
  if (t < 5 || t >= 20) return 0;
  if (t < 7) return (t - 5) / 2;
  if (t < 17) return 1;
  if (t < 20) return 1 - (t - 17) / 3;
  return 1;
}

/** Golden-hour factor: strong near 17.5-18.5h, the sunset look of the cover shot. */
export function sunsetFactor() {
  const d = Math.abs(G.time - 18.1);
  return clamp(1 - d / 2.2, 0, 1);
}

/** Sky tint colour for the current time, as [r,g,b] for the lighting overlay. */
export function skyTint() {
  const dl = daylight();
  const ss = sunsetFactor();
  if (ss > 0.35 && dl < 0.9) {
    // Orange-pink sunset wash.
    return [lerp(255, 90, dl * 0.4), lerp(120, 60, dl * 0.4), lerp(60, 110, dl * 0.4)];
  }
  if (dl > 0.8) return [135, 190, 235]; // bright midday blue
  if (dl > 0.3) return [180, 170, 150]; // dawn/dusk haze
  return [14, 20, 44]; // night navy
}

/** Clock as HH:MM for the HUD. */
export function clockText() {
  const h = Math.floor(G.time);
  const m = Math.floor((G.time - h) * 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/** Is it dark enough for headlights, neon signs and the night radio? */
export function isNight() { return daylight() < 0.35; }

/** Traffic density multiplier: rush hour morning and evening, quiet at 3am. */
export function trafficDensity() {
  const t = G.time;
  if (t >= 7 && t <= 9) return 1.4;
  if (t >= 17 && t <= 19) return 1.5;
  if (t >= 2 && t <= 5) return 0.35;
  return 1;
}
