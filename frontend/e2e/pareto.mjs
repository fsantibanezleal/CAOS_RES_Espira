// Browser gate for the Experiments "Device trade-offs" tab (rung R14) on a served build.
// Usage: node e2e/pareto.mjs <baseUrl> [outDir]
// Checks, per theme x language: the tab mounts; the verdict sentence counts the dominated points the
// artifact actually carries; the readout reacts to the material selector and shows the fitted slopes;
// the chart fills its container although it was built in a hidden tab, has one series per objective,
// and reads back plain numbers on log axes; the table lists every swept time; no console errors.
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
    await page.getByRole('tab', { name: lang === 'es' ? 'Compromisos de dispositivo (R14)' : 'Device trade-offs (R14)' }).click();
    const readout = page.getByTestId('pareto-readout');
    await readout.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const artifact = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/pareto.json')).json();
      const first = d.materials[0];
      return {
        materials: d.materials.length,
        points: first.points.length,
        inversions: first.bandwidth_inversions,
        supplyFront: first.supply_front_size,
        second: d.materials[1]?.material,
        slopes: first.exponents,
      };
    });
    // The page states measured numbers; they must be the artifact's, not a sentence someone typed.
    const verdict = await page.getByTestId('pareto-verdict').innerText();
    const worst = artifact.inversions.worst;
    check(
      verdict.includes(`${artifact.inversions.count} pairs`) || verdict.includes(`${artifact.inversions.count} pares`),
      `${tag}: verdict states ${artifact.inversions.count} bandwidth inversions`,
    );
    check(
      verdict.includes(String(worst.faster_tau0)) && verdict.includes(String(worst.slower_tau0)) && verdict.includes(worst.ratio.toFixed(2)),
      `${tag}: verdict names the worst inversion ${worst.faster_tau0} to ${worst.slower_tau0} tau0, ${worst.ratio.toFixed(2)} times`,
    );
    // The inversion is the whole point of the tab, so the numbers behind it must hold up.
    check(worst.ratio > 1.0 && worst.faster_tau0 < worst.slower_tau0, `${tag}: the worst inversion is an inversion`);
    const framing = await page.locator('[data-testid="pareto-verdict"] + .muted').innerText();
    check(
      framing.includes(`${artifact.points}`) && framing.includes(`${artifact.supplyFront}`),
      `${tag}: the framing note gives ${artifact.supplyFront} of ${artifact.points}`,
    );

    const key0 = await readout.getAttribute('data-key');
    check(key0 === 'crsbr', `${tag}: default material ${key0}`);
    const readoutText = await readout.innerText();
    check(
      readoutText.includes(`T^${artifact.slopes.cost.slope.toFixed(2)}`),
      `${tag}: readout shows the fitted cost slope T^${artifact.slopes.cost.slope.toFixed(2)}`,
    );

    const chart = page.getByTestId('pareto-chart');
    await chart.scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="pareto-chart"]');
      const canvas = host.querySelector('canvas');
      return { host: host.clientWidth, canvas: canvas ? canvas.getBoundingClientRect().width : 0 };
    });
    check(sizes.canvas > 0.8 * sizes.host && sizes.host > 600, `${tag}: chart ${Math.round(sizes.canvas)}px in ${sizes.host}px`);
    const series = await page.locator('[data-testid="pareto-chart"] .u-legend .u-series').count();
    check(series === 4, `${tag}: chart legend rows = ${series} (x + three objectives)`);
    const plot = await page.locator('[data-testid="pareto-chart"] .u-over').boundingBox();
    await page.mouse.move(plot.x + plot.width * 0.5, plot.y + plot.height * 0.5);
    await page.mouse.move(plot.x + plot.width * 0.52, plot.y + plot.height * 0.5);
    const values = await page.locator('[data-testid="pareto-chart"] .u-legend .u-value').allInnerTexts();
    check(
      values.length === 4 && values.every((v) => /^(-?\d+(\.\d+)?(e[+-]\d+)?|-)$/.test(v.trim())),
      `${tag}: legend readouts ${JSON.stringify(values)}`,
    );
    // Log axes hand the formatter every minor split too; labelling them all printed a row of dashes.
    for (const attr of ['data-x-ticks', 'data-y-ticks']) {
      const ticks = ((await chart.getAttribute(attr)) ?? '').split('|').filter(Boolean);
      check(
        ticks.length >= 3 && ticks.every((t) => /^\d+(\.\d+)?(e[+-]\d+)?$/.test(t)),
        `${tag}: ${attr} ${JSON.stringify(ticks)}`,
      );
    }
    const rows = await page.locator('[data-testid="pareto-readout"] ~ .table-wrap tbody tr').count();
    check(rows === artifact.points, `${tag}: table lists ${rows} of ${artifact.points} swept times`);
    await page.screenshot({ path: `${out}/pareto-${tag}.png` });

    if (artifact.second) {
      const name = await page.evaluate(async (slug) => {
        const d = await (await fetch('/artifacts/pareto.json')).json();
        return d.materials.find((m) => m.material === slug).name;
      }, artifact.second);
      await page.getByRole('button', { name, exact: true }).click();
      check((await readout.getAttribute('data-key')) === artifact.second, `${tag}: material selector reacts`);
      check((await chart.getAttribute('data-material')) === artifact.second, `${tag}: chart follows the material`);
    }

    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
