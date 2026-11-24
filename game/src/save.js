// SUNSET KEYS v4 — save system: 3 localStorage slots holding cash, XP, skills,
// story progress, turf, properties, garage, weapons and the player position.
import { G } from './state.js';

const SLOT_KEY = (i) => 'sunsetkeys_v4_save_' + i;

/** Serialise the save-worthy slice of G. */
export function serializeSave() {
  return {
    version: 4,
    day: G.day, time: G.time, cash: G.cash, xp: G.xp, level: G.level,
    skills: { ...G.skills }, health: G.health, armor: G.armor,
    player: { x: G.player.x, y: G.player.y },
    weaponsOwned: { ...G.weaponsOwned }, ammo: { ...G.ammo },
    missionIndex: G.mission.index,
    turf: { ...G.turf },
    properties: JSON.parse(JSON.stringify(G.properties)),
    ownedCars: JSON.parse(JSON.stringify(G.ownedCars)),
    stats: { ...G.stats },
    story: JSON.parse(JSON.stringify(G.story)),
    heistsDone: G.story.heistsDone,
    savedAt: new Date().toISOString(),
  };
}

/** Write a slot (0-2). Returns true on success. */
export function saveGame(slot) {
  try {
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify(serializeSave()));
    G.saveSlots[slot] = serializeSave();
    return true;
  } catch (e) { return false; }
}

/** Read a slot's summary (or null when empty). */
export function loadSlotSummary(slot) {
  try {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { day: data.day, cash: data.cash, level: data.level, missions: data.missionIndex, savedAt: data.savedAt };
  } catch (e) { return null; }
}

/** Load a slot into G. Returns true on success. */
export function loadGame(slot) {
  try {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.day = d.day; G.time = d.time; G.cash = d.cash; G.xp = d.xp; G.level = d.level;
    G.skills = { ...d.skills };
    G.health = d.health; G.armor = d.armor;
    G.player.x = d.player.x; G.player.y = d.player.y;
    G.player.onFoot = true; G.player.car = null; G.player.boat = null; G.player.plane = null;
    G.weaponsOwned = { ...d.weaponsOwned };
    G.ammo = { ...d.ammo };
    G.mission.index = d.missionIndex;
    G.mission.active = false;
    G.turf = { ...d.turf };
    G.properties = JSON.parse(JSON.stringify(d.properties));
    G.ownedCars = JSON.parse(JSON.stringify(d.ownedCars));
    G.garage = JSON.parse(JSON.stringify(d.ownedCars));
    G.stats = { ...d.stats };
    G.story = JSON.parse(JSON.stringify(d.story));
    G.wanted = 0;
    return true;
  } catch (e) { return false; }
}

/** Refresh the slot summaries (called when the title screen opens). */
export function refreshSlots() {
  for (let i = 0; i < 3; i++) G.saveSlots[i] = loadSlotSummary(i);
}
