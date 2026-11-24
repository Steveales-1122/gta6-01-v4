// SUNSET KEYS v4 — world renderer: ground, roads, buildings, airport, docks,
// trees, collectibles, objective beacons, the player, cops and the helicopter.
// Everything is drawn in world space from the camera's top-left corner.
import { G, clamp } from './state.js';
import { DISTRICTS } from './city.js';
import { drawWater, drawWake } from './water.js';
import { drawBoats } from './boats.js';
import { drawPlanes } from './planes.js';
import { drawCar } from './vehicles.js';
import { drawPeds } from './pedestrians.js';
import { drawBullets } from './combat.js';
import { drawParticles, drawNeonSigns } from './effects.js';
import { daylight, sunsetFactor, isNight } from './daynight.js';
import { drops } from './weather.js';

/** Draw the whole world for one frame. */
export function drawWorld(ctx, cam, w, h) {
  const c = G.city;
  const dl = daylight();
  const ss = sunsetFactor();
  const night = isNight();
  // Base grass.
  ctx.fillStyle = '#5d7a45';
  ctx.fillRect(-cam.x, -cam.y, 5200, 3800);
  // District ground tints.
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color + '33';
    ctx.fillRect(d.x - cam.x, d.y - cam.y, d.w, d.h);
  }
  // Airport tarmac.
  ctx.fillStyle = '#5a6068';
  ctx.fillRect(c.airport.x - cam.x, c.airport.y - cam.y, c.airport.w, c.airport.h);
  // Water (bay + marina basin).
  drawWater(ctx, cam, ss);
  // Roads.
  drawRoads(ctx, cam);
  // Runways.
  drawRunway(ctx, cam, c.airport.runway);
  drawRunway(ctx, cam, c.airport.runway2);
  // Terminal + tower.
  ctx.fillStyle = '#8a94a3';
  ctx.fillRect(c.airport.terminal.x - cam.x, c.airport.terminal.y - cam.y, c.airport.terminal.w, c.airport.terminal.h);
  ctx.fillStyle = '#6a7482';
  ctx.fillRect(c.airport.tower.x - cam.x, c.airport.tower.y - cam.y, c.airport.tower.w, c.airport.tower.h);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(c.airport.tower.x - cam.x + 20, c.airport.tower.y - cam.y + 20, 20, 20);
  // Docks.
  for (const d of c.docks) {
    ctx.fillStyle = '#7a5a35';
    ctx.fillRect(d.x - cam.x, d.y - cam.y, d.w, d.h);
  }
  // Parks.
  for (const pr of c.props) {
    if (pr.kind !== 'fountain') continue;
    ctx.fillStyle = '#4a7a3f';
    ctx.beginPath(); ctx.arc(pr.x - cam.x, pr.y - cam.y, 180, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d7ab8';
    ctx.beginPath(); ctx.arc(pr.x - cam.x, pr.y - cam.y, pr.r, 0, Math.PI * 2); ctx.fill();
  }
  // Buildings with sun shadows and lit windows at night.
  drawBuildings(ctx, cam, ss, night);
  // Trees.
  for (const t of c.trees) {
    const x = t.x - cam.x, y = t.y - cam.y;
    if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x + 3, y + 4, t.r, t.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f6b2f';
    ctx.beginPath(); ctx.arc(x, y, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8a3f';
    ctx.beginPath(); ctx.arc(x - 3, y - 3, t.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  // Street lamps (glow at night).
  for (const l of c.lamps) {
    const x = l.x - cam.x, y = l.y - cam.y;
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x - 2, y - 2, 4, 4);
    if (night) {
      ctx.fillStyle = 'rgba(255,220,120,0.25)';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Stunt ramps.
  for (const s of c.stunts) {
    const x = s.x - cam.x, y = s.y - cam.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.angle);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(-26, -14, 52, 28);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-26, -14, 52, 6);
    ctx.restore();
  }
  // Hidden packages (collectibles).
  for (const col of c.collectibles) {
    if (col.found) continue;
    const x = col.x - cam.x, y = col.y - cam.y;
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
    const pulse = 0.6 + Math.sin(G.frame * 0.08 + col.id) * 0.4;
    ctx.fillStyle = `rgba(255,211,77,${pulse})`;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a00';
    ctx.fillRect(x - 5, y - 4, 10, 8);
  }
  // Objective beacon.
  drawObjectiveBeacon(ctx, cam);
  // Shop / property markers.
  drawLocationMarkers(ctx, cam);
  // Boats, planes, cars, peds, player, cops — sorted roughly by y.
  drawBoats(ctx, cam);
  for (const b of G.boats) if (b.occupied) drawWake(ctx, cam, b);
  drawPlanes(ctx, cam);
  const entities = [];
  for (const car of G.cars) entities.push({ y: car.y, draw: () => drawCar(ctx, cam, car, night) });
  for (const ped of G.peds) entities.push({ y: ped.y, draw: () => {} }); // peds drawn in batch below
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.draw();
  drawPeds(ctx, cam);
  drawPlayer(ctx, cam, night);
  drawCops(ctx, cam);
  drawBullets(ctx, cam);
  drawParticles(ctx, cam);
  drawHeli(ctx, cam);
  drawNeonSigns(ctx, cam);
  // Rain streaks (screen space).
  if (drops.length > 0) {
    ctx.strokeStyle = 'rgba(180,200,220,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of drops) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 4, d.y + d.len);
    }
    ctx.stroke();
  }
  void dl;
}

function drawRoads(ctx, cam) {
  const c = G.city;
  const w = c.roads.width;
  ctx.fillStyle = '#2e3138';
  for (const x of c.roads.verticals) ctx.fillRect(x - w / 2 - cam.x, -cam.y, w, 3800);
  for (const y of c.roads.horizontals) ctx.fillRect(-cam.x, y - w / 2 - cam.y, 5200, w);
  // Centre dashes.
  ctx.fillStyle = '#c8b25a';
  for (const x of c.roads.verticals) {
    for (let y = 0; y < 3800; y += 80) ctx.fillRect(x - 2 - cam.x, y - cam.y, 4, 36);
  }
  for (const y of c.roads.horizontals) {
    for (let x = 0; x < 5200; x += 80) ctx.fillRect(x - cam.x, y - 2 - cam.y, 36, 4);
  }
  // Sidewalk edges.
  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = 3;
  for (const x of c.roads.verticals) {
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 4 - cam.x, -cam.y); ctx.lineTo(x - w / 2 - 4 - cam.x, 3800 - cam.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w / 2 + 4 - cam.x, -cam.y); ctx.lineTo(x + w / 2 + 4 - cam.x, 3800 - cam.y); ctx.stroke();
  }
}

function drawRunway(ctx, cam, r) {
  ctx.fillStyle = '#22252b';
  ctx.fillRect(r.x - cam.x, r.y - cam.y, r.w, r.h);
  ctx.fillStyle = '#ffffff';
  for (let y = r.y + 30; y < r.y + r.h - 20; y += 70) ctx.fillRect(r.x + r.w / 2 - 3 - cam.x, y - cam.y, 6, 34);
  ctx.fillStyle = '#ffd34d';
  ctx.fillRect(r.x - 6 - cam.x, r.y - cam.y, 3, r.h);
  ctx.fillRect(r.x + r.w + 3 - cam.x, r.y - cam.y, 3, r.h);
}

function drawBuildings(ctx, cam, ss, night) {
  const w = 1280, h = 800;
  for (const b of G.city.buildings) {
    const x = b.x - cam.x, y = b.y - cam.y;
    if (x < -160 || x > w + 160 || y < -160 || y > h + 160) continue;
    // Sun shadow (long at sunset, from the west).
    const shx = b.height * (0.4 + ss * 1.2), shy = b.height * 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x + shx, y + shy, b.w, b.h);
    // Roof.
    ctx.fillStyle = b.roof;
    ctx.fillRect(x, y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, b.w, b.h);
    // Inner court for big buildings.
    if (b.w > 130 && b.h > 110) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 14, y + 14, b.w - 28, b.h - 28);
    }
    // Lit windows at night.
    if (night && b.windows > 0) {
      ctx.fillStyle = 'rgba(255,210,110,0.85)';
      const cols = Math.floor(b.w / 26), rows = Math.floor(b.h / 26);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if (((i * 7 + j * 13 + b.x) % 5) < 2) ctx.fillRect(x + 8 + i * 26, y + 8 + j * 26, 9, 12);
      }
    }
    // Tower roof detail.
    if (b.kind === 'tower') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + b.w / 2 - 12, y + b.h / 2 - 12, 24, 24);
    }
  }
}

function drawObjectiveBeacon(ctx, cam) {
  const ms = G.mission;
  const target = ms.active ? ms.target : null;
  if (!target) return;
  const x = target.x - cam.x, y = target.y - cam.y;
  if (x < -100 || x > 1380 || y < -100 || y > 900) {
    // Off-screen: edge arrow pointing toward the objective.
    const cx = 640, cy = 400;
    const a = Math.atan2(target.y - G.player.y, target.x - G.player.x);
    const ex = clamp(cx + Math.cos(a) * 560, 40, 1240);
    const ey = clamp(cy + Math.sin(a) * 330, 40, 760);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a);
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }
  const pulse = 0.5 + Math.sin(G.frame * 0.1) * 0.3;
  ctx.fillStyle = `rgba(255,211,77,${0.14 * pulse + 0.08})`;
  ctx.fillRect(x - 14, y - 300, 28, 300);
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.moveTo(x, y - 18 - Math.sin(G.frame * 0.1) * 6);
  ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 18); ctx.lineTo(x - 12, y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 26, 12, 0, 0, Math.PI * 2); ctx.stroke();
}

/** Shop, safehouse, business and garage markers on the ground. */
function drawLocationMarkers(ctx, cam) {
  const marks = [
    { x: 2000, y: 1000, label: 'IRONWORKS', color: '#e5484d' },
    { x: 2600, y: 3200, label: 'DEALER', color: '#2ea8d8' },
    { x: 1300, y: 1500, label: 'TAKSI', color: '#f5a623' },
  ];
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  for (const m of marks) {
    const x = m.x - cam.x, y = m.y - cam.y;
    if (x < -40 || x > 1320 || y < -40 || y > 840) continue;
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('◆', x, y + 4);
    ctx.fillStyle = m.color;
    ctx.fillText(m.label, x, y - 18);
  }
  for (const s of G.properties.safehouses) {
    const x = s.x - cam.x, y = s.y - cam.y;
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('⌂ ' + s.name, x, y - 10);
  }
  ctx.textAlign = 'left';
}

/** The player on foot: shadow, body, head, aim line. */
export function drawPlayer(ctx, cam, night) {
  const p = G.player;
  if (p.car || p.boat || p.plane) return; // vehicle draw functions show the player
  const x = p.x - cam.x, y = p.y - cam.y;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + 4, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath(); ctx.arc(4, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(8, -2, 8, 4); // gun barrel when armed
  ctx.restore();
  // Aim line (short, subtle).
  if (G.mouse.down) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(p.angle) * 60, y + Math.sin(p.angle) * 60);
    ctx.stroke();
  }
  void night;
}

/** Foot cops chasing the player. */
function drawCops(ctx, cam) {
  for (const cop of G.cops) {
    const x = cop.x - cam.x, y = cop.y - cam.y;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x + 2, y + 4, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(cop.angle);
    ctx.fillStyle = '#1c2b3a';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('POLISI', x - 16, y - 14);
  }
}

/** Police helicopter with a sweeping searchlight cone. */
function drawHeli(ctx, cam) {
  const h = G.heli;
  if (!h) return;
  const x = h.x - cam.x, y = h.y - cam.y - h.alt * 0.35;
  // Searchlight cone down to the player.
  const px = G.player.x - cam.x, py = G.player.y - cam.y;
  const grad = ctx.createLinearGradient(x, y, px, py);
  grad.addColorStop(0, 'rgba(255,240,170,0.35)');
  grad.addColorStop(1, 'rgba(255,240,170,0.06)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 6);
  ctx.lineTo(px - 46, py);
  ctx.lineTo(px + 46, py);
  ctx.lineTo(x + 8, y + 6);
  ctx.closePath();
  ctx.fill();
  // Body + rotor.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x + 4, y + 30, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#243447';
  ctx.beginPath(); ctx.ellipse(x, y, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fb2e5';
  ctx.beginPath(); ctx.ellipse(x + 10, y, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  const rot = G.frame * 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 34 * Math.cos(rot), y - 6 - 34 * Math.sin(rot) * 0.2);
  ctx.lineTo(x + 34 * Math.cos(rot), y - 6 + 34 * Math.sin(rot) * 0.2);
  ctx.stroke();
  ctx.fillStyle = (G.frame % 16) < 8 ? '#ff2e2e' : '#2e7bff';
  ctx.beginPath(); ctx.arc(x - 20, y + 4, 3, 0, Math.PI * 2); ctx.fill();
}
