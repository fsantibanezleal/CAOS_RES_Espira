#!/usr/bin/env bash
# Create both venvs and install the per-lane requirements. Idempotent. No global installs.
#   .venv-pipeline = the offline bake lane (spinoct, numpy, scipy) + dev tools (pytest, ruff)
#   .venv          = the runtime lane (static replay; stdlib checker + numpy)
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python}"

mkvenv() { [ -d "$1" ] || "$PY" -m venv "$1"; }
venvpy() { local p="$1/bin/python"; [ -x "$p" ] || p="$1/Scripts/python.exe"; echo "$p"; }

echo "[setup] .venv-pipeline (offline bake lane)"
mkvenv .venv-pipeline
VP="$(venvpy .venv-pipeline)"
"$VP" -m pip install --upgrade pip -q
"$VP" -m pip install -q -r requirements-precompute.txt -r requirements-dev.txt

echo "[setup] .venv (runtime lane)"
mkvenv .venv
VR="$(venvpy .venv)"
"$VR" -m pip install --upgrade pip -q
"$VR" -m pip install -q -r requirements.txt

echo "[setup] done. Next: ./scripts/precompute.sh, then ./scripts/smoke.sh, then ./scripts/dev.sh"
