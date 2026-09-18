# Amplitude and slew-rate limited control

Case `grape-amplitude-slew` (C24), category E. Constrained and hybrid control. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

A driver has a maximum field and a maximum rate of change. The optimum under those two limits is what an engineer can actually ask for.

## What a domain expert should see

Below a critical amplitude cap the moment cannot be reversed in the given time at any cost, and the solver must report failure rather than a number. Above it the cost falls back onto the unconstrained optimum, because a cap that does not bind costs nothing. Measured 2026-09-17 on the reference macrospin at ten tau0, where the unconstrained optimum itself peaks at 0.63 anisotropy fields: no reversal at 0.3 or 0.4 per component, 1.08 times the optimum at 0.5, 1.008 at 0.6, and 1.003 from one upwards. The threshold sits between 0.4 and 0.5, and a cap binds per component, so the magnitude it allows is larger by the square root of two.

## Kill criterion

A reported reversal under a cap that cannot physically reverse the moment means the constraint is not being enforced. A cost BELOW the unconstrained optimum means the pulse did not finish the reversal, which is the failure the reversal threshold exists to catch.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Amplitude cap (K/mu): 0.3, 0.4, 0.5, 0.6, 1, 2.

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
