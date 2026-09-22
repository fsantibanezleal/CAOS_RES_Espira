# Espira

Optimal control of magnetization switching in two-dimensional van der Waals magnets: given a magnetic
bit and a target switching time, compute the field or current pulse that flips it for the least
dissipated energy, and say honestly how that compares to the protocols in use today.

Live: https://espira.fasl-work.com

## What this is

A CAOS research product built on the kickoff work of Badarneh, Cai and Santos, *Optimal Control Drives
Ultrafast and Energy-Efficient Magnetization Switching in Van der Waals Magnets*, Advanced Materials
e23059 (2026), [10.1002/adma.202523059](https://doi.org/10.1002/adma.202523059). Espira reproduces the
method's published results as a verification floor and extends them: the analytic optimal control
paths, the numerical image-based solver for the biaxial case, the conventional baselines, and the
constrained pulse-shaping solvers.

The scientific engine is a separate, open-source (MIT) Python package,
[spinoct](https://github.com/fsantibanezleal/CAOS_SpinOCT), consumed as a dependency. This repository
holds the domain layer: the curated material parameter database, the case matrix, the canonical bake,
and the companion web app.

## Manuscript

1. The Cost of Reliability in Optimal Magnetization Switching: A Longitudinal-Field Front for Van der
Waals Magnets. Preprint, 2026, CC-BY, version 4, version DOI
[10.5281/zenodo.22902338](https://doi.org/10.5281/zenodo.22902338), concept DOI
[10.5281/zenodo.22736005](https://doi.org/10.5281/zenodo.22736005). Source under
`manuscripts/reliability-realizability/`.

2. Domain Walls Become the Optimal Reversal of a Spin Chain: Free Optimal Control Beyond the Macrospin
and an Energy-Barrier Floor on the Switching Cost. Preprint, 2026, CC-BY, version 3, version DOI
[10.5281/zenodo.22822159](https://doi.org/10.5281/zenodo.22822159), concept DOI
[10.5281/zenodo.22736065](https://doi.org/10.5281/zenodo.22736065). Source and the table generator under
`manuscripts/beyond-macrospin/`.

## Honesty

- The switching cost is an integral in tesla-squared-seconds, not an energy. It becomes joules only
  through an explicit circuit model.
- There is no public experimental dataset of shaped-pulse switching in these materials. The real data
  is the set of spin-Hamiltonian parameters, each with a DOI, a method, and an uncertainty.
- The universal energy floor is linear in the Gilbert damping, the least well pinned parameter, so
  every energy is reported as a band, not a single number.
- The reduction factor is quoted against the strongest baseline available, never the weakest.
- FePS3 is a negative control: its macrospin numbers are computed but flagged as not representative of
  the true antiferromagnetic switching mode.

## Layout

```
data-pipeline/espiralab/   the offline pipeline: materials, cases, bake (drives spinoct)
data/artifacts/            the committed canonical JSON artifacts the web replays
frontend/                  the six-page companion web app (React, the shared CAOS shell)
docs/                      the internal wiki
```

## Run it

```bash
# bake the canonical artifacts (needs spinoct installed)
python -m venv .venv && .venv/Scripts/pip install -e ../CAOS_SpinOCT
.venv/Scripts/python data-pipeline/run.py

# build the web app
cd frontend && npm install && npm run build
```

## License

MIT. The engine (spinoct) is MIT. The atomistic verification engine VAMPIRE is GPL-2.0 and is called
as a separate process, never linked.
