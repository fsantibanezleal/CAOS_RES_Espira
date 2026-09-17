# Free macrospin, no anisotropy

Case `free-macrospin` (C01), category A. Exact oracles. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A moment with no magnetic potential costs pi^2 (1 + alpha^2) / (gamma^2 T) to reverse, the fastest possible reversal and the reference every material is scored against. The free limit is reached by making the switching time short compared with the Larmor time tau0 rather than by setting the anisotropy to zero, which the engine refuses because tau0 would be undefined: below tau0 the anisotropy has no time to act, and both solvers must return the free cost.

## What a domain expert should see

Both the closed-form uniaxial optimum and the numerical image-based solver return the free-moment cost, and it falls as 1/T. Measured 2026-09-17: the deviation from the closed form is below one part in a million up to 0.2 tau0 and is 1.5e-4 at one tau0, where the anisotropy starts to be felt, so the approach to the free limit is visible along the sweep rather than assumed.

## Kill criterion

A numerical cost that differs from the closed form by more than a per cent at any switching time means the cost functional or the integrator is wrong. A cost BELOW the free value would be worse: no uniaxial magnet can beat it.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Switching time (tau0): 0.02, 0.05, 0.1, 0.2, 0.5, 1.

## Design

| Field | Value |
|---|---|
| Methods | R05, R07 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

- https://doi.org/10.1103/PhysRevLett.126.177206
