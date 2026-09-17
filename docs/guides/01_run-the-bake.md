# Guide, run the bake

## 1. Set up

```bash
./scripts/setup.sh          # Windows: ./scripts/setup.ps1
```

This creates `.venv-pipeline` (spinoct, numpy, scipy, pytest, ruff) and `.venv` (the runtime lane). No
global Python is touched.

## 2. Bake the cases

```bash
./scripts/precompute.sh     # python data-pipeline/run.py all data/artifacts manifests
```

This is the whole release sequence: the parameters through Contract 1, the split, the learned policy
trained on the training materials, every declared method over every variant, the scores, the artifacts
and their manifests, and the validation gate. It takes a few minutes, most of it the numerical solves.
Single stages run alone for inspection: `python data-pipeline/run.py ingest`, `dataset`, `train`,
`validate`. The cross-case novel results have their own entry point: `python data-pipeline/run_novel.py`.

## 3. Bake the free chain crossover map (hours)

```bash
export ESPIRA_CHECKPOINT_DIR=/path/on/a/large/disk        # PowerShell: $env:ESPIRA_CHECKPOINT_DIR = 'E:\_Temp\espira\lattice_ocp_ckpt'
.venv-pipeline/bin/python data-pipeline/run_lattice_ocp.py data/artifacts 28   # 28 worker processes
```

Each of the 61 chains is solved from three starts and checkpointed as it finishes. Interrupt it at any
time; rerunning resumes from the checkpoints. When all cases exist, the script checks that every declared
case shipped and writes `data/artifacts/lattice_ocp.json`. To regenerate the manuscript tables from it:
`python manuscripts/beyond-macrospin/make_tables.py`.

## 4. Check

```bash
./scripts/smoke.sh          # artifact checker, then the test suite
```

The checker fails if the index and the case files disagree, a case has a pulse missing for a variant, or
any free chain ratio falls outside its floor and the uniform bound. The tests include a sandboxed bake of
one case compared against the committed artifact within a relative tolerance of 1e-6.

## 5. Serve locally

```bash
./scripts/dev.sh            # copies data/artifacts into the frontend and starts Vite
```

Commit `data/artifacts/` only when the science changed, with a CHANGELOG entry and a version bump; the
deploy replays whatever is committed.
