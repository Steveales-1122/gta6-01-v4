// SUNSET KEYS v4 — mission engine: starts, tracks and completes the 14 story
// missions, plus race checkpoints, kill counters and objective markers.
import { G, clamp, toast, banner, addXp, dist2 } from './state.js';
import { MISSIONS, CHARACTERS, pickEnding } from './story.js';
import { payPlayer } from './economy.js';
import { makePed } from './pedestrians.js';
import { spawnCops } from './police.js';
import { startTaxiJob } from './sidejobs.js';

/** Start a mission by index: set objective, spawn its targets, show the banner. */
export function startMission(idx) {
  const m = MISSIONS[idx];
  if (!m) return false;
  if (G.level < m.level) { toast('Misi ini butuh Level ' + m.level); return false; }
  // Heist missions run through the planning board (Tab), not as a plain mission.
  if (m.type === 'heist') {
    G.heistPlan.heist = m.heist;
    G.prevMode = G.mode;
    G.mode = 'heistboard';
    toast('Buka papan heist — rencanakan ' + m.title);
    return false;
  }
  G.mission = {
    index: idx, step: 0, active: true, title: m.title, objective: m.brief,
    target: m.x !== undefined ? { x: m.x, y: m.y } : null, timer: m.type === 'race' ? 150 : 0,
    data: { kills: 0, need: m.count || 0, checkpoints: [], cpIndex: 0, fares: 0, preps: 0 },
  };
  const d = G.mission.data;
  if (m.type === 'kill' || m.type === 'turf') spawnMissionGang(m);
  if (m.type === 'vigilante') {
    for (let i = 0; i < (m.count || 3); i++) {
      const ped = makePed(G.player.x + (Math.random() - 0.5) * 700, G.player.y + (Math.random() - 0.5) * 600, { state: 'gang', gang: null });
      ped.hp = 60; ped.robber = true;
      G.peds.push(ped);
    }
  }
  if (m.type === 'race') {
    d.checkpoints = [
      { x: 2340, y: 690 }, { x: 3380, y: 1150 }, { x: 2860, y: 2530 }, { x: 1300, y: 2990 },
    ];
    G.mission.target = d.checkpoints[0];
  }
  if (m.type === 'taxi') d.fares = 0;
  banner(m.title, CHARACTERS[m.giver].name + ' — ' + m.brief);
  toast('Misi dimulai: ' + m.title);
  return true;
}

/** Spawn the gang members a kill/turf mission needs. */
export function spawnMissionGang(m) {
  const cx = m.x || 2000, cy = m.y || 2000;
  const gang = m.type === 'turf' ? (m.district === 'oldtown' ? 'vipers' : 'kings') : 'kings';
  for (let i = 0; i < (m.count || 4); i++) {
    const ped = makePed(cx + (Math.random() - 0.5) * 500, cy + (Math.random() - 0.5) * 400, { state: 'gang', gang });
    ped.hp = 70;
    G.peds.push(ped);
  }
}

/** Per-frame mission logic: objective checks, timers, race checkpoints. */
export function updateMissions(dt) {
  const ms = G.mission;
  if (!ms.active) return;
  const m = MISSIONS[ms.index];
  const p = G.player;
  if (m.type === 'race' && ms.timer > 0) {
    ms.timer -= dt;
    if (ms.timer <= 0) { failMission('Waktu habis — balapan gagal'); return; }
  }
  const near = (tx, ty, r) => dist2(p.x, p.y, tx, ty) < r * r;
  switch (m.type) {
    case 'goto':
    case 'drive':
      if (ms.target && near(ms.target.x, ms.target.y, 90)) completeMission();
      break;
    case 'race': {
      const cp = ms.data.checkpoints[ms.data.cpIndex];
      if (cp && near(cp.x, cp.y, 110)) {
        ms.data.cpIndex++;
        addXp(10, 'driving');
        if (ms.data.cpIndex >= ms.data.checkpoints.length) completeMission();
        else { G.mission.target = ms.data.checkpoints[ms.data.cpIndex]; toast('Checkpoint ' + ms.data.cpIndex + '/' + ms.data.checkpoints.length); }
      }
      break;
    }
    case 'kill':
    case 'turf':
      if (ms.data.kills >= ms.data.need) {
        if (m.type === 'turf') {
          const { takeTurf } = requireTurf();
          takeTurf(m.district);
          toast('Wilayah ' + m.district + ' kini milikmu!');
        }
        completeMission();
      }
      break;
    case 'taxi':
      if (ms.data.fares >= 2) completeMission();
      else if (!G.sideJob) startTaxiJob();
      break;
    case 'vigilante':
      if (ms.data.kills >= ms.data.need) completeMission();
      break;
    case 'fly':
      if (p.plane && p.plane.alt > 150 && near(m.x, m.y, 400)) completeMission();
      break;
    case 'heist':
      // Heist missions complete from heists.js when the crew reaches the vault.
      break;
  }
  // Objective marker pulse.
  if (ms.target) ms.target.pulse = (ms.target.pulse || 0) + dt;
}

/** Lazy import to avoid a cycle (turf.js imports missions for its own missions). */
function requireTurf() {
  // turf.js is imported by main.js; this indirection keeps the module graph acyclic.
  return { takeTurf: (id) => { G.turf[id] = 'player'; G.heat = Math.min(100, G.heat + 15); G.stats.turfTaken++; } };
}

/** Count a mission kill (called from combat when a mission gang member dies). */
export function missionKill() {
  const ms = G.mission;
  if (!ms.active) return;
  const m = MISSIONS[ms.index];
  if (m.type === 'kill' || m.type === 'turf' || m.type === 'vigilante') ms.data.kills++;
}

/** Complete the active mission: pay, XP, advance the story, maybe end the game. */
export function completeMission() {
  const ms = G.mission;
  const m = MISSIONS[ms.index];
  ms.active = false;
  G.stats.missionsDone++;
  payPlayer(m.pay, 'Misi selesai: ' + m.title);
  addXp(40 + ms.index * 6);
  banner('MISI SELESAI', m.title + ' — ' + '$' + m.pay);
  if (m.type === 'heist') G.stats.heistsDone++;
  if (ms.index >= MISSIONS.length - 1) {
    const ending = pickEnding();
    G.story.ending = ending.id;
    G.mode = 'win';
    G.winText = ending;
  } else {
    G.mission.index = ms.index + 1;
    G.mission.title = MISSIONS[ms.index + 1].title;
    toast('Misi berikutnya: ' + MISSIONS[ms.index + 1].title + ' (buka HP — M)');
  }
}

/** Fail the active mission: small penalty, mission can be retried from the phone. */
export function failMission(reason) {
  G.mission.active = false;
  banner('MISI GAGAL', reason);
  toast('Misi gagal — coba lagi dari HP (M)');
}

/** Current objective line for the HUD tracker. */
export function objectiveText() {
  const ms = G.mission;
  if (ms.active) return ms.title + ': ' + ms.objective;
  const next = MISSIONS[ms.index];
  return next ? 'Misi berikutnya: ' + next.title + ' (M untuk mulai)' : 'Cerita selesai — bebas berkeliling!';
}

/** Distance to the current objective marker (for the HUD). */
export function objectiveDistance() {
  const ms = G.mission;
  if (!ms.active || !ms.target) return null;
  return Math.round(Math.hypot(G.player.x - ms.target.x, G.player.y - ms.target.y));
}
