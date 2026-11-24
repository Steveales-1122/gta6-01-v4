// SUNSET KEYS v4 — side jobs: taxi fares, vigilante hunts and paramedic runs.
// Jobs pay cash + XP, raise skills, and can be started any time from the phone.
// They keep the open world busy between story missions.
import { G, toast, banner, rand, pick } from './state.js';
import { makePed } from './pedestrians.js';
import { payPlayer } from './economy.js';
import { addXp } from './state.js';

/** Start a taxi job: a fare waves nearby; deliver them to the marked address. */
export function startTaxiJob() {
  if (G.sideJob) { toast('Selesaikan dulu job yang sedang jalan'); return false; }
  const p = G.player;
  const fare = makePed(p.x + rand(-160, 160), p.y + rand(-160, 160), { state: 'fare' });
  G.peds.push(fare);
  const dests = [
    { x: 2200, y: 700, name: 'Downtown' }, { x: 900, y: 500, name: 'Marina' },
    { x: 1300, y: 2100, name: 'Old Town' }, { x: 3900, y: 2800, name: 'Industrial' },
    { x: 4420, y: 760, name: 'Bandara' },
  ];
  const dest = pick(dests);
  G.sideJob = { kind: 'taxi', stage: 'pickup', fare, dest, timer: 90, pay: 180 };
  banner('TAKSI — JOB BARU', 'Jemput penumpang (tanda !), antar ke ' + dest.name);
  return true;
}

/** Start a vigilante job: 3 armed robbers spawn; take them down. */
export function startVigilanteJob() {
  if (G.sideJob) { toast('Selesaikan dulu job yang sedang jalan'); return false; }
  const p = G.player;
  G.sideJob = { kind: 'vigilante', stage: 'hunt', kills: 0, need: 3, timer: 180, pay: 450 };
  for (let i = 0; i < 3; i++) {
    const ped = makePed(p.x + rand(-400, 400), p.y + rand(-400, 400), { state: 'gang', gang: null });
    ped.hp = 60;
    ped.robber = true;
    G.peds.push(ped);
  }
  banner('VIGILANTE', '3 perampok bersenjata di sekitarmu — bereskan mereka');
  return true;
}

/** Start a paramedic run: reach the injured ped before the timer ends. */
export function startParamedicJob() {
  if (G.sideJob) { toast('Selesaikan dulu job yang sedang jalan'); return false; }
  const p = G.player;
  const victim = makePed(p.x + rand(300, 700) * (Math.random() < 0.5 ? 1 : -1), p.y + rand(300, 600) * (Math.random() < 0.5 ? 1 : -1), { state: 'walk' });
  victim.hp = 20;
  victim.injured = true;
  G.peds.push(victim);
  G.sideJob = { kind: 'paramedic', stage: 'respond', victim, timer: 75, pay: 320 };
  banner('PARAMEDIS', 'Korban kecelakaan butuh bantuan — capai tanda + sebelum waktu habis');
  return true;
}

/** Per-frame side-job logic: timers, pickups, deliveries, payouts. */
export function updateSideJobs(dt) {
  const j = G.sideJob;
  if (!j) return;
  j.timer -= dt;
  if (j.timer <= 0) { failSideJob('Waktu habis'); return; }
  const p = G.player;
  if (j.kind === 'taxi') {
    if (j.stage === 'pickup' && j.fare) {
      const d = Math.hypot(p.x - j.fare.x, p.y - j.fare.y);
      if (d < 60) {
        j.stage = 'deliver';
        j.fare.state = 'walk';
        const idx = G.peds.indexOf(j.fare);
        if (idx >= 0) G.peds.splice(idx, 1);
        toast('Penumpang naik — antar ke ' + j.dest.name);
      }
    } else if (j.stage === 'deliver') {
      const d = Math.hypot(p.x - j.dest.x, p.y - j.dest.y);
      if (d < 110) completeSideJob();
    }
  } else if (j.kind === 'paramedic') {
    if (j.victim) {
      const d = Math.hypot(p.x - j.victim.x, p.y - j.victim.y);
      if (d < 70) completeSideJob();
    }
  }
  // Vigilante completes from missionKill counting in combat (sidejobKill hook).
}

/** Count a vigilante kill. */
export function sideJobKill() {
  const j = G.sideJob;
  if (j && j.kind === 'vigilante') {
    j.kills++;
    if (j.kills >= j.need) completeSideJob();
  }
}

function completeSideJob() {
  const j = G.sideJob;
  G.sideJob = null;
  // A taxi delivery also counts toward the story taxi mission (m3).
  if (j.kind === 'taxi' && G.mission.active && G.mission.data && typeof G.mission.data.fares === 'number') {
    G.mission.data.fares++;
  }
  payPlayer(j.pay, 'Job selesai: ' + j.kind);
  addXp(25, j.kind === 'taxi' ? 'driving' : j.kind === 'vigilante' ? 'shooting' : 'stamina');
  banner('JOB SELESAI', '+' + '$' + j.pay);
}

function failSideJob(reason) {
  G.sideJob = null;
  toast('Job gagal — ' + reason);
}

/** Current side-job target marker for the HUD/minimap (null when none). */
export function sideJobTarget() {
  const j = G.sideJob;
  if (!j) return null;
  if (j.kind === 'taxi') return j.stage === 'pickup' && j.fare ? { x: j.fare.x, y: j.fare.y, label: 'Penumpang' } : { x: j.dest.x, y: j.dest.y, label: j.dest.name };
  if (j.kind === 'paramedic' && j.victim) return { x: j.victim.x, y: j.victim.y, label: 'Korban' };
  return null;
}
