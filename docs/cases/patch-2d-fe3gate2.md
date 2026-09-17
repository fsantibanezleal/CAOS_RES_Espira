# A two-dimensional Fe3GaTe2 patch, perpendicular anisotropy

Case `patch-2d-fe3gate2` (C21), category D. Beyond the macrospin. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The perpendicular-anisotropy metal in two dimensions, the geometry closest to a magnetic memory cell.

## What a domain expert should see

Strong perpendicular anisotropy narrows the wall, which pushes the crossover to larger patches than the weakly anisotropic case.

## Kill criterion

A wall width that does not follow the square root of the exchange over the anisotropy would mean the energetics are wrong.

## System

Declared without a system: the case is not computed yet, and its system is chosen when it is.

## Variants

Patch width (sites): 4, 8, 12, 16, 24, 32.

## Design

| Field | Value |
|---|---|
| Methods | R16 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
