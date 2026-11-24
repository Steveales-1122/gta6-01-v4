// shots.js — demo staging for screenshots: ?demo=chase|heist|night|airport sets a rich scene.
import { G, setWanted } from './state.js';
import { spawnEnemy } from './combat.js';
import { spawnCar } from './vehicles.js';

export function applyDemo(demo) {
  G.demo = demo;
  G.mode = 'play';
  const p = G.player;
  if (demo === 'chase') {
    G.time = 17 * 60 + 45; G.weather = 'clear'; G.weatherTimer = 9999;
    p.x = 1800; p.y = 1100;
    const car = spawnCar(p.x, p.y, 'sport', true, '#2980b9');
    car.tune = 2;
    p.inVehicle = car; car.driver = 'player';
    setWanted(5);
    G.mission.active = true; G.mission.title = '7. The Getaway';
    G.mission.objective = 'Lose the cops — reach North Hills';
    G.mission.target = { x: 600, y: 400 };
    G.objective = '7. The Getaway — lose a 5-star wanted level';
    G.cash = 15400; G.level = 6; G.xp = 900;
    G.player.hp = 78; G.player.armor = 60;
  } else if (demo === 'heist') {
    G.time = 20 * 60 + 10; G.weather = 'clear'; G.weatherTimer = 9999;
    p.x = 2050; p.y = 950;
    G.mode = 'heist';
    G.heists.cargo.unlocked = true; G.heists.cargo.preps = 2;
    G.heists.vault.unlocked = true; G.heists.vault.preps = 1;
    G.heists.casino.unlocked = true; G.heists.casino.preps = 0;
    G.heistBoard.selected = 'casino'; G.heistBoard.approach = 'SNEAK'; G.heistBoard.crew = 'both';
    G.cash = 22300; G.level = 8; G.xp = 1400;
    spawnEnemy(1980, 900, 'Vipers', 60); spawnEnemy(2120, 1000, 'Vipers', 60);
  } else if (demo === 'night') {
    G.time = 22 * 60 + 15; G.weather = 'rain'; G.weatherTimer = 9999;
    p.x = 1700; p.y = 1000;
    setWanted(3);
    for (let i = 0; i < 5; i++) spawnEnemy(1700 + (Math.random() - 0.5) * 300, 1000 + (Math.random() - 0.5) * 300, 'Vipers', 70);
    G.mission.active = true; G.mission.title = '8. Turf: Downtown';
    G.mission.objective = 'Defeat the Vipers holding Downtown';
    G.mission.target = { x: 1700, y: 1000 };
    G.objective = '8. Turf: Downtown — clear the Vipers (5 left)';
    G.cash = 9800; G.level = 5; G.xp = 700;
    G.player.weapon = 'smg'; G.player.ownedWeapons = ['fists', 'pistol', 'smg'];
    G.player.ammo.smg = 120;
  } else if (demo === 'airport') {
    G.time = 9 * 60 + 30; G.weather = 'clear'; G.weatherTimer = 9999;
    p.x = 1650; p.y = 1850;
    G.cash = 31200; G.level = 9; G.xp = 2000;
    G.garageCars.push({ model: 'sport', color: '#8e44ad', tune: 3, paint: '#8e44ad' });
    const car = spawnCar(1600, 1900, 'sport', true, '#8e44ad');
    car.tune = 3;
    G.mission.active = true; G.mission.title = '4. Wheels Up';
    G.mission.objective = 'Fly the Duster out of Alba International';
    G.mission.target = { x: 1500, y: 1900 };
    G.objective = '4. Wheels Up — board a plane at Alba International';
  }
  G.camera.x = p.x; G.camera.y = p.y;
}
