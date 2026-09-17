// Browser gate for the App surface against the ADR-0071 floors, measured rather than eyeballed.
// Usage: node e2e/app-layout.mjs <baseUrl> [outDir]
// Checks at two viewports, both themes: the instrument fills at least half the app surface; nothing
// overlaps the footer; the page never scrolls horizontally; the readout column is wide enough for its
// labels; and every sub-tab keeps those properties.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'e2e-shots';
mkdirSync(out, { recursive: true });
const VIEWPORTS = [
  { width: 1360, height: 900 },
  { width: 1600, height: 1000 },
];
const INSTRUMENT_FLOOR = 0.5;
//: And it must fill the box across, not only down.
const WIDTH_FLOOR = 0.8;
const READOUT_MIN_WIDTH = 280;

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch();
for (const viewport of VIEWPORTS) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript((t) => {
      localStorage.setItem('caos.theme', t);
      localStorage.setItem('caos.lang', 'en');
    }, theme);
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));
    await page.goto(`${base}/app`, { waitUntil: 'networkidle' });
    const tag = `${viewport.width}x${viewport.height}-${theme}`;
    await page.waitForSelector('.wb-stage');

    for (const tab of ['Trajectory', 'Cost curve', 'Pulse', 'Context']) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const rect = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.getBoundingClientRect() : null;
        };
        const footer = rect('.site-footer');
        const stage = rect('.wb-stage');
        const instrument = rect('.wb-instrument') ?? rect('.wb-ctx-panel');
        // Measure what is actually DRAWN, not the stretched box: a container that fills the stage while
        // its content sits in the top third is exactly the gate-measures-the-wrong-thing failure.
        const panel = document.querySelector('.subtabpanel:not([hidden])') ?? document.querySelector('.wb-main');
        const painted = [...(panel?.querySelectorAll('*') ?? [])]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.height > 0 && r.width > 0);
        const contentTop = Math.min(...painted.map((r) => r.top));
        const contentBottom = Math.max(...painted.map((r) => r.bottom));
        const contentWidth = Math.max(...painted.map((r) => r.width));
        const readout = rect('.wb-readout');
        // What is VISIBLY over the footer, not what a layout box would reach if nothing clipped it.
        // Content inside a scroll region is clipped by that region, so its box may extend past the
        // viewport while nothing is drawn there; counting that as an overlap would push the page into
        // avoiding scroll regions altogether, which is not what the floor asks for.
        const visibleRect = (el) => {
          let rect = el.getBoundingClientRect();
          for (let node = el.parentElement; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            const clips = ['hidden', 'auto', 'scroll', 'clip'].some(
              (v) => style.overflowY === v || style.overflowX === v,
            );
            if (!clips) continue;
            const box = node.getBoundingClientRect();
            rect = {
              top: Math.max(rect.top, box.top),
              bottom: Math.min(rect.bottom, box.bottom),
              left: Math.max(rect.left, box.left),
              right: Math.min(rect.right, box.right),
            };
            if (rect.bottom <= rect.top || rect.right <= rect.left) return null;
          }
          return rect;
        };
        const overlapping = [...document.querySelectorAll('.wb *')]
          .filter((el) => {
            if (!footer) return false;
            const r = visibleRect(el);
            return r !== null && r.bottom - r.top > 0 && r.top < footer.bottom && r.bottom > footer.top + 1;
          })
          .map((el) => el.className)
          .slice(0, 3);
        return {
          footerTop: footer?.top ?? null,
          stage: stage && { top: stage.top, height: stage.height, width: stage.width },
          instrument: instrument && { height: instrument.height, width: instrument.width },
          content: { top: contentTop, bottom: contentBottom, height: contentBottom - contentTop, width: contentWidth },
          readout: readout && { width: readout.width },
          overlapping,
          horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          viewportHeight: window.innerHeight,
        };
      });

      const surface = m.footerTop - m.stage.top;
      const share = m.content.height / surface;
      check(
        share >= INSTRUMENT_FLOOR,
        `${tag} ${tab}: painted content fills ${(share * 100).toFixed(0)}% of the surface`,
      );
      // Height alone is not enough: a chart built while its sub-tab panel was hidden came up 90 px wide
      // in a 1000 px stage and still filled the height, so the surface share passed while the
      // instrument was a sliver.
      const widthShare = m.content.width / m.instrument.width;
      check(
        widthShare >= WIDTH_FLOOR,
        `${tag} ${tab}: painted content fills ${(widthShare * 100).toFixed(0)}% of the instrument width`,
      );
      check(m.overlapping.length === 0, `${tag} ${tab}: nothing overlaps the footer ${JSON.stringify(m.overlapping)}`);
      check(!m.horizontalScroll, `${tag} ${tab}: no horizontal scroll`);
      check(m.readout.width >= READOUT_MIN_WIDTH, `${tag} ${tab}: readout ${Math.round(m.readout.width)}px wide`);
    }
    check(pageErrors.length === 0, `${tag}: no page errors ${JSON.stringify(pageErrors.slice(0, 3))}`);
    await page.screenshot({ path: `${out}/app-layout-${tag}.png` });
    await ctx.close();
  }
}
await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
