// SUNSET KEYS v4 — progression: XP, levels and the three skill tracks.
// Driving, Shooting and Stamina grow by doing; levels gate weapons, planes,
// heists and story missions, and each level-up heals a little.
import { G, clamp } from './state.js';

export const SKILL_NAMES = {
  driving: 'Driving',
  shooting: 'Shooting',
  stamina: 'Stamina',
};

/** XP needed for the next level. */
export function xpForLevel(level) { return 100 * level; }

/** Skill effect: driving raises top speed and handling, stamina raises sprint. */
export function skillBonus(skill) {
  return 1 + (G.skills[skill] || 0) * 0.004;
}

/** Sprint speed on foot, scaled by Stamina. */
export function runSpeed() {
  return 265 * (1 + G.skills.stamina * 0.003);
}

/** Missions available at the current level (story.js holds the list). */
export function unlockedMissions(total) {
  let n = 0;
  for (let i = 0; i < total; i++) {
    const need = Math.floor(i / 3) + 1; // every 3 missions need +1 level
    if (G.level >= need) n++;
  }
  return n;
}
