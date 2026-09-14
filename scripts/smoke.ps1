# Smoke: validate the committed artifacts (stdlib checker), then run the test suite, whose bake smoke
# writes only to a temporary directory.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$py = Join-Path ".venv-pipeline" "Scripts\python.exe"
if (-not (Test-Path $py)) { $py = Join-Path ".venv-pipeline" "bin/python" }
if (-not (Test-Path $py)) { $py = if ($env:PYTHON) { $env:PYTHON } else { "python" } }
& $py scripts/check_artifacts.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $py -m pytest
exit $LASTEXITCODE
