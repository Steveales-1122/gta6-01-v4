// audio.js — WebAudio bleeps: engine hum, gunshots, sirens, cash and UI clicks.
import { G } from './state.js';

let ctx = null;
let engineOsc = null;
export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { ctx = null; }
}
export function resumeAudio() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
function tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  if (!ctx || G.muted) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}
export function sfxShot() { tone(180, 0.09, 'square', 0.12, -120); }
export function sfxCash() { tone(880, 0.08, 'sine', 0.1); setTimeout(() => tone(1320, 0.12, 'sine', 0.1), 70); }
export function sfxClick() { tone(600, 0.05, 'square', 0.06); }
export function sfxHurt() { tone(120, 0.2, 'sawtooth', 0.12, -60); }
export function sfxSiren() { tone(700, 0.4, 'sine', 0.04, 300); }
export function sfxMission() { tone(523, 0.12, 'sine', 0.1); setTimeout(() => tone(784, 0.2, 'sine', 0.1), 120); }
export function engineSound(speed) {
  if (!ctx || G.muted) return;
  if (!engineOsc) {
    engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth';
    const g = ctx.createGain(); g.gain.value = 0.02;
    engineOsc.connect(g); g.connect(ctx.destination);
    engineOsc.start(); engineOsc._g = g;
  }
  engineOsc.frequency.value = 50 + Math.abs(speed) * 0.35;
  engineOsc._g.gain.value = Math.abs(speed) > 20 ? 0.025 : 0.005;
}
