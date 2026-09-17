# FePS3, negative control

Case `feps3-negative-control` (C18), category C. Real materials. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An Ising antiferromagnet where uniform ferromagnetic-macrospin reversal is not the relevant switching mode. Included to show the machinery's honest limit.

## What a domain expert should see

The macrospin numbers are computed and shown with an explicit banner: they are what the machinery returns when its own assumptions fail, not predictions.

## Kill criterion

Presenting these numbers without that warning anywhere they appear would make the product dishonest, which is the failure this case guards against.

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

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R00, R05 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
