// SUNSET KEYS v4 — screenshot staging: ?demo=chase|heist|night|airport.
// Each demo puts the live game into a dense, readable scene (real gameplay state,
// never a static mock) so the screenshots show the systems at their best.
// The game itself implements the staging; this file only sets state.
import { G, toast, banner } from './state.js';
import { makeCar } from './vehicles.js';
import { makePed } from './pedestrians.js';
import { startMission } from './missions.js';
import { WEAPONS } from './weapons.js';

/** Stage one demo scene. Called from main.js before the first frame. */
export function stageDemo(demo) {
  G.demo = demo;
  G.mode = 'play';
  // Common: a lived-in street — traffic, peds, a couple of parked cars.
  seedStreet(2600, 1900);
  if (demo === 'chase') stageChase();
  else if (demo === 'heist') stageHeist();
  else if (demo === 'night') stageNight();
  else if (demo === 'airport') stageAirport();
  else stageChase();
  G.camera.x = G.player.x - 640;
  G.camera.y = G.player.y - 400;
}

/** Fill the area around (x,y) with traffic cars and pedestrians. */
function seedStreet(x, y) {
  for (let i = 0; i < 10; i++) {
    const car = makeCar(x + (Math.random() - 0.5) * 1400, y + (Math.random() - 0.5) * 1000, Math.random() * Math.PI * 2, Math.floor(Math.random() * 7), 'npc');
    car.speed = 120 + Math.random() * 80;
    car.dir = car.angle;
    G.cars.push(car);
  }
  for (let i = 0; i < 22; i++) {
    G.peds.push(makePed(x + (Math.random() - 0.5) * 1200, y + (Math.random() - 0.5) * 900));
  }
}

/** COVER — sunset wanted-5 chase: player in a Falcon, 3 cop cars, heli + searchlight. */
function stageChase() {
  G.time = 17.8;
  G.weather = 'clear';
  const car = makeCar(2340, 1150, -Math.PI / 2, 5, 'player'); // Falcon super
  car.color = '#c0392b';
  car.speed = 320;
  G.cars.push(car);
  G.player.car = car;
  G.player.onFoot = false;
  G.player.x = car.x; G.player.y = car.y; G.player.angle = car.angle;
  G.wanted = 5;
  G.cash = 12480;
  G.level = 3;
  G.xp = 240;
  G.health = 82; G.armor = 60;
  G.skills = { driving: 64, shooting: 52, stamina: 38 };
  // Race mission active: objective marker + tracker visible.
  startMission(4);
  G.mission.title = 'Balapan Sunset';
  // Cop cars closing in + helicopter.
  for (let i = 0; i < 3; i++) {
    const cop = makeCar(2340 + (i - 1) * 160, 1150 + 320 + i * 60, -Math.PI / 2, 0, 'cop');
    cop.color = '#1c2b3a';
    cop.maxSpeed = 500;
    cop.speed = 300;
    G.cars.push(cop);
  }
  G.heli = { x: 2500, y: 900, angle: 0, alt: 200, searchAngle: 0.6, shootT: 3 };
  G.turf = { downtown: 'player', heights: 'kings', airport: 'none', marina: 'marina', oldtown: 'player', industrial: 'kings' };
  banner('BALAPAN SUNSET', 'Checkpoint 1/4 — polisi di belakangmu!');
}

/** Heist planning board: vault heist, preps done, crew picked, QUIET approach. */
function stageHeist() {
  G.time = 11.2;
  G.weather = 'clear';
  G.player.x = 900; G.player.y = 500;
  G.cash = 8200;
  G.level = 3;
  G.heistPlan.heist = 1;
  G.heistPlan.prepsDone = [true, true];
  G.heistPlan.crew = [
    { id: 'dino', name: 'Dino Varga', role: 'Driver', skill: 'Kabur cepat', cut: 0.10 },
    { id: 'lena', name: 'Lena Marlowe', role: 'Hacker', skill: 'Matikan alarm', cut: 0.10 },
    { id: 'nadia', name: 'Nadia Sorel', role: 'Infiltrator', skill: 'Masuk tanpa suara', cut: 0.12 },
  ];
  G.heistPlan.approach = 'QUIET';
  G.mode = 'heistboard';
  G.prevMode = 'play';
}

/** Night turf war in the rain: neon, gang shootout, cops closing in. */
function stageNight() {
  G.time = 22.4;
  G.weather = 'rain';
  G.player.x = 1300; G.player.y = 2100;
  G.player.onFoot = true;
  G.player.weapon = 'rifle';
  G.weaponsOwned = { pistol: true, smg: true, shotgun: true, rifle: true };
  G.ammo = { pistol: 60, smg: 120, shotgun: 24, rifle: 90 };
  G.wanted = 3;
  G.health = 74; G.armor = 45;
  G.cash = 5400;
  G.level = 3;
  G.skills = { driving: 48, shooting: 71, stamina: 44 };
  seedStreet(1300, 2100);
  // Turf war: Vipers gang holding Old Town, shooting.
  for (let i = 0; i < 7; i++) {
    const ped = makePed(1300 + (Math.random() - 0.5) * 500, 2100 + (Math.random() - 0.5) * 420, { state: 'gang', gang: 'vipers' });
    ped.hp = 80;
    G.peds.push(ped);
  }
  G.mission.active = true;
  G.mission.index = 5; // m6 'Perang Turf: Old Town' — so the engine treats it as turf
  G.mission.title = 'Perang Turf: Old Town';
  G.mission.objective = 'Kalahkan Vipers di Old Town (6 orang)';
  G.mission.target = { x: 1300, y: 2100 };
  G.mission.data = { kills: 3, need: 6, turf: 'oldtown' };
  G.turf = { downtown: 'player', heights: 'kings', airport: 'none', marina: 'marina', oldtown: 'vipers', industrial: 'kings' };
  const cop = makeCar(1500, 2400, -Math.PI / 2, 0, 'cop');
  cop.color = '#1c2b3a';
  G.cars.push(cop);
  G.bullets.push({ x: 1200, y: 2000, angle: 0.4, speed: 600, dmg: 10, from: 'gang', t: 0.8 });
  G.bullets.push({ x: 1400, y: 2200, angle: 2.6, speed: 600, dmg: 10, from: 'gang', t: 0.8 });
  banner('PERANG TURF', 'Old Town — milik Vipers');
}

/** Airport: the player flying low over the runway in the Sky Jet, garage car below. */
function stageAirport() {
  G.time = 10.2;
  G.weather = 'clear';
  G.cash = 15600;
  G.level = 3;
  G.player.x = 4425; G.player.y = 700;
  // Player jet parked on runway 1, nose up the runway (ready for takeoff;
  // kept still so the shot stays on the runway, terminal and tower).
  const plane = G.planes[1]; // Sky Jet
  plane.x = 4425; plane.y = 700; plane.angle = -Math.PI / 2; plane.speed = 0; plane.alt = 0;
  plane.occupied = true;
  G.player.plane = plane;
  G.player.onFoot = false;
  G.player.x = plane.x; G.player.y = plane.y;
  // Owned Falcon parked on the tarmac by the terminal + a taxi on the airport road.
  const owned = makeCar(4330, 820, 0, 5, 'player');
  owned.color = '#f1c40f';
  G.cars.push(owned);
  G.ownedCars.push({ model: 'Falcon', color: '#f1c40f', plate: 'ALB-417', engine: 2, price: 5200 });
  // Fly mission shown but not completable during staging (target null).
  G.mission.active = true;
  G.mission.index = 12;
  G.mission.title = 'Terbang Malam';
  G.mission.objective = 'Terbangkan pesawat kargo — hindari radar';
  G.mission.target = null;
  G.mission.data = {};
  toast('Alba International — lepas landas!');
  void WEAPONS;
}
