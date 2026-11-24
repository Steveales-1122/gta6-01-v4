// Probe heist-board TUTUP click: open ?demo=heist, click TUTUP, read mode + buttons.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';

const GAME_DIR = '/home/hatch/workspace/makefun/gta6-01-v4-entry/game';
const PORT = 8936;

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', GAME_DIR], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1000));
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
    await page.goto(`http://localhost:${PORT}/index.html?demo=heist`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const box = await page.locator('#game').boundingBox();
    console.log('box:', JSON.stringify(box));
    console.log('mode:', await page.evaluate(() => window.__G.mode));
    console.log('buttons:', await page.evaluate(() => JSON.stringify(window.__G.ui.buttons.map((b) => [b.action, b.x, b.y, b.w, b.h]))));
    const click = async (cx, cy) => {
      await page.mouse.click(box.x + (cx / 1280) * box.width, box.y + (cy / 800) * box.height);
      await page.waitForTimeout(400);
    };
    await click(880, 662);
    console.log('after TUTUP click, mode:', await page.evaluate(() => window.__G.mode));
    console.log('mouse:', await page.evaluate(() => JSON.stringify(window.__G.mouse)));
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
