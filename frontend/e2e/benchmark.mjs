// Browser gate for the Benchmark page: the method matrix and the release evidence.
// Usage: node e2e/benchmark.mjs <baseUrl> [outDir]
// Every row the page shows must match the committed benchmark artifact: the same cases and methods, the
// same cell counts, the same lane and hash. A page that renders a complete matrix while the artifact
// reports a missing cell is the failure this gate exists for.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
// The Spanish page shows the lane in Spanish, through the same table the app uses.
const DATA_ES = require('../src/content/data-es.json');
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
    await page.goto(`${base}/benchmark`, { waitUntil: 'networkidle' });
    const tag = `${theme}-${lang}`;
    const benchmark = await page.evaluate(async () => (await fetch('/artifacts/benchmark.json')).json());

    const rows = await page.locator('[data-testid="method-matrix"] tbody tr').evaluateAll((trs) =>
      trs.map((tr) => ({ case: tr.dataset.case, method: tr.dataset.method, cells: tr.children[2].textContent })),
    );
    const expected = benchmark.cases.flatMap((c) => c.methods.map((m) => ({ case: c.case, method: m.method })));
    check(rows.length === expected.length, `${tag}: ${rows.length} of ${expected.length} method rows`);
    check(
      expected.every((e) => rows.some((r) => r.case === e.case && r.method === e.method)),
      `${tag}: every declared method of every case is shown`,
    );
    const complete = benchmark.cases.every((c) =>
      c.methods.every((m) => m.produced + m.not_applicable === m.cells),
    );
    check(complete === benchmark.complete, `${tag}: the artifact's completeness flag matches its cells`);
    const summary = await page.getByTestId('benchmark-summary').innerText();
    check(
      summary.includes(benchmark.engine.version) && /complet|INCOMPLET/i.test(summary),
      `${tag}: summary names the engine version and the matrix state ("${summary.replace(/\s+/g, ' ')}")`,
    );

    const evidence = await page.locator('[data-testid="release-evidence"] tbody tr').evaluateAll((trs) =>
      trs.map((tr) => ({ case: tr.dataset.manifest, text: tr.textContent })),
    );
    check(evidence.length === benchmark.manifests.length, `${tag}: ${evidence.length} manifest rows`);
    check(
      benchmark.manifests.every((m) => {
        const row = evidence.find((e) => e.case === m.case);
        const lane = lang === 'es' ? DATA_ES[m.lane] : m.lane;
        return row && row.text.includes(m.sha256.slice(0, 12)) && row.text.includes(lane);
      }),
      `${tag}: every manifest row shows its lane and hash prefix`,
    );

    await page.screenshot({ path: `${out}/benchmark-${tag}.png` });
    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
