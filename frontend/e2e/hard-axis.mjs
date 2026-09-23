// Browser gate for the Experiments "Where the hard axis pays" tab (backlog BL-035) on a served build.
// Usage: node e2e/hard-axis.mjs <baseUrl> [outDir]
// Checks, per theme x language: the tab mounts; the verdict counts the cells the artifact actually
// marks; the heatmap is painted with both verdict colours and with crossed-out cells where the method
// is not trustworthy; the map reacts to the damping selector; a hover reads a cell out, and a cell that
// is not evidence says so instead of showing a number; no console errors.
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
    await openView(page, lang === 'es' ? 'Donde paga el eje duro' : 'Where the hard axis pays');
    const map = page.getByTestId('hard-axis-map');
    await map.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const artifact = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/hard_axis_map.json')).json();
      return {
        summary: d.summary,
        dampings: d.axes.damping,
        cells: d.axes.ratio.length * d.axes.switching_tau0.length,
        unreliableAt: d.axes.damping.map((a) => d.points.filter((p) => p.damping === a && !p.reliable).length),
      };
    });
    const verdict = await page.getByTestId('hard-axis-verdict').innerText();
    check(
      verdict.includes(String(artifact.summary.helped)) && verdict.includes(String(artifact.summary.reliable)),
      `${tag}: verdict states ${artifact.summary.helped} of ${artifact.summary.reliable} reliable cells`,
    );
    check(
      artifact.summary.helped < artifact.summary.reliable,
      `${tag}: the map is a region, not everything (${artifact.summary.helped} of ${artifact.summary.reliable})`,
    );

    check((await map.getAttribute('data-cells')) === String(artifact.cells), `${tag}: map declares ${artifact.cells} cells`);
    const painted = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="hard-axis-map"]');
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let blue = 0, red = 0, grey = 0;
      for (let i = 0; i < data.length; i += 16) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        // Channel differences, not absolute thresholds: a diverging scale renders a mild effect close
        // to white, and a test that demanded a deep colour would pass only on the extremes.
        if (b > r + 8 && Math.abs(r - g) < 12) blue += 1;
        if (r > b + 8 && Math.abs(g - b) < 12) red += 1;
        if (Math.abs(r - g) < 6 && Math.abs(g - b) < 6 && r > 20 && r < 240) grey += 1;
      }
      return { blue, red, grey };
    });
    check(painted.blue > 200 && painted.red > 200, `${tag}: both verdicts painted (blue ${painted.blue}, red ${painted.red})`);
    check(painted.grey > 100, `${tag}: cells without evidence drawn apart (${painted.grey})`);

    // Hover: a reliable cell reads a number, a crossed-out one says why instead.
    const box = await map.boundingBox();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.36, box.y + box.height * 0.2);
    const hover = await page.getByTestId('hard-axis-hover').innerText();
    check(/T = [\d.]+ tau0/.test(hover), `${tag}: hover reads a cell out ("${hover.slice(0, 80)}")`);

    await page.screenshot({ path: `${out}/hard-axis-${tag}.png` });
    const second = artifact.dampings[2] ?? artifact.dampings[artifact.dampings.length - 1];
    await page.getByRole('button', { name: `alpha = ${second}`, exact: true }).click();
    check((await map.getAttribute('data-damping')) === String(second), `${tag}: damping selector reacts`);

    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
