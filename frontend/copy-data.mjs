// Prebuild: copy the committed canonical artifacts (../data/artifacts) into the SPA's public/ so the
// static site replays them. Canonical copies live in ../data/artifacts; public/ is a git-ignored
// build-time overlay. The web replays these; only a live-lane case also recomputes in the browser.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PUB = join(HERE, 'public');

const artifacts = join(ROOT, 'data', 'artifacts');
if (existsSync(artifacts)) {
  mkdirSync(join(PUB, 'artifacts'), { recursive: true });
  cpSync(artifacts, join(PUB, 'artifacts'), { recursive: true });
  console.log('[copy-data] data/artifacts -> public/artifacts');
} else {
  console.error('[copy-data] no data/artifacts; run: python data-pipeline/run.py');
  process.exit(1);
}
