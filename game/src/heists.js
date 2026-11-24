// SUNSET KEYS v4 — heist planning: 3 big heists with a planning board.
// Each heist needs 2 prep missions, a crew pick (driver / hacker / muscle) and an
// approach (LOUD / QUIET / SNEAK). The approach changes the final mission's
// wanted level, payouts and the story ending.
import { G, toast, banner, fmtCash } from './state.js';
import { completeMission } from './missions.js';

export const HEISTS = [
  {
    id: 'cargo', name: 'Kargo Bandara', target: 'Gudang kargo Alba International', basePay: 2500,
    preps: ['Curi denah kargo', 'Sabotase kamera terminal'],
    vault: { x: 4460, y: 760 }, approachPay: { LOUD: 1.0, QUIET: 1.25, SNEAK: 1.5 },
    approachWanted: { LOUD: 4, QUIET: 2, SNEAK: 1 },
  },
  {
    id: 'harbor', name: 'Brankas Pelabuhan', target: 'Brankas pelabuhan Marina Bay', basePay: 4000,
    preps: ['Bajak truk uang', 'Matikan alarm dermaga'],
    vault: { x: 520, y: 1900 }, approachPay: { LOUD: 1.0, QUIET: 1.25, SNEAK: 1.5 },
    approachWanted: { LOUD: 4, QUIET: 3, SNEAK: 1 },
  },
  {
    id: 'casino', name: 'Kasino Alba', target: 'Ruang brankas Kasino Alba, Downtown', basePay: 8000,
    preps: ['Sewa suite pengalih', 'Salin kunci master'],
    vault: { x: 2340, y: 690 }, approachPay: { LOUD: 1.0, QUIET: 1.3, SNEAK: 1.6 },
    approachWanted: { LOUD: 5, QUIET: 3, SNEAK: 2 },
  },
];

export const CREW_POOL = [
  { id: 'dino', name: 'Dino Varga', role: 'Driver', skill: 'Kabur cepat, mobil tak terkunci', cut: 0.10 },
  { id: 'lena', name: 'Lena Marlowe', role: 'Hacker', skill: 'Matikan alarm 30 detik', cut: 0.10 },
  { id: 'bruno', name: 'Bruno Kessler', role: 'Muscle', skill: 'Tahan tembakan, bawa tas besar', cut: 0.15 },
  { id: 'nadia', name: 'Nadia Sorel', role: 'Infiltrator', skill: 'Masuk tanpa suara, kunci ganda', cut: 0.12 },
];

/** Open the planning board for a heist (Tab or the phone). */
export function openHeistBoard(heistIdx) {
  G.heistPlan.heist = heistIdx;
  G.heistPlan.prepsDone = [false, false];
  G.prevMode = G.mode;
  G.mode = 'heistboard';
}

/** Mark a prep mission done; both preps unlock the final run. */
export function completePrep(heistIdx, prepIdx) {
  if (G.heistPlan.heist !== heistIdx) G.heistPlan.heist = heistIdx;
  G.heistPlan.prepsDone[prepIdx] = true;
  toast('Persiapan selesai: ' + HEISTS[heistIdx].preps[prepIdx]);
}

/** Start the final heist run: vault marker, wanted by approach, crew bonuses. */
export function startHeistRun() {
  const h = HEISTS[G.heistPlan.heist];
  const plan = G.heistPlan;
  if (!plan.prepsDone[0] || !plan.prepsDone[1]) {
    toast('Selesaikan 2 misi persiapan dulu!');
    return false;
  }
  if (plan.crew.length === 0) {
    toast('Pilih minimal 1 anggota kru!');
    return false;
  }
  G.mission.active = true;
  G.mission.index = [7, 11, 13][plan.heist]; // story mission matching this heist
  G.mission.title = 'Heist — ' + h.name;
  G.mission.objective = 'Capai ' + h.target + ' (' + plan.approach + ') lalu kabur';
  G.mission.target = { x: h.vault.x, y: h.vault.y };
  G.mission.data = { heist: true, heistIdx: plan.heist, stage: 'infiltrate' };
  G.mode = 'play';
  banner('HEIST — ' + h.name.toUpperCase(), 'Pendekatan: ' + plan.approach + ' | Kru: ' + plan.crew.map((c) => c.name).join(', '));
  return true;
}

/** Heist stage logic, called from the mission update: reach vault, grab, escape. */
export function updateHeist(dt) {
  const ms = G.mission;
  if (!ms.active || !ms.data || !ms.data.heist) return false;
  const h = HEISTS[ms.data.heistIdx];
  const p = G.player;
  const d = Math.hypot(p.x - ms.target.x, p.y - ms.target.y);
  if (ms.data.stage === 'infiltrate' && d < 110) {
    ms.data.stage = 'grab';
    ms.data.timer = 8;
    banner('BOBOL BRANKAS', 'Tahan posisi 8 detik — kru bekerja');
    G.wanted = Math.max(G.wanted, h.approachWanted[G.heistPlan.approach]);
  } else if (ms.data.stage === 'grab') {
    ms.data.timer -= dt;
    if (ms.data.timer <= 0) {
      ms.data.stage = 'escape';
      ms.target = { x: 900, y: 500 }; // escape to Lena's garage
      banner('UANG DIDAPAT — KABUR!', 'Kabur ke garasi Marina, hindari polisi');
      toast('Kru mengambil ' + fmtCash(h.basePay * h.approachPay[G.heistPlan.approach]));
    }
  } else if (ms.data.stage === 'escape' && d < 110) {
    const h2 = HEISTS[ms.data.heistIdx];
    const cut = G.heistPlan.crew.reduce((n, c) => n + c.cut, 0);
    const gross = h2.basePay * h2.approachPay[G.heistPlan.approach];
    const net = Math.round(gross * (1 - cut));
    G.cash += net;
    G.stats.heistsDone++;
    G.story.heistsDone++;
    completeMission();
    toast('Heist selesai — bersih ' + fmtCash(net) + ' (kru ' + Math.round(cut * 100) + '%)');
  }
  return true;
}
