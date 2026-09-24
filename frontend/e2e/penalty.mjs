// Browser gate for the Experiments "Penalty against ensemble" tab (backlog BL-020) on a served build.
// Usage: node e2e/penalty.mjs <baseUrl> [outDir]
// Checks, per theme x language: the tab mounts; the verdict counts the rows the artifact marks, and
// says "does" or "does not" according to those counts rather than to a sentence someone typed; the
// chart has one series per stability factor plus the penalty; the table lists every row; no errors.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { openView } from './lib/tabs.mjs';
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
    await openView(page, lang === 'es' ? 'Penalización frente a Monte Carlo' : 'Penalty against ensemble');
    const readout = page.getByTestId('penalty-readout');
    await readout.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const artifact = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/penalty_test.json')).json();
      return {
        verdict: d.verdict,
        rows: d.per_stability.length,
        cells: d.cells.length,
        stabilities: d.axes.stability_factor.length,
        copies: d.copies,
      };
    });
    const verdict = await page.getByTestId('penalty-verdict').innerText();
    check(
      verdict.includes(String(artifact.cells)) && verdict.includes(String(artifact.copies)),
      `${tag}: verdict states ${artifact.cells} cells of ${artifact.copies} copies`,
    );
    check(
      verdict.includes(`${artifact.verdict.rows_agreeing}`) && verdict.includes(`${artifact.verdict.testable_rows}`),
      `${tag}: verdict counts ${artifact.verdict.rows_agreeing} of ${artifact.verdict.testable_rows} testable rows`,
    );
    // The headline sentence must follow the counts, in either direction.
    const holds = artifact.verdict.rows_agreeing === artifact.verdict.testable_rows && artifact.verdict.testable_rows > 0;
    const saysNot = /does NOT predict|NO predice/.test(verdict);
    check(saysNot !== holds, `${tag}: the sentence follows the counts (holds=${holds}, says not=${saysNot})`);
    check((await readout.getAttribute('data-holds')) === String(holds), `${tag}: readout verdict flag`);

    const series = await page.locator('[data-testid="penalty-chart"] .u-legend .u-series').count();
    check(series === 1 + artifact.stabilities + 1, `${tag}: chart legend rows = ${series} (x + ${artifact.stabilities} + penalty)`);
    const sizes = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="penalty-chart"]');
      const canvas = host.querySelector('canvas');
      return { host: host.clientWidth, canvas: canvas ? canvas.getBoundingClientRect().width : 0 };
    });
    check(sizes.canvas > 0.8 * sizes.host && sizes.host > 600, `${tag}: chart ${Math.round(sizes.canvas)}px in ${sizes.host}px`);
    const rows = await page.locator('[data-testid="penalty-readout"] ~ .table-wrap tbody tr').count();
    check(rows === artifact.rows, `${tag}: table lists ${rows} of ${artifact.rows} stability rows`);

    await page.getByTestId('penalty-chart').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/penalty-${tag}.png` });
    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
