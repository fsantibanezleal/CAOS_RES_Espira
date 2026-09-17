# Fe3GaTe2, field-driven reversal

Case `fe3gate2-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The only above-room-temperature member of the family.

## What a domain expert should see

Uniaxial, room-temperature-relevant; the cost curve mirrors Fe3GeTe2 scaled by its anisotropy and moment.

## Material: Fe3GaTe2

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | itinerant metal | | |
| Spin | 1 | | |
| Easy axis | out-of-plane c axis | | |
| Moment per site | 1.82 Bohr magnetons | computed | [10.1021/acs.nanolett.4c01019](https://doi.org/10.1021/acs.nanolett.4c01019) |
| Anisotropy per site (unit-vector convention) | 0.31 meV | computed | [10.1021/acs.nanolett.4c01019](https://doi.org/10.1021/acs.nanolett.4c01019) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.01 (range 0.003 to 0.03) | assumed | none |
| Ordering temperature | 380 K | measured | [10.1038/s41467-022-32605-5](https://doi.org/10.1038/s41467-022-32605-5) |

The above-room-temperature member (350 to 380 K, Zhang 2022). Moment and anisotropy are first-principles values (Ruiz 2024); the measured room-temperature anisotropy is lower. Damping assumed and flagged.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/fe3gate2-field.json`.
