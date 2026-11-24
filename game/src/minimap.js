// minimap.js — circular minimap with districts, turf colors, mission marker and north.
import { G, WORLD_W, WORLD_H } from './state.js';
import { DISTRICTS } from './state.js';

export function drawMinimap(ctx, w, h) {
  const r = 78, cx = w - r - 18, cy = h - r - 130;
  const scale = (r * 2) / WORLD_W;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#1a2a3a'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Districts tinted by turf owner.
  const turfColor = { Player: '#f1c40f', Vipers: '#27ae60', Kings: '#8e44ad', 'Marina Boys': '#2980b9' };
  for (const d of DISTRICTS) {
    ctx.fillStyle = turfColor[G.turf[d.id]] || '#445';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(cx - r + d.x * scale, cy - r + d.y * (r * 2 / WORLD_H), d.w * scale, d.h * (r * 2 / WORLD_H));
  }
  ctx.globalAlpha = 1;
  // Roads.
  ctx.strokeStyle = '#5a6a7a'; ctx.lineWidth = 1;
  for (const rd of G.roads) {
    ctx.beginPath();
    ctx.moveTo(cx - r + rd.x1 * scale, cy - r + rd.y1 * (r * 2 / WORLD_H));
    ctx.lineTo(cx - r + rd.x2 * scale, cy - r + rd.y2 * (r * 2 / WORLD_H));
    ctx.stroke();
  }
  // Mission / sidejob marker.
  const mark = (tx, ty, color) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx - r + tx * scale, cy - r + ty * (r * 2 / WORLD_H), 5, 0, Math.PI * 2); ctx.fill();
  };
  if (G.mission.active && G.mission.target) mark(G.mission.target.x, G.mission.target.y, '#ffd700');
  if (G.sidejob.target) mark(G.sidejob.target.x, G.sidejob.target.y, '#7fff9e');
  if (G.eventActive) mark(G.eventActive.x, G.eventActive.y, '#ff6666');
  // Player arrow.
  const px = cx - r + G.player.x * scale, py = cy - r + G.player.y * (r * 2 / WORLD_H);
  ctx.save(); ctx.translate(px, py); ctx.rotate(G.player.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Police dots.
  ctx.fillStyle = '#e74c3c';
  for (const c of G.police) { ctx.beginPath(); ctx.arc(cx - r + c.x * scale, cy - r + c.y * (r * 2 / WORLD_H), 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r + 14);
}
