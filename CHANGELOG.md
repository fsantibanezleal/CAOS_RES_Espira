# Changelog

All notable changes to Espira are documented here, newest on top. Versions use the padded display
form `X.XX.XXX`; while the parameter data is curated from published sources and the biaxial bake is
not fully converged, the product stays in `0.x`.

## [0.02.002] - 2026-09-14

### Changed
- The repository no longer carries the product template outside the web app and the bakes: the SIR
  tests, the SIR data contract and example, the template blueprint, the VPS scaffolds and the template
  wiki pages are gone. `app/` is the dormant FastAPI lane of the frozen base with an Espira README.
- The wiki describes the real system: architecture overview and deploy, the spinoct framework page with a
  runnable example, the bake guide, and the case coverage matrix against the validated 26-case plan with
  per-case pages generated from the registry.
- CI runs ruff, the tests, and the artifact checker, in addition to the guards and the frontend build.
  Before this release the ci workflow had failed on every push since 0.01.000.

### Added
- Tests: material traceability and physical ranges, the registry, artifact invariants with corrupted-copy
  checks proving the checker fails, artifacts current with the database, manuscript facts recomputed from
  the shipped map, a sandboxed bake smoke against the committed artifact, generated docs current, relative
  links, and version consistency. The FePS3 case is a strict expected failure until it has six variants.

## [0.02.001] - 2026-09-14

### Fixed
- Deep links answered HTTP 404: GitHub Pages served every route except the landing page through
  404.html, so the app mounted but the document status was 404. A postbuild step now writes one HTML
  entry per route in App.tsx (experiments.html and siblings), which Pages serves with 200.

## [0.02.000] - 2026-09-14

### Added
- The free chain optimal control crossover map (`data-pipeline/run_lattice_ocp.py`, artifact
  `data/artifacts/lattice_ocp.json`): 61 chains (J/K = 10; alpha 0.5 over T = 10 to 160 tau0 and N = 4
  to 32; alpha 0.1 over T = 20 to 300 tau0 and N = 8 to 24), each solved over every site's trajectory
  from three starts with spinoct 0.10.0, with the minimum-energy-path floor. 28 cases reverse more
  cheaply through a domain wall than by uniform rotation, up to a 51 percent saving (N = 24,
  T = 160 tau0, alpha = 0.5). Parallel and checkpointed.
- Experiments, "Free chain optimal control" tab: damping, time and length selectors with a readout,
  an interactive uPlot crossover chart with the floor, a hover-readout s_z(t, site) reversal map, and the
  full case table. The two-mode tab is marked superseded.

## [0.01.000] - 2026-09-13

### Added
- The material parameter database (`espiralab.materials`): six van der Waals magnets (CrSBr, Fe3GeTe2,
  Fe3GaTe2, CrI3, Cr2Ge2Te6, FePS3), each transcribed from a primary source with a verified DOI, an
  uncertainty, a sign convention, and the disputes named where sources disagree.
- The case matrix (`espiralab.cases`): field-driven reversal on four materials, the low-damping floor
  case, and the FePS3 negative control.
- The canonical bake (`espiralab.bake`): drives the spinoct engine to compute, per case, the analytic
  cost curve with a damping uncertainty band, the reference pulse and sphere trajectory, the static
  baseline reduction factor, and for CrSBr the numerical biaxial hard-axis reduction. Output is
  committed, checksummable JSON that the web replays.
- The six-page companion web app: Introduction, Theory (KaTeX, tabbed), Implementation, App
  (a real workbench with a material selector driving a 3D sphere trajectory, an interactive cost
  curve and pulse chart, and a live parameter readout), Experiments, and Benchmark. Bilingual EN/ES,
  light/dark, on the shared CAOS shell, with inline citations to verified DOIs.
- Consumes spinoct 0.03.000 (the analytic and numerical optimal control paths, baselines, SOT, and
  the constrained solvers).
