// shots.mjs — takes the 4 real in-game screenshots with headless Chromium.
// Serves game/ locally, opens each ?demo= scene, waits for the world to settle,
// and writes JPEGs (max 1280 wide, quality 80) into screenshots/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const gameDir = join(repo, 'game');
const outDir = join(repo, 'screenshots');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const path = join(gameDir, url === '/' ? 'index.html' : url);
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const scenes = [
  ['1-chase.jpg', 'chase'],
  ['2-heist.jpg', 'heist'],
  ['3-night.jpg', 'night'],
  ['4-airport.jpg', 'airport'],
];
for (const [file, demo] of scenes) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?demo=${demo}`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  // Let the chase move a little for a lively frame.
  if (demo === 'chase') {
    await page.keyboard.down('w');
    await page.waitForTimeout(900);
    await page.keyboard.up('w');
  }
  if (demo === 'night') {
    await page.mouse.move(700, 350);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, file), type: 'jpeg', quality: 80 });
  console.log(file, 'errors:', errors.length ? errors.join(' | ') : 'none');
  await page.close();
}
await browser.close();
server.close();
console.log('done');
