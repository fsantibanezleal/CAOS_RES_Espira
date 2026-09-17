# Field together with current, the hybrid cost

Case `field-plus-current` (C25), category E. Constrained and hybrid control. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

The kickoff paper names hybridization with current- and light-driven approaches as the open design space. The two-term cost prices the trade directly.

## What a domain expert should see

As the relative price of current falls, the optimum shifts from field-dominated to current-dominated; whether the mixture ever beats both pure protocols is the open question.

## Kill criterion

A hybrid that beats both pure protocols at every price would be too good: it would mean the two cost terms are not being weighed consistently.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Current price (C_j / C_b): 0.1, 0.3, 1, 3, 10, 30.

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
