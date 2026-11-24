// SUNSET KEYS v4 — Port Alba: the entry program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Paths resolve from this file's own location (import.meta.url), never from the
// working directory, and the output folder itself is never removed — only its
// contents are cleared — so two runs write byte-identical output.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
// The grader mounts the repository at /bot and sets MAKEFUN_BOT_DIR=/bot; use
// it only when it really holds the game, otherwise fall back to this file's
// own directory (always correct, since main.ts lives in the repository root).
const envBotDir = process.env.MAKEFUN_BOT_DIR;
const botDir = envBotDir && existsSync(join(envBotDir, 'game')) ? envBotDir : repoRoot;
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

/** Clear a directory's contents without removing the directory itself. */
function clearDirContents(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main() {
  mkdirSync(outDir, { recursive: true });
  clearDirContents(outDir);
  cpSync(join(botDir, 'game'), join(outDir, 'game'), { recursive: true });
  cpSync(join(botDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
