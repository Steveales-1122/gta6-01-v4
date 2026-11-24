// SUNSET KEYS v4 — weapons: Ironworks gun shop catalogue, stats and ammo prices.
// Pistol is free; SMG, shotgun and rifle unlock at the shop, with armour and ammo.
import { G } from './state.js';

export const WEAPONS = {
  pistol: { name: 'Pistol P9', price: 0, dmg: 14, rate: 0.28, speed: 640, spread: 0.05, auto: false, mag: 12, range: 1.1, level: 1 },
  smg: { name: 'SMG Vex-9', price: 800, dmg: 9, rate: 0.09, speed: 700, spread: 0.10, auto: true, mag: 32, range: 1.0, level: 1 },
  shotgun: { name: 'Shotgun Riot-12', price: 1200, dmg: 11, rate: 0.75, speed: 560, spread: 0.22, auto: false, mag: 6, range: 0.8, pellets: 6, level: 2 },
  rifle: { name: 'Rifle AR-77', price: 2500, dmg: 26, rate: 0.16, speed: 900, spread: 0.03, auto: true, mag: 30, range: 1.5, level: 3 },
};

export const AMMO_PRICE = { pistol: 40, smg: 90, shotgun: 120, rifle: 150 };
export const ARMOR_PRICE = 300;
export const ARMOR_MAX = 100;

/** Can the player buy this weapon right now (cash + level)? */
export function canBuyWeapon(key) {
  const w = WEAPONS[key];
  if (!w) return { ok: false, why: 'Senjata tidak ada' };
  if (G.weaponsOwned[key]) return { ok: false, why: 'Sudah dimiliki' };
  if (G.level < w.level) return { ok: false, why: 'Butuh Level ' + w.level };
  if (G.cash < w.price) return { ok: false, why: 'Uang kurang' };
  return { ok: true };
}

/** Buy a weapon: deduct cash, grant it with a starter magazine. */
export function buyWeapon(key) {
  const check = canBuyWeapon(key);
  if (!check.ok) return check;
  G.cash -= WEAPONS[key].price;
  G.weaponsOwned[key] = true;
  G.ammo[key] = (G.ammo[key] || 0) + WEAPONS[key].mag * 2;
  return { ok: true };
}

/** Buy one box of ammo for a weapon the player owns. */
export function buyAmmo(key) {
  if (!G.weaponsOwned[key]) return { ok: false, why: 'Belum punya senjatanya' };
  if (G.cash < AMMO_PRICE[key]) return { ok: false, why: 'Uang kurang' };
  G.cash -= AMMO_PRICE[key];
  G.ammo[key] = (G.ammo[key] || 0) + WEAPONS[key].mag * 2;
  return { ok: true };
}

/** Buy body armour (fills the armour bar). */
export function buyArmor() {
  if (G.armor >= ARMOR_MAX) return { ok: false, why: 'Armor sudah penuh' };
  if (G.cash < ARMOR_PRICE) return { ok: false, why: 'Uang kurang' };
  G.cash -= ARMOR_PRICE;
  G.armor = ARMOR_MAX;
  return { ok: true };
}

/** Damage dealt by one bullet of this weapon, scaled by the Shooting skill. */
export function weaponDamage(key) {
  const w = WEAPONS[key];
  return w.dmg * (1 + G.skills.shooting * 0.004);
}
