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
import { capturePage, lastBlockReachable } from './lib/capture.mjs';
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
//: ADR-0071 section 5: past about six sibling tabs a row is a list, not an information architecture.
//: Experiments carried eleven flat tabs until 0.15.004, which no gate measured; now every tab row on a
//: document page is counted.
const MAX_PEER_TABS = 6;
const VIEWPORTS = [
  { name: 'desktop', width: 1360, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

async function measure(page, lang) {
  return page.evaluate(
    ([minWidth, minHeight, pageLang]) => {
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
      // A data cell that renders nothing is a value that went missing without saying so: the
      // Materials table printed a dash for one missing ratio and an empty cell for the next. Every
      // cell holds a value, a dash, or an element (a badge, a chart).
      // uPlot's legend is a table too, and its value cells are empty until the reader hovers: that is
      // chart chrome, not a missing value, so legend tables are left out.
      const emptyCells = Array.from(panel.querySelectorAll('tbody td'))
        .filter((td) => !td.closest('.u-legend'))
        .filter((td) => td.textContent.trim() === '' && td.children.length === 0)
        .length;
      // A table that names its rows must not name two rows the same. A row's name is its case, plus its
      // method where the table is a case-by-method matrix (the Benchmark table repeats each case once
      // per method, and that is its shape, not a duplicate).
      const caseRows = Array.from(panel.querySelectorAll('tbody tr[data-case]')).map((tr) =>
        tr.dataset.method ? `${tr.dataset.case}/${tr.dataset.method}` : tr.dataset.case,
      );
      const duplicateRows = caseRows.filter((c, i) => caseRows.indexOf(c) !== i);
      // English on the Spanish page. Text that is English by design, the case registry's titles and
      // reasons and the notes the bake writes, is marked lang="en" (the HTML language of parts, which is
      // also what tells a screen reader to switch voice); anything else in English is a string the
      // interface forgot to translate. Found by eye three times in one review before this looked.
      // English function words, plus English-only words from this product's own vocabulary: short
      // labels such as "mean current" or "reversal" carry no function word and got past the first
      // version of this check. None of these is a Spanish word.
      // Word edges are Unicode letters, not \b: \b is ASCII-only, so it splits accented Spanish into
      // fragments, and the Spanish word "costó" would read as the English "cost".
      const english =
        /(?<!\p{L})(the|and|with|this|that|which|from|when|where|than|only|are|is|of|for|not|current|cost|time|field|switching|reversal|precession|drive|barrier|damping|energy|published|precompute|analytic|fraction|copies|reduced|units|synthetic|reference|sites|none|volume|definition|dimensionless|path)(?!\p{L})/iu;
      // Spanish function words, for the reverse mistake: Spanish text wrongly marked lang="en", which
      // makes a screen reader read it with an English voice. That happened once in the pass that
      // introduced the marking, on a heading the component had already translated.
      const spanish = /(?<!\p{L})(el|los|las|del|que|para|con|por|una|contra|entre)(?!\p{L})/iu;
      // Spanish written without its accents. Every Spanish string shipped that way until 0.16.000
      // ("Implementacion", "conmutacion", "Decide: si"); a word ending in an unaccented -cion or
      // -sion is the symptom a pattern can see.
      const unaccented = /(?<!\p{L})\p{L}+(?:cion|sion)(?!\p{L})/iu;
      const englishLeaks = [];
      const mislabelled = [];
      const fallbacks = [];
      const unaccentedWords = [];
      if (pageLang === 'es') {
        // All visible text in <main>, not only the active tab panel: the workbench's readout and
        // parameter column sit beside the panels, and walking the panel alone let "fraction of copies"
        // and "published" print in English on the Spanish page through 0.16.000's first build.
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const host = node.parentElement;
          // A case chip's slug is an identifier, like code. Legends are read: their series names are
          // interface text (0.16.000 found the cost chart's legend in English on the Spanish page).
          if (!host || host.closest('code, .cs-chip-id, svg, canvas')) continue;
          if (!host.getClientRects().length) continue;
          const text = node.textContent.replace(/\s+/g, ' ').trim();
          if (text.length <= 3) continue;
          // Only a lang="en" BELOW the document root marks deliberate English. The first version of
          // this check let the root <html lang="en"> count, which the shell leaves as "en" on the
          // Spanish page too, so every node looked deliberate and the check inspected nothing.
          const marked = host.closest('[lang="en"]');
          if (marked && marked !== document.documentElement) {
            // Since 0.16.000 the data renders in Spanish (content/data-es.json). A lang="en" below the
            // root on a Spanish page is a string whose translation is missing and fell back.
            fallbacks.push(text.slice(0, 70));
            if (spanish.test(text)) mislabelled.push(text.slice(0, 70));
            continue;
          }
          if (english.test(text)) englishLeaks.push(text.slice(0, 70));
          const bare = text.match(unaccented);
          if (bare) unaccentedWords.push(bare[0]);
        }
        // Axis titles are drawn on canvas, where no text node exists; every chart records the titles
        // it drew on its host (viz/axisLabels.ts), and they are read here like any other text.
        for (const chart of main.querySelectorAll('[data-x-label], [data-y-label]')) {
          for (const title of [chart.dataset.xLabel, chart.dataset.yLabel]) {
            if (!title) continue;
            if (english.test(title)) englishLeaks.push(`axis: ${title.slice(0, 60)}`);
            const bare = title.match(unaccented);
            if (bare) unaccentedWords.push(bare[0]);
          }
        }
      }
      const heading = main.querySelector('h1');
      return {
        englishLeaks: englishLeaks.slice(0, 4),
        englishLeakCount: englishLeaks.length,
        mislabelled: mislabelled.slice(0, 4),
        fallbacks: fallbacks.slice(0, 4),
        fallbackCount: fallbacks.length,
        unaccented: unaccentedWords.slice(0, 6),
        emptyCells,
        duplicateRows,
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
    [MIN_DRAWING.width, MIN_DRAWING.height, lang],
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
        const first = await measure(page, lang);

        check(
          first.heading.length > 0 || (INSTRUMENT_ROUTES.has(route) && first.instrument),
          `${tag} ${name}: has a heading or an instrument ("${first.heading}")`,
        );

        // Step through every panel the page can show, because a tabbed page shows one at a time and
        // measuring only the open one leaves the rest unverified: this is where an empty tab hides.
        // A page may group its tabs (ADR-0071 section 5): a row of group tabs, and inside the open group
        // a row of sub-tabs for its views. Opening a group replaces the sub-tabs, so the walk re-reads
        // the page after every click instead of holding tabs it collected at the start.
        const visit = async (panelName) => {
          const m = await measure(page, lang);
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
          check(m.emptyCells === 0, `${tag} ${panelName}: ${m.emptyCells} empty table cells`);
          check(
            m.mislabelled.length === 0,
            `${tag} ${panelName}: no Spanish text marked lang="en" ${JSON.stringify(m.mislabelled)}`,
          );
          check(
            m.fallbackCount === 0,
            `${tag} ${panelName}: no data text falls back to English (${m.fallbackCount}) ${JSON.stringify(m.fallbacks)}`,
          );
          check(
            m.unaccented.length === 0,
            `${tag} ${panelName}: Spanish carries its accents ${JSON.stringify(m.unaccented)}`,
          );
          check(
            m.englishLeakCount === 0,
            `${tag} ${panelName}: ${m.englishLeakCount} English strings outside lang="en" ${JSON.stringify(m.englishLeaks)}`,
          );
          check(
            m.duplicateRows.length === 0,
            `${tag} ${panelName}: rows named by case are unique ${JSON.stringify(m.duplicateRows)}`,
          );
          check(errors.length === 0, `${tag} ${panelName}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
          errors.length = 0;
        };

        const groups = page.locator('main .tablist > [role="tab"]');
        const groupCount = await groups.count();
        if (groupCount === 0) {
          // No grouped tabs. The workbench's own rows (the variant bar and its sub-tabs) are walked
          // flat, as they always were; a page with no tabs is one panel.
          const flat = await page.locator('main [role="tab"]').all();
          if (flat.length === 0) await visit(name);
          for (const tab of flat) {
            await tab.click();
            await page.waitForTimeout(450);
            await visit(`${name}/${(await tab.innerText()).trim()}`);
          }
        } else {
          if (!INSTRUMENT_ROUTES.has(route)) {
            check(
              groupCount <= MAX_PEER_TABS,
              `${tag} ${name}: ${groupCount} top-level tabs, at most ${MAX_PEER_TABS} (ADR-0071 section 5)`,
            );
          }
          for (let g = 0; g < groupCount; g += 1) {
            const group = groups.nth(g);
            const groupLabel = (await group.innerText()).trim();
            await group.click();
            await page.waitForTimeout(350);
            const views = page.locator('main .tabpanel:not([hidden]) .subtablist > [role="tab"]');
            const viewCount = await views.count();
            if (viewCount === 0) {
              await visit(`${name}/${groupLabel}`);
              continue;
            }
            check(
              viewCount <= MAX_PEER_TABS,
              `${tag} ${name}/${groupLabel}: ${viewCount} views, at most ${MAX_PEER_TABS} (ADR-0071 section 5)`,
            );
            for (let v = 0; v < viewCount; v += 1) {
              const view = views.nth(v);
              const viewLabel = (await view.innerText()).trim();
              await view.click();
              await page.waitForTimeout(450);
              await visit(`${name}/${groupLabel}/${viewLabel}`);
            }
          }
        }

        // The document announces the language it is in. Shell 0.6.8 leaves <html lang="en"> on the
        // Spanish page, so a screen reader reads it in English; the product sets it (App.tsx).
        const docLang = await page.evaluate(() => document.documentElement.lang);
        check(docLang === lang, `${tag} ${name}: the document declares lang="${docLang}"`);

        // Shell known defect 1: the document itself could not scroll, only <body> inside it, so
        // window.scrollTo and in-page anchors did nothing while the wheel still worked. On a document
        // page taller than the viewport, scrollTo has to move it.
        if (!INSTRUMENT_ROUTES.has(route)) {
          const scroll = await page.evaluate(() => {
            // Content height, measured through <body>. The defect pins the document's own scrollHeight
            // to the viewport, so measuring with it (as this check first did) called every defective
            // page "fits the viewport" and passed it.
            const content = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
            const tall = content > window.innerHeight + 2;
            window.scrollTo(0, 1200);
            const moved = window.scrollY;
            window.scrollTo(0, 0);
            return { tall, moved };
          });
          check(
            !scroll.tall || scroll.moved > 0,
            `${tag} ${name}: window.scrollTo moves the document (${scroll.tall ? `moved ${scroll.moved}px` : 'fits the viewport'})`,
          );
        }

        // The end of the page has to be reachable by scrolling, not only present in the DOM. Every
        // text check above reads innerText, which includes content a clipping container hides, so a
        // page nobody could scroll to the bottom of would pass all of them. The workbench is a fixed
        // stage, not a scrolling document, and its own gate measures it.
        if (!INSTRUMENT_ROUTES.has(route)) {
          const end = await lastBlockReachable(page);
          check(
            end.found && end.visible,
            `${tag} ${name}: scrolling reaches the last block (${end.tag ?? 'none'} at ${end.top}..${end.bottom} in ${end.viewport})`,
          );
        }

        if (viewport.name === 'desktop') {
          await capturePage(page, `${out}/page-${name}-${theme}-${lang}.png`);
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
          await page.screenshot({ path: `${out}/architecture-${theme}-${lang}.png`, fullPage: false });
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
