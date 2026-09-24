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

    // Every case chip is badged S (synthetic) or R (real), and the badge is a provenance claim. It was
    // hardcoded to R, so all eleven cases run on the synthetic reference macrospin told the reader they
    // ran on a real material. Each badge is held here to the index, which names no material for a
    // synthetic case. Read from the chip's own elements: an earlier check of this split the chip's text
    // on whitespace, which the chip does not have, matched no case, and reported nothing wrong.
    const chips = await page.locator('.cs-chip').evaluateAll((els) =>
      els.map((e) => ({ id: e.querySelector('.cs-chip-id')?.textContent, kind: e.querySelector('.cs-kind')?.textContent })),
    );
    const expected = Object.fromEntries(index.cases.map((c) => [c.slug, c.material ? 'R' : 'S']));
    const misbadged = chips.filter((c) => expected[c.id] !== c.kind);
    check(
      chips.length === index.cases.length && misbadged.length === 0,
      `${tag}: ${chips.length} case chips, badges match the index (${misbadged.map((c) => `${c.id}=${c.kind}`).join(', ') || 'all'})`,
    );

    for (const entry of index.cases) {
      await page.getByRole('button', { name: new RegExp(entry.slug) }).first().click();
      const panel = page.getByTestId('parameter-panel');
      await panel.waitFor();
      const artifact = await page.evaluate(async (slug) => (await fetch(`/artifacts/${slug}.json`)).json(), entry.slug);
      // Wait for the readout to be about THIS case. Waiting for its heading to show the material name,
      // as this gate did, returns at once whenever the previous case ran on the same material (six run
      // on the synthetic macrospin, four on CrSBr), so it could read the previous case's panel.
      await page.waitForFunction(
        (slug) => document.querySelector('.wb-readout')?.dataset.case === slug,
        entry.slug,
      );
      const prov = artifact.material.provenance;
      // The banner is owed to any case on an antiferromagnet, read from the material the artifact
      // declares. This check used to compare the case's category with 'negative-control', the same
      // value the page used, which no case has had since the registry's categories became A to F: the
      // page never showed the banner, this check expected it never to, and both stayed green.
      const banner = await page.getByTestId('negative-control').count();
      const antiferromagnet = /antiferromagnet/i.test(artifact.material?.family ?? '');
      check(
        banner === (antiferromagnet ? 1 : 0),
        `${tag} ${entry.slug}: negative-control banner ${banner ? 'shown' : 'absent'} (material family: ${artifact.material?.family ?? 'none'})`,
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

      // A material case links the DOIs behind a sourced value; a synthetic reference system has none, and
      // must instead declare every value assumed, so a reader cannot mistake a definition for a measurement.
      const sourced = ORDER.find((n) => prov[n].sources.length > 0);
      if (sourced) {
        const row = panel.locator(`.param-row[data-parameter="${sourced}"]`);
        await row.locator('.param-head').click();
        const links = await row.locator('.param-sources a').evaluateAll((as) => as.map((a) => a.href));
        check(
          JSON.stringify(links) === JSON.stringify(prov[sourced].sources.map((d) => `https://doi.org/${d}`)),
          `${tag} ${entry.slug}: ${sourced} links its ${prov[sourced].sources.length} DOI(s)`,
        );
        await row.locator('.param-head').click();
      } else {
        check(
          ORDER.every((n) => prov[n].provenance === 'assumed') && expectedAssumed === ORDER.length,
          `${tag} ${entry.slug}: a synthetic system declares every value assumed`,
        );
      }

      // On the Spanish page this case reads in Spanish: the readout, every parameter row opened, the
      // chart titles the canvas draws (recorded on each chart's host, hidden tabs included) and the
      // legends. The first build of 0.16.000 printed the unit "fraction of copies", the reference
      // truth "published" and the lane "precompute" here in English, beside panels the breadth gate
      // had passed: it reads the tab panels of the default case, and this gate visits every case.
      if (lang === 'es') {
        const heads = panel.locator('.param-head');
        const count = await heads.count();
        for (let i = 0; i < count; i += 1) await heads.nth(i).click();
        const leaks = await page.evaluate(() => {
          const english =
            /(?<!\p{L})(the|and|with|this|that|which|from|when|where|than|only|are|is|of|for|not|current|cost|time|field|switching|reversal|precession|drive|barrier|damping|energy|published|precompute|analytic|fraction|copies|reduced|units|synthetic|reference|sites|none|volume|definition|dimensionless|path)(?!\p{L})/iu;
          const unaccented = /(?<!\p{L})\p{L}+(?:cion|sion)(?!\p{L})/iu;
          const texts = [];
          const readout = document.querySelector('.wb-readout');
          if (readout) {
            const walker = document.createTreeWalker(readout, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              if (node.parentElement?.closest('code, svg, canvas')) continue;
              const text = node.textContent.replace(/\s+/g, ' ').trim();
              if (text.length > 3) texts.push(text);
            }
          }
          for (const chart of document.querySelectorAll('main [data-x-label], main [data-y-label]')) {
            texts.push(chart.dataset.xLabel ?? '', chart.dataset.yLabel ?? '');
          }
          for (const label of document.querySelectorAll('main .u-legend .u-label')) texts.push(label.textContent ?? '');
          return texts.filter((text) => english.test(text) || unaccented.test(text));
        });
        for (let i = 0; i < count; i += 1) await heads.nth(i).click();
        check(
          leaks.length === 0,
          `${tag} ${entry.slug}: the readout, parameters and charts read in Spanish ${JSON.stringify(leaks.slice(0, 4))}`,
        );
      }
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
