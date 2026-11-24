// main.js — game loop: wires every system, input, camera, menus and rendering.
import { G, WORLD_W, WORLD_H, clamp, addMessage, addXp } from './state.js';
import { buildCity } from './city.js';
import { seedCars, nearestCar, enterCar, exitCar, updateDriving } from './vehicles.js';
import { seedPlanes, nearestPlane, boardPlane, updatePlane } from './planes.js';
import { seedBoats, nearestBoat, boardBoat, updateBoat } from './boats.js';
import { seedPeds, updatePeds } from './pedestrians.js';
import { seedTraffic, updateTraffic } from './traffic.js';
import { updatePolice, bustPlayer } from './police.js';
import { playerShoot, playerMelee, updateBullets, updateEnemies } from './combat.js';
import { cycleWeapon, buyWeapon, buyAmmo, buyArmor } from './weapons.js';
import { startMission, updateMissions, completeMission } from './missions.js';
import { heistsDone, selectHeist, setApproach, setCrew, startPrep, launchHeist } from './heists.js';
import { startTurfWar, updateTurfWar } from './turf.js';
import { startTaxi, startVigilante, startParamedic, updateSidejob } from './sidejobs.js';
import { seedPackages, updateEvents } from './events.js';
import { advanceClock, hourOf, drawSkyOverlay, isNight } from './daynight.js';
import { updateWeather, drawWeather } from './weather.js';
import { updateParticles } from './effects.js';
import { initAudio, resumeAudio, sfxClick, sfxShot, engineSound } from './audio.js';
import { initRadio, updateRadio, cycleStation, toggleRadio } from './radio.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { drawHUD } from './hud.js';
import { drawMinimap } from './minimap.js';
import { drawWorld } from './render.js';
import { drawTitle, drawPause, drawControls, drawShop, drawGarage, drawHeistBoard, drawEndScreen } from './ui.js';
import { applyDemo } from './shots.js';
import { nearestSafehouse, nearestBusiness, restAtSafehouse } from './properties.js';
import { buyBusiness, buySafehouse, collectHourlyIncome } from './economy.js';
import { buyGarageCar, deliverCar, tuneCar, repaintCar, PAINTS } from './garage.js';
import { checkLevelUnlocks } from './progression.js';
import { keys, mouse, initInput, axis, consumeClick } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
let last = performance.now();
let t = 0;
let lastHour = -1;
let paintIdx = 0;

function startGame() {
  G.mode = 'play';
  resumeAudio();
  if (!G.mission.active && G.mission.index === 0 && G.mission.done.length === 0) startMission(0);
  addMessage('Welcome to Port Alba. Follow the gold marker.', '#ffd700');
}
function interact() {
  const p = G.player;
  const sh = nearestSafehouse(p.x, p.y);
  if (sh) {
    if (sh.owned) restAtSafehouse(1);
    else buySafehouse(sh.id);
    return;
  }
  const bz = nearestBusiness(p.x, p.y);
  if (bz) { buyBusiness(bz.id); return; }
  if (!p.inVehicle && !p.onPlane && !p.onBoat) {
    const pl = nearestPlane(p.x, p.y);
    if (pl) { if (boardPlane(pl)) addMessage('Boarded ' + pl.name + ' — W/S throttle, A/D steer', '#7fff9e'); else addMessage('Need $' + pl.price + ' for ' + pl.name, '#ff6666'); return; }
    const bt = nearestBoat(p.x, p.y);
    if (bt) { if (boardBoat(bt)) addMessage('Boarded ' + bt.name, '#7fff9e'); else addMessage('Need $' + bt.price + ' for ' + bt.name, '#ff6666'); return; }
  }
}
function toggleVehicle() {
  const p = G.player;
  if (p.inVehicle) { exitCar(); return; }
  if (p.onPlane) { p.onPlane = null; return; }
  if (p.onBoat) { p.onBoat = null; return; }
  const car = nearestCar(p.x, p.y);
  if (car) { enterCar(car); addMessage('Driving ' + car.name, '#7fff9e'); }
}
function updatePlayer(dt) {
  const p = G.player;
  if (p.inVehicle || p.onPlane || p.onBoat) return;
  const a = axis();
  const run = keys['ShiftLeft'] || keys['ShiftRight'];
  const sp = (run ? 230 : 150) * (1 + 0.1 * Math.floor((G.skills.stamina || 0) / 300));
  let nx = p.x + a.x * sp * dt, ny = p.y + a.y * sp * dt;
  if (a.x || a.y) {
    p.angle = Math.atan2(a.y, a.x);
    const hit = collide(nx, ny);
    if (!hit) { p.x = nx; p.y = ny; }
    else { p.x = hit.x; p.y = hit.y; }
    if (run) addXp(dt * 3, 'stamina');
  }
  p.x = clamp(p.x, 40, 3560); p.y = clamp(p.y, 40, 2340);
  // Aim at mouse.
  const wx = mouse.x + G.camera.x, wy = mouse.y + G.camera.y;
  p.angle = Math.atan2(wy - p.y, wx - p.x);
  if (mouse.down) { playerShoot(wx, wy); sfxShot(); }
}
function collide(x, y) {
  // Local import-free collision: reuse buildings list directly.
  for (const b of G.buildings) {
    if (x + 12 > b.x && x - 12 < b.x + b.w && y + 12 > b.y && y - 12 < b.y + b.h) return { x: p.x, y: p.y };
  }
  return null;
}
const p = G.player;

function update(dt) {
  if (G.mode !== 'play') return;
  t += dt;
  advanceClock(dt);
  updateWeather(dt);
  updateRadio(dt);
  checkLevelUnlocks();
  const hr = hourOf();
  if (lastHour !== -1 && hr !== lastHour) collectHourlyIncome();
  lastHour = hr;
  const a = axis();
  updatePlayer(dt);
  updateDriving(dt, a);
  updatePlane(dt, a);
  updateBoat(dt, a);
  updatePeds(dt);
  updateTraffic(dt);
  updatePolice(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateParticles(dt);
  updateEvents(dt);
  updateMissions(dt);
  updateTurfWar();
  updateSidejob(dt);
  for (const m of G.messages) m.t -= dt;
  G.messages = G.messages.filter((m) => m.t > 0);
  // Mission 13 gate: after a heist is done, the final mission opens.
  if (!G.mission.active && G.mission.index === 12 && heistsDone() > 0) startMission(13);
  // Camera follows player.
  const tx = clamp(G.player.x - W / 2, 0, WORLD_W - W);
  const ty = clamp(G.player.y - H / 2, 0, WORLD_H - H);
  G.camera.x += (tx - G.camera.x) * Math.min(1, dt * 5);
  G.camera.y += (ty - G.camera.y) * Math.min(1, dt * 5);
  const veh = G.player.inVehicle;
  engineSound(veh ? veh.speed : 0);
  if (G.player.hp <= 0) { G.mode = 'dead'; }
}
function render() {
  const cam = { x: G.camera.x + (Math.random() - 0.5) * G.shake, y: G.camera.y + (Math.random() - 0.5) * G.shake };
  if (G.mode === 'title') { drawTitle(ctx, W, H); return; }
  drawWorld(ctx, cam, t);
  drawSkyOverlay(ctx, W, H);
  drawWeather(ctx, W, H);
  if (G.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + G.flash + ')'; ctx.fillRect(0, 0, W, H); }
  drawMinimap(ctx, W, H);
  drawHUD(ctx, W, H);
  if (G.mode === 'pause') drawPause(ctx, W, H);
  else if (G.mode === 'controls') drawControls(ctx, W, H);
  else if (G.mode === 'shop') drawShop(ctx, W, H);
  else if (G.mode === 'garage') drawGarage(ctx, W, H);
  else if (G.mode === 'heist') drawHeistBoard(ctx, W, H);
  else if (G.mode === 'dead') drawEndScreen(ctx, W, H, false);
  else if (G.mode === 'win') drawEndScreen(ctx, W, H, true);
}
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
function onKey(e) {
  if (e.repeat) return;
  const code = e.code;
  if (G.mode === 'title') {
    if (code === 'Enter' || code === 'Space') { sfxClick(); startGame(); }
    if (code === 'Digit1' && hasSave(1)) { loadGame(1); startGame(); }
    if (code === 'Digit2' && hasSave(2)) { loadGame(2); startGame(); }
    if (code === 'Digit3' && hasSave(3)) { loadGame(3); startGame(); }
    return;
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (G.mode === 'play') G.mode = 'pause';
    else if (G.mode === 'pause') G.mode = 'play';
    else if (['shop', 'garage', 'heist', 'controls'].includes(G.mode)) G.mode = 'play';
    return;
  }
  if (G.mode === 'dead' || G.mode === 'win') {
    if (code === 'Enter') { if (G.mode === 'dead') bustPlayer(); else G.mode = 'play'; }
    return;
  }
  if (G.mode === 'pause') {
    if (code === 'KeyC') G.mode = 'controls';
    if (code === 'KeyS') { saveGame(1); addMessage('Saved (slot 1)', '#7fff9e'); }
    if (code === 'KeyQ') G.mode = 'title';
    return;
  }
  if (G.mode === 'controls') { if (code === 'KeyC') G.mode = 'pause'; return; }
  if (G.mode === 'shop') {
    if (code === 'KeyB') { G.mode = 'play'; return; }
    const list = ['pistol', 'smg', 'shotgun', 'rifle'];
    if (code === 'Digit1') buyWeapon('pistol');
    if (code === 'Digit2') buyWeapon('smg');
    if (code === 'Digit3') buyWeapon('shotgun');
    if (code === 'Digit4') buyWeapon('rifle');
    if (code === 'Digit5') buyArmor();
    return;
  }
  if (G.mode === 'garage') {
    if (code === 'KeyG') { G.mode = 'play'; return; }
    if (code.startsWith('Digit')) {
      const i = parseInt(code.slice(5), 10) - 1;
      if (i >= 0 && i < G.garageCars.length) { deliverCar(i); G.mode = 'play'; }
    }
    if (code === 'KeyT') tuneCar(0);
    if (code === 'KeyB') { const models = ['sport', 'muscle', 'truck', 'taxi']; buyGarageCar(models[0]); }
    return;
  }
  if (G.mode === 'heist') {
    if (code === 'KeyH') { G.mode = 'play'; return; }
    if (code === 'Digit1') selectHeist('cargo');
    if (code === 'Digit2') selectHeist('vault');
    if (code === 'Digit3') selectHeist('casino');
    if (code === 'KeyA') { const order = ['LOUD', 'QUIET', 'SNEAK']; setApproach(order[(order.indexOf(G.heistBoard.approach) + 1) % 3]); }
    if (code === 'KeyC') { const ids = ['solo', 'ivy', 'dario', 'both']; setCrew(ids[(ids.indexOf(G.heistBoard.crew) + 1) % ids.length]); }
    if (code === 'Enter') { startPrep(G.heistBoard.selected); G.mode = 'play'; }
    if (code === 'KeyL') { launchHeist(G.heistBoard.selected); G.mode = 'play'; }
    return;
  }
  if (G.mode !== 'play') return;
  if (code === 'KeyE') interact();
  if (code === 'KeyF') toggleVehicle();
  if (code === 'KeyQ') cycleWeapon(1);
  if (code === 'KeyR') { addMessage('Radio: ' + cycleStation(), '#9fc4e8'); }
  if (code === 'KeyM') { G.muted = !G.muted; }
  if (code === 'KeyH') G.mode = 'heist';
  if (code === 'KeyG') G.mode = 'garage';
  if (code === 'KeyB') G.mode = 'shop';
  if (code === 'KeyV') playerMelee();
  if (code === 'Digit1') startTaxi();
  if (code === 'Digit2') startVigilante();
  if (code === 'Digit3') startParamedic();
  if (code === 'Digit4') startTurfWar('downtown');
  if (code === 'KeyS' && (keys['ControlLeft'] || keys['MetaLeft'])) { saveGame(1); addMessage('Saved (slot 1)', '#7fff9e'); }
}
function boot() {
  initInput(canvas);
  initAudio();
  initRadio();
  buildCity();
  seedCars(); seedPeds(); seedTraffic(); seedPlanes(); seedBoats(); seedPackages();
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('mousedown', () => { resumeAudio(); if (G.mode === 'title') startGame(); });
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo');
  if (demo) applyDemo(demo);
  requestAnimationFrame(loop);
}
boot();
