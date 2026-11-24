// vehicles.js — drivable cars: spawn, drive physics, enter/exit, tuning effects.
import { G, CAR_MODELS, clamp, mulberry32, pick, addXp } from './state.js';
import { collideBuildings, onRoad } from './city.js';

export function spawnCar(x, y, modelId, owned = false, color = null) {
  const m = CAR_MODELS.find((c) => c.id === modelId) || CAR_MODELS[0];
  const car = { x, y, angle: Math.random() * Math.PI * 2, speed: 0, model: m.id, name: m.name, top: m.top, accel: m.accel, color: color || m.color, owned, tune: 0, driver: null, hp: 100, smoke: 0 };
  G.cars.push(car);
  return car;
}
export function seedCars() {
  const rng = mulberry32(777);
  const spots = [[1800, 1100], [1500, 800], [2100, 1400], [900, 500], [2600, 500], [700, 1800], [2700, 1700], [1200, 1700], [2300, 800], [1000, 1200], [2900, 1100], [600, 900]];
  for (const [x, y] of spots) spawnCar(x + rng() * 40, y + rng() * 40, pick(rng, ['sedan', 'sedan', 'taxi', 'sport', 'truck', 'muscle']));
}
export function nearestCar(x, y, maxD = 70) {
  let best = null, bd = maxD;
  for (const c of G.cars) { const d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = c; } }
  return best;
}
export function enterCar(car) {
  const p = G.player;
  p.inVehicle = car; car.driver = 'player';
  p.x = car.x; p.y = car.y;
  G.stats.carsStolen += car.owned ? 0 : 1;
  if (!car.owned) { /* stealing a parked car draws a little heat */ }
}
export function exitCar() {
  const p = G.player, car = p.inVehicle;
  if (!car) return;
  car.driver = null; car.speed = 0;
  p.inVehicle = null;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 40;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 40;
}
export function tuneBonus(car) { return 1 + (car.tune || 0) * 0.12; }
export function updateDriving(dt, input) {
  const p = G.player, car = p.inVehicle;
  if (!car) return;
  const steer = (input.x) * 2.4 * (car.speed >= 0 ? 1 : -1);
  car.angle += steer * dt * clamp(Math.abs(car.speed) / 120, 0.2, 1);
  if (input.y < 0) car.speed += car.accel * tuneBonus(car) * dt;
  else if (input.y > 0) car.speed -= car.accel * 0.8 * dt;
  else car.speed *= Math.pow(0.4, dt);
  const top = car.top * tuneBonus(car);
  car.speed = clamp(car.speed, -top * 0.45, top);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = collideBuildings(nx, ny, 22);
  if (hit) { car.x = hit.x; car.y = hit.y; if (Math.abs(car.speed) > 200) { car.hp -= 8; car.speed *= -0.3; } else car.speed *= 0.4; }
  else { car.x = nx; car.y = ny; }
  car.x = clamp(car.x, 60, 3540); car.y = clamp(car.y, 60, 2340);
  p.x = car.x; p.y = car.y; p.angle = car.angle;
  if (Math.abs(car.speed) > 60) addXp(dt * 6, 'driving');
  if (car.speed > 380 && onRoad(car.x, car.y)) addXp(dt * 4, 'driving');
  if (car.hp < 40) car.smoke += dt;
}
export function drawCar(ctx, cam, car) {
  const x = car.x - cam.x, y = car.y - cam.y;
  ctx.save(); ctx.translate(x, y); ctx.rotate(car.angle);
  ctx.fillStyle = '#111'; ctx.fillRect(-24, -13, 48, 26);
  ctx.fillStyle = car.color; ctx.fillRect(-22, -11, 44, 22);
  ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-6, -9, 12, 18);
  ctx.fillStyle = '#222'; ctx.fillRect(14, -10, 6, 4); ctx.fillRect(14, 6, 6, 4);
  ctx.fillStyle = '#ffdd55'; ctx.fillRect(-24, -10, 3, 4); ctx.fillRect(-24, 6, 3, 4);
  if (car.model === 'cop') { ctx.fillStyle = '#fff'; ctx.fillRect(-2, -11, 8, 22); ctx.fillStyle = '#e74c3c'; ctx.fillRect(-2, -11, 8, 5); ctx.fillStyle = '#2980b9'; ctx.fillRect(-2, 6, 8, 5); }
  if (car.hp < 40) { ctx.fillStyle = 'rgba(80,80,80,0.7)'; ctx.fillRect(-10, -14, 8, 6); }
  ctx.restore();
}
