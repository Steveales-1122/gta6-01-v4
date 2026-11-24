// economy.js — cash, passive income from businesses and turf, hourly ticks.
import { G, addCash, addMessage } from './state.js';
import { turfCounts } from './districts.js';

export function businessIncomePerHour() {
  return G.businesses.filter((b) => b.owned).reduce((n, b) => n + b.income, 0);
}
export function turfIncomePerHour() {
  return turfCounts().Player * 150;
}
export function hourlyIncome() { return businessIncomePerHour() + turfIncomePerHour(); }
export function collectHourlyIncome() {
  const n = hourlyIncome();
  if (n > 0) { addCash(n); addMessage('Passive income +$' + n + ' (businesses + turf)', '#7fff9e'); }
}
export function buyBusiness(id) {
  const b = G.businesses.find((x) => x.id === id);
  if (!b || b.owned) return false;
  if (G.cash < b.price) { addMessage('Need $' + b.price + ' for ' + b.name, '#ff6666'); return false; }
  G.cash -= b.price; b.owned = true;
  addMessage('You own ' + b.name + ' — +$' + b.income + '/game hour', '#ffd700');
  return true;
}
export function buySafehouse(id) {
  const s = G.safehouses.find((x) => x.id === id);
  if (!s || s.owned) return false;
  if (G.cash < s.price) { addMessage('Need $' + s.price + ' for ' + s.name, '#ff6666'); return false; }
  G.cash -= s.price; s.owned = true;
  addMessage('Safehouse bought: ' + s.name + ' — rest here to heal and save', '#ffd700');
  return true;
}
