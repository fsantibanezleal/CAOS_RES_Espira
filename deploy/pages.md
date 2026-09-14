# Deploy, GitHub Pages

Espira is served statically from GitHub Pages at https://espira.fasl-work.com. There is no backend at
request time.

## What the workflow does

`.github/workflows/deploy-pages.yml`, on every push to `main`:

1. installs the frontend (`npm ci --legacy-peer-deps`) and runs `npm run build`, which
   - `prebuild`: `copy-data.mjs` copies the committed `data/artifacts/` into `frontend/public/artifacts/`;
   - `build`: type-checks and bundles with Vite (absolute base `/`);
   - `postbuild`: `write-routes.mjs` writes one HTML entry per route declared in `src/App.tsx`
     (`theory.html`, `experiments.html`, ...) and `404.html`, so every deep link answers 200;
2. writes `CNAME` and uploads `frontend/dist`;
3. deploys to Pages.

The deploy never runs the bake. Science changes land as committed artifacts first
(`data-pipeline/run.py`, `data-pipeline/run_lattice_ocp.py`), then deploy replays them (ADR-0069
section 6).

## One-time settings

Repository Settings, Pages, Source = GitHub Actions. The custom domain is bound with
`gh api -X PUT repos/fsantibanezleal/CAOS_RES_Espira/pages -f cname=espira.fasl-work.com`; the `CNAME`
file alone does not set it on Actions deploys.

## Verify after a deploy

1. Both workflows are green: `gh run list -R fsantibanezleal/CAOS_RES_Espira -L 4`. A green deploy with a
   red `ci` is not a green release.
2. The live bundle carries the new version (the footer shows `APP_VERSION`; artifacts are fetched with
   `?v=APP_VERSION` to defeat the Pages CDN cache).
3. Every route answers 200 and an unknown path answers 404.
4. The browser gate passes on the live domain in both themes and both languages.
