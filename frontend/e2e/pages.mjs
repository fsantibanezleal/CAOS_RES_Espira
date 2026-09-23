// Browser gate for every page of the site, in both themes and both languages (backlog BL-027).
// Usage: node e2e/pages.mjs <baseUrl> [outDir]
//
// The other gates each go deep on one surface: the workbench layout, the coverage matrix, a chart's
// marks. None of them opens the Introduction or the Theory page at all, and none had ever opened the
// Architecture modal, so a prose page could ship blank, or half-translated, or scrolling sideways on a
// phone, and every gate would stay green. This one is the breadth gate: it walks the nav the app
// itself renders, steps through every in-page tab, and holds each panel to the things that are true of
// a panel that actually rendered.
//
// What it measures, per page, per tab, per theme, per language, at a desktop and a phone viewport:
//   - the page mounts: a heading, or an instrument on the pages that are instruments;
//   - every panel has content: either text, or a chart that laid out at a usable size;
//   - no console error and no uncaught exception;
//   - no horizontal scroll and no content under the footer;
//   - nothing still saying "loading" after the network settled, which is how a fetch that never
//     resolves looks to a reader;
//   - no "NaN", no "undefined" and no "[object Object]" in the visible text;
//   - the Architecture modal opens, every diagram lays out, and each one shows one language;
//   - the two languages render different documents, rather than one falling back to the other.
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

//: The six pages the product declares. Checked against the nav the app renders, so the two cannot
//: drift apart silently: a page in the router but not the nav is unreachable, a nav entry with no page
//: is a dead link.
const EXPECTED_ROUTES = ['/', '/theory', '/implementation', '/app', '/experiments', '/benchmark'];
//: Pages that are instruments rather than prose: they carry no h1 by design, the workbench header
//: names them, and their panels are charts whose text can legitimately be a handful of tick labels.
const INSTRUMENT_ROUTES = new Set(['/app']);
//: A panel that rendered has either text or a drawing. Measured across this site's panels: the
//: thinnest prose panel (Theory, one tab, in English) renders 936 characters, and the thinnest
//: instrument panel renders about 120 characters of axis labels beside a chart. So a panel passes on
//: 300 characters, or on a canvas or SVG at least 240 px wide and 120 px tall.
const MIN_PANEL_CHARS = 300;
const MIN_DRAWING = { width: 240, height: 120 };
//: The diagrams the Architecture modal declares (src/content/architecture.ts): the problem, the engine
//: and its lanes, cost against energy, and the two external cross-checks. The modal shows one at a
//: time, so the gate steps through its tabs.
const ARCHITECTURE_SECTIONS = 4;
const VIEWPORTS = [
  { name: 'desktop', width: 1360, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

async function measure(page) {
  return page.evaluate(
    ([minWidth, minHeight]) => {
      const main = document.querySelector('main') ?? document.body;
      const footer = document.querySelector('footer');
      const panel =
        document.querySelector('.subtabpanel:not([hidden])') ??
        document.querySelector('.tabpanel:not([hidden])') ??
        main;
      const drawings = Array.from(panel.querySelectorAll('canvas, svg')).map((n) => {
        const box = n.getBoundingClientRect();
        return { width: Math.round(box.width), height: Math.round(box.height) };
      });
      // What is VISIBLY over the footer, in viewport coordinates, not what a layout box would reach if
      // nothing clipped it: content inside a scroll region is clipped by that region, so its box can
      // extend past the viewport while nothing is drawn there. Same measurement as e2e/app-layout.mjs,
      // the gate that owns the ADR-0071 floors.
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
      const footerBox = footer ? footer.getBoundingClientRect() : null;
      const overlapping = !footerBox
        ? []
        : Array.from(main.querySelectorAll('h1, h2, p, table, canvas, svg'))
            .filter((el) => {
              const r = visibleRect(el);
              return r !== null && r.bottom - r.top > 2 && r.top < footerBox.bottom && r.bottom > footerBox.top + 1;
            })
            .map((el) => el.tagName.toLowerCase())
            .slice(0, 3);
      // "undefined" and "NaN" are English words that appear in this product's own prose ("tau0 would
      // be undefined"), so hunting for them in the page text is a false alarm waiting to happen. What
      // is never legitimate is one of them standing alone where a VALUE belongs.
      const brokenValues = Array.from(panel.querySelectorAll('td, th, strong, code, .prov-badge'))
        .map((el) => el.textContent.trim())
        .filter((t) => t === 'undefined' || t === 'NaN' || t === 'null' || t.includes('[object Object]'))
        .slice(0, 3);
      const heading = main.querySelector('h1');
      return {
        heading: heading ? heading.innerText.trim() : '',
        instrument: Boolean(document.querySelector('.wb-stage, [role="tablist"]')),
        chars: (panel.innerText ?? '').replace(/\s+/g, ' ').trim().length,
        text: main.innerText ?? '',
        brokenValues,
        drew: drawings.some((d) => d.width >= minWidth && d.height >= minHeight),
        drawings: drawings.slice(0, 3),
        horizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
        overlapping: overlapping.slice(0, 3),
      };
    },
    [MIN_DRAWING.width, MIN_DRAWING.height],
  );
}

const browser = await chromium.launch();

for (const theme of ['light', 'dark']) {
  for (const lang of ['en', 'es']) {
    for (const viewport of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
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
      const tag = `${theme}-${lang}-${viewport.name}`;

      await page.goto(`${base}/`, { waitUntil: 'networkidle' });
      const navRoutes = await page.evaluate(() =>
        Array.from(document.querySelectorAll('header a[href]'))
          .map((a) => new URL(a.href).pathname.replace(/\/$/, '') || '/')
          .filter((p, i, all) => all.indexOf(p) === i),
      );
      const reachable = EXPECTED_ROUTES.filter((r) => navRoutes.includes(r));
      check(
        reachable.length === EXPECTED_ROUTES.length,
        `${tag}: the nav reaches every page (${reachable.length}/${EXPECTED_ROUTES.length}, saw ${JSON.stringify(navRoutes)})`,
      );

      for (const route of EXPECTED_ROUTES) {
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        // Panels fetch their artifacts after mount; networkidle covers the fetch, this covers the
        // render that follows it.
        await page.waitForTimeout(700);
        const name = route === '/' ? 'introduction' : route.slice(1);
        const first = await measure(page);

        check(
          first.heading.length > 0 || (INSTRUMENT_ROUTES.has(route) && first.instrument),
          `${tag} ${name}: has a heading or an instrument ("${first.heading}")`,
        );

        // Step through the page's own tabs, because a tabbed page shows one panel at a time and
        // measuring only the open one leaves the rest unverified. This is where an empty tab hides.
        const tabs = await page.locator('main [role="tab"], [role="tablist"] [role="tab"]').all();
        const labels = tabs.length
          ? await Promise.all(tabs.map((t) => t.innerText().then((s) => s.trim())))
          : [''];
        for (let index = 0; index < labels.length; index += 1) {
          if (tabs.length) {
            await tabs[index].click();
            await page.waitForTimeout(450);
          }
          const panelName = labels[index] ? `${name}/${labels[index]}` : name;
          const m = await measure(page);
          // The workbench has its own gate (e2e/app-layout.mjs), which measures painted content
          // against the ADR-0071 floors at its own viewports. Two gates with two different floors for
          // one surface is how a floor quietly becomes whichever one is laxer, so the breadth gate
          // leaves an instrument page's layout to the gate that owns it and checks only what no other
          // gate does: errors, sideways scroll, stuck placeholders and broken values.
          if (!INSTRUMENT_ROUTES.has(route)) {
            check(
              m.chars >= MIN_PANEL_CHARS || m.drew,
              `${tag} ${panelName}: rendered ${m.chars} characters${m.drew ? ' and a drawing' : ` and no drawing ${JSON.stringify(m.drawings)}`}`,
            );
            check(
              m.overlapping.length === 0,
              `${tag} ${panelName}: nothing runs under the footer ${JSON.stringify(m.overlapping)}`,
            );
          }
          check(!m.horizontalScroll, `${tag} ${panelName}: no horizontal scroll`);
          // "Loading" is the placeholder every data panel shows before its artifact arrives. After the
          // network settled it means the fetch never resolved.
          check(!/\b(loading|cargando)\b/i.test(m.text), `${tag} ${panelName}: no panel is still loading`);
          check(
            m.brokenValues.length === 0,
            `${tag} ${panelName}: no broken values where a number belongs ${JSON.stringify(m.brokenValues)}`,
          );
          check(errors.length === 0, `${tag} ${panelName}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
          errors.length = 0;
        }

        if (viewport.name === 'desktop') {
          await page.screenshot({ path: `${out}/page-${name}-${theme}-${lang}.png`, fullPage: true });
        }
      }

      // The Architecture modal (ADR-0058) is on every page and no gate had ever opened it. Its
      // diagrams are hand-authored SVGs whose labels are tagged twice, once per language, and the
      // shell shows one of them; a mistagged label renders both, and a diagram that fails to lay out
      // renders at zero height. Neither is visible anywhere else.
      if (viewport.name === 'desktop') {
        const trigger = page.getByRole('button', { name: /architect|arquitect/i });
        if ((await trigger.count()) > 0) {
          await trigger.first().click();
          const modalTabs = await page.locator('[role="dialog"] [role="tab"], dialog [role="tab"]').all();
          check(
            modalTabs.length === ARCHITECTURE_SECTIONS,
            `${tag}: the modal declares ${modalTabs.length} sections`,
          );
          for (let index = 0; index < modalTabs.length; index += 1) {
            await modalTabs[index].click();
            await page.waitForTimeout(250);
            const diagram = await page.evaluate(() => {
              const node = document.querySelector('.caos-architecture-diagram svg');
              if (!node) return null;
              const box = node.getBoundingClientRect();
              const labels = Array.from(node.querySelectorAll('text'))
                .filter((t) => t.getBoundingClientRect().width > 0)
                .map((t) => t.getAttribute('class') ?? '');
              return { width: Math.round(box.width), height: Math.round(box.height), labels };
            });
            const label = await modalTabs[index].innerText();
            check(
              diagram !== null && diagram.width > 200 && diagram.height > 80,
              `${tag}: diagram "${label.trim()}" laid out ${diagram ? `${diagram.width}x${diagram.height}` : 'missing'}`,
            );
            const other = lang === 'es' ? 'l-en' : 'l-es';
            const wrong = (diagram?.labels ?? []).filter((c) => c.includes(other));
            check(
              wrong.length === 0,
              `${tag}: diagram "${label.trim()}" shows one language (${wrong.length} labels in the other)`,
            );
          }
          await page.screenshot({ path: `${out}/architecture-${theme}-${lang}.png`, fullPage: true });
          await page.keyboard.press('Escape');
        } else {
          check(false, `${tag}: no Architecture button in the header`);
        }
      }
      await ctx.close();
    }
  }
}

// Every route has to answer 200 in BOTH spellings, with and without the trailing slash. On GitHub
// Pages an extensionless path resolves to "<path>.html" and a trailing slash to "<path>/index.html";
// for one release only the first existed, so /theory/ served the fallback (the app mounted, because
// the asset paths are absolute) while the document answered 404. A reader saw a working page and a
// link checker saw a dead link, which is why this is measured on the document and not in the browser.
for (const route of EXPECTED_ROUTES) {
  if (route === '/') continue;
  for (const spelling of [route, `${route}/`]) {
    const response = await fetch(`${base}${spelling}`);
    check(response.status === 200, `${spelling}: answers ${response.status}`);
  }
}
// An unknown path must answer 404 rather than the app. This one is about the HOST, not the build:
// `vite preview` serves its SPA fallback with 200 for anything, while Pages answers 404, so asserting
// it against a local preview would only measure the preview server. It runs against a real host.
const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(base);
if (local) {
  console.log('SKIP /no-such-page: a local preview always answers 200; checked against the live host');
} else {
  const missing = await fetch(`${base}/no-such-page`);
  check(missing.status === 404, `/no-such-page: answers ${missing.status}`);
}

// The two languages have to be different documents. A missing translation that falls back to English
// reads as a working page, and only a comparison catches it.
const texts = {};
for (const lang of ['en', 'es']) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
  await ctx.addInitScript((l) => localStorage.setItem('caos.lang', l), lang);
  const page = await ctx.newPage();
  texts[lang] = {};
  for (const route of EXPECTED_ROUTES) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    texts[lang][route] = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText);
  }
  await ctx.close();
}
for (const route of EXPECTED_ROUTES) {
  check(texts.en[route] !== texts.es[route], `${route}: the two languages render different text`);
}

await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
