# Fe3GaTe2, field-driven reversal

Case `fe3gate2-field`, category `real-material-field`. Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The only above-room-temperature member of the family.

## What a domain expert should see

Uniaxial, room-temperature-relevant; the cost curve mirrors Fe3GeTe2 scaled by its anisotropy and moment.

## Material: Fe3GaTe2

| Parameter | Value |
|---|---|
| Family | itinerant metal |
| Spin | 1 |
| Moment per site | 1.82 Bohr magnetons |
| Anisotropy per site | 0.31 meV |
| Hard-axis ratio | 0 |
| Gilbert damping | 0.01 (range 0.003 to 0.03) |
| Ordering temperature | 380 K |
| Easy axis | out-of-plane c axis (strong perpendicular anisotropy) |

The only above-room-temperature member (bulk Tc about 380 K). Strong perpendicular anisotropy, MAE 0.31 meV/Fe (Ruiz 2024, DFT plus Wannier plus TB2J, cross-checked with SIESTA). Metallic, so spin-orbit-torque compatible.

Sources:

- https://doi.org/10.1021/acs.nanolett.4c01019

## Variants

Switching times, in units of the Larmor timescale tau0: 2, 5, 10, 20, 50, 100.

## What the bake computes

For every variant: the analytic optimal pulse, its trajectory on the sphere, and its cost against the
free-macrospin cost and the universal floor (with the band from the damping range). A static-field
baseline at the longest switching time. Numerical biaxial solve: No: the material is treated as uniaxial, where the analytic optimum is exact.

Artifact: `data/artifacts/fe3gate2-field.json`.
