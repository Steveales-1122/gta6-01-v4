// radio.js — three procedural radio stations, generated with WebAudio oscillators.
import { G } from './state.js';

export const STATIONS = [
  { name: 'SUNSET FM — synthwave', scale: [220, 261, 293, 329, 392, 440], tempo: 0.32, wave: 'sawtooth' },
  { name: 'ALBA TALK — city news', scale: [196, 220, 246, 262], tempo: 0.5, wave: 'sine' },
  { name: 'MARINA BEATS — bass', scale: [110, 130, 146, 164], tempo: 0.22, wave: 'triangle' },
];
let audioCtx = null, stepTimer = 0, stepIndex = 0;
export function initRadio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
}
export function cycleStation() {
  G.radio.station = (G.radio.station + 1) % STATIONS.length;
  return STATIONS[G.radio.station].name;
}
export function stationName() { return STATIONS[G.radio.station].name; }
export function updateRadio(dt) {
  if (!audioCtx || !G.radio.on || G.muted) return;
  const st = STATIONS[G.radio.station];
  stepTimer -= dt;
  if (stepTimer > 0) return;
  stepTimer = st.tempo;
  const note = st.scale[stepIndex % st.scale.length];
  stepIndex++;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = st.wave; o.frequency.value = note * (stepIndex % 4 === 0 ? 2 : 1);
  g.gain.setValueAtTime(0.035, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + st.tempo * 0.9);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + st.tempo);
}
export function toggleRadio() { G.radio.on = !G.radio.on; return G.radio.on; }
