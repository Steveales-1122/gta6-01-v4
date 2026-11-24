// render.js — draws the whole world: ground, water, roads, buildings, entities.
import { G, WORLD_W, WORLD_H } from './state.js';
import { drawWater } from './water.js';
import { drawCar } from './vehicles.js';
import { drawPlane } from './planes.js';
import { drawBoat } from './boats.js';
import { drawPed } from './pedestrians.js';
import { drawTrafficCar } from './traffic.js';
import { drawHeli } from './police.js';
import { drawEnemy, drawBullets } from './combat.js';
import { drawParticles } from './effects.js';
import { drawEventMarkers } from './events.js';
import { drawPropertyMarkers } from './properties.js';
import { skyColor, isNight } from './daynight.js';

export function drawWorld(ctx, cam, t) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  // Ground.
  ctx.fillStyle = '#3f5a3a';
  ctx.fillRect(0, 0, w, h);
  // City base slab.
  ctx.fillStyle = '#4a4a48';
  ctx.fillRect(100 - cam.x, 100 - cam.y, WORLD_W - 200, WORLD_H - 200);
  drawWater(ctx, cam, t);
  // Roads.
  for (const r of G.roads) {
    ctx.strokeStyle = '#2c2c30'; ctx.lineWidth = r.w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r.x1 - cam.x, r.y1 - cam.y); ctx.lineTo(r.x2 - cam.x, r.y2 - cam.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([14, 18]);
    ctx.beginPath(); ctx.moveTo(r.x1 - cam.x, r.y1 - cam.y); ctx.lineTo(r.x2 - cam.x, r.y2 - cam.y); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Airport runway.
  ctx.fillStyle = '#22242a';
  ctx.fillRect(1300 - cam.x, 1780 - cam.y, 1000, 60);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('ALBA INTERNATIONAL  ·  RWY 27', 1800 - cam.x, 1818 - cam.y);
  // Trees.
  for (const tr of G.trees) {
    const x = tr.x - cam.x, y = tr.y - cam.y;
    if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;
    ctx.fillStyle = '#2d5a2d'; ctx.beginPath(); ctx.arc(x, y, tr.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7a3f'; ctx.beginPath(); ctx.arc(x - 3, y - 3, tr.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  // Buildings with height shading and windows.
  for (const b of G.buildings) {
    const x = b.x - cam.x, y = b.y - cam.y;
    if (x < -260 || y < -260 || x > w + 60 || y > h + 60) continue;
    const shade = Math.min(18, b.floors);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 6 + shade, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(x, y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(x + 4, y + 4, b.w - 8, b.h - 8);
    ctx.fillStyle = isNight() ? '#ffd76b' : 'rgba(255,255,255,0.5)';
    const cols = Math.max(1, Math.floor(b.w / 26)), rows = Math.max(1, Math.floor(b.h / 26));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 13 + b.floors) % 3 === 0) ctx.fillRect(x + 8 + i * 26, y + 8 + j * 26, 10, 12);
    }
    if (b.landmark) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(b.landmark, x + b.w / 2, y - 8);
    }
  }
  drawPropertyMarkers(ctx, cam);
  drawEventMarkers(ctx, cam);
  // Mission marker.
  if (G.mission.active && G.mission.target) {
    const mx = G.mission.target.x - cam.x, my = G.mission.target.y - cam.y;
    const bob = Math.sin(t * 4) * 6;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.moveTo(mx, my - 34 + bob); ctx.lineTo(mx - 12, my - 58 + bob); ctx.lineTo(mx + 12, my - 58 + bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(mx, my, 34, 18, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Boats, planes, traffic, cars, peds, enemies, police.
  for (const b of G.boats) drawBoat(ctx, cam, b);
  for (const pl of G.planes) drawPlane(ctx, cam, pl);
  for (const tc of G.traffic) drawTrafficCar(ctx, cam, tc);
  for (const c of G.cars) drawCar(ctx, cam, c);
  for (const pd of G.peds) drawPed(ctx, cam, pd);
  for (const e of G.enemies) drawEnemy(ctx, cam, e);
  drawBullets(ctx, cam);
  drawHeli(ctx, cam);
  // Player.
  drawPlayer(ctx, cam, t);
  drawParticles(ctx, cam);
}
export function drawPlayer(ctx, cam, t) {
  const p = G.player;
  if (p.inVehicle || p.onPlane || p.onBoat) return;
  const x = p.x - cam.x, y = p.y - cam.y;
  ctx.save(); ctx.translate(x, y); ctx.rotate(p.angle);
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, -7, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1c40f'; ctx.fillRect(-6, -6, 12, 14);
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(-5, 8, 4, 9); ctx.fillRect(1, 8, 4, 9);
  ctx.fillStyle = '#333'; ctx.fillRect(6, -2, 18, 4);
  ctx.restore();
  // Aim line.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(p.angle) * 60, y + Math.sin(p.angle) * 60); ctx.stroke();
}
