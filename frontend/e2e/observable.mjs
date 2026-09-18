// Browser gate: a case must report the quantity it declared, and a live-lane case must actually
// compute in the browser.
//
// Usage: node e2e/observable.mjs <baseUrl> [outDir]
//
// Two failures this catches, both of which a green build hides:
//   1. A case whose observable is not a field cost showing its number as a cost in T^2 s. The
//      spin-orbit-torque oracle reports a current in reduced units and the thermal case a success
//      rate; quoting either in T^2 s is the units failure the conventions exist to prevent.
//   2. A lane verdict of "live" that nothing on the client can evaluate. The workbench recomputes the
//      live case from its own inputs and shows the agreement with the committed artifact; this gate
//      reads that number and fails if the two implementations ever disagree.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'e2e-shots';
mkdirSync(out, { recursive: true });

//: The two implementations are independent arithmetic of the same closed form, so they agree to
//: rounding. A part in a million is far above float noise and far below any real discrepancy.
const AGREEMENT_TOLERANCE = 1e-6;

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};

const index = await (await fetch(`${base}/artifacts/index.json`)).json();
const artifacts = Object.fromEntries(
  await Promise.all(
    index.cases.map(async (c) => [c.slug, await (await fetch(`${base}/artifacts/${c.slug}.json`)).json()]),
  ),
);
const benchmark = await (await fetch(`${base}/artifacts/benchmark.json`)).json();

const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addInitScript((t) => {
    localStorage.setItem('caos.theme', t);
    localStorage.setItem('caos.lang', 'en');
  }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  // An uncaught throw inside a render callback never reaches console.error.
  page.on('pageerror', (e) => errors.push(`uncaught: ${e.message}`));
  await page.goto(`${base}/app`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wb-stage');

  for (const [slug, artifact] of Object.entries(artifacts)) {
    await page.getByRole('button', { name: new RegExp(`^${slug}\\b`) }).click();
    await page.waitForTimeout(350);

    const observable = artifact.observable;
    const row = artifact.cost_curve[Math.floor(artifact.cost_curve.length / 2)];
    const shown = (await page.getByTestId('observable-value').innerText()).trim();

    if (observable.is_field_cost) {
      check(shown.includes('T^2 s') || shown === 'no reversal', `${theme} ${slug}: cost shown in T^2 s ("${shown}")`);
    } else {
      // The unit shown must be the case's own, and must NOT be the field-cost unit.
      check(shown.includes(observable.unit), `${theme} ${slug}: shown in its own unit "${observable.unit}" ("${shown}")`);
      check(!shown.includes('T^2 s'), `${theme} ${slug}: a non-cost observable is not quoted in T^2 s`);
      check(
        (await page.getByTestId('observable-note').count()) === 1,
        `${theme} ${slug}: says it does not report a field cost`,
      );
    }

    // The declared lane and the page must agree about whether anything computes on the client.
    const manifest = benchmark.manifests.find((m) => m.case === slug);
    const liveShown = (await page.getByTestId('live-recompute').count()) === 1;
    check(
      liveShown === (manifest.lane === 'live'),
      `${theme} ${slug}: lane "${manifest.lane}" matches a client recompute being ${liveShown ? 'shown' : 'absent'}`,
    );
    if (liveShown) {
      const agreement = Number(await page.getByTestId('live-agreement').innerText());
      check(
        Number.isFinite(agreement) && agreement < AGREEMENT_TOLERANCE,
        `${theme} ${slug}: browser and engine agree to ${agreement.toExponential(1)} (floor ${AGREEMENT_TOLERANCE})`,
      );
      const value = await page.getByTestId('live-value').innerText();
      check(value.includes(observable.unit), `${theme} ${slug}: the live value carries the unit ("${value}")`);
    }

    // The chart's x axis is a physical quantity, never a timestamp. uPlot formats x as a time axis by
    // default, which silently turns a switching time of 2 tau0 into a date in 1969, and the ticks are
    // drawn on canvas where nothing can read them. The legend uses the same formatter and IS in the DOM,
    // so hovering the plot exposes the formatting a screenshot would otherwise be needed to see.
    await page.getByRole('tab', { name: 'Cost curve' }).click();
    await page.waitForTimeout(250);
    const plot = await page.locator('.uplot .u-over').boundingBox();
    await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 2);
    await page.waitForTimeout(120);
    const legendX = (await page.locator('.u-legend .u-series').first().locator('.u-value').innerText()).trim();
    const variants = artifact.axis.values;
    const asNumber = Number(legendX.replace(/,/g, ''));
    check(
      Number.isFinite(asNumber) &&
        asNumber >= Math.min(...variants) - 1e-9 &&
        asNumber <= Math.max(...variants) + 1e-9,
      `${theme} ${slug}: the x readout is a ${artifact.axis.label.toLowerCase()} in range, not a date ("${legendX}")`,
    );
    // No text block may be drawn over another. A chart that sized itself from a box it shared with a
    // note drew its legend over the note, and no layout check saw it, because both stayed inside the
    // instrument and above the footer.
    for (const tab of ['Pulse', 'Trajectory']) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(350);
      const collisions = await page.evaluate(() => {
        const panel = document.querySelector('.subtabpanel:not([hidden])');
        const blocks = [...(panel?.querySelectorAll('.u-legend, .wb-pulse-note, .sphere-scrub, .sphere-note') ?? [])]
          .map((el) => ({ name: el.className.split(' ')[0], r: el.getBoundingClientRect() }))
          .filter((b) => b.r.width > 0 && b.r.height > 0);
        const hits = [];
        for (let i = 0; i < blocks.length; i++)
          for (let j = i + 1; j < blocks.length; j++) {
            const a = blocks[i].r, b = blocks[j].r;
            const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
            if (overlap) hits.push(`${blocks[i].name} / ${blocks[j].name}`);
          }
        return hits;
      });
      check(collisions.length === 0, `${theme} ${slug} ${tab}: no text drawn over text ${JSON.stringify(collisions)}`);
    }
    await page.getByRole('tab', { name: 'Trajectory' }).click();
    await page.waitForTimeout(150);

    // The drawn path is labelled whenever it is not the case's own control.
    const noteCount = await page.getByTestId('pulse-note').count();
    check(
      noteCount === (artifact.pulse_note ? 1 : 0),
      `${theme} ${slug}: the drawn-path note is ${artifact.pulse_note ? 'shown' : 'absent'} as the artifact declares`,
    );
    void row;
  }
  check(errors.length === 0, `${theme}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
  await page.screenshot({ path: `${out}/observable-${theme}.png`, fullPage: false });
  await ctx.close();
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
