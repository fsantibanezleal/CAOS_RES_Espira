// Browser gate for the Experiments "Free chain optimal control" tab on a served build.
// Usage: node e2e/free-chain.mjs <baseUrl> [outDir]
// Checks, per theme x language: the tab mounts; the readout reacts to every selector; the uPlot chart has
// one series per switching time plus floor and unity; the reversal map canvas is painted with both
// up (blue) and down (red) pixels; the saving case shows a diagonal front (site 0 reverses before the
// last site); no console errors. Screenshots every state.
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
    const tabName = lang === 'es' ? 'Control optimo de cadena libre' : 'Free chain optimal control';
    await openView(page, tabName);
    const readout = page.getByTestId('chain-readout');
    await readout.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const rootTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    check(rootTheme === theme, `${tag}: data-theme applied (${rootTheme})`);

    // Default selection: alpha 0.5, the longest T, N = 16.
    const key0 = await readout.getAttribute('data-key');
    check(key0 === 'jk10_a0.5_t160_n16', `${tag}: default case ${key0}`);

    // Contrast of an INACTIVE chip's text against the page background (a missing token once rendered
    // near-black text on the dark ground).
    const contrast = await page.evaluate(() => {
      const lum = (css) => {
        const m = css.match(/\d+(\.\d+)?/g).map(Number);
        const [r, g, b] = m.slice(0, 3).map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const chip = [...document.querySelectorAll('.wb-variants .chip')].find((c) => !c.classList.contains('active'));
      const fg = lum(getComputedStyle(chip).color);
      const bg = lum(getComputedStyle(document.body).backgroundColor);
      const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
      return (hi + 0.05) / (lo + 0.05);
    });
    check(contrast >= 4.5, `${tag}: inactive chip text contrast ${contrast.toFixed(2)}`);
    const readoutBox = await readout.boundingBox();
    check(readoutBox.height < 200, `${tag}: readout height ${Math.round(readoutBox.height)}px (compact)`);

    const series = await page.locator('[data-testid="crossover-chart"] .u-legend .u-series').count();
    check(series === 1 + 5 + 2, `${tag}: chart legend rows = ${series} (x + 5 times + floor + unity)`);

    const canvasStats = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="chain-map"]');
      const ctx = c.getContext('2d');
      const { width, height } = c;
      const data = ctx.getImageData(0, 0, width, height).data;
      let blue = 0, red = 0;
      for (let i = 0; i < data.length; i += 16) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (b > 200 && r < 120) blue += 1;
        if (r > 200 && b < 120) red += 1;
      }
      return { blue, red, sites: c.dataset.sites, rows: c.dataset.rows, width };
    });
    check(canvasStats.blue > 200 && canvasStats.red > 200, `${tag}: map painted up ${canvasStats.blue} / down ${canvasStats.red}`);
    check(canvasStats.sites === '16' && canvasStats.rows === '48', `${tag}: map declares 16 sites x 48 rows`);

    // Diagonal front: at mid time, site 0 is more reversed than the last site in the saving case.
    const front = await page.evaluate(async () => {
      const r = await fetch('/artifacts/lattice_ocp.json');
      const d = await r.json();
      const c = d.cases.find((x) => x.key === 'jk10_a0.5_t160_n16');
      const mid = c.sz_map.sz[24];
      return { first: mid[0], last: mid[mid.length - 1], ratio: c.best_ratio };
    });
    check(front.ratio < 0.7 && front.first < front.last, `${tag}: wall front at mid time (s_z site0 ${front.first}, last ${front.last}, ratio ${front.ratio})`);

    await page.screenshot({ path: `${out}/free-chain-${tag}.png`, fullPage: false });
    await readout.scrollIntoViewIfNeeded();
    await page.getByTestId('chain-map').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/free-chain-${tag}-map.png` });

    // Reactivity: every selector moves the readout.
    await page.getByRole('button', { name: 'N = 4', exact: true }).click();
    check((await readout.getAttribute('data-key')) === 'jk10_a0.5_t160_n4', `${tag}: N selector reacts`);
    await page.getByRole('button', { name: 'T = 10 tau0', exact: true }).click();
    check((await readout.getAttribute('data-key')) === 'jk10_a0.5_t10_n4', `${tag}: T selector reacts`);
    await page.getByRole('button', { name: 'alpha = 0.1', exact: true }).click();
    const k3 = await readout.getAttribute('data-key');
    check(k3.startsWith('jk10_a0.1_'), `${tag}: alpha selector reacts (${k3})`);
    const series01 = await page.locator('[data-testid="crossover-chart"] .u-legend .u-series').count();
    check(series01 === 1 + 4 + 2, `${tag}: alpha 0.1 chart legend rows = ${series01}`);
    await page.screenshot({ path: `${out}/free-chain-${tag}-alpha01.png` });

    // Hover readout on the map.
    await page.getByTestId('chain-map').scrollIntoViewIfNeeded();
    const box = await page.getByTestId('chain-map').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.5);
    const hoverText = await page.getByTestId('chain-map').locator('xpath=following-sibling::p').innerText();
    check(/^(site|sitio) \d+, t\/T = [\d.]+, s_z = -?[\d.]+$/.test(hoverText), `${tag}: hover readout "${hoverText}"`);

    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
