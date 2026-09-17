# Band-limited control, the price of realizability

Case `crab-bandwidth` (C23), category E. Constrained and hybrid control. Blocked: something outside this repository is missing.

**What is missing.** The engine's band-limited solver optimizes with Nelder-Mead, which does not converge at this parameter count: measured 2026-09-17, 90 to 230 seconds per solve and a cost 2.2 times the analytic optimum at two harmonics rising to 14 times at six, where more harmonics should cost less. Baking it would ship optimizer artifacts as a price of realizability. Needs the engine's constrained solvers on a gradient method (programme backlog BL-036).

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An arbitrary-waveform optimum is not what an antenna emits. Restricting the pulse to a few harmonics prices what realizability costs.

## What a domain expert should see

The cost rises as the bandwidth falls, gently at first and then sharply once the pulse can no longer follow the precession.

## Kill criterion

A band-limited pulse cheaper than the unconstrained optimum would mean the unconstrained solver is stuck in a local minimum.

## System: a synthetic reference macrospin

This case tests mathematics, not a material, so it pins no parameter row. The reference system is a
moment of 3 Bohr magnetons with an easy-axis anisotropy of 0.15 meV per
site, a Gilbert damping of 0.1 and a hard-axis ratio of 0: the scale of the
van der Waals family, so the oracle is comparable with the real cases. These values are definitional.

## Variants

Harmonics (count): 1, 2, 3, 4, 6, 8.

## Design

| Field | Value |
|---|---|
| Methods | R09, R05 |
| Ground truth | analytic |
| Split | control |
| Seed | 0 |
| Surface | workbench |

## Sources

No external reference: the case is checked against the engine's own oracles.
