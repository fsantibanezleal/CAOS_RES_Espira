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

## The gates the site is held to

Fourteen browser gates live in `frontend/e2e/` and CI runs every one of them against the built site, in
both themes and both languages. Thirteen go deep on one surface each: the workbench layout against the
measured ADR-0071 floors, the coverage matrix against the committed index, the provenance strip, and
one per analytical view (free chain, patch, Pareto, hard-axis map, penalty, exploitability, benchmark,
observable units, live-lane parity, the external cross-check and the published replications, where the
gate compares every rendered cell with the committed artifact and refuses a table that has dropped the
point that does not reproduce).

`pages.mjs` is the breadth gate, and it exists because the other thirteen leave whole pages untouched: not
one of them opened the Introduction or the Theory page, so a prose page could have shipped blank and
every gate would have stayed green. It walks the nav the app itself renders, so a page added later is
covered without anyone remembering to add it here, and on every page, in both themes, both languages
and at a desktop and a phone viewport, it holds that the route mounts with a heading and enough text
that an empty shell cannot pass, that nothing scrolls sideways or runs under the footer, that no panel
is still showing its loading placeholder after the network settled, that no `NaN` or `undefined` reached
the visible text, and that the two languages are actually different documents rather than one falling
back to the other.
