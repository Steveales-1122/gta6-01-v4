// SUNSET KEYS v4 — boats: speedboat, yacht and fishing boat at the Marina Bay docks.
// Board with E while on foot near a docked boat; boats drive on water only, with
// wake, spray and a speed that beats any car across the bay.
import { G, clamp, rand, pick, angleDiff } from './state.js';
import { inWater } from './city.js';

const BOAT_TYPES = [
  { type: 'speedboat', name: 'Speedboat', color: '#e8e8e8', len: 44, maxSpeed: 420, accel: 260, price: 0 },
  { type: 'yacht', name: 'Yacht Alba', color: '#f5f0dc', len: 76, maxSpeed: 240, accel: 140, price: 0 },
  { type: 'fisher', name: 'Fishing Boat', color: '#7a9a6b', len: 52, maxSpeed: 260, accel: 160, price: 0 },
];

/** Spawn the docked boats in the marina basin at game start. */
export function spawnBoats() {
  G.boats = [];
  const docks = G.city.docks;
  for (let i = 0; i < docks.length; i++) {
    const t = BOAT_TYPES[i % BOAT_TYPES.length];
    G.boats.push({
      ...t, x: docks[i].x + 90, y: docks[i].y + 60 + i * 30, angle: 0,
      speed: 0, vx: 0, vy: 0, occupied: false, id: 'boat' + i,
    });
  }
  // One yacht anchored out in the bay.
  G.boats.push({ ...BOAT_TYPES[1], x: 120, y: 900, angle: 0.6, speed: 0, vx: 0, vy: 0, occupied: false, id: 'boat-yacht' });
}

/** Nearest boat within range of a point (for boarding prompts). */
export function nearestBoat(x, y, range) {
  let best = null, bestD = range * range;
  for (const b of G.boats) {
    const d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

/** Drive the player's boat; boats slide, turn slowly and stay in water. */
export function updateBoats(dt, input) {
  for (const b of G.boats) {
    if (!b.occupied) continue;
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    b.angle += steer * 1.5 * dt * clamp(Math.abs(b.speed) / 120, 0.25, 1);
    if (input.up) b.speed += b.accel * dt;
    if (input.down) b.speed -= b.accel * 0.7 * dt;
    b.speed = clamp(b.speed, -90, b.maxSpeed);
    b.speed *= (1 - 0.35 * dt);
    const nx = b.x + Math.cos(b.angle) * b.speed * dt;
    const ny = b.y + Math.sin(b.angle) * b.speed * dt;
    // Boats cannot leave the water: slide along the shore instead.
    if (inWater(nx, b.y)) b.x = nx;
    if (inWater(b.x, ny)) b.y = ny;
    b.vx = Math.cos(b.angle) * b.speed;
    b.vy = Math.sin(b.angle) * b.speed;
    G.player.x = b.x; G.player.y = b.y; G.player.angle = b.angle;
    G.stats.distanceDriven += Math.abs(b.speed) * dt;
    if (Math.abs(b.speed) > 200 && Math.random() < dt * 8) {
      G.particles.push({ kind: 'spray', x: b.x - Math.cos(b.angle) * 30, y: b.y - Math.sin(b.angle) * 30, vx: rand(-30, 30), vy: rand(-30, 30), t: 0.5, max: 0.5, color: '#cfe8f5', size: 4 });
    }
  }
}

/** Draw all boats (hull, deck, wake) in world space. */
export function drawBoats(ctx, cam) {
  for (const b of G.boats) {
    const x = b.x - cam.x, y = b.y - cam.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-b.len / 2 + 4, -12 + 4, b.len, 24);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(b.len / 2, 0);
    ctx.lineTo(b.len / 2 - 10, -13);
    ctx.lineTo(-b.len / 2 + 8, -11);
    ctx.lineTo(-b.len / 2, 0);
    ctx.lineTo(-b.len / 2 + 8, 11);
    ctx.lineTo(b.len / 2 - 10, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b3a4a';
    ctx.fillRect(-b.len / 4, -7, b.len / 3, 14);
    if (b.type === 'yacht') { ctx.fillStyle = '#ffffff'; ctx.fillRect(-b.len / 4 - 6, -9, 18, 18); }
    ctx.restore();
  }
}
