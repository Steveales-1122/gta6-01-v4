# gta6-01-v4
[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Steveales-1122/gta6-01-v4/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Steveales-1122/gta6-01-v4/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**SUNSET KEYS v4 — Port Alba**: an original open-world crime game in the browser. You are Ray "Kunci" Marlowe, a getaway driver back in Port Alba after five years away. Six districts, 14 story missions, 3 planned heists, a turf war, businesses, a garage, planes, boats, and a living city — all drawn and synthesized in code, no assets borrowed from anywhere.

## How to play

Open `game/index.html` with any static server (`node serve.ts` → http://localhost:8080) and play with keyboard + mouse. No network, no install.

| Key | Action |
| --- | --- |
| WASD | Walk / drive |
| Shift | Run |
| Mouse + click | Aim / shoot (right-click: melee) |
| E | Enter or exit a car, boat or plane |
| F | Interact (gun shop, car dealer, safehouse, business) |
| 1–4 | Switch weapon |
| R | Change radio station |
| M | Phone (missions, side jobs, save) |
| Tab | Heist planning board |
| P / Esc | Pause |
| Space | Handbrake |

## What is new in v4 (vs v3)

- **Economy + progression**: cash from missions and jobs, XP, and three skill tracks (Driving, Shooting, Stamina) that grow by doing; levels unlock gear, planes and missions.
- **Properties & businesses**: buy safehouses (save + heal + garage slot) and businesses (workshop, taxi firm, arcade) that pay passive income every game hour.
- **Garage**: buy cars at the dealer, store them, repaint them, tune engines in three stages, and have any owned car delivered to you.
- **Gun shop "Ironworks"**: pistol, SMG, shotgun, rifle, ammo and body armour; combat with building cover, flanking gang AI and melee.
- **Turf war**: three rival crews (Vipers, Kings, Marina Boys) hold the districts; turf missions flip ownership, owned turf pays hourly income and raises police heat.
- **Heist planning**: three big heists (Airport Cargo, Harbor Vault, Alba Casino) with a planning board — pick a crew, pick an approach (LOUD / QUIET / SNEAK), finish two prep missions first. The final approach + turf standing decide one of three endings.
- **Airport + planes**: Alba International is the sixth district — board a plane, take off from the runway and fly over the whole city.
- **Side activities**: taxi fares, vigilante hunts, paramedic runs, stunt jumps, 24 hidden packages, and random dynamic events (street robberies, police chases, armored vans, street racers).
- **Story**: 14 missions with a branching cast (Lena, Dino, Sarge, Snake, Marco Bell) and three endings.
- **World & feel**: richer lighting (dynamic shadows, night neon, water reflections), rain / fog / storm weather, a full day-night cycle, a procedural WebAudio soundtrack with three radio stations, a circular minimap with turf colours, and 3-slot saves.

## Structure

- `game/src/main.js` — game loop, player control, prompts, camera
- `game/src/state.js` — shared game state and helpers
- `game/src/city.js` — city generation (roads, buildings, districts)
- `game/src/districts.js` — district + turf data
- `game/src/vehicles.js` — car physics, stealing, damage
- `game/src/planes.js` — airport planes and flight
- `game/src/boats.js` — marina boats
- `game/src/pedestrians.js` — pedestrians and gang AI
- `game/src/traffic.js` — ambient traffic
- `game/src/police.js` — wanted 0–5, cop cars, foot cops, helicopter
- `game/src/combat.js` — shooting, melee, bullets, cover
- `game/src/weapons.js` — Ironworks catalogue
- `game/src/missions.js` — the 14-mission engine
- `game/src/heists.js` — heist planning board and runs
- `game/src/turf.js` — turf war
- `game/src/economy.js` — cash flow and passive income
- `game/src/properties.js` — safehouses and businesses
- `game/src/garage.js` — owned cars, paint, tuning
- `game/src/progression.js` — XP, levels, skills
- `game/src/sidejobs.js` — taxi, vigilante, paramedic
- `game/src/events.js` — dynamic city events
- `game/src/daynight.js` — day/night cycle and lighting
- `game/src/weather.js` — rain, fog, storms
- `game/src/water.js` — bay and marina rendering
- `game/src/render.js` — world renderer
- `game/src/effects.js` — particles, neon, lighting overlay
- `game/src/audio.js` — procedural WebAudio SFX
- `game/src/radio.js` — three procedural radio stations
- `game/src/hud.js` — HUD (cash, XP, health, wanted stars, tracker)
- `game/src/minimap.js` — circular live minimap
- `game/src/save.js` — 3-slot localStorage saves
- `game/src/story.js` — characters, missions, endings
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — screenshot scene staging (`?demo=chase|heist|night|airport`)
- `main.ts` — the make.fun entry program (Node 22 stdlib only)

## License

MIT — see `LICENSE`.
