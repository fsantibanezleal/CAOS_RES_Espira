# Changelog

All notable changes to Espira are documented here, newest on top. Versions use the padded display
form `X.XX.XXX`; while the parameter data is curated from published sources and the biaxial bake is
not fully converged, the product stays in `0.x`.

## [0.05.000] - 2026-09-17

### Added
- The nine named stages of ADR-0057 and ADR-0069, with one orchestrator and a command line
  (`python data-pipeline/run.py all|<stage>`): ingest, preprocess, dataset, features, train, infer,
  evaluate, export, validate. Every method a case declares now runs over every variant into one result
  schema, or says why it cannot; a method the pipeline cannot run raises rather than leaving a gap.
- Contract 2: per-case manifests in `manifests/` binding each artifact to the engine version, the seed,
  the split, every result row, the artifact's size and sha256, the measured lane verdict and the
  completeness counts, plus the Contract 1 flags of the parameters it used. `validate` recomputes the
  hash and refuses a release that does not match, which a test proves on a mutated copy.
- A measured live-versus-precompute gate (`espiralab/core/gate.py`): closed form, runtime under 250 ms
  and artifact under 512 kB, or the case is precompute with the failing reasons recorded. Every baked
  case is precompute today, and the manifests say why in measured terms.
- A model registry (`models/registry.json`) for the amortized policy: version, engine, license, lane,
  checkpoint, training materials, held-out materials, and the acceptance rule with the scores.
- The Benchmark page shows the real method x case x variant matrix and the release evidence (lane,
  completeness, artifact hash), with a fourth browser gate checking both against the artifact.

### Changed
- The learned policy trains over a damping RANGE with the held-out materials' dampings excluded, instead
  of the training materials' damping values alone. Four of six materials carry the same assumed damping
  of 0.01, so the old split trained at a single point and the policy could not reach the one material
  with a measured damping of 7e-4: it emitted pulses that did not switch. It now passes its gate, every
  held-out case reversing within 1.6 per cent of the analytic optimum.
- The bake and the pipeline take the image count from `spinoct.ImageOCPSolver.recommended_images` rather
  than a fixed 60, and the engine (0.12.000) minimizes with L-BFGS. The numerical optimum was 20 per cent
  above the closed form at the longest switching time; it is now within 1 per cent at every baked
  variant.

## [0.04.000] - 2026-09-17

### Added
- The full 26-case registry of the validated plan, in six categories, with a model that makes the case
  contract explicit (ADR-0069 section 4): a variant family of at least six values with its own label and
  unit, a seed, a split, a ground-truth class, the surface it is shown on, what a domain expert should
  see, and the kill criterion that would make it a failure. Every case carries an honest status: `baked`
  (committed artifacts), `planned` (declared and runnable, not computed), or `blocked` (naming what is
  missing, as for the Cloudflare-blocked kickoff paper and the undigitized published figures).
- Two exact oracles are now baked cases of the product rather than engine tests: C02, the analytic
  uniaxial optimum, and C04, the hard-axis sweep. Both run on a declared synthetic reference macrospin
  whose values are definitional and marked as such.
- Cases may sweep something other than time. C04 sweeps the hard-axis ratio at fixed switching time; the
  artifact, the variant bar, the cost chart and the docs all read the declared axis.
- Experiments gains a Coverage tab: all 26 declared cases with status, variants, methods and ground
  truth, and the blocked reasons in full. A third browser gate checks it against the committed index.
- The wiki's case section is generated from the registry: a page per case (status, kill criterion,
  system, variants, design, sources) plus the coverage matrix, and a test fails when they drift.

### Changed
- **C04's declared expectation was refuted by its own measurement and corrected.** The hard-axis benefit
  is not monotone: at the reference damping and switching time the cost falls to a minimum near a
  hard-axis ratio of one (1.81 times cheaper than the uniaxial optimum) and rises again beyond it, and at
  long switching time the hard axis is purely harmful. Verified stable across solver budgets. Cases now
  report the reduction against the uniaxial optimum, which is the measure the mechanism is about.
- The FePS3 negative control has the six variants the case contract requires, not three.
- The artifact schema is 2.0.0: a declared `axis` block replaces the implicit switching-time list, the
  case block carries its code, kill criterion, ground truth, split, status and methods, and the index
  carries the whole registry with coverage counts.

## [0.03.000] - 2026-09-17

### Added
- Contract 1, the ingestion gate for material parameters (`data/materials/materials.csv`,
  `data/materials/parameters.csv`, `espiralab/io/contract.py`, stages `ingest` and `preprocess`). One row
  per value with the unit and basis it was published in, the conversion inputs, a provenance class
  (measured, computed, derived, assumed), the method, the DOIs and a note. Bad rows are rejected with a
  reason, assumed values and wide damping bands are flagged, and the canonical bake refuses any rejection.
  Conversions from spin operators (K = D S^2) and from volume anisotropy (through a unit cell or through
  the saturation magnetization) are explicit and tested. docs/architecture/02_data-contracts.md.
- The App workbench shows the provenance of every parameter: class badge, published form, method, note and
  DOI links, with a count of assumed values; the Experiments materials table badges assumed damping.
- The negative-control case (FePS3) carries a banner saying its numbers are not predictions.
- Browser gates committed to the repository (`frontend/e2e/`): the free chain tab and the workbench
  provenance panel, both across two themes and two languages against a served build.

### Changed
- **Corrected material parameters after an audit against primary sources** (programme dossier 07). FePS3
  anisotropy 2.0 meV became 10.64 meV (wrong value, and the S^2 conversion was missing); CrI3 0.7 meV,
  cited to a paper that does not report it, became 0.495 meV from the neutron fit; Cr2Ge2Te6 anisotropy
  0.05 meV became 0.0341 meV, its moment 3.0 became 2.80 mu_B and its ordering temperature 40 K became
  61 K; Fe3GeTe2's moment 1.82 mu_B (which belonged to Fe3GaTe2) became the measured 1.58 mu_B and its
  anisotropy is now derived from the measured K_u. Every per-case artifact was rebaked. novel.json is
  unchanged, so manuscript M1 is unaffected. Damping remains assumed for four of six materials.
- The case selector no longer labels the negative control as synthetic: every case runs on published
  parameters.
- Pipeline writers pin LF newlines, so an artifact does not change bytes with the machine that baked it.

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
