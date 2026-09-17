# Free macrospin, no anisotropy

Case `free-macrospin` (C01), category A. Exact oracles. Planned: declared and runnable, not yet computed.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

With no anisotropy the optimal cost has the closed form pi^2 (1 + alpha^2) / (gamma^2 T), the fastest possible reversal of a free moment. It is the simplest oracle in the ladder.

## What a domain expert should see

The numerical cost matches the closed form at every switching time, and falls as 1/T.

## Kill criterion

A numerical cost that differs from the closed form by more than a per cent at any switching time means the cost functional or the integrator is wrong.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Switching time (tau0): 2, 5, 10, 20, 50, 100.

## Design

| Field | Value |
|---|---|
| Methods | R05 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevLett.126.177206
