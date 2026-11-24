// SUNSET KEYS v4 — minimap: circular live map (bottom-left) with roads, district
// tints, turf colours, mission marker, side-job marker, cops and the player arrow.
import { G, clamp } from './state.js';
import { DISTRICTS } from './city.js';
import { WORLD_W, WORLD_H } from './state.js';

const MAP_R = 92;
const MAP_CX = 108;
const MAP_CY_OFFSET = 108; // from bottom

/** Draw the minimap circle. */
export function drawMinimap(ctx, w, h) {
  if (G.mode === 'title') return;
  const cx = MAP_CX, cy = h - MAP_CY_OFFSET;
  const scale = (MAP_R * 2) / 2400; // show a 2400px window around the player
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, MAP_R, 0, Math.PI * 2);
  ctx.clip();
  // Background: dark land.
  ctx.fillStyle = '#101c26';
  ctx.fillRect(cx - MAP_R, cy - MAP_R, MAP_R * 2, MAP_R * 2);
  const px = G.player.x, py = G.player.y;
  const toMap = (x, y) => [cx + (x - px) * scale, cy + (y - py) * scale];
  // District tints (turf colour).
  for (const d of DISTRICTS) {
    const [x1, y1] = toMap(d.x, d.y);
    const [x2, y2] = toMap(d.x + d.w, d.y + d.h);
    const owner = G.turf[d.id];
    ctx.fillStyle = owner === 'player' ? 'rgba(46,204,113,0.30)' : owner === 'none' ? 'rgba(255,255,255,0.05)' : owner === 'vipers' ? 'rgba(229,72,77,0.25)' : owner === 'kings' ? 'rgba(245,166,35,0.25)' : 'rgba(46,168,216,0.25)';
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
  // Water.
  ctx.fillStyle = '#1d4e6b';
  const [wx1, wy1] = toMap(0, 0);
  const [wx2] = toMap(300, 0);
  ctx.fillRect(wx1, wy1, wx2 - wx1, MAP_R * 2 + 200);
  // Roads.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const rx of G.city.roads.verticals) {
    const [x1, y1] = toMap(rx, py - 1200);
    const [x2, y2] = toMap(rx, py + 1200);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  for (const ry of G.city.roads.horizontals) {
    const [x1, y1] = toMap(px - 1200, ry);
    const [x2, y2] = toMap(px + 1200, ry);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  // Airport runway.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const [rx1, ry1] = toMap(G.city.airport.runway.x, G.city.airport.runway.y);
  ctx.fillRect(rx1, ry1, 90 * scale, 900 * scale);
  // Mission marker (yellow diamond, pulsing).
  const ms = G.mission;
  if (ms.active && ms.target) {
    const [mx, my] = toMap(ms.target.x, ms.target.y);
    const pulse = 5 + Math.sin(G.frame * 0.15) * 2;
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(mx, my - pulse - 4); ctx.lineTo(mx + pulse, my); ctx.lineTo(mx, my + pulse + 4); ctx.lineTo(mx - pulse, my);
    ctx.closePath(); ctx.fill();
  }
  // Cops (blue dots).
  ctx.fillStyle = '#4a90d9';
  for (const car of G.cars) {
    if (car.owner !== 'cop') continue;
    const [x, y] = toMap(car.x, car.y);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Player arrow (centre, pointing up = facing).
  ctx.fillStyle = '#ffffff';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(G.player.angle + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
  // Ring + north tick.
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, MAP_R, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - MAP_R - 6);
  ctx.textAlign = 'left';
  // Turf legend line under the map.
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const owned = DISTRICTS.filter((d) => G.turf[d.id] === 'player').length;
  ctx.fillText('Turf: ' + owned + '/6 distrik milikmu', cx - MAP_R, cy + MAP_R + 18);
}
