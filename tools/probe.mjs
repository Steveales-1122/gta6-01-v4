// Debug probe: load ?demo=chase, log every request/response, read a canvas pixel.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import path from 'node:path';

const GAME_DIR = '/home/hatch/workspace/makefun/gta6-01-v4-entry/game';
const PORT = 8932;

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', GAME_DIR], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1000));
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => console.log('PAGEERROR:', e.message, e.stack ? e.stack.split('\n')[1] : ''));
    page.on('console', (m) => console.log('CONSOLE[' + m.type() + ']:', m.text()));
    page.on('requestfailed', (r) => console.log('REQFAIL:', r.url(), r.failure()?.errorText));
    page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
    await page.goto(`http://localhost:${PORT}/index.html?demo=chase`, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => {
      const c = document.getElementById('game');
      const x = c.getContext('2d');
      const px = x.getImageData(640, 400, 1, 1).data;
      return { shotReady: window.__shotReady, px: Array.from(px), scripts: document.scripts.length };
    });
    console.log('INFO:', JSON.stringify(info));
  } finally {
    await browser.close();
    server.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
