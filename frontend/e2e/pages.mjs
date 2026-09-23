// Browser gate for every page of the site, in both themes and both languages (backlog BL-027).
// Usage: node e2e/pages.mjs <baseUrl> [outDir]
//
// The other gates each go deep on one surface: the workbench layout, the coverage matrix, a chart's
// marks. None of them opens the Introduction or the Theory page at all, so a prose page could ship
// blank, or half-translated, or scrolling sideways on a phone, and every gate would stay green. This
// one is the breadth gate: it walks the nav the app itself renders, so a page added later is covered
// without anyone remembering to add it here, and it holds every page to the things that are true of a
// page that actually rendered.
//
// What it measures per page, theme and language:
//   - the route mounts: a heading, and enough text that an empty shell cannot pass;
//   - no console error and no uncaught exception;
//   - no horizontal scroll and no content under the footer, at a desktop and a phone viewport;
//   - nothing still saying "loading" after the network settled, which is how a fetch that never
//     resolves looks to a reader;
//   - no "NaN", no "undefined" and no "[object Object]" in the visible text;
//   - the language actually changed between en and es, rather than falling back to one of them.
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

//: The six pages the product declares. The list is checked against the nav the app renders, so the two
//: cannot drift apart silently: a page added to the router but not to the nav is unreachable, and a nav
//: entry with no page is a dead link.
const EXPECTED_ROUTES = ['/', '/theory', '/implementation', '/app', '/experiments', '/benchmark'];
//: A page that mounted has text. Measured on the shortest page of this site (Implementation, es, which
//: is the most compact of the six): it renders about 4,600 characters, and the shell alone (header,
//: nav, footer) renders about 700. The floor sits between them, closer to the shell, so it catches a
//: page whose body did not render without tracking every edit to the prose.
const MIN_VISIBLE_CHARS = 1200;
//: How many diagrams the Architecture modal declares (src/content/architecture.ts): the problem, the
//: engine and its lanes, cost against energy, and the two external cross-checks.
const ARCHITECTURE_SECTIONS = 4;
const VIEWPORTS = [
  { name: 'desktop', width: 1360, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

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
        // The data panels fetch their artifacts after mount; networkidle covers the fetch, this covers
        // the render that follows it.
        await page.waitForTimeout(600);
        const name = route === '/' ? 'introduction' : route.slice(1);

        const measured = await page.evaluate(() => {
          const main = document.querySelector('main') ?? document.body;
          const footer = document.querySelector('footer');
          const heading = main.querySelector('h1');
          const text = main.innerText ?? '';
          const overlapping = [];
          if (footer) {
            const top = footer.getBoundingClientRect().top + window.scrollY;
            for (const node of main.querySelectorAll('h1, h2, p, table, canvas, svg, .prose > *')) {
              const box = node.getBoundingClientRect();
              if (box.height < 4 || box.width < 4) continue;
              const bottom = box.bottom + window.scrollY;
              if (bottom > top + 1 && box.top + window.scrollY < top) {
                overlapping.push(node.tagName.toLowerCase());
              }
            }
          }
          return {
            heading: heading ? heading.innerText.trim() : '',
            chars: text.replace(/\s+/g, ' ').trim().length,
            text,
            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
            overlapping: overlapping.slice(0, 3),
          };
        });

        check(measured.heading.length > 0, `${tag} ${name}: has a heading ("${measured.heading}")`);
        check(
          measured.chars >= MIN_VISIBLE_CHARS,
          `${tag} ${name}: rendered ${measured.chars} characters of content`,
        );
        check(!measured.horizontalScroll, `${tag} ${name}: no horizontal scroll`);
        check(
          measured.overlapping.length === 0,
          `${tag} ${name}: nothing runs under the footer ${JSON.stringify(measured.overlapping)}`,
        );
        // "Loading" is the placeholder every data panel on this site shows before its artifact
        // arrives. After the network settled it means the fetch never resolved.
        const stillLoading = /\b(loading|cargando)\b/i.test(measured.text);
        check(!stillLoading, `${tag} ${name}: no panel is still loading`);
        const broken = ['NaN', 'undefined', '[object Object]'].filter((needle) =>
          measured.text.includes(needle),
        );
        check(broken.length === 0, `${tag} ${name}: no broken values in the text ${JSON.stringify(broken)}`);
        check(errors.length === 0, `${tag} ${name}: console errors ${JSON.stringify(errors.slice(0, 3))}`);
        errors.length = 0;

        if (viewport.name === 'desktop') {
          await page.screenshot({ path: `${out}/page-${name}-${theme}-${lang}.png`, fullPage: true });
        }
      }

      // The Architecture modal (ADR-0058) is on every page and no gate had ever opened it. Its
      // diagrams are hand-authored SVGs whose labels are tagged twice, once per language, and the
      // shell shows one of them; a mistagged label renders both, and an SVG that fails to lay out
      // renders at zero height. Neither would be visible anywhere else.
      if (viewport.name === 'desktop') {
        const label = lang === 'es' ? 'Arquitectura / Como funciona' : 'Architecture / How it works';
        const trigger = page.getByRole('button', { name: new RegExp(label.replace(/[./]/g, '.'), 'i') });
        if ((await trigger.count()) > 0) {
          await trigger.first().click();
          const diagrams = page.locator('.caos-architecture-diagram');
          await diagrams.first().waitFor({ timeout: 10000 });
          const count = await diagrams.count();
          check(count >= ARCHITECTURE_SECTIONS, `${tag}: the modal shows ${count} diagrams`);
          const sizes = await diagrams.evaluateAll((nodes) =>
            nodes.map((n) => {
              const svg = n.querySelector('svg');
              const box = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
              return { width: Math.round(box.width), height: Math.round(box.height) };
            }),
          );
          check(
            sizes.every((s) => s.width > 200 && s.height > 80),
            `${tag}: every diagram laid out ${JSON.stringify(sizes)}`,
          );
          const shown = await diagrams.evaluateAll((nodes) =>
            nodes
              .map((n) =>
                Array.from(n.querySelectorAll('text'))
                  .filter((t) => t.getBoundingClientRect().width > 0)
                  .map((t) => t.getAttribute('class'))
                  .filter(Boolean),
              )
              .flat(),
          );
          const wrongLanguage = shown.filter((c) => c.includes(lang === 'es' ? 'l-en' : 'l-es'));
          check(
            wrongLanguage.length === 0,
            `${tag}: the diagrams show one language (${wrongLanguage.length} labels in the other)`,
          );
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

// The two languages have to be different documents. A missing translation key that falls back to
// English reads as a working page, and only a comparison catches it.
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
  const en = texts.en[route];
  const es = texts.es[route];
  const shared = en === es;
  check(!shared, `${route}: the two languages render different text`);
}

await browser.close();
console.log(failures.length ? `GATE FAILED: ${failures.length}` : 'GATE OK');
process.exit(failures.length ? 1 : 0);
