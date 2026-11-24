// SUNSET KEYS v4 — menus: title screen, pause, phone (missions/jobs/save),
// Ironworks + dealership + properties shop, heist planning board, garage,
// death and victory screens. All canvas-drawn; clicks are resolved by rects
// registered in G.ui.buttons each frame.
import { G, fmtCash, clamp, toast } from './state.js';
import { MISSIONS, CHARACTERS, ENDINGS } from './story.js';
import { WEAPONS, AMMO_PRICE, ARMOR_PRICE, buyWeapon, buyAmmo, buyArmor } from './weapons.js';
import { buyCar, repaintCar, tuneCar, deliverCar, PAINTS, ENGINE_STAGES } from './garage.js';
import { CAR_MODELS } from './vehicles.js';
import { SAFEHOUSES, BUSINESSES, buySafehouse, buyBusiness } from './properties.js';
import { HEISTS, CREW_POOL, startHeistRun } from './heists.js';
import { startMission } from './missions.js';
import { startTaxiJob, startVigilanteJob, startParamedicJob } from './sidejobs.js';
import { saveGame, loadGame, refreshSlots } from './save.js';
import { sfx } from './audio.js';
import { netWorth } from './economy.js';

function button(ctx, x, y, w, h, label, opts) {
  const o = opts || {};
  const hover = G.mouse.x >= x && G.mouse.x <= x + w && G.mouse.y >= y && G.mouse.y <= y + h;
  ctx.fillStyle = o.disabled ? 'rgba(60,60,60,0.9)' : hover ? '#f5a623' : (o.color || '#2b3a4a');
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hover ? '#ffffff' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = o.disabled ? '#999999' : '#ffffff';
  ctx.font = 'bold ' + (o.font || 15) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 5);
  ctx.textAlign = 'left';
  if (!o.disabled) G.ui.buttons.push({ x, y, w, h, action: o.action, data: o.data });
  return hover;
}

function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(10,14,22,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (title) {
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 34);
    ctx.textAlign = 'left';
  }
}

/** Dispatch the menu draw for the current mode. */
export function drawMenu(ctx, w, h) {
  G.ui.buttons = [];
  if (G.mode === 'title') drawTitle(ctx, w, h);
  else if (G.mode === 'pause') drawPause(ctx, w, h);
  else if (G.mode === 'phone') drawPhone(ctx, w, h);
  else if (G.mode === 'shop') drawShop(ctx, w, h);
  else if (G.mode === 'heistboard') drawHeistBoard(ctx, w, h);
  else if (G.mode === 'dead') drawDead(ctx, w, h);
  else if (G.mode === 'win') drawWin(ctx, w, h);
  else if (G.mode === 'controls') drawControls(ctx, w, h);
}

function drawTitle(ctx, w, h) {
  // Sunset gradient backdrop.
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a2340');
  grad.addColorStop(0.55, '#c65a3a');
  grad.addColorStop(0.8, '#f5a623');
  grad.addColorStop(1, '#2b1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // City silhouette.
  ctx.fillStyle = '#14101e';
  const skyline = [90, 150, 110, 190, 130, 170, 220, 140, 100, 180, 160, 120, 200, 150, 90];
  let x = 0;
  for (const bh of skyline) { ctx.fillRect(x, h - 220 - bh, 86, bh + 220); x += 86; }
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.arc(w - 260, 190, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,211,77,0.25)';
  ctx.beginPath(); ctx.arc(w - 260, 190, 110, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('SUNSET KEYS', w / 2, 170);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#ffd34d';
  ctx.fillText('v4 — PORT ALBA', w / 2, 215);
  ctx.shadowBlur = 0;
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Open-world crime • 14 misi • 3 heist • perang turf • bisnis • pesawat • radio', w / 2, 250);
  ctx.fillText('Kota original Port Alba — bukan GTA, bukan Rockstar. Semua aset buatan sendiri.', w / 2, 274);
  const hasSave = G.saveSlots.some((s) => s);
  button(ctx, w / 2 - 140, 320, 280, 48, hasSave ? '▶  LANJUTKAN' : '▶  MULAI BARU', { action: 'newgame', font: 18 });
  button(ctx, w / 2 - 140, 380, 280, 44, '📱  MISI & SAVE', { action: 'phone' });
  button(ctx, w / 2 - 140, 434, 280, 44, '🎮  KONTROL', { action: 'controls' });
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  if (hasSave) {
    const s = G.saveSlots.find((x) => x);
    ctx.fillText('Save: Level ' + s.level + ' • ' + fmtCash(s.cash) + ' • Day ' + s.day + ' • ' + (s.missions || 0) + ' misi selesai', w / 2, 510);
  }
  ctx.fillText('WASD bergerak • E masuk mobil • Klik mouse menembak • F interaksi • M HP • Tab papan heist', w / 2, h - 30);
  ctx.textAlign = 'left';
}

function drawPause(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w / 2 - 220, 170, 440, 380, 'JEDA');
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Level ' + G.level + '  •  ' + fmtCash(G.cash) + '  •  Kekayaan ' + fmtCash(netWorth()), w / 2, 225);
  ctx.fillText('Misi selesai: ' + G.stats.missionsDone + '  •  Heist: ' + G.stats.heistsDone + '  •  Turf: ' + G.stats.turfTaken + '/6', w / 2, 248);
  ctx.textAlign = 'left';
  button(ctx, w / 2 - 160, 280, 320, 44, '▶  LANJUTKAN (P)', { action: 'resume' });
  button(ctx, w / 2 - 160, 334, 320, 44, '💾  SIMPAN (Slot 1)', { action: 'save', data: 0 });
  button(ctx, w / 2 - 160, 388, 320, 44, '🎮  KONTROL', { action: 'controls' });
  button(ctx, w / 2 - 160, 442, 320, 44, '🏠  KE MENU UTAMA', { action: 'totitle' });
}

function drawPhone(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w / 2 - 300, 90, 600, 620, '📱  HP — RAY MARLOWE');
  const tab = G.ui.phoneTab;
  button(ctx, w / 2 - 280, 140, 180, 36, 'MISI', { action: 'phonetab', data: 'missions', color: tab === 'missions' ? '#f5a623' : '#2b3a4a' });
  button(ctx, w / 2 - 90, 140, 180, 36, 'JOB', { action: 'phonetab', data: 'jobs', color: tab === 'jobs' ? '#f5a623' : '#2b3a4a' });
  button(ctx, w / 2 + 100, 140, 180, 36, 'SIMPAN', { action: 'phonetab', data: 'save', color: tab === 'save' ? '#f5a623' : '#2b3a4a' });
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  if (tab === 'missions') {
    let y = 200;
    MISSIONS.forEach((m, i) => {
      const done = i < G.mission.index;
      const locked = G.level < m.level;
      const cur = i === G.mission.index;
      ctx.fillStyle = done ? '#7ee787' : cur ? '#ffd34d' : '#cccccc';
      ctx.fillText((done ? '✓ ' : cur ? '▶ ' : '· ') + (i + 1) + '. ' + m.title + ' — ' + CHARACTERS[m.giver].name + '  (' + fmtCash(m.pay) + ')', w / 2 - 280, y);
      if (cur && !G.mission.active) button(ctx, w / 2 + 190, y - 16, 90, 26, locked ? 'LVL ' + m.level : 'MULAI', { action: 'startmission', data: i, disabled: locked, font: 12 });
      y += 26;
    });
    ctx.fillStyle = '#999999';
    ctx.font = '12px sans-serif';
    ctx.fillText('Misi aktif: ' + (G.mission.active ? G.mission.title : 'tidak ada'), w / 2 - 280, y + 10);
  } else if (tab === 'jobs') {
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Side job — bayar tunai, naikkan skill. Bisa diambil kapan saja.', w / 2 - 280, 210);
    button(ctx, w / 2 - 280, 230, 540, 44, '🚕  TAKSI — antar penumpang  •  $180', { action: 'job', data: 'taxi' });
    button(ctx, w / 2 - 280, 284, 540, 44, '🦸  VIGILANTE — bereskan 3 perampok  •  $450', { action: 'job', data: 'vigilante' });
    button(ctx, w / 2 - 280, 338, 540, 44, '🚑  PARAMEDIS — selamatkan korban  •  $320', { action: 'job', data: 'paramedic' });
    ctx.fillStyle = '#999999';
    ctx.font = '12px sans-serif';
    ctx.fillText('Job aktif: ' + (G.sideJob ? G.sideJob.kind + ' — sisa ' + Math.ceil(G.sideJob.timer) + ' dtk' : 'tidak ada'), w / 2 - 280, 410);
    ctx.fillText('Kontak: Lena (Marina) • Dino (utang Kings) • Sersan Kova (polisi korup)', w / 2 - 280, 432);
  } else {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const s = G.saveSlots[i];
      ctx.fillText('Slot ' + (i + 1) + ': ' + (s ? 'Level ' + s.level + ' • ' + fmtCash(s.cash) + ' • Day ' + s.day : '— kosong —'), w / 2 - 280, 220 + i * 60);
      button(ctx, w / 2 - 280, 232 + i * 60, 120, 34, 'SIMPAN', { action: 'save', data: i, font: 13 });
      button(ctx, w / 2 - 140, 232 + i * 60, 120, 34, 'MUAT', { action: 'load', data: i, disabled: !s, font: 13 });
    }
  }
  button(ctx, w / 2 - 90, 660, 180, 40, '✕  TUTUP (M)', { action: 'resume' });
}

function drawShop(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w / 2 - 320, 80, 640, 640, '🛒  TOKO — ' + fmtCash(G.cash));
  const tab = G.ui.shopTab;
  const tabs = [['weapons', 'SENJATA'], ['cars', 'MOBIL'], ['props', 'PROPERTI'], ['garage', 'GARASI']];
  tabs.forEach((t, i) => {
    button(ctx, w / 2 - 300 + i * 155, 130, 145, 36, t[1], { action: 'shoptab', data: t[0], color: tab === t[0] ? '#f5a623' : '#2b3a4a', font: 13 });
  });
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  let y = 190;
  if (tab === 'weapons') {
    ctx.fillText('IRONWORKS — toko senjata. Armor & amunisi juga di sini.', w / 2 - 300, y); y += 28;
    for (const key of Object.keys(WEAPONS)) {
      const wp = WEAPONS[key];
      const owned = G.weaponsOwned[key];
      ctx.fillStyle = owned ? '#7ee787' : '#ffffff';
      ctx.fillText(wp.name + ' — DMG ' + wp.dmg + ' • Lv' + wp.level + (owned ? '  ✓ dimiliki' : '  •  ' + fmtCash(wp.price)), w / 2 - 300, y);
      if (!owned) button(ctx, w / 2 + 180, y - 17, 100, 26, 'BELI', { action: 'buyweapon', data: key, disabled: G.cash < wp.price || G.level < wp.level, font: 12 });
      else button(ctx, w / 2 + 180, y - 17, 100, 26, 'AMMO ' + fmtCash(AMMO_PRICE[key]), { action: 'buyammo', data: key, disabled: G.cash < AMMO_PRICE[key], font: 12 });
      y += 34;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Armor (' + Math.floor(G.armor) + '/100) — ' + fmtCash(ARMOR_PRICE), w / 2 - 300, y);
    button(ctx, w / 2 + 180, y - 17, 100, 26, 'BELI', { action: 'buyarmor', disabled: G.cash < ARMOR_PRICE || G.armor >= 100, font: 12 });
    y += 40;
    ctx.fillStyle = '#999999';
    ctx.font = '12px sans-serif';
    ctx.fillText('Tekan 1-4 untuk ganti senjata. Klik kiri menembak, klik kanan melee.', w / 2 - 300, y);
  } else if (tab === 'cars') {
    ctx.fillText('DEALER MOBIL — beli mobil, simpan di garasi, antar ke dekatmu.', w / 2 - 300, y); y += 28;
    CAR_MODELS.forEach((m, i) => {
      if (m.kind === 'taxi') return;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.model + ' (' + m.kind + ') — top ' + m.maxSpeed + '  •  ' + fmtCash(m.price), w / 2 - 300, y);
      button(ctx, w / 2 + 180, y - 17, 100, 26, 'BELI', { action: 'buycar', data: i, disabled: G.cash < m.price, font: 12 });
      y += 34;
    });
  } else if (tab === 'props') {
    ctx.fillText('PROPERTI — safehouse (save + heal) & bisnis (penghasilan/jam).', w / 2 - 300, y); y += 28;
    for (const s of SAFEHOUSES) {
      const owned = G.properties.safehouses.some((x) => x.id === s.id);
      ctx.fillStyle = owned ? '#7ee787' : '#ffffff';
      ctx.fillText('⌂ ' + s.name + (owned ? '  ✓ milikmu' : '  •  ' + fmtCash(s.price)), w / 2 - 300, y);
      if (!owned) button(ctx, w / 2 + 180, y - 17, 100, 26, 'BELI', { action: 'buysafehouse', data: s.id, disabled: G.cash < s.price, font: 12 });
      y += 34;
    }
    for (const b of BUSINESSES) {
      const owned = G.properties.businesses.some((x) => x.id === b.id);
      ctx.fillStyle = owned ? '#7ee787' : '#ffffff';
      ctx.fillText('🏢 ' + b.name + ' — +' + fmtCash(b.income) + '/jam' + (owned ? '  ✓ milikmu' : '  •  ' + fmtCash(b.price)), w / 2 - 300, y);
      if (!owned) button(ctx, w / 2 + 180, y - 17, 100, 26, 'BELI', { action: 'buybusiness', data: b.id, disabled: G.cash < b.price, font: 12 });
      y += 34;
    }
  } else {
    ctx.fillText('GARASI — mobil milikmu (' + G.ownedCars.length + '). Cat & tuning di sini.', w / 2 - 300, y); y += 28;
    if (G.ownedCars.length === 0) { ctx.fillStyle = '#999999'; ctx.fillText('Belum punya mobil — beli di tab MOBIL.', w / 2 - 300, y); }
    G.ownedCars.forEach((c, i) => {
      ctx.fillStyle = '#ffffff';
      const stage = ENGINE_STAGES[c.engine || 0];
      ctx.fillText(c.model + ' [' + c.plate + '] — ' + stage.name, w / 2 - 300, y);
      button(ctx, w / 2 - 20, y - 17, 80, 26, 'ANTAR', { action: 'delivercar', data: i, font: 12 });
      button(ctx, w / 2 + 70, y - 17, 80, 26, 'CAT', { action: 'repaint', data: i, font: 12 });
      button(ctx, w / 2 + 160, y - 17, 110, 26, 'TUNING', { action: 'tune', data: i, font: 12 });
      y += 34;
    });
  }
  button(ctx, w / 2 - 90, 670, 180, 40, '✕  TUTUP (F)', { action: 'resume' });
}

function drawHeistBoard(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w / 2 - 340, 70, 680, 660, '🗺️  PAPAN PERENCANAAN HEIST');
  const plan = G.heistPlan;
  HEISTS.forEach((hs, i) => {
    const sel = plan.heist === i;
    button(ctx, w / 2 - 320, 130 + i * 52, 200, 44, (i + 1) + '. ' + hs.name, { action: 'heistselect', data: i, color: sel ? '#f5a623' : '#2b3a4a', font: 14 });
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px sans-serif';
    ctx.fillText(fmtCash(hs.basePay) + ' • ' + hs.target, w / 2 - 100, 158 + i * 52);
  });
  const hs = HEISTS[plan.heist];
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px sans-serif';
  let y = 310;
  ctx.fillText('Heist: ' + hs.name + ' — ' + hs.target, w / 2 - 320, y); y += 26;
  ctx.fillText('Persiapan (wajib 2):', w / 2 - 320, y); y += 24;
  hs.preps.forEach((pr, i) => {
    ctx.fillStyle = plan.prepsDone[i] ? '#7ee787' : '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText((plan.prepsDone[i] ? '✓ ' : '○ ') + pr, w / 2 - 300, y);
    if (!plan.prepsDone[i]) button(ctx, w / 2 + 180, y - 17, 120, 26, 'SELESAIKAN', { action: 'prep', data: i, font: 12 });
    y += 32;
  });
  y += 6;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Pilih kru (potongan dari hasil):', w / 2 - 320, y); y += 24;
  CREW_POOL.forEach((c) => {
    const inCrew = plan.crew.some((x) => x.id === c.id);
    ctx.fillStyle = inCrew ? '#7ee787' : '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText((inCrew ? '✓ ' : '○ ') + c.name + ' — ' + c.role + ' (' + Math.round(c.cut * 100) + '%) — ' + c.skill, w / 2 - 300, y);
    button(ctx, w / 2 + 220, y - 17, 80, 26, inCrew ? 'HAPUS' : 'PILIH', { action: 'crew', data: c.id, font: 12 });
    y += 30;
  });
  y += 6;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Pendekatan:', w / 2 - 320, y); y += 8;
  ['LOUD', 'QUIET', 'SNEAK'].forEach((ap, i) => {
    const sel = plan.approach === ap;
    button(ctx, w / 2 - 320 + i * 130, y, 118, 36, ap, { action: 'approach', data: ap, color: sel ? '#f5a623' : '#2b3a4a', font: 13 });
    ctx.fillStyle = '#cccccc';
    ctx.font = '11px sans-serif';
    ctx.fillText('×' + hs.approachPay[ap] + ' • ★' + hs.approachWanted[ap], w / 2 - 320 + i * 130 + 8, y + 52);
  });
  y += 66;
  ctx.fillStyle = '#ffd34d';
  ctx.font = '13px sans-serif';
  const cut = plan.crew.reduce((n, c) => n + c.cut, 0);
  ctx.fillText('Perkiraan bersih: ' + fmtCash(hs.basePay * hs.approachPay[plan.approach] * (1 - cut)) + '  •  LOUD = cepat & berisik, SNEAK = bayaran terbesar', w / 2 - 320, y);
  const ready = plan.prepsDone[0] && plan.prepsDone[1] && plan.crew.length > 0;
  button(ctx, w / 2 - 160, 640, 320, 44, ready ? '💰  MULAI HEIST' : '🔒  LENGKAPI DULU', { action: 'startheist', disabled: !ready, font: 16 });
  button(ctx, w / 2 + 180, 640, 120, 44, '✕ TUTUP', { action: 'resume', font: 14 });
}

function drawDead(ctx, w, h) {
  ctx.fillStyle = 'rgba(20,0,0,0.75)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e5484d';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(G.deathReason || 'WASTED', w / 2, h / 2 - 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Misi: ' + G.stats.missionsDone + ' selesai • ' + fmtCash(G.cash) + ' • Level ' + G.level, w / 2, h / 2 + 10);
  ctx.textAlign = 'left';
  button(ctx, w / 2 - 140, h / 2 + 40, 280, 46, '↻  BANGKIT LAGI', { action: 'respawn', font: 16 });
}

function drawWin(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,10,20,0.85)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  const e = G.winText || ENDINGS[2];
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(e.title, w / 2, h / 2 - 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = '17px sans-serif';
  wrapText(ctx, e.text, w / 2, h / 2 - 30, 700, 26);
  ctx.font = '15px sans-serif';
  ctx.fillText('14 misi selesai • ' + fmtCash(G.cash) + ' • Level ' + G.level + ' • Turf ' + G.stats.turfTaken + '/6', w / 2, h / 2 + 60);
  ctx.textAlign = 'left';
  button(ctx, w / 2 - 140, h / 2 + 90, 280, 46, '▶  TERUS BERMAIN', { action: 'resume', font: 16 });
}

function drawControls(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w / 2 - 280, 110, 560, 560, '🎮  KONTROL');
  const rows = [
    ['W A S D', 'Jalan / nyetir'], ['Shift', 'Lari'], ['Mouse', 'Arah tembak'],
    ['Klik kiri', 'Tembak'], ['Klik kanan', 'Pukul (melee)'], ['E', 'Masuk/keluar mobil, perahu, pesawat'],
    ['F', 'Interaksi (toko, safehouse, bisnis)'], ['1 – 4', 'Ganti senjata'],
    ['R', 'Ganti stasiun radio'], ['M', 'HP (misi / job / save)'], ['Tab', 'Papan perencanaan heist'],
    ['P / Esc', 'Jeda'], ['Space', 'Rem tangan'],
  ];
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px sans-serif';
  rows.forEach((r, i) => {
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(r[0], w / 2 - 250, 180 + i * 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(r[1], w / 2 - 120, 180 + i * 32);
  });
  button(ctx, w / 2 - 90, 600, 180, 42, '✕  TUTUP', { action: 'back', font: 15 });
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}

/** Handle a click in a menu: run the button's action. Returns true if consumed. */
export function clickMenu(x, y) {
  const b = G.ui.buttons.find((bb) => x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h);
  if (!b) return false;
  sfx('click');
  const a = b.action, d = b.data;
  switch (a) {
    case 'newgame': startNewGame(); break;
    case 'phone': G.prevMode = G.mode; G.mode = 'phone'; refreshSlots(); break;
    case 'controls': G.prevMode = G.mode; G.mode = 'controls'; break;
    case 'resume': G.mode = G.prevMode === 'title' ? 'play' : (G.prevMode || 'play'); if (G.mode === 'title') G.mode = 'play'; break;
    case 'back': G.mode = G.prevMode || 'play'; break;
    case 'totitle': G.mode = 'title'; refreshSlots(); break;
    case 'save': if (saveGame(d)) { toast('Disimpan di Slot ' + (d + 1)); } else toast('Gagal menyimpan'); break;
    case 'load': if (loadGame(d)) { G.mode = 'play'; toast('Save Slot ' + (d + 1) + ' dimuat'); } break;
    case 'phonetab': G.ui.phoneTab = d; break;
    case 'shoptab': G.ui.shopTab = d; break;
    case 'startmission': if (startMission(d)) G.mode = 'play'; break;
    case 'job':
      if (d === 'taxi') startTaxiJob();
      else if (d === 'vigilante') startVigilanteJob();
      else startParamedicJob();
      G.mode = 'play';
      break;
    case 'buyweapon': { const r = buyWeapon(d); toast(r.ok ? 'Dibeli: ' + WEAPONS[d].name : r.why); break; }
    case 'buyammo': { const r = buyAmmo(d); toast(r.ok ? 'Amunisi dibeli' : r.why); break; }
    case 'buyarmor': { const r = buyArmor(); toast(r.ok ? 'Armor penuh' : r.why); break; }
    case 'buycar': { const r = buyCar(d); toast(r.ok ? 'Mobil dibeli: ' + CAR_MODELS[d].model : r.why); break; }
    case 'buysafehouse': { const r = buySafehouse(d); toast(r.ok ? 'Safehouse dibeli' : r.why); break; }
    case 'buybusiness': { const r = buyBusiness(d); toast(r.ok ? 'Bisnis dibeli' : r.why); break; }
    case 'delivercar': { const car = deliverCar(G.ownedCars[d]); if (car) { G.mode = 'play'; toast('Mobil diantar: ' + car.model); } break; }
    case 'repaint': { const r = repaintCar(G.ownedCars[d], (G.ownedCars[d].paintIdx = ((G.ownedCars[d].paintIdx || 0) + 1) % PAINTS.length)); toast(r.ok ? 'Cat diganti' : r.why); break; }
    case 'tune': { const r = tuneCar(G.ownedCars[d]); toast(r.ok ? 'Mesin dituning' : r.why); break; }
    case 'heistselect': G.heistPlan.heist = d; G.heistPlan.prepsDone = [false, false]; G.heistPlan.crew = []; break;
    case 'prep': G.heistPlan.prepsDone[d] = true; toast('Persiapan selesai: ' + HEISTS[G.heistPlan.heist].preps[d]); break;
    case 'crew': {
      const c = CREW_POOL.find((x) => x.id === d);
      const i = G.heistPlan.crew.findIndex((x) => x.id === d);
      if (i >= 0) G.heistPlan.crew.splice(i, 1);
      else if (G.heistPlan.crew.length < 3) G.heistPlan.crew.push(c);
      else toast('Kru maksimal 3 orang');
      break;
    }
    case 'approach': G.heistPlan.approach = d; break;
    case 'startheist': if (startHeistRun()) { /* mode set to play by startHeistRun */ } break;
    case 'respawn':
      G.health = 100; G.mode = 'play';
      G.player.x = 900; G.player.y = 500; G.player.onFoot = true; G.player.car = null;
      G.wanted = 0;
      break;
    default: break;
  }
  return true;
}

/** Start a fresh game from the title screen (or load slot 1 if it exists). */
export function startNewGame() {
  const hasSave = G.saveSlots.some((s) => s);
  if (hasSave && loadGame(0)) { G.mode = 'play'; toast('Save dimuat — selamat datang kembali, Ray'); return; }
  G.mode = 'play';
  if (!G.mission.active && G.mission.index === 0) {
    G.mission.title = MISSIONS[0].title;
    toast('Misi pertama: ' + MISSIONS[0].title + ' — buka HP (M) untuk mulai');
  }
}

