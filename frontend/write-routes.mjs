// Postbuild: give every SPA route a real HTML entry so GitHub Pages answers deep links with 200.
// Pages resolves an extensionless path to "<path>.html", so /experiments is served from experiments.html
// with no redirect and no trailing slash. Without these files a deep link fell through to 404.html: the app
// still mounted, but the document itself answered 404, which crawlers and link checkers read as broken.
// The same route with a trailing slash, /experiments/, resolves to "<path>/index.html" instead, which
// did not exist: the fallback served the app (absolute asset paths, so it mounted and routed) while the
// document answered 404. A reader saw a working page and a link checker saw a dead link. Both spellings
// now get a real entry.
// 404.html stays as the fallback for anything else.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, 'dist');
const index = join(DIST, 'index.html');
if (!existsSync(index)) {
  console.error('[write-routes] dist/index.html missing; run vite build first');
  process.exit(1);
}

// The route table lives in App.tsx; read it so a new page cannot be forgotten here.
const app = readFileSync(join(HERE, 'src', 'App.tsx'), 'utf8');
const routes = [...app.matchAll(/<Route path="\/([a-z0-9-]+)"/g)].map((m) => m[1]);
if (routes.length === 0) {
  console.error('[write-routes] no routes found in src/App.tsx');
  process.exit(1);
}
for (const route of routes) {
  copyFileSync(index, join(DIST, `${route}.html`));
  mkdirSync(join(DIST, route), { recursive: true });
  copyFileSync(index, join(DIST, route, 'index.html'));
}
copyFileSync(index, join(DIST, '404.html'));
console.log(
  `[write-routes] ${routes.map((r) => `${r}.html + ${r}/index.html`).join(', ')}, 404.html`,
);
