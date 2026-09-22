# data-pipeline/, the offline bake (`espiralab`)

The single source of Espira's results. The physics and the solvers live in the separate engine package
[`spinoct`](https://github.com/fsantibanezleal/CAOS_SpinOCT) (PyPI `spinoct`, pinned in
`requirements.txt`); `espiralab` holds the product's domain layer and drives the engine. `frontend/`
consumes its artifacts and never recomputes them.

## Layout today

| Module | What |
|---|---|
| `espiralab/io/contract.py` | Contract 1: validates `data/materials/*.csv`, converts to canonical units, rejects with reasons, flags assumed values |
| `espiralab/stages/ingest.py`, `stages/preprocess.py` | The first two named stages: the contract report, then the engine-facing material records |
| `espiralab/materials/` | The material records (loaded only through the two stages), with provenance per value |
| `espiralab/cases/` | The case registry: each case has a category, a reason, an expectation, and a switching-time variant sweep of six values |
| `espiralab/bake/__init__.py` | The per-case bake: analytic optimal pulse and cost curve, the universal floor with its damping band, the free-macrospin reference, a static baseline, and for CrSBr the numerical biaxial optimum |
| `espiralab/bake/novel.py` | The reliability front (R12) and the two-mode lattice comparison |
| `espiralab/bake/penalty_test.py` | Does the deterministic instability penalty predict the Monte-Carlo success rate: the grid, the verdict, and which of the two predictors ranks it |
| `espiralab/bake/hard_axis.py` | Where a hard axis reduces the cost: ratio x damping x switching time, each cell against the numerical control; parallel and checkpointed |
| `espiralab/bake/pareto.py` | The device trade-off front (R14) per material: switching time, cost, peak field and spectral width, with the fitted exchange rates |
| `espiralab/bake/parity.py` | The live-lane parity fixture: K(m) from SciPy and the closed-form protocol from spinoct, which the browser recomputes and the parity gate checks |
| `espiralab/bake/lattice_ocp.py` | The free chain optimal control crossover map: 61 chains, three starts each, the minimum-energy-path floor; parallel and checkpointed |
| `espiralab/bake/patch_ocp.py` | The two-dimensional patch sweep (C20, C21): 12 square patches at two anisotropy regimes, three starts each, the minimum-energy-path floor; parallel and checkpointed |
| `espiralab/core/` | The seeded generator, the Contract 2 manifest, and the measured live-versus-precompute gate |
| `espiralab/stages/` | The nine named stages, from `ingest` to `validate` |
| `espiralab/pipeline.py` | The orchestrator and its command line |
| `run.py` | Run the release sequence, or a single stage |
| `run_novel.py` | Bake the cross-case novel results |
| `run_lattice_ocp.py` | Bake (or resume) the crossover map |
| `run_patch_ocp.py` | Bake (or resume) the two-dimensional patch sweep |
| `run_hard_axis_map.py` | Bake (or resume) the hard-axis map |

## The release sequence

`python data-pipeline/run.py all` runs ingest, preprocess, dataset, features, train, infer, evaluate,
export and validate, and refuses to call a release canonical when validate finds a problem. See
[../docs/architecture/03_staged-pipeline.md](../docs/architecture/03_staged-pipeline.md).

## Run

```bash
./scripts/setup.sh                 # or scripts/setup.ps1
./scripts/precompute.sh            # python data-pipeline/run.py data/artifacts
python data-pipeline/run_lattice_ocp.py data/artifacts 28   # hours; set ESPIRA_CHECKPOINT_DIR first
python data-pipeline/run_patch_ocp.py data/artifacts 12     # hours; the 32 x 32 patches dominate
```

Tests never write `data/artifacts/`; the smoke test bakes into a temporary directory.
