// SUNSET KEYS v4 — garage: buy, own, store and customise cars.
// Owned cars live in the garage list; the player can spawn any owned car at the
// nearest safehouse, repaint it, and tune its engine in three stages.
import { G, fmtCash, toast } from './state.js';
import { CAR_MODELS, makeCar } from './vehicles.js';
import { spend } from './economy.js';

export const PAINTS = [
  { name: 'Merah Sunset', color: '#c0392b', price: 150 },
  { name: 'Biru Laut', color: '#2980b9', price: 150 },
  { name: 'Emas Alba', color: '#f1c40f', price: 300 },
  { name: 'Ungu Neon', color: '#8e44ad', price: 300 },
  { name: 'Hitam Matte', color: '#1a1a1a', price: 250 },
  { name: 'Putih Mutiara', color: '#ecf0f1', price: 250 },
];

export const ENGINE_STAGES = [
  { stage: 0, name: 'Standar', price: 0 },
  { stage: 1, name: 'Turbo I', price: 800 },
  { stage: 2, name: 'Turbo II', price: 2000 },
  { stage: 3, name: 'Turbo III', price: 4500 },
];

/** Buy a car model from the dealership into the garage. */
export function buyCar(modelIdx) {
  const m = CAR_MODELS[modelIdx];
  if (!m) return { ok: false, why: 'Model tidak ada' };
  if (!spend(m.price)) return { ok: false, why: 'Uang kurang' };
  const rec = { ...m, modelIdx, engine: 0, owned: true, plate: 'ALB-' + Math.floor(100 + Math.random() * 900) };
  G.ownedCars.push(rec);
  G.garage.push(rec);
  toast('Mobil dibeli — ' + m.model + ' (' + rec.plate + ')');
  return { ok: true };
}

/** Repaint an owned car. */
export function repaintCar(rec, paintIdx) {
  const paint = PAINTS[paintIdx];
  if (!paint) return { ok: false, why: 'Cat tidak ada' };
  if (!spend(paint.price)) return { ok: false, why: 'Uang kurang' };
  rec.color = paint.color;
  toast('Cat baru: ' + paint.name);
  return { ok: true };
}

/** Tune an owned car's engine to the next stage. */
export function tuneCar(rec) {
  const next = ENGINE_STAGES[(rec.engine || 0) + 1];
  if (!next) return { ok: false, why: 'Sudah maksimal' };
  if (!spend(next.price)) return { ok: false, why: 'Uang kurang' };
  rec.engine = next.stage;
  toast('Mesin naik ke ' + next.name);
  return { ok: true };
}

/** Spawn an owned car next to the player (garage delivery). */
export function deliverCar(rec) {
  const car = makeCar(G.player.x + 90, G.player.y + 40, G.player.angle, rec.modelIdx, 'player');
  car.color = rec.color;
  car.engine = rec.engine || 0;
  car.plate = rec.plate;
  G.cars.push(car);
  return car;
}

/** How many garage slots the player has (1 base + 1 per safehouse). */
export function garageSlots() {
  return 1 + G.properties.safehouses.length;
}
