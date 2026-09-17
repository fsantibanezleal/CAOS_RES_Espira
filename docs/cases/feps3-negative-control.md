# FePS3, negative control

Case `feps3-negative-control`, category `negative-control`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An Ising antiferromagnet where uniform ferromagnetic-macrospin reversal is not the relevant switching mode. Included to show the machinery's honest limit.

## What a domain expert should see

The macrospin optimal-control numbers are computed but flagged as not physically representative of the true antiferromagnetic switching; a number is not the same as a result.

## Material: FePS3

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | Ising antiferromagnet | | |
| Spin | 2 | | |
| Easy axis | out-of-plane (strong Ising) | | |
| Moment per site | 4 Bohr magnetons | derived | [10.1103/PhysRevB.94.214407](https://doi.org/10.1103/PhysRevB.94.214407) |
| Anisotropy per site (unit-vector convention) | 10.64 meV | derived | [10.1103/PhysRevB.94.214407](https://doi.org/10.1103/PhysRevB.94.214407) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.01 (range 0.005 to 0.02) | assumed | none |
| Ordering temperature | 118 K | measured | [10.1002/aelm.202100408](https://doi.org/10.1002/aelm.202100408) |

The negative control: an Ising antiferromagnet (Neel temperature 118 K) where uniform field-driven reversal of a single ferromagnetic macrospin is not the physical switching mode. The large single-ion anisotropy comes from inelastic neutron scattering (Lancon 2016) and is converted assuming the term -Delta (S^z)^2. Included so the product shows what the machinery says when its own assumptions fail.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching times, in units of the Larmor timescale tau0: 5, 20, 50.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/feps3-negative-control.json`.
