// SUNSET KEYS v4 — combat: shooting, melee, bullets, cover and enemy damage.
// The player aims with the mouse; bullets fly until they hit a building, a car,
// a ped, a cop or the ground. Enemy bullets use the same path, so walls are cover.
import { G, clamp, rand, raiseWanted, addXp, toast } from './state.js';
import { hitsBuilding } from './city.js';
import { WEAPONS, weaponDamage } from './weapons.js';
import { damageCar } from './vehicles.js';
import { missionKill } from './missions.js';
import { sideJobKill } from './sidejobs.js';

/** Aim angle from the player to the mouse (world space). */
export function aimAngle() {
  return Math.atan2(G.mouse.wy - G.player.y, G.mouse.wx - G.player.x);
}

/** Fire the equipped weapon (if ammo and cooldown allow). */
export function fireWeapon() {
  const p = G.player;
  if (p.onFoot === false && !p.car) return;
  const key = p.weapon;
  const w = WEAPONS[key];
  if (!w || p.fireCooldown > 0) return;
  if ((G.ammo[key] || 0) <= 0) {
    toast('Habis amunisi — beli di Ironworks (toko senjata)');
    p.fireCooldown = 0.4;
    return;
  }
  if (!G.weaponsOwned[key]) return;
  p.fireCooldown = w.rate;
  G.ammo[key]--;
  G.stats.shotsFired++;
  const base = p.onFoot ? aimAngle() : p.angle;
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    G.bullets.push({
      x: p.x + Math.cos(base) * 22, y: p.y + Math.sin(base) * 22,
      angle: base + rand(-w.spread, w.spread), speed: w.speed,
      dmg: weaponDamage(key), from: 'player', t: w.range,
    });
  }
  // Muzzle flash + noise (noise raises wanted when cops are near).
  G.particles.push({ kind: 'muzzle', x: p.x + Math.cos(base) * 26, y: p.y + Math.sin(base) * 26, vx: 0, vy: 0, t: 0.08, max: 0.08, color: '#ffd34d', size: 12 });
  addXp(1, 'shooting');
  if (Math.random() < 0.35 && G.wanted < 2) raiseWanted(1);
}

/** Melee swing: short range, knocks peds down, no noise. */
export function meleeAttack() {
  const p = G.player;
  if (p.meleeCooldown > 0 || !p.onFoot) return;
  p.meleeCooldown = 0.45;
  const a = aimAngle();
  const hx = p.x + Math.cos(a) * 34, hy = p.y + Math.sin(a) * 34;
  for (const ped of G.peds) {
    if (ped.dead) continue;
    if ((ped.x - hx) ** 2 + (ped.y - hy) ** 2 < 30 * 30) {
      damagePed(ped, 35, 'player');
      ped.x += Math.cos(a) * 26; ped.y += Math.sin(a) * 26;
    }
  }
  for (const cop of G.cops) {
    if ((cop.x - hx) ** 2 + (cop.y - hy) ** 2 < 30 * 30) {
      cop.hp -= 35;
      cop.x += Math.cos(a) * 26; cop.y += Math.sin(a) * 26;
    }
  }
}

/** Damage a ped; death counts a kill, may drop cash, and can raise wanted. */
export function damagePed(ped, dmg, from) {
  ped.hp -= dmg;
  if (ped.hp <= 0 && !ped.dead) {
    ped.dead = true;
    ped.t = 6;
    if (from === 'player') {
      G.stats.kills++;
      addXp(8, 'shooting');
      missionKill();
      sideJobKill();
      if (Math.random() < 0.4) {
        const drop = Math.floor(rand(15, 60));
        G.cash += drop;
        toast('+$' + drop + ' dari korban');
      }
      if (ped.gang) raiseWanted(1);
      else if (Math.random() < 0.5) raiseWanted(1);
    }
    G.particles.push({ kind: 'blood', x: ped.x, y: ped.y, vx: 0, vy: 0, t: 0.6, max: 0.6, color: '#a02020', size: 14 });
  }
}

/** Move bullets, test hits against buildings, cars, peds, cops and the player. */
export function updateBullets(dt) {
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];
    b.t -= dt;
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    let dead = b.t <= 0;
    // Building = cover: bullet stops with a spark.
    if (!dead && hitsBuilding(b.x, b.y, 0)) {
      dead = true;
      G.particles.push({ kind: 'spark', x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), t: 0.25, max: 0.25, color: '#ffd34d', size: 3 });
    }
    if (!dead && b.from === 'player') {
      // Hit a car?
      for (const car of G.cars) {
        if (Math.abs(b.x - car.x) < car.len / 2 + 4 && Math.abs(b.y - car.y) < car.wid / 2 + 4) {
          damageCar(car, b.dmg);
          dead = true;
          if (car.owner === 'cop') raiseWanted(1);
          break;
        }
      }
      // Hit a ped?
      if (!dead) for (const ped of G.peds) {
        if (!ped.dead && (ped.x - b.x) ** 2 + (ped.y - b.y) ** 2 < 14 * 14) {
          damagePed(ped, b.dmg, 'player');
          dead = true;
          break;
        }
      }
      // Hit a cop?
      if (!dead) for (const cop of G.cops) {
        if ((cop.x - b.x) ** 2 + (cop.y - b.y) ** 2 < 14 * 14) {
          cop.hp -= b.dmg;
          dead = true;
          if (cop.hp <= 0) { addXp(15, 'shooting'); G.stats.kills++; }
          break;
        }
      }
    } else if (!dead && b.from !== 'player') {
      // Enemy bullet vs the player.
      const p = G.player;
      if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < 13 * 13) {
        hurtPlayer(b.dmg);
        dead = true;
      }
    }
    if (dead) G.bullets.splice(i, 1);
  }
}

/** Damage the player: armour absorbs first, then health; death opens the fail screen. */
export function hurtPlayer(dmg) {
  const p = G.player;
  if (p.invuln > 0) return;
  let left = dmg;
  if (G.armor > 0) {
    const absorbed = Math.min(G.armor, left);
    G.armor -= absorbed;
    left -= absorbed;
  }
  G.health -= left;
  p.invuln = 0.25;
  G.camera.shake = 6;
  if (G.health <= 0) {
    G.health = 0;
    G.mode = 'dead';
    G.deathReason = 'WASTED — kamu tumbang di jalanan Port Alba';
  }
}

/** Draw bullets as bright tracer streaks. */
export function drawBullets(ctx, cam) {
  ctx.strokeStyle = '#ffe08a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const b of G.bullets) {
    const x = b.x - cam.x, y = b.y - cam.y;
    ctx.moveTo(x - Math.cos(b.angle) * 10, y - Math.sin(b.angle) * 10);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}
