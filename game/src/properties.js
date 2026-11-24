// properties.js — safehouses (save + heal + garage) and business locations.
import { G, addMessage } from './state.js';
import { saveGame } from './save.js';

export function nearestSafehouse(x, y, maxD = 90) {
  let best = null, bd = maxD;
  for (const s of G.safehouses) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
  return best;
}
export function nearestBusiness(x, y, maxD = 90) {
  let best = null, bd = maxD;
  for (const b of G.businesses) { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
  return best;
}
export function restAtSafehouse(slot = 1) {
  G.player.hp = 100;
  saveGame(slot);
  addMessage('Rested and saved at safehouse (slot ' + slot + ')', '#7fff9e');
}
export function drawPropertyMarkers(ctx, cam) {
  for (const s of G.safehouses) {
    const x = s.x - cam.x, y = s.y - cam.y;
    ctx.fillStyle = s.owned ? '#2ecc71' : '#95a5a6';
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⌂', x, y - 40);
    ctx.font = '11px sans-serif';
    ctx.fillText(s.name + (s.owned ? '' : ' $' + s.price), x, y - 52);
  }
  for (const b of G.businesses) {
    const x = b.x - cam.x, y = b.y - cam.y;
    ctx.fillStyle = b.owned ? '#f1c40f' : '#bdc3c7';
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('$', x, y - 40);
    ctx.font = '11px sans-serif';
    ctx.fillText(b.name + (b.owned ? ' +$' + b.income + '/h' : ' $' + b.price), x, y - 52);
  }
}
