// police.js — wanted response: patrol cars, foot cops and the searchlight helicopter.
import { G, clamp, setWanted, addXp } from './state.js';
import { spawnCar } from './vehicles.js';
import { spawnParticles } from './effects.js';

export function updatePolice(dt) {
  const p = G.player;
  if (G.wanted <= 0) {
    if (G.police.length > 0) G.police = G.police.filter((c) => { c.hp = 0; return false; });
    G.heli = null;
    return;
  }
  G.wantedTimer += dt;
  // Spawn patrol cars up to wanted level + 1.
  const want = Math.min(G.wanted + 1, 6);
  if (G.police.length < want && Math.random() < dt * 0.8) {
    const a = Math.random() * Math.PI * 2;
    const car = spawnCar(p.x + Math.cos(a) * 500, p.y + Math.sin(a) * 500, 'cop');
    car.driver = 'police';
    G.police.push(car);
  }
  for (const car of G.police) {
    const a = Math.atan2(p.y - car.y, p.x - car.x);
    const diff = ((a - car.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    car.angle += clamp(diff, -2.2 * dt, 2.2 * dt);
    car.speed = clamp(car.speed + 320 * dt, 0, 380 + G.wanted * 30);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < 34) {
      if (p.inVehicle) { p.inVehicle.hp -= 30 * dt; if (p.inVehicle.hp <= 0) { spawnParticles(car.x, car.y, '#ff8800', 20, 260, 0.8, 6); p.inVehicle.hp = 100; } }
      else { p.hp -= 14 * dt; }
    }
    if (d > 900) { car.hp = 0; }
  }
  G.police = G.police.filter((c) => c.hp > 0 && G.cars.includes(c));
  G.cars = G.cars.filter((c) => !(c.driver === 'police' && c.hp <= 0));
  // Helicopter at wanted 4-5 with a searchlight cone.
  if (G.wanted >= 4) {
    if (!G.heli) G.heli = { x: p.x + 200, y: p.y - 260, angle: 0, t: 0 };
    const h = G.heli; h.t += dt;
    const ta = Math.atan2(p.y - h.y, p.x - h.x);
    h.x += Math.cos(ta) * 130 * dt; h.y += Math.sin(ta) * 130 * dt;
    h.angle = ta;
    if (Math.hypot(h.x - p.x, h.y - p.y) < 120 && Math.random() < dt * 0.5) { p.hp -= 5; spawnParticles(p.x, p.y, '#ffdd55', 3, 120, 0.3, 3); }
  } else G.heli = null;
  // Wanted decays when hidden and calm.
  if (G.wantedTimer > 25 && G.police.length === 0) setWanted(G.wanted - 1);
}
export function drawHeli(ctx, cam) {
  const h = G.heli; if (!h) return;
  const x = h.x - cam.x, y = h.y - cam.y;
  // Searchlight cone toward the player.
  const p = G.player;
  const px = p.x - cam.x, py = p.y - cam.y;
  const grad = ctx.createLinearGradient(x, y, px, py);
  grad.addColorStop(0, 'rgba(255,255,180,0.35)');
  grad.addColorStop(1, 'rgba(255,255,180,0.05)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(x, y);
  const a = Math.atan2(py - y, px - x);
  ctx.lineTo(px + Math.cos(a + 0.35) * 60, py + Math.sin(a + 0.35) * 60);
  ctx.lineTo(px + Math.cos(a - 0.35) * 60, py + Math.sin(a - 0.35) * 60);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,200,0.25)'; ctx.beginPath(); ctx.ellipse(px, py, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(h.angle);
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(-26, -9, 52, 18);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(-26, -9, 10, 18);
  ctx.fillStyle = '#888'; ctx.fillRect(-6, -30, 4, 60);
  ctx.restore();
  ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.arc(x + 14, y, 3, 0, Math.PI * 2); ctx.fill();
}
export function bustPlayer() {
  G.player.hp = 100; G.player.armor = 0;
  setWanted(0); G.police = []; G.heli = null;
  G.cash = Math.max(0, G.cash - 200);
  G.player.x = 1700; G.player.y = 900;
  G.mode = 'play';
}
