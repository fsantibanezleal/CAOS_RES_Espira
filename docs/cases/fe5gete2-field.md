# Fe5GeTe2, the near-room-temperature metal

Case `fe5gete2-field` (C16), category C. Real materials. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A metallic member whose ordering temperature is near room temperature with a weaker perpendicular anisotropy, which moves it to a different corner of the parameter space.

## What a domain expert should see

A lower anisotropy than Fe3GeTe2 gives a lower floor and a longer natural timescale.

## Kill criterion

Parameters that cannot be traced to a primary source must not enter; a case without provenance is not a case.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R00, R05 |
| Ground truth | provisional |
| Split | test |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
