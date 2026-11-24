// SUNSET KEYS v4 — radio: 3 procedural music stations, all synthesized live.
// SUNSET FM (chill synthwave), ALBA ROCK (driving guitar-ish riffs) and NEON TALK
// (a lo-fi talk beat). No audio files, no copyrighted music.
import { G } from './state.js';

export const STATIONS = [
  { name: 'SUNSET FM', desc: 'Synthwave santai', bpm: 96, scale: [0, 3, 5, 7, 10], root: 220 },
  { name: 'ALBA ROCK', desc: 'Riff gitar ngebut', bpm: 132, scale: [0, 3, 5, 6, 7, 10], root: 110 },
  { name: 'NEON TALK', desc: 'Lo-fi malam kota', bpm: 78, scale: [0, 2, 3, 7, 9], root: 196 },
];

let actx = null;
let master = null;
let stepTimer = 0;
let step = 0;
let melodySeed = 7;

/** Start the radio engine (shares the audio context with audio.js). */
export function initRadio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.16;
    master.connect(actx.destination);
  } catch (e) { actx = null; }
}

/** Switch to the next station (R key). */
export function nextStation() {
  G.radio.station = (G.radio.station + 1) % STATIONS.length;
  step = 0;
  return STATIONS[G.radio.station];
}

/** Current station info for the HUD. */
export function currentStation() { return STATIONS[G.radio.station]; }

/** One sequencer step: bass note + occasional lead note from the station's scale. */
function playStep() {
  if (!actx || !G.radio.on) return;
  const st = STATIONS[G.radio.station];
  const spb = 60 / st.bpm / 2; // eighth notes
  void spb;
  // Deterministic-ish melody walk.
  melodySeed = (melodySeed * 16807) % 2147483647;
  const r = melodySeed / 2147483647;
  const degree = Math.floor(r * st.scale.length);
  const note = st.root * Math.pow(2, st.scale[degree] / 12);
  const bass = st.root / 2;
  blip(note, 0.22, 'triangle', 0.25);
  if (step % 4 === 0) blip(bass, 0.3, 'sine', 0.4);
  if (step % 8 === 6) blip(note * 2, 0.12, 'square', 0.08);
  // Hat tick.
  if (step % 2 === 1) noiseTick(0.03, 0.05);
}

function blip(freq, dur, type, gain) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start();
  o.stop(actx.currentTime + dur);
}

function noiseTick(dur, gain) {
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource();
  src.buffer = buf;
  const g = actx.createGain();
  g.gain.value = gain;
  src.connect(g); g.connect(master);
  src.start();
}

/** Advance the radio sequencer; call every frame with dt. */
export function updateRadio(dt) {
  if (!actx || !G.radio.on) return;
  const st = STATIONS[G.radio.station];
  const stepDur = 60 / st.bpm / 2;
  stepTimer += dt;
  while (stepTimer >= stepDur) {
    stepTimer -= stepDur;
    playStep();
    step = (step + 1) % 32;
  }
}
