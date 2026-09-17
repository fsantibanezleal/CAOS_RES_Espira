# The spin chain, where uniform rotation stops being optimal

Case `chain-crossover` (C19), category D. Beyond the macrospin. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The open question the method's authors state in print: under what conditions nonuniform reversal becomes the energy-efficient mechanism.

## What a domain expert should see

Short chains and short switching times reverse uniformly; above a crossover length and at long switching time a domain wall is cheaper, bounded below by the barrier floor.

## Kill criterion

A cost below the minimum-energy-path floor would falsify either the floor derivation or the solver; a cost above the uniform bound would mean the search is broken.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.5 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Chain length (sites): 4, 6, 8, 10, 12, 16, 20, 24, 32.

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
- https://doi.org/10.17586/2220-8054-2020-11-3-294-300
