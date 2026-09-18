# A two-dimensional patch, where uniform rotation stops being optimal

Case `patch-crossover` (C20), category D. Beyond the macrospin. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A chain is one dimension; a real element is a patch. The chain's question (C19) asked on a square W x W patch with nearest-neighbour exchange, at the chain map's J/K = 10 (a wall about 2.2 sites wide), alpha = 0.5 and T = 160 tau0, where the chain answer is clearest. Material-free: the result is in sites and wall widths, because no material in the database has its exchange and anisotropy measured together.

## What a domain expert should see

Declared before the bake: the barrier argument carries over with a two-dimensional wall, so the crossover moves to a different length scale. Measured 2026-09-18: the smallest patch (W = 4, under two wall widths) reverses uniformly, and a non-uniform reversal is cheaper from W = 8 on, at 0.9575, 0.7130 and 0.5738 of the uniform cost at W = 8, 12 and 16, against floors of 0.8089, 0.6055 and 0.4615. The patch crossover sits at the chain's length scale in wall widths.

## Kill criterion

A cost below the minimum-energy-path floor, a cost above the uniform bound, or a floor taken from an unconverged path: any of them means the solver, the floor or the two-dimensional lattice energy is wrong.

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
