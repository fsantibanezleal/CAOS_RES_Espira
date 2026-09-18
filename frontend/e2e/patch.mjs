// Browser gate for the Experiments "Two-dimensional patch" tab (cases C20 and C21) on a served build.
// Usage: node e2e/patch.mjs <baseUrl> [outDir]
// Checks, per theme x language: the tab mounts on its default case; the crossover sentence states, per
// regime, the smallest side at which the artifact's cheapest trajectory beats uniform rotation; the uPlot
// chart takes the width of its container although it was built in a hidden tab, has one series per
// regime plus floor and unity, and its legend reads the side as a plain integer; the column map is
// painted up and down with one column per site of the side; every selector moves the readout; the map
// hover names a column; no console or page errors. Screenshots every state.
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
    await page.getByRole('tab', { name: lang === 'es' ? 'Parche bidimensional' : 'Two-dimensional patch' }).click();
    const readout = page.getByTestId('patch-readout');
    await readout.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const key0 = await readout.getAttribute('data-key');
    check(key0 === 'patch_jk10_a0.5_t160_w8', `${tag}: default case ${key0}`);

    // The sentence against the artifact: the smallest side with best_ratio < 1, per regime.
    const expected = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/patch_ocp.json')).json();
      const regimes = [...new Set(d.cases.map((c) => c.exchange_over_k))];
      return regimes.map((jk) => {
        const beaten = d.cases.filter((c) => c.exchange_over_k === jk && c.best_ratio < 1).map((c) => c.width);
        return { jk, side: beaten.length ? Math.min(...beaten) : null };
      });
    });
    const sentence = await page.getByTestId('patch-crossing').innerText();
    for (const { jk, side } of expected) {
      const said = side == null ? true : sentence.includes(`W = ${side}.`) && sentence.includes(`J/K = ${jk}`);
      check(said, `${tag}: crossing sentence states J/K = ${jk} from W = ${side}`);
    }

    // Built in a hidden tab, the chart must still fill its container, not a fixed fallback width.
    const chart = page.getByTestId('patch-chart');
    await chart.scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="patch-chart"]');
      const canvas = host.querySelector('canvas');
      return { host: host.clientWidth, canvas: canvas ? canvas.getBoundingClientRect().width : 0 };
    });
    check(sizes.canvas > 0.8 * sizes.host && sizes.host > 600, `${tag}: chart ${Math.round(sizes.canvas)}px in ${sizes.host}px`);
    const series = await page.locator('[data-testid="patch-chart"] .u-legend .u-series').count();
    check(series === 1 + expected.length + 2, `${tag}: chart legend rows = ${series} (x + regimes + floor + unity)`);
    const plot = await page.locator('[data-testid="patch-chart"] .u-over').boundingBox();
    await page.mouse.move(plot.x + plot.width * 0.02, plot.y + plot.height * 0.5);
    await page.mouse.move(plot.x + plot.width * 0.03, plot.y + plot.height * 0.5);
    const xValue = (await page.locator('[data-testid="patch-chart"] .u-legend .u-series').first().locator('.u-value').innerText()).trim();
    check(/^\d+$/.test(xValue), `${tag}: legend x readout "${xValue}" is a plain side`);
    await page.screenshot({ path: `${out}/patch-${tag}-chart.png` });

    const map = page.getByTestId('patch-map');
    await map.scrollIntoViewIfNeeded();
    const stats = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="patch-map"]');
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let blue = 0, red = 0;
      for (let i = 0; i < data.length; i += 16) {
        const [r, , b] = [data[i], data[i + 1], data[i + 2]];
        if (b > 200 && r < 120) blue += 1;
        if (r > 200 && b < 120) red += 1;
      }
      return { blue, red, sites: c.dataset.sites, rows: c.dataset.rows };
    });
    check(stats.blue > 200 && stats.red > 200, `${tag}: map painted up ${stats.blue} / down ${stats.red}`);
    check(stats.sites === '8' && stats.rows === '48', `${tag}: map declares 8 columns x 48 rows (${stats.sites} x ${stats.rows})`);
    const box = await map.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.5);
    const hover = await map.locator('xpath=following-sibling::p').innerText();
    check(/^(column|columna) \d+, t\/T = [\d.]+, s_z = -?[\d.]+$/.test(hover), `${tag}: map hover "${hover}"`);
    await page.screenshot({ path: `${out}/patch-${tag}-map.png` });

    // The table is ordered by regime, then side (the artifact's order is solve-completion order).
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="patch-readout"] ~ .table-wrap tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].slice(0, 2).map((td) => Number(td.textContent)),
      ),
    );
    const sorted = rows.every((r, i) => i === 0 || r[0] < rows[i - 1][0] || (r[0] === rows[i - 1][0] && r[1] > rows[i - 1][1]));
    check(rows.length >= 8 && sorted, `${tag}: table ordered by regime then side (${rows.map((r) => r.join('/')).join(' ')})`);

    // The y ticks are drawn on a canvas; the chart records the labels it drew on its host.
    const ticks = ((await chart.getAttribute('data-y-ticks')) ?? '').split('|').filter(Boolean);
    check(ticks.length >= 3 && ticks.every((t) => /^-?\d+(\.\d+)?$/.test(t)), `${tag}: y ticks locale-free ${JSON.stringify(ticks)}`);

    // Reactivity: each selector moves the readout, and the map follows the side.
    await page.getByRole('button', { name: 'W = 16', exact: true }).click();
    check((await readout.getAttribute('data-key')) === 'patch_jk10_a0.5_t160_w16', `${tag}: side selector reacts`);
    await page.getByRole('button', { name: 'J/K = 2.5', exact: true }).click();
    check((await readout.getAttribute('data-key')) === 'patch_jk2.5_a0.5_t160_w16', `${tag}: regime selector reacts`);
    check((await map.getAttribute('data-sites')) === '16', `${tag}: map follows the side`);
    await page.screenshot({ path: `${out}/patch-${tag}-narrow.png` });

    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
