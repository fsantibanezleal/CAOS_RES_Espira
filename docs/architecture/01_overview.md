# Architecture, overview

## Two repositories

| Repository | Role | Distribution |
|---|---|---|
| [CAOS_SpinOCT](https://github.com/fsantibanezleal/CAOS_SpinOCT) | The engine `spinoct`: units contract, Landau-Lifshitz-Gilbert dynamics, analytic optimal control (uniaxial, spin-orbit torque), the image-based numerical optimal control path, baselines, GRAPE and CRAB, the discrete adjoint, the stochastic thermostat and reliability front, the field-plus-current hybrid, the Pareto front, the amortized policy, the spin chain with its free optimal control path and minimum energy path | PyPI `spinoct`, MIT |
| CAOS_RES_Espira (this repository) | The product: the material parameter database, the case registry, the bakes that drive the engine, the committed artifacts, the web app, the manuscripts | GitHub Pages at https://espira.fasl-work.com, MIT |

The split follows the rule that a product declares no package of its own: anything reusable lives in
the engine, which the product pins (`data-pipeline/requirements.txt`).

## Lanes

| Lane | Where | State |
|---|---|---|
| Offline bake | `data-pipeline/` in `.venv-pipeline` | Active. Canonical truth |
| Replay | `frontend/` reading `data/artifacts/` | Active. Every page |
| Live (in-browser recompute) | none | Not implemented. The analytic uniaxial pulse is cheap enough to run in TypeScript; that needs a parity fixture against the engine (backlog BL-008) |
| API | `app/` | Dormant ([../../app/README.md](../../app/README.md)) |

## Data flow

```
published parameters (data/materials/*.csv, one row per value with unit, provenance, DOI)
        |  Contract 1: stages ingest (validate, reject with a reason, flag) and preprocess (canonical units)
        v
case registry (category, reason, expectation, six switching-time variants)
        |  espiralab/bake        drives spinoct
        v
data/artifacts/*.json   committed; checked by scripts/check_artifacts.py and the tests
        |  frontend/copy-data.mjs at build time
        v
the web app (six pages) replays them; the manuscripts' tables are generated from them
```

Three bakes produce the artifacts:

1. **Per-case** (`run.py`): for each material and each switching time, the analytic optimal pulse and
   trajectory, its cost against the free-macrospin cost and the universal floor with the damping band, a
   static-field baseline, and for CrSBr the numerical optimum with the hard axis.
2. **Novel results** (`run.py`): the longitudinal-field cost-reliability front (manuscript M1) and the
   two-mode lattice comparison.
3. **Free chain crossover map** (`run_lattice_ocp.py`): 61 chains solved over every site's trajectory from
   three starts, with the minimum-energy-path floor (manuscript M2 version 2). Parallel over cases and
   checkpointed, because it takes hours.
4. **Two-dimensional patch sweep** (`run_patch_ocp.py`): the same search on square patches of side 4 to 32 at two anisotropy regimes (cases C20 and C21), on the engine's `SpinPatch` lattice. Parallel and checkpointed.

## What is not yet on the staged base

All nine named stages of ADR-0057 and ADR-0069 are implemented
([03_staged-pipeline.md](03_staged-pipeline.md)), with Contract 1 on the way in
([02_data-contracts.md](02_data-contracts.md)), Contract 2 manifests with hashes and a measured lane
verdict on the way out, a model registry for the one learned method, and a completeness count that
refuses a release with a missing cell. The registry declares all 26 cases of the validated plan; 25 are
baked, none is blocked, and the coverage matrix in the app and the wiki shows all of them. The one left
planned is C16, Fe5GeTe2, because no source reports its perpendicular anisotropy, moment and damping in
one regime, and the case says so rather than borrowing numbers from three. The counts are read from
`data/artifacts/index.json` at build time; this paragraph states them only so the page reads on its
own, and a test holds it to the index.
