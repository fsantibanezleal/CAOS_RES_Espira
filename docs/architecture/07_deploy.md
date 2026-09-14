# Deploy

Espira is a static site on GitHub Pages. The deploy workflow builds the web app over the committed
artifacts and publishes it; it never runs a bake (ADR-0069 section 6). The full procedure, including the
per-route HTML entries that make deep links answer 200, is in [../../deploy/pages.md](../../deploy/pages.md).

## Two workflows, two conclusions

| Workflow | Runs | Meaning of green |
|---|---|---|
| `ci.yml` | ruff, pytest (materials, registry, artifact invariants, a sandboxed bake smoke, version consistency), the artifact checker, the content-standards and template-residue guards, the frontend type-check and build | The repository is consistent |
| `deploy-pages.yml` | the frontend build and the Pages publish | The site was published |

They are independent. From 0.01.000 to 0.02.001 the deploy was green on every push while `ci` failed, and
the release was reported as green. A release is green only when both are.

## After a deploy

1. `gh run list -R fsantibanezleal/CAOS_RES_Espira -L 4`: both conclusions are `success`.
2. The live footer shows the new version; artifacts are fetched with `?v=<version>`, so the Pages CDN cache
   cannot serve stale data under a new bundle.
3. Every route answers 200 and an unknown path 404.
4. The browser gate passes on the live domain in both themes and both languages, with zero console errors.
