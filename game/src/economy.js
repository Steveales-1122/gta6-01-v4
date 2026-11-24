// SUNSET KEYS v4 — economy: cash flow, payouts, passive income and the HUD's
// money ticker. Missions, side jobs, turf and businesses all pay into one wallet;
// the shop, garage and properties all draw from it.
import { G, fmtCash, toast } from './state.js';
import { turfIncomePerHour } from './districts.js';

/** Passive income per game hour: businesses + turf + nothing else. */
export function passiveIncomePerHour() {
  let n = turfIncomePerHour();
  for (const b of G.properties.businesses) n += b.income;
  return n;
}

/** Tick the economy once per game hour: pay passive income, charge nothing. */
export function tickEconomy() {
  const income = passiveIncomePerHour();
  if (income > 0) {
    G.cash += income;
    toast('Penghasilan pasif + ' + fmtCash(income) + ' / jam');
  }
}

/** Pay the player for a completed mission or job. */
export function payPlayer(amount, reason) {
  G.cash += amount;
  toast(fmtCash(amount) + ' — ' + reason);
}

/** Spend cash; returns false when the player cannot afford it. */
export function spend(amount) {
  if (G.cash < amount) return false;
  G.cash -= amount;
  return true;
}

/** Net worth for the stats screen: cash + cars + properties. */
export function netWorth() {
  let n = G.cash;
  for (const c of G.ownedCars) n += c.price || 0;
  for (const s of G.properties.safehouses) n += s.price || 0;
  for (const b of G.properties.businesses) n += b.price || 0;
  return n;
}
