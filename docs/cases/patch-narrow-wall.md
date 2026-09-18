# A two-dimensional patch with a narrow wall

Case `patch-narrow-wall` (C21), category D. Beyond the macrospin. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Stronger anisotropy is what a memory cell wants for retention, and it narrows the wall. The patch sweep of C20 repeated at J/K = 2.5 (a wall about 1.1 sites wide, half as wide), with the same damping and switching time, asks how that moves the crossover. Material-free, as C20.

## What a domain expert should see

Declared before the bake: the narrower wall pushes the crossover to larger patches than the weakly anisotropic case. Refuted by the measurement of 2026-09-18: a non-uniform reversal is already cheaper on the smallest patch (0.9412 of the uniform cost at W = 4, where J/K = 10 reverses uniformly), and 0.5653, 0.4933 and 0.5440 at W = 8, 12 and 16. The crossover tracks the wall width, so a narrower wall moves it to smaller patches. At fixed switching time the upper bound rises from W = 12 to W = 16 while the floor keeps falling (0.3150 to 0.2461), so the true optimum is only bracketed there.

## Kill criterion

The same bounds as C20; and the declared expectation is falsified if the smallest side at which a non-uniform reversal wins is not larger at J/K = 2.5 than at J/K = 10, which is what the measurement found.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.5 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Patch side (sites): 4, 8, 12, 16, 24, 32.

## Design

| Field | Value |
|---|---|
| Methods | R07, R16 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | experiments |

## Sources

- https://doi.org/10.1103/PhysRevB.107.214448
- https://doi.org/10.1016/j.cpc.2015.07.001
