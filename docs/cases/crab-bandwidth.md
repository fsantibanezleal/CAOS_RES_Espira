# Band-limited control, the price of realizability

Case `crab-bandwidth` (C23), category E. Constrained and hybrid control. Baked: committed artifacts, replayed by the web app.

Generated from the registry by `scripts/gen_case_docs.py`.

## Why it is in the matrix

An arbitrary-waveform optimum is not what an antenna emits. Restricting the pulse to a few harmonics prices what realizability costs.

## What a domain expert should see

The cost falls monotonically as the bandwidth grows and flattens out well above the unconstrained optimum: the gap that remains is the price of realizability. Measured 2026-09-17 on the reference macrospin at ten tau0, against the closed form: 2.15 at one harmonic, 1.39 at two, 1.23 at three, 1.16 at four, 1.15 at six and 1.14 at eight. The floor of about 14 per cent is the cost of a pulse that must be band limited and must vanish at both ends of the window.

## Kill criterion

A band-limited pulse cheaper than the unconstrained optimum would mean the unconstrained solver is stuck in a local minimum, or that the band-limited pulse did not finish the reversal and banked the saving. A cost that RISES with bandwidth is equally a failure: more harmonics is a strictly larger feasible set. That is what caught the engine's previous solver, which returned 2.2 times the optimum at two harmonics and 14 times at six.

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
