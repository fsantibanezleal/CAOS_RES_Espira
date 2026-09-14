# The canonical bake of the cases and novel.json into data/artifacts (or a directory given as the first
# argument). The free chain crossover map is a separate, hours-long bake: data-pipeline/run_lattice_ocp.py.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$vp = Join-Path ".venv-pipeline" "Scripts\python.exe"
if (-not (Test-Path $vp)) { $vp = Join-Path ".venv-pipeline" "bin/python" }
if (-not (Test-Path $vp)) { $vp = if ($env:PYTHON) { $env:PYTHON } else { "python" } }
$out = if ($args.Count -gt 0) { $args[0] } else { "data/artifacts" }
& $vp data-pipeline/run.py $out
