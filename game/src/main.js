// SUNSET KEYS v4 — Port Alba: main loop, player control, prompts and wiring.
// Boots the world, runs update + render every frame, and routes keys, mouse and
// clicks to the right system. No network, no assets: everything is drawn code.
import { G, clamp, rand, WORLD_W, WORLD_H, toast, banner, addXp, raiseWanted } from './state.js';
import { runSpeed } from './progression.js';
import { buildCity, districtAt, inWater, hitsBuilding } from './city.js';
import { keys, pressed, initInput, endFrameInput } from './input.js';
import { buildRoads } from './city.js';
import { tickClock, isNight } from './daynight.js';
import { tickWeather } from './weather.js';
import { spawnBoats, updateBoats, nearestBoat } from './boats.js';
import { spawnPlanes, updatePlanes, nearestPlane, boardPlane } from './planes.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { updateTraffic } from './traffic.js';
import { updateVehicles, nearestCar, stealCar, exitVehicle, damageCar } from './vehicles.js';
import { updatePolice, busted } from './police.js';
import { updateBullets, fireWeapon, meleeAttack, hurtPlayer } from './combat.js';
import { updateMissions, objectiveText } from './missions.js';
import { ambientGangSpawn } from './turf.js';
import { updateHeist } from './heists.js';
import { updateSideJobs } from './sidejobs.js';
import { tickEvents, updateEvents } from './events.js';
import { tickEconomy } from './economy.js';
import { updateParticles, drawLighting } from './effects.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';
import { drawMinimap } from './minimap.js';
import { drawMenu, clickMenu } from './ui.js';
import { initAudio, resumeAudio, sfx, updateEngineSound } from './audio.js';
import { initRadio, nextStation, updateRadio } from './radio.js';
import { refreshSlots, saveGame } from './save.js';
import { stageDemo } from './shots.js';
import { nearestSafehouse, restAtSafehouse, nearestBusinessForSale, buyBusiness } from './properties.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1280, H = 800;
let last = performance.now();
let mouseWasDown = false;

/** Boot: build the city, spawn the world, wire input, start the loop. */
function boot() {
  canvas.width = W;
  canvas.height = H;
  buildCity();
  spawnBoats();
  spawnPlanes();
  spawnPeds(30);
  refreshSlots();
  initInput(canvas);
  canvas.addEventListener('mousedown', () => { initAudio(); resumeAudio(); initRadio(); });
  window.addEventListener('keydown', () => { initAudio(); resumeAudio(); initRadio(); }, { once: true });
  // Demo staging for screenshots (?demo=chase|heist|night|airport).
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (demo) {
    stageDemo(demo);
  } else {
    G.mode = 'title';
  }
  // Debug handle for playtesting (read-only inspection from the console).
  window.__G = G;
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = clamp((now - last) / 1000, 0.001, 0.05);
  last = now;
  G.frame++;
  try {
    update(dt);
    render();
  } catch (e) {
    // One frame's error must never freeze the game; it still shows in console.
    console.error('loop error', e);
  }
  endFrameInput();
  if (G.demo) {
    // Signal the screenshot script once the scene has settled.
    if (G.frame > 100 && !window.__shotReady) window.__shotReady = true;
  }
  requestAnimationFrame(loop);
}

/** Per-frame update: menus read keys, play mode runs every system. */
function update(dt) {
  // Mouse world position.
  G.mouse.wx = G.camera.x + G.mouse.x;
  G.mouse.wy = G.camera.y + G.mouse.y;
  // Banner / toast timers.
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  for (let i = G.toasts.length - 1; i >= 0; i--) {
    G.toasts[i].t -= dt;
    if (G.toasts[i].t <= 0) G.toasts.splice(i, 1);
  }
  // Global keys.
  if (pressed('pause') || pressed('escape')) {
    if (G.mode === 'play') { G.prevMode = 'play'; G.mode = 'pause'; }
    else if (G.mode === 'pause') G.mode = 'play';
    else if (G.mode === 'phone' || G.mode === 'shop' || G.mode === 'heistboard' || G.mode === 'garage' || G.mode === 'controls') G.mode = G.prevMode === 'title' ? 'title' : 'play';
  }
  if (pressed('phone') && (G.mode === 'play' || G.mode === 'phone')) {
    if (G.mode === 'play') { G.prevMode = 'play'; G.mode = 'phone'; refreshSlots(); }
    else G.mode = 'play';
  }
  if (pressed('heist') && (G.mode === 'play' || G.mode === 'heistboard')) {
    if (G.mode === 'play') { G.prevMode = 'play'; G.mode = 'heistboard'; }
    else G.mode = 'play';
  }
  if (pressed('radio') && G.mode === 'play') {
    const st = nextStation();
    toast('Radio: ' + st.name + ' — ' + st.desc);
  }
  // Menu clicks.
  if (G.mouse.clicked) {
    G.mouse.clicked = false;
    if (G.mode !== 'play') clickMenu(G.mouse.x, G.mouse.y);
  }
  if (G.mode !== 'play') {
    updateRadio(dt);
    return;
  }
  updatePlay(dt);
}

/** All live gameplay systems, in dependency order. */
function updatePlay(dt) {
  const p = G.player;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.fireCooldown > 0) p.fireCooldown -= dt;
  if (p.meleeCooldown > 0) p.meleeCooldown -= dt;
  // Clock + weather + economy.
  if (tickClock(dt)) tickEconomy();
  tickWeather(dt);
  // Player control.
  if (p.onFoot) updateOnFoot(dt);
  else if (p.car) updateVehicles(dt, readDriveInput());
  else if (p.boat) updateBoats(dt, readDriveInput());
  else if (p.plane) updatePlanes(dt, readDriveInput());
  // Vehicle enter/exit + interact.
  if (pressed('enter')) handleEnterExit();
  if (pressed('interact')) handleInteract();
  // Weapons.
  if (pressed('w1') && G.weaponsOwned.pistol) p.weapon = 'pistol';
  if (pressed('w2') && G.weaponsOwned.smg) p.weapon = 'smg';
  if (pressed('w3') && G.weaponsOwned.shotgun) p.weapon = 'shotgun';
  if (pressed('w4') && G.weaponsOwned.rifle) p.weapon = 'rifle';
  if (G.mouse.down) {
    const auto = ['smg', 'rifle'].includes(p.weapon);
    if (auto || !mouseWasDown) fireWeapon();
    if (p.weapon === 'shotgun' && !mouseWasDown) sfx('shotgun');
    else if (!mouseWasDown) sfx('shoot');
  }
  mouseWasDown = G.mouse.down;
  if (G.mouse.right) { meleeAttack(); G.mouse.right = false; }
  if (pressed('horn') && p.car) sfx('horn');
  // World systems.
  updateTraffic(dt);
  updatePeds(dt);
  ambientGangSpawn(dt); // gang defenders patrol enemy turf
  updatePolice(dt);
  updateBullets(dt);
  updateParticles(dt);
  updateMissions(dt);
  updateHeist(dt);
  updateSideJobs(dt);
  tickEvents(dt);
  updateEvents(dt);
  updateRadio(dt);
  updateEngineSound();
  // Slow health regen when safe.
  if (G.wanted === 0 && G.health > 0 && G.health < 100) G.health = Math.min(100, G.health + 2 * dt);
  // Collectibles.
  for (const col of G.city.collectibles) {
    if (!col.found && (p.x - col.x) ** 2 + (p.y - col.y) ** 2 < 34 * 34) {
      col.found = true;
      G.cash += 100;
      G.stats.collected++;
      addXp(10);
      toast('Paket tersembunyi! +$100 (' + G.stats.collected + '/24)');
      sfx('pickup');
    }
  }
  // Stunt jumps.
  for (const s of G.city.stunts) {
    if (p.car && Math.abs(p.car.speed) > 300 && (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < 60 * 60) {
      if (!s.cool || G.frame - s.cool > 600) {
        s.cool = G.frame;
        G.cash += 50;
        addXp(15, 'driving');
        banner('STUNT JUMP!', '+$50 — lompatan gila');
        sfx('mission');
      }
    }
  }
  // Context prompt.
  updatePrompt();
  // Camera follows the player.
  const tx = clamp(p.x - W / 2, -60, WORLD_W - W + 60);
  const ty = clamp(p.y - H / 2, -60, WORLD_H - H + 60);
  G.camera.x += (tx - G.camera.x) * Math.min(1, dt * 5);
  G.camera.y += (ty - G.camera.y) * Math.min(1, dt * 5);
  if (G.camera.shake > 0) {
    G.camera.x += rand(-1, 1) * G.camera.shake;
    G.camera.y += rand(-1, 1) * G.camera.shake;
    G.camera.shake *= (1 - 6 * dt);
  }
  // Busted when health hits zero on foot with cops near (handled by hurtPlayer).
  if (G.health <= 0 && G.mode === 'play') {
    if (G.wanted > 0) { /* dead screen shows */ }
  }
}

function readDriveInput() {
  return { up: !!keys.up, down: !!keys.down, left: !!keys.left, right: !!keys.right, brake: !!keys.brake };
}

/** On-foot movement: WASD, run with Shift, building collision, aim with mouse. */
function updateOnFoot(dt) {
  const p = G.player;
  const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const running = !!keys.run;
  const speed = running ? runSpeed() : 165;
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my) || 1;
    const nx = p.x + (mx / len) * speed * dt;
    const ny = p.y + (my / len) * speed * dt;
    if (!hitsBuilding(nx, p.y, 10)) p.x = nx;
    if (!hitsBuilding(p.x, ny, 10)) p.y = ny;
    p.x = clamp(p.x, 20, WORLD_W - 20);
    p.y = clamp(p.y, 20, WORLD_H - 20);
    if (running) addXp(0.6 * dt, 'stamina');
    // Face movement, or the mouse while aiming.
    if (G.mouse.down) p.angle = Math.atan2(G.mouse.wy - p.y, G.mouse.wx - p.x);
    else p.angle = Math.atan2(my, mx);
  } else if (G.mouse.down) {
    p.angle = Math.atan2(G.mouse.wy - p.y, G.mouse.wx - p.x);
  }
  // In water on foot: wade slowly back to shore.
  if (inWater(p.x, p.y)) {
    p.x += (p.x < 300 ? 40 : -40) * dt;
    p.x = clamp(p.x, 20, WORLD_W - 20);
  }
}

/** E: enter the nearest vehicle, or step out of the current one. */
function handleEnterExit() {
  const p = G.player;
  if (!p.onFoot) { exitVehicle(); sfx('door'); return; }
  const car = nearestCar(p.x, p.y, 70);
  if (car) { stealCar(car); sfx('door'); return; }
  const boat = nearestBoat(p.x, p.y, 80);
  if (boat) {
    p.boat = boat; p.onFoot = false; boat.occupied = true;
    toast('Naik perahu — ' + boat.name);
    sfx('door');
    return;
  }
  const plane = nearestPlane(p.x, p.y, 90);
  if (plane) { boardPlane(plane); sfx('door'); return; }
}

/** F: shops, safehouses, businesses — whatever is nearest. */
function handleInteract() {
  const p = G.player;
  if (!p.onFoot) return;
  const gun = { x: 2000, y: 1000 };
  const dealer = { x: 2600, y: 3200 };
  if ((p.x - gun.x) ** 2 + (p.y - gun.y) ** 2 < 95 * 95) {
    G.prevMode = 'play'; G.mode = 'shop'; G.ui.shopTab = 'weapons';
    return;
  }
  if ((p.x - dealer.x) ** 2 + (p.y - dealer.y) ** 2 < 95 * 95) {
    G.prevMode = 'play'; G.mode = 'shop'; G.ui.shopTab = 'cars';
    return;
  }
  const sh = nearestSafehouse(p.x, p.y, 90);
  if (sh) { restAtSafehouse(sh); return; }
  const biz = nearestBusinessForSale(p.x, p.y, 90);
  if (biz) {
    const r = buyBusiness(biz.id);
    toast(r.ok ? 'Bisnis dibeli: ' + biz.name : r.why);
    return;
  }
}

/** Work out the one-line context prompt for the HUD. */
function updatePrompt() {
  const p = G.player;
  G.prompt = null;
  if (!p.onFoot) { G.prompt = 'E — keluar kendaraan   •   Space — rem tangan'; return; }
  if (nearestCar(p.x, p.y, 70)) { G.prompt = 'E — curi mobil'; return; }
  if (nearestBoat(p.x, p.y, 80)) { G.prompt = 'E — naik perahu'; return; }
  if (nearestPlane(p.x, p.y, 90)) { G.prompt = 'E — naik pesawat (butuh Lv2)'; return; }
  if ((p.x - 2000) ** 2 + (p.y - 1000) ** 2 < 95 * 95) { G.prompt = 'F — Ironworks (toko senjata)'; return; }
  if ((p.x - 2600) ** 2 + (p.y - 3200) ** 2 < 95 * 95) { G.prompt = 'F — Dealer mobil'; return; }
  if (nearestSafehouse(p.x, p.y, 90)) { G.prompt = 'F — istirahat di safehouse'; return; }
  if (nearestBusinessForSale(p.x, p.y, 90)) { G.prompt = 'F — beli bisnis ini'; return; }
  const ms = G.mission;
  if (!ms.active && ms.index < 14) G.prompt = 'M — buka HP, mulai misi: ' + (ms.title || 'berikutnya');
}

/** Render one frame: world, lighting, minimap, HUD, then any menu on top. */
function render() {
  ctx.clearRect(0, 0, W, H);
  if (G.mode === 'title') {
    drawMenu(ctx, W, H);
    return;
  }
  const cam = { x: Math.round(G.camera.x), y: Math.round(G.camera.y) };
  drawWorld(ctx, cam, W, H);
  drawLighting(ctx, W, H);
  drawMinimap(ctx, W, H);
  drawHud(ctx, W, H);
  if (G.mode !== 'play') drawMenu(ctx, W, H);
}

// Track menu clicks (edge): mousedown sets clicked once.
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) G.mouse.clicked = true;
  if (e.button === 2) G.mouse.right = true;
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 2) G.mouse.right = false;
});

boot();
