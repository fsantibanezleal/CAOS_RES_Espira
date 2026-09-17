# CrI3, field-driven reversal

Case `cri3-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The archetypal two-dimensional magnet and the clean strong-uniaxial extreme.

## What a domain expert should see

Large anisotropy: a fast, high-amplitude optimal pulse; the analytic solution is exact.

## Material: CrI3

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | semiconductor | | |
| Spin | 1.5 | | |
| Easy axis | out-of-plane (Ising-like) | | |
| Moment per site | 3 Bohr magnetons | derived | [10.1103/PhysRevX.8.041028](https://doi.org/10.1103/PhysRevX.8.041028) |
| Anisotropy per site (unit-vector convention) | 0.495 meV | measured | [10.1103/PhysRevX.8.041028](https://doi.org/10.1103/PhysRevX.8.041028) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.01 (range 0.005 to 0.02) | assumed | none |
| Ordering temperature | 45 K | measured | [10.1038/nature22391](https://doi.org/10.1038/nature22391) |

The archetypal two-dimensional magnet. Easy-axis single-ion anisotropy from inelastic neutron scattering (Chen 2018, D_z on spin operators, converted to the per-site unit-vector form); monolayer ordering temperature from Huang 2017. Damping assumed and flagged.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/cri3-field.json`.
