// The six-page app, wired into the shared CAOS shell (header, footer, theme, i18n, architecture modal).

import { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router';
import { AppShell, CitationsProvider, useShellLang, type ShellConfig } from '@fasl-work/caos-app-shell';
import { CITATIONS } from './content/citations';
import { ARCHITECTURE } from './content/architecture';
import { APP_VERSION } from './version';
import { Introduction } from './pages/Introduction';
import { Theory } from './pages/Theory';
import { Implementation } from './pages/Implementation';
import { Workbench } from './pages/Workbench';
import { Experiments } from './pages/Experiments';
import { Benchmark } from './pages/Benchmark';

const config: ShellConfig = {
  product: { name: 'Espira' },
  routes: [
    { path: '/', en: 'Introduction', es: 'Introducción' },
    { path: '/theory', en: 'Theory', es: 'Teoría' },
    { path: '/implementation', en: 'Implementation', es: 'Implementación' },
    { path: '/app', en: 'App', es: 'App' },
    { path: '/experiments', en: 'Experiments', es: 'Experimentos' },
    { path: '/benchmark', en: 'Benchmark', es: 'Comparativa' },
  ],
  links: {
    github: 'https://github.com/fsantibanezleal/CAOS_RES_Espira',
  },
  version: APP_VERSION,
  architecture: ARCHITECTURE,
  fixedRoutes: ['/app'],
  footer: {
    provenance: {
      en: 'Engine: spinoct (MIT, github.com/fsantibanezleal/CAOS_SpinOCT). Method: Kwiatkowski 2021, Badarneh 2023.',
      es: 'Motor: spinoct (MIT). Método: Kwiatkowski 2021, Badarneh 2023.',
    },
    disclaimer: {
      en: 'The web replays offline-baked artifacts, except two cases the lane gate measured as cheap enough to recompute in the browser. The switching cost is in T^2 s, not joules.',
      es: 'La web reproduce resultados calculados de antemano, salvo dos casos que la prueba de carril midió como suficientemente baratos para recalcularlos en el navegador. El costo está en T^2 s, no en julios.',
    },
    license: { en: 'MIT', es: 'MIT' },
  },
};

/**
 * Keeps the document's language in step with the interface's.
 *
 * Shell 0.6.8 switches every string it owns between English and Spanish but never touches
 * `<html lang>`, and index.html ships it as "en", so the Spanish page announced itself as English: a
 * screen reader read it with English pronunciation and a search engine filed it as English. Recorded as
 * a shell defect in CAOS_MANAGE conventions/shell-known-defects.md; remove this when the shell sets
 * the language itself. It has to render inside AppShell, where the language is known.
 */
function DocumentLanguage(): null {
  const lang = useShellLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

// A NavLink strip for the workbench-style routing is provided by AppShell's own header; here we just
// render the routed content.
export function App(): React.JSX.Element {
  return (
    <CitationsProvider items={CITATIONS}>
      <AppShell config={config}>
        <DocumentLanguage />
        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/implementation" element={<Implementation />} />
          <Route path="/app" element={<Workbench />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/benchmark" element={<Benchmark />} />
          <Route path="*" element={<Introduction />} />
        </Routes>
      </AppShell>
    </CitationsProvider>
  );
}

// Exported so a future orphan-route check can assert every route is reachable from the nav.
export const ROUTE_PATHS = ['/', '/theory', '/implementation', '/app', '/experiments', '/benchmark'];
export { NavLink };
