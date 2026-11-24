// SUNSET KEYS v4 — police: wanted level 0-5, cop cars and foot cops that chase,
// roadblocks at 3+, a helicopter with a searchlight at 4-5, and wanted decay.
import { G, clamp, rand, pick, angleTo, angleDiff, dist2, raiseWanted, toast, banner } from './state.js';
import { makeCar, damageCar } from './vehicles.js';

const COP_COLORS = ['#1c2b3a', '#243447'];

/** Spawn cop units scaled to the wanted level; called when wanted rises. */
export function spawnCops() {
  const want = G.wanted;
  const wantCars = want >= 1 ? 1 : 0;
  const total = wantCars + (want >= 3 ? 1 : 0) + (want >= 5 ? 1 : 0);
  const copCars = G.cars.filter((c) => c.owner === 'cop').length;
  for (let i = copCars; i < total; i++) {
    const ang = rand(0, Math.PI * 2);
    const x = clamp(G.player.x + Math.cos(ang) * 700, 60, 5140);
    const y = clamp(G.player.y + Math.sin(ang) * 700, 60, 3740);
    const car = makeCar(x, y, angleTo(x, y, G.player.x, G.player.y), 0, 'cop');
    car.color = pick(COP_COLORS);
    car.maxSpeed = 480 + want * 12;
    car.len = 48; car.wid = 22;
    G.cars.push(car);
  }
  // Foot cops at wanted 2+.
  if (want >= 2 && G.cops.length < want) {
    const ang = rand(0, Math.PI * 2);
    G.cops.push({
      x: clamp(G.player.x + Math.cos(ang) * 420, 60, 5140),
      y: clamp(G.player.y + Math.sin(ang) * 420, 60, 3740),
      angle: 0, speed: 150, hp: 60, shootT: rand(0.5, 1.5), kind: 'cop',
    });
  }
  // Helicopter at wanted 4+.
  if (want >= 4 && !G.heli) {
    G.heli = { x: G.player.x + 300, y: G.player.y - 300, angle: 0, alt: 200, searchAngle: 0, shootT: 2 };
    banner('HELIKOPTER POLISI', 'Wanted level ' + want + ' — kabur dari sorotan!');
  }
}

/** Cop car + foot cop + helicopter AI, run every frame while wanted > 0. */
export function updatePolice(dt) {
  if (G.wanted > 0) {
    G.wantedTimer += dt;
    // Wanted decays after 25s without new crime (faster when hidden / out of sight).
    const decayAfter = G.wanted >= 4 ? 45 : 25;
    if (G.wantedTimer > decayAfter) {
      G.wanted--;
      G.wantedTimer = 0;
      toast('Wanted turun ke ' + G.wanted + ' bintang');
      if (G.wanted === 0) { clearPolice(); toast('Bebas — polisi kehilangan jejakmu'); }
    }
    spawnCops();
  }
  const p = G.player;
  for (const car of G.cars) {
    if (car.owner !== 'cop') continue;
    // Chase: steer toward the player, ram at close range.
    const want = angleTo(car.x, car.y, p.x, p.y);
    car.angle += clamp(angleDiff(car.angle, want), -2.4 * dt, 2.4 * dt);
    const d = Math.hypot(p.x - car.x, p.y - car.y);
    const targetSpeed = d > 260 ? car.maxSpeed : car.maxSpeed * 0.75;
    car.speed = clamp(car.speed + 300 * dt, 0, targetSpeed);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    car.x = nx; car.y = ny;
    car.vx = Math.cos(car.angle) * car.speed;
    car.vy = Math.sin(car.angle) * car.speed;
    // Ram the player's car.
    if (p.car && d < 55) {
      damageCar(p.car, 6 * dt * 10);
      p.car.speed *= 0.985;
      if (Math.random() < dt * 4) {
        G.particles.push({ kind: 'spark', x: p.x, y: p.y, vx: rand(-60, 60), vy: rand(-60, 60), t: 0.3, max: 0.3, color: '#ffd34d', size: 3 });
      }
    }
    // Siren lights blink.
    car.siren = (G.frame % 24) < 12;
  }
  // Foot cops: run at the player, shoot when close (inaccurate).
  for (let i = G.cops.length - 1; i >= 0; i--) {
    const cop = G.cops[i];
    if (cop.hp <= 0) { G.cops.splice(i, 1); continue; }
    const d = Math.hypot(p.x - cop.x, p.y - cop.y);
    const want = angleTo(cop.x, cop.y, p.x, p.y);
    cop.angle = want;
    // Caught on foot: busted.
    if (d < 36 && p.onFoot && G.wanted >= 2) { busted(); return; }
    if (d > 90) {
      cop.x += Math.cos(want) * cop.speed * dt;
      cop.y += Math.sin(want) * cop.speed * dt;
    } else {
      cop.shootT -= dt;
      if (cop.shootT <= 0) {
        cop.shootT = rand(0.9, 1.6);
        G.bullets.push({ x: cop.x, y: cop.y, angle: want + rand(-0.16, 0.16), speed: 560, dmg: 5, from: 'cop', t: 1.1 });
      }
    }
  }
  // Helicopter: hovers above the player, searchlight sweeps, spotlights the chase.
  if (G.heli) {
    const h = G.heli;
    h.searchAngle += dt * 0.8;
    const tx = p.x + Math.cos(h.searchAngle) * 120;
    const ty = p.y + Math.sin(h.searchAngle) * 120;
    h.x += (tx - h.x) * 0.5 * dt;
    h.y += (ty - h.y) * 0.5 * dt;
    h.shootT -= dt;
    if (h.shootT <= 0 && G.wanted >= 5) {
      h.shootT = 2.2;
      G.bullets.push({ x: h.x, y: h.y, angle: angleTo(h.x, h.y, p.x, p.y) + rand(-0.1, 0.1), speed: 620, dmg: 8, from: 'heli', t: 1.4 });
    }
    if (G.wanted < 4) G.heli = null;
  }
}

/** Remove all police units (wanted cleared, mission reset, or busted). */
export function clearPolice() {
  G.cars = G.cars.filter((c) => c.owner !== 'cop');
  G.cops = [];
  G.heli = null;
}

/** Player gets busted: lose some cash, wanted clears, respawn at the safehouse. */
export function busted() {
  const fine = Math.min(G.cash, 200 + G.wanted * 100);
  G.cash -= fine;
  G.wanted = 0;
  clearPolice();
  G.health = 100;
  G.mode = 'dead';
  G.deathReason = 'BUSTED — ditangkap polisi, denda ' + '$' + fine;
}
