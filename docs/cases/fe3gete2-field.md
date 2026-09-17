# Fe3GeTe2, field-driven reversal

Case `fe3gete2-field` (C12), category C. Real materials. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An itinerant metal with strong perpendicular anisotropy, cleanly uniaxial, and a spin-orbit-torque-compatible conductor.

## What a domain expert should see

Uniaxial: the analytic optimal control path applies and the cost cannot beat the free-macrospin floor.

## Kill criterion

A cost below the free-macrospin floor for a uniaxial material would mean the analytic solution is being applied outside its validity.

## Material: Fe3GeTe2

| Parameter | Value | Provenance | Source |
|---|---|---|---|
| Family | itinerant metal | | |
| Spin | 1 | | |
| Easy axis | out-of-plane c axis | | |
| Moment per site | 1.58 Bohr magnetons | measured | [10.1063/1.4961592](https://doi.org/10.1063/1.4961592) |
| Anisotropy per site (unit-vector convention) | 0.3551 meV | derived | [10.1063/1.4961592](https://doi.org/10.1063/1.4961592) |
| Hard-axis ratio | 0 | assumed | none |
| Gilbert damping | 0.01 (range 0.003 to 0.03) | assumed | none |
| Ordering temperature | 130 K | measured | [10.1038/s41563-018-0149-7](https://doi.org/10.1038/s41563-018-0149-7) |

Itinerant ferromagnet with strong perpendicular anisotropy. Moment and anisotropy measured on bulk Fe2.87GeTe2 crystals at 5 K (Leon-Brito 2016); ordering temperature of the monolayer (Fei 2018). No measured damping was found; it is assumed and flagged.

Every value enters through Contract 1 (`data/materials/parameters.csv`); the conversion from the published
unit and each value's note are in that table. Assumed values are not measurements.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R00, R05 |
| Ground truth | provisional |
| Split | train |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
