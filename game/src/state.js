// SUNSET KEYS v4 — Port Alba: shared game state, constants and small helpers.
// Every system module imports G from here and reads/writes the same world.
export const WORLD_W = 5200;
export const WORLD_H = 3800;
export const TILE = 520; // city block pitch

/** Deterministic seeded random so the city layout is identical every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function angleDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
export function rand(a, b) { return a + Math.random() * (b - a); }
export function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function fmtCash(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

/** The whole game state. main.js creates it fresh each load; save.js serialises it. */
export const G = {
  mode: 'title', // title | play | pause | phone | shop | heistboard | dead | win | garage
  prevMode: 'play',
  time: 17.6, // game hours; 17.6 = golden-hour sunset
  day: 1,
  weather: 'clear', // clear | rain | fog | storm
  weatherTimer: 240,
  cash: 600,
  xp: 0,
  level: 1,
  skills: { driving: 12, shooting: 8, stamina: 10 },
  health: 100,
  armor: 0,
  wanted: 0,
  wantedTimer: 0,
  heat: 0, // police heat from turf activity
  score: 0,
  player: {
    x: 2600, y: 1900, angle: -Math.PI / 2, speed: 0,
    onFoot: true, car: null, boat: null, plane: null,
    weapon: 'pistol', moving: false, running: false,
    invuln: 0, fireCooldown: 0, meleeCooldown: 0,
  },
  weaponsOwned: { pistol: true, smg: false, shotgun: false, rifle: false },
  ammo: { pistol: 60, smg: 0, shotgun: 0, rifle: 0 },
  cars: [], peds: [], cops: [], bullets: [], particles: [], planes: [], boats: [],
  pickups: [], collectibles: [], stunts: [], events: [],
  camera: { x: 2600, y: 1900, zoom: 1, shake: 0 },
  mouse: { x: 0, y: 0, wx: 0, wy: 0, down: false },
  city: null, // built by city.js: roads, buildings, props, districts, airport
  mission: { index: 0, step: 0, active: false, title: '', objective: '', target: null, timer: 0, data: {} },
  story: { flags: {}, heistsDone: 0, ending: null, crewStanding: { vipers: -20, kings: -10, marina: 0 } },
  turf: {}, // districtId -> owner crew
  properties: { safehouses: [], businesses: [] },
  garage: [], // owned car records
  ownedCars: [],
  heistPlan: { heist: 0, crew: [], approach: 'QUIET', prepsDone: [false, false] },
  sideJob: null, // {kind, stage, target, timer, pay}
  dynamicEvent: null,
  radio: { station: 0, on: true, volume: 0.5 },
  toasts: [], // {text, t}
  banner: null, // {title, sub, t}
  saveSlots: [null, null, null],
  stats: { kills: 0, carsStolen: 0, missionsDone: 0, heistsDone: 0, turfTaken: 0, distanceDriven: 0, shotsFired: 0, collected: 0 },
  demo: null, // 'chase' | 'heist' | 'night' | 'airport' when staged for a screenshot
  demoReady: false,
  paused: false,
  showControls: false,
  ui: { shopTab: 'weapons', phoneTab: 'missions', hover: null },
  frame: 0,
};

/** Push a short toast message (top centre). */
export function toast(text) {
  G.toasts.push({ text, t: 4 });
  if (G.toasts.length > 4) G.toasts.shift();
}

/** Big centre banner, e.g. mission start / wanted up. */
export function banner(title, sub) {
  G.banner = { title, sub: sub || '', t: 3.2 };
}

/** Add XP; levels up at 100 * level XP and unlocks gear/missions. */
export function addXp(n, skill) {
  G.xp += n;
  if (skill && G.skills[skill] !== undefined) G.skills[skill] = clamp(G.skills[skill] + n * 0.02, 0, 100);
  const need = 100 * G.level;
  if (G.xp >= need) {
    G.xp -= need;
    G.level++;
    toast('LEVEL UP — Level ' + G.level + ' reached');
    banner('LEVEL ' + G.level, 'New gear and missions unlocked');
  }
}

/** Raise the wanted level (0-5) and reset its decay timer. */
export function raiseWanted(n) {
  G.wanted = clamp(G.wanted + n, 0, 5);
  G.wantedTimer = 0;
  if (n > 0) addXp(2, 'shooting');
}
