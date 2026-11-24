// SUNSET KEYS v4 — procedural audio: WebAudio SFX (gunshots, engine hum, sirens,
// cash register, footsteps) with no audio files at all.
import { G } from './state.js';

let actx = null;
let master = null;
let engineOsc = null;
let engineGain = null;

/** Create the audio context on first user gesture (browser autoplay rule). */
export function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.5;
    master.connect(actx.destination);
  } catch (e) { actx = null; }
}

export function resumeAudio() {
  if (actx && actx.state === 'suspended') actx.resume();
}

/** Short noise burst: the base of gunshots, crashes and explosions. */
function noiseBurst(dur, freq, gain) {
  if (!actx) return;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource();
  src.buffer = buf;
  const filter = actx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const g = actx.createGain();
  g.gain.value = gain;
  src.connect(filter); filter.connect(g); g.connect(master);
  src.start();
}

/** A simple oscillator blip with an envelope. */
function blip(freq, dur, type, gain, slideTo) {
  if (!actx) return;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, actx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
  g.gain.setValueAtTime(gain, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start();
  o.stop(actx.currentTime + dur);
}

/** Named sound effects used across the game. */
export function sfx(name) {
  if (!actx || G.radio.muted) return;
  switch (name) {
    case 'shoot': noiseBurst(0.12, 1800, 0.5); blip(160, 0.08, 'square', 0.25, 60); break;
    case 'shotgun': noiseBurst(0.25, 900, 0.7); break;
    case 'hit': blip(220, 0.08, 'triangle', 0.3, 140); break;
    case 'explosion': noiseBurst(0.7, 400, 0.9); blip(60, 0.6, 'sine', 0.6, 30); break;
    case 'cash': blip(880, 0.09, 'sine', 0.3); setTimeout(() => blip(1318, 0.14, 'sine', 0.3), 90); break;
    case 'click': blip(660, 0.05, 'square', 0.15); break;
    case 'pickup': blip(520, 0.1, 'sine', 0.3, 780); break;
    case 'mission': blip(523, 0.12, 'sine', 0.3); setTimeout(() => blip(784, 0.2, 'sine', 0.3), 120); break;
    case 'fail': blip(220, 0.3, 'sawtooth', 0.25, 110); break;
    case 'siren': blip(700, 0.4, 'sine', 0.12, 950); break;
    case 'horn': blip(330, 0.18, 'square', 0.2); break;
    case 'door': noiseBurst(0.08, 600, 0.3); break;
    case 'levelup': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.15, 'sine', 0.3), i * 100)); break;
    default: break;
  }
}

/** Engine hum that follows the player's speed (created lazily, updated per frame). */
export function updateEngineSound() {
  if (!actx) return;
  const p = G.player;
  const speed = p.car ? Math.abs(p.car.speed) : p.plane ? p.plane.speed : 0;
  if (speed > 20 && !engineOsc) {
    engineOsc = actx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineGain = actx.createGain();
    engineGain.gain.value = 0.04;
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(master);
    engineOsc.start();
  }
  if (engineOsc) {
    if (speed <= 20) {
      try { engineOsc.stop(); } catch (e) {}
      engineOsc = null;
    } else {
      engineOsc.frequency.setValueAtTime(50 + speed * 0.35, actx.currentTime);
      engineGain.gain.setValueAtTime(0.03 + Math.min(0.05, speed / 9000), actx.currentTime);
    }
  }
}
