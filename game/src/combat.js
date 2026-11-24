// combat.js — shooting, melee, enemy gang AI that flanks and takes cover.
import { G, WEAPONS, addXp, addMessage, setWanted, clamp } from './state.js';
import { currentWeapon } from './weapons.js';
import { spawnBlood, spawnMuzzle, spawnParticles } from './effects.js';

export function spawnEnemy(x, y, gang, hp = 60) {
  const e = { x, y, angle: 0, hp, maxHp: hp, gang, speed: 95 + Math.random() * 30, shootCd: 1 + Math.random(), flankDir: Math.random() < 0.5 ? 1 : -1, state: 'chase', coverX: null, coverY: null };
  G.enemies.push(e);
  return e;
}
export function playerShoot(tx, ty) {
  const p = G.player;
  const now = performance.now() / 1000;
  const w = currentWeapon();
  if (now - p.lastShot < w.rate) return;
  if (w !== WEAPONS.fists && (p.ammo[p.weapon] || 0) <= 0) { addMessage('No ammo — visit Ironworks', '#ff6666'); p.lastShot = now; return; }
  p.lastShot = now;
  if (w !== WEAPONS.fists) p.ammo[p.weapon]--;
  const a = Math.atan2(ty - p.y, tx - p.x);
  p.angle = a;
  spawnMuzzle(p.x, p.y, a);
  const spread = w === WEAPONS.shotgun ? 0.22 : 0.03;
  const pellets = w === WEAPONS.shotgun ? 5 : 1;
  for (let i = 0; i < pellets; i++) {
    const aa = a + (Math.random() - 0.5) * spread;
    G.bullets.push({ x: p.x + Math.cos(aa) * 24, y: p.y + Math.sin(aa) * 24, vx: Math.cos(aa) * 900, vy: Math.sin(aa) * 900, dmg: w.damage, from: 'player', life: w.range / 900 });
  }
  addXp(2, 'shooting');
  if (G.wanted < 2 && Math.random() < 0.5) setWanted(2);
}
export function playerMelee() {
  const p = G.player;
  const now = performance.now() / 1000;
  if (now - p.meleeCd < 0.45) return;
  p.meleeCd = now;
  for (const e of G.enemies) {
    if (Math.hypot(e.x - p.x, e.y - p.y) < 52) { e.hp -= 25; spawnBlood(e.x, e.y); addXp(4, 'shooting'); }
  }
  for (const ped of G.peds) if (Math.hypot(ped.x - p.x, ped.y - p.y) < 46) ped.panic = 4;
}
export function updateBullets(dt) {
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let hitB = false;
    for (const bd of G.buildings) if (b.x > bd.x && b.x < bd.x + bd.w && b.y > bd.y && b.y < bd.y + bd.h) { hitB = true; break; }
    if (hitB) { b.life = 0; spawnParticles(b.x, b.y, '#aaa', 3, 80, 0.2, 2); continue; }
    if (b.from === 'player') {
      for (const e of G.enemies) {
        if (Math.hypot(e.x - b.x, e.y - b.y) < 16) {
          e.hp -= b.dmg; b.life = 0; spawnBlood(e.x, e.y); addXp(6, 'shooting');
          if (e.hp <= 0) { G.stats.kills++; addXp(40, 'shooting'); }
          break;
        }
      }
    } else {
      const p = G.player;
      if (Math.hypot(p.x - b.x, p.y - b.y) < 14) {
        b.life = 0;
        if (p.armor > 0) p.armor = Math.max(0, p.armor - b.dmg);
        else p.hp -= b.dmg;
        spawnBlood(p.x, p.y);
      }
    }
  }
  G.bullets = G.bullets.filter((b) => b.life > 0);
  G.enemies = G.enemies.filter((e) => e.hp > 0);
}
export function updateEnemies(dt) {
  const p = G.player;
  for (const e of G.enemies) {
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    e.angle = a;
    // Flank: strafe sideways while closing, take cover behind buildings when hurt.
    if (e.hp < e.maxHp * 0.35 && e.state !== 'cover') {
      e.state = 'cover';
      const b = G.buildings[Math.floor(Math.random() * G.buildings.length)];
      if (b) { e.coverX = b.x + b.w / 2; e.coverY = b.y + b.h / 2; }
    }
    if (e.state === 'cover' && e.coverX !== null) {
      const cd = Math.hypot(e.coverX - e.x, e.coverY - e.y);
      if (cd > 20) { e.x += Math.cos(Math.atan2(e.coverY - e.y, e.coverX - e.x)) * e.speed * dt; e.y += Math.sin(Math.atan2(e.coverY - e.y, e.coverX - e.x)) * e.speed * dt; }
      else if (e.hp > e.maxHp * 0.7) e.state = 'chase';
    } else if (d > 260) {
      e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt;
    } else if (d > 120) {
      // Strafe around the player while closing in.
      const sa = a + Math.PI / 2 * e.flankDir;
      e.x += (Math.cos(a) * 0.5 + Math.cos(sa) * 0.8) * e.speed * dt;
      e.y += (Math.sin(a) * 0.5 + Math.sin(sa) * 0.8) * e.speed * dt;
    }
    e.shootCd -= dt;
    if (d < 420 && e.shootCd <= 0) {
      e.shootCd = 0.9 + Math.random() * 0.8;
      const aa = a + (Math.random() - 0.5) * 0.14;
      G.bullets.push({ x: e.x + Math.cos(aa) * 22, y: e.y + Math.sin(aa) * 22, vx: Math.cos(aa) * 700, vy: Math.sin(aa) * 700, dmg: 9, from: 'enemy', life: 0.7 });
      spawnMuzzle(e.x, e.y, aa);
    }
  }
}
export function drawEnemy(ctx, cam, e) {
  const x = e.x - cam.x, y = e.y - cam.y;
  const colors = { Vipers: '#27ae60', Kings: '#8e44ad', 'Marina Boys': '#2980b9' };
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x, y - 6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors[e.gang] || '#e74c3c'; ctx.fillRect(x - 5, y - 5, 10, 12);
  ctx.fillStyle = '#2c3e50'; ctx.fillRect(x - 4, y + 7, 3, 8); ctx.fillRect(x + 1, y + 7, 3, 8);
  ctx.save(); ctx.translate(x, y); ctx.rotate(e.angle); ctx.fillStyle = '#333'; ctx.fillRect(4, -2, 16, 4); ctx.restore();
  ctx.fillStyle = '#333'; ctx.fillRect(x - 12, y - 18, 24, 4);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(x - 12, y - 18, 24 * clamp(e.hp / e.maxHp, 0, 1), 4);
}
export function drawBullets(ctx, cam) {
  ctx.fillStyle = '#ffe066';
  for (const b of G.bullets) ctx.fillRect(b.x - cam.x - 2, b.y - cam.y - 1, 5, 2);
}
