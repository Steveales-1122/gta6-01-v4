// SUNSET KEYS v4 — dynamic events: street robberies, police chases against NPCs,
// armored vans and wandering street racers. Events spawn near the player, pay out
// when resolved, and keep the city unpredictable.
import { G, toast, banner, rand, pick } from './state.js';
import { makePed } from './pedestrians.js';
import { spawnTrafficCar } from './vehicles.js';
import { payPlayer } from './economy.js';
import { addXp } from './state.js';

const EVENT_TYPES = ['robbery', 'chase', 'van', 'racer'];

/** Roll a random event every couple of minutes when the player is free-roaming. */
export function tickEvents(dt) {
  G.eventTimer = (G.eventTimer || 100) - dt;
  if (G.eventTimer > 0 || G.dynamicEvent || G.mission.active) return;
  G.eventTimer = 110 + Math.random() * 90;
  spawnEvent(pick(EVENT_TYPES));
}

/** Spawn one dynamic event near the player. */
export function spawnEvent(kind) {
  const p = G.player;
  if (kind === 'robbery') {
    const robber = makePed(p.x + rand(-260, 260), p.y + rand(-260, 260), { state: 'gang', gang: null });
    robber.hp = 50; robber.robber = true;
    G.peds.push(robber);
    G.dynamicEvent = { kind, robber, timer: 60, pay: 250 };
    banner('PERAMPOKAN JALANAN', 'Perampok kabur — tangkap dia untuk hadiah $250');
  } else if (kind === 'chase') {
    const car = spawnTrafficCar(p.x + rand(-400, 400), p.y + rand(-400, 400), rand(0, Math.PI * 2));
    car.fleeing = true;
    car.speed = 380;
    G.dynamicEvent = { kind, car, timer: 45, pay: 300 };
    banner('KEJAR-KEJARAN POLISI', 'Polisi mengejar mobil kabur — bantu hentikan untuk $300');
  } else if (kind === 'van') {
    const car = spawnTrafficCar(p.x + rand(-300, 300), p.y + rand(-300, 300), rand(0, Math.PI * 2));
    car.van = true; car.color = '#3a4a3a'; car.len = 64; car.wid = 28;
    G.dynamicEvent = { kind, car, timer: 90, pay: 600 };
    banner('TRUK UANG', 'Truk uang melintas — rampok untuk $600 (wanted naik!)');
  } else {
    const car = spawnTrafficCar(p.x + rand(-300, 300), p.y + rand(-300, 300), rand(0, Math.PI * 2));
    car.racer = true; car.color = '#e74c3c'; car.speed = 420;
    G.dynamicEvent = { kind, car, timer: 40, pay: 350 };
    banner('PEMBALAP LIAR', 'Pembalap liar menantangmu — kalahkan dia di jalanan ($350)');
  }
}

/** Per-frame event logic: timers and resolution checks. */
export function updateEvents(dt) {
  const ev = G.dynamicEvent;
  if (!ev) return;
  ev.timer -= dt;
  if (ev.timer <= 0) { G.dynamicEvent = null; toast('Event lewat — kesempatan hilang'); return; }
  if (ev.kind === 'robbery' && ev.robber && ev.robber.dead) resolveEvent();
  if ((ev.kind === 'chase' || ev.kind === 'van' || ev.kind === 'racer') && ev.car) {
    const d = Math.hypot(G.player.x - ev.car.x, G.player.y - ev.car.y);
    if (ev.car.hp <= 0 || d < 40) resolveEvent();
  }
}

function resolveEvent() {
  const ev = G.dynamicEvent;
  G.dynamicEvent = null;
  if (!ev) return;
  payPlayer(ev.pay, 'Event selesai');
  addXp(20, 'driving');
  if (ev.kind === 'van') {
    G.wanted = Math.min(5, G.wanted + 2);
    toast('Wanted naik — perampokan truk uang!');
  }
}
