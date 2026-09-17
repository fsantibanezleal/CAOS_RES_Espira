# Fe3GaTe2, field-driven reversal

Case `fe3gate2-field` (C13), category C. Real materials. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The only above-room-temperature member of the family, so the only one whose numbers matter for a device that runs on a desk.

## What a domain expert should see

Uniaxial, room-temperature-relevant; the cost curve mirrors Fe3GeTe2 scaled by its anisotropy and moment.

## Kill criterion

A cost curve that does not scale with the anisotropy and moment as the analytic solution predicts would mean the parameter canonicalization is wrong.

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
