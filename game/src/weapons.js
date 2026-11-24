// weapons.js — Ironworks gun shop: catalogue, buying, ammo and armor.
import { G, WEAPONS, addMessage } from './state.js';

export function shopList() {
  return Object.entries(WEAPONS).filter(([id]) => id !== 'fists').map(([id, w]) => ({ id, ...w, owned: G.player.ownedWeapons.includes(id) }));
}
export function buyWeapon(id) {
  const w = WEAPONS[id];
  if (!w || G.player.ownedWeapons.includes(id)) return false;
  if (G.cash < w.price) { addMessage('Not enough cash for ' + w.name, '#ff6666'); return false; }
  G.cash -= w.price;
  G.player.ownedWeapons.push(id);
  G.player.ammo[id] = (G.player.ammo[id] || 0) + 24;
  addMessage('Bought ' + w.name + ' at Ironworks', '#7fff9e');
  return true;
}
export function buyAmmo(id, n = 24) {
  const w = WEAPONS[id];
  if (!w || !G.player.ownedWeapons.includes(id)) return false;
  const cost = Math.round(w.ammoPrice * n / 24);
  if (G.cash < cost) { addMessage('Not enough cash for ammo', '#ff6666'); return false; }
  G.cash -= cost;
  G.player.ammo[id] = (G.player.ammo[id] || 0) + n;
  return true;
}
export function buyArmor() {
  if (G.cash < 250) { addMessage('Armor costs $250', '#ff6666'); return false; }
  if (G.player.armor >= 100) return false;
  G.cash -= 250; G.player.armor = 100;
  addMessage('Armor fitted — 100', '#7fff9e');
  return true;
}
export function cycleWeapon(dir = 1) {
  const owned = G.player.ownedWeapons;
  const i = owned.indexOf(G.player.weapon);
  G.player.weapon = owned[(i + dir + owned.length) % owned.length];
}
export function currentWeapon() { return WEAPONS[G.player.weapon] || WEAPONS.fists; }
