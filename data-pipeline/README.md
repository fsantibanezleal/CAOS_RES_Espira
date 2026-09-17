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
| `espiralab/bake/lattice_ocp.py` | The free chain optimal control crossover map: 61 chains, three starts each, the minimum-energy-path floor; parallel and checkpointed |
| `run.py` | Bake the cases and `novel.json` |
| `run_lattice_ocp.py` | Bake (or resume) the crossover map |

## Moving onto the staged base

ADR-0057 and ADR-0069 require the named stages `ingest -> preprocess -> dataset -> features -> train ->
infer -> evaluate -> export -> validate`, the two data contracts, a measured lane gate, manifests with
completeness counts, and the 26-case registry of the validated plan. The current modules implement the
science; `ingest` and `preprocess` exist, the remaining stages do not. The rebuild order (units U3 to U4) is recorded in the CAOS programme plan;
until it lands, this README describes the code as it is.

## Run

```bash
./scripts/setup.sh                 # or scripts/setup.ps1
./scripts/precompute.sh            # python data-pipeline/run.py data/artifacts
python data-pipeline/run_lattice_ocp.py data/artifacts 28   # hours; set ESPIRA_CHECKPOINT_DIR first
```

Tests never write `data/artifacts/`; the smoke test bakes into a temporary directory.
