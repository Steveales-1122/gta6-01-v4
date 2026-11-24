// input.js — keyboard + mouse state, with a small action map.
export const keys = {};
export const mouse = { x: 0, y: 0, down: false, clicked: false };
let canvas = null;

export function initInput(c) {
  canvas = c;
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  c.addEventListener('mousemove', (e) => {
    const r = c.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (c.width / r.width);
    mouse.y = (e.clientY - r.top) * (c.height / r.height);
  });
  c.addEventListener('mousedown', (e) => { mouse.down = true; mouse.clicked = true; if (e.button === 0) e.preventDefault(); });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; mouse.down = false; });
}
export function pressed(code) { return !!keys[code]; }
export function anyOf(...codes) { return codes.some((c) => keys[c]); }
export function consumeClick() { const c = mouse.clicked; mouse.clicked = false; return c; }
export function axis() {
  let x = 0, y = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) x += 1;
  if (keys['KeyW'] || keys['ArrowUp']) y -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) y += 1;
  return { x, y };
}
