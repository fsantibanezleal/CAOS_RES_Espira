# scripts/, environment and bake orchestration

Every entry script ships as a `.sh` (macOS, Linux, Git Bash) and a `.ps1` (Windows PowerShell). All are
idempotent, detect `bin/python` versus `Scripts/python.exe`, and never use a global interpreter.
Versions live in the `requirements-*.txt` files, never here.

| Script | What it does |
|---|---|
| `setup.sh` / `setup.ps1` | Create `.venv-pipeline` (spinoct, numpy, scipy, pytest, ruff) and `.venv` (runtime lane) |
| `precompute.sh` / `precompute.ps1` | Bake the cases and `novel.json` into `data/artifacts/` (or a directory you pass) |
| `smoke.sh` / `smoke.ps1` | Check the committed artifacts, then run the tests (the bake smoke writes only to a temporary directory) |
| `dev.sh` / `dev.ps1` | Copy the artifacts into the frontend and start the Vite dev server (the dormant `app/` is skipped) |

The free chain crossover map and the two-dimensional patch sweep have their own entry points,
`python data-pipeline/run_lattice_ocp.py [output] [workers]` and `run_patch_ocp.py`, because they take hours;
set `ESPIRA_CHECKPOINT_DIR` to a large disk first.

`crosscheck_spirit.py` compares the engine's minimum-energy-path barrier with Spirit's geodesic
nudged elastic band on the same chain. Spirit is not a dependency: install it in a separate
environment, run the script by hand, and commit the result it writes to
`data/artifacts/external_crosscheck.json`. CI never installs it.

## Guards (run in CI, runnable locally)

| Script | What it enforces |
|---|---|
| `check_artifacts.py` | Contract 2 on disk: the index and the case files agree, every case has one pulse per variant, and every free chain ratio lies between its barrier floor and the uniform bound. Stdlib only |
| `check_template_residue.py` | No template residue in tracked files (the example pipeline, the SIR model, `EX0*` cases, placeholder text). ADR-0057 / ADR-0061 |
| `check_content_standards.py` | No em-dash and no pictographic emoji in tracked content. ADR-0067 |
