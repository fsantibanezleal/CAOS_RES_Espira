// Browser gate: the live lane's two implementations agree across the committed grid, not only at the
// case's working point. The Implementation page recomputes the fixture in the browser; this gate reads
// the worst relative deviation it reports, compares it with the tolerance the bake committed, and fails
// when the browser's own arithmetic drifts from the offline lane.
// Usage: node e2e/parity.mjs <baseUrl> [outDir]
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
    await page.goto(`${base}/implementation`, { waitUntil: 'networkidle' });
    const panel = page.getByTestId('live-parity');
    await panel.waitFor({ timeout: 15000 });
    const tag = `${theme}-${lang}`;

    const fixture = await page.evaluate(async () => {
      const r = await fetch('/artifacts/live_parity.json');
      const d = await r.json();
      return { tolerances: d.tolerances, elliptic: d.elliptic_k.length, protocol: d.protocol.length, schema: d.schema };
    });
    check(fixture.schema === 'espira.live-parity/1', `${tag}: fixture schema ${fixture.schema}`);
    check(fixture.elliptic >= 8 && fixture.protocol >= 6, `${tag}: fixture covers ${fixture.elliptic} moduli and ${fixture.protocol} switching times`);

    for (const [key, attr] of [['elliptic_k', 'data-worst-elliptic'], ['protocol', 'data-worst-protocol']]) {
      const worst = Number(await panel.getAttribute(attr));
      const tolerance = fixture.tolerances[key];
      check(Number.isFinite(worst), `${tag}: ${key} deviation is a number (${worst})`);
      check(worst <= tolerance, `${tag}: ${key} worst deviation ${worst.toExponential(2)} within ${tolerance.toExponential(0)}`);
      // A panel that silently rendered nothing would also report zero, so the rows must be there.
      const rows = await page.locator(`[data-testid="live-parity"] .parity-group:nth-child(${key === 'elliptic_k' ? 1 : 2}) tbody tr`).count();
      check(rows >= 6, `${tag}: ${key} table drew ${rows} rows`);
      const shown = await page.getByTestId(`parity-worst-${key}`).innerText();
      check(/^\d(\.\d+)?e[+-]\d+$/.test(shown.trim()) || shown.trim() === '0', `${tag}: ${key} readout "${shown}" is plain`);
    }
    // The page must not claim agreement it did not measure.
    const badges = await page.locator('[data-testid="live-parity"] .prov-badge').allInnerTexts();
    check(badges.length === 2 && badges.every((b) => /within|dentro/.test(b)), `${tag}: verdicts ${JSON.stringify(badges)}`);

    // The external cross-check lives on the same page: an independent code, the same barrier.
    const external = page.getByTestId('external-crosscheck');
    await external.waitFor({ timeout: 15000 });
    const claim = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/external_crosscheck.json')).json();
      return {
        worst: d.worst_relative_difference,
        tolerance: d.tolerance,
        agrees: d.agrees,
        rows: d.rows.length,
        patches: d.rows.filter((r) => r.geometry === 'patch').length,
        spirit: d.engines.spirit,
      };
    });
    check(
      (await external.getAttribute('data-agrees')) === String(claim.agrees) && claim.agrees,
      `${tag}: the two codes agree (${claim.worst.toExponential(1)} against ${claim.tolerance.toExponential(0)})`,
    );
    const shownWorst = (await page.getByTestId('crosscheck-worst').innerText()).trim();
    check(shownWorst === claim.worst.toExponential(2), `${tag}: the page shows the measured deviation (${shownWorst})`);
    const crossRows = await page.locator('[data-testid="external-crosscheck"] tbody tr').count();
    check(crossRows === claim.rows, `${tag}: cross-check table lists ${crossRows} of ${claim.rows} lattices`);
    // Both geometries have to reach the page. The two-dimensional patch is the half that can catch a
    // string method out, so a table showing only chains is a weaker claim than the artifact makes.
    const patchRows = await page.locator('[data-testid="external-crosscheck"] tr[data-geometry="patch"]').count();
    check(
      patchRows === claim.patches && patchRows > 0,
      `${tag}: the table shows ${patchRows} of ${claim.patches} patch rows`,
    );
    const external_text = await external.innerText();
    check(external_text.includes(claim.spirit), `${tag}: the external engine version is named (${claim.spirit})`);

    // The dynamics cross-check is the other half: a trajectory rather than a barrier, against a code
    // that is run as a separate process because it is GPL.
    const dynamics = page.getByTestId('external-dynamics');
    await dynamics.waitFor({ timeout: 15000 });
    const motion = await page.evaluate(async () => {
      const d = await (await fetch('/artifacts/external_dynamics_crosscheck.json')).json();
      const reversals = d.rows.filter((r) => r.name.startsWith('reversal'));
      return {
        worst: d.worst_deviation,
        tolerance: d.tolerance,
        agrees: d.agrees,
        rows: d.rows.length,
        vampire: d.engines.vampire,
        reversals: reversals.length,
        reversed: reversals.filter((r) => r.reversal_time_theirs_s != null).length,
      };
    });
    check(
      (await dynamics.getAttribute('data-agrees')) === String(motion.agrees) && motion.agrees,
      `${tag}: the two codes agree on the trajectory (${motion.worst.toExponential(1)} against ${motion.tolerance.toExponential(0)})`,
    );
    const shownMotion = (await page.getByTestId('dynamics-worst').innerText()).trim();
    check(shownMotion === motion.worst.toExponential(2), `${tag}: the page shows the measured deviation (${shownMotion})`);
    const motionRows = await page.locator('[data-testid="external-dynamics"] tbody tr').count();
    check(motionRows === motion.rows, `${tag}: the dynamics table lists ${motionRows} of ${motion.rows} configurations`);
    // A reversal row that never crossed the equator would be two codes agreeing that nothing happened.
    const reversalRows = await page.locator('[data-testid="external-dynamics"] tr[data-row="reversal"]').count();
    check(
      reversalRows > 0 && motion.reversed === motion.reversals,
      `${tag}: ${reversalRows} reversal rows shown and ${motion.reversed}/${motion.reversals} actually reversed`,
    );
    check(
      (await dynamics.innerText()).includes(motion.vampire.split('\n')[0]),
      `${tag}: the external engine version is named (${motion.vampire.split('\n')[0]})`,
    );

    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/parity-${tag}.png` });
    check(errors.length === 0, `${tag}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
