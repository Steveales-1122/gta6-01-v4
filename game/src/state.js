// state.js — one shared game state object every system reads and writes.
// SUNSET KEYS v4 — Port Alba. All names, characters and places are original.
export const WORLD_W = 3600;
export const WORLD_H = 2400;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown Alba', x: 1200, y: 700, w: 1200, h: 800, color: '#3a4a6b', turf: 'Vipers' },
  { id: 'marina', name: 'Marina Keys', x: 2400, y: 1400, w: 1000, h: 800, color: '#2e6f7a', turf: 'Marina Boys' },
  { id: 'beach', name: 'Alba Beach', x: 200, y: 1500, w: 1000, h: 700, color: '#c98a4b', turf: 'Player' },
  { id: 'hills', name: 'North Hills', x: 200, y: 200, w: 1000, h: 600, color: '#4a6b3a', turf: 'Kings' },
  { id: 'portside', name: 'Portside', x: 2400, y: 200, w: 1000, h: 600, color: '#6b4a3a', turf: 'Vipers' },
  { id: 'airport', name: 'Alba International', x: 1200, y: 1500, w: 1200, h: 700, color: '#555a6e', turf: 'Player' },
];

export const WEAPONS = {
  fists: { name: 'Fists', damage: 12, rate: 0.35, range: 46, price: 0, ammoPrice: 0, auto: false },
  pistol: { name: 'P9 Pistol', damage: 22, rate: 0.28, range: 420, price: 350, ammoPrice: 40, auto: false },
  smg: { name: 'VK-9 SMG', damage: 14, rate: 0.09, range: 380, price: 1200, ammoPrice: 90, auto: true },
  shotgun: { name: 'Riot-12 Shotgun', damage: 55, rate: 0.8, range: 260, price: 1800, ammoPrice: 120, auto: false },
  rifle: { name: 'AR-77 Rifle', damage: 38, rate: 0.12, range: 620, price: 3500, ammoPrice: 150, auto: true },
};

export const CAR_MODELS = [
  { id: 'sedan', name: 'Alba Sedan', top: 340, accel: 260, color: '#c0392b', price: 0 },
  { id: 'taxi', name: 'Key Cab', top: 320, accel: 240, color: '#f1c40f', price: 800 },
  { id: 'sport', name: 'Vento GT', top: 520, accel: 420, color: '#2980b9', price: 12000 },
  { id: 'truck', name: 'Hauler Truck', top: 280, accel: 180, color: '#7f8c8d', price: 6000 },
  { id: 'muscle', name: 'Raptor Muscle', top: 460, accel: 360, color: '#8e44ad', price: 9000 },
  { id: 'cop', name: 'APD Interceptor', top: 500, accel: 400, color: '#2c3e50', price: 0 },
];

export const G = {
  mode: 'title', // title | play | pause | shop | garage | heist | dead | win | controls
  paused: false,
  time: 17 * 60 + 20, // game clock minutes (sunset start)
  day: 1,
  weather: 'clear', // clear | rain | fog | storm
  weatherTimer: 0,
  cash: 500,
  bank: 0,
  xp: 0,
  level: 1,
  skills: { driving: 0, shooting: 0, stamina: 0 },
  wanted: 0,
  wantedTimer: 0,
  heat: 0,
  player: {
    x: 1800, y: 1100, angle: 0, hp: 100, armor: 0,
    weapon: 'pistol', ammo: { pistol: 60, smg: 0, shotgun: 0, rifle: 0 },
    ownedWeapons: ['fists', 'pistol'],
    inVehicle: null, onPlane: null, onBoat: null,
    speed: 0, running: false, lastShot: 0, meleeCd: 0,
  },
  camera: { x: 1800, y: 1100 },
  cars: [], traffic: [], peds: [], police: [], heli: null,
  planes: [], boats: [],
  enemies: [], bullets: [], particles: [], pickups: [],
  buildings: [], roads: [], trees: [], packages: [], jumps: [],
  turf: { downtown: 'Vipers', marina: 'Marina Boys', beach: 'Player', hills: 'Kings', portside: 'Vipers', airport: 'Player' },
  turfIncome: 0,
  safehouses: [
    { id: 'beach', name: 'Beach Shack', x: 500, y: 1850, owned: true, price: 0 },
    { id: 'downtown', name: 'Downtown Loft', x: 1700, y: 900, owned: false, price: 8000 },
    { id: 'hills', name: 'Hills Villa', x: 600, y: 400, owned: false, price: 25000 },
  ],
  businesses: [
    { id: 'garagebiz', name: 'Sunset Auto Works', x: 1500, y: 1300, owned: false, price: 12000, income: 320 },
    { id: 'taxi', name: 'Key Cab Firm', x: 2100, y: 1000, owned: false, price: 9000, income: 240 },
    { id: 'arcade', name: 'Neon Arcade', x: 1900, y: 1500, owned: false, price: 15000, income: 410 },
  ],
  garageCars: [
    { model: 'sedan', color: '#c0392b', tune: 0, paint: '#c0392b' },
  ],
  mission: { index: 0, stage: 0, active: false, title: '', objective: '', target: null, timer: 0, done: [] },
  heists: {
    cargo: { name: 'Kargo Bandara', unlocked: false, preps: 0, approach: null, crew: null, done: false },
    vault: { name: 'Brankas Pelabuhan', unlocked: false, preps: 0, approach: null, crew: null, done: false },
    casino: { name: 'Kasino Alba', unlocked: false, preps: 0, approach: null, crew: null, done: false },
  },
  heistBoard: { selected: 'cargo', approach: 'LOUD', crew: 'solo' },
  sidejob: { type: null, fare: 0, target: null, timer: 0, done: 0 },
  stats: { kills: 0, carsStolen: 0, missionsDone: 0, packagesFound: 0, jumpsDone: 0, moneyEarned: 0 },
  radio: { station: 0, on: true },
  messages: [],
  objective: 'Talk to Mara at the Beach Shack',
  ending: null,
  demo: null,
  muted: false,
  shake: 0,
  flash: 0,
};

export function addMessage(text, color = '#fff') {
  G.messages.unshift({ text, color, t: 6 });
  if (G.messages.length > 5) G.messages.pop();
}
export function addCash(n) { G.cash += n; if (n > 0) G.stats.moneyEarned += n; }
export function addXp(n, skill) {
  G.xp += n;
  if (skill) G.skills[skill] = (G.skills[skill] || 0) + n;
  const need = G.level * 400;
  if (G.xp >= need) { G.level++; G.xp -= need; addMessage('LEVEL UP! Level ' + G.level + ' — new gear unlocked', '#ffd700'); }
}
export function setWanted(n) { G.wanted = clamp(n, 0, 5); G.wantedTimer = 0; }
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return DISTRICTS[0];
}
