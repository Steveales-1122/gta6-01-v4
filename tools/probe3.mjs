// Probe shooting + gun shop: fire the pistol, open Ironworks with F, buy ammo.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';

const GAME_DIR = '/home/hatch/workspace/makefun/gta6-01-v4-entry/game';
const PORT = 8937;

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
    await click(640, 344); // MULAI BARU
    await page.waitForTimeout(400);
    // Hold mouse down at canvas centre to fire.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    const shots = await page.evaluate(() => ({ fired: window.__G.stats.shotsFired, ammo: window.__G.ammo.pistol, bullets: window.__G.bullets.length }));
    console.log('shooting:', JSON.stringify(shots));
    // Teleport to the Ironworks gun shop and press F.
    await page.evaluate(() => {
      const G = window.__G;
      G.player.x = 2000; G.player.y = 1000;
      G.camera.x = G.player.x - 640; G.camera.y = G.player.y - 400;
    });
    await page.waitForTimeout(300);
    console.log('prompt:', await page.evaluate(() => window.__G.prompt));
    await page.keyboard.press('f');
    await page.waitForTimeout(400);
    console.log('shop mode:', await page.evaluate(() => window.__G.mode), 'tab:', await page.evaluate(() => window.__G.ui.shopTab));
    // Buy SMG (cost 800, cash 600 -> should fail), then check cash unchanged.
    await click(1010, 241); // BELI SMG row (second weapon row)
    await page.waitForTimeout(300);
    console.log('after SMG attempt, cash:', await page.evaluate(() => window.__G.cash), 'owns smg:', await page.evaluate(() => window.__G.weaponsOwned.smg));
    // Close shop with F? (resume button) — click TUTUP.
    await click(640, 690);
    await page.waitForTimeout(300);
    console.log('after shop close:', await page.evaluate(() => window.__G.mode));
    console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS');
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
