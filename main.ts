// main.ts — SUNSET KEYS v4 entry program (Node 22, stdlib only).
// Copies game/ and screenshots/ from this repository into /output (or
// MAKEFUN_OUTPUT_DIR) and writes /output/dossier.json with buildDossier.
// Paths resolve relative to this file via import.meta.url — never process.cwd().
// The /output folder itself is never removed: only its contents are cleared.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function clearDir(dir) {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main() {
  clearDir(outDir);
  const gameSrc = join(here, 'game');
  const shotsSrc = join(here, 'screenshots');
  if (!existsSync(gameSrc)) throw new Error('game/ missing next to main.ts');
  cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
  if (existsSync(shotsSrc)) cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log('wrote ' + outDir + '/dossier.json (' + dossier.length + ' bytes)');
}
main();
