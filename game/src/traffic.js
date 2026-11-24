// SUNSET KEYS v4 — traffic: ambient cars that cruise the road grid, stop at the
// player, honk, and panic-scatter when shots are fired nearby.
import { G, rand, clamp } from './state.js';
import { onRoad, nearestRoadPoint } from './city.js';
import { spawnTrafficCar, makeCar } from './vehicles.js';
import { trafficDensity } from './daynight.js';

/** Keep the road network populated near the camera; despawn far cars. */
export function updateTraffic(dt) {
  const target = Math.floor(14 * trafficDensity());
  // Despawn cars far from the camera.
  for (let i = G.cars.length - 1; i >= 0; i--) {
    const c = G.cars[i];
    if (c.owner !== 'npc') continue;
    const d = (c.x - G.camera.x) ** 2 + (c.y - G.camera.y) ** 2;
    if (d > 1600 * 1600) G.cars.splice(i, 1);
  }
  const npcCount = G.cars.filter((c) => c.owner === 'npc').length;
  if (npcCount < target && Math.random() < dt * 3) {
    const pt = nearestRoadPoint(G.camera.x + rand(-900, 900), G.camera.y + rand(-700, 700));
    if (pt) {
      const car = spawnTrafficCar(pt.x, pt.y, pt.angle);
      car.dir = Math.random() < 0.5 ? pt.angle : pt.angle + Math.PI;
      car.angle = car.dir;
    }
  }
  // Panic: NPC cars near fresh gunfire swerve away.
  if (G.bullets.length > 0) {
    for (const c of G.cars) {
      if (c.owner !== 'npc') continue;
      const d = (c.x - G.player.x) ** 2 + (c.y - G.player.y) ** 2;
      if (d < 300 * 300) c.speed = clamp(c.speed + 120 * dt, 0, 320);
    }
  }
}
