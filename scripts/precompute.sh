#!/usr/bin/env bash
# The canonical bake of the cases and novel.json into data/artifacts (or a directory given as $1).
# The free chain crossover map is a separate, hours-long bake: data-pipeline/run_lattice_ocp.py.
set -euo pipefail
cd "$(dirname "$0")/.."
VP=".venv-pipeline/bin/python"; [ -x "$VP" ] || VP=".venv-pipeline/Scripts/python.exe"
[ -x "$VP" ] || VP="${PYTHON:-python}"
"$VP" data-pipeline/run.py "${1:-data/artifacts}"
