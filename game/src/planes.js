// SUNSET KEYS v4 — planes: Alba International's runway, taxi, takeoff and flight.
// Board a parked plane with E at the airport, throttle up on the runway, pull up
// to fly over the whole city, and land back on either runway.
import { G, clamp, rand, toast, addXp } from './state.js';

const PLANE_TYPES = [
  { type: 'prop', name: 'Alba Prop', color: '#dfe6ea', len: 58, maxSpeed: 520, price: 0 },
  { type: 'jet', name: 'Sky Jet', color: '#b8c4d0', len: 74, maxSpeed: 720, price: 0 },
  { type: 'cargo', name: 'Cargo Hauler', color: '#c8b89a', len: 88, maxSpeed: 460, price: 0 },
];

/** Park the planes beside the runways at game start. */
export function spawnPlanes() {
  G.planes = [];
  const a = G.city.airport;
  G.planes.push({ ...PLANE_TYPES[0], x: a.runway.x - 130, y: 420, angle: Math.PI / 2, speed: 0, alt: 0, occupied: false, id: 'plane1' });
  G.planes.push({ ...PLANE_TYPES[1], x: a.runway2.x + 130, y: 700, angle: Math.PI / 2, speed: 0, alt: 0, occupied: false, id: 'plane2' });
  G.planes.push({ ...PLANE_TYPES[2], x: a.runway.x - 130, y: 1000, angle: Math.PI / 2, speed: 0, alt: 0, occupied: false, id: 'plane3' });
}

/** Nearest plane within range (for boarding). */
export function nearestPlane(x, y, range) {
  let best = null, bestD = range * range;
  for (const p of G.planes) {
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

/** Fly the player's plane: runway roll, lift-off, altitude, banking turns. */
export function updatePlanes(dt, input) {
  for (const p of G.planes) {
    if (!p.occupied) continue;
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    p.angle += steer * 1.1 * dt * clamp(Math.abs(p.speed) / 200, 0.2, 1);
    if (input.up) p.speed += 300 * dt;
    if (input.down) p.speed -= 220 * dt;
    p.speed = clamp(p.speed, 0, p.maxSpeed);
    // Lift off past rotation speed; climb while throttling, sink when slow.
    if (p.speed > 300) p.alt = clamp(p.alt + (input.up ? 90 : 40) * dt, 0, 420);
    else p.alt = clamp(p.alt - 60 * dt, 0, 420);
    const nx = p.x + Math.cos(p.angle) * p.speed * dt;
    const ny = p.y + Math.sin(p.angle) * p.speed * dt;
    p.x = clamp(nx, 60, 5140);
    p.y = clamp(ny, 60, 3740);
    G.player.x = p.x; G.player.y = p.y; G.player.angle = p.angle;
    if (p.alt > 50) addXp(4 * dt, 'driving');
    if (p.alt > 300 && Math.random() < dt * 2) {
      G.particles.push({ kind: 'cloud', x: p.x + rand(-60, 60), y: p.y + rand(-60, 60), vx: 0, vy: 0, t: 1.4, max: 1.4, color: '#ffffff', size: 14 });
    }
    // Touchdown: if slow and low over a runway, stay grounded.
    if (p.alt <= 0 && p.speed < 120) p.speed *= (1 - 1.5 * dt);
  }
}

/** Board a plane (needs level 2 — flying is a progression unlock). */
export function boardPlane(plane) {
  if (G.level < 2) { toast('Terbang butuh Level 2 — selesaikan misi dulu'); return false; }
  const p = G.player;
  p.plane = plane; p.onFoot = false; p.car = null; p.boat = null;
  plane.occupied = true;
  toast('Naik pesawat — ' + plane.name + ' (W gas, A/D belok)');
  return true;
}

/** Draw planes; altitude shrinks the shadow and scales the sprite up. */
export function drawPlanes(ctx, cam) {
  for (const p of G.planes) {
    const scale = 1 + p.alt / 500;
    const x = p.x - cam.x, y = p.y - cam.y;
    // Shadow stays on the ground, shrinking as the plane climbs.
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, 0.3 - p.alt / 1200)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 30 * (1 - p.alt / 900), 10 * (1 - p.alt / 900), p.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y - p.alt * 0.35);
    ctx.rotate(p.angle);
    ctx.scale(scale, scale);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.len / 2, 0);
    ctx.lineTo(p.len / 4, -8);
    ctx.lineTo(-p.len / 2, -7);
    ctx.lineTo(-p.len / 2, 7);
    ctx.lineTo(p.len / 4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b3a4a';
    ctx.fillRect(-p.len / 6, -16, p.len / 3, 32); // wings
    ctx.fillStyle = '#7a2e2e';
    ctx.fillRect(-p.len / 2, -4, 6, 8); // tail
    ctx.restore();
  }
}
