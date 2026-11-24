// water.js — the sea along the beach and marina: animated waves and shoreline.
import { G } from './state.js';

export function drawWater(ctx, cam, t) {
  // Sea occupies the south-west corner and the marina basin.
  const regions = [
    { x: 100, y: 2050, w: 2300, h: 350 },
    { x: 2400, y: 2050, w: 1200, h: 350 },
    { x: 3300, y: 1400, w: 300, h: 1000 },
  ];
  for (const r of regions) {
    const x = r.x - cam.x, y = r.y - cam.y;
    const grad = ctx.createLinearGradient(x, y, x, y + r.h);
    grad.addColorStop(0, '#2e7f9e');
    grad.addColorStop(1, '#1a4a6b');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, r.w, r.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const wy = y + 20 + i * 52 + Math.sin(t * 1.4 + i * 2) * 6;
      ctx.beginPath();
      for (let wx = x; wx < x + r.w; wx += 40) ctx.lineTo(wx, wy + Math.sin(wx * 0.02 + t + i) * 4);
      ctx.stroke();
    }
  }
  // Sand strip along the beach.
  ctx.fillStyle = '#e8c88a';
  ctx.fillRect(100 - cam.x, 1980 - cam.y, 2300, 70);
}
