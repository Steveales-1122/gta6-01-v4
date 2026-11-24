// SUNSET KEYS v4 — vehicles: car physics, stealing, damage, horns and the dealership.
// Cars have weight, grip and top speed by model; the player steals with E, wrecks
// smoke and slow down, and owned cars can be stored in the garage.
import { G, clamp, rand, pick, addXp, raiseWanted, toast } from './state.js';
import { hitsBuilding, onRoad } from './city.js';
import { gripFactor } from './weather.js';

export const CAR_MODELS = [
  { model: 'Comet', color: '#c0392b', len: 46, wid: 22, maxSpeed: 430, accel: 320, price: 1200, kind: 'sedan' },
  { model: 'Vortex', color: '#2980b9', len: 48, wid: 22, maxSpeed: 470, accel: 350, price: 2600, kind: 'sport' },
  { model: 'Bison', color: '#7f8c8d', len: 56, wid: 26, maxSpeed: 330, accel: 240, price: 900, kind: 'truck' },
  { model: 'Lumen', color: '#f1c40f', len: 42, wid: 20, maxSpeed: 400, accel: 300, price: 1800, kind: 'coupe' },
  { model: 'Hauler', color: '#5d6d7e', len: 64, wid: 28, maxSpeed: 290, accel: 200, price: 1500, kind: 'van' },
  { model: 'Falcon', color: '#8e44ad', len: 50, wid: 22, maxSpeed: 520, accel: 380, price: 5200, kind: 'super' },
  { model: 'Dune', color: '#d35400', len: 46, wid: 24, maxSpeed: 380, accel: 290, price: 1400, kind: 'offroad' },
  { model: 'Taxi', color: '#f39c12', len: 46, wid: 22, maxSpeed: 400, accel: 300, price: 0, kind: 'taxi' },
];

export function makeCar(x, y, angle, modelIdx, owner) {
  const m = CAR_MODELS[modelIdx % CAR_MODELS.length];
  return {
    ...m, x, y, angle, speed: 0, vx: 0, vy: 0, owner: owner || 'npc',
    hp: 100, smoke: 0, id: 'car' + Math.floor(Math.random() * 1e9),
    driver: owner === 'npc' ? 'npc' : null, color2: null, engine: 0,
  };
}

/** Spawn ambient traffic cars on roads near the camera. */
export function spawnTrafficCar(x, y, angle) {
  const car = makeCar(x, y, angle, Math.floor(Math.random() * CAR_MODELS.length), 'npc');
  car.speed = rand(120, 200);
  car.dir = angle;
  G.cars.push(car);
  return car;
}

/** Nearest car within range of a point (for stealing / entering). */
export function nearestCar(x, y, range) {
  let best = null, bestD = range * range;
  for (const c of G.cars) {
    const d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Steal a car: player hops in, wanted rises, onlookers may call the cops. */
export function stealCar(car) {
  const p = G.player;
  p.car = car; p.onFoot = false; p.boat = null; p.plane = null;
  car.owner = 'player'; car.driver = 'player';
  G.stats.carsStolen++;
  addXp(5, 'driving');
  if (car.kind !== 'taxi') raiseWanted(1);
  toast('Mobil dicuri — ' + car.model);
}

/** Player leaves the current car (or boat/plane) on foot. */
export function exitVehicle() {
  const p = G.player;
  if (p.car) { p.car.owner = 'npc'; p.car.speed *= 0.3; p.car = null; }
  if (p.boat) { p.boat.occupied = false; p.boat = null; }
  if (p.plane) { p.plane.occupied = false; p.plane = null; }
  p.onFoot = true;
  p.x += Math.cos(p.angle + Math.PI / 2) * 30;
  p.y += Math.sin(p.angle + Math.PI / 2) * 30;
}

/** Arcade-style car physics: accel, steering by speed, drift on handbrake, wet grip. */
export function driveCar(car, dt, input) {
  const grip = gripFactor();
  const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const spd = Math.abs(car.speed);
  const steerPower = 2.1 * clamp(spd / 140, 0.15, 1) * (car.speed >= 0 ? 1 : -1);
  car.angle += steer * steerPower * dt * (input.brake ? 1.5 : 1);
  const top = car.maxSpeed * (1 + (car.engine || 0) * 0.12);
  if (input.up) car.speed += car.accel * grip * dt;
  if (input.down) car.speed -= car.accel * 0.8 * grip * dt;
  if (input.brake) car.speed *= (1 - 2.2 * dt);
  car.speed = clamp(car.speed, -top * 0.45, top);
  car.speed *= (1 - 0.25 * dt); // rolling drag
  if (!input.up && !input.down) car.speed *= (1 - 0.5 * dt);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  // Collide with buildings: bounce off, take damage, spark.
  if (!hitsBuilding(nx, ny, 4)) { car.x = nx; car.y = ny; }
  else {
    car.speed *= -0.35;
    damageCar(car, 8);
    if (Math.random() < dt * 6) {
      G.particles.push({ kind: 'spark', x: nx, y: ny, vx: rand(-80, 80), vy: rand(-80, 80), t: 0.4, max: 0.4, color: '#ffd34d', size: 3 });
    }
  }
  car.vx = Math.cos(car.angle) * car.speed;
  car.vy = Math.sin(car.angle) * car.speed;
  if (car.owner === 'player') {
    G.player.x = car.x; G.player.y = car.y; G.player.angle = car.angle;
    G.stats.distanceDriven += Math.abs(car.speed) * dt;
    addXp(Math.abs(car.speed) * dt * 0.002, 'driving');
  }
  // Wrecked cars smoke and crawl.
  if (car.hp < 35) {
    car.smoke += dt;
    if (Math.random() < dt * 10) {
      G.particles.push({ kind: 'smoke', x: car.x + rand(-10, 10), y: car.y + rand(-10, 10), vx: rand(-10, 10), vy: rand(-40, -10), t: 1.2, max: 1.2, color: '#555555', size: 7 });
    }
    if (car.hp <= 0) car.speed *= (1 - 3 * dt);
  }
}

/** Damage a car; at 0 hp it catches fire and explodes after a beat. */
export function damageCar(car, dmg) {
  car.hp -= dmg;
  if (car.hp <= 0 && !car.burning) {
    car.burning = true;
    car.burnTimer = 1.2;
    G.particles.push({ kind: 'fire', x: car.x, y: car.y, vx: 0, vy: 0, t: 1.2, max: 1.2, color: '#ff7a1a', size: 26 });
  }
}

/** Update every car: player car, cop cars (police.js steers them), NPC traffic. */
export function updateVehicles(dt, input) {
  for (let i = G.cars.length - 1; i >= 0; i--) {
    const c = G.cars[i];
    if (c.burning) {
      c.burnTimer -= dt;
      if (c.burnTimer <= 0) {
        explodeCar(c);
        G.cars.splice(i, 1);
        continue;
      }
    }
    if (c.owner === 'player') { driveCar(c, dt, input); continue; }
    if (c.owner === 'cop') continue; // police.js drives cop cars
    // NPC traffic: cruise along its road direction, slow near the player.
    c.speed = clamp(c.speed, 100, 190);
    const nx = c.x + Math.cos(c.dir) * c.speed * dt;
    const ny = c.y + Math.sin(c.dir) * c.speed * dt;
    if (!hitsBuilding(nx, ny, 4) && onRoad(nx, ny)) { c.x = nx; c.y = ny; }
    else { c.dir += Math.PI / 2; c.x += Math.cos(c.dir) * 10; c.y += Math.sin(c.dir) * 10; }
    c.angle = c.dir;
    c.vx = Math.cos(c.dir) * c.speed; c.vy = Math.sin(c.dir) * c.speed;
  }
}

function explodeCar(car) {
  G.particles.push({ kind: 'boom', x: car.x, y: car.y, vx: 0, vy: 0, t: 0.8, max: 0.8, color: '#ff5a1a', size: 60 });
  for (let i = 0; i < 14; i++) {
    G.particles.push({ kind: 'debris', x: car.x, y: car.y, vx: rand(-260, 260), vy: rand(-260, 260), t: 0.9, max: 0.9, color: pick(['#333333', '#ff7a1a', '#ffd34d']), size: 5 });
  }
  if (Math.hypot(G.player.x - car.x, G.player.y - car.y) < 120) {
    G.health -= 35;
    raiseWanted(1);
  }
}

/** Draw a car top-down: shadow, body, cabin, headlights at night. */
export function drawCar(ctx, cam, car, night) {
  const x = car.x - cam.x, y = car.y - cam.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(-car.len / 2 + 4, -car.wid / 2 + 4, car.len, car.wid);
  ctx.fillStyle = car.color;
  roundRect(ctx, -car.len / 2, -car.wid / 2, car.len, car.wid, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,30,44,0.9)';
  roundRect(ctx, -car.len / 6, -car.wid / 2 + 3, car.len / 3, car.wid - 6, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(car.len / 2 - 8, -car.wid / 2 + 2, 4, 4);
  ctx.fillRect(car.len / 2 - 8, car.wid / 2 - 6, 4, 4);
  if (car.owner === 'cop') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-car.len / 2 + 4, -car.wid / 2 + 2, 10, 5);
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(-car.len / 2 + 4, car.wid / 2 - 7, 10, 5);
  }
  if (night && car.owner === 'player') {
    ctx.fillStyle = 'rgba(255,240,180,0.20)';
    ctx.beginPath();
    ctx.moveTo(car.len / 2, -8); ctx.lineTo(car.len / 2 + 90, -34); ctx.lineTo(car.len / 2 + 90, 34); ctx.lineTo(car.len / 2, 8);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (car.burning) {
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(x, y, 12 + Math.sin(G.frame * 0.3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
