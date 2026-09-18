# Field together with current, the hybrid cost

Case `field-plus-current` (C25), category E. Constrained and hybrid control. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The kickoff paper names hybridization with current- and light-driven approaches as the open design space. The two-term cost prices the trade directly.

## What a domain expert should see

As the relative price of current falls, the optimum shifts from field-dominated to current-dominated. Measured 2026-09-17 on the reference macrospin at ten tau0 with a spin-orbit-torque coupling of 0.05 on both the field-like and damping-like channels: the share of the weighted cost carried by the field falls from 0.96 at a price of 0.1 to 0.72 at 0.01, 0.21 at 0.001 and 0.11 at 0.0001, and the field cost itself drops to 0.4 per cent of the field-only optimum, which is the current doing the work, so the crossover is inside that window and the originally declared sweep (0.1 to 30) sat entirely on the field-dominated side. The quantity plotted is the FIELD cost, which is comparable with every other case; the weighted cost mixes two units and is meaningful only at a fixed price.

## Kill criterion

A hybrid that beats both pure protocols at every price would be too good: it would mean the two cost terms are not being weighed consistently.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Current price (C_j / C_b): 0.0001, 0.001, 0.01, 0.1, 1, 10.

## Design

| Field | Value |
|---|---|
| Methods | R13 |
| Ground truth | provisional |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1002/adma.202523059
