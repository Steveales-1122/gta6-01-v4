// progression.js — XP, levels, three skill tracks and unlocks.
import { G, addMessage } from './state.js';

export const SKILL_NAMES = { driving: 'Driving', shooting: 'Shooting', stamina: 'Stamina' };
export function skillLevel(skill) { return Math.floor((G.skills[skill] || 0) / 300) + 1; }
export function skillProgress(skill) { return ((G.skills[skill] || 0) % 300) / 300; }
export function staminaMax() { return 100 + skillLevel('stamina') * 15; }
export function unlocks() {
  const u = [];
  if (G.level >= 2) u.push('SMG at Ironworks');
  if (G.level >= 3) u.push('Heist: Kargo Bandara');
  if (G.level >= 4) u.push('Shotgun at Ironworks');
  if (G.level >= 5) u.push('Heist: Brankas Pelabuhan');
  if (G.level >= 6) u.push('Rifle at Ironworks');
  if (G.level >= 8) u.push('Heist: Kasino Alba');
  if (G.level >= 10) u.push('Alba Jet 77 for sale');
  return u;
}
export function checkLevelUnlocks() {
  if (G.level >= 3 && !G.heists.cargo.unlocked) { G.heists.cargo.unlocked = true; addMessage('Heist unlocked: Kargo Bandara — plan it at the board', '#ffd700'); }
  if (G.level >= 5 && !G.heists.vault.unlocked) { G.heists.vault.unlocked = true; addMessage('Heist unlocked: Brankas Pelabuhan', '#ffd700'); }
  if (G.level >= 8 && !G.heists.casino.unlocked) { G.heists.casino.unlocked = true; addMessage('Heist unlocked: Kasino Alba', '#ffd700'); }
}
export function xpForNextLevel() { return G.level * 400; }
