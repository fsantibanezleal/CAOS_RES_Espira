// Browser gate for the Experiments coverage matrix.
// Usage: node e2e/coverage.mjs <baseUrl> [outDir]
// The page must declare every case in the committed index, with the same status and blocked reason, in
// both languages: a planned or blocked case has to be as visible as a baked one. The counts shown must
// equal the index's own coverage counts.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'e2e-shots';
mkdirSync(out, { recursive: true });

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  for (const lang of ['en', 'es']) {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
    await ctx.addInitScript(([t, l]) => {
      localStorage.setItem('caos.theme', t);
      localStorage.setItem('caos.lang', l);
    }, [theme, lang]);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${base}/experiments`, { waitUntil: 'networkidle' });
    const tag = `${theme}-${lang}`;
    await page.getByRole('tab', { name: lang === 'es' ? 'Cobertura' : 'Coverage' }).click();
    const matrix = page.getByTestId('coverage-matrix');
    await matrix.waitFor({ timeout: 15000 });

    const index = await page.evaluate(async () => (await fetch('/artifacts/index.json')).json());
    const shown = await matrix.locator('tr[data-case]').evaluateAll((rows) =>
      rows.map((r) => ({ slug: r.dataset.case, status: r.dataset.status })),
    );
    check(
      shown.length === index.registry.length && index.registry.length >= 26,
      `${tag}: ${shown.length} of ${index.registry.length} declared cases shown`,
    );
    const bySlug = Object.fromEntries(index.registry.map((r) => [r.slug, r.status]));
    check(
      shown.every((row) => bySlug[row.slug] === row.status),
      `${tag}: every status matches the index`,
    );
    const counts = await page.getByTestId('coverage-counts').innerText();
    check(
      counts.includes(String(index.coverage.baked)) &&
        counts.includes(String(index.coverage.planned)) &&
        counts.includes(String(index.coverage.blocked)),
      `${tag}: counts "${counts.replace(/\s+/g, ' ')}" match the index`,
    );
    for (const row of index.registry.filter((r) => r.status === 'blocked')) {
      const text = await matrix.locator(`tr[data-case="${row.slug}"]`).innerText();
      check(
        text.includes(row.blocked_reason.slice(0, 40)),
        `${tag} ${row.slug}: the blocked reason is shown`,
      );
    }
    await page.screenshot({ path: `${out}/coverage-${tag}.png`, fullPage: false });
    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
