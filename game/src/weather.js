// weather.js — clear, rain, fog and storm with drifting particles and handling effects.
import { G, pick } from './state.js';

const TYPES = ['clear', 'clear', 'rain', 'fog', 'storm'];
export function updateWeather(dt) {
  G.weatherTimer -= dt;
  if (G.weatherTimer <= 0) {
    G.weather = pick(Math.random, TYPES);
    G.weatherTimer = 45 + Math.random() * 60;
  }
  if (G.weather === 'rain' || G.weather === 'storm') {
    if (!G.rain) G.rain = [];
    for (let i = 0; i < 3; i++) G.rain.push({ x: Math.random() * 1400, y: -10, vy: 700 + Math.random() * 300, vx: G.weather === 'storm' ? -160 : -40 });
    for (const d of G.rain) { d.y += d.vy * dt; d.x += d.vx * dt; }
    G.rain = G.rain.filter((d) => d.y < 850);
  } else G.rain = [];
}
export function weatherGrip() { return G.weather === 'storm' ? 0.75 : G.weather === 'rain' ? 0.88 : 1; }
export function drawWeather(ctx, w, h) {
  if (G.weather === 'fog') {
    ctx.fillStyle = 'rgba(200,205,215,0.28)';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (G.weather === 'storm') {
    ctx.fillStyle = 'rgba(20,24,40,0.25)';
    ctx.fillRect(0, 0, w, h);
    if (Math.random() < 0.02) ctx.fillStyle = 'rgba(255,255,220,0.25)';
    ctx.fillRect(0, 0, w, h);
  }
  if (G.rain) {
    ctx.strokeStyle = 'rgba(160,190,230,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of G.rain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 6, d.y + 16); }
    ctx.stroke();
  }
}
