#!/usr/bin/env bash
# The canonical release sequence (ingest to validate) into data/artifacts and manifests.
# The free chain crossover map is a separate, hours-long bake: data-pipeline/run_lattice_ocp.py.
set -euo pipefail
cd "$(dirname "$0")/.."
VP=".venv-pipeline/bin/python"; [ -x "$VP" ] || VP=".venv-pipeline/Scripts/python.exe"
[ -x "$VP" ] || VP="${PYTHON:-python}"
"$VP" data-pipeline/run.py all "${1:-data/artifacts}" "${2:-manifests}"
