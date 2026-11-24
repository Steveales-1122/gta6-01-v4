// save.js — three localStorage save slots: full progress snapshot and load.
import { G } from './state.js';

const KEY = (slot) => 'sunset-keys-v4-slot-' + slot;
export function saveGame(slot = 1) {
  const p = G.player;
  const data = {
    cash: G.cash, xp: G.xp, level: G.level, skills: G.skills,
    day: G.day, time: G.time, weather: G.weather,
    px: p.x, py: p.y, hp: p.hp, armor: p.armor, weapon: p.weapon, ammo: p.ammo,
    ownedWeapons: p.ownedWeapons,
    turf: G.turf, missionIndex: G.mission.index, missionsDone: G.mission.done,
    heists: G.heists, safehouses: G.safehouses.map((s) => s.owned),
    businesses: G.businesses.map((b) => b.owned),
    garageCars: G.garageCars, stats: G.stats,
    packagesFound: G.packages.filter((x) => x.found).map((x) => G.packages.indexOf(x)),
    savedAt: new Date().toISOString(),
  };
  try { localStorage.setItem(KEY(slot), JSON.stringify(data)); return true; } catch (e) { return false; }
}
export function loadGame(slot = 1) {
  let raw;
  try { raw = localStorage.getItem(KEY(slot)); } catch (e) { return false; }
  if (!raw) return false;
  let d;
  try { d = JSON.parse(raw); } catch (e) { return false; }
  G.cash = d.cash; G.xp = d.xp; G.level = d.level; G.skills = d.skills;
  G.day = d.day; G.time = d.time; G.weather = d.weather || 'clear';
  const p = G.player;
  p.x = d.px; p.y = d.py; p.hp = d.hp; p.armor = d.armor; p.weapon = d.weapon; p.ammo = d.ammo;
  p.ownedWeapons = d.ownedWeapons || ['fists', 'pistol'];
  G.turf = d.turf; G.mission.done = d.missionsDone || [];
  G.mission.index = d.missionIndex || 0;
  G.heists = d.heists || G.heists;
  d.safehouses.forEach((owned, i) => { if (G.safehouses[i]) G.safehouses[i].owned = owned; });
  d.businesses.forEach((owned, i) => { if (G.businesses[i]) G.businesses[i].owned = owned; });
  G.garageCars = d.garageCars || G.garageCars;
  G.stats = d.stats || G.stats;
  (d.packagesFound || []).forEach((i) => { if (G.packages[i]) G.packages[i].found = true; });
  G.camera.x = p.x; G.camera.y = p.y;
  return true;
}
export function slotInfo(slot) {
  let raw;
  try { raw = localStorage.getItem(KEY(slot)); } catch (e) { return null; }
  if (!raw) return null;
  try { const d = JSON.parse(raw); return { level: d.level, cash: d.cash, day: d.day, savedAt: d.savedAt }; } catch (e) { return null; }
}
export function hasSave(slot) { return slotInfo(slot) !== null; }
