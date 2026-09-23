// Browser gate for the Published replications tab (cases C10 and C05, backlog BL-002 and BL-014).
// Usage: node e2e/replications.mjs <baseUrl> [outDir]
//
// This tab is the one place the product shows itself against numbers other people published, so the
// thing that matters is not that it renders: it is that what it renders is what the artifacts say. The
// gate reads both committed artifacts in the page and compares them cell by cell with the rendered
// table, and it refuses a table that quietly drops the point that does not reproduce or the second
// value the source prints for one of its own points.
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
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${base}/experiments`, { waitUntil: 'networkidle' });
    const tag = `${theme}-${lang}`;

    await page.getByRole('tab', { name: lang === 'es' ? 'Replicaciones publicadas' : 'Published replications' }).click();
    const panel = page.getByTestId('replications');
    await panel.waitFor({ timeout: 15000 });

    const artifacts = await page.evaluate(async () => {
      const load = async (slug) => (await fetch(`/artifacts/${slug}.json`)).json();
      const kickoff = await load('kickoff-replication');
      const biaxial = await load('prb107-biaxial-figures');
      const quoted = kickoff.cost_curve
        .filter((r) => r.r05 && r.r05.published_peak_field_t != null)
        .sort((a, b) => a.variant - b.variant);
      const cells = biaxial.cost_curve
        .filter((r) => r.r11 && r.r11.published_rate_alpha_0p01 != null)
        .sort((a, b) => a.variant - b.variant);
      return {
        quoted: quoted.map((r) => ({
          variant: r.variant,
          ours: r.r05.peak_field_t,
          published: r.r05.published_peak_field_t,
          alternative: r.r05.published_alternative_t ?? null,
          ratio: r.r05.ratio_to_published,
        })),
        cells: cells.map((r) => ({
          variant: r.variant,
          low: r.r11.success_rate_alpha_0p01,
          lowPublished: r.r11.published_rate_alpha_0p01,
          high: r.r11.success_rate_alpha_0p1,
          highPublished: r.r11.published_rate_alpha_0p1,
        })),
      };
    });

    // Both charts have to draw. A uPlot instance that never got a width renders no canvas.
    for (const id of ['kickoff-chart', 'biaxial-chart']) {
      const box = await page.getByTestId(id).locator('canvas').first().boundingBox();
      check(
        box != null && box.width > 280 && box.height > 200,
        `${tag}: ${id} drew a canvas ${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'missing'}`,
      );
    }

    const kickoffRows = await page
      .locator('[data-testid="kickoff-table"] tbody tr')
      .evaluateAll((rows) =>
        rows.map((r) => ({
          variant: Number(r.getAttribute('data-variant')),
          cells: Array.from(r.querySelectorAll('td')).map((td) => td.innerText.trim()),
        })),
      );
    check(
      kickoffRows.length === artifacts.quoted.length,
      `${tag}: the kickoff table shows ${kickoffRows.length} of ${artifacts.quoted.length} quoted points`,
    );
    for (const expected of artifacts.quoted) {
      const row = kickoffRows.find((r) => r.variant === expected.variant);
      if (!row) {
        check(false, `${tag}: the ${expected.variant} ps point is missing from the table`);
        continue;
      }
      const shownOurs = Number(row.cells[1].replace(/[^0-9.eE+-]/g, ''));
      const shownRatio = Number(row.cells[3]);
      check(
        Math.abs(shownOurs / expected.ours - 1) < 5e-3,
        `${tag}: ${expected.variant} ps shows ${shownOurs} T against the artifact's ${expected.ours}`,
      );
      check(
        Math.abs(shownRatio - expected.ratio) <= 0.005,
        `${tag}: ${expected.variant} ps shows a ratio of ${shownRatio} against ${expected.ratio.toFixed(3)}`,
      );
      if (expected.alternative != null) {
        check(
          row.cells[2].includes(String(expected.alternative)),
          `${tag}: ${expected.variant} ps keeps both values the source prints (${row.cells[2]})`,
        );
      }
    }
    // The point that does not reproduce has to be on the page. Dropping it would turn a partial
    // replication into a clean one.
    const unreproduced = artifacts.quoted.filter((r) => Math.abs(r.ratio - 1) > 0.5);
    check(
      unreproduced.length > 0 && unreproduced.every((r) => kickoffRows.some((row) => row.variant === r.variant)),
      `${tag}: the point that does not reproduce is shown (${unreproduced.map((r) => `${r.variant} ps`).join(', ')})`,
    );

    const biaxialRows = await page
      .locator('[data-testid="biaxial-table"] tbody tr')
      .evaluateAll((rows) =>
        rows.map((r) => ({
          variant: Number(r.getAttribute('data-variant')),
          cells: Array.from(r.querySelectorAll('td')).map((td) => Number(td.innerText.trim())),
        })),
      );
    check(
      biaxialRows.length === artifacts.cells.length,
      `${tag}: the thermal table shows ${biaxialRows.length} of ${artifacts.cells.length} published cells`,
    );
    for (const expected of artifacts.cells) {
      const row = biaxialRows.find((r) => r.variant === expected.variant);
      if (!row) {
        check(false, `${tag}: K/kT = ${expected.variant} is missing from the thermal table`);
        continue;
      }
      const pairs = [
        [row.cells[1], expected.low],
        [row.cells[2], expected.lowPublished],
        [row.cells[3], expected.high],
        [row.cells[4], expected.highPublished],
      ];
      for (const [shown, value] of pairs) {
        check(
          Math.abs(shown - value * 100) <= 0.06,
          `${tag}: K/kT = ${expected.variant} shows ${shown} against ${(value * 100).toFixed(1)}`,
        );
      }
      // The claim the case makes is agreement within the Monte-Carlo interval; the page must not be
      // able to show agreement the artifact does not have.
      check(
        Math.abs(expected.low - expected.lowPublished) <= 0.02,
        `${tag}: K/kT = ${expected.variant} replicates at alpha = 0.01 (${(expected.low * 100).toFixed(1)} against ${(expected.lowPublished * 100).toFixed(1)})`,
      );
    }

    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/replications-${tag}.png`, fullPage: true });
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
