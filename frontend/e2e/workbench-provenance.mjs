// Browser gate for the App workbench parameter panel (Contract 1 provenance).
// Usage: node e2e/workbench-provenance.mjs <baseUrl> [outDir]
// For every case in the deck, per theme x language: the panel lists the five parameters; each badge
// equals the artifact's provenance class; the assumed count equals the artifact; expanding a sourced value
// shows doi.org links matching the artifact; the panel's badge text is readable against the page; no
// console errors. The expected values are read from the served artifacts, so the gate checks the page
// against the data it claims to show.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'e2e-shots';
mkdirSync(out, { recursive: true });
const ORDER = ['moment', 'anisotropy', 'hard_axis_ratio', 'damping', 'ordering_temperature'];

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
    await page.goto(`${base}/app`, { waitUntil: 'networkidle' });
    const tag = `${theme}-${lang}`;
    const index = await page.evaluate(async () => (await fetch('/artifacts/index.json')).json());

    for (const entry of index.cases) {
      await page.getByRole('button', { name: new RegExp(entry.slug) }).first().click();
      const panel = page.getByTestId('parameter-panel');
      await panel.waitFor();
      const artifact = await page.evaluate(async (slug) => (await fetch(`/artifacts/${slug}.json`)).json(), entry.slug);
      await page.waitForFunction(
        (name) => document.querySelector('.wb-readout h3')?.textContent === name,
        artifact.material.name,
      );
      const prov = artifact.material.provenance;
      const banner = await page.getByTestId('negative-control').count();
      check(
        banner === (entry.category === 'negative-control' ? 1 : 0),
        `${tag} ${entry.slug}: negative-control banner ${banner ? 'shown' : 'absent'}`,
      );

      const rows = await panel.locator('.param-row').evaluateAll((els) =>
        els.map((e) => ({ name: e.dataset.parameter, provenance: e.dataset.provenance })),
      );
      check(
        JSON.stringify(rows.map((r) => r.name)) === JSON.stringify(ORDER),
        `${tag} ${entry.slug}: five parameters in order`,
      );
      check(
        rows.every((r) => prov[r.name] && r.provenance === prov[r.name].provenance),
        `${tag} ${entry.slug}: badges match the artifact provenance`,
      );
      const expectedAssumed = ORDER.filter((n) => prov[n].provenance === 'assumed').length;
      check(
        Number(await panel.getAttribute('data-assumed')) === expectedAssumed,
        `${tag} ${entry.slug}: assumed count ${expectedAssumed}`,
      );

      const sourced = ORDER.find((n) => prov[n].sources.length > 0);
      const row = panel.locator(`.param-row[data-parameter="${sourced}"]`);
      await row.locator('.param-head').click();
      const links = await row.locator('.param-sources a').evaluateAll((as) => as.map((a) => a.href));
      check(
        JSON.stringify(links) === JSON.stringify(prov[sourced].sources.map((d) => `https://doi.org/${d}`)),
        `${tag} ${entry.slug}: ${sourced} links its ${prov[sourced].sources.length} DOI(s)`,
      );
      await row.locator('.param-head').click();
    }

    const contrast = await page.evaluate(() => {
      const lum = (css) => {
        const [r, g, b] = css.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const badge = document.querySelector('.prov-badge');
      const fg = lum(getComputedStyle(badge).color);
      const bg = lum(getComputedStyle(document.body).backgroundColor);
      const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
      return (hi + 0.05) / (lo + 0.05);
    });
    check(contrast >= 3, `${tag}: badge contrast ${contrast.toFixed(2)} (large-text floor 3)`);
    await page.getByTestId('parameter-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/workbench-provenance-${tag}.png` });
    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
