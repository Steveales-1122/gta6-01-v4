// ui.js — menus: title screen, pause, controls, Ironworks shop, garage, heist board, endings.
import { G, CAR_MODELS } from './state.js';
import { shopList } from './weapons.js';
import { HEIST_PAYOUTS, CREWS } from './heists.js';
import { slotInfo } from './save.js';
import { turfSummary } from './turf.js';
import { hourlyIncome } from './economy.js';

export function drawTitle(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ff8c42'); grad.addColorStop(0.55, '#c0392b'); grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SUNSET KEYS', w / 2, 170);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif';
  ctx.fillText('v4 — Port Alba', w / 2, 215);
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#ffe9c9';
  ctx.fillText('An open-world crime game — 14 missions · 3 planned heists · turf war · economy · planes · boats', w / 2, 255);
  ctx.fillText('All names, characters and places are original. No Rockstar / GTA content.', w / 2, 280);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
  ctx.fillText('CLICK or press ENTER to start', w / 2, 350);
  ctx.font = '15px sans-serif'; ctx.fillStyle = '#ffe9c9';
  ctx.fillText('WASD move / drive · E interact · F enter car · Mouse aim · Click shoot · Q weapon · R radio', w / 2, 400);
  ctx.fillText('H heist board · G garage · B Ironworks shop · 1 taxi · 2 vigilante · 3 paramedic · P pause', w / 2, 425);
  ctx.fillText('Save at any safehouse (E) — 3 save slots', w / 2, 450);
  ctx.font = '13px sans-serif';
  for (let s = 1; s <= 3; s++) {
    const info = slotInfo(s);
    ctx.fillText('Slot ' + s + ': ' + (info ? 'Level ' + info.level + ' · $' + info.cash + ' · Day ' + info.day : 'empty'), w / 2, 480 + s * 20);
  }
  ctx.fillText('Press 1/2/3 on the title screen to load a save', w / 2, 560);
}
export function drawPause(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PAUSED', w / 2, 150);
  ctx.font = '16px sans-serif';
  ctx.fillText('P resume · C controls · M mute · S save now · Q quit to title', w / 2, 200);
  ctx.fillText(turfSummary(), w / 2, 240);
  ctx.fillText('Passive income: $' + hourlyIncome() + '/game hour', w / 2, 265);
  ctx.fillText('Missions done: ' + G.stats.missionsDone + ' · Kills: ' + G.stats.kills + ' · Cars stolen: ' + G.stats.carsStolen, w / 2, 290);
  ctx.fillText('Packages: ' + G.stats.packagesFound + '/24 · Stunt jumps: ' + G.stats.jumpsDone + '/6 · Money earned: $' + G.stats.moneyEarned, w / 2, 315);
}
export function drawControls(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CONTROLS', w / 2, 120);
  ctx.font = '15px sans-serif'; ctx.textAlign = 'left';
  const lines = [
    'WASD / Arrows — walk, drive, fly, sail', 'Mouse — aim · Left click — shoot / punch',
    'E — interact (enter building, talk, rest, buy)', 'F — enter / exit nearest car',
    'Q — cycle weapon · R — radio station · M — mute', 'H — heist planning board',
    'G — garage (buy / paint / tune / deliver)', 'B — Ironworks gun shop',
    '1 — taxi job · 2 — vigilante · 3 — paramedic', 'P / Esc — pause · S — save at safehouse',
  ];
  lines.forEach((l, i) => ctx.fillText(l, w / 2 - 220, 170 + i * 28));
  ctx.textAlign = 'center'; ctx.fillText('Press C or Esc to close', w / 2, 170 + lines.length * 28 + 20);
}
export function drawShop(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('IRONWORKS — Gun Shop', w / 2, 110);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('Cash: $' + Math.floor(G.cash) + '   ·   Click a row to buy · B / Esc to leave', w / 2, 145);
  ctx.textAlign = 'left';
  shopList().forEach((s, i) => {
    const y = 190 + i * 44;
    ctx.fillStyle = s.owned ? '#2ecc71' : '#fff';
    ctx.fillText((i + 1) + '. ' + s.name + ' — dmg ' + s.damage + ' · ' + (s.owned ? 'OWNED (ammo $' + s.ammoPrice + ')' : '$' + s.price), w / 2 - 260, y);
  });
  ctx.fillStyle = '#fff';
  ctx.fillText('5. Body Armor $250 — current ' + Math.ceil(G.player.armor), w / 2 - 260, 190 + 4 * 44);
  ctx.fillText('Press 1-4 to buy a weapon, 5 for armor. Ammo: press the weapon key again to restock.', w / 2 - 260, 190 + 5 * 44);
}
export function drawGarage(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('SUNSET GARAGE', w / 2, 110);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('Cash: $' + Math.floor(G.cash) + '   ·   G / Esc to leave', w / 2, 145);
  ctx.textAlign = 'left';
  G.garageCars.forEach((c, i) => {
    ctx.fillStyle = '#fff';
    ctx.fillText((i + 1) + '. ' + c.model + ' — tune stage ' + c.tune + '/3 · paint ' + c.paint, w / 2 - 280, 190 + i * 34);
    ctx.fillStyle = c.paint; ctx.fillRect(w / 2 + 180, 190 + i * 34 - 14, 40, 16);
  });
  ctx.fillStyle = '#9fc4e8';
  const y0 = 200 + G.garageCars.length * 34;
  CAR_MODELS.filter((m) => m.price > 0).forEach((m, i) => {
    ctx.fillText('Buy: ' + m.name + ' $' + m.price + '  (press B then ' + (i + 1) + ')', w / 2 - 280, y0 + i * 28);
  });
  ctx.fillStyle = '#fff';
  ctx.fillText('Keys: 1-9 deliver that car · T tune · P paint (cycles colors)', w / 2 - 280, y0 + CAR_MODELS.filter((m) => m.price > 0).length * 28 + 30);
}
export function drawHeistBoard(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('HEIST PLANNING BOARD', w / 2, 100);
  ctx.font = '15px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('Pick a heist (1-3), approach (A = LOUD / QUIET / SNEAK), crew (C cycles)', w / 2, 135);
  ctx.textAlign = 'left';
  const ids = ['cargo', 'vault', 'casino'];
  ids.forEach((id, i) => {
    const hv = G.heists[id];
    const sel = G.heistBoard.selected === id;
    ctx.fillStyle = sel ? '#ffd700' : '#fff';
    const status = hv.done ? 'DONE' : hv.unlocked ? 'preps ' + hv.preps + '/2' : 'LOCKED (level ' + (id === 'cargo' ? 3 : id === 'vault' ? 5 : 8) + ')';
    ctx.fillText((i + 1) + '. ' + hv.name + ' — payout $' + HEIST_PAYOUTS[id] + ' · ' + status, w / 2 - 300, 180 + i * 34);
  });
  ctx.fillStyle = '#fff';
  ctx.fillText('Approach: ' + G.heistBoard.approach + '   (SNEAK pays +25%, LOUD pays base)', w / 2 - 300, 300);
  const crew = CREWS.find((c) => c.id === G.heistBoard.crew);
  ctx.fillText('Crew: ' + crew.name, w / 2 - 300, 330);
  ctx.fillText('Keys: 1-3 select heist · A approach · C crew · Enter start prep · L launch (needs 2 preps) · H close', w / 2 - 300, 380);
  ctx.fillText('Ending is decided by your approach and how much turf you hold.', w / 2 - 300, 410);
}
export function drawEndScreen(ctx, w, h, win) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  if (win && G.ending) {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText(G.ending.title, w / 2, 220);
    ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
    ctx.fillText(G.ending.text, w / 2, 270);
  } else {
    ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 40px sans-serif';
    ctx.fillText('WASTED', w / 2, 220);
    ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
    ctx.fillText('You were busted flat. Mara bailed you out — $200 fee.', w / 2, 270);
  }
  ctx.font = '16px sans-serif';
  ctx.fillText('Missions: ' + G.stats.missionsDone + ' · Money earned: $' + G.stats.moneyEarned + ' · Level ' + G.level, w / 2, 320);
  ctx.fillText('Press ENTER to keep playing', w / 2, 360);
}
