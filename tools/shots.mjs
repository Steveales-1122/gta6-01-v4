// SUNSET KEYS v4 — screenshot runner (my own script): serves game/, opens each
// ?demo= scene in headless Chrome 1280x800, waits for the scene to settle, and
// saves 4 JPEG screenshots (each <=256KiB, long side 1280).
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/home/hatch/workspace/makefun/gta6-01-v4-entry';
const GAME_DIR = path.join(REPO, 'game');
const OUT = path.join(REPO, 'screenshots');
const PORT = 8931;

const DEMOS = [
  { demo: 'chase', file: '1-chase.jpg' },
  { demo: 'heist', file: '2-heist.jpg' },
  { demo: 'night', file: '3-night.jpg' },
  { demo: 'airport', file: '4-airport.jpg' },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', GAME_DIR], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1200));
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
      args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    for (const { demo, file } of DEMOS) {
      await page.goto(`http://localhost:${PORT}/index.html?demo=${demo}`, { waitUntil: 'load' });
      try {
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
      } catch (e) {
        console.log(`WARN ${demo}: __shotReady timeout, screenshotting anyway`);
      }
      await page.waitForTimeout(600);
      const target = path.join(OUT, file);
      await page.screenshot({ path: target, type: 'jpeg', quality: 80 });
      const st = fs.statSync(target);
      console.log(`${file}: ${(st.size / 1024).toFixed(1)} KiB`);
    }
    if (errors.length) {
      console.log('ERRORS SEEN:');
      errors.forEach((e) => console.log('  ' + e));
    } else {
      console.log('NO PAGE ERRORS');
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
