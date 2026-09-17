# Amplitude and slew-rate limited control

Case `grape-amplitude-slew` (C24), category E. Constrained and hybrid control. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A driver has a maximum field and a maximum rate of change. The optimum under those two limits is what an engineer can actually ask for.

## What a domain expert should see

Below a critical amplitude cap the moment cannot be reversed in the given time at any cost, and the solver must report failure rather than a number.

## Kill criterion

A reported reversal under a cap that cannot physically reverse the moment means the constraint is not being enforced.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Amplitude cap (K/mu): 0.5, 1, 1.5, 2, 3, 5.

## Design

| Field | Value |
|---|---|
| Methods | R08, R05 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
