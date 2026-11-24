// SUNSET KEYS v4 — playtest: title -> new game -> walk -> phone/mission ->
// steal a car -> heist board -> pause -> save. Fails loudly on any page error.
// Clicks use canvas coordinates mapped through the element's bounding box.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';

const GAME_DIR = '/home/hatch/workspace/makefun/gta6-01-v4-entry/game';
const PORT = 8935;

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', GAME_DIR], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1000));
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('CONSOLE: ' + m.text()); });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const box = await page.locator('#game').boundingBox();
    const click = async (cx, cy) => {
      await page.mouse.click(box.x + (cx / 1280) * box.width, box.y + (cy / 800) * box.height);
      await page.waitForTimeout(350);
    };
    const state = () => page.evaluate(() => ({
      mode: window.__G.mode, cash: window.__G.cash, wanted: window.__G.wanted,
      cars: window.__G.cars.length, peds: window.__G.peds.length,
      mission: window.__G.mission.title, missionActive: window.__G.mission.active,
      health: Math.round(window.__G.health), inCar: !!window.__G.player.car,
    }));
    console.log('title mode:', await page.evaluate(() => window.__G.mode));
    await click(640, 344); // MULAI BARU
    console.log('after new game:', JSON.stringify(await state()));
    const p0 = await page.evaluate(() => ({ x: window.__G.player.x, y: window.__G.player.y }));
    await page.keyboard.down('w');
    await page.waitForTimeout(2000);
    await page.keyboard.up('w');
    const p1 = await page.evaluate(() => ({ x: window.__G.player.x, y: window.__G.player.y }));
    console.log('walked:', Math.abs(p1.y - p0.y) > 50 ? 'YES' : 'NO', JSON.stringify(p0), '->', JSON.stringify(p1));
    await page.keyboard.press('m'); // phone
    await page.waitForTimeout(300);
    console.log('phone:', await page.evaluate(() => window.__G.mode));
    await click(875, 197); // MULAI mission 1
    console.log('mission 1:', JSON.stringify(await state()));
    // Mission started already switched to play mode — steal a car right away.
    await page.evaluate(() => {
      const G = window.__G;
      let best = null, bestD = 1e12;
      for (const c of G.cars) {
        if (c.owner !== 'npc') continue;
        const d = (c.x - G.player.x) ** 2 + (c.y - G.player.y) ** 2;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (best) { G.player.x = best.x + 30; G.player.y = best.y; G.camera.x = G.player.x - 640; G.camera.y = G.player.y - 400; }
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('e');
    await page.waitForTimeout(400);
    console.log('stole car:', JSON.stringify(await state()));
    await page.keyboard.down('w');
    await page.waitForTimeout(2000);
    await page.keyboard.up('w');
    const car = await page.evaluate(() => {
      const c = window.__G.player.car;
      return c ? { speed: Math.round(c.speed), model: c.model } : null;
    });
    console.log('driving:', JSON.stringify(car));
    // Heist board.
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    console.log('heist board:', await page.evaluate(() => window.__G.mode));
    await click(880, 662); // TUTUP heist board
    console.log('after board:', await page.evaluate(() => window.__G.mode));
    // Pause / resume.
    await page.keyboard.press('p');
    await page.waitForTimeout(250);
    console.log('pause:', await page.evaluate(() => window.__G.mode));
    await page.keyboard.press('p');
    await page.waitForTimeout(250);
    console.log('resume:', await page.evaluate(() => window.__G.mode));
    // Save slot 1 via phone.
    await page.keyboard.press('m');
    await page.waitForTimeout(300);
    await click(830, 158); // SIMPAN tab
    await page.waitForTimeout(200);
    await click(420, 249); // SIMPAN slot 1
    const saved = await page.evaluate(() => !!localStorage.getItem('sunsetkeys_v4_save_0'));
    console.log('save slot 1 written:', saved);
    console.log('final:', JSON.stringify(await state()));
    console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS');
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
