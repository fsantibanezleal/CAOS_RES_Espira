# Changelog

All notable changes to Espira are documented here, newest on top. Versions use the padded display
form `X.XX.XXX`; while the parameter data is curated from published sources and the biaxial bake is
not fully converged, the product stays in `0.x`.

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
