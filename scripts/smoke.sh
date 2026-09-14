#!/usr/bin/env bash
# Smoke: validate the committed artifacts (stdlib checker), then run the test suite, whose bake smoke
# writes only to a temporary directory.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=".venv-pipeline/bin/python"; [ -x "$PY" ] || PY=".venv-pipeline/Scripts/python.exe"
[ -x "$PY" ] || PY="${PYTHON:-python}"
"$PY" scripts/check_artifacts.py
"$PY" -m pytest
