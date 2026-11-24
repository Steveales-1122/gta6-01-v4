// SUNSET KEYS v4 — HUD: cash/XP/health/armor, wanted stars, clock, mission
// tracker, radio, toasts, banners and the context prompt. All drawn on canvas
// so screenshots show the full interface.
import { G, fmtCash, clamp } from './state.js';
import { clockText, isNight } from './daynight.js';
import { weatherLabel } from './weather.js';
import { objectiveText, objectiveDistance } from './missions.js';
import { currentStation } from './radio.js';
import { sideJobTarget } from './sidejobs.js';

/** Draw the whole HUD (skipped on the title screen). */
export function drawHud(ctx, w, h) {
  if (G.mode === 'title') return;
  const p = G.player;
  // Top-left: cash, XP bar, health + armour bars.
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 4;
  ctx.fillText(fmtCash(G.cash), 16, 34);
  ctx.shadowBlur = 0;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#ffd34d';
  ctx.fillText('LVL ' + G.level + '  •  XP ' + Math.floor(G.xp) + '/' + (100 * G.level), 16, 54);
  drawBar(ctx, 16, 62, 170, 10, G.health / 100, '#e5484d');
  drawBar(ctx, 16, 76, 170, 7, G.armor / 100, '#4a90d9');
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HP', 190, 71);
  ctx.fillText('ARMOR', 190, 83);
  // Skills mini-readout.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('DRV ' + Math.floor(G.skills.driving) + '  •  SHT ' + Math.floor(G.skills.shooting) + '  •  STM ' + Math.floor(G.skills.stamina), 16, 102);
  // Top-right: wanted stars + clock + weather.
  ctx.textAlign = 'right';
  ctx.font = 'bold 24px sans-serif';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < G.wanted ? '★' : '☆';
  ctx.fillStyle = G.wanted > 0 ? '#ffd34d' : 'rgba(255,255,255,0.55)';
  ctx.fillText(stars, w - 16, 34);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clockText() + '  •  Day ' + G.day + '  •  ' + weatherLabel() + (isNight() ? '  •  🌙' : '  •  ☀'), w - 16, 56);
  // Mission tracker (top-right, under the clock).
  const obj = objectiveText();
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('▶ ' + obj, w - 16, 82);
  const dist = objectiveDistance();
  if (dist !== null) {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dist + ' m', w - 16, 100);
  }
  const sj = sideJobTarget();
  if (sj) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#7ee787';
    ctx.fillText('◆ ' + sj.label, w - 16, 118);
  }
  // Bottom-right: radio station + controls hint.
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const st = currentStation();
  ctx.fillText('♪ ' + st.name + ' (R ganti) — ' + (G.radio.on ? 'ON' : 'OFF'), w - 16, h - 36);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('WASD jalan/nyetir • E masuk mobil • Klik tembak • F interaksi • M HP • Tab Heist • P jeda', w - 16, h - 18);
  // Bottom-centre: context prompt.
  if (G.prompt) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 5;
    ctx.fillText(G.prompt, w / 2, h - 64);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
  // Toasts (top centre, stacked).
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px sans-serif';
  G.toasts.forEach((t, i) => {
    ctx.globalAlpha = clamp(t.t, 0, 1);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText(t.text, w / 2, 110 + i * 22);
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
  // Centre banner.
  if (G.banner && G.banner.t > 0) {
    const a = clamp(G.banner.t, 0, 1);
    ctx.globalAlpha = a;
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8;
    ctx.fillText(G.banner.title, w / 2, h * 0.32);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(G.banner.sub, w / 2, h * 0.32 + 28);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

function drawBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, w * clamp(frac, 0, 1)), h);
}
