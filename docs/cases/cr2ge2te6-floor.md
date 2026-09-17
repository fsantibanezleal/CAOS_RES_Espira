# Cr2Ge2Te6, the low-damping floor

Case `cr2ge2te6-floor`, category `damping-extreme`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The record-low-damping member, which sets the best-case universal floor because that floor is linear in the damping.

## What a domain expert should see

The lowest universal floor of the family; a wide uncertainty band because the floor tracks the measured damping range directly.

## Material: Cr2Ge2Te6

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | semiconductor | | |
| Spin | 1.5 | | |
| Easy axis | out-of-plane c axis (weak) | | |
| Moment per site | 2.8 Bohr magnetons | measured | [10.1088/0953-8984/7/1/008](https://doi.org/10.1088/0953-8984/7/1/008) |
| Anisotropy per site (unit-vector convention) | 0.03411 meV | derived | [10.1103/PhysRevB.100.134437](https://doi.org/10.1103/PhysRevB.100.134437), [10.1088/0953-8984/7/1/008](https://doi.org/10.1088/0953-8984/7/1/008) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.0007 (range 0.0004 to 0.001) | measured | [10.1038/s41467-023-39529-8](https://doi.org/10.1038/s41467-023-39529-8) |
| Ordering temperature | 61 K | measured | [10.1088/0953-8984/7/1/008](https://doi.org/10.1088/0953-8984/7/1/008) |

The low-damping extreme: Gilbert damping 4 to 10 x 10^-4 measured by spin pumping (2023), which sets the lowest universal floor of the family. Anisotropy from ferromagnetic resonance at 2 K (Khan 2019) per Cr through the unit cell of Carteaux 1995, which also gives the neutron moment and the bulk Curie temperature.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/cr2ge2te6-floor.json`.
