// garage.js — buy cars, repaint, tune in 3 stages, deliver a car to the player.
import { G, CAR_MODELS, addMessage } from './state.js';
import { spawnCar } from './vehicles.js';

export const PAINTS = ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1', '#111111'];
export const TUNE_STAGES = [0, 1500, 3500, 7000];
export function buyGarageCar(modelId) {
  const m = CAR_MODELS.find((c) => c.id === modelId);
  if (!m || m.price === 0) return false;
  if (G.cash < m.price) { addMessage('Need $' + m.price + ' for ' + m.name, '#ff6666'); return false; }
  G.cash -= m.price;
  G.garageCars.push({ model: m.id, color: m.color, tune: 0, paint: m.color });
  addMessage('Bought ' + m.name + ' — in your garage', '#7fff9e');
  return true;
}
export function repaintCar(index, color) {
  const c = G.garageCars[index];
  if (!c || G.cash < 300) { addMessage('Repaint costs $300', '#ff6666'); return false; }
  G.cash -= 300; c.paint = color; c.color = color;
  return true;
}
export function tuneCar(index) {
  const c = G.garageCars[index];
  if (!c || c.tune >= 3) return false;
  const cost = TUNE_STAGES[c.tune + 1];
  if (G.cash < cost) { addMessage('Tune stage ' + (c.tune + 1) + ' costs $' + cost, '#ff6666'); return false; }
  G.cash -= cost; c.tune++;
  addMessage('Tuned to stage ' + c.tune + ' (+12% speed)', '#7fff9e');
  return true;
}
export function deliverCar(index) {
  const c = G.garageCars[index];
  if (!c) return false;
  const p = G.player;
  const car = spawnCar(p.x + 60, p.y + 40, c.model, true, c.paint);
  car.tune = c.tune;
  addMessage(c.model + ' delivered to you', '#7fff9e');
  return car;
}
