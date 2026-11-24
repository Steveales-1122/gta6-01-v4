// SUNSET KEYS v4 — keyboard + mouse input, with remappable-feeling defaults.
// WASD move/drive, E enter/exit vehicle, mouse aim + click shoot, F interact,
// 1-4 weapons, R radio, P pause, M phone, Tab heist board, Shift run.
import { G } from './state.js';

export const keys = {};
export const keyPressed = {}; // edge-triggered: consumed by main.js each frame

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'brake',
  KeyE: 'enter', KeyF: 'interact', KeyR: 'radio', KeyP: 'pause',
  KeyM: 'phone', Tab: 'heist', Escape: 'escape',
  Digit1: 'w1', Digit2: 'w2', Digit3: 'w3', Digit4: 'w4',
  KeyC: 'camera', KeyH: 'horn',
};

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (action) {
      if (e.code === 'Tab') e.preventDefault();
      if (!keys[action]) keyPressed[action] = true;
      keys[action] = true;
    }
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) keys[action] = false;
  });
  window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    // Map CSS pixels to the canvas's internal 1280x800 coordinates.
    G.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    G.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) G.mouse.down = true; });
  window.addEventListener('mouseup', () => { G.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Clear edge-triggered presses after each frame's logic has read them. */
export function endFrameInput() {
  for (const k of Object.keys(keyPressed)) delete keyPressed[k];
}

/** Was this action pressed this frame? */
export function pressed(action) { return !!keyPressed[action]; }
