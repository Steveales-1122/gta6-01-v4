// hud.js — full HUD: health, armor, cash, XP bar, wanted stars, mission tracker, clock.
import { G, WEAPONS } from './state.js';
import { clockText, isNight } from './daynight.js';
import { skillLevel } from './progression.js';
import { stationName } from './radio.js';
import { hourlyIncome } from './economy.js';
import { districtNameAt } from './districts.js';

export function drawHUD(ctx, w, h) {
  const p = G.player;
  ctx.textAlign = 'left';
  // Wanted stars top-right.
  ctx.font = 'bold 26px sans-serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < G.wanted ? '#ffd700' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', w - 170 + i * 32, 40);
  }
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText(districtNameAt(p.x, p.y) + '  ·  ' + clockText() + '  ·  Day ' + G.day, w - 260, 62);
  ctx.fillText('Weather: ' + G.weather + (isNight() ? ' · night' : ''), w - 260, 80);
  // Cash + XP top-left.
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#7fff9e';
  ctx.fillText('$' + Math.floor(G.cash).toLocaleString(), 16, 36);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('Level ' + G.level + '  ·  XP ' + Math.floor(G.xp) + '/' + (G.level * 400), 16, 56);
  ctx.fillStyle = '#333'; ctx.fillRect(16, 62, 180, 8);
  ctx.fillStyle = '#ffd700'; ctx.fillRect(16, 62, 180 * Math.min(1, G.xp / (G.level * 400)), 8);
  ctx.fillText('Income $' + hourlyIncome() + '/h  ·  ' + stationName(), 16, 88);
  // Skills.
  ctx.fillText('DRV ' + skillLevel('driving') + '  SHO ' + skillLevel('shooting') + '  STA ' + skillLevel('stamina'), 16, 106);
  // Health + armor bottom-right.
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(w - 216, h - 46, 200 * Math.max(0, p.hp) / 100, 12);
  ctx.strokeStyle = '#fff'; ctx.strokeRect(w - 216, h - 46, 200, 12);
  ctx.fillStyle = '#fff'; ctx.fillText('HP ' + Math.ceil(p.hp), w - 216, h - 52);
  if (p.armor > 0) {
    ctx.fillStyle = '#3498db'; ctx.fillRect(w - 216, h - 28, 200 * p.armor / 100, 8);
    ctx.fillStyle = '#fff'; ctx.fillText('ARMOR ' + Math.ceil(p.armor), w - 216, h - 14);
  }
  // Weapon bottom-left.
  const wdef = WEAPONS[p.weapon];
  ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff';
  const ammo = p.weapon === 'fists' ? '∞' : (p.ammo[p.weapon] || 0);
  ctx.fillText(wdef.name + '  ·  ' + ammo + '  [Q cycle]', 16, h - 20);
  // Mission tracker.
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText(G.objective, 16, 130);
  if (G.mission.active && G.mission.target) {
    const d = Math.hypot(p.x - G.mission.target.x, p.y - G.mission.target.y);
    ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
    ctx.fillText('Distance: ' + Math.round(d) + 'm', 16, 150);
  }
  if (G.sidejob.type) {
    ctx.fillStyle = '#7fff9e'; ctx.font = '13px sans-serif';
    ctx.fillText('Side job: ' + G.sidejob.type + ' — ' + Math.ceil(G.sidejob.timer) + 's left', 16, 168);
  }
  // Messages.
  ctx.font = '13px sans-serif';
  G.messages.forEach((m, i) => {
    ctx.fillStyle = m.color;
    ctx.fillText(m.text, 16, 190 + i * 18);
  });
  // Controls hint.
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px sans-serif';
  ctx.fillText('WASD move/drive · E interact · F enter car · Mouse aim · Click shoot · Q weapon · R radio · H heist board · G garage · B shop · P pause · M mute', 16, h - 40);
}
