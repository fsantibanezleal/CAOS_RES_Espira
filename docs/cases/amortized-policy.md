# The amortized policy on held-out materials

Case `amortized-policy` (C26), category F. Screening and learned. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

Every solver here re-optimizes from scratch. A policy that emits a near-optimal pulse instantly is the useful object, and the uniaxial optimum is known, so its claim is checkable.

## What a domain expert should see

Inside the damping range it was trained over (the van der Waals family, 3e-4 to 4e-2), the emitted pulse reverses the moment and costs within about ten per cent of the analytic optimum, including at the held-out materials' dampings. Outside that range it degrades and then fails: measured 2026-09-17, 1.11 times the optimum at a damping of 0.05, 1.86 at 0.1, and no reversal at all at 0.2 and above. The sweep is deliberately wider than the training range so the limit of amortization is visible rather than implied.

## Kill criterion

A policy that cannot reach the analytic optimum INSIDE its training range, where the optimum is known, has no business being trusted anywhere else; that is the pre-declared acceptance gate, and it is what the model registry records. Failing outside the range is not a kill, but presenting those numbers without saying the pulse did not switch would be.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Damping (alpha): 0.005, 0.01, 0.05, 0.1, 0.2, 0.5.

## Design

| Field | Value |
|---|---|
| Methods | R15, R05 |
| Ground truth | analytic |
| Split | test |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
